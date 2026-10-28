/** V.011 feedback regression. Run only against an isolated test instance. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = `http://127.0.0.1:${process.env.LAB_PORT || 4437}`;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = { suite: 'V.011-user-feedback', realModelTested: false, tests: [], startedAt: new Date().toISOString() };
let token;
async function api(route, body, expected = 200) {
  const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', 'x-lab-token': token || '' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  const value = await response.json();
  assert.equal(response.status, expected, JSON.stringify(value)); return value;
}
async function run(taskId, options = {}) {
  const { runId } = await api('/api/runs', { taskId, mode: 'scripted', dataOrigin: 'acceptance_test_scripted', ...options }, 202);
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const state = await api('/api/status');
    if (!state.busy && state.active?.runId === runId) return api('/api/runs/' + runId);
    await new Promise(r => setTimeout(r, 50));
  }
  throw Error('RUN_TIMEOUT:' + runId);
}
async function test(name, fn) {
  try { const details = await fn(); report.tests.push({ name, passed: true, details }); console.log('PASS', name); }
  catch (error) { report.tests.push({ name, passed: false, error: error.message }); console.error('FAIL', name, error.message); }
}
let fixtureMode = 'approval10';
const modelFixture = createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const request = JSON.parse(Buffer.concat(chunks).toString());
  if (fixtureMode === 'http401') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'test provider rejected credentials' } })); }
  const hasTool = request.messages.some(m => m.role === 'tool');
  const message = hasTool ? { role: 'assistant', content: fixtureMode === 'balanceWrong' ? '{"token":"A","balanceBaseUnits":"100"}' : '已完成。' } : { role: 'assistant', content: null, tool_calls: [{ id: 'fixture-call-1', type: 'function', function: fixtureMode === 'balanceWrong' ? { name: 'get_balance', arguments: '{"token":"A"}' } : { name: 'approve_token', arguments: '{"token":"A","spender":"amm","amount":"10"}' } }] };
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ id: 'protocol-fixture', choices: [{ index: 0, message, finish_reason: hasTool ? 'stop' : 'tool_calls' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
});
modelFixture.listen(0, '127.0.0.1'); await once(modelFixture, 'listening');
const model = { baseUrl: `http://127.0.0.1:${modelFixture.address().port}/v1`, model: 'protocol-fixture-not-real-llm', maxSteps: 4 };
try {
  const health = await api('/api/health'); token = health.csrfToken; report.build = health.version;
  assert.equal(health.version.displayVersion, 'V0.13');
  if (!(await api('/api/status')).ready) await api('/api/environment/init', {});
  await api('/api/environment/automine', { enabled: true });

  await test('independent_then_continuous_inherits_90_and_80', async () => {
    const first = await run('transfer');
    const second = await run('transfer', { experimentMode: 'continuous' });
    assert.equal(first.result.status, 'success'); assert.equal(second.result.status, 'success', JSON.stringify(second.result));
    assert.equal(second.result.evidence.before.balances.agentA, '90000000');
    assert.equal(second.result.evidence.after.balances.agentA, '80000000');
    assert.equal(second.result.evidence.after.balances.recipientA, '20000000');
    assert.equal(second.config.previous_run_id, first.config.run_id);
    assert.equal(second.config.session_id, first.config.session_id);
    assert.equal(second.result.evidence.transactions.length, 1, 'Previous transactions must not leak into current evidence');
    assert.ok(second.events.some(e => e.type === 'environment.initial'));
    const checked = await api(`/api/runs/${second.config.run_id}/check`, { mode: 'offline' }); assert.equal(checked.status, 'success');
    const oldLive = await api(`/api/runs/${first.config.run_id}/check`, { mode: 'live' }, 400); assert.match(oldLive.error, /RUN_SUPERSEDED/);
    const rejected = await api(`/api/runs/${second.config.run_id}/rerun`, {}, 400); assert.match(rejected.error, /CONTINUOUS_RERUN_UNSUPPORTED/);
    const third = await run('transfer'); assert.equal(third.result.evidence.before.balances.agentA, '100000000'); assert.equal(third.result.evidence.after.balances.agentA, '90000000');
    assert.notEqual(third.config.session_id, second.config.session_id);
    return { first: first.config.run_id, second: second.config.run_id, third: third.config.run_id };
  });
  await test('continuous_balance_and_approval_from_nonzero_state', async () => {
    const balance = await run('balance', { experimentMode: 'continuous' }); assert.equal(balance.result.status, 'success', JSON.stringify(balance.result));
    assert.equal(balance.result.evidence.before.balances.agentA, '90000000');
    const approval = await run('approve', { experimentMode: 'continuous' }); assert.equal(approval.result.status, 'success', JSON.stringify(approval.result));
    const next = await run('transfer', { experimentMode: 'continuous' }); assert.equal(next.result.status, 'success');
    assert.equal(next.result.evidence.before.allowances.ammA, '20000000'); assert.equal(next.result.evidence.after.allowances.ammA, '20000000');
  });
  await test('continuous_swap_deposit_preserves_preexisting_B_and_shares', async () => {
    const swap = await run('swap'); assert.equal(swap.result.status, 'success');
    const one = await run('swap_deposit', { experimentMode: 'continuous' });
    assert.equal(one.result.status, 'success', JSON.stringify(one.result));
    assert.equal(one.result.evidence.after.balances.agentB, swap.result.evidence.after.balances.agentB);
    const two = await run('swap_deposit', { experimentMode: 'continuous' });
    assert.equal(two.result.status, 'success', JSON.stringify(two.result));
    assert.ok(BigInt(two.result.evidence.after.shares) > BigInt(one.result.evidence.after.shares));
    assert.equal(two.result.evidence.after.balances.agentB, one.result.evidence.after.balances.agentB);
  });
  await test('continuous_pending_guard_then_confirmation', async () => {
    await api('/api/environment/automine', { enabled: false });
    try {
      const pending = await run('transfer'); assert.equal(pending.result.status, 'pending');
      const rejected = await api('/api/runs', { taskId: 'transfer', mode: 'scripted', experimentMode: 'continuous' }, 400); assert.match(rejected.error, /CONTINUOUS_PENDING_TRANSACTIONS/);
      await api('/api/environment/mine', { blocks: 1 });
      assert.equal((await api(`/api/runs/${pending.config.run_id}/check`, { mode: 'live' })).status, 'success');
    } finally { await api('/api/environment/automine', { enabled: true }); }
    const next = await run('transfer', { experimentMode: 'continuous' }); assert.equal(next.result.status, 'success'); assert.equal(next.result.evidence.after.balances.agentA, '80000000');
  });
  await test('snapshot_restore_resets_lineage_and_supports_explicit_continuation', async () => {
    await api('/api/environment/reset', {}); const snapshot = await api('/api/environment/snapshot', {});
    const first = await run('transfer', { experimentMode: 'continuous' }); assert.equal(first.result.status, 'success');
    await api('/api/environment/restore', { id: snapshot.id });
    const replay = await run('transfer', { experimentMode: 'continuous' }); assert.equal(replay.result.status, 'success');
    assert.equal(replay.config.previous_run_id, null); assert.notEqual(replay.config.session_id, first.config.session_id);
    assert.equal(replay.result.evidence.before.blockHash, first.result.evidence.before.blockHash);
  });
  await test('mined_approval_success_but_task_failure_explained', async () => {
    fixtureMode = 'approval10';
    const value = await run('approve', { mode: 'llm', model, dataOrigin: 'protocol_fixture', amountValidation: 'schema_only' });
    assert.equal(value.result.status, 'failure'); assert.equal(value.result.evidence.transactions[0].status, 'success');
    const item = value.result.diagnostics.items.find(x => x.assertionId === 'allowance-exact');
    assert.ok(item?.title && item?.detail && item?.suggestion, JSON.stringify(value.result.diagnostics));
    assert.equal(value.result.evidence.after.allowances.ammA, '10000000');
    const bundle = await api(`/api/runs/${value.config.run_id}/export`); assert.equal(bundle.verification.valid, true);
    return { runId: value.config.run_id, diagnostics: value.result.diagnostics };
  });
  await test('balance_answer_failure_is_not_transaction_failure', async () => {
    fixtureMode = 'balanceWrong';
    const value = await run('balance', { mode: 'llm', model, dataOrigin: 'protocol_fixture', amountValidation: 'schema_only' });
    assert.equal(value.result.status, 'failure'); assert.equal(value.result.evidence.transactions.length, 0);
    assert.ok(value.result.diagnostics.items.some(i => i.assertionId === 'answer-base-units'));
    assert.ok(!value.result.diagnostics.items.some(i => i.layer === 'transaction' && i.severity === 'error'));
  });
  await test('model_http_error_is_localized_and_preserved_on_recheck', async () => {
    fixtureMode = 'http401';
    const value = await run('transfer', { mode: 'llm', model, dataOrigin: 'protocol_fixture', amountValidation: 'schema_only' });
    assert.notEqual(value.result.status, 'success');
    assert.ok(value.result.diagnostics.items.some(i => i.layer === 'model'));
    const check = await api(`/api/runs/${value.config.run_id}/check`, { mode: 'offline' });
    assert.ok(check.diagnostics.items.some(i => i.layer === 'model'));
  });
  await test('reverted_transaction_and_bad_mode', async () => {
    const value = await run('transfer', { faultMode: 'transfer_revert' });
    assert.equal(value.result.status, 'failure'); assert.ok(value.result.diagnostics.items.some(i => i.layer === 'transaction' && i.severity === 'error'));
    const invalid = await api('/api/runs', { taskId: 'transfer', mode: 'scripted', experimentMode: 'typo' }, 400); assert.match(invalid.error, /INVALID_EXPERIMENT_MODE/);
  });
} catch (error) { report.tests.push({ name: 'setup', passed: false, error: error.message }); }
finally {
  modelFixture.close();
  report.finishedAt = new Date().toISOString(); report.passed = report.tests.filter(t => t.passed).length; report.failed = report.tests.filter(t => !t.passed).length;
  await mkdir(path.join(root, 'docs'), { recursive: true }); await writeFile(path.join(root, 'docs/feedback-e2e-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`V0.13 feedback E2E: ${report.passed} passed, ${report.failed} failed`); process.exitCode = report.failed ? 1 : 0;
}
