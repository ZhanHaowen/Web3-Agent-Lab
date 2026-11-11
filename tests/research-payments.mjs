import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {createPaymentEnvironment} from '../src/payments/index.mjs';
const root=resolve(process.cwd()),out=resolve(process.argv[2]??join(root,'artifacts/research-payments',String(Date.now())));
await mkdir(out,{recursive:true});let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
for(const scheme of ['exact','batch-settlement']){
 const env=await createPaymentEnvironment({root,dataDir:join(out,scheme),scheme,authorization:'ap2'});
 try{
  const initial=await env.balances();
  const p=await env.pay({requestId:'request_1',providerId:'discover-lite',amountBase:'10000',resource:'shared-resource',body:{query:'example'},result:{value:'actual-http-result'}});
  console.log('OUTCOME '+JSON.stringify({scheme,status:p.status,txHash:p.txHash}));
  test(scheme+' receives actual HTTP response',()=>assert.deepEqual(p.delivery,{status:'delivered',result:{value:'actual-http-result'}}));
  test(scheme+' cryptographic AP2 overlay',()=>assert.equal(p.ap2.verified,true));
  test(scheme+' correct financial state',()=>assert.equal(p.status,scheme==='exact'?'settled':'pending'));
  test(scheme+' records real 402',()=>assert.ok(env.privateEvidence.events.some(e=>e.type==='payment.http_response'&&e.payload.status===402)));
  const duplicate=await env.pay({requestId:'request_1',providerId:'discover-lite',amountBase:'10000',resource:'shared-resource',body:{query:'example'},result:{value:'ignored'}});
  test(scheme+' idempotent application replay',()=>assert.equal(duplicate.paymentId,p.paymentId));
  const p2=await env.pay({requestId:'request_2',providerId:'discover-lite',amountBase:'10000',resource:'shared-resource',result:{value:'second'}});
  test(scheme+' second purchase delivered',()=>assert.equal(p2.delivery.status,'delivered'));
  const settled=await env.settle();
  test(scheme+' both settled independently checked',()=>assert.equal(settled.settledBase,'20000'));
  const balances=await env.balances();test(scheme+' recipient received exact total',()=>assert.equal(balances.providers.find(p=>p.id==='discover-lite').balanceBase,'20000'));
  const f=await env.pay({requestId:'request_fault',providerId:'analyze-lite',amountBase:'10000',resource:'shared-resource',result:{value:'must-not-deliver'},fault:'after-settlement-http-error'});
  test(scheme+' HTTP failure is not refund',()=>{assert.equal(f.delivery.status,'failed');assert.equal(f.chargedBase,'10000');assert.equal(f.refundedBase,'0');});
  const final=await env.settle();test(scheme+' failed service still charged',()=>assert.equal(final.settledBase,'30000'));
  await env.refund();const afterRefund=await env.balances();test(scheme+' unused escrow refund preserves spend',()=>assert.equal(afterRefund.payer,String(BigInt(initial.payer)-30000n)));
  test(scheme+' no reusable signature in event capture',()=>{for(const e of env.privateEvidence.events)if(e.type==='payment.authorization')assert.ok(!JSON.stringify(e.payload).match(/"signature":"0x[0-9a-f]{130}"/i));});
 }finally{await env.close();}
}
await writeFile(join(out,'summary.json'),JSON.stringify({passed,failed:0},null,2));console.log('SUMMARY '+passed+' passed');
