import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveTask, TASKS, taskAmountBaseUnits, toolDefinitions } from '../src/tasks.js';
import { runAgent, type Message, type ToolObservation } from '../src/agent.js';
import { ChainLab } from '../src/chain.js';
import { checkTask } from '../src/checker.js';

test('task specification parses supported Chinese/English/JSON inputs with exact decimals',()=>{
  for(const text of ['使用实验amm将30 TokenA兑换为TokenB，最少接受27 TokenB，收款人为agent。','Swap 30 TokenA to TokenB, at least 27 TokenB.','{"amountIn":"30","minAmountOut":"27"}']) {
    const task=resolveTask('swap',{taskInput:text});
    assert.deepEqual(task.taskParameters,{amountIn:'30',minAmountOut:'27'});
    assert.equal(task.input,text);assert.equal(task.parameterSource,'input');assert.equal(task.tokenDecimals,6);
  }
  assert.deepEqual(resolveTask('transfer',{taskInput:'向recipient转账0.123456 TokenA'}).taskParameters,{amount:'0.123456'});
  assert.deepEqual(resolveTask('approve',{taskInput:'设置授权为30 TokenA'}).taskParameters,{amount:'30'});
  assert.deepEqual(resolveTask('swap',{taskParameters:{amountIn:'00030.000000',minAmountOut:'0'}}).taskParameters,{amountIn:'30',minAmountOut:'0'});
  assert.equal(taskAmountBaseUnits('9007199254740993.123456'),9007199254740993123456n);
  for(const task of TASKS) assert.equal(resolveTask(task.id,{taskInput:task.input}).input,task.input);
});

test('task resolver rejects ambiguous/conflicting/unsupported goals rather than restoring fixed defaults',()=>{
  for(const text of ['兑换30 TokenA，至少27 TokenB；amountIn="10"','兑换一点代币','Swap 30 TokenA','Swap -30 TokenA at least 27 TokenB','Swap 0.0000001 TokenA at least 0 TokenB']) assert.throws(()=>resolveTask('swap',{taskInput:text}),/TASK_/);
  assert.throws(()=>resolveTask('swap',{taskInput:'兑换30 TokenA，至少27 TokenB',taskParameters:{amountIn:'10',minAmountOut:'9'}}),/TASK_PARAMETER_CONFLICT/);
  assert.throws(()=>resolveTask('transfer',{taskInput:'转账30 TokenB'}),/TASK_INPUT_UNSUPPORTED/);
  assert.throws(()=>resolveTask('approve',{taskParameters:{amount:'0'}}),/TASK_PARAMETER_OUT_OF_RANGE/);
  assert.throws(()=>resolveTask('transfer',{taskParameters:{amountIn:'30'}}),/TASK_PARAMETER_UNSUPPORTED/);
});

test('real Anvil: configured transfer/approval/swap/deposit use one goal in plan, guard and checker', {timeout:120_000},async t=>{
  const directory=await mkdtemp(join(tmpdir(),'web3-v013-task-config-'));
  const chain=new ChainLab({rpcUrl:'http://127.0.0.1:19693',dataDir:directory});
  try {
    await chain.start();
    for(const id of ['transfer','approve','swap','swap_deposit'] as const) await t.test(id,async()=>{
      await chain.reset();chain.beginRunCapture();const before=await chain.state();
      const task=resolveTask(id,{taskParameters:id==='transfer'||id==='approve'?{amount:'30.000001'}:{amountIn:'30',minAmountOut:'27'}});
      const events:{type:string;payload:any}[]=[];
      const run=await runAgent({mode:'scripted',task,toolDefinitions,taskParameters:task.taskParameters,initialState:before,
        model:{model:'unused',baseUrl:'http://127.0.0.1:1/v1',maxSteps:12},signal:new AbortController().signal,
        executeTool:(name,args)=>chain.execute(name,args),emit:async(type,payload)=>{events.push({type,payload});}});
      assert.equal(run.error,undefined);
      const after=await chain.state();
      const result=checkTask(id,before,after,chain.transactions,run.final,[],{taskParameters:task.taskParameters});
      assert.equal(result.status,'success',JSON.stringify(result));
      assert.equal(result.checkerVersion,'2.2.0');
      assert.equal(events.some(event=>event.type==='tool.validation'),false);
      const oldGoal=checkTask(id,before,after,chain.transactions,run.final);
      assert.equal(oldGoal.status,'failure','legacy records without parameters still use historical goals');
    });
  } finally {await chain.stop();await rm(directory,{recursive:true,force:true});}
});

