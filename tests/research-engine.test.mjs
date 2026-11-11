import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {runResearchExperiment, readCompletedResearchExperiment} from '../src/research/engine.mjs';
import {normalizeResearchConfig, expandExperimentMatrix} from '../src/research/manifest.mjs';
import {PrivateBudgetLedger} from '../src/research/private-ledger.mjs';
import {catalogSnapshot} from '../src/research/catalog.mjs';
import {createWorkload, serviceResult, assessTask} from '../src/research/workload.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const folder = () => mkdtemp(join(tmpdir(), 'web3-research-engine-test-'));
const json = async path => JSON.parse(await readFile(path, 'utf8'));
function fixture(overrides = {}) {
  const rows = [], calls = [];
  return {evidenceOrigin: 'synthetic_fixture', calls,
    async pay(input) {
      calls.push(input);
      if (overrides.pay) return overrides.pay(input, rows);
      const result = {requestId: input.requestId, paymentId: 'fixture-' + rows.length, status: 'settled', chargedBase: input.amountBase, settledBase: input.amountBase,
        reservedBase: '0', refundedBase: '0', delivery: {status: 'delivered', result: structuredClone(input.result)}};
      rows.push(result); return result;
    },
    async settle() { return {payments: structuredClone(rows)}; }, ...overrides.extra,
  };
}
async function records(dir) {
  const events = (await readFile(join(dir, 'raw/events.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
  return Promise.all(events.map(async event => ({event, payload: await json(join(dir, event.payloadRef.path))})));
}

test('strict research config rejects floating amounts, uninstalled family and scripted model label', () => {
  for (const input of [{budgetBase: 0.1}, {budgetBase: '0.1'}, {budgetBase: '0100'}, {task: {family: 'invented'}}, {mode: 'scripted', model: {provider: 'local'}}, {tokenDecimals: 18}, {payment: {authorization: 'ap2'}, budgetBase: '10001'}]) assert.throws(() => normalizeResearchConfig(input));
  const good = normalizeResearchConfig({budgetBase: '100000', initialBalanceBase: '999999'});
  assert.notEqual(good.budgetBase, good.initialBalanceBase);
});

test('factor matrix is deterministic, crosses families and budgets, and groups repeated instances', () => {
  const input = {base: {task: {instanceId: 'paper'}, budgetBase: '100000'}, factors: {family: ['evidence_review','risk_analysis','trend_analysis'], strategy: ['cost','adaptive'], budgetBase: ['50000','150000']}, replicates: 2, seed: 19};
  const first = expandExperimentMatrix(input), second = expandExperimentMatrix(input);
  assert.deepEqual(first, second); assert.equal(first.length, 24); assert.equal(new Set(first.map(r => r.groupId)).size, 6);
  assert.ok(first.every(r => r.config.initialBalanceBase === '1000000'));
  assert.throws(() => expandExperimentMatrix({...input, factors: {merchantForTask: ['label']}}));
});

test('shared catalog and deterministic workloads do not price or address-code the family', () => {
  const catalog = catalogSnapshot(); assert.equal(catalog.length, 6);
  assert.equal(new Set(catalog.map(p => p.priceBase)).size, 2);
  for (const family of ['evidence_review','risk_analysis','trend_analysis']) {
    const task = createWorkload({family, instanceId: 'same-records', difficulty: 2}, 41);
    const peer = createWorkload({family: 'evidence_review', instanceId: 'same-records', difficulty: 2}, 41);
    assert.deepEqual(task.records, peer.records);
    assert.deepEqual(task.capabilityOrder, peer.capabilityOrder);
    assert.equal(serviceResult(task, catalog[1]).coverage, 100);
  }
});

test('ledger reserves before payment and enforces budget independently of large wallet', () => {
  const l = new PrivateBudgetLedger({budgetBase: '20000', initialBalanceBase: '1000000'});
  l.reserve({purchaseId:'p1',requestId:'r1',quotedAmountBase:'10000'});
  assert.throws(() => l.reserve({purchaseId:'p2',requestId:'r2',quotedAmountBase:'30000'}), /BUDGET/);
  l.apply('p1', {status:'settled', chargedBase:'10000'});
  assert.equal(l.snapshot().totals.remainingBudgetBase, '10000');
  assert.throws(() => l.apply('p1', {status:'failed',chargedBase:'0'}), /REGRESSION/);
});

test('pending channel obligation is counted once and remains until actual settlement', () => {
  const l = new PrivateBudgetLedger({budgetBase: '100000', initialBalanceBase: '1000000'});
  l.reserve({purchaseId:'p',requestId:'r',quotedAmountBase:'30000'});
  l.apply('p', {status:'pending', chargedBase:'30000',settledBase:'0',reservedBase:'30000'});
  assert.equal(l.snapshot().totals.liabilityBase, '30000');
  l.apply('p', {status:'settled', chargedBase:'30000',settledBase:'30000',reservedBase:'0'});
  assert.equal(l.snapshot().totals.liabilityBase, '30000');
  assert.equal(l.snapshot().totals.reservedBase, '0');
});

test('ambiguous failed payment carrying a charge cannot release its reservation', () => {
  const ledger = new PrivateBudgetLedger({budgetBase:'100000',initialBalanceBase:'1000000'});
  ledger.reserve({purchaseId:'p',requestId:'r',quotedAmountBase:'10000'});
  assert.throws(()=>ledger.apply('p',{status:'failed',chargedBase:'10000',settledBase:'0',reservedBase:'0'}),/FAILED_PAYMENT_WITH_LIABILITY/);
  assert.equal(ledger.snapshot().totals.reservedBase,'10000');
});

test('adapter overcharge preserves reported liability and halts additional buying', async () => {
  const payments=fixture({pay(input,rows){const r={requestId:input.requestId,status:'settled',chargedBase:'20000',delivery:{status:'delivered',result:input.result}};rows.push(r);return r;}});
  const dir=await folder(),result=await runResearchExperiment({}, {outDir:dir,payments});
  assert.equal(payments.calls.length,1);assert.equal(result.finances.settledBase,'20000');
  assert.ok(result.errors.some(e=>e.message==='RESEARCH_PAYMENT_QUOTE_EXCEEDED'));
  const rows=await records(dir);assert.ok(rows.some(r=>r.event.type==='research.payment_result'&&r.payload.result.chargedBase==='20000'));
});

test('private derived graphs contain real event refs and only explicit causal or identifier edges', async () => {
  const dir=await folder();await runResearchExperiment({strategy:'quality'},{outDir:dir,payments:fixture()});
  const rows=await records(dir),eventIds=new Set(rows.map(r=>r.event.eventId));
  const graph=await json(join(dir,'derived/graph.json')),ids=new Set(graph.nodes.map(n=>n.id));
  assert.equal(graph.visibility,'private-researcher-only');
  assert.equal(graph.nodes.filter(n=>n.payloadRef).length,rows.length);
  assert.ok(graph.nodes.every(n=>eventIds.has(n.eventRef)));
  assert.ok(graph.edges.every(e=>ids.has(e.source)&&ids.has(e.target)&&eventIds.has(e.eventRef)));
  for(const edge of graph.edges.filter(e=>e.relation==='explicit_event_cause'))assert.ok(rows.find(r=>r.event.eventId===edge.target).event.causalEventIds.includes(edge.source));
  assert.ok(graph.edges.every(e=>['explicit_event_cause','records_identifier'].includes(e.relation)));
  const integrity=await json(join(dir,'integrity.json'));
  for(const name of ['graph.json','graph.graphml','nodes.csv','edges.csv'])assert.ok(integrity.files['derived/'+name]);
});

for (const family of ['evidence_review','risk_analysis','trend_analysis']) test('quality policy completes real service logic for ' + family + ' with explicitly synthetic payment test', async () => {
  const dir = await folder(), payments = fixture();
  const result = await runResearchExperiment({strategy:'quality',task:{family,instanceId:'instance-03',difficulty:3}}, {outDir:dir,payments});
  assert.equal(result.status, 'completed'); assert.equal(result.taskOutcome, 'success'); assert.equal(result.purchases, 3);
  assert.equal(result.finances.settledBase, '90000'); assert.equal(result.evidenceOrigin, 'synthetic_fixture'); assert.equal(result.privacyDatasetReady, false);
  const truth = await json(join(dir,'private/ground-truth.json')); assert.equal(truth.task.family,family);
  assert.ok(truth.purchases.every(p=>p.deliveryStatus==='delivered')); assert.ok((await json(join(dir,'integrity.json'))).files['private/ground-truth.json']);
});

test('adaptive policy uses received coverage to upgrade and preserves all failed service attempts', async () => {
  const dir = await folder(), payments = fixture({pay(input, rows) {
    const first = rows.length === 0;
    const result = {requestId:input.requestId,paymentId:'p'+rows.length,status:'settled',chargedBase:input.amountBase,delivery: first ? {status:'failed'} : {status:'delivered',result:input.result}};
    rows.push(result); return result;
  }});
  const result = await runResearchExperiment({strategy:'adaptive',budgetBase:'200000',task:{family:'risk_analysis',instanceId:'adaptive',difficulty:3}}, {outDir:dir,payments});
  const truth = await json(join(dir,'private/ground-truth.json'));
  assert.equal(result.taskOutcome,'success'); assert.equal(truth.purchases[0].deliveryStatus,'failed');
  assert.ok(result.purchases>3); assert.equal(BigInt(result.finances.settledBase), payments.calls.reduce((n,c)=>n+BigInt(c.amountBase),0n));
  assert.equal(truth.purchases[0].result, undefined);
  assert.ok(truth.purchases.slice(1).some(p=>p.capability===truth.purchases[0].capability && p.tier==='pro'));
});

test('service generator is not silently used when the actual HTTP delivery body differs', async () => {
  const dir = await folder(), payments = fixture({pay(input, rows) {
    const result = {requestId:input.requestId,paymentId:'p'+rows.length,status:'settled',chargedBase:input.amountBase,delivery:{status:'delivered',result:{...input.result,coverage:0,answer:'incorrect'}}}; rows.push(result);return result;
  }});
  const result = await runResearchExperiment({strategy:'quality'}, {outDir:dir,payments});
  const truth = await json(join(dir,'private/ground-truth.json'));
  assert.equal(result.taskOutcome,'failure'); assert.ok(truth.purchases.every(p=>p.result.coverage===0));
});

test('payment throw preserves unknown liability and does not run another task or model fallback', async () => {
  const dir = await folder(), payments = fixture({pay() { throw Error('RESPONSE_LOST_AFTER_POSSIBLE_SETTLEMENT'); }});
  const result = await runResearchExperiment({}, {outDir:dir,payments});
  assert.equal(result.status,'requires_attention'); assert.equal(result.purchases,1); assert.equal(result.finances.reservedBase,'10000');
  assert.equal((await json(join(dir,'private/ground-truth.json'))).purchases[0].deliveryStatus,'unknown');
  assert.ok((await records(dir)).some(r=>r.event.type==='research.error'));
});

test('budget exhaustion retains partial task and refuses unreserved purchase', async () => {
  const dir = await folder(), payments = fixture();
  const result = await runResearchExperiment({strategy:'quality',budgetBase:'10000'}, {outDir:dir,payments});
  assert.equal(payments.calls.length,1); assert.equal(result.taskOutcome,'failure'); assert.equal(result.finances.remainingBudgetBase,'0');
});

test('sealed read-only resume validates all bytes and never invokes a payment', async () => {
  const dir = await folder(), config = {strategy:'quality'}, payments = fixture();
  const result = await runResearchExperiment(config,{outDir:dir,payments}); const count=payments.calls.length;
  const resumed = await readCompletedResearchExperiment(dir,config);assert.equal(resumed.runId,result.runId);assert.equal(resumed.resumedReadOnly,true);assert.equal(payments.calls.length,count);
  await assert.rejects(readCompletedResearchExperiment(dir,{strategy:'cost'}),/CONFIG_CHANGED/);
  await writeFile(join(dir,'catalog.json'),'{}'); await assert.rejects(readCompletedResearchExperiment(dir,config),/INTEGRITY_MISMATCH/);
});

test('existing output directories are not overwritten and injected fake cannot claim real data', async () => {
  const dir = await folder(); await writeFile(join(dir,'keep.txt'),'kept');
  await assert.rejects(runResearchExperiment({}, {outDir:dir,payments:fixture()}),/NOT_EMPTY/);
  assert.equal(await readFile(join(dir,'keep.txt'),'utf8'),'kept');
  const rejected = await runResearchExperiment({}, {outDir:await folder(),payments:{evidenceOrigin:'real_chain',pay(){throw Error('must not run');}}});
  assert.equal(rejected.status,'error');assert.match(rejected.errors[0].message,/INJECTED_PAYMENT/);
});

test('real HTTP API protocol fixture preserves native bodies and API-key redaction without claiming LLM intelligence', async t => {
  const key='research-test-secret-not-for-export', requests=[];
  const server=createServer(async(req,res)=>{
    let body='';for await(const chunk of req)body+=chunk;
    assert.equal(req.headers.authorization,'Bearer '+key);requests.push(body);
    const request=JSON.parse(body);assert.equal(request.tool_choice,'required');assert.equal(request.parallel_tool_calls,false);const completed=request.messages.filter(m=>m.role==='tool').length;
    const name=completed<3?'purchase_service':'finish_task';
    const provider=['discover-pro','analyze-pro','verify-pro'][completed];
    const analysis=request.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).find(x=>x.result?.capability==='analysis');
    const args=completed<3?{providerId:provider}:{answer:analysis.result.answer};
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'call-'+completed,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}}));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const dir=await folder(), result=await runResearchExperiment({mode:'llm',strategy:'quality',model:{provider:'api',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,model:'synthetic-protocol-fixture',apiKey:key,maxOutputTokens:256}}, {outDir:dir,payments:fixture()});
  assert.equal(result.taskOutcome,'success');assert.equal(result.costs.modelCalls,4);assert.equal(requests.length,4);
  const rows=await records(dir), modelRows=rows.filter(r=>['model.request','model.response'].includes(r.event.type));
  assert.equal(modelRows.length,8);assert.ok(modelRows.every(r=>sha(r.payload.body)===r.payload.capture.recordedBodySha256));
  const exported=JSON.stringify(rows)+await readFile(join(dir,'config.json'),'utf8');assert.ok(!exported.includes(key));
  assert.equal(result.evidenceOrigin,'synthetic_fixture');
});

