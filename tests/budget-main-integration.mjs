import {artifactPath} from './helpers/artifacts.mjs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {ROOT} from '../src/budget/common.mjs';
import {freePort,sleep} from '../src/budget/engine.mjs';

const results=[];
let buildHash=null;
const owned=[];
function alive(pid){
 if(!Number.isSafeInteger(pid)||pid<=0)return false;
 try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;throw e;}
}
async function waitUntil(predicate,timeout=15000){
 const end=Date.now()+timeout;
 while(Date.now()<end){if(await predicate())return;await sleep(50);}
 throw Error('WAIT_TIMEOUT');
}
async function check(name,fn){
 const started=Date.now();
 try{const detail=await fn();results.push({name,passed:true,elapsedMs:Date.now()-started,...(detail?{detail}:{})});console.log('PASS',name);}
 catch(e){results.push({name,passed:false,elapsedMs:Date.now()-started,error:e.message});console.error('FAIL',name,e.stack);process.exitCode=1;}
}
async function launch(){
 const port=await freePort(),chainPort=await freePort();
 const data=join(ROOT,'data-v0153-main-test',randomUUID());
 const origin='http://127.0.0.1:'+port;
 await mkdir(data,{recursive:true});
 const p=spawn(process.execPath,[join(ROOT,'dist/server.mjs')],{
  cwd:ROOT,windowsHide:true,stdio:['ignore','pipe','pipe'],
  env:{...process.env,LAB_PORT:String(port),LAB_CHAIN_PORT:String(chainPort),LAB_ROOT:ROOT,LAB_DATA_DIR:data,
   LAB_LIBRARY_ONLY:'',LAB_AGENT_WORKER:'',BUDGET_PORT:'',BUDGET_CHAIN_PORT:'',BUDGET_DATA_DIR:''}
 });
 const c={p,port,chainPort,data,origin,log:'',mainToken:'',budgetToken:'',stopped:false};
 owned.push(c);
 p.stdout.on('data',b=>c.log=(c.log+b).slice(-6000));p.stderr.on('data',b=>c.log=(c.log+b).slice(-6000));
 c.request=async(path,body,headers={})=>{
  const r=await fetch(origin+path,{
   method:body===undefined?'GET':'POST',
   headers:{Origin:origin,'Content-Type':'application/json',...(body===undefined?{}:{'X-Budget-Token':c.budgetToken}),...headers},
   ...(body===undefined?{}:{body:JSON.stringify(body)}),
   signal:AbortSignal.timeout(45000)
  });
  const contentType=r.headers.get('content-type')??'';
  const value=contentType.includes('json')?await r.json():await r.text();
  return {status:r.status,value,headers:r.headers};
 };
 await waitUntil(async()=>{
  if(p.exitCode!==null)throw Error('MAIN_START_FAILED '+c.log);
  try{const h=await c.request('/api/health');if(h.status!==200||h.value.app!=='web3-agent-lab')return false;c.mainToken=h.value.csrfToken;buildHash=h.value.version?.sourceHash;return !!c.mainToken;}catch(e){c.startupError=e.cause?.code??e.message;return false;}
 },20000).catch(e=>{throw Error(e.message+'; last connection error: '+(c.startupError??'none')+'; main log: '+c.log);});
 const h=await c.request('/api/budget/health');
 assert.equal(h.status,200,JSON.stringify(h.value));c.budgetToken=h.value.csrfToken;
 assert.ok(c.budgetToken,'budget module did not provide its scoped CSRF token');
 return c;
}
async function ok(c,path,body,headers={}){
 const r=await c.request(path,body,headers);
 assert.equal(r.status,200,JSON.stringify(r.value));return r.value;
}
async function rpc(url,method,params=[]){
 const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 const value=await r.json();if(value.error)throw Error(JSON.stringify(value.error));return value.result;
}
async function stop(c){
 if(c.stopped)return;
 if(c.p.exitCode===null){
  try{await c.request('/api/shutdown',{}, {'X-Lab-Token':c.mainToken});}catch{}
  await waitUntil(()=>c.p.exitCode!==null,20000);
 }
 c.stopped=true;
}
let c;
try{
 c=await launch();
 await check('main-only startup serves budget category and assets on a custom port',async()=>{
  assert.notEqual(c.port,4317);
  const page=await ok(c,'/budget.html');
  assert.equal(typeof page,'string');
  const heading=page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]??'';
  assert.ok(/预算|授权/.test(heading),'category heading missing');
  assert.ok(!/\d/.test(heading),'category heading is still tied to a numeric example');
  const links=[...page.matchAll(/\bhref=["']([^"']+)["']/g)].map(x=>x[1]);
  assert.ok(links.includes('/tasks.html'),'task-center navigation is not relative');
  assert.ok(links.includes('/services.html'),'service navigation is not relative');
  assert.ok(!links.some(x=>/localhost:4319|127\.0\.0\.1:4319/.test(x)),'UI still directs users to the standalone port');
  for(const asset of ['/budget.js','/budget.css','/budget-presets.js']){
   const r=await c.request(asset);assert.equal(r.status,200,asset+' '+JSON.stringify(r.value));assert.ok(String(r.value).length>100,asset+' is empty');
  }
  return {mainPort:c.port,heading};
 });
 await check('budget mutations require exact origin and their scoped token',async()=>{
  assert.equal((await c.request('/api/budget/run',{config:{}},{Origin:'http://example.com'})).status,403);
  assert.equal((await c.request('/api/budget/run',{config:{}},{'X-Budget-Token':''})).status,403);
  assert.equal((await c.request('/api/budget/run',{config:{}},{'X-Budget-Token':'','X-Lab-Token':c.mainToken})).status,403);
  assert.equal((await c.request('/api/v2/executions')).status,403);
 });
 let mainBefore,anchor,codeBefore,mainRpc;
 await check('original main chain initializes independently of the budget module',async()=>{
  mainBefore=await ok(c,'/api/environment/init',{}, {'X-Lab-Token':c.mainToken});
  assert.equal(mainBefore.ready,true);assert.equal(resolve(mainBefore.dataDirectory),resolve(c.data));
  mainRpc=mainBefore.environment.rpcUrl;
  assert.equal(new URL(mainRpc).port,String(c.chainPort));
  anchor=await rpc(mainRpc,'eth_getBlockByNumber',['latest',false]);
  codeBefore=await rpc(mainRpc,'eth_getCode',[mainBefore.environment.contracts.tokenA,'latest']);
  assert.ok(codeBefore.length>2);
  assert.ok(mainBefore.environment.chainInstanceId);
 });
 await check('custom split values reproduce 355 actual, 175 normal counter and 55 excess',async()=>{
  const s=await ok(c,'/api/budget/run',{config:{mode:'split',initial:'1000',budget:'300',payment:'175',permit:'180',secondPath:'permit'}});
  assert.equal(s.stage,'completed');assert.equal(s.check.reproduction,true);assert.equal(s.check.status,'failed');
  assert.equal(s.check.actualSpent,'355000000');assert.equal(s.check.normalTransactionCounter,'175000000');
  assert.equal(s.check.overspend,'55000000');assert.equal(s.final.balance,'645000000');
  assert.equal(new Set(s.events.map(e=>e.sessionId)).size,1);
 });
 await check('the same custom values under unified policy reject the second commitment',async()=>{
  const s=await ok(c,'/api/budget/run',{config:{mode:'unified',initial:'1000',budget:'300',payment:'175',permit:'180',secondPath:'permit'}});
  assert.equal(s.stage,'completed');assert.equal(s.check.status,'success');assert.equal(s.check.reproduction,false);
  assert.equal(s.check.actualSpent,'175000000');assert.equal(s.final.balance,'825000000');
  assert.equal(s.blocked.reason,'TASK_BUDGET_EXCEEDED');
  assert.equal(s.events.some(e=>e.type==='permit.signed'),false);
 });
 await check('fractional values execute exactly without floating-point rounding',async()=>{
  const s=await ok(c,'/api/budget/run',{config:{mode:'split',initial:'2',budget:'0.75',payment:'0.4',permit:'0.5',secondPath:'permit'}});
  assert.equal(s.check.reproduction,true);assert.equal(s.check.actualSpent,'900000');
  assert.equal(s.check.normalTransactionCounter,'400000');assert.equal(s.check.overspend,'150000');assert.equal(s.final.balance,'1100000');
  const exported=await ok(c,'/api/budget/export');
  assert.equal(exported.format,'web3-agent-budget-experiment');
  assert.ok(!JSON.stringify(exported).includes('"signature":'));
 });
 await check('budget execution preserves main data path, chain identity and original contract code',async()=>{
  assert.ok(mainBefore&&anchor&&mainRpc);
  const after=await ok(c,'/api/status');
  assert.equal(resolve(after.dataDirectory),resolve(c.data));
  assert.equal(after.environment.chainInstanceId,mainBefore.environment.chainInstanceId);
  assert.equal(after.environment.rpcUrl,mainRpc);
  const anchored=await rpc(mainRpc,'eth_getBlockByNumber',[anchor.number,false]);
  assert.equal(anchored.hash,anchor.hash);
  const code=await rpc(mainRpc,'eth_getCode',[mainBefore.environment.contracts.tokenA,'latest']);
  assert.equal(code,codeBefore);
  const budgetHealth=await ok(c,'/api/budget/health');
  assert.notEqual(String(budgetHealth.chainPort),String(c.chainPort));
 });
 await check('main shutdown closes a signed but unredeemed budget signer and its dedicated chain',async()=>{
  let s=await ok(c,'/api/budget/start',{config:{mode:'unified',initial:'500',budget:'150',payment:'40',permit:'50',secondPath:'permit'}});
  s=await ok(c,'/api/budget/step',{executionId:s.id});
  s=await ok(c,'/api/budget/step',{executionId:s.id});
  assert.equal(s.stage,'redemption');assert.equal(s.ledger.reserved,'50000000');
  const h=await ok(c,'/api/budget/health');
  const pids=[s.signerPid,h.chainPid];
  assert.ok(pids.every(p=>Number.isSafeInteger(p)&&p>0),'health/state must identify owned child processes');
  assert.ok(pids.every(alive));
  await stop(c);
  await waitUntil(()=>pids.every(pid=>!alive(pid)),10000);
  return {ownedChildPids:pids};
 });
 await check('main shutdown during a new budget initialization leaves its observed Anvil closed',async()=>{
  const race=await launch();
  const pending=race.request('/api/budget/start',{config:{initial:'800',budget:'220',payment:'130',permit:'140'}}).then(v=>({response:v}),e=>({error:e.message}));
  let h,state;
  await waitUntil(async()=>{
   h=await ok(race,'/api/budget/health');
   state=await ok(race,'/api/budget/state');
   return Number.isSafeInteger(h.chainPid)&&h.chainPid>0;
  },15000);
  const pids=[h.chainPid,...(Number.isSafeInteger(state.signerPid)?[state.signerPid]:[])];
  const observedStage=state.stage;
  await stop(race);await pending;
  await waitUntil(()=>pids.every(pid=>!alive(pid)),10000);
  return {observedStage,ownedChildPids:pids};
 });
}catch(e){
 results.push({name:'main integration harness',passed:false,error:e.message});
 console.error(e.stack,c?.log??'');process.exitCode=1;
}finally{
 for(const instance of owned){
  try{await stop(instance);}catch(e){
   results.push({name:'owned main process cleanup',passed:false,error:e.message,pid:instance.p.pid});
   process.exitCode=1;
   // Only the process created by this test is eligible for fallback termination.
   if(instance.p.exitCode===null)instance.p.kill();
  }
 }
 await writeFile(artifactPath('v0153-main-results.json'),JSON.stringify({
  version:'V0.15.3',time:new Date().toISOString(),
  buildHash:buildHash??JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash,
  results
 },null,2)+'\n');
}
