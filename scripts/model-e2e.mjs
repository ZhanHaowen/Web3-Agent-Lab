/**
 * Node-only integration test against a running Web3 Agent Lab server.
 * The HTTP "model" is a deterministic protocol fixture, NEVER a real LLM.
 * Real Anvil + AgentKit actions + LangGraph + durable export/checking are used.
 * This script creates fresh runs and resets the experiment baseline per run.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const appUrl = process.env.LAB_URL || 'http://127.0.0.1:4317';
const sentinel = 'model-e2e-sentinel-secret-do-not-export-9e5b8b08';
const reportPath = resolve(process.env.LAB_MODEL_REPORT || 'data/model-e2e-report.json');
let csrfToken;
let active;
const results = [];

async function api(path, body) {
  const response = await fetch(`${appUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-lab-token': csrfToken } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(120_000),
  });
  const data = await response.json();
  assert.ok(response.ok, `${path}: HTTP ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

function planFor(taskId, messages) {
  let observedBalance;
  for (const message of messages) {
    if (message.role !== 'tool') continue;
    const observation = JSON.parse(message.content);
    if (observation && typeof observation.formatted === 'string') observedBalance = observation;
  }
  const plans = {
    balance: [['get_balance', { token: 'A', account: 'agent' }]],
    transfer: [['transfer_token', { token: 'A', recipient: 'recipient', amount: '10' }]],
    approve: [['approve_token', { token: 'A', spender: 'amm', amount: '20' }]],
    swap: [
      ['approve_token', { token: 'A', spender: 'amm', amount: '10' }],
      ['swap', { amountIn: '10', minAmountOut: '9' }],
    ],
    swap_deposit: [
      ['approve_token', { token: 'A', spender: 'amm', amount: '10' }],
      ['swap', { amountIn: '10', minAmountOut: '9' }],
      ['get_balance', { token: 'B', account: 'agent' }],
      ['approve_token', { token: 'B', spender: 'vault', amount: observedBalance?.formatted }],
      ['deposit', { amount: observedBalance?.formatted }],
    ],
  };
  return { plan: plans[taskId], observedBalance };
}

const fixture = createServer(async (request, response) => {
  try {
    assert.ok(active, 'fixture received a request outside a test case');
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/v1/chat/completions');
    assert.equal(request.headers.authorization, `Bearer ${sentinel}`);
    let text = '';
    for await (const chunk of request) text += chunk;
    const sent = JSON.parse(text);
    active.requests.push(text);
    assert.equal(sent.model, 'protocol-fixture-not-an-llm');
    assert.equal(sent.stream, false);
    assert.equal(sent.messages[0].role, 'system');
    assert.equal(sent.messages[1].role, 'user');
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('x-request-id', `protocol-fixture-${active.taskId}-${active.requests.length}`);

    if (active.failHttp) {
      response.statusCode = 429;
      const body = JSON.stringify({ error: { message: 'Synthetic rate-limit failure', type: 'protocol_fixture' }, fixtureSecretEcho: sentinel });
      active.responses.push(body); response.end(body); return;
    }

    const stepIndex = active.requests.length - 1;
    const toolMessages = sent.messages.filter(message => message.role === 'tool');
    assert.equal(toolMessages.length, stepIndex, 'each round must include every prior tool result');
    const { plan, observedBalance } = planFor(active.taskId, sent.messages);
    const step = plan[stepIndex];
    let message;
    if (step) {
      const [name, args] = step;
      assert.ok(sent.tools.some(tool => tool.function.name === name), `Tool ${name} not exposed`);
      if (active.taskId === 'swap_deposit' && stepIndex >= 3) {
        assert.equal(typeof args.amount, 'string', 'deposit must use the actual preceding balance output');
        assert.notEqual(args.amount, '0');
      }
      message = { role: 'assistant', content: null, tool_calls: [{ id: `call-${active.taskId}-${stepIndex}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }] };
    } else {
      const final = active.taskId === 'balance' ? JSON.stringify({
        token: observedBalance.token, address: observedBalance.address,
        balanceBaseUnits: observedBalance.balance, blockHash: observedBalance.blockHash,
      }) : 'Deterministic protocol fixture completed its plan; independent chain checker decides success.';
      message = { role: 'assistant', content: final };
    }
    const body = JSON.stringify({
      id: `response-${active.taskId}-${stepIndex}`, object: 'chat.completion',
      model: 'protocol-fixture-not-an-llm',
      choices: [{ index: 0, message, finish_reason: step ? 'tool_calls' : 'stop' }],
      usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
      fixtureSecretEcho: sentinel,
    });
    active.responses.push(body);
    response.end(body);
  } catch (error) {
    if (active) active.fixtureErrors.push(error.message);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: { message: `Fixture assertion failed: ${error.message}` } }));
  }
});

async function waitRun(runId) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const status = await api('/api/status');
    if (!status.busy && status.active?.runId === runId) return api(`/api/runs/${runId}`);
    await delay(100);
  }
  throw new Error(`Run ${runId} did not finish within 120 seconds`);
}

try {
  await new Promise(resolveListen => fixture.listen(0, '127.0.0.1', resolveListen));
  const fixtureAddress = fixture.address();
  assert.ok(fixtureAddress && typeof fixtureAddress === 'object');
  const health = await api('/api/health');
  csrfToken = health.csrfToken;
  const status = await api('/api/status');
  assert.equal(status.busy, false, 'finish the active GUI experiment before this integration test');
  if (!status.ready) await api('/api/environment/init', {});
  await api('/api/environment/automine', { enabled: true });

  for (const testCase of [
    { taskId: 'balance' }, { taskId: 'transfer' }, { taskId: 'approve' },
    { taskId: 'swap' }, { taskId: 'swap_deposit' }, { taskId: 'balance', failHttp: true },
  ]) {
    active = { ...testCase, requests: [], responses: [], fixtureErrors: [] };
    const { runId } = await api('/api/runs', {
      taskId: testCase.taskId, mode: 'llm', dataOrigin: 'protocol_fixture',
      model: { baseUrl: `http://127.0.0.1:${fixtureAddress.port}/v1`, model: 'protocol-fixture-not-an-llm', apiKey: sentinel, temperature: 0, maxSteps: 12, requestTimeoutMs: 10_000 },
    });
    const run = await waitRun(runId);
    assert.deepEqual(active.fixtureErrors, []);
    assert.equal(run.config.data_origin, 'protocol_fixture');
    assert.equal(run.events.find(event => event.type === 'run.started').payload.data_origin, 'protocol_fixture');
    assert.equal(run.manifest.recording_status, 'complete');
    assert.equal(run.result.agent.modelCalls, active.requests.length);
    assert.deepEqual(run.events.filter(event => event.type === 'model.request').map(event => event.payload.body), active.requests);
    assert.deepEqual(run.events.filter(event => event.type === 'model.response').map(event => event.payload.body), active.responses.map(text => text.split(sentinel).join('[REDACTED]')));
    if (testCase.failHttp) {
      assert.equal(active.requests.length, 1, 'HTTP errors must not trigger hidden retries');
      assert.equal(run.result.agent.error, 'MODEL_HTTP_429');
      assert.equal(run.result.agent.toolCalls, 0);
      assert.notEqual(run.result.status, 'success');
    } else {
      assert.equal(run.result.status, 'success', JSON.stringify(run.result));
      assert.equal(run.result.agent.error, undefined);
      assert.ok(run.result.agent.toolCalls > 0);
      if (testCase.taskId === 'swap_deposit') {
        assert.equal(run.result.agent.modelCalls, 6);
        assert.equal(run.result.agent.toolCalls, 5);
        assert.equal(run.events.filter(event => event.type === 'tx.broadcast').length, 4);
      }
    }
    const offline = await api(`/api/runs/${runId}/check`, {});
    assert.equal(offline.status, run.result.status, 'offline checker must reproduce recorded live verdict');
    const verified = await api(`/api/runs/${runId}/verify`);
    assert.equal(verified.valid, true);
    const bundle = await api(`/api/runs/${runId}/export`);
    assert.equal(JSON.stringify(bundle).includes(sentinel), false, 'API key or echoed secret leaked to export');
    assert.ok(Object.keys(bundle.files).some(name => name.startsWith('blobs/')));
    results.push({
      taskId: testCase.taskId, case: testCase.failHttp ? 'http-429-no-retry' : 'success',
      runId, status: run.result.status, modelCalls: run.result.agent.modelCalls,
      toolCalls: run.result.agent.toolCalls, recordingValid: verified.valid,
      dataOrigin: 'protocol_fixture', secretAbsentFromExport: true,
    });
    console.log(`PASS ${testCase.taskId}${testCase.failHttp ? ' / HTTP 429' : ''}: ${runId}`);
  }
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify({
    testedAt: new Date().toISOString(), appUrl,
    description: 'Synthetic HTTP model protocol with real local Anvil execution. Not an LLM capability evaluation.',
    realModelTested: false, results,
  }, null, 2) + '\n');
  console.log(`Integration report: ${reportPath}`);
} finally {
  fixture.closeAllConnections();
  await new Promise(resolveClose => fixture.close(() => resolveClose()));
}
