import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { encodeFunctionData, parseAbi } from 'viem';
import { buildExecutionTrace, renderExecutionTraceMarkdown } from '../src/trace.js';
import { ChainLab } from '../src/chain.js';
import { runAgent } from '../src/agent.js';
import { Recorder, readRun, verifyRun } from '../src/store.js';
import { TASKS, toolDefinitions } from '../src/tasks.js';

const A = `0x${'1'.repeat(40)}` as const, B = `0x${'2'.repeat(40)}` as const, AMM = `0x${'3'.repeat(40)}` as const, AGENT = `0x${'4'.repeat(40)}` as const, UNKNOWN = `0x${'5'.repeat(40)}` as const;
const HASH = `0x${'a'.repeat(64)}`;
const config = { run_id: 'run-example', mode: 'llm', experimentMode: 'continuous', data_origin: 'protocol_fixture', task: { id: 'swap', input: 'swap only this amount', allowedTools: ['swap'] }, model: { apiKey: 'CONFIG_SECRET_NEVER_COPY' }, environment: { contracts: { tokenA: A, tokenB: B, amm: AMM } } };
function fixture() {
  const events: any[] = [];
  const emit = (type: string, payload: any, links: any = {}) => {
    const seq = events.length + 1;
    events.push({ run_id: config.run_id, seq, event_id: `event-${seq}`, type, timestamp: `2026-10-11T10:00:${String(seq).padStart(2, '0')}Z`, monotonic_ms: seq * 10, links, payload_ref: { sha256: 'b'.repeat(64), path: `blobs/${'b'.repeat(64)}.json`, bytes: 100, media_type: 'application/json' }, payload });
  };
  const seal = () => ({ run_id: config.run_id, recording_status: 'complete', sealed_at: '2026-10-11T10:01:00Z', event_count: events.length, files: { 'events.jsonl': { sha256: 'c'.repeat(64), bytes: 900 } } });
  return { events, emit, seal };
}
function fullFixture() {
  const f = fixture();
  const data = encodeFunctionData({ abi: parseAbi(['function swap(uint256,uint256,address)']), functionName: 'swap', args: [10000000n, 9000000n, AGENT] });
  const request = { chainId: 31337, from: AGENT, to: AMM, data, value: '0', nonce: 0 };
  const links = { modelCallId: 'model-1', toolCallId: 'tool-swap', contractCallId: 'contract-swap' };
  f.emit('agent.start', { mode: 'llm', taskId: 'swap', input: config.task.input, experimentMode: 'continuous' });
  f.emit('model.request', { endpoint: 'http://127.0.0.1/model', request: { model: 'protocol-fixture-not-an-llm', messages: [{ role: 'user', content: config.task.input }], temperature: 0 }, body: 'FULL_RAW_REQUEST_DO_NOT_COPY' }, { modelCallId: 'model-1' });
  f.emit('model.response', { status: 200, requestId: 'request-1', response: { choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'tool-swap', type: 'function', function: { name: 'swap', arguments: '{"amountIn":"10","minAmountOut":"9"}' } }, { id: 'proposed-only', type: 'function', function: { name: 'deposit', arguments: '{"amount":"9"}' } }] } }], usage: { total_tokens: 123 } }, body: 'FULL_RAW_RESPONSE_DO_NOT_COPY' }, { modelCallId: 'model-1' });
  f.emit('tool.call', { name: 'swap', arguments: '{"amountIn":"10","minAmountOut":"9"}' }, links);
  f.emit('tool.started', { name: 'swap', args: { amountIn: '10', minAmountOut: '9' } }, links);
  f.emit('contract.call', { callId: 'contract-swap', kind: 'transaction', tool: 'swap', chainId: 31337, contract: { address: AMM, label: 'amm' }, function: { name: 'swap', signature: 'swap(uint256,uint256,address)', selector: data.slice(0, 10), args: ['10000000', '9000000', AGENT] }, request }, links);
  f.emit('tx.prepared', { ...request, contractCallId: 'contract-swap' }, links);
  f.emit('tx.broadcast', { ...request, contractCallId: 'contract-swap', hash: HASH, status: 'pending' }, links);
  f.emit('tx.receipt', { ...request, contractCallId: 'contract-swap', hash: HASH, status: 'success', receipt: { status: 'success', gasUsed: '65000', blockNumber: '20' } }, links);
  f.emit('tx.trace', { hash: HASH, contractCallId: 'contract-swap', trace: { type: 'CALL', from: AGENT, to: AMM, input: data, output: '0x', value: '0x0', gas: '0xf4240', gasUsed: '0xfde8', calls: [{ type: 'STATICCALL', from: AMM, to: A, input: encodeFunctionData({ abi: parseAbi(['function balanceOf(address)']), functionName: 'balanceOf', args: [AMM] }), output: `0x${'0'.repeat(64)}`, calls: [{ type: 'DELEGATECALL', from: A, to: UNKNOWN, input: '0xa9059cbb', error: 'execution reverted', revertReason: 'recorded reason', output: '0xdeadbeef' }] }] } }, links);
  f.emit('contract.result', { callId: 'contract-swap', kind: 'transaction', status: 'success', txHash: HASH, duration_ms: 10 }, links);
  f.emit('tool.result', { name: 'swap', raw: { txHash: HASH, amountOut: '9871580' }, visible: { reported: 'changed for experiment' }, overridden: true }, links);
  f.emit('model.request', { request: { model: 'protocol-fixture-not-an-llm', messages: [{ role: 'user', content: config.task.input }, { role: 'tool', tool_call_id: 'tool-swap', content: '{"reported":"changed for experiment"}' }] } }, { modelCallId: 'model-2' });
  f.emit('model.response', { status: 200, response: { choices: [{ message: { role: 'assistant', content: 'completed' } }] } }, { modelCallId: 'model-2' });
  return f;
}

