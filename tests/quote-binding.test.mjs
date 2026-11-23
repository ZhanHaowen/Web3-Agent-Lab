import test from 'node:test';
import assert from 'node:assert/strict';
import {MessageBus,normalize,copy,hash} from '../src/scenario/core.mjs';
import {prepareProposal,validateAcceptance,assertQuoteIntegrity,bindQuoteAction,assertActionBinding} from '../src/scenario/quote-binding.mjs';

function fixture(){
  const spec=normalize(),events=[];let failType=null,failAt=0,attempts=0;
  const s={id:'execution-1',episodeId:'episode-1',spec,agents:spec.agents.map(a=>({agentId:a.agentId,spec:a,history:[]})),pending:[],
    realm:{epoch:'epoch-1',exchange:'0xEX',scope:'scope-1',contractCodeHash:'code-1',accounts:{maker:{address:'0xMAKER'},taker:{address:'0xTAKER'}}},
    before:{chainId:31337},registry:{chain:{env:()=>({contracts:{tokenA:'0xA',tokenB:'0xB'}}),publicClient:{getBlock:async()=>({timestamp:1000n})}},
      ids:async(_s,q)=>({id:'0x'+hash(q.salt),termsHash:'0x'+hash(q)})}};
  s.bus=new MessageBus(s,async(type,payload)=>{if(type===failType&&++attempts===failAt)throw Error('DISK_FAILURE');const e={eventId:'event-'+events.length,type,payload:copy(payload)};events.push(e);return e;});
  return {s,maker:s.agents[0],taker:s.agents[1],events,fail:(type,n=1)=>{failType=type;failAt=n;attempts=0;}};
}
const proposalArgs=(payload={sellAmount:'10',buyAmount:'20'})=>({recipient:'taker',kind:'quote',payload});
async function offered(f){f.s.quote=await prepareProposal(f.s,f.maker,proposalArgs());f.taker.history.push({kind:'quote',quoteId:f.s.quote.quoteId});return f.s.quote;}
function accept(f,payload){return {recipient:'maker',kind:'accept',quoteId:f.s.quote.quoteId,...(payload===undefined?{}:{payload})};}
function accepted(f){f.s.acceptance=validateAcceptance(f.s,f.taker,accept(f));f.s.accepted=f.s.quote.quoteId;return f.s.acceptance;}

test('proposal preparation creates exact domain-bound terms without mutating live state',async()=>{
  const f=fixture(),q=await prepareProposal(f.s,f.maker,proposalArgs({sellAmount:'10.000000',buyAmount:'20.0'}));
  assert.equal(f.s.quote,undefined);assert.equal(f.events.length,0);assert.equal(q.sellAmount,'10');assert.equal(q.buyAmount,'20');
  assert.equal(q.binding.sellAmountBase,'10000000');assert.equal(q.binding.buyAmountBase,'20000000');
  assert.equal(q.binding.exchange,'0xex');assert.equal(q.binding.executionId,f.s.id);assert.ok(q.termsHash);assert.ok(q.orderId);
  assert.ok(Object.isFrozen(q));assert.ok(Object.isFrozen(q.binding));f.s.quote=q;assert.equal(assertQuoteIntegrity(f.s),q);
});

test('unsupported quote parameters and invalid recipient fail before state or event changes',async()=>{
  const f=fixture();await offered(f);const q=f.s.quote;
  for(const field of ['token','spender','deadline','sellToken','buyAmountBase'])await assert.rejects(
    ()=>prepareProposal(f.s,f.maker,proposalArgs({sellAmount:'10',buyAmount:'20',[field]:'unexpected'})),/QUOTE_UNSUPPORTED_FIELDS/);
  await assert.rejects(()=>prepareProposal(f.s,f.maker,{...proposalArgs(),recipient:'maker'}),/MESSAGE_RECIPIENT/);
  assert.equal(f.s.quote,q);assert.equal(f.s.accepted,undefined);assert.equal(f.events.length,0);
});

test('accept payload cannot silently override economic terms; historical comments remain compatible',async()=>{
  const f=fixture();await offered(f);
  for(const field of ['sellAmount','buyAmount','amount','token','spender','deadline','orderId'])assert.throws(
    ()=>validateAcceptance(f.s,f.taker,accept(f,{[field]:'19'})),/ACCEPT_TERMS_OVERRIDE/);
  for(const payload of [undefined,{}, {reason:'within_private_goal'}, {note:'agreed'}, {accepted:true}]){
    const a=validateAcceptance(f.s,f.taker,accept(f,payload));assert.equal(a.termsHash,f.s.quote.termsHash);
    assert.equal(a.quote.buyAmount,'20');assert.ok(Object.isFrozen(a.quote.binding));
  }
  assert.equal(f.s.accepted,undefined);assert.equal(f.s.acceptance,undefined);assert.equal(f.events.length,0);
});

