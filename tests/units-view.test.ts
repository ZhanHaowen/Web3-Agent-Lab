import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTokenState } from '../src/units.js';

test('formatted state preserves exact large integers and native/token decimals',()=>{
  const raw={balances:{agentA:'999999999999990000000',native:'1000000000000000001'},allowances:{ammA:'20000000'},reserves:{A:'9007199254740993123456'},shares:'9960069',vaultAssets:'9960069'};
  const copy=structuredClone(raw),view=formatTokenState(raw);
  assert.equal(view.balances.agentA,'999999999999990');assert.equal(view.balances.native,'1.000000000000000001');
  assert.equal(view.allowances.ammA,'20');assert.equal(view.reserves.A,'9007199254740993.123456');
  assert.equal(view.shares,'9.960069');assert.deepEqual(raw,copy);
  assert.deepEqual(formatTokenState({balances:{unknown:'unavailable'}}).balances,{});
});
