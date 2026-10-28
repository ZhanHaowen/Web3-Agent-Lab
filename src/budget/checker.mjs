import {units,clone,sha,stringify} from './common.mjs';
export function checkEvidence(e){
 const topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',rawTransfers=[];
 for(const t of e.transactions){
  if(t.status!=='success'||BigInt(t.blockNumber)<=BigInt(e.initial.blockNumber)||BigInt(t.blockNumber)>BigInt(e.final.blockNumber))continue;
  for(const l of t.logs??[])if(l.address.toLowerCase()===e.token.toLowerCase()&&l.topics[0]===topic&&l.topics.length===3)
   rawTransfers.push({from:'0x'+l.topics[1].slice(-40),to:'0x'+l.topics[2].slice(-40),value:String(BigInt(l.data)),transactionHash:t.hash,logIndex:Number(l.logIndex)});
 }
 const canonical=t=>[t.transactionHash.toLowerCase(),Number(t.logIndex),t.from.toLowerCase(),t.to.toLowerCase(),String(t.value)].join(':');
 const a=rawTransfers.map(canonical).sort(),b=(e.transfers??[]).map(canonical).sort();
 const logIntegrity=stringify(a)===stringify(b)&&new Set(a).size===a.length;
 const outgoing=rawTransfers.filter(t=>t.from.toLowerCase()===e.owner.toLowerCase());
 const actual=outgoing.reduce((n,t)=>n+BigInt(t.value),0n),budget=units(e.config.budget);
 const balanceDelta=BigInt(e.initial.balance)-BigInt(e.final.balance);
 const tx=BigInt(e.ledger.transactionSpent),reserved=BigInt(e.ledger.reserved);
 const overspend=actual>budget,balanced=balanceDelta===actual;
 const receiptsComplete=outgoing.every(t=>e.transactions.some(x=>x.hash===t.transactionHash&&x.status==='success'));
 const relayed=outgoing.some(t=>e.transactions.some(x=>x.hash===t.transactionHash&&x.from.toLowerCase()===e.spender.toLowerCase()));
 const assertions=[
  {id:'raw_receipt_logs_match_derived_transfers',passed:logIntegrity},
  {id:'single_execution_and_session',passed:e.events.every(x=>x.executionId===e.executionId&&x.sessionId===e.sessionId)},
  {id:'balance_matches_outgoing_logs',passed:balanced,expected:String(actual),actual:String(balanceDelta)},
  {id:'all_outflows_have_success_receipts',passed:receiptsComplete},
  {id:'task_budget_not_exceeded',passed:!overspend,expected:String(budget),actual:String(actual)},
  {id:'unified_commitments_within_budget',passed:e.config.mode!=='unified'||actual+reserved<=budget},
  {id:'fixed_chain',passed:e.chainId===31337}
 ];
 const reproduction=overspend&&balanced&&logIntegrity&&receiptsComplete&&relayed&&tx<=budget;
 return clone({status:assertions.every(a=>a.passed)?'success':'failed',reproduction,
  outcome:reproduction?'cross_path_overspend_reproduced':e.blocked?'budget_blocked':overspend?'overspend':'within_budget',
  actualSpent:actual,normalTransactionCounter:tx,reserved,limit:budget,overspend:overspend?actual-budget:0n,
  accountingGap:actual-tx,finalBalance:e.final.balance,relayedOutflowObserved:relayed,assertions,
  evidenceScope:'Sealed local chain observations; offline check does not re-query chain.'});
}
export function seal(evidence){
 const files={'evidence.json':clone(evidence)},manifest=Object.fromEntries(Object.entries(files).map(([p,v])=>[p,sha(stringify(v))]));
 return {format:'web3-agent-budget-experiment',version:1,files,manifest};
}
export function verify(bundle){
 if(bundle?.format!=='web3-agent-budget-experiment'||bundle.version!==1||!bundle.files?.['evidence.json']||Object.keys(bundle.files).length!==1)throw Error('BUNDLE_FORMAT');
 for(const [p,v]of Object.entries(bundle.files))if(bundle.manifest?.[p]!==sha(stringify(v)))throw Error('BUNDLE_HASH');
 return checkEvidence(bundle.files['evidence.json']);
}