test('explicit amount rejection is complete non-execution evidence, not a missing contract call',()=>{
  const f=fixture(),links={modelCallId:'model-1',toolCallId:'rejected-1'};
  f.emit('tool.call',{name:'approve_token',arguments:'{"token":"A","spender":"amm","amount":"20000000"}'},links);
  f.emit('tool.validation',{name:'approve_token',status:'rejected',code:'TOOL_AMOUNT_MISMATCH',expected:'20',received:'20000000',submitted:false,recoverable:true},links);
  f.emit('tool.result',{name:'approve_token',raw:{error:'TOOL_AMOUNT_MISMATCH'},visible:{error:'TOOL_AMOUNT_MISMATCH'},error:'TOOL_AMOUNT_MISMATCH'},links);
  const trace=buildExecutionTrace({...config,amountValidation:'fixed_task'},f.events,f.seal());
  const tool=trace.tool_calls[0];assert.equal(tool.status,'rejected');assert.equal(tool.execution_started,false);
  assert.equal(tool.submitted,false);assert.deepEqual(tool.missing,[]);assert.equal(trace.transactions.length,0);assert.equal(trace.contract_calls.length,0);
  assert.equal(tool.source_events.length,3);assert.equal(trace.task.amount_validation,'fixed_task');
  assert.equal(tool.input.amount,'20000000');assert.equal(tool.validation.expected,'20');
});

