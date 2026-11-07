import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, readFile, writeFile, unlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_ASSET, LocalModelService, normalizeConfig, sha256 } from '../src/local-model/service.mjs';
import { downloadModel } from '../scripts/setup-local-model.mjs';

const hash = text => createHash('sha256').update(text).digest('hex');
async function fixture(t, overrides = {}) {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'web3-local-runtime-'));
  const modelPath = path.join(folder, 'model.gguf'), serverPath = path.join(folder, 'llama-server'), helper = path.join(folder, 'server.mjs');
  await writeFile(modelPath, 'tiny-test-model'); await writeFile(serverPath, 'explicit-test-runtime');
  await writeFile(helper, `import http from 'node:http';
    const args=process.argv.slice(2),get=x=>args[args.indexOf(x)+1];
    const s=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url==='/props'?{model_path:get('-m'),chat_template:'actual test template'}:{status:'ok'}));});
    s.listen(Number(get('--port')),'127.0.0.1',()=>console.log('fixture listening'));
    process.on('SIGTERM',()=>s.close(()=>process.exit(0)));`);
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  let spawns = 0;
  const asset = { ...DEFAULT_ASSET, bytes: 15, sha256: hash('tiny-test-model') };
  const service = new LocalModelService({ dataDir: folder, asset,
    spawnProcess(executable, args, options) { spawns++; assert.equal(executable, serverPath); assert.equal(options.windowsHide, true); return spawn(process.execPath, [helper, ...args], options); },
    getListenerPids: async () => null, ...overrides });
  const config = { modelPath, serverPath, port, pinRuntime: true, startupTimeoutMs: 5000 };
  t.after(async () => {
    await service.shutdown();
    // Remove only the exact temporary directory allocated by this fixture.
    assert.equal(path.dirname(folder), path.resolve(os.tmpdir()));
    assert.ok(path.basename(folder).startsWith('web3-local-runtime-'));
    await rm(folder, { recursive: true, force: true });
  });
  return { folder, modelPath, serverPath, service, config, asset, spawns: () => spawns };
}

test('local configuration pins exact model, strips credentials and rejects invalid limits', async t => {
  const f = await fixture(t);
  const result = await f.service.configure({ ...f.config, apiKey: 'MUST_NOT_PERSIST', arbitrary: 'discard' });
  assert.equal(result.config.modelSha256, f.asset.sha256);
  assert.equal(result.config.serverSha256, hash('explicit-test-runtime'));
  assert.equal(result.config.runtimePinSource, 'local-import');
  assert.equal(result.config.contextSize, 16384); assert.equal(result.config.maxOutputTokens, 768);
  assert.ok(!(await readFile(f.service.configFile, 'utf8')).includes('MUST_NOT_PERSIST'));
  assert.equal(result.config.apiKey, undefined);
  for (const field of [{ port: 80 }, { threads: 0 }, { contextSize: 100000 }, { maxOutputTokens: 8000 }, { gpuLayers: '-1' }, { modelSha256: 'a'.repeat(64) }, { modelPath: './relative' }]) {
    assert.throws(() => normalizeConfig({ ...result.config, ...field }, f.asset));
  }
});

test('unconfigured local requests fail closed; remote requests are not changed', async t => {
  const { service, spawns } = await fixture(t);
  await assert.rejects(service.resolveModel({ provider: 'local' }), /LOCAL_MODEL_NOT_CONFIGURED/);
  const api = { provider: 'api', model: 'remote', baseUrl: 'https://example.invalid/v1', apiKey: 'do-not-use' };
  assert.equal(await service.resolveModel(api), api); assert.equal(spawns(), 0);
});

