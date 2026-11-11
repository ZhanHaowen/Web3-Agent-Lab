import {createServer} from 'node:http';
import {createServer as createNetServer} from 'node:net';
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile,appendFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {createAP2Authorizer} from './ap2.mjs';
import {x402Client,x402ResourceServer,x402Facilitator,wrapFetchWithPayment,ExactClient,ExactServer,ExactFacilitator,BatchClient,BatchServer,BatchFacilitator,toClientEvmSigner,toFacilitatorEvmSigner,BATCH_SETTLEMENT_ADDRESS,ERC3009_DEPOSIT_COLLECTOR_ADDRESS,mnemonicToAccount,viem} from '../../packages/payment-adapters/runtime.mjs';

export const PAYMENT_SDK_VERSION='2.30.0';
export const X402_COMMIT='b70d6d5e3c08804670e254e178e92b16f8629682';
export const RESEARCH_PROVIDERS=['discover-lite','discover-pro','analyze-lite','analyze-pro','verify-lite','verify-pro'];
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v);
const sha=x=>createHash('sha256').update(typeof x==='string'?x:json(x)).digest('hex');
const clone=x=>JSON.parse(json(x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const err=(code,message)=>Object.assign(Error(message),{code});
export function safePaymentValue(value,key=''){
 if(/^(signature|private.?key|mnemonic|checkoutMandate|paymentMandate|checkout_jwt)$/i.test(key)&&value!=null)return{redacted:true,sha256:sha(value),reason:'reusable authorization excluded'};
 if(Array.isArray(value))return value.map(v=>safePaymentValue(v));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,safePaymentValue(v,k)]));
 return typeof value==='bigint'?String(value):value;
}
const errorInfo=e=>({code:e?.code??'PAYMENT_ERROR',name:e?.name??'Error',message:String(e?.shortMessage??e?.message??e).replace(/0x[0-9a-fA-F]{128,}/g,m=>`[redacted-hex-sha256:${sha(m)}]`).slice(0,2000)});
async function port(){const s=createNetServer();await new Promise((ok,no)=>s.once('error',no).listen(0,'127.0.0.1',ok));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function listen(s){await new Promise((ok,no)=>s.once('error',no).listen(0,'127.0.0.1',ok));return`http://127.0.0.1:${s.address().port}`;}
async function stopHttp(s){if(!s?.listening)return;s.closeIdleConnections?.();await new Promise(r=>s.close(r));}

/** Isolated test-only real x402 environment. No external RPC/model services.
 * Official SDK negotiates actual localhost HTTP 402, verifies signatures and
 * settles against real Anvil bytecode. No reusable signed payload is exported.
 */
export async function createPaymentEnvironment(options={}){
 const root=resolve(options.root??process.cwd()),dataDir=resolve(options.dataDir??join(root,'data/research-payments',randomUUID()));
 const scheme=options.scheme==='batch'?'batch-settlement':(options.scheme??'exact');
 if(!['exact','batch-settlement'].includes(scheme))throw err('UNSUPPORTED_PAYMENT_SCHEME',`Unsupported payment scheme: ${scheme}`);
 const authorization=options.authorization??'none';if(!['none','ap2'].includes(authorization))throw err('UNSUPPORTED_AUTHORIZATION','Only none or local AP2 overlay is supported');
 const initialBalance=String(options.initialBalance??'1000000'),budgetBase=String(options.budgetBase??'100000');
 if(!/^\d+$/.test(initialBalance)||BigInt(initialBalance)<=0n||!/^\d+$/.test(budgetBase))throw err('INVALID_AMOUNT','Use positive integer token base units');
 await mkdir(dataDir,{recursive:true});
 // Never append a new run onto a previous immutable experiment capture.
 await writeFile(join(dataDir,'payment-events.jsonl'),'',{flag:'wx'});
 const events=[],purchases=new Map(),entries=new Map(),transactions=[],broadcasts=[],managers=new Map();let chainProcess,httpServer,closed=false,currentRequestId=null,serverUrl,queue=Promise.resolve();
 const emit=async(type,payload)=>{const e={seq:events.length+1,type,at:new Date().toISOString(),payload:safePaymentValue(payload)};events.push(e);await appendFile(join(dataDir,'payment-events.jsonl'),json(e)+'\n');if(options.emit)await options.emit(e);return e;};
 const serialized=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
 const close=async()=>{if(closed)return;closed=true;await stopHttp(httpServer);for(const m of managers.values())await m.stop();if(chainProcess&&chainProcess.exitCode==null){chainProcess.kill();await Promise.race([new Promise(r=>chainProcess.once('exit',r)),sleep(5000)]);}await writeFile(join(dataDir,'payment-evidence.json'),json({events,transactions,broadcasts,purchases:[...purchases.values()]})+'\n');};
 try{
  const rpcPort=await port(),rpcUrl=`http://127.0.0.1:${rpcPort}`,chainId=31337;
  const anvil=options.anvilPath??join(root,'runtime',process.platform==='win32'?'anvil.exe':'anvil');
  chainProcess=spawn(anvil,['--host','127.0.0.1','--port',String(rpcPort),'--chain-id',String(chainId),'--silent','--hardfork','cancun'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe']});
  let startError;chainProcess.once('error',e=>{startError=e;});let nativeError='';chainProcess.stderr.on('data',d=>{nativeError+=d.toString();});
  for(let i=0;i<100;i++){if(startError)throw startError;if(chainProcess.exitCode!=null)throw err('ANVIL_START',nativeError);try{const r=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body:json({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(500)});if((await r.json()).result==='0x7a69')break;}catch{}if(i===99)throw err('ANVIL_START_TIMEOUT','Owned Anvil did not become ready');await sleep(100);}
  const chain=viem.defineChain({id:chainId,name:'Research Anvil',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[rpcUrl]}}});
  const publicClient=viem.createPublicClient({chain,transport:viem.http(rpcUrl,{retryCount:0}),pollingInterval:50});
  // Public deterministic Anvil testing accounts only; private values never logged.
  const mnemonic='test test test test test test test test test test test junk';
  const payerAccount=mnemonicToAccount(mnemonic,{addressIndex:0}),relayerAccount=mnemonicToAccount(mnemonic,{addressIndex:1});
  const payer=payerAccount.address,relayer=relayerAccount.address;
  const providerIds=(options.providers??RESEARCH_PROVIDERS).map(x=>typeof x==='string'?x:x.id);
  if(new Set(providerIds).size!==providerIds.length||providerIds.length>6||providerIds.some(id=>!/^[-a-zA-Z0-9_]{1,64}$/.test(id)))throw err('INVALID_PROVIDERS','At most six unique stable provider IDs are supported');
  const providers=providerIds.map((id,i)=>({id,address:mnemonicToAccount(mnemonic,{addressIndex:i+2}).address}));
  const providerAccounts=new Map(providers.map((p,i)=>[p.id,mnemonicToAccount(mnemonic,{addressIndex:i+2})]));
  const wallet=viem.createWalletClient({account:relayerAccount,chain,transport:viem.http(rpcUrl,{retryCount:0})});
  const artifacts={};for(const name of ['ResearchEIP3009Token','x402BatchSettlement','ERC3009DepositCollector','Multicall3'])artifacts[name]=JSON.parse(await readFile(join(root,'packages/payment-adapters/artifacts',name+'.json'),'utf8'));
  async function receipt(hash){return publicClient.waitForTransactionReceipt({hash,timeout:options.receiptTimeoutMs??30000,pollingInterval:50,retryCount:0});}
  async function deploy(name,args=[]){const h=await wallet.deployContract({abi:artifacts[name].abi,bytecode:artifacts[name].bytecode,args}),r=await receipt(h);if(r.status!=='success'||!r.contractAddress)throw err('DEPLOY_FAILED',name);return{address:r.contractAddress,txHash:h,receipt:clone(r)};}
  const tokenDeploy=await deploy('ResearchEIP3009Token'),token={address:tokenDeploy.address,decimals:6,name:'Research USD',symbol:'rUSD',version:'2',testOnly:true};
  await receipt(await wallet.writeContract({address:token.address,abi:artifacts.ResearchEIP3009Token.abi,functionName:'mint',args:[payer,BigInt(initialBalance)]}));
  const installations=[];
  if(scheme==='batch-settlement'){
   const multiDeploy=await deploy('Multicall3');const multiCode=await publicClient.getCode({address:multiDeploy.address});const multiAddress='0xcA11bde05977b3631167028862bE2a173976CA11';
   await publicClient.request({method:'anvil_setCode',params:[multiAddress,multiCode]});
   installations.push({name:'Multicall3',address:multiAddress,runtimeSha256:sha(multiCode),originDeployment:multiDeploy});
   const batchDeploy=await deploy('x402BatchSettlement');const batchCode=await publicClient.getCode({address:batchDeploy.address});
   await publicClient.request({method:'anvil_setCode',params:[BATCH_SETTLEMENT_ADDRESS,batchCode]});
   const collectorDeploy=await deploy('ERC3009DepositCollector',[BATCH_SETTLEMENT_ADDRESS]);const collectorCode=await publicClient.getCode({address:collectorDeploy.address});
   await publicClient.request({method:'anvil_setCode',params:[ERC3009_DEPOSIT_COLLECTOR_ADDRESS,collectorCode]});
   installations.push({name:'x402BatchSettlement',address:BATCH_SETTLEMENT_ADDRESS,runtimeSha256:sha(batchCode),originDeployment:batchDeploy},{name:'ERC3009DepositCollector',address:ERC3009_DEPOSIT_COLLECTOR_ADDRESS,runtimeSha256:sha(collectorCode),originDeployment:collectorDeploy});
  }
  const startBlock=Number(await publicClient.getBlockNumber({cacheTime:0}));
  const balance=async address=>publicClient.readContract({address:token.address,abi:artifacts.ResearchEIP3009Token.abi,functionName:'balanceOf',args:[address]});
  const network=`eip155:${chainId}`;
  async function recordTransaction(hash,operation,requestId=currentRequestId){
   const old=transactions.find(t=>t.hash===hash);if(old)return old;
   if(!broadcasts.some(t=>t.hash===hash)){const b={hash,operation,requestId};broadcasts.push(b);await emit('payment.broadcast',b);}
   const r=await receipt(hash),t=await publicClient.getTransaction({hash}),block=await publicClient.getBlock({blockNumber:r.blockNumber});
   let callTrace;try{callTrace={status:'available',tracer:'callTracer',result:await publicClient.request({method:'debug_traceTransaction',params:[hash,{tracer:'callTracer'}]})};}catch(e){callTrace={status:'unavailable',tracer:'callTracer',reason:errorInfo(e)};}
   const item=clone({hash,operation,requestId,transaction:t,receipt:r,callTrace,block:{number:block.number,timestamp:block.timestamp,hash:block.hash}});
   transactions.push(item);await emit('payment.transaction',item);return item;
  }
  const facilitatorSigner=toFacilitatorEvmSigner({
   address:relayer,readContract:a=>publicClient.readContract({...a,args:a.args??[]}),verifyTypedData:a=>publicClient.verifyTypedData(a),getCode:a=>publicClient.getCode(a),
   writeContract:async a=>{const h=await wallet.writeContract({...a,args:a.args??[]});await recordTransaction(h,a.functionName);return h;},
   sendTransaction:async a=>{const h=await wallet.sendTransaction(a);await recordTransaction(h,'sendTransaction');return h;},
   waitForTransactionReceipt:a=>receipt(a.hash),
  });
  const facilitator=new x402Facilitator().register(network,scheme==='exact'?new ExactFacilitator(facilitatorSigner):new BatchFacilitator(facilitatorSigner));
  const facilitatorClient={verify:(p,r)=>facilitator.verify(p,r),settle:(p,r)=>facilitator.settle(p,r),getSupported:async()=>facilitator.getSupported()};
  const resourceServers=new Map(),batchSchemes=new Map();
  for(const provider of providers){
   const rs=new x402ResourceServer(facilitatorClient);
   const sdkScheme=scheme==='exact'?new ExactServer():new BatchServer(provider.address,{receiverAuthorizerSigner:providerAccounts.get(provider.id),withdrawDelay:900});
   rs.register(network,sdkScheme);await rs.initialize();resourceServers.set(provider.id,rs);
   if(scheme==='batch-settlement'){batchSchemes.set(provider.id,sdkScheme);managers.set(provider.id,sdkScheme.createChannelManager(facilitatorClient,network,token.address));}
  }
  const clientScheme=scheme==='exact'?new ExactClient(toClientEvmSigner(payerAccount,publicClient)):new BatchClient(toClientEvmSigner(payerAccount,publicClient),{depositPolicy:{depositMultiplier:3},salt:0});
  const client=new x402Client().setSpendControls(false).register(network,clientScheme);
  const ap2=authorization==='ap2'?createAP2Authorizer({chainId,token:token.address,providers,budgetBase}):null;
  function requirements(entry){const p=providers.find(x=>x.id===entry.providerId);return{scheme,network,asset:token.address,amount:entry.amountBase,payTo:p.address,maxTimeoutSeconds:300,extra:{name:token.name,version:token.version,assetTransferMethod:'eip3009',...(scheme==='batch-settlement'?{receiverAuthorizer:p.address,withdrawDelay:900}:{} )}};}
  httpServer=createServer(async(req,res)=>{
   const send=(status,body,headers={})=>{res.writeHead(status,{'content-type':'application/json',...headers});res.end(json(body));};
   try{
    let raw='';for await(const b of req){raw+=b.toString();if(raw.length>1_000_000)throw err('BODY_TOO_LARGE','Research body exceeds 1MB');}
    const id=new URL(req.url,'http://localhost').pathname.split('/').at(-1),entry=entries.get(id);
    if(req.method!=='POST'||!entry)return send(404,{error:'unknown research request'});
    let requestBody;try{requestBody=JSON.parse(raw);}catch{return send(400,{error:'invalid request JSON'});}
    if(sha(requestBody)!==sha(entry.body??{}))return send(409,{error:'request body differs from registered purchase'});
    const rs=resourceServers.get(entry.providerId),accepts=[requirements(entry)],resource={url:entry.url,description:'Shared research service',mimeType:'application/json'};
    if(!req.headers['payment-signature']){
     const required=await rs.createPaymentRequiredResponse(accepts,resource);return send(402,required,{'PAYMENT-REQUIRED':Buffer.from(json(required)).toString('base64')});
    }
    if(entry.completed){if(entry.paymentHeaderHash!==sha(req.headers['payment-signature']))return send(409,{error:'completed request presented a different payment credential'});return send(entry.httpStatus,entry.response,entry.responseHeaders);}
    entry.paymentHeaderHash=sha(req.headers['payment-signature']);
    let payload;try{payload=JSON.parse(Buffer.from(req.headers['payment-signature'],'base64').toString());}catch{throw err('INVALID_PAYMENT_HEADER','Malformed payment signature header');}
    const accepted=rs.findMatchingRequirements(accepts,payload);if(!accepted)throw err('PAYMENT_REQUIREMENTS_MISMATCH','Signed amount/asset/payee differ from this request');
    await emit('payment.authorization',{requestId:id,payload:safePaymentValue(payload),payloadSha256:sha(payload),reusableSignatureExported:false});
    if(ap2){let envelope;try{envelope=JSON.parse(Buffer.from(req.headers['x-lab-ap2']??'','base64').toString());}catch{throw err('AP2_REQUIRED','AP2 authorization required');}entry.ap2=ap2.verify(envelope,entry);await emit('payment.ap2_verified',entry.ap2);}
    const verified=await rs.verifyPayment(payload,accepted);entry.verifyResponse=verified;
    if(!verified.isValid){entry.completed=true;entry.httpStatus=402;entry.response={error:verified.invalidReason??'verification rejected'};entry.responseHeaders={};return send(402,entry.response);}
    const settlement=await rs.settlePayment(payload,accepted);entry.settlement=settlement;
    if(!settlement.success){entry.completed=true;entry.httpStatus=502;entry.response={error:settlement.errorReason??'settlement rejected'};entry.responseHeaders={};return send(502,entry.response);}
    entry.accepted=true;entry.httpStatus=['after-settlement-http-error','withheld','http_failure'].includes(entry.fault)?503:200;entry.completed=true;
    entry.response=entry.httpStatus===200?{result:entry.result,requestId:id}:{error:'injected response failure after payment acceptance'};
    entry.responseHeaders={'PAYMENT-RESPONSE':Buffer.from(json(settlement)).toString('base64')};
    await emit('payment.service',{requestId:id,httpStatus:entry.httpStatus,delivered:entry.httpStatus===200,resultSha256:sha(entry.response),scheme,settlement});
    return send(entry.httpStatus,entry.response,entry.responseHeaders);
   }catch(e){await emit('payment.http_server_error',{error:errorInfo(e)});send(e.code?.startsWith('AP2_')?403:500,{error:errorInfo(e)});}
  });
  serverUrl=await listen(httpServer);
  const captureFetch=async(input,init)=>{
   const req=new Request(input,init);const headers=Object.fromEntries(req.headers);for(const h of ['payment-signature','x-lab-ap2','authorization'])if(headers[h])headers[h]={redacted:true,sha256:sha(headers[h])};
   await emit('payment.http_request',{requestId:currentRequestId,method:req.method,url:req.url,headers,body:await req.clone().text()});
   try{const r=await fetch(req,{signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000)});await emit('payment.http_response',{requestId:currentRequestId,status:r.status,headers:Object.fromEntries(r.headers),body:await r.clone().text()});return r;}catch(e){await emit('payment.http_error',{requestId:currentRequestId,error:errorInfo(e)});throw e;}
  };
  const paidFetch=wrapFetchWithPayment(captureFetch,client);
  const deploymentManifest={schemaVersion:1,executionKind:'real-local-evm',protocol:'x402',scheme,authorization,sdkVersion:PAYMENT_SDK_VERSION,upstreamCommit:X402_COMMIT,chainId,rpcUrl,payer,relayer,providers,token,tokenDeployment:tokenDeploy,startBlock,initialBalance,ap2:ap2?.manifest??null,installations,canonicalInstallation:scheme==='batch-settlement'?'Anvil-only: constructor-initialized official runtime installed at SDK canonical addresses; not a production CREATE2 deployment':null,scope:'Loopback test assets; single-process SDK channel state; no claim of production crash recovery',contractCompiler:artifacts.ResearchEIP3009Token.compiler};
  if(options.fixtureOnly){deploymentManifest.protocol='evm-fixture';deploymentManifest.scheme=null;deploymentManifest.scope='Isolated EVM fixtures; no x402 payment flow invoked';}
  await writeFile(join(dataDir,'payment-deployment.json'),json(deploymentManifest)+'\n');await emit('payment.environment',deploymentManifest);
  async function payNow(input){
   if(options.fixtureOnly)throw err('FIXTURE_ONLY','This environment only provides local EVM test fixtures');
   if(closed)throw err('ENVIRONMENT_CLOSED','Payment environment closed');options.signal?.throwIfAborted();
   const requestId=input.requestId??randomUUID();if(!/^[-a-zA-Z0-9_]{1,160}$/.test(requestId))throw err('INVALID_REQUEST_ID','Invalid idempotency identifier');
   const fingerprint=sha({providerId:input.providerId,amountBase:String(input.amountBase),resource:String(input.resource??input.providerId),body:input.body??{}});
   const previous=purchases.get(requestId);if(previous){if(entries.get(requestId).fingerprint!==fingerprint)throw err('IDEMPOTENCY_CONFLICT','Request ID reused with different payment/resource/body');return clone(previous);}
   if(!providers.some(p=>p.id===input.providerId))throw err('UNKNOWN_PROVIDER','Unknown provider');
   const amountBase=String(input.amountBase);if(!/^[1-9]\d*$/.test(amountBase)||BigInt(amountBase)>BigInt(initialBalance))throw err('INVALID_AMOUNT','Positive base-unit integer within test wallet capacity required');
   const entry={...input,requestId,amountBase,fingerprint,resource:String(input.resource??input.providerId),url:`${serverUrl}/paid/${input.providerId}/${requestId}`};
   entries.set(requestId,entry);currentRequestId=requestId;const before=await balance(providers.find(p=>p.id===input.providerId).address),beforePayer=await balance(payer);
   const headers={'content-type':'application/json'};
   if(ap2)headers['x-lab-ap2']=Buffer.from(json(ap2.issue(entry))).toString('base64');
   let response,body,error;
   try{response=await paidFetch(entry.url,{method:'POST',headers,body:json(input.body??{} )});body=await response.json();}catch(e){error=errorInfo(e);}
   const after=await balance(providers.find(p=>p.id===input.providerId).address),afterPayer=await balance(payer),delta=after-before;
   const accepted=entry.accepted===true,delivered=Boolean(response?.ok&&body&&Object.hasOwn(body,'result'));
   const requestBroadcasts=broadcasts.filter(t=>t.requestId===requestId),unresolved=requestBroadcasts.some(b=>!transactions.some(t=>t.hash===b.hash));
   const status=scheme==='exact'?(delta===BigInt(amountBase)?'settled':accepted||unresolved?'unknown':'failed'):(accepted?'pending':unresolved?'unknown':'failed');
   const result={paymentId:requestId,requestId,providerId:input.providerId,scheme,authorization,status,amountBase,chargedBase:(accepted||delta>0n||status==='unknown')?amountBase:'0',settledBase:String(delta),reservedBase:status==='pending'||status==='unknown'?amountBase:'0',refundedBase:'0',payerBalanceDeltaBase:String(afterPayer-beforePayer),txHash:scheme==='exact'?(entry.settlement?.transaction||requestBroadcasts.at(-1)?.hash):undefined,commitmentId:scheme==='batch-settlement'?entry.settlement?.transaction:undefined,receipt:scheme==='exact'?transactions.find(t=>t.hash===entry.settlement?.transaction)?.receipt:undefined,delivery:{status:delivered?'delivered':'failed',...(delivered?{result:body.result}:{})},httpStatus:response?.status??null,error:error??(!delivered?body?.error:undefined),ap2:entry.ap2,publicEvidence:transactions.filter(t=>t.requestId===requestId).map(t=>({hash:t.hash,blockNumber:t.receipt.blockNumber,transactionIndex:t.receipt.transactionIndex,blockTimestamp:t.block.timestamp}))};
   purchases.set(requestId,clone(result));await emit('payment.outcome',result);currentRequestId=null;return clone(result);
  }
  async function settleNow(){
   if(closed)throw err('ENVIRONMENT_CLOSED','Payment environment closed');currentRequestId=null;const beforeTx=transactions.length;
   if(scheme==='exact')for(const p of purchases.values()){
    if(p.status!=='unknown'||!p.txHash)continue;
    let mined;try{mined=await publicClient.getTransactionReceipt({hash:p.txHash});}catch{continue;}
    const tx=await recordTransaction(p.txHash,'reconcile.exact',p.requestId);
    if(mined.status==='reverted'){p.status='failed';p.chargedBase='0';p.settledBase='0';p.reservedBase='0';}
    else{const provider=providers.find(x=>x.id===p.providerId);let value=0n;for(const log of mined.logs){if(log.address.toLowerCase()!==token.address.toLowerCase())continue;try{const decoded=viem.decodeEventLog({abi:artifacts.ResearchEIP3009Token.abi,data:log.data,topics:log.topics});if(decoded.eventName==='Transfer'&&decoded.args.from.toLowerCase()===payer.toLowerCase()&&decoded.args.to.toLowerCase()===provider.address.toLowerCase())value+=decoded.args.value;}catch{}}if(value!==BigInt(p.amountBase))throw err('EXACT_RECONCILIATION_MISMATCH','Receipt transfers differ from quoted charge');p.status='settled';p.settledBase=p.chargedBase;p.reservedBase='0';}
    p.receipt=tx.receipt;await emit('payment.outcome',p);
   }
   if(scheme==='batch-settlement')for(const provider of providers){if(![...purchases.values()].some(p=>p.providerId===provider.id&&p.status==='pending'))continue;const before=await balance(provider.address);const result=await managers.get(provider.id).claimAndSettle();const after=await balance(provider.address);const group=[...purchases.values()].filter(p=>p.providerId===provider.id&&p.status==='pending'),needed=group.reduce((a,p)=>a+BigInt(p.chargedBase),0n);if(after-before!==needed)throw err('BATCH_SETTLEMENT_MISMATCH','Actual recipient balance delta differs from committed charges');for(const p of group){p.status='settled';p.settledBase=p.chargedBase;p.reservedBase='0';p.txHash=result.settle?.transaction;p.settlementEvidence=clone(result);p.receipt=transactions.find(t=>t.hash===p.txHash)?.receipt;await emit('payment.outcome',p);}}
   const all=[...purchases.values()];return clone({payments:all,transactions:transactions.slice(beforeTx),pendingBase:String(all.reduce((a,p)=>a+BigInt(p.reservedBase),0n)),settledBase:String(all.reduce((a,p)=>a+BigInt(p.settledBase),0n))});
  }
  async function refundNow(){await settleNow();const before=await balance(payer),beforeTx=transactions.length;if(scheme==='batch-settlement')for(const manager of managers.values())await manager.refund();const refundedBase=String((await balance(payer))-before);await emit('payment.refund',{refundedBase,kind:'unused-channel-capital',transactions:transactions.slice(beforeTx).map(t=>t.hash)});return{refundedBase,transactions:clone(transactions.slice(beforeTx))};}
  const environment={rpcUrl,chainId,payer,providers,token,startBlock,dataDir,deploymentManifest,evidenceOrigin:'real_chain',privateEvidence:{events,transactions,broadcasts},pay:x=>serialized(()=>payNow(x)),settle:()=>serialized(settleNow),refund:()=>serialized(refundNow),close,balances:async()=>({payer:String(await balance(payer)),providers:await Promise.all(providers.map(async p=>({id:p.id,balanceBase:String(await balance(p.address))})))}),getResults:()=>clone([...purchases.values()])};
  Object.defineProperty(environment,'chainAccess',{enumerable:false,value:{publicClient,wallet,payerWallet:viem.createWalletClient({account:payerAccount,chain,transport:viem.http(rpcUrl,{retryCount:0})}),providerWallets:new Map(providers.map(p=>[p.id,viem.createWalletClient({account:providerAccounts.get(p.id),chain,transport:viem.http(rpcUrl,{retryCount:0})})])),chain,receipt,recordTransaction,emit,tokenAbi:artifacts.ResearchEIP3009Token.abi}});
  return environment;
 }catch(e){await close();throw e;}
}
