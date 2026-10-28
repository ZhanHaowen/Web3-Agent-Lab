import { units,copy } from './core.mjs';
const low=x=>String(x).toLowerCase();
export function checkEvidence(e){
  const {before:b,after:a,quote:q,order:o,transactions:txs,spec}=e;const assertions=[];
  const add=(id,expected,actual,passed=expected===actual)=>assertions.push({id,expected,actual,passed});
  if(!b||!a)return {status:'unknown',settlement_status:'unknown',evidence_completeness:'missing',assertions};
  add('same_chain_epoch',b.chainInstanceId,a.chainInstanceId);add('same_scope',b.sessionScope,a.sessionScope);
  add('same_exchange',low(b.exchange),low(a.exchange));
  const pending=txs.some(t=>['unknown','pending','broadcasting'].includes(t.state));
  const receiptComplete=txs.every(t=>!['confirmed','reverted'].includes(t.state)||t.receipt);
  const filled=Number(o?.state)===2;
  const successful=txs.filter(t=>t.state==='confirmed');
  const fill=successful.filter(t=>t.functionName==='fillOrder');
  const reverted=txs.filter(t=>t.state==='reverted');
  const result={checkerVersion:'peer-1.0',status:'unknown',settlement_status:pending?'pending':filled?'confirmed':Number(o?.state)===3?'cancelled':Number(o?.state)===4?'expired':o?'open':'none',
    business_outcome:filled?'filled':e.rejected?'no_deal':'incomplete',agent_goal_results:{maker:'unknown',taker:'unknown'},
    artifact_quality:'not_applicable',evidence_completeness:receiptComplete?'recorded':'missing',assertions,
    transactionCounts:{confirmed:successful.length,reverted:reverted.length,pending:txs.filter(t=>t.state==='pending').length,unknown:txs.filter(t=>t.state==='unknown').length}};
  for(const token of ['A','B']){add(`supply_${token}`,b.supply[token],a.supply[token]);
    const sum=state=>BigInt(state.assets.maker[token])+BigInt(state.assets.taker[token])+BigInt(state.escrow[token]);
    add(`tracked_asset_conservation_${token}`,String(sum(b)),String(sum(a)));}
  if(pending||!receiptComplete){result.evidence_completeness='pending_reconciliation';return result;}
  if(filled&&q){
    const x=units(q.sellAmount),y=units(q.buyAmount);
    add('maker_identity',low(b.assets.maker.address),low(o.maker));add('taker_identity',low(b.assets.taker.address),low(o.taker));
    add('sell_token',low(b.tokens.tokenA),low(o.sellToken));add('buy_token',low(b.tokens.tokenB),low(o.buyToken));
    add('sell_amount',String(x),String(o.sellAmount));add('buy_amount',String(y),String(o.buyAmount));
    add('terms_hash',low(q.termsHash),low(o.termsHash));add('single_fill',1,fill.length);
    add('fill_signer',low(b.assets.taker.address),low(fill[0]?.receipt?.from));
    add('fill_target',low(b.exchange),low(fill[0]?.receipt?.to));
    add('maker_A_delta',String(-x),String(BigInt(a.assets.maker.A)-BigInt(b.assets.maker.A)));
    add('maker_B_delta',String(y),String(BigInt(a.assets.maker.B)-BigInt(b.assets.maker.B)));
    add('taker_A_delta',String(x),String(BigInt(a.assets.taker.A)-BigInt(b.assets.taker.A)));
    add('taker_B_delta',String(-y),String(BigInt(a.assets.taker.B)-BigInt(b.assets.taker.B)));
    add('escrow_A_released',b.escrow.A,a.escrow.A);add('escrow_B_unchanged',b.escrow.B,a.escrow.B);
    const transferSig='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const transfers=fill[0]?.receipt?.logs?.filter(l=>l.topics?.[0]===transferSig)??[];
    const matches=(token,from,to,amount)=>transfers.filter(l=>low(l.address)===low(token)&&low(l.topics[1]).endsWith(low(from).slice(2))&&low(l.topics[2]).endsWith(low(to).slice(2))&&BigInt(l.data)===amount).length;
    add('atomic_sell_transfer',1,matches(b.tokens.tokenA,b.exchange,b.assets.taker.address,x));
    add('atomic_buy_transfer',1,matches(b.tokens.tokenB,b.assets.taker.address,b.assets.maker.address,y));
    add('fill_before_deadline',true,!!fill[0]?.blockTimestamp&&BigInt(fill[0].blockTimestamp)<BigInt(o.deadline));
    const gm=spec.agents[0].goal,gt=spec.agents[1].goal;
    const maker=x===units(gm.sellAmount)&&y>=units(gm.minBuy),taker=x>=units(gt.minReceive)&&y<=units(gt.maxPay);
    result.agent_goal_results={maker:maker?'success':'failure',taker:taker?'success':'failure'};
    add('maker_goal',true,maker);add('taker_goal',true,taker);
  }else if(e.rejected&&!o){
    add('no_payment_on_rejection',0,successful.length);result.agent_goal_results={maker:'no_deal',taker:'no_deal'};
  }
  const invariants=assertions.every(v=>v.passed);
  const expected=spec.expectedOutcome==='filled'?filled:e.rejected&&!o;
  result.status=invariants&&expected?'success':'failure';result.reason=!invariants?'Evidence or goal assertions failed':expected?'Expected business outcome verified':'Expected outcome not reached';
  return copy(result);
}
