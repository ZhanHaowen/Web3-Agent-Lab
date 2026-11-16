/** Run against an extracted, dependency-free Windows review ZIP. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
const root=resolve(process.env.LAB_PORTABLE_ROOT??'.');
const out=resolve(process.env.TESTNET_TEST_OUTPUT??join(root,'artifacts/test-results/portable-smoke'));
await mkdir(out,{recursive:true});
try{await access(join(root,'node_modules'));throw Error('PORTABLE_TEST_REQUIRES_NO_NODE_MODULES');}catch(e){if(e.code!=='ENOENT')throw e;}
const freePort=async()=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;};
const port=await freePort(),rpcPort=await freePort(),base=`http://127.0.0.1:${port}`,data=join(out,'isolated-data');
const env={...process.env,LAB_ROOT:root,LAB_DATA_DIR:data,LAB_PORT:String(port),LAB_CHAIN_PORT:String(rpcPort)};
delete env.LAB_LIBRARY_ONLY;delete env.LAB_AGENT_WORKER;
let stdout='',stderr='',token,owned=false;
const server=spawn(join(root,'runtime/node.exe'),[join(root,'dist/server.mjs')],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',b=>stdout+=b);server.stderr.on('data',b=>stderr+=b);
const rows=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const test=async(name,fn)=>{try{await fn();rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:e.stack});throw e;}};
async function api(path,body){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-lab-token':token??''},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const value=await response.json();assert.ok(response.ok,JSON.stringify(value));return value;}
const report={scope:'Extracted Windows candidate, no node_modules, own data and ports; no public broadcasts',root,out,tests:rows,startedAt:new Date().toISOString()};
try{
 for(let n=0;n<150;n++){if(server.exitCode!==null)throw Error('SERVER_EXIT:'+stderr);try{token=(await api('/api/health')).csrfToken;owned=true;break;}catch{await sleep(100);}}
 assert.ok(owned,'startup');report.build=(await api('/api/health')).version;
 await test('dedicated data directory',async()=>assert.equal(resolve((await api('/api/status')).dataDirectory),resolve(data)));
 await test('original and testnet pages served',async()=>{for(const route of ['/','/testnet.html','/testnet.js','/testnet.css']){const r=await fetch(base+route);assert.equal(r.status,200);assert.ok((await r.text()).length>100);}});
 let bootstrap;
 await test('six enabled profiles and twenty catalog entries',async()=>{bootstrap=await api('/api/testnet/bootstrap');assert.equal(bootstrap.profiles.length,20);assert.equal(bootstrap.profiles.filter(p=>p.writeEnabled).length,6);assert.equal(bootstrap.status.connected,false);});
 await test('catalog-only connect rejected before RPC',async()=>{const r=await fetch(base+'/api/testnet/connect',{method:'POST',headers:{origin:base,'content-type':'application/json','x-testnet-token':bootstrap.csrfToken},body:JSON.stringify({profileId:'ethereum-sepolia',accountAddress:'0x0000000000000000000000000000000000000001'})});assert.equal(r.status,400);assert.equal((await r.json()).error,'TESTNET_CATALOG_ONLY');});
 await test('original Anvil initialization and balance task',async()=>{await api('/api/environment/init',{});const {runId}=await api('/api/runs',{taskId:'balance',mode:'scripted',experimentMode:'independent'});for(let n=0;n<300;n++){if(!(await api('/api/status')).busy)break;await sleep(50);}const run=await api('/api/runs/'+runId);assert.equal(run.result.status,'success');await writeFile(join(out,'original-balance.bundle.json'),JSON.stringify(await api('/api/runs/'+runId+'/export')));});
 await test('testnet data stays disconnected after local task',async()=>{const state=await fetch(base+'/api/testnet/status',{headers:{'x-testnet-token':bootstrap.csrfToken}}).then(r=>r.json());assert.equal(state.connected,false);assert.equal(state.ready,false);});
}catch(e){report.error=e.stack;process.exitCode=1;}
finally{
 if(owned&&server.exitCode===null){try{await api('/api/shutdown',{});for(let n=0;n<100&&server.exitCode===null;n++)await sleep(100);}catch(e){report.shutdownError=e.message;}}
 report.gracefulShutdown=server.exitCode!==null;if(server.exitCode===null)server.kill();
 await writeFile(join(out,'server.stdout.log'),stdout);await writeFile(join(out,'server.stderr.log'),stderr);
 report.passed=!report.error&&rows.length===6&&rows.every(r=>r.passed)&&report.gracefulShutdown;report.finishedAt=new Date().toISOString();
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
 console.log(JSON.stringify({report:join(out,'report.json'),passed:report.passed,checks:rows.length}));
}