test('self-recipient, stale quote, unobserved quote and incorrect supplied hashes cannot accept',async()=>{
  const f=fixture();await offered(f);const args=accept(f);
  assert.throws(()=>validateAcceptance(f.s,f.taker,{...args,recipient:'taker'}),/MESSAGE_RECIPIENT/);
  assert.throws(()=>validateAcceptance(f.s,f.taker,{...args,quoteId:'stale'}),/ACCEPT_QUOTE/);
  assert.throws(()=>validateAcceptance(f.s,f.taker,{...args,termsHash:'wrong'}),/QUOTE_TERMS_MISMATCH/);
  assert.throws(()=>validateAcceptance(f.s,f.taker,accept(f,{termsHash:'wrong'})),/QUOTE_TERMS_MISMATCH/);
  f.taker.history=[];assert.throws(()=>validateAcceptance(f.s,f.taker,args),/QUOTE_NOT_OBSERVED/);
  assert.equal(f.s.acceptance,undefined);assert.equal(f.s.accepted,undefined);
});

test('accepted proposal is frozen, repeated valid accept is idempotent and cannot be requoted',async()=>{
  const f=fixture();await offered(f);const a=accepted(f);
  assert.equal(validateAcceptance(f.s,f.taker,accept(f)).acceptanceId,a.acceptanceId);
  await assert.rejects(()=>prepareProposal(f.s,f.maker,proposalArgs()),/QUOTE_ALREADY_ACCEPTED/);
  assert.equal(f.s.acceptance,a);assert.equal(assertQuoteIntegrity(f.s),f.s.quote);
});

test('reloaded quote or acceptance corruption and environment drift are rejected',async()=>{
  for(const mutate of [s=>{s.quote.buyAmount='19';},s=>{s.acceptance.quote.buyAmount='19';},s=>{s.acceptance.binding.taker='0xother';}]){
    const f=fixture();await offered(f);accepted(f);f.s.quote=copy(f.s.quote);f.s.acceptance=copy(f.s.acceptance);mutate(f.s);
    assert.throws(()=>assertQuoteIntegrity(f.s),/INTEGRITY_MISMATCH|ACCEPTED_QUOTE_CHANGED/);
  }
  const f=fixture();await offered(f);accepted(f);f.s.realm.epoch='replacement-chain';
  assert.throws(()=>assertQuoteIntegrity(f.s),/QUOTE_ENVIRONMENT_MISMATCH/);
});

test('economic decisions queued before acceptance cannot be replayed under later acceptance',async()=>{
  const f=fixture();await offered(f);const before=bindQuoteAction(f.s,{name:'create_order',args:{}});accepted(f);
  assert.equal(bindQuoteAction(f.s,before),before);
  assert.throws(()=>assertActionBinding(f.s,before),/STALE_QUOTE_ACTION/);
  const current=bindQuoteAction(f.s,{name:'create_order',args:{}});assert.doesNotThrow(()=>assertActionBinding(f.s,current));
  assert.throws(()=>assertActionBinding(f.s,{...current,quoteBinding:{...current.quoteBinding,version:0}}),/STALE_QUOTE_ACTION/);
  assert.throws(()=>assertActionBinding(f.s,{name:'fill_order',args:{}}),/STALE_QUOTE_ACTION/);
  assert.doesNotThrow(()=>assertActionBinding(f.s,{name:'wait',args:{}}));
});

test('message prevalidation refuses oversized and exhausted messages without emissions',()=>{
  const f=fixture();assert.throws(()=>f.s.bus.validate(f.maker,proposalArgs({note:'x'.repeat(17000)})),/MESSAGE_TOO_LARGE/);
  f.s.bus.outbox.length=f.s.spec.maxMessages;assert.throws(()=>f.s.bus.validate(f.maker,proposalArgs()),/MESSAGE_BUDGET/);
  assert.equal(f.events.length,0);
});

test('failed durable delivery does not expose a message and can be retried with same ID',async()=>{
  const f=fixture();f.fail('message.delivered');await assert.rejects(()=>f.s.bus.send(f.maker,proposalArgs()),/DISK_FAILURE/);
  const m=f.s.bus.outbox[0];assert.ok(m);assert.equal(f.s.bus.inboxes.get('taker').length,0);assert.equal(f.s.bus.delivered.size,0);
  f.fail(null);assert.equal(await f.s.bus.deliver(m),true);assert.equal((await f.s.bus.receive(f.taker))[0].messageId,m.messageId);
  assert.equal(f.events.filter(e=>e.type==='message.sent').length,1);
});

