import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {LabControl} from '../src/control/control.mjs';
import {RemoteScene} from '../src/control/scene.mjs';
import {ControlStore} from '../src/control/store.mjs';
import {AgentRuntime} from '../src/scenario/agent-runtime.mjs';
import {MessageBus,normalize,copy,hash} from '../src/scenario/core.mjs';
import {validateAcceptance} from '../src/scenario/quote-binding.mjs';
import {transactionError} from '../src/scenario/peer-lifecycle.mjs';

async function fixture(t){
  const folder=await mkdtemp(join(tmpdir(),'lab-quote-atomicity-')),control=Object.create(LabControl.prototype);
  let store=new ControlStore(folder);
  t.after(async()=>{store.close();const safe=resolve(folder);assert.ok(safe.startsWith(resolve(tmpdir())+sep)&&basename(safe).startsWith('lab-quote-atomicity-'));await rm(safe,{recursive:true,force:true});});
  const s=Object.create(RemoteScene.prototype),spec=normalize(),realm={epoch:'chain-1',scope:'scope',exchange:'0xexchange',contractCodeHash:'codehash',accounts:{maker:{address:'0xmaker'},taker:{address:'0xtaker'}}};
  const b={data:folder,clean:copy},registry={chain:{env:()=>({chainInstanceId:realm.epoch,contracts:{tokenA:'0xa',tokenB:'0xb'}}),publicClient:{getBlock:async()=>({timestamp:1000n})}},
    ids:async(_s,q)=>({id:'0x'+hash(q.salt),termsHash:'0x'+hash(q)})};
  Object.assign(control,{store,b,current:'execution',archiving:new Map(),fault(){}});
  const agents=spec.agents.map(a=>new AgentRuntime(a));agents.forEach(a=>{a.address=realm.accounts[a.role].address;a.activeCommand=a.role==='maker'?'quote-command':'accept-command';});
  Object.assign(s,{control,registry,service:{b,current:'execution'},spec,realm,agents,id:'execution',episodeId:'execution',jobId:'job',
    execution:{id:'execution',jobId:'job',state:'running',funds:'none',business:'pending',sealed:false},
    bindings:Object.fromEntries(agents.map(a=>[a.role,{agentId:'profile-'+a.role,epoch:1}])),
    before:{chainId:31337},state:'running',steps:1,cursor:0,transactions:[],pending:[],orders:[],events:[],files:{},
    pausedAgents:new Set(),abort:new AbortController(),emitQueue:Promise.resolve(),queue:Promise.resolve(),folder:join(folder,'runs','execution')});
  s.bus=new MessageBus(s,s.emit.bind(s));control.persist(s);
  const maker=agents[0],taker=agents[1];
  await s.tool(maker,{name:'send_message',args:{recipient:'taker',kind:'quote',payload:{sellAmount:'10',buyAmount:'20'}}});
  taker.history.push(copy(s.bus.outbox[0]));control.persist(s);
  const acceptCall={name:'send_message',providerToolCallId:'accept-tool',args:{recipient:'maker',kind:'accept',quoteId:s.quote.quoteId,payload:{reason:'within_private_goal'}}};
  return {s,control,maker,taker,acceptCall,acceptance:()=>validateAcceptance(s,taker,acceptCall.args),
    reopen(){store.close();store=new ControlStore(folder);control.store=store;return store;}};
}

// This failure occurs on the second execution write, after the quote event and its
// in-memory references have been produced, exercising the real SQLite rollback.
function failAcceptanceCommit(store){store.db.exec(`CREATE TRIGGER reject_acceptance_snapshot BEFORE UPDATE ON executions
  WHEN json_extract(NEW.data,'$.scene.acceptanceEventId') IS NOT NULL
  BEGIN SELECT RAISE(ABORT,'FORCED_ACCEPTANCE_SQLITE_FAILURE'); END;`);}

