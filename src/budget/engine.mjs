import {spawn,fork} from 'node:child_process';
import {createServer} from 'node:net';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ROOT,library,config,units,clone,sha,stringify} from './common.mjs';
import {checkEvidence,seal} from './checker.mjs';
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function freePort(){
 const s=createServer();await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});const p=s.address().port;await new Promise(r=>s.close(r));return p;
}
export class LabChain {
 async start(port){
  this.lib=await library();this.port=port??await freePort();this.url='http://127.0.0.1:'+this.port;
  const probe=createServer();await new Promise((r,j)=>{probe.once('error',j);probe.listen(this.port,'127.0.0.1',r);});await new Promise(r=>probe.close(r));
  this.process=spawn(join(ROOT,'runtime/anvil.exe'),['--host','127.0.0.1','--port',String(this.port),'--chain-id','31337','--hardfork','cancun','--silent'],{cwd:ROOT,windowsHide:true,stdio:['ignore','pipe','pipe']});
  this.log='';this.process.stdout.on('data',b=>this.log=(this.log+b).slice(-3000));this.process.stderr.on('data',b=>this.log=(this.log+b).slice(-3000));this.process.on('error',e=>this.error=e.message);
  this.pc=this.lib.createPublicClient({chain:this.lib.localChain,transport:this.lib.http(this.url,{retryCount:0,timeout:2000}),cacheTime:0});
  for(let i=0;i<100;i++){
   if(this.error||this.process.exitCode!==null)throw Error('ANVIL_START_FAILED '+(this.error??this.log));
   try{if(await this.pc.getChainId()===31337)return this;}catch{}await sleep(100);
  }throw Error('ANVIL_START_TIMEOUT');
 }
 async rpc(method,params=[]){return this.pc.request({method,params});}
 async fund(address){await this.rpc('anvil_setBalance',[address,'0x8ac7230489e80000']);}
 async stop(){if(this.process&&this.process.exitCode===null){const p=this.process;const done=new Promise(r=>p.once('exit',r));p.kill();await Promise.race([done,sleep(3000)]);}}
}
class Signer {
 async start(){
  this.pending=new Map();this.child=fork(join(ROOT,'src/budget/signer.mjs'),[],{cwd:ROOT,windowsHide:true,stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,LAB_LIBRARY_ONLY:'1',LAB_AGENT_WORKER:'1'}});
  this.log='';this.child.stdout.on('data',b=>this.log=(this.log+b).slice(-1000));this.child.stderr.on('data',b=>this.log=(this.log+b).slice(-1000));
  this.ready=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('SIGNER_START_TIMEOUT')),15000);
   this.child.on('message',m=>{if(m.ready){clearTimeout(timer);this.address=m.address;this.pid=m.pid;resolve();return;}
    const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error)):p.resolve(m.result);}});
   this.child.once('error',e=>{clearTimeout(timer);reject(e);});
   this.child.once('exit',()=>{clearTimeout(timer);reject(Error('SIGNER_EXIT'));for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('SIGNER_EXIT'));}this.pending.clear();});
  });
  await this.ready;return this;
 }
 call(method,body={}){
  const id=randomUUID();return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('SIGNER_TIMEOUT'));},30000);
   this.pending.set(id,{resolve,reject,timer});this.child.send({id,method,body},e=>{if(e){clearTimeout(timer);this.pending.delete(id);reject(e);}});
  });
 }
 async stop(){if(this.child&&this.child.exitCode===null){const p=this.child,done=new Promise(r=>p.once('exit',r));if(p.connected)p.disconnect();await Promise.race([done,sleep(1500)]);if(p.exitCode===null)p.kill();}}
}
export class BudgetExperiment {
 constructor(chain,input={},notify=()=>{}){
  this.chain=chain;this.lib=chain.lib;this.pc=chain.pc;this.config=config(input);this.notify=notify;
  this.id=randomUUID();this.sessionId=randomUUID();this.stage='initializing';this.events=[];this.transactions=[];this.working=false;this.startedAt=new Date().toISOString();
 }
 event(type,payload={}){this.events.push({index:this.events.length+1,time:new Date().toISOString(),executionId:this.id,sessionId:this.sessionId,agentId:'budget-agent',type,payload:clone(payload)});this.notify(this.view());}
 scope(extra={}){return {executionId:this.id,sessionId:this.sessionId,...extra};}
 async write(wallet,address,artifact,functionName,args){
  const hash=await wallet.writeContract({address,abi:artifact.abi,functionName,args,gas:6000000n});await this.record(hash,functionName);return hash;
 }
 async record(hash,action){
  const r=await this.pc.waitForTransactionReceipt({hash,timeout:20000,pollingInterval:40}),t=await this.pc.getTransaction({hash});
  const entry=clone({hash,action,from:t.from,to:t.to,nonce:t.nonce,status:r.status,blockNumber:r.blockNumber,blockHash:r.blockHash,gasUsed:r.gasUsed,logs:r.logs});
  this.transactions.push(entry);if(r.status!=='success')throw Error('CHAIN_REVERT');return r;
 }
 assertActive(){if(this.stopping)throw Error('EXPERIMENT_STOPPING');}
 async initialize(){
  this.assertActive();
  this.tokenArtifact=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/LabToken.json'),'utf8'));
  this.permitArtifact=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/Permit2.json'),'utf8'));
  this.assertActive();this.signer=new Signer();await this.signer.start();this.assertActive();this.owner=this.signer.address;
  const account=()=>this.lib.privateKeyToAccount('0x'+randomBytes(32).toString('hex'));
  const deployer=account(),relayer=account(),recipient=account();this.spender=relayer.address;this.recipient=recipient.address;
  for(const address of [deployer.address,relayer.address,this.owner]){this.assertActive();await this.chain.fund(address);}
  const client=a=>this.lib.createWalletClient({account:a,chain:this.lib.localChain,transport:this.lib.http(this.chain.url,{retryCount:0})});
  const admin=client(deployer);this.relayer=client(relayer);
  const deploy=async(artifact,args)=>{this.assertActive();const hash=await admin.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args,gas:7000000n});return (await this.record(hash,'setup.deploy')).contractAddress??(await this.pc.getTransactionReceipt({hash})).contractAddress;};
  this.token=await deploy(this.tokenArtifact,['Budget Test Token','BUD']);
  this.permit2=await deploy(this.permitArtifact,[]);
  await this.write(admin,this.token,this.tokenArtifact,'mint',[this.owner,units(this.config.initial)]);
  this.assertActive();const approval=await this.signer.call('bootstrap',{rpcUrl:this.chain.url,token:this.token,permit2:this.permit2,initial:this.config.initial,spender:this.spender,recipient:this.recipient});
  await this.record(approval.hash,'setup.approvePermit2');
  this.initial=await this.snapshot();
  this.assertActive();this.ledger=await this.signer.call('open',this.scope({budget:this.config.budget,mode:this.config.mode}));
  this.stage='payment';this.event('session.opened',{owner:this.owner,signerPid:this.signer.pid,controllerPid:process.pid,token:this.token,permit2:this.permit2,spender:this.spender,recipient:this.recipient,budget:this.config.budget,initial:this.initial,mode:this.config.mode});
  return this;
 }
 async snapshot(){
  const b=await this.pc.getBlock({blockTag:'latest'});
  const balance=await this.pc.readContract({address:this.token,abi:this.tokenArtifact.abi,functionName:'balanceOf',args:[this.owner],blockNumber:b.number});
  const allowance=await this.pc.readContract({address:this.token,abi:this.tokenArtifact.abi,functionName:'allowance',args:[this.owner,this.permit2],blockNumber:b.number});
  return clone({balance,allowance,blockNumber:b.number,blockHash:b.hash,timestamp:b.timestamp});
 }
 async step(){
  this.assertActive();
  if(this.working)throw Error('EXPERIMENT_BUSY');if(['completed','error'].includes(this.stage))throw Error('EXPERIMENT_FINISHED');
  this.working=true;
  try{
   if(this.stage==='payment'){
    if(units(this.config.payment,true)>0n){
     this.event('transaction.request',{amount:this.config.payment});
     const r=await this.signer.call('pay',this.scope({amount:this.config.payment}));this.ledger=r.ledger;await this.record(r.hash,'task.payment');
     this.event('transaction.confirmed',{hash:r.hash,ledger:this.ledger,balance:(await this.snapshot()).balance});
    }else this.event('transaction.skipped');
    this.stage='authorization';
   }else if(this.stage==='authorization'){
    const method=this.config.secondPath==='transaction'?'pay':'permit';
    this.event(method+'.request',{amount:this.config.permit,ledger:this.ledger});
    const r=await this.signer.call(method,this.scope({amount:this.config.permit}));this.ledger=r.ledger;
    if(method==='pay'){await this.record(r.hash,'task.secondPayment');this.event('transaction.confirmed',{hash:r.hash,ledger:this.ledger});this.stage='check';}
    else{
     this.signed=r;this.event('permit.signed',{typedData:r.typedData,signatureHash:sha(r.signature),ledger:r.ledger});
     this.stage='redemption';
    }
   }else if(this.stage==='redemption'){
    await this.redeem();this.stage='check';
   }else if(this.stage==='check')return await this.finish();
  }catch(e){
   if(e.message==='TASK_BUDGET_EXCEEDED'){
    this.blocked={stage:this.stage,reason:e.message};this.event('budget.rejected',this.blocked);this.stage='check';
   }else {this.stage='error';this.error=/^[A-Z][A-Z0-9_]+$/.test(e.message)?e.message:'CHAIN_OR_SIGNER_ERROR';this.event('experiment.error',{reason:this.error});throw Error(this.error);}
  }finally{this.working=false;this.notify(this.view());}
  return this.view();
 }
 async redeem({replay=false,wrongSpender=false}={}){
  this.assertActive();
  if(!this.signed)throw Error('NO_PERMIT');
  const m=this.signed.typedData.message;
  const permit={permitted:{token:m.permitted.token,amount:BigInt(m.permitted.amount)},nonce:BigInt(m.nonce),deadline:BigInt(m.deadline)};
  let wallet=this.relayer;
  if(wrongSpender){const a=this.lib.privateKeyToAccount('0x'+randomBytes(32).toString('hex'));await this.chain.fund(a.address);wallet=this.lib.createWalletClient({account:a,chain:this.lib.localChain,transport:this.lib.http(this.chain.url,{retryCount:0})});}
  this.event('relayer.submit',{spender:wallet.account.address,owner:this.owner,amount:String(permit.permitted.amount),nonce:String(permit.nonce),replay,wrongSpender});
  const hash=await wallet.writeContract({address:this.permit2,abi:this.permitArtifact.abi,functionName:'permitTransferFrom',args:[permit,{to:this.recipient,requestedAmount:permit.permitted.amount},this.owner,this.signed.signature],gas:500000n});
  const r=await this.record(hash,replay?'relayer.replay':wrongSpender?'relayer.wrongSpender':'relayer.redeem');
  if(!replay&&!wrongSpender)this.ledger=await this.signer.call('settle',this.scope({hash,nonce:String(m.nonce)}));
  this.event('relayer.confirmed',{hash,status:r.status,ledger:this.ledger});return hash;
 }
 async finish(){
  this.final=await this.snapshot();
  const reference=await this.pc.getBlock({blockNumber:BigInt(this.initial.blockNumber)});
  if(reference.hash!==this.initial.blockHash)throw Error('REFERENCE_BLOCK_CHANGED');
  const logs=BigInt(this.final.blockNumber)>BigInt(this.initial.blockNumber)?await this.pc.getLogs({address:this.token,fromBlock:BigInt(this.initial.blockNumber)+1n,toBlock:BigInt(this.final.blockNumber)}):[];
  this.transfers=[];
  for(const log of logs){
   try{const d=this.lib.decodeEventLog({abi:this.tokenArtifact.abi,...log});if(d.eventName==='Transfer'){this.transfers.push(clone({...d.args,transactionHash:log.transactionHash,blockNumber:log.blockNumber,logIndex:log.logIndex}));if(!this.transactions.some(t=>t.hash===log.transactionHash))await this.record(log.transactionHash,'external.observed');}}catch(e){if(e.message==='CHAIN_REVERT')throw e;}
  }
  this.endedAt=new Date().toISOString();
  const provenance=JSON.parse(await readFile(join(ROOT,'contracts/upstream/provenance.json'),'utf8'));
  const build=JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8'));
  this.evidence=clone({schema:'cross-path-budget-v1',executionId:this.id,sessionId:this.sessionId,config:this.config,chainId:31337,owner:this.owner,spender:this.spender,recipient:this.recipient,token:this.token,permit2:this.permit2,
   initial:this.initial,final:this.final,ledger:this.ledger,blocked:this.blocked??null,transactions:this.transactions,transfers:this.transfers,events:this.events,
   startedAt:this.startedAt,endedAt:this.endedAt,provenance,buildHash:build.sourceHash,
   permit2CodeHash:this.lib.keccak256(await this.pc.getBytecode({address:this.permit2})),
   scope:'Added research adapter with a software-restricted EOA signer. Split policy is intentional. Not a V0.15.1 vulnerability or a smart-account session-key demonstration.'});
  this.check=checkEvidence(this.evidence);this.bundle=seal(this.evidence);this.stage='completed';this.event('checker.result',this.check);
  return this.view();
 }
 async run(){while(!['completed','error'].includes(this.stage))await this.step();return this.view();}
 view(){return clone({id:this.id,sessionId:this.sessionId,config:this.config,stage:this.stage,working:this.working,owner:this.owner,spender:this.spender,recipient:this.recipient,token:this.token,permit2:this.permit2,signerPid:this.signer?.pid,initial:this.initial,final:this.final,ledger:this.ledger,blocked:this.blocked,events:this.events,transactions:this.transactions,check:this.check,error:this.error,startedAt:this.startedAt,endedAt:this.endedAt});}
 async close(){this.signed=null;await this.signer?.stop();}
}
