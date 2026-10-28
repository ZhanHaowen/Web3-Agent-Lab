import {artifactPath} from './helpers/artifacts.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {ROOT} from '../src/budget/common.mjs';
import {freePort,sleep} from '../src/budget/engine.mjs';
const port=await freePort(),origin='http://127.0.0.1:'+port;
const p=spawn(process.execPath,[join(ROOT,'src/budget/server.mjs')],{cwd:ROOT,env:{...process.env,BUDGET_PORT:String(port),BUDGET_DATA_DIR:join(ROOT,'data-budget-http')},windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='',token='';p.stdout.on('data',b=>log+=b);p.stderr.on('data',b=>log+=b);
const results=[];
async function call(path,b,headers={}){
 const r=await fetch(origin+path,{method:b===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Budget-Token':token,...headers},...(b===undefined?{}:{body:JSON.stringify(b)})});
 const value=(r.headers.get('content-type')??'').includes('json')?await r.json():await r.text();return {status:r.status,value};
}
function passed(name){results.push({name,passed:true});console.log('PASS',name);}
try{
 for(let i=0;i<100;i++){try{const h=await call('/api/health');token=h.value.csrfToken;if(token)break;}catch{}await sleep(100);}assert.ok(token,log);
 assert.equal((await call('/api/run',{},{'X-Budget-Token':''})).status,403);
 assert.equal((await call('/api/run',{}, {Origin:'http://example.com'})).status,403);passed('HTTP origin and token required');
 const invalid=await call('/api/run',{config:{unknown:1}});assert.equal(invalid.status,400);passed('unknown configuration is rejected');
 let s=(await call('/api/start',{config:{mode:'unified'}})).value;assert.equal(s.stage,'payment');
 const id=s.id;assert.equal((await call('/api/step',{executionId:'stale'})).status,400);passed('stale execution cannot advance another experiment');
 const responses=await Promise.all([call('/api/step',{executionId:id}),call('/api/step',{executionId:id})]);
 assert.ok(responses.some(r=>r.status===409));assert.equal((await call('/api/state')).value.stage,'authorization');passed('overlapping clicks do not duplicate a payment');
 await call('/api/step',{executionId:id});
 s=(await call('/api/step',{executionId:id})).value;assert.equal(s.check.actualSpent,'80000000');assert.equal(s.check.status,'success');passed('manual unified flow blocks permit and seals evidence');
 const split=await call('/api/run',{config:{mode:'split'}});assert.equal(split.status,200);assert.equal(split.value.check.reproduction,true);passed('one-click split run reproduces actual 140');
 const b=await call('/api/export');assert.equal(b.value.format,'web3-agent-budget-experiment');assert.ok(!JSON.stringify(b.value).includes('"signature":'));passed('export contains evidence without reusable signature');
 assert.equal((await call('/api/step',{executionId:id})).status,400);passed('completed earlier execution cannot act in later execution');
}catch(e){results.push({name:'HTTP suite',passed:false,error:e.message});console.error(e.stack,log.slice(-2000));process.exitCode=1;}
finally{
 try{await call('/api/shutdown',{});}catch{}await Promise.race([new Promise(r=>p.once('exit',r)),sleep(4000)]);if(p.exitCode===null)p.kill();
 await writeFile(artifactPath('v0153-http-results.json'),JSON.stringify({version:'V0.15.3',buildHash:JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash,time:new Date().toISOString(),results},null,2));
}
