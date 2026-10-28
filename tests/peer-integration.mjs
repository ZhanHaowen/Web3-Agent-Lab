import {artifactPath,artifactDirectory} from './helpers/artifacts.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PEER_TEST_PORT??18417),chainPort=port+40,modelPort=port+1;
const url=`http://127.0.0.1:${port}`;let token='',output='';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const env={...process.env,LAB_ROOT:root,LAB_PORT:String(port),LAB_CHAIN_PORT:String(chainPort),LAB_DATA_DIR:join(root,'data-test')};delete env.LAB_LIBRARY_ONLY;
const server=spawn(process.execPath,[join(root,'dist/server.mjs')],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',b=>output+=b);server.stderr.on('data',b=>output+=b);
const results=[];let modelServer;
async function api(path,body,expected){const response=await fetch(url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Lab-Token':token},...(body===undefined?{}:{body:JSON.stringify(body)})});const value=await response.json();
 if(expected){assert.equal(response.status,expected,JSON.stringify(value));return value;}if(!response.ok)throw Error(JSON.stringify(value));return value;}
async function test(name,fn){const start=Date.now();try{const value=await fn();results.push({name,passed:true,durationMs:Date.now()-start,...value});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL '+name+' '+error.stack);throw error;}}
async function done(id){for(let i=0;i<800;i++){const s=await api('/api/scenarios/'+id);if(['completed','error','pending','pending_reconciliation','paused'].includes(s.state))return s;await wait(30);}throw Error('SCENARIO_TIMEOUT');}
async function run(spec={}){const s=await api('/api/scenarios',spec);await api(`/api/scenarios/${s.id}/start`,{});return done(s.id);}
async function save(s,name){const b=await api(`/api/scenarios/${s.id}/export`);await mkdir(artifactDirectory('fixtures/peer-v014'),{recursive:true});await writeFile(artifactPath('fixtures/peer-v014',name+'.json'),JSON.stringify(b,null,2));return b;}
try{
 for(let i=0;i<200;i++){try{const h=await api('/api/health');token=h.csrfToken;break;}catch{await wait(50);}}
 if(!token)throw Error('SERVER_START_FAILED '+output);
 await api('/api/environment/init',{});
 await test('T01 real-chain scripted peer swap: atomic 10A for 20B',async()=>{
   const s=await run();assert.equal(s.state,'completed',s.error);assert.equal(s.check.status,'success',JSON.stringify(s.check));
   assert.deepEqual([s.after.assets.maker.A,s.after.assets.maker.B,s.after.assets.taker.A,s.after.assets.taker.B],['90000000','20000000','10000000','80000000']);
   assert.equal(s.transactions.filter(t=>t.functionName==='fillOrder'&&t.state==='confirmed').length,1);await save(s,'01-scripted-filled');return {scenarioId:s.id,check:s.check};
 });
 await test('T02 incompatible private goals produce explicit no-deal',async()=>{
   const s=await run({expectedOutcome:'no_deal',agents:[{goal:{minBuy:'21'}},{goal:{maxPay:'20'}}]});assert.equal(s.check.status,'success');assert.equal(s.check.business_outcome,'no_deal');assert.equal(s.transactions.length,0);await save(s,'02-no-deal');return{scenarioId:s.id};
 });
 await test('T03 sequential continuous episode uses current balances and new order salt',async()=>{
   const a=await run();const b=await run({experimentMode:'continuous'});assert.equal(b.check.status,'success',JSON.stringify(b));
   assert.equal(b.before.assets.maker.A,a.after.assets.maker.A);assert.equal(b.after.assets.maker.A,'80000000');assert.notEqual(a.orderId,b.orderId);await save(b,'03-continuous');return {scenarioId:b.id};
 });
 await test('T11 manual pending blocks other runs until reconciliation',async()=>{
   const s=await run({automine:false});assert.equal(s.state,'pending');assert.equal(s.transactions[0].state,'pending');
   await api('/api/environment/reset',{},400);await api('/api/runs',{taskId:'transfer',mode:'scripted'},400);
   let state=s;for(let i=0;i<12&&state.state!=='completed';i++){await api(`/api/scenarios/${s.id}/mine`,{blocks:1,seconds:1});state=await done(s.id);}
   assert.equal(state.check.status,'success',JSON.stringify(state));await save(state,'04-manual-mining');return{scenarioId:s.id};
 });
 await test('T13 scenario exports verify without invoking exported code; old V0.13 API remains usable',async()=>{
   const s=await run();const b=await save(s,'05-export');const {createHash}=await import('node:crypto');const m=JSON.parse(b.files['manifest.json']);
   for(const [path,v]of Object.entries(m.files)){assert.equal(createHash('sha256').update(b.files[path]).digest('hex'),v.sha256);assert.equal(Buffer.byteLength(b.files[path]),v.bytes);}
   const legacy=await api('/api/runs',{taskId:'transfer',mode:'scripted'});assert.ok(legacy.runId);
   for(let i=0;i<300;i++){if(!(await api('/api/status')).busy)break;await wait(20);}
   const archived=await api('/api/runs/'+legacy.runId);assert.equal(archived.result.status,'success',JSON.stringify(archived.result));
   return {scene:s.id,legacyRunId:legacy.runId,manifestEntries:Object.keys(m.files).length};
 });
 await test('transaction pause and stop prevent an unbroadcast authorization; journal remains ordered',async()=>{
   const s=await run({pauseBeforeTransaction:true});assert.equal(s.state,'paused');assert.equal(s.paused.phase,'before_transaction');assert.equal(s.transactions.length,0);
   const stopped=await api(`/api/scenarios/${s.id}/stop`,{});assert.equal(stopped.state,'completed');assert.equal(stopped.transactions.length,0);
   const events=await api(`/api/scenarios/${s.id}/events`);assert.equal(new Set(events.map(e=>e.eventId)).size,events.length);events.forEach((e,i)=>assert.equal(e.logicalClock,i+1));
   await save(stopped,'08-stop-before-signing');return{scenarioId:s.id};
 });
 await test('global single step and scoped agent pauses do not accidentally run another step',async()=>{
   const s=await api('/api/scenarios',{manual:true});await api(`/api/scenarios/${s.id}/start`,{});
   assert.equal((await api(`/api/scenarios/${s.id}`)).steps,0);
   await api(`/api/scenarios/${s.id}/pause`,{agentId:'maker'});await api(`/api/scenarios/${s.id}/pause`,{agentId:'taker'});
   await api(`/api/scenarios/${s.id}/step`,{});let state;for(let i=0;i<100;i++){state=await api(`/api/scenarios/${s.id}`);if(state.state==='paused')break;await wait(20);}
   assert.equal(state.steps,0);await api(`/api/scenarios/${s.id}/resume`,{agentId:'maker'});await api(`/api/scenarios/${s.id}/step`,{});
   for(let i=0;i<100;i++){state=await api(`/api/scenarios/${s.id}`);if(state.steps===1)break;await wait(20);}assert.equal(state.steps,1);await api(`/api/scenarios/${s.id}/stop`,{});return {scenarioId:s.id};
 });
 // Protocol fixtures explicitly emulate model tool calls, never a real LLM benchmark.
 const sessions=new Map();
 modelServer=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const request=JSON.parse(body),user=JSON.parse(request.messages.find(m=>m.role==='user').content);const role=user.role,key=user.address;const n=sessions.get(key)??0;sessions.set(key,n+1);
   const inbox=request.messages.filter(m=>m.role==='user').flatMap(m=>{try{return JSON.parse(m.content).messages??[];}catch{return[];}}),last=kind=>inbox.filter(m=>m.kind===kind).at(-1);let name,args;
   if(request.model==='recovery-protocol-fixture'){
     const progress=request.messages.filter(m=>m.role==='user').map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).filter(v=>v?.source==='platform_verified_progress').at(-1);
     const successful=request.messages.filter(m=>m.role==='tool').map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).filter(v=>v&&!v.error);
     if(role==='maker'&&n===0){name='create_order';args={};}
     else if(role==='maker'&&n===1){name='inspect_order';args={};}
     else if(role==='maker'&&!progress.quote){name='send_message';args={recipient:'taker',kind:'quote',payload:{sellAmount:'10',buyAmount:'20'}};}
     else if(role==='taker'&&n===0){name='send_message';args={recipient:'maker',kind:'inquiry'};}
     else if(role==='taker'&&progress.stage==='need_quote_decision'){
       if(!sessions.get(key+':textOnly')){sessions.set(key+':textOnly',true);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({choices:[{message:{role:'assistant',content:'I accept this quote. '+JSON.stringify({kind:'accept',recipient:'maker',quoteId:progress.quote.quoteId})}}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}}));return;}
       name='send_message';args={recipient:'maker',kind:'accept',quoteId:progress.quote.quoteId};
     }else if(role==='maker'&&progress.stage==='maker_prepare_order'){
       name=successful.some(v=>v.functionName==='approve'||v.skipped)?'create_order':'approve_sell';args={};
     }else if(role==='maker'&&progress.orderId&&!successful.some(v=>v.kind==='order_ref')){name='send_message';args={recipient:'taker',kind:'order_ref',payload:{orderId:progress.orderId}};}
     else if(role==='taker'&&progress.allowedActions.includes('inspect_order')&&!progress.allowedActions.includes('fill_order')){name='inspect_order';args={};}
     else if(role==='taker'&&progress.allowedActions.includes('fill_order')){name=successful.some(v=>v.functionName==='approve'||v.skipped)?'fill_order':'approve_buy';args={};}
     else{name='wait';args={};}
     res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({model:'explicit-recovery-fixture',choices:[{message:{role:'assistant',tool_calls:[{id:'recover_'+n,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}}));return;
   }
   const counter=request.model==='counter-protocol-fixture';
   if((role==='maker'&&n===1&&!(counter?last('quote'):last('accept')))||(role==='taker'&&n===2&&!last('order_ref'))){
     sessions.set(key,n);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({choices:[{message:{role:'assistant',content:'Waiting for peer message.'}}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}));return;
   }
   if(role==='maker'){
     if(n===0){name='send_message';args={recipient:'taker',kind:'quote',payload:{sellAmount:'10',buyAmount:counter?'21':'20'}};}
     else if(counter&&n===1){name='send_message';args={recipient:'taker',kind:'accept',quoteId:last('quote').quoteId,payload:{accepted:true}};}
     else if(n===(counter?2:1)){name='approve_sell';args={};}else if(n===(counter?3:2)){name='create_order';args={};}
     else if(n===(counter?4:3)){const result=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1).content);name='send_message';args={recipient:'taker',kind:'order_ref',payload:{orderId:result.orderId}};}
     else{name='finish';args={};}
   }else{
     if(n===0){name='send_message';args={recipient:'maker',kind:'inquiry',payload:{request:'quote'}};}
     else if(n===1){name='send_message';args=counter?{recipient:'maker',kind:'quote',payload:{sellAmount:'10',buyAmount:'20'}}:{recipient:'maker',kind:'accept',quoteId:last('quote').quoteId,payload:{accepted:true}};}
     else{name=({2:'inspect_order',3:'approve_buy',4:'fill_order'})[n]??'finish';args={};}
   }
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({model:'explicit-protocol-fixture',choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'call_'+n,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}}));
 });await new Promise(r=>modelServer.listen(modelPort,'127.0.0.1',r));
 await test('T12/T14 two isolated model protocol sessions with duplicate cross-agent provider IDs',async()=>{
   const model={baseUrl:`http://127.0.0.1:${modelPort}/v1`,model:'protocol-fixture',apiKey:'fixture-secret-do-not-export'};
   const s=await run({mode:'llm',agents:[{model},{model}]});assert.equal(s.check.status,'success',JSON.stringify(s));
   const b=await save(s,'06-two-model-protocol-fixture');assert.equal(JSON.stringify(b).includes('fixture-secret-do-not-export'),false);
   const requests=Object.entries(b.files).filter(([p])=>p.startsWith('raw/blobs/')).map(([,t])=>JSON.parse(t)).filter(p=>p.request?.messages);
   assert.ok(requests.length>=8);assert.equal(s.agents.length,2);assert.notEqual(s.agents[0].agentRunId,s.agents[1].agentRunId);return{scenarioId:s.id,modelFixture:true,realLLM:false};
 });
 await test('counterquote is accepted by the other runtime and settles the revised terms',async()=>{
   sessions.clear();const model={baseUrl:`http://127.0.0.1:${modelPort}/v1`,model:'counter-protocol-fixture'};
   const s=await run({mode:'llm',agents:[{model},{model}]});assert.equal(s.check.status,'success',JSON.stringify(s.check));assert.equal(s.quote.proposer,'taker');assert.equal(s.quote.buyAmount,'20');
   assert.equal(s.messages.filter(m=>m.kind==='quote').length,2);await save(s,'09-counterquote-protocol-fixture');return {scenarioId:s.id,modelFixture:true,realLLM:false};
 });
 await test('V0142 missing-payload acceptance and premature tool errors recover without text being executed',async()=>{
   sessions.clear();const model={baseUrl:`http://127.0.0.1:${modelPort}/v1`,model:'recovery-protocol-fixture'};
   const s=await run({mode:'llm',agents:[{model},{model}]});assert.equal(s.check.status,'success',JSON.stringify(s));
   const b=await save(s,'10-empty-accept-recovery-fixture');const events=b.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse);
   const payloads=events.map(e=>({type:e.type,actor:e.agentId,p:JSON.parse(b.files[e.payloadRef.path])}));
   assert.ok(payloads.some(e=>e.type==='agent.error'&&e.p.error.includes('MUTUAL_ACCEPTANCE_REQUIRED')));
   assert.ok(payloads.some(e=>e.type==='agent.error'&&e.p.error.includes('ORDER_REQUIRED')));
   assert.equal(payloads.some(e=>e.type==='agent.error'&&e.p.error.includes('TOOL_MISSING_ARGUMENT')),false);
   const accepted=payloads.find(e=>e.type==='message.sent'&&e.p.kind==='accept');assert.deepEqual(accepted.p.payload,{});
   assert.ok(s.elapsedMs>0);assert.ok(s.startedAt&&s.endedAt);await wait(100);assert.equal((await api('/api/scenarios/'+s.id)).elapsedMs,s.elapsedMs);
   return {scenarioId:s.id,elapsedMs:s.elapsedMs,modelFixture:true,realLLM:false};
 });
}finally{
 await writeFile(artifactPath('v014-integration-results.json'),JSON.stringify({testEnvironment:'Windows x64 / local Anvil',realLLMTested:false,macOSTested:false,results,serverOutput:output},null,2));
 try{await api('/api/shutdown',{});}catch{}if(modelServer)await new Promise(r=>modelServer.close(r));server.kill();
}
