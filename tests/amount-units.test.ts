import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LabActionProvider, runAgent, type AgentOptions } from '../src/agent.js';
import { ChainLab } from '../src/chain.js';
import { TASKS, toolDefinitions } from '../src/tasks.js';

type Event = {type:string;payload:any;links?:Record<string,unknown>};
type Step = {name:string;args:Record<string,unknown>};
async function modelFixture(plan:(request:any,index:number)=>Step|undefined) {
  const requests:any[]=[];
  const server=createServer(async(req,res)=>{
    let body='';for await(const chunk of req) body+=chunk;
    try {
      const request=JSON.parse(body);requests.push(request);
      const step=plan(request,requests.length-1);
      res.setHeader('content-type','application/json');
      res.end(JSON.stringify({choices:[{message:step?{role:'assistant',content:null,tool_calls:[{id:`amount-call-${requests.length}`,type:'function',function:{name:step.name,arguments:JSON.stringify(step.args)}}]}:{role:'assistant',content:'Protocol fixture finished; consult the independent checker.'}}]}));
    } catch(error) {res.statusCode=500;res.end(JSON.stringify({error:String(error)}));}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert.ok(address&&typeof address==='object');
  return {baseUrl:`http://127.0.0.1:${address.port}/v1`,requests,close:async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}};
}
function capture() {
  const events:Event[]=[];
  const emit:AgentOptions['emit']=async(type,payload,links)=>{events.push(JSON.parse(JSON.stringify({type,payload,links},(_key,value)=>typeof value==='bigint'?String(value):value)));};
  return {events,emit};
}

test('amount schema rejects ambiguous/rounded formats and retains exact decimal input',async()=>{
  const calls:unknown[]=[];
  const action=new LabActionProvider(toolDefinitions,async(_name,args)=>{calls.push(args);return {};}).getActions().find(action=>action.name==='approve_token')!;
  for(const amount of ['2e1','-20','20.0000001',' 20','20 ',20,'.5','']) {
    await assert.rejects(action.invoke({token:'A',spender:'amm',amount}));
  }
  assert.equal(calls.length,0);
  await action.invoke({token:'A',spender:'amm',amount:'20.000000'});
  assert.deepEqual(calls,[{token:'A',spender:'amm',amount:'20.000000'}]);
});

test('recorded unit contract preserves custom user text and supplies exact formatted state',async()=>{
  const service=await modelFixture(()=>undefined);const {events,emit}=capture();
  try {
    const input='授权任务改写的研究输入  保持原文';
    await runAgent({mode:'llm',task:{...TASKS.find(task=>task.id==='approve')!},taskInput:input,
      model:{baseUrl:service.baseUrl,model:'synthetic-protocol-fixture',maxSteps:5},toolDefinitions,emit,
      initialState:{balances:{agentA:'123456789',agentB:'9007199254740993000000',native:'10000000000000000000'} as any,allowances:{ammA:'20000000',vaultB:'9960069'}},
      executeTool:async()=>assert.fail('no tool expected'),signal:new AbortController().signal});
    assert.equal(service.requests[0].messages.find((message:any)=>message.role==='user').content,input);
    const context=events.find(event=>event.type==='agent.context')!.payload.message.content;
    const object=JSON.parse(context.slice(context.indexOf('\n')+1));
    assert.equal(object.initialStateFormatted.balances.agentA,'123.456789');
    assert.equal(object.initialStateFormatted.balances.agentB,'9007199254740993');
    assert.equal(object.initialStateFormatted.balances.native,'10');
    assert.equal(object.initialStateFormatted.allowances.ammA,'20');
    assert.equal(object.initialState.allowances.ammA,'20000000');
    assert.equal(object.amountValidation,'fixed_task');
    assert.equal(object.fixedTaskTargetsInTokens.approve_token.amount,'20');
  } finally {await service.close();}
});

test('dynamic amount fallback requires this run successful swap followed by explicit agent TokenB evidence',async()=>{
  for(const scenario of [
    {label:'balance before any swap',steps:['get_balance','deposit'],balance:{token:'B',account:'agent',balance:'9000000'},accepted:false},
    {label:'stale observation before swap',steps:['get_balance','swap','deposit'],balance:{token:'B',account:'agent',balance:'9000000'},accepted:false},
    {label:'wrong account',steps:['swap','get_balance','deposit'],balance:{token:'B',account:'recipient',balance:'9000000'},accepted:false},
    {label:'wrong token',steps:['swap','get_balance','deposit'],balance:{token:'A',account:'agent',balance:'9000000'},accepted:false},
    {label:'post-swap agent B',steps:['swap','get_balance','deposit'],balance:{token:'B',account:'agent',balance:'9000000'},accepted:true},
  ]) {
    const service=await modelFixture((_request,index)=>{
      const name=scenario.steps[index];
      return name?{name,args:name==='swap'?{amountIn:'10',minAmountOut:'9'}:name==='get_balance'?{token:scenario.balance.token,account:scenario.balance.account}:{amount:'9'}}:undefined;
    });
    const {events,emit}=capture();const executed:string[]=[];
    try {
      const result=await runAgent({mode:'llm',task:{...TASKS.find(task=>task.id==='swap_deposit')!},model:{baseUrl:service.baseUrl,model:'synthetic-protocol-fixture',maxSteps:8},toolDefinitions,emit,
        initialState:{balances:{agentB:'0'} as any},experimentMode:'continuous',signal:new AbortController().signal,
        executeTool:async(name)=>{executed.push(name);return name==='get_balance'?scenario.balance:{status:'success'};}});
      assert.equal(result.error,undefined,scenario.label);
      assert.equal(executed.includes('deposit'),scenario.accepted,scenario.label);
      const rejection=events.find(event=>event.type==='tool.validation');
      if(scenario.accepted) assert.equal(rejection,undefined,scenario.label);
      else assert.equal(rejection?.payload.code,'TOOL_AMOUNT_EVIDENCE_REQUIRED',scenario.label);
    } finally {await service.close();}
  }
});

test('fixed task amounts reject duplicate precision before signing and allow explicit model recovery on real Anvil',{timeout:120_000},async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'web3-amount-unit-'));
  const chain=new ChainLab({rpcUrl:'http://127.0.0.1:19559',dataDir:dir});
  async function run(taskId:string,plan:(request:any,index:number)=>Step|undefined,overrides:Partial<AgentOptions>={}) {
    const service=await modelFixture(plan);const {events,emit}=capture();
    const before=await chain.state();chain.beginRunCapture();
    try {
      const result=await runAgent({mode:'llm',task:{...TASKS.find(task=>task.id===taskId)!},model:{baseUrl:service.baseUrl,model:'synthetic-protocol-fixture',maxSteps:16},toolDefinitions,
        initialState:before,experimentMode:'continuous',emit,signal:new AbortController().signal,
        executeTool:(name,args,context)=>chain.execute(name,args,{emit:async(type,payload,links)=>emit(type,payload,{...context,...links})}),...overrides});
      const after=await chain.state();
      return {before,after,result,events,requests:service.requests,check:await chain.check(taskId as any,before,after,chain.transactions,result.final,{experimentMode:'continuous'})};
    } finally {await service.close();}
  }
  try {
    await chain.start();
    await t.test('approve 20000000 rejected; corrected 20 executes exactly once',async()=>{
      const output=await run('approve',(_request,index)=>[
        {name:'approve_token',args:{token:'A',spender:'amm',amount:'20000000'}},
        {name:'approve_token',args:{token:'A',spender:'amm',amount:'20'}},
      ][index]);
      assert.equal(output.result.error,undefined);assert.equal(output.check.status,'success',JSON.stringify(output.check));
      assert.equal(output.after.allowances.ammA,'20000000');assert.equal(chain.transactions.length,1);
      const rejection=output.events.find(event=>event.type==='tool.result'&&event.payload.raw.code==='TOOL_AMOUNT_MISMATCH')!;
      assert.equal(rejection.payload.raw.received,'20000000');assert.equal(rejection.payload.raw.expected,'20');assert.equal(rejection.payload.raw.submitted,false);
      assert.equal(rejection.links?.toolCallId,'amount-call-1');
      assert.equal(output.events.filter(event=>event.type==='tool.call').length,2);
      assert.equal(output.events.filter(event=>event.type==='tool.started').length,1);
      assert.equal(output.events.filter(event=>event.type==='contract.call').length,1);
      assert.equal(output.events.find(event=>event.type==='contract.call')!.payload.function.args[1],'20000000');
      assert.equal(JSON.parse(output.events.find(event=>event.type==='tool.call')!.payload.arguments).amount,'20000000','original proposal is never rewritten');
      assert.equal(JSON.parse(output.requests[1].messages.at(-1).content).expected,'20');
    });
    await t.test('continuous swap uses prior20 allowance; inflated approval/input rejected without chain side effects',async()=>{
      const output=await run('swap',(_request,index)=>[
        {name:'approve_token',args:{token:'A',spender:'amm',amount:'999999999999990'}},
        {name:'swap',args:{amountIn:'10000000',minAmountOut:'9'}},
        {name:'swap',args:{amountIn:'10',minAmountOut:'9'}},
      ][index]);
      assert.equal(output.before.allowances.ammA,'20000000');assert.equal(output.after.allowances.ammA,'10000000');
      assert.equal(output.check.status,'success',JSON.stringify(output.check));assert.equal(chain.transactions.length,1);
      assert.equal(chain.transactions[0].tool,'swap');
      assert.equal(output.events.filter(event=>event.type==='tool.validation').length,2);
      assert.equal(output.events.filter(event=>event.type==='contract.call').length,1);
    });
    await t.test('dynamic deposit amount uses actual swap output, preserving historical B',async()=>{
      const output=await run('swap_deposit',(request,index)=>{
        const results=request.messages.filter((message:any)=>message.role==='tool').map((message:any)=>JSON.parse(message.content));
        const swap=results.find((value:any)=>value.amountOutFormatted);
        return [
          {name:'swap',args:{amountIn:'10',minAmountOut:'9'}},
          {name:'approve_token',args:{token:'B',spender:'vault',amount:swap?.amountOut}},
          {name:'approve_token',args:{token:'B',spender:'vault',amount:swap?.amountOutFormatted}},
          {name:'deposit',args:{amount:swap?.amountOutFormatted}},
        ][index];
      });
      assert.ok(BigInt(output.before.balances.agentB)>0n);
      assert.equal(output.after.balances.agentB,output.before.balances.agentB);
      assert.equal(output.check.status,'success',JSON.stringify(output.check));assert.equal(chain.transactions.length,3);
      const rejection=output.events.find(event=>event.type==='tool.validation')!.payload;
      assert.equal(rejection.parameter,'amount');assert.ok(rejection.expected.includes('.'));
      assert.equal(rejection.received.replace(/^0+/,''),rejection.expected.replace('.',''));
    });
    await t.test('schema_only intentionally executes bad model amount and independent checker rejects task',async()=>{
      await chain.reset();
      const output=await run('approve',(_request,index)=>index===0?{name:'approve_token',args:{token:'A',spender:'amm',amount:'20000000'}}:undefined,{amountValidation:'schema_only'});
      assert.equal(output.after.allowances.ammA,'20000000000000');assert.equal(chain.transactions.length,1);
      assert.equal(output.check.status,'failure');assert.equal(output.events.some(event=>event.type==='tool.validation'),false);
      assert.equal(output.events.find(event=>event.type==='agent.start')!.payload.amountValidation,'schema_only');
    });
    await t.test('dynamic amount without current-run evidence is rejected with explicit recovery instruction',async()=>{
      await chain.reset();
      const output=await run('swap_deposit',(_request,index)=>index===0?{name:'deposit',args:{amount:'9'}}:undefined);
      assert.equal(chain.transactions.length,0);
      const rejection=output.events.find(event=>event.type==='tool.validation')!.payload;
      assert.equal(rejection.code,'TOOL_AMOUNT_EVIDENCE_REQUIRED');assert.equal(rejection.submitted,false);
      assert.equal(output.events.some(event=>event.type==='contract.call'),false);
    });
  } finally {
    await chain.stop();
    // Only the fresh test-owned temporary directory is removed.
    const resolved=path.resolve(dir);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep));
    await fs.rm(resolved,{recursive:true,force:true});
  }
});
