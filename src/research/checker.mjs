import { validatePublicObserver } from '../observer/index.mjs';
const integer=x=>{if(!/^[0-9]+$/.test(String(x)))throw Error('CHECKER_NONNEGATIVE_INTEGER');return BigInt(x);};

/** Independently recomputes private ledger arithmetic, without adopting summary.success. */
export function checkResearchRun({summary={},truth,ledger,observer}) {
  const assertions=[],add=(id,passed,details={})=>assertions.push({id,passed:Boolean(passed),...details});
  try {
    add('private_truth_present',truth?.schema==='web3-research-truth-v1'&&!!truth.task?.family&&!!truth.task?.instanceId&&!!truth.strategy);
    add('ledger_schema',ledger?.schema==='web3-private-budget-ledger-v1'&&Array.isArray(ledger.entries));
    if(!ledger||!truth||!Array.isArray(ledger.entries))throw Error('CHECKER_MISSING_LEDGER_OR_TRUTH');
    const budget=integer(ledger.budgetBase),initial=integer(ledger.initialBalanceBase);
    add('budget_truth_consistency',budget===integer(truth.budgetBase)&&initial===integer(truth.initialBalanceBase));
    const gross=ledger.budgetSemantics==='gross-settled-plus-reserved';
    add('budget_semantics_explicit',gross||ledger.budgetSemantics==='net-settled-plus-reserved-less-confirmed-refunds');
    let settled=0n,reserved=0n,refunded=0n,liability=0n;const ids=new Set();
    for(const e of ledger.entries){
      const id=e.purchaseId??e.requestId;add('entry_identity:'+id,typeof id==='string'&&!ids.has(id));ids.add(id);
      const s=integer(e.settledBase??0),r=integer(e.reservedBase??0),f=integer(e.refundedBase??0),computed=s+r-(gross?0n:f);
      add('entry_arithmetic:'+id,computed>=0n&&f<=s&&computed===integer(e.liabilityBase));
      add('entry_state:'+id,['reserved','settled','pending','failed','unknown'].includes(e.state));
      if(['reserved','pending','unknown'].includes(e.state))add('unresolved_obligation_retained:'+id,s+r>=integer(e.quotedAmountBase));
      settled+=s;reserved+=r;refunded+=f;liability+=computed;
    }
    const totals={settledBase:settled,reservedBase:reserved,refundedBase:refunded,liabilityBase:liability};
    for(const [k,v] of Object.entries(totals))add('total_'+k,String(ledger.totals?.[k])===String(v),{expected:String(v),actual:ledger.totals?.[k]??null});
    add('private_budget_not_exceeded',liability<=budget,{liabilityBase:String(liability),budgetBase:String(budget)});
    add('remaining_budget_matches',String(ledger.totals?.remainingBudgetBase)===String(budget-liability));
    if(ledger.totals?.estimatedSpendableBudgetFromInitial!==undefined)add('accounting_capacity_matches',String(ledger.totals.estimatedSpendableBudgetFromInitial)===String(initial-liability),{scope:'Accounting capacity, not actual on-chain liquid balance; channel capital is separate.'});
    add('settled_principal_within_initial_balance',settled-refunded<=initial);
    // A public bundle contains all chain records in its range, not only the known experiment purchases.
    if(observer){
      const v=validatePublicObserver(observer);add('observer_public_schema_and_source',v.ok,{issues:v.issues,scope:v.scope});
      const txs=new Map(observer.transactions.map(t=>[t.hash.toLowerCase(),t])),payments=new Map(observer.payments.map(p=>[p.id,p]));
      for(const e of ledger.entries)if(BigInt(e.settledBase??0)>0n&&e.txHash)add('settled_entry_receipt:'+e.purchaseId,txs.get(e.txHash.toLowerCase())?.status==='1');
      for(const p of truth.purchases??[]){
        if(p.txHash)add('purchase_transaction_observed:'+p.purchaseId,txs.has(p.txHash.toLowerCase()));
        for(const ref of p.publicPaymentRefs??[]){const hash=String(ref.txHash).toLowerCase(),matches=ref.logIndex==null?txs.has(hash):payments.has(hash+':'+String(ref.logIndex));add('purchase_payment_reference:'+p.purchaseId+':'+String(ref.logIndex??'tx'),matches);}
      }
    }else add('observer_present',false,{reason:'Public projection missing; no privacy dataset can be declared complete.'});
    const purchases=truth.purchases??[],failures=purchases.filter(p=>!['success','delivered','completed'].includes(p.deliveryStatus));
    add('purchase_id_uniqueness',new Set(purchases.map(p=>p.purchaseId)).size===purchases.length);
    add('failure_outcomes_retained',purchases.every(p=>typeof p.deliveryStatus==='string'),{failureOrUnknownPurchases:failures.length,policy:'Failure samples are retained, not filtered to successful tasks.'});
    if(summary.runId&&truth.runId)add('run_identity',summary.runId===truth.runId);
  }catch(e){add('checker_input_valid',false,{reason:e.message});}
  return {schema:'web3-research-check-v1',status:assertions.every(a=>a.passed)?'pass':'fail',assertions,scope:'Recomputed saved ledger and public RPC projection consistency; not signer correctness, RPC authentication, service utility or a privacy guarantee.',taskOutcome:truth?.taskOutcome??summary.taskOutcome??'unknown'};
}
