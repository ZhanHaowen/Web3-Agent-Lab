import test from 'node:test';import assert from 'node:assert/strict';
import {makeDataset,assertSplitIsolation,modelGroupIdentity} from '../src/research/dataset.mjs';
import {evaluateDataset,evaluateNegativeControls,buildAttackInput} from '../src/research/evaluation.mjs';
import {validateAttackInput,runAttackBaseline} from '../src/observer/attack-worker.mjs';
import {checkResearchRun} from '../src/research/checker.mjs';
import {rpcFixture,truth} from './research-observer-fixture.mjs';

test('grouped dataset retains failed episodes and keeps same-instance/clone/identical projections together',async t=>{
 const samples=[];for(let i=0;i<10;i++){const f=await rpcFixture(t,{seed:i+20});samples.push({sampleId:'private-id-'+i,observer:await f.capture(),truth:truth(i)});}
 samples.push({...samples[0],sampleId:'clone-0',truth:{...truth(999),task:{...truth(999).task,instanceId:truth(0).task.instanceId,family:truth(0).task.family}}});
 const d=makeDataset({samples,seed:'fixed'});assert.equal(d.rows.length,11);assert.ok(d.retention.failedOrUnknown>0);assert.ok(assertSplitIsolation(d));assert.equal(d.rows[0].split,d.rows[10].split);assert.deepEqual(makeDataset({samples,seed:'fixed'}),d);
 const tampered=structuredClone(d);tampered.rows[10].split=d.rows[0].split==='test'?'train':'test';assert.throws(()=>assertSplitIsolation(tampered),/LEAKAGE/);
});

test('model generalization groups one model across seeds, temperatures, ports and runtime metadata',async t=>{
 const samples=[];for(let i=0;i<5;i++){const f=await rpcFixture(t,{seed:i+90});samples.push({sampleId:'model-'+i,observer:await f.capture(),truth:{...truth(i),modelIdentity:{provider:'api',model:i<3?'same-model':'other-model',baseUrl:'http://localhost:'+String(7000+i),sampling:{seed:i,temperature:i/5},localRuntime:{sessionId:'session-'+i}}}});}
 const originals=structuredClone(samples.map(s=>s.truth.modelIdentity)),d=makeDataset({samples,groupBy:'model'});
 assert.equal(d.rows[0].splitGroup,d.rows[2].splitGroup);assert.equal(d.rows[0].componentId,d.rows[2].componentId);assert.notEqual(d.rows[0].splitGroup,d.rows[3].splitGroup);assert.deepEqual(samples.map(s=>s.truth.modelIdentity),originals);assert.ok(assertSplitIsolation(d));
 const hash='A'.repeat(64);assert.equal(modelGroupIdentity({provider:'local',model:'alias-1',localRuntime:{modelSha256:hash}}),modelGroupIdentity({provider:'local',model:'alias-2',localRuntime:{modelSha256:hash.toLowerCase(),runtimeSha256:'other'}}));
 assert.notEqual(modelGroupIdentity({localRuntime:{modelSha256:hash}}),modelGroupIdentity({localRuntime:{modelSha256:'B'.repeat(64)}}));
});

function syntheticDataset(){const rows=[];let i=0;for(const split of ['train','validation','test'])for(let n=0;n<12;n++){const high=n%2,id='private-'+i;rows.push({sampleId:id,componentId:id,splitGroup:id,observerSha256:'sha-'+i,split,features:{paymentCount:high?10:1,repeatAdjacent:high?4:0},labels:{task:high?'risk':'review',strategy:high?'quality':'cost',budget:high?100:10,outcome:n%3?'success':'failed'}});i++;}return {rows,seed:'unit',retention:{inputSamples:36,retainedSamples:36,failedOrUnknown:12},warnings:['Synthetic separable unit fixture, not a research result.']};}

test('isolated attack stdin has anonymous IDs and no test truth or private canary',()=>{
 const d=syntheticDataset(),row=d.rows.find(r=>r.split==='test');row.sampleId='CANARY_PRIVATE_RUN';row.labels.task='CANARY_PRIVATE_TASK';row.labels.strategy='CANARY_STRATEGY';row.labels.budget=999877;
 const {input,privateMapping}=buildAttackInput(d),serialized=JSON.stringify(input);assert.ok(!serialized.includes('CANARY'));assert.ok(!serialized.includes('999877'));assert.ok(Object.values(privateMapping).includes('CANARY_PRIVATE_RUN'));assert.deepEqual(Object.keys(input.test[0]),['sampleId','features']);assert.ok(validateAttackInput(input));
 for(const extra of [{truth:{task:'leak'}},{labels:{task:'leak'}},{budget:55},{runId:'leak'}]){const bad=structuredClone(input);Object.assign(bad.test[0],extra);assert.throws(()=>validateAttackInput(bad),/FIELDS/);}
});
test('subprocess baseline predicts held-out separable fixture, joins truth only in evaluator and calibrates interval',()=>{
 const d=syntheticDataset(),r=evaluateDataset(d,{budgetCoverage:0.8,k:1});assert.equal(r.classification.task.accuracy,1);assert.equal(r.classification.strategy.macroF1,1);assert.equal(r.budget.mae,0);assert.equal(r.budget.empiricalCoverage,1);assert.equal(r.attackInput.testTruthPassed,false);assert.equal(r.retention.retainedSamples,36);assert.equal(r.splitCounts.test,12);assert.equal(r.budget.meanIntervalWidth,0);
 assert.deepEqual(r.observerWindowAssumption,{kind:'oracle-window',source:'researcher-selected public block range',automaticTaskSegmentation:false});
});

