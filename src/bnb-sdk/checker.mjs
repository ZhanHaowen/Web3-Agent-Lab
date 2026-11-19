import { readFileSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const sha = value => createHash('sha256').update(value).digest('hex');
const lower = value => String(value ?? '').toLowerCase();
const sameInteger=(a,b)=>{try{return BigInt(a)===BigInt(b);}catch{return false;}};

/** Validate raw event chain and addressed payloads before interpreting any result. */
export function readVerifiedBnbEvents(outDir) {
  for(const path of [outDir,join(outDir,'raw'),join(outDir,'raw/blobs')]){const stat=lstatSync(path);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Unsafe raw evidence directory');}
  const journalPath=join(outDir,'raw/events.jsonl'),journalStat=lstatSync(journalPath);
  if(journalStat.isSymbolicLink()||!journalStat.isFile()||journalStat.size>16*1024*1024)throw new Error('Unsafe or oversized raw journal');
  const text=readFileSync(journalPath,'utf8');
  if(!text.endsWith('\n'))throw new Error('Raw journal is incomplete (missing final newline)');
  const rows=text.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
  if(rows.length>5000)throw new Error('Too many journal events');
  let payloadBytes=0;
  let previous='0'.repeat(64);
  return rows.map((row,index)=>{
    if(row.seq!==index+1||row.prevHash!==previous)throw new Error(`Broken event sequence at ${index+1}`);
    const {hash,...core}=row;
    if(sha(JSON.stringify(core))!==hash)throw new Error(`Event digest mismatch at ${index+1}`);
    if(!/^[a-f0-9]{64}$/.test(row.payloadSha256)||row.payloadRef!==`raw/blobs/${row.payloadSha256}.json`)throw new Error('Invalid payload reference');
    const path=join(outDir,row.payloadRef),stat=lstatSync(path);
    if(stat.isSymbolicLink()||!stat.isFile()||stat.size>32*1024*1024)throw new Error('Unsafe or oversized payload');
    payloadBytes+=stat.size;if(payloadBytes>64*1024*1024)throw new Error('Evidence payload limit exceeded');
    const bytes=readFileSync(path);
    if(sha(bytes)!==row.payloadSha256)throw new Error(`Payload digest mismatch at ${index+1}`);
    const payload=JSON.parse(bytes.toString('utf8'));if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Invalid event payload');
    previous=hash;return {...row,payload};
  });
}

/** Offline independent evidence checker. Re-evaluates records, never trusts summary.json. */
export function checkBnbRun(outDir,{write=true}={}) {
  let events=[];const checks=[];
  const check=(id,ok,detail)=>checks.push({id,status:ok?'passed':'failed',detail});
  let integrity=true;
  try{events=readVerifiedBnbEvents(outDir);check('raw-integrity',true,'Event sequence, digest chain and every referenced blob verified.');}catch(e){integrity=false;check('raw-integrity',false,e.message);}
  const first=events.find(e=>e.type==='run.started')?.payload;
  const end=events.findLast(e=>e.type==='run.completed');
  const error=events.findLast(e=>e.type==='run.error')?.payload;
  const all=type=>events.filter(e=>e.type===type).map(e=>e.payload);
  const txs=all('transaction.recorded');
  try { if(integrity && first && end){
    if(!['x402-offline','deployment-probe','erc8004-fork','erc8183-fork'].includes(first.config?.scenario))throw new Error('Invalid original scenario');
    check('same-run',events.every(e=>e.runId===first.runId),'All raw events belong to the declared run.');
    check('completed-scenario',end.payload.scenario===first.config.scenario,'Completion marker agrees with the original scenario.');
    if(first.config.scenario==='x402-offline'){
      const sign=all('x402.validation')[0];
      check('signature-verified',sign?.signatureVerified===true && sign?.request?.message?.value==='60' && sign?.budgetSpent==='60','Actual local EIP-3009 signature verified during execution; signature is intentionally not exported, so this check is evidence review, not signature re-verification.');
      const rejects=all('x402.rejection');
      for(const kind of ['chain-31337','unknown-token','cumulative-budget'])check(kind,rejects.some(r=>r.kind===kind&&r.rejected===true&&(kind!=='cumulative-budget'||r.budgetSpent==='60')), 'Expected SDK rejection recorded.');
      check('offline-no-transactions',txs.length===0,'Offline signer case must contain no chain transaction.');
    }else if(first.config.scenario==='deployment-probe'){
      const snap=all('deployment.snapshot')[0];
      check('chain-id',snap?.chainId===(first.config.network==='bsc-mainnet'?56:97),'Read-only RPC chain matches requested preset.');
      check('contract-code',snap?.contracts?.length>=4 && snap.contracts.every(c=>c.codeBytes>0 && /^[a-f0-9]{64}$/.test(c.codeSha256)),'Configured protocol addresses contain runtime bytecode at the pinned block.');
      check('readonly-no-transactions',txs.length===0,'Probe has no signer and produces no transactions.');
    }else{
      const snap=all('deployment.snapshot')[0];
      check('fork-chain',first.config.network==='bsc-testnet'&&snap?.chainId===97&&snap?.blockHash,'BSC testnet source block recorded; all writes are on loopback fork.');
      check('receipts',txs.length>0 && txs.every(t=>t.receipt.status==='success'&&lower(t.receipt.transactionHash)===lower(t.transaction.hash)&&lower(t.receipt.blockHash)===lower(t.block.hash)), 'Every submitted transaction has a matching successful receipt and block.');
      const operations=all('operation.started');
      check('transaction-attribution',txs.every(t=>operations.some(o=>o.operationId===t.operationId && lower(o.contract)===lower(t.transaction.to))), 'Each transaction targets its recorded SDK operation contract.');
      if(first.config.scenario==='erc8004-fork'){
        const identity=all('state.identity')[0];
        check('registered-owner-uri',!!identity&&lower(identity.info.owner)===lower(identity.wallet)&&identity.info.agentURI===identity.expectedUri&&String(identity.info.agentId)===String(identity.agentId),'Registry readback matches the ephemeral owner, agent ID and original URI.');
        check('identity-receipt-log',!!identity&&txs.some(t=>t.receipt.logs?.some(l=>lower(l.address)===lower(identity.contract)&&lower(l.topics?.[0])==='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'&&sameInteger(l.topics?.[3],identity.agentId))),'Registration has an ERC-721 Transfer log for the registered agent ID.');
      }else if(first.config.scenario==='erc8183-fork'){
        const states=all('state.job'),before=states.find(s=>s.phase==='created'),after=states.find(s=>s.phase==='cancelled');
        check('job-created',!!before&&Number(before.job.status)===0&&lower(before.job.client)===lower(before.wallet)&&before.job.budget==='0','Created job is OPEN, belongs to the ephemeral client, and remains unfunded.');
        check('open-job-cancelled',!!before&&!!after&&String(before.job.id)===String(after.job.id)&&Number(after.job.status)===4,'SDK cancelOpen transitions the same unfunded job from OPEN(0) to REJECTED(4). This is not a funded refund.');
        check('two-job-transactions',txs.length===2,'Create and cancel each have their own successful receipt.');
      }
      const restore=all('snapshot.restored')[0];
      check('snapshot-restored',restore?.reverted===true&&restore?.createdStateAbsent===true,'Snapshot restoration removes the created identity/job from local chain state.');
    }
  } else if(integrity){check('completed-run',false,error?.message || 'Run has not completed; no success verdict is inferred.');}
  } catch(e){check('evidence-shape',false,`Malformed saved evidence: ${e.message}`);}
  const status=!integrity?'failed':error?.kind==='cancelled'?'cancelled':error?.kind==='environment'||(!end&&!error)?'unknown':checks.some(c=>c.status==='failed')?'failed':'passed';
  const result={schemaVersion:1,runId:first?.runId??null,scenario:first?.config?.scenario??null,status,checkedAt:new Date().toISOString(),checks,transactionCount:txs.length,limitations:['Offline recheck validates saved evidence, not current public-chain state.','Hash integrity is not an externally anchored authenticity proof.','Only recorded SDK operations are attributed; missing LLM relations are not fabricated.']};
  if(write){
    // A malformed imported bundle must not turn rechecking into an arbitrary-file write.
    const safeExisting=(path,kind)=>{try{const st=lstatSync(path);return !st.isSymbolicLink()&&(kind==='dir'?st.isDirectory():st.isFile());}catch(e){return e.code==='ENOENT';}};
    if(safeExisting(outDir,'dir')&&safeExisting(join(outDir,'derived'),'dir')&&safeExisting(join(outDir,'derived/checker.json'),'file')){
      mkdirSync(join(outDir,'derived'),{recursive:true});writeFileSync(join(outDir,'derived/checker.json'),JSON.stringify(result,null,2));
    }
  }
  return result;
}
