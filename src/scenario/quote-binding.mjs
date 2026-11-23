import {randomUUID} from 'node:crypto';
import {checkQuote,copy,hash,units} from './core.mjs';

const lower=v=>String(v).toLowerCase();
const economicActions=new Set(['approve_sell','approve_buy','create_order','inspect_order','fill_order','cancel_order','expire_order']);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const fail=(code,detail={})=>{throw Object.assign(Error(code),{code,detail});};
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const quoteDigest=q=>hash({quoteId:q.quoteId,version:q.version,proposer:q.proposer,sellAmount:q.sellAmount,buyAmount:q.buyAmount,
  deadline:q.deadline,salt:q.salt,termsHash:q.termsHash,orderId:q.orderId,binding:q.binding});
const acceptanceDigest=a=>hash({acceptanceId:a.acceptanceId,quoteId:a.quoteId,quoteVersion:a.quoteVersion,
  termsHash:a.termsHash,acceptedBy:a.acceptedBy,binding:a.binding,quoteIntegrityHash:a.quoteIntegrityHash,quote:a.quote});

/** Offline integrity verification. A digest is evidence consistency, not a party's cryptographic signature. */
export function verifyAcceptanceSnapshot(acceptance,quote=acceptance?.quote){
  const a=acceptance,q=quote;
  if(!a?.integrityHash||acceptanceDigest(a)!==a.integrityHash)fail('ACCEPTANCE_INTEGRITY_MISMATCH');
  if(!q?.binding||!q.integrityHash||quoteDigest(q)!==q.integrityHash)fail('QUOTE_INTEGRITY_MISMATCH');
  if(a.quoteId!==q.quoteId||a.quoteVersion!==q.version||a.termsHash!==q.termsHash||a.quoteIntegrityHash!==q.integrityHash||
    hash(a.binding)!==hash(q.binding)||a.quote?.integrityHash!==q.integrityHash||quoteDigest(a.quote)!==q.integrityHash)
    fail('ACCEPTED_QUOTE_CHANGED');
  if(a.binding.sellAmountBase!==String(units(q.sellAmount))||a.binding.buyAmountBase!==String(units(q.buyAmount))||
    a.binding.sellDecimals!==6||a.binding.buyDecimals!==6||a.binding.deadline!==q.deadline||a.binding.salt!==q.salt)
    fail('ACCEPTED_QUOTE_UNITS_MISMATCH');
  if(!['maker','taker'].includes(q.proposer)||!['maker','taker'].includes(a.acceptedBy)||q.proposer===a.acceptedBy)
    fail('ACCEPTANCE_ACTOR_MISMATCH');
  return true;
}

function bindingFor(s,q){
  const r=s.realm,c=s.registry.chain.env().contracts;
  return {executionId:s.id,chainId:s.before?.chainId??31337,chainInstanceId:r.epoch,exchange:lower(r.exchange),
    sessionScope:r.scope,contractCodeHash:r.contractCodeHash,maker:lower(r.accounts.maker.address),taker:lower(r.accounts.taker.address),
    sellToken:lower(c.tokenA),buyToken:lower(c.tokenB),sellAmountBase:String(units(q.sellAmount)),buyAmountBase:String(units(q.buyAmount)),
    sellDecimals:6,buyDecimals:6,deadline:q.deadline,salt:q.salt};
}

/** Prepare a complete proposal without mutating the live scenario or sending a message. */
export async function prepareProposal(s,actor,args){
  const recorded=s.bus.findRequest(actor,args?.requestId);
  s.bus.validate(actor,args,{checkBudget:!recorded});
  if(args.kind!=='quote')fail('QUOTE_MESSAGE_REQUIRED');
  if(s.accepted||s.acceptance)fail('QUOTE_ALREADY_ACCEPTED');
  if(s.orderId||s.proposedOrderId||s.pending?.length)fail('QUOTE_AFTER_ORDER_INTENT');
  if(!object(args.payload))fail('QUOTE_PAYLOAD_OBJECT');
  const extra=Object.keys(args.payload).filter(k=>!['sellAmount','buyAmount'].includes(k));
  if(extra.length)fail('QUOTE_UNSUPPORTED_FIELDS',{fields:extra});
  const terms=checkQuote(actor.spec,args.payload);
  if(recorded){
    const q=recorded.payload;
    if(recorded.kind!=='quote'||recorded.recipientAgentId!==args.recipient||(recorded.replyTo??null)!==(args.replyTo??null)||
      q.sellAmount!==terms.sellAmount||q.buyAmount!==terms.buyAmount)fail('MESSAGE_REQUEST_ID_CONFLICT');
    assertQuoteIntegrity({...s,quote:q},null);
    if(s.quote?.quoteId!==q.quoteId&&q.version!==(s.quote?.version??0)+1)fail('STALE_QUOTE_REQUEST');
    return freeze(copy(q));
  }
  const previousQuote=s.quote?.quoteId??null,block=await s.registry.chain.publicClient.getBlock();
  const proposal={...terms,proposer:actor.agentId,quoteId:randomUUID(),version:(s.quote?.version??0)+1,
    salt:'0x'+hash(randomUUID()),deadline:String(block.timestamp+BigInt(s.spec.ttl))};
  const ids=await s.registry.ids(s,proposal);proposal.termsHash=ids.termsHash;proposal.orderId=ids.id;
  proposal.binding=bindingFor(s,proposal);proposal.integrityHash=quoteDigest(proposal);
  if(s.accepted||s.acceptance||s.orderId||s.proposedOrderId||s.pending?.length||(s.quote?.quoteId??null)!==previousQuote)fail('QUOTE_STATE_CHANGED');
  s.bus.validate(actor,{...args,quoteId:proposal.quoteId,payload:proposal});
  return freeze(proposal);
}

