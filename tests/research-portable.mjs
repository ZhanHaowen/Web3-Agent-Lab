// Run from an extracted portable release. Uses only built-in Node modules.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dest=resolve(process.env.RESEARCH_PORTABLE_REPORT??join(root,'artifacts','portable-'+Date.now()));await mkdir(dest,{recursive:true});
const data=join(dest,'data'),results=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));return port;}
const port=await freePort(),chainPort=await freePort(),base='http://127.0.0.1:'+port;
let noNodeModules=false;try{await access(join(root,'node_modules'));}catch(e){if(e.code==='ENOENT')noNodeModules=true;else throw e;}
let log='',token='',mainToken='';
const child=spawn(process.execPath,['dist/server.mjs'],{cwd:root,windowsHide:true,env:{...process.env,LAB_PORT:String(port),LAB_CHAIN_PORT:String(chainPort),LAB_DATA_DIR:data}});
child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
async function api(path,input){const r=await fetch(base+path,{method:input?'POST':'GET',headers:{'x-research-token':token,'x-lab-token':mainToken,...(input?{'content-type':'application/json',origin:base}:{})},...(input?{body:JSON.stringify(input)}:{})});const b=await r.json();if(!r.ok)throw Error(JSON.stringify(b));return b;}
try{
 for(let i=0;i<200;i++){try{mainToken=(await api('/api/health')).csrfToken;token=(await api('/api/research/health')).csrfToken;break;}catch{if(child.exitCode!==null)throw Error('SERVER_EXIT '+log);await sleep(100);}}
 assert.ok(token,'server starts');
 const capabilities=await api('/api/research/protocols');assert.equal(capabilities.profiles.length,6);
 for(const profile of capabilities.profiles){
  const config={seed:42,task:{family:'evidence_review',instanceId:'portable-'+profile.id,difficulty:3},mode:'scripted',strategy:'adaptive',budgetBase:'150000',initialBalanceBase:'1000000',tokenDecimals:6,maxSteps:12};
  const started=await api('/api/research/run',{profile:profile.id,backgroundCount:profile.id==='x402-exact'?1:0,config});let run;
  for(let i=0;i<1200;i++){run=await api('/api/research/run?id='+started.id);if(run.state?.state!=='running')break;await sleep(100);}
  assert.equal(run.state.state,'sealed',JSON.stringify(run));assert.equal(run.summary.taskOutcome,'success',JSON.stringify(run));assert.equal(run.summary.checkerStatus,'pass');
  const pub=await api('/api/research/export?id='+started.id+'&visibility=public'),priv=await api('/api/research/export?id='+started.id+'&visibility=private');
  assert.equal(pub.visibility,'public-observer');assert.equal(pub.runId,undefined);assert.equal(Object.keys(pub.files).length,5);assert.ok(priv.files['private/ground-truth.json']);assert.ok(priv.files['raw/events.jsonl']);assert.ok(priv.files['derived/graph.json']);assert.ok(priv.files['integrity.json']);
  if(profile.id==='x402-exact'){const events=priv.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse);assert.ok(events.some(e=>JSON.stringify(e).includes('research.background')));}
  await writeFile(join(dest,profile.id+'-public.json'),JSON.stringify(pub,null,2));
  results.push({profile:profile.id,runId:started.id,status:'pass',summary:run.summary});console.log('PASS portable '+profile.id);
 }
 const evaluated=await api('/api/research/evaluate',{ids:results.map(r=>r.runId),seed:'portable-test'});assert.ok(evaluated.evaluation);await writeFile(join(dest,'evaluation.json'),JSON.stringify(evaluated,null,2));
 const offline=await fetch(base+'/research-observer.html');assert.equal(offline.status,200);assert.ok(offline.headers.get('content-security-policy').includes("connect-src 'none'"));
 console.log('PASS public/private exports, offline viewer CSP, inference evaluation');
}catch(e){results.push({status:'fail',error:e.stack});console.error(e.stack);process.exitCode=1;}
finally{
 try{await api('/api/shutdown',{});}catch{}
 for(let i=0;i<100&&child.exitCode===null;i++)await sleep(50);if(child.exitCode===null)child.kill();
 const build=JSON.parse(await readFile(join(root,'build-info.json'),'utf8'));
 await writeFile(join(dest,'report.json'),JSON.stringify({version:build.version,sourceHash:build.sourceHash,noNodeModules,platform:process.platform,node:process.version,results,passed:!process.exitCode},null,2));await writeFile(join(dest,'server.log'),log);
 console.log('Report '+dest);
}
