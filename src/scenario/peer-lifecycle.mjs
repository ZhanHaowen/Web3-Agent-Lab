import {decodeEventLog} from 'viem';
import {copy,units} from './core.mjs';
import {assertQuoteIntegrity} from './quote-binding.mjs';

const lower=value=>String(value).toLowerCase();
const peer=s=>s.spec?.template==='peer_swap';
const same=(a,b)=>lower(a)===lower(b);

function assertOrder(s,o){
  const q=assertQuoteIntegrity(s),r=s.realm,c=s.registry.chain.env().contracts;
  if(!same(o.maker,r.accounts.maker.address)||!same(o.taker,r.accounts.taker.address)||
    !same(o.sellToken,c.tokenA)||!same(o.buyToken,c.tokenB)||BigInt(o.sellAmount)!==units(q.sellAmount)||
    BigInt(o.buyAmount)!==units(q.buyAmount)||o.termsHash!==q.termsHash||String(o.deadline)!==q.deadline||o.salt!==q.salt)
    throw Error('ORDER_TERMS_MISMATCH');
}

/** Synchronize transaction facts and business objects, including after stop/restart. */
export async function reconcilePeerState(s,options={}){
  await s.registry.reconcile(s,options);
  if(!peer(s)||!s.realm)return;
  const expected=s.expectedOrderId??s.proposedOrderId??s.orderId;
  if(expected){
    const order=await s.registry.order(s,expected);
    if(Number(order.state)>0){
      assertOrder(s,order);s.orderId=expected;s.order=order;
      s.orders??=[];if(!s.orders.includes(expected))s.orders.push(expected);
    }
  }
  for(const tx of s.transactions){
    if(tx.state==='reverted'){
      if(!tx.failureHandled){
        s.transactionFailure={intentId:tx.intentId,hash:tx.hash,operationId:tx.operationId,
          code:'TRANSACTION_REVERTED',functionName:tx.functionName,retry:'explicit_policy_required'};
        await s.emit('workflow.transaction_failed',s.transactionFailure,null,[tx.intentEventId]);
        tx.failureHandled=true;
      }
      continue;
    }
    if(tx.state!=='confirmed'||tx.businessVerified||!tx.receipt)continue;
    try{
      if(tx.functionName==='approve'){
        const c=s.registry.chain.env().contracts,sell=tx.actorId==='maker';
        const required=units(sell?s.quote.sellAmount:s.quote.buyAmount);
        if(!same(tx.to,sell?c.tokenA:c.tokenB)||!same(tx.args[0],s.realm.exchange)||BigInt(tx.args[1])!==required)
          throw Error('APPROVAL_TERMS_MISMATCH');
        const approved=tx.receipt.logs.some(log=>{
          if(!same(log.address,tx.to))return false;
          try{const event=decodeEventLog({abi:s.registry.chain.artifacts.LabToken.abi,...log});
            return event.eventName==='Approval'&&same(event.args.owner,tx.from)&&same(event.args.spender,s.realm.exchange)&&BigInt(event.args.value??event.args.amount)===required;
          }catch{return false;}
        });
        if(!approved)throw Error('APPROVAL_POSTCONDITION');
      }else if(tx.functionName==='createOrder'){
        if(!s.order||Number(s.order.state)===0)throw Error('ORDER_POSTCONDITION');assertOrder(s,s.order);
      }else if(tx.functionName==='fillOrder'){
        if(Number(s.order?.state)!==2)throw Error('FILL_POSTCONDITION');assertOrder(s,s.order);
      }else if(tx.functionName==='cancelOrder'||tx.functionName==='expireOrder'){
        if(Number(s.order?.state)!==(tx.functionName==='cancelOrder'?3:4))throw Error('REFUND_POSTCONDITION');
      }else continue;
      await s.emit('workflow.transaction_verified',{intentId:tx.intentId,operationId:tx.operationId,
        hash:tx.hash,functionName:tx.functionName,orderId:s.orderId??null,acceptanceId:s.acceptance?.acceptanceId},null,[tx.intentEventId]);
      tx.businessVerified=true;
    }catch(error){
      s.transactionFailure={intentId:tx.intentId,hash:tx.hash,code:error.message,functionName:tx.functionName,retry:'reconcile_evidence_required'};
      await s.emit('workflow.postcondition_failed',s.transactionFailure,null,[tx.intentEventId]);break;
    }
  }
  s.fundsStatus=s.pending.length?'unknown':Number(s.order?.state)===1?'open':Number(s.order?.state)===2?'settled':Number(s.order?.state)>=3?'refunded':'none';
  await s.registry.persistTransactions(s);
}

export function transactionError(s,call,error){
  const tx=[...s.transactions].reverse().find(t=>t.intentEventId&&((t.causes??[]).includes(call?.toolEventId)||t.toolEventId===call?.toolEventId));
  // An unassociated pending transaction is still not evidence that nothing was sent.
  const related=tx??s.pending.at(-1);
  return {error:error.message,code:error.code??error.message,detail:error.detail??null,
    quoteCommitStatus:error.quoteCommitStatus??null,
    submissionStatus:related?(related.hash?'hash_known':'broadcast_attempted'):'not_attempted',
    submitted:related?null:false,intentId:related?.intentId??null,txHash:related?.hash??null,
    transactionState:related?.state??null,recoverable:!related&&!s.recordingFailure&&!/BUDGET|MODEL_HTTP|MODEL_INVALID/.test(error.message),
    instruction:error.quoteCommitStatus?'The business record is durable but its export is pending. Recover recording; do not create a new quote or acceptance.':related?'A transaction exists or its outcome is unknown. Reconcile it; do not submit a new transaction.':'The requested action was rejected. Correct the named fields before retrying.',
    progress:s.progress(s.agents.find(a=>a.agentId===related?.actorId)??s.agents[0])};
}

/** Timer work never advances a manually paused or stopped workflow. */
export async function monitorPeer(s){
  if(!peer(s)||s.pumping||s.monitoring||s.controlBusy||s.recordingFailure||!s.pending.length||s.state==='initializing')return;
  s.monitoring=true;
  try{
    await reconcilePeerState(s,{rebroadcast:!s.stopRequested&&!s.abort.signal.aborted});
    if(s.transactionFailure){s.state='requires_attention';s.error=s.transactionFailure.code;}
    if(!s.pending.length){
      if(s.stopRequested||s.abort.signal.aborted)await s.finish('stopped_reconciled');
      else if(!s.transactionFailure&&!s.globalPauseRequested&&s.state!=='paused'){
        const automatic=!s.spec.manual;s.state='running';await s.persist();
        if(automatic){await s.emit('workflow.resumed_after_confirmation',{});s.pump();}
      }
    }
    await s.persist();
  }catch(error){s.state='requires_attention';s.error='RECONCILIATION_REQUIRED: '+error.message;await s.persist().catch(()=>{});}
  finally{s.monitoring=false;}
}
