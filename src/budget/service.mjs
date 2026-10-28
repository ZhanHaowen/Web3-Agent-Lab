import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {ROOT,stringify,config,bindLibrary} from './common.mjs';
import {LabChain,BudgetExperiment,sleep} from './engine.mjs';
const assets={
 '/budget.html':['budget.html','text/html; charset=utf-8'],
 '/budget.js':['budget.js','text/javascript; charset=utf-8'],
 '/budget-presets.js':['budget-presets.js','text/javascript; charset=utf-8'],
 '/budget.css':['budget.css','text/css; charset=utf-8']
};
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(stringify(value));}
async function readBody(req){
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>16384)throw Error('BODY_LIMIT');chunks.push(chunk);}
 return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{};
}
export class BudgetService{
 constructor({root=ROOT,data=join(ROOT,'data/budget'),port=4317,lib=null,standalone=false}={}){
  this.root=root;this.data=resolve(data);this.port=Number(port);this.standalone=standalone;this.origin='http://127.0.0.1:'+this.port;
  this.token=randomBytes(32).toString('hex');this.saveQueue=Promise.resolve();this.busy=false;this.closing=false;this.active=null;
  if(lib)bindLibrary(lib);
 }
 async init(){
  if(!this.ready)this.ready=(async()=>{await mkdir(this.data,{recursive:true});this.build=JSON.parse(await readFile(join(this.root,'build-info.json'),'utf8'));})();
  await this.ready;
 }
 persist(view){this.saveQueue=this.saveQueue.then(()=>writeFile(join(this.data,'current.json'),stringify(view))).catch(()=>{this.persistenceError=true;});}
 assertOpen(){if(this.closing)throw Error('PLATFORM_STOPPING');}
 async mutate(path,body){
  this.assertOpen();if(this.busy)throw Error('EXPERIMENT_BUSY');this.busy=true;
  const operation=(async()=>{
   try{
    if(path==='/start'||path==='/run'){
     if(this.current&&this.current.stage!=='completed')throw Error('ACTIVE_OR_UNCERTAIN_EXPERIMENT');
     if(Object.keys(body).some(k=>k!=='config'))throw Error('BODY_FIELDS');
     const input=config(body.config??{});await this.current?.close();this.assertOpen();
     if(!this.chain){
      // Retain ownership before awaiting startup, including when shutdown races.
      this.chain=new LabChain();
      await this.chain.start(process.env.BUDGET_CHAIN_PORT?Number(process.env.BUDGET_CHAIN_PORT):undefined);
     }
     this.assertOpen();this.current=new BudgetExperiment(this.chain,input,v=>this.persist(v));
     await this.current.initialize();this.assertOpen();if(path==='/run')await this.current.run();
    }else{
     if(Object.keys(body).some(k=>k!=='executionId')||!this.current||body.executionId!==this.current.id)throw Error('EXECUTION_SCOPE');
     await this.current.step();
    }
    if(this.current.bundle){
     await this.saveQueue;if(this.persistenceError)throw Error('EVIDENCE_PERSISTENCE_ERROR');
     await writeFile(join(this.data,this.current.id+'.json'),stringify(this.current.bundle));await this.current.close();
    }
    return this.current.view();
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
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(await readFile(join(this.root,'public',file)));return true;
   }
   const action=path.slice('/api/budget'.length);
   if(req.method==='GET'&&action==='/health'){
    send(res,200,{app:'web3-agent-budget-lab',version:this.build.displayVersion,integrated:!this.standalone,buildHash:this.build.sourceHash,root:this.root,dataDirectory:this.data,csrfToken:this.token,pid:process.pid,chainPort:this.chain?.port,chainPid:this.chain?.process?.pid});return true;
   }
   if(req.method==='GET'&&action==='/state'){send(res,200,this.current?.view()??{stage:'idle'});return true;}
   if(req.method==='GET'&&action==='/export'){
    if(!this.current?.bundle)throw Error('NOT_SEALED');
    if(new URL(req.url,this.origin).searchParams.get('download')==='1')res.setHeader('Content-Disposition','attachment; filename="budget-'+this.current.id+'.json"');
    send(res,200,this.current.bundle);return true;
   }
   if(req.method!=='POST'){send(res,404,{error:'NOT_FOUND'});return true;}
   if(!origins.includes(req.headers.origin))throw Error('ORIGIN');
   if(req.headers['x-budget-token']!==this.token)throw Error('AUTH');
   if(!['/start','/run','/step'].includes(action)){send(res,404,{error:'NOT_FOUND'});return true;}
   const body=await readBody(req);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('BODY_FIELDS');
   send(res,200,await this.mutate(action,body));return true;
  }catch(e){
   const code=/^[A-Z][A-Z0-9_]+$/.test(e.message)?e.message:'INVALID_REQUEST_OR_INFRASTRUCTURE';
   send(res,code==='EXPERIMENT_BUSY'?409:['AUTH','ORIGIN','HOST'].includes(code)?403:code==='PLATFORM_STOPPING'?503:400,{error:code});return true;
  }
 }
 async shutdown(){
  if(this.stopPromise)return this.stopPromise;this.closing=true;if(this.current)this.current.stopping=true;
  this.stopPromise=(async()=>{
   if(this.active)await Promise.race([this.active.catch(()=>{}),sleep(10000)]);
   if(this.current)this.current.stopping=true;await this.current?.close();await this.chain?.stop();
   if(this.active)await Promise.race([this.active.catch(()=>{}),sleep(2000)]);
   await this.current?.close();await this.chain?.stop();await this.saveQueue;
  })();return this.stopPromise;
 }
}
