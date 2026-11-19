import {fork} from 'node:child_process';
import {readFile,mkdir,readdir,lstat,realpath} from 'node:fs/promises';
import {join,resolve,relative,sep} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {atomicJson} from '../research/journal.mjs';
import {capabilities,normalizeConfig,VERSION} from './config.mjs';
const assets={'/bnb-sdk.html':['bnb-sdk.html','text/html'],'/bnb-sdk.js':['bnb-sdk.js','text/javascript'],'/bnb-sdk.css':['bnb-sdk.css','text/css']};
const safeId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
const json=x=>JSON.stringify(x,(_k,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';
const activeStates=new Set(['running','paused','pausing','cancelling']);
async function readJson(path,optional=true){try{const st=await lstat(path);if(st.isSymbolicLink()||!st.isFile()||st.size>32*1024*1024)throw Error('BUNDLE_FILE');return JSON.parse(await readFile(path,'utf8'));}catch(e){if(optional&&e.code==='ENOENT')return null;throw e;}}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(json(value));}
async function body(req){let bytes=0,parts=[];for await(const part of req){bytes+=part.length;if(bytes>16384)throw Error('BODY_LIMIT');parts.push(part);}const value=JSON.parse(Buffer.concat(parts).toString()||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('BODY_FIELDS');return value;}
function childEnvironment(){const env={};for(const name of ['PATH','Path','SystemRoot','WINDIR','ComSpec','TEMP','TMP','TMPDIR','HOME','USERPROFILE','LANG','LC_ALL'])if(process.env[name])env[name]=process.env[name];env.BNBAGENT_USE_PAYMASTER='0';return env;}
export class BnbSdkService {
 constructor({root,data,port=4317,spawnWorker=(file,opts)=>fork(file,[],opts)}={}){this.root=resolve(root);this.data=resolve(data);this.port=Number(port);this.spawnWorker=spawnWorker;this.token=randomBytes(32).toString('hex');this.active=null;this.closing=false;this.initialized=null;}
 get busy(){return Boolean(this.active);}
 async init(){if(!this.initialized)this.initialized=(async()=>{await mkdir(join(this.data,'runs'),{recursive:true});await mkdir(join(this.data,'states'),{recursive:true});for(const name of await readdir(join(this.data,'states'))){if(!/^[a-zA-Z0-9_-]+\.json$/.test(name))continue;const path=join(this.data,'states',name),state=await readJson(path);if(activeStates.has(state?.state)){await atomicJson(path,{...state,state:'unknown',status:'unknown',endedAt:new Date().toISOString(),error:'PROCESS_RESTARTED_NO_AUTOMATIC_RETRY'});}}})();return this.initialized;}
 async assertRun(id){if(!safeId(id))throw Error('RUN_ID');const base=join(this.data,'runs'),dir=join(base,id);for(const path of [base,dir]){const st=await lstat(path);if(st.isSymbolicLink()||!st.isDirectory())throw Error('BUNDLE_PATH');}const rel=relative(await realpath(base),await realpath(dir));if(rel!==id||rel.includes(sep))throw Error('BUNDLE_PATH');return dir;}
 async state(id){if(!safeId(id))throw Error('RUN_ID');return readJson(join(this.data,'states',id+'.json'));}
 async update(operation,patch){operation.state={...operation.state,...patch};const snapshot=structuredClone(operation.state);operation.persistence=operation.persistence.then(()=>atomicJson(join(this.data,'states',operation.id+'.json'),snapshot));await operation.persistence;}
 async list(){await this.init();const runs=[];for(const id of await readdir(join(this.data,'runs'))){if(!safeId(id))continue;const dir=await this.assertRun(id);runs.push({id,state:await this.state(id),summary:await readJson(join(dir,'summary.json'))});}return runs.sort((a,b)=>(b.state?.startedAt??'').localeCompare(a.state?.startedAt??''));}
 async start(input){
  await this.init();if(this.closing)throw Error('PLATFORM_STOPPING');if(this.active)throw Error('EXPERIMENT_BUSY');if(!input||typeof input!=='object'||Array.isArray(input)||!Object.hasOwn(input,'config')||Object.keys(input).some(k=>k!=='config'))throw Error('BODY_FIELDS');const config=normalizeConfig(input.config);
  const id=randomUUID(),outDir=join(this.data,'runs',id),operation={id,config,child:null,resourcePids:new Set(),persistence:Promise.resolve(),state:{id,state:'running',startedAt:new Date().toISOString(),scenario:config.scenario,config},completion:null};this.active=operation;
  try{
   await mkdir(outDir);await this.update(operation,{});
   const child=this.spawnWorker(join(this.root,'src/bnb-sdk/worker.mjs'),{cwd:this.root,env:childEnvironment(),execPath:process.execPath,stdio:['ignore','ignore','ignore','ipc'],windowsHide:true});operation.child=child;
   operation.completion=new Promise(resolveDone=>{
    let terminal=null,settled=false;
    const finish=async(error)=>{if(settled)return;settled=true;clearTimeout(operation.deadline);clearTimeout(operation.forceTimer);for(const pid of operation.resourcePids){try{process.kill(pid);}catch{}}
     try{const summary=await readJson(join(outDir,'summary.json'));const cancelled=operation.state.state==='cancelling'||terminal?.cancelled;const state=terminal?.type==='complete'&&summary?'sealed':cancelled?'cancelled':'unknown';await this.update(operation,{state,status:summary?.status??(cancelled?'cancelled':'unknown'),endedAt:new Date().toISOString(),error:error??terminal?.error??(state==='unknown'?'WORKER_EXIT_WITHOUT_SEALED_RESULT':undefined)});}catch{operation.persistenceError=true;}finally{if(this.active===operation)this.active=null;resolveDone();}};
    child.on('message',message=>{
     if(message?.type==='event'){const event=message.event,pid=message.payload?.pid??event?.pid;if(event?.type==='bnb.resource'&&Number.isSafeInteger(pid)&&pid>0)operation.resourcePids.add(pid);return;}
     if(message?.type==='paused'&&operation.state.state!=='cancelling'&&!settled)this.update(operation,{state:'paused',checkpoint:message.detail}).catch(()=>this.cancel(id).catch(()=>{}));
     if(message?.type==='resumed'&&operation.state.state!=='cancelling'&&!settled)this.update(operation,{state:'running',checkpoint:null}).catch(()=>this.cancel(id).catch(()=>{}));
     if(['complete','failed'].includes(message?.type))terminal=message;
    });
    child.once('error',()=>{try{child.kill();}catch{}void finish('WORKER_START_FAILED');});child.once('exit',()=>{void finish();});
   });
   operation.deadline=setTimeout(()=>this.cancel(id).catch(()=>{}),(config.timeoutSeconds+5)*1000);operation.deadline.unref();
   child.send({type:'start',root:this.root,outDir,runId:id,config});return {id,state:'running'};
  }catch(error){clearTimeout(operation.deadline);clearTimeout(operation.forceTimer);try{operation.child?.kill();}catch{}for(const pid of operation.resourcePids){try{process.kill(pid);}catch{}}await this.update(operation,{state:'error',status:'unknown',error:'WORKER_START_FAILED',endedAt:new Date().toISOString()}).catch(()=>{});if(this.active===operation)this.active=null;throw error;}
 }
 async control(id,type){if(!['pause','resume','cancel'].includes(type))throw Error('CONTROL');if(!this.active||this.active.id!==id)throw Error('RUN_NOT_ACTIVE');const op=this.active;if(type==='cancel')return this.cancel(id);if(type==='resume'&&op.state.state!=='paused')throw Error('NOT_PAUSED');if(type==='pause'&&!['running','pausing'].includes(op.state.state))throw Error('NOT_RUNNING');await this.update(op,{state:type==='pause'?'pausing':'running'});if(op.child?.connected)op.child.send({type});return {id,state:op.state.state};}
 async cancel(id){if(!this.active||this.active.id!==id)throw Error('RUN_NOT_ACTIVE');const op=this.active;await this.update(op,{state:'cancelling'});if(op.child?.connected)op.child.send({type:'cancel'});if(!op.forceTimer){op.forceTimer=setTimeout(()=>{try{op.child?.kill();}catch{}},5000);op.forceTimer.unref();}return {id,state:'cancelling'};}
 async readRun(id){const dir=await this.assertRun(id);let events=[];try{const file=join(dir,'raw/events.jsonl');if((await lstat(file)).isSymbolicLink())throw Error('BUNDLE_PATH');const text=await readFile(file,'utf8');if(text.length>16*1024*1024)throw Error('BUNDLE_LIMIT');const lines=text.trim().split('\n').filter(Boolean);events=lines.map((line,i)=>{try{return JSON.parse(line);}catch{if(i===lines.length-1&&this.active?.id===id)return null;throw Error('EVENT_JSON');}}).filter(Boolean);for(const event of events){const path=typeof event.payloadRef==='string'?event.payloadRef:event.payloadRef?.path;if(typeof path==='string'&&/^raw\/blobs\/[a-f0-9]{64}\.json$/.test(path))event.payload=await readJson(join(dir,path));}}catch(e){if(e.code!=='ENOENT')throw e;}
  return {id,state:await this.state(id),summary:await readJson(join(dir,'summary.json')),checker:await readJson(join(dir,'derived/checker.json')),graph:await readJson(join(dir,'derived/graph.json')),events};}
 async bundle(id){const dir=await this.assertRun(id),state=await this.state(id);if(this.active?.id===id||activeStates.has(state?.state))throw Error('RUN_NOT_SEALED');const files={};let bytes=0,count=0;async function walk(path){for(const ent of await readdir(path,{withFileTypes:true})){if(ent.isSymbolicLink())throw Error('BUNDLE_SYMLINK');const full=join(path,ent.name);if(ent.isDirectory())await walk(full);else{const st=await lstat(full);if(!st.isFile())throw Error('BUNDLE_FILE');bytes+=st.size;if(bytes>64*1024*1024||++count>5000)throw Error('BUNDLE_LIMIT');files[relative(dir,full).split(sep).join('/')]=await readFile(full,'utf8');}}}await walk(dir);return {schema:'web3-bnb-sdk-bundle-v1',visibility:'private-researcher',runId:id,state,files};}
 async check(id){const dir=await this.assertRun(id);if(this.active?.id===id)throw Error('RUN_NOT_SEALED');const {checkBnbRun}=await import('./checker.mjs');return checkBnbRun(dir,{write:false});}
 async handle(req,res,path){if(!assets[path]&&!path.startsWith('/api/bnb-sdk/'))return false;try{
  const origin='http://127.0.0.1:'+this.port,origins=[origin,'http://localhost:'+this.port];if(!origins.includes('http://'+req.headers.host))throw Error('HOST');if(req.headers.origin&&!origins.includes(req.headers.origin)||req.headers['sec-fetch-site']==='cross-site')throw Error('ORIGIN');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
  if(assets[path]){if(req.method!=='GET')throw Error('METHOD');const [file,type]=assets[path];res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(await readFile(join(this.root,'public',file)));return true;}
  await this.init();const action=path.slice('/api/bnb-sdk'.length),url=new URL(req.url,origin);
  if(req.method==='GET'&&action==='/health'){send(res,200,{version:VERSION,csrfToken:this.token,busy:this.busy,capabilities:capabilities()});return true;}
  if(req.headers['x-bnb-sdk-token']!==this.token)throw Error('AUTH');
  if(req.method==='GET'){
   if(action==='/capabilities')send(res,200,capabilities());else if(action==='/runs')send(res,200,{runs:await this.list(),active:this.active?.id??null});else if(action==='/run')send(res,200,await this.readRun(url.searchParams.get('id')));else if(action==='/export'){res.setHeader('Content-Disposition','attachment; filename="bnb-sdk-experiment.json"');send(res,200,await this.bundle(url.searchParams.get('id')));}else send(res,404,{error:'NOT_FOUND'});return true;
  }
  if(req.method!=='POST')throw Error('METHOD');if(!origins.includes(req.headers.origin))throw Error('ORIGIN');const input=await body(req);
  if(action==='/run')send(res,202,await this.start(input));else if(['/pause','/resume','/cancel','/check'].includes(action)){if(Object.keys(input).some(k=>k!=='id')||!safeId(input.id))throw Error('BODY_FIELDS');if(action==='/check')send(res,200,await this.check(input.id));else send(res,202,await this.control(input.id,action.slice(1)));}else send(res,404,{error:'NOT_FOUND'});return true;
 }catch(error){const code=/^[A-Z][A-Z0-9_]+$/.test(error.message)?error.message:'INVALID_REQUEST_OR_INFRASTRUCTURE';send(res,['HOST','ORIGIN','AUTH'].includes(code)?403:code==='EXPERIMENT_BUSY'?409:400,{error:code});return true;}}
 async shutdown(){this.closing=true;if(this.active){const op=this.active;await this.cancel(op.id);await op.completion;}}
}
