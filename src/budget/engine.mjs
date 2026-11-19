import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ROOT,library,config,units,clone,sha} from './common.mjs';
import {checkEvidence,seal} from './checker.mjs';
import {violations} from './policy.mjs';
import {createBudgetWallet,WalletRejection} from './wallet.mjs';
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function freePort(){
 const s=createServer();await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});const p=s.address().port;await new Promise(r=>s.close(r));return p;
}
export class LabChain {
 async start(port){
  this.lib=await library();this.port=port??await freePort();this.url='http://127.0.0.1:'+this.port;
  const probe=createServer();await new Promise((r,j)=>{probe.once('error',j);probe.listen(this.port,'127.0.0.1',r);});await new Promise(r=>probe.close(r));
  const anvil=join(ROOT,'runtime',process.platform==='win32'?'anvil.exe':'anvil');
  this.process=spawn(anvil,['--host','127.0.0.1','--port',String(this.port),'--chain-id','31337','--hardfork','cancun','--silent'],{cwd:ROOT,windowsHide:true,stdio:['ignore','pipe','pipe']});
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
const walletRejections=new Set(['TASK_BUDGET_EXCEEDED','TRANSFER_DISABLED','PERMIT_DISABLED','SESSION_EXPIRED','PERMIT_EXPIRED','PERMIT_ALREADY_PENDING','NO_PENDING_PERMIT','PERMIT_SIGNATURE_REJECTED']);
export class BudgetExperiment {
 constructor(chain,input={},notify=()=>{},decide,{buildHash}={}){
  this.chain=chain;this.config=Object.freeze(config(input));this.notify=notify;
  Object.freeze(this.config.wallet);
  if(this.config.taskGoal)Object.freeze(this.config.taskGoal);
  if(this.config.sample)Object.freeze(this.config.sample);
  const {backend,transfer,permit2,limit}=this.config.wallet;
  this.taskAuthorization=Object.freeze({budget:String(units(this.config.budget))});
  this.walletRequest=Object.freeze({backend,limit:String(units(limit)),capabilities:Object.freeze({transfer,permit2})});
  this.id=randomUUID();this.sessionId=randomUUID();this.stage='initializing';this.events=[];this.transactions=[];this.working=false;this.startedAt=new Date().toISOString();
  this.decide=decide;this.abortController=new AbortController();this.messages=[];this.agentSteps=0;this.pendingPermit=null;
  this.buildHash=buildHash;
 }
 event(type,payload={}){this.events.push({index:this.events.length+1,time:new Date().toISOString(),executionId:this.id,sessionId:this.sessionId,agentId:'budget-agent',type,payload:clone(payload)});this.notify(this.view());}
 scope(extra={}){return {executionId:this.id,sessionId:this.sessionId,...extra};}
 get signer(){return this.wallet?.signer;}
 async write(wallet,address,artifact,functionName,args){
  const hash=await wallet.writeContract({address,abi:artifact.abi,functionName,args,gas:6000000n});await this.record(hash,functionName);return hash;
 }
 async record(hash,action){
  const r=await this.pc.waitForTransactionReceipt({hash,timeout:20000,pollingInterval:40}),t=await this.pc.getTransaction({hash});
  const entry=clone({hash,action,from:t.from,to:t.to,nonce:t.nonce,status:r.status,blockNumber:r.blockNumber,blockHash:r.blockHash,gasUsed:r.gasUsed,logs:r.logs,timestamp:(await this.pc.getBlock({blockNumber:r.blockNumber})).timestamp});
  this.transactions.push(entry);this.notify(this.view());if(r.status!=='success')throw Error('CHAIN_REVERT');return r;
 }
 markFailed(error,fallback){
  this.stage='error';this.error=errorCode(error,fallback);this.endedAt=new Date().toISOString();
  this.event('experiment.error',{reason:this.error,step:this.agentSteps});
 }
 abort(){this.abortController.abort();}
 assertActive(){if(this.stopping||this.abortController.signal.aborted)throw Error('EXPERIMENT_STOPPING');}
 async initialize(){
  this.assertActive();
  this.lib=this.chain.lib;this.pc=this.chain.pc;
  this.buildHash??=JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash;
  if(typeof this.decide!=='function')throw Error('MODEL_REQUIRED');
  this.tokenArtifact=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/LabToken.json'),'utf8'));
  this.permitArtifact=JSON.parse(await readFile(join(ROOT,'contracts/artifacts/Permit2.json'),'utf8'));
  const account=()=>this.lib.privateKeyToAccount('0x'+randomBytes(32).toString('hex'));
  const deployer=account(),relayer=account(),recipient=account();this.recipient=recipient.address;
  for(const address of [deployer.address,relayer.address]){this.assertActive();await this.chain.fund(address);}
  const client=a=>this.lib.createWalletClient({account:a,chain:this.lib.localChain,transport:this.lib.http(this.chain.url,{retryCount:0})});
  const admin=client(deployer);
  const deploy=async(artifact,args)=>{this.assertActive();const hash=await admin.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args,gas:7000000n});return (await this.record(hash,'setup.deploy')).contractAddress;};
  this.token=await deploy(this.tokenArtifact,['Budget Test Token','BUD']);
  this.permit2=await deploy(this.permitArtifact,[]);
  this.wallet=createBudgetWallet({chain:this.chain,config:this.config,token:this.token,permit2:this.permit2,permitArtifact:this.permitArtifact,
   recipient:this.recipient,admin,relayer:client(relayer),createClient:client,deploy,record:(hash,action)=>this.record(hash,action),
   scope:extra=>this.scope(extra),assertActive:()=>this.assertActive()});
  await this.wallet.prepare();this.assertActive();this.owner=this.wallet.address;this.spender=this.wallet.spender;
  await this.write(admin,this.token,this.tokenArtifact,'mint',[this.owner,units(this.config.initial)]);
  this.assertActive();this.ledger=await this.wallet.open();this.initial=await this.snapshot();
  if(this.config.policy?.enabled){this.policy={...this.config.policy,opensAt:this.initial.timestamp,expiresAt:String(BigInt(this.initial.timestamp)+BigInt(this.config.policy.windowHours*3600)),recipient:this.recipient,spender:this.spender,contract:this.permit2,layer:'experiment_gateway'};for(const [k,symbol,address]of [['allowedRecipients','service',this.recipient],['allowedSpenders','spender',this.spender],['allowedContracts','permit2',this.permit2]])this.policy[k]=this.policy[k].map(x=>x===symbol?address:x);}
  this.walletGrant={...this.wallet.grant,allowanceAtOpen:this.initial.allowance,observedAtBlock:this.initial.blockNumber};
  this.stage='decision';this.event('session.opened',{owner:this.owner,signerPid:this.signer?.pid,controllerPid:process.pid,token:this.token,permit2:this.permit2,spender:this.spender,recipient:this.recipient,budget:this.config.budget,initial:this.initial,mode:'unified',
   taskAuthorization:this.taskAuthorization,taskGoal:this.config.taskGoal??null,walletRequest:this.walletRequest,walletGrant:this.walletGrant});
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
  if(this.working)throw Error('EXPERIMENT_BUSY');
  if(this.stage!=='decision')throw Error('EXPERIMENT_FINISHED');
  this.working=true;
  const step=++this.agentSteps;
  try{
   let decision;
   try{
    decision=await this.decide({
     state:clone({task:this.config.task,budget:this.config.budget,owner:this.owner,recipient:this.recipient,spender:this.spender,token:this.token,permit2:this.permit2,
      walletGrant:this.walletGrant,taskGoal:this.config.taskGoal,policy:this.policy,ledger:this.ledger,pendingPermit:this.pendingPermit,blocked:this.blocked??null,step,maxSteps:this.config.maxSteps}),
     messages:clone(this.messages),signal:this.abortController.signal,
     record:(kind,payload)=>this.event(`model.${kind}`,payload)
    });
    if(typeof decision?.invoke!=='function')throw Error('MODEL_INVALID_TOOL_CALL');
   }catch(error){
    this.assertActive();
    this.agentOutcome='model_error';this.error=errorCode(error,'MODEL_DECISION_FAILED');
    this.event('agent.stopped',{outcome:this.agentOutcome,reason:this.error,step});
    await this.finish();return this.view();
   }
   this.assertActive();
   const {name,args,assistant}=decision;
   const toolCallId=assistant?.tool_calls?.[0]?.id??`budget-action-${step}`;
   this.event('agent.tool_call',{name,args,step,toolCallId});
   const result=await decision.invoke((tool,args)=>this.executeTool(tool,args,{toolCallId}));
   this.event('agent.tool_result',{name,result,step,toolCallId});
   this.messages.push(assistant??{role:'assistant',content:null,tool_calls:[{id:toolCallId,type:'function',function:{name,arguments:JSON.stringify(args)}}]},
    {role:'tool',tool_call_id:toolCallId,content:JSON.stringify(result)});
   if(this.stage!=='review'&&(result?.status==='finished'||step>=this.config.maxSteps)){
    this.agentOutcome=result?.status==='finished'?'finished':'step_limit';
    this.event('agent.stopped',{outcome:this.agentOutcome,step});
    await this.finish();
   }
  }catch(e){
   this.markFailed(e,'CHAIN_OR_SIGNER_ERROR');throw Error(this.error);
  }finally{this.working=false;this.notify(this.view());}
  return this.view();
 }
 rejectTool(name,args,reason,{layer='agent_tool',walletResult=null,toolCallId}={}){
  const rejection={reason,layer,walletReached:walletResult!==null,walletResult};
  const decision={step:this.agentSteps,tool:name,toolCallId,...rejection};
  if(reason==='TASK_BUDGET_EXCEEDED'){
   this.blocked={stage:this.stage,...decision,amount:args?.amount};
   this.event('budget.rejected',this.blocked);
  }else this.event('permission.rejected',decision);
  return {status:'rejected',...rejection,ledger:this.ledger,pendingPermit:this.pendingPermit};
 }
 async executeTool(name,args,{approved=false,toolCallId}={}){
  this.assertActive();
  const reject=(reason,layer,walletResult)=>this.rejectTool(name,args,reason,{layer,walletResult,toolCallId});
  if(name==='finish_task')return {status:'finished',ledger:this.ledger,pendingPermit:this.pendingPermit};
  if(name==='redeem_permit2'){
   if(this.policy&&(await this.pc.getBlock()).timestamp>=BigInt(this.policy.expiresAt))return reject('POLICY_WINDOW_EXPIRED','experiment_gateway');
   if(!this.signed)return reject('NO_PENDING_PERMIT');
   try{
    const hash=await this.redeem();
    return {status:'confirmed',hash,layer:'permit2_protocol',ledger:this.ledger,pendingPermit:this.pendingPermit};
   }catch(error){
    if(error instanceof WalletRejection&&walletRejections.has(error.message))return reject(error.message,error.layer,error.walletResult);
    throw error;
   }
  }
  if(name!=='transfer_tokens'&&name!=='authorize_permit2')throw Error('UNKNOWN_BUDGET_TOOL');
  let amountBase;
  try{amountBase=units(args?.amount);}catch(e){return reject(errorCode(e,'INVALID_AMOUNT'));}
  const amount=args.amount;
  const payment=name==='transfer_tokens';
  if(!payment&&this.signed)return reject('PERMIT_ALREADY_PENDING');
  const goal=this.config.taskGoal;
  if(goal){
   const used=payment?BigInt(this.ledger.transactionSpent):BigInt(this.ledger.spent)-BigInt(this.ledger.transactionSpent)+BigInt(this.ledger.reserved);
   const required=units(payment?goal.direct:goal.permit2,true)-used;
   if(amountBase>required||(goal.mode==='exact'&&amountBase!==required))return reject('TASK_AMOUNT_MISMATCH');
  }
  if(BigInt(this.ledger.spent)+BigInt(this.ledger.reserved)+amountBase>BigInt(this.taskAuthorization.budget))return reject('TASK_BUDGET_EXCEEDED','experiment_gateway');
  if(this.policy){
   if(!payment&&!this.delayApplied){this.delayApplied=true;if(this.policy.delaySeconds){await this.chain.rpc('evm_increaseTime',[this.policy.delaySeconds]);await this.chain.rpc('evm_mine');}}
   const now=(await this.pc.getBlock()).timestamp;
   if(now>=BigInt(this.policy.expiresAt))return reject('POLICY_WINDOW_EXPIRED','experiment_gateway');
   const reasons=violations(this.policy,!payment);
   if(reasons.length&&!approved){
    this.event('policy.decision',{tool:name,toolCallId,amount,reasons,outcome:this.policy.onViolation});
    if(this.policy.onViolation==='review'){
     this.pendingReview={reviewId:randomUUID(),name,toolCallId,args:clone(args),reasons,recipient:this.recipient};this.stage='review';this.event('policy.review',this.pendingReview);
     return {status:'review',reasons,ledger:this.ledger};
    }
    return reject(reasons[0],'experiment_gateway');
   }
   this.event('policy.decision',{tool:name,toolCallId,amount,outcome:approved?'human_exception':'allow',reasons});
  }
  const layer=this.wallet.layer;
  this.event(payment?'transaction.request':'permit.request',{amount,layer,ledger:this.ledger});
  let result;
  try{
   this.assertActive();
   result=await (payment?this.wallet.pay(amount):this.wallet.authorize(amount));
  }catch(e){
   if(e instanceof WalletRejection&&walletRejections.has(e.message))return reject(e.message,e.layer,e.walletResult);
   throw e;
  }
  this.ledger=result.ledger;
  if(payment){
   await this.record(result.hash,'task.payment');
   this.event('transaction.confirmed',{hash:result.hash,layer,ledger:this.ledger});
   return {status:'confirmed',hash:result.hash,layer,ledger:this.ledger,pendingPermit:this.pendingPermit};
  }
  this.signed=result;
  const {nonce,deadline,permitted}=result.typedData.message;
  this.pendingPermit={nonce,deadline,amountBase:permitted.amount};
  this.event('permit.signed',{typedData:result.typedData,signatureHash:sha(result.signature),reservationHash:result.reservationHash,verification:result.verification,layer,ledger:result.ledger});
  return {status:'reserved',layer,ledger:this.ledger,pendingPermit:this.pendingPermit};
 }
 async review({reviewId,decision}){
  this.assertActive();if(this.working)throw Error('EXPERIMENT_BUSY');
  if(this.stage!=='review'||!this.pendingReview||reviewId!==this.pendingReview.reviewId||!['approve','reject'].includes(decision))throw Error('REVIEW_SCOPE');
  this.working=true;
  try{
   const p=this.pendingReview;this.pendingReview=null;this.stage='decision';
   this.event('policy.review_decided',{...p,decision});
   const result=decision==='approve'?await this.executeTool(p.name,p.args,{approved:true,toolCallId:p.toolCallId}):
    this.rejectTool(p.name,p.args,'HUMAN_REJECTED',{layer:'human_review',toolCallId:p.toolCallId});
   this.event('agent.tool_result',{name:p.name,result,step:this.agentSteps,toolCallId:p.toolCallId});
   const last=this.messages.at(-1);if(last?.role==='tool')last.content=JSON.stringify(result);
   if(this.agentSteps>=this.config.maxSteps){this.agentOutcome='step_limit';await this.finish();}
   return this.view();
  }catch(error){
   this.markFailed(error,'CHAIN_OR_SIGNER_ERROR');throw Error(this.error);
  }finally{this.working=false;this.notify(this.view());}
 }
 async redeem(){
  this.assertActive();
  const m=this.signed.typedData.message;
  this.event('relayer.submit',{spender:this.spender,submitter:this.walletGrant.submitter,owner:this.owner,amount:m.permitted.amount,nonce:m.nonce});
  const hash=await this.wallet.submitRedemption(this.signed);
  this.event('relayer.broadcast',{hash,nonce:m.nonce});
  const r=await this.record(hash,'relayer.redeem');
  this.ledger=await this.wallet.confirmRedemption(hash,m.nonce);
  this.signed=null;this.pendingPermit=null;
  this.event('relayer.confirmed',{hash,status:r.status,nonce:m.nonce,layer:'permit2_protocol',ledger:this.ledger});return hash;
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
  this.evidence=clone({schema:'cross-path-budget-v4',executionId:this.id,sessionId:this.sessionId,config:this.config,chainId:31337,owner:this.owner,spender:this.spender,recipient:this.recipient,token:this.token,permit2:this.permit2,
   taskAuthorization:this.taskAuthorization,walletRequest:this.walletRequest,
   policy:this.policy,pendingReview:this.pendingReview??null,walletGrant:this.walletGrant,initial:this.initial,final:this.final,ledger:this.ledger,blocked:this.blocked??null,pendingPermit:this.pendingPermit,transactions:this.transactions,transfers:this.transfers,events:this.events,
   agentOutcome:this.agentOutcome,agentSteps:this.agentSteps,error:this.error,
   startedAt:this.startedAt,endedAt:this.endedAt,provenance,buildHash:this.buildHash,archive:{status:'complete'},
   permit2CodeHash:this.lib.keccak256(await this.pc.getBytecode({address:this.permit2})),
   scope:'Model-selected payments on the isolated lab chain under one task wallet grant.'});
  this.check=checkEvidence(this.evidence);this.bundle=seal(this.evidence);this.stage='completed';this.event('checker.result',this.check);
  return this.view();
 }
 async run(){while(!['completed','error','review'].includes(this.stage))await this.step();return this.view();}
 view(){return clone({policy:this.policy,pendingReview:this.pendingReview,id:this.id,sessionId:this.sessionId,config:this.config,stage:this.stage,working:this.working,owner:this.owner,spender:this.spender,recipient:this.recipient,token:this.token,permit2:this.permit2,signerPid:this.signer?.pid,taskAuthorization:this.taskAuthorization,walletRequest:this.walletRequest,walletGrant:this.walletGrant,initial:this.initial,final:this.final,ledger:this.ledger,blocked:this.blocked,pendingPermit:this.pendingPermit,agentOutcome:this.agentOutcome,agentSteps:this.agentSteps,events:this.events,transactions:this.transactions,check:this.check,error:this.error,startedAt:this.startedAt,endedAt:this.endedAt});}
 async close(){this.abort();this.signed=null;this.decide=null;this.messages=[];await this.wallet?.close();}
}

function errorCode(error,fallback){return /^[A-Z][A-Z0-9_]+$/.test(error?.message??'')?error.message:fallback;}
