import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ChainLab } from '../src/chain.js';

test('manual mining applies interval to the first and every subsequent block', {timeout:60_000}, async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'lab-mining-v013-'));
  const chain=new ChainLab({rpcUrl:'http://127.0.0.1:18613',dataDir:dir});
  try {
    await chain.start();await chain.setAutomine(false);
    await t.test('one block advances exactly 100 seconds',async()=>{
      const mined=await chain.mine({blocks:1,seconds:100});
      assert.equal(mined.mining.actualBlocks,1);assert.equal(mined.mining.actualDeltaSeconds,100);
      assert.equal(BigInt(mined.timestamp)-BigInt(mined.mining.before.timestamp),100n);
    });
    await t.test('three blocks each advance exactly 17 seconds',async()=>{
      const mined=await chain.mine({blocks:3,seconds:17});
      assert.equal(mined.mining.actualBlocks,3);assert.equal(mined.mining.actualDeltaSeconds,51);
      for(let index=1;index<=3;index++) {
        const block=await chain.publicClient.getBlock({blockNumber:BigInt(mined.mining.before.blockNumber)+BigInt(index)});
        assert.equal(block.timestamp,BigInt(mined.mining.before.timestamp)+BigInt(index*17));
      }
    });
    await t.test('invalid options fail instead of clamping or defaulting',async()=>{
      for(const options of [{blocks:0},{blocks:1.5},{blocks:1001},{seconds:0},{seconds:86401},{seconds:'100' as any}]) await assert.rejects(chain.mine(options),/INVALID_MINING_OPTIONS/);
    });
    await t.test('automatic transactions retain deterministic one-second interval',async()=>{
      await chain.setAutomine(true);const before=await chain.state();
      await chain.execute('transfer_token',{token:'A',amount:'1'});
      assert.equal(BigInt((await chain.state()).timestamp)-BigInt(before.timestamp),1n);
    });
  } finally {await chain.stop();await fs.rm(dir,{recursive:true,force:true});}
});