test('failed SQLite acceptance transaction restores event arrays, payloads, IDs and execution snapshot',async t=>{
  const f=await fixture(t),s=f.s,prior={events:copy(s.events),files:copy(s.files),execution:copy(s.execution),quoteEventId:s.quoteEventId,
    acceptanceEventId:s.acceptanceEventId,db:f.control.store.get('executions',s.id),dbEvents:f.control.store.events(s.id)};
  const a=f.acceptance();failAcceptanceCommit(f.control.store);
  await assert.rejects(()=>s.commitQuoteState({acceptance:a,accepted:a.quoteId},'quote.accepted',{acceptance:a},f.taker,[s.quoteEventId]),/FORCED_ACCEPTANCE_SQLITE_FAILURE/);
  assert.equal(s.acceptance,undefined);assert.equal(s.accepted,null);assert.equal(s.quoteEventId,prior.quoteEventId);assert.equal(s.acceptanceEventId,prior.acceptanceEventId);
  assert.deepEqual(s.events,prior.events);assert.deepEqual(s.files,prior.files);assert.deepEqual(s.execution,prior.execution);assert.ok(s.recordingFailure);
  assert.deepEqual(f.control.store.get('executions',s.id),prior.db);assert.deepEqual(f.control.store.events(s.id),prior.dbEvents);
  const reopened=f.reopen();assert.deepEqual(reopened.get('executions',s.id),prior.db);assert.deepEqual(reopened.events(s.id),prior.dbEvents);
});

test('committed acceptance survives export failure and error feedback distinguishes it from rejection',async t=>{
  const f=await fixture(t),s=f.s,a=f.acceptance();f.control.archive=async()=>{throw Error('EXPORT_DISK_UNAVAILABLE');};let failure;
  try{await s.commitQuoteState({acceptance:a,accepted:a.quoteId},'quote.accepted',{acceptance:a},f.taker,[s.quoteEventId]);}catch(error){failure=error;}
  assert.ok(failure);assert.equal(failure.quoteCommitStatus.state,'recorded_export_pending');assert.equal(failure.quoteCommitStatus.acceptanceId,a.acceptanceId);
  assert.equal(s.acceptance.acceptanceId,a.acceptanceId);assert.equal(s.accepted,a.quoteId);assert.ok(s.recordingFailure);
  const feedback=transactionError(s,f.acceptCall,failure);assert.equal(feedback.quoteCommitStatus.state,'recorded_export_pending');assert.equal(feedback.recoverable,false);
  assert.match(feedback.instruction,/durable.*export is pending/);assert.doesNotMatch(feedback.instruction,/action was rejected/);
  const reopened=f.reopen(),saved=reopened.get('executions',s.id);
  assert.equal(saved.scene.acceptance.acceptanceId,a.acceptanceId);assert.equal(saved.scene.accepted,a.quoteId);
  assert.equal(reopened.events(s.id).filter(r=>r.event.type==='quote.accepted').length,1);
});

test('retry after acceptance commit failure reuses the durable message and quote even at the message limit',async t=>{
  const f=await fixture(t),s=f.s,originalQuote=copy(s.quote);s.spec.maxMessages=2;failAcceptanceCommit(f.control.store);
  await assert.rejects(()=>s.tool(f.taker,copy(f.acceptCall)),/FORCED_ACCEPTANCE_SQLITE_FAILURE/);
  const originalMessage=s.bus.outbox.find(m=>m.kind==='accept');assert.ok(originalMessage);assert.equal(s.bus.outbox.length,2);
  assert.equal(s.acceptance,undefined);assert.equal(s.accepted,null);assert.equal(f.control.store.events(s.id).filter(r=>r.event.type==='quote.accepted').length,0);
  // Model an operator repairing the storage failure; the persisted request is replayed.
  f.control.store.db.exec('DROP TRIGGER reject_acceptance_snapshot');s.recordingFailure=null;
  const retried=await s.tool(f.taker,copy(f.acceptCall));assert.equal(retried.messageId,originalMessage.messageId);assert.deepEqual(s.quote,originalQuote);
  const acceptanceId=s.acceptance.acceptanceId,duplicate=await s.tool(f.taker,copy(f.acceptCall));assert.equal(duplicate.duplicate,true);assert.equal(duplicate.acceptanceId,acceptanceId);
  assert.equal(s.bus.outbox.filter(m=>m.kind==='accept').length,1);assert.equal(s.bus.outbox.length,2);
  const records=f.control.store.events(s.id);assert.equal(records.filter(r=>r.event.type==='message.sent'&&JSON.parse(r.text).kind==='accept').length,1);
  assert.equal(records.filter(r=>r.event.type==='quote.accepted').length,1);assert.equal(f.control.store.list('messages').filter(m=>m.kind==='accept').length,1);
  const reopened=f.reopen();assert.equal(reopened.get('executions',s.id).scene.acceptance.acceptanceId,acceptanceId);assert.equal(reopened.list('messages').filter(m=>m.kind==='accept').length,1);
});
