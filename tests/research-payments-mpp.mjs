import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {createMppPaymentEnvironment} from '../src/payments/mpp.mjs';
const root=resolve(process.cwd()),out=resolve(process.argv[2]??join(root,'artifacts/research-payments-mpp',String(Date.now())));
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const env=await createMppPaymentEnvironment({root,dataDir:out});
try{
 const input={requestId:'mpp_first',providerId:'discover-lite',amountBase:'10000',resource:'shared-service',body:{query:'demo'},result:{coverage:1}};
 const p=await env.pay(input);
 test('native MPP charge is settled on real EVM',()=>{assert.equal(p.status,'settled');assert.equal(p.settledBase,'10000');assert.equal(p.receipt.status,'success');});
 test('actual HTTP service result is delivered',()=>assert.deepEqual(p.delivery,{status:'delivered',result:{coverage:1}}));
 test('official MPP Payment-auth challenge captured',()=>assert.ok(env.privateEvidence.events.some(e=>e.type==='payment.http_response'&&e.payload.status===402&&e.payload.headers['www-authenticate']?.startsWith('Payment '))));
 test('official MPP receipt captured',()=>assert.ok(env.privateEvidence.events.some(e=>e.type==='payment.http_response'&&e.payload.headers['payment-receipt'])));
 const replay=await env.pay(input);test('application retry cannot double-charge',()=>assert.equal(replay.txHash,p.txHash));
 await assert.rejects(env.pay({...input,body:{query:'substituted'}}),{code:'IDEMPOTENCY_CONFLICT'});passed++;console.log('PASS conflicting replay rejected');
 const f=await env.pay({...input,requestId:'mpp_failure',providerId:'analyze-lite',fault:'http_failure'});
 test('HTTP 503 preserves confirmed charge',()=>{assert.equal(f.delivery.status,'failed');assert.equal(f.chargedBase,'10000');assert.equal(f.refundedBase,'0');assert.equal(f.httpStatus,503);});
 const final=await env.settle();test('independent chain balances equal charged total',()=>assert.equal(final.settledBase,'20000'));
 const balances=await env.balances();test('payer pays exact two charges',()=>assert.equal(balances.payer,'980000'));
 test('EVM internal call trace captured or explicitly unavailable',()=>assert.ok(env.privateEvidence.transactions.every(t=>['available','unavailable'].includes(t.callTrace?.status))));
 test('reusable MPP credential excluded from raw HTTP capture',()=>{const rs=env.privateEvidence.events.filter(e=>e.type==='payment.http_request'&&e.payload.headers.authorization);assert.ok(rs.length);assert.ok(rs.every(e=>e.payload.headers.authorization.redacted));});
}finally{await env.close();}
await writeFile(join(out,'summary.json'),JSON.stringify({passed,failed:0},null,2));console.log('SUMMARY '+passed+' passed; '+out);
