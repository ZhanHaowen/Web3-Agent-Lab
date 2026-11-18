import {artifactPath} from './helpers/artifacts.mjs';
import {authorize,finish,redeem,startBudgetModelFixture,transfer} from './helpers/budget-model.mjs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT} from '../src/budget/common.mjs';
import {freePort,sleep} from '../src/budget/engine.mjs';
const port=process.env.LAB_TEST_PORT?Number(process.env.LAB_TEST_PORT):await freePort(),origin='http://127.0.0.1:'+port,data=process.env.LAB_TEST_DATA_DIR??join(ROOT,'data-v016-launcher-'+randomUUID());
await mkdir(data,{recursive:true});
const env={...process.env,LAB_PORT:String(port),LAB_CHAIN_PORT:String(process.env.LAB_TEST_CHAIN_PORT??await freePort()),LAB_DATA_DIR:data,LAB_LIBRARY_ONLY:'',LAB_AGENT_WORKER:''};
const results=[];let mainPid,chainPid,started=false;
const fixture=await startBudgetModelFixture();
const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
function command(name,args=[]){
 return new Promise((resolve,reject)=>{
  const p=spawn(process.env.ComSpec??'cmd.exe',['/d','/c',name,...args],{cwd:ROOT,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let log='';p.stdout.on('data',b=>log+=b);p.stderr.on('data',b=>log+=b);
  const timer=setTimeout(()=>{p.kill();reject(Error('LAUNCHER_TIMEOUT '+log));},25000);
  p.on('error',e=>{clearTimeout(timer);reject(e);});p.once('exit',code=>{clearTimeout(timer);resolve({code,log});});
 });
}
const get=path=>fetch(origin+path).then(r=>r.json());
try{
 const start=await command('start.cmd',['-NoBrowser']);assert.equal(start.code,0,start.log);started=true;
 const health=await get('/api/health'),budget=await get('/api/budget/health');mainPid=budget.pid;
 assert.equal(health.app,'web3-agent-lab');assert.equal(budget.integrated,true);
 assert.equal((await fetch(origin+'/budget.html')).status,200);results.push({name:'start.cmd starts main and budget module together without a second launcher',passed:true});console.log('PASS start.cmd unified startup');
 fixture.plan([transfer('140'),authorize('100'),redeem,finish]);
 const r=await fetch(origin+'/api/budget/run',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Budget-Token':budget.csrfToken},body:JSON.stringify({config:fixture.config({initial:'900',budget:'240'})})});
 const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));assert.equal(s.check.actualSpent,'240000000');
 assert.equal(s.check.relayedOutflowObserved,true);
 chainPid=(await get('/api/budget/health')).chainPid;
 results.push({name:'batch-started main executes nondefault parameter experiment',passed:true});console.log('PASS batch-started custom experiment');
 const stop=await command('stop.cmd');assert.equal(stop.code,0,stop.log);
 for(let i=0;i<150&&(alive(mainPid)||alive(chainPid));i++)await sleep(100);
 assert.equal(alive(mainPid),false);assert.equal(alive(chainPid),false);started=false;
 results.push({name:'stop.cmd shuts down main and owned budget chain',passed:true});console.log('PASS stop.cmd unified cleanup');

 let reportedRoot=join(ROOT,'different-installation'),shutdowns=0;
 const oldServer=createServer((req,res)=>{
  const payloads={
   '/api/health':{app:'web3-agent-lab',version:{sourceHash:'previous-build'},csrfToken:'fixture'},
   '/api/status':{dataDirectory:data},
   '/api/budget/health':{app:'web3-agent-budget-lab',integrated:true,root:reportedRoot},
  };
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8',Connection:'close'}).end(JSON.stringify(payloads[req.url]??{}));
  if(req.url==='/api/shutdown'&&req.method==='POST'){
   shutdowns++;
   oldServer.close();
  }
 });
 await new Promise((resolve,reject)=>oldServer.once('error',reject).listen(port,'127.0.0.1',resolve));
 try{
  // V0.18.0 stop.cmd pauses after a PowerShell refusal; cmd's final exit
  // code is not the refusal signal. Check the actual guard and no shutdown.
  const other=await command('stop.cmd');assert.match(other.log,/belongs to another build or data directory/);assert.equal(shutdowns,0);
  reportedRoot=ROOT;
  const old=await command('stop.cmd');assert.match(old.log,/belongs to another build or data directory/);assert.equal(shutdowns,0);
  results.push({name:'stop.cmd preserves V0.18.0 build and data-directory isolation',passed:true});
  console.log('PASS retained build and data-directory shutdown isolation');
 }finally{await new Promise(resolve=>oldServer.close(resolve));}
}catch(e){results.push({name:'launcher smoke',passed:false,error:e.message});console.error(e.stack);process.exitCode=1;}
finally{
 if(started){try{await command('stop.cmd');}catch{}}
 await fixture.close();
 await writeFile(artifactPath('v0153-launcher-results.json'),JSON.stringify({version:JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).displayVersion,buildHash:JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash,time:new Date().toISOString(),results},null,2)+'\n');
}
