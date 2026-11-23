import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {WalletRegistry} from '../src/scenario/wallet-registry.mjs';
import {RemoteRegistry} from '../src/control/gateway.mjs';
import {ControlStore} from '../src/control/store.mjs';
import {TransactionRecoveryCache,operationIdentity} from '../src/scenario/transaction-recovery.mjs';
import {copy,json} from '../src/scenario/core.mjs';

const sha=value=>'0x'+createHash('sha256').update(String(value)).digest('hex');
const address='0x'+'11'.repeat(20),target='0x'+'22'.repeat(20);
const absent=receipt=>Object.assign(Error(receipt?'Transaction receipt not found':'Transaction not found'),{name:receipt?'TransactionReceiptNotFoundError':'TransactionNotFoundError'});

async function fixture(t,{remote=false,automine=true,status='success',fault=null}={}){
 const folder=await mkdtemp(join(tmpdir(),'lab-tx-recovery-'));let store;
 t.after(async()=>{store?.close();await rm(folder,{recursive:true,force:true});});
 const receipts=new Map(),mempool=new Map(),sent=[],events=[],secrets=[];
 const state={automine,status,nonce:0,signatures:0,fault,loseResponse:false,receiptError:null};
 const receipt=(hash,tx)=>({transactionHash:hash,status:state.status,gasUsed:10n,effectiveGasPrice:2n,from:address,to:target,blockHash:sha('block'),blockNumber:2n,transactionIndex:0});
 const pc={getBytecode:async()=> '0xbeef',getChainId:async()=>31337,getBlock:async()=>({number:2n,hash:sha('block'),transactions:[]}),getBlockNumber:async()=>2n,
  estimateFeesPerGas:async()=>({maxFeePerGas:1n,maxPriorityFeePerGas:1n}),getGasPrice:async()=>1n,
  getTransactionCount:async()=>state.nonce,
  getTransactionReceipt:async({hash})=>{if(state.receiptError)throw state.receiptError;if(!receipts.has(hash))throw absent(true);return receipts.get(hash);},
  getTransaction:async({hash})=>{if(!mempool.has(hash))throw absent(false);return mempool.get(hash);},
  sendRawTransaction:async({serializedTransaction:raw})=>{const hash=sha(raw);sent.push({hash,raw});mempool.set(hash,{hash});if(state.automine){receipts.set(hash,receipt(hash));state.nonce++;}if(state.loseResponse)throw Error('RPC_RESPONSE_LOST');return hash;}};
 const chain={publicClient:pc,env:()=>({chainInstanceId:'epoch',contracts:{tokenA:target}}),rpc:async()=>({type:'CALL'})};
 const b={data:folder,chain,keccak256:sha,encodeFunctionData:({functionName,args})=>'0x'+Buffer.from(json({functionName,args})).toString('hex'),addSecret:x=>secrets.push(x),
  serializeTransaction:(tx,sig)=>'0x'+Buffer.from(json({tx,sig})).toString('hex'),recoverAddress:async()=>address};
 const actor={agentId:'maker',role:'maker',agentRunId:'run',profileId:'profile',activeCommand:'command-1',address,costs:{toolCalls:0},gasUsedWei:0n,spec:{maxGasWei:'100000000'},wallet:{signTransaction:async tx=>{state.signatures++;return '0x'+Buffer.from(json(tx)).toString('hex');}}};
 const s={id:'execution',steps:1,spec:{pauseBeforeTransaction:false},realm:{epoch:'epoch',exchange:target,contractCodeHash:sha('0xbeef'),abi:[]},before:{blockNumber:'2',blockHash:sha('block')},
  acceptance:{acceptanceId:'accepted-1',termsHash:sha('terms')},quote:{quoteId:'quote'},accepted:'quote',agents:[actor],transactions:[],pending:[],abort:new AbortController(),files:{},
  checkAbort(){if(this.abort.signal.aborted)throw Error('SCENARIO_STOPPED');},async persist(){this.persisted=copy(this.transactions);},
  async emit(type,payload){const event={eventId:randomUUID(),type,payload:copy(payload)};events.push(event);return event;}};
 let control,registry;
 if(remote){store=new ControlStore(folder);control={b,store,lease:()=>({agentId:'profile',epoch:1}),archive:async()=>{},
   event:(_s,type,payload)=>{const event={eventId:randomUUID(),type,payload:copy(payload)};events.push(event);return event;},
   dispatch:async()=>{state.signatures++;return {signature:'0x'+'00'.repeat(64)+'1b'};},
   fault(point){if(state.fault===point){state.fault=null;throw Error('INJECTED_'+point);}}};registry=new RemoteRegistry(control);
 }else registry=new WalletRegistry(b);
 return {folder,state,pc,b,actor,s,registry,control,store,events,secrets,sent,receipts,mempool,mine(){for(const [hash]of mempool){if(!receipts.has(hash)){receipts.set(hash,receipt(hash));state.nonce++;}}}};
}

