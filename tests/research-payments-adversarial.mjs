import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createPaymentEnvironment} from '../src/payments/index.mjs';
import {createMppPaymentEnvironment} from '../src/payments/mpp.mjs';
const root=resolve(process.cwd()),out=resolve(process.argv[2]??join(root,'artifacts/research-payments-adversarial',String(Date.now())));await mkdir(out,{recursive:true});
let passed=0;const ok=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
for(const protocol of ['x402','mpp']){
 const env=await(protocol==='x402'?createPaymentEnvironment:createMppPaymentEnvironment)({root,dataDir:join(out,protocol),receiptTimeoutMs:350});
 try{
  const c=env.chainAccess;
  await c.publicClient.request({method:'evm_setAutomine',params:[false]});
  const p=await env.pay({requestId:'delayed_confirmation',providerId:'discover-lite',amountBase:'10000',result:{value:'not delivered before payment confirmation'}});
  ok(protocol+' unconfirmed broadcast remains unknown and reserved',()=>{assert.equal(p.status,'unknown');assert.equal(p.reservedBase,'10000');assert.equal(p.delivery.status,'failed');assert.match(p.txHash,/^0x/);});
  await c.publicClient.request({method:'evm_mine',params:[]});await c.publicClient.request({method:'evm_setAutomine',params:[true]});
  const settled=await env.settle();
  ok(protocol+' late confirmation reconciles against actual token Transfer logs',()=>{assert.equal(settled.payments[0].status,'settled');assert.equal(settled.settledBase,'10000');assert.equal(settled.pendingBase,'0');assert.equal(settled.payments[0].delivery.status,'failed');});
  const input={requestId:'idempotency',providerId:'analyze-lite',amountBase:'10000',resource:'same',body:{query:'same'},result:{ok:true}};await env.pay(input);
  await assert.rejects(env.pay({...input,resource:'changed'}),{code:'IDEMPOTENCY_CONFLICT'});passed++;console.log('PASS '+protocol+' resource substitution replay rejected');
  // Independent adversarial assertion: same valid EIP-3009 authorization cannot
  // be settled twice, even if a caller bypasses application request-id caching.
  const message={from:env.payer,to:env.providers[0].address,value:10000n,validAfter:0n,validBefore:BigInt(Math.floor(Date.now()/1000)+600),nonce:'0x'+randomBytes(32).toString('hex')};
  const signature=await c.payerWallet.signTypedData({domain:{name:env.token.name,version:env.token.version,chainId:env.chainId,verifyingContract:env.token.address},primaryType:'TransferWithAuthorization',types:{TransferWithAuthorization:[{name:'from',type:'address'},{name:'to',type:'address'},{name:'value',type:'uint256'},{name:'validAfter',type:'uint256'},{name:'validBefore',type:'uint256'},{name:'nonce',type:'bytes32'}]},message});
  const args=[message.from,message.to,message.value,message.validAfter,message.validBefore,message.nonce,signature],call={address:env.token.address,abi:c.tokenAbi,functionName:'transferWithAuthorization',args};
  await c.receipt(await c.wallet.writeContract(call));
  await assert.rejects(c.publicClient.simulateContract({...call,account:c.wallet.account}));passed++;console.log('PASS '+protocol+' token rejects signed authorization replay');
  await assert.rejects(c.publicClient.simulateContract({...call,args:[...args.slice(0,2),20000n,...args.slice(3)],account:c.wallet.account}));passed++;console.log('PASS '+protocol+' token rejects signed amount substitution');
 }finally{await env.close();}
}
await writeFile(join(out,'summary.json'),JSON.stringify({passed,failed:0},null,2));console.log('SUMMARY '+passed+' passed; '+out);
