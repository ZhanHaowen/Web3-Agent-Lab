import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ControlStore,encode,sha} from '../src/control/store.mjs';
import {builtins,definition,jobSpec} from '../src/control/tasks.mjs';
import {verifyBundle} from '../src/control/offline.mjs';
import {handle} from '../src/control/routes.mjs';
import {normalize} from '../src/scenario/core.mjs';
import {definitions} from '../src/scenario/agent-runtime.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function storeFor(t){const s=new ControlStore(join(root,'data-acceptance-unit-'+randomUUID()));t.after(()=>s.close());return s;}
function bundleFor(s,id='execution-one'){
 const rows=s.events(id),files={'raw/events.jsonl':rows.map(r=>encode(r.event)).join('\n')+'\n'};
 for(const row of rows)files[row.event.payloadRef.path]=row.text;
 const b={format:'web3-agent-scenario',version:2,scenarioId:id,executionId:id,episodeId:id,files};
 seal(b);return b;
}
function seal(b){b.files['manifest.json']=encode({schemaVersion:2,recordingStatus:'complete',files:Object.fromEntries(Object.entries(b.files).filter(([p])=>p!=='manifest.json').map(([p,text])=>[p,{sha256:sha(text),bytes:Buffer.byteLength(text)}]))});return b;}
function editEvents(b,fn){const events=b.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse);fn(events);b.files['raw/events.jsonl']=events.map(encode).join('\n')+'\n';seal(b);return b;}

// The data directory deliberately remains outside package inputs: the release
// packager excludes data-* directories. No service or EVM process is started.
test('ControlStore preserves jobs across close and reopen with SQLite FULL sync',t=>{
 const folder=join(root,'data-acceptance-unit-'+randomUUID()),first=new ControlStore(folder);
 first.put('jobs','j1',{id:'j1',amount:'20000000',state:'published'});first.close();
 const second=new ControlStore(folder);t.after(()=>second.close());assert.deepEqual(second.get('jobs','j1'),{id:'j1',amount:'20000000',state:'published'});
 assert.equal(second.db.prepare('PRAGMA synchronous').get().synchronous,2);
});

test('same idempotency key and reordered request fields return one durable result',t=>{
 const s=storeFor(t);let creates=0;
 const a=s.idem('publish','request-one',{amount:'20',token:'A'},()=>{creates++;return s.put('jobs','job-one',{id:'job-one',amount:'20'});});
 const b=s.idem('publish','request-one',{token:'A',amount:'20'},()=>{creates++;throw Error('must not execute twice');});
 assert.deepEqual(a,b);assert.equal(creates,1);assert.equal(s.list('jobs').length,1);
 assert.throws(()=>s.idem('publish','request-one',{amount:'21',token:'A'},()=>({})),e=>e.message==='IDEMPOTENCY_CONFLICT'&&e.status===409);
 assert.equal(s.get('jobs','job-one').amount,'20');
});

test('state update and event outbox roll back together when the transaction fails',t=>{
 const s=storeFor(t);
 assert.throws(()=>s.transaction(()=>{s.put('jobs','j',{state:'assigned'});s.event('e','job.assigned',{jobId:'j'});throw Error('disk-failure-fixture');}),/disk-failure-fixture/);
 assert.equal(s.get('jobs','j'),null);assert.equal(s.events('e').length,0);
});

test('table access is limited to known control tables',t=>{
 const s=storeFor(t);assert.throws(()=>s.get('jobs;DROP TABLE jobs','id'),/TABLE/);s.put('jobs','safe',{id:'safe'});assert.equal(s.get('jobs','safe').id,'safe');
});