test('same owned runtime is reused and complete identity/log evidence is persisted', async t => {
  const f = await fixture(t);
  await f.service.configure(f.config);
  const [one, two] = await Promise.all([f.service.start(), f.service.start()]);
  assert.equal(one.ready, true); assert.equal(two.pid, one.pid); assert.equal(f.spawns(), 1);
  const model = await f.service.resolveModel({ provider: 'local', temperature: 0, topP: 0.9, seed: 42 });
  assert.equal(model.model, f.asset.id); assert.equal(model.apiKey, ''); assert.equal(model.seed, 42);
  assert.equal(model.localRuntime.modelSha256, f.asset.sha256);
  assert.equal(model.localRuntime.runtimeSha256, hash('explicit-test-runtime'));
  assert.equal(model.localRuntime.templateSha256, hash('actual test template'));
  assert.equal(model.localRuntime.runtimeProps.chat_template, 'actual test template');
  assert.equal(model.localRuntime.settings.parallel, 1);
  assert.equal(model.localRuntime.settings.reasoning, 'off');
  const persisted = JSON.parse(await readFile(one.manifest.logs.manifest, 'utf8'));
  assert.deepEqual(persisted, model.localRuntime);
  assert.ok((await readFile(one.manifest.logs.events, 'utf8')).includes('health.ready'));
  assert.ok((await readFile(one.manifest.logs.stdout, 'utf8')).includes('fixture listening'));
  const cursor = await f.service.evidenceCursor();
  await f.service.event('fixture.delta', { value: '中文' });
  const evidence = await f.service.captureRuntimeEvidence(cursor);
  const events = evidence.files.find(file => file.role === 'events');
  const rawBytes = Buffer.from(events.content, 'base64');
  assert.equal(hash(rawBytes), events.sha256);
  assert.ok(rawBytes.toString('utf8').includes('中文'));
  assert.ok(!rawBytes.toString('utf8').includes('health.ready'));
  assert.equal(events.byteStart, cursor.offsets.events);
  await f.service.stop(); assert.equal(f.service.status().running, false); assert.equal(f.service.status().state, 'stopped');
  await f.service.stop(); assert.equal(f.spawns(), 1);
});

test('local provider rejects remote endpoint/key and oversized output without spawning', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  for (const extra of [{ apiKey: 'secret' }, { baseUrl: 'https://example.invalid/v1' }, { baseURL: 'http://127.0.0.1:1/v1' }, { maxOutputTokens: 9999 }]) {
    await assert.rejects(f.service.resolveModel({ provider: 'local', ...extra }));
  }
  assert.equal(f.spawns(), 0);
});

test('model and runtime mutation are detected before any process starts', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  await writeFile(f.modelPath, 'bad!-test-model');
  await assert.rejects(f.service.start(), /LOCAL_(?:SIZE|SHA256)_MISMATCH:model/); assert.equal(f.spawns(), 0);
  await writeFile(f.modelPath, 'tiny-test-model'); await writeFile(f.serverPath, 'changed-runtime');
  await assert.rejects(f.service.start(), /LOCAL_SHA256_MISMATCH:runtime/); assert.equal(f.spawns(), 0);
  assert.equal(f.service.status().state, 'failed');
});

test('occupied port is refused and unrelated listener survives shutdown', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  const listener = createServer(); await new Promise(resolve => listener.listen(f.config.port, '127.0.0.1', resolve));
  try {
    await assert.rejects(f.service.start(), /LOCAL_PORT_IN_USE_REFUSED/);
    await f.service.stop(); assert.equal(listener.listening, true); assert.equal(f.spawns(), 0);
  } finally { await new Promise(resolve => listener.close(resolve)); }
});

test('active experiments prevent configure and stop, while shutdown owns cleanup', async t => {
  let busy = false; const f = await fixture(t, { busy: () => busy });
  await f.service.configure(f.config); await f.service.start(); busy = true;
  await assert.rejects(f.service.stop(), /LOCAL_MODEL_BUSY_EXPERIMENT_ACTIVE/);
  await assert.rejects(f.service.configure(f.config), /LOCAL_MODEL_BUSY_EXPERIMENT_ACTIVE/);
  assert.equal((await f.service.start()).ready, true);
  await f.service.shutdown(); assert.equal(f.service.status().running, false);
});

test('wrong listener ownership is rejected and only spawned child is terminated', async t => {
  const f = await fixture(t, { getListenerPids: async () => [-1] }); await f.service.configure(f.config);
  await assert.rejects(f.service.start(), /LOCAL_LISTENER_OWNER_MISMATCH/);
  assert.equal(f.service.status().running, false); assert.equal(f.spawns(), 1);
});

test('configuration reload never adopts or auto-starts old processes', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  const second = new LocalModelService({ dataDir: f.folder, asset: f.asset }); await second.initialized;
  assert.equal(second.status().configured, true); assert.equal(second.status().running, false);
  assert.equal(second.status().pid, null); assert.equal(second.status().state, 'stopped');
  await second.shutdown(); assert.equal(f.spawns(), 0);
});

