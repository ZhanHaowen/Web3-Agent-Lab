import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { appendFile, mkdir, open, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { modelRecordRedactor } from '../model/capture.mjs';

export const DEFAULT_ASSET = JSON.parse(await readFile(new URL('./assets.json', import.meta.url), 'utf8'));
const digestPattern = /^[0-9a-f]{64}$/i;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const error = (code, status = 400) => Object.assign(new Error(code), { code, status });
const isAlive = child => !!child && child.exitCode === null && child.signalCode === null;
const hashText = value => createHash('sha256').update(value).digest('hex');
const canonicalIdentity = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const runtimeIdentity = value => ({ model: value.model, modelSha256: value.modelSha256,
  runtimeSha256: value.runtimeSha256, templateSha256: value.templateSha256,
  settings: value.settings, dependencies: (value.runtime?.dependencies ?? []).map(item => ({ sha256: item.sha256 })).sort((a, b) => a.sha256.localeCompare(b.sha256)) });
/** Redact decoded native text BEFORE base64 so encoded logs cannot bypass secret filtering. */
export function redactRuntimeEvidence(evidence, clean = value => value) {
  if (!evidence) return evidence;
  const nativeRedactor = modelRecordRedactor(evidence.manifest ?? {});
  const safe = clean(nativeRedactor.clean({ ...evidence, files: undefined }));
  safe.files = (evidence.files ?? []).map(file => {
    const metadata = clean(nativeRedactor.clean({ ...file, content: undefined }));
    if (file.encoding !== 'base64' || typeof file.content !== 'string') return metadata;
    const bytes = Buffer.from(file.content, 'base64'), text = bytes.toString('utf8');
    nativeRedactor.add(text);
    const recordedText = clean(nativeRedactor.text(text));
    if (typeof recordedText !== 'string') throw error('LOCAL_RUNTIME_REDACTOR_MUST_RETURN_TEXT', 500);
    const recorded = Buffer.from(recordedText, 'utf8');
    return { ...metadata, sourceBytes: bytes.length, bytes: recorded.length, sha256: hashText(recorded),
      encoding: 'base64', content: recorded.toString('base64'),
      capture: { representation: 'utf8-runtime-text-redacted-before-base64', redacted: !bytes.equals(recorded),
        sourceByteStart: file.byteStart, sourceByteEnd: file.byteEnd, recordedBodySha256: hashText(recorded) } };
  });
  safe.redaction = { policy: 'known-secrets-and-sensitive-fields-before-base64', byteRangesReferTo: 'source-runtime-file', fileHashesReferTo: 'recorded-decoded-bytes' };
  return safe;
}
export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export async function portAvailable(port) {
  return new Promise(resolve => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen({ host: '127.0.0.1', port, exclusive: true }, () => server.close(() => resolve(true)));
  });
}
async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await rename(temp, file);
}
function integer(value, fallback, min, max, name) {
  const number = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw error(`INVALID_${name}`);
  return number;
}
function absoluteFile(value, name) {
  if (typeof value !== 'string' || !value.trim() || !path.isAbsolute(value) || value.includes('\0')) throw error(`ABSOLUTE_${name}_REQUIRED`);
  return path.normalize(value);
}
function digest(value, name) {
  if (typeof value !== 'string' || !digestPattern.test(value)) throw error(`${name}_SHA256_REQUIRED`);
  return value.toLowerCase();
}
export function normalizeConfig(input, asset = DEFAULT_ASSET) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw error('LOCAL_CONFIG_REQUIRED');
  const modelHash = digest(input.modelSha256 ?? asset.sha256, 'MODEL');
  if (modelHash !== asset.sha256) throw error('MODEL_NOT_SUPPORTED_BY_PINNED_CATALOG');
  const layers = input.gpuLayers ?? 'auto';
  if (layers !== 'auto' && (!Number.isSafeInteger(Number(layers)) || Number(layers) < 0 || Number(layers) > 999)) throw error('INVALID_GPU_LAYERS');
  const result = {
    schemaVersion: 1, model: asset.id,
    modelPath: absoluteFile(input.modelPath, 'MODEL_PATH'), modelSha256: modelHash,
    serverPath: absoluteFile(input.serverPath, 'SERVER_PATH'), serverSha256: digest(input.serverSha256, 'RUNTIME'),
    port: integer(input.port, 8495, 1024, 65535, 'PORT'),
    contextSize: integer(input.contextSize, 16384, 512, 32768, 'CONTEXT_SIZE'),
    maxOutputTokens: integer(input.maxOutputTokens, 768, 64, 4096, 'OUTPUT_TOKENS'),
    threads: integer(input.threads, 6, 1, 128, 'THREADS'),
    gpuLayers: layers === 'auto' ? 'auto' : Number(layers),
    startupTimeoutMs: integer(input.startupTimeoutMs, 180000, 1000, 600000, 'STARTUP_TIMEOUT'),
    runtimePinSource: input.runtimePinSource === 'local-import' ? 'local-import' : 'provided-sha256',
    runtimeVersion: typeof input.runtimeVersion === 'string' ? input.runtimeVersion.slice(0, 120) : 'operator-supplied; startup logs retained',
    runtimeFiles: [],
  };
  if (input.templatePath) {
    result.templatePath = absoluteFile(input.templatePath, 'TEMPLATE_PATH');
    result.templateSha256 = digest(input.templateSha256, 'TEMPLATE');
  }
  if (input.runtimeFiles !== undefined) {
    if (!Array.isArray(input.runtimeFiles) || input.runtimeFiles.length > 512) throw error('INVALID_RUNTIME_FILES');
    result.runtimeFiles = input.runtimeFiles.map(file => ({ path: absoluteFile(file?.path, 'RUNTIME_DEPENDENCY_PATH'), sha256: digest(file?.sha256, 'RUNTIME_DEPENDENCY') }));
  }
  return result;
}

