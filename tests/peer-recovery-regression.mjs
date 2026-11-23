import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createServer as createHttpServer} from 'node:http';
import {createServer as createNetServer} from 'node:net';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {artifactDirectory} from './helpers/artifacts.mjs';

// Real local EVM + HTTP + independent signing workers. The optional model
// endpoint below is an explicit protocol fixture, never a real-LLM benchmark.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const runId=randomUUID(),report=artifactDirectory('peer-recovery',runId);
const selected=new Set((process.env.LAB_PEER_CASES??'').split(',').filter(Boolean));
const records=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sha=x=>createHash('sha256').update(x).digest('hex');
const unresolved=t=>['reserved','broadcasting','pending','unknown'].includes(t.state);
const terminal=s=>['completed','stopped','error'].includes(s.state);
const build=JSON.parse(await readFile(join(root,'build-info.json'),'utf8'));
async function freePort(){const s=createNetServer();await new Promise((ok,bad)=>{s.once('error',bad);s.listen(0,'127.0.0.1',ok);});const p=s.address().port;await new Promise((ok,bad)=>s.close(e=>e?bad(e):ok()));return p;}
async function until(fn,predicate,label,timeoutMs=30000){const start=Date.now();let last;while(Date.now()-start<timeoutMs){last=await fn();if(predicate(last))return last;await sleep(75);}throw Error(label+' '+JSON.stringify(last));}
function payloads(bundle,type){return bundle.files['raw/events.jsonl'].trim().split('\n').filter(Boolean).map(JSON.parse).filter(e=>!type||e.type===type).map(event=>({event,payload:JSON.parse(bundle.files[event.payloadRef.path])}));}

