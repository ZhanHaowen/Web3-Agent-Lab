import {mkdir,readFile,writeFile,rename,readdir,lstat,realpath} from 'node:fs/promises';
import {join,resolve,relative,sep} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {listNetworks,getNetworkProfile} from './networks.mjs';
import {modelRecordRedactor,modelSamplingParameters,normalizeModelMetadata} from '../model/capture.mjs';

const TASK_IDS=['balance','transfer','approve','swap','swap_deposit'];
const PUBLIC_SYSTEM_PROMPT='You operate a Web3 research experiment on a public EVM testnet using dedicated test assets. Use only the supplied tools and the configured Lab contracts. State is continuous and cannot be reset. Inspect results, use human-readable token amounts exactly once, and never retry a pending or unknown payment. A separate checker judges chain state. Report only supported observations; do not claim success without evidence.';
const json=value=>JSON.stringify(value,(_key,v)=>typeof v==='bigint'?String(v):v,2)+'\n';
const now=()=>new Date().toISOString();
const safeId=id=>typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id);
const assets={'/testnet.html':['testnet.html','text/html'],'/testnet.js':['testnet.js','text/javascript'],'/testnet.css':['testnet.css','text/css']};
const errorCode=e=>{const message=String(e?.code??e?.message??e),match=message.match(/^([A-Z][A-Z0-9_]{2,100})(?::|$)/);return match?.[1]??'TESTNET_OPERATION_FAILED';};
function fields(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('REQUEST_OBJECT_REQUIRED');if(Object.keys(value).some(k=>!allowed.includes(k)))throw Error('UNSUPPORTED_REQUEST_FIELD');}
async function atomic(file,value){const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,json(value),{mode:0o600});await rename(temp,file);}
async function optional(file,fallback=null){try{if((await lstat(file)).isSymbolicLink())throw Error('BUNDLE_SYMLINK');return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw Error('BODY_LIMIT');chunks.push(chunk);}const value=JSON.parse(Buffer.concat(chunks).toString()||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('REQUEST_OBJECT_REQUIRED');return value;}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(json(value));}
const transactionHash=tx=>tx?.hash??tx?.txHash;
const unresolved=tx=>!['success','reverted','failed','not_submitted'].includes(tx?.status);
function mergeTransactions(records){const map=new Map();for(const tx of records){if(!tx||typeof tx!=='object')continue;const key=transactionHash(tx)??tx.intentId??tx.contractCallId;if(key)map.set(key,{...map.get(key),...tx});}return [...map.values()];}