/** Lifecycle only: model request/response bytes are captured by the experiment collector. */
export class LocalModelService {
  constructor({ dataDir, configFile, busy = () => false, beforeChange, asset = DEFAULT_ASSET, spawnProcess = spawn, fetchImpl = fetch, getListenerPids } = {}) {
    if (!dataDir) throw error('LOCAL_DATA_DIR_REQUIRED');
    this.root = path.resolve(dataDir, 'local-model');
    this.configFile = configFile ? path.resolve(configFile) : path.join(this.root, 'config.json');
    this.busy = busy; this.beforeChange = beforeChange; this.asset = asset; this.spawnProcess = spawnProcess; this.fetchImpl = fetchImpl;
    this.getListenerPids = getListenerPids ?? listenerPids;
    this.state = 'unconfigured'; this.config = null; this.child = null; this.manifest = null;
    this.lastError = null; this.validation = null; this.logError = null;
    this.startPromise = null; this.stopPromise = null; this.configuring = false; this.writeQueue = Promise.resolve(); this.generation = 0;
    this.initialized = this.load();
  }
  async load() {
    try { this.config = normalizeConfig(JSON.parse(await readFile(this.configFile, 'utf8')), this.asset); this.state = 'stopped'; }
    catch (cause) { if (cause.code !== 'ENOENT') { this.state = 'invalid-config'; this.lastError = cause.message; } }
  }
  status() {
    return {
      provider: 'local', state: this.state, configured: !!this.config,
      running: isAlive(this.child), ready: this.state === 'ready' && isAlive(this.child),
      error: this.lastError, logError: this.logError,
      model: this.asset.id, config: this.config, validation: this.validation, manifest: this.manifest,
      baseURL: this.config ? `http://127.0.0.1:${this.config.port}/v1` : null,
      pid: this.child?.pid ?? null, logs: this.manifest?.logs ?? null,
      fallback: 'disabled', downloadPolicy: 'explicit-setup-only',
    };
  }
  async assertIdle() { if (await this.busy()) throw error('LOCAL_MODEL_BUSY_EXPERIMENT_ACTIVE', 409); await this.beforeChange?.(); }
  async configure(input) {
    await this.initialized;
    await this.assertIdle();
    if (this.configuring || this.startPromise || this.stopPromise || isAlive(this.child)) throw error('STOP_LOCAL_MODEL_BEFORE_CONFIGURE', 409);
    this.configuring = true;
    try {
    const candidate = { ...input };
    if (candidate.pinRuntime === true) {
      const executable = absoluteFile(candidate.serverPath, 'SERVER_PATH');
      const info = await stat(executable).catch(() => { throw error('RUNTIME_FILE_NOT_FOUND'); });
      if (!info.isFile()) throw error('RUNTIME_NOT_A_FILE');
      candidate.serverSha256 = await sha256(executable);
      candidate.runtimePinSource = 'local-import';
      if (candidate.runtimeFiles === undefined) {
        candidate.runtimeFiles = [];
        for (const name of (await readdir(path.dirname(executable))).sort()) {
          if (!/\.(?:dll|dylib|so(?:\.\d+)*)$/i.test(name)) continue;
          const file = path.join(path.dirname(executable), name);
          if ((await stat(file)).isFile()) candidate.runtimeFiles.push({ path: file, sha256: await sha256(file) });
        }
      }
    }
    const config = normalizeConfig(candidate, this.asset);
    await atomicJson(this.configFile, config);
    this.config = config; this.state = 'stopped'; this.lastError = null; this.validation = null; this.manifest = null;
    return this.status();
    } finally { this.configuring = false; }
  }
  async event(type, data = {}) {
    if (!this.manifest) return;
    return this.sessionEvent(this.manifest, this.state, type, data);
  }
  async sessionEvent(manifest, state, type, data = {}) {
    const entry = { at: new Date().toISOString(), ownerId: manifest.ownerId, type, state, ...data };
    await this.appendLog(manifest.logs.events, JSON.stringify(entry) + '\n', manifest.ownerId);
  }
  appendLog(file, chunk, ownerId = this.manifest?.ownerId) {
    const operation = this.writeQueue.then(() => appendFile(file, chunk));
    this.writeQueue = operation.catch(cause => { if (ownerId === this.manifest?.ownerId) this.logError = cause.message; });
    return operation;
  }
  async validate(config) {
    const results = [];
    const files = [
      { role: 'model', path: config.modelPath, expected: config.modelSha256, bytes: this.asset.bytes },
      { role: 'runtime', path: config.serverPath, expected: config.serverSha256 },
      ...(config.templatePath ? [{ role: 'chat-template', path: config.templatePath, expected: config.templateSha256 }] : []),
      ...config.runtimeFiles.map(file => ({ role: 'runtime-dependency', path: file.path, expected: file.sha256 })),
    ];
    for (const file of files) {
      const info = await stat(file.path).catch(() => { throw error(`LOCAL_FILE_NOT_FOUND:${file.role}`); });
      if (!info.isFile()) throw error(`LOCAL_NOT_A_FILE:${file.role}`);
      if (file.bytes !== undefined && info.size !== file.bytes) throw error(`LOCAL_SIZE_MISMATCH:${file.role}`);
      const actual = await sha256(file.path);
      const entry = { ...file, bytes: info.size, actualSha256: actual, match: actual === file.expected };
      results.push(entry); this.validation = { at: new Date().toISOString(), complete: false, files: [...results] };
      await this.event('asset.validation', entry);
      if (!entry.match) throw error(`LOCAL_SHA256_MISMATCH:${file.role}`);
    }
    this.validation = { at: new Date().toISOString(), complete: true, files: results };
  }
  async start({ checkBusy = true } = {}) {
    await this.initialized;
    if (this.stopPromise) throw error('LOCAL_MODEL_STOPPING', 409);
    if (this.startPromise) return this.startPromise;
    if (this.state === 'ready' && isAlive(this.child)) return this.status();
    if (checkBusy) await this.assertIdle();
    if (this.configuring) throw error('LOCAL_MODEL_CONFIGURING', 409);
    if (this.startPromise) return this.startPromise;
    if (this.stopPromise) throw error('LOCAL_MODEL_STOPPING', 409);
    if (!this.config) throw error('LOCAL_MODEL_NOT_CONFIGURED', 409);
    const generation = ++this.generation;
    this.startPromise = this.startOwned(generation);
    try { return await this.startPromise; } finally { this.startPromise = null; }
  }
  async startOwned(generation) {
    const config = this.config;
    const ownerId = randomUUID(), folder = path.join(this.root, 'sessions', ownerId);
    await mkdir(folder, { recursive: true });
    const args = ['-m', config.modelPath, '--alias', this.asset.id, '--host', '127.0.0.1', '--port', String(config.port),
      '-c', String(config.contextSize), '-np', '1', '-ngl', String(config.gpuLayers), '-t', String(config.threads),
      '-n', String(config.maxOutputTokens), '--jinja', '--reasoning', 'off', '--no-webui', '--no-agent', '--cache-ram', '256'];
    if (config.templatePath) args.push('--chat-template-file', config.templatePath);
    this.manifest = {
      schemaVersion: 1, provider: 'local', ownerId, startedAt: new Date().toISOString(),
      model: this.asset.id, modelSha256: config.modelSha256, runtimeSha256: config.serverSha256,
      templateSha256: config.templateSha256 ?? null, templateHashEncoding: 'utf8-raw',
      modelAsset: { ...this.asset, path: config.modelPath },
      runtime: { path: config.serverPath, sha256: config.serverSha256, platform: process.platform, arch: process.arch,
        pinSource: config.runtimePinSource, requestedVersion: config.runtimeVersion, dependencies: config.runtimeFiles },
      settings: { contextSize: config.contextSize, maxOutputTokens: config.maxOutputTokens, threads: config.threads,
        gpuLayers: config.gpuLayers, parallel: 1, reasoning: 'off', host: '127.0.0.1', port: config.port },
      args, templateSource: config.templatePath ?? 'GGUF embedded template; recorded from runtime /props',
      logs: { manifest: path.join(folder, 'runtime-manifest.json'), events: path.join(folder, 'lifecycle.jsonl'),
        stdout: path.join(folder, 'runtime.stdout.log'), stderr: path.join(folder, 'runtime.stderr.log'), props: path.join(folder, 'runtime-props.json') },
      fallback: 'disabled',
    };
    this.state = 'validating'; this.lastError = null; this.logError = null;
    await atomicJson(this.manifest.logs.manifest, this.manifest);
    try {
      await this.event('start.requested');
      await this.validate(config);
      if (generation !== this.generation) throw error('LOCAL_MODEL_START_CANCELLED', 409);
      if (!await portAvailable(config.port)) throw error('LOCAL_PORT_IN_USE_REFUSED', 409);
      this.state = 'starting';
      await this.event('spawn.requested', { executable: config.serverPath, args });
      const child = this.spawnProcess(config.serverPath, args, { cwd: path.dirname(config.serverPath), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      this.child = child;
      const sessionManifest = this.manifest;
      let spawnError;
      child.once('error', cause => { spawnError = cause; });
      child.stdout.on('data', chunk => { this.appendLog(sessionManifest.logs.stdout, chunk, sessionManifest.ownerId).catch(() => {}); });
      child.stderr.on('data', chunk => { this.appendLog(sessionManifest.logs.stderr, chunk, sessionManifest.ownerId).catch(() => {}); });
      child.once('exit', (code, signal) => {
        const stillCurrent = this.child === child;
        if (stillCurrent && !['stopping', 'stopped'].includes(this.state)) { this.state = 'failed'; this.lastError = `LOCAL_RUNTIME_EXITED:${code ?? signal}`; }
        this.sessionEvent(sessionManifest, stillCurrent ? this.state : 'exited', 'process.exit', { pid: child.pid, code, signal }).catch(() => {});
      });
      this.manifest.pid = child.pid ?? null; this.state = 'loading';
      await this.event('spawn.created', { pid: child.pid });
      const started = Date.now();
      while (Date.now() - started < config.startupTimeoutMs) {
        if (generation !== this.generation) throw error('LOCAL_MODEL_START_CANCELLED', 409);
        if (spawnError) throw error(`LOCAL_SPAWN_FAILED:${spawnError.code ?? spawnError.message}`, 500);
        if (!isAlive(child)) throw error(`LOCAL_RUNTIME_EXITED:${child.exitCode ?? child.signalCode}`, 500);
        if (this.logError) throw error('LOCAL_RUNTIME_LOG_WRITE_FAILED', 500);
        try {
          const health = await this.fetchImpl(`http://127.0.0.1:${config.port}/health`, { signal: AbortSignal.timeout(2000) });
          const body = await health.json();
          if (health.ok && body.status === 'ok') {
            const pids = await this.getListenerPids(config.port);
            if (pids && !pids.includes(child.pid)) throw error('LOCAL_LISTENER_OWNER_MISMATCH', 409);
            const response = await this.fetchImpl(`http://127.0.0.1:${config.port}/props`, { signal: AbortSignal.timeout(3000) });
            if (!response.ok) throw error('LOCAL_RUNTIME_PROPS_UNAVAILABLE');
            const props = await response.json();
            if (typeof props.model_path !== 'string' || path.resolve(props.model_path) !== path.resolve(config.modelPath)) throw error('LOCAL_MODEL_IDENTITY_MISMATCH', 409);
            if (!isAlive(child) || generation !== this.generation) throw error('LOCAL_MODEL_START_CANCELLED', 409);
            if (typeof props.chat_template !== 'string' || !props.chat_template) throw error('LOCAL_RUNTIME_TEMPLATE_UNAVAILABLE');
            // Hash the actual template used by this engine, not the catalog's expected template.
            this.manifest.templateSha256 = hashText(props.chat_template);
            this.manifest.templateRequestedSha256 = config.templateSha256 ?? null;
            this.manifest.validation = this.validation;
            this.manifest.readyAt = new Date().toISOString();
            this.manifest.loadWallMs = Date.now() - started;
            this.manifest.propsSha256 = hashText(JSON.stringify(props));
            // Embed the raw JSON object as well as its file reference so a run
            // exported to another computer retains the effective chat template.
            this.manifest.runtimeProps = props;
            await atomicJson(this.manifest.logs.props, props);
            await atomicJson(this.manifest.logs.manifest, this.manifest);
            this.state = 'ready';
            await this.event('health.ready', { listenerPids: pids, health: body, loadWallMs: this.manifest.loadWallMs });
            return this.status();
          }
        } catch (cause) {
          if (typeof cause.code === 'string' && cause.code.startsWith('LOCAL_')) throw cause;
        }
        await delay(250);
      }
      throw error('LOCAL_MODEL_STARTUP_TIMEOUT', 504);
    } catch (cause) {
      this.lastError = cause.message;
      await this.event('start.failed', { error: cause.message }).catch(() => {});
      await this.terminateOwned();
      this.state = 'failed';
      throw cause;
    }
  }
  async terminateOwned() {
    const child = this.child;
    if (!isAlive(child)) { this.child = null; await this.writeQueue; return; }
    this.state = 'stopping';
    await this.event('stop.owned-process', { pid: child.pid }).catch(() => {});
    const waitExit = ms => new Promise(resolve => {
      const timer = setTimeout(() => { child.off('exit', exited); resolve(false); }, ms);
      const exited = () => { clearTimeout(timer); resolve(true); };
      child.once('exit', exited);
      if (!isAlive(child)) { child.off('exit', exited); clearTimeout(timer); resolve(true); }
    });
    const graceful = waitExit(10000);
    child.kill('SIGTERM');
    if (!await graceful) {
      const forced = waitExit(5000);
      child.kill('SIGKILL');
      if (!await forced) throw error('LOCAL_OWNED_PROCESS_STOP_TIMEOUT', 500);
    }
    this.child = null;
    await this.event('stop.completed', { pid: child.pid });
    await this.writeQueue;
  }
  async stop({ checkBusy = true } = {}) {
    await this.initialized;
    if (this.stopPromise) return this.stopPromise;
    if (checkBusy) await this.assertIdle();
    if (this.configuring) throw error('LOCAL_MODEL_CONFIGURING', 409);
    if (this.stopPromise) return this.stopPromise;
    this.generation++;
    this.stopPromise = (async () => {
      await this.startPromise?.catch(() => {});
      await this.terminateOwned();
      this.state = this.config ? 'stopped' : 'unconfigured';
      return this.status();
    })();
    try { return await this.stopPromise; } finally { this.stopPromise = null; }
  }
  async resolveModel(model = {}) {
    if (model.provider !== 'local' && model.backend !== 'local') return model;
    await this.initialized;
    if (!this.config) throw error('LOCAL_MODEL_NOT_CONFIGURED', 409);
    const expectedBase = `http://127.0.0.1:${this.config.port}/v1`;
    if (model.apiKey || ([model.baseUrl, model.baseURL].filter(Boolean).some(value => !model.localRuntime || value !== expectedBase))) throw error('LOCAL_MODEL_DOES_NOT_ACCEPT_REMOTE_CREDENTIALS_OR_ENDPOINT', 400);
    if (model.maxOutputTokens !== undefined && (!Number.isSafeInteger(model.maxOutputTokens) || model.maxOutputTokens < 1 || model.maxOutputTokens > this.config.maxOutputTokens)) throw error('LOCAL_OUTPUT_LIMIT_EXCEEDS_RUNTIME_CONFIGURATION');
    // Called before a task is admitted; repeated resolution while running is harmless.
    await this.start();
    if (this.logError) throw error('LOCAL_RUNTIME_LOG_WRITE_FAILED', 500);
    if (model.localRuntime) {
      // Run IDs, PIDs, log locations and startup times may change on replay. The
      // model/engine/template bytes and effective server settings may not.
      if (canonicalIdentity(runtimeIdentity(model.localRuntime)) !== canonicalIdentity(runtimeIdentity(this.manifest))) throw error('LOCAL_MODEL_CONFIG_CHANGED', 409);
    }
    return { ...model, provider: 'local', model: this.asset.id, baseUrl: `http://127.0.0.1:${this.config.port}/v1`, apiKey: '',
      maxOutputTokens: model.maxOutputTokens ?? this.config.maxOutputTokens, localRuntime: structuredClone(this.manifest) };
  }
  assertModel(model) {
    if (model?.provider !== 'local') return;
    if (this.state !== 'ready' || !isAlive(this.child)) throw error('LOCAL_MODEL_NOT_RUNNING', 409);
    if (!model.localRuntime || model.localRuntime.ownerId !== this.manifest?.ownerId ||
      canonicalIdentity(runtimeIdentity(model.localRuntime)) !== canonicalIdentity(runtimeIdentity(this.manifest)) ||
      model.baseUrl !== `http://127.0.0.1:${this.config.port}/v1`) throw error('LOCAL_MODEL_WORKER_SESSION_STALE', 409);
  }
  async evidenceCursor() {
    await this.writeQueue;
    if (!this.manifest) return null;
    const offsets = {};
    for (const role of ['events', 'stdout', 'stderr']) offsets[role] = (await stat(this.manifest.logs[role]).catch(() => null))?.size ?? 0;
    return { ownerId: this.manifest.ownerId, logs: { ...this.manifest.logs }, offsets };
  }
  /** Byte-exact, self-contained shared-runtime log ranges for the run collector. */
  async captureRuntimeEvidence(cursor = null) {
    await this.writeQueue;
    if (!this.manifest) return null;
    if (cursor && cursor.ownerId !== this.manifest.ownerId) throw error('LOCAL_RUNTIME_EVIDENCE_SESSION_CHANGED', 409);
    const files = [];
    for (const role of ['manifest', 'props', 'events', 'stdout', 'stderr']) {
      const file = this.manifest.logs[role];
      let handle;
      try {
        handle = await open(file, 'r');
        const size = (await handle.stat()).size;
        const start = ['events', 'stdout', 'stderr'].includes(role) ? (cursor?.offsets?.[role] ?? 0) : 0;
        if (!Number.isSafeInteger(start) || start < 0 || start > size) throw error('LOCAL_RUNTIME_LOG_RANGE_INVALID', 409);
        const bytes = Buffer.alloc(size - start); let position = 0;
        while (position < bytes.length) {
          const { bytesRead } = await handle.read(bytes, position, bytes.length - position, start + position);
          if (!bytesRead) throw error('LOCAL_RUNTIME_LOG_TRUNCATED_DURING_CAPTURE', 500);
          position += bytesRead;
        }
        files.push({ role, sourcePath: file, byteStart: start, byteEnd: size, bytes: bytes.length,
          sha256: hashText(bytes), encoding: 'base64', content: bytes.toString('base64') });
      } catch (cause) {
        if (cause.code !== 'ENOENT') throw cause;
        // A ready session always writes these files. Their later absence is
        // evidence loss, not an optional log, and must prevent a complete bundle.
        if (['manifest', 'props', 'events'].includes(role)) throw error(`LOCAL_RUNTIME_EVIDENCE_MISSING:${role}`, 500);
        files.push({ role, sourcePath: file, unavailable: 'not-created-by-runtime' });
      } finally { await handle?.close(); }
    }
    return { schemaVersion: 1, ownerId: this.manifest.ownerId, scope: 'shared-runtime-session-byte-ranges',
      attribution: 'Ranges may overlap concurrent experiment activity; model HTTP exchanges are recorded separately per run.',
      capturedAt: new Date().toISOString(), manifest: structuredClone(this.manifest), files };
  }
  async captureEvidence(model, cursor = null, clean = value => value) {
    if (model?.provider && model.provider !== 'local') return null;
    if (model?.localRuntime?.ownerId && model.localRuntime.ownerId !== this.manifest?.ownerId) throw error('LOCAL_RUNTIME_EVIDENCE_SESSION_CHANGED', 409);
    // Never open arbitrary paths supplied by a run/model object. Only this
    // service's own generated session paths are eligible for evidence capture.
    return redactRuntimeEvidence(await this.captureRuntimeEvidence(cursor), clean);
  }
  async handle(req, res, pathname, body) {
    if (!pathname.startsWith('/api/local-model/')) return false;
    await this.initialized;
    try {
      let result;
      if (req.method === 'GET' && ['/api/local-model/status', '/api/local-model/config'].includes(pathname)) result = this.status();
      else if (req.method === 'POST' && ['/api/local-model/config', '/api/local-model/configure'].includes(pathname)) result = await this.configure(body);
      else if (req.method === 'POST' && pathname === '/api/local-model/start') result = await this.start();
      else if (req.method === 'POST' && pathname === '/api/local-model/stop') result = await this.stop();
      else throw error('LOCAL_MODEL_ROUTE_OR_METHOD_NOT_ALLOWED', 405);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(result));
    } catch (cause) {
      res.writeHead(cause.status ?? 500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: cause.code ?? cause.message, message: cause.message, provider: 'local', fallback: 'disabled' }));
    }
    return true;
  }
  async shutdown() { return this.stop({ checkBusy: false }); }
}

async function listenerPids(port) {
  // Never adopt a listener PID: verify against the ChildProcess handle we created.
  // macOS ships lsof; Windows supplies Get-NetTCPConnection. Linux still retains
  // exact child ownership and model identity even where lsof is not installed.
  if (!['win32', 'darwin'].includes(process.platform)) return null;
  return new Promise((resolve, reject) => {
    const executable = process.platform === 'darwin' ? '/usr/sbin/lsof' : 'powershell.exe';
    const args = process.platform === 'darwin' ? ['-nP', `-iTCP:${Number(port)}`, '-sTCP:LISTEN', '-t'] : ['-NoProfile', '-NonInteractive', '-Command',
      `@(Get-NetTCPConnection -State Listen -LocalPort ${Number(port)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique) -join ','`];
    const child = spawn(executable, args,
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve(output.trim().split(/[,\s]+/).map(Number).filter(pid => Number.isSafeInteger(pid) && pid > 0)) : reject(error('LOCAL_LISTENER_VERIFICATION_FAILED', 500)));
  });
}
