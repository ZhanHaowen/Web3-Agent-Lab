import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const secretKey = /^(?:api[_-]?key|authorization|proxy[_-]?authorization|cookie|set[_-]?cookie|password|private[_-]?key|mnemonic|seed[_-]?phrase|identity[_-]?token|access[_-]?token|refresh[_-]?token)$/i;
const stringify = value => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? String(item) : item);
const sha = text => createHash('sha256').update(text).digest('hex');

/** Run at the final persistence boundary after its wallet/token redactor. */
export function finalizeModelCapture(payload, clean = value => value) {
  const value = clean(payload);
  if (value?.capture && typeof value.body === 'string') {
    value.capture = { ...value.capture, redacted: Boolean(value.capture.redacted || value.body !== payload.body), recordedBodySha256: sha(value.body) };
  }
  return value;
}

/** A second boundary before the existing recorder. No credentials/HTTP auth headers are recorded. */
export function modelRecordRedactor(model = {}) {
  const secrets = new Set();
  const collect = (value, depth = 0) => {
    if (depth > 12) return;
    if (typeof value === 'string' && /^[\s]*[\[{]/.test(value)) {
      try { collect(JSON.parse(value), depth + 1); } catch {}
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (secretKey.test(key) && typeof item === 'string' && item) secrets.add(item);
      else collect(item, depth + 1);
    }
  };
  let forms = [];
  const add = value => {
    collect(value);
    forms = [...new Set([...secrets].flatMap(value => {
      const out = [value];
      for (let n = 0; n < 3; n++) out.push(JSON.stringify(out.at(-1)).slice(1, -1));
      return out;
    }))].sort((a, b) => b.length - a.length);
  };
  add(model);
  const text = value => {
    for (const secret of forms) value = value.replaceAll(secret, '[REDACTED]');
    return value.replace(/("(?:api[_-]?key|authorization|proxy[_-]?authorization|cookie|set[_-]?cookie|password|private[_-]?key|mnemonic|seed[_-]?phrase|identity[_-]?token|access[_-]?token|refresh[_-]?token)"\s*:\s*)"(?:\\.|[^"\\])*"/gi, '$1"[REDACTED]"')
      .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
      .replace(/((?:api[_-]?key|private[_-]?key|mnemonic|password|access[_-]?token)\s*[=:]\s*)([^\s,;]+)/gi, '$1[REDACTED]');
  };
  const clean = value => {
    if (typeof value === 'string') return text(value);
    if (typeof value === 'bigint') return String(value);
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, secretKey.test(key) ? '[REDACTED]' : clean(item)]));
    return value;
  };
  return { clean, text, add };
}

export function normalizeModelMetadata(model = {}) {
  const provider = model.provider ?? 'api';
  if (!['api', 'local'].includes(provider)) throw new Error('MODEL_PROVIDER');
  return modelRecordRedactor(model).clean({
    provider, model: model.model ?? '',
    metadataSource: model.provider ? 'explicit_configuration' : 'legacy_default_api_unverified',
    localRuntime: provider === 'local' ? (model.localRuntime ?? null) : null,
    localRuntimeManifestPresent: provider === 'local' && Boolean(model.localRuntime?.modelSha256 && model.localRuntime?.runtimeSha256),
  });
}

/** Only supported, explicitly configured options enter the actual provider request. */
export function modelSamplingParameters(model = {}) {
  const fields = [
    ['temperature', 'temperature', 0, 2, false], ['maxOutputTokens', 'max_tokens', 1, 262144, true],
    ['topP', 'top_p', 0, 1, false], ['topK', 'top_k', 0, 1000000, true],
    ['repeatPenalty', 'repeat_penalty', 0, 10, false], ['seed', 'seed', -1, 2147483647, true],
  ];
  const out = {};
  for (const [key, wire, min, max, integer] of fields) {
    if (model[key] === undefined) continue;
    const n = model[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isSafeInteger(n))) throw new Error('MODEL_PARAMETER_' + key);
    out[wire] = n;
  }
  return out;
}

