import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {LegacyScene} from '../src/control/legacy.mjs';
import {RemoteScene} from '../src/control/scene.mjs';

async function fixture(t,{environmentError,readError,archiveError,bundleError,pending=false}={}){
 const folder=await mkdtemp(join(process.cwd(),'data-test-legacy-finish-'));
 t.after(()=>rm(folder,{recursive:true,force:true}));
 const scene=Object.create(LegacyScene.prototype),calls={released:0,dbWrites:[],reconciled:0};
 Object.assign(scene,{id:'legacy-fixture',folder,state:'running',legacyTask:'transfer',job:{input:{}},spec:{experimentMode:'independent'},before:{},transactions:[],observations:[],pending:pending?[{hash:'pending-hash'}]:[],execution:{sealed:false,funds:pending?'pending':'none'},error:null,abort:new AbortController(),queue:Promise.resolve(),pumping:false});
 scene.registry={assertEnvironment:async()=>{if(environmentError)throw Error(environmentError);},reconcile:async()=>{calls.reconciled++;}};
 scene.readerChain={state:async()=>{if(readError)throw Error(readError);return {balances:{}};}};
 scene.control={current:scene.id,b:{chain:{},checkTask:()=>({status:'success'})},persist:s=>{calls.dbWrites.push({state:s.state,funds:s.execution.funds,business:s.execution.business,sealed:s.execution.sealed,error:s.error});},release:s=>{calls.released++;scene.control.current=null;}};
 scene.emit=async()=>{};
 scene.persist=async()=>{if(archiveError)throw Error(archiveError);scene.control.persist(scene);};
 scene.bundle=async()=>{if(bundleError)throw Error(bundleError);return {format:'test-only-record',state:scene.state};};
 scene.elapsedMs=()=>10;
 return {scene,calls};
}
function attention(scene,calls,reason){
 assert.equal(scene.state,'requires_attention');assert.equal(scene.execution.funds,'unknown');assert.equal(scene.execution.business,'unknown');assert.equal(scene.execution.sealed,false);assert.equal(scene.check.status,'unknown');assert.equal(scene.durationMs,null);assert.equal(scene.endedAt,null);assert.match(scene.error,new RegExp(reason));assert.equal(calls.released,0);assert.equal(scene.control.current,scene.id);assert.deepEqual(calls.dbWrites.at(-1),{state:'requires_attention',funds:'unknown',business:'unknown',sealed:false,error:scene.error});
}

test('legacy chain identity loss is unknown and retains ownership without reading a new chain',async t=>{
 const {scene,calls}=await fixture(t,{environmentError:'CHAIN_START_CHANGED'});await scene.finish('stopped');attention(scene,calls,'CHAIN_START_CHANGED');assert.equal(calls.reconciled,0);
});
test('legacy final RPC read failure persists unknown funds and retains ownership',async t=>{
 const {scene,calls}=await fixture(t,{readError:'RPC_UNAVAILABLE'});await scene.finish('infrastructure_error');attention(scene,calls,'RPC_UNAVAILABLE');assert.equal(calls.reconciled,1);
});
test('legacy archive failure cannot seal or release a computed successful task',async t=>{
 const {scene,calls}=await fixture(t,{archiveError:'DISK_FULL'});await scene.finish('legacy_complete');attention(scene,calls,'DISK_FULL');
});
test('legacy bundle failure reverses provisional seal and persists attention in the database',async t=>{
 const {scene,calls}=await fixture(t,{bundleError:'BUNDLE_WRITE_FAILED'});await scene.finish('legacy_complete');attention(scene,calls,'BUNDLE_WRITE_FAILED');
});
test('inherited pump keeps legacy financial attention state after failed reconciliation',async t=>{
 const {scene,calls}=await fixture(t,{environmentError:'RPC_UNAVAILABLE'});scene.step=async()=>{throw Error('TOOL_RPC_FAILED');};scene.pump();await scene.queue;attention(scene,calls,'RPC_UNAVAILABLE');assert.equal(scene.pumping,false);
});
test('healthy legacy completion seals the real bundle and releases ownership once',async t=>{
 const {scene,calls}=await fixture(t);await scene.finish('legacy_complete');assert.equal(scene.state,'completed',scene.error);assert.equal(scene.execution.sealed,true);assert.equal(scene.execution.funds,'settled');assert.equal(calls.released,1);assert.equal(JSON.parse(await readFile(join(scene.folder,'bundle.json'),'utf8')).state,'completed');
});



async function peerFixture(t,options={}){
 const {scene,calls}=await fixture(t,options);Object.setPrototypeOf(scene,RemoteScene.prototype);
 const bundle=JSON.parse(await readFile(new URL('../examples/v2/peer-normal.json',import.meta.url),'utf8'));
 const event=bundle.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse).find(e=>e.type==='check.evidence');
 const evidence=JSON.parse(bundle.files[event.payloadRef.path]);
 Object.assign(scene,{spec:evidence.spec,before:evidence.before,quote:evidence.quote,order:evidence.order,transactions:evidence.transactions,rejected:evidence.rejected});
 scene.registry.state=async()=>{if(options.readError)throw Error(options.readError);return evidence.after;};
 scene.registry.scan=async()=>evidence.chainScan;
 scene.registry.chain={publicClient:{getBlock:async()=>({timestamp:1700000000n})}};
 return {scene,calls};
}

test('peer chain identity loss preserves unknown funds and ownership',async t=>{
 const {scene,calls}=await peerFixture(t,{environmentError:'CHAIN_START_CHANGED'});await scene.finish('stopped');attention(scene,calls,'CHAIN_START_CHANGED');assert.equal(calls.reconciled,0);
});
test('peer final RPC state failure persists attention without claiming a result',async t=>{
 const {scene,calls}=await peerFixture(t,{readError:'RPC_UNAVAILABLE'});await scene.finish('infrastructure_error');attention(scene,calls,'RPC_UNAVAILABLE');
});
test('peer archive failure after independent financial checking cannot release ownership',async t=>{
 const {scene,calls}=await peerFixture(t,{archiveError:'DISK_FULL'});await scene.finish('complete');attention(scene,calls,'DISK_FULL');
});
test('peer bundle failure reverses provisional seal and persists attention',async t=>{
 const {scene,calls}=await peerFixture(t,{bundleError:'BUNDLE_WRITE_FAILED'});await scene.finish('complete');attention(scene,calls,'BUNDLE_WRITE_FAILED');
});
test('inherited pump retains peer attention after chain reconciliation failure',async t=>{
 const {scene,calls}=await peerFixture(t,{environmentError:'RPC_UNAVAILABLE'});scene.spec.manual=false;scene.step=async()=>{throw Error('TOOL_RPC_FAILED');};scene.pump();await scene.queue;attention(scene,calls,'RPC_UNAVAILABLE');assert.equal(scene.pumping,false);
});
test('healthy peer evidence still seals and releases ownership once',async t=>{
 const {scene,calls}=await peerFixture(t);await scene.finish('complete');assert.equal(scene.state,'completed',scene.error);assert.equal(scene.execution.sealed,true);assert.equal(scene.execution.funds,'settled');assert.equal(scene.check.status,'success');assert.equal(calls.released,1);
});