test('full trace links explicit model/tool/contract/transaction/EVM evidence and retains raw versus visible output', () => {
  const f = fullFixture();
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.schema_version, '1.0');
  assert.equal(trace.task.data_origin, 'protocol_fixture');
  assert.equal(trace.summary.model_call_count, 2);
  assert.equal(trace.summary.model_proposal_count, 2);
  assert.equal(trace.summary.tool_call_count, 1);
  assert.equal(trace.tool_calls.length, 1, 'an unexecuted model proposal must not become a tool execution');
  assert.equal(trace.contract_calls.length, 1);
  assert.equal(trace.transactions.length, 1, 'prepared and hash-bearing records share their explicit contract ID');
  assert.equal(trace.transactions[0].status, 'success');
  assert.equal(trace.contract_calls[0].txHash, HASH);
  assert.deepEqual(trace.tool_calls[0].raw_result, { txHash: HASH, amountOut: '9871580' });
  assert.deepEqual(trace.tool_calls[0].visible_result, { reported: 'changed for experiment' });
  assert.equal(trace.tool_calls[0].overridden, true);
  assert.equal(trace.call_frames.length, 3);
  assert.equal(trace.call_frames[0].function.signature, 'swap(uint256,uint256,address)');
  assert.equal(trace.call_frames[1].function.signature, 'balanceOf(address)');
  assert.equal(trace.call_frames[2].function.selector, '0xa9059cbb');
  assert.equal(trace.call_frames[2].function.signature, null, 'known selector at an unknown address must not be treated as verified ABI');
  assert.equal(trace.call_frames[2].parentId, trace.call_frames[1].id);
  assert.equal(trace.call_frames[2].revertReason, 'recorded reason');
  assert.ok(trace.edges.some(edge => edge.relation === 'provides_result' && edge.from === trace.tool_calls[0].id && edge.to === trace.model_calls[1].id));
  assert.ok(trace.edges.some(edge => edge.relation === 'supplies_task_input' && edge.from === trace.task.node_id && edge.to === trace.model_calls[0].id));
  const ids = new Set([trace.task.node_id, ...[trace.model_calls, trace.tool_calls, trace.contract_calls, trace.transactions, trace.call_frames].flat().map(entity => entity.id)]);
  for (const edge of trace.edges) { assert.ok(ids.has(edge.from)); assert.ok(ids.has(edge.to)); assert.ok(edge.source_events.length); }
  for (const entity of [trace.model_calls, trace.tool_calls, trace.contract_calls, trace.transactions, trace.call_frames].flat()) assert.ok(entity.source_events.every(ref => ref.event_id && ref.seq && ref.payload_ref));
  const serialized = JSON.stringify(trace);
  assert.equal(serialized.includes('FULL_RAW_RESPONSE_DO_NOT_COPY'), false);
  assert.equal(serialized.includes('FULL_RAW_REQUEST_DO_NOT_COPY'), false);
  assert.equal(serialized.includes('CONFIG_SECRET_NEVER_COPY'), false);
});

test('read calls are preserved explicitly without inventing a transaction, and model-free scripted steps remain model-free', () => {
  const f = fixture();
  f.emit('agent.start', { mode: 'scripted', taskId: 'balance', input: 'query only' });
  f.emit('scripted.step', { call: { id: 'read-tool', function: { name: 'get_balance', arguments: '{"token":"A"}' } } });
  f.emit('tool.call', { name: 'get_balance', arguments: '{"token":"A"}' }, { toolCallId: 'read-tool' });
  f.emit('tool.started', { name: 'get_balance', args: { token: 'A' } }, { toolCallId: 'read-tool' });
  f.emit('contract.call', { callId: 'balance-read', kind: 'read', tool: 'get_balance', chainId: 31337, contract: { address: A, label: 'tokenA' }, function: { name: 'balanceOf', signature: 'balanceOf(address)', args: [AGENT] }, request: { to: A, blockNumber: '19', blockHash: HASH } }, { toolCallId: 'read-tool', contractCallId: 'balance-read' });
  f.emit('contract.result', { callId: 'balance-read', kind: 'read', status: 'success', result: '9007199254740993000001', blockNumber: '19' }, { toolCallId: 'read-tool', contractCallId: 'balance-read' });
  f.emit('tool.result', { name: 'get_balance', raw: { balance: '9007199254740993000001' }, visible: { balance: '9007199254740993000001' } }, { toolCallId: 'read-tool' });
  const trace = buildExecutionTrace({ ...config, mode: 'scripted', data_origin: 'scripted' }, f.events, f.seal());
  assert.equal(trace.model_calls.length, 0);
  assert.equal(trace.summary.model_used, false);
  assert.equal(trace.transactions.length, 0);
  assert.equal(trace.contract_calls[0].result, '9007199254740993000001');
  assert.ok(trace.edges.some(edge => edge.relation === 'scripted_task_step'));
  assert.ok(trace.edges.some(edge => edge.relation === 'invokes_contract'));
});

test('unlinked legacy events remain separate and legacy reads are not fabricated', () => {
  const f = fixture();
  f.emit('model.request', { request: { model: 'legacy', messages: [] } });
  f.emit('model.response', { status: 200, response: {} });
  f.emit('tool.call', { name: 'get_balance', arguments: '{"token":"A"}' }, { toolCallId: 'old-read' });
  f.emit('tool.started', { name: 'get_balance', args: { token: 'A' } }, { toolCallId: 'old-read' });
  f.emit('tool.result', { name: 'get_balance', raw: { balance: '100' }, visible: { balance: '100' } }, { toolCallId: 'old-read' });
  f.emit('tx.receipt', { hash: HASH, to: UNKNOWN, data: '0xa9059cbb', status: 'success', receipt: { status: 'success' } });
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.model_calls.length, 2);
  assert.equal(trace.edges.some(edge => edge.relation === 'requests_tool'), false);
  assert.equal(trace.contract_calls.length, 1);
  assert.equal(trace.contract_calls[0].kind, 'transaction');
  assert.equal(trace.contract_calls[0].legacy, true);
  assert.equal(trace.contract_calls[0].function.signature, null);
  assert.equal(trace.contract_calls[0].toolCallId, null);
  assert.ok(trace.warnings.some(warning => warning.code === 'MISSING_CONTRACT_READ_EVENTS'));
  assert.ok(trace.warnings.some(warning => warning.code === 'MISSING_MODEL_CALL_ID'));
});

