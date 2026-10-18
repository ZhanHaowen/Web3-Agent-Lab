/** Unit-regression protocol fixtures against real Anvil; not an LLM capability benchmark. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
const base=`http://127.0.0.1:${process.env.LAB_PORT||4437}`;
const health=await (await fetch(base+'/api/health')).json();
async function api(route,body,status=200){
  const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-lab-token':health.csrfToken},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const j=await r.json();assert.equal(r.status,status,JSON.stringify(j));return j;
}
let plan=[],requests=[];
const service=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  const request=JSON.parse(body);requests.push(request);
  const index=request.messages.filter(m=>m.role==='tool').length;
  const item=plan[index];
  const message=item?{role:'assistant',content:null,tool_calls:[{id:'unit-call-'+index,type:'function',function:{name:item[0],arguments:JSON.stringify(item[1])}}]}:{role:'assistant',content:'协议测试完成；结果由独立检查器判定。'};
  res.setHeader('content-type','application/json');res.end(JSON.stringify({model:'amount-protocol-fixture',choices:[{message}],usage:{prompt_tokens:10,completion_tokens:10,total_tokens:20}}));
});
await new Promise(resolve=>service.listen(0,'127.0.0.1',resolve));
const model={baseUrl:`http://127.0.0.1:${service.address().port}/v1`,model:'amount-protocol-fixture-not-real-llm',maxSteps:12};
async function run(taskId,calls,options={}){
  plan=calls;requests=[];
  const {runId}=await api('/api/runs',{taskId,mode:'llm',model,experimentMode:'continuous',dataOrigin:'protocol_fixture',...options},202);
  for(let i=0;i<600;i++){const s=await api('/api/status');if(!s.busy&&s.active?.runId===runId)return api('/api/runs/'+runId);await new Promise(r=>setTimeout(r,100));}
  throw Error('Run timed out');
}
const approval=amount=>['approve_token',{token:'A',spender:'amm',amount}];
const swap=amountIn=>['swap',{amountIn,minAmountOut:'9'}];
const results=[];
async function test(name,fn){const extra=await fn();results.push({name,passed:true,...extra});console.log('PASS '+name);}
try{
  if(!(await api('/api/status')).ready)await api('/api/environment/init',{});
  await api('/api/environment/reset',{});
  let approveRun,swapRun;
  await test('continuous_approve_rejects_base_units_then_retries_without_rewriting',async()=>{
    const r=approveRun=await run('approve',[approval('20000000'),approval('20')]);
    assert.equal(r.result.status,'success');assert.equal(r.config.amountValidation,'fixed_task');
    assert.equal(r.result.evidence.after.allowances.ammA,'20000000');
    assert.equal(r.result.evidence.transactions.length,1);
    const tools=r.execution_trace.tool_calls;assert.equal(tools.length,2);
    assert.equal(tools[0].status,'rejected');assert.ok(!tools[0].missing.includes('tool.started'));assert.equal(tools[0].input.amount,'20000000');assert.match(JSON.stringify(tools[0].raw_result),/TOOL_AMOUNT_MISMATCH/);
    assert.ok(!r.execution_trace.contract_calls.some(c=>c.toolCallId===tools[0].toolCallId));
    assert.equal(tools[1].input.amount,'20');
    const conversion=r.execution_trace.contract_calls.find(c=>c.kind==='transaction').amountConversions[0];
    assert.equal(conversion.input,'20');assert.equal(conversion.baseUnits,'20000000');
    assert.ok(requests.slice(1).some(q=>q.messages.some(m=>m.role==='tool'&&m.content.includes('TOOL_AMOUNT_MISMATCH'))));
    assert.equal(r.result.checkerVersion,'2.2.0');
    return{runId:r.config.run_id,transactions:1,rejectedAttempts:1};
  });
  await test('continuous_swap_rejects_base_units_and_reuses_prior_approval',async()=>{
    const r=swapRun=await run('swap',[swap('10000000'),swap('10')]);
    assert.equal(r.result.status,'success');assert.equal(r.result.evidence.before.allowances.ammA,'20000000');
    assert.equal(r.result.evidence.after.allowances.ammA,'10000000');
    assert.equal(r.result.evidence.transactions.length,1);assert.equal(r.result.evidence.after.balances.agentA,'90000000');
    assert.equal(r.result.evidence.before.formatted.allowances.ammA,'20');
    assert.equal(r.result.evidence.after.formatted.allowances.ammA,'10');
    return{runId:r.config.run_id};
  });
  await test('unchanged_bad_proposal_is_failure_without_oversized_chain_approval',async()=>{
    const r=await run('approve',[approval('20000000')]);
    assert.equal(r.result.status,'failure');assert.equal(r.result.evidence.transactions.length,0);
    assert.equal(r.result.evidence.after.allowances.ammA,r.result.evidence.before.allowances.ammA);
    assert.ok(r.result.diagnostics.items.some(i=>i.layer==='tool'));
    return{runId:r.config.run_id};
  });
  await test('raw_research_mode_reproduces_user_numbers_and_keeps_policy_failure',async()=>{
    await run('approve',[approval('100000000')],{amountValidation:'schema_only'});
    const r=await run('swap',[approval('1000000000000000'),swap('10')],{amountValidation:'schema_only'});
    assert.equal(r.config.amountValidation,'schema_only');assert.equal(r.result.status,'failure');
    assert.equal(r.result.evidence.before.allowances.ammA,'100000000000000');
    assert.equal(r.result.evidence.after.allowances.ammA,'999999999999990000000');
    const residual=r.result.assertions.find(a=>a.id==='amm-allowance-consumed');
    assert.equal(residual.expected,'999999999999990000000');assert.equal(residual.actual,residual.expected);assert.equal(residual.passed,true);
    assert.equal(r.result.assertions.find(a=>a.id==='bounded-amm-approval').passed,false);
    assert.equal(r.result.assertions.find(a=>a.id==='only-task-transactions').passed,false);
    assert.ok(r.result.evidence.transactions.every(tx=>tx.status==='success'));
    return{runId:r.config.run_id,expectedRemainder:residual.expected,policyFailureRetained:true};
  });
  await test('inherited_large_allowance_is_consumed_without_forced_reset',async()=>{
    const r=await run('swap',[swap('10')]);assert.equal(r.result.status,'success');assert.equal(r.result.evidence.transactions.length,1);
    assert.equal(BigInt(r.result.evidence.before.allowances.ammA)-BigInt(r.result.evidence.after.allowances.ammA),10000000n);
    return{runId:r.config.run_id};
  });
  await test('valid_prerequisite_approve_is_part_of_swap',async()=>{
    await api('/api/environment/reset',{});
    const r=await run('swap',[approval('10'),swap('10')]);assert.equal(r.result.status,'success');assert.equal(r.result.evidence.transactions.length,2);
    assert.equal(r.result.assertions.find(a=>a.id==='only-task-transactions').passed,true);
    return{runId:r.config.run_id};
  });
  await test('trace_export_graph_and_offline_recheck_keep_unit_evidence',async()=>{
    const id=approveRun.config.run_id;
    const before=await api(`/api/runs/${id}/export`);assert.equal(before.verification.valid,true);
    const graph=JSON.parse(before.files['derived/provenance-graph.json']);assert.equal(graph.nodes.find(n=>n.type==='task').attributes.amount_validation,'fixed_task');
    const calls=graph.nodes.filter(n=>n.type==='contract_call');assert.ok(calls.some(n=>n.attributes.amountConversions?.[0]?.baseUnits==='20000000'));
    await api(`/api/runs/${id}/check`,{});
    const after=await api(`/api/runs/${id}/export`);assert.equal(after.files['events.jsonl'],before.files['events.jsonl']);assert.equal(after.files['manifest.json'],before.files['manifest.json']);
    return{runId:id};
  });
  await test('invalid_validation_mode_rejected',async()=>{await api('/api/runs',{taskId:'approve',mode:'scripted',amountValidation:'automatic-divide'},400);});
  await api('/api/environment/reset',{});
  await writeFile('docs/amount-validation.json',JSON.stringify({sourceHash:health.version.sourceHash,origin:'synthetic model protocol + real Anvil; not a real LLM benchmark',results},null,2));
}finally{service.closeAllConnections();await new Promise(resolve=>service.close(resolve));}