test('rerun accepts a new owned session but refuses changed pinned runtime settings', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  const original = await f.service.resolveModel({ provider: 'local' });
  await f.service.stop();
  const rerun = await f.service.resolveModel(original);
  assert.notEqual(rerun.localRuntime.ownerId, original.localRuntime.ownerId);
  assert.equal(rerun.localRuntime.modelSha256, original.localRuntime.modelSha256);
  assert.throws(() => f.service.assertModel(original), /LOCAL_MODEL_WORKER_SESSION_STALE/);
  assert.doesNotThrow(() => f.service.assertModel(rerun));
  await f.service.stop(); await f.service.configure({ ...f.config, contextSize: 8192 });
  await assert.rejects(f.service.resolveModel(original), /LOCAL_MODEL_CONFIG_CHANGED/);
});

test('runtime evidence redacts decoded native log text before encoding and hashing', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  const model = await f.service.resolveModel({ provider: 'local' });
  const secret = 'SYNTHETIC_LOCAL_TEST_SECRET_123456';
  await f.service.event('fixture.secret', { output: secret, apiKey: 'UNKNOWN_STRUCTURED_SECRET_567890' });
  const snapshot = await f.service.captureEvidence(model, null, value => {
    const clean = item => typeof item === 'string' ? item.replaceAll(secret, '[REDACTED]') : Array.isArray(item) ? item.map(clean) : item && typeof item === 'object' ? Object.fromEntries(Object.entries(item).map(([k,v])=>[k,clean(v)])) : item;
    return clean(value);
  });
  for (const file of snapshot.files.filter(file => file.encoding === 'base64')) {
    const bytes = Buffer.from(file.content, 'base64');
    assert.ok(!bytes.toString('utf8').includes(secret));
    assert.ok(!bytes.toString('utf8').includes('UNKNOWN_STRUCTURED_SECRET_567890'));
    assert.equal(hash(bytes), file.sha256); assert.equal(bytes.length, file.bytes);
  }
  assert.equal(snapshot.files.find(file => file.role === 'events').capture.redacted, true);
});

test('missing required native session files fail evidence capture instead of sealing incomplete data as complete', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  const model = await f.service.resolveModel({ provider: 'local' });
  for (const role of ['manifest', 'props', 'events']) {
    const file = f.service.manifest.logs[role];
    assert.ok(path.resolve(file).startsWith(path.resolve(f.folder) + path.sep));
    const bytes = await readFile(file);
    await unlink(file);
    await assert.rejects(f.service.captureEvidence(model), new RegExp(`LOCAL_RUNTIME_EVIDENCE_MISSING:${role}`));
    await writeFile(file, bytes);
  }
  const evidence = await f.service.captureEvidence(model);
  assert.equal(evidence.files.filter(file => ['manifest', 'props', 'events'].includes(file.role)).every(file => typeof file.content === 'string'), true);
});