test('identical public features cannot produce different hidden-budget predictions',()=>{
 const d=syntheticDataset();for(const r of d.rows)r.features={same:1};const r=evaluateDataset(d,{k:3});
 assert.equal(new Set(r.budget.predictions.map(p=>p.predicted)).size,1);assert.ok(r.budget.mae>0);assert.equal(r.budget.constantMedianBaseline.mae,45);assert.equal(r.budget.distinctTestBudgets,2);
 const constant=structuredClone(d);for(const row of constant.rows)row.labels.budget=10;const c=evaluateDataset(constant);assert.equal(c.budget.mae,0);assert.ok(c.warnings.some(w=>w.includes('lack variation')));
});
test('changing test labels changes metrics but cannot change child input or predictions',()=>{
 const d=syntheticDataset(),a=evaluateDataset(d,{k:1}),other=structuredClone(d);for(const r of other.rows.filter(r=>r.split==='test')){r.labels.task='unseen';r.labels.strategy='new';r.labels.budget=10000;}
 const b=evaluateDataset(other,{k:1});assert.equal(a.attackInput.sha256,b.attackInput.sha256);assert.deepEqual(a.classification.task.predictions,b.classification.task.predictions);assert.notEqual(a.budget.mae,b.budget.mae);assert.equal(b.classification.task.unknownCount,12);
 assert.equal(b.classification.task.knownLabelCount,0);assert.equal(b.classification.task.knownLabelAccuracy,null);assert.equal(b.classification.task.unknownOnlyTest,true);assert.ok(b.warnings.some(w=>w.includes('all test labels are unseen')));
});
test('out of training range may abstain; insufficient calibration yields explicit unbounded interval',()=>{
 const d=syntheticDataset();d.rows=d.rows.filter(r=>r.split!=='validation');for(const r of d.rows.filter(r=>r.split==='test'))r.features.paymentCount=100000;
 const r=evaluateDataset(d);assert.equal(r.classification.task.coverage,0);assert.equal(r.budget.intervalKind,'unbounded-insufficient-calibration');assert.equal(r.budget.meanIntervalWidth,null);assert.ok(r.budget.predictions.every(p=>p.upper===null));
});
test('validation without acceptable operating point rejects all rather than accepting confidence-one errors',()=>{
 const d=syntheticDataset();for(const r of d.rows){r.labels.task=r.split==='train'?'known':'unseen';r.features={same:1};}const {input}=buildAttackInput(d);const r=runAttackBaseline(input);assert.equal(r.classification.task.rejectAll,true);assert.ok(r.classification.task.predictions.every(p=>p.predicted==='__unknown__'));
});
test('negative controls run independently without deleting failed samples or crossing groups',()=>{
 const r=evaluateNegativeControls(syntheticDataset(),{k:1});assert.equal(r.emptyFeatures.retention.retainedSamples,36);assert.equal(r.shuffledLabels.retention.failedOrUnknown,12);assert.ok(r.emptyFeatures.classification.task.accuracy<1);
});
test('independent checker recalculates private budget and allows recorded task failure',async t=>{
 const f=await rpcFixture(t),observer=await f.capture(),tr=truth(0);tr.purchases=[{purchaseId:'failed-request',deliveryStatus:'failed'}];const ledger={schema:'web3-private-budget-ledger-v1',budgetSemantics:'net-settled-plus-reserved-less-confirmed-refunds',budgetBase:'100',initialBalanceBase:'1000',entries:[],totals:{settledBase:'0',reservedBase:'0',refundedBase:'0',liabilityBase:'0',remainingBudgetBase:'100'}};
 const ok=checkResearchRun({summary:{runId:tr.runId,status:'error'},truth:tr,ledger,observer});assert.equal(ok.status,'pass',JSON.stringify(ok));assert.equal(ok.taskOutcome,'failed');const bad=structuredClone(ledger);bad.totals.liabilityBase='55';assert.equal(checkResearchRun({truth:tr,ledger:bad,observer}).status,'fail');
 const lost=structuredClone(ledger);lost.entries=[{purchaseId:'pending',quotedAmountBase:'20',state:'unknown',settledBase:'0',reservedBase:'0',refundedBase:'0',liabilityBase:'0'}];assert.equal(checkResearchRun({truth:tr,ledger:lost,observer}).status,'fail');
});
