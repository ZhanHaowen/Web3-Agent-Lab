import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,access,rm} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ControlStore} from '../src/control/store.mjs';
import {handle} from '../src/control/routes.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(predicate,ms,message){const end=Date.now()+ms;while(Date.now()<end){if(await predicate())return;await delay(50);}throw Error(message);}
function startWorker(args){return spawn(process.execPath,[join(root,'dist/agent-worker.mjs'),...args],{cwd:root,env:{...process.env,LAB_ROOT:root,LAB_LIBRARY_ONLY:'1',LAB_AGENT_WORKER:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});}

test('restarted worker stays online while a durable old-epoch event waits for resume, then delivers it once',{timeout:30000},async t=>{
 const folder=await mkdtemp(join(root,'data-test-worker-outbox-'));
 let worker,server;const store=new ControlStore(join(folder,'control'));
 t.after(async()=>{if(worker?.exitCode===null){await writeFile(join(folder,'stop.flag'),'stop');await until(()=>worker.exitCode!==null,3000,'worker shutdown timeout').catch(()=>worker.kill());}if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}store.close();await rm(folder,{recursive:true,force:true});});
 const initialized=startWorker(['--init','--profile',folder,'--id','recovery-agent']);let initLog='';initialized.stderr.on('data',b=>initLog+=b);initialized.stdout.resume();const initCode=await new Promise((resolve,reject)=>{initialized.once('error',reject);initialized.once('exit',resolve);});assert.equal(initCode,0,initLog);
 const profile=JSON.parse(await readFile(join(folder,'profile.json'),'utf8')),identity='outbox-test-identity';await writeFile(join(folder,'identity.token'),identity);
 store.put('agents',profile.agentId,{agentId:profile.agentId,address:profile.walletAddress,profileVersion:1,epoch:1,heartbeat:0,capabilities:profile.capabilities});
 const executionId='old-execution',agentRunId='old-run',binding={role:'maker',agentId:profile.agentId,agentRunId,epoch:1,executionId};
 store.put('executions',executionId,{id:executionId,state:'recovering',bindings:{maker:binding}});store.put('leases',executionId+':maker',{...binding,revoked:false});
 const event={executionId,agentRunId,streamId:profile.agentId+':'+agentRunId,seq:1,eventId:'durable-unsent-event',leaseEpoch:1,type:'agent.progress',payload:{message:'durable before control admission'},causes:[]};
 await mkdir(join(folder,'outbox'),{recursive:true});const outboxFile=join(folder,'outbox',event.eventId+'.json');await writeFile(outboxFile,JSON.stringify(event));
 let rejections=0,heartbeats=0,requests=0;
 const control={init:async()=>{},admin:()=>false,store,scenes:new Map(),fault:()=>{},auth:req=>{assert.equal(req.headers.authorization,'Bearer '+identity);return store.get('agents',profile.agentId);},b:{url:'http://127.0.0.1',clean:x=>x,send:(res,status,value)=>{if(value.error==='CLOSED_OR_OLD_EXECUTION')rejections++;res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));}}};
 server=createServer(async(req,res)=>{try{let text='';for await(const part of req)text+=part;const path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/heartbeat'))heartbeats++;if(path.endsWith('/events'))requests++;await handle.call(control,req,res,path,text?JSON.parse(text):{});}catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 worker=startWorker(['--profile',folder,'--control','http://127.0.0.1:'+server.address().port]);let workerLog='';worker.stdout.on('data',b=>workerLog+=b);worker.stderr.on('data',b=>workerLog+=b);
 await until(()=>rejections>0&&heartbeats>0,8000,'Worker must remain online despite old binding').catch(error=>{throw Error(error.message+' rejected='+rejections+' heartbeat='+heartbeats+' eventRequests='+requests+' exit='+worker.exitCode+' log='+workerLog);});
 assert.equal(worker.exitCode,null,workerLog);assert.equal(store.events(executionId).length,0);await access(outboxFile);assert.equal(store.get('agents',profile.agentId).epoch,2);assert.ok(Date.now()-store.get('agents',profile.agentId).heartbeat<4000);
 // Emulate the authorized resume transition after the operator has reconciled:
 // only the current binding and lease advance; the original durable event stays.
 store.transaction(()=>{const e=store.get('executions',executionId),l=store.get('leases',executionId+':maker');e.bindings.maker.epoch=2;l.epoch=2;store.put('executions',executionId,e);store.put('leases',executionId+':maker',l);});
 await until(async()=>{try{await access(outboxFile);return false;}catch{return store.events(executionId).length===1;}},5000,'Outbox must ACK after resume');
 const rows=store.events(executionId);assert.equal(rows[0].event.eventId,event.eventId);assert.equal(rows[0].event.leaseEpoch,1);assert.equal(rows[0].event.agentRunId,agentRunId);assert.equal(worker.exitCode,null,workerLog);assert.ok(requests>=2);await delay(400);assert.equal(store.events(executionId).length,1);
});

