import {readFile,writeFile,mkdir,readdir,stat,lstat,realpath} from 'node:fs/promises';
import {join,resolve,relative,sep} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {runResearchExperiment} from './engine.mjs';
import {normalizeResearchConfig} from './manifest.mjs';
import {createPaymentEnvironment} from '../payments/index.mjs';
import {createEscrowEnvironment} from './escrow.mjs';
import {createMppPaymentEnvironment} from '../payments/mpp.mjs';
import {generateMarketplaceBackground} from './background.mjs';
import {observerFiles,validatePublicObserver} from '../observer/index.mjs';
import {modelRecordRedactor} from '../model/capture.mjs';
import {protocolMatrix,resolvePaymentProfile} from './protocols.mjs';
import {makeDataset} from './dataset.mjs';
import {evaluateDataset,evaluateNegativeControls} from './evaluation.mjs';

const json=x=>JSON.stringify(x,(_k,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';
const assets={'/research.html':['research.html','text/html'],'/research.js':['research.js','text/javascript'],'/research.css':['research.css','text/css'],'/research-observer.html':['research-observer.html','text/html'],'/research-observer.js':['research-observer.js','text/javascript']};
const safeId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x);
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(json(value));}
async function body(req){let n=0,parts=[];for await(const chunk of req){n+=chunk.length;if(n>128*1024)throw Error('BODY_LIMIT');parts.push(chunk);}const value=JSON.parse(Buffer.concat(parts).toString()||'{}');if(!value||Array.isArray(value)||typeof value!=='object')throw Error('BODY_FIELDS');return value;}
async function optionalJson(file){try{if((await lstat(file)).isSymbolicLink())throw Error('BUNDLE_SYMLINK');return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}

export class ResearchService {
 constructor({root,data,port=4317,modelResolver,captureRuntimeEvidence,runtimeEvidenceCursor,paymentFactory=options=>options.scheme==='erc8183'?createEscrowEnvironment(options):options.scheme==='mpp-evm-charge'?createMppPaymentEnvironment(options):createPaymentEnvironment(options),runner=runResearchExperiment}={}){
  this.root=resolve(root);this.data=resolve(data);this.port=Number(port);this.token=randomBytes(32).toString('hex');
  this.modelResolver=modelResolver;this.captureRuntimeEvidence=captureRuntimeEvidence;this.runtimeEvidenceCursor=runtimeEvidenceCursor;
  this.paymentFactory=paymentFactory;this.runner=runner;this.active=null;this.events=[];this.closing=false;
 }
 get busy(){return Boolean(this.active);}
 async init(){await mkdir(join(this.data,'runs'),{recursive:true});await mkdir(join(this.data,'evaluations'),{recursive:true});await mkdir(join(this.data,'states'),{recursive:true});}
 async assertRun(id){if(!safeId(id))throw Error('RUN_ID');const runs=join(this.data,'runs'),dir=join(runs,id);for(const path of [runs,dir]){const info=await lstat(path);if(info.isSymbolicLink()||!info.isDirectory())throw Error('BUNDLE_SYMLINK');}const base=await realpath(runs),actual=await realpath(dir),rel=relative(base,actual);if(rel.startsWith('..')||rel.includes(sep))throw Error('BUNDLE_PATH');return dir;}
 async list(){await this.init();const rows=[];for(const id of await readdir(join(this.data,'runs'))){if(!safeId(id))continue;const dir=await this.assertRun(id);const summary=await optionalJson(join(dir,'summary.json'));const state=await optionalJson(join(this.data,'states',id+'.json'));if(summary||state)rows.push({id,summary,state});}return rows.sort((a,b)=>(b.state?.startedAt??'').localeCompare(a.state?.startedAt??''));}
 async start(input){
  if(this.closing)throw Error('PLATFORM_STOPPING');if(this.active)throw Error('EXPERIMENT_BUSY');
  if(!input?.config)throw Error('CONFIG_REQUIRED');
  if(input.backgroundCount!==undefined&&(!Number.isInteger(input.backgroundCount)||input.backgroundCount<0||input.backgroundCount>3))throw Error('BACKGROUND_COUNT');
  const config=structuredClone(input.config),profile=resolvePaymentProfile(input.profile??'x402-exact');
  config.payment={scheme:profile.scheme==='batch-settlement'?'batch':profile.scheme,authorization:profile.authorization};normalizeResearchConfig(config);
  const id=randomUUID(),outDir=join(this.data,'runs',id),abort=new AbortController();
  const clean=modelRecordRedactor(config.model??{}).clean;
  const operation={id,abort,promise:null};this.active=operation;this.events=[];
  const startedAt=new Date().toISOString();
  operation.promise=(async()=>{
   try{
    await this.init();await mkdir(outDir,{recursive:true});
    if(this.closing||abort.signal.aborted)throw Error('RESEARCH_CANCELLED');
    await writeFile(join(this.data,'states',id+'.json'),json({id,profile:profile.id,startedAt,state:'running'}));
    const build=await optionalJson(join(this.root,'build-info.json'));
    const summary=await this.runner(config,{runId:id,outDir,root:this.root,paymentDataDir:join(this.data,'runtime',id),paymentFactory:this.paymentFactory,signal:abort.signal,
     softwareIdentity:{version:build?.version??null,sourceHash:build?.sourceHash??null,node:process.version,platform:process.platform,architecture:process.arch,executionOptions:{profile:profile.id,backgroundCount:input.backgroundCount??0,backgroundMode:'controlled-interleaving'}},
     modelResolver:this.modelResolver,captureRuntimeEvidence:this.captureRuntimeEvidence,runtimeEvidenceCursor:this.runtimeEvidenceCursor,
     beforePurchase:input.backgroundCount?async({payments,purchaseIndex,journal})=>{const background=await generateMarketplaceBackground({rpcUrl:payments.rpcUrl,tokenAddress:payments.token.address,providers:payments.providers.map(p=>p.address),count:input.backgroundCount,seed:String(config.seed)+':'+purchaseIndex});await journal.record('research.background',background);if(background.status!=='complete')throw Error('BACKGROUND_INCOMPLETE');}:undefined,
     emit:(event,payload)=>{const row=clean(typeof event==='string'?{type:event,payload}:event);this.events.push(row);if(this.events.length>300)this.events.shift();},
    });
    await writeFile(join(this.data,'states',id+'.json'),json({id,profile:profile.id,startedAt,endedAt:new Date().toISOString(),state:'sealed',status:summary.status}));
   }catch(e){await writeFile(join(this.data,'states',id+'.json'),json({id,profile:profile.id,startedAt,endedAt:new Date().toISOString(),state:abort.signal.aborted?'cancelled':'error',error:clean(String(e.message)).slice(0,2000)}));}
   finally{if(this.active===operation)this.active=null;}
  })();
  operation.promise.catch(()=>{this.persistenceError=true;});
  return {id,state:'running'};
 }
 async readRun(id){const dir=await this.assertRun(id),summary=await optionalJson(join(dir,'summary.json')),state=await optionalJson(join(this.data,'states',id+'.json'));if(!summary&&!state)throw Error('RUN_NOT_FOUND');return {id,summary,state,checker:await optionalJson(join(dir,'checker.json'))};}
 async bundle(id,visibility){
  const row=await this.readRun(id);if(row.state?.state==='running'||this.active?.id===id)throw Error('RUN_NOT_SEALED');
  const base=join(this.data,'runs',id),dir=visibility==='public'?join(base,'observer'):base,files={};let bytes=0;
  if((await lstat(dir)).isSymbolicLink())throw Error('BUNDLE_SYMLINK');
  if(visibility==='public'){
   const file=join(dir,'observer.json');if((await lstat(file)).isSymbolicLink())throw Error('BUNDLE_SYMLINK');
   const observer=JSON.parse(await readFile(file,'utf8')),valid=validatePublicObserver(observer);if(!valid.ok)throw Error('INVALID_PUBLIC_OBSERVER');
   return {schema:'web3-observer-bundle-v1',visibility:'public-observer',files:observerFiles(observer)};
  }
  async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){const full=join(path,entry.name);if(entry.isSymbolicLink())throw Error('BUNDLE_SYMLINK');if(entry.isDirectory())await walk(full);else{const size=(await stat(full)).size;bytes+=size;if(bytes>128*1024*1024)throw Error('BUNDLE_LIMIT');const rel=relative(dir,full).split(sep).join('/');files[rel]=await readFile(full,'utf8');}}}
  await walk(dir);
  // Public export names and envelope deliberately contain no private run ID or summary.
  return visibility==='public'?{schema:'web3-observer-bundle-v1',visibility:'public-observer',files}:{schema:'web3-research-private-bundle-v1',visibility:'private-researcher-only',runId:id,files};
 }
 async evaluate(input){
  const ids=input.ids;if(!Array.isArray(ids)||ids.length<5||ids.length>500||new Set(ids).size!==ids.length)throw Error('EVALUATION_RUNS_5_TO_500');
  const samples=[];for(const id of ids){const run=await this.readRun(id);if(run.state?.state!=='sealed')throw Error('RUN_NOT_SEALED');const dir=join(this.data,'runs',id);const observer=await optionalJson(join(dir,'observer/observer.json')),truth=await optionalJson(join(dir,'private/ground-truth.json'));if(!observer||!truth)throw Error('EVALUATION_EVIDENCE_MISSING');samples.push({sampleId:id,observer,truth});}
  const dataset=makeDataset({samples,seed:input.seed??'research-v1',groupBy:input.groupBy??'instance',featureOptions:input.featureOptions??{}});
  const evaluation=evaluateDataset(dataset),controls=evaluateNegativeControls(dataset),id=randomUUID();
  const report={id,dataset,evaluation,controls,warning:'Constructed local benchmark. Metrics are not evidence of general real-world privacy leakage.'};
  await writeFile(join(this.data,'evaluations',id+'.json'),json(report));return report;
 }
 async handle(req,res,path){
  if(!assets[path]&&!path.startsWith('/api/research/'))return false;
  try{
   const origins=['http://127.0.0.1:'+this.port,'http://localhost:'+this.port];
   if(!['127.0.0.1:'+this.port,'localhost:'+this.port].includes(req.headers.host??''))throw Error('HOST');
   if(req.headers.origin&&!origins.includes(req.headers.origin))throw Error('ORIGIN');
   if(req.headers['sec-fetch-site']==='cross-site')throw Error('ORIGIN');
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src "+(path.includes('observer')?"'none'":"'self'")+"; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
   if(assets[path]){if(req.method!=='GET')throw Error('METHOD');const [name,type]=assets[path];res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(await readFile(join(this.root,'public',name)));return true;}
   await this.init();const action=path.slice('/api/research'.length),url=new URL(req.url,origins[0]);
   if(req.method==='GET'&&action==='/health'){send(res,200,{version:'V0.17.0 Research Beta',csrfToken:this.token,busy:this.busy,dataDirectory:this.data});return true;}
   if(req.headers['x-research-token']!==this.token)throw Error('AUTH');
   if(req.method==='GET'){
    if(action==='/protocols')send(res,200,protocolMatrix());
    else if(action==='/runs')send(res,200,{runs:await this.list(),active:this.active?.id??null,events:this.events});
    else if(action==='/run')send(res,200,await this.readRun(url.searchParams.get('id')));
    else if(action==='/export'){
     const visibility=url.searchParams.get('visibility');if(!['public','private'].includes(visibility))throw Error('VISIBILITY');
     res.setHeader('Content-Disposition','attachment; filename="'+(visibility==='public'?'public-observer':'private-research')+'.json"');send(res,200,await this.bundle(url.searchParams.get('id'),visibility));
    }else send(res,404,{error:'NOT_FOUND'});return true;
   }
   if(req.method!=='POST')throw Error('METHOD');if(!origins.includes(req.headers.origin))throw Error('ORIGIN');
   const input=await body(req);
   if(action==='/run')send(res,202,await this.start(input));
   else if(action==='/cancel'){if(!this.active||input.id!==this.active.id)throw Error('RUN_ID');this.active.abort.abort();send(res,202,{state:'cancelling'});}
   else if(action==='/evaluate')send(res,200,await this.evaluate(input));
   else send(res,404,{error:'NOT_FOUND'});return true;
  }catch(e){const code=/^[A-Z][A-Z0-9_]+$/.test(e.message)?e.message:'INVALID_REQUEST_OR_INFRASTRUCTURE';send(res,['AUTH','HOST','ORIGIN'].includes(code)?403:code==='EXPERIMENT_BUSY'?409:400,{error:code});return true;}
 }
 async shutdown(){this.closing=true;this.active?.abort.abort();await this.active?.promise;}
}


