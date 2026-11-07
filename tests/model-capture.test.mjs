import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { capturedChatCompletion, modelSamplingParameters, modelUsage, modelRecordRedactor, recordUsage, finalizeModelCapture } from '../src/model/capture.mjs';
import { AgentRuntime } from '../src/scenario/agent-runtime.mjs';
import { normalize } from '../src/scenario/core.mjs';

async function fixture(t, handler) {
  const received = [];
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    received.push({ body, authorization: req.headers.authorization, path: req.url });
    await handler(req, res, body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  return { baseUrl: `http://127.0.0.1:${server.address().port}/v1`, received };
}
function recorder() {
  const events = [], costs = { modelCalls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, usageComplete: true };
  return { events, costs, callbacks: {
    emit: async (type, payload, links, cause) => { const e = { type, payload, links, cause: cause?.eventId, eventId: 'e' + events.length }; events.push(e); return e; },
    onAttempt: () => { costs.modelCalls++; }, onUsage: usage => recordUsage(costs, usage),
  } };
}
const request = { model: 'test-model', messages: [{ role: 'user', content: 'Read balance' }], stream: false };
const completion = { id: 'response-1', model: 'served-model', choices: [{ message: { role: 'assistant', content: 'done', reasoning_content: 'Only text actually supplied by fixture' } }], usage: { prompt_tokens: 11, completion_tokens: 3, total_tokens: 14 } };

test('remote API preserves exact original request and response entities, native extra fields, IDs and usage', async t => {
  const raw = '  ' + JSON.stringify(completion, null, 2) + '\n';
  const service = await fixture(t, (_req, res) => { res.setHeader('x-request-id', 'upstream-1'); res.setHeader('set-cookie', 'secret-cookie'); res.end(raw); });
  const r = recorder();
  const value = await capturedChatCompletion({ model: { baseUrl: service.baseUrl, model: 'test-model', apiKey: 'private-key-test' }, request, ...r.callbacks });
  const [a, b] = r.events;
  assert.equal(a.payload.body, service.received[0].body);
  assert.equal(b.payload.body, raw); assert.deepEqual(b.payload.response, completion);
  assert.equal(a.payload.provider, 'api'); assert.equal(a.payload.backend.metadataSource, 'legacy_default_api_unverified');
  assert.equal(b.payload.modelCallId, a.payload.modelCallId); assert.equal(b.payload.clientRequestId, a.payload.clientRequestId);
  assert.equal(b.payload.providerRequestId, 'upstream-1'); assert.equal(b.cause, a.eventId);
  assert.equal(b.payload.capture.recordedBodySha256, createHash('sha256').update(raw).digest('hex'));
  assert.equal(b.payload.capture.bytesReceived, Buffer.byteLength(raw)); assert.equal(b.payload.bodyComplete, true);
  assert.ok(b.payload.timing.durationMs >= 0); assert.equal(value.data.choices[0].message.reasoning_content, completion.choices[0].message.reasoning_content);
  assert.equal(r.costs.modelCalls, 1); assert.equal(r.costs.totalTokens, 14); assert.equal(r.costs.usageComplete, true);
  assert.equal(service.received[0].authorization, 'Bearer private-key-test');
  assert.doesNotMatch(JSON.stringify(r.events), /private-key-test|secret-cookie/);
});

test('local metadata pins actual assets and sampling options without authenticating to the service', async t => {
  const service = await fixture(t, (_req, res) => res.end(JSON.stringify(completion))), r = recorder();
  const runtime = { modelSha256: 'a'.repeat(64), runtimeSha256: 'b'.repeat(64), templateSha256: 'c'.repeat(64), settings: { contextSize: 16384, reasoning: 'off' }, apiKey: 'unexpected-secret' };
  const model = { provider: 'local', baseUrl: service.baseUrl, model: 'test-model', localRuntime: runtime, maxOutputTokens: 768, temperature: 0, topP: 0.8, topK: 20, seed: 42, repeatPenalty: 1.1 };
  await capturedChatCompletion({ model, request: { ...request, ...modelSamplingParameters(model) }, ...r.callbacks });
  assert.equal(service.received[0].authorization, undefined);
  const sent = JSON.parse(service.received[0].body); assert.equal(sent.max_tokens, 768); assert.equal(sent.top_p, 0.8); assert.equal(sent.top_k, 20); assert.equal(sent.repeat_penalty, 1.1); assert.equal(sent.seed, 42);
  assert.equal(r.events[0].payload.backend.localRuntimeManifestPresent, true); assert.equal(r.events[0].payload.backend.localRuntime.templateSha256, runtime.templateSha256);
  assert.doesNotMatch(JSON.stringify(r.events), /unexpected-secret/);
});

test('non-JSON response retains complete original entity and marks usage unknown', async t => {
  const raw = '<html>model unavailable 中文</html>\n';
  const service = await fixture(t, (_req, res) => res.end(raw)), r = recorder();
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl }, request, ...r.callbacks }), /MODEL_INVALID_JSON_HTTP_200/);
  const response = r.events.find(e => e.type === 'model.response'); assert.equal(response.payload.body, raw); assert.equal(response.payload.parseError, true); assert.equal(response.payload.bodyComplete, true);
  assert.equal(r.costs.modelCalls, 1); assert.equal(r.costs.usageComplete, false); assert.equal(r.costs.usageUnknownCalls, 1);
});

