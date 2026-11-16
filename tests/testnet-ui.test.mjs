import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/testnet.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../public/testnet.html', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
function context(document = { getElementById() { return null; } }, fetcher) {
  const window = { addEventListener() {} };
  const timers = [];
  vm.runInNewContext(source, { window, document, console, crypto: webcrypto, TextEncoder, Uint8Array, URL, Blob, AbortController, setTimeout, clearTimeout, setInterval: fn => { timers.push(fn); return timers.length; }, clearInterval() {}, fetch: fetcher });
  return { core: window.TestnetLabCore, window, timers };
}
const base = { taskId: 'approve', mode: 'scripted', amount: '20', taskInput: '授权20 TokenA', toolOverrides: '{}', allowedTools: ['approve_token'], temperature: '0', maxSteps: '12' };
const hash = text => createHash('sha256').update(text).digest('hex');
function bundleFixture({ withDerived = true } = {}) {
  const id = '00000000-0000-4000-8000-000000000001';
  const body = JSON.stringify({ name: 'approve_token', args: { amount: '20' }, unsafe: '<img src=x onerror=alert(1)>' }) + '\n';
  const path = 'blobs/' + hash(body) + '.json';
  const event = { seq: 1, run_id: id, type: 'tool.call', payload_ref: { path, sha256: hash(body) } };
  const files = { 'config.json': JSON.stringify({ run_id: id, taskId: 'approve', mode: 'scripted' }) + '\n', 'events.jsonl': JSON.stringify(event) + '\n', [path]: body };
  const entries = paths => Object.fromEntries(paths.map(p => [p, { sha256: hash(files[p]), bytes: Buffer.byteLength(files[p]) }]));
  files['manifest.json'] = JSON.stringify({ run_id: id, event_count: 1, recording_status: 'sealed', files: entries(Object.keys(files)) });
  files['derived/latest.json'] = JSON.stringify({ status: 'pending', assertions: [] });
  if (withDerived) {
    const graph = { format: 'web3-agent-provenance-graph', schema_version: '1.0', run_id: id, directed: true, multigraph: true, nodes: [{ id: 'task', type: 'task', label: '<script>bad</script>', source_events: [{ seq: 1 }] }], edges: [] };
    files['derived/provenance-graph.json'] = JSON.stringify(graph);
    files['derived/execution-trace.json'] = JSON.stringify({ run_id: id, tools: [] });
    files['derived/provenance-graph.graphml'] = '<graphml><graph id="test"/></graphml>';
    files['derived/nodes.csv'] = 'node_id,type\ntask,task\n';
    files['derived/relations.csv'] = 'source,target\n';
    files['derived/trace-events.jsonl'] = files['events.jsonl'];
    const names = Object.keys(files).filter(p => p.startsWith('derived/') && p !== 'derived/latest.json');
    files['derived/execution-trace-manifest.json'] = JSON.stringify({ run_id: id, source_manifest_sha256: hash(files['manifest.json']), files: entries(names) });
  }
  return { format: 'web3-agent-lab-bundle', version: '1.0', run_id: id, files };
}
test('testnet page is isolated from legacy app and has explicit scope and secret input controls', () => {
  const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(index, /选择实验环境/); assert.match(index, /href="\/testnet.html"/); assert.match(index, /src="\/app.js"/);
  assert.doesNotMatch(html, /src="\/app.js"/);
  const confirmationInput = /<input\b[^>]*id="confirmations"[^>]*>/.exec(html)?.[0] || '';
  assert.match(confirmationInput, /\bmin="1"/); assert.match(confirmationInput, /\bmax="64"/);
  for (const id of ['private-key', 'model-key', 'rpc-url']) assert.match(html, new RegExp('id="' + id + '" type="password"'));
  assert.match(html, /双 Agent/); assert.match(html, /LabAMM/); assert.match(html, /不代表已适配第三方 DEX/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|\.innerHTML\s*=|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  assert.doesNotMatch(source, /\/api\/(?:environment|chain|runs)\//);
});
test('all five tasks preserve human-readable parameters and reject malformed or overflowing values', () => {
  const { core } = context();
  assert.deepEqual(plain(core.runPayload(base).taskParameters), { amount: '20' });
  assert.deepEqual(plain(core.parameters('balance', {})), {});
  assert.deepEqual(plain(core.parameters('transfer', { amount: '0.000001' })), { amount: '0.000001' });
  for (const task of ['swap', 'swap_deposit']) assert.deepEqual(plain(core.parameters(task, { amountIn: '10', minAmountOut: '0' })), { amountIn: '10', minAmountOut: '0' });
  for (const amount of ['1e6', '-1', '0', '1.0000001', 'Infinity', (2n ** 256n).toString()]) assert.throws(() => core.parameters('approve', { amount }));
  assert.throws(() => core.parameters('peer', {}), /五类/);
});
test('local and scripted backends do not forward API secrets; remote model includes correct explicit configuration', () => {
  const { core } = context();
  const fields = { ...base, modelName: 'remote', modelUrl: 'https://model.invalid/v1', modelKey: 'test-secret', systemPrompt: 'test prompt', pauseBeforeTool: true };
  assert.equal('model' in core.runPayload(fields), false);
  const local = core.runPayload({ ...fields, mode: 'local' });
  assert.deepEqual(plain(local.model), { provider: 'local', temperature: 0, maxSteps: 12, systemPrompt: 'test prompt' });
  assert.ok(!JSON.stringify(local).includes('test-secret'));
  const api = core.runPayload({ ...fields, mode: 'api' });
  assert.equal(api.mode, 'llm'); assert.equal(api.model.apiKey, 'test-secret'); assert.equal(api.model.model, 'remote');
  assert.equal(api.pauseBeforeTool, true);
  assert.throws(() => core.runPayload({ ...fields, mode: 'api', modelName: '' }), /模型 ID/);
  assert.throws(() => core.runPayload({ ...fields, mode: 'api', modelUrl: 'javascript:alert(1)' }), /HTTP/);
  assert.throws(() => core.runPayload({ ...base, toolOverrides: '[]' }), /JSON 对象/);
  assert.throws(() => core.runPayload({ ...base, allowedTools: [] }), /允许工具/);
});
test('dedicated API client uses only testnet routes, its own CSRF header and blocks all requests while offline', async () => {
  const { core } = context(); const calls = [];
  const client = core.createClient(async (url, options) => { calls.push({ url, options }); return { ok: true, text: async () => '{"ok":true}' }; });
  client.setToken('test-token'); await client.request('/connect', { profileId: 'base-sepolia' });
  assert.equal(calls[0].url, '/api/testnet/connect'); assert.equal(calls[0].options.headers['x-testnet-token'], 'test-token'); assert.equal(calls[0].options.credentials, 'same-origin');
  client.enterOffline();
  for (const path of ['/status', '/run', '/recheck', '/export?id=x']) await assert.rejects(client.request(path, {}), /离线/);
  assert.equal(calls.length, 1);
  client.leaveOffline(); await client.request('/status'); assert.equal(calls.length, 2);
  await assert.rejects(client.request('/../chain/reset', {}), /未允许/);
});
test('entering offline aborts outstanding requests and rejects late responses even if transport ignores abort', async () => {
  const { core } = context(); let release, signal;
  const client = core.createClient(async (_url, options) => { signal = options.signal; await new Promise(resolve => { release = resolve; }); return { ok: true, text: async () => '{}' }; });
  const request = client.request('/status'); client.enterOffline(); assert.equal(signal.aborted, true); release();
  await assert.rejects(request, /过期/);
});
test('offline bundle verification resolves only content-addressed local events and validates derived files', async () => {
  const { core } = context(); const bundle = bundleFixture(), run = await core.readBundle(bundle);
  assert.equal(run.verified, true); assert.equal(run.derivedVerified, true); assert.equal(run.events[0].payload.args.amount, '20');
  assert.equal(run.events[0].payload.unsafe, '<img src=x onerror=alert(1)>'); assert.equal(run.execution_graph.nodes.length, 1);
  assert.equal(run.result.status, 'pending'); assert.equal(run.warnings.length, 0);
  const withoutDerived = await core.readBundle(bundleFixture({ withDerived: false }));
  assert.equal(withoutDerived.execution_graph, null); assert.equal(withoutDerived.events.length, 1); assert.match(withoutDerived.warnings[0], /派生文件清单/);
});
test('offline raw evidence tampering and run mismatches are rejected; bad derived data cannot invent relationships', async () => {
  const { core } = context();
  const changed = bundleFixture(); changed.files['events.jsonl'] += ' ';
  await assert.rejects(core.readBundle(changed), /完整性/);
  const wrongId = bundleFixture(); wrongId.run_id = 'wrong'; await assert.rejects(core.readBundle(wrongId), /编号/);
  const graphChanged = bundleFixture(); graphChanged.files['derived/provenance-graph.json'] = '{"invented":true}';
  const run = await core.readBundle(graphChanged); assert.equal(run.execution_graph, null); assert.equal(run.events.length, 1); assert.ok(run.warnings.length);
  const unlisted = bundleFixture(), derivedManifest = JSON.parse(unlisted.files['derived/execution-trace-manifest.json']);
  delete derivedManifest.files['derived/provenance-graph.json']; unlisted.files['derived/execution-trace-manifest.json'] = JSON.stringify(derivedManifest);
  assert.equal((await core.readBundle(unlisted)).execution_graph, null);
  const graph = JSON.parse(bundleFixture().files['derived/provenance-graph.json']); graph.edges = [{ source: 'task', target: 'invented' }]; assert.equal(core.validGraph(graph, graph.run_id), false);
  for (const path of ['https://invalid/x', '../x', '/x', 'x\\y']) assert.equal(core.safePath(path), false);
});
test('pending and unknown remain distinct UI states', () => {
  const { core } = context(); assert.equal(core.statusLabel('pending'), '等待确认'); assert.equal(core.statusLabel('unknown'), '结果未知'); assert.notEqual(core.statusLabel('pending'), core.statusLabel('failed'));
});

class Element {
  constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.events = {}; this.value = ''; this.disabled = false; this.checked = false; this.hidden = false; this.dataset = {}; this.className = ''; this.textContent = ''; this.classList = { toggle() {}, add() {}, remove() {} }; }
  set innerHTML(_value) { throw Error('Unsafe HTML insertion'); }
  setAttribute(key, value) { this[key] = value; }
  append(...nodes) { for (const node of nodes) { this.children.push(node); if (typeof node === 'object') node.parent = this; if (this.tagName === 'SELECT' && !this.value) this.value = node.value; } }
  replaceChildren(...nodes) { this.children = []; if (this.tagName === 'SELECT') this.value = ''; this.append(...nodes); }
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  dispatch(name, extra = {}) { for (const fn of this.events[name] || []) fn({ target: this, preventDefault() {}, ...extra }); }
  querySelectorAll(selector) { const children = this.children.filter(x => x instanceof Element); return children.flatMap(x => [...((selector === 'input:checked' && x.tagName === 'INPUT' && x.checked) ? [x] : []), ...x.querySelectorAll(selector)]); }
  click() { this.dispatch('click'); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); }
}
function documentFixture() {
  const elements = new Map();
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
    const el = new Element(match[1]), attrs = match[2]; el.id = match[3]; el.value = /\bvalue="([^"]*)"/.exec(attrs)?.[1] || ''; el.hidden = /\bhidden\b/.test(attrs); el.type = /\btype="([^"]*)"/.exec(attrs)?.[1]; elements.set(el.id, el);
  }
  elements.get('mode').value = 'scripted'; elements.get('tool-overrides').value = '{}';
  const artifacts = [...html.matchAll(/data-artifact="([^"]+)"/g)].map(match => { const el = new Element('button'); el.dataset.artifact = match[1]; return el; });
  return { elements, artifacts, body: new Element('body'), getElementById: id => elements.get(id) || null, createElement: tag => new Element(tag), createElementNS: (_ns, tag) => new Element(tag), querySelectorAll: selector => selector === '[data-artifact]' ? artifacts : [] };
}
const task = { id: 'balance', title: '查询余额', input: '查询', taskParameters: {}, completion: '余额与链上状态一致', allowedTools: ['get_balance'] };
const profiles = [{ id: 'base-sepolia', name: 'Base Sepolia', chainId: 84532, symbol: 'ETH', rpcUrl: 'https://rpc.invalid', writeEnabled: true, confirmations: 2 }, { id: 'sui-testnet', name: 'Sui Testnet', family: 'sui', writeEnabled: false }];
const disconnected = { connected: false, ready: false, writable: false, busy: false, active: null };
async function until(predicate) { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); } assert.fail('UI action did not settle'); }
test('GUI boots without chain writes, exposes only enabled profiles, and clears private key on connect', async () => {
  const document = documentFixture(), calls = [];
  context(document, async (url, options) => {
    calls.push({ url, options }); const data = url.endsWith('/bootstrap') ? { csrfToken: 'csrf', profiles, tasks: [task], status: disconnected } : url.endsWith('/connect') ? { ...disconnected, connected: true, writable: true, environment: { chainId: 84532, accounts: { agent: '0xaccount' }, nativeBalanceFormatted: '0.5', profileId: 'base-sepolia' } } : { runs: [] };
    return { ok: true, text: async () => JSON.stringify(data) };
  });
  await until(() => document.elements.get('notice').textContent.includes('可先不填私钥'));
  assert.equal(document.elements.get('network').children.length, 1); assert.equal(document.elements.get('candidate-networks').children.length, 1);
  assert.ok(calls.every(c => c.options.method === 'GET')); assert.equal(calls.length, 2);
  document.elements.get('private-key').value = 'test-only-value'; document.elements.get('connect-form').dispatch('submit');
  await until(() => document.elements.get('notice').textContent.includes('连接已核验'));
  assert.equal(document.elements.get('private-key').value, ''); assert.equal(document.elements.get('gas-balance').textContent, '0.5 ETH');
  const connect = calls.find(c => c.url.endsWith('/connect')); assert.equal(JSON.parse(connect.options.body).privateKey, 'test-only-value');
  assert.equal(calls.some(c => c.url.endsWith('/deploy') || c.url.endsWith('/run')), false);
});
test('GUI imports bundle into offline mode, permits local replay and graph clicks without any network request', async () => {
  const document = documentFixture(), calls = [];
  const { timers } = context(document, async (url, options) => { calls.push({ url, options }); const data = url.endsWith('/bootstrap') ? { csrfToken: 'csrf', profiles, tasks: [task], status: disconnected } : { runs: [] }; return { ok: true, text: async () => JSON.stringify(data) }; });
  await until(() => document.elements.get('notice').textContent.includes('可先不填私钥'));
  const baseline = calls.length, bundle = bundleFixture();
  document.elements.get('bundle-file').files = [{ size: 1000, text: async () => JSON.stringify(bundle) }]; document.elements.get('bundle-file').dispatch('change');
  await until(() => document.elements.get('notice').textContent.includes('已进入离线回放'));
  assert.equal(document.elements.get('offline-banner').hidden, false); assert.equal(document.elements.get('connect-fields').disabled, true); assert.equal(document.elements.get('recheck').disabled, true);
  assert.equal(document.elements.get('task-outcome').textContent, '等待确认'); assert.equal(document.elements.get('download-bundle').disabled, false);
  document.elements.get('replay-start').click(); assert.equal(document.elements.get('event-count').textContent, '0'); document.elements.get('replay-step').click();
  assert.equal(document.elements.get('event-count').textContent, '1'); assert.ok(document.elements.get('event-detail').textContent.includes('<img src=x onerror=alert(1)>'));
  const svg = document.elements.get('graph-view').children[0], node = svg.children.find(n => n.class === 'tn-node'); assert.ok(node); node.dispatch('click');
  assert.ok(document.elements.get('graph-detail').textContent.includes('<script>bad</script>'));
  document.elements.get('graph-sources').children[0].click();
  for (const timer of timers) await timer();
  assert.equal(calls.length, baseline);
});
