import {createServer} from 'node:http';
import {createServer as createNetServer} from 'node:net';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {TestnetService} from '../src/testnet/service.mjs';
import {PublicEvmChain} from '../src/testnet/chain.mjs';
import {privateKeyToAccount} from '../packages/payment-adapters/runtime.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=createNetServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
export async function loadTestnetLib(out){
 process.env.LAB_LIBRARY_ONLY='1';process.env.LAB_AGENT_WORKER='1';process.env.LAB_ROOT=root;process.env.LAB_DATA_DIR=join(out,'unused-legacy-data');
 return import(pathToFileURL(join(root,'dist/server.mjs')).href);
}
/** All private-chain control goes through controlRpc, never through the service.
 * The service RPC proxy rejects anvil_*, evm_* and unlocked-account sends. */
export async function startTestnetFixture({out,lib,modelResolver,captureRuntimeEvidence,runtimeEvidenceCursor,autoDeploy=true,confirmations=1,receiptTimeoutMs=1000,beforeChange}={}){
 out=out?resolve(out):await mkdtemp(join(tmpdir(),'web3-testnet-'));await mkdir(out,{recursive:true});lib??=await loadTestnetLib(out);
 const chainPort=await freePort(),upstream=`http://127.0.0.1:${chainPort}`;
 const child=spawn(join(root,'runtime',process.platform==='win32'?'anvil.exe':'anvil'),['--host','127.0.0.1','--port',String(chainPort),'--chain-id','84532','--silent'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 let spawnError;child.on('error',e=>spawnError=e);const logs=[];child.stdout.on('data',x=>logs.push(String(x)));child.stderr.on('data',x=>logs.push(String(x)));
 let rpcId=0;const controlRpc=async(method,params=[])=>{const response=await fetch(upstream,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++rpcId,method,params})});const value=await response.json();if(value.error)throw Error(value.error.message);return value.result;};
 try{let ready=false;for(let i=0;i<100;i++){if(spawnError)throw spawnError;try{await controlRpc('eth_chainId');ready=true;break;}catch{}await sleep(50);}if(!ready)throw Error('ANVIL_START_TIMEOUT');}catch(e){child.kill();throw e;}
 const privateKey='0x'+randomBytes(32).toString('hex'),account=privateKeyToAccount(privateKey).address,recipient=privateKeyToAccount('0x'+randomBytes(32).toString('hex')).address;
 await controlRpc('anvil_setBalance',[account,'0x56bc75e2d63100000']);
 const counts={},requests=[],faults={dropNextBroadcast:false,blockReceipts:false,blockTrace:false,checkerBlockHashMismatch:false,checkerBlockUnavailable:false};
 const proxy=createServer(async(req,res)=>{
  try{
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const payload=JSON.parse(Buffer.concat(chunks).toString());
   const calls=Array.isArray(payload)?payload:[payload];for(const call of calls){counts[call.method]=(counts[call.method]??0)+1;requests.push({method:call.method,time:new Date().toISOString()});}
   if(calls.some(c=>/^(anvil_|evm_)/.test(c.method)||['eth_sendTransaction','personal_sendTransaction','eth_sign','personal_sign'].includes(c.method))){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({jsonrpc:'2.0',id:calls[0].id,error:{code:-32601,message:'TEST_PROXY_STANDARD_RPC_ONLY'}}));return;}
   if(faults.blockTrace&&calls.some(c=>c.method.startsWith('debug_')||c.method.startsWith('trace_'))){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({jsonrpc:'2.0',id:calls[0].id,error:{code:-32601,message:'TEST_TRACE_UNAVAILABLE'}}));return;}
   if(faults.checkerBlockUnavailable&&calls.some(c=>c.method==='eth_getBlockByNumber')){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({jsonrpc:'2.0',id:calls[0].id,error:{code:-32000,message:'TEST_BLOCK_EVIDENCE_UNAVAILABLE'}}));return;}
   if(faults.blockReceipts&&calls.some(c=>c.method==='eth_getTransactionReceipt')){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({jsonrpc:'2.0',id:calls[0].id,result:null}));return;}
   const upstreamResponse=await fetch(upstream,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});let bytes=await upstreamResponse.text();
   if(faults.checkerBlockHashMismatch&&calls.some(c=>c.method==='eth_getBlockByNumber')){const value=JSON.parse(bytes);for(const item of (Array.isArray(value)?value:[value]))if(item.result?.hash)item.result.hash='0x'+'ef'.repeat(32);bytes=JSON.stringify(value);}
   if(faults.dropNextBroadcast&&calls.some(c=>c.method==='eth_sendRawTransaction')){faults.dropNextBroadcast=false;res.destroy();return;}
   res.writeHead(upstreamResponse.status,{'content-type':'application/json'});res.end(bytes);
  }catch{if(!res.destroyed){res.writeHead(502);res.end('{}');}}
 });
 await new Promise(r=>proxy.listen(0,'127.0.0.1',r));const rpcUrl=`http://127.0.0.1:${proxy.address().port}`;
 let service,server,base;
 const makeService=async()=>{
  service=new TestnetService({root,data:join(out,'data'),port:0,lib,modelResolver,captureRuntimeEvidence,runtimeEvidenceCursor,beforeChange,chainFactory:options=>new PublicEvmChain({...options,allowLoopback:true})});
  server=createServer(async(req,res)=>{if(!await service.handle(req,res,new URL(req.url,'http://localhost').pathname)){res.writeHead(404);res.end('not found');}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));service.port=server.address().port;base=`http://127.0.0.1:${service.port}`;await service.init();
 };
 await makeService();
 const requestRaw=async(path,{method='GET',body,headers={}}={})=>fetch(base+'/api/testnet'+path,{method,headers:{'x-testnet-token':service.token,...(method==='POST'?{'content-type':'application/json',origin:base}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 const request=async(path,body,expected=body===undefined?200:200)=>{const res=await requestRaw(path,{method:body===undefined?'GET':'POST',body}),value=await res.json();if(res.status!==expected)throw Error(`${path}: HTTP ${res.status} ${value.error??''}; expected ${expected}`);return value;};
 const connect=({readonly=false,extra={}}={})=>request('/connect',{profileId:'base-sepolia',rpcUrl,accountAddress:account,...(!readonly?{privateKey}:{}),recipient,confirmations,receiptTimeoutMs,...extra});
 let manifest;
 const waitRun=async id=>{for(let i=0;i<2400;i++){if(!service.busy)return request('/run?id='+id);await sleep(25);}throw Error('TEST_RUN_TIMEOUT');};
 const restart=async()=>{await service.shutdown();await new Promise(r=>server.close(r));await makeService();};
 let closed=false;
 const close=async()=>{if(closed)return;closed=true;try{await service.shutdown();}finally{await new Promise(r=>server.close(r));await new Promise(r=>proxy.close(r));if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}await writeFile(join(out,'rpc-methods.json'),JSON.stringify({counts,requests,scope:'Only method names; signed bytes and keys excluded'},null,2));}};
 try{await connect();if(autoDeploy)manifest=(await request('/deploy',{})).manifest;}catch(e){await close();throw e;}
 return {root,out,lib,get service(){return service;},get base(){return base;},request,requestRaw,controlRpc,connect,waitRun,restart,manifest,account,recipient,privateKey,rpcUrl,counts,requests,faults,close};
}
