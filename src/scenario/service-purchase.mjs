import {randomUUID} from 'node:crypto';
import {atomicWrite} from './durable.mjs';
import {join} from 'node:path';
import {AgentRuntime} from './agent-runtime.mjs';
import {copy,json,hash,units} from './core.mjs';
import {normalizeService,serviceDefinitions,assessReport,checkServiceEvidence,POLICY} from './service-core.mjs';
class ServiceAgent extends AgentRuntime {
 definitions(){return serviceDefinitions(this.spec);}
 initialContext(s){return {agentId:this.agentId,role:this.role,privateGoal:this.spec.goal,address:this.address,peer:this.role==='buyer'?'provider':'buyer',request:s.request,advertisedPrice:s.spec.payment,paymentToken:'TokenB',deadline:s.deadline,
 process:'Buyer sends inquiry. Provider quotes price (payload.price). Buyer accepts received quoteId or rejects based on private goal. Agreed price must equal configured experiment payment. Buyer approve_budget, create_job, fund_job. Provider inspect_job, generate_report, submit_report. Independent system Evaluator checks and pays/refunds. Each tool has no arguments except send_message and finish. Use wait when waiting. Never use peer_swap tools. Text alone does not execute.'};}
 async step(s){if(this.role==='evaluator'){return s.job&&Number(s.job.status)===3&&!s.evaluation&&s.spec.evaluatorMode!=='offline'?{name:'evaluate_report',args:{}}:{wait:true};}return super.step(s);}
 async scripted(s){
  const last=kind=>this.history.filter(m=>m.kind===kind).at(-1),status=Number(s.job?.status??0);
  if(this.role==='buyer'){
   if(!this.asked){this.asked=true;return {name:'send_message',args:{recipient:'provider',kind:'inquiry',payload:{request:s.request}}};}
   if(last('quote')&&!s.accepted){const q=last('quote');return {name:'send_message',args:{recipient:'provider',kind:units(q.visiblePayload.price)<=units(this.spec.goal.maxPay)?'accept':'reject',quoteId:q.quoteId}};}
   if(s.accepted&&!status){if(!this.approved){this.approved=true;return {name:'approve_budget',args:{}};}return {name:'create_job',args:{}};}
   if(status===1)return {name:'fund_job',args:{}};
  }else{
   if(last('inquiry')&&!s.quote){if(units(this.spec.goal.minPrice)>units(s.spec.payment))return {name:'send_message',args:{recipient:'buyer',kind:'reject'}};
    return {name:'send_message',args:{recipient:'buyer',kind:'quote',payload:{price:s.spec.payment},replyTo:last('inquiry').messageId}};}
   if(status===2&&s.spec.reportMode!=='withhold'){
    if(!this.inspected)return {name:'inspect_job',args:{}};
    if(!s.artifact)return {name:'generate_report',args:{}};
    return {name:'submit_report',args:{}};
   }
  }return {wait:true};
 }
}
export function serviceScenarioClass(Base){return class ServiceScenario extends Base {
 constructor(service,input){super(service,input,normalizeService(input));this.registry=service.purchaseRegistry;this.agents=this.spec.agents.map(a=>new ServiceAgent(a));
  // Base bus is constructed before the new role runtimes but uses the same agent IDs.
 }
 progress(a){const status=Number(this.job?.status??0),allowed=new Set(['wait','finish']),stage=this.pending.length?'awaiting_chain_confirmation':status===3?'service_evaluation':status===2?'service_delivery':status===1?'service_funding':this.accepted?'service_creation':'service_negotiation';
  if(a.role!=='evaluator')allowed.add('send_message');
  if(!this.pending.length){if(a.role==='buyer'&&this.accepted){if(!status){allowed.add('approve_budget');allowed.add('create_job');}if(status===1){allowed.add('approve_budget');allowed.add('fund_job');allowed.add('cancel_job');}if([2,3].includes(status))allowed.add('refund_job');}
   if(status)allowed.add('inspect_job');if(a.role==='provider'&&status===2){allowed.add('generate_report');if(this.artifact)allowed.add('submit_report');}if(a.role==='evaluator'&&status===3)allowed.add('evaluate_report');}
  const visible=this.quote&&(this.quote.proposer===a.agentId||a.history.some(m=>m.quoteId===this.quote.quoteId));
  return {stage,advertisedPrice:this.spec.payment,paymentToken:'TokenB',deadline:this.deadline??null,jobId:this.jobId??null,job:this.job??null,request:this.request??null,quote:visible?this.quote:null,mutualAcceptance:!!this.accepted,allowedActions:a.spec.tools.filter(t=>allowed.has(t)),lastToolError:a.lastToolError??null,
   nextActionHint:'Follow role tools and actual confirmed job status. Buyer may accept/reject a received quote using quoteId. Never claim a message or payment succeeded after tool errors. Wait while pending.'};
 }
 snapshot(){return {...super.snapshot(),jobId:this.jobId,job:this.job,request:this.request,artifact:this.artifact,artifactHash:this.artifactHash,evaluation:this.evaluation,deadline:this.deadline};}
 async validateJob(){
  const j=await this.registry.order(this,this.jobId),r=this.realm,pc=this.registry.chain.publicClient;
  if(this.registry.chain.env().chainInstanceId!==r.epoch)throw Error('STALE_SCENARIO_CHAIN');
  if(this.service.b.keccak256(await pc.getBytecode({address:r.exchange}))!==r.contractCodeHash)throw Error('SERVICE_CODE_CHANGED');
  const read=fn=>pc.readContract({address:r.exchange,abi:r.abi,functionName:fn});
  const [scope,provider,evaluator,token]=await Promise.all(['sessionScope','provider','evaluator','token'].map(read));
  if(scope!==r.scope||provider.toLowerCase()!==r.accounts.provider.address.toLowerCase()||evaluator.toLowerCase()!==r.accounts.evaluator.address.toLowerCase()||token.toLowerCase()!==this.registry.chain.env().contracts.tokenB.toLowerCase())throw Error('SERVICE_PARTICIPANTS_CHANGED');
  if(Number(j.status)){if(j.buyer.toLowerCase()!==r.accounts.buyer.address.toLowerCase()||String(j.budget)!==String(units(this.spec.payment))||j.requestHash!=='0x'+hash(this.request)||String(j.deadline)!==this.deadline)throw Error('SERVICE_TERMS_MISMATCH');}
  this.job=j;return j;
 }
 async tool(actor,call){
  this.checkAbort();const key=`${actor.agentRunId}:${actor.costs.toolCalls++}`;const event=await this.emit('tool.call',{toolCallKey:key,name:call.name,args:call.args,providerToolCallId:call.providerToolCallId??null},actor,call.causes??[]);call.toolEventId=event.eventId;
  const def=actor.definitions().find(d=>d.function.name===call.name);if(!def)throw Error('TOOL_NOT_ALLOWED');
  if(!call.args||Array.isArray(call.args)||typeof call.args!=='object')throw Error('TOOL_ARGUMENTS');const p=def.function.parameters;
  if(Object.keys(call.args).some(k=>!Object.hasOwn(p.properties,k)))throw Error('TOOL_ADDITIONAL_PROPERTIES');if(p.required.some(k=>!Object.hasOwn(call.args,k)))throw Error('TOOL_MISSING_ARGUMENT');
  if(this.spec.pauseBeforeTool)await this.gate('before_tool',actor,call);
  const pc=this.registry.chain.publicClient,c=this.registry.chain.env().contracts,r=this.realm;
  const submit=(name,args)=>this.registry.submit(this,actor,r.exchange,r.abi,name,args,[event.eventId]);let result;
  if(call.name==='wait')result={waiting:true};
  else if(call.name==='finish'){actor.finished=true;result={finished:true};}
  else if(call.name==='send_message'){
   const a={...copy(call.args),payload:copy(call.args.payload??{})};if(a.recipient==="evaluator"||actor.role==='evaluator')throw Error('SYSTEM_ROLE_NOT_BUSINESS_PEER');
   if(!a.payload||typeof a.payload!=='object'||Array.isArray(a.payload))throw Error('PAYLOAD_OBJECT');
   if(a.kind==='quote'){
    if(actor.role!=='provider'||Number(this.job?.status??0)>0||this.pending.length)throw Error('QUOTE_STAGE');const price=a.payload.price;units(price);
    if(units(price)!==units(this.spec.payment)||units(price)<units(actor.spec.goal.minPrice))throw Error('PRICE_OUTSIDE_DECLARED_TERMS');
    this.quote={price,quoteId:randomUUID(),proposer:actor.agentId,requestHash:'0x'+hash(this.request)};this.accepted=null;a.quoteId=this.quote.quoteId;a.payload=copy(this.quote);
   }else if(a.kind==='accept'){
    if(actor.role!=='buyer'||!this.quote||a.quoteId!==this.quote.quoteId||!actor.history.some(m=>m.kind==='quote'&&m.quoteId===a.quoteId))throw Error('QUOTE_NOT_OBSERVED');
    if(units(this.quote.price)>units(actor.spec.goal.maxPay))throw Error('BUYER_BUDGET');this.accepted=a.quoteId;
   }else if(a.kind==='reject'){if(Number(this.job?.status??0)>0)throw Error('JOB_ALREADY_OPEN');this.rejected=true;}
   else if(a.kind==='order_ref'){if(!this.job||!Number(this.job.status))throw Error('JOB_REQUIRED');a.payload={jobId:this.jobId,escrow:r.exchange};}
   result=await this.bus.send(actor,a,[event.eventId]);
  }else{
   if(this.pending.length)throw Error('RECONCILE_FIRST');await this.validateJob();const status=Number(this.job.status);
   if(call.name==='inspect_job'){actor.inspected=true;result={job:this.job,jobId:this.jobId,request:this.request};await this.emit('service.job_observed',result,actor,[event.eventId]);}
   else if(call.name==='approve_budget'){
    if(actor.role!=='buyer'||!this.accepted)throw Error('ROLE_OR_ACCEPTANCE');result=await this.registry.submit(this,actor,c.tokenB,this.registry.chain.artifacts.LabToken.abi,'approve',[r.exchange,units(this.spec.payment)],[event.eventId]);
   }else if(call.name==='create_job'){
    if(actor.role!=='buyer'||!this.accepted||status!==0)throw Error('ROLE_OR_JOB_STATE');result=await submit('createJob',[units(this.spec.payment),BigInt(this.deadline),'0x'+hash(this.request),this.salt]);
   }else if(call.name==='fund_job'){
    if(actor.role!=='buyer'||!this.accepted||status!==1)throw Error('ROLE_OR_JOB_STATE');result=await submit('fundJob',[this.jobId,units(this.spec.payment)]);
   }else if(call.name==='generate_report'){
    if(actor.role!=='provider'||status!==2||!actor.inspected)throw Error('FUNDED_INSPECTED_JOB_REQUIRED');
    this.artifact=await this.registry.readReport(this);if(this.spec.reportMode==='wrong_balance')this.artifact.balance=String(BigInt(this.artifact.balance)+1n);
    if(this.spec.reportMode==='wrong_block')this.artifact.blockHash='0x'+hash('wrong block');if(this.spec.reportMode==='malformed')this.artifact={text:'unstructured output'};
    this.artifactHash='0x'+hash(this.artifact);this.artifactEvent=await this.emit('artifact.generated',{jobId:this.jobId,artifact:this.artifact,artifactHash:this.artifactHash},actor,[event.eventId]);result={artifact:this.artifact,artifactHash:this.artifactHash};
   }else if(call.name==='submit_report'){
    if(actor.role!=='provider'||status!==2||!actor.inspected||!this.artifact)throw Error('REPORT_REQUIRED');
    result=await submit('submit',[this.jobId,this.artifactHash]);
    if(this.spec.reportMode==='hash_mismatch')this.artifact={...this.artifact,balance:'999'};
    await this.emit('artifact.delivered',{jobId:this.jobId,artifact:this.artifact,artifactHash:this.artifactHash},actor,[event.eventId,this.artifactEvent?.eventId]);
   }else if(call.name==='evaluate_report'){
    if(actor.role!=='evaluator'||status!==3)throw Error('EVALUATOR_SUBMITTED_JOB_REQUIRED');if(this.spec.evaluatorMode==='offline')throw Error('EVALUATOR_OFFLINE');
    const reference=await this.registry.readReport(this),assessment=assessReport(this.request,this.artifact,this.job.artifactHash,reference);
    const accepted=this.spec.evaluatorMode==='wrong_approve'?true:this.spec.evaluatorMode==='wrong_reject'?false:assessment.quality==='passed';
    const evaluation={policy:POLICY,mode:this.spec.evaluatorMode,accepted,assessment,reference,jobId:this.jobId,artifactHash:this.job.artifactHash};
    const e=await this.emit('artifact.evaluation',evaluation,actor,[event.eventId]);result=await this.registry.submit(this,actor,r.exchange,r.abi,'evaluate',[this.jobId,this.job.artifactHash,accepted,'0x'+hash(evaluation)],[e.eventId]);this.evaluation=evaluation;
   }else if(call.name==='refund_job'){
    if(actor.role!=='buyer')throw Error('ROLE');result=await submit('refund',[this.jobId]);
   }else if(call.name==='cancel_job'){if(actor.role!=='buyer')throw Error('ROLE');result=await submit('cancel',[this.jobId]);}
   else throw Error('UNKNOWN_TOOL');
  }
  actor.lastToolError=null;await this.emit('tool.result',{toolCallKey:key,name:call.name,raw:result,visible:result},actor,[event.eventId]);return result;
 }
 async terminal(){
  await this.validateJob();const status=Number(this.job.status);
  if(status>=4){await this.finish('service_terminal');return true;}
  if(this.rejected&&status===0){await this.finish('rejected');return true;}
  if([2,3].includes(status)&&((this.spec.evaluatorMode==='offline'&&status===3)||this.spec.reportMode==='withhold')){
   this.state='paused';await this.emit('service.awaiting_timeout',{jobId:this.jobId,deadline:this.deadline,reason:this.spec.reportMode==='withhold'?'provider_withheld':'evaluator_offline'});await this.persist();return true;
  }
  return false;
 }
 async finish(reason){
  await this.registry.reconcile(this);this.after=await this.registry.state(this);await this.validateJob();
  let checkerReference=null;try{checkerReference=await this.registry.readReport(this);}catch(error){await this.emit('check.reference_unavailable',{error:error.message});}
  for(const tx of this.transactions)if(tx.receipt){const block=await this.registry.chain.publicClient.getBlock({blockHash:tx.receipt.blockHash});tx.blockTimestamp=String(block.timestamp);}
  const evidence=copy({spec:this.spec,before:this.before,after:this.after,request:this.request,artifact:this.artifact??null,job:this.job,transactions:this.transactions,rejected:!!this.rejected,evaluation:this.evaluation??null,checkerReference});
  this.check=checkServiceEvidence(evidence);await this.emit('check.evidence',evidence);await this.emit('check.result',this.check);
  this.state=this.pending.length?'pending_reconciliation':'completed';if(!this.pending.length){this.durationMs=this.elapsedMs();this.endedAt=new Date().toISOString();this.paused=null;this.service.release(this);}
  await this.emit('scenario.finished',{reason,state:this.state,elapsedMs:this.elapsedMs(),startedAt:this.startedAt,endedAt:this.endedAt??null});await this.persist();await atomicWrite(join(this.folder,'bundle.json'),json(await this.bundle()));
 }
 async bundle(){const b=await super.bundle();return b;}
};}
