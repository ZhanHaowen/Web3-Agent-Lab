import {createServer} from 'node:http';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createPaymentEnvironment,safePaymentValue} from './index.mjs';
import {MppClient,MppServer,clientEvm,serverEvm} from '../../packages/payment-adapters/mpp-runtime.mjs';
import {viem} from '../../packages/payment-adapters/runtime.mjs';
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const copy=x=>JSON.parse(json(x));
const sha=x=>createHash('sha256').update(typeof x==='string'?x:json(x)).digest('hex');
const fail=(code,message)=>Object.assign(Error(message),{code});
const errorInfo=e=>({code:e?.code??'MPP_ERROR',message:String(e?.shortMessage??e?.message??e).replace(/0x[0-9a-fA-F]{128,}/g,m=>`[redacted-sha256:${sha(m)}]`).slice(0,1600)});

/** Official mppx native Payment-auth evm/charge over actual loopback HTTP.
 * Custom settlement is a real EIP-3009 call; token nonce checks reject replay.
 * This adapter does not claim Tempo sessions, Stripe, or external facilitator interoperability.
 */
export async function createMppPaymentEnvironment(options={}){
 if(options.authorization&&options.authorization!=='none')throw fail('MPP_AUTHORIZATION_UNSUPPORTED','MPP profile currently uses native EVM authorization; AP2 is available with x402 profiles');
 const base=await createPaymentEnvironment({...options,scheme:'exact',authorization:'none',fixtureOnly:true});
 const {publicClient,wallet,payerWallet,tokenAbi,recordTransaction,emit}=base.chainAccess;
 const {token,providers,payer,chainId}=base;
 const entries=new Map(),purchases=new Map();let server,serverUrl,closed=false,currentRequestId=null,queue=Promise.resolve();
 const serial=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
 const balance=address=>publicClient.readContract({address:token.address,abi:tokenAbi,functionName:'balanceOf',args:[address]});
 const deploymentManifest={...base.deploymentManifest,protocol:'mpp',scheme:'mpp-evm-charge',sdk:'mppx',sdkVersion:'0.18.0',upstreamCommit:null,sourceAuditCommit:'066a75bb2ded40919b2eb135992d51d919c86468',scope:'Official mppx native Payment-auth evm/charge; custom real EIP-3009 settlement on isolated Anvil. No Tempo/session/Stripe or production deployment claim.'};
 const close=async()=>{if(closed)return;closed=true;if(server?.listening){server.closeIdleConnections?.();await new Promise(r=>server.close(r));}await base.close();await writeFile(join(base.dataDir,'payment-evidence.json'),json({...base.privateEvidence,purchases:[...purchases.values()]})+'\n');};
 try{
  const sdkServers=new Map();
  for(const provider of providers){
   const sdk=MppServer.create({secretKey:randomBytes(32).toString('base64'),realm:'research.local',methods:[serverEvm.charge({currency:token.address,chainId,decimals:token.decimals,recipient:provider.address,authorization:{name:token.name,version:token.version},settle:async({credential,payload,request})=>{
    const entry=entries.get(currentRequestId);if(!entry)throw fail('UNKNOWN_REQUEST','No active request');
    if(entry.providerId!==provider.id||payload.value!==entry.amountBase||payload.from.toLowerCase()!==payer.toLowerCase()||request.currency.toLowerCase()!==token.address.toLowerCase())throw fail('MPP_BINDING','Credential differs from configured purchase');
    await emit('payment.authorization',{requestId:entry.requestId,protocol:'mpp',payload:safePaymentValue(payload),credentialSha256:sha(credential),reusableSignatureExported:false});
    const args=[payload.from,payload.to,BigInt(payload.value),BigInt(payload.validAfter),BigInt(payload.validBefore),payload.nonce,payload.signature];
    // SDK verifies terms and typed-data signer. Contract simulation and execution
    // independently enforce balances, expiry and single-use nonce state.
    await publicClient.simulateContract({account:wallet.account,address:token.address,abi:tokenAbi,functionName:'transferWithAuthorization',args});
    const hash=await wallet.writeContract({address:token.address,abi:tokenAbi,functionName:'transferWithAuthorization',args});entry.txHash=hash;
    const mined=await recordTransaction(hash,'mpp.transferWithAuthorization',entry.requestId);entry.receipt=mined.receipt;
    if(mined.receipt.status!=='success')throw fail('MPP_REVERTED','MPP settlement reverted');
    entry.accepted=true;return{reference:hash,timestamp:new Date(Number(mined.block.timestamp)*1000).toISOString()};
   }})]});sdkServers.set(provider.id,sdk);
  }
  server=createServer(async(req,res)=>{
   try{
    let raw='';for await(const chunk of req){raw+=chunk.toString();if(raw.length>1_000_000)throw fail('BODY_TOO_LARGE','Body exceeds 1MB');}
    const id=new URL(req.url,'http://localhost').pathname.split('/').at(-1),entry=entries.get(id);
    if(req.method!=='POST'||!entry){res.writeHead(404);return res.end();}
    let requestBody;try{requestBody=JSON.parse(raw);}catch{res.writeHead(400);return res.end('invalid request JSON');}
    if(sha(requestBody)!==sha(entry.body??{})){res.writeHead(409);return res.end('request body differs from registered purchase');}
    const request=new Request(entry.url,{method:'POST',headers:req.headers,body:raw});
    const outcome=await sdkServers.get(entry.providerId).evm.charge({amount:viem.formatUnits(BigInt(entry.amountBase),token.decimals),description:'Shared research service',scope:sha({requestId:id,resource:entry.resource,body:entry.body??{}})})(request);
    let response;if(outcome.status===402)response=outcome.challenge;else{
     const httpStatus=['withheld','http_failure','after-settlement-http-error'].includes(entry.fault)?503:200;
     response=outcome.withReceipt(Response.json(httpStatus===200?{requestId:id,result:entry.result}:{error:'injected response failure after confirmed payment'},{status:httpStatus}));
     await emit('payment.service',{requestId:id,protocol:'mpp',httpStatus,delivered:httpStatus===200,txHash:entry.txHash});
    }
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
   }catch(e){await emit('payment.http_server_error',{requestId:currentRequestId,error:errorInfo(e)});res.writeHead(500,{'content-type':'application/json'});res.end(json({error:errorInfo(e)}));}
  });
  await new Promise((ok,no)=>server.once('error',no).listen(0,'127.0.0.1',ok));serverUrl=`http://127.0.0.1:${server.address().port}`;
  const captureFetch=async(input,init)=>{const req=new Request(input,init),headers=Object.fromEntries(req.headers);for(const key of ['authorization','payment-authorization','payment-signature'])if(headers[key])headers[key]={redacted:true,sha256:sha(headers[key])};await emit('payment.http_request',{requestId:currentRequestId,method:req.method,url:req.url,headers,body:await req.clone().text()});const response=await fetch(req,{signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000)});await emit('payment.http_response',{requestId:currentRequestId,status:response.status,headers:Object.fromEntries(response.headers),body:await response.clone().text()});return response;};
  const client=MppClient.create({polyfill:false,fetch:captureFetch,maxPaymentRetries:1,methods:[clientEvm.charge({account:payerWallet.account,authorization:{name:token.name,version:token.version},decimals:token.decimals,networks:[chainId],currencies:[token.address],maxAtomicAmount:String(options.initialBalance??'1000000')})]});
  await writeFile(join(base.dataDir,'payment-deployment.json'),json(deploymentManifest)+'\n');await emit('payment.environment',deploymentManifest);
  async function payNow(input){
   if(closed)throw fail('ENVIRONMENT_CLOSED','Payment environment closed');options.signal?.throwIfAborted();
   const requestId=input.requestId??randomUUID(),provider=providers.find(p=>p.id===input.providerId),amountBase=String(input.amountBase),resource=String(input.resource??input.providerId);
   if(!/^[-a-zA-Z0-9_]{1,160}$/.test(requestId)||!provider||! /^[1-9]\d*$/.test(amountBase)||BigInt(amountBase)>BigInt(options.initialBalance??'1000000'))throw fail('INVALID_PURCHASE','Invalid request, provider or positive base-unit amount');
   const fingerprint=sha({providerId:provider.id,amountBase,resource,body:input.body??{}}),old=purchases.get(requestId);
   if(old){if(entries.get(requestId).fingerprint!==fingerprint)throw fail('IDEMPOTENCY_CONFLICT','Request ID reused with different request');return copy(old);}
   const entry={...input,requestId,amountBase,resource,fingerprint,url:`${serverUrl}/paid/${requestId}`};entries.set(requestId,entry);currentRequestId=requestId;
   const before=await balance(provider.address);let response,body,error;
   try{response=await client.fetch(entry.url,{method:'POST',headers:{'content-type':'application/json'},body:json(input.body??{})});body=await response.json();}catch(e){error=errorInfo(e);}
   const delta=(await balance(provider.address))-before,settled=delta===BigInt(amountBase),status=settled?'settled':entry.txHash?'unknown':'failed',delivered=Boolean(response?.ok&&body&&Object.hasOwn(body,'result'));
   const outcome={requestId,paymentId:requestId,providerId:provider.id,scheme:'mpp-evm-charge',authorization:'none',status,amountBase,chargedBase:settled||status==='unknown'?amountBase:'0',settledBase:String(delta),reservedBase:status==='unknown'?amountBase:'0',refundedBase:'0',txHash:entry.txHash,receipt:entry.receipt,delivery:{status:delivered?'delivered':'failed',...(delivered?{result:body.result}:{})},httpStatus:response?.status??null,error:error??(!delivered?body?.error:undefined),publicEvidence:base.privateEvidence.transactions.filter(t=>t.requestId===requestId).map(t=>({hash:t.hash,blockNumber:t.receipt.blockNumber,transactionIndex:t.receipt.transactionIndex,blockTimestamp:t.block.timestamp}))};
   purchases.set(requestId,copy(outcome));await emit('payment.outcome',outcome);currentRequestId=null;return copy(outcome);
  }
  const settle=async()=>{const beforeTx=base.privateEvidence.transactions.length;for(const p of purchases.values()){
   if(p.status!=='unknown'||!p.txHash)continue;let receipt;try{receipt=await publicClient.getTransactionReceipt({hash:p.txHash});}catch{continue;}
   const tx=await recordTransaction(p.txHash,'reconcile.mpp',p.requestId);p.receipt=tx.receipt;
   if(receipt.status==='reverted'){p.status='failed';p.chargedBase='0';p.settledBase='0';p.reservedBase='0';}else{const provider=providers.find(x=>x.id===p.providerId);let value=0n;for(const log of receipt.logs){if(log.address.toLowerCase()!==token.address.toLowerCase())continue;try{const event=viem.decodeEventLog({abi:tokenAbi,data:log.data,topics:log.topics});if(event.eventName==='Transfer'&&event.args.from.toLowerCase()===payer.toLowerCase()&&event.args.to.toLowerCase()===provider.address.toLowerCase())value+=event.args.value;}catch{}}if(value!==BigInt(p.amountBase))throw fail('MPP_RECONCILIATION_MISMATCH','Receipt transfer differs from quoted charge');p.status='settled';p.settledBase=p.chargedBase;p.reservedBase='0';}await emit('payment.outcome',p);
  }const all=[...purchases.values()];return copy({payments:all,transactions:base.privateEvidence.transactions.slice(beforeTx),pendingBase:String(all.reduce((n,p)=>n+BigInt(p.reservedBase),0n)),settledBase:String(all.reduce((n,p)=>n+BigInt(p.settledBase),0n))});};
  const result={...base,deploymentManifest,pay:x=>serial(()=>payNow(x)),settle:()=>serial(settle),refund:async()=>({refundedBase:'0',transactions:[],reason:'Confirmed MPP charge has no automatic refund'}),getResults:()=>copy([...purchases.values()]),close};
  Object.defineProperty(result,'chainAccess',{enumerable:false,value:base.chainAccess});return result;
 }catch(e){await close();throw e;}
}
