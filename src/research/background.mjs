import { createHash } from 'node:crypto';
import { createRpc } from '../observer/index.mjs';

/** Real, small transactions on the same isolated Anvil RPC. Never synthetic observer rows. */
export async function generateBackground({rpcUrl,count=3,seed='background',from,to,tokenAddress=null,amountBase='1',receiptTimeoutMs=15000}) {
  const url=new URL(rpcUrl);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('BACKGROUND_LOCAL_CHAIN_ONLY');
  if(!Number.isSafeInteger(count)||count<0||count>100||!/^[0-9]+$/.test(String(amountBase))||BigInt(amountBase)<=0n)throw Error('BACKGROUND_PARAMETERS');
  const rpc=createRpc(rpcUrl);if(BigInt(await rpc('eth_chainId'))!==31337n)throw Error('BACKGROUND_CHAIN_ID');
  const accounts=await rpc('eth_accounts'),sender=from??accounts[8],recipient=to??accounts[9];
  const valid=a=>/^0x[0-9a-fA-F]{40}$/.test(a??'');
  if(!valid(sender)||!valid(recipient)||sender.toLowerCase()===recipient.toLowerCase()||!accounts.some(a=>a.toLowerCase()===sender.toLowerCase())||(tokenAddress&&!valid(tokenAddress)))throw Error('BACKGROUND_ACCOUNT');
  const records=[];
  for(let i=0;i<count;i++){
    const extra=BigInt(createHash('sha256').update(String(seed)+':'+i).digest()[0]%3),amount=BigInt(amountBase)+extra;
    const transaction=tokenAddress?{from:sender,to:tokenAddress,data:'0xa9059cbb'+recipient.slice(2).toLowerCase().padStart(64,'0')+amount.toString(16).padStart(64,'0'),gas:'0x186a0'}:{from:sender,to:recipient,value:'0x'+amount.toString(16),gas:'0x5208'};
    const hash=await rpc('eth_sendTransaction',[transaction]),start=Date.now();let receipt;
    while(Date.now()-start<receiptTimeoutMs){receipt=await rpc('eth_getTransactionReceipt',[hash]);if(receipt)break;await new Promise(r=>setTimeout(r,30));}
    records.push({transactionHash:hash,from:sender,to:recipient,asset:tokenAddress??'native',amount:String(amount),status:receipt?(BigInt(receipt.status)===1n?'success':'reverted'):'pending',blockNumber:receipt?BigInt(receipt.blockNumber).toString():null});
  }
  return {schema:'web3-private-background-manifest-v1',visibility:'private-evaluator-only',seed:String(seed),count,records,notice:'Background membership stays private. Observer capture independently includes the same public chain without this manifest.'};
}

/** Same-asset, same-merchant background from independent test account 8; controlled interleaving, not concurrency. */
export async function generateMarketplaceBackground({rpcUrl,tokenAddress,providers,count=3,seed='market-background',receiptTimeoutMs=15000}) {
  const url=new URL(rpcUrl),valid=a=>/^0x[0-9a-fA-F]{40}$/.test(a??'');
  if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('BACKGROUND_LOCAL_CHAIN_ONLY');
  if(!valid(tokenAddress)||!Array.isArray(providers)||!providers.length||providers.some(p=>!valid(p))||!Number.isSafeInteger(count)||count<0||count>100||!Number.isFinite(receiptTimeoutMs)||receiptTimeoutMs<1||receiptTimeoutMs>30000)throw Error('BACKGROUND_PARAMETERS');
  const rpc=createRpc(rpcUrl);if(BigInt(await rpc('eth_chainId'))!==31337n)throw Error('BACKGROUND_CHAIN_ID');
  const accounts=await rpc('eth_accounts'),sender=accounts[8];if(!valid(sender)||providers.some(p=>p.toLowerCase()===sender.toLowerCase()))throw Error('BACKGROUND_ACCOUNT');
  if(await rpc('eth_getCode',[tokenAddress,'latest'])==='0x')throw Error('BACKGROUND_TOKEN_CONTRACT');
  const word=n=>BigInt(n).toString(16).padStart(64,'0'),addressWord=a=>a.slice(2).toLowerCase().padStart(64,'0');
  const schedule=Array.from({length:count},(_,i)=>{const bytes=createHash('sha256').update(String(seed)+':'+i).digest();return {to:providers[bytes.readUInt32BE(0)%providers.length],amount:bytes[4]%2?'30000':'10000'};});
  const total=schedule.reduce((n,p)=>n+BigInt(p.amount),0n),balance=BigInt(await rpc('eth_call',[{to:tokenAddress,data:'0x70a08231'+addressWord(sender)},'latest']));
  const records=[],funding=[];
  const send=async(data,to,amount,kind)=>{
    const transactionHash=await rpc('eth_sendTransaction',[{from:sender,to:tokenAddress,data,gas:'0x186a0'}]),started=Date.now();let receipt=null;
    while(Date.now()-started<receiptTimeoutMs){receipt=await rpc('eth_getTransactionReceipt',[transactionHash]);if(receipt)break;await new Promise(r=>setTimeout(r,30));}
    return {transactionHash,from:kind==='test-token-mint'?'0x'+'0'.repeat(40):sender,broadcaster:sender,to,asset:tokenAddress,amount:String(amount),kind,status:receipt?(BigInt(receipt.status)===1n?'success':'reverted'):'pending',blockNumber:receipt?BigInt(receipt.blockNumber).toString():null,receipt};
  };
  const manifest=()=>({schema:'web3-private-background-manifest-v1',visibility:'private-evaluator-only',mode:'same-token-shared-merchants',seed:String(seed),count,records,funding,status:records.length===count&&records.every(r=>r.status==='success')?'complete':'incomplete',notice:'Independent account 8 and seed select 10000/30000 base-unit test-token payments to shared merchants. Controlled sequential interleaving, not concurrent agents or an indistinguishability guarantee. Funding/membership stays in this private manifest; all actual public transactions remain observable.'});
  if(total>balance){const amount=total-balance;funding.push(await send('0x40c10f19'+addressWord(sender)+word(amount),sender,amount,'test-token-mint'));if(funding[0].status!=='success')return manifest();}
  for(const payment of schedule)records.push(await send('0xa9059cbb'+addressWord(payment.to)+word(payment.amount),payment.to,payment.amount,'marketplace-transfer'));
  return manifest();
}
