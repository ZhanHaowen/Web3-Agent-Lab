import { readFile,writeFile,mkdir,readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalize,copy,json,hash,units,checkQuote,MessageBus } from './core.mjs';
import { AgentRuntime,definitions } from './agent-runtime.mjs';
import { WalletRegistry } from './wallet-registry.mjs';
import { checkEvidence } from './checker.mjs';
import { serviceScenarioClass } from './service-purchase.mjs';
import { ServiceRegistry } from './service-registry.mjs';
import { deriveGraph } from './graph.mjs';
import {atomicWrite as atomic} from './durable.mjs';
const idPattern=/^[a-f0-9-]{36}$/i;
const lower=v=>String(v).toLowerCase();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export class Scenario {
  constructor(service,spec,normalizedSpec=null){this.service=service;this.registry=service.registry;this.spec=normalizedSpec??normalize(spec);this.id=randomUUID();this.episodeId=randomUUID();
    this.state='draft';this.steps=0;this.cursor=0;this.agents=this.spec.agents.map(a=>new AgentRuntime(a));
    this.events=[];this.transactions=[];this.pending=[];this.files={};this.abort=new AbortController();this.pausedAgents=new Set();this.queue=Promise.resolve();this.emitQueue=Promise.resolve();
    this.folder=join(service.b.data,'scenarios',this.id);this.bus=new MessageBus(this,this.emit.bind(this));}
  checkAbort(){if(this.abort.signal.aborted)throw Error('SCENARIO_STOPPED');}
  elapsedMs(){return this.durationMs??(this.startedMono==null?0:Math.max(0,Math.round(performance.now()-this.startedMono)));}
  progress(actor){
    const q=this.quote,mutual=!!q&&this.accepted===q.quoteId,pending=this.pending.length>0;
    const visibleQuote=q&&(q.proposer===actor.agentId||actor.history.some(m=>m.kind==='quote'&&m.quoteId===q.quoteId));
    const actions=new Set(['send_message','wait','finish']);let stage='negotiating',next='Use send_message to inquire, quote, counterquote, accept or reject. No order exists yet.';
    if(!q){stage=actor.role==='maker'?'awaiting_inquiry_or_quote':'need_inquiry';next=actor.role==='maker'?'Wait for an inquiry or propose a quote using send_message. Do not create or inspect an order.':'Send an inquiry to maker using send_message.';}
    else if(!mutual){stage=q.proposer===actor.agentId?'awaiting_peer_acceptance':'need_quote_decision';next=q.proposer===actor.agentId?'Your quote has not been accepted. Wait for the peer; create_order is not allowed.':'Evaluate the received quote against your own goal. Accept via send_message with kind accept and the received quoteId, counterquote or reject. payload may be omitted for accept.';}
    else if(!this.orderId){stage=actor.role==='maker'?'maker_prepare_order':'awaiting_order';next=actor.role==='maker'?'Mutual acceptance is recorded. Call approve_sell, then create_order.':'Acceptance is recorded. Wait for the maker order_ref; do not inspect a nonexistent order.';if(actor.role==='maker'){actions.add('approve_sell');actions.add('create_order');}}
    else{stage='order_open';next=actor.role==='maker'?'Send order_ref with the current orderId to taker, then wait for settlement.':'Use inspect_order to verify the received order, then approve_buy and fill_order.';actions.add('inspect_order');actions.add('expire_order');
      if(actor.role==='maker')actions.add('cancel_order');else if(actor.inspected?.id===this.orderId){actions.add('approve_buy');actions.add('fill_order');}}
    if(pending){stage='awaiting_chain_confirmation';next='A transaction is pending or unknown. Wait for reconciliation; do not submit a replacement payment.';for(const a of [...actions])if(!['send_message','wait'].includes(a))actions.delete(a);}
    return {stage,mutualAcceptance:mutual,quote:visibleQuote?copy(q):null,orderId:this.orderId??null,
      pendingTransactions:this.pending.map(t=>({actorId:t.actorId,state:t.state,hash:t.hash??null})),allowedActions:actor.spec.tools.filter(t=>actions.has(t)),nextActionHint:next,lastToolError:actor.lastToolError??null};
  }
  clean(v){return this.service.b.clean(v);}
  async emit(type,payload,actor=null,causes=[]){
    const operation=this.emitQueue.then(()=>this.appendEvent(type,payload,actor,causes));
    this.emitQueue=operation.catch(error=>{this.recordingFailure=error;});return operation;
  }
  async appendEvent(type,payload,actor=null,causes=[]){
    if(this.recordingFailure)throw this.recordingFailure;
    const clean=this.clean(payload),text=json(clean),digest=hash(text),key=`raw/blobs/${digest}.json`;
    const e={schemaVersion:2,scenarioId:this.id,episodeId:this.episodeId,eventId:randomUUID(),logicalClock:this.events.length+1,
      timestamp:new Date().toISOString(),type,agentId:actor?.agentId??null,agentRunId:actor?.agentRunId??null,
      causalEventIds:causes.filter(Boolean),payloadRef:{path:key,sha256:digest,bytes:Buffer.byteLength(text)}};
    // Payload must be durable before its event reference, and journal before any side effect.
    await mkdir(join(this.folder,'raw/blobs'),{recursive:true});await atomic(join(this.folder,key),text);
    const events=[...this.events,e];await atomic(join(this.folder,'raw/events.jsonl'),events.map(x=>JSON.stringify(x)).join('\n')+'\n');
    this.files[key]=text;this.events=events;return e;
  }
  async persist(){await mkdir(this.folder,{recursive:true});await atomic(join(this.folder,'summary.json'),json(this.snapshot()));}
  snapshot(){return this.clean({id:this.id,episodeId:this.episodeId,state:this.state,steps:this.steps,cursor:this.cursor,spec:this.spec,
    quote:this.quote,accepted:this.accepted,orderId:this.orderId,order:this.order,check:this.check,before:this.before,after:this.after,
    transactions:this.transactions,paused:this.paused,pausedAgents:[...this.pausedAgents],error:this.error,
    startedAt:this.startedAt??null,endedAt:this.endedAt??null,elapsedMs:this.elapsedMs(),
    progress:Object.fromEntries(this.agents.map(a=>[a.agentId,this.progress(a)])),stepInProgress:!!this.pumping,
    agents:this.agents.map(a=>({agentId:a.agentId,agentRunId:a.agentRunId,address:a.address,costs:a.costs,gasUsedWei:String(a.gasUsedWei),finished:a.finished})),
    messages:this.bus.outbox,eventCount:this.events.length,locked:this.service.current===this.id});}
  async gate(phase,actor,detail){this.checkAbort();const e=await this.emit('control.paused',{phase,detail},actor);
    this.paused={phase,agentId:actor?.agentId,detail,eventId:e.eventId};this.state='paused';await this.persist();
    await new Promise((resolve,reject)=>{const stop=()=>{this.releaseGate=null;reject(Error('SCENARIO_STOPPED'));};
      this.abort.signal.addEventListener('abort',stop,{once:true});this.releaseGate=()=>{this.abort.signal.removeEventListener('abort',stop);this.releaseGate=null;resolve();};});
    this.checkAbort();this.paused=null;this.state='running';await this.emit('control.resumed',{phase},actor,[e.eventId]);}
  async tool(actor,call){
    this.checkAbort();
    const key=`${actor.agentRunId}:${actor.costs.toolCalls++}`;
    const event=await this.emit('tool.call',{toolCallKey:key,providerToolCallId:call.providerToolCallId??null,name:call.name,args:call.args},actor,call.causes??[]);
    call.toolEventId=event.eventId;
    if(!actor.spec.tools.includes(call.name))throw Error('TOOL_NOT_ALLOWED: this role cannot use '+call.name);
    if(!call.args||typeof call.args!=='object'||Array.isArray(call.args))throw Error('TOOL_ARGUMENTS: expected a JSON object');
    const definition=definitions(actor.spec).find(d=>d.function.name===call.name).function.parameters;
    const extra=Object.keys(call.args).filter(k=>!Object.hasOwn(definition.properties,k));
    if(extra.length)throw Error('TOOL_ADDITIONAL_PROPERTIES: '+extra.join(', '));
    const missing=definition.required.filter(k=>!Object.hasOwn(call.args,k));
    if(missing.length)throw Error('TOOL_MISSING_ARGUMENT: '+missing.join(', '));
    if(call.name==='send_message'){
      if(call.args.payload!==undefined&&(!call.args.payload||typeof call.args.payload!=='object'||Array.isArray(call.args.payload)))throw Error('TOOL_ARGUMENT_TYPE: payload must be an object, or omit it');
      if(call.args.kind==='quote'){
        const required=['sellAmount','buyAmount'].filter(k=>!Object.hasOwn(call.args.payload??{},k));
        if(required.length)throw Error('TOOL_MISSING_ARGUMENT: quote.payload.'+required.join(', quote.payload.'));
      }
      if(call.args.kind==='accept'&&typeof call.args.quoteId!=='string')throw Error('TOOL_MISSING_ARGUMENT: accept.quoteId must reference the received quote');
    }
    if(this.spec.pauseBeforeTool)await this.gate('before_tool',actor,{name:call.name,args:call.args});
    const r=this.realm,c=this.registry.chain.env().contracts,registry=this.registry;
    const submit=(address,abi,fn,args)=>registry.submit(this,actor,address,abi,fn,args,[event.eventId]);
    let result;
    if(call.name==='send_message'){
      const args={...copy(call.args),payload:copy(call.args.payload??{})};
      if(args.kind==='quote'){
        if(this.orderId||this.proposedOrderId||this.pending.length)throw Error('QUOTE_AFTER_ORDER_INTENT');
        const terms=checkQuote(actor.spec,args.payload);
        const block=await registry.chain.publicClient.getBlock();
        this.quote={...terms,proposer:actor.agentId,quoteId:randomUUID(),salt:'0x'+hash(randomUUID()),deadline:String(block.timestamp+BigInt(this.spec.ttl))};
        this.accepted=null;args.quoteId=this.quote.quoteId;args.payload=copy(this.quote);
      }else if(args.kind==='accept'){
        if(!this.quote||actor.agentId===this.quote.proposer||args.quoteId!==this.quote.quoteId)throw Error('ACCEPT_QUOTE');
        if(!actor.history.some(m=>m.kind==='quote'&&m.quoteId===args.quoteId))throw Error('QUOTE_NOT_OBSERVED');
        checkQuote(actor.spec,this.quote);this.accepted=this.quote.quoteId;
      }else if(args.kind==='reject'){this.rejected=true;}
      else if(args.kind==='order_ref'){
        if(actor.role!=='maker'||!this.orderId||args.payload?.orderId!==this.orderId)throw Error('ORDER_REF');
        args.payload={orderId:this.orderId,exchange:r.exchange,sessionScope:r.scope,chainInstanceId:r.epoch};
      }
      result=await this.bus.send(actor,args,[event.eventId]);
    }else if(call.name==='wait'){result={waiting:true,reason:'yield_scheduler_turn'};}
    else if(call.name==='finish'){actor.finished=true;result={finished:true,reason:call.args.reason??''};}
    else if(call.name==='inspect_order'){
      if(!this.orderId)throw Error('ORDER_REQUIRED');const order=await registry.order(this,this.orderId);await this.validateOrder(actor,order);
      actor.inspected={id:this.orderId,termsHash:order.termsHash};result={orderId:this.orderId,order,exchange:r.exchange,scope:r.scope};
      await this.emit('order.observed',result,actor,[event.eventId]);
    }else if(call.name==='expire_order'||call.name==='cancel_order'){
      if(!this.orderId)throw Error('ORDER_REQUIRED');result=await submit(r.exchange,r.abi,call.name==='expire_order'?'expireOrder':'cancelOrder',[this.orderId]);
    }else{
      if(!this.quote||this.accepted!==this.quote.quoteId)throw Error('MUTUAL_ACCEPTANCE_REQUIRED');checkQuote(actor.spec,this.quote);
      if(call.name==='approve_sell'||call.name==='approve_buy'){
        const sell=call.name==='approve_sell';if((sell&&actor.role!=='maker')||(!sell&&actor.role!=='taker'))throw Error('ROLE');
        if(!sell){if(!actor.inspected||actor.inspected.id!==this.orderId)throw Error('ORDER_INSPECTION_REQUIRED');await this.validateOrder(actor,await registry.order(this,this.orderId));}
        const token=sell?c.tokenA:c.tokenB,amount=units(sell?this.quote.sellAmount:this.quote.buyAmount);
        const allowance=await registry.chain.publicClient.readContract({address:token,abi:registry.chain.artifacts.LabToken.abi,functionName:'allowance',args:[actor.address,r.exchange]});
        if(allowance>=amount)result={skipped:true,reason:'existing_allowance_sufficient',allowance:String(allowance)};
        else result=await submit(token,registry.chain.artifacts.LabToken.abi,'approve',[r.exchange,amount]);
      }else if(call.name==='create_order'){
        if(actor.role!=='maker')throw Error('ROLE');const ids=await registry.ids(this,this.quote);
        this.quote.termsHash=ids.termsHash;
        const existing=await registry.order(this,ids.id);
        if(Number(existing.state)!==0){this.orderId=ids.id;result={reconciled:true,orderId:ids.id,order:existing};}
        else{result=await submit(r.exchange,r.abi,'createOrder',[...ids.args,ids.termsHash]);
          this.proposedOrderId=ids.id;if(result.state==='confirmed'){this.orderId=ids.id;this.orders.push(ids.id);}result.orderId=ids.id;}
      }else if(call.name==='fill_order'){
        if(actor.role!=='taker'||!this.orderId||actor.inspected?.id!==this.orderId)throw Error('ORDER_INSPECTION_REQUIRED');
        await this.validateOrder(actor,await registry.order(this,this.orderId));result=await submit(r.exchange,r.abi,'fillOrder',[this.orderId]);
      }else throw Error('UNKNOWN_TOOL');
    }
    actor.lastToolError=null;await this.emit('tool.result',{toolCallKey:key,name:call.name,raw:result,visible:result},actor,[event.eventId]);return result;
  }
  async validateOrder(actor,o){
    const r=this.realm,c=this.registry.chain.env().contracts,q=this.quote;
    if(!q||this.accepted!==q.quoteId)throw Error('NO_ACCEPTED_QUOTE');checkQuote(actor.spec,q);
    const scope=await this.registry.chain.publicClient.readContract({address:r.exchange,abi:r.abi,functionName:'sessionScope'});
    const code=await this.registry.chain.publicClient.getBytecode({address:r.exchange});
    if(!code||this.service.b.keccak256(code)!==r.contractCodeHash)throw Error('EXCHANGE_CODE_CHANGED');
    if(scope!==r.scope||this.registry.chain.env().chainInstanceId!==r.epoch)throw Error('SCOPE');
    if(lower(o.maker)!==lower(r.accounts.maker.address)||lower(o.taker)!==lower(r.accounts.taker.address)||
      lower(o.sellToken)!==lower(c.tokenA)||lower(o.buyToken)!==lower(c.tokenB)||BigInt(o.sellAmount)!==units(q.sellAmount)||
      BigInt(o.buyAmount)!==units(q.buyAmount)||o.termsHash!==q.termsHash||String(o.deadline)!==q.deadline||Number(o.state)!==1)throw Error('ORDER_TERMS_MISMATCH');
    const block=await this.registry.chain.publicClient.getBlock();if(block.timestamp>=BigInt(o.deadline))throw Error('ORDER_EXPIRED');
  }
  async start(){
    if(this.state!=='draft')throw Error('NOT_DRAFT');this.service.b.lock();this.service.current=this.id;
    this.startedAt=new Date().toISOString();this.startedMono=performance.now();
    this.state='initializing';await this.persist();
    try{
      for(const a of this.agents)this.service.b.addSecret(a.spec.model.apiKey);
      await this.emit('scenario.created',{spec:this.spec,episodeId:this.episodeId});
      await this.registry.initialize(this);this.state='running';await this.persist();
    }catch(error){this.state='error';this.error=error.message;this.durationMs=this.elapsedMs();this.endedAt=new Date().toISOString();await this.emit('scenario.error',{error:this.error});this.service.release(this);await this.persist();throw error;}
  }
  async step(){
    if(!['running','pending'].includes(this.state))throw Error('SCENARIO_NOT_RUNNING');this.checkAbort();
    await this.registry.reconcile(this);
    if(this.pending.length){this.state='pending';await this.persist();return;}
    this.state='running';
    if(this.proposedOrderId&&!this.orderId){const o=await this.registry.order(this,this.proposedOrderId);if(Number(o.state)>0){this.orderId=this.proposedOrderId;this.orders.push(this.orderId);}}
    if(await this.terminal())return;
    if(this.steps>=this.spec.maxSteps){await this.finish('step_budget');return;}
    const ready=this.agents.filter(a=>!a.finished&&!this.pausedAgents.has(a.agentId));
    if(!ready.length){this.state='paused';await this.emit('control.all_agents_paused',{});await this.persist();return;}
    let actor;for(let i=0;i<this.agents.length;i++){const candidate=this.agents[this.cursor++%this.agents.length];if(ready.includes(candidate)){actor=candidate;break;}}
    this.steps++;const event=await this.emit('scheduler.step',{step:this.steps,readySet:ready.map(a=>a.agentId),selected:actor.agentId},actor);
    let call;try{call=await actor.step(this);if(call.wait){await this.emit('agent.wait',{reason:'message_or_chain'},actor,[event.eventId]);}
      else{call.causes=[...(call.causes??[]),event.eventId];const value=await this.tool(actor,call);actor.result(call,value);}}
    catch(error){
      if(this.abort.signal.aborted)throw error;
      const failure={error:error.message,submitted:false,recoverable:!this.recordingFailure&&!/BUDGET|MODEL_HTTP|MODEL_INVALID/.test(error.message),
        instruction:'The requested action did not succeed. Correct the named fields and retry; do not claim it succeeded.',progress:this.progress(actor)};
      actor.lastToolError={tool:call?.name??null,error:error.message};
      await this.emit('agent.error',failure,actor,[call?.toolEventId??event.eventId]);
      if(call)actor.result(call,failure);
      if(this.spec.mode==='scripted'||this.recordingFailure||/BUDGET|MODEL_HTTP|MODEL_INVALID/.test(error.message)){this.error=error.message;await this.finish('runtime_error');return;}
    }
    if(this.pending.length)this.state='pending';else await this.terminal();await this.persist();
  }
  async terminal(){
    if(this.orderId){this.order=await this.registry.order(this,this.orderId);
      if(Number(this.order.state)>=2){await this.finish('order_terminal');return true;}}
    if(this.rejected&&!this.orderId){await this.finish('rejected');return true;}
    if(this.agents.every(a=>a.finished)){await this.finish('agents_finished');return true;}return false;
  }
  async finish(reason){
    await this.registry.reconcile(this);
    this.after=await this.registry.state(this);
    if(this.orderId)this.order=await this.registry.order(this,this.orderId);
    for(const tx of this.transactions)if(tx.receipt){const block=await this.registry.chain.publicClient.getBlock({blockHash:tx.receipt.blockHash});tx.blockTimestamp=String(block.timestamp);}
    const evidence=copy({spec:this.spec,before:this.before,after:this.after,quote:this.quote,order:this.order,transactions:this.transactions,rejected:!!this.rejected});
    this.check=checkEvidence(evidence);await this.emit('check.evidence',evidence);await this.emit('check.result',this.check);
    this.state=this.pending.length?'pending_reconciliation':'completed';
    if(!this.pending.length){this.durationMs=this.elapsedMs();this.endedAt=new Date().toISOString();this.paused=null;}
    await this.emit('scenario.finished',{reason,state:this.state,elapsedMs:this.elapsedMs(),startedAt:this.startedAt,endedAt:this.endedAt??null});
    if(!this.pending.length)this.service.release(this);await this.persist();
    await atomic(join(this.folder,'bundle.json'),json(await this.bundle()));
  }
  pump(){if(this.pumping||this.spec.manual)return;this.pumping=true;
    this.queue=this.queue.then(async()=>{while(['running','pending'].includes(this.state)&&!this.abort.signal.aborted&&!this.globalPauseRequested){
      await this.step();
      if(this.state==='pending'){
        if(!this.spec.automine)break;
        for(let i=0;i<100&&this.pending.length&&!this.abort.signal.aborted;i++){await sleep(50);await this.registry.reconcile(this);}
        if(this.pending.length)break;this.state='running';
      }
      await sleep(10);
    }})
      .catch(async error=>{this.error=error.message;try{await this.finish(this.abort.signal.aborted?'stopped':'infrastructure_error');}catch(e){this.state='error';this.error=e.message;await this.persist();}})
      .finally(()=>{this.pumping=false;});}
  async bundle(){
    const files={...this.files,'scenario.json':json(this.clean(this.spec)),'raw/events.jsonl':this.events.map(e=>JSON.stringify(e)).join('\n')+'\n',
      'environment/initial.json':json(this.before??null),'environment/final.json':json(this.after??null),'environment/contracts.json':json(this.realm?{settlementMode:this.spec.settlementMode??'peer_swap',exchange:this.realm.exchange,scope:this.realm.scope,abi:this.realm.abi,codeHash:this.realm.contractCodeHash}:null),
      [this.spec.template==='service_purchase'?'labels/checker-service-1.0.json':'labels/checker-peer-1.0.json']:json(this.check??{status:'unknown'})};
    const graph=deriveGraph(this.events,this.files,this),{nodes,edges}=graph;files['derived/graph.json']=json(graph);
    const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    files['derived/graph.graphml']=`<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns"><key id="label" for="node" attr.name="label" attr.type="string"/><graph edgedefault="directed">${nodes.map(n=>`<node id="${n.id}"><data key="label">${xml(n.label)}</data></node>`).join('')}${edges.map(e=>`<edge source="${e.from}" target="${e.to}"/>`).join('')}</graph></graphml>`;
    const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';files['derived/nodes.csv']='id,kind,agentId,eventRef\n'+nodes.map(n=>[n.id,n.kind,n.agentId,n.eventRef].map(csv).join(',')).join('\n');
    files['derived/edges.csv']='from,to,kind,eventRef\n'+edges.map(e=>[e.from,e.to,e.kind,e.eventRef].map(csv).join(',')).join('\n');
    files['derived/execution-trace.json']=json({schemaVersion:2,scenarioId:this.id,episodeId:this.episodeId,timing:{startedAt:this.startedAt??null,endedAt:this.endedAt??null,elapsedMs:this.elapsedMs()},events:this.events,transactions:this.transactions,messages:this.bus.outbox,graph,check:this.check});
    files['manifest.json']=json({schemaVersion:2,scenarioId:this.id,recordingStatus:this.state==='completed'?'complete':'unsealed',files:Object.fromEntries(Object.entries(files).map(([p,t])=>[p,{sha256:hash(t),bytes:Buffer.byteLength(t)}]))});
    return {format:'web3-agent-scenario',version:2,scenarioId:this.id,episodeId:this.episodeId,files};
  }
}
const PurchaseScenario=serviceScenarioClass(Scenario);
export class ScenarioService {
  constructor(bridge){this.b=bridge;this.registry=new WalletRegistry(bridge);this.purchaseRegistry=new ServiceRegistry(bridge);this.scenes=new Map();this.current=null;}
  release(s){if(this.current===s.id){this.current=null;this.b.unlock();}}
  async handle(req,res,path,body){
    const send=(code,data)=>this.b.send(res,code,data);
    if(req.method==='GET'&&['/scenarios.html','/scenario.js','/scenario.css','/services.html','/service-ui.js'].includes(path)){
      const name=path.slice(1),content=await readFile(join(this.b.root,'public',name));res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'});res.end(content);return true;}
    if(!path.startsWith('/api/scenarios'))return false;
    if(path==='/api/scenarios'){
      if(req.method==='POST'){this.b.requireReady();const s=new (body.template==='service_purchase'?PurchaseScenario:Scenario)(this,body);this.scenes.set(s.id,s);await s.persist();send(201,s.snapshot());}
      else{const folder=join(this.b.data,'scenarios');await mkdir(folder,{recursive:true});const list=[];
        for(const id of await readdir(folder)){if(!idPattern.test(id))continue;try{const s=JSON.parse(await readFile(join(folder,id,'summary.json'),'utf8'));if(!this.scenes.has(id)&&['running','pending','paused','initializing'].includes(s.state))s.state='interrupted';list.push(s);}catch{}}
        send(200,list.map(s=>({id:s.id,template:s.spec?.template,state:s.state,check:s.check,steps:s.steps})));}return true;
    }
    const match=path.match(/^\/api\/scenarios\/([a-f0-9-]{36})(?:\/(start|step|pause|resume|stop|events|export|rerun|mine|cancel|expire|refund|evaluate))?$/i);
    if(!match)throw Error('SCENARIO_ROUTE');const [,id,action]=match;const s=this.scenes.get(id);
    if(!s){
      if(req.method==='POST'&&action==='rerun'){
        this.b.requireReady();const spec=JSON.parse(await readFile(join(this.b.data,'scenarios',id,'bundle.json'),'utf8'));
        const stored=JSON.parse(spec.files['scenario.json']);for(const [i,a]of stored.agents.entries())a.model.apiKey=body.agents?.[i]?.model?.apiKey??'';
        const n=new (stored.template==='service_purchase'?PurchaseScenario:Scenario)(this,{...stored,experimentMode:'independent',parentScenarioRunId:id});this.scenes.set(n.id,n);await n.persist();send(201,n.snapshot());return true;
      }
      if(req.method!=='GET')throw Error('ARCHIVED_SCENARIO_READ_ONLY');
      const f=action==='export'?'bundle.json':action==='events'?'raw/events.jsonl':'summary.json';const text=await readFile(join(this.b.data,'scenarios',id,f),'utf8');
      const value=action==='events'?text.trim().split('\n').map(t=>JSON.parse(t)):JSON.parse(text);
      if(!action){value.archived=true;if(['running','pending','paused','initializing'].includes(value.state))value.state='interrupted';}
      send(200,value);return true;}
    if(req.method==='GET'){send(200,action==='events'?s.events:action==='export'?await s.bundle():s.snapshot());return true;}
    if(action==='start'){await s.start();s.pump();send(202,s.snapshot());}
    else if(action==='step'){if(s.pumping)throw Error('STEP_IN_PROGRESS');s.pumping=true;s.queue=s.queue.then(()=>s.step()).catch(async e=>{s.error=e.message;await s.finish('error');}).finally(()=>s.pumping=false);send(202,s.snapshot());}
    else if(action==='pause'){if(body.agentId){if(!s.agents.some(a=>a.agentId===body.agentId))throw Error('AGENT_ID');s.pausedAgents.add(body.agentId);await s.emit('control.agent_pause',{agentId:body.agentId});}
      else{if(!['running','pending'].includes(s.state))throw Error('NOT_RUNNING');s.globalPauseRequested=true;s.spec.manual=true;await s.queue;if(!['completed','error'].includes(s.state))s.state='paused';await s.emit('control.global_pause',{});}send(200,s.snapshot());}
    else if(action==='resume'){if(body.agentId){s.pausedAgents.delete(body.agentId);await s.emit('control.agent_resume',{agentId:body.agentId});if(s.state==='paused'&&!s.paused)s.state='running';}
      else if(s.releaseGate){const release=s.releaseGate;s.paused=null;s.state='running';release();}else if(s.state==='paused'){s.state='running';s.spec.manual=!!body.manual;}
      s.globalPauseRequested=false;
      if(body.manual===false)s.spec.manual=false;s.pump();send(200,s.snapshot());}
    else if(action==='mine'){
      if(this.current!==id&&s.spec.template==='service_purchase'&&[2,3].includes(Number(s.job?.status))&&!this.current){
        if(this.registry.chain.env().chainInstanceId!==s.realm.epoch)throw Error('STALE_SCENARIO_CHAIN');this.b.lock();this.current=id;s.state='paused';
      }
      if(this.current!==id)throw Error('SCENARIO_NOT_ACTIVE');if(s.pumping&&s.state!=='paused')throw Error('STEP_IN_PROGRESS');
      const blocks=body.blocks??1,seconds=body.seconds??1;if(!Number.isInteger(blocks)||blocks<1||blocks>100||!Number.isInteger(seconds)||seconds<1||seconds>86400)throw Error('MINE_PARAMETERS');
      const before=await this.registry.chain.publicClient.getBlock();await s.registry.chain.mine({blocks,seconds});const after=await this.registry.chain.publicClient.getBlock();
      await s.emit('control.mine',{blocks,seconds,before:{number:String(before.number),timestamp:String(before.timestamp)},after:{number:String(after.number),timestamp:String(after.timestamp)}});
      await s.registry.reconcile(s);if(s.abort.signal.aborted)await s.finish('stopped_reconciled');else{if(s.state!=='paused')s.state='running';s.pump();}send(200,s.snapshot());}
    else if(action==='stop'){s.abort.abort();await s.emit('control.stop',{note:'Already broadcast transactions may still confirm.'});await s.queue;
      if(this.current===id)await s.finish('stopped');send(200,s.snapshot());}
    else if(action==='rerun'){const spec=copy(s.spec);for(const [i,a]of spec.agents.entries())a.model.apiKey=body.agents?.[i]?.model?.apiKey??'';
      const n=new (spec.template==='service_purchase'?PurchaseScenario:Scenario)(this,{...spec,experimentMode:'independent',parentScenarioRunId:id});this.scenes.set(n.id,n);await n.persist();send(201,n.snapshot());}
    else if(s.spec.template==='service_purchase'&&['refund','evaluate','cancel'].includes(action)){
      if(s.pumping||s.pending.length)throw Error('RECONCILE_FIRST');if(this.current&&this.current!==id)throw Error('BUSY');
      if(!this.current){this.b.lock();this.current=id;}s.abort=new AbortController();s.state='running';
      try{await s.tool(s.agents.find(a=>a.agentId===(action==='evaluate'?'evaluator':'buyer')),{name:action==='refund'?'refund_job':action==='cancel'?'cancel_job':'evaluate_report',args:{}});await s.finish('user_service_action');}
      catch(error){await s.finish('user_action_failed');throw error;}send(200,s.snapshot());
    }
    else if(action==='cancel'||action==='expire'){
      if(s.pumping||s.pending.length)throw Error('RECONCILE_FIRST');if(this.current&&this.current!==id)throw Error('BUSY');
      if(!this.current){this.b.lock();this.current=id;}s.abort=new AbortController();s.state='running';
      await s.tool(s.agents[0],{name:action==='cancel'?'cancel_order':'expire_order',args:{}});await s.finish('user_refund');send(200,s.snapshot());
    }else throw Error('SCENARIO_ACTION');return true;
  }
}
