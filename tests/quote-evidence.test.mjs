import test from 'node:test';
import assert from 'node:assert/strict';
import {MessageBus,normalize,copy,hash} from '../src/scenario/core.mjs';
import {prepareProposal,validateAcceptance,verifyAcceptanceSnapshot} from '../src/scenario/quote-binding.mjs';
import {checkEvidence} from '../src/scenario/checker.mjs';
import {deriveGraph} from '../src/scenario/graph.mjs';
const addr=n=>'0x'+n.toString(16).padStart(40,'0'),topic=a=>'0x'+a.slice(2).padStart(64,'0'),data=n=>'0x'+BigInt(n).toString(16).padStart(64,'0');
const transfer='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',approval='0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
async function evidence({withApprovals=true}={}){
  const spec=normalize(),maker=addr(1),taker=addr(2),exchange=addr(3),tokenA=addr(4),tokenB=addr(5),scope='scope',epoch='epoch';
  const s={id:'execution',episodeId:'episode',spec,agents:spec.agents.map(a=>({agentId:a.agentId,spec:a,history:[]})),pending:[],before:{chainId:31337},
    realm:{epoch,scope,exchange,contractCodeHash:'codehash',accounts:{maker:{address:maker},taker:{address:taker}}},
    registry:{chain:{env:()=>({chainInstanceId:epoch,contracts:{tokenA,tokenB}}),publicClient:{getBlock:async()=>({timestamp:1000n})}},
      ids:async(_s,q)=>({id:'0x'+hash(q.salt),termsHash:'0x'+hash(q)})}};
  s.bus=new MessageBus(s,async()=>({eventId:'unused'}));s.quote=await prepareProposal(s,s.agents[0],{kind:'quote',recipient:'taker',payload:{sellAmount:'10',buyAmount:'20'}});
  s.agents[1].history.push({kind:'quote',quoteId:s.quote.quoteId});s.acceptance=validateAcceptance(s,s.agents[1],{kind:'accept',recipient:'maker',quoteId:s.quote.quoteId});s.accepted=s.quote.quoteId;
  const q=s.quote,a=s.acceptance,before={chainId:31337,chainInstanceId:epoch,sessionScope:scope,exchange,tokens:{tokenA,tokenB},supply:{A:'100000000',B:'100000000'},
    assets:{maker:{address:maker,A:'100000000',B:'0'},taker:{address:taker,A:'0',B:'100000000'}},escrow:{A:'0',B:'0'}},after=copy(before);
  Object.assign(after.assets.maker,{A:'90000000',B:'20000000'});Object.assign(after.assets.taker,{A:'10000000',B:'80000000'});
  const common={executionId:s.id,chainId:31337,acceptanceId:a.acceptanceId,quoteId:a.quoteId,quoteVersion:a.quoteVersion,termsHash:a.termsHash,value:'0',state:'confirmed'};
  const tx=(fn,from,to,args,logs=[])=>({...common,intentId:fn+from,hash:'0x'+hash(fn+from),from,to,functionName:fn,args,blockTimestamp:'1100',receipt:{from,to,status:'success',logs}});
  const transactions=[];
  if(withApprovals)for(const [from,to,amount]of [[maker,tokenA,'10000000'],[taker,tokenB,'20000000']])transactions.push(tx('approve',from,to,[exchange,amount],[{address:to,topics:[approval,topic(from),topic(exchange)],data:data(amount)}]));
  transactions.push(tx('createOrder',maker,exchange,[taker,tokenA,'10000000',tokenB,'20000000',q.deadline,q.salt,q.termsHash]));
  transactions.push(tx('fillOrder',taker,exchange,[q.orderId],[{address:tokenA,topics:[transfer,topic(exchange),topic(taker)],data:data(10000000)},
    {address:tokenB,topics:[transfer,topic(taker),topic(maker)],data:data(20000000)}]));
  return {s,e:{spec,before,after,quote:copy(q),acceptance:copy(a),quoteEventId:'proposal-event',acceptanceEventId:'acceptance-event',transactions,
    order:{maker,taker,sellToken:tokenA,buyToken:tokenB,sellAmount:'10000000',buyAmount:'20000000',deadline:q.deadline,salt:q.salt,termsHash:q.termsHash,state:2}}};
}

test('offline accepted terms check verifies all three economic steps and supports allowance reuse',async()=>{
  for(const withApprovals of [true,false]){const {e}=await evidence({withApprovals});const result=checkEvidence(e);
    assert.equal(result.status,'success',JSON.stringify(result.assertions.filter(a=>!a.passed)));assert.equal(result.accepted_terms_status,'verified');
    assert.equal(verifyAcceptanceSnapshot(e.acceptance,e.quote),true);}
});