test('legacy prepared/no-hash errors match exact explicit tool request and repeated attempts remain distinct', () => {
  const f = fixture();
  const request = { from: AGENT, to: A, data: '0x1234', nonce: 0, value: '0' };
  for (const toolCallId of ['first-attempt', 'retry-attempt']) {
    f.emit('tx.prepared', request, { toolCallId });
    f.emit('tx.error', { ...request, status: 'unknown', error: 'submission timeout' }, { toolCallId });
  }
  f.emit('check.evidence', { transactions: [{ ...request, status: 'unknown' }, { ...request, status: 'unknown' }] });
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.transactions.length, 2);
  assert.deepEqual(trace.transactions.map(transaction => transaction.toolCallId), ['first-attempt', 'retry-attempt']);
  assert.deepEqual(trace.transactions.map(transaction => transaction.status), ['unknown', 'unknown']);
  assert.ok(trace.transactions.every(transaction => transaction.hash === null && transaction.source_events.length === 3));
});

test('pending, reverted and unsupported debug traces are not rendered as successful task execution', () => {
  const f = fixture();
  f.emit('tx.broadcast', { hash: HASH, status: 'pending' });
  f.emit('tx.trace', { hash: HASH, trace: { structLogs: [], failed: true } });
  const pending = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(pending.transactions[0].status, 'pending');
  assert.equal(pending.call_frames.length, 0);
  assert.ok(pending.warnings.some(warning => warning.code === 'UNSUPPORTED_EVM_TRACE'));
  f.emit('tx.receipt', { hash: HASH, status: 'reverted', receipt: { status: 'reverted', gasUsed: '9007199254740993000001' } });
  const reverted = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(reverted.transactions[0].status, 'reverted');
  assert.equal(reverted.transactions[0].receipt.gasUsed, '9007199254740993000001');
  assert.equal('task_success' in reverted.summary, false);
});

test('identical sealed inputs produce identical output without mutating raw records', () => {
  const f = fullFixture(), manifest = f.seal();
  const before = JSON.stringify({ config, events: f.events, manifest });
  const a = buildExecutionTrace(config, f.events, manifest), b = buildExecutionTrace(config, [...f.events].reverse(), manifest);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(renderExecutionTraceMarkdown(a), renderExecutionTraceMarkdown(b));
  assert.equal(JSON.stringify({ config, events: f.events, manifest }), before);
  assert.equal(a.provenance.sealed_at, manifest.sealed_at);
  assert.ok(buildExecutionTrace(config, []).warnings.some(warning => warning.code === 'UNSEALED_RECORDING'));
});

test('Markdown renders hostile strings as inert text, uses safe fences and excludes secret-valued fields', () => {
  const f = fixture();
  const hostile = '<script>alert(1)</script>\n```\n![x](javascript:alert(1)) | table';
  f.emit('tool.call', { name: hostile, arguments: JSON.stringify({ input: hostile, privateKey: 'DO_NOT_EXPORT_PRIVATE_KEY' }) }, { toolCallId: hostile });
  f.emit('tool.result', { name: hostile, raw: { text: hostile, apiKey: 'DO_NOT_EXPORT_API_KEY' }, visible: hostile }, { toolCallId: hostile });
  const trace = buildExecutionTrace({ ...config, task: { input: hostile } }, f.events, f.seal());
  const markdown = renderExecutionTraceMarkdown(trace);
  assert.equal(markdown.includes('<script>'), false);
  assert.equal(markdown.includes('DO_NOT_EXPORT_API_KEY'), false);
  assert.equal(markdown.includes('DO_NOT_EXPORT_PRIVATE_KEY'), false);
  assert.equal(JSON.stringify(trace.tool_calls[0].input).includes('DO_NOT_EXPORT_PRIVATE_KEY'), false);
  assert.ok(markdown.includes('\\u003cscript\\u003e'));
  assert.ok(markdown.includes('execution-trace.json'));
  assert.ok(markdown.includes('原始事件序号'));
  const malformedId = buildExecutionTrace(config, [{ seq: 1, type: 'tool.call', links: { toolCallId: '\ud800' }, payload: { name: 'read', arguments: '{}' } }]);
  assert.equal(malformedId.tool_calls.length, 1);
});

