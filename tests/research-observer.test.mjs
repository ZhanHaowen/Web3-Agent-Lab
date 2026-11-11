import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {spawn} from 'node:child_process';import {createServer} from 'node:net';import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {capturePublicChain,validatePublicObserver,observerFiles,createRpc} from '../src/observer/index.mjs';
import {extractPublicFeatures} from '../src/observer/features.mjs';
import {generateBackground,generateMarketplaceBackground} from '../src/research/background.mjs';
import {rpcFixture,h} from './research-observer-fixture.mjs';
const rehash=o=>{const {provenance,...body}=o;o.provenance.contentSha256=createHash('sha256').update(JSON.stringify(body)).digest('hex');return o;};

test('direct RPC projects only canonical public fields, retains reverted tx, economic payer differs from relayer',async t=>{
 const f=await rpcFixture(t),o=await f.capture();assert.equal(validatePublicObserver(o).ok,true);assert.deepEqual(o.transactions.map(t=>t.transactionIndex),['0','1','2']);assert.equal(o.transactions[1].status,'0');assert.equal(o.payments.length,2);assert.equal(o.payments[0].payer,f.payer);assert.equal(o.payments[0].broadcaster,f.relayer);assert.equal(o.payments[0].blockTimestamp,'100');assert.equal(o.transactions[0].input,'0x12345678');assert.equal(o.logs[0].logIndex,'0');assert.ok(!JSON.stringify(o).includes('PRIVATE_CANARY'));assert.ok(f.requests.some(r=>r.method==='eth_getTransactionReceipt'));
});
test('private input and unsupported merchant probe profile are rejected before capture',async t=>{
 const f=await rpcFixture(t);await assert.rejects(f.capture({runId:'private'}),/PRIVATE_INPUT/);await assert.rejects(f.capture({profile:'merchant-probe'}),/UNSUPPORTED/);
});
test('changing private truth cannot change independent public export',async t=>{
 const f=await rpcFixture(t),privateTruth={task:'A',budget:10,policy:'cost'},a=await f.capture();Object.assign(privateTruth,{task:'B',budget:99999,policy:'quality'});assert.deepEqual(await f.capture(),a);assert.ok(!JSON.stringify(a).includes('budget'));
});
test('public catalog is explicit profile and strictly limited to declared public advertisements',async t=>{
 const f=await rpcFixture(t),catalog=[{address:f.merchant,name:'Shared merchant',publishedAtBlock:'1',advertisedPrices:[{asset:f.asset,amount:'20'}]}];await assert.rejects(f.capture({publicCatalog:catalog}),/PROFILE_REQUIRED/);const o=await f.capture({profile:'public-chain+publiccatalog',publicCatalog:catalog});assert.equal(validatePublicObserver(o).ok,true);assert.equal(o.publicCatalog[0].name,'Shared merchant');await assert.rejects(f.capture({profile:'public-chain+publiccatalog',publicCatalog:[{...catalog[0],task:'private'}]}),/CATALOG_FIELDS/);
});
test('reorg and missing receipt stop capture rather than declaring complete observations',async t=>{
 const a=await rpcFixture(t,{reorg:true}),b=await rpcFixture(t,{missingReceipt:true});await assert.rejects(a.capture(),/REORG/);await assert.rejects(b.capture(),/RECEIPT/);
});
test('public graph exports JSON GraphML and CSV with public identity refs only',async t=>{
 const f=await rpcFixture(t),files=observerFiles(await f.capture()),g=JSON.parse(files['graph.json']);assert.equal(g.edges.filter(e=>e.kind==='erc20-transfer').length,1);assert.ok(files['graph.graphml'].includes('graphml.graphdrawing.org'));assert.ok(files['edges.csv'].includes('transactionHash'));assert.ok(!JSON.stringify(files).includes('private-run'));
});
test('validator rejects rehashed nonpublic fields, wrong payer, omitted transfers and log order tampering',async t=>{
 const f=await rpcFixture(t),o=await f.capture();for(const modify of [x=>x.transactions[0].task='secret',x=>x.range.runId='private',x=>x.provenance.privateBudget=10,x=>x.payments[0].payer=f.relayer,x=>x.payments.splice(0,1),x=>x.logs[0].transactionIndex='9']){const bad=structuredClone(o);modify(bad);rehash(bad);assert.equal(validatePublicObserver(bad).ok,false);}
});
test('feature ablations use chain time, separate assets, and omit private clocks or labels',async t=>{
 const f=await rpcFixture(t),o=await f.capture(),a=extractPublicFeatures(o),b=extractPublicFeatures(o,{amount:false,time:false,merchant:false,order:false});assert.ok(Object.keys(a).some(k=>k.startsWith('logAmount:')));assert.ok(!Object.keys(b).some(k=>/logAmount|payee|Seconds|transition/.test(k)));assert.ok(!Object.keys(a).some(k=>/task|budget|runId/.test(k)));assert.equal(a.revertedTransactions,1);
});
test('real isolated Anvil native and same-token shared-merchant background are independently observable',async t=>{
 const reservation=createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const anvil=fileURLToPath(new URL('../runtime/anvil.exe',import.meta.url)),child=spawn(anvil,['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--silent'],{windowsHide:true,stdio:'ignore'});let childError;child.on('error',e=>childError=e);t.after(async()=>{if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}});
 const rpcUrl='http://127.0.0.1:'+port,rpc=createRpc(rpcUrl);let ready=false;for(let i=0;i<100;i++){if(childError)throw childError;try{await rpc('eth_chainId');ready=true;break;}catch{}await new Promise(r=>setTimeout(r,50));}assert.ok(ready);
 const background=await generateBackground({rpcUrl,count:3,seed:'same-chain'}),end=await rpc('eth_blockNumber'),o=await capturePublicChain({rpcUrl,fromBlock:'0',toBlock:end});assert.equal(background.records.length,3);assert.ok(background.records.every(r=>r.status==='success'));assert.equal(o.payments.length,3);assert.equal(validatePublicObserver(o).ok,true);assert.ok(!JSON.stringify(o).includes('background'));assert.deepEqual(o.payments.map(p=>p.transactionHash).sort(),background.records.map(r=>r.transactionHash).sort());
 const artifact=JSON.parse(await readFile(new URL('../packages/payment-adapters/artifacts/ResearchEIP3009Token.json',import.meta.url),'utf8')),accounts=await rpc('eth_accounts');const deployment=await rpc('eth_sendTransaction',[{from:accounts[0],data:artifact.bytecode,gas:'0x3d0900'}]),deployed=await rpc('eth_getTransactionReceipt',[deployment]);assert.equal(deployed.status,'0x1');const tokenAddress=deployed.contractAddress,providers=accounts.slice(2,8);
 const args={rpcUrl,tokenAddress,providers,count:3,seed:'shared-market-independent-seed'},market=await generateMarketplaceBackground(args),again=await generateMarketplaceBackground(args);assert.equal(market.status,'complete');assert.equal(market.funding.length,1);assert.equal(market.funding[0].status,'success');assert.ok(market.records.every(r=>r.from.toLowerCase()===accounts[8].toLowerCase()&&providers.includes(r.to)&&['10000','30000'].includes(r.amount)&&r.receipt.status==='0x1'));assert.deepEqual(market.records.map(r=>[r.to,r.amount]),again.records.map(r=>[r.to,r.amount]));assert.ok(market.records.every(r=>r.asset===tokenAddress));
 const observed=await capturePublicChain({rpcUrl,fromBlock:'0',toBlock:await rpc('eth_blockNumber')});assert.equal(validatePublicObserver(observed).ok,true);for(const r of [...market.funding,...market.records,...again.funding,...again.records])assert.ok(observed.payments.some(p=>p.transactionHash===r.transactionHash&&p.amount===r.amount&&p.payee===r.to.toLowerCase()));assert.ok(!JSON.stringify(observed).includes('shared-market-independent-seed'));
 const before=await rpc('eth_blockNumber'),empty=await generateMarketplaceBackground({...args,count:0});assert.equal(empty.funding.length,0);assert.equal(empty.status,'complete');assert.equal(await rpc('eth_blockNumber'),before);await assert.rejects(generateMarketplaceBackground({...args,rpcUrl:'https://mainnet.invalid'}),/LOCAL_CHAIN_ONLY/);
});
