import test from 'node:test';
import assert from 'node:assert/strict';
import { config, units } from '../src/budget/common.mjs';

const base = { task: 'Pay the fixed experimental recipient.', model: { backend: 'local' } };

test('new experiments default to unified accounting and require a model task', () => {
  assert.equal(config(base).mode, 'unified');
  assert.equal(config(base).maxSteps, 8);
  assert.throws(() => config({ ...base, mode: 'split' }), /CONFIG_ENUM/);
  assert.throws(() => config({ ...base, task: ' ' }), /BUDGET_TASK_REQUIRED/);
  assert.throws(() => config({ ...base, model: undefined }), /MODEL_BACKEND/);
  for (const maxSteps of [0, 25, '8']) {
    assert.throws(() => config({ ...base, maxSteps }), /BUDGET_MODEL_STEP_LIMIT/);
  }
});

test('decimal amounts are exact and task budget cannot exceed initial funds', () => {
  const result = config({ ...base, initial: '0.000006', budget: '0.000003' });
  assert.equal(units(result.budget), 3n);
  assert.throws(() => config({ ...base, initial: '0.000006', budget: '0.000007' }), /BUDGET_EXCEEDS_BALANCE/);
  for (const amount of [-1, '-1', '1e2', '0.0000001']) {
    assert.throws(() => config({ ...base, budget: amount }), /AMOUNT_DECIMAL_STRING/);
  }
});

test('local and API model options cannot persist API credentials in config', () => {
  const local = { ...base, model: { backend: 'local', baseUrl: 'http://127.0.0.1:8080/v1' } };
  assert.throws(() => config(local), /MODEL_CONFIG_FIELDS/);
  const model = { backend: 'api', baseUrl: 'https://api.example.com/v1', model: 'fixture' };
  assert.deepEqual(config({ ...base, model }).model, model);
  assert.throws(() => config({ ...base, model: { ...model, apiKey: 'fixture-secret' } }), /MODEL_CONFIG_FIELDS/);
});

test('task text never freezes a business goal by itself', () => {
  assert.equal(config(base).taskGoal, undefined);
  for (const task of [
    '直接支付 40 BUD，再申请 50 BUD 的 Permit2 许可。',
    '不要直接支付 40 BUD，也不要申请 50 BUD 的 Permit2 许可。',
  ]) {
    assert.equal(config({ ...base, task }).taskGoal, undefined);
  }
});

test('explicit goals distinguish exact and cumulative amounts, with confirmation for the new form', () => {
  const legacy = { direct: '0', permit2: '0.000001' };
  assert.deepEqual(config({ ...base, taskGoal: legacy }).taskGoal, { ...legacy, mode: 'exact', confirmed: true });
  for (const mode of ['exact', 'cumulative']) {
    const taskGoal = { ...legacy, mode, confirmed: true };
    assert.deepEqual(config({ ...base, taskGoal }).taskGoal, taskGoal);
    for (const unconfirmed of [{ ...legacy, mode }, { ...taskGoal, confirmed: false }]) {
      assert.throws(() => config({ ...base, taskGoal: unconfirmed }), /TASK_GOAL_CONFIRMATION_REQUIRED/);
    }
  }
  for (const invalid of [null, { direct: '1' }, { direct: '1', permit2: 0 }, { direct: '0', permit2: '-1' },
    { ...legacy, total: '1' }, { ...legacy, mode: 'either', confirmed: true }]) {
    assert.throws(() => config({ ...base, taskGoal: invalid }));
  }
});

test('the default EOA and explicit wallet grants are normalized and immutable by scope', () => {
  assert.deepEqual(config(base).wallet, { backend: 'local-eoa', transfer: true, permit2: true, limit: '100' });
  const result = config({ ...base, wallet: { backend: 'smart-account', permit2: false, limit: '40.000001' } });
  assert.equal(result.budget, '100');
  assert.deepEqual(result.wallet, { backend: 'smart-account', transfer: true, permit2: false, limit: '40.000001' });
  assert.throws(() => config({ ...base, wallet: { limit: '100.000001' } }), /WALLET_LIMIT_EXCEEDS_TASK_BUDGET/);
  for (const wallet of [null, { backend: 'external' }, { transfer: 'true' }, { account: '0x123' }]) {
    assert.throws(() => config({ ...base, wallet }), /WALLET_CONFIG/);
  }
  for (const limit of ['0', '-1', 50]) {
    assert.throws(() => config({ ...base, wallet: { limit } }));
  }
});
