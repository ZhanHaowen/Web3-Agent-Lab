import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {createServer} from 'node:http';
import {ResearchService} from '../src/research/service.mjs';import {observerFiles} from '../src/observer/index.mjs';import {rpcFixture} from './research-observer-fixture.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
async function serviceFixture(t,runner=async()=>({status:'complete'})){
 const temp=await mkdtemp(join(tmpdir(),'web3-research-service-')),data=join(temp,'data'),s=new ResearchService({root,data,runner});await s.init();t.after(async()=>{await s.shutdown();if(!resolve(temp).startsWith(resolve(tmpdir())))throw Error('TEMP_SCOPE');await rm(temp,{recursive:true,force:true});});return {s,temp,data};
}
async function sealed(t,s,data,id='run-private-canary'){
 const f=await rpcFixture(t),o=await f.capture(),dir=join(data,'runs',id);await mkdir(join(dir,'observer'),{recursive:true});await mkdir(join(dir,'private'),{recursive:true});for(const [name,text] of Object.entries(observerFiles(o)))await writeFile(join(dir,'observer',name),text);await writeFile(join(dir,'private','ground-truth.json'),JSON.stringify({task:'SECRET_TASK_CANARY',budget:998877}));await writeFile(join(dir,'summary.json'),'{}');await writeFile(join(data,'states',id+'.json'),JSON.stringify({state:'sealed'}));return {id,dir,o};
}
async function httpFixture(t,s){const server=createServer((req,res)=>{s.handle(req,res,new URL(req.url,'http://localhost').pathname).then(found=>{if(!found){res.statusCode=404;res.end();}});});await new Promise(r=>server.listen(0,'127.0.0.1',r));s.port=server.address().port;t.after(()=>new Promise(r=>server.close(r)));const base='http://127.0.0.1:'+s.port;return {base,request:(path,options={})=>fetch(base+path,options)};}

