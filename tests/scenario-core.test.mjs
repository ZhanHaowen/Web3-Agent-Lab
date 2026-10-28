import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,units,decimal,checkQuote,MessageBus} from '../src/scenario/core.mjs';
import {AgentRuntime,definitions} from '../src/scenario/agent-runtime.mjs';
import {checkEvidence} from '../src/scenario/checker.mjs';
import {Scenario} from '../src/scenario/service.mjs';
test('human token units convert once and never accept floating/scientific values',()=>{
  assert.equal(units('20'),20000000n);assert.equal(units('23.125456'),23125456n);assert.equal(decimal(10000000n),'10');
  for(const v of ['1e6','-1','0.0000001','0',20])assert.throws(()=>units(v));
});
test('role goals use exact integer comparisons and remain separate',()=>{
  const s=normalize();assert.doesNotThrow(()=>checkQuote(s.agents[0],{sellAmount:'10',buyAmount:'20'}));
  assert.throws(()=>checkQuote(s.agents[1],{sellAmount:'10',buyAmount:'21'}));
  assert.throws(()=>checkQuote(s.agents[0],{sellAmount:'10',buyAmount:'19'}));
  s.agents[1].goal.maxPay='19';assert.equal(s.agents[0].goal.minBuy,'20');
});
test('tool sets and provider IDs are namespaced per runtime',()=>{
  const s=normalize(),a=new AgentRuntime(s.agents[0]),b=new AgentRuntime(s.agents[1]);
  assert.notEqual(a.agentRunId,b.agentRunId);a.ownToolIds.add('call_same');assert.equal(b.ownToolIds.has('call_same'),false);
  assert.equal(a.spec.tools.includes('fill_order'),false);assert.equal(b.spec.tools.includes('create_order'),false);
});
test('message actor comes from runtime; duplicate delivery and consumption are idempotent',async()=>{
  const events=[],s={id:'scene',episodeId:'ep',spec:normalize()};
  const emit=async(type,payload,actor,causes)=>{const e={eventId:String(events.length),type,payload,actor,causes};events.push(e);return e;};
  const bus=new MessageBus(s,emit),a={agentId:'maker'},b={agentId:'taker'};
  const m=await bus.send(a,{recipient:'taker',kind:'quote',senderAgentId:'taker',payload:{sellAmount:'10',buyAmount:'20'}});
  assert.equal(m.senderAgentId,'maker');assert.equal(await bus.deliver(m),false);
  assert.equal((await bus.receive(b)).length,1);assert.equal((await bus.receive(b)).length,0);
  await assert.rejects(()=>bus.deliver({...m,episodeId:'old'}));assert.ok(events.some(e=>e.type==='message.duplicate'));
});
test('no acceptable quote is a business result with explicit expected outcome',()=>{
  const spec=normalize({expectedOutcome:'no_deal'}),b={chainInstanceId:'x',sessionScope:'y',exchange:'z',supply:{A:'100',B:'100'},assets:{maker:{A:'100',B:'0'},taker:{A:'0',B:'100'}},escrow:{A:'0',B:'0'}};
  const r=checkEvidence({spec,before:b,after:structuredClone(b),transactions:[],rejected:true});
  assert.equal(r.status,'success');assert.equal(r.business_outcome,'no_deal');assert.equal(r.settlement_status,'none');
});
test('remote HTTP models and unsupported scene parameters fail closed',()=>{
  assert.throws(()=>normalize({mode:'llm',agents:[{model:{baseUrl:'http://remote.invalid/v1',model:'test'}},{model:{baseUrl:'http://127.0.0.1/v1',model:'test'}}]}));
  assert.throws(()=>normalize({template:'x402_api'}));assert.throws(()=>normalize({ttl:1}));
});
test('model cannot select signer identity or invoke another role settlement tool',async()=>{
  const s=new Scenario({b:{data:process.cwd()}},{}),[maker,taker]=s.agents;
  s.emit=async()=>({eventId:'test-event'});
  await assert.rejects(()=>s.tool(maker,{name:'fill_order',args:{}}),/TOOL_NOT_ALLOWED/);
  await assert.rejects(()=>s.tool(taker,{name:'create_order',args:{}}),/TOOL_NOT_ALLOWED/);
  await assert.rejects(()=>s.tool(maker,{name:'approve_sell',args:{agentId:'taker'}}),/TOOL_ADDITIONAL_PROPERTIES/);
  const spec=normalize({agents:[{agentId:'taker',walletId:'taker'},{}]});assert.equal(spec.agents[0].agentId,'maker');assert.equal(spec.agents[0].walletId,'maker');
});
test('empty message bodies are optional; quotes still require explicit amounts',async()=>{
  const s=new Scenario({b:{data:process.cwd()}},{}),[maker]=s.agents;s.emit=async()=>({eventId:'test-event'});
  const def=definitions(maker.spec).find(d=>d.function.name==='send_message');assert.deepEqual(def.function.parameters.required,['recipient','kind']);
  await assert.rejects(()=>s.tool(maker,{name:'send_message',args:{recipient:'taker',kind:'quote',payload:{sellAmount:'10'}}}),/quote.payload.buyAmount/);
  await assert.rejects(()=>s.tool(maker,{name:'send_message',args:{recipient:'taker',kind:'accept'}}),/accept.quoteId/);
  await assert.rejects(()=>s.tool(maker,{name:'send_message',args:{kind:'inquiry'}}),/TOOL_MISSING_ARGUMENT: recipient/);
});
test('phase guidance does not authorize a premature order or disclose the peer private goal',()=>{
  const s=new Scenario({b:{data:process.cwd()}},{}),[maker,taker]=s.agents;
  assert.equal(s.progress(maker).allowedActions.includes('create_order'),false);
  s.quote={quoteId:'q',proposer:'maker',sellAmount:'10',buyAmount:'20'};
  assert.equal(s.progress(taker).quote,null);taker.history.push({kind:'quote',quoteId:'q'});assert.equal(s.progress(taker).quote.quoteId,'q');
  s.accepted='q';assert.equal(s.progress(maker).allowedActions.includes('create_order'),true);
  assert.equal(JSON.stringify(s.progress(maker)).includes('maxPay'),false);
});
test('elapsed time uses monotonic duration and freezes at completion',()=>{
  const s=new Scenario({b:{data:process.cwd()}},{});assert.equal(s.elapsedMs(),0);s.startedMono=performance.now()-100;
  assert.ok(s.elapsedMs()>=100);s.durationMs=125;assert.equal(s.elapsedMs(),125);
});
