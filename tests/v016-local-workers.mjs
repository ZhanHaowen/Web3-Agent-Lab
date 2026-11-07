/** Real independent Agent processes; connects to an already started owned platform. */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { artifactDirectory } from './helpers/artifacts.mjs';
import { verifyBundle } from '../src/control/offline.mjs';
import { checkPeer } from '../src/control/checker.mjs';
import { DEFAULT_ASSET } from '../src/local-model/service.mjs';

const args = process.argv.slice(2), get = (flag, fallback) => { const i = args.indexOf(flag); return i < 0 ? fallback : args[i + 1]; };
if (args.includes('--help')) {
  console.log('LAB_TEST_BASE_URL=http://127.0.0.1:4531 LAB_TEST_DATA_DIR=<private server data> node tests/v016-local-workers.mjs [--out <fresh folder>] [--only both|local-local|local-api-fixture] [--case-timeout-ms 900000]');
  console.log('Requires a ready, managed Qwen3 4B service. Does not start/stop the platform, chain, or inference server. Stops only the workers it provisions.');
  process.exit(0);
}
const root = resolve(fileURLToPath(new URL('..', import.meta.url))), url = process.env.LAB_TEST_BASE_URL;
if (!url || !/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(url)) throw Error('LAB_TEST_BASE_URL_LOOPBACK_REQUIRED');
const data = process.env.LAB_TEST_DATA_DIR ? resolve(process.env.LAB_TEST_DATA_DIR) : null;
if (!data) throw Error('LAB_TEST_DATA_DIR_REQUIRED_FOR_ADMIN_AND_SECRET_LEAK_VERIFICATION');
const only = get('--only', 'both'), timeoutMs = Number(get('--case-timeout-ms', '900000'));
if (!['both', 'local-local', 'local-api-fixture'].includes(only) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1000) throw Error('INVALID_OPTIONS');
const out = resolve(get('--out', artifactDirectory('v016-local-workers-' + Date.now())));
await mkdir(out, { recursive: true });
const resultFile = join(out, 'results.json');
if (await stat(resultFile).then(() => true, e => { if (e.code === 'ENOENT') return false; throw e; })) throw Error('USE_FRESH_OUTPUT_DIRECTORY');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), sha = bytes => createHash('sha256').update(bytes).digest('hex');
let token = '', admin = (await readFile(join(data, 'control-admin.token'), 'utf8')).trim();
const batch = { schemaVersion: 1, test: 'v016-independent-local-workers', startedAt: new Date().toISOString(), platformUrl: url,
  independentWorkerProcessesRequired: true, noScriptedFallback: true, fixtureIsNotCommercialLLM: true, platformAndInferenceOwnership: 'external test coordinator; this runner never stops them', cases: [] };
