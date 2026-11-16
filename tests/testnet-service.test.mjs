import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {getEventListeners} from 'node:events';
import {TestnetService} from '../src/testnet/service.mjs';
import {loadTestnetLib} from './testnet-fixture.mjs';

const key='0x'+'12'.repeat(32),address='0x'+'ab'.repeat(20),recipient='0x'+'cd'.repeat(20),hash='0x'+'11'.repeat(32);
const base=await mkdtemp(join(tmpdir(),'web3-testnet-service-unit-')),realLib=await loadTestnetLib(base);
class FakeChain {
 constructor(options){this.options=options;this.transactions=[];this.observations=[];this.metadata={profileId:'base-sepolia',chainId:84532,chainInstanceId:'fixture',deploymentId:'fixture',chain_execution:'isolated_evm_rpc',accounts:{agent:address,recipient},contracts:{tokenA:address,tokenB:recipient,amm:address,vault:recipient},unresolved:[]};}
 async connect(){return this.env();}env(){return this.metadata;}async shutdown(){this.closed=true;}
 async deploy(){return {fixture:true};}async attach(){return this.env();}getManifest(){return {fixture:true};}
 beginRunCapture(){this.transactions=[];this.observations=[];}
 async state(){return {chainId:84532,chainInstanceId:'fixture',blockNumber:'1',blockHash:hash,nonce:0,timestamp:'1',addresses:{agent:address,recipient},balances:{agentA:'100000000',agentB:'0'},allowances:{ammA:'0',vaultB:'0'},shares:'0',reserves:{A:'10000000000',B:'10000000000'}};}
 async check(taskId,before,after,transactions,agentFinal){return {status:'success',assertions:[],evidence:{before,after,transactions,agentFinal,observations:this.observations},costs:{transactionAttempts:0,gasUsed:'0'}};}
}
async function fixture(t,options={}){
 const out=await mkdtemp(join(base,'case-')),lib={...realLib,runAgent:async({emit})=>{await emit('test.protocol_fixture',{scope:'unit fixture, no model or chain execution'});return {final:'fixture',modelCalls:0,toolCalls:0,usage:{totalTokens:null}};},...options.lib};
 const service=new TestnetService({root:resolve('.'),data:out,port:4317,chainFactory:args=>new FakeChain(args),...options,lib});
 // Ensure a test-provided runner does not replace the rest of the injected library.
 service.lib=lib;
 await service.init();await service.connect({profileId:'base-sepolia',rpcUrl:'https://rpc.invalid/secret-endpoint-canary',privateKey:key,recipient});await service.attach({manifest:{fixture:true}});
 t.after(()=>service.shutdown());return {service,out,lib};
}
const localModel={provider:'local',model:'UNIT-LOCAL-PROTOCOL-FIXTURE',localRuntime:{modelSha256:'fixture-model',runtimeSha256:'fixture-runtime'},baseUrl:'http://127.0.0.1:9999/v1'};

