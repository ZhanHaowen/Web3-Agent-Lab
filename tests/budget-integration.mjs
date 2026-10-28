import {artifactPath,artifactDirectory} from './helpers/artifacts.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {LabChain,BudgetExperiment} from '../src/budget/engine.mjs';
import {ROOT,clone,stringify,config,sha} from '../src/budget/common.mjs';
import {verify,seal} from '../src/budget/checker.mjs';
process.env.LAB_DATA_DIR=join(ROOT,'data-budget-tests/compatibility');
const chain=await new LabChain().start(),results=[];
await mkdir(artifactDirectory('fixtures/budget'),{recursive:true});
async function test(name,fn){
 const start=Date.now();try{await fn();results.push({name,passed:true,elapsedMs:Date.now()-start});console.log('PASS',name);}
 catch(e){results.push({name,passed:false,error:e.message});console.error('FAIL',name,e.stack);process.exitCode=1;}
}
async function experiment(input,fn){const e=new BudgetExperiment(chain,input);try{await e.initialize();await fn(e);}finally{await e.close();}}
let splitBundle;
try{
 await test('01 split policy reproduces 140 actual / 80 normal counter',()=>experiment({},async e=>{
  await e.run();assert.equal(e.check.reproduction,true);assert.equal(e.check.status,'failed');assert.equal(e.check.actualSpent,'140000000');assert.equal(e.check.normalTransactionCounter,'80000000');assert.equal(e.final.balance,'60000000');assert.equal(e.check.overspend,'40000000');
  assert.notEqual(e.signer.pid,process.pid);assert.notEqual(e.owner.toLowerCase(),e.spender.toLowerCase());
  assert.equal(new Set(e.events.map(x=>x.sessionId)).size,1);
  assert.equal(verify(e.bundle).reproduction,true);
  assert.ok(!stringify(e.bundle).includes('"signature":'));
  splitBundle=clone(e.bundle);await writeFile(artifactPath('fixtures/budget/01-split-overspend.json'),JSON.stringify(e.bundle,null,2));
 }));
 await test('02 unified budget rejects permit 60 after payment 80',()=>experiment({mode:'unified'},async e=>{
  await e.run();assert.equal(e.blocked.reason,'TASK_BUDGET_EXCEEDED');assert.equal(e.final.balance,'120000000');assert.equal(e.check.actualSpent,'80000000');assert.equal(e.check.status,'success');assert.equal(e.events.some(x=>x.type==='permit.signed'),false);
  await writeFile(artifactPath('fixtures/budget/02-unified-blocked.json'),JSON.stringify(e.bundle,null,2));
 }));
 await test('03 unified 80 + permit 20 reaches exact budget',()=>experiment({mode:'unified',permit:'20'},async e=>{
  await e.run();assert.equal(e.check.status,'success');assert.equal(e.check.actualSpent,'100000000');assert.equal(e.final.balance,'100000000');assert.equal(e.ledger.reserved,'0');
  await writeFile(artifactPath('fixtures/budget/03-exact-boundary.json'),JSON.stringify(e.bundle,null,2));
 }));
 await test('04 unified 80 + permit 21 is rejected',()=>experiment({mode:'unified',permit:'21'},async e=>{
  await e.run();assert.equal(e.blocked.stage,'authorization');assert.equal(e.check.actualSpent,'80000000');
 }));
 await test('05 permit-only positive control transfers 60',()=>experiment({payment:'0'},async e=>{
  await e.run();assert.equal(e.check.status,'success');assert.equal(e.check.actualSpent,'60000000');assert.equal(e.final.balance,'140000000');assert.equal(e.check.normalTransactionCounter,'0');
 }));
 await test('06 split transaction-only 80 + 60 is rejected',()=>experiment({secondPath:'transaction'},async e=>{
  await e.run();assert.equal(e.blocked.reason,'TASK_BUDGET_EXCEEDED');assert.equal(e.check.actualSpent,'80000000');assert.equal(e.check.status,'success');
 }));
 await test('07 reused signature nonce cannot transfer twice',()=>experiment({permit:'20'},async e=>{
  await e.step();await e.step();await e.step();
  await assert.rejects(e.redeem({replay:true}),/CHAIN_REVERT/);
  await e.step();assert.equal(e.final.balance,'100000000');assert.equal(e.check.actualSpent,'100000000');
 }));
 await test('08 a different spender cannot redeem the signed permit',()=>experiment({permit:'20'},async e=>{
  await e.step();await e.step();
  await assert.rejects(e.redeem({wrongSpender:true}),/CHAIN_REVERT/);
  await e.step();await e.step();assert.equal(e.check.actualSpent,'100000000');
 }));
 await test('09 wrong session and transaction destination override are rejected',()=>experiment({mode:'unified'},async e=>{
  await assert.rejects(e.signer.call('pay',e.scope({sessionId:'wrong',amount:'80'})),/SESSION_SCOPE/);
  await assert.rejects(e.signer.call('pay',e.scope({amount:'80',recipient:e.spender})),/PAY_FIELDS/);
  await assert.rejects(e.signer.call('permit',e.scope({amount:'60',spender:e.recipient})),/PERMIT_FIELDS/);
  assert.equal((await e.snapshot()).balance,'200000000');
 }));
 await test('10 concurrent permits share one reservation ledger',()=>experiment({mode:'unified'},async e=>{
  await e.step();
  const r=await Promise.allSettled([e.signer.call('permit',e.scope({amount:'15'})),e.signer.call('permit',e.scope({amount:'15'}))]);
  assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(r.filter(x=>x.status==='rejected').length,1);
  e.signed=r.find(x=>x.status==='fulfilled').value;assert.equal(e.signed.ledger.reserved,'15000000');
  await assert.rejects(e.signer.call('pay',e.scope({amount:'10'})),/TASK_BUDGET_EXCEEDED/);
  await e.redeem();await e.finish();assert.equal(e.check.actualSpent,'95000000');assert.equal(e.ledger.reserved,'0');
 }));
 await test('11 permit reservation also limits a later normal transaction',()=>experiment({mode:'unified'},async e=>{
  e.signed=await e.signer.call('permit',e.scope({amount:'60'}));
  await assert.rejects(e.signer.call('pay',e.scope({amount:'80'})),/TASK_BUDGET_EXCEEDED/);
  await e.redeem();await e.finish();assert.equal(e.check.actualSpent,'60000000');
 }));
 await test('12 config rejects negative, excess precision, scientific and unknown fields',async()=>{
  for(const x of ['-1','1e2','0.0000001',100])assert.throws(()=>config({permit:x}));
  assert.throws(()=>config({arbitraryCalldata:'0x'}),/UNKNOWN_CONFIG_FIELD/);
  assert.throws(()=>config({budget:'201'}),/BUDGET_EXCEEDS_BALANCE/);
 });
 await test('13 export integrity and raw log checker detect tampering',async()=>{
  const bad=clone(splitBundle);bad.files['evidence.json'].final.balance='120000000';assert.throws(()=>verify(bad),/BUNDLE_HASH/);
  const fabricated=clone(splitBundle.files['evidence.json']);fabricated.transfers=[];const c=verify(seal(fabricated));assert.equal(c.status,'failed');assert.equal(c.reproduction,false);assert.equal(c.actualSpent,'140000000');
 });
 await test('14 offline CLI distinguishes integrity from budget violation',async()=>{
  const p=artifactPath('fixtures/budget/01-split-overspend.json');
  const a=spawnSync(process.execPath,[join(ROOT,'src/budget/cli.mjs'),'verify',p],{encoding:'utf8',windowsHide:true});
  const b=spawnSync(process.execPath,[join(ROOT,'src/budget/cli.mjs'),'check',p],{encoding:'utf8',windowsHide:true});
  assert.equal(a.status,0,a.stderr);assert.equal(b.status,2,b.stderr);
 });
 await test('15 expired permit cannot be redeemed and causes no token debit',()=>experiment({mode:'unified',payment:'0'},async e=>{
  await e.step();await e.step();await chain.rpc('evm_increaseTime',[601]);await chain.rpc('evm_mine',[]);
  await assert.rejects(e.redeem(),/CHAIN_REVERT/);await e.finish();assert.equal(e.final.balance,'200000000');assert.equal(e.check.actualSpent,'0');
 }));
 await test('16 first payment above budget is rejected without any token debit',()=>experiment({mode:'unified',payment:'101'},async e=>{
  await e.run();assert.equal(e.blocked.stage,'payment');assert.equal(e.final.balance,'200000000');assert.equal(e.check.actualSpent,'0');assert.equal(e.check.status,'success');
 }));
}finally{
 await chain.stop();
 await writeFile(artifactPath('v0153-budget-results.json'),JSON.stringify({version:'V0.15.3',buildHash:JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash,time:new Date().toISOString(),realEVM:true,officialPermit2:true,cloudModelTested:false,results},null,2));
}
