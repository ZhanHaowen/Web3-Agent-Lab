import {Scenario} from '../scenario/service.mjs';import {AgentRuntime} from '../scenario/agent-runtime.mjs';import {copy,json,hash} from '../scenario/core.mjs';import {checkPeer} from './checker.mjs';import {atomicWrite} from '../scenario/durable.mjs';import {join} from 'node:path';
export class RemoteAgent extends AgentRuntime {
 constructor(control,binding,spec){super(spec);this.control=control;this.binding=binding;this.profileId=binding.agentId;this.agentRunId=binding.agentRunId;this.address=binding.address;this.resultCommands=[];}
 async step(s){
  this.control.lease(s,this);for(const id of this.resultCommands.splice(0))await this.control.awaitCommand(id);
  const command=this.control.pendingDecision(s.id,this.role)??this.control.command(this.profileId,{type:'step',executionId:s.id,agentRunId:this.agentRunId,spec:this.spec,role:this.role,context:{spec:{mode:s.spec.mode},quote:s.quote,orderId:s.orderId},progress:s.progress(this),inbox:s.bus.peek(this.role)});
  this.activeCommand=command.id;const response=await this.control.awaitCommand(command.id);this.costs={...response.costs,toolCalls:this.costs.toolCalls};this.history=response.history??[];if(response.call.wait)this.control.completeDecision(command.id);return response.call;
 }
 result(call,value){const command=this.control.command(this.profileId,{type:'result',executionId:this.binding.executionId,agentRunId:this.agentRunId,spec:this.spec,call,value});this.resultCommands.push(command.id);this.control.completeDecision(this.activeCommand);}
}
export class RemoteScene extends Scenario {
 constructor(control,execution,job){super(control.sceneService,job.runtimeSpec,copy(job.runtimeSpec));this.control=control;this.registry=control.registry;this.id=execution.id;this.jobId=job.id;this.execution=execution;this.bindings=execution.bindings;this.episodeId=execution.id;this.folder=join(control.b.data,'runs',this.id);this.agents=this.spec.agents.map(a=>new RemoteAgent(control,this.bindings[a.role],a));
  const send=this.bus.send.bind(this.bus);this.bus.send=async(actor,args,causes)=>{
   if(args.kind==='quote'){const ids=await this.registry.ids(this,this.quote);this.quote.termsHash=ids.termsHash;args.payload={...args.payload,termsHash:ids.termsHash};}
   return send(actor,args,causes);
  };
  this.bus.peek=role=>control.store.list('messages').filter(m=>m.executionId===this.id&&m.recipientAgentId===role&&!m.consumedBy).map(m=>copy(m));
 }

 async gate(phase,actor,detail){
  this.checkAbort();
  // Latch resume before publishing paused: archive writes may yield to the control API.
  // This promise only resolves, so abort or recording failure cannot leave a rejected orphan.
  let resolveWait;const wait=new Promise(resolve=>{resolveWait=resolve;});
  const release=()=>{resolveWait();if(this.releaseGate===release)this.releaseGate=null;};
  const onAbort=()=>{release();this.abort.signal.removeEventListener('abort',onAbort);};
  this.releaseGate=release;this.abort.signal.addEventListener('abort',onAbort,{once:true});
  try{
   this.checkAbort();const e=await this.emit('control.paused',{phase,detail},actor);
   this.paused={phase,agentId:actor?.agentId,detail,eventId:e.eventId};this.state='paused';
   await this.persist();this.checkAbort();await wait;this.checkAbort();
   this.paused=null;this.state='running';await this.emit('control.resumed',{phase},actor,[e.eventId]);
  }finally{this.abort.signal.removeEventListener('abort',onAbort);release();}
 }

