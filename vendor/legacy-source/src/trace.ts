import { decodeFunctionData, parseAbi, toFunctionSelector } from 'viem';

/** A deterministic, read-only view. The caller verifies and redacts raw records first. */
type Row = Record<string, any>;
export interface TraceSourceEvent {
  seq: number | null; event_id: string | null; type: string | null;
  timestamp: string | null; monotonic_ms: number | null; payload_ref: unknown;
}
export interface TraceEntity extends Row {
  id: string; source_events: TraceSourceEvent[]; missing: string[];
}
export interface ExecutionTrace {
  schema_version: '1.0'; run_id: string | null; provenance: Row; task: Row;
  model_calls: TraceEntity[]; tool_calls: TraceEntity[]; contract_calls: TraceEntity[];
  transactions: TraceEntity[]; call_frames: TraceEntity[];
  edges: { id: string; from: string; to: string; relation: string; source_events: TraceSourceEvent[] }[];
  summary: Row; warnings: { code: string; message: string; source_events: TraceSourceEvent[] }[];
}
const object = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
const text = (value: unknown): string | null => typeof value === 'string' && value.length > 0 ? value : null;
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const hash = (value: unknown): string | null => typeof value === 'string' && /^0x[a-f\d]{64}$/i.test(value) ? value.toLowerCase() : null;
const secretField = /^(authorization|api[-_]?key|private[-_]?key|secret|mnemonic|seedPhrase|signedTransaction|rawTransaction|password|access[-_]?token|refresh[-_]?token)$/i;
function copy(value: unknown): any {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') {
    const redacted = value.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]').replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]');
    try {
      const parsed = JSON.parse(redacted);
      if (parsed && typeof parsed === 'object') {
        const cleaned = copy(parsed);
        if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) return JSON.stringify(cleaned);
      }
    } catch {}
    return redacted;
  }
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, secretField.test(key) ? '[REDACTED]' : copy(item)]));
  return value ?? null;
}
function source(event: Row): TraceSourceEvent {
  return { seq: number(event.seq), event_id: text(event.event_id), type: text(event.type), timestamp: text(event.timestamp), monotonic_ms: number(event.monotonic_ms), payload_ref: copy(event.payload_ref) };
}
const sourceKey = (event: Row, index = 0): string => text(event.event_id) ?? (number(event.seq) !== null ? `seq-${event.seq}` : `index-${index}`);
const entityId = (layer: string, value: string): string => {
  try { return `${layer}:${encodeURIComponent(value)}`; }
  catch { return `${layer}:utf16:${Array.from({ length: value.length }, (_, index) => value.charCodeAt(index).toString(16).padStart(4, '0')).join('')}`; }
};
function attach(entity: { source_events: TraceSourceEvent[] }, event: Row) {
  const ref = source(event);
  if (!entity.source_events.some(item => item.event_id && item.event_id === ref.event_id || item.seq !== null && item.seq === ref.seq && item.type === ref.type)) entity.source_events.push(ref);
}
function timeRange(entity: TraceEntity) {
  const refs = entity.source_events;
  const first = refs[0], last = refs.at(-1);
  entity.start_end = { start_seq: first?.seq ?? null, end_seq: last?.seq ?? null, start_time: first?.timestamp ?? null, end_time: last?.timestamp ?? null,
    duration_ms: typeof first?.monotonic_ms === 'number' && typeof last?.monotonic_ms === 'number' ? Math.max(0, last.monotonic_ms - first.monotonic_ms) : null };
}
function parseArguments(value: unknown): unknown {
  if (typeof value !== 'string') return copy(value);
  try { return copy(JSON.parse(value)); } catch { return null; }
}
function transactionStatus(value: Row): string {
  const receipt = object(value.receipt);
  if (['success', '0x1', 1, 1n].includes(receipt.status)) return 'success';
  if (['reverted', '0x0', 0, 0n].includes(receipt.status)) return 'reverted';
  return value.status === 'pending' ? 'pending' : value.status === 'prepared' ? 'prepared' : 'unknown';
}
const REQUEST_FIELDS = ['chainId', 'from', 'to', 'data', 'value', 'nonce', 'gas', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas', 'type', 'blockNumber', 'blockHash'];
const pick = (value: Row, fields: string[]) => Object.fromEntries(fields.filter(key => value[key] !== undefined).map(key => [key, copy(value[key])]));
const STATIC_SIGNATURES: Record<string, string[]> = {
  tokenA: ['balanceOf(address)', 'allowance(address,address)', 'approve(address,uint256)', 'transfer(address,uint256)', 'transferFrom(address,address,uint256)', 'mint(address,uint256)'],
  tokenB: ['balanceOf(address)', 'allowance(address,address)', 'approve(address,uint256)', 'transfer(address,uint256)', 'transferFrom(address,address,uint256)', 'mint(address,uint256)'],
  amm: ['swap(uint256,uint256,address)', 'quote(uint256)'],
  vault: ['deposit(uint256,address)', 'balanceOf(address)', 'totalAssets()'],
};
function describeFunction(config: Row, address: unknown, input: unknown, decoded?: unknown): Row {
  const data = typeof input === 'string' && /^0x[a-f\d]*$/i.test(input) ? input : null;
  const selector = data && data.length >= 10 ? data.slice(0, 10).toLowerCase() : null;
  const contracts = object(object(config.environment).contracts);
  const label = Object.keys(contracts).find(key => typeof contracts[key] === 'string' && typeof address === 'string' && contracts[key].toLowerCase() === address.toLowerCase()) ?? null;
  const explicit = object(decoded);
  let signature: string | null = null, name = text(explicit.functionName), args = Array.isArray(explicit.args) ? copy(explicit.args) : null;
  if (label && data && selector) {
    signature = (STATIC_SIGNATURES[label] ?? []).find(candidate => toFunctionSelector(candidate).toLowerCase() === selector) ?? null;
    if (signature) {
      try {
        const actual = decodeFunctionData({ abi: parseAbi([`function ${signature}`] as string[]), data: data as `0x${string}` });
        name = actual.functionName; args = copy(actual.args ?? []);
      } catch { signature = null; }
    }
  }
  return { name, signature, selector, args, abi_source: signature ? 'static_lab_abi_for_configured_address' : explicit.functionName ? 'recorded_decoded_transaction' : 'unknown', contract_label: label };
}

export function buildExecutionTrace(configInput: unknown, eventsInput: unknown, manifestInput?: unknown): ExecutionTrace {
  const config = object(configInput), manifest = object(manifestInput);
  const events = rows(eventsInput).map((event, index) => ({ event, index })).sort((a, b) => (number(a.event.seq) ?? a.index) - (number(b.event.seq) ?? b.index));
  const runId = text(config.run_id) ?? text(events[0]?.event.run_id) ?? text(manifest.run_id);
  const agentStart = events.find(({ event }) => event.type === 'agent.start')?.event;
  const startPayload = object(agentStart?.payload), configuredTask = object(config.task);
  const runStart = object(events.find(({ event }) => event.type === 'run.started')?.event.payload);
  const trace: ExecutionTrace = {
    schema_version: '1.0', run_id: runId,
    provenance: { kind: 'derived', source: 'original_events', builder_version: '1.2', manifest_present: Boolean(manifestInput), recording_status: manifest.recording_status ?? 'unsealed', sealed_at: manifest.sealed_at ?? null, event_count: events.length, events_sha256: object(object(manifest.files)['events.jsonl']).sha256 ?? null, integrity: 'not_verified_by_builder' },
    task: { node_id: entityId('task', runId ?? 'unknown-run'), id: startPayload.taskId ?? config.taskId ?? configuredTask.id ?? null, input: startPayload.input ?? config.taskInput ?? configuredTask.input ?? null, mode: startPayload.mode ?? config.mode ?? null, experiment_mode: startPayload.experimentMode ?? config.experimentMode ?? 'independent', amount_validation: config.amountValidation ?? startPayload.amountValidation ?? 'legacy_unspecified', data_origin: config.data_origin ?? runStart.data_origin ?? null, allowed_tools: copy(config.allowedTools ?? configuredTask.allowedTools ?? []), source_events: agentStart ? [source(agentStart)] : [] },
    model_calls: [], tool_calls: [], contract_calls: [], transactions: [], call_frames: [], edges: [], summary: {}, warnings: [],
  };
  trace.task.task_parameters = copy(config.taskParameters ?? configuredTask.taskParameters ?? null);
  trace.task.parameter_source = config.taskSpec?.parameterSource ?? configuredTask.parameterSource ?? null;
  trace.task.continuation_of = config.continuation_of ?? null;
  const parentToolIds = new Set(events.flatMap(({ event }) => event.type === 'continuation.parent' ? rows(object(event.payload).parentToolReferences).map(ref => text(ref.toolCallId)).filter(Boolean) : []));
  const warn = (code: string, message: string, event?: Row) => {
    if (!trace.warnings.some(item => item.code === code && (!event || item.source_events.some(ref => ref.event_id === event.event_id && ref.seq === number(event.seq))))) trace.warnings.push({ code, message, source_events: event ? [source(event)] : [] });
  };
  if (!manifestInput) warn('UNSEALED_RECORDING', '未提供封存清单，此轨迹是未封存的临时视图。');
  else if (manifest.recording_status !== 'complete') warn('INCOMPLETE_RECORDING', '原始记录标记为不完整；缺失动作不能解释为没有发生。');
  if (number(manifest.event_count) !== null && manifest.event_count !== events.length) warn('EVENT_COUNT_MISMATCH', '当前事件数量与封存清单不一致。');
  if (events.some(({ event }) => event.run_id && runId && event.run_id !== runId)) warn('RUN_ID_MISMATCH', '事件包含不同的运行编号，请先核验原始记录。');
  const modelMap = new Map<string, TraceEntity>(), toolMap = new Map<string, TraceEntity>(), contractMap = new Map<string, TraceEntity>();
  const transactionsByHash = new Map<string, TraceEntity>(), transactionsByContract = new Map<string, TraceEntity[]>();
  const getEntity = (map: Map<string, TraceEntity>, collection: TraceEntity[], layer: string, actualId: string | null, event: Row, index: number): TraceEntity => {
    const key = actualId ?? `missing-${sourceKey(event, index)}`;
    let entity = map.get(key);
    if (!entity) { entity = { id: entityId(layer, key), source_events: [], missing: [], status: 'incomplete' }; map.set(key, entity); collection.push(entity); }
    attach(entity, event); return entity;
  };
  const linked = (event: Row, field: string): string | null => text(object(event.links)[field]) ?? text(object(event.payload)[field]);
  const link = (from: string, to: string, relation: string, event: Row) => {
    const id = entityId('edge', `${from}|${relation}|${to}`);
    let edge = trace.edges.find(item => item.id === id);
    if (!edge) { edge = { id, from, to, relation, source_events: [] }; trace.edges.push(edge); }
    attach(edge, event);
  };
  function recordTransaction(payload: Row, event: Row, index: number, prepared = false, identitySuffix = '') {
    const txHash = hash(payload.hash ?? payload.txHash ?? object(payload.receipt).transactionHash);
    const contractCallId = linked(event, 'contractCallId') ?? text(payload.contractCallId);
    const toolCallId = linked(event, 'toolCallId');
    let transaction = txHash ? transactionsByHash.get(txHash) : undefined;
    if (!transaction && contractCallId) {
      const candidates = (transactionsByContract.get(contractCallId) ?? []).filter(item => !txHash || !item.hash || item.hash === txHash);
      if (candidates.length === 1) transaction = candidates[0];
    }
    // Legacy prepared and broadcast records may share an explicit tool ID and
    // the exact unsigned request. No neighbouring-event inference is used.
    if (!transaction && !prepared && toolCallId && payload.nonce !== undefined) {
      const candidates = trace.transactions.filter(item => item.status === 'prepared' && !item.hash && item.toolCallId === toolCallId && ['from', 'to', 'data', 'nonce'].every(key => payload[key] !== undefined && String(item.request[key]).toLowerCase() === String(payload[key]).toLowerCase()));
      if (candidates.length === 1) transaction = candidates[0];
      else if (candidates.length > 1) warn('AMBIGUOUS_TRANSACTION_ATTEMPT', '多个准备记录符合相同请求，未猜测它们与交易哈希的对应关系。', event);
    }
    if (!transaction) {
      transaction = { id: entityId('transaction', txHash ?? (contractCallId ? `contract-${contractCallId}` : sourceKey(event, index) + identitySuffix)), hash: txHash, contractCallId, toolCallId, request: {}, receipt: null, status: prepared ? 'prepared' : 'unknown', error: null, trace_available: false, source_events: [], missing: [] };
      trace.transactions.push(transaction);
    }
    attach(transaction, event);
    if (txHash) { transaction.hash = txHash; transactionsByHash.set(txHash, transaction); }
    if (contractCallId) {
      transaction.contractCallId ??= contractCallId;
      const list = transactionsByContract.get(contractCallId) ?? [];
      if (!list.includes(transaction)) list.push(transaction);
      transactionsByContract.set(contractCallId, list);
    }
    transaction.toolCallId ??= toolCallId;
    transaction.request = { ...transaction.request, ...pick(payload, REQUEST_FIELDS) };
    if (payload.receipt !== undefined) transaction.receipt = copy(payload.receipt);
    else if (payload.status === 'unknown') transaction.receipt = null;
    if (payload.amountConversions !== undefined) transaction.amountConversions = copy(payload.amountConversions);
    if (payload.decoded !== undefined) transaction.decoded = copy(payload.decoded);
    if (payload.error !== undefined) transaction.error = copy(payload.error);
    if (prepared && !transaction.hash && !transaction.receipt) transaction.status = 'prepared';
    else if (payload.status !== undefined || payload.receipt !== undefined) transaction.status = transactionStatus(payload);
    if (event.type === 'tx.trace') transaction.trace_available = true;
    if (event.type === 'tx.trace_unavailable') transaction.trace_unavailable_reason = copy(payload.reason);
    return transaction;
  }

  for (const { event, index } of events) {
    const payload = object(event.payload), type = String(event.type ?? '');
    if (type.startsWith('model.')) {
      const modelCallId = linked(event, 'modelCallId');
      const model = getEntity(modelMap, trace.model_calls, 'model', modelCallId, event, index);
      model.modelCallId = modelCallId;
      if (!modelCallId) { model.missing.push('modelCallId'); warn('MISSING_MODEL_CALL_ID', '模型事件缺少显式调用ID，未按相邻顺序合并请求与响应。', event); }
      if (type === 'model.request') {
        const request = object(payload.request);
        Object.assign(model, { model: copy(request.model), endpoint: copy(payload.endpoint), parameters: pick(request, ['temperature', 'top_p', 'max_tokens', 'max_completion_tokens', 'seed', 'stream', 'tool_choice']), messages: copy(request.messages ?? []), tool_definitions: copy(request.tools ?? []), attempt: copy(payload.attempt ?? object(event.links).attempt), status: 'requested' });
      } else if (type === 'model.response') {
        const response = object(payload.response), message = object(rows(response.choices)[0]?.message);
        Object.assign(model, { http_status: copy(payload.status), requestId: copy(payload.requestId), response_message: copy(Object.keys(message).length ? message : null), proposed_tools: copy(message.tool_calls ?? []), usage: copy(response.usage), response_model: copy(response.model), parse_error: Boolean(payload.parseError), status: payload.parseError || typeof payload.status === 'number' && payload.status >= 400 ? 'error' : 'completed' });
        if (payload.parseError || response.error) model.error = copy(response.error ?? 'MODEL_RESPONSE_PARSE_ERROR');
      } else if (type === 'model.error') Object.assign(model, { error: copy(payload.error), timed_out: Boolean(payload.timedOut), cancelled: Boolean(payload.cancelled), status: 'error' });
    }
    if (['tool.call', 'tool.started', 'tool.result', 'tool.validation'].includes(type)) {
      const toolCallId = linked(event, 'toolCallId');
      const tool = getEntity(toolMap, trace.tool_calls, 'tool', toolCallId, event, index);
      Object.assign(tool, { toolCallId, modelCallId: linked(event, 'modelCallId') ?? tool.modelCallId ?? null, name: payload.name ?? tool.name ?? null });
      if (!toolCallId) { tool.missing.push('toolCallId'); warn('MISSING_TOOL_CALL_ID', '工具事件缺少显式调用ID，保留为独立记录，不推断配对。', event); }
      if (type === 'tool.call') Object.assign(tool, { raw_arguments: copy(payload.arguments), input: parseArguments(payload.arguments), status: 'called' });
      if (type === 'tool.started') Object.assign(tool, { input: copy(payload.args), status: 'started', execution_started: true });
      if (type === 'tool.validation' && payload.status === 'rejected') Object.assign(tool, { validation: copy(payload), status: 'rejected', execution_started: false, submitted: false });
      if (type === 'tool.result') Object.assign(tool, { raw_result: copy(payload.raw), visible_result: copy(payload.visible), overridden: Boolean(payload.overridden), error: copy(payload.error ?? object(payload.raw).error), status: payload.error || object(payload.raw).error ? 'error' : 'completed' });
    }
    if (['contract.call', 'contract.result'].includes(type)) {
      const contractCallId = linked(event, 'contractCallId') ?? text(payload.callId);
      const call = getEntity(contractMap, trace.contract_calls, 'contract', contractCallId, event, index);
      Object.assign(call, { contractCallId, toolCallId: linked(event, 'toolCallId') ?? call.toolCallId ?? null, kind: payload.kind ?? call.kind ?? null, tool: payload.tool ?? call.tool ?? null, chainId: payload.chainId ?? call.chainId ?? null, legacy: false });
      for (const key of ['contract', 'function', 'request', 'error', 'amountConversions']) if (payload[key] !== undefined) call[key] = copy(payload[key]);
      if (!contractCallId) { call.missing.push('contractCallId'); warn('MISSING_CONTRACT_CALL_ID', '合约事件缺少显式调用ID，未猜测请求与结果的关系。', event); }
      if (type === 'contract.call') call.status = 'started';
      else Object.assign(call, { result: copy(payload.result), status: payload.error ? 'error' : payload.status ?? (call.kind === 'transaction' ? 'submitted' : 'completed'), ...pick(payload, ['txHash', 'blockNumber', 'blockHash', 'duration_ms', 'stage', 'submitted']) });
    }
    if (['tx.prepared', 'tx.broadcast', 'tx.receipt', 'tx.status', 'tx.error', 'tx.trace', 'tx.trace_unavailable'].includes(type)) recordTransaction(payload, event, index, type === 'tx.prepared');
    if (type === 'check.evidence') {
      const matchedAttempts = new Set<TraceEntity>();
      for (const [transactionIndex, transaction] of rows(payload.transactions).entries()) {
        // A hash identifies the same transaction. A no-hash attempt is only
        // merged when the original record carries its explicit contract ID.
        const existing = hash(transaction.hash ?? transaction.txHash) ? undefined : text(transaction.contractCallId) ? undefined : trace.transactions.find(item => !matchedAttempts.has(item) && item.status === 'unknown' && !item.hash && ['from', 'to', 'data', 'nonce'].every(key => transaction[key] !== undefined && String(item.request[key]).toLowerCase() === String(transaction[key]).toLowerCase()));
        const recorded = existing ?? recordTransaction(transaction, event, index, false, `/transaction-${transactionIndex}`);
        if (existing) attach(existing, event);
        matchedAttempts.add(recorded);
        recorded.observed_in_checker = true;
      }
    }
  }

  for (const transaction of trace.transactions) {
    if (!transaction.contractCallId && transaction.request.to && transaction.request.data) {
      const fn = describeFunction(config, transaction.request.to, transaction.request.data, transaction.decoded);
      const legacy: TraceEntity = { id: entityId('contract', `legacy-${transaction.id}`), contractCallId: null, toolCallId: transaction.toolCallId, kind: 'transaction', tool: null, chainId: transaction.request.chainId ?? null, contract: { address: transaction.request.to, label: fn.contract_label }, function: fn, request: copy(transaction.request), result: null, error: transaction.error, status: transaction.status, legacy: true, missing: ['explicit_contract_call_event', 'contractCallId'], source_events: [...transaction.source_events] };
      trace.contract_calls.push(legacy);
      transaction.legacy_contract_id = legacy.id;
      warn('LEGACY_CONTRACT_EVIDENCE', '旧记录仅恢复交易已有的合约地址、calldata和可验证函数信息；缺失的合约读取与调用ID未补造。');
    }
    if (!transaction.hash) transaction.missing.push('transaction_hash');
    if (!transaction.receipt) transaction.missing.push('receipt');
    if (!transaction.trace_available) transaction.missing.push('evm_call_trace');
  }

  for (const { event, index } of events) {
    const payload = object(event.payload);
    if (event.type === 'tx.trace') {
      const txHash = hash(payload.hash ?? payload.txHash);
      const transaction = txHash ? transactionsByHash.get(txHash) : (transactionsByContract.get(linked(event, 'contractCallId') ?? '') ?? [])[0];
      const root = object(payload.trace);
      if (!transaction || !Object.keys(root).length || typeof root.type !== 'string') { warn('UNSUPPORTED_EVM_TRACE', '此调试结果不是可识别的callTracer树，原始trace仍保存在事件引用中。', event); continue; }
      const walk = (frame: Row, parentId: string | null, path: string) => {
        const id = entityId('evm', `${sourceKey(event, index)}/${path}`);
        const item: TraceEntity = { id, callId: id, parentId, transaction_id: transaction.id, hash: transaction.hash, trace_path: path, ...pick(frame, ['type', 'from', 'to', 'input', 'output', 'value', 'gas', 'gasUsed', 'error', 'revertReason', 'logs']), function: describeFunction(config, frame.to, ['CREATE', 'CREATE2'].includes(frame.type) ? null : frame.input), status: frame.error || frame.revertReason ? 'error' : 'observed', source_events: [source(event)], missing: [] };
        trace.call_frames.push(item);
        link(parentId ?? transaction.id, id, parentId ? 'evm_child_call' : 'evm_trace_root', event);
        rows(frame.calls).forEach((child, childIndex) => walk(child, id, `${path}.${childIndex}`));
      };
      walk(root, null, '0');
    }
    if (event.type === 'tool.call') {
      const tool = toolMap.get(linked(event, 'toolCallId') ?? '');
      const model = modelMap.get(linked(event, 'modelCallId') ?? '');
      if (tool && model) link(model.id, tool.id, 'requests_tool', event);
    }
    if (['contract.call', 'contract.result'].includes(event.type)) {
      const call = contractMap.get(linked(event, 'contractCallId') ?? text(payload.callId) ?? '');
      const tool = toolMap.get(linked(event, 'toolCallId') ?? '');
      if (tool && call) link(tool.id, call.id, 'invokes_contract', event);
    }
    if (event.type === 'model.request') {
      const model = modelMap.get(linked(event, 'modelCallId') ?? '');
      if (model) for (const message of rows(object(payload.request).messages)) {
        if (message.role !== 'tool' || !text(message.tool_call_id)) continue;
        const tool = toolMap.get(message.tool_call_id);
        if (tool && tool.source_events.some(ref => ref.type === 'tool.result' && ref.seq !== null && number(event.seq) !== null && ref.seq < event.seq)) link(tool.id, model.id, 'provides_result', event);
        else if (parentToolIds.has(message.tool_call_id)) warn('EXTERNAL_PARENT_TOOL_RESULT', '模型请求引用父运行中已有的工具结果；本运行保留外部原始事件引用，不把父动作伪装成本轮新调用。', event);
        else warn('MISSING_TOOL_RESULT_SOURCE', '模型请求引用了一个未能在原始工具事件中定位的tool_call_id。', event);
      }
    }
    if (event.type === 'scripted.step' && trace.task.mode === 'scripted') {
      const tool = toolMap.get(text(object(payload.call).id) ?? '');
      if (tool) link(trace.task.node_id, tool.id, 'scripted_task_step', event);
    }
  }
  const firstModelRequest = events.find(({ event }) => event.type === 'model.request' && rows(object(object(event.payload).request).messages).some(message => message.role === 'user' && message.content === trace.task.input));
  if (firstModelRequest) {
    const model = modelMap.get(linked(firstModelRequest.event, 'modelCallId') ?? '');
    if (model) link(trace.task.node_id, model.id, 'supplies_task_input', firstModelRequest.event);
  }
  for (const transaction of trace.transactions) {
    const call = contractMap.get(transaction.contractCallId ?? '') ?? trace.contract_calls.find(item => item.id === transaction.legacy_contract_id);
    const recordedEvents = events.filter(({ event }) => transaction.source_events.some(ref => ref.event_id && ref.event_id === event.event_id || ref.seq !== null && ref.seq === number(event.seq))).map(({ event }) => event);
    const submittedEvents = transaction.hash ? recordedEvents.filter(event => {
      const payload = object(event.payload);
      if (['tx.broadcast', 'tx.receipt'].includes(event.type)) return hash(payload.hash ?? payload.txHash ?? object(payload.receipt).transactionHash) === transaction.hash;
      return event.type === 'check.evidence' && rows(payload.transactions).some(item => hash(item.hash ?? item.txHash ?? object(item.receipt).transactionHash) === transaction.hash);
    }) : [];
    const errorEvents = recordedEvents.filter(event => event.type === 'tx.error');
    const preparedEvents = recordedEvents.filter(event => event.type === 'tx.prepared');
    const relation = submittedEvents.length ? 'submits_transaction' : errorEvents.length ? 'attempts_submission' : preparedEvents.length ? 'prepares_transaction' : 'references_transaction';
    const supportingEvents = submittedEvents.length ? submittedEvents : errorEvents.length ? errorEvents : preparedEvents.length ? preparedEvents : recordedEvents;
    for (const event of supportingEvents) {
      if (call) link(call.id, transaction.id, relation, event);
      if (transaction.toolCallId && toolMap.has(transaction.toolCallId)) link(toolMap.get(transaction.toolCallId)!.id, transaction.id, relation, event);
    }
    if (call?.legacy && call.toolCallId && toolMap.has(call.toolCallId) && recordedEvents[0]) link(toolMap.get(call.toolCallId)!.id, call.id, 'invokes_contract', recordedEvents[0]);
  }
  for (const model of trace.model_calls) {
    if (!model.source_events.some(ref => ref.type === 'model.request')) model.missing.push('model.request');
    if (!model.source_events.some(ref => ['model.response', 'model.error'].includes(ref.type ?? ''))) model.missing.push('model.response');
  }
  for (const tool of trace.tool_calls) {
    const rejected = object(tool.validation).status === 'rejected' && !tool.source_events.some(ref => ref.type === 'tool.started');
    if (rejected) tool.status = 'rejected';
    for (const type of (rejected ? ['tool.call', 'tool.result'] : ['tool.call', 'tool.started', 'tool.result'])) if (!tool.source_events.some(ref => ref.type === type)) tool.missing.push(type);
    if (tool.status === 'called' || tool.status === 'started') tool.status = 'incomplete';
    if (['get_balance', 'get_state'].includes(tool.name) && tool.execution_started && !trace.contract_calls.some(call => call.toolCallId && call.toolCallId === tool.toolCallId && call.kind === 'read')) {
      tool.missing.push('contract_read_events');
      warn('MISSING_CONTRACT_READ_EVENTS', '该读取工具缺少显式合约读取事件，仅保留真实工具结果，不补造balanceOf等内部调用。');
    }
  }
  for (const call of trace.contract_calls) if (!call.legacy) {
    for (const type of ['contract.call', 'contract.result']) if (!call.source_events.some(ref => ref.type === type)) call.missing.push(type);
    if (call.status === 'started') call.status = 'incomplete';
  }
  for (const entity of [...trace.model_calls, ...trace.tool_calls, ...trace.contract_calls, ...trace.transactions, ...trace.call_frames]) { entity.missing = [...new Set(entity.missing)]; timeRange(entity); }
  const statusCounts: Record<string, number> = {};
  for (const transaction of trace.transactions) statusCounts[transaction.status] = (statusCounts[transaction.status] ?? 0) + 1;
  trace.summary = { model_call_count: trace.model_calls.filter(item => item.source_events.some(ref => ref.type === 'model.request')).length, model_proposal_count: trace.model_calls.reduce((sum, item) => sum + rows(item.proposed_tools).length, 0), tool_call_count: trace.tool_calls.filter(item => item.source_events.some(ref => ref.type === 'tool.call')).length, tool_record_count: trace.tool_calls.length, contract_call_count: trace.contract_calls.length, explicit_contract_call_count: trace.contract_calls.filter(item => !item.legacy).length, transaction_count: trace.transactions.length, call_frame_count: trace.call_frames.length, edge_count: trace.edges.length, transaction_status_counts: statusCounts, model_used: trace.model_calls.some(item => item.source_events.some(ref => ref.type === 'model.request')), internal_trace_meaning: 'EVM execution evidence; not model reasoning', completeness: trace.warnings.length ? 'see_warnings' : 'recorded_events_only' };
  return trace;
}

function markdownText(value: unknown): string {
  const valueText = value === null || value === undefined ? '未记录' : typeof value === 'string' ? value : JSON.stringify(copy(value));
  return valueText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\/g, '\\\\').replace(/([`*_{}\[\]()#!|~])/g, '\\$1').replace(/[\r\n]+/g, ' / ');
}
function jsonBlock(value: unknown): string {
  const body = JSON.stringify(copy(value), null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const longest = Math.max(2, ...(body.match(/`+/g) ?? []).map(run => run.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}json\n${body}\n${fence}`;
}

export function renderExecutionTraceMarkdown(trace: ExecutionTrace): string {
  const lines = ['# Web3 Agent 执行轨迹', '', `运行编号：${markdownText(trace.run_id)}`, '', '本文件由原始事件生成，用于查看执行关系。列表的记录顺序不代表因果关系；只有显式调用ID、交易哈希与callTracer父子关系形成连线。内部EVM调用是链执行证据，不是模型思维过程。', '', '完整结构见同目录 execution-trace.json；模型原始完整响应body与工具原始记录通过 source_events.payload_ref 指向原始 blobs 文件。本文件不截断已展开实体。', '', '## 任务与来源', '', jsonBlock({ task: trace.task, provenance: trace.provenance, summary: trace.summary }), '', '## 步骤关系表', '', '| 来源节点 | 关系 | 目标节点 | 原始事件序号 |', '| --- | --- | --- | --- |'];
  for (const edge of trace.edges) lines.push(`| ${markdownText(edge.from)} | ${markdownText(edge.relation)} | ${markdownText(edge.to)} | ${markdownText(edge.source_events.map(ref => ref.seq).join(', '))} |`);
  if (!trace.edges.length) lines.push('| 未记录 | 没有足够显式关联证据 | 未记录 | 未记录 |');
  const sections: [string, TraceEntity[]][] = [['模型接口调用与提议（提议不等于工具执行）', trace.model_calls], ['工具执行（输入、原始结果、可见结果）', trace.tool_calls], ['合约调用（读取或写交易）', trace.contract_calls], ['交易与确认状态', trace.transactions], ['内部EVM调用帧（callTracer父子树）', trace.call_frames]];
  for (const [title, entities] of sections) {
    lines.push('', `## ${title}`, '');
    if (!entities.length) lines.push('没有记录到此类实体；不能据此补造调用。');
    for (const entity of entities) lines.push(`### ${markdownText(entity.id)}`, '', jsonBlock(entity), '');
  }
  lines.push('', '## 缺失与注意事项', '');
  if (!trace.warnings.length) lines.push('未发现构建阶段结构警告。原始文件哈希核验由导出调用方负责；轨迹本身不判定任务成功。');
  for (const warning of trace.warnings) lines.push(`- ${markdownText(warning.code)}：${markdownText(warning.message)}；事件：${markdownText(warning.source_events.map(ref => ref.seq).join(', '))}`);
  return lines.join('\n') + '\n';
}