test('HTTP failures keep raw error and provider usage, but never count error usage as a successful subtotal', async t => {
  const raw = JSON.stringify({ error: { message: 'rate limited' }, usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
  const service = await fixture(t, (_req, res) => { res.statusCode = 429; res.end(raw); }), r = recorder();
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl }, request, ...r.callbacks }), /MODEL_HTTP_429/);
  assert.equal(service.received.length, 1); assert.equal(r.costs.modelCalls, 1); assert.equal(r.costs.totalTokens, 0); assert.equal(r.costs.usageComplete, false);
  const response = r.events.find(e => e.type === 'model.response'); assert.equal(response.payload.body, raw); assert.equal(response.payload.response.usage.total_tokens, 2); assert.equal(response.payload.usage.status, 'unavailable');
});

test('timeout counts an attempted request and preserves a partially received body', async t => {
  const service = await fixture(t, (_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.write('{"partial":"received"'); }), r = recorder();
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl, requestTimeoutMs: 100 }, request, ...r.callbacks }), /MODEL_TIMEOUT/);
  assert.equal(r.costs.modelCalls, 1); assert.equal(r.costs.usageComplete, false);
  const partial = r.events.find(e => e.type === 'model.response'); assert.equal(partial.payload.body, '{"partial":"received"'); assert.equal(partial.payload.bodyComplete, false);
  const error = r.events.find(e => e.type === 'model.error'); assert.equal(error.payload.timedOut, true); assert.equal(error.payload.cancelled, false);
});

test('cancellation has a distinct result and an already-cancelled call sends no request', async t => {
  const controller = new AbortController();
  const service = await fixture(t, () => controller.abort()), r = recorder();
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl }, request, signal: controller.signal, ...r.callbacks }), /AGENT_CANCELLED/);
  assert.equal(r.costs.modelCalls, 1); assert.equal(r.events.at(-1).payload.cancelled, true); assert.equal(r.events.at(-1).payload.timedOut, false);
  const next = recorder();
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl }, request, signal: controller.signal, ...next.callbacks }), /AGENT_CANCELLED/);
  assert.equal(next.events.length, 0); assert.equal(next.costs.modelCalls, 0); assert.equal(service.received.length, 1);
});

test('secrets are redacted in raw strings, escaped nested strings, parsed fields and error events', async t => {
  const secret = 'secret-with-"quote\\newline\n';
  const payload = { ...completion, apiKey: 'response-secret-unconfigured', note: secret, nested: JSON.stringify({ echo: secret, privateKey: 'unknown-nested-private-credential' }), echoedNestedSecret: 'unknown-nested-private-credential' };
  const service = await fixture(t, (_req, res) => res.end(JSON.stringify(payload))), r = recorder();
  // Authentication has header restrictions, so model metadata also covers arbitrary configured credentials.
  await capturedChatCompletion({ model: { baseUrl: service.baseUrl, localRuntime: { privateKey: secret } }, request: { ...request, messages: [{ role: 'user', content: secret }] }, ...r.callbacks });
  const text = JSON.stringify(r.events); assert.doesNotMatch(text, /response-secret-unconfigured|secret-with|unknown-nested-private-credential/);
  assert.equal(r.events[0].payload.capture.redacted, true); assert.equal(r.events[1].payload.capture.redacted, true);
  assert.equal(JSON.parse(r.events[1].payload.body).apiKey, '[REDACTED]');
  assert.equal(modelRecordRedactor().clean({ token: 'A', total_tokens: 4 }).token, 'A');
});

