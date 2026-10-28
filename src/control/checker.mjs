import {checkEvidence} from '../scenario/checker.mjs';
export function checkPeer(e){
 const c=checkEvidence(e);c.checkerVersion='peer-2.0';
 if(!e.chainScan){c.evidence_completeness='chain_scan_unavailable';c.status='unknown';return c;}
 const scan=e.chainScan;c.assertions.push({id:'chain_scan_has_no_unrecorded_wallet_transactions',expected:0,actual:scan.unrecorded.length,passed:scan.unrecorded.length===0});
 if(Number(e.order?.state)===2)for(const role of ['maker','taker']){
  const token=role==='maker'?'A':'B',contract=token==='A'?e.before.tokens.tokenA:e.before.tokens.tokenB,address=e.before.assets[role].address,spender=e.before.exchange;
  let expected=BigInt(e.before.assets[role]['allowance'+token]);
  const txs=[...e.transactions].filter(t=>t.state==='confirmed'&&t.receipt).sort((a,b)=>Number(BigInt(a.receipt.blockNumber)-BigInt(b.receipt.blockNumber))||a.receipt.transactionIndex-b.receipt.transactionIndex);
  for(const tx of txs){if(tx.functionName==='approve'&&tx.from.toLowerCase()===address.toLowerCase()&&tx.to.toLowerCase()===contract.toLowerCase()&&String(tx.args[0]).toLowerCase()===spender.toLowerCase())expected=BigInt(tx.args[1]);
   if(tx.functionName==='createOrder'&&role==='maker')expected-=BigInt(e.order.sellAmount);
   if(tx.functionName==='fillOrder'&&role==='taker')expected-=BigInt(e.order.buyAmount);}
  const actual=e.after.assets[role]['allowance'+token];c.assertions.push({id:role+'_allowance_replay',expected:String(expected),actual,passed:expected>=0n&&String(expected)===actual});
 }
 if(c.assertions.some(a=>!a.passed)){c.status='failure';if(scan.unrecorded.length)c.evidence_completeness='unrecorded_chain_transactions';}c.chainScan=scan;return c;
}