test('research HTTP private GET/export require token; mutations require exact same origin',async t=>{
 const {s,data}=await serviceFixture(t),r=await sealed(t,s,data),{base,request}=await httpFixture(t,s),health=await(await request('/api/research/health')).json();assert.equal(health.csrfToken,s.token);
 for(const path of ['/api/research/runs','/api/research/run?id='+r.id,'/api/research/export?id='+r.id+'&visibility=private'])assert.equal((await request(path)).status,403);
 assert.equal((await request('/api/research/runs',{headers:{'x-research-token':s.token,origin:'https://evil.invalid'}})).status,403);
 assert.equal((await request('/api/research/run',{method:'POST',headers:{'content-type':'application/json','x-research-token':s.token},body:JSON.stringify({config:{}})})).status,403);
 assert.equal((await request('/api/research/run?id=..%2Foutside',{headers:{'x-research-token':s.token}})).status,400);
 const pub=await(await request('/api/research/export?id='+r.id+'&visibility=public',{headers:{'x-research-token':s.token}})).text();assert.ok(!pub.includes('SECRET_TASK_CANARY'));assert.ok(!pub.includes(r.id));assert.ok(pub.includes('public-observer'));
});
test('public bundle regenerates whitelist exports and cannot leak a misplaced private file or tainted graph',async t=>{
 const {s,data}=await serviceFixture(t),r=await sealed(t,s,data);await writeFile(join(r.dir,'observer','private-canary.json'),'SECRET_MISPLACED_CANARY');await writeFile(join(r.dir,'observer','graph.json'),'SECRET_TAINTED_GRAPH');
 const bundle=await s.bundle(r.id,'public');assert.ok(!JSON.stringify(bundle).includes('SECRET_'));assert.ok(!Object.hasOwn(bundle.files,'private-canary.json'));assert.ok(JSON.parse(bundle.files['graph.json']).nodes);
});
test('bundle rejects run-root and observer-root symlinks, not only nested symlink entries',async t=>{
 const {s,data,temp}=await serviceFixture(t),r=await sealed(t,s,data),outside=join(temp,'outside');await mkdir(outside);await writeFile(join(outside,'summary.json'),'{}');await writeFile(join(outside,'CANARY'),'OUTSIDE_SECRET');
 await symlink(outside,join(data,'runs','linked-run'),process.platform==='win32'?'junction':'dir');await assert.rejects(s.bundle('linked-run','private'),/SYMLINK|PATH|SCOPE/);
 await rm(join(r.dir,'observer'),{recursive:true});await symlink(outside,join(r.dir,'observer'),process.platform==='win32'?'junction':'dir');await assert.rejects(s.bundle(r.id,'public'),/SYMLINK|PATH|SCOPE/);
});
test('concurrent starts admit one experiment and reject the other',async t=>{
 let calls=0,entered;const started=new Promise(r=>entered=r),{s}=await serviceFixture(t,async(_c,{signal})=>{calls++;entered();await new Promise(r=>signal.addEventListener('abort',r,{once:true}));return {status:'cancelled'};});
 const results=await Promise.allSettled([s.start({config:{}}),s.start({config:{}})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.message==='EXPERIMENT_BUSY').length,1);await started;await s.shutdown();assert.equal(calls,1);
});
test('private/public JSON leaf links are rejected before read (Windows junction; POSIX file symlink)',async t=>{
 const {s,data,temp}=await serviceFixture(t),r=await sealed(t,s,data),outside=join(temp,'outside.json'),directoryTarget=join(temp,'outside-dir');await writeFile(outside,JSON.stringify({private:'OUTSIDE_CANARY'}));await mkdir(directoryTarget);
 const link=path=>symlink(process.platform==='win32'?directoryTarget:outside,path,process.platform==='win32'?'junction':'file'),unlink=path=>rm(path,{recursive:process.platform==='win32',force:true});
 for(const leaf of ['summary.json','checker.json']){const path=join(r.dir,leaf);await rm(path,{force:true});await link(path);await assert.rejects(s.readRun(r.id),/SYMLINK|PATH|SCOPE/);await unlink(path);await writeFile(path,'{}');}
 const state=join(data,'states',r.id+'.json');await rm(state);await link(state);await assert.rejects(s.readRun(r.id),/SYMLINK|PATH|SCOPE/);await unlink(state);await writeFile(state,JSON.stringify({state:'sealed'}));
 const observed=join(r.dir,'observer','observer.json');await rm(observed);await link(observed);await assert.rejects(s.bundle(r.id,'public'),/SYMLINK|PATH|SCOPE/);
});
test('shutdown during asynchronous startup prevents an untracked runner from starting',async t=>{
 let calls=0;const {s}=await serviceFixture(t,async()=>{calls++;return {status:'complete'};});let release;const gate=new Promise(r=>release=r),original=s.init.bind(s);s.init=async()=>{await gate;return original();};
 const start=s.start({config:{}});await new Promise(r=>setTimeout(r,0));const stop=s.shutdown();release();await Promise.allSettled([start,stop]);assert.equal(calls,0);assert.equal(s.busy,false);
});
test('cancel is scoped to active run, signals runner, and retains cancelled status',async t=>{
 const {s,data}=await serviceFixture(t,async(_c,{signal})=>{if(!signal.aborted)await new Promise(r=>signal.addEventListener('abort',r,{once:true}));throw Error('CANCELLED');}),{base,request}=await httpFixture(t,s);
 const headers={'content-type':'application/json','x-research-token':s.token,origin:base};const started=await(await request('/api/research/run',{method:'POST',headers,body:JSON.stringify({config:{}})})).json();
 assert.equal((await request('/api/research/cancel',{method:'POST',headers,body:JSON.stringify({id:'wrong'})})).status,400);const promise=s.active.promise;assert.equal((await request('/api/research/cancel',{method:'POST',headers,body:JSON.stringify({id:started.id})})).status,202);await promise;const state=JSON.parse(await readFile(join(data,'states',started.id+'.json'),'utf8'));assert.equal(state.state,'cancelled');assert.equal(s.busy,false);
});
