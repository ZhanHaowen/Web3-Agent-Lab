import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

test('real Anvil API: custom goals and chained LLM continuation preserve sealed evidence', {timeout:180_000}, async t=>{
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'lab-api-v013-'));
  const root=process.cwd();const origin='http://127.0.0.1:18713';let token='';let calls=0;const requests:any[]=[];
  const fixture=createServer(async(req,res)=>{
    try {
      let text='';for await(const chunk of req) text+=chunk;const body=JSON.parse(text);requests.push(body);calls++;
      assert.equal(req.headers.authorization,'Bearer continuation-fixture-only');
      const continuationMessage=[...body.messages].reverse().find((message:any)=>message.role==='user'&&String(message.content).startsWith('平台提供的续行观察'));
      const observed=body.messages.filter((message:any)=>message.role==='tool').map((message:any)=>({message,value:JSON.parse(message.content)}));
      const submittedSwap=body.messages.some((message:any)=>(message.tool_calls??[]).some((call:any)=>call.function.name==='swap'));
      const submittedDeposit=body.messages.some((message:any)=>(message.tool_calls??[]).some((call:any)=>call.function.name==='deposit'));
      let toolCalls:any[]=[];
      if(!submittedSwap) toolCalls=[['swap',{amountIn:'10',minAmountOut:'9'}]];
      else if(continuationMessage&&!submittedDeposit) {
        const context=JSON.parse(continuationMessage.content.slice(continuationMessage.content.indexOf('\n')+1));
        const amount=(BigInt(context.state.balances.agentB)/1_000_000n).toString()+'.'+(BigInt(context.state.balances.agentB)%1_000_000n).toString().padStart(6,'0');
        toolCalls=[['approve_token',{token:'B',spender:'vault',amount}],['deposit',{amount}]];
      }
      const message=toolCalls.length?{role:'assistant',content:null,tool_calls:toolCalls.map(([name,args],index)=>({id:`fixture-${calls}-${index}`,type:'function',function:{name,arguments:JSON.stringify(args)}}))}:{role:'assistant',content:`Observed ${observed.length} tool results; waiting or finished according to current chain evidence.`};
      res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({model:'provider-fixture-reported',choices:[{message}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}}));
    } catch(error:any) {res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:error.message}));}
  });
  await new Promise<void>(resolve=>fixture.listen(0,'127.0.0.1',resolve));
  const fixturePort=(fixture.address() as any).port;
  const child=spawn(process.execPath,['--import','./scripts/register-agentkit.mjs','--import','tsx','src/server.ts'],{cwd:root,env:{...process.env,LAB_PORT:'18713',LAB_CHAIN_PORT:'18714',LAB_DATA_DIR:data},stdio:['ignore','pipe','pipe'],windowsHide:true});
  let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  async function api(route:string,body?:any,expect=200):Promise<any> {
    const response=await fetch(origin+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-lab-token':token},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30_000)});
    const result=await response.json();assert.equal(response.status,expect,`${route}: ${JSON.stringify(result)}`);return result;
  }
  async function finish(id:string) {for(let index=0;index<300;index++){const state=await api('/api/status');if(!state.busy)return api('/api/runs/'+id);await delay(50);}throw new Error('RUN_TIMEOUT');}
  const run=async(body:any)=>{const started=await api('/api/runs',body,202);return finish(started.runId);};
  try {
    for(let index=0;index<600;index++){try{const health=await api('/api/health');token=health.csrfToken;break;}catch{if(child.exitCode!==null)throw new Error(output);await delay(100);}}
    assert.ok(token,output);await api('/api/environment/init',{});
    await t.test('changed amount is resolved once and used by script, checker and offline recheck',async()=>{
      const resolved=await api('/api/tasks/resolve',{taskId:'transfer',taskInput:'从 agent 向 recipient 转账5 TokenA，确认链上执行结果。'});
      assert.equal(resolved.taskParameters.amount,'5');
      const custom=await run({taskId:'transfer',mode:'scripted',experimentMode:'independent',taskInput:resolved.input});
      assert.equal(custom.result.status,'success');assert.equal(custom.config.taskParameters.amount,'5');
      assert.equal(custom.result.evidence.after.balances.recipientA,'5000000');
      assert.equal((await api('/api/runs/'+custom.config.run_id+'/check',{})).status,'success');
      assert.equal(custom.chainExecutionStatus,'success');
      const rejected=await api('/api/tasks/resolve',{taskId:'transfer',taskInput:'转账5 TokenA',taskParameters:{amount:'7'}},400);assert.match(rejected.error,/CONFLICT/);
    });
    await t.test('manual mining response includes measured timestamp changes',async()=>{
      const result=await api('/api/environment/mine',{blocks:1,seconds:100});assert.equal(result.mining.actualDeltaSeconds,100);
      assert.equal(result.mining.actualBlocks,1);await api('/api/environment/mine',{blocks:0,seconds:1},400);
    });
    await api('/api/environment/reset',{});
    await run({taskId:'approve',mode:'scripted',experimentMode:'continuous'});
    await api('/api/environment/automine',{enabled:false});
    const model={baseUrl:`http://127.0.0.1:${fixturePort}/v1`,model:'routing-alias',apiKey:'continuation-fixture-only',maxSteps:8};
    const parent=await run({taskId:'swap_deposit',mode:'llm',dataOrigin:'protocol_fixture',experimentMode:'continuous',model});const parentId=parent.config.run_id;
    assert.equal(parent.result.status,'pending');assert.equal(parent.result.evidence.transactions.length,1);
    const original=await Promise.all(['events.jsonl','manifest.json','config.json'].map(name=>fs.readFile(path.join(data,'runs',parentId,name))));
    await t.test('live reconciliation is checker only and never invokes the model',async()=>{
      const before=calls;await api('/api/runs/'+parentId+'/check',{mode:'live'});assert.equal(calls,before);
    });
    const parentMessages=structuredClone(requests.at(-1).messages);parentMessages.push({role:'assistant',content:`Observed 1 tool results; waiting or finished according to current chain evidence.`});
    const continued=await api('/api/runs/'+parentId+'/continue-agent',{blocks:1,seconds:100,model:{apiKey:'continuation-fixture-only'}},202);
    const next=await finish(continued.runId);
    await t.test('continuation mines pending swap, retains history and executes remaining tools',async()=>{
      assert.equal(continued.mining.actualDeltaSeconds,100);assert.notEqual(next.config.run_id,parentId);
      assert.equal(next.config.continuation_of,parentId);assert.equal(next.result.status,'pending');
      assert.equal(next.result.evidence.before.balances.agentA,'100000000');
      assert.equal(next.result.evidence.transactions.length,3);
      const first=next.events.find((event:any)=>event.type==='model.request').payload.request;
      assert.deepEqual(first.messages.slice(0,parentMessages.length),parentMessages);
      assert.match(first.messages[parentMessages.length].content,/最新链状态/);
      const inherited=next.events.find((event:any)=>event.type==='continuation.parent').payload;
      assert.equal(inherited.inheritedTransactions[0].status,'success');assert.equal(inherited.inheritedObservations[0].raw.status,'pending');
      assert.ok(inherited.parentToolReferences.length);assert.ok(inherited.inheritedTransactions[0].source_event_refs.length);
      assert.deepEqual(next.modelSummary,{requested:'routing-alias',reported:['provider-fixture-reported'],reportedSource:'model.response'});
    });
    await t.test('second continuation confirms remaining transactions and completes cumulative task',async()=>{
      const started=await api('/api/runs/'+next.config.run_id+'/continue-agent',{blocks:1,seconds:17,model:{apiKey:'continuation-fixture-only'}},202);
      const final=await finish(started.runId);assert.equal(final.result.status,'success',JSON.stringify(final.result.assertions));
      assert.equal(final.result.evidence.transactions.length,3);assert.equal(final.result.evidence.after.balances.agentB,'0');
      assert.equal(final.result.evidence.before.balances.agentA,'100000000');assert.equal(final.config.parent_run_id,next.config.run_id);
      assert.equal((await api('/api/runs/'+final.config.run_id+'/check',{})).status,'success');
      const rejected=await api('/api/runs/'+parentId+'/continue-agent',{model:{apiKey:'continuation-fixture-only'}},400);assert.match(rejected.error,/SUPERSEDED|STATE_CHANGED/);
      const immutable=await api('/api/runs/'+final.config.run_id+'/continue-agent',{model:{model:'different-model'}},400);assert.match(immutable.error,/IMMUTABLE/);
      await api('/api/environment/reset',{});
      const reset=await api('/api/runs/'+final.config.run_id+'/continue-agent',{},400);assert.match(reset.error,/SUPERSEDED|EPOCH|ALREADY_SUCCESSFUL/);
    });
    await t.test('sealed parent bytes and redaction remain intact after repeated continuation',async()=>{
      const current=await Promise.all(['events.jsonl','manifest.json','config.json'].map(name=>fs.readFile(path.join(data,'runs',parentId,name))));
      current.forEach((bytes,index)=>assert.deepEqual(bytes,original[index]));assert.equal((await api('/api/runs/'+parentId+'/verify')).valid,true);
      const exported=await api('/api/runs/'+next.config.run_id+'/export');assert.ok(!JSON.stringify(exported).includes('continuation-fixture-only'));
      const rows=await api('/api/runs');assert.equal(rows.find((row:any)=>row.runId===parentId).taskStatus,'pending');
    });
  } finally {
    await api('/api/shutdown',{}).catch(()=>{});if(child.exitCode===null){await delay(300);child.kill();}
    await new Promise<void>(resolve=>fixture.close(()=>resolve()));await fs.rm(data,{recursive:true,force:true});
  }
});
