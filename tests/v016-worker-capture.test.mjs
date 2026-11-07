import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { tsImport } from 'tsx/esm/api';
import { Scenario } from '../src/scenario/service.mjs';
import { RemoteAgent } from '../src/control/scene.mjs';
import { LabControl } from '../src/control/control.mjs';
import { ControlStore } from '../src/control/store.mjs';
import { handle } from '../src/control/routes.mjs';
import { runRecordedDecision } from '../src/model/worker-decisions.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const secret = 'test mnemonic secret';
const clean = value => JSON.parse(JSON.stringify(value).replaceAll(secret, '[REDACTED]'));
const payload = () => ({ modelCallId: 'call-1', provider: 'local', body: 'native ' + secret, bodyComplete: true, capture: { recordedBodySha256: sha('native ' + secret), redacted: false } });
function validate(value) { assert.equal(value.body, 'native [REDACTED]'); assert.equal(value.capture.redacted, true); assert.equal(value.capture.recordedBodySha256, sha(value.body)); }
async function folder(t) { const dir = await mkdtemp(join(tmpdir(), 'lab-capture-test-')); t.after(() => rm(dir, { recursive: true, force: true })); return dir; }

test('legacy on-disk recorder hashes the final redacted body and its content-addressed blob', async t => {
  const { Recorder, Redactor, readEvents, verifyRun } = await tsImport('../vendor/legacy-source/src/store.ts', import.meta.url);
  const dir = await folder(t), redactor = new Redactor(); redactor.add(secret);
  const recorder = new Recorder(dir, redactor); await recorder.start({ mode: 'llm' });
  await recorder.emit('model.response', payload()); await recorder.seal();
  const events = await readEvents(dir, recorder.runId); validate(events.at(-1).payload);
  assert.equal((await verifyRun(dir, recorder.runId)).valid, true);
});

test('scenario file recorder stores final redaction hashes and matching raw blob references', async t => {
  const dir = await folder(t), scene = Object.create(Scenario.prototype);
  Object.assign(scene, { id: 'scenario-test', episodeId: 'episode-test', folder: dir, events: [], files: {}, clean });
  const event = await scene.appendEvent('model.response', payload());
  const text = await readFile(join(dir, event.payloadRef.path), 'utf8'); validate(JSON.parse(text));
  assert.equal(sha(text), event.payloadRef.sha256); assert.equal(scene.files[event.payloadRef.path], text);
});

test('controller events and worker event ingestion use final stored body hashes and replay idempotently', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'lab-capture-db-test-')), store = new ControlStore(dir);
  t.after(async () => { store.close(); await rm(dir, { recursive: true, force: true }); });
  const control = Object.create(LabControl.prototype), scene = { id: 'execution-1', episodeId: 'execution-1', bindings: {}, events: [], files: {} };
  Object.assign(control, { store, b: { clean }, persist() {} });
  const event = control.appendControlEvent(scene, 'model.request', payload());
  const row = store.events(scene.id)[0]; validate(JSON.parse(row.text)); assert.equal(scene.files[event.payloadRef.path], row.text);
  const actor = { agentId: 'worker-a', epoch: 1 };
  store.put('executions', 'execution-2', { id: 'execution-2', state: 'running', bindings: { maker: { agentId: actor.agentId, agentRunId: 'agent-run', role: 'maker', epoch: 1 } } });
  store.put('leases', 'execution-2:maker', { revoked: false });
  let sent;
  const context = { init: async () => {}, b: { url: 'http://127.0.0.1:4317', clean, send: (_res, status, value) => { sent = { status, value }; } }, auth: () => actor, store, scenes: new Map(), fault() {} };
  const body = { executionId: 'execution-2', agentRunId: 'agent-run', leaseEpoch: 1, type: 'model.response', seq: 1, streamId: 'worker-a:agent-run', eventId: 'native-event', payload: payload(), causes: [] };
  const req = { method: 'POST', headers: {}, url: '/api/v2/agent/events' };
  await handle.call(context, req, {}, req.url, body); assert.equal(sent.status, 200);
  await handle.call(context, req, {}, req.url, body); assert.equal(sent.status, 200);
  const records = store.events('execution-2'); assert.equal(records.length, 1); validate(JSON.parse(records[0].text));
});

test('failed worker decisions preserve counted attempts across result-delivery retry and process restart', async () => {
  let serialized, attempts = 0;
  const runtime = { state: { costs: { modelCalls: 0, usageComplete: true } }, decisions: {}, failures: {} };
  const operation = async () => { attempts++; runtime.state.costs = { modelCalls: 1, totalTokens: 0, usageComplete: false, usageUnknownCalls: 1 }; throw Error('MODEL_TIMEOUT ' + secret); };
  const persist = async value => { serialized = JSON.stringify(value); };
  await assert.rejects(runRecordedDecision(runtime, 'command-1', operation, persist, clean), error => error.message === 'MODEL_TIMEOUT [REDACTED]' && error.modelCosts.modelCalls === 1);
  // A failed HTTP ACK must re-send the saved error without another model call.
  await assert.rejects(runRecordedDecision(runtime, 'command-1', operation, persist, clean), /MODEL_TIMEOUT/);
  const restored = JSON.parse(serialized);
  await assert.rejects(runRecordedDecision(restored, 'command-1', operation, persist, clean), error => error.modelCosts.usageUnknownCalls === 1);
  assert.equal(attempts, 1); assert.doesNotMatch(serialized, /test mnemonic secret/);
  assert.equal(restored.state.costs.modelCalls, 1);
});

test('successful worker decisions are reused after delivery retry', async () => {
  const runtime = { state: {}, decisions: {}, failures: {} }; let attempts = 0;
  const operation = async () => { attempts++; return { call: { name: 'approve_buy' }, costs: { modelCalls: 1 } }; };
  const first = await runRecordedDecision(runtime, 'command-2', operation, async () => {});
  const second = await runRecordedDecision(JSON.parse(JSON.stringify(runtime)), 'command-2', operation, async () => {});
  assert.deepEqual(second, first); assert.equal(attempts, 1);
});

test('remote Agent receives failed model attempt costs while retaining its controller-owned tool counter', async () => {
  const spec = { agentId: 'maker', role: 'maker', model: {}, tools: [], maxModelCalls: 20, maxTokens: 1000 };
  const control = { lease() {}, pendingDecision: () => ({ id: 'command-3' }), awaitCommand: async () => { throw Object.assign(Error('MODEL_TIMEOUT'), { modelCosts: { modelCalls: 1, toolCalls: 0, usageComplete: false, totalTokens: 0, usageUnknownCalls: 1 } }); } };
  const agent = new RemoteAgent(control, { agentId: 'profile-a', agentRunId: 'agent-run', address: 'address' }, spec); agent.costs.toolCalls = 4;
  await assert.rejects(agent.step({ id: 'execution-3' }), /MODEL_TIMEOUT/);
  assert.equal(agent.costs.modelCalls, 1); assert.equal(agent.costs.toolCalls, 4); assert.equal(agent.costs.usageComplete, false);
});
