import {artifactPath,artifactDirectory} from './helpers/artifacts.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.env.LAB_ROOT=root;process.env.LAB_LIBRARY_ONLY='1';
const lib=await import('../dist/server.mjs');const {ChainLab,createWalletClient,localChain,http,mnemonicToAccount}=lib;
const chain=new ChainLab({rpcUrl:'http://127.0.0.1:18587',anvilPath:join(root,'runtime/anvil.exe'),dataDir:join(root,'data-contract-test')});
const artifact=JSON.parse(await readFile(join(root,'contracts/artifacts/LabPeerExchange.json'),'utf8'));
const seed='test test test test test test test test test test test junk';const accounts=[4,5,6].map(addressIndex=>mnemonicToAccount(seed,{addressIndex}));
const [maker,taker,outsider]=accounts;const results=[];let c;
const wallet=a=>createWalletClient({account:a,chain:localChain,transport:http(chain.rpcUrl,{retryCount:0})});
const pc=()=>chain.publicClient,tokenAbi=()=>chain.artifacts.LabToken.abi;
async function read(address,abi,fn,args=[]){return pc().readContract({address,abi,functionName:fn,args});}
async function send(actor,address,abi,fn,args=[],expect='success'){
  const nonce=await pc().getTransactionCount({address:actor.address,blockTag:'pending'});
  const hash=await wallet(actor).writeContract({address,abi,functionName:fn,args,gas:800000n,nonce});
  const receipt=await pc().waitForTransactionReceipt({hash,timeout:10000,pollingInterval:50});assert.equal(receipt.status,expect,`${fn} ${hash}`);return receipt;
}
async function exchange(scope='0x'+randomBytes(32).toString('hex')){const hash=await wallet(chain.deployer).deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args:[c.tokenA,c.tokenB,scope],gas:5000000n});const r=await pc().waitForTransactionReceipt({hash,timeout:10000,pollingInterval:50});assert.equal(r.status,'success');return r.contractAddress;}
async function order(ex,overrides={}){
  const now=(await pc().getBlock()).timestamp;
  const o={taker:taker.address,sellToken:c.tokenA,sellAmount:10000000n,buyToken:c.tokenB,buyAmount:20000000n,deadline:now+1000n,salt:'0x'+randomBytes(32).toString('hex'),...overrides};
  const termsHash=await read(ex,artifact.abi,'hashTerms',[maker.address,o.taker,o.sellToken,o.sellAmount,o.buyToken,o.buyAmount,o.deadline,o.salt]);
  const id=await read(ex,artifact.abi,'orderIdFor',[maker.address,o.salt]);
  return {...o,id,termsHash,args:[o.taker,o.sellToken,o.sellAmount,o.buyToken,o.buyAmount,o.deadline,o.salt,termsHash]};
}
async function make(ex,overrides={}){const o=await order(ex,overrides);await send(maker,c.tokenA,tokenAbi(),'approve',[ex,o.sellAmount]);await send(maker,ex,artifact.abi,'createOrder',o.args);return o;}
const balance=(token,address)=>read(token,tokenAbi(),'balanceOf',[address]);
async function test(name,fn){await chain.reset();c=chain.env().contracts;for(const a of accounts)await chain.rpc('anvil_setBalance',[a.address,'0x8ac7230489e80000']);await chain.setupWrite(c.tokenA,'mint',[maker.address,100000000n]);await chain.setupWrite(c.tokenB,'mint',[taker.address,100000000n]);
  try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.stack});throw e;}}
