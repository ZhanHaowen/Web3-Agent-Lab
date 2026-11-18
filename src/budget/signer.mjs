// Dedicated EOA owner process. The controller never receives its private key.
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ROOT,library,units,clone,PERMIT_TYPES} from './common.mjs';
const lib=await library();
const account=lib.privateKeyToAccount('0x'+randomBytes(32).toString('hex'));
const tokenAbi=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/LabToken.json'),'utf8')).abi;
let context,wallet,pc,session,pendingPermit,bootstrapped=false,nextNonce=0n;
let spent=0n,transactionSpent=0n,reserved=0n;
const ledger=()=>clone({spent,transactionSpent,reserved,limit:session?.limit??0n,remaining:session?session.limit-spent-reserved:0n});
function authorized(body){if(!session||body.sessionId!==session.id||body.executionId!==session.executionId||session.closed)throw Error('SESSION_SCOPE');}
function check(amount){
 if(spent+reserved+amount>session.limit)throw Error('TASK_BUDGET_EXCEEDED');
}
async function receipt(hash){const r=await pc.waitForTransactionReceipt({hash,timeout:20000,pollingInterval:40});if(r.status!=='success')throw Error('CHAIN_REVERT');return r;}
async function execute(method,body){
 if(method==='identity')return {address:account.address,pid:process.pid};
 if(method==='bootstrap'){
  if(bootstrapped)throw Error('BOOTSTRAP_ONCE');
  if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(body.rpcUrl))throw Error('LOCAL_RPC');
  context=body;pc=lib.createPublicClient({chain:lib.localChain,transport:lib.http(body.rpcUrl,{retryCount:0})});
  if(await pc.getChainId()!==31337)throw Error('CHAIN_ID');
  wallet=lib.createWalletClient({account,chain:lib.localChain,transport:lib.http(body.rpcUrl,{retryCount:0})});
  const hash=await wallet.writeContract({address:body.token,abi:tokenAbi,functionName:'approve',args:[body.permit2,body.routes?.permit2===false?0n:units(body.initial)]});await receipt(hash);
  if(body.policy?.enabled)context.expiresAt=(await pc.getBlock()).timestamp+BigInt(body.policy.windowHours*3600);
  bootstrapped=true;return {hash,address:account.address};
 }
 if(method==='open'){
  if(!bootstrapped||session)throw Error('SESSION_ONCE');
  if(Object.keys(body).some(k=>!['sessionId','executionId','budget'].includes(k)))throw Error('OPEN_FIELDS');
  session={id:body.sessionId,executionId:body.executionId,limit:units(body.budget)};return ledger();
 }
 authorized(body);
 if(['pay','permit'].includes(method)&&context.expiresAt&&(await pc.getBlock()).timestamp>=context.expiresAt)throw Error('SESSION_EXPIRED');
 if(method==='ledger')return ledger();
 if(method==='policy')return {transfer:context.routes?.transfer!==false,permit2:context.routes?.permit2!==false,limit:String(session.limit)};
 if(method==='close'){session.closed=true;return ledger();}
 if(method==='pay'){
  if(Object.keys(body).some(k=>!['sessionId','executionId','amount'].includes(k)))throw Error('PAY_FIELDS');
  if(context.routes?.transfer===false)throw Error('TRANSFER_DISABLED');
  const amount=units(body.amount);check(amount);reserved+=amount;
  try{
   const hash=await wallet.writeContract({address:context.token,abi:tokenAbi,functionName:'transfer',args:[context.recipient,amount]});
   await receipt(hash);reserved-=amount;spent+=amount;transactionSpent+=amount;return {hash,ledger:ledger()};
  }catch{session.closed=true;throw Error('PAYMENT_UNCERTAIN_SESSION_CLOSED');}
 }
 if(method==='permit'){
  if(Object.keys(body).some(k=>!['sessionId','executionId','amount'].includes(k)))throw Error('PERMIT_FIELDS');
  if(context.routes?.permit2===false)throw Error('PERMIT_DISABLED');
  if(pendingPermit)throw Error('PERMIT_ALREADY_PENDING');
  const amount=units(body.amount);check(amount);
  const block=await pc.getBlock(),nonce=nextNonce++,deadline=context.expiresAt&&block.timestamp+600n>=context.expiresAt?context.expiresAt-1n:block.timestamp+600n;
  const typedData={domain:{name:'Permit2',chainId:31337,verifyingContract:context.permit2},types:PERMIT_TYPES,primaryType:'PermitTransferFrom',message:{permitted:{token:context.token,amount},spender:context.spender,nonce,deadline}};
  reserved+=amount;
  let signature;try{signature=await account.signTypedData(typedData);}catch(e){reserved-=amount;throw e;}
  pendingPermit={nonce:String(nonce),amount};return clone({typedData,signature,ledger:ledger()});
 }
 if(method==='settle'){
  const p=pendingPermit;if(!p||p.nonce!==body.nonce)throw Error('PERMIT_NOT_OUTSTANDING');
  const r=await receipt(body.hash),tx=await pc.getTransaction({hash:body.hash});
  if(tx.to?.toLowerCase()!==context.permit2.toLowerCase()||tx.from.toLowerCase()!==context.spender.toLowerCase())throw Error('REDEMPTION_SCOPE');
  const transfer=r.logs.filter(l=>l.address.toLowerCase()===context.token.toLowerCase()).map(l=>{try{return lib.decodeEventLog({abi:tokenAbi,...l});}catch{return null;}}).find(l=>l?.eventName==='Transfer'&&l.args.from.toLowerCase()===account.address.toLowerCase()&&l.args.to.toLowerCase()===context.recipient.toLowerCase());
  if(!transfer||transfer.args.value!==p.amount)throw Error('REDEMPTION_AMOUNT');
  const permitAbi=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/Permit2.json'),'utf8')).abi,decoded=lib.decodeFunctionData({abi:permitAbi,data:tx.input});
  if(decoded.functionName!=='permitTransferFrom'||String(decoded.args[0].nonce)!==body.nonce)throw Error('REDEMPTION_NONCE');
  reserved-=p.amount;spent+=p.amount;pendingPermit=null;return ledger();
 }
 throw Error('SIGNER_METHOD');
}
let queue=Promise.resolve();
process.on('message',message=>{queue=queue.then(async()=>{
 try{process.send?.({id:message.id,result:await execute(message.method,message.body??{})});}
 catch(e){process.send?.({id:message.id,error:e.message});}
});});
process.on('disconnect',()=>process.exit(0));
process.send?.({ready:true,address:account.address,pid:process.pid});