test('partial durable receive failure preserves all messages and avoids repeated consumption events',async()=>{
  const f=fixture();await f.s.bus.send(f.maker,proposalArgs());await f.s.bus.send(f.maker,proposalArgs());
  f.fail('message.consumed',2);await assert.rejects(()=>f.s.bus.receive(f.taker),/DISK_FAILURE/);
  assert.equal(f.s.bus.inboxes.get('taker').length,2);assert.equal(f.s.bus.consumed.size,0);
  f.fail(null);const received=await f.s.bus.receive(f.taker);assert.equal(received.length,2);
  assert.equal(new Set(received.map(m=>m.consumedEventId)).size,2);assert.equal(f.events.filter(e=>e.type==='message.consumed').length,2);
  assert.deepEqual(await f.s.bus.receive(f.taker),[]);
});

test('duplicate accepted quote remains idempotent when no message budget remains',async()=>{
  const f=fixture();await offered(f);const a=accepted(f);f.s.bus.outbox.length=f.s.spec.maxMessages;
  assert.equal(validateAcceptance(f.s,f.taker,accept(f)).acceptanceId,a.acceptanceId);
  assert.throws(()=>validateAcceptance(f.s,f.taker,{...accept(f),recipient:'taker'}),/MESSAGE_RECIPIENT/);
  assert.throws(()=>validateAcceptance(f.s,f.taker,accept(f,{buyAmount:'19'})),/ACCEPT_TERMS_OVERRIDE/);
});

test('stable request IDs deduplicate concurrent sends and retries without consuming budget',async()=>{
  const f=fixture();f.s.spec.maxMessages=1;const args={...proposalArgs(),requestId:'decision-1'};
  const [first,second]=await Promise.all([f.s.bus.send(f.maker,args),f.s.bus.send(f.maker,args)]);
  assert.equal(first.messageId,second.messageId);assert.equal(f.s.bus.outbox.length,1);
  assert.equal(f.events.filter(e=>e.type==='message.sent').length,1);assert.equal(f.events.filter(e=>e.type==='message.delivered').length,1);
  await f.s.bus.receive(f.taker);assert.equal((await f.s.bus.send(f.maker,args)).messageId,first.messageId);assert.deepEqual(await f.s.bus.receive(f.taker),[]);
  await assert.rejects(()=>f.s.bus.send(f.maker,{...args,requestId:'decision-2'}),/MESSAGE_BUDGET/);
});

test('reusing a request ID with different terms, kind or destination is rejected',async()=>{
  const f=fixture(),args={...proposalArgs(),requestId:'decision-1'};await f.s.bus.send(f.maker,args);
  await assert.rejects(()=>f.s.bus.send(f.maker,{...args,payload:{sellAmount:'10',buyAmount:'21'}}),/MESSAGE_REQUEST_ID_CONFLICT/);
  await assert.rejects(()=>f.s.bus.send(f.maker,{...args,kind:'reject'}),/MESSAGE_REQUEST_ID_CONFLICT/);
  await assert.rejects(()=>f.s.bus.send(f.maker,{...args,quoteId:'other'}),/MESSAGE_REQUEST_ID_CONFLICT/);
  assert.equal(f.s.bus.outbox.length,1);
});

test('retry resumes durable failed delivery under the same request and message IDs',async()=>{
  const f=fixture();f.s.spec.maxMessages=1;const args={...proposalArgs(),requestId:'decision-1'};f.fail('message.delivered');
  await assert.rejects(()=>f.s.bus.send(f.maker,args),/DISK_FAILURE/);const original=f.s.bus.outbox[0];f.fail(null);
  const retried=await f.s.bus.send(f.maker,args);assert.equal(retried.messageId,original.messageId);
  assert.equal(f.events.filter(e=>e.type==='message.sent').length,1);assert.equal((await f.s.bus.receive(f.taker)).length,1);
});

test('proposal recovery reuses durable quote instead of minting a new salt or version',async()=>{
  const f=fixture(),args={...proposalArgs(),requestId:'quote-decision-1'},q=await prepareProposal(f.s,f.maker,args);
  await f.s.bus.send(f.maker,{...args,quoteId:q.quoteId,payload:q});f.s.spec.maxMessages=1;
  const recovered=await prepareProposal(f.s,f.maker,args);assert.deepEqual(recovered,q);assert.equal(f.s.quote,undefined);
  await assert.rejects(()=>prepareProposal(f.s,f.maker,{...args,payload:{sellAmount:'10',buyAmount:'21'}}),/MESSAGE_REQUEST_ID_CONFLICT/);
  f.s.quote=recovered;assert.deepEqual(await prepareProposal(f.s,f.maker,args),q);
});

test('restored delivered outbox does not invent another delivered event on replay',async()=>{
  const f=fixture(),args={...proposalArgs(),requestId:'decision-1'};await f.s.bus.send(f.maker,args);
  const restored=fixture();restored.s.bus.outbox=copy(f.s.bus.outbox);const prior=restored.s.bus.outbox[0];prior.consumedBy='already-consumed-command';
  const m=await restored.s.bus.send(restored.maker,args);assert.equal(m.messageId,prior.messageId);
  assert.equal(restored.events.length,0);assert.deepEqual(await restored.s.bus.receive(restored.taker),[]);
});
