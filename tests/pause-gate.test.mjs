import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {RemoteScene} from '../src/control/scene.mjs';

function deferred(){let resolve,reject;const promise=new Promise((ok,bad)=>{resolve=ok;reject=bad;});return {promise,resolve,reject};}
function fixture(){const s=Object.create(RemoteScene.prototype),events=[];Object.assign(s,{abort:new AbortController(),state:'running',paused:null,releaseGate:null,checkAbort(){if(this.abort.signal.aborted)throw Error('SCENARIO_STOPPED');},async emit(type,payload,actor,causes=[]){events.push({type,payload,actor,causes});return {eventId:'event-'+events.length};},async persist(){}});return {s,events};}
const gate=s=>s.gate('before_transaction',{agentId:'maker'},{intentId:'durable-intent'});
function clean(s){assert.equal(s.releaseGate,null);assert.equal(getEventListeners(s.abort.signal,'abort').length,0);}

test('immediate resume during delayed pause persistence is latched and waits for durable archive',async()=>{const {s,events}=fixture(),entered=deferred(),disk=deferred();let complete=false;
 s.persist=()=>{entered.resolve();return disk.promise;};const operation=gate(s).then(()=>{complete=true;});await entered.promise;
 assert.equal(s.state,'paused');assert.equal(typeof s.releaseGate,'function');const resume=s.releaseGate;resume();s.state='running';resume();
 await Promise.resolve();assert.equal(complete,false);assert.equal(events.filter(e=>e.type==='control.resumed').length,0,'No resumed event or tool continuation before archive completes');
 disk.resolve();await operation;assert.equal(complete,true);assert.equal(s.state,'running');assert.equal(s.paused,null);assert.equal(events.filter(e=>e.type==='control.resumed').length,1);assert.deepEqual(events.at(-1).causes,['event-1']);clean(s);
});

test('release is already installed when paused event first becomes observable',async()=>{const {s,events}=fixture();let archived=false;s.emit=async(type,payload,actor,causes=[])=>{events.push({type,payload,actor,causes});if(type==='control.paused'){assert.equal(typeof s.releaseGate,'function');s.releaseGate();}else assert.equal(archived,true);return {eventId:'pause-event'};};s.persist=async()=>{archived=true;};await gate(s);assert.equal(events.filter(e=>e.type==='control.resumed').length,1);clean(s);});

test('abort during pause archive clears gate and prevents resume after archive finishes',async()=>{const {s,events}=fixture(),entered=deferred(),disk=deferred();s.persist=()=>{entered.resolve();return disk.promise;};const operation=gate(s);await entered.promise;s.abort.abort();clean(s);disk.resolve();await assert.rejects(operation,/SCENARIO_STOPPED/);assert.equal(events.some(e=>e.type==='control.resumed'),false);clean(s);});

test('abort while awaiting a persisted pause resolves internal latch without orphan rejection',async()=>{const {s,events}=fixture(),persisted=deferred();s.persist=async()=>{persisted.resolve();};const operation=gate(s);await persisted.promise;s.abort.abort();await assert.rejects(operation,/SCENARIO_STOPPED/);assert.equal(events.some(e=>e.type==='control.resumed'),false);clean(s);});

test('failed paused-event recording cleans listener and unpublished wait',async()=>{const {s}=fixture();s.emit=async()=>{throw Error('EVENT_ARCHIVE_FAILED');};await assert.rejects(gate(s),/EVENT_ARCHIVE_FAILED/);clean(s);});

test('failed pause persistence after an early resume never continues the tool',async()=>{const {s,events}=fixture(),entered=deferred(),disk=deferred();s.persist=()=>{entered.resolve();return disk.promise;};const operation=gate(s);await entered.promise;s.releaseGate();disk.reject(Error('DISK_WRITE_FAILED'));await assert.rejects(operation,/DISK_WRITE_FAILED/);assert.equal(events.some(e=>e.type==='control.resumed'),false);clean(s);});

test('already aborted scene never publishes a pause or installs a listener',async()=>{const {s,events}=fixture();s.abort.abort();await assert.rejects(gate(s),/SCENARIO_STOPPED/);assert.equal(events.length,0);clean(s);});
