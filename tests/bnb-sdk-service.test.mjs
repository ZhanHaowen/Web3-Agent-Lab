import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {EventEmitter} from 'node:events';
import {createServer,request as httpRequest} from 'node:http';
import {BnbSdkService} from '../src/bnb-sdk/service.mjs';
import {normalizeConfig,capabilities} from '../src/bnb-sdk/config.mjs';

const root=resolve('.');
const waitFor=async fn=>{for(let n=0;n<1000;n++){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,10));}throw Error('TEST_TIMEOUT');};
class FakeChild extends EventEmitter {
 constructor(){super();this.connected=true;this.messages=[];}
 send(message){this.messages.push(message);}
 kill(){this.connected=false;this.emit('exit',null,'SIGTERM');}
}
async function fixture(t,options={}){
 const data=await mkdtemp(join(tmpdir(),'bnb-sdk-service-'));
 const service=new BnbSdkService({root,data,...options});await service.init();
 t.after(()=>service.shutdown());return {data,service};
}
async function httpFixture(t){
 const f=await fixture(t);const server=createServer(async(req,res)=>{if(!await f.service.handle(req,res,new URL(req.url,'http://localhost').pathname)){res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));f.service.port=server.address().port;const origin=`http://127.0.0.1:${f.service.port}`;
 t.after(()=>new Promise(r=>server.close(r)));
 const request=(path,{method='GET',body,headers={}}={})=>new Promise((resolve,reject)=>{const req=httpRequest(origin+'/api/bnb-sdk'+path,{method,headers:{origin,'x-bnb-sdk-token':f.service.token,...headers}},res=>{let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(text)});}catch(e){reject(e);}});});req.on('error',reject);req.end(body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body));});
 return {...f,request,origin};
}

test('BNB capability/config restricts four scenarios to fixed RPC presets and local signing',()=>{
 const c=normalizeConfig();assert.equal(c.scenario,'x402-offline');assert.equal(c.chainId,97);assert.equal(c.environment,'offline');
 assert.equal(capabilities().scenarios.length,4);assert.ok(capabilities().scenarios.every(s=>s.model===false));
 for(const input of [[],null,{scenario:'unknown'},{rpcUrl:'http://127.0.0.1:1'},{privateKey:'secret'},{rpcPreset:'constructor'},{network:'ethereum'},{scenario:'erc8183-fork',network:'bsc-mainnet'},{timeoutSeconds:1},{timeoutSeconds:601},{forkBlock:-1},{forkBlock:1.1},{pauseBeforeOperations:'yes'}])assert.throws(()=>normalizeConfig(input));
 assert.equal(normalizeConfig({scenario:'deployment-probe',network:'bsc-mainnet'}).environment,'public-readonly');
});

test('BNB HTTP API rejects wrong token/origin/host/method, traversal, excess body and unsupported fields',async t=>{
 const {request,service}=await httpFixture(t);
 const health=await request('/health',{headers:{'x-bnb-sdk-token':''}});assert.equal(health.status,200);assert.equal(health.body.csrfToken,service.token);
 assert.equal((await request('/runs',{headers:{'x-bnb-sdk-token':'wrong'}})).status,403);
 assert.equal((await request('/health',{headers:{origin:'https://evil.invalid'}})).status,403);
 assert.equal((await request('/health',{headers:{host:'evil.invalid'}})).status,403);
 assert.equal((await request('/health',{headers:{'sec-fetch-site':'cross-site'}})).status,403);
 assert.equal((await request('/run?id=..%2Foutside')).status,400);
 assert.equal((await request('/run',{method:'PUT',body:{config:{}}})).status,400);
 assert.equal((await request('/run',{method:'POST',body:{config:{rpcUrl:'https://wrong.invalid'}}})).status,400);
 assert.equal((await request('/run',{method:'POST',headers:{origin:''},body:{config:{}}})).status,403);
 assert.equal((await request('/run',{method:'POST',body:'x'.repeat(17000)})).status,400);
 assert.equal((await request('/run',{method:'POST',body:{privateKey:'must-not-be-accepted'}})).status,400);
 assert.equal((await request('/runs')).body.runs.length,0);
});

