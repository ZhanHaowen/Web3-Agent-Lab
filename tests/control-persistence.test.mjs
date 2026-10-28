import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {LabControl} from '../src/control/control.mjs';import {RemoteScene} from '../src/control/scene.mjs';import {ControlStore} from '../src/control/store.mjs';
test('open and unknown financial outcomes survive repeated event persistence and a database reopen',async t=>{
 const folder=await mkdtemp(join(tmpdir(),'lab-financial-state-'));const control=Object.create(LabControl.prototype);let store=new ControlStore(folder);control.store=store;t.after(async()=>{store.close();await rm(folder,{recursive:true,force:true});});
 store.put('executions','execution',{id:'execution',jobId:'job',state:'running',funds:'none',business:'pending',sealed:false});const scene={id:'execution',state:'requires_attention',realm:{epoch:'chain'},bindings:{},execution:{id:'execution',funds:'open',business:'failed',sealed:false},snapshot(){return {state:this.state,environmentLock:true};}};
 control.persist(scene);assert.equal(store.get('executions',scene.id).funds,'open');scene.execution.funds='unknown';scene.execution.business='unknown';control.persist(scene);control.persist(scene);store.close();store=new ControlStore(folder);control.store=store;const recovered=store.get('executions',scene.id);assert.equal(recovered.funds,'unknown');assert.equal(recovered.business,'unknown');assert.equal(recovered.sealed,false);assert.equal(recovered.scene.environmentLock,true);
});

test('clients see finalizing until the terminal execution has released its environment and wallet leases',()=>{
 const scene=Object.create(RemoteScene.prototype);Object.assign(scene,{id:'execution',state:'completed',agents:[],pausedAgents:new Set(),bus:{outbox:[]},events:[],service:{current:'execution'},control:{current:'execution'},clean:x=>x,elapsedMs:()=>10,progress:()=>({})});
 assert.equal(scene.snapshot().state,'finalizing');scene.control.current=null;scene.service.current=null;assert.equal(scene.snapshot().state,'completed');
});
