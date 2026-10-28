import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { formatUnits } from 'viem';
import { ChainLab } from '../src/chain.js';
import { checkTask } from '../src/checker.js';
import type { TaskId } from '../src/tasks.js';

test('real Anvil: five tasks, independent negative cases, snapshots, pending and reset', {timeout:120_000}, async t => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'web3-chain-test-'));
  const lab=new ChainLab({rpcUrl:'http://127.0.0.1:18546',dataDir:dir});
  try {
    await lab.start();
    const baseline=await lab.state();
    const execute=(name:string,args:Record<string,unknown>)=>lab.execute(name,args);
    const continuous={experimentMode:'continuous' as const};
    const runContinuous=async(id:TaskId)=>{
      lab.beginRunCapture();const before=await lab.state();let final='';
      if(id==='balance') {const read=await execute('get_balance',{token:'A'});final=JSON.stringify({token:'A',address:read.address,balanceBaseUnits:read.balance,blockHash:read.blockHash});}
      if(id==='transfer') await execute('transfer_token',{token:'A',amount:'10'});
      if(id==='approve'&&before.allowances.ammA!=='20000000') await execute('approve_token',{token:'A',spender:'amm',amount:'20'});
      if(id==='swap'||id==='swap_deposit') {
        if(BigInt(before.allowances.ammA)<10_000_000n) await execute('approve_token',{token:'A',spender:'amm',amount:'10'});
        const swapped=await execute('swap',{amountIn:'10',minAmountOut:'9'});
        if(id==='swap_deposit') {
          const amount=swapped.amountOutFormatted;
          if(BigInt(before.allowances.vaultB)<BigInt(swapped.amountOut)) await execute('approve_token',{token:'B',spender:'vault',amount});
          await execute('deposit',{amount});
        }
      }
      const after=await lab.state();
      const checked=await lab.check(id,before,after,lab.transactions,final,continuous);
      assert.equal(checked.status,'success',JSON.stringify(checked));
      assert.equal(checked.checkerVersion,'2.2.0');
      assert.equal(checkTask(id,before,after,checked.evidence.transactions,final,checked.evidence.observations,checked.evidence.options).status,'success');
      return {before,after,checked};
    };
    const run=async (id:TaskId) => {
      await lab.reset();const before=await lab.state();let final='';
      if(id==='balance') {const balance=await execute('get_balance',{token:'A'});final=JSON.stringify({token:'A',address:balance.address,balanceBaseUnits:balance.balance,blockHash:balance.blockHash});}
      if(id==='transfer') await execute('transfer_token',{token:'A',amount:'10'});
      if(id==='approve') await execute('approve_token',{token:'A',spender:'amm',amount:'20'});
      if(id==='swap'||id==='swap_deposit') {
        await execute('approve_token',{token:'A',spender:'amm',amount:'10'});
        await execute('swap',{amountIn:'10',minAmountOut:'9'});
        if(id==='swap_deposit') {
          const balance=await execute('get_balance',{token:'B'});
          await execute('approve_token',{token:'B',spender:'vault',amount:balance.formatted});
          await execute('deposit',{amount:balance.formatted});
        }
      }
      const result=await lab.check(id,before,await lab.state(),lab.transactions,final);
      assert.equal(result.status,'success',JSON.stringify(result));
      assert.equal(checkTask(id,result.evidence.before,result.evidence.after,result.evidence.transactions,final,result.evidence.observations).status,'success');
    };
    for(const task of ['balance','transfer','approve','swap','swap_deposit'] as TaskId[]) await t.test(task,()=>run(task));
    await t.test('continuous transfers inherit 100 -> 90 -> 80 and default offline mode remains independent',async()=>{
      await lab.reset();const first=await runContinuous('transfer');const second=await runContinuous('transfer');
      assert.equal(first.before.balances.agentA,'100000000');assert.equal(second.before.balances.agentA,'90000000');
      assert.equal(second.after.balances.agentA,'80000000');assert.equal(second.after.balances.recipientA,'20000000');
      assert.equal(first.before.chainInstanceId,second.before.chainInstanceId);
      const withHistory=[...first.checked.evidence.transactions.map(tx=>({hash:tx.hash,status:tx.status})),...second.checked.evidence.transactions];
      assert.equal((await lab.check('transfer',second.before,second.after,withHistory,'',continuous)).status,'success','earlier confirmed hashes are outside the current capture interval');
      assert.equal(checkTask('transfer',second.before,second.after,second.checked.evidence.transactions).validationStatus,'precondition_error');
      const balance=await runContinuous('balance');assert.equal(balance.before.balances.agentA,'80000000');
    });
    await t.test('independent resets still start each transfer at 100 -> 90',async()=>{
      for(let i=0;i<2;i++) {await run('transfer');assert.equal((await lab.state()).balances.agentA,'90000000');}
    });
    await t.test('continuous approve and swap-deposit preserve old B/shares and reuse allowances',async()=>{
      await run('swap_deposit');await runContinuous('swap');
      const seeded=await lab.state();assert.ok(BigInt(seeded.balances.agentB)>0n);assert.ok(BigInt(seeded.shares)>0n);
      await runContinuous('approve');const noOp=await runContinuous('approve');assert.equal(noOp.checked.evidence.transactions.length,0);
      const deposited=await runContinuous('swap_deposit');
      assert.equal(deposited.after.balances.agentB,seeded.balances.agentB);
      assert.ok(BigInt(deposited.after.shares)>BigInt(seeded.shares));
      assert.equal(deposited.after.allowances.ammA,'10000000');
      assert.equal(deposited.checked.evidence.transactions.length,3,'existing A allowance skips approve');
      await execute('approve_token',{token:'B',spender:'vault',amount:'20'});
      const bothReused=await runContinuous('swap_deposit');
      assert.equal(bothReused.checked.evidence.transactions.length,2,'existing A and B allowances skip both approvals');
      assert.equal(bothReused.after.balances.agentB,seeded.balances.agentB);
      assert.ok(BigInt(bothReused.after.allowances.vaultB)>0n);
    });
    await t.test('continuous checker rejects depositing pre-existing B as well as new swap output',async()=>{
      await lab.reset();await runContinuous('swap');lab.beginRunCapture();const before=await lab.state();
      await execute('approve_token',{token:'A',spender:'amm',amount:'10'});await execute('swap',{amountIn:'10',minAmountOut:'9'});
      const allB=formatUnits(BigInt((await lab.state()).balances.agentB),6);
      await execute('approve_token',{token:'B',spender:'vault',amount:allB});await execute('deposit',{amount:allB});
      const verdict=await lab.check('swap_deposit',before,await lab.state(),lab.transactions,'',continuous);
      assert.equal(verdict.status,'failure');assert.equal(verdict.assertions.find(a=>a.id==='all-output-deposited')?.passed,false);
    });
    await t.test('approved amount is bounded but repeated correct approvals are not a fixed-count requirement',async()=>{
      await lab.reset();const before=await lab.state();
      await execute('approve_token',{token:'A',spender:'amm',amount:'10'});await execute('approve_token',{token:'A',spender:'amm',amount:'10'});
      await execute('swap',{amountIn:'10',minAmountOut:'9'});
      assert.equal((await lab.check('swap',before,await lab.state())).status,'success');
    });
    await t.test('capture boundary removes earlier same-block balance observations',async()=>{
      await lab.reset();const observed=await execute('get_balance',{token:'A'});lab.beginRunCapture();const before=await lab.state();
      const final=JSON.stringify({token:'A',address:observed.address,balanceBaseUnits:observed.balance,blockHash:observed.blockHash});
      assert.equal((await lab.check('balance',before,before,[],final,continuous)).status,'failure');
    });
    await t.test('continuous mode never relaxes epoch, address or block evidence identity',async()=>{
      await lab.reset();const before=await lab.state();
      for(const after of [{...before,chainInstanceId:'different-epoch'},{...before,addresses:{...before.addresses,agent:before.addresses.recipient}},{...before,blockHash:`0x${'99'.repeat(32)}`}]) {
        const result=checkTask('transfer',before,after,[],'',[],continuous);
        assert.equal(result.status,'unknown');assert.equal(result.validationStatus,'evidence_missing');
      }
    });
    await t.test('current-state archival export identifies actual start and does not promise restore',async()=>{
      await lab.reset();await runContinuous('transfer');const current=await lab.state();const exported=await lab.exportCurrentState();
      assert.equal(exported.format,'anvil_dumpState');assert.equal(typeof exported.state,'string');
      assert.equal(exported.metadata.captured.blockHash,current.blockHash);assert.match(exported.metadata.restoreGuarantee,/not implemented/);
    });
    await t.test('pending and nonce-gap queued transactions are detected before continuous run',async()=>{
      await lab.reset();await lab.setAutomine(false);lab.beginRunCapture();const before=await lab.state();
      assert.equal(await lab.hasPendingTransactions(),false);
      await execute('transfer_token',{token:'A',amount:'10'});assert.equal(await lab.hasPendingTransactions(),true);
      assert.equal((await lab.check('transfer',before,await lab.state(),lab.transactions,'',continuous)).status,'pending');
      await lab.mine();assert.equal(await lab.hasPendingTransactions(),false);
      assert.equal((await lab.check('transfer',before,await lab.state(),lab.transactions,'',continuous)).status,'success');
      const completed=await lab.state();const prior=[...lab.transactions];await lab.reset();
      assert.equal((await lab.check('transfer',before,completed,prior,'',continuous)).status,'unknown');
      await lab.walletClient.sendTransaction({to:lab.env().accounts.recipient,value:1n,gas:21_000n,nonce:2});
      assert.equal(await lab.hasPendingTransactions(),true,'queued nonce gap is not an empty pool');
      await lab.reset();assert.equal(await lab.hasPendingTransactions(),false);await lab.setAutomine(true);
    });
    await t.test('balance rejects unrelated 100, wrong account, or fabricated observations',async()=>{
      await lab.reset();const before=await lab.state();
      assert.equal((await lab.check('balance',before,before,[],'recipient有100，agent未知')).status,'failure');
      const balance=await execute('get_balance',{token:'A'});
      const wrong=JSON.stringify({token:'A',address:before.addresses.recipient,balanceBaseUnits:balance.balance,blockHash:balance.blockHash});
      assert.equal((await lab.check('balance',before,before,[],wrong)).status,'failure');
      const correct=JSON.stringify({token:'A',address:balance.address,balanceBaseUnits:balance.balance,blockHash:balance.blockHash});
      assert.equal(checkTask('balance',before,before,[],correct,[]).status,'failure');
      assert.equal((await lab.check('balance',before,before,[],correct)).status,'success');
    });
    await t.test('wrong recipient is caught even when Agent says success',async()=>{
      await lab.reset();const before=await lab.state();
      await execute('transfer_token',{token:'A',recipient:lab.env().accounts.observer,amount:'10'});
      assert.equal((await lab.check('transfer',before,await lab.state(),[],'任务成功')).status,'failure');
    });
    await t.test('protocol revert is a mined receipt',async()=>{
      await lab.reset();const before=await lab.state();
      const result=await execute('transfer_token',{token:'A',amount:'1000'});
      assert.equal(result.status,'reverted');assert.equal(result.receipt.status,'reverted');
      assert.equal((await lab.check('transfer',before,await lab.state())).status,'failure');
    });
    await t.test('manual mining returns pending then independently resolves success',async()=>{
      await lab.reset();await lab.setAutomine(false);const before=await lab.state();
      const result=await execute('transfer_token',{token:'A',amount:'10'});assert.equal(result.status,'pending');
      assert.equal((await lab.check('transfer',before,await lab.state())).status,'pending');
      await lab.mine({blocks:1,seconds:2});
      assert.equal((await lab.check('transfer',before,await lab.state())).status,'success');
      await lab.setAutomine(true);
    });
    await t.test('reset drops pending txs and restores exact baseline block hash',async()=>{
      await lab.reset();await lab.setAutomine(false);
      await execute('transfer_token',{token:'A',amount:'10'});
      await lab.reset();await lab.mine();assert.equal((await lab.state()).balances.recipientA,'0');
      await lab.setAutomine(true);await lab.reset();
      assert.equal((await lab.state()).blockHash,baseline.blockHash);
    });
    await t.test('snapshot revert restores balances',async()=>{
      const id=await lab.snapshot();await execute('transfer_token',{token:'A',amount:'10'});await lab.restore(id);
      assert.equal((await lab.state()).balances.agentA,'100000000');
    });
    await t.test('reset changes epoch and prevents live rechecking old evidence',async()=>{
      await lab.reset();const before=await lab.state();await execute('transfer_token',{token:'A',amount:'10'});const after=await lab.state();const txs=[...lab.transactions];
      await lab.reset();assert.notEqual((await lab.state()).chainInstanceId,before.chainInstanceId);
      assert.equal((await lab.check('transfer',before,after,txs)).status,'unknown');
    });
    await t.test('unresolvable hash is unknown and malformed block reference is unknown',async()=>{
      await lab.reset();const before=await lab.state();
      const absent={hash:`0x${'12'.repeat(32)}`,status:'unknown' as const};
      assert.equal((await lab.check('transfer',before,before,[absent])).status,'unknown');
      assert.equal((await lab.check('transfer',{...before,blockHash:`0x${'34'.repeat(32)}`},before,[])).status,'unknown');
    });
    await t.test('pre-submit recorder failure is fatal and creates no side effect',async()=>{
      await lab.reset();const before=await lab.state();
      await assert.rejects(lab.execute('transfer_token',{token:'A',amount:'10'},{emit:async()=>{throw new Error('disk full');}}),{name:'RecordingError'});
      assert.equal((await lab.state()).nonce,before.nonce);assert.equal((await lab.state()).balances.agentA,'100000000');
    });
    await t.test('submission timeout without hash remains an unknown captured attempt',async()=>{
      await lab.reset();lab.beginRunCapture();const before=await lab.state();const captured=lab.transactions;
      const original=lab.walletClient.sendTransaction;
      try {
        lab.walletClient.sendTransaction=async()=>{throw new Error('Simulated transport timeout');};
        const result:any=await execute('transfer_token',{token:'A',amount:'10'});
        assert.equal(result.status,'unknown');assert.equal(result.txHash,undefined);
        assert.equal(captured.length,1);
        const checked=await lab.check('transfer',before,await lab.state(),captured);
        assert.equal(checked.status,'unknown');assert.equal(checked.evidence.transactions.length,1);
      } finally {lab.walletClient.sendTransaction=original;}
    });
    await t.test('post-submit recorder failure stays fatal and cannot become a retryable response',async()=>{
      await lab.reset();
      await assert.rejects(lab.execute('transfer_token',{token:'A',amount:'10'},{emit:async(type)=>{if(type==='tx.broadcast')throw new Error('disk full');}}),{name:'RecordingError'});
      assert.equal((await lab.state()).balances.agentA,'90000000');
    });
    await t.test('same process restart reconstructs same deterministic baseline hash',async()=>{
      await lab.stop();await lab.start();assert.equal((await lab.state()).blockHash,baseline.blockHash);
    });
    await t.test('fixed-block fork of local upstream starts and executes real transactions',async()=>{
      const fork=new ChainLab({rpcUrl:'http://127.0.0.1:18547',dataDir:path.join(dir,'fork')});
      try {
        await fork.start({forkUrl:lab.rpcUrl,forkBlockNumber:baseline.blockNumber});
        assert.equal(fork.env().fork.blockNumber,baseline.blockNumber);
        assert.equal(fork.env().fork.blockHash,baseline.blockHash);
        const before=await fork.state();
        await fork.execute('transfer_token',{token:'A',amount:'10'});
        assert.equal((await fork.check('transfer',before,await fork.state())).status,'success');
      } finally {await fork.stop();}
    });
  } finally {
    await lab.stop();
    assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('web3-chain-test-'));
    await fs.rm(dir,{recursive:true,force:true});
  }
});
