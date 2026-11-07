import {test} from 'node:test';
import assert from 'node:assert/strict';
import {graphML} from '../src/scenario/graphml.mjs';

test('GraphML retains relation semantics, event references and complete escaped evidence metadata',()=>{
 const graph={nodes:[{id:'call<1',kind:'model',label:'模型 & "工具"',agentId:'buyer',eventRef:'event-1',params:{amount:'0.000001',secret:'[REDACTED]'}},{id:'tx-1',kind:'transaction',eventRef:'event-2'}],edges:[{from:'call<1',to:'tx-1',kind:'submits',eventRef:'event-2',toolCallId:'tool-1'}]};
 const output=graphML(graph);
 const decode=value=>value.replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
 const records=[...output.matchAll(/<data key="record">(.*?)<\/data>/g)].map(match=>JSON.parse(decode(match[1])));
 assert.deepEqual(records,[...graph.nodes,...graph.edges]);
 assert.match(output,/<data key="kind">submits<\/data>/);
 assert.match(output,/<data key="eventRef">event-2<\/data>/);
 assert.match(output,/source="call&lt;1" target="tx-1"/);
 assert.equal((output.match(/<node /g)||[]).length,2);
});