test('checker-only no-hash attempts get unique stable IDs and unknown evidence clears an older receipt', () => {
  const f = fixture();
  const request = { from: AGENT, to: A, data: '0x1234', value: '0', status: 'unknown' };
  f.emit('tx.receipt', { hash: HASH, status: 'success', receipt: { status: 'success', gasUsed: '21000' } });
  f.emit('check.evidence', { transactions: [{ ...request, nonce: 0 }, { ...request, nonce: 1 }, { hash: HASH, status: 'unknown' }] });
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.transactions.length, 3);
  assert.equal(new Set(trace.transactions.map(transaction => transaction.id)).size, 3);
  assert.equal(trace.transactions[0].status, 'unknown');
  assert.equal(trace.transactions[0].receipt, null);
});

test('model requests cannot gain a result edge from a tool that only ran later', () => {
  const f = fixture();
  f.emit('model.request', { request: { messages: [{ role: 'tool', tool_call_id: 'future-tool', content: 'fake old result' }] } }, { modelCallId: 'model-before' });
  f.emit('tool.call', { name: 'get_state', arguments: '{}' }, { toolCallId: 'future-tool' });
  f.emit('tool.result', { raw: {}, visible: {} }, { toolCallId: 'future-tool' });
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.edges.some(edge => edge.relation === 'provides_result'), false);
  assert.ok(trace.warnings.some(warning => warning.code === 'MISSING_TOOL_RESULT_SOURCE'));
});

test('cancelled pre-submit transactions have preparation edges, not claimed broadcast edges', () => {
  const f = fixture();
  const links = { toolCallId: 'cancelled-tool', contractCallId: 'cancelled-contract' };
  f.emit('tool.call', { name: 'transfer_token', arguments: '{}' }, links);
  f.emit('contract.call', { callId: 'cancelled-contract', kind: 'transaction', contract: { address: A }, request: { from: AGENT, to: A, data: '0x1234' } }, links);
  f.emit('tx.prepared', { contractCallId: 'cancelled-contract', from: AGENT, to: A, data: '0x1234', nonce: 0 }, links);
  f.emit('contract.result', { callId: 'cancelled-contract', kind: 'transaction', status: 'error', error: 'RUN_CANCELLED', stage: 'before_submit', submitted: false }, links);
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.transactions.length, 1);
  assert.equal(trace.transactions[0].status, 'prepared');
  const transactionEdges = trace.edges.filter(edge => edge.to === trace.transactions[0].id);
  assert.equal(transactionEdges.length, 2);
  for (const edge of transactionEdges) {
    assert.equal(edge.relation, 'prepares_transaction');
    assert.deepEqual(edge.source_events.map(event => event.seq), [3]);
  }
  assert.equal(trace.edges.some(edge => edge.relation === 'submits_transaction'), false);
});

test('transaction preparation failure cannot create a submitted transaction entity', () => {
  const f = fixture();
  const links = { toolCallId: 'failed-tool', contractCallId: 'failed-contract' };
  f.emit('tool.call', { name: 'swap', arguments: '{}' }, links);
  f.emit('contract.call', { callId: 'failed-contract', kind: 'transaction', contract: { address: AMM } }, links);
  f.emit('contract.result', { callId: 'failed-contract', kind: 'transaction', status: 'error', error: 'prepare RPC unavailable', stage: 'prepare', submitted: false }, links);
  const trace = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(trace.transactions.length, 0);
  assert.equal(trace.contract_calls[0].status, 'error');
  assert.equal(trace.contract_calls[0].submitted, false);
  assert.equal(trace.edges.some(edge => /transaction|submission/.test(edge.relation)), false);
});