for(const remote of [false,true]){
 test(`${remote?'worker':'local'} accepted business operation is idempotent across new model commands`,async t=>{
  const f=await fixture(t,{remote});const first=await f.registry.submit(f.s,f.actor,target,[],'approve',[target,20n]);f.actor.activeCommand='new-model-command';
  const second=await f.registry.submit(f.s,f.actor,target,[],'approve',[target,20n]);
  assert.equal(second.intentId,first.intentId);assert.equal(first.state,'confirmed');assert.equal(f.sent.length,1);assert.equal(f.state.signatures,1);assert.equal(f.actor.gasUsedWei,20n);
  await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'approve',[target,20000000n]),/OPERATION_PARAMETERS_CHANGED/);assert.equal(f.sent.length,1);
  await assert.rejects(f.registry.submit(f.s,f.actor,'0x'+'33'.repeat(20),[],'approve',[target,20n]),/OPERATION_PARAMETERS_CHANGED/);assert.equal(f.sent.length,1);
 });
 test(`${remote?'worker':'local'} pending locks another operation and serialized receipt checks charge gas once`,async t=>{
  const f=await fixture(t,{remote,automine:false});await f.registry.submit(f.s,f.actor,target,[],'approve',[target,20n]);
  await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'createOrder',[20n]),/RECONCILE_FIRST/);
  f.mine();await Promise.all([f.registry.reconcile(f.s),f.registry.reconcile(f.s),f.registry.reconcile(f.s)]);
  assert.equal(f.s.pending.length,0);assert.equal(f.actor.gasUsedWei,20n);assert.equal(f.events.filter(e=>e.type==='tx.receipt').length,1);assert.equal(f.sent.length,1);
 });
 test(`${remote?'worker':'local'} revert stays a failed operation and cannot silently create a new nonce`,async t=>{
  const f=await fixture(t,{remote,status:'reverted'}),tx=await f.registry.submit(f.s,f.actor,target,[],'fillOrder',['order']);
  assert.equal(tx.state,'reverted');assert.equal(tx.failure.businessSucceeded,false);assert.equal(f.s.pending.length,0);
  f.actor.activeCommand='retry-generated-by-model';const retried=await f.registry.submit(f.s,f.actor,target,[],'fillOrder',['order']);assert.equal(retried.hash,tx.hash);assert.equal(f.sent.length,1);assert.equal(f.actor.gasUsedWei,20n);
 });
 test(`${remote?'worker':'local'} lost RPC broadcast response is reconciled against the original transaction`,async t=>{
  const f=await fixture(t,{remote});f.state.loseResponse=true;const tx=await f.registry.submit(f.s,f.actor,target,[],'approve',[target,20n]);
  assert.equal(tx.state,'confirmed');assert.equal(f.sent.length,1);assert.equal(f.s.pending.length,0);assert.equal(f.events.filter(e=>e.type==='tx.unknown').length,1);
  assert.equal(json(f.events).includes(f.sent[0].raw),false,'raw signed transaction must not enter the experiment events');assert.equal(json(f.s.transactions).includes(f.sent[0].raw),false);
 });
 test(`${remote?'worker':'local'} explicit cleanup retries a confirmed revert once per administrative control ID`,async t=>{
  const f=await fixture(t,{remote,status:'reverted'}),first=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);
  f.actor.activeCommand='model-repeat';const automatic=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);assert.equal(automatic.intentId,first.intentId);assert.equal(f.sent.length,1);
  f.state.status='success';f.s.cleanupRetryAuthorization={functionName:'expireOrder',controlId:'operator-cleanup-1'};
  const second=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);
  assert.equal(second.state,'confirmed');assert.equal(second.operationId,first.operationId);assert.notEqual(second.intentId,first.intentId);assert.equal(second.attempt,2);assert.equal(second.priorIntentId,first.intentId);assert.equal(second.priorReceiptHash,first.hash);assert.equal(second.nonce,first.nonce+1);
  const replay=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);assert.equal(replay.intentId,second.intentId);assert.equal(f.sent.length,2);
  delete f.s.cleanupRetryAuthorization;f.actor.activeCommand='another-model-repeat';assert.equal((await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order'])).intentId,second.intentId);
  assert.equal(f.s.transactions.length,2);assert.equal(f.actor.gasUsedWei,40n);
 });
 test(`${remote?'worker':'local'} cleanup control replay after a second revert still cannot spawn a third attempt`,async t=>{
  const f=await fixture(t,{remote,status:'reverted'});await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);f.s.cleanupRetryAuthorization={functionName:'expireOrder',controlId:'operator-one'};
  const second=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']),repeated=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);assert.equal(second.intentId,repeated.intentId);assert.equal(f.sent.length,2);
 });
 test(`${remote?'worker':'local'} cleanup retry requires fresh revert and consumed nonce, and never authorizes fill`,async t=>{
  const f=await fixture(t,{remote,status:'reverted'}),expired=await f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']);f.s.cleanupRetryAuthorization={functionName:'expireOrder',controlId:'operator-check'};f.state.nonce=0;
  await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']),/NONCE_NOT_CONSUMED/);assert.equal(f.sent.length,1);
  f.state.nonce=1;f.receipts.delete(expired.hash);await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'expireOrder',['order']),/receipt not found/);assert.equal(f.sent.length,1);
  delete f.s.cleanupRetryAuthorization;const fill=await f.registry.submit(f.s,f.actor,target,[],'fillOrder',['order']);f.s.cleanupRetryAuthorization={functionName:'fillOrder',controlId:'not-cleanup'};
  assert.equal((await f.registry.submit(f.s,f.actor,target,[],'fillOrder',['order'])).intentId,fill.intentId);assert.equal(f.sent.length,2);
 });
}