test('task-definition HTTP handler rejects replacement of published same-version content',async t=>{
 const s=storeFor(t),original=builtins().find(d=>d.taskType==='peer_swap');s.put('task_definitions','peer_swap@1.0.0',original);
 let response;
 const control={admin:()=>true,store:s,init:async()=>{},b:{url:'http://127.0.0.1:4317',admin:()=>true,send:(_res,status,value)=>{response={status,value};}}};
 const req={method:'POST',url:'/api/v2/task-definitions',headers:{'idempotency-key':'definition-replace'}};
 await handle.call(control,req,{},'/api/v2/task-definitions',{taskType:'peer_swap',version:'1.0.0',prompts:{maker:'changed instructions'}});
 assert.equal(response.status,409);assert.equal(response.value.error,'IMMUTABLE_TASK_VERSION');assert.equal(s.get('task_definitions','peer_swap@1.0.0').definitionHash,original.definitionHash);
 const next=definition({taskType:'peer_swap',version:'1.0.1'});assert.notEqual(next.definitionHash,original.definitionHash);
});

test('uninstalled task tool and checker definitions fail before assignment',()=>{
 assert.throws(()=>definition({taskType:'peer_swap',version:'1.0.1',checkerId:'unknown'}),/CHECKER_NOT_INSTALLED/);
 assert.throws(()=>definition({taskType:'peer_swap',version:'1.0.1',requiredTools:['execute_arbitrary_javascript']}),/TOOL_NOT_INSTALLED/);
 assert.throws(()=>definition({taskType:'unknown',version:'1.0.0'}),/TASK_TYPE_OR_VERSION/);
 assert.throws(()=>definition({taskType:'peer_swap',version:'latest'}),/TASK_TYPE_OR_VERSION/);
});

test('declared peer inputs reject invalid units and undeclared parameters',()=>{
 const d=builtins().find(d=>d.taskType==='peer_swap');
 for(const sellAmount of ['-1','1e6','1.1234567'])assert.throws(()=>jobSpec({input:{sellAmount}},d,()=>{throw Error('legacy adapter must not run');}));
 assert.throws(()=>jobSpec({input:{sellToken:'ETH'}},d),/FIXED_ASSETS_REQUIRED/);
 assert.throws(()=>jobSpec({input:{from:'wallet-b'}},d),/UNKNOWN_INPUT_FIELD/);
});

test('role tool schemas expose no signer override and keep settlement permissions distinct',()=>{
 const s=normalize({}),maker=definitions(s.agents[0]),taker=definitions(s.agents[1]);
 assert.ok(maker.some(d=>d.function.name==='create_order'));assert.ok(!taker.some(d=>d.function.name==='create_order'));
 assert.ok(taker.some(d=>d.function.name==='fill_order'));assert.ok(!maker.some(d=>d.function.name==='fill_order'));
 for(const d of [...maker,...taker]){assert.equal(d.function.parameters.additionalProperties,false);assert.ok(!Object.hasOwn(d.function.parameters.properties,'from'));assert.ok(!Object.hasOwn(d.function.parameters.properties,'privateKey'));}
});

test('exact event redelivery is acknowledged once while conflicting bytes are rejected',t=>{
 const s=storeFor(t),actor={streamId:'agent-a:run-one',seq:1,eventId:'event-one',agentId:'agent-a',agentRunId:'run-one',roleId:'maker'};
 const a=s.event('execution-one','tool.result',{ok:true},actor),b=s.event('execution-one','tool.result',{ok:true},actor);
 assert.deepEqual(a,b);assert.equal(s.events('execution-one').length,1);
 assert.throws(()=>s.event('execution-one','tool.result',{ok:false},actor),/EVENT_ID_CONFLICT/);
 assert.throws(()=>s.event('execution-one','tool.call',{ok:true},actor),/EVENT_ID_CONFLICT/);
});

test('same stream sequence with a different event identity is a conflict',t=>{
 const s=storeFor(t),actor={streamId:'agent-a:run-one',seq:1,eventId:'event-one',agentId:'agent-a',agentRunId:'run-one',roleId:'maker'};
 s.event('execution-one','tool.result',{ok:true},actor);
 assert.throws(()=>s.event('execution-one','tool.result',{ok:true},{...actor,eventId:'different-event'}),/EVENT_ID_CONFLICT/);
});

