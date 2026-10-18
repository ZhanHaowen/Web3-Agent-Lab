/** Feedback regressions: synthetic model protocol + real local Anvil, never an LLM benchmark.
 * Run only on a dedicated instance: LAB_PORT=4437 node scripts/v013-e2e.mjs.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const base = `http://127.0.0.1:${process.env.LAB_PORT || 4437}`;
const health = await (await fetch(base + '/api/health')).json();
const results = [], runs = {};
let requests = [], responder = () => ({ role: 'assistant', content: 'protocol fixture complete' });
const fixture = createServer(async (req, res) => {
  let body = ''; for await (const chunk of req) body += chunk;
  const request = JSON.parse(body); requests.push(request);
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ model: 'fixture-reported-revision-20261019', choices: [{ message: responder(request) }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }));
});
await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
const model = { baseUrl: `http://127.0.0.1:${fixture.address().port}/v1`, model: 'fixture-requested-alias', maxSteps: 16, temperature: 0 };
const sha = text => createHash('sha256').update(text).digest('hex');
const call = (id, name, args) => ({ role: 'assistant', content: null, tool_calls: [{ id, type: 'function', function: { name, arguments: JSON.stringify(args) } }] });
const end = content => ({ role: 'assistant', content });
async function api(route, body, expected = 200) {
  const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', 'x-lab-token': health.csrfToken }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60_000) });
  const value = await response.json(); assert.equal(response.status, expected, JSON.stringify(value)); return value;
}
async function settled(id) {
  for (let n = 0; n < 900; n++) {
    const status = await api('/api/status');
    if (!status.busy && status.active?.runId === id) return api('/api/runs/' + id);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('RUN_TIMEOUT:' + id);
}
async function run(taskId, options = {}) { const { runId } = await api('/api/runs', { taskId, mode: 'scripted', dataOrigin: 'acceptance_test_scripted', ...options }, 202); return settled(runId); }
function successful(run) { assert.equal(run.result.status, 'success', JSON.stringify({ error: run.result.run_error, assertions: run.result.assertions?.filter(row => !row.passed) })); }
async function test(issue, name, fn) {
  try { const evidence = await fn(); results.push({ issue, name, passed: true, ...evidence }); console.log('PASS ' + name); }
  catch (error) { results.push({ issue, name, passed: false, error: error.message }); throw error; }
}
const namedPlan = plan => request => {
  const index = request.messages.filter(message => message.role === 'tool').length;
  const action = plan[index]; return action ? call('v013-call-' + index, action[0], action[1]) : end('Protocol fixture finished; independent checker decides.');
};
try {
  assert.equal(health.version.displayVersion, 'V0.13');
  if (!(await api('/api/status')).ready) await api('/api/environment/init', {});
  await api('/api/environment/automine', { enabled: true });
  await api('/api/environment/reset', {});
  await test('data-integrity', 'endpoint_query_secrets_are_rejected_before_recording', async () => {
    const count = (await api('/api/runs')).length;
    for (const suffix of ['?api_key=fixture-query-sentinel', '#fixture-fragment-sentinel']) await api('/api/runs', { taskId: 'balance', mode: 'llm', model: { ...model, baseUrl: model.baseUrl + suffix } }, 400);
    assert.equal((await api('/api/runs')).length, count);
  });
  await test('F5', 'custom_text_resolves_exact_30_and_27', async () => {
    const resolved = await api('/api/tasks/resolve', { taskId: 'swap', taskInput: '使用实验amm将30 TokenA兑换为TokenB，最少接受27 TokenB，收款人为agent。amountIn="30",minAmountOut="27"。' });
    assert.deepEqual(resolved.taskParameters, { amountIn: '30', minAmountOut: '27' });
    assert.equal(resolved.parameterSource, 'input'); return { parameters: resolved.taskParameters };
  });
  await test('F5', 'conflicting_or_ambiguous_goals_never_fall_back', async () => {
    await api('/api/tasks/resolve', { taskId: 'transfer', taskInput: '转账30 TokenA', taskParameters: { amount: '10' } }, 400);
    await api('/api/tasks/resolve', { taskId: 'transfer', taskInput: '转账30 TokenA或者40 TokenA' }, 400);
    await api('/api/tasks/resolve', { taskId: 'swap', taskInput: '自行选择合适的兑换数量' }, 400);
    await api('/api/runs', { taskId: 'transfer', mode: 'scripted', taskParameters: { amount: '0.0000001' } }, 400);
  });
  await test('F5', 'scripted_custom_transfer_30_uses_same_checker_goal', async () => {
    const row = runs.transfer = await run('transfer', { taskInput: '从agent向recipient转账30 TokenA，确认执行结果。' }); successful(row);
    assert.equal(row.config.taskParameters.amount, '30'); assert.equal(row.result.evidence.after.balances.recipientA, '30000000');
    assert.deepEqual(row.result.evidence.options.taskParameters, row.config.taskParameters); return { runId: row.config.run_id };
  });
  await test('F5', 'six_decimal_approval_remains_exact', async () => {
    const row = await run('approve', { taskParameters: { amount: '23.125456' } }); successful(row);
    assert.equal(row.result.evidence.after.allowances.ammA, '23125456'); return { runId: row.config.run_id };
  });
  await test('F5', 'scripted_custom_swap_30_minimum_27', async () => {
    const row = await run('swap', { taskParameters: { amountIn: '30', minAmountOut: '27' } }); successful(row);
    assert.equal(row.result.evidence.after.balances.agentA, '70000000'); return { runId: row.config.run_id };
  });
  await test('F5', 'custom_swap_and_deposit_preserves_target_and_output', async () => {
    const row = await run('swap_deposit', { taskParameters: { amountIn: '30', minAmountOut: '27' } }); successful(row);
    assert.equal(row.result.evidence.after.balances.agentB, '0'); assert.ok(BigInt(row.result.evidence.after.shares) >= 27_000_000n); return { runId: row.config.run_id };
  });
  await test('F5', 'llm_guard_rejects_base_units_then_accepts_custom_30', async () => {
    requests = []; responder = namedPlan([['approve_token', { token: 'A', spender: 'amm', amount: '30000000' }], ['approve_token', { token: 'A', spender: 'amm', amount: '30' }], ['swap', { amountIn: '30', minAmountOut: '27' }]]);
    const row = runs.llm = await run('swap', { mode: 'llm', model, dataOrigin: 'protocol_fixture', taskParameters: { amountIn: '30', minAmountOut: '27' } }); successful(row);
    assert.equal(row.execution_trace.tool_calls[0].status, 'rejected'); assert.equal(row.result.evidence.transactions.length, 2);
    assert.equal(row.execution_trace.tool_calls[0].input.amount, '30000000');
    assert.ok(requests.some(request => request.messages.some(message => message.role === 'tool' && message.content.includes('TOOL_AMOUNT_MISMATCH') && message.content.includes('30'))));
    return { runId: row.config.run_id, rejectedProposalPreserved: true };
  });
  await test('F2-F3', 'archive_exposes_distinct_statuses_models_and_exact_input', async () => {
    const rows = await api('/api/runs'); const row = rows.find(item => item.runId === runs.llm.config.run_id);
    assert.equal(row.taskStatus, 'success'); assert.equal(row.chainExecutionStatus, 'success');
    assert.equal(row.modelSummary.requested, model.model); assert.deepEqual(row.modelSummary.reported, ['fixture-reported-revision-20261019']);
    assert.equal(row.taskParameters.amountIn, '30'); assert.ok(row.task.input.includes('30')); return { runId: row.runId };
  });
  await test('F2', 'chain_success_and_task_failure_are_separate', async () => {
    const row = await run('transfer', { faultMode: 'wrong_recipient' }); assert.equal(row.result.status, 'failure');
    const summary = (await api('/api/runs')).find(item => item.runId === row.config.run_id);
    assert.equal(summary.taskStatus, 'failure'); assert.equal(summary.chainExecutionStatus, 'success'); return { runId: row.config.run_id };
  });
  await test('F2-F3', 'query_only_and_unreported_model_are_explicit', async () => {
    const row = await run('balance'); successful(row);
    const summary = (await api('/api/runs')).find(item => item.runId === row.config.run_id);
    assert.equal(summary.chainExecutionStatus, 'query_only'); assert.deepEqual(summary.modelSummary.reported, []); return { runId: row.config.run_id };
  });
  await api('/api/environment/automine', { enabled: false });
  await test('F4', 'one_block_advances_exactly_100_seconds', async () => {
    const before = (await api('/api/status')).chainState;
    const response = await api('/api/environment/mine', { blocks: 1, seconds: 100 });
    assert.equal(BigInt(response.chainState.timestamp) - BigInt(before.timestamp), 100n);
    assert.equal(response.mining.actualDeltaSeconds, 100); assert.equal(response.mining.actualBlocks, 1); return { mining: response.mining };
  });
  await test('F4', 'three_blocks_advance_three_intervals', async () => {
    const response = await api('/api/environment/mine', { blocks: 3, seconds: 7 }); assert.equal(response.mining.actualDeltaSeconds, 21); assert.equal(response.mining.actualBlocks, 3);
  });
  await test('F4', 'invalid_mining_values_are_rejected_without_mining', async () => {
    const before = (await api('/api/status')).chainState;
    for (const body of [{ blocks: 0, seconds: 100 }, { blocks: 1, seconds: 0 }, { blocks: 1.5, seconds: 1 }, { blocks: 1, seconds: '100' }]) await api('/api/environment/mine', body, 400);
    assert.equal((await api('/api/status')).chainState.blockNumber, before.blockNumber);
  });
  responder = request => {
    const count = request.messages.filter(message => message.role === 'tool').length;
    if (!count) return call('manual-transfer', 'transfer_token', { token: 'A', amount: '30', recipient: 'recipient' });
    if (request.messages.filter(message => message.role === 'user').length < 2) return end('Transaction pending; wait for a later chain observation.');
    if (count === 1) return call('manual-observe', 'get_state', {});
    return end('Observed confirmed transfer after mining; no duplicate transfer is needed.');
  };
  requests = [];
  let parent, parentExport, child;
  await test('F6', 'manual_llm_run_preserves_pending_observation', async () => {
    parent = await run('transfer', { mode: 'llm', model, dataOrigin: 'protocol_fixture', taskParameters: { amount: '30' } });
    assert.equal(parent.result.status, 'pending'); parentExport = await api(`/api/runs/${parent.config.run_id}/export`);
    assert.equal(parent.continuation.allowed, true); return { runId: parent.config.run_id };
  });
  await test('F6', 'live_reconciliation_never_calls_model', async () => {
    const count = requests.length; await api(`/api/runs/${parent.config.run_id}/check`, { mode: 'live' }); assert.equal(requests.length, count);
  });
  await test('F6', 'mine_and_continue_restores_history_and_new_state', async () => {
    const count = requests.length;
    const created = await api(`/api/runs/${parent.config.run_id}/continue-agent`, { blocks: 1, seconds: 17 }, 202);
    child = runs.continuation = await settled(created.runId); successful(child);
    assert.notEqual(created.runId, parent.config.run_id); assert.equal(child.config.continuation_of, parent.config.run_id);
    assert.equal(child.result.evidence.before.balances.agentA, '100000000'); assert.equal(child.result.evidence.after.balances.agentA, '70000000');
    assert.equal(child.result.evidence.transactions.length, 1); assert.equal(child.execution_trace.tool_calls.filter(item => item.name === 'transfer_token').length, 0);
    const first = requests[count]; assert.ok(first.messages.some(message => message.role === 'tool' && message.tool_call_id === 'manual-transfer'));
    assert.ok(first.messages.filter(message => message.role === 'user').length >= 2);
    assert.ok(JSON.stringify(first.messages).includes('70000000')); assert.ok(child.events.some(event => event.type === 'state.continuation'));
    return { parentRunId: parent.config.run_id, runId: child.config.run_id, originalGoalInitialStatePreserved: true };
  });
  await test('F1-F6', 'continuation_graph_references_parent_without_fake_calls', async () => {
    const graph = child.execution_graph;
    assert.ok(graph.edges.some(edge => edge.type === 'continues_agent')); assert.ok(graph.edges.some(edge => edge.type === 'provides_parent_result'));
    assert.ok(graph.nodes.some(node => node.type === 'external_tool_result')); assert.equal(child.execution_trace.task.task_parameters.amount, '30');
    const xml = await (await fetch(base + `/api/runs/${child.config.run_id}/graph?format=graphml`)).text(); assert.ok(xml.includes('continues_agent'));
  });
  await test('F6', 'sealed_parent_is_byte_identical_after_continuation', async () => {
    const after = await api(`/api/runs/${parent.config.run_id}/export`);
    assert.equal(after.files['events.jsonl'], parentExport.files['events.jsonl']); assert.equal(after.files['manifest.json'], parentExport.files['manifest.json']);
    assert.equal(child.events.find(event => event.type === 'continuation.parent').payload.parentManifestSha256, sha(parentExport.files['manifest.json']));
    await api(`/api/runs/${parent.config.run_id}/continue-agent`, { blocks: 1, seconds: 1 }, 400);
  });
  await test('F6', 'continuation_cannot_change_model_or_survive_reset', async () => {
    await api(`/api/runs/${child.config.run_id}/continue-agent`, { model: { model: 'changed-model' } }, 400);
    await api('/api/environment/reset', {});
    await api(`/api/runs/${child.config.run_id}/continue-agent`, { blocks: 1, seconds: 1 }, 400);
  });
  await test('F5-F6', 'custom_offline_check_uses_persisted_parameters', async () => {
    const result = await api(`/api/runs/${child.config.run_id}/check`, {}); assert.equal(result.status, 'success'); assert.equal(result.checkerVersion, '2.2.0');
    assert.equal(result.evidence.options.taskParameters.amount, '30');
  });
  await test('F6', 'scripted_runs_cannot_claim_model_continuation', async () => {
    await api('/api/environment/automine', { enabled: true }); const row = await run('balance');
    await api(`/api/runs/${row.config.run_id}/continue-agent`, { blocks: 1, seconds: 1 }, 400);
  });
} finally {
  await api('/api/environment/automine', { enabled: true }).catch(() => {});
  await api('/api/environment/reset', {}).catch(() => {});
  fixture.closeAllConnections(); await new Promise(resolve => fixture.close(resolve));
  await mkdir('docs', { recursive: true });
  await writeFile('docs/v013-regression.json', JSON.stringify({ suite: 'V0.13 real user feedback API regression', build: health.version, origin: 'synthetic protocol fixture + real Anvil; not a model capability benchmark', realModelTested: false, testedAt: new Date().toISOString(), passed: results.length > 0 && results.every(row => row.passed), tests: results }, null, 2));
}