test('after hash durability crash recovers exactly the same raw/hash without signing or reserving another nonce',async t=>{
 const f=await fixture(t,{remote:true,fault:'after_hash_persist'});await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'createOrder',[20n]),/INJECTED_after_hash_persist/);
 assert.equal(f.sent.length,0);const saved=f.store.list('tx_intents')[0];assert.equal(saved.state,'broadcasting');assert.equal(saved.broadcastAttempted,false);
 const resumed={...f.s,transactions:f.store.list('tx_intents'),pending:[],reconcileQueue:null};resumed.pending=[...resumed.transactions];
 const registry=new RemoteRegistry(f.control);await registry.reconcile(resumed);assert.equal(f.sent.length,0,'read-only reconciliation must never broadcast');
 await registry.reconcile(resumed,{rebroadcast:true});await registry.reconcile(resumed);
 assert.equal(f.sent.length,1);assert.equal(f.sent[0].hash,saved.hash);assert.equal(f.state.signatures,1);assert.equal(resumed.transactions[0].state,'confirmed');
 assert.equal(f.store.db.prepare('SELECT COUNT(*) AS n FROM wallet_nonces').get().n,1);assert.equal(f.store.list('tx_intents').length,1);
});

test('stopping the execution prevents recovery from sending its signed but unbroadcast transaction',async t=>{
 const f=await fixture(t,{remote:true,fault:'after_hash_persist'});await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'createOrder',[20n]),/INJECTED/);f.s.abort.abort();
 await f.registry.reconcile(f.s,{rebroadcast:true});assert.equal(f.sent.length,0);assert.equal(f.s.pending.length,1);
});

test('a consumed nonce with no matching receipt remains unknown and cannot be replayed',async t=>{
 const f=await fixture(t,{remote:true,fault:'after_hash_persist'});await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'createOrder',[20n]),/INJECTED/);f.state.nonce=1;
 await f.registry.reconcile(f.s,{rebroadcast:true});assert.equal(f.sent.length,0);assert.equal(f.s.pending[0].recoveryBlocked,'NONCE_ALREADY_CONSUMED');assert.equal(f.s.pending[0].state,'unknown');
});

test('RPC failure is not absence evidence and cannot trigger automatic raw transaction replay',async t=>{
 const f=await fixture(t,{remote:true,fault:'after_hash_persist'});await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'createOrder',[20n]),/INJECTED/);f.state.receiptError=Error('provider is offline');
 await f.registry.reconcile(f.s,{rebroadcast:true});assert.equal(f.sent.length,0);assert.equal(f.s.pending.length,1);assert.match(f.s.pending[0].lastObservationError,/offline/);
});

test('missing secret recovery cache blocks recovery rather than inventing a new transaction',async t=>{
 const f=await fixture(t,{remote:true,fault:'after_hash_persist'});await assert.rejects(f.registry.submit(f.s,f.actor,target,[],'createOrder',[20n]),/INJECTED/);
 await rm(f.registry.recovery.path(f.s.pending[0]));await f.registry.reconcile(f.s,{rebroadcast:true});assert.equal(f.sent.length,0);assert.equal(f.s.pending[0].recoveryBlocked,'SIGNED_TRANSACTION_CACHE_UNAVAILABLE');
});

test('pending raw transactions are authenticated ciphertext outside experiment files',async t=>{
 const f=await fixture(t,{automine:false});await f.registry.submit(f.s,f.actor,target,[],'approve',[target,20n]);const tx=f.s.pending[0],path=f.registry.recovery.path(tx),text=await readFile(path,'utf8');
 assert.equal(text.includes(f.sent[0].raw),false);assert.equal(await new TransactionRecoveryCache(f.folder).get(tx),f.sent[0].raw);assert.deepEqual(Object.keys(f.s.files),[]);
 const changed=JSON.parse(text);changed.ciphertext=changed.ciphertext.slice(0,-2)+(changed.ciphertext.endsWith('00')?'01':'00');await writeFile(path,JSON.stringify(changed));await assert.rejects(f.registry.recovery.get(tx));
});

test('non-quote legacy operations remain separated by command while accepted operations ignore command IDs',()=>{
 const actor={role:'agent',agentRunId:'run',activeCommand:'one'},s={id:'execution'};const a=operationIdentity(s,actor,target,'approve',[target,20n]);actor.activeCommand='two';const b=operationIdentity(s,actor,target,'approve',[target,20n]);assert.notEqual(a.operationId,b.operationId);
 s.acceptance={acceptanceId:'accepted'};const c=operationIdentity(s,actor,target,'approve',[target,20n]);actor.activeCommand='three';assert.equal(c.operationId,operationIdentity(s,actor,target,'approve',[target,20n]).operationId);
});
