import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Recorder, Redactor, exportRun, readExecutionTrace, saveExecutionTrace, sha256 } from '../src/store.js';
import { buildProvenanceGraph, renderGraphML, validateProvenanceGraph } from '../src/graph.js';

const token='0x'+'11'.repeat(20), account='0x'+'22'.repeat(20);
test('export includes a verified deterministic graph, detailed trace views and immutable original records',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'web3-graph-')); const redactor=new Redactor();redactor.add('trace-private-test-secret');
  const recorder=new Recorder(dir,redactor);
  await recorder.start({taskId:'balance',task:{id:'balance',input:'查询余额',allowedTools:['get_balance']},mode:'llm',environment:{chainId:31337,contracts:{tokenA:token},accounts:{agent:account}},apiKey:'trace-private-test-secret'});
  await recorder.emit('state.before',{chainId:31337,chainInstanceId:'test-epoch',blockNumber:'7',blockHash:'0x'+'33'.repeat(32),balances:{agentA:'100000000'}});
  await recorder.emit('agent.start',{mode:'llm',taskId:'balance',input:'查询余额'});
  await recorder.emit('model.request',{request:{model:'fixture',messages:[{role:'user',content:'查询余额 trace-private-test-secret'}]}},{modelCallId:'model-1'});
  await recorder.emit('model.response',{status:200,response:{choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'tool-1',type:'function',function:{name:'get_balance',arguments:'{"token":"A"}'}}]}}]}},{modelCallId:'model-1'});
  const links={modelCallId:'model-1',toolCallId:'tool-1'};
  await recorder.emit('tool.call',{name:'get_balance',arguments:'{"token":"A"}'},links);
  await recorder.emit('tool.started',{name:'get_balance',args:{token:'A'}},links);
  await recorder.emit('contract.call',{callId:'read-1',kind:'read',tool:'get_balance',chainId:31337,contract:{address:token,label:'tokenA'},function:{name:'balanceOf',signature:'balanceOf(address)',selector:'0x70a08231',args:[account]},request:{to:token,blockNumber:'7',blockHash:'0x'+'33'.repeat(32)}},{...links,contractCallId:'read-1'});
  await recorder.emit('contract.result',{callId:'read-1',kind:'read',status:'success',result:'100000000',duration_ms:2},{...links,contractCallId:'read-1'});
  await recorder.emit('tool.result',{name:'get_balance',raw:{balance:'100000000'},visible:{balance:'999'},overridden:true},links);
  await recorder.emit('model.request',{request:{model:'fixture',messages:[{role:'tool',tool_call_id:'tool-1',content:'999'}]}},{modelCallId:'model-2'});
  await recorder.emit('state.after',{chainId:31337,chainInstanceId:'test-epoch',blockNumber:'7',blockHash:'0x'+'33'.repeat(32),balances:{agentA:'100000000'}});
  await recorder.seal();
  const original=await readFile(join(recorder.folder,'events.jsonl'),'utf8');
  await saveExecutionTrace(dir,recorder.runId);
  const a=await exportRun(dir,recorder.runId),b=await exportRun(dir,recorder.runId);
  assert.deepEqual(a.files,b.files);
  const graph=JSON.parse(a.files['derived/provenance-graph.json']);validateProvenanceGraph(graph);
  assert.equal(graph.format,'web3-agent-provenance-graph');assert.equal(graph.directed,true);assert.equal(graph.multigraph,true);
  for(const type of ['task','model_call','tool_call','contract_call','contract','state'])assert.ok(graph.nodes.some((n:any)=>n.type===type),type);
  assert.equal(graph.nodes.filter((n:any)=>n.type==='transaction').length,0,'a read cannot fabricate a transaction');
  assert.ok(graph.edges.some((e:any)=>e.type==='invokes_address'));
  assert.ok(graph.edges.some((e:any)=>e.type==='has_initial_state'));
  const tool=graph.nodes.find((n:any)=>n.type==='tool_call');assert.equal(tool.attributes.raw_result.balance,'100000000');assert.equal(tool.attributes.visible_result.balance,'999');
  assert.ok(graph.edges.some((e:any)=>e.source===tool.id&&graph.nodes.find((n:any)=>n.id===e.target)?.type==='model_call'),'explicit tool response references connect into the next model call');
  assert.ok(!JSON.stringify(a).includes('trace-private-test-secret'));
  assert.equal(a.files['events.jsonl'],original);
  const viewManifest=JSON.parse(a.files['derived/execution-trace-manifest.json']);
  for(const [name,expected] of Object.entries(viewManifest.files) as any)assert.equal(sha256(a.files[name]),expected.sha256,name);
  assert.equal(viewManifest.source_manifest_sha256,sha256(a.files['manifest.json']));
  assert.ok(a.files['derived/provenance-graph.graphml'].includes('edgedefault="directed"'));
  assert.equal(a.files['derived/trace-events.jsonl'].trim().split('\n').length,12);
  await writeFile(join(dir,'derived',recorder.runId,'execution-trace.json'),'{}');
  assert.deepEqual((await exportRun(dir,recorder.runId)).files['derived/execution-trace.json'],a.files['derived/execution-trace.json'],'stale derived files are regenerated from raw evidence');
  await writeFile(join(recorder.folder,'config.json'),'{}');
  await assert.rejects(readExecutionTrace(dir,recorder.runId),/VALID_SEALED/);
});