/** Optional public-network service. Legacy local state and its data directory are untouched. */
export class TestnetService {
 constructor({root,data,port=4317,lib,modelResolver,captureRuntimeEvidence,runtimeEvidenceCursor,beforeChange,chainFactory}={}){
  this.root=resolve(root);this.data=join(resolve(data),'testnet');this.port=Number(port);this.lib=lib;
  this.modelResolver=modelResolver;this.captureRuntimeEvidence=captureRuntimeEvidence;this.runtimeEvidenceCursor=runtimeEvidenceCursor;this.beforeChange=beforeChange;
  this.chainFactory=chainFactory??(async options=>new (await import('./chain.mjs')).PublicEvmChain(options));
  this.token=randomBytes(32).toString('hex');this.redactor=new lib.Redactor();this.modelRedactor=modelRecordRedactor();
  this.chain=null;this.connected=false;this.ready=false;this.writable=false;this.manifest=null;this.chainState=null;this.active=null;this.operation=null;this.events=[];this.previousRunId=null;this.closing=false;this.initializing=null;
 }
 get busy(){return Boolean(this.operation);}
 clean(value){return this.redactor.clean(this.modelRedactor.clean(value));}
 addSecrets(input={}){this.redactor.add(input.privateKey,input.rpcUrl,input.apiKey,input.baseUrl);this.modelRedactor.add(input);}
 async init(){
  if(!this.initializing)this.initializing=(async()=>{
   for(const dir of ['runs','derived','states','deployments','runtime'])await mkdir(join(this.data,dir),{recursive:true});
   // A crash is not a successful cancellation. Preserve raw files; mark lifecycle only.
   for(const name of await readdir(join(this.data,'states'))){if(!/^[0-9a-f-]{36}\.json$/i.test(name))continue;const file=join(this.data,'states',name),state=await optional(file);if(state&&['starting','running','paused','cancelling'].includes(state.state))await atomic(file,{...state,state:'interrupted',status:'unknown',interruptedAt:now(),reason:'PROCESS_RESTART_READ_ONLY_RECONCILIATION_REQUIRED'});}
  })();
  return this.initializing;
 }
 async acquire(kind){
  if(this.closing)throw Error('PLATFORM_STOPPING');if(this.busy)throw Error('TESTNET_BUSY');
  await this.beforeChange?.();if(this.closing)throw Error('PLATFORM_STOPPING');if(this.busy)throw Error('TESTNET_BUSY');
  const operation={kind,promise:null};this.operation=operation;return operation;
 }
 release(operation){if(this.operation===operation)this.operation=null;}
 async exclusive(kind,fn){const operation=await this.acquire(kind);operation.promise=(async()=>{await this.init();return fn();})();try{return await operation.promise;}finally{this.release(operation);}}
 status(){return this.clean({connected:this.connected,ready:this.ready,writable:this.writable,busy:this.busy,operation:this.operation?.kind??null,environment:this.connected?this.chain?.env():null,chainState:this.chainState,active:this.active?{runId:this.active.runId,state:this.active.state,taskId:this.active.taskId,startedAt:this.active.startedAt,pause:this.active.pause??null,pauseRequested:Boolean(this.active.pauseRequested)}:null,events:this.events,previousRunId:this.previousRunId,executionMode:'continuous',resetSupported:false,dataDirectory:this.data});}
 async connect(input){
  fields(input,['profileId','rpcUrl','privateKey','accountAddress','recipient','confirmations','receiptTimeoutMs']);
  const profile=getNetworkProfile(input.profileId);if(!profile.writeEnabled)throw Error('TESTNET_CATALOG_ONLY');
  this.addSecrets(input);
  return this.exclusive('connect',async()=>{
   let account=input.accountAddress;
   if(input.privateKey){if(typeof input.privateKey!=='string'||!/^0x[0-9a-f]{64}$/i.test(input.privateKey))throw Error('INVALID_PRIVATE_KEY');const signer=this.lib.privateKeyToAccount(input.privateKey);if(account&&account.toLowerCase()!==signer.address.toLowerCase())throw Error('SIGNER_ACCOUNT_MISMATCH');account=signer.address;}
   if(!account||!/^0x[0-9a-f]{40}$/i.test(account))throw Error('ACCOUNT_ADDRESS_REQUIRED');
   const chain=await this.chainFactory({root:this.root,dataDir:join(this.data,'runtime',profile.id,account.toLowerCase()),profileId:profile.id,rpcUrl:input.rpcUrl||profile.rpcUrl,privateKey:input.privateKey,accountAddress:account,recipient:input.recipient,confirmations:input.confirmations,receiptTimeoutMs:input.receiptTimeoutMs,lib:this.lib});
   try{await chain.connect();if(this.closing)throw Error('PLATFORM_STOPPING');}catch(e){await chain.shutdown?.();throw e;}
   await this.chain?.shutdown?.();this.chain=chain;this.connected=true;this.ready=false;this.writable=Boolean(input.privateKey);this.manifest=null;this.chainState=null;this.previousRunId=null;this.events=[];
   return this.status();
  });
 }
 requireConnected(){if(!this.connected||!this.chain)throw Error('TESTNET_NOT_CONNECTED');}
 requireReady(){this.requireConnected();if(!this.ready)throw Error('TESTNET_DEPLOYMENT_REQUIRED');}
 async persistManifest(manifest){const value=this.clean(manifest);await atomic(join(this.data,'deployments',`${this.chain.env().chainId}-${this.chain.env().accounts.agent.toLowerCase()}.json`),value);this.manifest=value;return value;}
 async deploy(input={}){fields(input,[]);return this.exclusive('deploy',async()=>{
  this.requireConnected();if(!this.writable)throw Error('READ_ONLY_CONNECTION');
  const manifest=await this.chain.deploy({emit:async(type,payload)=>{this.events.push(this.clean({type,payload}));this.events=this.events.slice(-200);}});
  await this.persistManifest(manifest);this.ready=true;this.chainState=await this.chain.state();return {manifest:this.manifest,status:this.status()};
 });}
 async attach(input){fields(input,['manifest']);return this.exclusive('attach',async()=>{this.requireConnected();if(!input.manifest||typeof input.manifest!=='object'||Array.isArray(input.manifest))throw Error('MANIFEST_REQUIRED');await this.chain.attach(input.manifest);await this.persistManifest(this.chain.getManifest());this.ready=true;this.chainState=await this.chain.state();return this.status();});}
 async disconnect(input={}){fields(input,[]);return this.exclusive('disconnect',async()=>{await this.chain?.shutdown?.();this.chain=null;this.connected=false;this.ready=false;this.writable=false;this.chainState=null;this.manifest=null;return this.status();});}
 validateRun(input){
  fields(input,['taskId','mode','model','taskParameters','taskInput','allowedTools','toolOverrides','pauseBeforeTool','pauseBeforeTransaction','parentRunId']);
  if(!TASK_IDS.includes(input.taskId))throw Error('INVALID_TASK');if(!['scripted','llm'].includes(input.mode))throw Error('INVALID_MODE');
  if(input.taskInput!==undefined&&(typeof input.taskInput!=='string'||input.taskInput.length>32000))throw Error('INVALID_TASK_INPUT');
  const task=this.lib.resolveTask(input.taskId,{taskParameters:input.taskParameters,taskInput:input.taskInput});
  if(input.allowedTools!==undefined&&(!Array.isArray(input.allowedTools)||input.allowedTools.some(tool=>!task.allowedTools.includes(tool))||new Set(input.allowedTools).size!==input.allowedTools.length))throw Error('INVALID_TOOL_ALLOWLIST');
  if(input.toolOverrides!==undefined&&(!input.toolOverrides||typeof input.toolOverrides!=='object'||Array.isArray(input.toolOverrides)||Object.keys(input.toolOverrides).some(tool=>!task.allowedTools.includes(tool))))throw Error('INVALID_TOOL_OVERRIDES');
  for(const key of ['pauseBeforeTool','pauseBeforeTransaction'])if(input[key]!==undefined&&typeof input[key]!=='boolean')throw Error('INVALID_PAUSE_OPTION');
  if(input.parentRunId!==undefined&&!safeId(input.parentRunId))throw Error('INVALID_PARENT_RUN');
  if(input.mode==='llm'){
   const m=input.model;if(!m||typeof m!=='object'||Array.isArray(m))throw Error('MODEL_REQUIRED');normalizeModelMetadata(m);modelSamplingParameters(m);
   if(m.maxSteps!==undefined&&(!Number.isInteger(m.maxSteps)||m.maxSteps<1||m.maxSteps>100))throw Error('INVALID_MODEL_MAX_STEPS');
   if(m.requestTimeoutMs!==undefined&&(!Number.isInteger(m.requestTimeoutMs)||m.requestTimeoutMs<1000||m.requestTimeoutMs>600000))throw Error('INVALID_MODEL_TIMEOUT');
   if(m.systemPrompt!==undefined&&(typeof m.systemPrompt!=='string'||m.systemPrompt.length>64000))throw Error('INVALID_SYSTEM_PROMPT');
   if((m.provider??'api')==='api'){let url;try{url=new URL(m.baseUrl);}catch{throw Error('INVALID_MODEL_ENDPOINT');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('INVALID_MODEL_ENDPOINT');if(typeof m.model!=='string'||!m.model.trim())throw Error('MODEL_REQUIRED');}
  }
  return {...task,input:input.taskInput??task.input,allowedTools:input.allowedTools??task.allowedTools};
 }
 async runState(runId,state){await atomic(join(this.data,'states',runId+'.json'),this.clean(state));}
 async assertRun(id){
  if(!safeId(id))throw Error('INVALID_RUN_ID');const base=join(this.data,'runs'),dir=join(base,id);
  for(const file of [base,dir]){const s=await lstat(file);if(s.isSymbolicLink()||!s.isDirectory())throw Error('BUNDLE_SYMLINK');}
  const rel=relative(await realpath(base),await realpath(dir));if(rel.startsWith('..')||rel.includes(sep))throw Error('BUNDLE_PATH');
  const scan=async path=>{for(const e of await readdir(path,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('BUNDLE_SYMLINK');if(e.isDirectory())await scan(join(path,e.name));}};await scan(dir);
  const derived=join(this.data,'derived',id);try{if((await lstat(derived)).isSymbolicLink())throw Error('BUNDLE_SYMLINK');await scan(derived);}catch(e){if(e.code!=='ENOENT')throw e;}return dir;
 }
 async checkOutstanding(){
  // Unfinished runs are never retried as payments. Their records require read-only reconciliation.
  for(const name of await readdir(join(this.data,'states'))){if(!/^[0-9a-f-]{36}\.json$/i.test(name))continue;const state=await optional(join(this.data,'states',name));if(state?.chainId===this.chain.env().chainId&&state?.account?.toLowerCase()===this.chain.env().accounts.agent.toLowerCase()&&state.unresolved?.length)throw Error('UNRESOLVED_TRANSACTIONS_RECHECK_REQUIRED');}
 }
 async start(input){
  const task=this.validateRun(input);this.requireReady();if(task.id!=='balance'&&!this.writable)throw Error('READ_ONLY_CONNECTION');
  if(this.busy)throw Error('TESTNET_BUSY');if(this.closing)throw Error('PLATFORM_STOPPING');
  const expectedChain=this.chain,expectedDeployment=this.chain.env().deploymentId;this.addSecrets(input.model??{});
  let model=input.model??{},cursor=null;
  // The managed local backend may need a cold start. It uses the shared idle
  // guard itself, so resolve before taking our run lock and revalidate afterward.
  if(input.mode==='llm'){
   if(model.provider==='local')cursor=await this.runtimeEvidenceCursor?.();
   model=this.modelResolver?await this.modelResolver(model):model;this.addSecrets(model);
   if((model.provider??'api')!==(input.model.provider??'api'))throw Error('MODEL_BACKEND_CHANGED');
   model={maxSteps:16,...model,systemPrompt:model.systemPrompt??PUBLIC_SYSTEM_PROMPT};modelSamplingParameters(model);normalizeModelMetadata(model);
   if(model.provider==='local'&&(!model.localRuntime?.modelSha256||!model.localRuntime?.runtimeSha256||!this.captureRuntimeEvidence))throw Error('LOCAL_RUNTIME_EVIDENCE_REQUIRED');
  }
  const operation=await this.acquire('run');
  try{this.requireReady();if(this.chain!==expectedChain||this.chain.env().deploymentId!==expectedDeployment)throw Error('TESTNET_ENVIRONMENT_CHANGED_DURING_MODEL_START');await this.init();if(input.parentRunId)await this.assertRun(input.parentRunId);await this.checkOutstanding();if(this.chain.env().unresolved?.length)throw Error('UNRESOLVED_TRANSACTIONS_RECHECK_REQUIRED');}catch(e){this.release(operation);throw e;}
  const recorder=new this.lib.Recorder(this.data,{clean:value=>this.clean(value)}),abort=new AbortController();
  const active={runId:recorder.runId,state:'starting',taskId:task.id,startedAt:now(),pause:null,pauseRequested:false,abort,gate:null};this.active=active;this.events=[];
  operation.promise=this.executeRun({input,task,recorder,active,model,cursor}).finally(()=>{this.release(operation);if(this.active===active)this.active=null;});
  // Always retain a visible failure even if disk recording itself becomes unavailable.
  operation.promise.catch(e=>{this.persistenceError=this.clean(String(e?.message??e));});
  return {runId:recorder.runId,state:'starting'};
 }
 async gate(active,recorder,phase,detail,automatic=false){
  if(active.abort.signal.aborted)throw Error('RUN_CANCELLED');
  if(!automatic&&!active.pauseRequested)return;
  const pause=this.clean({phase,detail});let release;
  // Install the resolver before publishing "paused": the journal write can be
  // slow, and a GUI resume arriving during that write must not be lost.
  // Resolve (rather than reject) on cancellation to avoid an unhandled promise
  // rejection while the paused event is still being written.
  const waiting=new Promise(resolveGate=>{release=resolveGate;});
  const onAbort=()=>{if(active.gate===resume)active.gate=null;active.pause=null;active.state='cancelling';release();};
  const resume=()=>{if(active.abort.signal.aborted){onAbort();return;}if(active.gate===resume)active.gate=null;active.pause=null;active.state='running';release();};
  active.gate=resume;active.abort.signal.addEventListener('abort',onAbort,{once:true});active.state='paused';active.pause=pause;
  try{
   // Even an immediate resume must await durable pause/resume records before
   // returning control to tool execution or transaction submission.
   await recorder.emit('control.paused',{phase,detail});await waiting;
   if(active.abort.signal.aborted)throw Error('RUN_CANCELLED');
   await recorder.emit('control.resumed',{phase});if(active.abort.signal.aborted)throw Error('RUN_CANCELLED');
  }finally{
   active.abort.signal.removeEventListener('abort',onAbort);if(active.gate===resume)active.gate=null;active.pause=null;
   if(active.state==='paused')active.state=active.abort.signal.aborted?'cancelling':'running';release();
  }
 }
 async executeRun({input,task,recorder,active,model,cursor}){
  const chain=this.chain,started=performance.now(),baseState={runId:active.runId,taskId:task.id,startedAt:active.startedAt,chainId:chain.env().chainId,account:chain.env().accounts.agent,state:'starting',unresolved:[]};
  let before=null,after=null,agent=null,runError=null,verdict=null,opened=false,recordingStatus='complete';
  const config=this.clean({taskId:task.id,task,taskSpec:task,taskParameters:task.taskParameters,taskParameterSource:task.parameterSource,toolDefinitions:this.lib.toolDefinitions,mode:input.mode,model,modelSubmitted:input.model??{},taskInput:input.taskInput,allowedTools:task.allowedTools,toolOverrides:input.toolOverrides??{},pauseBeforeTool:input.pauseBeforeTool??false,pauseBeforeTransaction:input.pauseBeforeTransaction??false,environment:chain.env(),deploymentManifest:this.manifest,chain_execution:chain.env().chain_execution??'public_evm',experimentMode:'continuous',amountValidation:'fixed_task',createdAt:active.startedAt,parent_run_id:input.parentRunId??null,previous_run_id:this.previousRunId,data_origin:input.mode==='llm'?'llm':'scripted',build:await optional(join(this.root,'build-info.json')),rerun_policy:'new_run_from_current_public_chain_state; no reset; parent_run_id is provenance only',redaction:{policy:'known-secrets-and-sensitive-fields-v1'}});
  const emit=async(type,payload,links)=>{
   await recorder.emit(type,payload,links);this.events.push(this.clean({type,payload,links}));this.events=this.events.slice(-200);
   if(type.startsWith('tx.'))await this.runState(active.runId,{...baseState,state:active.state,unresolved:chain.transactions.filter(unresolved),transactions:chain.transactions});
  };
  try{
   await recorder.start(config);opened=true;await this.runState(active.runId,baseState);
   chain.beginRunCapture(active.runId);this.previousRunId=active.runId;
   if(this.closing||active.abort.signal.aborted)throw Error('RUN_CANCELLED');
   if(input.mode==='llm')await emit('model.backend.resolved',model);
   if(active.abort.signal.aborted)throw Error('RUN_CANCELLED');
   before=await chain.state();this.chainState=before;await emit('state.before',before);await emit('environment.manifest',{manifest:this.manifest,resetSupported:false});active.state='running';
   await this.runState(active.runId,{...baseState,state:'running'});
   agent=await this.lib.runAgent({mode:input.mode,task,taskInput:input.taskInput,model:{maxSteps:16,...model},taskParameters:task.taskParameters,toolDefinitions:this.lib.toolDefinitions,initialState:before,experimentMode:'continuous',amountValidation:'fixed_task',toolOverrides:input.toolOverrides??{},signal:active.abort.signal,emit,
    beforeTool:async(name,args,callId)=>this.gate(active,recorder,'before_tool',{name,args,callId},input.pauseBeforeTool),
    executeTool:async(name,args,context)=>{
     if(active.abort.signal.aborted)throw Error('RUN_CANCELLED');
     return chain.execute(name,args,{emit:(type,payload,links)=>emit(type,payload,{...context,...links}),beforeSubmit:descriptor=>this.gate(active,recorder,'before_transaction',{descriptor},input.pauseBeforeTransaction)});
    }});
   await emit('agent.finished',agent);
  }catch(e){runError=this.clean(String(e?.message??e));if(opened)try{await emit('run.error',{message:runError,cancelled:active.abort.signal.aborted});}catch{recordingStatus='incomplete';}}
  try{
   if(before){after=await chain.state();this.chainState=after;await emit('state.after',after);verdict=await chain.check(task.id,before,after,chain.transactions,agent?.final??'',{experimentMode:'continuous',taskParameters:task.taskParameters});await emit('check.evidence',verdict.evidence??{before,after,transactions:chain.transactions,observations:chain.observations??[],agentFinal:agent?.final??'',taskParameters:task.taskParameters});}
  }catch(e){verdict={status:'unknown',validationStatus:'evidence_missing',assertions:[],reason:this.clean(String(e?.message??e))};}
  const result=this.clean({...verdict,status:verdict?.status??'unknown',run_id:active.runId,taskId:task.id,experimentMode:'continuous',check_id:randomUUID(),checked_at:now(),check_mode:'live',evidence_source:'original_run',agent,run_error:runError??agent?.error??null,cancelled:active.abort.signal.aborted,costs:{...verdict?.costs,duration_ms:performance.now()-started,model_calls:agent?.modelCalls??null,token_usage:agent?.usage??null,tool_calls:agent?.toolCalls??null,transaction_scope:'current_run',missing_usage_reason:input.mode==='scripted'?'no_model_used':agent?.usage?.totalTokens==null?'provider_usage_incomplete':null},transactions:chain.transactions});
  try{
   if(opened&&input.mode==='llm'&&model.provider==='local'){
    const evidence=await this.captureRuntimeEvidence?.(model,cursor);if(!evidence)throw Error('LOCAL_RUNTIME_EVIDENCE_UNAVAILABLE');await emit('model.runtime_evidence',evidence);
   }
  }catch(e){result.status='unknown';result.runtime_evidence_error=this.clean(String(e?.message??e));if(opened)try{await emit('model.runtime_evidence_error',{error:result.runtime_evidence_error});}catch{recordingStatus='incomplete';}}
  try{if(opened){await emit('run.finished',{status:result.status,cancelled:result.cancelled,duration_ms:result.costs.duration_ms});await recorder.seal(recordingStatus);}else throw Error('RECORDING_NOT_STARTED');}catch(e){result.status='unknown';result.recording_error=this.clean(String(e?.message??e));}
  try{if(!result.recording_error)await this.lib.saveExecutionTrace(this.data,active.runId);}catch(e){result.trace_export_error=this.clean(String(e?.message??e));}
  if(this.lib.buildDiagnostics)result.diagnostics=this.lib.buildDiagnostics(result,await this.lib.readEvents(this.data,active.runId).catch(()=>[]));
  await this.lib.saveResult(this.data,active.runId,result);
  await this.runState(active.runId,{...baseState,state:result.cancelled?'cancelled':'finished',status:result.status,endedAt:now(),unresolved:chain.transactions.filter(unresolved),transactions:chain.transactions,recordingStatus:result.recording_error?'incomplete':recordingStatus});
  return result;
 }
 control(action,input={}){
  fields(input,['id','runId']);const active=this.active;if(!active||((input.id??input.runId)&&active.runId!==(input.id??input.runId)))throw Error('RUN_NOT_ACTIVE');
  if(action==='cancel'){active.state='cancelling';active.abort.abort();}
  else if(action==='pause'){active.pauseRequested=true;}
  else if(action==='resume'){if(!active.gate&&!active.pauseRequested)throw Error('RUN_NOT_PAUSED');active.pauseRequested=false;active.gate?.();}
  return {runId:active.runId,state:active.state,pauseRequested:active.pauseRequested};
 }
 async list(){await this.init();for(const entry of await readdir(join(this.data,'runs'),{withFileTypes:true}))if(safeId(entry.name))await this.assertRun(entry.name);const runs=await this.lib.listRuns(this.data);for(const row of runs)row.lifecycle=await optional(join(this.data,'states',row.runId+'.json'));return {runs,active:this.active?.runId??null};}
 async readRun(id){await this.init();await this.assertRun(id);const run=await this.lib.readRun(this.data,id);run.lifecycle=await optional(join(this.data,'states',id+'.json'));if(run.manifest&&this.lib.readExecutionTrace){const built=await this.lib.readExecutionTrace(this.data,id);run.execution_trace=built.trace;run.provenance_graph=built.graph;}return run;}
 async export(id){await this.assertRun(id);if(this.active?.runId===id)throw Error('RUN_NOT_SEALED');return this.lib.exportRun(this.data,id);}
 async verify(input){fields(input,['id']);await this.assertRun(input.id);return this.lib.verifyRun(this.data,input.id);}
 async checkOffline(input){fields(input,['id']);return this.exclusive('offline-check',async()=>{
  const id=input.id,run=await this.readRun(id),verification=await this.lib.verifyRun(this.data,id);if(!verification.valid)throw Error('OFFLINE_CHECK_REQUIRES_VERIFIED_RECORDING');
  const evidence=[...run.events].reverse().find(e=>e.type==='check.evidence')?.payload;if(!evidence?.before||!evidence?.after||!Array.isArray(evidence.transactions))throw Error('OFFLINE_CHECK_EVIDENCE_MISSING');
  const verdict=this.lib.checkTask(run.config.taskId,evidence.before,evidence.after,evidence.transactions,evidence.agentFinal??'',evidence.observations??[],{...evidence.options,experimentMode:'continuous',taskParameters:run.config.taskParameters,expectedChainId:run.config.environment.chainId,balanceQueryPolicy:'observed_block'});
  const result=this.clean({...verdict,costs:{...verdict.costs,executionGasOnly:true,gasCostScope:'gasUsed * effectiveGasPrice; excludes chain-specific L1 data fees and additional network fees',additionalNetworkFees:'not_normalized; retain provider receipt fields for separate analysis'},run_id:id,taskId:run.config.taskId,check_id:randomUUID(),checked_at:now(),check_mode:'offline',evidence_source:'verified_saved_raw',agent:run.result?.agent??null,cancelled:run.result?.cancelled??false,run_error:run.result?.run_error??null,notice:'Recomputed original captured evidence only. No RPC, model call, signature or transaction submission.'});await this.lib.saveResult(this.data,id,result);return result;
 });}
 async recheck(input){fields(input,['id']);return this.exclusive('recheck',async()=>{
  this.requireReady();const id=input.id,run=await this.readRun(id);const env=this.chain.env();
  if(run.config.environment?.chainId!==env.chainId||run.config.environment?.accounts?.agent?.toLowerCase()!==env.accounts.agent.toLowerCase()||json(run.config.environment?.contracts)!==json(env.contracts))throw Error('RECHECK_ENVIRONMENT_MISMATCH');
  const evidence=[...run.events].reverse().find(e=>e.type==='check.evidence')?.payload;
  const before=evidence?.before??run.events.find(e=>e.type==='state.before')?.payload;if(!before)throw Error('RECHECK_BASELINE_MISSING');
  const captured=mergeTransactions([...(run.lifecycle?.transactions??[]),...(run.result?.transactions??[]),...(evidence?.transactions??[]),...run.events.filter(e=>['tx.intent','tx.broadcast','tx.status','tx.receipt','tx.confirmed','tx.error'].includes(e.type)).map(e=>e.payload)]);
  const transactions=await Promise.all(captured.map(async tx=>transactionHash(tx)?{...tx,...await this.chain.inspectTransaction(transactionHash(tx))}:tx));
  await this.chain.reconcile?.(transactions);const after=await this.chain.state();
  const observations=evidence?.observations??run.events.filter(e=>e.type==='tool.result'&&e.payload?.name==='get_balance'&&!e.payload?.error).map(e=>e.payload.raw??e.payload.result);
  const oldObservations=this.chain.observations;this.chain.observations=observations.filter(Boolean);
  let verdict;try{verdict=await this.chain.check(run.config.taskId,before,after,transactions,run.result?.agent?.final??'',{experimentMode:'continuous',taskParameters:run.config.taskParameters});}finally{this.chain.observations=oldObservations;}
  const result=this.clean({...verdict,run_id:id,taskId:run.config.taskId,agent:run.result?.agent??null,cancelled:run.result?.cancelled??false,run_error:run.result?.run_error??null,check_id:randomUUID(),checked_at:now(),check_mode:'read_only_live_reconciliation',evidence_source:'saved_raw_plus_current_rpc',transactions,prior_check_id:run.result?.check_id??null,notice:'No transaction signed, broadcast, retried or replayed. Public state may have changed after the original run.'});
  await this.lib.saveResult(this.data,id,result);await this.runState(id,{...run.lifecycle,runId:id,state:run.lifecycle?.state==='interrupted'?'reconciled':run.lifecycle?.state??'finished',status:result.status,recheckedAt:now(),transactions,unresolved:transactions.filter(unresolved)});this.chainState=after;return result;
 });}
 async handle(req,res,path){
  if(!assets[path]&&!path.startsWith('/api/testnet/'))return false;
  try{
   const origins=[`http://127.0.0.1:${this.port}`,`http://localhost:${this.port}`];
   if(![`127.0.0.1:${this.port}`,`localhost:${this.port}`].includes(req.headers.host??''))throw Error('HOST');
   if((req.headers.origin&&!origins.includes(req.headers.origin))||req.headers['sec-fetch-site']==='cross-site')throw Error('ORIGIN');
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
   if(assets[path]){if(req.method!=='GET')throw Error('METHOD');const [name,type]=assets[path];res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(await readFile(join(this.root,'public',name)));return true;}
   await this.init();const action=path.slice('/api/testnet'.length),url=new URL(req.url,origins[0]);
   if(req.method==='GET'&&action==='/bootstrap'){send(res,200,{csrfToken:this.token,profiles:listNetworks(),tasks:TASK_IDS.map(id=>this.lib.resolveTask(id)),status:this.status()});return true;}
   if(req.headers['x-testnet-token']!==this.token)throw Error('AUTH');
   if(req.method==='GET'){
    if(action==='/profiles')send(res,200,{profiles:listNetworks()});
    else if(action==='/status')send(res,200,this.status());
    else if(action==='/runs')send(res,200,await this.list());
    else if(action==='/run')send(res,200,await this.readRun(url.searchParams.get('id')));
    else if(action==='/manifest'){if(!this.manifest)throw Error('MANIFEST_NOT_ATTACHED');res.setHeader('Content-Disposition','attachment; filename="testnet-deployment.json"');send(res,200,this.manifest);}
    else if(action==='/manifests'){const manifests=[];for(const file of await readdir(join(this.data,'deployments')))if(/^\d+-0x[0-9a-f]{40}\.json$/i.test(file))manifests.push(await optional(join(this.data,'deployments',file)));send(res,200,{manifests});}
    else if(action==='/export'){res.setHeader('Content-Disposition','attachment; filename="testnet-run.json"');send(res,200,await this.export(url.searchParams.get('id')));}
    else send(res,404,{error:'NOT_FOUND'});return true;
   }
   if(req.method!=='POST')throw Error('METHOD');if(!origins.includes(req.headers.origin))throw Error('ORIGIN');const input=await body(req);
    if(action==='/resolve'){fields(input,['taskId','taskParameters','taskInput']);if(!TASK_IDS.includes(input.taskId))throw Error('INVALID_TASK');send(res,200,this.lib.resolveTask(input.taskId,{taskParameters:input.taskParameters,taskInput:input.taskInput}));}else if(action==='/connect')send(res,200,await this.connect(input));else if(action==='/deploy')send(res,200,await this.deploy(input));else if(action==='/attach')send(res,200,await this.attach(input));else if(action==='/disconnect')send(res,200,await this.disconnect(input));else if(action==='/run')send(res,202,await this.start(input));else if(['/pause','/resume','/cancel'].includes(action))send(res,202,this.control(action.slice(1),input));else if(action==='/recheck')send(res,200,await this.recheck(input));else if(action==='/reconcile'){fields(input,[]);send(res,200,await this.exclusive('reconcile',async()=>{this.requireConnected();const transactions=await this.chain.reconcile();return {transactions,status:this.status(),note:'Read-only transaction reconciliation; task verdicts require recheck.'};}));}else if(action==='/check-offline')send(res,200,await this.checkOffline(input));else if(action==='/verify')send(res,200,await this.verify(input));else send(res,404,{error:'NOT_FOUND'});return true;
  }catch(e){const code=errorCode(e);send(res,['HOST','ORIGIN','AUTH'].includes(code)?403:/BUSY|ACTIVE|UNRESOLVED/.test(code)?409:400,{error:code});return true;}
 }
 async shutdown(){this.closing=true;this.active?.abort.abort();try{await this.operation?.promise;}finally{await this.chain?.shutdown?.();this.connected=false;this.ready=false;this.writable=false;this.chain=null;}}
}