test('managed local cold start resolves before the run guard, while execution retains runtime evidence',async t=>{
 let s,resolves=0,captures=0;
 const f=await fixture(t,{modelResolver:async m=>{resolves++;assert.equal(s.busy,false,'cold-start guard must be idle');return {...m,...localModel};},runtimeEvidenceCursor:()=>({offset:7}),captureRuntimeEvidence:async(_m,cursor)=>{captures++;assert.deepEqual(cursor,{offset:7});return {scope:'UNIT_RUNTIME_FIXTURE',stdout:'retained',stderr:'retained'};}});s=f.service;
 const started=await s.start({taskId:'balance',mode:'llm',model:{provider:'local'}});await s.operation.promise;const run=await s.readRun(started.runId);
 assert.equal(resolves,1);assert.equal(captures,1);assert.equal(run.result.status,'success');assert.ok(run.events.some(e=>e.type==='model.runtime_evidence'&&e.payload.scope==='UNIT_RUNTIME_FIXTURE'));assert.ok(run.config.model.systemPrompt.includes('public EVM testnet'));
});
test('two asynchronous model preparations admit exactly one active run',async t=>{
 let releasePrepare,entered=0,releaseAgent;const preparation=new Promise(r=>releasePrepare=r),agent=new Promise(r=>releaseAgent=r);
 const {service:s}=await fixture(t,{modelResolver:async m=>{entered++;await preparation;return m;},lib:{runAgent:async()=>{await agent;return {final:'fixture'};}}});
 const model={provider:'api',baseUrl:'https://model.invalid/v1',model:'fixture'},a=s.start({taskId:'balance',mode:'llm',model}),b=s.start({taskId:'balance',mode:'llm',model});
 while(entered<2)await new Promise(r=>setTimeout(r,1));releasePrepare();const results=await Promise.allSettled([a,b]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.message==='TESTNET_BUSY').length,1);releaseAgent();await s.operation.promise;
});
test('environment replaced during model preparation cannot silently execute on the new connection',async t=>{
 let entered,release;const started=new Promise(r=>entered=r),wait=new Promise(r=>release=r);
 const {service:s}=await fixture(t,{modelResolver:async m=>{entered();await wait;return m;}});
 const pending=s.start({taskId:'balance',mode:'llm',model:{provider:'api',baseUrl:'https://model.invalid/v1',model:'fixture'}});await started;
 await s.connect({profileId:'base-sepolia',accountAddress:address,rpcUrl:'https://other.invalid'});await s.attach({manifest:{fixture:true}});release();await assert.rejects(pending,/ENVIRONMENT_CHANGED/);assert.equal(s.busy,false);assert.equal((await s.list()).runs.length,0);
});
test('model/tool runtime failure is sealed, retained and exported instead of disappearing',async t=>{
 const {service:s}=await fixture(t,{lib:{runAgent:async()=>{throw Error('PROTOCOL_FIXTURE_FAILURE');}}});
 const {runId}=await s.start({taskId:'balance',mode:'scripted'});await s.operation.promise;const run=await s.readRun(runId);
 assert.equal(run.result.run_error,'PROTOCOL_FIXTURE_FAILURE');assert.equal(run.manifest.recording_status,'complete');assert.ok(run.events.some(e=>e.type==='run.error'));assert.equal((await s.verify({id:runId})).valid,true);assert.ok((await s.export(runId)).files['derived/execution-trace.json']);
});
test('missing managed runtime evidence forces unknown outcome and retains the capture failure',async t=>{
 const {service:s}=await fixture(t,{modelResolver:async()=>localModel,captureRuntimeEvidence:async()=>null});
 const {runId}=await s.start({taskId:'balance',mode:'llm',model:{provider:'local'}});await s.operation.promise;const run=await s.readRun(runId);
 assert.equal(run.result.status,'unknown');assert.equal(run.result.runtime_evidence_error,'LOCAL_RUNTIME_EVIDENCE_UNAVAILABLE');assert.ok(run.events.some(e=>e.type==='model.runtime_evidence_error'));assert.equal(run.manifest.recording_status,'complete');
});
test('shutdown cancels a paused task, seals its trace and clears signing availability',async t=>{
 const {service:s}=await fixture(t,{lib:{runAgent:async opts=>{await opts.beforeTool('get_balance',{token:'A'},'fixture-call');return {final:'unexpected'};}}});
 const {runId}=await s.start({taskId:'balance',mode:'scripted',pauseBeforeTool:true});while(s.active?.state!=='paused')await new Promise(r=>setTimeout(r,2));await s.shutdown();
 const run=await s.readRun(runId);assert.equal(run.result.cancelled,true);assert.equal(run.manifest.recording_status,'complete');assert.equal(s.connected,false);assert.equal(s.writable,false);assert.equal(s.busy,false);
});
test('process restart marks an unfinished lifecycle unknown without rewriting raw evidence',async t=>{
 const {service:s,out,lib}=await fixture(t),id=randomUUID(),runDir=join(s.data,'runs',id);await mkdir(runDir);await writeFile(join(runDir,'config.json'),'{}');const raw='not rewritten\n';await writeFile(join(runDir,'events.jsonl'),raw);
 await writeFile(join(s.data,'states',id+'.json'),JSON.stringify({runId:id,state:'running',status:'pending',unresolved:[{hash,status:'unknown'}]}));
 const resumed=new TestnetService({root:resolve('.'),data:out,lib,chainFactory:args=>new FakeChain(args)});t.after(()=>resumed.shutdown());await resumed.init();
 const state=JSON.parse(await readFile(join(s.data,'states',id+'.json'),'utf8'));assert.equal(state.state,'interrupted');assert.equal(state.status,'unknown');assert.equal(await readFile(join(runDir,'events.jsonl'),'utf8'),raw);
});

