import { validatePublicObserver } from './index.mjs';
const logAmount=x=>{const s=BigInt(x).toString();return Number(s.slice(0,15))/10**(Math.min(15,s.length)-1) ? (s==='0'?0:(s.length-1)*Math.LN10+Math.log(Number(s.slice(0,15))/10**(Math.min(15,s.length)-1))) : 0;};

/** Features depend only on the public projection. Raw amounts are never summed across assets. */
export function extractPublicFeatures(observer,{amount=true,order=true,time=true,merchant=true,wallet=false}={}) {
  const valid=validatePublicObserver(observer);if(!valid.ok)throw Error(valid.issues[0]);
  const f={transactionCount:observer.transactions.length,paymentCount:observer.payments.length,revertedTransactions:observer.transactions.filter(t=>t.status==='0').length};
  const add=(k,v=1)=>f[k]=(f[k]??0)+v;
  const sums=new Map();
  for(const p of observer.payments){
    if(merchant)add('payee:'+p.payee);
    if(wallet)add('payer:'+p.payer);
    if(amount){sums.set(p.asset,(sums.get(p.asset)??0n)+BigInt(p.amount));add('assetCount:'+p.asset);}
  }
  if(amount)for(const [asset,value]of sums)f['logAmount:'+asset]=logAmount(value);
  if(merchant)f.distinctPayees=new Set(observer.payments.map(p=>p.payee)).size;
  if(order){for(let i=1;i<observer.payments.length;i++){const a=observer.payments[i-1],b=observer.payments[i];add(merchant?'transition:'+a.payee+'>'+b.payee:'repeatAdjacent',merchant?1:Number(a.payee===b.payee));}}
  if(time){const timestamps=observer.payments.map(p=>Number(BigInt(p.blockTimestamp)));if(timestamps.length){const gaps=timestamps.slice(1).map((t,i)=>t-timestamps[i]);f.paymentSpanSeconds=timestamps.at(-1)-timestamps[0];f.meanGapSeconds=gaps.length?gaps.reduce((s,x)=>s+x,0)/gaps.length:0;f.sameBlockPairs=observer.payments.slice(1).filter((p,i)=>p.blockNumber===observer.payments[i].blockNumber).length;}}
  if(observer.publicCatalog&&merchant){const addresses=new Set(observer.publicCatalog.map(p=>p.address));f.paymentsToListedMerchants=observer.payments.filter(p=>addresses.has(p.payee)).length;}
  return f;
}
