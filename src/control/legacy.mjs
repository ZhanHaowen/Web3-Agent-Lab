import {RemoteScene} from './scene.mjs';import {copy,hash,json} from '../scenario/core.mjs';import {atomicWrite} from '../scenario/durable.mjs';import {join} from 'node:path';
function spec(job){const a={agentId:'agent',role:'agent',walletId:'agent',goal:{},model:{baseUrl:'',model:'',apiKey:'',systemPrompt:'',temperature:0},maxModelCalls:20,maxTokens:100000,maxGasWei:'100000000000000000',tools:['get_balance','transfer_token','approve_token','swap','deposit']};return {...job.runtimeSpec,template:'legacy_task',experimentMode:job.environment.mode,mode:'scripted',manual:!!job.runtimeSpec.manual,maxSteps:30,maxMessages:0,automine:true,agents:[a]};}
export class LegacyScene extends RemoteScene {
 constructor(control,execution,job){super(control,execution,{...job,runtimeSpec:spec(job)});this.legacyTask=job.taskType;this.job=job;this.observations=[];this.planObservations=[];}
 progress(){return {stage:'legacy_'+this.legacyTask,allowedActions:this.spec.agents[0].tools,nextActionHint:'Built-in LegacyTaskAdapter uses the original amount guard, plan and checker.'};}
 async reader(){const c=this.control.b.chain,actor=this.agents[0],self=Object.create(c);self.agent={address:actor.address};self.metadata=copy(c.metadata);self.metadata.accounts.agent=actor.address;self.transactions=[];self.observations=this.observations;
  const publicWallet=this.control.b.createWalletClient({account:actor.address,chain:this.control.b.localChain,transport:this.control.b.http(c.rpcUrl,{retryCount:0})});
  self.walletClient={prepareTransactionRequest:req=>publicWallet.prepareTransactionRequest(req),sendTransaction:async req=>{
   const contracts=c.env().contracts,abi=req.to.toLowerCase()===contracts.amm.toLowerCase()?c.artifacts.LabAMM.abi:req.to.toLowerCase()===contracts.vault.toLowerCase()?c.artifacts.LabVault.abi:c.artifacts.LabToken.abi;
   const decoded=this.control.b.decodeFunctionData({abi,data:req.data});const tx=await this.registry.submit(this,actor,req.to,abi,decoded.functionName,decoded.args??[]);if(!tx.hash)throw Error('TX_HASH_UNKNOWN');return tx.hash;}};
  this.readerChain=self;return self;
 }
 async start(){this.control.b.lock();this.control.current=this.id;this.startedAt=new Date().toISOString();this.startedMono=performance.now();this.state='initializing';await this.emit('scenario.created',{jobId:this.jobId,spec:this.spec});
  const c=this.control.b.chain,a=this.agents[0];if(this.spec.experimentMode==='independent'){await c.reset();await c.setAutomine(true);await c.rpc('anvil_setBalance',[a.address,'0x8ac7230489e80000']);await c.setupWrite(c.env().contracts.tokenA,'mint',[a.address,100000000n]);}
  this.realm={epoch:c.env().chainInstanceId,exchange:c.env().contracts.amm,scope:'0x'+hash(this.id),abi:c.artifacts.LabAMM.abi,accounts:{agent:{address:a.address}},contractCodeHash:this.control.b.keccak256(await c.publicClient.getBytecode({address:c.env().contracts.amm}))};
  await this.reader();this.before=await this.readerChain.state();this.state='running';await this.emit('environment.initial',{state:this.before,actorAddress:a.address});await this.control.saveEnvironment();await this.persist();
 }
 snapshot(){return {...super.snapshot(),observations:this.observations,planObservations:this.planObservations,legacyTask:this.legacyTask};}
 async step(){if(this.abort.signal.aborted)throw Error('SCENARIO_STOPPED');if(!this.readerChain)await this.reader();const actor=this.agents[0];
  const plan=this.control.b.scriptedCalls(this.legacyTask,this.planObservations,this.before,this.spec.experimentMode,this.job.input);
  const command=this.control.pendingDecision(this.id,'agent')??this.control.command(actor.profileId,{type:'step',executionId:this.id,agentRunId:actor.agentRunId,role:'agent',spec:actor.spec,legacyPlan:plan,context:{spec:{mode:'scripted'}},progress:this.progress(),inbox:[]});actor.activeCommand=command.id;
  const response=await this.control.awaitCommand(command.id),call=response.call;const expected=plan[this.steps];if(!call.wait&&JSON.stringify({name:call.name,args:call.args})!==JSON.stringify(expected)||call.wait&&expected)throw Error('LEGACY_PLAN_MISMATCH');this.steps++;if(call.wait){this.control.completeDecision(command.id);await this.finish('legacy_complete');return;}
  this.control.b.validateTaskAmounts({task:this.job.runtimeSpec.task,taskParameters:this.job.input,initialState:this.before,experimentMode:this.spec.experimentMode,amountValidation:'fixed_task'},call.name,call.args,this.planObservations);
  await this.emit('tool.call',{toolCallKey:actor.agentRunId+':'+this.steps,name:call.name,args:call.args},actor);actor.costs.toolCalls++;
  const result=await this.readerChain.execute(call.name,call.args,{emit:(type,payload)=>this.emit(type,payload,actor)});this.observations=this.readerChain.observations;this.planObservations.push({name:call.name,args:call.args,raw:result,visible:result});
  await this.emit('tool.result',{name:call.name,raw:result,visible:result},actor);actor.result(call,result);await this.persist();
 }
 async finish(reason){
  if(this.error&&/WORKER_|OLD_LEASE/.test(this.error)&&reason!=='stopped'){this.state='recovering';await this.persist();return;}
  try{
  await this.registry.assertEnvironment(this);await this.registry.reconcile(this);if(!this.readerChain)await this.reader();this.after=await this.readerChain.state();const txs=[];for(const t of this.transactions)if(t.hash)txs.push({...await this.control.b.chain.inspectTransaction(t.hash),tool:t.functionName});
  const answer=this.legacyTask==='balance'?json({token:'A',address:this.before.addresses.agent,balanceBaseUnits:this.before.balances.agentA,blockHash:this.before.blockHash}):'';
  this.check=this.control.b.checkTask(this.legacyTask,this.before,this.after,txs,answer,this.observations,{experimentMode:this.spec.experimentMode,taskParameters:this.job.input});this.check.business_outcome=this.check.status==='success'?'fulfilled':'failed';
  await this.emit('check.legacy_evidence',{taskId:this.legacyTask,before:this.before,after:this.after,transactions:txs,agentFinal:answer,observations:this.observations,options:{experimentMode:this.spec.experimentMode,taskParameters:this.job.input}});await this.emit('check.result',this.check);
  this.state=this.pending.length?'requires_attention':reason==='stopped'?'stopped':'completed';if(this.state!=='requires_attention'){this.durationMs=this.elapsedMs();this.endedAt=new Date().toISOString();}this.execution.business=this.check.business_outcome;this.execution.funds=this.pending.length?'unknown':'settled';await this.emit('scenario.finished',{reason,state:this.state});await this.persist();this.execution.sealed=['completed','stopped'].includes(this.state);await atomicWrite(join(this.folder,'bundle.json'),json(await this.bundle()));if(this.execution.sealed)this.control.release(this);
  }catch(error){
   // Persist to the control database without retrying the failed archive. A throw
   // here would let the inherited pump replace this financial attention state.
   this.execution.sealed=false;this.execution.funds='unknown';this.execution.business='unknown';this.state='requires_attention';this.durationMs=null;this.endedAt=null;
   this.error='RECONCILIATION_REQUIRED: '+error.message;this.check={...(this.check??{}),status:'unknown',business_outcome:'unknown',evidence_completeness:'incomplete'};
   this.control.persist(this);
  }
 }
}