try{
 await chain.start();
 await test('T04 insufficient allowance rolls back both assets; open escrow remains refundable',async()=>{
   const ex=await exchange(),o=await make(ex);const before=[await balance(c.tokenB,taker.address),await balance(c.tokenB,maker.address),await balance(c.tokenA,taker.address)];
   await send(taker,ex,artifact.abi,'fillOrder',[o.id],'reverted');assert.deepEqual([await balance(c.tokenB,taker.address),await balance(c.tokenB,maker.address),await balance(c.tokenA,taker.address)],before);
   assert.equal(Number((await read(ex,artifact.abi,'getOrder',[o.id])).state),1);await send(maker,ex,artifact.abi,'cancelOrder',[o.id]);assert.equal(await balance(c.tokenA,maker.address),100000000n);
 });
 await test('T04 insufficient balance after approval has no unilateral delivery',async()=>{
   const ex=await exchange(),o=await make(ex);await send(taker,c.tokenB,tokenAbi(),'approve',[ex,20000000n]);await send(taker,c.tokenB,tokenAbi(),'transfer',[outsider.address,100000000n]);
   await send(taker,ex,artifact.abi,'fillOrder',[o.id],'reverted');assert.equal(await balance(c.tokenA,taker.address),0n);assert.equal(await balance(c.tokenB,maker.address),0n);assert.equal(await balance(c.tokenA,ex),10000000n);
 });
 await test('T05 wrong taker, wrong terms hash, unknown asset and zero amount are rejected',async()=>{
   const ex=await exchange(),o=await make(ex);await send(outsider,ex,artifact.abi,'fillOrder',[o.id],'reverted');
   const bad=await order(ex);bad.args[7]='0x'+'00'.repeat(32);await send(maker,ex,artifact.abi,'createOrder',bad.args,'reverted');
   const foreign=await order(ex,{sellToken:outsider.address});await send(maker,ex,artifact.abi,'createOrder',foreign.args,'reverted');
   const zero=await order(ex,{sellAmount:0n});await send(maker,ex,artifact.abi,'createOrder',zero.args,'reverted');
 });
 await test('T05 session scope and exchange address bind terms and order IDs',async()=>{
   const first=await exchange(),second=await exchange(),o=await order(first);await send(maker,c.tokenA,tokenAbi(),'approve',[second,10000000n]);
   await send(maker,second,artifact.abi,'createOrder',o.args,'reverted');assert.notEqual(await read(second,artifact.abi,'orderIdFor',[maker.address,o.salt]),o.id);
 });
 await test('T06/T07 same salt cannot double lock, repeated fill cannot double pay',async()=>{
   const ex=await exchange(),o=await make(ex);await send(maker,c.tokenA,tokenAbi(),'approve',[ex,10000000n]);await send(maker,ex,artifact.abi,'createOrder',o.args,'reverted');
   assert.equal(await balance(c.tokenA,ex),10000000n);assert.equal(await read(ex,artifact.abi,'orderIdFor',[maker.address,o.salt]),o.id);
   await send(taker,c.tokenB,tokenAbi(),'approve',[ex,20000000n]);await send(taker,ex,artifact.abi,'fillOrder',[o.id]);await send(taker,ex,artifact.abi,'fillOrder',[o.id],'reverted');
   assert.equal(await balance(c.tokenA,taker.address),10000000n);assert.equal(await balance(c.tokenB,maker.address),20000000n);
 });
 for(const first of ['cancel','fill'])await test('T08 '+first+' first wins fill/cancel race',async()=>{
   const ex=await exchange(),o=await make(ex);await send(taker,c.tokenB,tokenAbi(),'approve',[ex,20000000n]);
   await chain.setAutomine(false);
   const action=async name=>{const actor=name==='fill'?taker:maker;return wallet(actor).writeContract({address:ex,abi:artifact.abi,functionName:name==='fill'?'fillOrder':'cancelOrder',args:[o.id],gas:800000n,nonce:await pc().getTransactionCount({address:actor.address,blockTag:'pending'})});};
   const a=await action(first),b=await action(first==='fill'?'cancel':'fill');await chain.rpc('evm_mine',[]);
   const ra=await pc().getTransactionReceipt({hash:a}),rb=await pc().getTransactionReceipt({hash:b});
   assert.equal(ra.status,'success');assert.equal(rb.status,'reverted');assert.equal(ra.blockNumber,rb.blockNumber);assert.ok(ra.transactionIndex<rb.transactionIndex);
   await chain.setAutomine(true);
   assert.equal(Number((await read(ex,artifact.abi,'getOrder',[o.id])).state),first==='fill'?2:3);
 });
 for(const delta of [-1,0,1])await test('T09 fill deadline boundary '+delta,async()=>{
   const ex=await exchange(),o=await make(ex);await send(taker,c.tokenB,tokenAbi(),'approve',[ex,20000000n]);
   await chain.rpc('evm_setNextBlockTimestamp',[Number(o.deadline)+delta]);await send(taker,ex,artifact.abi,'fillOrder',[o.id],delta<0?'success':'reverted');
   if(delta>=0){assert.equal(Number((await read(ex,artifact.abi,'getOrder',[o.id])).state),1);await send(outsider,ex,artifact.abi,'expireOrder',[o.id]);assert.equal(await balance(c.tokenA,maker.address),100000000n);}
 });
 await test('T10 multiple open orders and unsolicited donation are not conflated',async()=>{
   const ex=await exchange(),a=await make(ex),b=await make(ex);await chain.setupWrite(c.tokenA,'mint',[outsider.address,3000000n]);await send(outsider,c.tokenA,tokenAbi(),'transfer',[ex,3000000n]);
   assert.equal(await balance(c.tokenA,ex),23000000n);assert.equal(await read(ex,artifact.abi,'outstanding',[c.tokenA]),20000000n);
   await send(taker,c.tokenB,tokenAbi(),'approve',[ex,20000000n]);await send(taker,ex,artifact.abi,'fillOrder',[a.id]);await send(maker,ex,artifact.abi,'cancelOrder',[b.id]);
   assert.equal(await balance(c.tokenA,ex),3000000n);assert.equal(await read(ex,artifact.abi,'outstanding',[c.tokenA]),0n);assert.equal(await balance(c.tokenA,maker.address),90000000n);
 });
 await test('T03 existing approvals are consumed as base units without being mistaken for new approvals',async()=>{
   const ex=await exchange(),o=await order(ex);await send(maker,c.tokenA,tokenAbi(),'approve',[ex,50000000n]);await send(taker,c.tokenB,tokenAbi(),'approve',[ex,60000000n]);
   await send(maker,ex,artifact.abi,'createOrder',o.args);await send(taker,ex,artifact.abi,'fillOrder',[o.id]);
   assert.equal(await read(c.tokenA,tokenAbi(),'allowance',[maker.address,ex]),40000000n);assert.equal(await read(c.tokenB,tokenAbi(),'allowance',[taker.address,ex]),40000000n);
 });
 await test('T07 gateway reconciles lost create response by sender nonce and original salt without another payment',async()=>{
   const {ScenarioService,Scenario}=await import('../src/scenario/service.mjs');let locked=false;
   const svc=new ScenarioService({...lib,chain,root,data:join(root,'data-contract-scenarios'),clean:v=>JSON.parse(JSON.stringify(v,(_k,x)=>typeof x==='bigint'?String(x):x)),addSecret:()=>{},
     lock:()=>{assert.equal(locked,false);locked=true;},unlock:()=>{locked=false;}});
   const s=new Scenario(svc,{manual:true});await s.start();
   while(s.agents[0].stage<2)await s.step();
   const a=s.agents[0],sendOriginal=a.client.sendTransaction.bind(a.client);let submissions=0;
   a.client.sendTransaction=async request=>{submissions++;const h=await sendOriginal(request);if(submissions===1)throw Error('SIMULATED_RPC_RESPONSE_LOSS');return h;};
   while(!s.proposedOrderId)await s.step();
   assert.equal(s.pending.length,1);assert.equal(s.pending[0].state,'unknown');assert.equal(s.pending[0].hash,undefined);
   for(let i=0;i<30&&s.state!=='completed';i++)await s.step();
   assert.equal(s.check.status,'success',JSON.stringify(s.check));assert.equal(submissions,1);assert.equal(s.transactions.filter(t=>t.functionName==='createOrder').length,1);assert.equal(locked,false);
   await mkdir(artifactDirectory('fixtures/peer-v014'),{recursive:true});await writeFile(artifactPath('fixtures/peer-v014/07-response-loss-reconciled.json'),JSON.stringify(await s.bundle(),null,2));
 });
}finally{await writeFile(artifactPath('v014-contract-results.json'),JSON.stringify({compiler:artifact.compiler,realEVM:true,results},null,2));await chain.stop();}
