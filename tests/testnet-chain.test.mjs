import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {createServer as httpServer} from 'node:http';
import {mkdtemp,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {PublicEvmChain} from '../src/testnet/chain.mjs';
import {NETWORK_PROFILES,validateRpcUrl,listNetworks} from '../src/testnet/networks.mjs';
import {viem,generatePrivateKey,privateKeyToAccount,mnemonicToAccount} from '../packages/payment-adapters/runtime.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const built=await build({absWorkingDir:root,entryPoints:['vendor/legacy-source/src/checker.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {checkTask}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const lib={checkTask};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function fixture(t,profileId='base-sepolia'){
 const profile=NETWORK_PROFILES.find(p=>p.id===profileId),port=await freePort(),url=`http://127.0.0.1:${port}`;
 const anvil=process.env.ANVIL_PATH??join(root,'runtime',process.platform==='win32'?'anvil.exe':'anvil');await access(anvil);
 const dir=await mkdtemp(join(tmpdir(),'web3-testnet-chain-'));
 const proc=spawn(anvil,['--host','127.0.0.1','--port',String(port),'--chain-id',String(profile.chainId),'--hardfork','paris','--silent'],{windowsHide:true,stdio:'ignore'});
 const rpc=viem.createPublicClient({transport:viem.http(url,{retryCount:0,timeout:1000}),cacheTime:0});
 const chains=[];
 let spawnError;proc.once('error',e=>{spawnError=e;});
 t.after(async()=>{for(const c of chains)await c.shutdown();proc.kill();await Promise.race([once(proc,'exit'),delay(2000)]);await rm(dir,{recursive:true,force:true});});
 for(let i=0;;i++){if(spawnError)throw spawnError;try{await rpc.getChainId();break;}catch{if(i>80)throw Error('TEST_ANVIL_START_TIMEOUT');await delay(50);}}
 const privateKey=generatePrivateKey(),account=privateKeyToAccount(privateKey),recipient=privateKeyToAccount(generatePrivateKey()).address;
 // Privileged funding is confined to the isolated test harness, never the public backend.
 await rpc.request({method:'anvil_setBalance',params:[account.address,'0x8ac7230489e80000']});
 const options={root,dataDir:dir,profileId,rpcUrl:url,privateKey,recipient,lib,allowLoopback:true,receiptTimeoutMs:3000,confirmations:1};
 const make=(extra={})=>{const c=new PublicEvmChain({...options,...extra});chains.push(c);return c;};
 const chain=make();await chain.connect();
 return {chain,make,rpc,dir,account,recipient,privateKey,options};
}
async function task(chain,id,fn,parameters){chain.beginRunCapture(id);const before=await chain.state();const final=await fn(before);const after=await chain.state();const result=await chain.check(id,before,after,chain.transactions,final??'',{taskParameters:parameters});assert.equal(result.status,'success',JSON.stringify({id,reason:result.reason,failed:result.assertions.filter(x=>!x.passed)}));assert.equal(result.costs.executionGasOnly,true);return {before,after,result};}

test('catalog exposes exactly six writable previews and fourteen candidates',()=>{
 assert.equal(NETWORK_PROFILES.length,20);assert.deepEqual(NETWORK_PROFILES.filter(p=>p.writeEnabled).map(p=>p.chainId).sort((a,b)=>a-b),[97,43113,80002,84532,421614,11155420].sort((a,b)=>a-b));
 const mutable=listNetworks();mutable[0].capabilities.reset=true;assert.equal(NETWORK_PROFILES[0].capabilities.reset,false);
 assert.throws(()=>new PublicEvmChain({profileId:'ethereum-sepolia'}),/CATALOG_ONLY/);
});
test('RPC policies, account identity, development-key ban, and confirmation bounds fail closed',()=>{
 for(const url of ['http://sepolia.base.org','https://localhost','https://127.0.0.1','https://10.0.0.1','https://192.168.2.1','https://172.20.0.1','https://user:secret@example.com','https://example.com/#secret','file:///tmp/rpc'])assert.throws(()=>validateRpcUrl(url));
 assert.equal(validateRpcUrl('https://example.com/private/rpc?key=secret').hostname,'example.com');
 assert.equal(validateRpcUrl('http://127.0.0.1:1234',{allowLoopback:true}).hostname,'127.0.0.1');
 const args={profileId:'base-sepolia',privateKey:generatePrivateKey()};
 for(const confirmations of [0,65])assert.throws(()=>new PublicEvmChain({...args,confirmations}),/INVALID_CONFIRMATION_POLICY/);
 for(const confirmations of [1,64])assert.equal(new PublicEvmChain({...args,confirmations}).confirmations,confirmations);
 assert.throws(()=>new PublicEvmChain({...args,accountAddress:'0x1111111111111111111111111111111111111111'}),/SIGNER_ADDRESS_MISMATCH/);
 const key=viem.toHex(mnemonicToAccount('test test test test test test test test test test test junk').getHdKey().privateKey);
 assert.throws(()=>new PublicEvmChain({...args,privateKey:key}),/PUBLIC_DEVELOPMENT_KEY_FORBIDDEN/);
});

for(const profile of NETWORK_PROFILES.filter(p=>p.writeEnabled))test(`isolated ${profile.name}: Paris fixture and all five legacy task checks`,async t=>{
 const {chain,rpc,dir,privateKey}=await fixture(t,profile.id);
 assert.equal(chain.env().chainId,profile.chainId);assert.equal(chain.env().chain_execution,'isolated_evm_rpc');assert.equal(chain.env().nativeBalanceFormatted,'10');
 const manifest=await chain.deploy();assert.equal(manifest.status,'ready');assert.equal(manifest.artifacts.LabToken.evmVersion,'paris');
 assert.equal((await chain.state()).balances.agentA,'100000000');
 await task(chain,'balance',async()=>{await rpc.request({method:'evm_mine',params:[]});const b=await chain.execute('get_balance',{token:'A'});return JSON.stringify({token:'A',address:b.address,balanceBaseUnits:b.balance,blockHash:b.blockHash});});
 await task(chain,'transfer',()=>chain.execute('transfer_token',{token:'A',amount:'10'}));
 await task(chain,'approve',()=>chain.execute('approve_token',{token:'A',spender:'amm',amount:'20'}));
 await task(chain,'swap',()=>chain.execute('swap',{amountIn:'10',minAmountOut:'9'}));
 await task(chain,'swap_deposit',async()=>{const r=await chain.execute('swap',{amountIn:'10',minAmountOut:'9'});assert.ok(r.amountOutFormatted);await chain.execute('approve_token',{token:'B',spender:'vault',amount:r.amountOutFormatted});await chain.execute('deposit',{amount:r.amountOutFormatted});});
 const events=(await readFile(join(dir,'tx-events.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
 assert.deepEqual(events.map(e=>e.seq),events.map((_,i)=>i+1));
 assert.ok(events.some(e=>e.type==='contract.call'&&e.payload.function?.signature==='transfer(address,uint256)'));
 for(const tx of events.filter(e=>e.type==='tx.broadcast')){const intent=events.find(e=>e.type==='tx.intent'&&e.payload.hash===tx.payload.hash);assert.ok(intent&&intent.seq<tx.seq);}
 const persisted=await readFile(join(dir,'tx-events.jsonl'),'utf8')+await readFile(join(dir,'deployment.json'),'utf8');assert.ok(!persisted.includes(privateKey));assert.ok(!persisted.includes('serializedTransaction'));assert.ok(!persisted.includes('127.0.0.1:'));
});

test('read-only attach revalidates creation, code hashes, setup, identity and build fingerprints',async t=>{
 const {chain,make,account}=await fixture(t);const manifest=await chain.deploy();
 const readonly=make({privateKey:undefined,accountAddress:account.address});await readonly.connect();assert.equal(readonly.env().readiness,'needs-attach');await assert.rejects(readonly.state(),/FIXTURE_NOT_READY/);
 for(const mutate of [m=>m.codeHashes.tokenA='0x'+'0'.repeat(64),m=>m.chainId=97,m=>m.artifacts.LabToken.evmVersion='cancun',m=>m.contracts.vault=m.contracts.amm,m=>m.setup.agentA.txHash=m.deployments.tokenA.txHash,m=>m.privateKey='secret']){
  const bad=structuredClone(manifest);mutate(bad);await assert.rejects(readonly.attach(bad));
 }
 await readonly.attach(manifest);assert.equal(readonly.env().signerAvailable,false);assert.equal((await readonly.execute('get_balance',{token:'A'})).formatted,'100');
 await assert.rejects(readonly.execute('transfer_token',{token:'A',amount:'1'}),/TESTNET_READ_ONLY/);
 const nonce=await chain.publicClient.getTransactionCount({address:account.address});await Promise.all([chain.deploy(),chain.deploy()]);assert.equal(await chain.publicClient.getTransactionCount({address:account.address}),nonce);
});

test('single precision conversion, missing evidence, trace refusal and preparation errors',async t=>{
 const {chain,dir}=await fixture(t);await chain.deploy();chain.beginRunCapture('edge');
 for(const value of [20,'1e6','-1','0.0000001','1.2.3'])await assert.rejects(chain.execute('approve_token',{token:'A',spender:'amm',amount:value}),/AMOUNT_REQUIRES/);
 await assert.rejects(chain.execute('transfer_token',{token:'A',amount:'1',privateKey:'forbidden'}),/INVALID_TOOL_ARGUMENTS/);
 const request=chain.publicClient.request;chain.publicClient.request=async arg=>{if(arg.method==='debug_traceTransaction')throw Error('unsupported');return request(arg);};
 await chain.execute('approve_token',{token:'A',spender:'amm',amount:'20'});assert.equal((await chain.state()).allowances.ammA,'20000000');
 assert.ok((await readFile(join(dir,'tx-events.jsonl'),'utf8')).includes('tx.trace_unavailable'));
 const nonce=(await chain.state()).nonce;await assert.rejects(chain.execute('transfer_token',{token:'A',amount:'9999'}),/TESTNET_PREPARE_FAILED/);assert.equal((await chain.state()).nonce,nonce);
 const before=await chain.state(),after=structuredClone(before);after.blockHash='0x'+'f'.repeat(64);assert.equal((await chain.check('balance',before,after)).status,'unknown');
});

test('broadcast accepted but response lost: durable hash, wallet lock, restart reconciliation, no replay',async t=>{
 const {chain,make,dir,account}=await fixture(t);const manifest=await chain.deploy();chain.beginRunCapture('lost-response');
 const broadcast=chain.publicClient.sendRawTransaction;let sends=0;
 chain.publicClient.sendRawTransaction=async value=>{sends++;await broadcast(value);throw Error('network dropped https://secret.example/key');};
 const r=await chain.execute('transfer_token',{token:'A',amount:'1'});assert.equal(r.status,'unknown');assert.match(r.hash,/^0x[0-9a-f]{64}$/);assert.equal(sends,1);
 await assert.rejects(chain.execute('transfer_token',{token:'A',amount:'1'}),/UNRESOLVED/);assert.equal(sends,1);await chain.shutdown();
 const reopened=make({privateKey:undefined,accountAddress:account.address});await reopened.connect();assert.deepEqual(reopened.env().unresolved,[r.hash]);await reopened.attach(manifest);
 const reconciled=await reopened.reconcile();assert.equal(reconciled[0].status,'success');assert.deepEqual(reopened.env().unresolved,[]);assert.equal((await reopened.state()).balances.recipientA,'1000000');
 const journal=await readFile(join(dir,'tx-events.jsonl'),'utf8');assert.ok(!journal.includes('secret.example'));assert.equal(journal.split('\n').filter(l=>l.includes('"type":"tx.intent"')&&l.includes(r.hash)).length,1);
});

test('pending confirmation depth and canonical receipt checks never invent success',async t=>{
 const {chain,rpc}=await fixture(t);await chain.deploy();chain.confirmations=2;chain.receiptTimeoutMs=200;
 const r=await chain.execute('transfer_token',{token:'A',amount:'1'});assert.equal(r.status,'pending');await assert.rejects(chain.execute('transfer_token',{token:'A',amount:'1'}),/UNRESOLVED/);
 const getBlock=chain.publicClient.getBlock;chain.publicClient.getBlock=async args=>{const b=await getBlock(args);return {...b,hash:'0x'+'a'.repeat(64)};};
 assert.equal((await chain.inspectTransaction(r.hash)).error,'RECEIPT_REORGED');chain.publicClient.getBlock=getBlock;
 await rpc.request({method:'evm_mine',params:[]});assert.equal((await chain.reconcile())[0].status,'success');
 const receipt=chain.publicClient.getTransactionReceipt;chain.publicClient.getTransactionReceipt=async args=>({...await receipt(args),transactionHash:'0x'+'c'.repeat(64)});assert.equal((await chain.inspectTransaction(r.hash)).error,'RECEIPT_IDENTITY_MISMATCH');
});

test('partial deployment recovers by operation journal without duplicate deployment or mint',async t=>{
 const {chain,make,account}=await fixture(t);const send=chain.publicClient.sendRawTransaction;let n=0;
 chain.publicClient.sendRawTransaction=async input=>{const hash=await send(input);if(++n===3)throw Error('lost deploy response');return hash;};
 await assert.rejects(chain.deploy(),/FIXTURE_DEPLOYMENT_INCOMPLETE/);assert.equal(chain.env().readiness,'partial');await chain.shutdown();
 const reopened=make();await reopened.connect();assert.equal(reopened.env().unresolved.length,1);await reopened.reconcile();const manifest=await reopened.deploy();
 assert.equal(manifest.status,'ready');assert.equal((await reopened.state()).nonce,7);assert.equal((await reopened.state()).balances.agentA,'100000000');assert.equal(await reopened.publicClient.getTransactionCount({address:account.address}),7);
});

test('journal write/hook failure prevents broadcast; concurrent transactions serialize nonce',async t=>{
 const {chain,make,dir}=await fixture(t);await chain.deploy();let sends=0;const send=chain.publicClient.sendRawTransaction;
 chain.publicClient.sendRawTransaction=async input=>{sends++;return send(input);};
 await Promise.all([chain.execute('transfer_token',{token:'A',amount:'1'}),chain.execute('transfer_token',{token:'A',amount:'1'})]);
 assert.equal(sends,2);assert.equal((await chain.state()).balances.recipientA,'2000000');
 await assert.rejects(chain.execute('transfer_token',{token:'A',amount:'1'},{emit:async type=>{if(type==='tx.intent')throw Error('disk failure');}}),/DURABLE_RECORDING_FAILED/);assert.equal(sends,2);
 const journal=(await readFile(join(dir,'tx-events.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);assert.deepEqual(journal.map(e=>e.seq),journal.map((_,i)=>i+1));
});

test('network identity is checked before any write and errors exclude RPC credentials',async t=>{
 const {chain}=await fixture(t);await chain.deploy();chain.publicClient.getChainId=async()=>1;
 await assert.rejects(chain.execute('get_balance',{token:'A'}),/TESTNET_CHAIN_ID_MISMATCH/);
 await assert.rejects(chain.execute('transfer_token',{token:'A',amount:'1'}),/TESTNET_CHAIN_ID_MISMATCH/);
 chain.publicClient.getChainId=async()=>{throw Error('https://endpoint.invalid/private-secret?token=abc');};
 await assert.rejects(chain.connect(),e=>e.message==='RPC_NETWORK_UNAVAILABLE'&&!JSON.stringify(e).includes('private-secret'));
});

test('wire capture proves public backend uses signed standard RPC and no privileged local methods',async t=>{
 const {make,options}=await fixture(t),methods=[];
 const proxy=httpServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const raw=Buffer.concat(chunks),body=JSON.parse(raw);for(const r of Array.isArray(body)?body:[body]){methods.push(r.method);if(/^(anvil_|evm_|personal_|eth_sign|eth_sendTransaction)/.test(r.method))throw Error('PRIVILEGED_RPC_FORBIDDEN');}const upstream=await fetch(options.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:raw});res.writeHead(upstream.status,{'Content-Type':'application/json'});res.end(await upstream.text());}catch{res.writeHead(500);res.end('rejected');}});
 proxy.listen(0,'127.0.0.1');await once(proxy,'listening');t.after(()=>new Promise(r=>{proxy.closeAllConnections();proxy.close(r);}));
 const c=make({rpcUrl:`http://127.0.0.1:${proxy.address().port}`});await c.connect();await c.deploy();await c.execute('get_state');await c.execute('transfer_token',{token:'A',amount:'1'});
 assert.ok(methods.includes('eth_sendRawTransaction'));assert.ok(methods.includes('eth_estimateGas'),JSON.stringify([...new Set(methods)]));assert.ok(methods.includes('eth_call'));assert.ok(!methods.some(m=>/^(anvil_|evm_|personal_|eth_sign|eth_sendTransaction)/.test(m)));
});

test('reorg during checker scan invalidates captured state instead of mixing branches',async t=>{
 const {chain}=await fixture(t);await chain.deploy();chain.beginRunCapture('scan-reorg');const before=await chain.state();await chain.execute('transfer_token',{token:'A',amount:'10'});const after=await chain.state();
 const get=chain.publicClient.getBlock;let scanned=false;
 chain.publicClient.getBlock=async args=>{const block=await get(args);if(args?.includeTransactions)scanned=true;if(scanned&&args?.blockNumber===BigInt(after.blockNumber)&&!args.includeTransactions)return {...block,hash:'0x'+'b'.repeat(64)};return block;};
 const result=await chain.check('transfer',before,after);assert.equal(result.status,'unknown');assert.equal(result.validationStatus,'evidence_missing');
});

test('sealed reorg and unavailable RPC evidence remain unknown in pure offline recheck',async t=>{
 const {chain}=await fixture(t);await chain.deploy();chain.beginRunCapture('sealed-evidence');const before=await chain.state();await chain.execute('transfer_token',{token:'A',amount:'10'});const after=await chain.state();
 const verified=await chain.check('transfer',before,after);assert.equal(verified.status,'success');assert.equal(verified.evidence.options.externalEvidenceVerified,true);
 const get=chain.publicClient.getBlock;
 for(const fault of ['reorg','rpc-unavailable']){
  chain.publicClient.getBlock=async args=>{if(fault==='rpc-unavailable')throw Error('simulated RPC unavailable');const block=await get(args);return args?.blockNumber===BigInt(after.blockNumber)?{...block,hash:'0x'+'d'.repeat(64)}:block;};
  // Supply independently decoded successful transactions: without the sealed
  // failure flag these otherwise valid states would wrongly pass offline.
  const live=await chain.check('transfer',before,after,verified.evidence.transactions);assert.equal(live.status,'unknown');assert.equal(live.evidence.options.externalEvidenceVerified,false);
  const e=JSON.parse(JSON.stringify(live.evidence)),offline=checkTask('transfer',e.before,e.after,e.transactions,e.agentFinal,e.observations,e.options);
  assert.equal(offline.status,'unknown');assert.equal(offline.validationStatus,'evidence_missing');assert.equal(offline.reason,live.reason);
  assert.equal(checkTask('transfer',e.before,e.after,e.transactions,e.agentFinal,e.observations,{...e.options,externalEvidenceVerified:undefined,externalEvidenceReason:undefined}).status,'success');
 }
 chain.publicClient.getBlock=get;
 const fresh=await chain.check('transfer',before,after,verified.evidence.transactions);assert.equal(fresh.status,'success');assert.equal(fresh.evidence.options.externalEvidenceVerified,true);
});

test('legacy checker default preserves local exact block policy; public policy accepts later canonical query',async()=>{
 const address=n=>'0x'+n.toString(16).padStart(40,'0'),hash=n=>'0x'+n.toString(16).padStart(64,'0');
 const before={chainInstanceId:'fixture',chainId:31337,blockNumber:'100',blockHash:hash(100),timestamp:'100',addresses:{agent:address(1),recipient:address(2),tokenA:address(3),tokenB:address(4),amm:address(5),vault:address(6)},balances:{agentA:'100000000',agentB:'0',recipientA:'0',recipientB:'0',native:'1'},allowances:{ammA:'0',vaultB:'0'},shares:'0',vaultAssets:'0',reserves:{A:'10000000000',B:'10000000000'},nonce:0};
 const after={...before,blockNumber:'101',blockHash:hash(101),timestamp:'101'},ob={tool:'get_balance',token:'A',account:'agent',address:address(1),balance:'100000000',formatted:'100',decimals:6,blockNumber:'101',blockHash:hash(101)},answer=JSON.stringify({token:'A',address:address(1),balanceBaseUnits:ob.balance,blockHash:ob.blockHash});
 assert.equal(checkTask('balance',before,after,[],answer,[ob]).status,'failure');
 const publicBefore={...before,chainId:84532},publicAfter={...after,chainId:84532};assert.equal(checkTask('balance',publicBefore,publicAfter,[],answer,[ob],{expectedChainId:84532,balanceQueryPolicy:'observed_block',experimentMode:'continuous'}).status,'success');
 assert.equal(checkTask('balance',publicBefore,publicAfter,[],answer,[{...ob,blockNumber:'100',blockHash:hash(100)},ob],{expectedChainId:84532,balanceQueryPolicy:'observed_block',experimentMode:'continuous'}).status,'success');
 assert.equal(checkTask('balance',publicBefore,publicAfter,[],answer,[ob]).status,'unknown');
});
