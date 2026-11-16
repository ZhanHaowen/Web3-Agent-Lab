import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {startTestnetFixture} from './testnet-fixture.mjs';

const rows=[],startedAt=new Date().toISOString();let fixture,modelServer;
const record=async(name,fn)=>{const started=performance.now();try{const detail=await fn();rows.push({name,status:'pass',durationMs:performance.now()-started,...detail});console.log('PASS '+name);}catch(e){rows.push({name,status:'fail',durationMs:performance.now()-started,error:String(e.message)});throw e;}};
const waitFor=async(fn)=>{for(let i=0;i<600;i++){const v=await fn();if(v)return v;await new Promise(r=>setTimeout(r,20));}throw Error('TEST_WAIT_TIMEOUT');};
let failure;
try{
 const output=process.env.TESTNET_TEST_OUTPUT??process.env.LAB_TESTNET_TEST_OUT;
 fixture=await startTestnetFixture({out:output?resolve(output):undefined,receiptTimeoutMs:500});
 const f=fixture;
 await record('HTTP isolation, independent token, origin, field and catalog restrictions',async()=>{
  assert.equal((await f.requestRaw('/status',{headers:{'x-testnet-token':'wrong'}})).status,403);
  assert.equal((await f.requestRaw('/status',{headers:{origin:'https://evil.invalid'}})).status,403);
  assert.equal((await f.requestRaw('/disconnect',{method:'POST',body:{},headers:{origin:''}})).status,403);
  assert.equal((await f.requestRaw('/connect',{method:'POST',body:{profileId:'base-sepolia',allowLoopback:true}})).status,400);
  assert.equal((await f.requestRaw('/connect',{method:'POST',body:{profileId:'solana-devnet',accountAddress:f.account}})).status,400);
  assert.equal((await f.requestRaw('/run?id=..%2Foutside')).status,400);
  const b=await f.request('/bootstrap');assert.equal(b.profiles.length,20);assert.equal(b.profiles.filter(p=>p.writeEnabled).length,6);assert.equal(b.tasks.length,5);
 });
 await record('Invalid precision and conflicting task parameters rejected before signing',async()=>{
  const before=f.counts.eth_sendRawTransaction??0;
  for(const input of [{amount:'0.0000001'},{amount:'1e6'},{amount:'-1'}])assert.equal((await f.requestRaw('/run',{method:'POST',body:{taskId:'transfer',mode:'scripted',taskParameters:input}})).status,400);
  assert.equal((await f.requestRaw('/run',{method:'POST',body:{taskId:'transfer',mode:'scripted',taskInput:'转账20 TokenA',taskParameters:{amount:'10'}}})).status,400);
  assert.equal(f.counts.eth_sendRawTransaction??0,before);
 });
 const taskRuns=[];
 for(const taskId of ['balance','transfer','approve','swap','swap_deposit'])await record('Five-task continuous scripted regression: '+taskId,async()=>{
  const {runId}=await f.request('/run',{taskId,mode:'scripted'},202),run=await f.waitRun(runId);taskRuns.push(runId);
  assert.equal(run.result.status,'success',JSON.stringify(run.result));assert.equal(run.config.experimentMode,'continuous');assert.equal(run.config.chain_execution,'isolated_evm_rpc');assert.equal(run.manifest.recording_status,'complete');
  assert.equal((await f.request('/verify',{id:runId})).valid,true);assert.ok(run.execution_trace);assert.ok(run.provenance_graph);
  const bundle=await f.request('/export?id='+runId);for(const file of ['derived/execution-trace.json','derived/provenance-graph.json','derived/provenance-graph.graphml','derived/nodes.csv','derived/relations.csv'])assert.ok(bundle.files[file]);
  const text=JSON.stringify(bundle);assert.ok(!text.includes(f.privateKey));assert.ok(!text.includes(f.rpcUrl));assert.ok(run.events.some(e=>e.type==='contract.call'));
  if(taskId!=='balance')assert.ok(run.events.some(e=>e.type==='tx.receipt'));
  return {runId,transactions:run.result.transactions.length};
 });
 await record('Read-only reconnect, saved manifest attach and query; writes denied',async()=>{
  await f.request('/disconnect',{});await f.connect({readonly:true});await f.request('/attach',{manifest:f.manifest});const s=await f.request('/status');assert.equal(s.writable,false);
  assert.equal((await f.requestRaw('/run',{method:'POST',body:{taskId:'transfer',mode:'scripted'}})).status,400);assert.equal((await f.requestRaw('/deploy',{method:'POST',body:{}})).status,400);
  const {runId}=await f.request('/run',{taskId:'balance',mode:'scripted'},202);assert.equal((await f.waitRun(runId)).result.status,'success');
  await f.request('/disconnect',{});await f.connect();await f.request('/attach',{manifest:f.manifest});return {runId};
 });
 await record('Pause before tool, concurrent experiment rejected, cancellation preserved',async()=>{
  const before=f.counts.eth_sendRawTransaction??0,{runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',pauseBeforeTool:true},202);
  await waitFor(()=>f.service.active?.state==='paused');assert.equal((await f.requestRaw('/run',{method:'POST',body:{taskId:'balance',mode:'scripted'}})).status,409);
  assert.equal((await f.requestRaw('/disconnect',{method:'POST',body:{}})).status,409);await f.request('/cancel',{id:runId},202);
  const run=await f.waitRun(runId);assert.equal(run.result.cancelled,true);assert.equal(run.manifest.recording_status,'complete');assert.equal(f.counts.eth_sendRawTransaction??0,before);assert.ok(run.events.some(e=>e.type==='control.paused'));
  assert.equal((await f.request('/verify',{id:runId})).valid,true);return {runId};
 });
 await record('Pause before transaction resumes exactly one prepared payment',async()=>{
  const before=f.counts.eth_sendRawTransaction??0,{runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',taskParameters:{amount:'1'},pauseBeforeTransaction:true},202);
  await waitFor(()=>f.service.active?.pause?.phase==='before_transaction');assert.equal(f.counts.eth_sendRawTransaction??0,before);await f.request('/resume',{id:runId},202);
  const run=await f.waitRun(runId);assert.equal(run.result.status,'success');assert.equal(f.counts.eth_sendRawTransaction,before+1);return {runId};
 });
 await record('Cancellation after preparation does not fabricate a broadcast or pending liability',async()=>{
  const before=f.counts.eth_sendRawTransaction??0,{runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',taskParameters:{amount:'1'},pauseBeforeTransaction:true},202);
  await waitFor(()=>f.service.active?.pause?.phase==='before_transaction');await f.request('/cancel',{id:runId},202);const run=await f.waitRun(runId);
  assert.equal(run.result.cancelled,true);assert.ok(run.events.some(e=>e.type==='tx.prepared'));assert.ok(!run.events.some(e=>e.type==='tx.intent'||e.type==='tx.broadcast'));assert.equal(run.lifecycle.unresolved.length,0);assert.equal(f.counts.eth_sendRawTransaction??0,before);
  const checked=await f.request('/recheck',{id:runId});assert.equal(checked.status,'failure');assert.equal(f.counts.eth_sendRawTransaction??0,before);assert.equal((await f.request('/status')).environment.unresolved.length,0);return {runId};
 });
 await record('Insufficient test-token funds retain a failed task and raw error without broadcasting',async()=>{
  const before=f.counts.eth_sendRawTransaction??0,{runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',taskParameters:{amount:'1000000000'}},202),run=await f.waitRun(runId);
  assert.equal(run.result.status,'failure');assert.equal(run.manifest.recording_status,'complete');assert.ok(run.events.some(e=>e.type==='tool.result'&&e.payload.error));assert.equal(f.counts.eth_sendRawTransaction??0,before);assert.equal((await f.request('/verify',{id:runId})).valid,true);return {runId};
 });
 await record('Pending transaction survives service restart and read-only recheck never resends',async()=>{
  await f.controlRpc('evm_setAutomine',[false]);const before=f.counts.eth_sendRawTransaction??0;
  const {runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',taskParameters:{amount:'1'}},202),pending=await f.waitRun(runId);
  assert.ok(['pending','unknown'].includes(pending.result.status));assert.equal(f.counts.eth_sendRawTransaction,before+1);const rawManifest=JSON.stringify(pending.manifest);
  await f.restart();await f.connect();await f.request('/attach',{manifest:f.manifest});assert.ok((await f.request('/runs')).runs.some(r=>r.runId===runId));
  assert.equal((await f.requestRaw('/run',{method:'POST',body:{taskId:'transfer',mode:'scripted'}})).status,409);
  await f.controlRpc('evm_mine');await f.controlRpc('evm_setAutomine',[true]);
  const checked=await f.request('/recheck',{id:runId});assert.equal(checked.status,'success',JSON.stringify(checked));assert.equal(checked.check_mode,'read_only_live_reconciliation');
  await f.request('/recheck',{id:runId});assert.equal(f.counts.eth_sendRawTransaction,before+1);assert.equal(JSON.stringify((await f.request('/run?id='+runId)).manifest),rawManifest);assert.equal((await f.request('/verify',{id:runId})).valid,true);
  return {runId};
 });
 await record('Accepted broadcast with lost HTTP response retains hash and only reconciles',async()=>{
  const before=f.counts.eth_sendRawTransaction??0;f.faults.dropNextBroadcast=true;
  const {runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',taskParameters:{amount:'1'}},202),run=await f.waitRun(runId);
  assert.equal(f.counts.eth_sendRawTransaction,before+1);assert.ok(run.events.some(e=>e.type==='tx.status'&&e.payload.error==='BROADCAST_RESULT_UNKNOWN'));assert.ok(run.events.some(e=>e.type==='tx.intent'&&/^0x[0-9a-f]{64}$/i.test(e.payload.hash)));
  assert.equal((await f.request('/recheck',{id:runId})).status,'success');assert.equal(f.counts.eth_sendRawTransaction,before+1);return {runId};
 });
 await record('HTTP model transaction fixture links task-model-tool-contract-transaction and marks unavailable trace',async()=>{
  const apiKey='testnet-secret-model-canary-key',calls=[];
  modelServer=createServer(async(req,res)=>{const parts=[];for await(const part of req)parts.push(part);const request=JSON.parse(Buffer.concat(parts).toString());calls.push({path:req.url,request});
   const step=calls.length;
   const message=step>=3?{role:'assistant',content:'The observed transfer is complete; use the independent checker.'}:{role:'assistant',content:null,tool_calls:[{id:'fixture-call-'+step,type:'function',function:step===1?{name:'get_state',arguments:'{}'}:{name:'transfer_token',arguments:'{"token":"A","amount":"1","recipient":"recipient"}'}}]};
   res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'fixture-'+step,object:'chat.completion',model:'HTTP-PROTOCOL-FIXTURE-NOT-REAL-LLM',choices:[{index:0,message,finish_reason:step>=3?'stop':'tool_calls'}],usage:{prompt_tokens:12,completion_tokens:7,total_tokens:19},metadata:{secret_echo:apiKey}}));
  });await new Promise(r=>modelServer.listen(0,'127.0.0.1',r));
  f.faults.blockTrace=true;
  const {runId}=await f.request('/run',{taskId:'transfer',taskParameters:{amount:'1'},mode:'llm',model:{provider:'api',baseUrl:`http://127.0.0.1:${modelServer.address().port}/v1`,model:'protocol-fixture',apiKey,maxSteps:4}},202),run=await f.waitRun(runId);
  f.faults.blockTrace=false;
  assert.equal(run.result.status,'success',JSON.stringify(run.result));assert.equal(calls.length,3);assert.ok(run.events.some(e=>e.type==='model.request'));assert.ok(run.events.some(e=>e.type==='model.response'));
  const bundle=await f.request('/export?id='+runId),serialized=JSON.stringify(bundle);assert.ok(!serialized.includes(apiKey));assert.ok(serialized.includes('HTTP-PROTOCOL-FIXTURE-NOT-REAL-LLM'));assert.ok(run.execution_trace.model_calls.length>=2);
  const graph=JSON.parse(bundle.files['derived/provenance-graph.json']),nodeMap=new Map(graph.nodes.map(n=>[n.id,n]));
  for(const [source,target,type] of [['task','model_call','supplies_task_input'],['model_call','tool_call','requests_tool'],['tool_call','contract_call','invokes_contract'],['contract_call','transaction','submits_transaction']])assert.ok(graph.edges.some(e=>e.type===type&&nodeMap.get(e.source)?.type===source&&nodeMap.get(e.target)?.type===target&&e.source_events.length),`Missing ${source} -> ${target}`);
  assert.ok(run.events.some(e=>e.type==='tx.trace_unavailable'));assert.equal(run.execution_trace.call_frames.length,0);assert.ok(run.execution_trace.transactions.every(tx=>tx.trace_available===false&&tx.missing.includes('evm_call_trace')));
  assert.ok(calls[0].request.messages.some(m=>m.role==='system'&&m.content.includes('public EVM testnet')));
  await new Promise(r=>modelServer.close(r));modelServer=null;return {runId,modelCalls:calls.length,evidence:'Protocol fixture, not model capability evidence'};
 });
 await record('Historical recheck after later transactions does not invent success or overwrite raw evidence',async()=>{
  const id=taskRuns[1],old=await f.request('/run?id='+id),before=f.counts.eth_sendRawTransaction,manifest=JSON.stringify(old.manifest);
  const result=await f.request('/recheck',{id});assert.notEqual(result.status,'success');assert.equal(f.counts.eth_sendRawTransaction,before);
  const checked=await f.request('/run?id='+id);assert.equal(JSON.stringify(checked.manifest),manifest);assert.equal((await f.request('/verify',{id})).valid,true);return {runId:id,recheckStatus:result.status};
 });
 await record('Offline task recheck reproduces captured result without any RPC after live state changed',async()=>{
  const id=taskRuns[1],counts=JSON.stringify(f.counts),result=await f.request('/check-offline',{id});assert.equal(result.status,'success');assert.equal(result.check_mode,'offline');assert.equal(result.costs.executionGasOnly,true);assert.match(result.costs.gasCostScope,/excludes/);assert.equal(JSON.stringify(f.counts),counts);assert.equal((await f.request('/verify',{id})).valid,true);return {runId:id};
 });
 for(const [fault,label] of [['checkerBlockHashMismatch','reorged anchor'],['checkerBlockUnavailable','missing RPC block']])await record('Offline recheck retains unknown external evidence: '+label,async()=>{
  const chain=f.service.chain,check=chain.check;
  chain.check=async function(...args){f.faults[fault]=true;try{return await check.apply(this,args);}finally{f.faults[fault]=false;}};
  let runId,run;try{({runId}=await f.request('/run',{taskId:'transfer',mode:'scripted',taskParameters:{amount:'1'}},202));run=await f.waitRun(runId);}finally{chain.check=check;f.faults[fault]=false;}
  assert.equal(run.result.status,'unknown');assert.equal(run.manifest.recording_status,'complete');assert.equal(run.events.find(e=>e.type==='check.evidence').payload.options.externalEvidenceVerified,false);
  const counts=JSON.stringify(f.counts),checked=await f.request('/check-offline',{id:runId});assert.equal(checked.status,'unknown');assert.equal(checked.validationStatus,'evidence_missing');assert.equal(checked.costs.executionGasOnly,true);assert.equal(JSON.stringify(f.counts),counts);assert.equal((await f.request('/verify',{id:runId})).valid,true);
  return {runId,source:'real isolated EVM execution plus deliberately faulted checker RPC'};
 });
 await record('Service RPC contains no Anvil privileges or unlocked-account transaction requests',async()=>{
  assert.ok(!Object.keys(f.counts).some(method=>/^(anvil_|evm_)/.test(method)||method==='eth_sendTransaction'));assert.ok(f.counts.eth_sendRawTransaction>0);
  const manifests=await f.request('/manifests');assert.ok(manifests.manifests.length);return {rpcMethods:Object.keys(f.counts).sort()};
 });
}catch(e){failure=e;console.error(e.stack??e);process.exitCode=1;}
finally{
 if(modelServer)await new Promise(r=>modelServer.close(r));if(fixture)await fixture.close();
 const report={schema:'web3-testnet-service-integration-v1',startedAt,completedAt:new Date().toISOString(),scope:'Isolated Anvil chain 84532 behind standard-RPC-only proxy. No public transactions, faucet claims, user keys or commercial model calls.',passed:rows.filter(r=>r.status==='pass').length,failed:rows.filter(r=>r.status==='fail').length,tests:rows,...(failure?{fatalError:String(failure.message)}:{})};
 if(fixture){await writeFile(join(fixture.out,'report.json'),JSON.stringify(report,null,2));console.log('REPORT '+join(fixture.out,'report.json'));}else console.log(JSON.stringify(report));
}