/** Validate the proposal and (when supplied) its durable accepted snapshot. No RPC or mutation. */
export function assertQuoteIntegrity(s,acceptance=s.acceptance){
  const q=s.quote;
  if(!q?.binding||!q.integrityHash||quoteDigest(q)!==q.integrityHash)fail('QUOTE_INTEGRITY_MISMATCH');
  const epoch=s.registry.chain.env().chainInstanceId;if(epoch!==undefined&&epoch!==s.realm.epoch)fail('QUOTE_ENVIRONMENT_MISMATCH');
  if(hash(bindingFor(s,q))!==hash(q.binding))fail('QUOTE_ENVIRONMENT_MISMATCH');
  if(acceptance)verifyAcceptanceSnapshot(acceptance,q);
  return q;
}

/** Acceptance is a reference, never a second proposal. Historical comments remain readable. */
export function validateAcceptance(s,actor,args){
  s.bus.validate(actor,args,{checkBudget:false});
  if(args.kind!=='accept')fail('ACCEPT_MESSAGE_REQUIRED');
  const payload=args.payload??{};
  if(!object(payload))fail('ACCEPT_PAYLOAD_OBJECT');
  const extra=Object.keys(payload).filter(k=>!['reason','note','accepted','termsHash'].includes(k));
  if(extra.length)fail('ACCEPT_TERMS_OVERRIDE',{fields:extra});
  if(['reason','note'].some(k=>payload[k]!==undefined&&typeof payload[k]!=='string')||
    payload.accepted!==undefined&&payload.accepted!==true)fail('ACCEPT_PAYLOAD_TYPE');
  const q=s.quote;
  if(!q||actor.agentId===q.proposer||args.quoteId!==q.quoteId)fail('ACCEPT_QUOTE');
  if(!actor.history.some(m=>m.kind==='quote'&&m.quoteId===q.quoteId))fail('QUOTE_NOT_OBSERVED');
  assertQuoteIntegrity(s);
  for(const supplied of [args.termsHash,payload.termsHash].filter(v=>v!==undefined))if(supplied!==q.termsHash)fail('QUOTE_TERMS_MISMATCH');
  checkQuote(actor.spec,q);
  if(s.acceptance){if(s.acceptance.acceptedBy!==actor.agentId)fail('ACCEPTANCE_ACTOR_MISMATCH');return freeze(copy(s.acceptance));}
  const acceptance={acceptanceId:randomUUID(),quoteId:q.quoteId,quoteVersion:q.version,termsHash:q.termsHash,
    acceptedBy:actor.agentId,binding:copy(q.binding),quoteIntegrityHash:q.integrityHash,quote:copy(q)};
  acceptance.integrityHash=acceptanceDigest(acceptance);return freeze(acceptance);
}

/** Attach this at decision creation, not after a stale queued call is dequeued. */
export function bindQuoteAction(s,call){
  if(!economicActions.has(call.name)||Object.hasOwn(call,'quoteBinding'))return call;
  const q=s.quote,a=s.acceptance;
  return {...call,quoteBinding:q?{quoteId:q.quoteId,version:q.version,termsHash:q.termsHash,
    acceptanceId:a?.acceptanceId??null}:null};
}

export function assertActionBinding(s,call){
  if(!economicActions.has(call.name))return;
  if(!s.acceptance||s.accepted!==s.acceptance.quoteId)fail('MUTUAL_ACCEPTANCE_REQUIRED');
  const q=assertQuoteIntegrity(s),b=call.quoteBinding;
  if(!b||b.quoteId!==q.quoteId||b.version!==q.version||b.termsHash!==q.termsHash||b.acceptanceId!==s.acceptance.acceptanceId)
    fail('STALE_QUOTE_ACTION',{action:call.name,expectedQuoteId:q.quoteId,actualQuoteId:b?.quoteId??null});
}