test('event identity cannot be replayed under a different execution or actor',t=>{
 const s=storeFor(t),actor={streamId:'agent-a:run-one',seq:1,eventId:'event-one',agentId:'agent-a',agentRunId:'run-one',roleId:'maker'};
 s.event('execution-one','tool.result',{ok:true},actor);
 assert.throws(()=>s.event('execution-two','tool.result',{ok:true},{...actor,streamId:'agent-b:run-two',agentId:'agent-b',agentRunId:'run-two',roleId:'taker'}),/EVENT_ID_CONFLICT/);
});

test('offline verification detects changed or missing blob and preserves the source bundle',t=>{
 const s=storeFor(t);s.event('execution-one','control.note',{amount:'20'});const b=bundleFor(s),original=JSON.stringify(b);
 assert.equal(verifyBundle(b).events.length,1);assert.equal(JSON.stringify(b),original);
 const path=Object.keys(b.files).find(p=>p.startsWith('raw/blobs/'));
 const changed=structuredClone(b);changed.files[path]=changed.files[path].replace('20','21');assert.throws(()=>verifyBundle(changed),/INTEGRITY_FAILED/);
 const missing=structuredClone(b);delete missing.files[path];assert.throws(()=>verifyBundle(missing),/INTEGRITY_FAILED/);
});

test('offline verification rejects unresolved causal references and source-stream gaps',t=>{
 const s=storeFor(t);s.event('execution-one','control.note',{amount:'20'});const b=bundleFor(s);
 const unresolved=editEvents(structuredClone(b),events=>{events[0].causalEventIds=['absent-event'];});assert.throws(()=>verifyBundle(unresolved),/UNRESOLVED_CAUSE/);
 const gap=editEvents(structuredClone(b),events=>{events[0].seq=2;});assert.throws(()=>verifyBundle(gap),/STREAM_GAP/);
});

test('offline verification binds each event to the bundle episode',t=>{
 const s=storeFor(t);s.event('execution-one','control.note',{amount:'20'});const b=bundleFor(s);
 const foreign=editEvents(b,events=>{events[0].episodeId='foreign-episode';});
 assert.throws(()=>verifyBundle(foreign),/EVENT_SEQUENCE|EVENT_IDENTITY|EPISODE/);
});

test('actual peer graph has valid endpoints event references and consistent exported counts',async()=>{
 const b=JSON.parse(await readFile(join(root,'examples/v2/peer-normal.json'),'utf8'));verifyBundle(b);
 const g=JSON.parse(b.files['derived/graph.json']),nodes=new Set(g.nodes.map(n=>n.id)),eventIds=new Set(b.files['raw/events.jsonl'].trim().split('\n').map(line=>JSON.parse(line).eventId));
 assert.ok(g.nodes.some(n=>n.kind==='job'));assert.ok(g.nodes.some(n=>n.kind==='execution'));
 for(const edge of g.edges){assert.ok(nodes.has(edge.from),edge.from);assert.ok(nodes.has(edge.to),edge.to);assert.ok(eventIds.has(edge.eventRef),edge.eventRef);}
 assert.equal((b.files['derived/graph.graphml'].match(/<node /g)??[]).length,g.nodes.length);assert.equal((b.files['derived/graph.graphml'].match(/<edge /g)??[]).length,g.edges.length);
 assert.equal(b.files['derived/nodes.csv'].trim().split('\n').length-1,g.nodes.length);assert.equal(b.files['derived/edges.csv'].trim().split('\n').length-1,g.edges.length);
});

test('all V0.15 protected implementation and UI files keep their delivered hashes',async()=>{
 const expected=JSON.parse(await readFile(join(root,'docs/v015-protected-baseline.json'),'utf8'));
 for(const [file,wanted]of Object.entries(expected)){const bytes=await readFile(join(root,file)),actual=createHash('sha256').update(bytes).digest('hex');assert.equal(actual,wanted,file);}
});
