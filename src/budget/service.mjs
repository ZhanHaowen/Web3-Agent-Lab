import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {ROOT,stringify,config,bindLibrary,library,units} from './common.mjs';
import {LabChain,BudgetExperiment,sleep} from './engine.mjs';
import {createBudgetDecision} from './agent.mjs';
import {inferTaskGoal} from './policy.mjs';
import {checkEvidence,seal} from './checker.mjs';
const assets={
 '/budget.html':['public/budget.html','text/html; charset=utf-8'],
 '/budget.js':['public/budget.js','text/javascript; charset=utf-8'],
 '/budget-evidence.js':['public/budget-evidence.js','text/javascript; charset=utf-8'],
 '/budget.css':['public/budget.css','text/css; charset=utf-8']
};
const executionIdPattern=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
async function writeAtomic(file,value){
 const temporary=file+'.tmp';
 await writeFile(temporary,stringify(value));
 await rename(temporary,file);
}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(stringify(value));}
async function readBody(req){
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>32768)throw Error('BODY_LIMIT');chunks.push(chunk);}
 return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{};
}
export class BudgetService{
 constructor({root=ROOT,data=join(ROOT,'data/budget'),port=4317,lib=null,standalone=false,modelResolver,assertLocalModel}={}){
  this.root=root;this.data=resolve(data);this.port=Number(port);this.standalone=standalone;this.origin='http://127.0.0.1:'+this.port;
  this.token=randomBytes(32).toString('hex');this.saveQueue=Promise.resolve();this.busy=false;this.closing=false;this.active=null;
  this.modelResolver=modelResolver;this.assertLocalModel=assertLocalModel;
  if(lib)bindLibrary(lib);
 }
 async init(){
  if(!this.ready)this.ready=(async()=>{await mkdir(this.data,{recursive:true});this.build=JSON.parse(await readFile(join(this.root,'build-info.json'),'utf8'));})();
  await this.ready;
 }
 incompleteEvidence(view){
  const {id,working,check,...evidence}=view;
  return {...evidence,schema:'cross-path-budget-v4',executionId:id,buildHash:this.build.sourceHash,
   archive:{status:'incomplete',reason:view.error??(this.closing?'PLATFORM_STOPPING':'RUN_NOT_FINALIZED')}};
 }
 persist(view,bundle){
  const id=view.id;
  const archive=bundle??(view.stage==='completed'?null:seal(this.incompleteEvidence(view)));
  this.saveQueue=this.saveQueue.then(async()=>{
   if(archive){
    await writeAtomic(join(this.data,id+'.json'),archive);
    this.archivedId=id;
   }
   await writeAtomic(join(this.data,'current.json'),view);
  }).catch(()=>{this.persistenceError=true;});
 }
 view(){
  if(!this.current)return {stage:'idle'};
  const view=this.current.view();
  if(view.stage==='error')view.check=checkEvidence(this.incompleteEvidence(view));
  return {...view,buildHash:this.build.sourceHash,archived:this.archivedId===view.id};
 }
 get localModelActive(){return this.current?.config.model?.backend==='local'&&!['completed','error'].includes(this.current.stage);}
 assertOpen(){if(this.closing)throw Error('PLATFORM_STOPPING');}
 async resolveModel(input,apiKey){
  if(apiKey!==undefined&&(typeof apiKey!=='string'||apiKey.length>2048||/[^\x21-\x7e]/.test(apiKey)))throw Error('MODEL_API_KEY');
  const {backend,...options}=input.model;
  if(backend==='api')return {...options,provider:'api',apiKey};
  if(apiKey)throw Error('LOCAL_MODEL_DOES_NOT_ACCEPT_REMOTE_CREDENTIALS');
  if(!this.modelResolver)throw Error('LOCAL_MODEL_UNAVAILABLE');
  const model=await this.modelResolver({...options,provider:'local'});
  if(model?.provider!=='local'||!model.baseUrl||!model.model)throw Error('LOCAL_MODEL_UNAVAILABLE');
  return model;
 }
 async mutate(path,body){
  this.assertOpen();if(this.busy)throw Error('EXPERIMENT_BUSY');this.busy=true;
  const operation=(async()=>{
   try{
    if(path==='/start'||path==='/run'){
     if(this.current&&!['completed','error'].includes(this.current.stage))throw Error('ACTIVE_OR_UNCERTAIN_EXPERIMENT');
     if(Object.keys(body).some(k=>!['config','apiKey'].includes(k)))throw Error('BODY_FIELDS');
     const input=config(body.config);
     const model=await this.resolveModel(input,body.apiKey);
     const {LabActionProvider:ActionProvider}=await library();
     const decide=createBudgetDecision({model,ActionProvider,assertModel:this.assertLocalModel});
     await this.current?.close();
     if(this.current?.stage==='error'){
      await this.chain?.stop();
      this.chain=null;
     }
     this.assertOpen();
     const needsChain=!this.chain;
     this.chain??=new LabChain();
     this.current=new BudgetExperiment(this.chain,input,v=>this.persist(v),decide,{buildHash:this.build.sourceHash});
     this.persist(this.current.view());
     await this.saveQueue;
     this.assertOpen();
     try{
      if(needsChain)await this.chain.start(process.env.BUDGET_CHAIN_PORT?Number(process.env.BUDGET_CHAIN_PORT):undefined);
      await this.current.initialize();
     }catch(error){
      this.current.markFailed(error,'INITIALIZATION_FAILED');
      if(needsChain){await this.chain.stop();this.chain=null;}
      throw Error(this.current.error);
     }
     this.assertOpen();if(path==='/run')await this.current.run();
    }else{
     if(Object.keys(body).some(k=>!(path==='/review'?['executionId','reviewId','decision']:['executionId']).includes(k))||!this.current||body.executionId!==this.current.id)throw Error('EXECUTION_SCOPE');
     if(path==='/review')await this.current.review(body);
     else {if(this.current.stage!=='decision')throw Error('EXPERIMENT_FINISHED');await this.current.step();}
    }
    if(this.current.bundle){
     this.persist(this.current.view(),this.current.bundle);
     await this.current.close();
    }
    await this.saveQueue;
    if(this.persistenceError)throw Error('EVIDENCE_PERSISTENCE_ERROR');
    return this.view();
   }catch(error){
    if(this.current?.stage==='error'){
     await this.current.close();
     await this.saveQueue;
    }
    throw error;
   }finally{this.busy=false;}
  })();
  this.active=operation;try{return await operation;}finally{if(this.active===operation)this.active=null;}
 }
 async handle(req,res,path){
  if(!assets[path]&&!path.startsWith('/api/budget/'))return false;
  try{
   await this.init();const origins=[this.origin,'http://localhost:'+this.port];
   if(!['127.0.0.1:'+this.port,'localhost:'+this.port].includes(req.headers.host??''))throw Error('HOST');
   if(req.headers.origin&&!origins.includes(req.headers.origin))throw Error('ORIGIN');
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
   if(assets[path]){
    if(req.method!=='GET')throw Error('METHOD_NOT_ALLOWED');const [file,type]=assets[path];
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(await readFile(join(this.root,file)));return true;
   }
   const action=path.slice('/api/budget'.length);
   if(req.method==='GET'&&action==='/health'){
    send(res,200,{app:'web3-agent-budget-lab',version:this.build.displayVersion,integrated:!this.standalone,buildHash:this.build.sourceHash,archiveProtocol:1,root:this.root,dataDirectory:this.data,csrfToken:this.token,pid:process.pid,chainPort:this.chain?.port,chainPid:this.chain?.process?.pid});return true;
   }
   if(req.method==='GET'&&action==='/state'){send(res,200,this.view());return true;}
   if(req.method==='GET'&&action==='/export'){
    const query=new URL(req.url,this.origin).searchParams;
    const id=query.get('executionId')??this.current?.id;
    if(!id)throw Error('NOT_SEALED');
    if(!executionIdPattern.test(id))throw Error('EXECUTION_SCOPE');
    let bundle;
    try{bundle=JSON.parse(await readFile(join(this.data,id+'.json'),'utf8'));}
    catch(error){if(error.code==='ENOENT')throw Error('NO_ARCHIVED_RUN');throw error;}
    if(query.get('download')==='1')res.setHeader('Content-Disposition','attachment; filename="budget-'+id+'.json"');
    send(res,200,bundle);return true;
   }
   if(req.method!=='POST'){send(res,404,{error:'NOT_FOUND'});return true;}
   if(!origins.includes(req.headers.origin))throw Error('ORIGIN');
   if(req.headers['x-budget-token']!==this.token)throw Error('AUTH');
   if(!['/start','/run','/step','/review','/suggest-goal'].includes(action)){send(res,404,{error:'NOT_FOUND'});return true;}
   const body=await readBody(req);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('BODY_FIELDS');
   if(action==='/suggest-goal'){
    if(Object.keys(body).some(key=>key!=='task'))throw Error('BODY_FIELDS');
    if(typeof body.task!=='string'||!body.task.trim()||body.task.length>4000)throw Error('BUDGET_TASK_REQUIRED');
    const taskGoal=inferTaskGoal(body.task);
    if(taskGoal){
     try{units(taskGoal.direct,true);units(taskGoal.permit2,true);}
     catch{send(res,200,{taskGoal:null});return true;}
    }
    send(res,200,{taskGoal});return true;
   }
   send(res,200,await this.mutate(action,body));return true;
  }catch(e){
   const code=/^[A-Z][A-Z0-9_]+$/.test(e.message)?e.message:'INVALID_REQUEST_OR_INFRASTRUCTURE';
   send(res,code==='EXPERIMENT_BUSY'?409:['AUTH','ORIGIN','HOST'].includes(code)?403:code==='PLATFORM_STOPPING'?503:400,{error:code});return true;
  }
 }
 async shutdown(){
  if(this.stopPromise)return this.stopPromise;this.closing=true;this.current?.abort();
  this.stopPromise=(async()=>{
   if(this.active)await Promise.race([this.active.catch(()=>{}),sleep(10000)]);
   this.current?.abort();await this.current?.close();await this.chain?.stop();
   if(this.active)await Promise.race([this.active.catch(()=>{}),sleep(2000)]);
   await this.current?.close();await this.chain?.stop();
   if(this.current&&!this.current.bundle)this.persist(this.current.view());
   await this.saveQueue;
  })();return this.stopPromise;
 }
}