test('API transport failure is recorded, leaves no purchase and never falls back to script', async t => {
  const server=createServer((_req,res)=>{res.statusCode=503;res.end('fixture unavailable');});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const dir=await folder(),payments=fixture(),result=await runResearchExperiment({mode:'llm',model:{provider:'api',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,model:'synthetic-protocol-fixture'}},{outDir:dir,payments});
  assert.equal(result.status,'error');assert.equal(payments.calls.length,0);assert.equal(result.costs.modelCalls,1);
  const rows=await records(dir);assert.ok(rows.some(r=>r.event.type==='model.error'));assert.ok(rows.some(r=>r.event.type==='model.response'&&r.payload.body==='fixture unavailable'));
});

test('unmanaged local model is rejected before any model or payment call',async()=>{
  const payments=fixture(),result=await runResearchExperiment({mode:'llm',model:{provider:'local'}},{outDir:await folder(),payments});
  assert.equal(result.status,'recording_failure');assert.equal(payments.calls.length,0);assert.equal(result.costs.modelCalls,0);
  assert.ok(result.errors.some(e=>e.message==='RESEARCH_LOCAL_MANAGED_EVIDENCE_REQUIRED'));
});

test('missing mandatory native runtime bytes cannot be labelled complete capture',async()=>{
  const controller=new AbortController();controller.abort();
  const dir=await folder(),result=await runResearchExperiment({mode:'llm',model:{provider:'local'}},{outDir:dir,payments:fixture(),signal:controller.signal,
    modelResolver:async m=>({...m,baseUrl:'http://127.0.0.1:1/v1',model:'fixture-local-not-run',localRuntime:{modelSha256:'a'.repeat(64),runtimeSha256:'b'.repeat(64)}}),
    captureRuntimeEvidence:async()=>({files:['manifest','props','events'].map(role=>({role,unavailable:'fixture missing required file'}))})});
  assert.equal(result.status,'recording_failure');assert.equal(result.recordingComplete,false);assert.equal(result.costs.modelCalls,0);
  assert.ok(result.errors.some(e=>e.message==='RESEARCH_LOCAL_RUNTIME_EVIDENCE_INCOMPLETE'));
});

test('pre-cancelled run retains cancellation and zero payment evidence',async()=>{
  const abort=new AbortController();abort.abort();const payments=fixture(),dir=await folder();
  const result=await runResearchExperiment({}, {outDir:dir,payments,signal:abort.signal});
  assert.equal(result.finishReason,'cancelled');assert.equal(payments.calls.length,0);assert.equal(result.finances.liabilityBase,'0');
  assert.ok((await json(join(dir,'integrity.json'))).files['raw/events.jsonl']);
});