test('recording failure prevents network side effects', async t => {
  const service = await fixture(t, (_req, res) => res.end('{}')); let count = 0;
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl }, request, onAttempt: () => count++, emit: async () => { throw Error('RECORDING_FAILED'); } }), /RECORDING_FAILED/);
  assert.equal(count, 0); assert.equal(service.received.length, 0);
});

test('recorded-body digest follows any final wallet redaction, rather than the pre-recorder entity', () => {
  const payload = { body: 'balance test secret mnemonic sk-fixture123456789', capture: { redacted: false, recordedBodySha256: 'pre-redaction' } };
  const clean = value => JSON.parse(JSON.stringify(value).replaceAll('test secret mnemonic', '[REDACTED]').replaceAll('sk-fixture123456789', '[REDACTED]'));
  const stored = finalizeModelCapture(payload, clean);
  assert.equal(stored.body, 'balance [REDACTED] [REDACTED]'); assert.equal(stored.capture.redacted, true);
  assert.equal(stored.capture.recordedBodySha256, createHash('sha256').update(stored.body).digest('hex'));
  assert.equal(finalizeModelCapture(stored, clean).capture.recordedBodySha256, stored.capture.recordedBodySha256);
});

test('cancellation during durable request recording is explicit and performs no transport attempt', async t => {
  const service = await fixture(t, (_req, res) => res.end('{}')), r = recorder(), controller = new AbortController();
  await assert.rejects(capturedChatCompletion({ model: { baseUrl: service.baseUrl }, request, signal: controller.signal, ...r.callbacks,
    emit: async (...args) => { const event = await r.callbacks.emit(...args); if (args[0] === 'model.request') controller.abort(); return event; },
  }), /AGENT_CANCELLED/);
  assert.equal(r.costs.modelCalls, 0); assert.equal(service.received.length, 0); assert.equal(r.events.at(-1).payload.transportAttempted, false);
});

test('invalid local remote endpoint and invalid sampling parameters fail before attempting inference', async () => {
  const r = recorder();
  await assert.rejects(capturedChatCompletion({ model: { provider: 'local', baseUrl: 'https://example.com/v1' }, request, ...r.callbacks }), /LOCAL_MODEL_LOOPBACK_REQUIRED/);
  assert.equal(r.costs.modelCalls, 0);
  for (const value of [NaN, -1, '768', 0]) assert.throws(() => modelSamplingParameters({ maxOutputTokens: value }), /MODEL_PARAMETER/);
  assert.equal(modelUsage({ usage: { prompt_tokens: 3 } }).status, 'partial');
  assert.equal(modelUsage({ usage: { prompt_tokens: 3.5, completion_tokens: -1 } }).status, 'unknown');
});

test('multi-agent timeout budget increments before fetch and native error can be traced to its request', async t => {
  const service = await fixture(t, () => {});
  const spec = normalize({ mode: 'llm', agents: [{ model: { baseUrl: service.baseUrl, model: 'test-model' } }, { model: { baseUrl: service.baseUrl, model: 'test-model' } }] });
  spec.agents[0].model.requestTimeoutMs = 80;
  const agent = new AgentRuntime(spec.agents[0]), events = [];
  const context = { spec, abort: new AbortController(), bus: { receive: async () => [] }, progress: () => ({ allowedActions: ['wait'] }), emit: async (type, payload, actor, causes) => { const e = { eventId: 'e' + events.length, type, payload, causes }; events.push(e); return e; } };
  await assert.rejects(agent.step(context), /MODEL_TIMEOUT/);
  assert.equal(agent.costs.modelCalls, 1); assert.equal(agent.costs.usageComplete, false);
  assert.equal(events.at(-1).type, 'model.error'); assert.deepEqual(events.at(-1).causes, [events.find(e => e.type === 'model.request').eventId]);
});

test('scenario normalization retains both backends and configured local manifest without changing task goals', () => {
  const model = { provider: 'local', baseUrl: 'http://127.0.0.1:8495/v1', model: 'qwen', maxOutputTokens: 768, seed: 42, localRuntime: { modelSha256: 'a'.repeat(64) } };
  const spec = normalize({ mode: 'llm', agents: [{ model }, { model: { ...model, provider: 'api' } }] });
  assert.equal(spec.agents[0].model.provider, 'local'); assert.equal(spec.agents[1].model.provider, 'api'); assert.equal(spec.agents[0].model.maxOutputTokens, 768); assert.deepEqual(spec.agents[0].model.localRuntime, model.localRuntime);
  assert.deepEqual(spec.agents[0].goal, { sellAmount: '10', minBuy: '20' });
});
