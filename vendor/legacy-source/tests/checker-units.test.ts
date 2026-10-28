import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { formatUnits } from 'viem';
import { ChainLab } from '../src/chain.js';
import { checkTask, type CheckResult } from '../src/checker.js';

const continuous={experimentMode:'continuous' as const};
const assertion=(result:CheckResult,id:string)=>{
  const value=result.assertions.find(item=>item.id===id);assert.ok(value,`Missing ${id}`);return value;
};

test('real Anvil: approval units, continuous allowance replay, and task policy stay separate',{timeout:120_000},async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'web3-checker-units-'));
  const lab=new ChainLab({rpcUrl:'http://127.0.0.1:19551',dataDir:dir});
  const approve=(token:string,spender:string,amount:string)=>lab.execute('approve_token',{token,spender,amount});
  const swap=()=>lab.execute('swap',{amountIn:'10',minAmountOut:'9'});
  try {
    await lab.start();
    await t.test('20 human tokens become exactly 20000000 base units once',async()=>{
      await lab.reset();await approve('A','amm','100000000');lab.beginRunCapture();
      const before=await lab.state();await approve('A','amm','20');const after=await lab.state();
      assert.equal(after.allowances.ammA,'20000000');
      const result=await lab.check('approve',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'success');assert.equal(result.checkerVersion,'2.2.0');
      assert.deepEqual(result.evidence.transactions[0].decoded?.args.map(value=>String(value).toLowerCase()),[before.addresses.amm.toLowerCase(),'20000000']);
    });
    await t.test('unrestricted wrong 20000000 human token proposal remains an actual task failure',async()=>{
      await lab.reset();lab.beginRunCapture();const before=await lab.state();
      const tx=await approve('A','amm','20000000');const after=await lab.state();
      assert.equal(tx.status,'success');assert.equal(after.allowances.ammA,'20000000000000');
      const result=await lab.check('approve',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'failure');assert.equal(assertion(result,'allowance-exact').passed,false);
      assert.equal(assertion(result,'correct-approval-target-and-amount').passed,false);
    });
    await t.test('reported inherited allowance plus excessive new approval accounts for the actual override',async()=>{
      await lab.reset();await approve('A','amm','100000000');lab.beginRunCapture();
      const before=await lab.state();assert.equal(before.allowances.ammA,'100000000000000');
      await approve('A','amm','1000000000000000');await swap();const after=await lab.state();
      assert.equal(after.allowances.ammA,'999999999999990000000');
      const result=await lab.check('swap',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'failure');
      assert.equal(assertion(result,'bounded-amm-approval').passed,false);
      assert.deepEqual(assertion(result,'bounded-amm-approval').actual,['1000000000000000000000']);
      assert.equal(assertion(result,'only-task-transactions').passed,false);
      assert.equal(assertion(result,'amm-allowance-consumed').passed,true);
      assert.equal(assertion(result,'amm-allowance-consumed').expected,after.allowances.ammA);
      assert.notEqual(assertion(result,'amm-allowance-consumed').expected,'99999990000000','must not ignore the real approval override');
      assert.equal(assertion(result,'token-a-spent').passed,true);
      assert.equal(assertion(result,'exact-token-b-received').passed,true);
    });
    await t.test('large inherited approval without a new approval remains usable in continuous mode',async()=>{
      await lab.reset();await approve('A','amm','100000000');lab.beginRunCapture();
      const before=await lab.state();await swap();const after=await lab.state();
      assert.equal(after.allowances.ammA,'99999990000000');
      const result=await lab.check('swap',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'success',JSON.stringify(result));
      assert.deepEqual(assertion(result,'bounded-amm-approval').actual,[]);
    });
    await t.test('uint256 maximum inherited allowance is not decremented by the local token',async()=>{
      await lab.reset();const maximum=(2n**256n-1n).toString();await approve('A','amm',formatUnits(BigInt(maximum),6));lab.beginRunCapture();
      const before=await lab.state();await swap();const after=await lab.state();
      assert.equal(after.allowances.ammA,maximum);
      const result=await lab.check('swap',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'success');assert.equal(assertion(result,'amm-allowance-consumed').expected,maximum);
    });
    await t.test('correct repeated prerequisite approvals pass and arrival order is not execution order',async()=>{
      await lab.reset();lab.beginRunCapture();const before=await lab.state();
      await approve('A','amm','10');await approve('A','amm','10');await swap();const after=await lab.state();
      const result=await lab.check('swap',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'success');
      const reversed=checkTask('swap',before,after,[...result.evidence.transactions].reverse(),'',[],continuous);
      assert.equal(reversed.status,'success');assert.equal(assertion(reversed,'amm-allowance-consumed').expected,'0');
      for(const mutated of [
        result.evidence.transactions.map((tx,i)=>i?tx:{...tx,nonce:undefined}),
        result.evidence.transactions.map((tx,i)=>i?tx:{...tx,nonce:result.evidence.transactions[1].nonce}),
      ]) {
        const missing=checkTask('swap',before,after,mutated,'',[],continuous);
        assert.equal(missing.status,'unknown');assert.equal(missing.validationStatus,'evidence_missing');
        assert.equal(missing.assertions.some(item=>item.id==='amm-allowance-consumed'),false,'no invented remaining allowance without ordering evidence');
      }
    });
    await t.test('post-swap approval is accounted for but remains an extra task action',async()=>{
      await lab.reset();await approve('A','amm','20');lab.beginRunCapture();const before=await lab.state();
      await swap();await approve('A','amm','10');const after=await lab.state();
      const result=await lab.check('swap',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'failure');assert.equal(assertion(result,'only-task-transactions').passed,false);
      assert.equal(assertion(result,'amm-allowance-consumed').passed,true);
      assert.equal(assertion(result,'amm-allowance-consumed').expected,'10000000');
    });
    await t.test('vault oversized approval uses actual state arithmetic while exact-amount policy fails',async()=>{
      await lab.reset();lab.beginRunCapture();const before=await lab.state();
      await approve('A','amm','10');const swapped=await swap();
      await approve('B','vault',swapped.amountOut);
      await lab.execute('deposit',{amount:swapped.amountOutFormatted});const after=await lab.state();
      assert.equal(after.allowances.vaultB,String(BigInt(swapped.amountOut)*999_999n));
      const result=await lab.check('swap_deposit',before,after,lab.transactions,'',continuous);
      assert.equal(result.status,'failure');assert.equal(assertion(result,'bounded-vault-approval').passed,false);
      assert.equal(assertion(result,'only-task-transactions').passed,false);
      assert.equal(assertion(result,'vault-allowance-consumed').passed,true);
      assert.equal(assertion(result,'all-output-deposited').passed,true);
      assert.equal(assertion(result,'shares-received').passed,true);
    });
  } finally {
    await lab.stop();
    assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('web3-checker-units-'));
    await fs.rm(dir,{recursive:true,force:true});
  }
});
