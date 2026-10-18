import { mkdir, readFile, writeFile, rename, readdir, open, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { FileHandle } from 'node:fs/promises';
import { buildExecutionTrace, renderExecutionTraceMarkdown } from './trace.js';
import { buildProvenanceGraph, renderGraphML } from './graph.js';
import { buildDiagnostics } from './diagnostics.js';

export const json = (value: unknown) => JSON.stringify(value, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export async function atomic(path: string, content: string) {
  const tmp = path + '.' + randomUUID() + '.tmp';
  await writeFile(tmp, content, { mode: 0o600 });
  await rename(tmp, path);
}
const secretField = /^(authorization|api[-_]?key|private[-_]?key|secret|mnemonic|seedPhrase|signedTransaction|rawTransaction|password|access[-_]?token|refresh[-_]?token)$/i;
export class Redactor {
  private secrets: string[] = [];
  add(...values: (string | undefined)[]) {
    for (const value of values) if (value && value.length >= 4 && !this.secrets.includes(value)) this.secrets.push(value);
  }
  clean(value: any): any {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'string') {
      let text = value;
      for (const secret of this.secrets) text = text.split(secret).join('[REDACTED]');
      text = text.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]');
      text = text.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]');
      return text;
    }
    if (Array.isArray(value)) return value.map(v => this.clean(v));
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) out[key] = secretField.test(key) ? '[REDACTED]' : this.clean(val);
      return out;
    }
    return value ?? null;
  }
}

export class Recorder {
  readonly runId = randomUUID();
  readonly folder: string;
  readonly redactor: Redactor;
  private handle?: FileHandle;
  private count = 0;
  private queue: Promise<any> = Promise.resolve();
  private failure?: Error;
  private sealed = false;
  private started = performance.now();
  constructor(readonly dataDir: string, redactor = new Redactor()) {
    this.folder = join(dataDir, 'runs', this.runId);
    this.redactor = redactor;
  }
  async start(config: any) {
    await mkdir(join(this.folder, 'blobs'), { recursive: true });
    await atomic(join(this.folder, 'config.json'), json(this.redactor.clean({ ...config, schema_version: '1.0', run_id: this.runId })));
    this.handle = await open(join(this.folder, 'events.jsonl'), 'ax', 0o600);
    await this.emit('run.started', { started_at: new Date().toISOString(), data_origin: config.data_origin || (config.mode === 'llm' ? 'llm' : 'scripted'), chain_execution: 'real_anvil' });
  }
  emit(type: string, payload: any, links: Record<string, any> = {}): Promise<void> {
    if (this.sealed) return Promise.reject(new Error('RECORDING_SEALED'));
    const operation = this.queue.then(async () => {
      if (this.failure) throw this.failure;
      if (!this.handle) throw new Error('RECORDING_NOT_OPEN');
      const body = json(this.redactor.clean(payload));
      const hash = sha256(body);
      const blobPath = join(this.folder, 'blobs', hash + '.json');
      await atomic(blobPath, body);
      const event = {
        schema_version: '1.0', run_id: this.runId, event_id: randomUUID(), seq: ++this.count,
        timestamp: new Date().toISOString(), monotonic_ms: performance.now() - this.started,
        type, links: this.redactor.clean(links),
        payload_ref: { sha256: hash, path: `blobs/${hash}.json`, bytes: Buffer.byteLength(body), media_type: 'application/json' }
      };
      await this.handle.write(JSON.stringify(event) + '\n');
      await this.handle.sync();
    });
    this.queue = operation.catch(error => { this.failure = error; });
    return operation;
  }
  async seal(recordingStatus = 'complete') {
    await this.queue;
    this.sealed = true;
    await this.handle?.close();
    this.handle = undefined;
    if (this.failure) throw this.failure;
    const files: Record<string, { sha256: string, bytes: number }> = {};
    for (const path of ['config.json', 'events.jsonl', ...(await readdir(join(this.folder, 'blobs'))).map(n => 'blobs/' + n)]) {
      const bytes = await readFile(join(this.folder, path));
      files[path] = { sha256: sha256(bytes), bytes: bytes.length };
    }
    const manifest = { schema_version: '1.0', run_id: this.runId, recording_status: recordingStatus, event_count: this.count, sealed_at: new Date().toISOString(), files };
    await atomic(join(this.folder, 'manifest.json'), json(manifest));
    return manifest;
  }
}

