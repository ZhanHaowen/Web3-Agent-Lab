import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {createPaymentEnvironment} from '../payments/index.mjs';

const json=x=>JSON.stringify(x,(_k,v)=>typeof v==='bigint'?String(v):v),clone=x=>JSON.parse(json(x));
const commitment=x=>'0x'+createHash('sha256').update(json(x)).digest('hex');
const zero='0x0000000000000000000000000000000000000000';
/** Real local ERC-8183 core state machine; no claim of Virtuals SDK interoperability. */
export async function createEscrowEnvironment(options={}){
 if(options.authorization&&options.authorization!=='none')throw Error('ESCROW_AP2_NOT_IMPLEMENTED');
 const env=await createPaymentEnvironment({...options,scheme:'exact',authorization:'none'});
 try{
  const a=JSON.parse(await readFile(join(options.root,'packages/payment-adapters/artifacts/AgentResearchJob.json'),'utf8'));
  const access=env.chainAccess,{publicClient,wallet,payerWallet,providerWallets,receipt,tokenAbi}=access;
  const deployment=await receipt(await wallet.deployContract({abi:a.abi,bytecode:a.bytecode,args:[env.token.address]}));
  if(deployment.status!=='success')throw Error('ESCROW_DEPLOY_FAILED');
  const address=deployment.contractAddress,results=new Map(),attempts=new Map(),txs=[];let queue=Promise.resolve(),closed=false;
  const emit=async(type,payload)=>{await options.emit?.({type,payload:clone(payload)});};
  const send=async(client,functionName,args)=>{const hash=await client.writeContract({address,abi:a.abi,functionName,args}),r=await receipt(hash),tx=await publicClient.getTransaction({hash});const entry=clone({hash,receipt:r,transaction:tx,functionName});txs.push(entry);await emit('payment.contract_transaction',entry);if(r.status!=='success')throw Error('ESCROW_TRANSACTION_REVERTED');return r;};
  const balance=address=>publicClient.readContract({address:env.token.address,abi:tokenAbi,functionName:'balanceOf',args:[address]});
  async function pay(input){
   if(closed)throw Error('ENVIRONMENT_CLOSED');options.signal?.throwIfAborted();
   if(!/^[A-Za-z0-9_-]{1,160}$/.test(input.requestId??''))throw Error('ESCROW_REQUEST_ID');
   const binding=commitment({providerId:input.providerId,amountBase:input.amountBase,resource:input.resource,body:input.body});
   if(results.has(input.requestId)){const old=results.get(input.requestId);if(old.binding!==binding)throw Error('IDEMPOTENCY_CONFLICT');return clone(old);}
   if(attempts.has(input.requestId)){if(attempts.get(input.requestId).binding!==binding)throw Error('IDEMPOTENCY_CONFLICT');throw Error('ESCROW_PREVIOUS_ATTEMPT_UNRESOLVED');}
   const provider=env.providers.find(p=>p.id===input.providerId);if(!provider||!/^[1-9][0-9]*$/.test(input.amountBase??''))throw Error('ESCROW_INPUT');
   const amount=BigInt(input.amountBase),before=await balance(provider.address),payerBefore=await balance(env.payer),block=await publicClient.getBlock(),txStart=txs.length;
   attempts.set(input.requestId,{binding,state:'in_progress',txStart});await emit('payment.escrow_attempt',{requestId:input.requestId,binding,state:'in_progress'});
   const expires=block.timestamp+3600n;
   await send(payerWallet,'createJob',[provider.address,wallet.account.address,expires,'Shared research service',zero]);
   const id=await publicClient.readContract({address,abi:a.abi,functionName:'jobCounter'});
   attempts.get(input.requestId).jobId=String(id);await emit('payment.escrow_job_link',{requestId:input.requestId,jobId:String(id)});
   await send(payerWallet,'setBudget',[id,amount]);
   const approval=await receipt(await payerWallet.writeContract({address:env.token.address,abi:tokenAbi,functionName:'approve',args:[address,amount]}));
   await emit('payment.token_approval',{requestId:input.requestId,amountBase:input.amountBase,receipt:approval});
   await send(payerWallet,'fund',[id,amount]);
   let delivered=!['withheld','http_failure','timeout'].includes(input.fault),terminal;
   if(input.fault==='timeout'){
    await publicClient.request({method:'evm_setNextBlockTimestamp',params:[Number(expires)]});await publicClient.request({method:'evm_mine',params:[]});terminal=await send(wallet,'claimRefund',[id]);
   }else if(!delivered)terminal=await send(wallet,'reject',[id,commitment('delivery unavailable')]);
   else{
    const salt=randomBytes(32).toString('hex'),deliverable=commitment({salt,result:input.result});
    await emit('payment.private_deliverable_commitment',{requestId:input.requestId,jobId:String(id),salt,deliverable,resultSha256:commitment(input.result),visibility:'private-researcher-only'});
    await send(providerWallets.get(provider.id),'submit',[id,deliverable]);terminal=await send(wallet,'complete',[id,commitment('local evaluator accepted delivery')]);
   }
   const actual=await publicClient.readContract({address,abi:a.abi,functionName:'getJob',args:[id]}),after=await balance(provider.address),payerAfter=await balance(env.payer),refunded=actual.status===4||actual.status===5;
   if(after-before!==(refunded?0n:amount)||payerBefore-payerAfter!==(refunded?0n:amount))throw Error('ESCROW_BALANCE_MISMATCH');
   const result=clone({binding,requestId:input.requestId,paymentId:String(id),providerId:provider.id,scheme:'erc8183',status:'settled',amountBase:input.amountBase,chargedBase:input.amountBase,settledBase:input.amountBase,refundedBase:refunded?input.amountBase:'0',reservedBase:'0',txHash:terminal.transactionHash,receipt:terminal,jobId:String(id),jobStatus:actual.status,delivery:{status:delivered?'delivered':'failed',...(delivered?{result:input.result}:{})},publicPaymentRefs:txs.slice(txStart).map(t=>({txHash:t.hash,blockNumber:t.receipt.blockNumber})),payerBalanceDeltaBase:String(payerAfter-payerBefore)});
   results.set(input.requestId,result);attempts.get(input.requestId).state='resolved';await emit('payment.outcome',result);return clone(result);
  }
  const manifest={...env.deploymentManifest,protocol:'erc8183',scheme:'erc8183',authorization:'none',sdkVersion:null,upstreamCommit:null,contract:address,contractSourceHashes:a.sourceHashes,scope:'Locally implemented ERC-8183 core; no hooks / fees / ERC-2771 / production Virtuals interoperability',publicDescription:'Shared research service',budgetMeaning:'Public per-job price; not the private total task authorization',deliverableCommitment:'SHA256(JSON({salt:random-32-byte-hex,result})); salt retained only in private evidence; deployment choice, not a universal protocol guarantee'};
  const result={...env,deploymentManifest:manifest,pay:input=>{const pending=queue.then(()=>pay(input));queue=pending.catch(()=>{});return pending;},settle:async()=>{await queue;return {payments:clone([...results.values()])};},refund:async()=>({refundedBase:'0',note:'Per-job reject/expiry refunds executed inside pay; no blanket refund.'}),getResults:()=>clone([...results.values()]),privateEvidence:()=>({transactions:clone(txs),attempts:clone([...attempts]),payments:clone([...results.values()])}),close:async()=>{await queue;closed=true;await env.close();}};
  Object.defineProperty(result,'escrowAccess',{value:{...access,address,abi:a.abi,send},enumerable:false});await emit('payment.escrow_environment',manifest);return result;
 }catch(e){await env.close();throw e;}
}
