import {txRoutes} from './tx-routes.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {randomUUID} from 'node:crypto';import {definition,jobSpec} from './tasks.mjs';import {encode,sha} from './store.mjs';
export async function handle(req,res,path,body={}){
 if(!path.startsWith('/api/v2')&&!['/tasks.html','/task-center.js','/task-center.css'].includes(path))return false;
 try{await this.init();const send=(code,v)=>this.b.send(res,code,v),url=new URL(req.url,this.b.url),key=req.headers['idempotency-key'];
  if(['/tasks.html','/task-center.js','/task-center.css'].includes(path)){const t=await readFile(join(this.b.root,'public',path.slice(1)));res.writeHead(200,{'Content-Type':path.endsWith('.js')?'text/javascript; charset=utf-8':path.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'});res.end(t);return true;}
  const method=req.method;
  const workerRead=['/api/v2/agent/commands','/api/v2/agent/context'];
  const workerWrite=['/api/v2/agents/register','/api/v2/agents/heartbeat','/api/v2/agent/results','/api/v2/agent/events'];
  const postAction=/\/api\/v2\/(agents\/[^/]+\/(start|stop)|jobs\/[^/]+\/(assign|withdraw|retry)|executions\/[^/]+\/(start|control)|environment\/init|testing\/fault)$/.test(path);
  if(workerRead.includes(path)&&method!=='GET'||workerWrite.includes(path)&&method!=='POST'||postAction&&method!=='POST')throw Object.assign(Error('METHOD_NOT_ALLOWED'),{status:405});
  if((path.startsWith('/api/v2/executions')||path==='/api/v2/diagnostics')&&!this.admin(req))throw Object.assign(Error('ADMIN_CONTEXT_REQUIRED'),{status:403});
  if(path.startsWith('/api/v2/tx-intents'))return await txRoutes.call(this,req,res,path,body);
  if(path==='/api/v2/agents/register'||path==='/api/v2/agents/heartbeat'){
   const a=this.auth(req);if(body.agentId!==a.agentId)throw Error('IDENTITY_MISMATCH');if(path.endsWith('register')){if(body.address?.toLowerCase()!==a.address.toLowerCase())throw Error('WALLET_IDENTITY');a.epoch++;a.pid=body.pid;a.heartbeat=Date.now();a.capabilities=a.capabilities.filter(c=>(body.capabilities??[]).includes(c));this.store.put('agents',a.agentId,a);}
   else{if(body.leaseEpoch!==a.epoch)throw Error('OLD_LEASE');a.heartbeat=Date.now();if(Number.isSafeInteger(body.rss)&&body.rss>0)a.rss=body.rss;a.cpu=body.cpu??null;this.store.put('agents',a.agentId,a);}send(200,{agentId:a.agentId,leaseEpoch:a.epoch,heartbeatMs:2000,offlineMs:6000});return true;
  }
  if(path.startsWith('/api/v2/agent/')){
   const a=this.auth(req);
   if(path.endsWith('/commands')){if(Number(url.searchParams.get('epoch'))!==a.epoch)throw Error('OLD_LEASE');send(200,{commands:this.store.list('commands').filter(c=>c.agentId===a.agentId&&c.leaseEpoch===a.epoch&&c.status==='pending').slice(0,1)});return true;}
   if(path.endsWith('/results')){const c=this.store.get('commands',body.commandId);if(!c||c.agentId!==a.agentId||c.leaseEpoch!==a.epoch||body.leaseEpoch!==a.epoch||c.type==='bind'&&this.store.get('leases',c.executionId+':'+c.role)?.revoked)throw Error('OLD_LEASE');
    if(c.type==='sign'){if(body.result?.signature)throw Error('USE_TX_INTENT_SUBMIT');c.result=null;}else c.result=this.b.clean(body.result);c.error=this.b.clean(body.error??null);c.status='done';this.store.put('commands',c.id,c);send(200,{ack:true,commandId:c.id});return true;}
   if(path.endsWith('/events')){const execution=this.store.get('executions',body.executionId),binding=Object.values(execution?.bindings??{}).find(l=>l.agentId===a.agentId);if(!binding||body.agentRunId!==binding.agentRunId||body.leaseEpoch!==a.epoch)throw Error('EXECUTION_IDENTITY');
    if(!['model.request','model.response','agent.progress','agent.error','agent.wait'].includes(body.type)||!Number.isSafeInteger(body.seq)||body.seq<1)throw Error('WORKER_EVENT_TYPE');
    const stream=a.agentId+':'+body.agentRunId;if(body.streamId!==stream)throw Error('STREAM_IDENTITY');const prior=this.store.db.prepare('SELECT event FROM event_outbox WHERE event_id=?').get(body.eventId),lease=this.store.get('leases',body.executionId+':'+binding.role);if(!prior&&(lease?.revoked||binding.epoch!==a.epoch||['completed','stopped'].includes(execution.state)))throw Error('CLOSED_OR_OLD_EXECUTION');const payload=this.b.clean(body.payload),e=this.store.event(body.executionId,body.type,payload,{streamId:stream,seq:body.seq,eventId:body.eventId,agentId:a.agentId,roleId:binding.role,agentRunId:body.agentRunId,leaseEpoch:body.sourceLeaseEpoch??a.epoch,causes:body.causes??[]});
    const s=this.scenes.get(body.executionId);this.fault('before_event_ack');if(s){if(!s.events.some(x=>x.eventId===e.eventId)){s.events.push(e);s.files[e.payloadRef.path]=encode(payload);}await this.archive(s);}send(200,{ack:true,event:e});return true;
   }
   if(path.endsWith('/context')){const e=this.store.get('executions',url.searchParams.get('executionId')),b=Object.values(e?.bindings??{}).find(x=>x.agentId===a.agentId);if(!b||url.searchParams.get('roleId')&&url.searchParams.get('roleId')!==b.role||url.searchParams.get('agentId')&&url.searchParams.get('agentId')!==a.agentId)throw Error('ROLE_CONTEXT_FORBIDDEN');const j=this.store.get('jobs',e.jobId);send(200,{executionId:e.id,role:b.role,goal:j.privateGoals?.[b.role],input:j.input,definitionHash:j.definitionHash});return true;}
   throw Error('WORKER_ROUTE');
  }
  if(path==='/api/v2/admin/session'){send(200,this.authManager.bootstrap(req,body,res));return true;}
  // All administrative writes use the existing local-origin and session token check.
  if(req.method!=='GET'&&!this.admin(req))throw Object.assign(Error('ADMIN_REQUIRED'),{status:403});
  if(path==='/api/v2/testing/fault'){if(process.env.LAB_ACCEPTANCE!=='1'||!this.b.data.includes('acceptance'))throw Error('TEST_ONLY');this.store.put('meta','fault',{...body,fired:false});send(200,{armed:true});return true;}
  if(path==='/api/v2/task-definitions'){
   if(req.method==='GET'){send(200,this.store.list('task_definitions'));return true;}
   const d=definition(body),id=d.taskType+'@'+d.version,old=this.store.get('task_definitions',id);if(old&&old.definitionHash!==d.definitionHash)throw Object.assign(Error('IMMUTABLE_TASK_VERSION'),{status:409});const result=this.store.idem('definition',key,body,()=>{this.store.put('task_definitions',id,d);return d;});send(201,result);return true;
  }
  if(path==='/api/v2/agents'){
   if(req.method==='GET')send(200,this.store.list('agents').map(a=>this.publicAgent(a)));else send(201,await this.provision(body));return true;
  }
  const am=path.match(/^\/api\/v2\/agents\/([a-zA-Z0-9-]+)\/(start|stop)$/);if(am){if(am[2]==='start')send(202,await this.launch(am[1]));else{const p=this.workers.get(am[1]);if(p)p.kill();const a=this.agent(am[1]);await writeFile(join(a.folder,'stop.flag'),'stop');a.epoch++;a.heartbeat=0;this.store.put('agents',a.agentId,a);send(200,{requested:true});}return true;}
  if(path==='/api/v2/jobs'){
   if(req.method==='GET'){send(200,this.store.list('jobs').map(j=>this.admin(req)?j:{id:j.id,taskType:j.taskType,version:j.version,definitionHash:j.definitionHash,input:j.input,state:j.state}));return true;}
   const defId=body.taskType+'@'+(body.version??'1.0.0'),d=this.store.get('task_definitions',defId);if(!d)throw Error('TASK_DEFINITION_NOT_INSTALLED');const parsed=jobSpec(body,d,this.b.resolveTask);const j=this.store.idem('job',key,body,()=>{const id=randomUUID(),j={id,taskType:d.taskType,version:d.version,definitionId:defId,definitionHash:d.definitionHash,definition:d,...parsed,state:'published',createdAt:new Date().toISOString()};this.store.put('jobs',id,j);return j;});send(201,j);return true;
  }
  const jm=path.match(/^\/api\/v2\/jobs\/([a-f0-9-]+)(?:\/(assign|withdraw|retry))?$/);if(jm){const j=this.store.get('jobs',jm[1]);if(!j)throw Error('JOB_UNKNOWN');if(!jm[2]){send(200,this.admin(req)?j:{id:j.id,input:j.input,state:j.state});return true;}if(jm[2]==='assign')send(202,await this.assign(j.id,body,key));else if(jm[2]==='withdraw'){if(j.state!=='published')throw Error('WITHDRAW_STATE');j.state='withdrawn';this.store.put('jobs',j.id,j);send(200,j);}else{if(j.environment.mode==='continuous')throw Error('CONTINUOUS_SNAPSHOT_UNAVAILABLE');const id=randomUUID(),next={...j,id,state:'published',executionId:null,parentExecutionId:j.executionId,attempt:(j.attempt??1)+1};this.store.put('jobs',id,next);send(201,next);}return true;}
  if(path==='/api/v2/executions'){send(200,this.store.list('executions').map(e=>({id:e.id,jobId:e.jobId,state:e.state,business:e.business??null,funds:e.funds??'none',bindings:e.bindings})));return true;}
  const em=path.match(/^\/api\/v2\/executions\/([a-f0-9-]+)(?:\/(start|control|export))?$/);if(em){const e=this.store.get('executions',em[1]);if(!e)throw Error('EXECUTION_UNKNOWN');const s=this.scenes.get(e.id);
   if(!em[2]){send(200,s?s.snapshot():e.scene??e);return true;}
   if(em[2]==='start'){const r=this.store.idem('start:'+e.id,key,body,()=>{e.autoStart=true;this.store.put('executions',e.id,e);return {executionId:e.id,state:e.state,requested:true};});send(202,r);return true;}
   if(em[2]==='export'){if(!s){const saved=JSON.parse(await readFile(join(this.b.data,'runs',e.id,'bundle.json'),'utf8'));send(200,saved);return true;}if((!['completed','stopped'].includes(s.state)||this.current===s.id)&&url.searchParams.get('incomplete')!=='1')throw Error('EXECUTION_NOT_SEALED_USE_INCOMPLETE');send(200,await s.bundle());return true;}
   if(!s)throw Error('EXECUTION_NOT_STARTED');if(['completed','stopped'].includes(s.state))throw Error('TERMINAL_EXECUTION');if(this.current!==s.id)throw Error('ENVIRONMENT_NOT_OWNED');const command=body.action;if(['mine','reconcile','cancel','expire','step'].includes(command)&&s.pumping&&s.state!=='paused')throw Error('STEP_IN_PROGRESS');const receipt=this.store.idem('control:'+e.id,key,body,()=>({controlId:randomUUID(),action:command,state:'requested'}));if(this.store.get('meta','control:'+receipt.controlId)?.ack){send(200,this.store.get('meta','control:'+receipt.controlId));return true;}
   if(command==='pause'){s.globalPauseRequested=true;s.spec.manual=true;if(!s.paused)await s.queue;if(!['completed','stopped','requires_attention'].includes(s.state))s.state='paused';await s.emit('control.acknowledged',{controlId:receipt.controlId,action:command});}
   else if(command==='step'){if(s.pumping||s.paused)throw Error('CONTROL_GATE_REQUIRES_RESUME');s.spec.manual=true;s.state='running';s.pumping=true;try{await s.step();}finally{s.pumping=false;}if(s.state==='running')s.state='paused';}
   else if(command==='resume'){for(const a of s.agents){const live=this.agent(a.profileId),l=this.store.get('leases',s.id+':'+a.role);if(!live.online)throw Error('WORKER_OFFLINE');l.revoked=false;l.epoch=live.epoch;s.bindings[a.role].epoch=live.epoch;this.store.put('leases',s.id+':'+a.role,l);for(const c of this.store.list('commands').filter(c=>c.agentId===a.profileId&&c.executionId===s.id&&c.status==='pending')){c.leaseEpoch=live.epoch;this.store.put('commands',c.id,c);}}
    await this.registry.reconcile(s);if(s.pending.length)throw Error('RECONCILE_FIRST');s.abort=new AbortController();if(s.releaseGate)s.releaseGate();s.state='running';s.globalPauseRequested=false;s.spec.manual=false;s.pump();}
   else if(command==='stop'){s.abort.abort();await s.queue;await s.finish('stopped');for(const l of this.store.list('leases').filter(l=>l.executionId===s.id)){l.revoked=true;this.store.put('leases',s.id+':'+l.role,l);}}
   else if(command==='mine'){if(this.current!==s.id)throw Error('ENVIRONMENT_NOT_OWNED');const blocks=body.blocks??1,seconds=body.seconds??1;if(!Number.isInteger(blocks)||blocks<1||blocks>100||!Number.isInteger(seconds)||seconds<1||seconds>86400)throw Error('MINE_RANGE');await this.b.chain.mine({blocks,seconds});await this.registry.reconcile(s);if(s.pending.length===0&&s.state==='pending'){s.state='running';s.pump();}await this.saveEnvironment();}
   else if(['cancel','expire'].includes(command)){if(s.pumping||s.pending.length)throw Error('RECONCILE_FIRST');const a=s.agents[0],live=this.agent(a.profileId),l=this.store.get('leases',s.id+':maker');l.revoked=false;l.epoch=live.epoch;this.store.put('leases',s.id+':maker',l);s.bindings.maker.epoch=live.epoch;s.abort=new AbortController();s.spec.pauseBeforeTransaction=false;await s.emit('control.cleanup_authorized',{action:command});await s.tool(a,{name:command==='cancel'?'cancel_order':'expire_order',args:{}});await s.finish('stopped_cleanup');}
   else if(command==='reconcile'){await this.registry.reconcile(s);await s.finish('reconciled');}else throw Error('CONTROL_ACTION');
   await s.persist();const ack={...receipt,ack:true,state:s.state,acknowledgedAt:new Date().toISOString()};this.store.put('meta','control:'+receipt.controlId,ack);send(200,ack);return true;
  }
  if(path==='/api/v2/diagnostics'){send(200,{version:'V0.15.1',node:process.version,sqlite:this.store.db.prepare('SELECT sqlite_version() AS version').get(),current:this.current,lastError:this.lastError??null,chain:this.b.chain.env(),processId:process.pid,resources:{control:process.memoryUsage(),controlCpu:process.cpuUsage(),workers:this.store.list('agents').map(a=>({agentId:a.agentId,rss:a.rss??null,cpu:a.cpu??null,heartbeat:a.heartbeat}))}});return true;}
  if(path==='/api/v2/environment/init'){await this.b.ensureReady();await this.saveEnvironment();send(200,this.b.chain.env());return true;}
  throw Error('V2_ROUTE');
 }catch(error){this.b.send(res,error.status??400,{error:error.message});return true;}
}