test('checker rejects quote metadata, exact approval amount, create terms and fill target drift',async()=>{
  const cases=[e=>{e.transactions[0].acceptanceId='other';},e=>{e.transactions[0].args[1]='20000000';},
    e=>{e.transactions.find(t=>t.functionName==='createOrder').args[4]='19000000';},
    e=>{e.transactions.find(t=>t.functionName==='fillOrder').args[0]='other-order';},
    e=>{e.transactions.find(t=>t.functionName==='fillOrder').to=addr(9);},e=>{e.before.assets.taker.address=addr(8);}];
  for(const mutate of cases){const {e}=await evidence();mutate(e);const result=checkEvidence(e);assert.equal(result.status,'failure');assert.equal(result.accepted_terms_status,'failed');}
});

test('approval descriptor alone cannot disguise a receipt granting a different amount',async()=>{
  const {e}=await evidence();e.transactions[0].receipt.logs[0].data=data(999000000);const result=checkEvidence(e);
  assert.equal(result.status,'failure');assert.equal(result.assertions.find(a=>a.id.endsWith('approval_receipt')).passed,false);
});

test('missing event reference and corrupted acceptance snapshot fail independent checking',async()=>{
  for(const mutate of [e=>{delete e.acceptanceEventId;},e=>{delete e.quoteEventId;},e=>{e.acceptance.quote.buyAmount='99';},e=>{e.quote.buyAmount='invalid-number';}]){
    const {e}=await evidence();mutate(e);const result=checkEvidence(e);assert.equal(result.status,'failure');assert.equal(result.accepted_terms_status,'failed');}
});

test('pending transaction remains unresolved, while wrong acceptance references are still reported',async()=>{
  const {e}=await evidence();e.order.state=1;const t=e.transactions.at(-1);t.state='pending';delete t.receipt;
  let result=checkEvidence(e);assert.equal(result.status,'unknown');assert.equal(result.settlement_status,'pending');
  t.termsHash='wrong';result=checkEvidence(e);assert.equal(result.status,'failure');assert.equal(result.accepted_terms_status,'failed');assert.equal(result.settlement_status,'pending');
});

test('legacy successful settlement is preserved but cannot claim verified acceptance',async()=>{
  const {e}=await evidence();delete e.acceptance;delete e.quoteEventId;delete e.acceptanceEventId;
  const result=checkEvidence(e);assert.equal(result.status,'success');assert.equal(result.accepted_terms_status,'legacy_unverified');
});

function graphFixture(s,e,{legacy=false,mismatch=false}={}){
  const events=[],files={};function add(type,p,eventId){const path='raw/'+eventId+'.json';files[path]=JSON.stringify(p);events.push({eventId,type,agentId:'maker',agentRunId:'maker-run',causalEventIds:[],payloadRef:{path}});}
  if(!legacy){add('quote.proposed',{quote:e.quote},'proposal-event');add('quote.accepted',{acceptance:e.acceptance},'acceptance-event');}
  const t=copy(e.transactions[0]);if(legacy){delete t.acceptanceId;delete t.termsHash;}if(mismatch)t.termsHash='wrong';add('tx.intent',t,'intent-event');
  add('tx.broadcast',t,'broadcast-event');return deriveGraph(events,files,{...s,agents:[{agentId:'maker',agentRunId:'maker-run',address:e.before.assets.maker.address}]});
}
test('provenance graph relates explicit accepted quote to intent and transaction via source events',async()=>{
  const {s,e}=await evidence(),g=graphFixture(s,e);assert.equal(g.missingRelations.length,0);
  const a=g.nodes.find(n=>n.kind==='quote_acceptance');assert.equal(a.termsHash,e.acceptance.termsHash);
  assert.ok(g.edges.some(x=>x.from===a.id&&x.kind==='accepts_quote'&&x.eventRef==='acceptance-event'));
  assert.ok(g.edges.some(x=>x.from===a.id&&x.kind==='authorizes_intent'&&x.eventRef==='intent-event'));
  assert.ok(g.edges.some(x=>x.kind==='broadcast_as'));
});
test('legacy graph marks unavailable acceptance relations without fabricating authorization',async()=>{
  const {s,e}=await evidence(),g=graphFixture(s,e,{legacy:true});assert.equal(g.nodes.some(n=>n.kind==='quote_acceptance'),false);
  assert.equal(g.edges.some(x=>x.kind==='authorizes_intent'),false);assert.equal(g.missingRelations[0].reason,'legacy_acceptance_reference_missing');
});
test('mismatched acceptance hashes are represented as claims, never authorization edges',async()=>{
  const {s,e}=await evidence(),g=graphFixture(s,e,{mismatch:true});assert.equal(g.edges.some(x=>x.kind==='authorizes_intent'),false);
  assert.ok(g.edges.some(x=>x.kind==='claims_acceptance'));assert.equal(g.missingRelations[0].reason,'acceptance_terms_mismatch');
});