export function safeRun(dataDir: string, runId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new Error('INVALID_RUN_ID');
  return join(dataDir, 'runs', runId);
}
export async function readJSON(path: string, fallback: any = undefined): Promise<any> {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error: any) { if (error.code === 'ENOENT' && fallback !== undefined) return fallback; throw error; }
}
export async function verifyRun(dataDir: string, runId: string) {
  const folder = safeRun(dataDir, runId);
  const manifest = await readJSON(join(folder, 'manifest.json'), null);
  const errors: string[] = [];
  if (!manifest) return { valid: false, errors: ['UNSEALED_RECORDING'], manifest: null };
  for (const [name, expected] of Object.entries(manifest.files) as any) {
    if (name.startsWith('/') || name.includes('..') || name.includes('\\')) { errors.push('INVALID_PATH:' + name); continue; }
    try { const b = await readFile(join(folder, name)); if (sha256(b) !== expected.sha256 || b.length !== expected.bytes) errors.push('HASH_MISMATCH:' + name); }
    catch { errors.push('MISSING_FILE:' + name); }
  }
  for (const name of ['config.json', 'events.jsonl']) if (!manifest.files[name]) errors.push('MISSING_MANIFEST_ENTRY:' + name);
  try {
    const text = await readFile(join(folder, 'events.jsonl'), 'utf8');
    if (!text.endsWith('\n')) errors.push('TRUNCATED_EVENT_STREAM');
    const events = text.trim().split('\n').filter(Boolean).map(x => JSON.parse(x));
    if (events.length !== manifest.event_count) errors.push('EVENT_COUNT_MISMATCH');
    events.forEach((e, index) => {
      if (e.seq !== index + 1 || e.run_id !== runId) errors.push('EVENT_SEQUENCE_MISMATCH');
      if (!manifest.files[e.payload_ref?.path] || manifest.files[e.payload_ref.path].sha256 !== e.payload_ref.sha256) errors.push('INVALID_PAYLOAD_REFERENCE');
    });
  } catch { errors.push('INVALID_EVENT_STREAM'); }
  return { valid: errors.length === 0, errors, manifest };
}
export async function readEvents(dataDir: string, runId: string) {
  const folder = safeRun(dataDir, runId);
  const txt = await readFile(join(folder, 'events.jsonl'), 'utf8').catch(() => '');
  const rows = txt.split('\n');
  if (rows.at(-1) !== '') rows.pop(); // A concurrent append is never presented as a complete event.
  const events: any[] = [];
  for (const line of rows.filter(Boolean)) {
    const e = JSON.parse(line);
    const p = e.payload_ref.path;
    if (!/^blobs\/[a-f0-9]{64}\.json$/.test(p)) throw new Error('INVALID_PAYLOAD_PATH');
    const payload = await readFile(join(folder, p), 'utf8');
    if (sha256(payload) !== e.payload_ref.sha256) throw new Error('PAYLOAD_HASH_MISMATCH');
    events.push({ ...e, payload: JSON.parse(payload) });
  }
  return events;
}
export async function saveResult(dataDir: string, runId: string, result: any) {
  safeRun(dataDir, runId);
  const dir = join(dataDir, 'derived', runId);
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 6);
  await atomic(join(dir, stamp + '.json'), json(result));
  await atomic(join(dir, 'latest.json'), json(result));
}
export async function readRun(dataDir: string, runId: string) {
  const folder = safeRun(dataDir, runId);
  return {
    config: await readJSON(join(folder, 'config.json')),
    events: await readEvents(dataDir, runId),
    result: await readJSON(join(dataDir, 'derived', runId, 'latest.json'), null),
    manifest: await readJSON(join(folder, 'manifest.json'), null)
  };
}
type RunMetadata={reported:string[];queriedBalance:boolean};
const runMetadataCache=new Map<string,{signature:string;metadata:RunMetadata}>();
function eventMetadata(events:any[]):RunMetadata {
  return {reported:[...new Set<string>(events.filter(event=>event.type==='model.response'&&typeof event.payload?.response?.model==='string').map(event=>event.payload.response.model))],queriedBalance:events.some(event=>event.type==='tool.result'&&event.payload?.name==='get_balance'&&!event.payload?.error)};
}
export async function listRuns(dataDir: string) {
  const ids = await readdir(join(dataDir, 'runs')).catch(() => []);
  const rows = await Promise.all(ids.filter(id => /^[0-9a-f-]{36}$/i.test(id)).map(async runId => {
    const folder = safeRun(dataDir, runId);
    const config = await readJSON(join(folder, 'config.json'), {});
    const result = await readJSON(join(dataDir, 'derived', runId, 'latest.json'), null);
    const manifest = await readJSON(join(folder, 'manifest.json'), null);
    const signature=manifest?.files?.['events.jsonl']?.sha256;
    const cacheKey=folder;const cached=signature?runMetadataCache.get(cacheKey):undefined;
    let metadata=cached&&cached.signature===signature?cached.metadata:undefined;
    let events:any[]=[];
    if(!metadata) {
      events=await readEvents(dataDir,runId).catch(()=>[]);metadata=eventMetadata(events);
      if(signature) {if(runMetadataCache.size>=1000) runMetadataCache.delete(runMetadataCache.keys().next().value!);runMetadataCache.set(cacheKey,{signature,metadata});}
    }
    const summary=runSummary(config,result,events,metadata);
    return { runId, ...config, taskId: config.taskId, taskTitle:config.task?.title, startedAt: config.createdAt, result, status: result?.status ?? 'unknown', recordingStatus: manifest?.recording_status ?? 'incomplete', ...summary };
  }));
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
/** Requested routing alias and provider-reported model are distinct evidence. */
export function runSummary(config:any,result:any,events:any[],metadata=eventMetadata(events)) {
  const reported=metadata.reported;
  const diagnostics=result?.diagnostics??buildDiagnostics(result??{},events);
  const chainStatus=diagnostics.chainExecutionStatus;
  const queryOnly=chainStatus==='not_submitted'&&config.taskId==='balance'&&metadata.queriedBalance;
  return {taskStatus:result?.status??'unknown',chainExecutionStatus:queryOnly?'query_only':chainStatus,modelSummary:{requested:config.mode==='llm'?(config.model?.model??null):null,reported,reportedSource:reported.length?'model.response':null}};
}
/** Convenience views are derived from immutable redacted evidence, never a second truth source. */
export function executionTraceFiles(run: any, manifestText: string) {
  const trace = buildExecutionTrace(run.config, run.events, run.manifest);
  Object.assign(trace.provenance, { source_manifest_sha256: sha256(manifestText), integrity: 'raw_manifest_verified_before_derivation' });
  const graph = buildProvenanceGraph(trace, run.config, run.events);
  const cell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const edges = graph.edges.map((edge: any) => [edge.id, edge.source, edge.target, edge.type, edge.source_events.map((e: any) => e.seq).join(';')].map(cell).join(','));
  const files: Record<string, string> = {
    'derived/execution-trace.json': json(trace) + '\n',
    'derived/execution-trace.md': renderExecutionTraceMarkdown(trace),
    'derived/provenance-graph.json': json(graph) + '\n',
    'derived/provenance-graph.graphml': renderGraphML(graph),
    'derived/nodes.csv': '\uFEFF' + ['node_id,type,label,attributes_json,source_event_seqs', ...graph.nodes.map(node => [node.id, node.type, node.label, JSON.stringify(node.attributes), node.source_events.map(e => e.seq).join(';')].map(cell).join(','))].join('\r\n') + '\r\n',
    'derived/relations.csv': '\uFEFF' + ['edge_id,source_id,target_id,relation,source_event_seqs', ...edges].join('\r\n') + '\r\n',
    'derived/trace-events.jsonl': run.events.map((event: any) => JSON.stringify(event)).join('\n') + '\n',
  };
  files['derived/execution-trace-manifest.json'] = json({
    schema_version: '1.0', kind: 'derived_trace_views', run_id: run.config.run_id,
    source_manifest_sha256: sha256(manifestText),
    builder_version: trace.provenance.builder_version,
    files: Object.fromEntries(Object.entries(files).map(([name, body]) => [name, { sha256: sha256(body), bytes: Buffer.byteLength(body) }])),
    note: 'Convenience files are regenerated from verified raw evidence. Their hashes detect changes, not source authenticity. CSV cells beginning with spreadsheet operators are escaped; JSON retains exact values.',
  }) + '\n';
  return { trace, graph, files };
}
export async function readExecutionTrace(dataDir: string, runId: string) {
  const verification = await verifyRun(dataDir, runId);
  if (!verification.valid) throw new Error('TRACE_REQUIRES_VALID_SEALED_RECORDING:' + verification.errors.join(','));
  const run = await readRun(dataDir, runId);
  return executionTraceFiles(run, await readFile(join(safeRun(dataDir, runId), 'manifest.json'), 'utf8'));
}
export async function saveExecutionTrace(dataDir: string, runId: string) {
  const built = await readExecutionTrace(dataDir, runId);
  const dir = join(dataDir, 'derived', runId);
  await mkdir(dir, { recursive: true });
  for (const [name, content] of Object.entries(built.files)) await atomic(join(dir, name.slice('derived/'.length)), content);
  return built.trace;
}
export async function exportRun(dataDir: string, runId: string) {
  const verification = await verifyRun(dataDir, runId);
  if (!verification.valid) throw new Error('EXPORT_REQUIRES_VALID_SEALED_RECORDING:' + verification.errors.join(','));
  const folder = safeRun(dataDir, runId);
  const files: Record<string, string> = {};
  for (const name of [...Object.keys(verification.manifest.files), 'manifest.json']) files[name] = await readFile(join(folder, name), 'utf8');
  const derived = await readdir(join(dataDir, 'derived', runId)).catch(() => []);
  for (const name of derived) files['derived/' + name] = await readFile(join(dataDir, 'derived', runId, name), 'utf8');
  Object.assign(files, (await readExecutionTrace(dataDir, runId)).files);
  return { format: 'web3-agent-lab-bundle', version: '1.0', run_id: runId, files, verification, note: 'Raw files are immutable; derived/ contains versioned checks and regenerable execution trace JSON, Markdown, relations CSV and expanded JSONL. Hashes detect accidental changes, not adversarial forgery.' };
}