test('continuation preserves provider history, appends explicit user observation and completes only remaining deposit',async()=>{
  const pending={status:'pending',hash:'0xparent-swap'};
  const history:Message[]=[{role:'system',content:'original system'},{role:'user',content:'swap then deposit'},
    {role:'assistant',content:null,tool_calls:[{id:'parent-swap',type:'function',function:{name:'swap',arguments:'{"amountIn":"10","minAmountOut":"9"}'}}]},
    {role:'tool',tool_call_id:'parent-swap',content:JSON.stringify(pending)},{role:'assistant',content:'Waiting for a block'}];
  const original=structuredClone(history);
  const observations:ToolObservation[]=[{name:'swap',raw:pending,visible:{...pending,amountOut:'999999999'}}];
  const requests:any[]=[];let index=0;
  const plans=[{name:'approve_token',args:{token:'B',spender:'vault',amount:'9.960069'}},{name:'deposit',args:{amount:'9.960069'}}];
  const service=createServer(async(request,response)=>{
    let body='';for await(const chunk of request)body+=chunk;requests.push(JSON.parse(body));
    const step=plans[index++];response.end(JSON.stringify({choices:[{message:step?{role:'assistant',content:null,tool_calls:[{id:`continued-${index}`,type:'function',function:{name:step.name,arguments:JSON.stringify(step.args)}}]}:{role:'assistant',content:'Done'}}]}));
  });
  await new Promise<void>(resolve=>service.listen(0,'127.0.0.1',resolve));
  const address=service.address();assert.ok(address&&typeof address==='object');
  const calls:{name:string;args:unknown}[]=[];const events:any[]=[];
  try {
    const initialState={chainInstanceId:'epoch',balances:{agentB:'100000000'}} as any;
    const run=await runAgent({mode:'llm',task:resolveTask('swap_deposit'),toolDefinitions,initialState,experimentMode:'continuous',
      model:{model:'synthetic-protocol-fixture',baseUrl:`http://127.0.0.1:${address.port}/v1`,maxSteps:6},signal:new AbortController().signal,
      executeTool:async(name,args)=>{calls.push({name,args});return{status:'success'};},emit:async(type,payload)=>{events.push({type,payload});},
      continuation:{messages:history,observations,parentRunId:'parent',state:{chainInstanceId:'epoch',balances:{agentB:'109960069'}},transactions:[{hash:'0xparent-swap',status:'success',amountOut:'9960069',decoded:{functionName:'swap',args:['10000000','9000000','agent']}}]}});
    assert.equal(run.error,undefined);assert.deepEqual(requests[0].messages.slice(0,history.length),original);
    assert.equal(requests[0].messages.at(-1).role,'user');assert.match(requests[0].messages.at(-1).content,/109960069/);
    assert.deepEqual(calls.map(call=>call.name),['approve_token','deposit']);
    assert.deepEqual(calls.at(-1)?.args,{amount:'9.960069'});
    assert.deepEqual(history,original);assert.equal((observations[0].raw as any).status,'pending');
    assert.ok(events.some(event=>event.type==='agent.continuation'&&event.payload.parentRunId==='parent'));
  } finally {service.closeAllConnections();await new Promise<void>(resolve=>service.close(()=>resolve()));}
});

test('continuation cannot invent a missing tool reply or reuse historical tool call IDs',async()=>{
  const run=await runAgent({mode:'llm',task:resolveTask('swap'),toolDefinitions,model:{model:'fixture',baseUrl:'http://127.0.0.1:1/v1',maxSteps:2},signal:new AbortController().signal,
    executeTool:async()=>{throw new Error('must not execute');},emit:async()=>{},continuation:{parentRunId:'parent',state:{blockHash:'0xstate'},messages:[{role:'assistant',content:null,tool_calls:[{id:'unresolved',type:'function',function:{name:'swap',arguments:'{}'}}]}]}});
  assert.equal(run.error,'AGENT_CONTINUATION_UNRESOLVED_TOOL_CALLS');assert.equal(run.modelCalls,0);
});
