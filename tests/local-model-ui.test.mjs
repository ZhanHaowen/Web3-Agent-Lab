import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function element(tag) {
  return { tag, value: '', hidden: false, disabled: false, readOnly: false, children: [], events: {}, classList: { add() {} },
    setAttribute(name, value) { this[name] = value; }, append(...nodes) { this.children.push(...nodes); }, prepend(...nodes) { this.children.unshift(...nodes); },
    after(node) { this.afterNode = node; }, replaceChildren(...nodes) { this.children = nodes; },
    addEventListener(name, fn) { this.events[name] = fn; }, closest() { return this.label; } };
}
function load(name) {
  const window = {}, document = { createElement: element, createTextNode: text => ({ textContent: text }) };
  vm.runInNewContext(readFileSync(new URL('../public/' + name, import.meta.url), 'utf8'), { window, document, console });
  return window;
}
test('local model selection excludes API credentials and restores remote model settings', () => {
  const { LabModelUI } = load('model-backend.js');
  const anchor = element('section'), modelInput = element('input'), urlInput = element('input'), keyInput = element('input');
  modelInput.value = 'remote-model'; urlInput.value = 'https://provider.example/v1'; keyInput.value = 'secret-for-test';
  urlInput.label = element('label'); keyInput.label = element('label');
  const binding = LabModelUI.bind({ id: 'test', anchor, modelInput, urlInput, keyInput });
  const select = anchor.children[0].children[0]; select.value = 'api';
  assert.equal(binding.read().apiKey, 'secret-for-test');
  select.value = 'local'; select.events.change();
  const local = binding.read({ temperature: 0, apiKey: 'must-not-leak', baseUrl: 'https://bad.example' });
  assert.equal(local.provider, 'local'); assert.equal(local.model, LabModelUI.LOCAL_MODEL);
  assert.equal('apiKey' in local, false); assert.equal('baseUrl' in local, false);
  assert.equal(urlInput.disabled, true); assert.equal(keyInput.label.hidden, true);
  assert.equal(JSON.stringify(binding.credentials({ provider: 'local' })), '{}');
  select.value = 'api'; select.events.change();
  assert.equal(modelInput.value, 'remote-model'); assert.equal(urlInput.disabled, false);
  assert.equal(binding.read().apiKey, 'secret-for-test');
});
test('model evidence retains exact native body text and explicit missing references without importing derived graph', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const request = { seq: 1, type: 'model.request', payload_ref: { path: 'blobs/request.json' } };
  const response = { seq: 2, type: 'model.response', payload_ref: { path: 'blobs/missing.json' } };
  const payloadText = JSON.stringify({ body: '{\n  "x": 1\n}', modelCallId: 'call-1', capture: { redacted: false } }, null, 3);
  const eventText = [request, response, { type: 'tool.result' }].map(JSON.stringify).join('\n') + '\n';
  const result = LabModelEvidence.collect({ bundle: { run_id: 'r1', files: { 'events.jsonl': eventText, 'blobs/request.json': payloadText, 'derived/graph.json': '{"fabricated":true}', 'manifest.json': '{}' } } });
  assert.equal(result.events.length, 2); assert.equal(result.files['blobs/request.json'], payloadText); assert.equal(result.files['events.jsonl'], eventText);
  assert.equal(result.events[0].payload.body, '{\n  "x": 1\n}');
  assert.equal(result.missing[0].path, 'blobs/missing.json'); assert.equal(result.events[1].payload.unavailable, 'payload_not_collected_or_not_in_bundle');
  assert.equal('derived/graph.json' in result.files, false);
});
test('legacy views remain explicit about unavailable original files; no inferred request or response', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const result = LabModelEvidence.collect({ events: [{ type: 'tool.result', payload: {} }, { type: 'model.error', payload: { error: 'TIMEOUT' } }] });
  assert.equal(result.source, 'event_view_only'); assert.equal(result.coverage.hasRequest, false); assert.equal(result.coverage.hasResponse, false); assert.equal(result.events.length, 1);
});
test('payload tool argument paths are not mistaken for evidence file references', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const result = LabModelEvidence.collect({ events: [{ type: 'model.request', payload: { request: { arguments: { path: '/user/task/path' } } } }] });
  assert.equal(result.missing.length, 0);
});
test('partial native HTTP bodies retain their exact prefix and explicit incomplete status', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const prefix = '{"choices":[{"message":';
  const result = LabModelEvidence.collect({ events: [{ type: 'model.response', payload: { body: prefix, bodyComplete: false, error: 'RESPONSE_INTERRUPTED' } }] });
  assert.equal(result.events[0].payload.body, prefix); assert.equal(result.coverage.partialBodies, 1); assert.equal(result.coverage.recordedBodies, 1);
});
test('local weight and runtime disk fingerprints are external metadata, not missing bundle evidence', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const payload = { body: '{}', backend: { localRuntime: { modelAsset: { path: 'C:\\models\\qwen.gguf', sha256: 'model-sha' }, runtime: { path: '/opt/llama/llama-server', sha256: 'runtime-sha', dependencies: [{ path: 'C:\\llama\\ggml.dll', sha256: 'dll-sha' }] } } } };
  const result = LabModelEvidence.collect({ bundle: { files: { 'events.jsonl': JSON.stringify({ type: 'model.response', payload_ref: { path: 'blobs/body.json' } }) + '\n', 'blobs/body.json': JSON.stringify(payload) } } });
  assert.equal(result.missing.length, 0); assert.equal(result.externalFingerprints.length, 3); assert.equal(Object.keys(result.files).length, 2);
  assert.equal(result.externalFingerprints[0].status, 'external_fingerprint_not_embedded');
});
test('explicit unsafe external payload references are rejected without attempting a fetch', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const result = LabModelEvidence.collect({ events: [{ type: 'model.response', payloadRef: { path: 'https://external.invalid/body' } }] });
  assert.equal(result.missing[0].reason, 'unsafe_or_external_bundle_reference'); assert.equal(result.externalFingerprints.length, 0);
});
test('both original event naming schemes and malformed event lines are preserved as limitations', () => {
  const { LabModelEvidence } = load('model-evidence.js');
  const result = LabModelEvidence.collect({ bundle: { files: { 'raw/events.jsonl': '{"type":"model.response","payloadRef":{"path":"raw/body.json"}}\nnot-json\n', 'raw/body.json': '{"body":"<html>upstream failed</html>"}' } } });
  assert.equal(result.events[0].payload.body, '<html>upstream failed</html>'); assert.equal(result.missing[0].reason, 'invalid_json');
});
test('every current model configuration page loads shared backend/evidence controls before its own script', () => {
  for (const [page, script] of [['index.html','app.js'],['tasks.html','task-center.js'],['scenarios.html','scenario.js'],['services.html','service-ui.js']]) {
    const text = readFileSync(new URL('../public/' + page, import.meta.url), 'utf8');
    assert.ok(text.indexOf('/model-backend.js') < text.indexOf('/' + script));
    assert.ok(text.includes('id="model-native-evidence"')); assert.ok(text.includes('/local-model.html'));
  }
});
