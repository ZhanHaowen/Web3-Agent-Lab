import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {LabChain,BudgetExperiment} from '../src/budget/engine.mjs';
import {ROOT,config} from '../src/budget/common.mjs';
import {makeDecisionFixture,transfer,authorize,redeem,finish} from './helpers/budget-model.mjs';
import {artifactPath} from './helpers/artifacts.mjs';
process.env.LAB_DATA_DIR=process.env.LAB_TEST_DATA_DIR??join(ROOT,'data-constraint-tests');
const chain=await new LabChain().start(),results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.message});console.error('FAIL',name,e);process.exitCode=1;}}
async function exp(backend,actions,fn,extra={}){const e=new BudgetExperiment(chain,{initial:'200',budget:'100',task:'Test the configured payment requests.',maxSteps:12,model:{backend:'local'},wallet:{backend},policy:{enabled:true},...extra},()=>{},makeDecisionFixture(actions));try{await e.initialize();await fn(e);}finally{await e.close();}}
try{
for(const backend of ['local-eoa','smart-account']){
 await test(backend+' confirmed exact 40/80 never silently becomes 40/20',()=>exp(backend,[transfer('40'),authorize('80'),authorize('20'),finish],async e=>{
  await e.run();
  assert.equal(e.check.actualSpent,'40000000');assert.equal(e.check.task.status,'failed');
  assert.equal(e.events.filter(x=>x.type==='permit.signed').length,0);
  assert.ok(e.events.some(x=>x.payload.reason==='TASK_AMOUNT_MISMATCH'));
 },{task:'同时向实验收款账户直接支付 40 BUD，申请80BUD的 Permit2 许可并兑现。',
  taskGoal:{mode:'exact',direct:'40',permit2:'80',confirmed:true}}));
 await test(backend+' exact40/50 is unchanged and completes',()=>exp(backend,[transfer('40'),authorize('50'),redeem,finish],async e=>{await e.run();assert.equal(e.check.actualSpent,'90000000');assert.equal(e.check.status,'success');assert.equal(e.check.task.status,'passed');},{taskGoal:{direct:'40',permit2:'50'}}));
 for(const [field,action,spent]of [['recipientAllowed',transfer('40'),'0'],['spenderAllowed',authorize('50'),'0'],['contractAllowed',authorize('50'),'0']])await test(backend+' '+field+' denied',()=>exp(backend,[action,finish],async e=>{await e.run();assert.equal(e.check.actualSpent,spent);assert.equal(e.events.filter(x=>x.type==='permit.signed').length,0);},{policy:{enabled:true,[field]:false}}));
 await test(backend+' literal empty whitelist denies',()=>exp(backend,[transfer('10'),finish],async e=>{await e.run();assert.equal(e.check.actualSpent,'0');},{policy:{enabled:true,allowedRecipients:[]}}));
 await test(backend+' expiry denies second request',()=>exp(backend,[transfer('40'),authorize('50'),finish],async e=>{await e.run();assert.equal(e.check.actualSpent,'40000000');assert.ok(e.events.some(x=>x.payload.reason==='POLICY_WINDOW_EXPIRED'));},{policy:{enabled:true,delaySeconds:86401}}));
 await test(backend+' review pauses and approve is single use',()=>exp(backend,[transfer('40'),finish],async e=>{await e.run();assert.equal(e.stage,'review');assert.equal(e.ledger.spent,'0');const id=e.pendingReview.reviewId;await assert.rejects(e.review({reviewId:'stale',decision:'approve'}));await e.review({reviewId:id,decision:'approve'});await assert.rejects(e.review({reviewId:id,decision:'approve'}));await e.run();assert.equal(e.check.actualSpent,'40000000');},{policy:{enabled:true,highRisk:true,onViolation:'review'}}));
 await test(backend+' review reject creates no payment',()=>exp(backend,[transfer('40'),finish],async e=>{
  await e.run();
  const { reviewId, toolCallId }=e.pendingReview;
  await e.review({reviewId,decision:'reject'});
  await e.run();
  assert.equal(e.check.actualSpent,'0');
  const rejected=e.bundle.files['evidence.json'].events.find(event=>event.type==='permission.rejected');
  assert.ok(toolCallId);
  assert.deepEqual(rejected?.payload,{
   step:1,tool:'transfer_tokens',toolCallId,reason:'HUMAN_REJECTED',layer:'human_review',walletReached:false,walletResult:null,
  });
 },{policy:{enabled:true,highRisk:true,onViolation:'review'}}));
 await test(backend+' hard budget cannot enter review',()=>exp(backend,[transfer('101'),finish],async e=>{await e.run();assert.equal(e.stage,'completed');assert.equal(e.check.actualSpent,'0');assert.equal(e.blocked.reason,'TASK_BUDGET_EXCEEDED');},{policy:{enabled:true,highRisk:true,onViolation:'review'}}));
 await test(backend+' time rechecked after manual review',()=>exp(backend,[transfer('40'),finish],async e=>{
  await e.run();
  const { reviewId, toolCallId }=e.pendingReview;
  await chain.rpc('evm_increaseTime',[86401]);
  await chain.rpc('evm_mine');
  await e.review({reviewId,decision:'approve'});
  await e.run();
  assert.equal(e.check.actualSpent,'0');
  const rejected=e.bundle.files['evidence.json'].events.find(event=>event.type==='permission.rejected');
  assert.ok(toolCallId);
  assert.deepEqual(rejected?.payload,{
   step:1,tool:'transfer_tokens',toolCallId,reason:'POLICY_WINDOW_EXPIRED',layer:'experiment_gateway',walletReached:false,walletResult:null,
  });
 },{policy:{enabled:true,highRisk:true,onViolation:'review'}}));
}
await test('invalid policy is rejected',async()=>{for(const policy of [{windowHours:0},{allowedRecipients:['bad']},{onViolation:'allow'}])assert.throws(()=>config({task:'test',model:{backend:'local'},policy}));});
}finally{await chain.stop();await writeFile(artifactPath('budget-constraints-results.json'),JSON.stringify({results,realEVM:true,model:'deterministic tool-call fixture; no external paid API'},null,2));}