test('graph remains directed with parallel relations, escapes XML and labels temporal order separately',()=>{
  const trace:any={run_id:'run-one',task:{node_id:'task:<&"',id:'<unsafe>&"中文'},provenance:{},model_calls:[],tool_calls:[{id:'tool:1',name:'get_state',source_events:[]}],contract_calls:[],transactions:[],call_frames:[],edges:[{id:'a',from:'task:<&"',to:'tool:1',relation:'executes',source_events:[]},{id:'b',from:'task:<&"',to:'tool:1',relation:'contains',source_events:[]}],warnings:[]};
  const graph=buildProvenanceGraph(trace,{previous_run_id:'prior-run',session_id:'session'});
  assert.equal(graph.edges.filter(e=>e.target==='tool:1').length,2);
  assert.ok(graph.edges.some(e=>e.type==='follows_run'&&e.attributes.meaning.includes('not_proof_of_causality')));
  const xml=renderGraphML(graph);assert.ok(!xml.includes('<unsafe>'));assert.ok(xml.includes('&lt;unsafe&gt;'));assert.ok(xml.includes('original_id'));
  const invalid=structuredClone(graph);invalid.edges.push({id:'bad',source:'absent',target:'tool:1',type:'fake',attributes:{},source_events:[]});assert.throws(()=>validateProvenanceGraph(invalid),/DANGLING/);
});

test('missing raw evidence stays missing and never creates an invented endpoint',()=>{
  const graph=buildProvenanceGraph({run_id:'old',task:{node_id:'task:old'},provenance:{},edges:[{id:'bad',from:'task:old',to:'missing',relation:'executes'}],warnings:[]});
  assert.equal(graph.nodes.length,1);assert.equal(graph.edges.length,0);assert.ok(graph.warnings.some(w=>w.code==='UNRESOLVED_GRAPH_ENDPOINT'));
});

test('continuation shows verified external references without inventing parent tool executions',()=>{
  const parent={event_id:'child-parent-event',seq:2,type:'continuation.parent',payload:{parentRunId:'parent',parentManifestSha256:'a'.repeat(64),parentToolReferences:[{toolCallId:'original-tool',run_id:'parent',event_id:'upstream-event',seq:31,payload_ref:{path:'blobs/source.json',sha256:'b'.repeat(64)}}]}};
  const request={event_id:'child-model-event',seq:4,type:'model.request',payload:{request:{messages:[{role:'tool',tool_call_id:'original-tool',content:'pending'}]}}};
  const trace:any={run_id:'child',task:{node_id:'task:child',task_parameters:{amount:'30'}},provenance:{},model_calls:[{id:'model:child',source_events:[{event_id:'child-model-event'}]}],tool_calls:[],contract_calls:[],transactions:[],call_frames:[],edges:[],warnings:[]};
  const graph=buildProvenanceGraph(trace,{continuation_of:'parent'},[parent,{seq:3,event_id:'observed',type:'state.continuation',payload:{blockNumber:'8'}},request]);
  assert.equal(graph.nodes.filter(n=>n.type==='tool_call').length,0);
  assert.equal(graph.nodes.filter(n=>n.type==='external_tool_result').length,1);
  const reference=graph.nodes.find(n=>n.type==='external_tool_result')!;
  assert.equal(reference.attributes.event_id,'upstream-event');
  assert.equal(reference.attributes.loaded,false);
  assert.equal(reference.source_events[0].event_id,'child-parent-event','clickable local source is the continuation event, not the upstream seq');
  assert.ok(graph.edges.some(e=>e.type==='continues_agent'));
  assert.ok(graph.edges.some(e=>e.type==='provides_parent_result'&&e.target==='model:child'));
  assert.ok(graph.edges.some(e=>e.type==='observes_after_mining'));
  assert.ok(renderGraphML(graph).includes('external_tool_result'));
});
