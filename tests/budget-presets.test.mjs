import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCase,previewConfig,parseAmount,formatAmount,CASES} from '../public/budget-presets.js';
const base={initial:'200',budget:'100',payment:'80',permit:'60',mode:'split',secondPath:'permit'};
test('categories name experiment classes without embedding one numeric example',()=>{
 assert.equal(CASES.length,7);
 assert.ok(CASES.every(c=>!/[0-9]/.test(c.label)));
 assert.ok(CASES.some(c=>c.id==='custom'));
});
test('changed first payment is retained and excess amount uses current remaining budget',()=>{
 const input={...base,payment:'90'};
 const generated=generateCase('split-over',input,'7');
 assert.deepEqual(generated,{...input,permit:'17'});
 assert.equal(previewConfig(generated).expectedSpent,'107');
 assert.equal(previewConfig(generated).expectedOverspend,'7');
 assert.deepEqual(input,{...base,payment:'90'});
});
test('same over-budget amounts can compare split and unified policies',()=>{
 const input={...base,initial:'4000',budget:'1250',payment:'750',permit:'1'};
 const split=generateCase('split-over',input,'125'),unified=generateCase('unified-over',input,'125');
 assert.equal(split.permit,'625');assert.equal(unified.permit,'625');
 assert.equal(split.initial,'4000');assert.equal(split.budget,'1250');assert.equal(split.payment,'750');
 assert.equal(previewConfig(split).expectedSpent,'1375');
 assert.equal(previewConfig(unified).expectedSpent,'750');
 assert.equal(previewConfig(unified).expectedOverspend,'0');
});
test('six-decimal generation and preview never use floating point rounding',()=>{
 const input={...base,initial:'1.000001',budget:'0.3',payment:'0.1',permit:''};
 const exact=generateCase('boundary',input,'not-used');
 assert.equal(exact.permit,'0.2');assert.equal(exact.payment,'0.1');
 assert.equal(previewConfig(exact).plannedTotal,'0.3');
 const within=generateCase('within',input,'0.000001');
 assert.equal(within.permit,'0.199999');assert.equal(previewConfig(within).expectedSpent,'0.299999');
 const over=generateCase('split-over',input,'0.000001');
 assert.equal(over.permit,'0.200001');assert.equal(previewConfig(over).expectedOverspend,'0.000001');
});
test('exact boundary and budget-inside categories adapt across unrelated scales',()=>{
 for(const [budget,payment,delta,expected] of [['9','2','3','4'],['0.000010','0.000003','0.000001','0.000006'],['987654321','765432100','1234567','220987654']]){
  const input={...base,initial:'999999999',budget,payment};
  assert.equal(generateCase('within',input,delta).permit,expected);
  const boundary=generateCase('boundary',input,delta);
  assert.equal(previewConfig(boundary).classification,'恰好用尽预算');
 }
});
test('impossible generated controls are rejected rather than clamped',()=>{
 assert.throws(()=>generateCase('split-over',{...base,initial:'105'},'6'),/钱包不足/);
 assert.throws(()=>generateCase('split-over',{...base,payment:'3'},'4'),/单张许可/);
 assert.throws(()=>generateCase('split-over',{...base,payment:'0'},'1'),/首笔交易大于零/);
 assert.throws(()=>generateCase('boundary',{...base,payment:'100'}),/没有可生成/);
 assert.throws(()=>generateCase('within',{...base,payment:'99'},'1'),/小于当前剩余预算/);
 assert.throws(()=>generateCase('unified-over',{...base,payment:'101'},'1'),/首笔交易已超过/);
});
test('single-path controls derive amounts from current budget and preserve wallet parameters',()=>{
 const input={...base,initial:'700',budget:'250',payment:'70',permit:'9'};
 const permit=generateCase('permit-only',input,'25');
 assert.deepEqual(permit,{...input,payment:'0',permit:'225',mode:'unified',secondPath:'permit'});
 assert.equal(previewConfig(permit).expectedSpent,'225');
 const tx=generateCase('transaction-only',input,'15');
 assert.deepEqual(tx,{...input,permit:'195',mode:'unified',secondPath:'transaction'});
 assert.equal(previewConfig(tx).expectedSpent,'70');
});
test('custom previews derive the actual outcome independently of a category label',()=>{
 const within=previewConfig({...base,payment:'90',permit:'5'});
 assert.equal(within.classification,'预算内组合支出');assert.equal(within.expectedSpent,'95');
 const cap=previewConfig({...base,permit:'101'});
 assert.equal(cap.classification,'单张许可超出任务上限');assert.equal(cap.expectedSpent,'80');
 const insufficient=previewConfig({...base,initial:'120',permit:'60'});
 assert.equal(insufficient.classification,'钱包余额不足');assert.equal(insufficient.expectedSpent,null);
 const first=previewConfig({...base,payment:'101'});
 assert.equal(first.expectedSpent,'0');
});
test('amount parsing rejects scientific, negative, non-string and excess precision input',()=>{
 for(const value of ['1e2','-1','0.0000001',1])assert.throws(()=>parseAmount(value));
 assert.equal(parseAmount('0.000001'),1n);
 assert.equal(formatAmount(1000001n),'1.000001');
 assert.equal(formatAmount(-1n),'-0.000001');
 assert.equal(previewConfig({...base,budget:'201'}).valid,false);
});
test('all generated cases serialize the six runtime fields without template-only settings',()=>{
 const keys=Object.keys(base).sort();
 for(const c of CASES.filter(x=>x.id!=='custom')){
  const generated=generateCase(c.id,base,'1');
  assert.deepEqual(Object.keys(generated).sort(),keys);
  assert.ok(Object.values(generated).every(v=>typeof v==='string'));
 }
 assert.deepEqual(generateCase('custom',base),base);
});
