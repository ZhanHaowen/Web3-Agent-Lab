import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { ChainLab } from './chain.js';
import { TASKS, toolDefinitions, resolveTask } from './tasks.js';
import { checkTask } from './checker.js';
import { runAgent } from './agent.js';
import { buildDiagnostics } from './diagnostics.js';
import { buildExecutionTrace } from './trace.js';
import { buildProvenanceGraph } from './graph.js';
import { Recorder, Redactor, json, readRun, readEvents, listRuns, runSummary, sha256, saveResult, saveExecutionTrace, readExecutionTrace, verifyRun, exportRun, readJSON } from './store.js';
import { continuationHistory, mergeTransactions, parentReferences } from './continuation.js';

const ROOT = resolve(process.env.LAB_ROOT || process.cwd());
const DATA = resolve(process.env.LAB_DATA_DIR || join(ROOT, 'data'));
const PORT = Number(process.env.LAB_PORT || 4317);
const CHAIN_PORT = Number(process.env.LAB_CHAIN_PORT || 8547);
const TOKEN = randomBytes(32).toString('hex');
const redactor = new Redactor();
redactor.add('test test test test test test test test test test test junk');
const chain = new ChainLab({ rpcUrl: `http://127.0.0.1:${CHAIN_PORT}`, anvilPath: process.env.ANVIL_PATH || join(ROOT, 'runtime', process.platform === 'win32' ? 'anvil.exe' : 'anvil'), dataDir: join(DATA, 'environment') });
const version = await readJSON(join(ROOT, 'build-info.json'), { version: '0.1.3', displayVersion: 'V0.13', releaseRevision: 'beta-1', releaseLabel: 'V0.13', sourceHash: 'development' });
let ready = false;
let busy = false;
let chainState: any = null;
let active: any = null;
let controller: AbortController | null = null;
let gate: { resolve: () => void; reject: (error: Error) => void } | null = null;
let activeRecorder: Recorder | null = null;
let shuttingDown = false;
let sessionId: string | null = null;
let sessionEpoch: string | null = null;
let previousRunId: string | null = null;

