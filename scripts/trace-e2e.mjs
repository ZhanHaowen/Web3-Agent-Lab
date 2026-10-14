/** Exercise the packaged trace/graph API against an isolated, actual Anvil instance. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base=`http://127.0.0.1:${process.env.LAB_PORT||4437}`;
const health=await (await fetch(base+'/api/health')).json();
const sha=s=>createHash('sha256').update(s).digest('hex');
async function api(route,body,expected=200){const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-lab-token':health.csrfToken},...(body===undefined?{}:{body:JSON.stringify(body)})});const j=await r.json();assert.equal(r.status,expected,JSON.stringify(j));return j;}
async function waitUntil(fn){for(let i=0;i<450;i++){const v=await fn();if(v)return v;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out');}
async function run(taskId,options={}){const {runId}=await api('/api/runs',{taskId,mode:'scripted',dataOrigin:'trace_acceptance',...options},202);await waitUntil(async()=>{const s=await api('/api/status');return !s.busy&&s.active?.runId===runId;});return api('/api/runs/'+runId);}
if(!(await api('/api/status')).ready)await api('/api/environment/init',{});
const results=[];
async function test(name,fn){const detail=await fn();results.push({name,passed:true,...detail});console.log('PASS '+name);}
try {
 for(const taskId of ['balance','transfer','approve','swap','swap_deposit'])await test('trace_'+taskId,async()=>{
   const r=await run(taskId);assert.equal(r.result.status,'success');assert.ok(!r.result.trace_export_error);
   const id=r.config.run_id,trace=await api(`/api/runs/${id}/trace`),graph=await api(`/api/runs/${id}/graph`);
   assert.equal(graph.format,'web3-agent-provenance-graph');assert.equal(trace.provenance.integrity,'raw_manifest_verified_before_derivation');
   const ids=new Set(graph.nodes.map(n=>n.id));assert.equal(ids.size,graph.nodes.length);for(const e of graph.edges)assert.ok(ids.has(e.source)&&ids.has(e.target));
   assert.ok(!graph.warnings.some(w=>w.code==='UNRESOLVED_GRAPH_ENDPOINT'));
   for(const c of trace.contract_calls){assert.ok(c.contractCallId);assert.ok(trace.tool_calls.some(t=>t.toolCallId===c.toolCallId));assert.ok(c.function.signature);assert.ok(c.source_events.some(e=>e.type==='contract.call'));}
   if(taskId==='balance'){assert.equal(trace.transactions.length,0);assert.equal(trace.contract_calls.length,1);assert.equal(trace.contract_calls[0].function.name,'balanceOf');assert.equal(trace.contract_calls[0].kind,'read');}
   if(taskId==='swap_deposit'){assert.ok(trace.call_frames.some(f=>f.parentId));assert.ok(trace.contract_calls.some(c=>c.kind==='read'));assert.ok(trace.contract_calls.some(c=>c.function.name==='deposit'));}
   const exported=await api(`/api/runs/${id}/export`);const m=JSON.parse(exported.files['derived/execution-trace-manifest.json']);
   for(const [name,meta]of Object.entries(m.files))assert.equal(sha(exported.files[name]),meta.sha256,name);
   assert.equal(m.source_manifest_sha256,sha(exported.files['manifest.json']));
   assert.deepEqual(JSON.parse(exported.files['derived/provenance-graph.json']),graph);
   const xmlResponse=await fetch(`${base}/api/runs/${id}/graph?format=graphml`);assert.equal(xmlResponse.status,200);assert.match(xmlResponse.headers.get('content-type'),/graphml/);
   assert.equal(await xmlResponse.text(),exported.files['derived/provenance-graph.graphml']);
   const md=await fetch(`${base}/api/runs/${id}/trace?format=markdown`);assert.equal(md.status,200);assert.equal(await md.text(),exported.files['derived/execution-trace.md']);
   const second=await api(`/api/runs/${id}/export`);assert.equal(second.files['derived/provenance-graph.json'],exported.files['derived/provenance-graph.json']);
   if(taskId==='swap_deposit'){await mkdir('data/trace-qa',{recursive:true});for(const name of ['provenance-graph.json','provenance-graph.graphml','execution-trace.md'])await writeFile('data/trace-qa/'+name,exported.files['derived/'+name]);await writeFile('data/trace-qa/bundle.json',JSON.stringify(exported));}
   return {runId:id,tools:trace.tool_calls.length,contracts:trace.contract_calls.length,transactions:trace.transactions.length,frames:trace.call_frames.length,nodes:graph.nodes.length,edges:graph.edges.length};
 });
 await test('read_raw_and_overridden_results_stay_distinct',async()=>{const r=await run('balance',{toolOverrides:{get_balance:{balance:'999'}}});const t=r.execution_trace.tool_calls[0];assert.equal(t.raw_result.balance,'100000000');assert.equal(t.visible_result.balance,'999');assert.equal(t.overridden,true);assert.equal(r.execution_trace.transactions.length,0);return {runId:r.config.run_id};});
 await test('revert_keeps_failed_transaction_and_internal_call_evidence',async()=>{const r=await run('transfer',{faultMode:'transfer_revert'});assert.equal(r.result.status,'failure');assert.ok(r.execution_trace.transactions.some(t=>t.status==='reverted'));assert.ok(r.execution_trace.contract_calls.some(c=>c.status==='reverted'));return {runId:r.config.run_id};});
 await test('pending_trace_remains_original_after_live_reconciliation',async()=>{await api('/api/environment/automine',{enabled:false});try{const r=await run('transfer');const id=r.config.run_id;assert.equal(r.result.status,'pending');const before=await api(`/api/runs/${id}/graph`);await api('/api/environment/mine',{blocks:1,seconds:1});assert.equal((await api(`/api/runs/${id}/check`,{mode:'live'})).status,'success');assert.deepEqual(await api(`/api/runs/${id}/graph`),before);return {runId:id};}finally{await api('/api/environment/automine',{enabled:true});}});
 await test('paused_export_rejected_and_cancelled_tool_does_not_fabricate_contract',async()=>{const {runId}=await api('/api/runs',{taskId:'transfer',mode:'scripted',pauseBeforeTool:true},202);await waitUntil(async()=>{const s=await api('/api/status');return s.active?.state==='paused';});await api(`/api/runs/${runId}/trace`,undefined,400);await api('/api/control',{action:'cancel'});await waitUntil(async()=>!(await api('/api/status')).busy);const r=await api('/api/runs/'+runId);assert.equal(r.execution_trace.contract_calls.length,0);assert.equal(r.execution_trace.transactions.length,0);return {runId};});
 await test('cancelled_before_submission_is_preparation_not_a_broadcast_edge',async()=>{const {runId}=await api('/api/runs',{taskId:'transfer',mode:'scripted',pauseBeforeTransaction:true},202);await waitUntil(async()=>{const s=await api('/api/status');return s.active?.state==='paused';});await api('/api/control',{action:'cancel'});await waitUntil(async()=>!(await api('/api/status')).busy);const r=await api('/api/runs/'+runId);assert.equal(r.execution_trace.contract_calls.length,1);assert.equal(r.execution_trace.contract_calls[0].status,'error');assert.ok(!r.events.some(e=>e.type==='tx.broadcast'));assert.ok(!r.execution_graph.edges.some(e=>e.type==='submits_transaction'));assert.ok(r.execution_graph.edges.some(e=>e.type==='prepares_transaction'));return {runId};});
} catch(error){results.push({name:'acceptance',passed:false,error:error.message});console.error(error);process.exitCode=1;}
await mkdir('docs',{recursive:true});await writeFile('docs/trace-e2e-results.json',JSON.stringify({version:health.version.displayVersion,releaseRevision:health.version.releaseRevision,sourceHash:health.version.sourceHash,testedAt:new Date().toISOString(),realModelTested:false,results,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length},null,2));
