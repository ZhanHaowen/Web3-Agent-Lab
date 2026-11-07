import test from 'node:test';
import assert from 'node:assert/strict';
import { Scenario } from '../src/scenario/service.mjs';
import { LabControl } from '../src/control/control.mjs';
import { RemoteAgent } from '../src/control/scene.mjs';
import { builtins, jobSpec } from '../src/control/tasks.mjs';

test('local worker model validation is applied only to LLM tasks and fails closed on missing identity', () => {
  const calls = [], context = { b: { assertLocalModel: model => calls.push(model) } };
  const binding = { provider: 'local', localRuntime: { ownerId: 'owned' } };
  LabControl.prototype.assertAgentModel.call(context, { provider: 'local', localModelBinding: binding }, 'llm');
  assert.deepEqual(calls, [binding]);
  LabControl.prototype.assertAgentModel.call(context, { provider: 'local' }, 'scripted');
  LabControl.prototype.assertAgentModel.call(context, { provider: 'api' }, 'llm');
  assert.equal(calls.length, 1);
  assert.throws(() => LabControl.prototype.assertAgentModel.call(context, { provider: 'local' }, 'llm'), /LOCAL_MODEL_WORKER_BINDING_MISSING/);
});

test('stale local worker is refused before any step command is dispatched', async () => {
  let dispatched = false;
  const actor = { profileId: 'local-worker', resultCommands: [], control: {
    lease() {}, agent: () => ({ provider: 'local' }),
    assertAgentModel() { throw Error('LOCAL_MODEL_WORKER_SESSION_STALE'); },
    command() { dispatched = true; },
  } };
  await assert.rejects(RemoteAgent.prototype.step.call(actor, { spec: { mode: 'llm' } }), /LOCAL_MODEL_WORKER_SESSION_STALE/);
  assert.equal(dispatched, false);
});

function scene(mode, capture) {
  const events = [], value = { spec: { mode }, agents: [{ spec: { model: { provider: 'local', localRuntime: { ownerId: 'owned' } } } }],
    service: { b: { captureRuntimeEvidence: capture } }, emitQueue: Promise.resolve(),
    async appendEvent(type, payload) { const event = { type, payload }; events.push(event); return event; } };
  value.emit = (...args) => Scenario.prototype.emit.call(value, ...args);
  return { value, events };
}
test('scenario finish persists native runtime evidence before its terminal event', async () => {
  const { value, events } = scene('llm', async models => ({ ownerId: models[0].localRuntime.ownerId, files: [{ role: 'props', content: 'e30=' }] }));
  await value.emit('scenario.finished', { state: 'completed' });
  assert.deepEqual(events.map(event => event.type), ['model.runtime_evidence', 'scenario.finished']);
  assert.equal(events[0].payload.ownerId, 'owned');
});
test('scripted scenario never requests local inference or runtime evidence', async () => {
  const { value, events } = scene('scripted', async () => { throw Error('must not invoke'); });
  await value.emit('scenario.finished', { state: 'completed' });
  assert.deepEqual(events.map(event => event.type), ['scenario.finished']);
});
test('missing local runtime evidence blocks a misleading completed archive', async () => {
  const { value, events } = scene('llm', async () => null);
  await assert.rejects(value.emit('scenario.finished', { state: 'completed' }), /LOCAL_RUNTIME_EVIDENCE_UNAVAILABLE/);
  assert.equal(events.length, 0);
});

test('task-center legacy templates reject LLM labels rather than silently recording scripted execution', () => {
  const resolveTask = (id, fields) => ({ id, ...fields });
  for (const definition of builtins().filter(item => item.taskType !== 'peer_swap')) {
    assert.throws(() => jobSpec({ mode: 'llm' }, definition, resolveTask), /UNSUPPORTED_LEGACY_LLM_MODE/);
    for (const mode of ['anything', '', null, 0, false, {}]) assert.throws(() => jobSpec({ mode }, definition, resolveTask), /INVALID_LEGACY_MODE/);
    assert.equal(jobSpec({}, definition, resolveTask).runtimeSpec.mode, 'scripted');
    assert.equal(jobSpec({ mode: 'scripted' }, definition, resolveTask).runtimeSpec.mode, 'scripted');
  }
  const peer = builtins().find(item => item.taskType === 'peer_swap');
  assert.equal(jobSpec({ input: { mode: 'llm' } }, peer, resolveTask).runtimeSpec.mode, 'llm');
});
