import { createServer } from 'node:http';
import { capturePublicChain } from '../src/observer/index.mjs';
export const addr=n=>'0x'+String(n).padStart(40,'0');
export const h=n=>'0x'+BigInt(n).toString(16).padStart(64,'0');
const topic=a=>'0x'+a.slice(2).padStart(64,'0');
export async function rpcFixture(t,{seed=10,reorg=false,missingReceipt=false,privateCanary='PRIVATE_CANARY'}={}) {
  const blockHash=h(seed),parent=h(seed-1),payer=addr(1),relayer=addr(2),merchant=addr(3),asset=addr(4);
  const makeTx=i=>({hash:h(seed*10+i),blockNumber:'0x1',blockHash,transactionIndex:'0x'+i,from:relayer,to:asset,nonce:'0x'+i,value:i===2?'0x7':'0x0',input:'0x12345678',gas:'0x186a0',gasPrice:'0x1',privateTask:privateCanary});
  const txs=[0,1,2].map(makeTx),log={address:asset,topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',topic(payer),topic(merchant)],data:h(20),blockNumber:'0x1',blockHash,transactionHash:txs[0].hash,transactionIndex:'0x0',logIndex:'0x0',removed:false,privateTask:privateCanary};
  const block={number:'0x1',hash:blockHash,parentHash:parent,timestamp:'0x64',transactions:[...txs].reverse(),privateTask:privateCanary};
  const requests=[];const server=createServer(async(req,res)=>{let text='';for await(const c of req)text+=c;const {id,method,params}=JSON.parse(text);requests.push({method,params});let result;
    if(method==='eth_chainId')result='0x7a69';
    else if(method==='eth_getBlockByNumber')result=params[1]?block:{...block,hash:reorg?h(seed+1):blockHash,transactions:txs.map(t=>t.hash)};
    else if(method==='eth_getTransactionReceipt'){const tx=txs.find(x=>x.hash===params[0]);result=missingReceipt?null:{transactionHash:tx.hash,blockHash,blockNumber:'0x1',transactionIndex:tx.transactionIndex,status:tx.transactionIndex==='0x1'?'0x0':'0x1',gasUsed:'0x5208',effectiveGasPrice:'0x1',logs:tx.transactionIndex==='0x0'?[log]:[]};}
    else{res.statusCode=400;res.end();return;}res.setHeader('content-type','application/json');res.end(JSON.stringify({jsonrpc:'2.0',id,result}));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const rpcUrl='http://127.0.0.1:'+server.address().port;
  return {rpcUrl,requests,payer,relayer,merchant,asset,blockHash,txs,capture:opts=>capturePublicChain({rpcUrl,fromBlock:'1',toBlock:'1',...opts})};
}
export function truth(i=0){return {schema:'web3-research-truth-v1',runId:'private-run-'+i,task:{family:i%2?'risk':'evidence',instanceId:'instance-'+i,templateVersion:'v1'},strategy:i%2?'quality':'cost',budgetBase:String(100+i),initialBalanceBase:'1000',tokenDecimals:0,taskOutcome:i%3?'success':'failed',purchases:[]};}