function syncSession() {
  const epoch = ready ? chain.env()?.chainInstanceId : null;
  if (epoch !== sessionEpoch) { sessionEpoch = epoch; sessionId = epoch ? randomUUID() : null; previousRunId = null; }
}
async function refresh() { chainState = ready ? await chain.state() : null; syncSession(); return chainState; }
function status() { syncSession(); return { app: 'web3-agent-lab', version, ready, busy, environment: ready ? chain.env() : null, chainState, active, session_id: sessionId, previous_run_id: previousRunId, dataDirectory: DATA }; }
function requireIdle() { if (busy) throw new Error('BUSY: 当前实验尚未结束'); }
function requireReady() { if (!ready) throw new Error('ENVIRONMENT_NOT_READY: 请先初始化实验环境'); }
async function environmentAction<T>(operation: () => Promise<T>): Promise<T> {
  requireIdle(); busy = true;
  try { return await operation(); } finally { busy = false; }
}
async function pause(recorder: Recorder, phase: string, detail: any, signal: AbortSignal) {
  if (signal.aborted) throw new Error('RUN_CANCELLED');
  await recorder.emit('control.paused', { phase, detail });
  active.state = 'paused'; active.pause = { phase, ...detail };
  await new Promise<void>((resolveGate, rejectGate) => {
    const onAbort = () => { gate = null; rejectGate(new Error('RUN_CANCELLED')); };
    gate = { resolve: () => { signal.removeEventListener('abort', onAbort); gate = null; resolveGate(); }, reject: rejectGate };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
  active.state = 'running'; active.pause = null;
  await recorder.emit('control.resumed', { phase });
}
function validateRun(body: any) {
  if(!TASKS.some(t=>t.id===body.taskId)) throw new Error('INVALID_TASK');
  const task = resolveTask(body.taskId, {taskInput:body.taskInput,taskParameters:body.taskParameters});
  if (!['scripted', 'llm'].includes(body.mode)) throw new Error('INVALID_MODE');
  if (body.experimentMode != null && !['independent', 'continuous'].includes(body.experimentMode)) throw new Error('INVALID_EXPERIMENT_MODE: 请选择独立实验或连续实验');
  if (body.amountValidation != null && !['fixed_task', 'schema_only'].includes(body.amountValidation)) throw new Error('INVALID_AMOUNT_VALIDATION');
  if (body.faultMode && body.faultMode !== 'normal' && (body.taskId !== 'transfer' || body.mode !== 'scripted')) throw new Error('FAULT_MODE_REQUIRES_SCRIPTED_TRANSFER');
  if (body.faultMode && !['normal', 'transfer_revert', 'wrong_recipient'].includes(body.faultMode)) throw new Error('INVALID_FAULT_MODE');
  if (body.taskInput && (typeof body.taskInput !== 'string' || body.taskInput.length > 32000)) throw new Error('INVALID_TASK_INPUT');
  if (body.allowedTools && (!Array.isArray(body.allowedTools) || body.allowedTools.some((n: any) => !(task.allowedTools as readonly string[]).includes(n)))) throw new Error('INVALID_TOOL_ALLOWLIST');
  if (body.toolOverrides && (Array.isArray(body.toolOverrides) || typeof body.toolOverrides !== 'object')) throw new Error('INVALID_TOOL_OVERRIDES');
  if (body.mode === 'llm') {
    const url = new URL(body.model?.baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('INVALID_MODEL_ENDPOINT: endpoint cannot contain credentials, query parameters or fragments');
    if (!body.model?.model || typeof body.model.model !== 'string') throw new Error('MODEL_REQUIRED');
    if (body.model.maxSteps != null && (!Number.isInteger(body.model.maxSteps) || body.model.maxSteps < 1 || body.model.maxSteps > 100)) throw new Error('MAX_STEPS_MUST_BE_1_TO_100');
    if (body.model.temperature != null && (!Number.isFinite(body.model.temperature) || body.model.temperature < 0 || body.model.temperature > 2)) throw new Error('TEMPERATURE_MUST_BE_0_TO_2');
  }
  return task;
}
function miningOptions(body:any) {
  const options={blocks:body.blocks??1,seconds:body.seconds??1};
  if(!Number.isSafeInteger(options.blocks)||options.blocks<1||options.blocks>1000||!Number.isSafeInteger(options.seconds)||options.seconds<1||options.seconds>86400) throw new Error('INVALID_MINING_OPTIONS: blocks须为1..1000整数，seconds须为1..86400整数（每块间隔）');
  return options;
}
function continuationEligibility(run:any,id:string) {
  if(!ready) return {allowed:false,reason:'ENVIRONMENT_NOT_READY'};
  if(busy) return {allowed:false,reason:'BUSY'};
  if(run.config?.mode!=='llm') return {allowed:false,reason:'CONTINUATION_REQUIRES_LLM'};
  if(run.result?.status==='success') return {allowed:false,reason:'TASK_ALREADY_SUCCESSFUL: 任务已经完成，请新建实验，避免重复执行'};
  if(previousRunId!==id) return {allowed:false,reason:'RUN_SUPERSEDED: 只能继续当前环境中的最后一次运行'};
  if(run.config.environment?.chainInstanceId!==chain.env()?.chainInstanceId) return {allowed:false,reason:'CHAIN_EPOCH_CHANGED'};
  if(run.manifest?.recording_status!=='complete') return {allowed:false,reason:'CONTINUATION_REQUIRES_COMPLETE_RECORDING'};
  return {allowed:true,reason:null};
}
async function prepareContinuation(id:string,body:any) {
  requireIdle();requireReady();
  if(Object.keys(body).some(key=>!['blocks','seconds','model'].includes(key))||Object.keys(body.model??{}).some(key=>key!=='apiKey')) throw new Error('CONTINUATION_CONFIG_IMMUTABLE: 续行只允许出块参数和重新填写API密钥，模型及任务配置沿用原记录');
  const options=miningOptions(body);
  const integrity=await verifyRun(DATA,id);if(!integrity.valid) throw new Error('INVALID_RECORDING:'+integrity.errors.join(','));
  const run=await readRun(DATA,id);const eligibility=continuationEligibility(run,id);if(!eligibility.allowed) throw new Error(eligibility.reason!);
  const evidence=run.events.find((event:any)=>event.type==='check.evidence')?.payload;
  if(!evidence?.before||!Array.isArray(evidence.transactions)) throw new Error('CONTINUATION_EVIDENCE_MISSING');
  const history=continuationHistory(run.events);
  const inherited=run.events.find((event:any)=>event.type==='continuation.parent')?.payload?.inheritedObservations??[];
  history.observations=[...inherited,...history.observations];
  const config={...run.config,experimentMode:'continuous',model:{...run.config.model,apiKey:body.model?.apiKey}};
  const manifest=await readFile(join(DATA,'runs',id,'manifest.json'),'utf8');
  return {body:config,context:{run,id,evidence,history,mining:options,parentManifestSha256:sha256(manifest)}};
}
async function beginRun(body: any, parentRunId?: string, continuation?:any) {
  requireIdle(); requireReady();
  const task = validateRun(body);
  const experimentMode = body.experimentMode || 'independent';
  const amountValidation = body.amountValidation ?? 'fixed_task';
  busy = true;
  const recorder = new Recorder(DATA, redactor);
  const localController = new AbortController(); controller = localController;
  const started = performance.now();
  redactor.add(body.model?.apiKey);
  try {
    let mining:any=null;let resumedState:any=null;let inheritedTransactions:any[]=[];
    if(continuation) {
      // Recheck after acquiring the busy guard: parallel requests must not
      // produce two continuations of the same parent or mine twice.
      if(previousRunId!==continuation.id||continuation.run.config.environment?.chainInstanceId!==chain.env()?.chainInstanceId) throw new Error('CONTINUATION_STATE_CHANGED');
      const verification=await verifyRun(DATA,continuation.id);if(!verification.valid) throw new Error('INVALID_RECORDING:'+verification.errors.join(','));
      mining=(await chain.mine(continuation.mining)).mining;
      resumedState=await refresh();
      inheritedTransactions=mergeTransactions(continuation.evidence.transactions,await Promise.all(continuation.evidence.transactions.filter((tx:any)=>tx.hash||tx.txHash).map((tx:any)=>chain.inspectTransaction(tx.hash||tx.txHash))));
    }
    const automine = Boolean((chain.env() as any)?.automine ?? true);
    if (!continuation&&experimentMode === 'independent') {
      await chain.reset();
      if (!automine) await chain.setAutomine(false);
    } else if (!continuation&&await chain.hasPendingTransactions()) {
      throw new Error('CONTINUOUS_PENDING_TRANSACTIONS: 当前链仍有待确认或排队交易，请先出块确认并检查上一轮结果，或重置环境后再运行');
    }
    chain.beginRunCapture();
    if(continuation) {chain.transactions.push(...inheritedTransactions);chain.observations.push(...(continuation.evidence.observations??[]));}
    const current = await refresh();
    const before = continuation?continuation.evidence.before:current;
    const config = {
      ...body, model: { ...(body.model || {}), apiKey: body.model?.apiKey ? '[REDACTED]' : null },
      task: { ...task, input: body.taskInput || task.input, allowedTools: body.allowedTools || task.allowedTools },
      taskParameters:task.taskParameters,taskSpec:task,taskParameterSource:task.parameterSource,
      framework: { agentkit: '0.10.4', langgraph: '1.4.18', viem: '2.38.3', anvil: '1.7.1' },
      toolDefinitions, environment: chain.env(), createdAt: new Date().toISOString(),
      parent_run_id: parentRunId || null, build: version,
      continuation_of:continuation?.id??null,
      experimentMode, amountValidation, session_id: sessionId, previous_run_id: experimentMode === 'continuous' ? previousRunId : null,
      initial_state: { blockNumber: before.blockNumber, blockHash: before.blockHash, chainInstanceId: before.chainInstanceId },
      rerun_policy: experimentMode === 'continuous' ? 'offline_replay_and_check_only; restore a saved session snapshot explicitly to start a new run' : 'restore_standard_baseline',
      model_nondeterminism: 'Rerun is a new experiment; identical LLM responses are not guaranteed.',
      mode: body.mode, data_origin: body.dataOrigin || (body.mode === 'llm' ? 'llm' : 'scripted'),
      redaction: { policy: 'known-secrets-and-sensitive-fields-v1', text_may_be_redacted: true }
    };
    await recorder.start(config);
    activeRecorder = recorder;
    await recorder.emit('state.before', before);
    if(continuation) {
      const references=parentReferences(continuation.run.events,continuation.id,inheritedTransactions);
      await recorder.emit('continuation.parent',{parentRunId:continuation.id,parentManifestSha256:continuation.parentManifestSha256,parentEventRefs:continuation.history.sourceEvents,historySha256:continuation.history.historySha256,...references,inheritedObservations:continuation.history.observations,originalBefore:before,stateAfterMining:resumedState,mining});
      await recorder.emit('state.continuation',resumedState);
    }
    await recorder.emit('environment.baseline', await chain.exportBaseline());
    if (experimentMode === 'continuous') await recorder.emit('environment.initial', await chain.exportCurrentState());
    previousRunId = recorder.runId;
    active = { runId: recorder.runId, state: 'running', taskId: body.taskId, experimentMode, startedAt: config.createdAt, pause: null };
    void executeRun();
    return { runId: recorder.runId,...(continuation?{parentRunId:continuation.id,mining}:{}) };

    async function executeRun() {
      // Capture all submission attempts, including timeouts without a returned hash.
      // beginRunCapture() made this array specific to the current run.
      const txs = chain.transactions;
      let agentResult: any = null;
      let runError: string | null = null;
      let after: any = null;
      let verdict: any = null;
      let recordingStatus = 'complete';
      const emit = (type: string, payload: any, links?: any) => recorder.emit(type, payload, links);
      try {
        agentResult = await runAgent({
          mode: body.mode, task: { ...task, input: body.taskInput || task.input, allowedTools: body.allowedTools || task.allowedTools },
          taskInput: body.taskInput, model: body.model || {}, toolDefinitions,
          taskParameters:task.taskParameters,
          ...(continuation?{continuation:{messages:continuation.history.messages,observations:continuation.history.observations,state:resumedState,parentRunId:continuation.id,transactions:inheritedTransactions}}:{}),
          experimentMode, amountValidation, initialState: before,
          toolOverrides: body.toolOverrides || {}, signal: localController.signal, emit,
          beforeTool: async (name: string, args: any, callId: string) => {
            if (localController.signal.aborted) throw new Error('RUN_CANCELLED');
            if (body.pauseBeforeTool) await pause(recorder, 'before_tool', { name, args, callId }, localController.signal);
          },
          executeTool: async (name: string, args: any, context?: any) => {
            let effective = args;
            if (name === 'transfer_token' && body.faultMode && body.faultMode !== 'normal') {
              effective = { ...args, ...(body.faultMode === 'transfer_revert' ? { amount: '1000000000' } : { recipient: (chain.env() as any).accounts.observer }) };
              await emit('intervention.transaction', { name, original_args: args, effective_args: effective, fault_mode: body.faultMode }, context);
            }
            const result = await chain.execute(name, effective, {
              emit: async (type: string, payload: any, links?: any) => emit(type, payload, { ...(context || {}), ...(links || {}) }),
              beforeSubmit: async (descriptor: any) => {
                if (localController.signal.aborted) throw new Error('RUN_CANCELLED');
                if (body.pauseBeforeTransaction) await pause(recorder, 'before_transaction', { descriptor }, localController.signal);
              }
            });
            return result;
          }
        } as any);
        await emit('agent.finished', agentResult);
      } catch (error: any) {
        runError = redactor.clean(error.message || String(error));
        try { await emit('run.error', { message: runError, cancelled: localController.signal.aborted }); } catch { recordingStatus = 'incomplete'; }
      }
      try {
        after = await refresh();
        await emit('state.after', after);
        verdict = await chain.check(body.taskId, before, after, txs, agentResult?.final, { experimentMode,taskParameters:task.taskParameters });
        await emit('check.evidence', verdict.evidence);
      } catch (error: any) {
        verdict = { status: 'unknown', check_status: 'error', assertions: [], error: redactor.clean(error.message), transactions: txs };
      }
      const costs = {
        duration_ms: performance.now() - started,
        model_calls: agentResult?.modelCalls ?? null, token_usage: agentResult?.usage ?? null,
        tool_calls: agentResult?.toolCalls ?? null,
        transaction_attempts: verdict?.costs?.transactionAttempts ?? null, transport_retries: 0,
        tool_retry_count: null, tool_retry_reason: 'Repeated tool intent must be classified in later analysis; raw call IDs are retained.',
        gas_used: verdict?.costs?.gasUsed ?? null,
        gas_cost_wei: verdict?.costs?.gasCostWei ?? null,
        gas_complete: Array.isArray(verdict?.evidence?.transactions) && !verdict.evidence.transactions.some((tx: any) => !tx.receipt),
        missing_usage_reason: body.mode === 'scripted' ? 'no_model_used' : agentResult?.usage?.totalTokens == null ? 'provider_usage_incomplete' : null
      };
      const result = redactor.clean({ ...verdict, run_id: recorder.runId, taskId: body.taskId, experimentMode, session_id: sessionId, previous_run_id: config.previous_run_id, continuation_of:config.continuation_of, checker_version: verdict?.checkerVersion || '2.2.0', check_id: randomUUID(), evidence_source: 'original_run', checked_at: new Date().toISOString(), check_mode: 'live', agent: agentResult, run_error: runError || agentResult?.error || null, costs:{...costs,transaction_scope:continuation?'cumulative_task':'current_run',model_scope:'current_run'}, cancelled: localController.signal.aborted });
      try {
        await emit('run.finished', { duration_ms: costs.duration_ms, cancelled: localController.signal.aborted });
        await recorder.seal(recordingStatus);
      } catch (error: any) { result.recording_error = redactor.clean(error.message); result.status = 'unknown'; }
      result.diagnostics = buildDiagnostics(result, await readEvents(DATA, recorder.runId).catch(() => []));
      if (!result.recording_error) {
        try { await saveExecutionTrace(DATA, recorder.runId); }
        catch (error: any) { result.trace_export_error = redactor.clean(error.message); }
      }
      await saveResult(DATA, recorder.runId, result).catch(error => console.error('Failed to save result:', redactor.clean(error.message)));
      active = { ...active, state: 'finished', pause: null, status: result.status };
      busy = false; controller = null; gate = null; activeRecorder = null;
    }
  } catch (error) { busy = false; controller = null; activeRecorder = null; throw error; }
}

async function bodyJSON(req: IncomingMessage) {
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) { size += chunk.length; if (size > 1024 * 1024) throw new Error('REQUEST_TOO_LARGE'); chunks.push(chunk); }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
function send(res: ServerResponse, code: number, data: any) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  // Persisted bytes were already redacted before hashing. Re-redacting an old
  // export after a new session secret is entered would invalidate its manifest.
  res.end(json(data));
}
const server = createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
    const origin = `http://127.0.0.1:${PORT}`;
    const validHosts = [`127.0.0.1:${PORT}`, `localhost:${PORT}`];
    if (!validHosts.includes(req.headers.host || '') || (req.headers.origin && ![origin, `http://localhost:${PORT}`].includes(req.headers.origin))) return send(res, 403, { error: 'LOCAL_ORIGIN_REQUIRED' });
    const url = new URL(req.url || '/', origin); const path = url.pathname;
    if (req.method === 'GET' && path === '/api/health') return send(res, 200, { app: 'web3-agent-lab', ok: true, csrfToken: TOKEN, version });
    if (req.method !== 'GET' && req.headers['x-lab-token'] !== TOKEN) return send(res, 403, { error: 'SESSION_TOKEN_REQUIRED' });
    const body = req.method === 'POST' ? await bodyJSON(req) : {};
    if (path === '/api/status') return send(res, 200, status());
    if (path === '/api/tasks') return send(res, 200, TASKS);
    if (path === '/api/tasks/resolve'&&req.method==='POST') {
      if(!TASKS.some(task=>task.id===body.taskId)) throw new Error('INVALID_TASK');
      return send(res,200,resolveTask(body.taskId,{taskInput:body.taskInput,taskParameters:body.taskParameters}));
    }
    if (path === '/api/environment/init' && req.method === 'POST') {
      requireIdle(); busy = true;
      try { if (ready) await chain.stop(); ready = false; redactor.add(body.forkUrl); await chain.start(body); ready = true; await refresh(); return send(res, 200, status()); }
      finally { busy = false; }
    }
    if (path === '/api/environment/stop' && req.method === 'POST') { await environmentAction(async () => { await chain.stop(); ready = false; chainState = null; }); return send(res, 200, status()); }
    if (path === '/api/environment/reset' && req.method === 'POST') { requireReady(); await environmentAction(async () => { await chain.reset(); await refresh(); }); return send(res, 200, status()); }
    if (path === '/api/environment/snapshot' && req.method === 'POST') { requireReady(); const id = await environmentAction(() => chain.snapshot()); return send(res, 200, { id }); }
    if (path === '/api/environment/restore' && req.method === 'POST') { requireReady(); await environmentAction(async () => { await chain.restore(body.id); await refresh(); }); return send(res, 200, status()); }
    if (path === '/api/environment/mine' && req.method === 'POST') {
      requireReady(); if (busy && active?.state !== 'paused') throw new Error('BUSY');
      const options = miningOptions(body);let mining:any;
      if (activeRecorder && active?.state === 'paused') {
        await activeRecorder.emit('control.environment_operation', { operation: 'mine', options });
        mining=(await chain.mine(options)).mining; await refresh();
        await activeRecorder.emit('control.environment_result',{operation:'mine',mining});
        await activeRecorder.emit('state.intervention', chainState);
      } else await environmentAction(async () => { mining=(await chain.mine(options)).mining; await refresh(); });
      return send(res, 200, {...status(),mining});
    }
    if (path === '/api/environment/automine' && req.method === 'POST') { requireReady(); await environmentAction(() => chain.setAutomine(Boolean(body.enabled))); return send(res, 200, status()); }
    if (path === '/api/control' && req.method === 'POST') {
      if (body.action === 'cancel') controller?.abort();
      else if (body.action === 'resume') { if (!gate) throw new Error('NOT_PAUSED'); gate.resolve(); }
      else throw new Error('INVALID_CONTROL');
      return send(res, 200, status());
    }
    if (path === '/api/runs' && req.method === 'GET') return send(res, 200, await listRuns(DATA));
    if (path === '/api/runs' && req.method === 'POST') return send(res, 202, await beginRun(body));
    const match = path.match(/^\/api\/runs\/([a-f0-9-]{36})(?:\/(events|export|rerun|check|verify|trace|graph|continue-agent))?$/i);
    if (match) {
      const id = match[1]; const action = match[2];
      if (action === 'events') return send(res, 200, await readEvents(DATA, id));
      if(action==='continue-agent'&&req.method==='POST') {
        const prepared=await prepareContinuation(id,body);
        return send(res,202,await beginRun(prepared.body,id,prepared.context));
      }
      if (action === 'verify') return send(res, 200, await verifyRun(DATA, id));
      if ((action === 'trace' || action === 'graph') && req.method === 'GET') {
        const built = await readExecutionTrace(DATA, id);
        const format = url.searchParams.get('format') || 'json';
        if (format === 'json') return send(res, 200, action === 'graph' ? built.graph : built.trace);
        const key = action === 'graph' && format === 'graphml' ? 'derived/provenance-graph.graphml'
          : action === 'trace' && format === 'markdown' ? 'derived/execution-trace.md'
          : action === 'trace' && format === 'jsonl' ? 'derived/trace-events.jsonl'
          : action === 'graph' && format === 'csv' ? 'derived/relations.csv' : null;
        if (!key) throw new Error('UNSUPPORTED_TRACE_FORMAT');
        const mime = format === 'graphml' ? 'application/graphml+xml' : format === 'csv' ? 'text/csv' : format === 'jsonl' ? 'application/x-ndjson' : 'text/markdown';
        res.writeHead(200, { 'Content-Type': mime + '; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Disposition': `attachment; filename="${id}-${key.slice('derived/'.length)}"` });
        return res.end(built.files[key]);
      }
      if (action === 'export') {
        const bundle = await exportRun(DATA, id);
        res.setHeader('Content-Disposition', `attachment; filename="web3-run-${id}.json"`);
        return send(res, 200, bundle);
      }
      if (action === 'rerun' && req.method === 'POST') {
        const old = await readRun(DATA, id);
        if (old.config.experimentMode === 'continuous') throw new Error('CONTINUOUS_RERUN_UNSUPPORTED: 连续实验不能通过标准基线复现。请离线回放或复检；若已预存本会话快照，可先明确恢复快照再新建连续运行');
        const config = { ...old.config, ...body, experimentMode: 'independent', model: { ...old.config.model, ...(body.model || {}) } };
        if (config.model.apiKey === '[REDACTED]') config.model.apiKey = undefined;
        if (old.config.environment?.fork && !ready) throw new Error('RESTORE_MATCHING_FORK_FIRST');
        if (json(old.config.environment?.fork ?? null) !== json((chain.env() as any)?.fork ?? null)) throw new Error('ENVIRONMENT_MISMATCH: 请先初始化相同分叉环境');
        if (old.config.environment?.baseline?.blockHash !== (chain.env() as any)?.baseline?.blockHash || old.config.build?.sourceHash !== version.sourceHash) throw new Error('REPRODUCTION_VERSION_MISMATCH: 初始区块或软件版本与原实验不一致，请使用原软件包');
        return send(res, 202, await beginRun(config, id));
      }
      if (action === 'check' && req.method === 'POST') {
        const v = await verifyRun(DATA, id); if (!v.valid) throw new Error('INVALID_RECORDING:' + v.errors.join(','));
        const run = await readRun(DATA, id);
        const evidence = run.events.find((e: any) => e.type === 'check.evidence')?.payload;
        if (!evidence) throw new Error('MISSING_CHECK_EVIDENCE');
        let checked: any;
        if (body.mode === 'live') {
          requireReady();
          checked = await environmentAction(async () => {
            const current = await refresh();
            if (current.chainInstanceId !== evidence.before.chainInstanceId) throw new Error('CHAIN_EPOCH_CHANGED: 已重置环境，不能用新环境追认旧交易');
            if (previousRunId && previousRunId !== id) throw new Error('RUN_SUPERSEDED: 当前链已有后续实验，请使用离线复检，避免把后续交易计入旧实验');
            return chain.check(run.config.taskId, evidence.before, current, evidence.transactions, evidence.agentFinal, { experimentMode: run.config.experimentMode || 'independent',taskParameters:run.config.taskParameters??run.config.taskSpec?.taskParameters });
          });
        } else checked = (checkTask as any)(run.config.taskId, evidence.before, evidence.after, evidence.transactions, evidence.agentFinal, evidence.observations, { experimentMode: run.config.experimentMode || 'independent',taskParameters:run.config.taskParameters??run.config.taskSpec?.taskParameters });
        const result: any = { ...checked, run_id: id, experimentMode: run.config.experimentMode || 'independent', checker_version: checked.checkerVersion, check_id: randomUUID(), evidence_source: body.mode === 'live' ? 'live_chain' : 'original_run', check_mode: body.mode === 'live' ? 'live_reconciliation' : 'offline', checked_at: new Date().toISOString(), costs: { ...run.result?.costs, transaction_attempts: checked.costs.transactionAttempts, gas_used: checked.costs.gasUsed, gas_cost_wei: checked.costs.gasCostWei, gas_complete: !checked.evidence.transactions.some((tx: any) => !tx.receipt) }, agent: run.result?.agent, run_error: run.result?.run_error, cancelled: run.result?.cancelled, recording_error: run.result?.recording_error, integrity: v };
        result.diagnostics = buildDiagnostics(result, run.events);
        await saveResult(DATA, id, result); return send(res, 200, result);
      }
      if (!action && req.method === 'GET') {
        const run = await readRun(DATA, id);
        if (run.result) run.result.diagnostics = buildDiagnostics(run.result, run.events);
        const execution_trace = buildExecutionTrace(run.config, run.events, run.manifest);
        let continuation=continuationEligibility(run,id);
        if(continuation.allowed) {
          const integrity=await verifyRun(DATA,id);
          if(!integrity.valid) continuation={allowed:false,reason:'INVALID_RECORDING:'+integrity.errors.join(',')};
          else try {continuationHistory(run.events);} catch(error:any) {continuation={allowed:false,reason:error.message};}
        }
        return send(res, 200, { ...run, ...runSummary(run.config,run.result,run.events),continuation, execution_trace, execution_graph: buildProvenanceGraph(execution_trace, run.config, run.events) });
      }
    }
    if (path === '/api/shutdown' && req.method === 'POST') { send(res, 200, { ok: true }); void shutdown(); return; }
    if (req.method === 'GET' && ['/', '/index.html', '/app.js', '/style.css'].includes(path)) {
      const file = path === '/' ? 'index.html' : path.slice(1);
      const content = await readFile(join(ROOT, 'public', file));
      res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8' });
      return res.end(content);
    }
    send(res, 404, { error: 'NOT_FOUND' });
  } catch (error: any) { send(res, 400, { error: redactor.clean(error.message || String(error)) }); }
});
async function shutdown() {
  if (shuttingDown) return; shuttingDown = true;
  controller?.abort();
  const deadline = Date.now() + 6000;
  while (busy && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
  await chain.stop().catch(() => {});
  server.close();
  process.exit(0);
}
await mkdir(DATA, { recursive: true });
server.listen(PORT, '127.0.0.1', () => console.log(`Web3 Agent Lab http://127.0.0.1:${PORT}`));
server.on('error', e => { console.error(e.message); process.exit(1); });
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