export function modelUsage(data, usable = true) {
  const source = data?.usage;
  const counts = {};
  for (const [key, raw] of [['promptTokens', 'prompt_tokens'], ['completionTokens', 'completion_tokens'], ['totalTokens', 'total_tokens']]) {
    const value = source?.[raw];
    counts[key] = usable && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  const known = Object.values(counts).filter(value => value !== null).length;
  return { status: !usable ? 'unavailable' : known === 3 ? 'reported' : known ? 'partial' : 'unknown', counts, source: 'provider_response', estimated: false };
}

/** Unknown usage is explicit; numeric counters remain a known subtotal for budgeting. */
export function recordUsage(costs, usage) {
  costs.usageUnknownCalls ??= 0;
  if (usage.status !== 'reported') { costs.usageComplete = false; costs.usageUnknownCalls++; }
  for (const [key, count] of Object.entries(usage.counts)) if (count !== null) costs[key] = (costs[key] ?? 0) + count;
  costs.usageAccounting = costs.usageComplete ? 'complete' : 'known_subtotal_only';
}

function endpoint(baseUrl) {
  const url = new URL(baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('MODEL_ENDPOINT');
  if (url.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('REMOTE_MODEL_REQUIRES_HTTPS');
  url.pathname = url.pathname.replace(/\/$/, '').replace(/\/chat\/completions$/, '') + '/chat/completions';
  return url.toString();
}

/**
 * One actual HTTP attempt, no hidden retries or cloud fallback. The original
 * UTF-8 HTTP entity text and parsed JSON are preserved, except identified secrets.
 * This captures provider output only, not an inferred internal reasoning process.
 * Recorder failures propagate; an unrecorded request is never sent.
 */
export async function capturedChatCompletion({ model, request, signal, emit, onAttempt = () => {}, onUsage = () => {}, modelCallId = randomUUID(), attempt = 1 }) {
  const backend = normalizeModelMetadata(model);
  const redact = modelRecordRedactor(model);
  const url = endpoint(model.baseUrl);
  if (backend.provider === 'local' && !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) throw new Error('LOCAL_MODEL_LOOPBACK_REQUIRED');
  const timeoutMs = model.requestTimeoutMs ?? 120000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 86400000) throw new Error('MODEL_REQUEST_TIMEOUT_RANGE');
  if (signal?.aborted) throw new Error('AGENT_CANCELLED');
  const body = stringify(request);
  redact.add(request);
  const recordedRequest = redact.text(body);
  const startedAt = new Date().toISOString();
  const common = { schemaVersion: '1.0', modelCallId, clientRequestId: modelCallId, attempt, provider: backend.provider, backend };
  const links = { modelCallId, attempt };
  const requestEvent = await emit('model.request', {
    ...common, endpoint: url, request: redact.clean(request), body: recordedRequest, bodyComplete: true,
    headers: { 'content-type': 'application/json' },
    capture: { representation: 'utf8-json-request', redacted: recordedRequest !== body, recordedBodySha256: sha(recordedRequest), bytesSent: Buffer.byteLength(body) },
    timing: { startedAt, requestTimeoutMs: timeoutMs },
  }, links);
  if (signal?.aborted) {
    await emit('model.error', { ...common, code: 'AGENT_CANCELLED', error: 'AGENT_CANCELLED', cancelled: true, timedOut: false, transportAttempted: false, timing: { startedAt, endedAt: new Date().toISOString(), durationMs: 0 }, usage: modelUsage(null, false) }, links, requestEvent);
    throw new Error('AGENT_CANCELLED');
  }
  onAttempt();
  const start = performance.now();
  const timeout = AbortSignal.timeout(timeoutMs);
  const activeSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response, responseText = '', receivedBytes = 0, firstByteMs = null;
  const timing = () => ({ startedAt, endedAt: new Date().toISOString(), durationMs: Math.round((performance.now() - start) * 1000) / 1000, firstByteMs });
  const read = async () => {
    response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(model.apiKey ? { Authorization: `Bearer ${model.apiKey}` } : {}) }, body, signal: activeSignal, redirect: 'error' });
    const decoder = new TextDecoder();
    if (response.body) {
      const reader = response.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (firstByteMs === null) firstByteMs = Math.round((performance.now() - start) * 1000) / 1000;
          receivedBytes += value.byteLength;
          responseText += decoder.decode(value, { stream: true });
        }
      } finally { responseText += decoder.decode(); reader.releaseLock(); }
    }
  };
  const responsePayload = (data, complete, parseError, usage) => {
    const cleanText = redact.text(responseText);
    const id = response.headers.get('x-request-id') ?? response.headers.get('request-id');
    return {
      ...common, status: response.status, requestId: id, providerRequestId: id,
      ...(data === undefined ? {} : { response: redact.clean(data) }), body: cleanText, bodyComplete: complete, parseError,
      headers: redact.clean({ 'content-type': response.headers.get('content-type'), 'x-request-id': id }),
      capture: { representation: 'utf8-decoded-http-entity', redacted: cleanText !== responseText, recordedBodySha256: sha(cleanText), bytesReceived: receivedBytes },
      timing: timing(), usage,
    };
  };
  try { await read(); }
  catch (error) {
    const usage = modelUsage(null, false);
    onUsage(usage);
    if (response) await emit('model.response', responsePayload(undefined, false, true, usage), links, requestEvent);
    const code = signal?.aborted ? 'AGENT_CANCELLED' : timeout.aborted ? 'MODEL_TIMEOUT' : 'MODEL_TRANSPORT_ERROR';
    await emit('model.error', { ...common, code, error: redact.text(error instanceof Error ? error.message : String(error)), cancelled: Boolean(signal?.aborted), timedOut: timeout.aborted, timing: timing(), usage, responseReceived: Boolean(response), bodyComplete: false }, links, requestEvent);
    throw new Error(code);
  }
  let data, parseError = false;
  try { data = JSON.parse(responseText); } catch { parseError = true; }
  if (!parseError) redact.add(data);
  const usage = modelUsage(data, response.ok && !parseError);
  onUsage(usage);
  const responseEvent = await emit('model.response', responsePayload(data, true, parseError, usage), links, requestEvent);
  if (!response.ok || parseError) {
    const code = !response.ok ? `MODEL_HTTP_${response.status}` : `MODEL_INVALID_JSON_HTTP_${response.status}`;
    await emit('model.error', { ...common, code, error: code, cancelled: false, timedOut: false, timing: timing(), usage, responseReceived: true, bodyComplete: true }, links, responseEvent ?? requestEvent);
    throw new Error(code);
  }
  return { data, modelCallId, requestEvent, responseEvent, usage };
}
