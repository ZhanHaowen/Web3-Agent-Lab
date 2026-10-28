// Dependency-free structural smoke tests. This is not a browser or visual test.
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { createHash, webcrypto } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.value = ''; this.checked = false; this.style = {};
    this.className = ''; this.dataset = {}; this.listeners = {}; this.scrollHeight = 0; this._text = '';
    this.classList = {
      toggle: (name, force) => {
        const values = new Set(this.className.split(' ').filter(Boolean));
        (force === undefined ? !values.has(name) : force) ? values.add(name) : values.delete(name);
        this.className = [...values].join(' ');
      },
      add: (...names) => names.forEach(name => this.classList.toggle(name, true)),
      remove: (...names) => names.forEach(name => this.classList.toggle(name, false)),
    };
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent || '').join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this._text = ''; this.children = children; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  setAttribute(name, value) { this.attributes ||= {}; this.attributes[name] = String(value); if (name === 'class') this.className = String(value); }
  querySelectorAll(selector) { const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]); return selector === '*' ? descendants : selector.startsWith('.') ? descendants.filter(child => child.className.split(' ').includes(selector.slice(1))) : []; }
  scrollIntoView() {}
  before(element) { this.insertedBefore = element; element.nextElementSibling = this; }
  click() { this.wasClicked = true; }
  remove() {}
}
function harness() {
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  const created = [];
  elements['experiment-mode'].value = 'independent';
  const context = createContext({
    console, Date, Map, Set, BigInt, Number, String, Boolean, Object, Array, JSON, TextEncoder, Blob, crypto: webcrypto,
    document: { getElementById: id => elements[id], createElement: tag => { const element = new Element(tag); created.push(element); return element; }, createElementNS: (namespace, tag) => { const element = new Element(tag); element.namespace = namespace; created.push(element); return element; }, createTextNode: value => { const element = new Element(); element.textContent = value; return element; }, body: new Element('body') },
    history: { replaceState() {} }, location: { hash: '' }, window: { setTimeout() {} }, navigator: {},
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    fetch: async () => { throw new Error('Unstubbed network request'); },
  });
  const boundary = source.lastIndexOf("\ndocument.querySelectorAll('[data-tab]')");
  assert.ok(boundary > 0, 'Cannot find application bootstrap boundary');
  runInContext(source.slice(0, boundary), context);
  const pollStart = source.indexOf('async function poll()');
  runInContext(source.slice(pollStart, source.indexOf('async function bootstrap()', pollStart)), context);
  const api = runInContext('({exactUnits,integerDelta,comparisonStates,experimentMode,renderRun,renderHistory,refreshHistory,historyMatches,historyChainStatus,modelSummary,showArchiveDetails,redactConfiguration,resolveTaskForm,graphFilter,graphZoom,renderExecutionGraph,showGraphEdge,showGraphNode,evidenceIndex,openBundle,getConfiguration,updateButtons,exportRun,exportExecutionTrace,validExecutionTrace,exportExecutionGraph,validExecutionGraph,loadRun,refreshCurrentRun,poll,state})', context);
  return { api, elements, context, created };
}
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(value) });
const before = { blockNumber: '8', blockHash: '0xaaa', chainId: 31337, timestamp: '10', balances: { agentA: '100000000', recipientA: '0' } };
const after = { blockNumber: '9', blockHash: '0xbbb', chainId: 31337, timestamp: '11', balances: { agentA: '90000000', recipientA: '0' } };
const events = [
  { seq: 1, event_id: 'e1', type: 'state.before', payload: before },
  { seq: 2, event_id: 'e2', type: 'tx.broadcast', payload: { hash: '0x123', status: 'pending' } },
  { seq: 3, event_id: 'e3', type: 'tx.receipt', payload: { hash: '0x123', status: 'success' } },
  { seq: 4, event_id: 'e4', type: 'state.after', payload: after },
];
function failedTransfer() {
  return {
    config: { run_id: 'test', mode: 'scripted', taskId: 'transfer', experimentMode: 'continuous', session_id: 'session-x', previous_run_id: 'previous-x' },
    events,
    result: { status: 'failure', assertions: [{ id: 'recipient-delta', passed: false, expected: '10000000', actual: '0' }], evidence: { before, after, transactions: [{ hash: '0x123', status: 'success', receipt: { status: 'success' } }] } },
  };
}
function executionTrace() {
  return { schema_version: '1.0', run_id: 'test', provenance: { kind: 'derived' }, model_calls: [],
    tool_calls: [{ id: 'tool-1', toolCallId: 'tc-1', name: 'transfer_token', input: { recipient: '<img src=x onerror=alert(1)>' }, raw_result: { actual: 'original' }, visible_result: { shown: 'override' }, overridden: true, status: 'completed', source_events: [{ seq: 2, event_id: 'e2', type: 'tool.call' }] }],
    contract_calls: [{ id: 'contract-1', contractCallId: 'cc-1', toolCallId: 'tc-1', kind: 'transaction', contract: { name: 'TokenA', address: '0xTokenA' }, function: { name: 'transfer', args: ['0xRecipient', '10000000'] }, status: 'submitted' }],
    transactions: [{ id: 'tx-1', hash: '0x123', contractCallId: 'cc-1', toolCallId: 'tc-1', status: 'success', request: { amount: '10000000' }, receipt: { status: 'success' }, trace_available: true }],
    call_frames: [{ id: 'frame-1', callId: 'f1', transaction_id: 'tx-1', hash: '0x123', type: 'CALL', to: '0xTokenA', trace_path: [], input: '0xabcdef' }], edges: [], warnings: [] };
}
function executionGraph() {
  return { schema_version: '1.0', format: 'web3-agent-provenance-graph', run_id: 'test', directed: true, multigraph: true,
    nodes: [{ id: 'tool-1', type: 'tool_call', label: '<script>alert(1)</script>', attributes: { name: 'transfer_token' }, source_events: [{ seq: 2, event_id: 'e2' }] }, { id: 'contract-1', type: 'contract_call', label: 'TokenA.transfer', attributes: { address: '0xTokenA' }, source_events: [] }],
    edges: [{ id: 'edge-1', source: 'tool-1', target: 'contract-1', type: 'invokes', attributes: {}, source_events: [] }], provenance: { kind: 'derived' }, warnings: [] };
}
test('HTML identifiers are unique and every literal JS reference exists', () => {
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of source.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), `Missing element ${id}`);
});
test('integer formatting preserves research amounts and does not replace missing evidence with zero', () => {
  const { api } = harness();
  assert.equal(api.exactUnits('100000000'), '100');
  assert.equal(api.exactUnits('999999999999999999999999999999'), '999999999999999999999999.999999');
  assert.equal(api.exactUnits('-1'), '−0.000001');
  assert.equal(api.exactUnits('1', 18), '0.000000000000000001');
  assert.equal(api.exactUnits(null), '未采集');
  assert.equal(api.integerDelta(null, '0'), null);
  assert.equal(api.integerDelta('100000000', '90000000'), '-10000000');
});
test('successful transaction and failed task remain separate with Chinese expected/actual and session provenance', () => {
  const { api, elements } = harness(); api.renderRun(failedTransfer());
  assert.match(elements['chain-execution-label'].textContent, /成功/);
  assert.equal(elements['task-outcome-label'].textContent, '失败');
  assert.match(elements['assertions'].textContent, /收款方余额变化/);
  assert.match(elements['assertions'].textContent, /期望：10000000/);
  assert.match(elements['assertions'].textContent, /实际：0/);
  assert.match(elements['assertions'].textContent, /建议/);
  for (const value of ['100 A', '90 A', '−10 A', '未采集']) assert.ok(elements['state-comparison-body'].textContent.includes(value), value);
  assert.match(elements['rerun-run'].className, /hidden/);
  assert.match(elements['run-lineage'].textContent, /session-x/);
  assert.match(elements['run-lineage'].textContent, /previous-x/);
  elements['show-raw-units'].checked = true; api.renderRun(failedTransfer());
  assert.match(elements['state-comparison-body'].textContent, /原始值：100000000/);
  assert.equal(api.evidenceIndex({ seq: 3, txHash: '0x123' }), 2, 'Precise sequence must take priority over earlier broadcast');
});
test('old records fall back to state events and imported protocol fixtures never become LLM results', () => {
  const { api, elements } = harness();
  const old = { config: { run_id: 'old', mode: 'llm', data_origin: 'protocol_fixture' }, events, result: { status: 'unknown' } };
  api.renderRun(old, { replay: true, imported: true });
  assert.match(elements['current-run-mode'].textContent, /接口模拟测试/);
  assert.match(elements['state-comparison-body'].textContent, /90 A/);
  assert.match(elements['run-lineage'].textContent, /旧记录默认/);
  assert.equal(elements['export-run'].disabled, true);
  api.state.runs = [failedTransfer(), old]; api.renderHistory();
  assert.match(elements['history-list'].textContent, /连续实验/);
  assert.match(elements['history-list'].textContent, /接口模拟测试/);
  assert.equal(api.comparisonStates({ events, result: { evidence: { before: { blockNumber: 'override' } } } }).before.blockNumber, 'override');
});
test('form sends chosen experiment mode and defaults legacy history to independent', () => {
  const { api, elements } = harness();
  assert.equal(api.experimentMode({ config: {} }), 'independent');
  elements['run-mode'].value = 'scripted'; elements['tool-overrides'].value = '{}'; elements['task-id'].value = 'transfer';
  elements['allowed-tools'].querySelectorAll = () => [{ value: 'transfer_token' }];
  elements['experiment-mode'].value = 'continuous';
  assert.equal(api.getConfiguration().experimentMode, 'continuous');
});
test('failure puts diagnosis first while success puts state first and all assertions start collapsed', () => {
  const { api, elements } = harness();
  api.renderRun(failedTransfer());
  assert.equal(elements['state-comparison-card'].insertedBefore, elements['verdict-card']);
  assert.match(elements['assertion-summary-count'].textContent, /1 未通过/);
  assert.match(html, /<details id="assertion-details" class="all-assertions">/);
  const successful = failedTransfer(); successful.result.status = 'success'; successful.result.assertions = [];
  api.renderRun(successful);
  assert.equal(elements['verdict-card'].insertedBefore, elements['state-comparison-card']);
});
test('offline import verifies original bytes and rejects a modified payload', async () => {
  const { api } = harness();
  const runId = 'test'; const payload = JSON.stringify(before);
  const hash = createHash('sha256').update(payload).digest('hex'); const path = `blobs/${hash}.json`;
  const files = { 'config.json': JSON.stringify({ run_id: runId, mode: 'scripted' }), [path]: payload };
  files['events.jsonl'] = JSON.stringify({ seq: 1, run_id: runId, type: 'state.before', payload_ref: { path, sha256: hash } }) + '\n';
  const manifestFiles = Object.fromEntries(Object.entries(files).map(([name, content]) => [name, { sha256: createHash('sha256').update(content).digest('hex'), bytes: Buffer.byteLength(content) }]));
  files['manifest.json'] = JSON.stringify({ event_count: 1, files: manifestFiles });
  files['derived/execution-trace.json'] = JSON.stringify(executionTrace());
  files['derived/provenance-graph.json'] = JSON.stringify(executionGraph());
  files['derived/provenance-graph.graphml'] = '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><graph edgedefault="directed"></graph></graphml>';
  const bundle = { format: 'web3-agent-lab-bundle', files };
  const opened = await api.openBundle(bundle);
  assert.equal(opened.verified, true); assert.equal(opened.run.events[0].payload.balances.agentA, '100000000');
  assert.equal(opened.run.execution_trace.tool_calls[0].toolCallId, 'tc-1');
  assert.equal(opened.run.execution_graph.edges[0].target, 'contract-1');
  assert.match(opened.run.execution_graphml, /<graphml/);
  const brokenDerived = structuredClone(bundle); brokenDerived.files['derived/execution-trace.json'] = '{broken';
  const recovered = await api.openBundle(brokenDerived); assert.equal(recovered.verified, true); assert.match(recovered.run.execution_trace_error, /无法解析/);
  const changed = structuredClone(bundle); changed.files[path] = payload + ' ';
  await assert.rejects(() => api.openBundle(changed), /完整性校验失败/);
});
test('result clearly distinguishes original offline evidence from live reconciliation and labels old records honestly', () => {
  const { api, elements } = harness(); const run = failedTransfer();
  run.result.check_mode = 'offline'; run.result.evidence_source = 'original_run'; run.result.check_id = 'check-uuid'; run.result.checked_at = '2026-10-11T10:00:00Z';
  api.renderRun(run);
  assert.equal(elements['evidence-source-label'].textContent, '原始运行证据 · 离线复检');
  assert.match(elements['evidence-source-note'].textContent, /不采用之后追认的新状态/);
  assert.match(elements['evidence-check-metadata'].textContent, /check-uuid/);
  assert.match(elements['evidence-check-metadata'].textContent, /2026-10-11T10:00:00Z/);
  run.result.check_mode = 'live_reconciliation'; run.result.evidence_source = 'live_chain'; api.renderRun(run);
  assert.equal(elements['evidence-source-label'].textContent, '当前链追认 · 新证据');
  run.result.check_mode = 'live'; run.result.evidence_source = 'original_run'; api.renderRun(run);
  assert.equal(elements['evidence-source-label'].textContent, '运行结束时证据');
  api.renderRun(failedTransfer());
  assert.match(elements['evidence-source-label'].textContent, /旧记录未标注/);
  assert.equal(elements['evidence-check-metadata'].textContent, '');
  assert.match(source, /离线复检已完成：仅使用原始运行证据，不采用追认的新状态/);
});
test('unsealed export and incompatible environment operations are disabled during execution', () => {
  const { api, elements } = harness();
  api.state.status = { ready: true, busy: true, active: { runId: 'active', state: 'running' } };
  api.state.runId = 'active'; api.state.run = { config: {}, manifest: null };
  api.updateButtons();
  assert.equal(elements['export-run'].disabled, true);
  assert.equal(elements['automine'].disabled, true);
  assert.equal(elements['mine-block'].disabled, true);
  api.state.status.active.state = 'paused'; api.updateButtons();
  assert.equal(elements['mine-block'].disabled, false);
  assert.equal(elements['automine'].disabled, true);
  api.state.status.busy = false; api.state.status.active.state = 'finished';
  api.state.run.manifest = { files: {} }; api.updateButtons();
  assert.equal(elements['export-run'].disabled, false);
});
test('HTTP errors and non-bundles never trigger a fake experiment download', async () => {
  const { api, elements, context, created } = harness();
  context.fetch = async () => response({ error: 'UNSEALED_RECORDING' }, 400);
  assert.equal(await api.exportRun('test'), false);
  assert.match(elements['notification-text'].textContent, /导出失败/);
  assert.equal(created.filter(e => e.tag === 'a' && e.wasClicked).length, 0);
  context.fetch = async () => response({ format: 'error', files: {} });
  assert.equal(await api.exportRun('test'), false);
  assert.equal(created.filter(e => e.tag === 'a' && e.wasClicked).length, 0);
  context.fetch = async () => response({ format: 'web3-agent-lab-bundle', run_id: 'test', files: { 'manifest.json': '{}' } });
  assert.equal(await api.exportRun('test'), true);
  assert.equal(created.filter(e => e.tag === 'a' && e.wasClicked).length, 1);
});
test('a corrupt historical record cannot change selected identity or network connection status', async () => {
  const { api, elements, context } = harness();
  api.renderRun(failedTransfer());
  context.fetch = async path => path === '/api/status' ? response({ ready: true, busy: false, active: null }) : response({ error: 'PAYLOAD_HASH_MISMATCH' }, 400);
  await assert.rejects(() => api.loadRun('corrupt-id', true), /PAYLOAD_HASH_MISMATCH/);
  assert.equal(api.state.runId, 'test');
  assert.equal(api.state.run.config.run_id, 'test');
  assert.equal(api.state.replay, false);
  api.state.firstStatus = false;
  await api.poll();
  assert.equal(api.state.connected, true);
  assert.match(elements['notification-text'].textContent, /读取实验记录失败/);
  assert.equal(api.state.runId, 'test');
});
test('a slow refresh cannot overwrite a later run selection', async () => {
  const { api, context } = harness(); api.renderRun(failedTransfer());
  let resolveResponse;
  context.fetch = () => new Promise(resolve => { resolveResponse = resolve; });
  const pending = api.refreshCurrentRun();
  api.state.runId = 'new-selection'; api.state.replay = true;
  resolveResponse(response(failedTransfer())); await pending;
  assert.equal(api.state.runId, 'new-selection');
});
test('execution trace shows explicit tool-contract-transaction links, separate outputs and literal untrusted text', () => {
  const { api, elements, created } = harness(); const run = failedTransfer(); run.execution_trace = executionTrace(); api.renderRun(run);
  const visible = elements['execution-trace-content'].textContent;
  for (const phrase of ['transfer_token', 'tc-1', 'cc-1', '0xTokenA', 'transfer', '10000000', '0x123', 'original', 'override', '已发生返回替换', 'EVM 调用详情 · 1 条', '<img src=x onerror=alert(1)>']) assert.ok(visible.includes(phrase), phrase);
  assert.equal(created.filter(element => element.tag === 'img').length, 0);
  assert.match(elements['execution-trace-provenance'].textContent, /不属于 manifest 原始证据校验/);
  const link = created.find(element => element.tag === 'button' && element.textContent.startsWith('事件 #2'));
  assert.ok(link); link.listeners.click(); assert.equal(api.state.selectedEvent, 1);
});
test('missing or ambiguous trace relationships remain unassigned and old records still render', () => {
  const { api, elements } = harness(); const run = failedTransfer(); const trace = executionTrace();
  trace.tool_calls.push({ id: 'tool-2', toolCallId: 'tc-1', name: 'duplicate_call_id', status: 'incomplete' });
  run.execution_trace = trace; api.renderRun(run);
  assert.match(elements['execution-trace-content'].textContent, /未关联到上述工具链/);
  assert.match(elements['execution-trace-content'].textContent, /没有明确|未记录可明确关联/);
  assert.match(elements['execution-trace-content'].textContent, /0xTokenA/);
  api.renderRun(failedTransfer());
  assert.match(elements['execution-trace-content'].textContent, /尚未包含派生执行轨迹/);
  trace.run_id = 'other'; run.execution_trace = trace; api.renderRun(run);
  assert.match(elements['execution-trace-content'].textContent, /实验编号不匹配/);
});
test('trace export validates server response and imported trace downloads without a request', async () => {
  const { api, context, elements, created } = harness(); const run = failedTransfer(); run.execution_trace = executionTrace(); run.manifest = { files: {} }; api.renderRun(run);
  assert.equal(elements['export-execution-trace'].disabled, false);
  context.fetch = async () => response({ error: 'UNSEALED_RECORDING' }, 400);
  assert.equal(await api.exportExecutionTrace(), false);
  context.fetch = async () => response({ ...executionTrace(), run_id: 'other' });
  assert.equal(await api.exportExecutionTrace(), false);
  assert.equal(created.filter(element => element.tag === 'a' && element.wasClicked).length, 0);
  api.renderRun(run, { replay: true, imported: true });
  context.fetch = () => { throw new Error('Imported trace must not use network'); };
  assert.equal(elements['export-run'].disabled, true); assert.equal(elements['export-execution-trace'].disabled, false);
  assert.equal(await api.exportExecutionTrace(), true);
  assert.match(created.find(element => element.tag === 'a' && element.wasClicked).download, /execution-trace-test\.json$/);
});
test('graph preview uses explicit edges and safe SVG text, with node attributes and source navigation', () => {
  const { api, elements, created } = harness(); const run = failedTransfer(); run.execution_graph = executionGraph(); api.renderRun(run);
  assert.match(elements['execution-graph-note'].textContent, /2 \/ 2 个节点，1 \/ 1 条边/);
  assert.equal(created.filter(element => element.className === 'graph-edge').length, 1);
  assert.equal(created.filter(element => element.tag === 'script').length, 0);
  const node = created.find(element => element.tag === 'g' && element.dataset.nodeId === 'tool-1'); node.listeners.click();
  assert.match(elements['execution-graph-detail-json'].textContent, /transfer_token/);
  assert.match(elements['execution-graph-detail-json'].textContent, /edge-1/);
  assert.match(elements['execution-graph-detail-title'].textContent, /<script>alert\(1\)<\/script>/);
  assert.match(elements['execution-graph-source-links'].textContent, /事件 #2/);
  run.execution_graph.edges[0].target = 'missing'; api.renderRun(run);
  assert.match(elements['execution-graph-note'].textContent, /节点关系或实验编号无效/);
});
test('large graph preview is bounded and clearly partial while exports retain the full graph', async () => {
  const { api, elements, created } = harness(); const run = failedTransfer(); const graph = executionGraph();
  graph.nodes = Array.from({ length: 150 }, (_, index) => ({ id: 'tool-' + index, type: 'tool_call', label: 'tool ' + index, attributes: {} }));
  graph.edges = Array.from({ length: 149 }, (_, index) => ({ id: 'edge-' + index, source: 'tool-' + index, target: 'tool-' + (index + 1), type: 'next' })); run.execution_graph = graph;
  api.renderRun(run, { replay: true, imported: true });
  assert.match(elements['execution-graph-note'].textContent, /大图已折叠/);
  assert.match(elements['execution-graph-note'].textContent, /120 \/ 150 个节点/);
  assert.equal(created.filter(element => element.tag === 'g').length, 120);
  assert.equal(await api.exportExecutionGraph('json'), true);
  assert.equal(api.state.run.execution_graph.nodes.length, 150);
});
test('graph JSON and GraphML export reject errors and download imported files without network', async () => {
  const { api, context, elements, created } = harness(); const run = failedTransfer(); run.execution_graph = executionGraph(); run.execution_graphml = '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><graph edgedefault="directed"></graph></graphml>'; run.manifest = { files: {} }; api.renderRun(run);
  context.fetch = async () => response({ error: 'UNSEALED_RECORDING' }, 400);
  assert.equal(await api.exportExecutionGraph('json'), false); assert.equal(await api.exportExecutionGraph('graphml'), false);
  context.fetch = async () => response({ error: 'bad-but-http-200' });
  assert.equal(await api.exportExecutionGraph('graphml'), false);
  assert.equal(created.filter(element => element.tag === 'a' && element.wasClicked).length, 0);
  api.renderRun(run, { replay: true, imported: true });
  context.fetch = () => { throw new Error('Imported graph must not use network'); };
  assert.equal(elements['export-graph-json'].disabled, false); assert.equal(elements['export-graphml'].disabled, false);
  assert.equal(await api.exportExecutionGraph('json'), true); assert.equal(await api.exportExecutionGraph('graphml'), true);
  assert.deepEqual(created.filter(element => element.tag === 'a' && element.wasClicked).map(element => element.download), ['web3-provenance-graph-test.json', 'web3-provenance-graph-test.graphml']);
  delete run.execution_graphml; api.renderRun(run, { replay: true, imported: true }); assert.equal(elements['export-graphml'].disabled, true);
});
test('archive combines Chinese/English task search with separate task and chain outcomes and retains filters across refresh', async () => {
  const { api, elements, context } = harness();
  const rows = [
    { runId: 'tx-task-failed', taskId: 'transfer', mode: 'llm', model: { model: 'requested-v1' }, taskInput: '给 recipient 转账 30 TokenA', result: { status: 'failure', diagnostics: { chainExecutionStatus: 'success' } }, modelSummary: { requested: 'requested-v1', reported: ['actual-v2'] } },
    { runId: 'tx-task-success', taskId: 'transfer', result: { status: 'success', diagnostics: { chainExecutionStatus: 'success' } } },
    { runId: 'swap-failed', taskId: 'swap', result: { status: 'failure', diagnostics: { chainExecutionStatus: 'reverted' } } },
  ]; api.state.runs = rows;
  elements['history-filter'].value = '转账 actual-v2'; elements['history-task'].value = 'transfer'; elements['history-task-result'].value = 'failure'; elements['history-chain-result'].value = 'success';
  api.renderHistory(); assert.equal(elements['history-list'].children.length, 1); assert.match(elements['history-list'].textContent, /tx-task-failed/); assert.match(elements['history-list'].textContent, /actual-v2/);
  context.fetch = async () => response(rows); await api.refreshHistory(); assert.equal(elements['history-list'].children.length, 1); assert.equal(elements['history-task-result'].value, 'failure');
  elements['history-filter'].value = 'TRANSFER'; api.renderHistory(); assert.equal(elements['history-list'].children.length, 1, 'Changing only filter must invalidate cache');
  elements['history-chain-result'].value = 'reverted'; api.renderHistory(); assert.equal(elements['history-list'].children.length, 0, 'Task failure must not imply failed transaction');
  elements['history-task'].value = 'swap'; elements['history-filter'].value = '兑换'; api.renderHistory(); assert.equal(elements['history-list'].children.length, 1);
});
test('archive model report is taken from response evidence, does not invent old model or task input, and re-redacts configuration', () => {
  const { api, elements, created } = harness();
  const run = { runId: 'detail-1', taskId: 'approve', mode: 'llm', taskInput: '<img src=x onerror=alert(1)> 授权30', model: { model: 'requested-v1', apiKey: 'hidden-secret' }, privateKey: 'private-secret', events: [{ type: 'model.response', payload: { response: { model: 'actual-snapshot' } } }] };
  api.showArchiveDetails(run); assert.match(elements['archive-detail-input'].textContent, /授权30/); assert.match(elements['archive-detail-model'].textContent, /actual-snapshot/); assert.match(elements['archive-detail-model'].textContent, /接口自报/);
  assert.doesNotMatch(elements['archive-detail-config'].textContent, /hidden-secret|private-secret/); assert.equal(created.filter(element => element.tag === 'img').length, 0);
  api.showArchiveDetails({ runId: 'old', taskId: 'approve', mode: 'llm' }); assert.match(elements['archive-detail-input'].textContent, /未记录/); assert.match(elements['archive-detail-model'].textContent, /服务端报告：未提供/);
  assert.equal(api.historyChainStatus({ taskId: 'balance', result: { status: 'success' } }), 'query_only');
});
test('graph relation filtering and edge/node selection keep complete offline graph and highlight only explicit neighbors', () => {
  const { api, elements } = harness(); const run = failedTransfer(), graph = executionGraph();
  graph.nodes.push({ id: 'previous', type: 'run_reference', label: 'previous' }); graph.edges.push({ id: 'edge-2', source: 'previous', target: 'tool-1', type: 'follows_run', source_events: [{ seq: 1, event_id: 'e1' }], attributes: { evidence: 'original-order' } });
  run.execution_graph = graph; api.renderRun(run, { replay: true, imported: true });
  const colors = elements['graph-relation-filters'].children.map(label => label.children[1].style.backgroundColor); assert.notEqual(colors[0], colors[1], 'Relation legend colors must differ');
  api.graphFilter('follows'); assert.match(elements['execution-graph-note'].textContent, /2 \/ 3 个节点，1 \/ 2 条边/); assert.equal(api.state.run.execution_graph.edges.length, 2);
  const edge = elements['execution-graph-preview'].querySelectorAll('.graph-edge')[0]; api.showGraphEdge(graph.edges[1], graph); assert.match(edge.className, /highlighted/); assert.match(elements['execution-graph-detail-json'].textContent, /original-order/); assert.match(elements['execution-graph-source-links'].textContent, /事件 #1/);
  api.graphFilter('all'); api.showGraphNode(graph.nodes[1], graph); const nodes = elements['execution-graph-preview'].querySelectorAll('.graph-node'); assert.match(nodes.find(node => node.dataset.nodeId === 'previous').className, /dimmed/); assert.match(nodes.find(node => node.dataset.nodeId === 'tool-1').className, /neighbor/);
  api.graphZoom(2); assert.equal(api.state.graphSvg.attributes.width, String(api.state.graphWidth * 2));
  api.graphFilter('none'); assert.match(elements['execution-graph-note'].textContent, /0 \/ 3 个节点，0 \/ 2 条边/); assert.equal(graph.nodes.length, 3);
});
test('resolved form synchronizes supported task input, structured parameters and checker target without silent fallback', async () => {
  const { api, elements, context } = harness(); elements['task-id'].value = 'transfer'; elements['task-input'].value = '转账30 TokenA';
  let submitted; context.fetch = async (path, options) => { submitted = JSON.parse(options.body); return response({ id: 'transfer', input: submitted.taskInput || '转账30 TokenA（标准）', completion: 'recipient增加30', taskParameters: { amount: '30' }, parameterSource: submitted.taskParameters ? 'structured' : 'input' }); };
  await api.resolveTaskForm('input'); assert.equal(submitted.taskInput, '转账30 TokenA'); assert.equal(elements['parameter-amount'].value, '30'); assert.match(elements['task-resolution-note'].textContent, /amount = 30/); assert.match(elements['task-completion'].textContent, /增加30/);
  elements['parameter-amount'].value = '30'; await api.resolveTaskForm('structured'); assert.equal(submitted.taskParameters.amount, '30'); assert.equal(submitted.taskInput, undefined); assert.match(elements['task-input'].value, /标准/);
  context.fetch = async () => response({ error: 'TASK_INPUT_AMBIGUOUS' }, 400); await assert.rejects(() => api.resolveTaskForm('input'), /TASK_INPUT_AMBIGUOUS/); assert.equal(elements['parameter-amount'].value, '30');
});
test('continuation controls distinguish checker-only reconciliation from resuming an eligible current Agent', () => {
  const { api, elements } = harness(); const run = failedTransfer(); run.config.mode = 'llm'; run.result.status = 'pending'; run.continuation = { allowed: true }; api.state.status = { ready: true, busy: false }; api.renderRun(run);
  assert.equal(elements['continue-agent-run'].disabled, false); assert.match(elements['continue-agent-note'].textContent, /创建关联子运行/); assert.match(elements['continue-agent-note'].textContent, /只更新检查器/);
  run.continuation = { allowed: false, reason: 'CHAIN_ENVIRONMENT_CHANGED' }; api.renderRun(run); assert.equal(elements['continue-agent-run'].disabled, true); assert.match(elements['continue-agent-note'].textContent, /CHAIN_ENVIRONMENT_CHANGED/);
  api.renderRun({ ...run, continuation: { allowed: true } }, { replay: true, imported: true }); assert.equal(elements['continue-agent-run'].disabled, true);
});
test('protocol fixtures can continue a server-approved Agent driver while retaining explicit simulated-model labels', () => {
  const { api, elements } = harness(); const run = failedTransfer(); run.config.mode = 'llm'; run.config.data_origin = 'protocol_fixture'; run.continuation = { allowed: true }; api.state.status = { ready: true, busy: false }; api.renderRun(run);
  assert.equal(elements['continue-agent-run'].disabled, false); assert.doesNotMatch(elements['continue-agent-run'].className, /hidden/);
  assert.match(elements['current-run-mode'].textContent, /接口模拟测试（非LLM）/); assert.match(elements['continue-agent-note'].textContent, /接口模拟测试（非真实模型）/); assert.match(elements['continue-agent-note'].textContent, /不能作为模型能力结果/);
  assert.equal(api.state.run.config.data_origin, 'protocol_fixture', 'GUI must preserve recorded data origin');
});
