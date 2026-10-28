/** Integration acceptance suite. Start the packaged server first. Uses Node built-ins only.
 * Creates new, labeled runs but never deletes existing experiment data.
 * LAB_PORT=4317 node scripts/e2e.mjs
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const base=`http://127.0.0.1:${Number(process.env.LAB_PORT||4317)}`;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hash=text=>createHash('sha256').update(text).digest('hex');
const results=[];
const runIds=[];
let token='';
const report={suite:'packaged-http-e2e',startedAt:new Date().toISOString(),platform:process.platform,arch:process.arch,node:process.version,base,tests:results,runIds};

async function request(endpoint,{method='GET',body,headers={},expected}={}) {
  const response=await fetch(base+endpoint,{method,headers:{...(method==='GET'?{}:{'Content-Type':'application/json','X-Lab-Token':token}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30_000)});
  const data=await response.json();
  if(expected!==undefined) assert.equal(response.status,expected,JSON.stringify(data));
  else if(!response.ok) throw new Error(`${method} ${endpoint}: ${response.status} ${JSON.stringify(data)}`);
  return {code:response.status,data};
}
const get=async endpoint=>(await request(endpoint)).data;
const post=async(endpoint,body={})=>(await request(endpoint,{method:'POST',body})).data;
async function until(predicate,label,timeout=30_000) {
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline) {const value=await predicate();if(value)return value;await delay(75);}
  throw new Error(`Timeout waiting for ${label}`);
}
async function begin(taskId,options={}) {
  const {runId}=await post('/api/runs',{taskId,mode:'scripted',dataOrigin:'acceptance_test_scripted',...options});
  runIds.push(runId);return runId;
}
async function completed(runId) {
  await until(async()=>{const s=await get('/api/status');return !s.busy&&s.active?.runId===runId&&s.active.state==='finished';},`run ${runId}`);
  const run=await get(`/api/runs/${runId}`);assert.ok(run.manifest,'Run must be sealed');return run;
}
async function run(taskId,options={}) {return completed(await begin(taskId,options));}
async function liveNonce() {
  const s=await get('/api/status');
  const response=await fetch(s.environment.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getTransactionCount',params:[s.environment.accounts.agent,'latest']})});
  const data=await response.json();assert.ok(!data.error,JSON.stringify(data));return data.result;
}
async function test(name,body) {
  const started=performance.now();
  try {const details=await body();results.push({name,passed:true,durationMs:Math.round(performance.now()-started),...(details?{details}:{})});console.log(`PASS ${name}`);}
  catch(error) {
    results.push({name,passed:false,durationMs:Math.round(performance.now()-started),error:error.message});console.error(`FAIL ${name}: ${error.message}`);
    try {const s=await get('/api/status');if(s.busy&&s.active?.state==='paused'){await post('/api/control',{action:'cancel'});await until(async()=>!(await get('/api/status')).busy,'failed-test cleanup');}} catch {}
  }
}

try {
  const health=await get('/api/health');token=health.csrfToken;report.build=health.version;
  const initial=await get('/api/status');assert.equal(initial.busy,false,'Do not run acceptance suite during an active experiment.');
  if(!initial.ready) await post('/api/environment/init');
  await post('/api/environment/automine',{enabled:true});
  for(const task of ['balance','transfer','approve','swap','swap_deposit']) await test(`scripted_${task}`,async()=>{
    const value=await run(task);assert.equal(value.result.status,'success',JSON.stringify(value.result));assert.equal(value.config.data_origin,'acceptance_test_scripted');
    assert.equal(value.result.costs.model_calls,0);assert.equal((await get(`/api/runs/${value.config.run_id}/verify`)).valid,true);
    return {runId:value.config.run_id,status:value.result.status};
  });
  for(const faultMode of ['transfer_revert','wrong_recipient']) await test(faultMode,async()=>{
    const value=await run('transfer',{faultMode});assert.equal(value.result.status,'failure');
    if(faultMode==='transfer_revert')assert.ok(value.result.evidence.transactions.some(tx=>tx.receipt?.status==='reverted'));
    return {runId:value.config.run_id,status:value.result.status};
  });
  await test('tool_override_preserves_raw_and_rejects_wrong_balance',async()=>{
    const environment=(await get('/api/status')).environment;
    const value=await run('balance',{toolOverrides:{get_balance:{token:'A',address:environment.accounts.agent,balance:'999000000',formatted:'999',decimals:6,blockHash:environment.baseline.blockHash}}});
    assert.equal(value.result.status,'failure');
    const observation=value.events.find(event=>event.type==='tool.result').payload;
    assert.equal(observation.raw.balance,'100000000');assert.equal(observation.visible.balance,'999000000');
    return {runId:value.config.run_id};
  });
  await test('pending_live_reconciliation_offline_replay_and_epoch_guard',async()=>{
    await post('/api/environment/automine',{enabled:false});
    try {
      const value=await run('transfer');const id=value.config.run_id;
      assert.equal(value.result.status,'pending');
      const eventsBefore=hash(JSON.stringify(value.events));
      await post('/api/environment/mine',{blocks:1,seconds:3});
      const live=await post(`/api/runs/${id}/check`,{mode:'live'});assert.equal(live.status,'success');
      const offline=await post(`/api/runs/${id}/check`,{mode:'offline'});assert.equal(offline.status,'pending');
      assert.equal(live.evidence_source,'live_chain');assert.equal(offline.evidence_source,'original_run');assert.notEqual(live.check_id,offline.check_id);
      assert.equal(offline.costs.gas_used,'0');assert.equal(offline.costs.gas_complete,false,'Offline pending evidence must not inherit reconciled live gas costs');
      assert.equal(hash(JSON.stringify((await get(`/api/runs/${id}`)).events)),eventsBefore,'Rechecking must not modify raw evidence');
      await post('/api/environment/reset');
      const rejected=await request(`/api/runs/${id}/check`,{method:'POST',body:{mode:'live'},expected:400});assert.match(rejected.data.error,/CHAIN_EPOCH_CHANGED/);
      return {runId:id,original:'pending',live:'success',offline:'pending',resetGuard:'rejected'};
    } finally {await post('/api/environment/automine',{enabled:true});}
  });
  for(const [flag,phase] of [['pauseBeforeTool','before_tool'],['pauseBeforeTransaction','before_transaction']]) await test(flag,async()=>{
    const id=await begin('transfer',{[flag]:true});
    const paused=await until(async()=>{const s=await get('/api/status');return s.active?.runId===id&&s.active?.state==='paused'?s:false;},phase);
    assert.equal(paused.active.pause.phase,phase);assert.equal(await liveNonce(),'0x0');
    const events=await get(`/api/runs/${id}/events`);assert.equal(events.some(event=>event.type==='tx.broadcast'),false);
    await delay(150);assert.equal(await liveNonce(),'0x0');
    const blocked=await request('/api/environment/reset',{method:'POST',body:{},expected:400});assert.match(blocked.data.error,/BUSY/);
    await post('/api/control',{action:'resume'});const value=await completed(id);assert.equal(value.result.status,'success');
    return {runId:id,phase,nonceBeforeResume:0};
  });
  await test('cancel_paused_run_has_no_transaction_side_effect',async()=>{
    const id=await begin('transfer',{pauseBeforeTransaction:true});
    await until(async()=>(await get('/api/status')).active?.state==='paused','cancel pause');
    await post('/api/control',{action:'cancel'});const value=await completed(id);
    assert.equal(value.result.cancelled,true);assert.notEqual(value.result.status,'success');assert.equal(await liveNonce(),'0x0');
    return {runId:id};
  });
  await test('session_token_and_origin_guards',async()=>{
    assert.equal((await request('/api/environment/reset',{method:'POST',body:{},headers:{'X-Lab-Token':''},expected:403})).data.error,'SESSION_TOKEN_REQUIRED');
    assert.equal((await request('/api/health',{headers:{Origin:'https://untrusted.example'},expected:403})).data.error,'LOCAL_ORIGIN_REQUIRED');
    assert.equal((await request('/api/environment/reset',{method:'POST',body:{},headers:{Origin:'https://untrusted.example'},expected:403})).data.error,'LOCAL_ORIGIN_REQUIRED');
  });
  await test('export_all_raw_manifest_hashes_valid',async()=>{
    let fileCount=0;
    for(const id of runIds) {
      const bundle=await get(`/api/runs/${id}/export`);assert.equal(bundle.verification.valid,true);
      const manifest=JSON.parse(bundle.files['manifest.json']);assert.equal(manifest.run_id,id);
      for(const [name,expected] of Object.entries(manifest.files)) {
        assert.equal(hash(bundle.files[name]),expected.sha256,`${id}/${name}`);
        assert.equal(Buffer.byteLength(bundle.files[name]),expected.bytes,`${id}/${name} bytes`);fileCount++;
      }
      const events=bundle.files['events.jsonl'].trim().split('\n').map(JSON.parse);
      for(const event of events) assert.equal(hash(bundle.files[event.payload_ref.path]),event.payload_ref.sha256);
    }
    return {runs:runIds.length,verifiedRawFiles:fileCount};
  });
  await test('concurrent_reset_and_run_are_mutually_exclusive',async()=>{
    const [a,b]=await Promise.all([
      request('/api/environment/reset',{method:'POST',body:{},expected:undefined}).then(value=>({ok:true,...value}),error=>({ok:false,error:error.message})),
      request('/api/runs',{method:'POST',body:{taskId:'transfer',mode:'scripted',dataOrigin:'acceptance_test_scripted',pauseBeforeTool:true},expected:undefined}).then(value=>({ok:true,...value}),error=>({ok:false,error:error.message})),
    ]);
    assert.equal(Number(a.ok)+Number(b.ok),1,JSON.stringify({a,b}));assert.match((a.ok?b:a).error,/BUSY/);
    if(b.ok) {runIds.push(b.data.runId);await until(async()=>(await get('/api/status')).active?.state==='paused','race pause');await post('/api/control',{action:'cancel'});await completed(b.data.runId);}
    return {resetAccepted:a.ok,runAccepted:b.ok};
  });
} catch(error) {results.push({name:'suite_setup',passed:false,error:error.message});console.error(error.message);}
finally {
  report.finishedAt=new Date().toISOString();report.passed=results.filter(item=>item.passed).length;report.failed=results.filter(item=>!item.passed).length;
  await mkdir(path.join(root,'docs'),{recursive:true});await writeFile(path.join(root,'docs','e2e-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`E2E ${report.passed} passed / ${report.failed} failed; docs/e2e-results.json`);
  process.exitCode=report.failed?1:0;
}