test('delayed old-process stdio tails remain in their original session after restart', async t => {
  const f = await fixture(t); await f.service.configure(f.config); await f.service.start();
  const oldChild = f.service.child, oldManifest = structuredClone(f.service.manifest), oldExitHandlers = oldChild.listeners('exit');
  await f.service.stop(); await f.service.start();
  const current = f.service.child, currentManifest = structuredClone(f.service.manifest);
  assert.notEqual(currentManifest.ownerId, oldManifest.ownerId);
  // Simulate pipe data that becomes observable after exit and the next start.
  oldChild.stdout.emit('data', Buffer.from('ONLY_OLD_STDOUT_TAIL\n'));
  oldChild.stderr.emit('data', Buffer.from('ONLY_OLD_STDERR_TAIL\n'));
  for (const handler of oldExitHandlers) handler(88, null);
  await f.service.writeQueue;
  assert.match(await readFile(oldManifest.logs.stdout, 'utf8'), /ONLY_OLD_STDOUT_TAIL/);
  assert.match(await readFile(oldManifest.logs.stderr, 'utf8'), /ONLY_OLD_STDERR_TAIL/);
  assert.doesNotMatch(await readFile(currentManifest.logs.stdout, 'utf8'), /ONLY_OLD_STDOUT_TAIL/);
  assert.doesNotMatch(await readFile(currentManifest.logs.stderr, 'utf8').catch(() => ''), /ONLY_OLD_STDERR_TAIL/);
  assert.equal(f.service.child, current); assert.equal(f.service.status().ready, true);
  const oldEvents = (await readFile(oldManifest.logs.events, 'utf8')).trim().split('\n').map(JSON.parse);
  const currentEvents = (await readFile(currentManifest.logs.events, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.ok(oldEvents.every(event => event.ownerId === oldManifest.ownerId));
  assert.ok(currentEvents.every(event => event.ownerId === currentManifest.ownerId));
  assert.ok(oldEvents.some(event => event.type === 'process.exit' && event.code === 88));
  assert.ok(!currentEvents.some(event => event.type === 'process.exit' && event.code === 88));
});

test('stop during validation cancels startup without leaking a child process', async t => {
  const f = await fixture(t); await f.service.configure(f.config);
  const originalValidate = f.service.validate.bind(f.service);
  let release, entered;
  const waitRelease = new Promise(resolve => { release = resolve; });
  const waitEntered = new Promise(resolve => { entered = resolve; });
  f.service.validate = async config => { entered(); await waitRelease; await originalValidate(config); };
  const pending = f.service.start();
  await waitEntered;
  const stopped = f.service.stop();
  release();
  await assert.rejects(pending, /LOCAL_MODEL_START_CANCELLED/);
  await stopped;
  assert.equal(f.spawns(), 0); assert.equal(f.service.status().state, 'stopped');
});

test('management routes expose status and return clear failure without fallback', async t => {
  const f = await fixture(t);
  const response = () => ({ writeHead(status, headers) { this.status = status; this.headers = headers; }, end(body) { this.body = JSON.parse(body); } });
  let res = response();
  assert.equal(await f.service.handle({ method: 'GET' }, res, '/api/local-model/status'), true);
  assert.equal(res.status, 200); assert.equal(res.body.fallback, 'disabled');
  res = response(); await f.service.handle({ method: 'POST' }, res, '/api/local-model/start');
  assert.equal(res.status, 409); assert.equal(res.body.error, 'LOCAL_MODEL_NOT_CONFIGURED');
  res = response(); await f.service.handle({ method: 'DELETE' }, res, '/api/local-model/config'); assert.equal(res.status, 405);
  assert.equal(await f.service.handle({ method: 'GET' }, response(), '/api/else'), false);
});

test('download resumes exact byte range then validates SHA and records asset identity', async t => {
  const f = await fixture(t), target = path.join(f.folder, 'download.gguf'), bytes = Buffer.from('0123456789');
  await writeFile(target + '.partial', bytes.subarray(0, 4));
  const asset = { id: 'tiny', sha256: hash(bytes), bytes: bytes.length, downloadUrl: 'https://example.invalid/model' };
  let calls = 0;
  const actual = await downloadModel(target, { asset, progress: () => {}, fetchImpl: async (_url, options) => {
    calls++; assert.equal(options.headers.Range, 'bytes=4-');
    return new Response(bytes.subarray(4), { status: 206, headers: { 'content-range': 'bytes 4-9/10' } });
  } });
  assert.equal(actual, target); assert.equal(await sha256(target), asset.sha256); assert.equal(calls, 1);
  assert.equal(JSON.parse(await readFile(target + '.asset.json', 'utf8')).actualSha256, asset.sha256);
  await downloadModel(target, { asset, progress: () => {}, fetchImpl: () => { throw new Error('must not download verified model'); } });
});

test('bad range and corrupt model downloads are never promoted to usable assets', async t => {
  const f = await fixture(t), target = path.join(f.folder, 'bad.gguf');
  const asset = { id: 'tiny', sha256: hash('0123456789'), bytes: 10, downloadUrl: 'https://example.invalid/model' };
  await writeFile(target + '.partial', '0123');
  await assert.rejects(downloadModel(target, { asset, progress: () => {}, fetchImpl: async () => new Response('56789', { status: 206, headers: { 'content-range': 'bytes 5-9/10' } }) }), /RANGE_MISMATCH/);
  await assert.rejects(downloadModel(target, { asset, progress: () => {}, fetchImpl: async () => new Response('abcdefghij', { status: 200 }) }), /SHA256_MISMATCH/);
  await assert.rejects(readFile(target), { code: 'ENOENT' });
  assert.equal(await readFile(target + '.partial', 'utf8'), 'abcdefghij');
});