const save = () => writeFile(resultFile, JSON.stringify(batch, null, 2) + '\n');
async function api(path, body, allowError = false) {
  const response = await fetch(url + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Token': token, 'X-Control-Admin': admin, 'Idempotency-Key': randomUUID() }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60000) });
  const value = await response.json();
  if (!response.ok && !allowError) throw Error(path + ' HTTP_' + response.status + ' ' + (value.error ?? JSON.stringify(value)));
  return allowError ? { status: response.status, value } : value;
}
function add(row, id, condition, detail = null) { row.assertions.push({ id, passed: !!condition, detail }); }
async function startFixture() {
  const key = 'protocol-fixture-' + randomUUID(), requests = [], responses = [];
  let authorizationMatches = true;
  const server = createServer(async (req, res) => {
    try {
      let raw = ''; for await (const chunk of req) raw += chunk;
      authorizationMatches &&= req.headers.authorization === 'Bearer ' + key;
      const request = JSON.parse(raw), initial = JSON.parse(request.messages.find(m => m.role === 'user').content);
      const progress = JSON.parse(request.messages.filter(m => m.role === 'user' && m.content.includes('platform_verified_progress')).at(-1).content);
      const inbox = request.messages.filter(m => m.role === 'user').flatMap(m => {
        try { const value = JSON.parse(m.content); return value.source === 'inbox' ? value.messages ?? [] : []; } catch { return []; }
      });
      // The controller's progress snapshot may precede consumption of this
      // turn's inbox. Accept the actual received quote, never invent an ID.
      const receivedQuote = inbox.filter(m => m.kind === 'quote' && m.sender === 'maker').at(-1);
      const quote = progress.quote ?? (receivedQuote ? { ...receivedQuote.payload, quoteId: receivedQuote.quoteId } : null);
      const used = request.messages.filter(m => m.role === 'assistant').flatMap(m => m.tool_calls ?? []).map(call => call.function.name);
      let name = 'wait', args = {};
      if (!quote) { name = 'send_message'; args = { recipient: 'maker', kind: 'inquiry' }; }
      else if (!progress.mutualAcceptance) { name = 'send_message'; args = { recipient: 'maker', kind: 'accept', quoteId: quote.quoteId }; }
      else if (progress.orderId) {
        if (!used.includes('inspect_order')) name = 'inspect_order';
        else if (!used.includes('approve_buy')) name = 'approve_buy';
        else name = 'fill_order';
      }
      requests.push({ body: raw, request, role: initial.role, authorizationMatches: req.headers.authorization === 'Bearer ' + key });
      const response = { id: 'fixture-' + requests.length, model: 'api-protocol-fixture-not-an-llm', choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'fixture-tool-' + requests.length, type: 'function', function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } };
      const body = JSON.stringify(response); responses.push({ body, response }); res.setHeader('Content-Type', 'application/json'); res.setHeader('x-request-id', response.id); res.end(body);
    } catch (error) { res.statusCode = 500; res.end(JSON.stringify({ error: { message: String(error.message) } })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { key, baseUrl: `http://127.0.0.1:${server.address().port}/v1`, requests, responses, authorizationMatches: () => authorizationMatches,
    close: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
function inspectBundle(row, bundle, state, runtime) {
  let events;
  try { ({ events } = verifyBundle(bundle)); add(row, 'export_manifest_event_and_blob_integrity', true); }
  catch (error) { add(row, 'export_manifest_event_and_blob_integrity', false, error.message); return; }
  const entries = events.map(event => ({ event, payload: JSON.parse(bundle.files[event.payloadRef.path]) }));
  const requests = entries.filter(x => x.event.type === 'model.request'), responses = entries.filter(x => x.event.type === 'model.response'), errors = entries.filter(x => x.event.type === 'model.error');
  row.modelRequests = requests.length; row.modelResponses = responses.length; row.modelErrors = errors.length;
  add(row, 'both_independent_workers_called_model', new Set(requests.map(x => x.event.agentId)).size === 2);
  add(row, 'model_attempt_counts_include_failed_calls', state.agents.every(a => a.costs.modelCalls === requests.filter(x => x.event.agentRunId === a.agentRunId).length));
  const nativeProblems = [];
  for (const { event, payload: p } of [...requests, ...responses]) {
    if (typeof p.body !== 'string' || sha(p.body) !== p.capture?.recordedBodySha256 || !p.modelCallId || !p.clientRequestId || p.attempt !== 1 || !p.timing) nativeProblems.push(event.eventId + ':native-envelope');
    if (event.type === 'model.request') {
      let parsed; try { parsed = JSON.parse(p.body); } catch {}
      if (JSON.stringify(parsed) !== JSON.stringify(p.request)) nativeProblems.push(event.eventId + ':body-json');
      if (!responses.some(x => x.payload.modelCallId === p.modelCallId && x.event.agentRunId === event.agentRunId) && !errors.some(x => x.payload.modelCallId === p.modelCallId && x.event.agentRunId === event.agentRunId)) nativeProblems.push(event.eventId + ':missing-terminal');
    } else if (!p.usage?.status || p.timing.durationMs < 0 || !Object.hasOwn(p, 'bodyComplete')) nativeProblems.push(event.eventId + ':response-envelope');
  }
  for (const { event, payload: p } of errors) {
    if (!p.modelCallId || !p.clientRequestId || !p.code || !p.usage?.status || typeof p.cancelled !== 'boolean' || typeof p.timedOut !== 'boolean' || p.timing?.durationMs < 0 || !requests.some(x => x.payload.modelCallId === p.modelCallId && x.event.agentRunId === event.agentRunId)) nativeProblems.push(event.eventId + ':error-envelope');
  }
  add(row, 'raw_request_response_and_error_references_complete', nativeProblems.length === 0, nativeProblems);
  const local = requests.filter(x => x.payload.provider === 'local');
  add(row, 'managed_local_manifest_matches_real_running_model', local.length > 0 && local.every(({ payload: p }) => p.backend?.localRuntime?.ownerId === runtime.manifest.ownerId && p.backend.localRuntime.modelSha256 === DEFAULT_ASSET.sha256 && p.backend.localRuntime.runtimeSha256 === runtime.manifest.runtimeSha256 && p.backend.localRuntime.templateSha256 === runtime.manifest.templateSha256 && p.backend.localRuntime.runtimeProps));
  add(row, 'local_calls_only_owned_loopback_without_cloud_fallback', runtime.fallback === 'disabled' && local.every(x => x.payload.endpoint === runtime.baseURL + '/chat/completions' && x.payload.request.model === DEFAULT_ASSET.id));
  row.requestedProviders = [...new Set(requests.map(x => x.payload.provider))];
  add(row, 'backend_selection_matches_case', row.name === 'local-local' ? requests.every(x => x.payload.provider === 'local') : row.requestedProviders.includes('local') && row.requestedProviders.includes('api'));
  const evidence = entries.filter(x => x.event.type === 'model.runtime_evidence'); row.nativeRuntimeEvidenceEvents = evidence.length;
  const runtimeProblems = [], decoded = [];
  if (!evidence.length) runtimeProblems.push('missing runtime evidence event');
  for (const { payload: p } of evidence) {
    if (p.ownerId !== runtime.manifest.ownerId || p.scope !== 'shared-runtime-session-byte-ranges') runtimeProblems.push('runtime attribution');
    for (const required of ['manifest', 'props', 'events', 'stdout', 'stderr']) if (!p.files?.some(f => f.role === required)) runtimeProblems.push('missing role ' + required);
    for (const file of p.files ?? []) {
      if (file.unavailable) { if (['manifest', 'props'].includes(file.role)) runtimeProblems.push('unavailable ' + file.role); continue; }
      const bytes = Buffer.from(file.content ?? '', 'base64');
      if (file.encoding !== 'base64' || bytes.length !== file.bytes || sha(bytes) !== file.sha256) runtimeProblems.push('runtime blob ' + file.role);
      decoded.push(bytes.toString('utf8'));
    }
  }
  add(row, 'runtime_manifest_props_and_log_bytes_are_self_contained', runtimeProblems.length === 0, runtimeProblems);
  const checkEntry = entries.filter(x => x.event.type === 'check.evidence').at(-1);
  if (checkEntry) {
    const independent = checkPeer(checkEntry.payload); row.offlineChecker = independent;
    add(row, 'independent_checker_agrees_with_live_checker', independent.status === state.check?.status && independent.business_outcome === state.check?.business_outcome);
    add(row, 'chain_scan_has_no_unrecorded_worker_transactions', independent.chainScan?.unrecorded?.length === 0);
  } else add(row, 'independent_checker_agrees_with_live_checker', false, 'No check.evidence');
  row.transactions = (state.transactions ?? []).map(tx => ({ executionId: tx.executionId, agentId: tx.agentId, agentRunId: tx.agentRunId, role: tx.actorId, from: tx.from, functionName: tx.functionName, state: tx.state, hash: tx.hash, receiptStatus: tx.receipt?.status }));
  add(row, 'transactions_belong_to_bound_execution_and_wallets', row.transactions.every(tx => {
    const binding = state.bindings?.[tx.role]; return tx.executionId === row.executionId && binding?.agentId === tx.agentId && binding?.agentRunId === tx.agentRunId && binding.address.toLowerCase() === tx.from?.toLowerCase();
  }));
  const graph = JSON.parse(bundle.files['derived/graph.json']), nodes = new Set(graph.nodes.map(n => n.id)), ids = new Set(events.map(e => e.eventId));
  add(row, 'provenance_graph_has_no_dangling_edges_or_event_references', graph.edges.every(e => nodes.has(e.from) && nodes.has(e.to) && ids.has(e.eventRef)));
  return { entries, decoded, requests, responses };
}
async function runCase(name, runtime, serverPid) {
  const row = { name, startedAt: new Date().toISOString(), assertions: [], status: 'running' }; batch.cases.push(row); await save();
  const prefix = 'q16-' + randomUUID().slice(0, 6), ids = [prefix + '-a', prefix + '-b']; let fixture, state, bundle, initialized = [];
  const knownSecrets = [];
  try {
    if (name === 'local-api-fixture') { fixture = await startFixture(); knownSecrets.push(fixture.key); }
    const models = [{ provider: 'local', temperature: 0, requestTimeoutMs: 120000, maxOutputTokens: 768 }, fixture ? { provider: 'api', model: 'api-protocol-fixture-not-an-llm', baseUrl: fixture.baseUrl, apiKey: fixture.key, temperature: 0, requestTimeoutMs: 120000 } : { provider: 'local', temperature: 0, requestTimeoutMs: 120000, maxOutputTokens: 768 }];
    for (let i = 0; i < 2; i++) { await api('/api/v2/agents', { agentId: ids[i], model: models[i] }); initialized.push(ids[i]); await api('/api/v2/agents/' + ids[i] + '/start', {}); }
    for (let n = 0; n < 300; n++) { const agents = (await api('/api/v2/agents')).filter(a => ids.includes(a.agentId)); if (agents.length === 2 && agents.every(a => a.online)) { row.agents = agents; break; } await sleep(100); }
    if (!row.agents) throw Error('OWN_WORKERS_START_FAILED');
    add(row, 'distinct_worker_processes_separate_from_platform_and_inference', new Set(row.agents.map(a => a.pid)).size === 2 && row.agents.every(a => a.pid && a.pid !== serverPid && a.pid !== runtime.pid));
    add(row, 'distinct_experiment_wallets', new Set(row.agents.map(a => a.address.toLowerCase())).size === 2);
    for (const id of ids) {
      const wallet = JSON.parse(await readFile(join(data, 'agents', id, 'wallet-secret.json'), 'utf8')); knownSecrets.push(wallet.privateKey);
      knownSecrets.push((await readFile(join(data, 'agents', id, 'identity.token'), 'utf8')).trim());
      const model = JSON.parse(await readFile(join(data, 'agents', id, 'model-secret.json'), 'utf8'));
      if (model.provider === 'local') add(row, id + '_local_profile_has_no_api_key', !model.apiKey && model.localRuntime?.ownerId === runtime.manifest.ownerId);
    }
    const job = await api('/api/v2/jobs', { taskType: 'peer_swap', input: { sellAmount: '10', buyAmount: '20', mode: 'llm', maxSteps: 60, deadlineSeconds: 600 }, environment: { mode: 'independent' } }); row.jobId = job.id;
    const execution = await api('/api/v2/jobs/' + job.id + '/assign', { roles: { maker: ids[0], taker: ids[1] }, start: true }); row.executionId = execution.id;
    const start = Date.now();
    for (;;) { state = await api('/api/v2/executions/' + execution.id); if (['completed', 'stopped', 'requires_attention', 'recovering', 'error'].includes(state.state)) break; if (Date.now() - start > timeoutMs) { row.watchdogTimeout = true; break; } await sleep(500); }
    row.durationMs = Date.now() - start; row.state = state.state; row.checkerStatus = state.check?.status ?? 'unknown'; row.modelTaskSuccess = state.check?.status === 'success'; row.executionError = state.error ?? null;
    bundle = await api('/api/v2/executions/' + execution.id + '/export?incomplete=1');
    const details = inspectBundle(row, bundle, state, runtime);
    if (fixture) {
      add(row, 'api_fixture_received_explicit_api_key', fixture.requests.length > 0 && fixture.authorizationMatches());
      const apiRequests = details?.requests.filter(x => x.payload.provider === 'api') ?? [];
      const apiResponses = details?.responses.filter(x => x.payload.provider === 'api') ?? [];
      add(row, 'api_fixture_native_bodies_match_export', apiRequests.length === fixture.requests.length && apiResponses.length === fixture.responses.length && apiRequests.every((x, i) => x.payload.body === fixture.requests[i].body) && apiResponses.every((x, i) => x.payload.body === fixture.responses[i].body));
    }
    const text = JSON.stringify([bundle, state, details?.decoded ?? []]);
    add(row, 'no_wallet_identity_or_api_secrets_in_export_or_decoded_runtime_files', !knownSecrets.some(secret => secret && text.includes(secret)));
    if (knownSecrets.some(secret => secret && text.includes(secret))) throw Error('SECRET_LEAK_DETECTED_EVIDENCE_NOT_WRITTEN');
    await writeFile(join(out, name + '-bundle.json'), JSON.stringify(bundle, null, 2)); await writeFile(join(out, name + '-state.json'), JSON.stringify(state, null, 2));
    if (fixture) await writeFile(join(out, name + '-fixture-transcript.json'), JSON.stringify({ origin: 'synthetic API protocol fixture, not a commercial or local LLM', requests: fixture.requests, responses: fixture.responses }, null, 2));
    row.offlineCLI = {};
    for (const command of ['verify', 'check', 'replay']) { const result = spawnSync(process.execPath, [join(root, 'dist/cli.mjs'), command, join(out, name + '-bundle.json')], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 60000 }); row.offlineCLI[command] = { exitCode: result.status, stdout: command === 'replay' ? result.stdout.split('\n').length + ' lines' : result.stdout, stderr: result.stderr }; }
    add(row, 'offline_verify_and_replay_pass_without_model_calls', row.offlineCLI.verify.exitCode === 0 && row.offlineCLI.replay.exitCode === 0);
    row.status = row.assertions.some(a => !a.passed) ? 'integration_failure' : row.watchdogTimeout ? 'test_timeout' : row.modelTaskSuccess ? 'passed' : 'model_task_failure';
  } catch (error) { row.status = 'harness_or_integration_error'; row.error = String(error.message); }
  finally {
    if (row.executionId && state && !['completed', 'stopped', 'error'].includes(state.state)) {
      row.cleanupControl = await api('/api/v2/executions/' + row.executionId + '/control', { action: 'stop' }, true).catch(error => ({ error: error.message }));
    }
    row.workerCleanup = [];
    for (const id of initialized) row.workerCleanup.push({ agentId: id, result: await api('/api/v2/agents/' + id + '/stop', {}, true).catch(error => ({ error: error.message })) });
    if (fixture) await fixture.close();
    row.finishedAt = new Date().toISOString(); await save(); console.log(JSON.stringify({ case: name, status: row.status, checker: row.checkerStatus, modelRequests: row.modelRequests, transactions: row.transactions?.length, failedAssertions: row.assertions.filter(a => !a.passed).map(a => a.id), error: row.error }));
  }
  return row;
}

try {
  token = (await api('/api/health')).csrfToken;
  const runtime = await api('/api/local-model/status'), diagnostics = await api('/api/v2/diagnostics');
  if (!runtime.ready || runtime.manifest?.modelSha256 !== DEFAULT_ASSET.sha256 || !runtime.manifest?.runtimeSha256) throw Error('READY_PINNED_MANAGED_QWEN4B_REQUIRED');
  batch.runtime = { model: runtime.model, pid: runtime.pid, ownerId: runtime.manifest.ownerId, modelSha256: runtime.manifest.modelSha256, runtimeSha256: runtime.manifest.runtimeSha256, templateSha256: runtime.manifest.templateSha256, settings: runtime.manifest.settings };
  batch.platformProcessId = diagnostics.processId; await save();
  for (const name of only === 'both' ? ['local-local', 'local-api-fixture'] : [only]) {
    const row = await runCase(name, runtime, diagnostics.processId);
    if (row.cleanupControl?.value?.error || row.watchdogTimeout || ['requires_attention', 'recovering'].includes(row.state)) { batch.nextCaseSkipped = 'Prior run needs attention; no automatic asset intervention or forced environment reset'; break; }
  }
} catch (error) { batch.error = String(error.message); }
batch.finishedAt = new Date().toISOString(); batch.passed = !batch.error && batch.cases.length > 0 && batch.cases.every(row => row.status === 'passed'); await save();
console.log(JSON.stringify({ completed: true, passed: batch.passed, results: resultFile, error: batch.error }));
if (!batch.passed) process.exitCode = 1;