test('submission attempt edges cite the error until actual broadcast or receipt evidence exists', () => {
  const f = fixture();
  const links = { toolCallId: 'unknown-tool', contractCallId: 'unknown-contract' };
  const request = { contractCallId: 'unknown-contract', from: AGENT, to: A, data: '0x1234', nonce: 0 };
  f.emit('tool.call', { name: 'transfer_token', arguments: '{}' }, links);
  f.emit('contract.call', { callId: 'unknown-contract', kind: 'transaction', request }, links);
  f.emit('tx.prepared', request, links);
  f.emit('tx.error', { ...request, status: 'unknown', error: 'submission timeout' }, links);
  const unknown = buildExecutionTrace(config, f.events, f.seal());
  const attempts = unknown.edges.filter(edge => edge.to === unknown.transactions[0].id);
  assert.ok(attempts.every(edge => edge.relation === 'attempts_submission'));
  assert.ok(attempts.every(edge => edge.source_events.every(event => event.seq === 4)));
  f.emit('tx.receipt', { ...request, hash: HASH, receipt: { status: 'success', gasUsed: '21000' } }, links);
  const confirmed = buildExecutionTrace(config, f.events, f.seal());
  assert.equal(confirmed.transactions.length, 1);
  assert.equal(confirmed.transactions[0].status, 'success');
  const submissions = confirmed.edges.filter(edge => edge.to === confirmed.transactions[0].id);
  assert.ok(submissions.every(edge => edge.relation === 'submits_transaction'));
  assert.ok(submissions.every(edge => edge.source_events.every(event => event.seq === 5)));
});

test('sealed real Anvil scripted swap-deposit records form an end-to-end contract and EVM trace', { timeout: 120_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'web3-execution-trace-'));
  const chain = new ChainLab({ rpcUrl: 'http://127.0.0.1:18561', dataDir: directory });
  try {
    await chain.start();
    const before = await chain.state();
    const task = TASKS.find(item => item.id === 'swap_deposit')!;
    const recorder = new Recorder(directory);
    const runConfig = { mode: 'scripted', data_origin: 'scripted', taskId: task.id, task, environment: chain.env() };
    await recorder.start(runConfig);
    const result = await runAgent({ mode: 'scripted', task: { ...task }, model: { model: 'unused-scripted', baseUrl: 'http://127.0.0.1:1', maxSteps: 16 }, toolDefinitions, initialState: before, experimentMode: 'independent', signal: new AbortController().signal,
      emit: async (type, payload, links) => recorder.emit(type, payload, links),
      executeTool: async (name, args, context) => chain.execute(name, args, { emit: async (type, payload, links) => recorder.emit(type, payload, { ...(context ?? {}), signal: undefined, ...(links ?? {}) }) }),
    });
    assert.equal(result.error, undefined);
    const checked = await chain.check(task.id, before, await chain.state(), undefined, result.final);
    assert.equal(checked.status, 'success');
    await recorder.emit('check.evidence', checked.evidence);
    await recorder.seal();
    assert.equal((await verifyRun(directory, recorder.runId)).valid, true);
    const recorded = await readRun(directory, recorder.runId);
    const trace = buildExecutionTrace(recorded.config, recorded.events, recorded.manifest);
    assert.equal(trace.summary.model_call_count, 0);
    assert.equal(trace.transactions.length, 4);
    assert.ok(trace.transactions.every(transaction => transaction.status === 'success' && transaction.contractCallId));
    assert.equal(trace.contract_calls.filter(call => call.kind === 'transaction').length, 4);
    assert.ok(trace.contract_calls.some(call => call.kind === 'read' && call.function?.name === 'balanceOf'));
    assert.ok(trace.call_frames.length > trace.transactions.length, 'the swap/deposit nested EVM calls must be expanded');
    for (const call of trace.contract_calls) {
      assert.equal(call.legacy, false);
      assert.ok(trace.edges.some(edge => edge.to === call.id && edge.relation === 'invokes_contract'));
    }
    for (const transaction of trace.transactions) assert.ok(trace.edges.some(edge => edge.to === transaction.id && edge.from.startsWith('contract:')));
    assert.equal(trace.warnings.length, 0);
    const ids = new Set([trace.task.node_id, ...[trace.model_calls, trace.tool_calls, trace.contract_calls, trace.transactions, trace.call_frames].flat().map(entity => entity.id)]);
    for (const edge of trace.edges) assert.ok(ids.has(edge.from) && ids.has(edge.to));
  } finally {
    await chain.stop();
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await rm(directory, { recursive: true, force: true });
  }
});
