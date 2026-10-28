// Dedicated EOA owner process. The controller never receives its private key.
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ROOT,library,units,clone,PERMIT_TYPES} from './common.mjs';
const lib=await library();
const account=lib.privateKeyToAccount('0x'+randomBytes(32).toString('hex'));
const tokenAbi=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/LabToken.json'),'utf8')).abi;
let context,wallet,pc,session,bootstrapped=false,nextNonce=0n;
let spent=0n,transactionSpent=0n,reserved=0n;
const permits=new Map();
const ledger=()=>clone({spent,transactionSpent,reserved,limit:session?.limit??0n,remaining:session?session.limit-spent-reserved:0n});
function authorized(body){if(!session||body.sessionId!==session.id||body.executionId!==session.executionId||session.closed)throw Error('SESSION_SCOPE');}
function check(amount,path){
 const used=session.mode==='unified'?spent+reserved:path==='transaction'?transactionSpent:0n;
 if(used+amount>session.limit)throw Error('TASK_BUDGET_EXCEEDED');
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
  const hash=await wallet.writeContract({address:body.token,abi:tokenAbi,functionName:'approve',args:[body.permit2,units(body.initial)]});await receipt(hash);
  bootstrapped=true;return {hash,address:account.address};
 }
 if(method==='open'){
  if(!bootstrapped||session)throw Error('SESSION_ONCE');
  if(!['split','unified'].includes(body.mode))throw Error('MODE');
  session={id:body.sessionId,executionId:body.executionId,limit:units(body.budget),mode:body.mode};return ledger();
 }
 authorized(body);
 if(method==='ledger')return ledger();
 if(method==='close'){session.closed=true;return ledger();}
 if(method==='pay'){
  if(Object.keys(body).some(k=>!['sessionId','executionId','amount'].includes(k)))throw Error('PAY_FIELDS');
  const amount=units(body.amount);check(amount,'transaction');reserved+=amount;
  try{
   const hash=await wallet.writeContract({address:context.token,abi:tokenAbi,functionName:'transfer',args:[context.recipient,amount]});
   await receipt(hash);reserved-=amount;spent+=amount;transactionSpent+=amount;return {hash,ledger:ledger()};
  }catch{session.closed=true;throw Error('PAYMENT_UNCERTAIN_SESSION_CLOSED');}
 }
 if(method==='permit'){
  if(Object.keys(body).some(k=>!['sessionId','executionId','amount'].includes(k)))throw Error('PERMIT_FIELDS');
  const amount=units(body.amount);check(amount,'permit');
  const block=await pc.getBlock(),nonce=nextNonce++,deadline=block.timestamp+600n;
  const typedData={domain:{name:'Permit2',chainId:31337,verifyingContract:context.permit2},types:PERMIT_TYPES,primaryType:'PermitTransferFrom',message:{permitted:{token:context.token,amount},spender:context.spender,nonce,deadline}};
  if(session.mode==='unified')reserved+=amount;
  let signature;try{signature=await account.signTypedData(typedData);}catch(e){if(session.mode==='unified')reserved-=amount;throw e;}
  permits.set(String(nonce),{amount,deadline,consumed:false});return clone({typedData,signature,ledger:ledger()});
 }
 if(method==='settle'){
  const p=permits.get(body.nonce);if(!p||p.consumed)throw Error('PERMIT_NOT_OUTSTANDING');
  const r=await receipt(body.hash),tx=await pc.getTransaction({hash:body.hash});
  if(tx.to?.toLowerCase()!==context.permit2.toLowerCase()||tx.from.toLowerCase()!==context.spender.toLowerCase())throw Error('REDEMPTION_SCOPE');
  const transfer=r.logs.filter(l=>l.address.toLowerCase()===context.token.toLowerCase()).map(l=>{try{return lib.decodeEventLog({abi:tokenAbi,...l});}catch{return null;}}).find(l=>l?.eventName==='Transfer'&&l.args.from.toLowerCase()===account.address.toLowerCase()&&l.args.to.toLowerCase()===context.recipient.toLowerCase());
  if(!transfer||transfer.args.value!==p.amount)throw Error('REDEMPTION_AMOUNT');
  const permitAbi=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/Permit2.json'),'utf8')).abi,decoded=lib.decodeFunctionData({abi:permitAbi,data:tx.input});
  if(decoded.functionName!=='permitTransferFrom'||String(decoded.args[0].nonce)!==body.nonce)throw Error('REDEMPTION_NONCE');
  if(session.mode==='unified')reserved-=p.amount;spent+=p.amount;p.consumed=true;return ledger();
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
