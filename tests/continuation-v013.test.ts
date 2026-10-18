import test from 'node:test';
import assert from 'node:assert/strict';
import { continuationHistory,mergeTransactions } from '../src/continuation.js';
import { runSummary } from '../src/store.js';

const event=(seq:number,type:string,payload:any,links:any={})=>({seq,type,payload,links,event_id:`event-${seq}`,run_id:'parent',payload_ref:{sha256:'test'}});
const history=()=>[
  event(1,'model.request',{request:{messages:[{role:'user',content:'swap'}]}},{modelCallId:'model-1'}),
  event(2,'model.response',{response:{model:'provider-real-model',choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'tool-1',type:'function',function:{name:'swap',arguments:'{}'}}]}}]}},{modelCallId:'model-1'}),
  event(3,'tool.result',{name:'swap',raw:{status:'pending',hash:'0x123'},visible:{status:'pending',hash:'0x123'}},{toolCallId:'tool-1'}),
];
test('continuation restores provider-visible pending observation without re-executing tools',()=>{
  const events=history();const actual=continuationHistory(events);
  assert.equal(actual.messages.length,3);assert.equal(actual.messages[1].tool_calls[0].id,'tool-1');
  assert.deepEqual(JSON.parse(actual.messages[2].content),events[2].payload.visible);
  assert.equal(actual.observations[0].raw.status,'pending');assert.equal(actual.historySha256.length,64);
  assert.deepEqual(actual.sourceEvents.map(row=>row.seq),[1,2,3]);
});
test('incomplete or duplicate results reject continuation instead of fabricating observations',()=>{
  const events=history();assert.throws(()=>continuationHistory(events.slice(0,2)),/INCOMPLETE/);
  assert.throws(()=>continuationHistory([...events,events[2]]),/INCOMPLETE/);
  assert.throws(()=>continuationHistory([]),/HISTORY_MISSING/);
});
test('parent transaction re-inspection deduplicates hashes and keeps nonce order',()=>{
  const rows=mergeTransactions([{hash:'0xABC',nonce:2,status:'pending'},{hash:'0xdef',nonce:1,status:'success'}],[{hash:'0xabc',nonce:2,status:'success',receipt:{status:'success'}}]);
  assert.equal(rows.length,2);assert.equal(rows[0].nonce,1);assert.equal(rows[1].status,'success');assert.ok(rows[1].receipt);
});
test('history reports task outcome independently from chain execution and model routing alias',()=>{
  const events=history();const summary=runSummary({mode:'llm',taskId:'swap',model:{model:'routing-alias'}},{status:'failure',diagnostics:{chainExecutionStatus:'success'}},events);
  assert.equal(summary.taskStatus,'failure');assert.equal(summary.chainExecutionStatus,'success');
  assert.deepEqual(summary.modelSummary,{requested:'routing-alias',reported:['provider-real-model'],reportedSource:'model.response'});
  const missing=runSummary({mode:'llm',taskId:'balance',model:{model:'alias'}},{status:'success',diagnostics:{chainExecutionStatus:'not_submitted'}},[event(1,'tool.result',{name:'get_balance',raw:{balance:'1'}})]);
  assert.equal(missing.chainExecutionStatus,'query_only');assert.deepEqual(missing.modelSummary.reported,[]);assert.equal(missing.modelSummary.reportedSource,null);
});