test('resume while the paused event is still writing is accepted without executing before the record is durable',async t=>{
 const {service:s}=await fixture(t);let releaseWrite,continued=0;const writing=new Promise(r=>releaseWrite=r),records=[];
 const active={runId:randomUUID(),state:'running',pause:null,pauseRequested:false,abort:new AbortController(),gate:null};s.active=active;
 const recorder={emit:async(type)=>{if(type==='control.paused')await writing;records.push(type);}};
 const pending=s.gate(active,recorder,'before_transaction',{fixture:true},true).then(()=>{continued++;});
 assert.equal(s.status().active.state,'paused');assert.equal(typeof active.gate,'function');
 const resumed=s.control('resume',{id:active.runId});assert.equal(resumed.state,'running');assert.equal(s.status().active.pause,null);
 assert.throws(()=>s.control('resume',{id:active.runId}),/RUN_NOT_PAUSED/);
 await new Promise(r=>setImmediate(r));assert.equal(continued,0);assert.deepEqual(records,[]);
 releaseWrite();await pending;assert.equal(continued,1);assert.deepEqual(records,['control.paused','control.resumed']);
 assert.equal(active.gate,null);assert.equal(getEventListeners(active.abort.signal,'abort').length,0);s.active=null;
});

test('cancellation during the paused event write cannot execute or emit resumed and removes its listener',async t=>{
 const {service:s}=await fixture(t);let releaseWrite,continued=0;const writing=new Promise(r=>releaseWrite=r),records=[];
 const active={runId:randomUUID(),state:'running',pause:null,pauseRequested:false,abort:new AbortController(),gate:null};s.active=active;
 const pending=s.gate(active,{emit:async type=>{if(type==='control.paused')await writing;records.push(type);}},'before_transaction',{},true).then(()=>{continued++;});
 const rejected=assert.rejects(pending,/RUN_CANCELLED/);s.control('cancel',{id:active.runId});
 assert.equal(active.state,'cancelling');assert.equal(active.gate,null);assert.equal(active.pause,null);
 await new Promise(r=>setImmediate(r));assert.equal(continued,0);releaseWrite();await rejected;
 assert.deepEqual(records,['control.paused']);assert.equal(continued,0);assert.equal(getEventListeners(active.abort.signal,'abort').length,0);s.active=null;
});

test('failed paused-event persistence prevents execution after early resume and clears the gate',async t=>{
 const {service:s}=await fixture(t);let failWrite,continued=0;const writing=new Promise((_r,reject)=>failWrite=reject),records=[];
 const active={runId:randomUUID(),state:'running',pause:null,pauseRequested:false,abort:new AbortController(),gate:null};s.active=active;
 const pending=s.gate(active,{emit:async type=>{if(type==='control.paused')await writing;records.push(type);}},'before_transaction',{},true).then(()=>{continued++;});
 const rejected=assert.rejects(pending,/PAUSE_RECORD_WRITE_FAILED/);s.control('resume',{id:active.runId});failWrite(Error('PAUSE_RECORD_WRITE_FAILED'));await rejected;
 assert.equal(continued,0);assert.deepEqual(records,[]);assert.equal(active.gate,null);assert.equal(active.pause,null);assert.equal(getEventListeners(active.abort.signal,'abort').length,0);s.active=null;
});

test('cancellation while the resumed event is writing still prevents transaction continuation',async t=>{
 const {service:s}=await fixture(t);let releaseWrite,enteredWrite,continued=0;const writing=new Promise(r=>releaseWrite=r),entered=new Promise(r=>enteredWrite=r);
 const active={runId:randomUUID(),state:'running',pause:null,pauseRequested:false,abort:new AbortController(),gate:null};s.active=active;
 const pending=s.gate(active,{emit:async type=>{if(type==='control.resumed'){enteredWrite();await writing;}}},'before_transaction',{},true).then(()=>{continued++;});
 const rejected=assert.rejects(pending,/RUN_CANCELLED/);s.control('resume',{id:active.runId});await entered;s.control('cancel',{id:active.runId});releaseWrite();await rejected;
 assert.equal(continued,0);assert.equal(active.state,'cancelling');assert.equal(active.gate,null);assert.equal(getEventListeners(active.abort.signal,'abort').length,0);s.active=null;
});