test('actual offline SDK worker seals a recheckable export with hydrated operation details',async t=>{
 const {service}=await fixture(t);const {id}=await service.start({config:{scenario:'x402-offline'}});const operation=service.active;await operation.completion;
 const run=await service.readRun(id);assert.equal(run.state.state,'sealed');assert.equal(run.summary.status,'passed');
 assert.ok(run.events.every(e=>e.payload&&typeof e.payload==='object'),'raw content-addressed payloads must be loaded for details');
 assert.ok(run.events.some(e=>e.type==='x402.validation'&&e.payload.signatureVerified));
 const before=await service.bundle(id);assert.equal((await service.check(id)).status,'passed');const bundle=await service.bundle(id);assert.deepEqual(bundle.files,before.files,'offline recheck must not rewrite sealed files');
 for(const path of ['raw/events.jsonl','summary.json','derived/checker.json','derived/graph.json','derived/graph.graphml','derived/nodes.csv','derived/edges.csv','derived/execution-trace.json'])assert.equal(typeof bundle.files[path],'string',path);
 assert.equal(run.checker.transactionCount,0);assert.ok(run.graph.missingRelations.some(r=>r.relation==='model-call'));
 assert.ok(!JSON.stringify(bundle).match(/"(?:privateKey|mnemonic|apiKey)"\s*:\s*"(?!\[REDACTED\])/));
 assert.ok(!JSON.stringify(bundle).match(/0x[0-9a-f]{130}/i),'reusable off-chain signature must not be exported');
});

test('actual SDK pauses before signing and cancellation seals an incomplete cancelled trace',async t=>{
 const {service}=await fixture(t);const {id}=await service.start({config:{scenario:'x402-offline',pauseBeforeOperations:true}});const operation=service.active;
 await waitFor(()=>service.active?.state.state==='paused');assert.equal((await service.readRun(id)).events.some(e=>e.type==='x402.validation'),false);
 await assert.rejects(service.start({config:{}}),/EXPERIMENT_BUSY/);await assert.rejects(service.bundle(id),/RUN_NOT_SEALED/);
 await service.control(id,'cancel');await operation.completion;
 const run=await service.readRun(id);assert.equal(run.summary.status,'cancelled');assert.equal((await service.check(id)).status,'cancelled');assert.equal(service.busy,false);assert.ok((await service.bundle(id)).files['raw/events.jsonl']);
});

test('actual SDK resume advances both signing checkpoints and completes exactly one run',async t=>{
 const {service}=await fixture(t);const {id}=await service.start({config:{scenario:'x402-offline',pauseBeforeOperations:true}});const operation=service.active;
 await waitFor(()=>service.active?.state.state==='paused');await service.control(id,'resume');
 await waitFor(()=>service.active?.state.state==='paused');await service.control(id,'resume');await operation.completion;
 const run=await service.readRun(id);assert.equal(run.summary.status,'passed');assert.equal(run.events.filter(e=>e.type==='x402.validation').length,1);assert.equal((await service.list()).length,1);
});

test('worker environment excludes caller secrets and abrupt exit preserves unknown without retry',async t=>{
 let spawned=0,options;const child=new FakeChild();const key='BNB_TEST_SENTINEL_SECRET';process.env[key]='never-forward-this';t.after(()=>delete process.env[key]);
 const {service}=await fixture(t,{spawnWorker:(_file,opts)=>{spawned++;options=opts;return child;}});
 const {id}=await service.start({config:{}});const operation=service.active;assert.equal(options.env[key],undefined);assert.equal(options.env.BNBAGENT_USE_PAYMASTER,'0');assert.equal(options.windowsHide,true);
 await assert.rejects(service.start({config:{}}),/EXPERIMENT_BUSY/);child.emit('exit',17);await operation.completion;
 const state=await service.state(id);assert.equal(state.status,'unknown');assert.equal(state.state,'unknown');assert.equal(spawned,1);assert.equal(service.busy,false);
 assert.equal((await service.check(id)).status,'failed');
});

test('worker resource PIDs are tracked from current event wire shape and late pause cannot undo cancel',async t=>{
 const child=new FakeChild();const {service}=await fixture(t,{spawnWorker:()=>child});const {id}=await service.start({config:{}});const operation=service.active;
 const impossiblePid=2147483647;child.emit('message',{type:'event',event:{type:'bnb.resource',pid:impossiblePid,resource:'anvil'}});
 assert.ok(operation.resourcePids.has(impossiblePid),'Anvil resource PID must be tracked for forced cleanup');
 await service.control(id,'cancel');child.emit('message',{type:'paused',detail:{operation:'late'}});child.emit('message',{type:'resumed'});await new Promise(r=>setImmediate(r));
 assert.equal(operation.state.state,'cancelling');child.emit('exit',null,'SIGTERM');await operation.completion;assert.equal((await service.state(id)).state,'cancelled');
});

test('worker launch failure clears the active lock and records unknown outcome',async t=>{
 const {service}=await fixture(t,{spawnWorker:()=>{throw Error('simulated spawn failure');}});await assert.rejects(service.start({config:{}}),/simulated spawn failure/);assert.equal(service.busy,false);
 const runs=await service.list();assert.equal(runs.length,1);assert.equal(runs[0].state.status,'unknown');assert.equal(runs[0].state.error,'WORKER_START_FAILED');
});

test('failed initial IPC send terminates its worker and clears the active lock',async t=>{
 const child=new FakeChild();let killed=0;child.send=()=>{throw Error('simulated closed IPC');};child.kill=()=>{killed++;child.connected=false;child.emit('exit',null,'SIGTERM');};
 const {service}=await fixture(t,{spawnWorker:()=>child});await assert.rejects(service.start({config:{}}),/simulated closed IPC/);await new Promise(r=>setImmediate(r));assert.ok(killed>=1);assert.equal(service.busy,false);assert.equal((await service.list())[0].state.status,'unknown');
 await assert.rejects(service.control('none','unrecognized'),/CONTROL/);
});

test('asynchronous worker error terminates the child before releasing its experiment lock',async t=>{
 const child=new FakeChild();let killed=0;child.kill=()=>{killed++;child.connected=false;child.emit('exit',null,'SIGTERM');};const {service}=await fixture(t,{spawnWorker:()=>child});const {id}=await service.start({config:{}});const operation=service.active;
 child.emit('error',Error('simulated IPC error'));await operation.completion;assert.ok(killed>=1,'worker must not keep running after service releases the lock');assert.equal(service.busy,false);assert.equal((await service.state(id)).status,'unknown');
});

test('restart marks unfinished experiment unknown without rewriting raw data or starting a worker',async t=>{
 const {service,data}=await fixture(t);const id='interrupted-fixture';await mkdir(join(data,'runs',id,'raw'),{recursive:true});const raw='retained unfinished bytes\n';await writeFile(join(data,'runs',id,'raw/events.jsonl'),raw);await writeFile(join(data,'states',id+'.json'),JSON.stringify({id,state:'paused',status:'pending'}));
 let spawned=0;const resumed=new BnbSdkService({root,data,spawnWorker:()=>{spawned++;throw Error('must not retry');}});t.after(()=>resumed.shutdown());await resumed.init();
 assert.equal((await resumed.state(id)).state,'unknown');assert.equal((await resumed.state(id)).error,'PROCESS_RESTARTED_NO_AUTOMATIC_RETRY');assert.equal(await readFile(join(data,'runs',id,'raw/events.jsonl'),'utf8'),raw);assert.equal(spawned,0);assert.equal(service.busy,false);
});
