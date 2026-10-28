import {artifactPath} from './helpers/artifacts.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT} from '../src/budget/common.mjs';
import {freePort,sleep} from '../src/budget/engine.mjs';
const port=await freePort(),origin='http://127.0.0.1:'+port,data=join(ROOT,'data-v0153-launcher-'+randomUUID());
await mkdir(data,{recursive:true});
const env={...process.env,LAB_PORT:String(port),LAB_CHAIN_PORT:String(await freePort()),LAB_DATA_DIR:data,LAB_LIBRARY_ONLY:'',LAB_AGENT_WORKER:''};
const results=[];let mainPid,chainPid,started=false;
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
 const r=await fetch(origin+'/api/budget/run',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Budget-Token':budget.csrfToken},body:JSON.stringify({config:{initial:'900',budget:'240',payment:'140',permit:'150',mode:'split'}})});
 const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));assert.equal(s.check.actualSpent,'290000000');
 chainPid=(await get('/api/budget/health')).chainPid;
 results.push({name:'batch-started main executes nondefault parameter experiment',passed:true});console.log('PASS batch-started custom experiment');
 const stop=await command('stop.cmd');assert.equal(stop.code,0,stop.log);
 for(let i=0;i<150&&(alive(mainPid)||alive(chainPid));i++)await sleep(100);
 assert.equal(alive(mainPid),false);assert.equal(alive(chainPid),false);started=false;
 results.push({name:'stop.cmd shuts down main and owned budget chain',passed:true});console.log('PASS stop.cmd unified cleanup');
}catch(e){results.push({name:'launcher smoke',passed:false,error:e.message});console.error(e.stack);process.exitCode=1;}
finally{
 if(started){try{await command('stop.cmd');}catch{}}
 await writeFile(artifactPath('v0153-launcher-results.json'),JSON.stringify({version:'V0.15.3',buildHash:JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash,time:new Date().toISOString(),results},null,2)+'\n');
}