 async appendEvent(type,payload,actor,causes){if(type==='scenario.created')payload={...payload,jobId:this.jobId,executionId:this.id,definitionHash:this.execution.definitionHash};const e=this.control.event(this,type,payload,actor,causes);await this.control.archive(this);return e;}
 async persist(){this.control.persist(this);await this.control.archive(this);}
 snapshot(){const base=super.snapshot();return this.clean({...base,state:['completed','stopped'].includes(this.state)&&this.control.current===this.id?'finalizing':base.state,proposedOrderId:this.proposedOrderId??null,rejected:!!this.rejected,recordingFailure:this.recordingFailure?String(this.recordingFailure.message??this.recordingFailure):null,agents:base.agents.map((a,i)=>({...a,inspected:this.agents[i].inspected,history:this.agents[i].history})),executionId:this.id,jobId:this.jobId,bindings:this.bindings,controlVersion:2,sourceStreams:'identity-bound',environmentLock:this.control.current===this.id});}
 async finish(reason){
  if(reason!=='stopped'&&/WORKER_|OLD_LEASE|SIGNATURE_NOT_RETAINED/.test(this.error??'')){this.state='recovering';await this.persist();return;}
  try{
   await this.registry.assertEnvironment(this);await this.registry.reconcile(this);this.after=await this.registry.state(this);if(this.orderId)this.order=copy(await this.registry.chain.publicClient.readContract({address:this.realm.exchange,abi:this.realm.abi,functionName:'getOrder',args:[this.orderId],blockNumber:BigInt(this.after.blockNumber)}));
   for(const tx of this.transactions)if(tx.receipt){const b=await this.registry.chain.publicClient.getBlock({blockHash:tx.receipt.blockHash});tx.blockTimestamp=String(b.timestamp);}
   const scan=await this.registry.scan(this),evidence=copy({spec:this.spec,before:this.before,after:this.after,quote:this.quote,order:this.order,transactions:this.transactions,rejected:!!this.rejected,chainScan:scan});
   this.check=checkPeer(evidence);await this.emit('check.evidence',evidence);await this.emit('check.result',this.check);
   const open=Number(this.order?.state)===1,pending=this.pending.length>0,uncertain=pending||scan.unrecorded.length>0||this.recordingFailure;
   this.state=open||uncertain?'requires_attention':reason==='stopped'?'stopped':'completed';this.execution.funds=open?'open':pending?'unknown':Number(this.order?.state)===2?'settled':Number(this.order?.state)>=3?'refunded':'none';
   this.execution.business=this.check.business_outcome==='filled'&&this.check.status==='success'?'fulfilled':this.rejected?'no_deal':pending?'unknown':'failed';
   if(!['requires_attention','recovering'].includes(this.state)){this.durationMs=this.elapsedMs();this.endedAt=new Date().toISOString();this.paused=null;}
   await this.emit('scenario.finished',{reason,state:this.state,elapsedMs:this.elapsedMs(),startedAt:this.startedAt,endedAt:this.endedAt??null});await this.persist();this.execution.sealed=['completed','stopped'].includes(this.state);await atomicWrite(join(this.folder,'bundle.json'),json(await this.bundle()));if(this.execution.sealed)this.control.release(this);
  }catch(error){this.execution.sealed=false;this.state='requires_attention';this.error='RECONCILIATION_REQUIRED: '+error.message;this.execution.funds='unknown';this.execution.business='unknown';this.check={...(this.check??{}),status:'unknown',business_outcome:'unknown',evidence_completeness:'incomplete'};this.durationMs=null;this.endedAt=null;this.control.persist(this);}
 }
 async bundle(){const b=await super.bundle();b.executionId=this.id;b.files['task/definition.json']=json(this.control.store.get('task_definitions',this.execution.definitionId));b.files['task/job.json']=json(this.control.store.get('jobs',this.jobId));b.files['task/execution.json']=json(this.execution);
  const g=JSON.parse(b.files['derived/graph.json']);g.schemaVersion='2.0';const job='job:'+this.jobId,ex='execution:'+this.id;g.nodes.push({id:job,kind:'job',label:this.jobId,eventRef:this.events[0]?.eventId},{id:ex,kind:'execution',label:this.id,eventRef:this.events[0]?.eventId});
  const ref=this.events.find(e=>e.type==='scenario.created')?.eventId??this.events[0]?.eventId;g.edges.push({id:job+ex,from:job,to:ex,kind:'creates_execution',eventRef:ref});for(const a of this.agents)g.edges.push({id:ex+a.agentRunId,from:ex,to:'agent:'+a.agentRunId,kind:'assigned_role',eventRef:ref});
  const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');const csv=x=>'"'+String(x??'').replaceAll('"','""')+'"';
  b.files['derived/graph.json']=json(g);b.files['derived/graph.graphml']=`<?xml version="1.0"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns"><graph edgedefault="directed">${g.nodes.map(n=>`<node id="${esc(n.id)}"/>`).join('')}${g.edges.map(e=>`<edge source="${esc(e.from)}" target="${esc(e.to)}"/>`).join('')}</graph></graphml>`;
  b.files['derived/nodes.csv']='id,kind,agentId,eventRef\n'+g.nodes.map(n=>[n.id,n.kind,n.agentId,n.eventRef].map(csv).join(',')).join('\n');b.files['derived/edges.csv']='from,to,kind,eventRef\n'+g.edges.map(e=>[e.from,e.to,e.kind,e.eventRef].map(csv).join(',')).join('\n');
  b.files['derived/execution-trace.md']='# Execution '+this.id+'\n\n'+this.events.map(e=>`${e.logicalClock}. ${e.agentId??'control'} ${e.type} ${e.eventId}`).join('\n');
  const trace=JSON.parse(b.files['derived/execution-trace.json']);trace.graph=g;b.files['derived/execution-trace.json']=json(trace);const manifest=JSON.parse(b.files['manifest.json']);manifest.recordingStatus=['completed','stopped'].includes(this.state)?'complete':'incomplete';manifest.files=Object.fromEntries(Object.entries(b.files).filter(([p])=>p!=='manifest.json').map(([p,t])=>[p,{sha256:hash(t),bytes:Buffer.byteLength(t)}]));b.files['manifest.json']=json(manifest);return b;
 }
}

