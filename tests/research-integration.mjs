/** Real isolated Anvil + official x402 SDK research workflows. Scripted policies
 * are explicitly labelled; these cases make no claim about LLM intelligence. */
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runResearchExperiment, readCompletedResearchExperiment} from '../src/research/engine.mjs';
import {createPaymentEnvironment} from '../src/payments/index.mjs';
import {createEscrowEnvironment} from '../src/research/escrow.mjs';
import {createMppPaymentEnvironment} from '../src/payments/mpp.mjs';
import {generateBackground} from '../src/research/background.mjs';
import {checkResearchRun} from '../src/research/checker.mjs';
import {validatePublicObserver} from '../src/observer/index.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.env.LAB_RESEARCH_TEST_OUT ?? join(root, 'artifacts/test-results/research-engine-' + new Date().toISOString().replace(/[:.]/g,'-')));
await mkdir(output,{recursive:true});
const json = async path => JSON.parse(await readFile(path,'utf8'));
const results = {schema:'research-integration-report-v1',startedAt:new Date().toISOString(),execution:'real_anvil_official_x402_and_local_erc8183',modelMode:'scripted',output,cases:[]};
const scenarios = [
 {name:'exact-quality',config:{strategy:'quality'},background:true},
 {name:'batch-adaptive',config:{strategy:'adaptive',budgetBase:'200000',payment:{scheme:'batch'},task:{family:'risk_analysis',instanceId:'batch-adaptive',difficulty:3}}},
 {name:'ap2-exact-quality',config:{strategy:'quality',payment:{authorization:'ap2'},task:{family:'trend_analysis',instanceId:'ap2-quality',difficulty:3}}},
 {name:'exact-http-failure-keeps-charge',config:{strategy:'adaptive',budgetBase:'200000',task:{difficulty:3},workload:{faults:[{purchaseIndex:0,kind:'http_failure'}]}},paidFailure:true},
 {name:'batch-http-failure-keeps-charge',config:{strategy:'adaptive',budgetBase:'200000',payment:{scheme:'batch'},task:{difficulty:3},workload:{faults:[{purchaseIndex:0,kind:'http_failure'}]}},paidFailure:true},
 {name:'erc8183-quality',config:{strategy:'quality',payment:{scheme:'erc8183'}}},
 {name:'erc8183-reject-refund',config:{strategy:'adaptive',budgetBase:'200000',payment:{scheme:'erc8183'},task:{difficulty:3},workload:{faults:[{purchaseIndex:0,kind:'withheld'}]}},escrowRefund:true},
 {name:'erc8183-expiry-refund',config:{strategy:'adaptive',budgetBase:'200000',payment:{scheme:'erc8183'},task:{difficulty:3},workload:{faults:[{purchaseIndex:0,kind:'timeout'}]}},escrowRefund:true},
 {name:'mpp-quality',config:{strategy:'quality',payment:{scheme:'mpp-evm-charge'}}},
 {name:'mpp-http-failure-keeps-charge',config:{strategy:'adaptive',budgetBase:'200000',payment:{scheme:'mpp-evm-charge'},task:{difficulty:3},workload:{faults:[{purchaseIndex:0,kind:'http_failure'}]}},paidFailure:true},
];
for (const scenario of scenarios) {
 const row={name:scenario.name,startedAt:new Date().toISOString(),assertions:[]};results.cases.push(row);
 const check=(name,condition)=>{row.assertions.push({name,passed:Boolean(condition)});assert.ok(condition,name);};
 try {
  const runDir=join(output,scenario.name),background=[];
  const summary=await runResearchExperiment(scenario.config,{outDir:runDir,root,paymentDataDir:join(output,'runtime-'+scenario.name),paymentFactory:options=>options.scheme==='erc8183'?createEscrowEnvironment(options):options.scheme==='mpp-evm-charge'?createMppPaymentEnvironment(options):createPaymentEnvironment(options),
   beforePurchase:scenario.background?async({payments,purchaseIndex})=>{if(purchaseIndex>1)return;const emitted=await generateBackground({rpcUrl:payments.rpcUrl,count:1,seed:'independent-background-'+purchaseIndex});background.push(...emitted.records);return emitted;}:undefined});
  row.summary=summary;
  const truth=await json(join(runDir,'private/ground-truth.json')),ledger=await json(join(runDir,'private/budget-ledger.json')),observer=await json(join(runDir,'observer/observer.json'));
  const independent=checkResearchRun({summary,truth,ledger,observer});row.independentChecker=independent;
  check('actual chain evidence complete',summary.recordingComplete&&summary.evidenceOrigin==='real_chain'&&summary.observerPresent);
  check('finished without unresolved liabilities',summary.status==='completed'&&ledger.totals.reservedBase==='0');
  check('task independently succeeds',summary.taskOutcome==='success');
  check('ledger and RPC projection independently validate',independent.status==='pass'&&validatePublicObserver(observer).ok);
  check('model mode labelled scripted',summary.mode==='scripted'&&summary.costs.modelCalls===0);
  check('window gas derives from all public receipts',summary.observer.windowGasUsed===String(observer.transactions.reduce((n,t)=>n+BigInt(t.gasUsed),0n))&&summary.observer.windowGasCostWei===String(observer.transactions.reduce((n,t)=>n+BigInt(t.gasUsed)*BigInt(t.effectiveGasPrice),0n)));
  check('no private task labels or run identity in observer text',![summary.runId,truth.task.instanceId,'privateBudgetBase','groundTruth','procurementStrategy'].some(x=>JSON.stringify(observer).includes(x)));
  check('recorded purchases match ledger',truth.purchases.length===ledger.entries.length&&truth.purchases.every(p=>ledger.entries.some(e=>e.purchaseId===p.purchaseId)));
  const saved=await readCompletedResearchExperiment(runDir,scenario.config);check('sealed files validate on read-only resume',saved.resumedReadOnly===true);
  if(scenario.config.payment?.scheme==='batch') {
   check('unused channel capital refunded separately',BigInt(summary.capitalRefund?.refundedBase??'0')>0n&&ledger.totals.refundedBase==='0');
   check('actual wallet delta matches settled service expense after channel cleanup',BigInt(truth.initialBalanceBase)-BigInt(summary.chainBalances.payer)===BigInt(ledger.totals.settledBase));
  }
  if(scenario.paidFailure)check('HTTP failure does not refund settled service charge',truth.purchases[0].deliveryStatus==='failed'&&ledger.entries[0].settledBase===truth.purchases[0].quotedAmountBase&&ledger.entries[0].refundedBase==='0');
  if(scenario.escrowRefund)check('escrow refunds are confirmed and reduce only own failed-job net charge',truth.purchases[0].deliveryStatus==='failed'&&ledger.entries[0].refundedBase===truth.purchases[0].quotedAmountBase&&ledger.entries[0].liabilityBase==='0');
  if(scenario.background) {
   check('real background transactions present in full public window',background.length===2&&background.every(b=>observer.transactions.some(tx=>tx.hash===b.transactionHash)));
   check('background not tagged for attacker',!JSON.stringify(observer).includes('independent-background'));
  }
  const ev=(await readFile(join(runDir,'raw/events.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
  if(scenario.config.payment?.scheme!=='erc8183') {
   const http=await Promise.all(ev.filter(e=>e.type==='payment.http_response').map(e=>json(join(runDir,e.payloadRef.path))));
   check('actual HTTP402 challenge present',http.some(p=>p.status===402));
  }
  row.status='passed';
 } catch(error) {row.status='failed';row.error=error.stack;process.exitCode=1;}
 row.finishedAt=new Date().toISOString();await writeFile(join(output,'report.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({case:row.name,status:row.status,checks:row.assertions.length,failed:row.assertions.filter(a=>!a.passed),error:row.error}));
}
results.finishedAt=new Date().toISOString();results.passed=results.cases.every(row=>row.status==='passed');
await writeFile(join(output,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.passed,report:join(output,'report.json')}));
