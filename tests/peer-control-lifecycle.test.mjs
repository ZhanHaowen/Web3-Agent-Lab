import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../src/control/routes.mjs';
import {ScenarioService} from '../src/scenario/service.mjs';
import {monitorPeer} from '../src/scenario/peer-lifecycle.mjs';

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function fixture(){
  const id='11111111-1111-1111-1111-111111111111',records=new Map(),history=[{type:'agent.error',error:'WORKER_OFFLINE'}];
  const s={id,state:'requires_attention',spec:{template:'peer_swap',manual:true},pending:[],agents:[{profileId:'worker-a',agentId:'maker',role:'maker'}],
    bindings:{maker:{epoch:1}},abort:new AbortController(),queue:Promise.resolve(),events:history,pausedAgents:new Set(),error:'WORKER_OFFLINE',
    emit:async(type,payload)=>history.push({type,payload}),persist:async()=>{},reconcileState:async()=>{},pump(){this.pumps=(this.pumps??0)+1;},
    tool:async()=>{},finish:async()=>{},snapshot(){return {state:this.state,error:this.error};}};
  records.set('executions:'+id,{id});records.set('leases:'+id+':maker',{epoch:1});
  const control={init:async()=>{},current:id,scenes:new Map([[id,s]]),admin:()=>true,agent:()=>({online:true,epoch:2}),
    b:{url:'http://127.0.0.1',send(res,status,data){Object.assign(res,{status,data});}},
    store:{get:(table,key)=>records.get(table+':'+key),put:(table,key,value)=>records.set(table+':'+key,value),list:()=>[],idem:(_scope,key,_body,create)=>{const k='idem:'+key;if(!records.has(k))records.set(k,create());return records.get(k);}}};
  let sequence=0;
  const request=async(action,key='control-'+sequence++)=>{const path='/api/v2/executions/'+id+'/control',res={};await handle.call(control,{method:'POST',url:path,headers:{'idempotency-key':key}},res,path,{action});return res;};
  const local=async(action)=>{const res={};await ScenarioService.prototype.handle.call(control,{method:'POST'},res,'/api/scenarios/'+id+'/'+action,{});return res;};
  return {s,control,request,local,history};
}

for(const backend of ['worker','local']){
  test(backend+': cleanup holds control ownership before its first await and releases it after success',async()=>{
    const f=fixture(),entered=deferred(),release=deferred();let calls=0;
    f.s.finish=async()=>{assert.equal(f.s.error,null,'A completed cleanup must not be blocked by the historical worker error');assert.equal(f.history[0].error,'WORKER_OFFLINE');};
    if(backend==='worker')f.s.emit=async(type)=>{if(type==='control.cleanup_authorized'){entered.resolve();await release.promise;}};
    f.s.tool=async()=>{calls++;assert.equal(f.s.controlBusy,true);if(backend==='local'){entered.resolve();await release.promise;}};
    const invoke=backend==='worker'?f.request:f.local;
    const first=invoke('cancel');await entered.promise;assert.equal(f.s.controlBusy,true);
    for(const action of ['resume','expire','stop','reconcile']){
      if(backend==='worker'){const res=await invoke(action);assert.equal(res.status,400);assert.equal(res.data.error,'CONTROL_BUSY');}
      else await assert.rejects(invoke(action),/CONTROL_BUSY/);
    }
    assert.equal(f.s.pumps,undefined);release.resolve();const res=await first;
    assert.equal(res.status,200);assert.equal(calls,1);assert.equal(f.s.controlBusy,false);assert.equal(f.s.cleanupRetryAuthorization,null);
  });
  test(backend+': failed cleanup releases the control guard and its retry authorization',async()=>{
    const f=fixture();f.s.tool=async()=>{assert.equal(f.s.controlBusy,true);assert.ok(f.s.cleanupRetryAuthorization);throw Error('SIMULATED_CLEANUP_FAILURE');};
    if(backend==='worker'){const res=await f.request('expire');assert.equal(res.data.error,'SIMULATED_CLEANUP_FAILURE');}
    else await assert.rejects(f.local('expire'),/SIMULATED_CLEANUP_FAILURE/);
    assert.equal(f.s.controlBusy,false);assert.equal(f.s.cleanupRetryAuthorization,null);
  });
  test(backend+': successful resume clears the current transport error while preserving historical evidence',async()=>{
    const f=fixture();f.s.state='paused';const prior=f.history[0];const res=await (backend==='worker'?f.request('resume'):f.local('resume'));
    assert.equal(res.status,200);assert.equal(f.s.error,null);assert.equal(f.s.state,'running');assert.equal(f.s.pumps,1);assert.equal(f.history[0],prior);
  });
  test(backend+': resume cannot clear a freshly reconciled transaction failure or pump more work',async()=>{
    const f=fixture();f.s.stopRequested=true;f.s.reconcileState=async()=>{f.s.transactionFailure={code:'TRANSACTION_REVERTED'};};
    if(backend==='worker'){const res=await f.request('resume');assert.equal(res.data.error,'TRANSACTION_FAILURE_REQUIRES_REVIEW');}
    else await assert.rejects(f.local('resume'),/TRANSACTION_FAILURE_REQUIRES_REVIEW/);
    assert.equal(f.s.pumps,undefined);assert.equal(f.s.error,'WORKER_OFFLINE');
  });
}

test('monitor does not reconcile or rebroadcast while an administrative cleanup owns the control guard',async()=>{
  const f=fixture();f.s.controlBusy=true;f.s.pending=[{state:'broadcasting',hash:'0x01'}];
  f.s.registry={reconcile:async()=>{throw Error('MUST_NOT_RECONCILE');}};
  await monitorPeer(f.s);assert.equal(f.s.monitoring,undefined);assert.equal(f.s.state,'requires_attention');assert.equal(f.s.pumps,undefined);
});

test('pause waiting for the active gate does not hold the cleanup guard or prevent resume',async()=>{
  const f=fixture(),release=deferred();f.s.state='running';f.s.queue=release.promise;f.s.releaseGate=()=>release.resolve();
  const pause=f.request('pause');await Promise.resolve();await Promise.resolve();assert.equal(f.s.controlBusy,undefined);
  const res=await f.request('resume');assert.equal(res.status,200);await pause;
});
