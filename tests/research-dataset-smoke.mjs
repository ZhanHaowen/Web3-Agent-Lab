/** Small real-chain dataset plumbing check, not a privacy research conclusion. */
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runResearchExperiment} from '../src/research/engine.mjs';
import {createPaymentEnvironment} from '../src/payments/index.mjs';
import {expandExperimentMatrix} from '../src/research/manifest.mjs';
import {makeDataset, assertSplitIsolation} from '../src/research/dataset.mjs';
import {evaluateDataset, evaluateNegativeControls} from '../src/research/evaluation.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),stamp=new Date().toISOString().replace(/[:.]/g,'-');
const out=resolve(process.env.LAB_RESEARCH_DATASET_OUT??join(root,'artifacts/research-dataset',stamp));await mkdir(out,{recursive:true});
const report={schema:'research-real-dataset-smoke-v1',startedAt:new Date().toISOString(),scope:'36 full-factor constructed scripted-policy samples (3 families x 3 strategies x 2 budgets x 2 replicates), actual official x402 exact + Anvil; validates collection/splits/isolated evaluator only, no scientific inference claim.',samples:[]};
const samples=[],families=['evidence_review','risk_analysis','trend_analysis'],strategies=['cost','quality','adaptive'];
const matrix=expandExperimentMatrix({base:{task:{instanceId:'factor-smoke',difficulty:3},initialBalanceBase:'1000000'},factors:{family:families,strategy:strategies,budgetBase:['60000','150000']},replicates:2,seed:200});
await writeFile(join(out,'private-factor-matrix.json'),JSON.stringify(matrix,null,2));
for(const cell of matrix){
 const {config}=cell,sampleId=`cell-${cell.scheduleIndex}-${cell.matrixCellHash.slice(0,8)}`,dir=join(out,sampleId);
 const summary=await runResearchExperiment(config,{root,outDir:dir,paymentDataDir:join(out,'runtime-'+sampleId),paymentFactory:createPaymentEnvironment});
 const truth=JSON.parse(await readFile(join(dir,'private/ground-truth.json'),'utf8')),observer=JSON.parse(await readFile(join(dir,'observer/observer.json'),'utf8'));
 report.samples.push({sampleId,dir,groupId:cell.groupId,matrixCellHash:cell.matrixCellHash,runId:summary.runId,taskOutcome:summary.taskOutcome,checkerStatus:summary.checkerStatus,privacyDatasetReady:summary.privacyDatasetReady});
 assert.equal(summary.privacyDatasetReady,true);samples.push({sampleId,truth,observer});
 await writeFile(join(out,'smoke-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({sampleId,taskOutcome:summary.taskOutcome,ready:summary.privacyDatasetReady}));
}
const dataset=makeDataset({samples,seed:'integration-smoke-36-v1',groupBy:'instance'});assertSplitIsolation(dataset);
const evaluation=evaluateDataset(dataset),negative=evaluateNegativeControls(dataset);
assert.equal(dataset.rows.length,36);assert.equal(evaluation.attackInput.testTruthPassed,false);assert.ok(dataset.splitCounts.train>0&&dataset.splitCounts.test>0);
assert.equal(dataset.retention.retainedSamples,36);assert.ok(dataset.retention.failedOrUnknown>0);
await writeFile(join(out,'private-dataset.json'),JSON.stringify(dataset,null,2));await writeFile(join(out,'private-evaluation.json'),JSON.stringify(evaluation,null,2));await writeFile(join(out,'private-negative-controls.json'),JSON.stringify(negative,null,2));
report.finishedAt=new Date().toISOString();report.passed=true;report.retention=dataset.retention;report.splitCounts=dataset.splitCounts;report.testTruthPassed=evaluation.attackInput.testTruthPassed;
await writeFile(join(out,'smoke-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,report:join(out,'smoke-report.json'),retention:report.retention,splitCounts:report.splitCounts}));
