import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ChainLab, type TxHooks } from '../src/chain.js';

type Event={type:string;payload:any;links?:Record<string,unknown>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function capture() {
  const events:Event[]=[];
  const hooks:TxHooks={emit:async(type,payload,links)=>{
    events.push(JSON.parse(JSON.stringify({type,payload,links},(_key,value)=>typeof value==='bigint'?String(value):value)));
  }};
  return {events,hooks};
}
const ofType=(events:Event[],type:string)=>events.filter(event=>event.type===type);
function paired(events:Event[]) {
  const calls=ofType(events,'contract.call'),results=ofType(events,'contract.result');
  assert.equal(new Set(calls.map(event=>event.payload.callId)).size,calls.length);
  assert.equal(results.length,calls.length);
  for(const call of calls) {
    const id=call.payload.callId;
    assert.match(id,uuid);assert.equal(call.links?.contractCallId,id);
    const matched=results.filter(event=>event.payload.callId===id);
    assert.equal(matched.length,1);assert.equal(matched[0].links?.contractCallId,id);
    assert.equal(matched[0].payload.kind,call.payload.kind);
    assert.ok(matched[0].payload.duration_ms>=0);
    assert.ok(events.indexOf(call)<events.indexOf(matched[0]));
  }
}

test('real Anvil contract-call evidence and raw nested traces', {timeout:120_000}, async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'web3-contract-trace-'));
  const lab=new ChainLab({rpcUrl:'http://127.0.0.1:19549',dataDir:dir});
  try {
    await lab.start();
    await t.test('balance read records actual ABI and fixed block without any transaction',async()=>{
      await lab.reset();const before=await lab.state();const {events,hooks}=capture();
      const balance=await lab.execute('get_balance',{token:'A'},hooks);
      paired(events);assert.equal(events.length,2);
      const call=events[0].payload,result=events[1].payload;
      assert.equal(call.tool,'get_balance');assert.equal(call.kind,'read');assert.equal(call.chainId,31337);
      assert.deepEqual(call.contract,{address:before.addresses.tokenA,label:'TokenA'});
      assert.deepEqual(call.function,{name:'balanceOf',signature:'balanceOf(address)',selector:'0x70a08231',args:[before.addresses.agent]});
      assert.equal(call.request.to,before.addresses.tokenA);
      assert.equal(call.request.data,`0x70a08231${before.addresses.agent.slice(2).toLowerCase().padStart(64,'0')}`);
      assert.equal(call.request.from,undefined);assert.equal(call.request.blockHash,before.blockHash);
      assert.equal(call.request.blockNumber,before.blockNumber);
      assert.equal(result.status,'success');assert.equal(result.result,'100000000');assert.equal(result.blockHash,before.blockHash);
      assert.equal(balance.contractCallId,call.callId);assert.equal(balance.balance,'100000000');
      assert.equal((await lab.state()).nonce,before.nonce);assert.equal(lab.transactions.length,0);
    });
    await t.test('get_state instruments all ten readContract calls at one block, ordinary state stays silent',async()=>{
      await lab.reset();const {events,hooks}=capture();const state=await lab.execute('get_state',{},hooks);
      paired(events);const calls=ofType(events,'contract.call');assert.equal(calls.length,10);
      for(const {payload} of calls) {
        assert.equal(payload.tool,'get_state');assert.equal(payload.kind,'read');
        assert.equal(payload.request.blockNumber,state.blockNumber);assert.equal(payload.request.blockHash,state.blockHash);
      }
      assert.equal(calls.filter(event=>event.payload.function.signature==='balanceOf(address)').length,7);
      assert.equal(calls.filter(event=>event.payload.function.signature==='allowance(address,address)').length,2);
      assert.equal(calls.filter(event=>event.payload.function.signature==='totalAssets()').length,1);
      const count=events.length;assert.deepEqual(await lab.state(),state);assert.equal(events.length,count);
      assert.equal(state.balances.agentA,'100000000');assert.equal(state.formatted.balances.agentA,'100');
      assert.equal(state.allowances.ammA,'0');assert.equal(state.formatted.allowances.ammA,'0');
      assert.equal(state.formatted.unit,'token');assert.equal(state.formatted.tokenDecimals,6);
      const explicit=capture();await lab.state({tool:'explicit-state-observer',hooks:explicit.hooks});
      assert.equal(ofType(explicit.events,'contract.call').length,10);
    });
    await t.test('swap then deposit links four submitted calls and preserves raw nested callTracer trees',async()=>{
      await lab.reset();const {events,hooks}=capture();const before=await lab.state();
      await lab.execute('approve_token',{token:'A',spender:'amm',amount:'10'},hooks);
      const swapped=await lab.execute('swap',{amountIn:'10',minAmountOut:'9'},hooks);
      await lab.execute('approve_token',{token:'B',spender:'vault',amount:swapped.amountOutFormatted},hooks);
      const deposited=await lab.execute('deposit',{amount:swapped.amountOutFormatted},hooks);
      paired(events);const calls=ofType(events,'contract.call');assert.equal(calls.length,4);
      for(const call of calls) {
        const id=call.payload.callId;
        const txEvents=events.filter(event=>event.type.startsWith('tx.')&&event.links?.contractCallId===id);
        for(const type of ['tx.prepared','tx.broadcast','tx.receipt','tx.trace']) assert.equal(txEvents.filter(event=>event.type===type).length,1);
        for(const event of txEvents) assert.equal(event.payload.contractCallId,id);
        const prepared=txEvents.find(event=>event.type==='tx.prepared')!;
        assert.deepEqual(prepared.payload.amountConversions,call.payload.amountConversions);
        assert.equal(prepared.payload.data,call.payload.request.data);
        assert.equal(prepared.payload.to,call.payload.contract.address);
        assert.equal(call.payload.function.selector,prepared.payload.data.slice(0,10));
        assert.equal(call.payload.request.from,before.addresses.agent);
        const result=ofType(events,'contract.result').find(event=>event.payload.callId===id)!;
        assert.equal(result.payload.status,'success');assert.equal(result.payload.submitted,true);
        assert.equal(result.payload.result.contractCallId,id);assert.ok(result.payload.blockHash);
      }
      const swapCall=calls.find(event=>event.payload.tool==='swap')!.payload;
      assert.equal(swapCall.function.signature,'swap(uint256,uint256,address)');
      assert.deepEqual(swapCall.function.args,['10000000','9000000',before.addresses.agent]);
      assert.deepEqual(swapCall.amountConversions,[
        {parameter:'amountIn',token:'A',unit:'token',decimals:6,input:'10',baseUnits:'10000000'},
        {parameter:'minAmountOut',token:'B',unit:'token',decimals:6,input:'9',baseUnits:'9000000'},
      ]);
      const depositCall=calls.find(event=>event.payload.tool==='deposit')!.payload;
      assert.equal(depositCall.function.signature,'deposit(uint256,address)');
      assert.deepEqual(depositCall.function.args,[swapped.amountOut,before.addresses.agent]);
      assert.equal(depositCall.amountConversions[0].input,swapped.amountOutFormatted);
      assert.equal(depositCall.amountConversions[0].baseUnits,swapped.amountOut);
      const swapTrace=ofType(events,'tx.trace').find(event=>event.payload.contractCallId===swapCall.callId)!.payload.trace;
      const depositTrace=ofType(events,'tx.trace').find(event=>event.payload.contractCallId===depositCall.callId)!.payload.trace;
      const allCalls=(node:any):any[]=>[node,...(node.calls||[]).flatMap(allCalls)];
      assert.ok(allCalls(swapTrace).some(node=>node.to?.toLowerCase()===before.addresses.tokenA.toLowerCase()&&node.input?.startsWith('0x23b872dd')),'actual nested A transferFrom');
      assert.ok(allCalls(swapTrace).some(node=>node.to?.toLowerCase()===before.addresses.tokenB.toLowerCase()&&node.input?.startsWith('0xa9059cbb')),'actual nested B transfer');
      assert.ok(allCalls(depositTrace).some(node=>node.to?.toLowerCase()===before.addresses.tokenB.toLowerCase()&&node.input?.startsWith('0x23b872dd')),'actual nested vault asset transferFrom');
      assert.deepEqual(swapTrace,await lab.publicClient.request({method:'debug_traceTransaction',params:[swapped.txHash,{tracer:'callTracer'}]}),'raw tracer result is not normalized or synthesized');
      assert.equal((await lab.check('swap_deposit',before,await lab.state())).status,'success');
      assert.equal((await lab.inspectTransaction(deposited.txHash)).contractCallId,depositCall.callId);
      const encoded=JSON.stringify(events);
      assert.doesNotMatch(encoded,/test test test test test test test test test test test junk|"privateKey"|"mnemonic"/);
    });
    await t.test('pending links tx.status to a result without pretending confirmation',async()=>{
      await lab.reset();await lab.setAutomine(false);const {events,hooks}=capture();
      try {
        const result=await lab.execute('transfer_token',{token:'A',amount:'10'},hooks);
        paired(events);const call=events[0].payload;
        assert.equal(result.status,'pending');assert.equal(result.contractCallId,call.callId);
        const status=ofType(events,'tx.status')[0];assert.equal(status.links?.contractCallId,call.callId);
        assert.equal(ofType(events,'tx.receipt').length,0);assert.equal(ofType(events,'tx.trace').length,0);
        const done=ofType(events,'contract.result')[0].payload;
        assert.equal(done.status,'pending');assert.equal(done.txHash,result.txHash);assert.equal(done.blockHash,undefined);
      } finally {await lab.reset();await lab.setAutomine(true);}
    });
    await t.test('mined revert is distinguished from a submission error',async()=>{
      await lab.reset();const {events,hooks}=capture();
      const result=await lab.execute('transfer_token',{token:'A',amount:'1000'},hooks);
      paired(events);assert.equal(result.status,'reverted');
      const done=ofType(events,'contract.result')[0].payload;
      assert.equal(done.status,'reverted');assert.equal(done.result.receipt.status,'reverted');
      assert.equal(done.txHash,result.txHash);assert.equal(done.blockHash,result.receipt.blockHash);
      assert.equal(ofType(events,'tx.error').length,0);
    });
    await t.test('submission timeout without returned hash records unknown, not error or revert',async()=>{
      await lab.reset();const {events,hooks}=capture();const original=lab.walletClient.sendTransaction;
      try {
        lab.walletClient.sendTransaction=async()=>{throw new Error('transport timeout');};
        const result=await lab.execute('transfer_token',{token:'A',amount:'10'},hooks);
        paired(events);assert.equal(result.status,'unknown');assert.equal(result.txHash,undefined);
        const done=ofType(events,'contract.result')[0].payload;
        assert.equal(done.status,'unknown');assert.equal(done.submitted,'unknown');assert.equal(done.txHash,undefined);
        assert.equal(ofType(events,'tx.error')[0].links?.contractCallId,result.contractCallId);
        assert.equal(lab.transactions[0].contractCallId,result.contractCallId);
      } finally {lab.walletClient.sendTransaction=original;}
    });
    await t.test('invalid parameters and unknown tools do not manufacture an ABI call or transaction',async()=>{
      await lab.reset();const before=await lab.state();const {events,hooks}=capture();
      for(const [name,args] of [['transfer_token',{token:'A',amount:'1.0000001'}],['get_balance',{token:'X'}],['transfer_token',{token:'A',amount:'1',recipient:'not-an-address'}],['missing_tool',{}]] as [string,Record<string,unknown>][]) {
        await assert.rejects(lab.execute(name,args,hooks));
      }
      assert.equal(events.length,0);assert.equal(lab.transactions.length,0);assert.deepEqual(await lab.state(),before);
    });
    await t.test('prepare failure and pre-submit cancellation remain unsubmitted, and original errors propagate',async()=>{
      await lab.reset();const before=await lab.state();const original=lab.walletClient.prepareTransactionRequest;
      const preparation=capture();
      try {
        lab.walletClient.prepareTransactionRequest=async()=>{throw new Error('preparation failed');};
        await assert.rejects(lab.execute('transfer_token',{token:'A',amount:'10'},preparation.hooks),/preparation failed/);
        paired(preparation.events);
        assert.equal(ofType(preparation.events,'tx.prepared').length,0);
        assert.deepEqual(Object.fromEntries(['status','stage','submitted'].map(key=>[key,ofType(preparation.events,'contract.result')[0].payload[key]])),{status:'error',stage:'prepare',submitted:false});
      } finally {lab.walletClient.prepareTransactionRequest=original;}
      const canceled=capture();let pausedDescriptor:any;
      await assert.rejects(lab.execute('transfer_token',{token:'A',amount:'10'},{...canceled.hooks,beforeSubmit:async descriptor=>{
        pausedDescriptor=descriptor;assert.equal(canceled.events[0].type,'contract.call');
        assert.equal(ofType(canceled.events,'tx.prepared').length,1);assert.equal((await lab.state()).nonce,before.nonce);
        throw new Error('canceled before broadcast');
      }}),/canceled before broadcast/);
      paired(canceled.events);assert.match(pausedDescriptor.contractCallId,uuid);
      const done=ofType(canceled.events,'contract.result')[0].payload;
      assert.equal(done.stage,'before_submit');assert.equal(done.submitted,false);assert.equal(done.status,'error');
      assert.equal(ofType(canceled.events,'tx.broadcast').length,0);assert.equal(lab.transactions.length,0);assert.deepEqual(await lab.state(),before);
    });
    await t.test('unavailable raw trace is explicit and does not erase a valid receipt',async()=>{
      await lab.reset();const {events,hooks}=capture();const original=lab.publicClient.request;
      try {
        lab.publicClient.request=async(args:any)=>{if(args.method==='debug_traceTransaction')throw new Error('trace unavailable');return original(args);};
        const result=await lab.execute('transfer_token',{token:'A',amount:'10'},hooks);
        paired(events);assert.equal(result.status,'success');assert.equal(ofType(events,'tx.trace').length,0);
        const missing=ofType(events,'tx.trace_unavailable')[0];
        assert.equal(missing.links?.contractCallId,result.contractCallId);assert.equal(missing.payload.contractCallId,result.contractCallId);
        assert.equal(ofType(events,'contract.result')[0].payload.status,'success');
      } finally {lab.publicClient.request=original;}
    });
    await t.test('read errors remain paired and all parallel state reads settle before tool failure',async()=>{
      await lab.reset();const {events,hooks}=capture();const original=lab.publicClient.readContract;
      try {
        lab.publicClient.readContract=async(args:any)=>{if(args.functionName==='allowance')throw new Error('read unavailable');return original(args);};
        await assert.rejects(lab.execute('get_state',{},hooks),/read unavailable/);
        paired(events);assert.equal(ofType(events,'contract.call').length,10);
        assert.equal(ofType(events,'contract.result').filter(event=>event.payload.status==='error').length,2);
        const count=events.length;await new Promise(resolve=>setImmediate(resolve));assert.equal(events.length,count);
      } finally {lab.publicClient.readContract=original;}
    });
    await t.test('durable recording failure before read or write is fatal and has no chain side effects',async()=>{
      await lab.reset();const before=await lab.state();const original=lab.publicClient.readContract;let reads=0;
      const broken:TxHooks={emit:async()=>{throw new Error('disk full');}};
      try {
        lab.publicClient.readContract=async(args:any)=>{reads++;return original(args);};
        await assert.rejects(lab.execute('get_balance',{token:'A'},broken),{name:'RecordingError'});
        assert.equal(reads,0);
        await assert.rejects(lab.execute('transfer_token',{token:'A',amount:'10'},broken),{name:'RecordingError'});
        assert.deepEqual(await lab.state(),before);assert.equal(lab.transactions.length,0);
      } finally {lab.publicClient.readContract=original;}
    });
    await t.test('a concurrent recorder failure takes priority over an ordinary state read error',async()=>{
      await lab.reset();const original=lab.publicClient.readContract;
      try {
        lab.publicClient.readContract=async(args:any)=>{if(args.functionName==='balanceOf')throw new Error('read unavailable');return original(args);};
        const hooks:TxHooks={emit:async(type,payload:any)=>{if(type==='contract.result'&&payload.status==='success')throw new Error('disk full');}};
        await assert.rejects(lab.execute('get_state',{},hooks),{name:'RecordingError'});
      } finally {lab.publicClient.readContract=original;}
    });
  } finally {
    await lab.stop();
    assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('web3-contract-trace-'));
    await fs.rm(dir,{recursive:true,force:true});
  }
});
