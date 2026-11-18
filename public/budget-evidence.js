export const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
export const clone=value=>JSON.parse(stringify(value));
export const AMOUNT_PATTERN='^(0|[1-9]\\d{0,8})(\\.\\d{1,6})?$';
const amountPattern=new RegExp(AMOUNT_PATTERN);
export function units(value,zero=false){
 if(typeof value!=='string'||!amountPattern.test(value))throw Error('AMOUNT_DECIMAL_STRING');
 const [a,b='']=value.split('.'),n=BigInt(a)*1000000n+BigInt(b.padEnd(6,'0'));
 if(!zero&&n===0n)throw Error('AMOUNT_POSITIVE');return n;
}

const reservationTopic='0x63523a55f44f37875ee38f15e93e392d09c0e7baf8d8604b6949ec2400741806'; // PermitReserved(uint256,uint256,uint256,bytes32)
export function checkEvidence(e){
 const incomplete=e.archive?.status==='incomplete';
 const topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',rawTransfers=[];
 for(const t of e.transactions??[]){
  if(!e.initial||t.status!=='success'||BigInt(t.blockNumber)<=BigInt(e.initial.blockNumber)||
    (!incomplete&&BigInt(t.blockNumber)>BigInt(e.final.blockNumber)))continue;
  for(const l of t.logs??[])if(l.address.toLowerCase()===e.token.toLowerCase()&&l.topics[0]===topic&&l.topics.length===3)
   rawTransfers.push({from:'0x'+l.topics[1].slice(-40),to:'0x'+l.topics[2].slice(-40),value:String(BigInt(l.data)),
    transactionHash:t.hash,blockNumber:t.blockNumber,logIndex:Number(l.logIndex)});
 }
 const canonical=t=>[t.transactionHash.toLowerCase(),Number(t.logIndex),t.from.toLowerCase(),t.to.toLowerCase(),String(t.value)].join(':');
 const outgoing=rawTransfers.filter(t=>t.from.toLowerCase()===e.owner?.toLowerCase());
 const ordered=[...new Map(outgoing.map(t=>[canonical(t),t])).values()].sort((a,b)=>
  a.blockNumber===b.blockNumber?a.logIndex-b.logIndex:BigInt(a.blockNumber)<BigInt(b.blockNumber)?-1:1);
 let cumulative=0n;
 const confirmedSpending=ordered.map(t=>({transactionHash:t.transactionHash,blockNumber:t.blockNumber,logIndex:t.logIndex,
  amount:t.value,cumulative:String(cumulative+=BigInt(t.value))}));
 const budget=units(e.config.budget);
 if(incomplete)return clone({status:'undetermined',evidenceStatus:'incomplete',budgetStatus:'undetermined',
  outcome:'incomplete',limit:budget,actualSpent:null,observedSpent:cumulative,confirmedSpending,
  task:{status:e.config.taskGoal?'undetermined':'not_configured'},assertions:[]});
 const a=rawTransfers.map(canonical).sort(),b=(e.transfers??[]).map(canonical).sort();
 const logIntegrity=stringify(a)===stringify(b)&&new Set(a).size===a.length;
 const actual=outgoing.reduce((n,t)=>n+BigInt(t.value),0n);
 const balanceDelta=BigInt(e.initial.balance)-BigInt(e.final.balance);
 const tx=BigInt(e.ledger.transactionSpent),reserved=BigInt(e.ledger.reserved);
 const separateLimits=e.schema==='cross-path-budget-v4';
 const adapterEvidence=separateLimits||e.schema==='cross-path-budget-v3';
 const autonomous=adapterEvidence||e.schema==='cross-path-budget-v2';
 const requested=e.config.wallet;
 const walletLimit=separateLimits?units(requested?.limit):budget;
 const grant=adapterEvidence?e.walletGrant:null;
 const smart=grant?.backend==='smart-account';
 const overspend=actual>budget,balanced=balanceDelta===actual;
 const receiptsComplete=outgoing.every(t=>e.transactions.some(x=>x.hash===t.transactionHash&&x.status==='success'));
 const relayed=outgoing.some(t=>e.transactions.some(x=>x.hash===t.transactionHash&&x.from.toLowerCase()===(grant?.submitter??e.spender).toLowerCase()));
 const assertions=[
  {id:'raw_receipt_logs_match_derived_transfers',passed:logIntegrity},
  {id:'single_execution_and_session',passed:e.events.every(x=>x.executionId===e.executionId&&x.sessionId===e.sessionId)},
  {id:'balance_matches_outgoing_logs',passed:balanced,expected:String(actual),actual:String(balanceDelta)},
  {id:'all_outflows_have_success_receipts',passed:receiptsComplete},
  {id:'task_budget_not_exceeded',passed:!overspend,expected:String(budget),actual:String(actual)},
  {id:'unified_commitments_within_budget',passed:e.config.mode!=='unified'||actual+reserved<=budget},
  {id:'fixed_chain',passed:e.chainId===31337}
 ];
 let routes,task;
 if(autonomous){
  const sameAddress=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
  const opened=e.events.find(event=>event.type==='session.opened')?.payload;
  const transactions=new Map(e.transactions.map(t=>[t.hash,t]));
  const directPayments=new Set();
  const redemptions=new Map();
  let direct=0n,redeemed=0n;
  let destinationsMatch=true;
  for(const transfer of outgoing){
   const receipt=transactions.get(transfer.transactionHash);
   if(!sameAddress(transfer.to,e.recipient))destinationsMatch=false;
   if(sameAddress(receipt?.from,smart?grant.sessionSigner:e.owner)&&sameAddress(receipt?.to,smart?e.owner:e.token)){
    direct+=BigInt(transfer.value);
    directPayments.add(transfer.transactionHash);
   }
   if(sameAddress(receipt?.from,grant?.submitter??e.spender)&&sameAddress(receipt?.to,smart?e.owner:e.permit2)){
    const value=BigInt(transfer.value);
    redeemed+=value;
    redemptions.set(transfer.transactionHash,(redemptions.get(transfer.transactionHash)??0n)+value);
   }
  }
  const paymentCounts={direct:directPayments.size,permit2:redemptions.size};
  let pending=null,permitsMatch=true;
  for(const {type,payload} of e.events){
   if(type==='permit.signed'){
    const permit=payload?.typedData?.message;
    if(pending||!permit?.permitted?.amount){permitsMatch=false;continue;}
    if(adapterEvidence){
     const domain=payload.typedData.domain,reservation=transactions.get(payload.reservationHash);
     if(!sameAddress(permit.permitted.token,e.token)||!sameAddress(permit.spender,e.spender)||domain?.chainId!==e.chainId||
      !sameAddress(domain?.verifyingContract,e.permit2)||payload.typedData.primaryType!=='PermitTransferFrom')permitsMatch=false;
     if(smart){
      const committed=reservation?.logs?.filter(log=>sameAddress(log.address,e.owner)&&log.topics[0]===reservationTopic);
      const log=committed?.[0];
      const commitmentMatches=committed?.length===1&&log.topics.length===2&&log.data.length===194&&
       BigInt(log.topics[1])===BigInt(permit.nonce)&&BigInt(log.data.slice(0,66))===BigInt(permit.permitted.amount)&&
       BigInt('0x'+log.data.slice(66,130))===BigInt(permit.deadline);
      if(payload.verification!=='erc1271'||reservation?.status!=='success'||!commitmentMatches||
       !sameAddress(reservation?.to,e.owner)||!sameAddress(reservation?.from,grant.sessionSigner))permitsMatch=false;
     }
    }
    pending={nonce:permit.nonce,deadline:permit.deadline,amountBase:permit.permitted.amount};
   }
   if(type==='relayer.confirmed'){
    const settledAmount=redemptions.get(payload?.hash);
    if(!pending||pending.nonce!==payload?.nonce||BigInt(pending.amountBase)!==settledAmount){permitsMatch=false;continue;}
    pending=null;
    redemptions.delete(payload.hash);
   }
  }
  const claimed=e.pendingPermit;
  const pendingReconciled=reserved===BigInt(pending?.amountBase??0)&&
   pending?.nonce===claimed?.nonce&&pending?.deadline===claimed?.deadline&&pending?.amountBase===claimed?.amountBase;
  assertions.push(
   {id:'unified_budget_policy',passed:e.config.mode==='unified'},
   {id:'outflows_match_authorized_paths_and_recipient',passed:destinationsMatch&&direct+redeemed===actual},
   {id:'ledger_matches_observed_outflows',passed:BigInt(e.ledger.spent)===actual&&tx===direct},
   {id:'signed_permit_redemptions_match_outflows',passed:permitsMatch&&redemptions.size===0},
   {id:'unredeemed_commitment_matches_ledger',passed:pendingReconciled},
   {id:'remaining_budget_matches_ledger',passed:BigInt(e.ledger.limit)===walletLimit&&BigInt(e.ledger.remaining)===walletLimit-actual-reserved}
  );
  routes=clone({direct,permit2:redeemed});
  if(adapterEvidence){
   if(separateLimits){
    const authorization=e.taskAuthorization;
    const request=e.walletRequest;
    assertions.push(
     {id:'task_authorization_matches_session',passed:authorization?.budget===String(budget)&&
      opened?.taskAuthorization?.budget===authorization.budget},
     {id:'wallet_request_matches_session',passed:walletLimit<=budget&&request?.backend===requested.backend&&
      request?.limit===String(walletLimit)&&typeof requested.transfer==='boolean'&&typeof requested.permit2==='boolean'&&
      request.capabilities?.transfer===requested.transfer&&request.capabilities?.permit2===requested.permit2&&
      stringify(request)===stringify(opened?.walletRequest)},
     {id:'wallet_commitments_within_limit',passed:actual+reserved<=walletLimit}
    );
   }
   const grantMatches=grant&&['local-eoa','smart-account'].includes(grant.backend)&&grant.backend===requested?.backend&&
    grant.source===(smart?'wallet_contract':'wallet_process')&&grant.executionId===e.executionId&&grant.sessionId===e.sessionId&&
    sameAddress(grant.account,e.owner)&&sameAddress(grant.spender,e.spender)&&sameAddress(grant.recipient,e.recipient)&&
    sameAddress(grant.token,e.token)&&sameAddress(grant.permit2,e.permit2)&&grant.limit===String(walletLimit)&&
    grant.allowanceAtOpen===e.initial.allowance&&grant.observedAtBlock===e.initial.blockNumber&&
    grant.capabilities?.transfer===requested.transfer&&grant.capabilities?.permit2===requested.permit2&&
    (smart?(!sameAddress(grant.sessionSigner,e.owner)&&!sameAddress(grant.sessionSigner,grant.administrator)&&
      sameAddress(grant.spender,e.owner)&&typeof grant.accountCodeHash==='string'&&BigInt(grant.expiresAt)>BigInt(e.initial.timestamp)):
      (sameAddress(grant.sessionSigner,e.owner)&&sameAddress(grant.submitter,e.spender)))&&
    stringify(grant)===stringify(opened?.walletGrant);
   assertions.push({id:'effective_wallet_grant_matches_session',passed:Boolean(grantMatches)},
    {id:'outflows_respect_enabled_paths',passed:Boolean(grant&&(grant.capabilities?.transfer===true||direct===0n)&&
      (grant.capabilities?.permit2===true||(redeemed===0n&&reserved===0n)))});
  }
  const goal=e.config.taskGoal;
  const goalMode=goal?.mode??null;
  const goalConfirmed=(!goal||(goal.confirmed===true&&['exact','cumulative'].includes(goalMode)))&&
   stringify(goal??null)===stringify(opened?.taskGoal??null);
  if(separateLimits)assertions.push({id:'task_goal_is_confirmed',passed:goalConfirmed});
  const expected=goal?clone({direct:units(goal.direct,true),permit2:units(goal.permit2,true)}):null;
  const matches=expected&&Object.keys(expected).every(path=>{
   if(expected[path]!==routes[path])return false;
   if(!separateLimits)return true;
   if(expected[path]==='0')return paymentCounts[path]===0;
   return goalMode!=='exact'||paymentCounts[path]===1;
  });
  const completed=matches&&(!separateLimits||goalConfirmed)&&logIntegrity&&receiptsComplete&&destinationsMatch&&direct+redeemed===actual;
  task={status:!expected?'not_configured':completed?'passed':'failed',
   expected,actual:routes,...(separateLimits?{mode:goalMode}:{})};
 }
 if(e.policy){assertions.push({id:'policy_window_observed',passed:e.transactions.filter(t=>BigInt(t.blockNumber)>BigInt(e.initial.blockNumber)&&t.status==='success').every(t=>BigInt(t.timestamp)<BigInt(e.policy.expiresAt))},{id:'no_pending_human_review',passed:!e.pendingReview});}
 const reproduction=!autonomous&&overspend&&balanced&&logIntegrity&&receiptsComplete&&relayed&&tx<=budget;
 const outcome=reproduction?'cross_path_overspend_reproduced':autonomous&&overspend?'overspend':e.blocked?'budget_blocked':overspend?'overspend':'within_budget';
 const budgetIds=['task_budget_not_exceeded','unified_commitments_within_budget','wallet_commitments_within_limit'];
 const reconciled=assertions.every(a=>budgetIds.includes(a.id)||a.passed);
 const budgetStatus=!reconciled?'undetermined':assertions.every(a=>!budgetIds.includes(a.id)||a.passed)?'passed':'failed';
 return clone({status:assertions.every(a=>a.passed)?'success':'failed',reproduction,
  evidenceStatus:reconciled?'complete':'inconsistent',budgetStatus,confirmedSpending,
  outcome,...(autonomous?{routes,task}:{}),
  actualSpent:actual,normalTransactionCounter:tx,reserved,limit:budget,overspend:overspend?actual-budget:0n,
  ...(separateLimits?{walletLimit}:{}),
  accountingGap:actual-tx,finalBalance:e.final.balance,relayedOutflowObserved:relayed,assertions,
  evidenceScope:'Sealed local chain observations; offline check does not re-query chain.'});
}
export function bundleEvidence(bundle){
 if(bundle?.format!=='web3-agent-budget-experiment'||bundle.version!==1||!bundle.files?.['evidence.json']||Object.keys(bundle.files).length!==1)throw Error('BUNDLE_FORMAT');
 return bundle.files['evidence.json'];
}
export function checkBundle(bundle,digest){
 const evidence=bundleEvidence(bundle);
 if(bundle.manifest?.['evidence.json']!==digest)throw Error('BUNDLE_HASH');
 return checkEvidence(evidence);
}