class Harness {
 constructor(label){this.label=label;this.data=join(root,'data-acceptance-peer-recovery-'+runId+'-'+label);this.token='';this.admin='';this.log='';this.active=null;this.workerPids=new Set();}
 async boot(first=true){
  if(first){this.port=await freePort();this.rpcPort=await freePort();this.url='http://127.0.0.1:'+this.port;this.rpcUrl='http://127.0.0.1:'+this.rpcPort;}
  const env={...process.env,LAB_ROOT:root,LAB_DATA_DIR:this.data,LAB_PORT:String(this.port),LAB_CHAIN_PORT:String(this.rpcPort),LAB_ACCEPTANCE:'1'};delete env.LAB_LIBRARY_ONLY;delete env.LAB_AGENT_WORKER;
  this.process=spawn(process.execPath,[join(root,'dist/server.mjs')],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  this.process.stdout.on('data',b=>this.log+=b);this.process.stderr.on('data',b=>this.log+=b);this.process.once('error',e=>this.log+='\n'+e.stack);
  await until(async()=>{if(this.process.exitCode!==null)throw Error('SERVER_EXIT '+this.process.exitCode+' '+this.log.slice(-2000));try{const h=await this.api('/api/health');this.token=h.csrfToken;this.admin=(await readFile(join(this.data,'control-admin.token'),'utf8')).trim();const s=await this.api('/api/status');assert.equal(resolve(s.dataDirectory),resolve(this.data),'Never adopt another server instance');assert.equal(h.version.sourceHash,build.sourceHash,'Runtime build must match test build');this.owned=true;return true;}catch(e){if(e.code==='ERR_ASSERTION')throw e;return false;}},Boolean,'SERVER_READY',30000);
 }
 async api(path,body,{key=randomUUID(),status}={}){const r=await fetch(this.url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Lab-Token':this.token,'X-Control-Admin':this.admin,'Idempotency-Key':key},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(45000)});const v=await r.json();if(status!==undefined)assert.equal(r.status,status,JSON.stringify(v));else if(!r.ok)throw Error(path+' '+r.status+' '+JSON.stringify(v));return v;}
 async attempt(path,body,key=randomUUID()){const r=await fetch(this.url+path,{method:'POST',headers:{'Content-Type':'application/json','X-Lab-Token':this.token,'X-Control-Admin':this.admin,'Idempotency-Key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});return {status:r.status,body:await r.json()};}
 async rpc(method,params=[]){const r=await fetch(this.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(8000)});const v=await r.json();if(v.error)throw Error(JSON.stringify(v.error));return v.result;}
 async agents(model){for(const agentId of ['reg-maker','reg-taker']){const all=await this.api('/api/v2/agents');const a=all.find(x=>x.agentId===agentId);if(!a)await this.api('/api/v2/agents',{agentId,...(model?{model}:{})});if(!a?.online)await this.api('/api/v2/agents/'+agentId+'/start',{});}
  const agents=await until(()=>this.api('/api/v2/agents'),a=>['reg-maker','reg-taker'].every(id=>a.some(x=>x.agentId===id&&x.online)),'WORKERS_READY');for(const a of agents)if(a.pid)this.workerPids.add(a.pid);return agents;
 }
 async create(input={},model){await this.agents(model);const j=await this.api('/api/v2/jobs',{taskType:'peer_swap',input:{manual:true,automine:false,...input}});const e=await this.api('/api/v2/jobs/'+j.id+'/assign',{roles:{maker:'reg-maker',taker:'reg-taker'},start:true});this.active=e.id;return until(()=>this.state(),s=>!!s.before,'SCENE_STARTED');}
 state(){return this.api('/api/v2/executions/'+this.active);}
 async control(action,extra={},key=randomUUID()){await this.api('/api/v2/executions/'+this.active+'/control',{action,...extra},{key});return this.state();}
 async nextPending(){return until(async()=>{let s=await this.state();if(s.transactions?.some(unresolved)||terminal(s)||s.state==='requires_attention')return s;await this.control('step');return this.state();},s=>s.transactions?.some(unresolved)||terminal(s)||s.state==='requires_attention','NEXT_PENDING');}
 async mine(seconds=1){return this.control('mine',{blocks:1,seconds});}
 async completeManual(){for(let i=0;i<50;i++){let s=await this.state();if(terminal(s))return s;if(s.transactions?.some(unresolved))await this.mine();else await this.control('step');}throw Error('MANUAL_COMPLETION_TIMEOUT');}
 async save(label){const s=await this.state();const b=await this.api('/api/v2/executions/'+this.active+'/export?incomplete=1');const file=this.label+'-'+label+'.json';const text=JSON.stringify(b,null,2);await writeFile(join(report,file),text);return {file,sha256:sha(text),bundle:b,state:s};}
 async cleanup(){
  const errors=[];
  if(this.owned&&this.process?.exitCode===null){
   try{const status=await this.api('/api/status');assert.equal(resolve(status.dataDirectory),resolve(this.data));await this.api('/api/shutdown',{});}catch(e){errors.push(e.message);}
   for(let i=0;i<100&&this.process.exitCode===null;i++)await sleep(50);
   if(this.process.exitCode===null)this.process.kill();
  }
  // Active-work shutdown deliberately preserves Anvil. Only kill the PID from
  // this uniquely owned test data directory, never a process discovered by port.
  try{const e=JSON.parse(await readFile(join(this.data,'environment-v2.json'),'utf8'));if(e.rpcUrl===this.rpcUrl&&Number.isInteger(e.pid))process.kill(e.pid);}catch(e){if(!['ENOENT','ESRCH'].includes(e.code))errors.push(e.message);}
  for(const pid of this.workerPids)try{process.kill(pid);}catch(e){if(e.code!=='ESRCH')errors.push(e.message);}
  await writeFile(join(report,this.label+'.server.log'),this.log);return errors;
 }
}

async function runCase(id,title,fn){if(selected.size&&!selected.has(id))return;const h=new Harness(id),record={id,title,startedAt:new Date().toISOString(),realEVM:true,independentWorkers:true,realLLM:false,publicNetwork:false};try{await h.boot();Object.assign(record,await fn(h));record.status='PASS';console.log('PASS '+id+' '+title);}catch(e){record.status='FAIL';record.error=e.stack;process.exitCode=1;console.error('FAIL '+id+' '+e.stack);}finally{record.cleanupErrors=await h.cleanup();if(record.cleanupErrors.length){record.status='FAIL';process.exitCode=1;}record.endedAt=new Date().toISOString();records.push(record);await writeFile(join(report,id+'.result.json'),JSON.stringify(record,null,2));}}

await runCase('P01','Four dependent transactions remain single while pending, then settle exactly once',async h=>{
 await h.create();const phases=[];
 for(const [index,fn]of ['approve','createOrder','approve','fillOrder'].entries()){
  let s=await h.nextPending();const txs=s.transactions;assert.equal(txs.length,index+1,JSON.stringify(s));const tx=txs[index];assert.equal(tx.functionName,fn);assert.ok(tx.hash,'Hash must exist before/at broadcasting');assert.ok(unresolved(tx));
  const hashes=txs.map(t=>t.hash),steps=s.steps;for(let i=0;i<3;i++)await h.attempt('/api/v2/executions/'+h.active+'/control',{action:'step'});
  s=await h.state();assert.deepEqual(s.transactions.map(t=>t.hash),hashes,'Pending steps must not create a fresh transaction');assert.equal(s.steps,steps,'No model/script decisions should advance during pending');
  await h.mine();s=await h.state();assert.equal(s.transactions[index].state,'confirmed');assert.equal(s.transactions[index].receipt.status,'success');phases.push({phase:index+1,functionName:fn,hash:tx.hash,nonce:tx.nonce,pendingSteps:steps});
 }
 const s=await h.completeManual();assert.equal(s.check.status,'success',JSON.stringify(s.check));assert.equal(s.transactions.length,4);assert.equal(s.after.assets.maker.A,'90000000');assert.equal(s.after.assets.maker.B,'20000000');assert.equal(s.after.assets.taker.A,'10000000');assert.equal(s.after.assets.taker.B,'80000000');
 const saved=await h.save('settled');return {executionId:s.id,phases,evidence:[saved.file]};
});

await runCase('P02','Stop while createOrder is pending preserves open escrow and permits one refund',async h=>{
 await h.create();await h.nextPending();await h.mine();let s=await h.nextPending();assert.equal(s.transactions.at(-1).functionName,'createOrder');const pendingHash=s.transactions.at(-1).hash;
 s=await h.control('stop');assert.equal(s.environmentLock,true);assert.ok(!terminal(s));await h.mine();s=await h.control('reconcile');
 assert.equal(Number(s.order?.state),1,'Reconcile must recover the order even without a previous confirmed orderId');assert.equal(s.after.escrow.A,'10000000');assert.equal(s.environmentLock,true);assert.equal(s.state,'requires_attention');assert.equal(s.transactions.filter(t=>t.functionName==='createOrder').length,1);assert.equal(s.transactions.find(t=>t.hash===pendingHash).state,'confirmed');
 const open=await h.save('open-after-stop');const reset=await h.attempt('/api/environment/reset',{});assert.ok(reset.status>=400,'Open escrow must retain environment lock');
 await h.control('cancel');if((await h.state()).transactions.some(unresolved))await h.mine();s=await h.state();if(!terminal(s))s=await h.control('reconcile');
 assert.equal(Number(s.order.state),3);assert.equal(s.after.escrow.A,'0');assert.equal(s.after.assets.maker.A,'100000000');assert.equal(s.environmentLock,false);assert.equal(s.transactions.filter(t=>t.functionName==='cancelOrder').length,1);assert.equal(s.transactions.filter(t=>t.functionName==='fillOrder').length,0);
 const refunded=await h.save('refunded');return {executionId:s.id,pendingHash,evidence:[open.file,refunded.file]};
});

await runCase('P03','A real reverted order does not advance to buyer approval or settlement',async h=>{
 await h.create({deadlineSeconds:30});await h.nextPending();await h.mine();let s=await h.nextPending();assert.equal(s.transactions.at(-1).functionName,'createOrder');await h.mine(60);
 s=await h.state();assert.equal(s.transactions.find(t=>t.functionName==='createOrder').state,'reverted');const count=s.transactions.length;
 for(let i=0;i<4;i++)await h.attempt('/api/v2/executions/'+h.active+'/control',{action:'step'});
 s=await h.state();assert.equal(s.transactions.length,count,'A reverted operation must not automatically create a retry or downstream transaction');assert.equal(s.transactions.some(t=>t.functionName==='fillOrder'),false);assert.ok(s.state!=='running'&&s.state!=='pending','Failure must be explicit, not silently advancing');
 const saved=await h.save('reverted');return {executionId:s.id,transactionStates:s.transactions.map(t=>({functionName:t.functionName,state:t.state})),evidence:[saved.file]};
});

await runCase('P04','Confirmation arriving after the former five-second polling window resumes automatically',async h=>{
 await h.create({manual:false,automine:true,pauseBeforeTransaction:true});let s=await until(()=>h.state(),x=>x.state==='paused'&&x.paused?.phase==='before_transaction','INITIAL_GATE');
 await h.rpc('evm_setAutomine',[false]);await h.control('resume');s=await until(()=>h.state(),x=>x.transactions?.some(unresolved),'PENDING_TRANSACTION');const tx=s.transactions.find(unresolved),steps=s.steps;
 await sleep(6500);s=await h.state();assert.equal(s.transactions.length,1);assert.equal(s.transactions[0].hash,tx.hash);assert.equal(s.steps,steps,'Waiting must not consume decision steps');
 // External mining intentionally does not invoke the platform's mine/resume API.
 await h.rpc('evm_mine',[]);s=await until(()=>h.state(),x=>x.transactions?.[0]?.state==='confirmed'&&x.state==='paused'&&x.paused?.detail?.functionName==='createOrder','LATE_CONFIRMATION_AUTO_RECOVERY',20000);
 assert.equal(s.transactions.length,1);assert.equal(s.transactions[0].hash,tx.hash);const saved=await h.save('late-confirmation');await h.control('stop');return {executionId:s.id,waitingMs:6500,hash:tx.hash,resumedPhase:s.paused.detail.functionName,evidence:[saved.file]};
});

await runCase('P05','Repeated HTTP control idempotency key does not execute another decision or transaction',async h=>{
 await h.create();let s=await h.state();for(let i=0;i<8&&!(s.accepted&&s.agents?.some(a=>a.agentId==='maker'));i++){await h.control('step');s=await h.state();}
 const key='same-control-'+randomUUID(),path='/api/v2/executions/'+h.active+'/control';const a=await h.api(path,{action:'step'},{key});const after=await h.state();const b=await h.api(path,{action:'step'},{key});const again=await h.state();
 assert.equal(a.controlId,b.controlId);assert.equal(again.steps,after.steps);assert.deepEqual(again.transactions,after.transactions);await h.completeManual();const saved=await h.save('idempotent-control');return {executionId:h.active,controlId:a.controlId,evidence:[saved.file],coverage:'HTTP control operation replay; lower-level semantic operation replay is covered by the gateway regression tests.'};
});

await runCase('P06','Injected response failure after broadcast reconciles the original hash',async h=>{
 await h.create({manual:false,automine:true,pauseBeforeTransaction:true});await until(()=>h.state(),s=>s.state==='paused','INITIAL_GATE');await h.api('/api/v2/testing/fault',{point:'after_broadcast',functionName:'approve',mode:'error'});await h.control('resume');
 const s=await until(()=>h.state(),x=>x.state==='paused'&&x.paused?.detail?.functionName==='createOrder','NEXT_GATE');assert.equal(s.transactions.length,1);assert.equal(s.transactions[0].state,'confirmed');const saved=await h.save('broadcast-fault');assert.ok(payloads(saved.bundle,'tx.unknown').some(x=>x.payload.error?.includes('INJECTED_after_broadcast')),'Actual post-broadcast fault must be present in evidence');await h.control('stop');return {executionId:s.id,hash:s.transactions[0].hash,evidence:[saved.file]};
});

await runCase('P07','Actual control-process crash after broadcast restores one durable transaction',async h=>{
 await h.create({manual:false,automine:true,pauseBeforeTransaction:true});await until(()=>h.state(),s=>s.state==='paused','INITIAL_GATE');await h.api('/api/v2/testing/fault',{point:'after_broadcast',functionName:'approve',mode:'crash'});
 try{await h.control('resume');}catch(e){if(!/fetch|socket|closed|ECONNRESET|connect/i.test(e.message))throw e;}
 await until(async()=>h.process.exitCode,x=>x===91,'CONTROL_CRASH');await h.boot(false);await h.agents();let s=await h.control('reconcile');assert.equal(s.transactions.length,1);assert.equal(s.transactions[0].functionName,'approve');assert.equal(s.transactions[0].state,'confirmed');assert.ok(s.transactions[0].hash);
 const saved=await h.save('crash-recovered');const intents=payloads(saved.bundle,'tx.intent');assert.equal(new Set(intents.map(x=>x.payload.intentId)).size,1);return {executionId:s.id,hash:s.transactions[0].hash,actualCrashExitCode:91,evidence:[saved.file],coverage:'Crash is after sendRawTransaction; a separate pre-broadcast crash point is not claimed by this case.'};
});

await runCase('P08','Invalid acceptance and post-acceptance quote changes are rejected before any changed trade',async h=>{
 const flags=new Map(),observed=[];let serial=0;
 const model=createHttpServer(async(req,res)=>{try{let body='';for await(const b of req)body+=b;const r=JSON.parse(body),contexts=r.messages.filter(m=>m.role==='user').map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).filter(Boolean),who=contexts.find(x=>x.role),p=contexts.filter(x=>x.source==='platform_verified_progress').at(-1),role=who.role,flag=name=>{const k=role+':'+name;if(flags.has(k))return false;flags.set(k,true);return true;};let call={name:'wait',args:{}};
  if(role==='maker'&&!p.quote)call={name:'send_message',args:{recipient:'taker',kind:'quote',payload:{sellAmount:'10',buyAmount:'20'}}};
  else if(role==='taker'&&!p.quote&&flag('inquiry'))call={name:'send_message',args:{recipient:'maker',kind:'inquiry'}};
  else if(role==='taker'&&p.stage==='need_quote_decision'){
   if(flag('bad-recipient'))call={name:'send_message',args:{recipient:'taker',kind:'accept',quoteId:p.quote.quoteId}};
   else if(flag('bad-accept-payload'))call={name:'send_message',args:{recipient:'maker',kind:'accept',quoteId:p.quote.quoteId,payload:{buyAmount:'21'}}};
   else call={name:'send_message',args:{recipient:'maker',kind:'accept',quoteId:p.quote.quoteId}};
  }else if(role==='maker'&&p.stage==='maker_prepare_order'){
   if(flag('change-accepted-quote'))call={name:'send_message',args:{recipient:'taker',kind:'quote',payload:{sellAmount:'10',buyAmount:'21'}}};
   else if(flag('extra-amount'))call={name:'approve_sell',args:{amount:'999'}};
   else if(flag('approve'))call={name:'approve_sell',args:{}};
   else call={name:'create_order',args:{}};
  }else if(role==='maker'&&p.orderId&&flag('order-ref'))call={name:'send_message',args:{recipient:'taker',kind:'order_ref',payload:{orderId:p.orderId}}};
  else if(role==='taker'&&p.allowedActions.includes('inspect_order')&&!p.allowedActions.includes('fill_order'))call={name:'inspect_order',args:{}};
  else if(role==='taker'&&p.allowedActions.includes('fill_order'))call={name:flag('approve')?'approve_buy':'fill_order',args:{}};
  observed.push({role,stage:p.stage,quoteId:p.quote?.quoteId,call});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({model:'explicit-adversarial-protocol-fixture',choices:[{message:{role:'assistant',tool_calls:[{id:'fixture_'+(++serial),type:'function',function:{name:call.name,arguments:JSON.stringify(call.args)}}]}}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}));
 }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}});
 await new Promise(r=>model.listen(0,'127.0.0.1',r));
 try{
  await h.create({mode:'llm',manual:true,automine:true,maxSteps:80},{baseUrl:'http://127.0.0.1:'+model.address().port+'/v1',model:'explicit-adversarial-protocol-fixture'});let originalQuote,seenErrors=0;
  for(let i=0;i<65;i++){let s=await h.state();if(terminal(s))break;await h.control('step');s=await h.state();if(s.quote&&!originalQuote)originalQuote=structuredClone(s.quote);if(s.quote)assert.equal(s.quote.quoteId,originalQuote.quoteId,'Rejected change must not replace the quote');const saved=await h.api('/api/v2/executions/'+h.active+'/export?incomplete=1');const errors=payloads(saved,'agent.error');if(errors.length>seenErrors){const message=errors.at(-1).payload.error;if(/RECIPIENT|ACCEPT.*PAYLOAD|ACCEPT.*TERMS|QUOTE.*MISMATCH/.test(message)&&!s.transactions.length)assert.equal(s.accepted??null,null,'Failed acceptance must leave accepted state empty');seenErrors=errors.length;}}
  const s=await h.state(),saved=await h.save('quote-guard');assert.equal(s.check?.status,'success',JSON.stringify(s));const errors=payloads(saved.bundle,'agent.error').map(x=>x.payload.error);assert.ok(errors.some(x=>/MESSAGE_RECIPIENT/.test(x)));assert.ok(errors.some(x=>/ACCEPT.*PAYLOAD|ACCEPT.*TERMS|QUOTE.*MISMATCH/.test(x)),'Conflicting accepted payload must explicitly reject');assert.ok(errors.some(x=>/QUOTE.*(LOCK|ACCEPT|FROZEN)|ACCEPT.*QUOTE/.test(x)),'Accepted quote replacement must reject');assert.ok(errors.some(x=>/TOOL_ADDITIONAL_PROPERTIES/.test(x)));assert.equal(s.quote.buyAmount,'20');assert.equal(s.order.buyAmount,'20000000');assert.equal(s.order.sellAmount,'10000000');assert.equal(s.transactions.length,4);assert.deepEqual(s.transactions.filter(t=>t.functionName==='approve').map(t=>t.args[1]),['10000000','20000000']);
  await writeFile(join(report,'P08-model-protocol-requests.json'),JSON.stringify(observed,null,2));return {executionId:s.id,errors,protocolFixture:true,realLLM:false,evidence:[saved.file,'P08-model-protocol-requests.json']};
 }finally{await new Promise(r=>model.close(r));}
});

await runCase('P09','Original peer workbench also recovers a stopped pending order and refunds it',async h=>{
 await h.api('/api/environment/init',{});const initial=await h.api('/api/scenarios',{manual:true,automine:false});const path='/api/scenarios/'+initial.id;
 await h.api(path+'/start',{});const state=()=>h.api(path);
 async function step(){await h.api(path+'/step',{});return until(state,s=>!s.stepInProgress,'WORKBENCH_STEP');}
 async function nextPending(){return until(async()=>{let s=await state();if(s.transactions.some(unresolved))return s;await step();return state();},s=>s.transactions.some(unresolved),'WORKBENCH_PENDING');}
 await nextPending();await h.api(path+'/mine',{blocks:1,seconds:1});let s=await nextPending();assert.equal(s.transactions.at(-1).functionName,'createOrder');const hash=s.transactions.at(-1).hash;
 await h.api(path+'/stop',{});await h.api(path+'/mine',{blocks:1,seconds:1});s=await state();assert.equal(Number(s.order?.state),1);assert.equal(s.after.escrow.A,'10000000');assert.equal(s.locked,true,'The original workbench must retain the lock for open escrow');assert.ok(!terminal(s));
 await h.api(path+'/cancel',{});s=await state();if(s.transactions.some(unresolved))await h.api(path+'/mine',{blocks:1,seconds:1});s=await state();assert.equal(Number(s.order?.state),3);assert.equal(s.after.escrow.A,'0');assert.equal(s.after.assets.maker.A,'100000000');assert.equal(s.locked,false);assert.equal(s.transactions.filter(t=>t.functionName==='createOrder').length,1);assert.equal(s.transactions.filter(t=>t.functionName==='cancelOrder').length,1);
 const bundle=await h.api(path+'/export');const file='P09-workbench-refunded.json';await writeFile(join(report,file),JSON.stringify(bundle,null,2));return {scenarioId:s.id,pendingOrderHash:hash,independentWorkers:false,entryPoint:'original /api/scenarios workbench',evidence:[file]};
});

await runCase('P10','Actual crash before broadcast replays the same signed hash and completes the trade',async h=>{
 await h.create({manual:false,automine:true,pauseBeforeTransaction:true});await until(()=>h.state(),s=>s.state==='paused','INITIAL_GATE');await h.api('/api/v2/testing/fault',{point:'after_hash_persist',functionName:'approve',mode:'crash'});
 try{await h.control('resume');}catch(e){if(!/fetch|socket|closed|ECONNRESET|connect/i.test(e.message))throw e;}
 await until(async()=>h.process.exitCode,x=>x===91,'PREBROADCAST_CONTROL_CRASH');
 const db=new DatabaseSync(join(h.data,'control.sqlite'),{readOnly:true});let tx;
 try{const pending=db.prepare('SELECT data FROM tx_intents').all().map(x=>JSON.parse(x.data)).filter(x=>x.executionId===h.active);assert.equal(pending.length,1);tx=pending[0];assert.ok(tx.hash);assert.equal(tx.state,'broadcasting');}finally{db.close();}
 const beforeChainTx=await h.rpc('eth_getTransactionByHash',[tx.hash]);assert.equal(beforeChainTx,null,'Fault must occur before any actual chain broadcast');const beforeNonce=await h.rpc('eth_getTransactionCount',[tx.from,'latest']);assert.equal(Number(BigInt(beforeNonce)),tx.nonce);
 const before={intentId:tx.intentId,operationId:tx.operationId,nonce:tx.nonce,hash:tx.hash,state:tx.state,chainTransaction:beforeChainTx,latestNonce:beforeNonce};await writeFile(join(report,'P10-prebroadcast-durable-evidence.json'),JSON.stringify(before,null,2));
 await h.boot(false);await h.agents();let s=await h.state();assert.equal(s.transactions.length,1);assert.equal(s.transactions[0].hash,tx.hash);assert.equal(s.transactions[0].nonce,tx.nonce);assert.equal(await h.rpc('eth_getTransactionByHash',[tx.hash]),null,'Restart alone must not silently authorize rebroadcast');
 await h.control('resume');
 s=await until(async()=>{let current=await h.state();if(current.state==='paused'&&current.paused)current=await h.control('resume');return current;},terminal,'RESTARTED_TRADE_COMPLETION',45000);
 assert.equal(s.check?.status,'success',JSON.stringify(s));assert.equal(s.transactions.length,4);const approvals=s.transactions.filter(t=>t.functionName==='approve'&&t.from.toLowerCase()===tx.from.toLowerCase());assert.equal(approvals.length,1);assert.equal(approvals[0].hash,tx.hash);assert.equal(approvals[0].nonce,tx.nonce);assert.equal(approvals[0].intentId,tx.intentId);assert.equal(approvals[0].receipt.status,'success');
 const saved=await h.save('prebroadcast-crash-recovered');const broadcasts=payloads(saved.bundle,'tx.rebroadcast_attempt');assert.ok(broadcasts.some(x=>x.payload.hash===tx.hash),'Recovery must explicitly record same-hash replay');assert.equal(payloads(saved.bundle,'tx.intent').filter(x=>x.payload.intentId===tx.intentId).length,1);const events=payloads(saved.bundle,'tx.hash_durable').filter(x=>x.payload.hash===tx.hash);assert.equal(events.length,1,'Replaying must not create a second signature intent');return {executionId:s.id,actualCrashExitCode:91,durable:before,finalTransactionCount:s.transactions.length,evidence:['P10-prebroadcast-durable-evidence.json',saved.file]};
});

await runCase('P11','A reverted early expiry can be retried explicitly after expiry and refunds once',async h=>{
 await h.create({deadlineSeconds:120});await h.nextPending();await h.mine();await h.nextPending();await h.mine();let s=await h.control('stop');assert.equal(Number(s.order?.state),1);assert.equal(s.environmentLock,true);
 await h.control('expire');s=await h.mine();const first=s.transactions.find(t=>t.functionName==='expireOrder');assert.ok(first,'Operator must actually attempt the early expiry');assert.equal(first.state,'reverted');assert.equal(first.receipt.status,'reverted');assert.equal(Number(s.order.state),1);assert.equal(s.after.escrow.A,'10000000');assert.equal(s.environmentLock,true);assert.equal(s.state,'requires_attention');
 const failed=await h.save('early-expiry-reverted');await h.rpc('evm_setNextBlockTimestamp',[Number(s.quote.deadline)+1]);await h.rpc('evm_mine',[]);
 await h.control('expire');s=await h.state();if(s.transactions.some(unresolved))await h.mine();s=await h.state();if(!terminal(s))s=await h.control('reconcile');
 const attempts=s.transactions.filter(t=>t.functionName==='expireOrder');assert.equal(attempts.length,2);assert.equal(attempts[0].state,'reverted');assert.equal(attempts[1].state,'confirmed');assert.equal(attempts[1].receipt.status,'success');assert.notEqual(attempts[0].hash,attempts[1].hash);assert.equal(attempts[1].nonce,attempts[0].nonce+1);assert.notEqual(attempts[1].intentId,attempts[0].intentId);
 assert.equal(attempts[1].priorIntentId,attempts[0].intentId,'The explicitly authorized new attempt must link the previous reverted intent');assert.equal(attempts[1].priorReceiptHash,attempts[0].hash,'Retry evidence must identify the previous receipt hash');assert.equal(attempts[1].operationId,attempts[0].operationId);assert.equal(attempts[1].attempt,2);assert.ok(attempts[1].cleanupControlId);
 assert.equal(Number(s.order.state),4);assert.equal(s.after.escrow.A,'0');assert.equal(s.after.assets.maker.A,'100000000');assert.equal(s.environmentLock,false);assert.equal(s.transactions.filter(t=>t.functionName==='fillOrder').length,0);const saved=await h.save('expiry-retry-refunded');return {executionId:s.id,attempts:attempts.map(t=>({operationId:t.operationId,attempt:t.attempt,intentId:t.intentId,priorIntentId:t.priorIntentId,priorReceiptHash:t.priorReceiptHash,cleanupControlId:t.cleanupControlId,hash:t.hash,nonce:t.nonce,state:t.state})),evidence:[failed.file,saved.file]};
});

await runCase('P12','A genuinely stopped worker enters recovering and resumes to successful unlocked completion',async h=>{
 await h.create({manual:true,automine:true});let s=await until(async()=>{let current=await h.state();if(!current.accepted)current=await h.control('step');return current;},x=>!!x.accepted,'ACCEPTED_BEFORE_WORKER_STOP');
 assert.equal(s.transactions.length,0);const before=(await h.api('/api/v2/agents')).find(a=>a.agentId==='reg-maker');assert.ok(before.online&&before.pid);
 await h.api('/api/v2/agents/reg-maker/stop',{});await until(()=>h.api('/api/v2/agents'),a=>!a.find(x=>x.agentId==='reg-maker').online,'WORKER_OFFLINE');
 await h.control('step');s=await h.state();assert.equal(s.state,'recovering');assert.match(s.error,/WORKER_|OLD_LEASE/);assert.equal(s.environmentLock,true);assert.equal(s.transactions.length,0);
 const failed=await h.save('worker-offline');assert.ok(payloads(failed.bundle,'agent.error').some(x=>/WORKER_|OLD_LEASE/.test(x.payload.error)),'The original worker failure must remain observable');
 await h.agents();const after=(await h.api('/api/v2/agents')).find(a=>a.agentId==='reg-maker');assert.ok(after.online);assert.notEqual(after.pid,before.pid,'A real worker process must have restarted');assert.ok(after.leaseEpoch>before.leaseEpoch);
 await h.control('resume');s=await until(()=>h.state(),terminal,'WORKER_RECOVERED_COMPLETION',45000);assert.equal(s.state,'completed');assert.equal(s.check?.status,'success',JSON.stringify(s));assert.equal(s.environmentLock,false);assert.equal(s.transactions.length,4);assert.ok(!/WORKER_|OLD_LEASE/.test(s.error??''),'A stale worker error must not force a successfully finished trade back into recovering');
 const saved=await h.save('worker-restarted-completed');assert.ok(payloads(saved.bundle,'agent.error').some(x=>/WORKER_|OLD_LEASE/.test(x.payload.error)),'Recovery must not erase original failure evidence');return {executionId:s.id,workerBefore:{pid:before.pid,leaseEpoch:before.leaseEpoch},workerAfter:{pid:after.pid,leaseEpoch:after.leaseEpoch},evidence:[failed.file,saved.file]};
});

await runCase('P13','An open order with a prior worker failure can be cancelled directly without resuming trading',async h=>{
 await h.create({manual:true,automine:true});let s=await until(async()=>{let current=await h.state();if(!current.orderId)current=await h.control('step');return current;},x=>!!x.orderId,'OPEN_ORDER_BEFORE_WORKER_STOP');
 assert.equal(Number(s.order?.state),1);assert.equal(s.transactions.filter(t=>t.functionName==='createOrder').length,1);assert.equal(s.transactions.some(t=>t.functionName==='fillOrder'),false);
 const before=(await h.api('/api/v2/agents')).find(a=>a.agentId==='reg-maker');await h.api('/api/v2/agents/reg-maker/stop',{});await until(()=>h.api('/api/v2/agents'),a=>!a.find(x=>x.agentId==='reg-maker').online,'MAKER_OFFLINE_WITH_OPEN_ORDER');
 for(let i=0;i<4;i++){s=await h.state();if(s.state==='recovering')break;await h.control('step');}
 s=await h.state();assert.equal(s.state,'recovering');assert.match(s.error,/WORKER_|OLD_LEASE/);assert.equal(s.environmentLock,true);assert.equal(Number(s.order?.state),1);
 const failed=await h.save('open-order-worker-failed');assert.ok(payloads(failed.bundle,'agent.error').some(x=>/WORKER_|OLD_LEASE/.test(x.payload.error)));
 await h.agents();const after=(await h.api('/api/v2/agents')).find(a=>a.agentId==='reg-maker');assert.ok(after.online);assert.notEqual(after.pid,before.pid);
 // Deliberately do not resume the failed trade: the operator authorizes cleanup only.
 s=await h.control('cancel');assert.ok(['completed','stopped'].includes(s.state),'Successful cleanup must terminate even when a prior worker error existed');assert.equal(Number(s.order.state),3);assert.equal(s.after.escrow.A,'0');assert.equal(s.after.assets.maker.A,'100000000');assert.equal(s.environmentLock,false);assert.ok(!/WORKER_|OLD_LEASE/.test(s.error??''));
 const refunds=s.transactions.filter(t=>t.functionName==='cancelOrder');assert.equal(refunds.length,1);assert.equal(refunds[0].state,'confirmed');assert.equal(refunds[0].receipt.status,'success');assert.equal(s.transactions.some(t=>t.functionName==='fillOrder'),false);
 const saved=await h.save('direct-cancel-after-worker-failure');assert.ok(payloads(saved.bundle,'agent.error').some(x=>/WORKER_|OLD_LEASE/.test(x.payload.error)),'Cleanup must retain the original worker failure evidence');return {executionId:s.id,tradingResumed:false,workerBefore:{pid:before.pid,leaseEpoch:before.leaseEpoch},workerAfter:{pid:after.pid,leaseEpoch:after.leaseEpoch},finalState:s.state,refundHash:refunds[0].hash,evidence:[failed.file,saved.file]};
});

await writeFile(join(report,'summary.json'),JSON.stringify({suite:'peer-pending-and-accepted-quote-recovery',runId,buildHash:build.sourceHash,platform:process.platform,node:process.version,generatedAt:new Date().toISOString(),realEVM:true,realLLM:false,publicNetwork:false,records,limitations:['No public-chain finality/reorganization test.','The model endpoint is a deterministic protocol fixture, not a claim about any LLM.','Source-level semantic operation replay across distinct model commands is tested separately; P05 exercises HTTP control replay.']},null,2));
console.log('PEER_RECOVERY_REPORT '+report);
