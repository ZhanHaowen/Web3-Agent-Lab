import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, renameSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBnbJournal, runBnbExperiment, BNB_EIP3009_TYPES, resolveBnbAnvil } from '../src/bnb-sdk/runner.mjs';
import { checkBnbRun, readVerifiedBnbEvents } from '../src/bnb-sdk/checker.mjs';
import { buildBnbProvenance } from '../src/bnb-sdk/provenance.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
function temp(t){const dir=mkdtempSync(join(tmpdir(),'bnb-sdk-runner-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));return dir;}
const start=(journal,scenario='x402-offline')=>journal.event('run.started',{runId:'test',config:{scenario,network:'bsc-testnet'}});

test('immutable journal redacts secrets and validates every payload',t=>{
  const dir=temp(t),j=createBnbJournal(dir,'test');j.addSecret('my-secret-key');start(j);
  j.event('example',{privateKey:'my-secret-key',nested:{signature:'0xsigned'},error:'key=my-secret-key',amount:12n});
  const rows=readVerifiedBnbEvents(dir);assert.equal(rows[1].payload.amount,'12');
  assert.equal(rows[1].payload.nested.signature,'[REDACTED]');assert.equal(rows[1].payload.error,'key=[REDACTED]');
  assert.throws(()=>createBnbJournal(dir,'test'),/EEXIST/);
  const blob=join(dir,rows[1].payloadRef);writeFileSync(blob,'{}');
  assert.equal(checkBnbRun(dir).status,'failed');
});

test('offline checker does not trust forged summary or truncated log',t=>{
  const dir=temp(t),j=createBnbJournal(dir,'test');start(j);
  writeFileSync(join(dir,'summary.json'),JSON.stringify({status:'passed'}));assert.equal(checkBnbRun(dir).status,'unknown');
  const file=join(dir,'raw/events.jsonl');writeFileSync(file,readFileSync(file,'utf8').trim());
  assert.equal(checkBnbRun(dir).status,'failed');
});

test('checker rejects missing x402 guards and treats environment failure as unknown',t=>{
  const dir=temp(t),j=createBnbJournal(dir,'test');start(j);j.event('run.completed',{scenario:'x402-offline'});
  assert.equal(checkBnbRun(dir).status,'failed');
  j.event('run.error',{kind:'environment',message:'archive state unavailable'});assert.equal(checkBnbRun(dir).status,'unknown');
});

test('checker binds transaction to SDK operation contract and receipt block',t=>{
  const dir=temp(t),j=createBnbJournal(dir,'test');start(j,'erc8183-fork');
  j.event('deployment.snapshot',{chainId:97,blockHash:'0xblock'});
  j.event('operation.started',{operationId:'create',contract:'0xaaa'});
  j.event('transaction.recorded',{operationId:'create',transaction:{hash:'0xtx',to:'0xbbb'},receipt:{status:'success',transactionHash:'0xtx',blockHash:'0xwrong'},block:{hash:'0xblock'}});
  j.event('run.completed',{scenario:'erc8183-fork'});
  const result=checkBnbRun(dir);assert.equal(result.status,'failed');
  assert.equal(result.checks.find(c=>c.id==='receipts').status,'failed');assert.equal(result.checks.find(c=>c.id==='transaction-attribution').status,'failed');
});

test('checker rejects a symlinked blob directory without following it',t=>{
  const dir=temp(t),j=createBnbJournal(dir,'test');start(j);
  renameSync(join(dir,'raw/blobs'),join(dir,'raw/blobs-original'));
  try{symlinkSync(join(dir,'raw/blobs-original'),join(dir,'raw/blobs'),process.platform==='win32'?'junction':'dir');}
  catch(error){if(['EPERM','EACCES'].includes(error.code)){t.skip('Host cannot create directory links');return;}throw error;}
  const result=checkBnbRun(dir,{write:false});assert.equal(result.status,'failed');assert.match(result.checks[0].detail,/Unsafe raw evidence directory/);
});

test('malformed saved receipt produces failed verdict instead of an uncaught exception',t=>{
  const dir=temp(t),j=createBnbJournal(dir,'test');start(j,'erc8004-fork');
  j.event('deployment.snapshot',{chainId:97,blockHash:'0xblock'});j.event('transaction.recorded',{transaction:{hash:'0xtx'}});
  j.event('run.completed',{scenario:'erc8004-fork'});
  const result=checkBnbRun(dir);assert.equal(result.status,'failed');assert.equal(result.checks.find(c=>c.id==='evidence-shape').status,'failed');
});

test('provenance retains exact sources and nested EVM calls without fabricated LLM nodes',()=>{
  const events=[{eventId:'r:1',type:'run.started',payload:{}},{eventId:'r:2',type:'operation.started',payload:{operationId:'one',name:'createJob',contract:'0xABC'}},{eventId:'r:3',type:'transaction.recorded',payload:{operationId:'one',transaction:{hash:'0xtx',to:'0xabc'},receipt:{status:'success'},traceAvailable:true,trace:{type:'CALL',to:'0xabc',calls:[{type:'DELEGATECALL',to:'0xdef',input:'0x1234',output:'0x'}]}}}];
  const graph=buildBnbProvenance(events,'r');
  assert.equal(graph.nodes.filter(n=>n.type==='evm-call').length,2);assert.equal(graph.nodes.filter(n=>n.type==='contract').length,1);
  assert.equal(graph.edges.find(e=>e.type==='submits').source,'op:one');assert.deepEqual(graph.nodes.find(n=>n.id==='tx:0xtx:call:0.0').sourceEvents,['r:3']);
  assert.equal(graph.nodes.some(n=>n.type==='model-call'),false);assert.equal(graph.missingRelations[0].relation,'model-call');
});

test('mainnet writes are rejected before creating an output journal',async t=>{
  const dir=temp(t);await assert.rejects(runBnbExperiment({scenario:'erc8183-fork',network:'bsc-mainnet',rpcUrl:'https://example.invalid'},{root,outDir:dir,runId:'test'}),/read-only/);
  assert.equal(existsSync(join(dir,'raw/events.jsonl')),false);
});

test('pre-aborted experiment preserves cancellation evidence',async t=>{
  const dir=temp(t),abort=new AbortController();abort.abort();
  const result=await runBnbExperiment({scenario:'x402-offline',network:'bsc-testnet'},{root,outDir:dir,runId:'test',signal:abort.signal});
  assert.equal(result.status,'cancelled');assert.equal(checkBnbRun(dir).status,'cancelled');
});

test('canonical EIP-3009 domain fields are complete',()=>{
  assert.deepEqual(BNB_EIP3009_TYPES.EIP712Domain.map(v=>v.name),['name','version','chainId','verifyingContract']);
  assert.deepEqual(BNB_EIP3009_TYPES.TransferWithAuthorization.map(v=>v.name),['from','to','value','validAfter','validBefore','nonce']);
});

test('Anvil selection matches Windows and both macOS distributions with bounded source fallback',()=>{
  const base=resolve('sample-install'),choose=(platform,arch,present)=>resolveBnbAnvil(base,{platform,arch,exists:path=>present.includes(path)});
  const win=join(base,'runtime/anvil.exe'),arm=join(base,'runtime/darwin-arm64/anvil'),intel=join(base,'runtime/darwin-x64/anvil'),source=join(base,'runtime/anvil');
  assert.equal(choose('win32','x64',[win]),win);
  assert.equal(choose('darwin','arm64',[arm,source]),arm);assert.equal(choose('darwin','x64',[intel,source]),intel);
  assert.equal(choose('darwin','arm64',[source]),source);assert.equal(choose('linux','x64',[source]),source);
  assert.throws(()=>choose('darwin','arm64',[intel]),/missing/);assert.throws(()=>choose('darwin','riscv64',[source]),/Unsupported/);
});

test('real bundled SDK signs offline, enforces route/budget and exports replayable graph',{skip:!existsSync(join(root,'packages/bnb-sdk-lab/runtime.mjs'))},async t=>{
  const dir=temp(t);let pauses=0;
  const result=await runBnbExperiment({scenario:'x402-offline',network:'bsc-testnet'},{root,outDir:dir,runId:'actual-offline',checkpoint:async()=>{pauses++;}});
  assert.equal(result.status,'passed',JSON.stringify(result));assert.equal(pauses,2);assert.equal(result.transactionCount,0);
  const all=readVerifiedBnbEvents(dir);assert.equal(all.find(e=>e.type==='x402.validation').payload.signatureVerified,true);
  assert.equal(readFileSync(join(dir,'derived/execution-trace.json'),'utf8').includes('privateKey'),false);
  for(const file of ['graph.json','graph.graphml','nodes.csv','edges.csv','execution-trace.json','checker.json'])assert.equal(existsSync(join(dir,'derived',file)),true);
  const graph=JSON.parse(readFileSync(join(dir,'derived/graph.json'),'utf8'));
  assert.equal(graph.edges.some(e=>['calls','submits','evm-execution','internal-call'].includes(e.type)),false);
  assert.equal(graph.edges.some(e=>e.type==='signs-for-contract'),true);
  writeFileSync(join(dir,'summary.json'),'{}');assert.equal(checkBnbRun(dir).status,'passed');
});
