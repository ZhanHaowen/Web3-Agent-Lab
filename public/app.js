'use strict';

// Untrusted model, tool, and imported values are rendered with textContent only.
const $ = (id) => document.getElementById(id);
const state = { csrfToken: '', tasks: [], status: null, runs: [], runId: null, run: null, events: [], selectedEvent: null, replay: false, imported: false, polling: false, action: false, firstStatus: true, connected: false, lastEventSignature: '', historySignature: '', lastReadError: '' };
const labels = {
  success: '成功', succeeded: '成功', failure: '失败', failed: '失败', pending: '等待确认', unknown: '结果未知', running: '运行中', paused: '已暂停', cancelled: '已取消', canceled: '已取消', completed: '已完成', complete: '已完成', stopped: '已停止', error: '执行错误', precondition_error: '初始条件不满足', invalid: '记录无效', incomplete: '记录不完整', sealed: '记录已封存', ready: '就绪', idle: '空闲', scripted: '脚本基线', llm: 'LLM Agent'
};
const tabInfo = {
  experiment: ['运行实验', '从任务到证据，一次完整实验。', '配置 Agent，执行链上任务，保留可检查的完整轨迹。'],
  environment: ['链与环境', '为每次实验准备相同的起点。', '初始化、快照与出块控制，让链上行为可观测、可重做。'],
  archive: ['实验档案', '保留事实，也保留每一次差异。', '回放已有轨迹、检查证据、导出记录，或创建一次新的重复实验。'],
  help: ['使用指南', '从第一条基线开始。', '先验证环境与记录，再连接模型开展正式实验。']
};

function text(element, value) { element.textContent = value == null ? '—' : String(value); }
function json(value) { try { return JSON.stringify(value, null, 2) ?? String(value); } catch { return String(value); } }
function badgeClass(value) { const s = String(value || '').toLowerCase(); return /^(success|succeeded|complete|completed|sealed)$/.test(s) ? 'success' : /failure|failed|error|invalid/.test(s) ? 'danger' : /pending|running|paused|incomplete/.test(s) ? 'warning' : 'muted'; }
function badge(element, value, fallback) { element.className = 'pill ' + badgeClass(value); text(element, labels[value] || value || fallback || '尚未检查'); }
function create(tag, className, content) { const el = document.createElement(tag); if (className) el.className = className; if (content !== undefined) text(el, content); return el; }
function notify(message, error = false) { $('notification').classList.remove('hidden'); $('notification').classList.toggle('error', error); text($('notification-text'), message); }
function date(value) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.valueOf()) ? String(value) : d.toLocaleString('zh-CN', { hour12: false }); }
function time(value) { if (!value) return ''; const d = new Date(value); return Number.isNaN(d.valueOf()) ? '' : d.toLocaleTimeString('zh-CN', { hour12: false }); }
function tab(name) {
  if (!tabInfo[name]) name = 'experiment';
  for (const panel of document.querySelectorAll('.tab-panel')) panel.classList.toggle('hidden', panel.id !== 'tab-' + name);
  for (const button of document.querySelectorAll('[data-tab]')) button.classList.toggle('active', button.dataset.tab === name);
  text($('current-tab-label'), tabInfo[name][0]); text($('page-title'), tabInfo[name][1]); text($('page-subtitle'), tabInfo[name][2]);
  history.replaceState(null, '', '#' + name);
  if (name === 'archive') refreshHistory().catch((e) => notify(e.message, true));
}

async function api(path, options = {}) {
  const method = options.method || 'GET';
  const headers = { Accept: 'application/json', ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-Lab-Token': state.csrfToken } : {}) };
  let response;
  try { response = await fetch(path, { method, headers, credentials: 'same-origin', cache: 'no-store', ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}) }); }
  catch { throw new Error('无法连接本地服务。请确认启动终端仍在运行，然后刷新状态。'); }
  const raw = await response.text();
  let value; try { value = raw ? JSON.parse(raw) : {}; } catch { if (!response.ok) throw new Error(`服务返回 ${response.status}，请查看启动终端。`); throw new Error('服务返回了无法解析的数据。'); }
  if (!response.ok || value?.ok === false) {
    const err = value?.error;
    if (err === 'SESSION_TOKEN_REQUIRED' && method !== 'GET' && !options.retriedSession) {
      const health = await api('/api/health'); state.csrfToken = health.csrfToken || '';
      return api(path, { ...options, retriedSession: true });
    }
    throw new Error(typeof err === 'string' ? err : err?.message || value?.message || `操作失败（HTTP ${response.status}）`);
  }
  return value;
}
async function action(button, busyLabel, operation) {
  if (state.action) { notify('另一个操作正在处理中，请稍候。'); return; }
  state.action = true;
  const oldLabel = button?.textContent;
  if (button) { button.disabled = true; text(button, busyLabel); }
  try { await operation(); }
  catch (error) { notify(error.message || String(error), true); }
  finally { state.action = false; if (button) { text(button, oldLabel); button.disabled = false; } updateButtons(); }
}
function ready() { return Boolean(state.status?.ready || state.status?.environment?.ready); }
function active() { return state.status?.active || null; }
function activeId() { return active()?.runId || active()?.run_id || null; }
function busy() { return Boolean(state.status?.busy || active() && /running|paused|starting/.test(active()?.state || active()?.status || '')); }
function experimentMode(run) { return (run?.config?.experimentMode || run?.experimentMode) === 'continuous' ? 'continuous' : 'independent'; }
function updateButtons() {
  const isActive = activeId() && activeId() === state.runId;
  $('start-run').disabled = !ready() || busy() || state.action || !state.tasks.length;
  $('stop-run').disabled = !isActive || !busy() || state.action || state.imported;
  $('check-run').disabled = !state.runId || state.action || state.imported || busy();
  const canLiveCheck = /pending|unknown/.test(resultStatus(runVerdict(state.run)) || '');
  $('live-check-run').classList.toggle('hidden', !canLiveCheck);
  $('live-check-run').disabled = !state.runId || state.action || state.imported || busy() || !ready();
  $('rerun-run').disabled = !state.runId || state.action || state.imported || busy();
  const continuous = experimentMode(state.run) === 'continuous';
  $('rerun-run').classList.toggle('hidden', continuous);
  $('continuous-rerun-note').classList.toggle('hidden', !continuous);
  $('export-run').disabled = !state.runId || state.imported || !state.run?.manifest?.files;
  $('export-execution-trace').disabled = state.action || !state.runId || (state.imported ? !validExecutionTrace(state.run?.execution_trace, state.runId) : !state.run?.manifest?.files);
  $('export-execution-trace').title = state.imported ? '在本地下载导入包中的派生 JSON，不上传文件。' : '记录封存后下载 JSON 执行轨迹；完整实验包同时保留原始证据。';
  const graphAvailable = state.imported ? validExecutionGraph(state.run?.execution_graph, state.runId) : Boolean(state.run?.manifest?.files);
  $('export-graph-json').disabled = state.action || !state.runId || !graphAvailable;
  $('export-graphml').disabled = state.action || !state.runId || !graphAvailable || state.imported && !validGraphML(state.run?.execution_graphml);
  for (const id of ['init-environment', 'quick-init', 'reset-environment', 'save-snapshot', 'restore-snapshot', 'stop-environment']) $(id).disabled = state.action || busy() || (id !== 'init-environment' && id !== 'quick-init' && !ready());
  $('mine-block').disabled = state.action || !ready() || busy() && active()?.state !== 'paused';
  $('automine').disabled = state.action || !ready() || busy();
}
function renderStatus(value) {
  state.status = value;
  const environment = value.environment || {};
  const chain = value.chainState || value.chain || {};
  $('chain-dot').className = 'status-dot' + (ready() ? ' connected' : '');
  text($('chain-label'), ready() ? '实验链已就绪' : '链环境未初始化');
  const sub = create('small', '', ready() ? `Anvil · Chain ${chain.chainId ?? environment.chainId ?? '本地 EVM'}${chain.blockNumber != null ? ' · 区块 ' + chain.blockNumber : ''}` : '先在「链与环境」启动实验链');
  sub.id = 'chain-subtitle'; $('chain-label').append(sub);
  $('first-launch').classList.toggle('hidden', ready());
  text($('environment-json'), json({ environment, chainState: chain, active: value.active || null }));
  renderModePreview();
  const automine = chain.automine ?? environment.automine ?? value.automine;
  if (typeof automine === 'boolean') $('automine').checked = automine;
  const pause = active()?.pause;
  const relevant = activeId() && activeId() === state.runId && !state.imported;
  $('pause-banner').classList.toggle('hidden', !(relevant && (pause || active()?.state === 'paused')));
  if (relevant && pause) {
    const kind = pause.kind || pause.type || pause.point || pause.phase || '';
    text($('pause-title'), /transaction|submit|tx/.test(kind) ? '已在交易提交前暂停' : '已在工具调用前暂停');
    text($('pause-message'), '继续将执行下面的操作。取消运行不会撤销已经提交的交易。');
    text($('pause-detail'), json(pause)); $('pause-detail').classList.remove('hidden');
  }
  if (relevant && !state.replay) badge($('run-status'), active()?.state || active()?.status || 'running');
  updateButtons();
}
function setConnection(connected) {
  state.connected = connected; $('connection-dot').className = 'status-dot ' + (connected ? 'connected' : 'failed');
  const version = typeof state.status?.version === 'object' ? state.status.version.version : state.status?.version;
  $('connection-text').replaceChildren(document.createTextNode(connected ? '本地服务已连接' : '本地服务未连接'), create('small', '', version === '0.1.2' ? 'V0.12 · ' + (state.status?.version?.releaseRevision || '0.1.2') : version ? 'V0.12 界面 · 服务 ' + version : 'V0.12 · localhost:4317'));
}
function exactUnits(value, decimals = 6, signed = false) {
  if (value === null || value === undefined || !/^-?\d+$/.test(String(value))) return '未采集';
  const integer = BigInt(String(value)); const negative = integer < 0n;
  const digits = String(negative ? -integer : integer).padStart(decimals + 1, '0');
  const whole = decimals ? digits.slice(0, -decimals) : digits;
  const fraction = decimals ? digits.slice(-decimals).replace(/0+$/, '') : '';
  return (negative ? '−' : signed && integer > 0n ? '+' : '') + whole + (fraction ? '.' + fraction : '');
}
function renderModePreview() {
  const continuous = $('experiment-mode').value === 'continuous';
  text($('experiment-mode-note'), continuous ? '本次不重置链。继承当前余额、授权、池储备与份额；余额会累计变化。连续历史实验暂不支持原样重跑。' : '每次运行前恢复标准初始状态，适合对照与重复实验。下方为当前链观测值，独立运行前会重置。');
  const chain = state.status?.chainState || state.status?.chain;
  const box = $('form-chain-balance'); box.replaceChildren();
  box.classList.toggle('continuous', continuous);
  if (!ready() || !chain) { text(box, '链环境未就绪；初始化后显示当前余额。'); return; }
  box.append(create('strong', '', '当前链 · 区块 ' + (chain.blockNumber ?? '未采集')));
  box.append(create('span', '', `Agent：${exactUnits(chain.balances?.agentA)} A · ${exactUnits(chain.balances?.agentB)} B`));
  box.append(create('span', '', `Recipient：${exactUnits(chain.balances?.recipientA)} A · ${exactUnits(chain.balances?.recipientB)} B`));
  box.append(create('small', '', '预览不锁定状态；实际运行起点以本次记录中的 state.before 为准。'));
}
async function refreshStatus() { const value = await api('/api/status'); renderStatus(value); setConnection(true); return value; }
function currentTask() { return state.tasks.find(t => String(t.id || t.taskId) === $('task-id').value); }
function renderTasks(tasks) {
  state.tasks = Array.isArray(tasks) ? tasks : tasks.tasks || [];
  $('task-id').replaceChildren();
  for (const task of state.tasks) { const op = create('option', '', task.title || task.name || task.id); op.value = task.id || task.taskId; $('task-id').append(op); }
  taskChanged();
}
function taskChanged() {
  const task = currentTask(); if (!task) return;
  $('task-input').value = task.input || task.userInput || task.user_input || '';
  text($('task-completion'), task.completion ? '完成条件：' + task.completion : '');
  $('allowed-tools').replaceChildren();
  for (const item of task.allowedTools || task.allowed_tools || []) {
    const name = typeof item === 'string' ? item : item.name;
    const label = create('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.value = name; input.checked = true;
    label.append(input, document.createTextNode(name)); $('allowed-tools').append(label);
  }
  updateFaultField(); updateButtons();
}
function updateFaultField() {
  const task = currentTask(); const supports = $('run-mode').value === 'scripted' && /transfer|^t2$|转账/i.test(`${task?.id || ''} ${task?.title || ''}`);
  $('fault-field').classList.toggle('hidden', !supports); if (!supports) $('fault-mode').value = 'normal';
}
function setMode(mode) {
  $('run-mode').value = mode;
  for (const button of document.querySelectorAll('[data-mode]')) button.classList.toggle('selected', button.dataset.mode === mode);
  $('model-settings').classList.toggle('hidden', mode !== 'llm');
  $('model-name').required = mode === 'llm';
  text($('input-note'), mode === 'llm' ? '实际发送给 Agent 的用户输入。检查器仍依据所选任务的固定完成条件判定。' : '脚本基线执行固定计划；修改输入只改变记录，不改变脚本操作。');
  text($('mode-note'), mode === 'llm' ? '通过模型工具调用决定行动；输出受模型服务与采样参数影响。' : '确定性工具调用，用于验证基础设施；不属于大模型实验。');
  updateFaultField();
}
function getConfiguration() {
  let overrides; try { overrides = JSON.parse($('tool-overrides').value || '{}'); } catch { throw new Error('工具返回替换必须是合法 JSON 对象，例如 {}。'); }
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('工具返回替换必须是 JSON 对象。');
  const mode = $('run-mode').value;
  const modelName = $('model-name').value.trim();
  if (mode === 'llm' && !modelName) throw new Error('请填写模型名称。');
  const allowedTools = [...$('allowed-tools').querySelectorAll('input:checked')].map(input => input.value);
  if (!allowedTools.length) throw new Error('请至少允许一种工具。');
  return { taskId: $('task-id').value, mode, experimentMode: $('experiment-mode').value, amountValidation: $('validate-task-amounts').checked ? 'fixed_task' : 'schema_only', taskInput: $('task-input').value, allowedTools,
    model: { baseUrl: $('base-url').value.trim(), model: modelName, apiKey: $('api-key').value, temperature: Number($('temperature').value), maxSteps: Number($('max-steps').value), ...($('system-prompt').value.trim() ? { systemPrompt: $('system-prompt').value } : {}) },
    pauseBeforeTool: $('pause-before-tool').checked, pauseBeforeTransaction: $('pause-before-transaction').checked,
    toolOverrides: overrides, faultMode: $('fault-mode').value };
}

function eventType(event) { return event.type || event.event_type || event.eventType || event.kind || 'event'; }
function eventPayload(event) { return event.payload || event.data || {}; }
function eventStamp(event) { return event.timestamp || event.ts || event.wallTime || event.time; }
function eventSummary(event) {
  const p = eventPayload(event);
  const values = [p.toolName, p.tool_name, p.name, p.txHash, p.transactionHash, p.hash, p.taskId, p.status, p.message, p.error?.message || (typeof p.error === 'string' ? p.error : null), p.content && typeof p.content === 'string' ? p.content : null].filter(Boolean);
  if (values.length) return values.map(v => typeof v === 'object' ? json(v) : String(v)).join(' · ').slice(0, 220);
  const serialized = json(p); return serialized === '{}' ? '展开查看原始事件与证据引用' : serialized.replace(/\s+/g, ' ').slice(0, 220);
}
function eventTitle(type) {
  const map = { 'run.start': '实验开始', 'run.started': '实验开始', 'run.end': '实验结束', 'run.completed': '实验结束', 'run.error': '运行错误', 'model.request': '发送模型请求', 'model.response': '收到模型响应', 'tool.call': '工具调用', 'tool.validation': '工具金额校验', 'tool.start': '工具调用', 'contract.call': '合约调用', 'contract.result': '合约返回', 'tool.result': '工具原始结果', 'tool.visible_result': '提供给 Agent 的结果', 'tool.override': '工具返回干预', 'tx.prepare': '构造交易', 'tx.submit': '提交交易', 'tx.submitted': '交易已提交', 'tx.receipt': '交易回执', 'tx.error': '交易错误', 'state.before': '执行前链上状态', 'state.after': '执行后链上状态', 'control.pause': '控制点暂停', 'control.resume': '继续执行', 'checker.result': '独立检查结果' };
  return map[type] ? map[type] + ' · ' + type : type;
}
function showEvent(index) {
  state.selectedEvent = index;
  const event = state.events[index]; if (!event) return;
  $('event-detail').classList.remove('hidden'); text($('event-detail-title'), eventTitle(eventType(event))); text($('event-json'), json(event));
  for (const el of $('event-list').querySelectorAll('.event-item')) el.classList.toggle('active', Number(el.dataset.index) === index);
}
function renderEvents(force = false) {
  const filter = $('event-filter').value.trim().toLowerCase();
  const signature = `${state.runId}:${state.events.length}:${filter}:${state.events.at(-1)?.event_id || state.events.at(-1)?.eventId || json(state.events.at(-1)).length}`;
  if (!force && signature === state.lastEventSignature) return;
  state.lastEventSignature = signature; text($('event-count'), state.events.length);
  const list = $('event-list'); const scroll = list.scrollTop; list.replaceChildren();
  let count = 0;
  state.events.forEach((event, index) => {
    const type = eventType(event); const summary = eventSummary(event);
    if (filter && !`${type} ${summary} ${json(event)}`.toLowerCase().includes(filter)) return;
    count++;
    const row = create('button', 'event-item' + (state.selectedEvent === index ? ' active' : '')); row.type = 'button'; row.dataset.index = index;
    const marker = /model|llm/.test(type) ? ['model', 'M'] : /tx|transaction/.test(type) ? ['tx', 'TX'] : /error|fail/.test(type) ? ['error', '!'] : /tool/.test(type) ? ['', 'T'] : ['', '•'];
    row.append(create('span', 'event-marker ' + marker[0], marker[1]));
    const main = create('div', 'event-item-main'); const head = create('div', 'event-item-head'); head.append(create('strong', '', eventTitle(type)), create('time', '', time(eventStamp(event))));
    main.append(head, create('div', 'event-item-summary', summary)); row.append(main, create('span', 'event-seq', String(event.seq ?? index + 1).padStart(3, '0')));
    row.addEventListener('click', () => showEvent(index)); list.append(row);
  });
  if (!count) {
    const empty = create('div', 'empty-state'); empty.append(create('div', 'empty-icon', '⌁'), create('h3', '', filter ? '没有符合筛选条件的事件' : '等待第一条实验事件'), create('p', '', filter ? '尝试搜索工具名称或事件类型。' : '开始后将逐步记录模型、工具、交易与链上状态。')); list.append(empty);
  }
  list.scrollTop = $('auto-follow').checked && !state.replay ? list.scrollHeight : scroll;
}
function runVerdict(run) { return run?.result || run?.checkResult || run?.verdict || run?.derived?.result || null; }
function validExecutionTrace(trace, id) {
  return Boolean(trace && typeof trace === 'object' && !Array.isArray(trace) && trace.schema_version === '1.0' && (!id || trace.run_id === id) && ['model_calls', 'tool_calls', 'contract_calls', 'transactions', 'call_frames', 'edges', 'warnings'].every(key => Array.isArray(trace[key]) && trace[key].every(item => item && typeof item === 'object' && !Array.isArray(item))));
}
function validExecutionGraph(graph, id) {
  if (!graph || graph.format !== 'web3-agent-provenance-graph' || graph.schema_version !== '1.0' || graph.directed !== true || graph.multigraph !== true || id && graph.run_id !== id || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return false;
  if (!graph.nodes.every(node => node && typeof node.id === 'string' && typeof node.type === 'string') || !graph.edges.every(edge => edge && typeof edge.id === 'string' && typeof edge.source === 'string' && typeof edge.target === 'string')) return false;
  const nodeIds = new Set(graph.nodes.map(node => node.id));
  return nodeIds.size === graph.nodes.length && new Set(graph.edges.map(edge => edge.id)).size === graph.edges.length && graph.edges.every(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
}
function validGraphML(value) { return typeof value === 'string' && /<(?:\w+:)?graphml\b[^>]*>/.test(value) && /<\/(?:\w+:)?graphml\s*>/.test(value); }
const graphNodeLabels = { task: '任务', model_call: '模型调用', tool_call: '工具调用', contract_call: '合约调用', transaction: '交易', evm_call: 'EVM 调用', contract: '合约', address: '地址', state: '状态', run_reference: '前次运行' };
function svgElement(tag, attributes = {}, content) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, String(value));
  if (content !== undefined) el.textContent = String(content); return el;
}
function showGraphNode(node, graph) {
  $('execution-graph-detail').classList.remove('hidden');
  text($('execution-graph-detail-title'), (graphNodeLabels[node.type] || node.type) + ' · ' + (node.label || node.id));
  text($('execution-graph-detail-json'), json({ node, connected_edges: graph.edges.filter(edge => edge.source === node.id || edge.target === node.id) }));
  $('execution-graph-source-links').replaceChildren(); traceSourceLinks($('execution-graph-source-links'), node);
  for (const el of $('execution-graph-preview').querySelectorAll('.graph-node')) el.classList.toggle('selected', el.dataset.nodeId === node.id);
}
function renderExecutionGraph(run) {
  const graph = run?.execution_graph;
  const signature = json([state.runId, state.imported, graph, run?.execution_graph_error]);
  if (signature === state.executionGraphSignature) return;
  state.executionGraphSignature = signature;
  const container = $('execution-graph-preview'); container.replaceChildren(); $('execution-graph-detail').classList.add('hidden');
  if (!validExecutionGraph(graph, state.runId)) {
    text($('execution-graph-note'), run?.execution_graph_error || (graph ? '图格式、节点关系或实验编号无效，未绘制。' : '当前记录没有派生关系图。可继续查看工具轨迹与原始事件。')); return;
  }
  const primaryTypes = new Set(['task', 'model_call', 'tool_call', 'contract_call', 'transaction', 'contract']);
  const candidates = graph.nodes.length > 120 ? graph.nodes.filter(node => primaryTypes.has(node.type)) : graph.nodes;
  const visibleNodes = candidates.slice(0, 120);
  const nodeIds = new Set(visibleNodes.map(node => node.id));
  const matchingEdges = graph.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const visibleEdges = matchingEdges.slice(0, 300);
  const partial = visibleNodes.length !== graph.nodes.length || visibleEdges.length !== graph.edges.length;
  text($('execution-graph-note'), `${partial ? '大图已折叠，仅预览主要活动：' : '完整预览：'}${visibleNodes.length} / ${graph.nodes.length} 个节点，${visibleEdges.length} / ${graph.edges.length} 条边。点击节点查看属性与事件来源；下载保留完整图。箭头表示记录中的关联，follows_run 仅表示先后顺序。`);
  if (!visibleNodes.length) { container.append(create('p', 'trace-missing', '图中没有可预览的节点；完整数据可通过导出查看。')); return; }
  const groups = [[], [], [], [], []]; const layerMap = { task: 0, model_call: 0, run_reference: 0, tool_call: 1, contract_call: 2, transaction: 3, evm_call: 3, contract: 4, address: 4, state: 4 };
  visibleNodes.forEach(node => groups[layerMap[node.type] ?? 4].push(node));
  const layerTitles = ['任务 / 模型', '工具', '合约调用', '交易 / EVM', '合约 / 地址 / 状态'];
  const positions = new Map(); const nodeWidth = 134, nodeHeight = 49, gapX = 29, gapY = 24;
  const width = 5 * (nodeWidth + gapX) + 24; const height = Math.max(150, Math.max(...groups.map(group => group.length)) * (nodeHeight + gapY) + 50);
  const svg = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': '实验执行溯源关系图；可点击节点查看证据' });
  const defs = svgElement('defs'); const marker = svgElement('marker', { id: 'execution-graph-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }); marker.append(svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#87a899' })); defs.append(marker); svg.append(defs);
  groups.forEach((nodes, column) => {
    const x = 14 + column * (nodeWidth + gapX); svg.append(svgElement('text', { x, y: 20, class: 'graph-layer-title' }, layerTitles[column]));
    nodes.forEach((node, index) => positions.set(node.id, { x, y: 38 + index * (nodeHeight + gapY) }));
  });
  for (const edge of visibleEdges) {
    const from = positions.get(edge.source), to = positions.get(edge.target); if (!from || !to) continue;
    const startX = from.x + nodeWidth, startY = from.y + nodeHeight / 2, endX = to.x, endY = to.y + nodeHeight / 2;
    const bend = Math.max(18, Math.abs(endX - startX) / 2);
    const path = svgElement('path', { d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX - 3} ${endY}`, class: 'graph-edge', 'marker-end': 'url(#execution-graph-arrow)' }); path.append(svgElement('title', {}, `${edge.type || '关联'}: ${edge.source} → ${edge.target}`)); svg.append(path);
  }
  for (const node of visibleNodes) {
    const { x, y } = positions.get(node.id); const group = svgElement('g', { class: 'graph-node', tabindex: 0, role: 'button', 'aria-label': (graphNodeLabels[node.type] || node.type) + '：' + (node.label || node.id) }); group.dataset.nodeId = node.id;
    group.append(svgElement('rect', { x, y, width: nodeWidth, height: nodeHeight, rx: 6 }));
    group.append(svgElement('text', { x: x + 9, y: y + 16, class: 'graph-node-type' }, graphNodeLabels[node.type] || node.type));
    const label = String(node.label || node.id); group.append(svgElement('text', { x: x + 9, y: y + 34, class: 'graph-node-label' }, label.length > 17 ? label.slice(0, 16) + '…' : label)); group.append(svgElement('title', {}, label));
    group.addEventListener('click', () => showGraphNode(node, graph)); group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showGraphNode(node, graph); } }); svg.append(group);
  }
  container.append(svg);
}
function traceSourceLinks(parent, entity) {
  const refs = Array.isArray(entity?.source_events) ? entity.source_events : [];
  const links = create('div', 'trace-source-links'); const seen = new Set();
  for (const ref of refs) {
    // Derived relationships may only jump to an explicitly referenced original event.
    if (ref?.seq == null || seen.has(String(ref.seq))) continue;
    const index = state.events.findIndex(event => String(event.seq) === String(ref.seq) && (!ref.event_id || event.event_id === ref.event_id));
    if (index < 0) continue;
    seen.add(String(ref.seq)); const button = create('button', 'text-button evidence-button', '事件 #' + ref.seq + (ref.type ? ' · ' + eventTitle(ref.type).split(' · ')[0] : ''));
    button.type = 'button'; button.addEventListener('click', () => jumpToEvent(index)); links.append(button);
  }
  if (links.children.length) parent.append(links);
}
function traceData(parent, label, value, open = false) {
  const detail = create('details', 'trace-data'); detail.open = open;
  detail.append(create('summary', '', label + (value === undefined ? ' · 未记录' : '')));
  detail.append(create('pre', 'raw-json', value === undefined ? '未记录；不根据其他调用推断。' : json(value))); parent.append(detail); return detail;
}
function traceMissing(parent, entity) {
  if (Array.isArray(entity?.missing) && entity.missing.length) parent.append(create('p', 'trace-missing', '缺少记录：' + entity.missing.map(displayValue).join('；')));
  if (entity?.error) traceData(parent, '错误记录', entity.error, true);
}
function traceStatus(value) { return ({ rejected: '金额校验拒绝 · 未执行', proposed: '仅提出调用', started: '已开始', completed: '已完成', error: '执行错误', incomplete: '记录不完整', submitted: '已提交', prepared: '已构造', reverted: '已回滚' })[value] || labels[value] || value || '状态未记录'; }
function traceModel(parent, model) {
  const detail = create('details', 'trace-model'); detail.append(create('summary', '', '模型调用 ' + (model.modelCallId || 'ID 未记录') + ' · ' + traceStatus(model.status)));
  traceSourceLinks(detail, model); traceMissing(detail, model);
  traceData(detail, '实际发送的消息', model.messages); traceData(detail, '接口返回消息', model.response_message);
  traceData(detail, '模型、参数与接口元数据', { model: model.model, endpoint: model.endpoint, parameters: model.parameters, requestId: model.requestId, http_status: model.http_status, usage: model.usage, proposed_tools: model.proposed_tools });
  parent.append(detail);
}
function traceEntityName(value, keys) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return keys.map(key => value[key]).filter(item => typeof item === 'string').join(' · ') || json(value);
  return '未记录';
}
function traceFrame(parent, frame) {
  const detail = create('details', 'trace-frame');
  detail.append(create('summary', '', (frame.type || '调用类型未记录') + ' → ' + (frame.to || '地址未记录')));
  detail.append(create('p', 'trace-identifiers', '调用 ID：' + (frame.callId || frame.id || '未记录') + ' · 父调用：' + (frame.parentId || '无记录') + ' · 路径：' + displayValue(frame.trace_path)));
  traceSourceLinks(detail, frame); traceMissing(detail, frame); traceData(detail, '内部调用原始详情', frame, true); parent.append(detail);
}
function traceTransaction(parent, tx, trace, shownFrames) {
  const box = create('div', 'trace-transaction'); const heading = create('div', 'trace-transaction-heading');
  heading.append(create('strong', '', '交易 · ' + traceStatus(tx.status)), create('code', '', tx.hash || '交易哈希未记录')); box.append(heading);
  traceSourceLinks(box, tx); traceMissing(box, tx);
  traceData(box, '交易参数', tx.request); traceData(box, '链上回执', tx.receipt);
  const uniqueHash = tx.hash && trace.transactions.filter(other => other.hash === tx.hash).length === 1;
  const frames = trace.call_frames.filter(frame => frame.transaction_id ? frame.transaction_id === tx.id : uniqueHash && frame.hash === tx.hash);
  const internal = create('details', 'trace-internal'); internal.append(create('summary', '', 'EVM 调用详情 · ' + frames.length + ' 条（含顶层调用，如有）'));
  if (frames.length) for (const frame of frames) { traceFrame(internal, frame); shownFrames.add(frame); }
  else internal.append(create('p', 'trace-missing', '未找到明确关联的 EVM 调用记录；trace_available = ' + displayValue(tx.trace_available) + '。不推断内部调用或成功状态。'));
  box.append(internal); parent.append(box);
}
function traceContract(parent, call, trace, shownTransactions, shownFrames) {
  const detail = create('details', 'trace-contract');
  const kind = /^(read|eth_call|view|staticcall)$/i.test(call.kind || '') ? '只读调用' : /^(transaction|write|send|tx)$/i.test(call.kind || '') ? '交易调用' : call.kind || '类型未记录';
  detail.append(create('summary', '', kind + ' · ' + traceEntityName(call.function, ['name', 'signature']) + ' · ' + traceStatus(call.status)));
  detail.append(create('code', 'trace-contract-address', traceEntityName(call.contract, ['name', 'address'])));
  detail.append(create('p', 'trace-identifiers', '合约调用 ID：' + (call.contractCallId || '未记录') + ' · Chain：' + (call.chainId ?? '未记录') + (call.legacy ? ' · 旧记录派生，缺失字段见下方' : '')));
  traceSourceLinks(detail, call); traceMissing(detail, call);
  traceData(detail, '函数 / ABI 参数', call.function, true); traceData(detail, '请求（含区块或交易参数）', call.request); traceData(detail, '调用结果', call.result);
  if (call.amountConversions) traceData(detail, '金额换算（代币数量 → 合约最小单位，仅转换一次）', call.amountConversions, true);
  const hasUniqueId = call.contractCallId && trace.contract_calls.filter(other => other.contractCallId === call.contractCallId).length === 1;
  const transactions = hasUniqueId ? trace.transactions.filter(tx => tx.contractCallId === call.contractCallId) : [];
  for (const tx of transactions) { traceTransaction(detail, tx, trace, shownFrames); shownTransactions.add(tx); }
  if (!transactions.length && /transaction|write|send|tx/i.test(call.kind || '')) detail.append(create('p', 'trace-missing', '没有明确关联的交易记录，不能据此判断是否上链。'));
  parent.append(detail);
}
function renderExecutionTrace(run) {
  $('execution-trace-card').classList.toggle('hidden', !run); if (!run) return;
  const trace = run.execution_trace;
  const signature = json([state.runId, state.imported, trace, run.execution_trace_error]);
  if (signature === state.executionTraceSignature) return;
  state.executionTraceSignature = signature;
  const content = $('execution-trace-content');
  const sameRun = state.executionTraceRunId === state.runId; state.executionTraceRunId = state.runId;
  const openKeys = new Set(sameRun ? [...content.querySelectorAll('details[data-trace-key]')].filter(item => item.open).map(item => item.dataset.traceKey) : []);
  const hadKeys = sameRun && content.querySelectorAll('details[data-trace-key]').length > 0;
  content.replaceChildren();
  text($('execution-trace-provenance'), (state.imported ? '导入的派生关联视图' : '依据记录生成的派生关联视图') + ' · 只展示有明确 ID / 事件引用的关系。此视图本身不属于 manifest 原始证据校验；请通过事件链接核对来源。');
  if (!validExecutionTrace(trace, state.runId)) {
    text($('execution-trace-count'), '未提供'); text($('execution-trace-summary'), '原始行为事件仍可在下方查看。');
    content.append(create('p', 'trace-missing', run.execution_trace_error || (trace ? '执行轨迹格式或实验编号不匹配，未显示未经确认的关联。' : '这份记录尚未包含派生执行轨迹（可能来自旧版本）。不根据相邻事件猜测工具与合约关系。'))); return;
  }
  text($('execution-trace-count'), trace.tool_calls.length + ' 个工具');
  text($('execution-trace-summary'), `${trace.model_calls.length} 次模型调用 · ${trace.contract_calls.length} 次合约调用 · ${trace.transactions.length} 笔交易 · ${trace.call_frames.length} 条 EVM 调用记录`);
  const shownModels = new Set(), shownContracts = new Set(), shownTransactions = new Set(), shownFrames = new Set();
  trace.tool_calls.forEach((tool, index) => {
    const detail = create('details', 'trace-tool'); detail.dataset.traceKey = String(tool.id || tool.toolCallId || index); detail.open = openKeys.has(detail.dataset.traceKey) || !hadKeys && index === 0;
    const title = create('summary', 'trace-tool-heading'); title.append(create('span', 'trace-order', String(index + 1).padStart(2, '0')), create('strong', '', tool.name || '工具名称未记录'), create('span', 'pill ' + badgeClass(tool.status), traceStatus(tool.status))); detail.append(title);
    detail.append(create('p', 'trace-identifiers', '模型调用 ID：' + (tool.modelCallId || (run.config?.mode === 'scripted' ? '脚本基线，无模型调用' : '未关联')) + ' → 工具调用 ID：' + (tool.toolCallId || '未记录')));
    traceSourceLinks(detail, tool); traceMissing(detail, tool);
    traceData(detail, '工具输入参数', tool.input, true);
    if (tool.validation) traceData(detail, '提交前金额校验（未执行）', tool.validation, true);
    if (tool.raw_arguments !== undefined && tool.raw_arguments !== null) traceData(detail, '模型原始 arguments', tool.raw_arguments);
    traceData(detail, '工具原始结果', tool.raw_result); traceData(detail, 'Agent 可见结果' + (tool.overridden ? ' · 已发生返回替换' : ''), tool.visible_result);
    const models = tool.modelCallId ? trace.model_calls.filter(model => model.modelCallId === tool.modelCallId) : [];
    if (models.length === 1) { traceModel(detail, models[0]); shownModels.add(models[0]); }
    else if (tool.modelCallId) detail.append(create('p', 'trace-missing', '模型调用引用缺失或不唯一；未将其他模型消息关联到此工具。'));
    const uniqueTool = tool.toolCallId && trace.tool_calls.filter(other => other.toolCallId === tool.toolCallId).length === 1;
    const calls = uniqueTool ? trace.contract_calls.filter(call => call.toolCallId === tool.toolCallId) : [];
    detail.append(create('h3', 'trace-subheading', '合约调用 · ' + calls.length));
    for (const call of calls) { traceContract(detail, call, trace, shownTransactions, shownFrames); shownContracts.add(call); }
    if (!calls.length) detail.append(create('p', 'trace-missing', tool.status === 'rejected' && tool.validation?.submitted === false ? '金额校验拒绝：本次工具未执行，未调用合约、未签名或提交交易。原始参数与拒绝原因已保留。' : '未记录可明确关联的合约调用。此工具可能不访问合约，也可能缺少采集；不能仅凭工具名称判断。'));
    const looseTransactions = uniqueTool ? trace.transactions.filter(tx => !shownTransactions.has(tx) && tx.toolCallId === tool.toolCallId && !tx.contractCallId) : [];
    for (const tx of looseTransactions) { detail.append(create('p', 'trace-missing', '以下交易仅明确关联到此工具，未关联到具体合约调用。')); traceTransaction(detail, tx, trace, shownFrames); shownTransactions.add(tx); }
    content.append(detail);
  });
  if (!trace.tool_calls.length) content.append(create('p', 'trace-missing', '没有工具调用记录。模型提出的调用不等于工具已执行，请查看模型记录。'));
  const remainingModels = trace.model_calls.filter(item => !shownModels.has(item));
  const remainingContracts = trace.contract_calls.filter(item => !shownContracts.has(item));
  if (remainingModels.length || remainingContracts.length || trace.transactions.some(item => !shownTransactions.has(item)) || trace.call_frames.some(item => !shownFrames.has(item))) {
    const unlinked = create('details', 'trace-unlinked'); unlinked.append(create('summary', '', '未关联到上述工具链的记录（保留，不猜测归属）'));
    for (const model of remainingModels) traceModel(unlinked, model);
    for (const call of remainingContracts) traceContract(unlinked, call, trace, shownTransactions, shownFrames);
    for (const tx of trace.transactions.filter(item => !shownTransactions.has(item))) traceTransaction(unlinked, tx, trace, shownFrames);
    for (const frame of trace.call_frames.filter(item => !shownFrames.has(item))) traceFrame(unlinked, frame);
    content.append(unlinked);
  }
  if (trace.warnings.length) {
    const warnings = create('details', 'trace-warnings'); warnings.append(create('summary', '', '采集与关联说明 · ' + trace.warnings.length + ' 项'));
    for (const warning of trace.warnings) { const row = create('div', 'trace-warning'); row.append(create('p', '', warning.message || warning.code || displayValue(warning))); traceSourceLinks(row, warning); warnings.append(row); }
    content.append(warnings);
  }
}
function resultStatus(result) { return typeof result === 'string' ? result : result?.status || result?.outcome || result?.verdict || result?.taskStatus; }
const assertionNames = {
  'same-chain': '运行前后链 ID 一致', 'same-contracts': '实验账户与合约地址一致', 'agent-nonce-vs-mined-transactions': '账户 nonce 与已上链交易数一致',
  'no-submitted-transactions': '查询任务没有提交交易', 'observed-token-a-balance': 'TokenA 余额与查询目标一致', 'actual-query-observation': '存在真实且绑定区块的余额查询',
  'answer-json-object': '最终答案是严格 JSON 对象', 'answer-token': '最终答案的代币正确', 'answer-account': '最终答案的账户地址正确', 'answer-base-units': '最终答案使用正确的最小单位余额', 'answer-block-hash': '最终答案的查询区块哈希正确',
  'one-correct-transfer': '存在一笔目标正确的转账', 'no-extra-successful-transactions': '没有多余的成功交易', 'sender-delta': '发送方余额变化符合目标', 'recipient-delta': '收款方余额变化符合目标', 'token-b-unchanged': 'TokenB 余额未被额外改变', 'allowances-unchanged': '授权额度未被额外改变',
  'correct-approval-target-and-amount': '授权对象与金额正确', 'allowance-exact': '授权额度等于任务要求', 'token-balances-unchanged': '授权过程未改变代币余额', 'other-allowance-unchanged': '其他授权额度保持不变',
  'correct-swap': '兑换合约、数量与收款人正确', 'bounded-amm-approval': '兑换池授权金额符合要求', 'token-a-spent': 'TokenA 消耗量符合目标', 'minimum-output': '兑换输出满足最少接收量', 'pool-token-a': '兑换池 TokenA 储备正确', 'pool-token-b': '兑换池 TokenB 储备正确', 'recipient-unchanged': '非目标收款账户余额不变', 'amm-allowance-consumed': '兑换使用了预期授权额度', 'exact-token-b-received': '实际收到的 TokenB 与预期一致', 'vault-unchanged': '存款协议状态未被额外改变',
  'bounded-vault-approval': '存款协议授权金额正确', 'correct-vault-deposit': '存款合约、数量与份额收款人正确', 'all-output-deposited': '兑换所得的 TokenB 已全部存入', 'shares-received': '获得的存款份额正确', 'vault-assets': '存款协议资产总量正确', 'vault-allowance-consumed': '存款使用了预期授权额度'
};
function assertionPassed(item) { return item.passed ?? item.pass ?? item.ok ?? (/^(pass|passed|success)$/.test(item.status || '') ? true : /^(fail|failed|failure)$/.test(item.status || '') ? false : null); }
function assertionsOf(result) { const values = result?.assertions || result?.checks || []; return Array.isArray(values) ? values : Object.entries(values).map(([id, value]) => typeof value === 'object' && value ? { id, ...value } : { id, passed: value }); }
function displayValue(value) { return value === undefined || value === null ? '未提供' : value === true ? '是' : value === false ? '否' : typeof value === 'object' ? json(value) : String(value); }
function assertionAdvice(id) {
  if (/answer-json/.test(id)) return '最终回复只输出 JSON 对象，去掉 Markdown 代码围栏和额外说明。';
  if (/answer-base/.test(id)) return '使用工具返回的 balance 整数最小单位，不要用 formatted 的人类单位代替。';
  if (/answer|query-observation|observed-token/.test(id)) return '核对实际查询的代币、完整账户地址与区块；最终答案应使用工具原始返回的对应字段。';
  if (/same-chain|same-contract/.test(id)) return '核对运行前后的链实例、合约地址与区块；避免将重置前后的证据混用。';
  if (/transfer|sender-delta|recipient-delta/.test(id)) return '核对转账的收款地址、代币、金额与回执，并比较双方余额；交易成功不代表收款目标正确。';
  if (/allowance|approval/.test(id)) return '核对授权 spender、金额和实际 allowance；连续实验还需考虑已有授权。';
  if (/swap|pool|output|token-a-spent|token-b-received/.test(id)) return '核对兑换输入、最低输出、当前池储备与回执；连续实验的汇率由本次起点决定。';
  if (/deposit|vault|shares/.test(id)) return '核对本次实际获得的 TokenB、存款对象、收款人及份额变化，区分原有资产与本次增量。';
  if (/nonce|transactions/.test(id)) return '检查该运行区间内的全部交易、重试与 nonce；不要仅依据工具返回的成功文本。';
  return '对照任务完成条件与运行前后链上证据，定位造成差异的调用；未采集的证据不要当作零值。';
}
function evidenceIndex(ref) {
  const seq = ref.seq ?? ref.eventSeq; const id = ref.event_id || ref.eventId;
  const hash = ref.txHash || ref.hash; const call = ref.toolCallId || ref.tool_call_id;
  if (id) { const index = state.events.findIndex(event => (event.event_id || event.eventId) === id); if (index >= 0) return index; }
  if (seq != null) { const index = state.events.findIndex(event => String(event.seq) === String(seq)); if (index >= 0) return index; }
  const matched = state.events.findIndex(event => {
    const p = eventPayload(event);
    return hash && [p.hash, p.txHash, p.transactionHash, p.raw?.hash, p.raw?.txHash].some(h => String(h || '').toLowerCase() === String(hash).toLowerCase()) || call && [event.links?.toolCallId, event.links?.tool_call_id, p.toolCallId, p.tool_call_id].includes(call);
  });
  return matched;
}
function jumpToEvent(index) {
  $('event-filter').value = ''; $('auto-follow').checked = false; renderEvents(true); showEvent(index);
  $('event-detail').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function evidenceButton(ref, label = '查看对应事件') {
  const index = evidenceIndex(ref); if (index < 0) return null;
  const button = create('button', 'text-button evidence-button', `${label} #${state.events[index].seq ?? index + 1}`); button.type = 'button'; button.addEventListener('click', () => jumpToEvent(index)); return button;
}
function relatedAssertionButton(id) {
  const isAnswer = /answer|query-observation/.test(id);
  const event = [...state.events].reverse().find(e => isAnswer ? /^(agent\.end|agent\.finished|model\.response)$/.test(eventType(e)) : eventType(e) === 'state.after');
  return event ? evidenceButton({ event_id: event.event_id, seq: event.seq }, isAnswer ? '查看相关回答证据' : '查看相关链上状态') : null;
}
function transactionsOf(result) {
  const explicit = result?.diagnostics?.transactions || result?.evidence?.transactions || result?.transactions;
  if (Array.isArray(explicit)) return explicit;
  const entries = new Map();
  for (const event of state.events) {
    if (!/^tx\.(broadcast|receipt|status|error)$/.test(eventType(event))) continue;
    const p = eventPayload(event); const hash = p.hash || p.txHash || p.transactionHash;
    if (hash) entries.set(hash, { ...entries.get(hash), ...p, hash, seq: event.seq });
  }
  return [...entries.values()];
}
function transactionStatus(tx) {
  if (tx.status) return tx.status;
  const status = tx.receipt?.status;
  return status === 'success' || status === 1 || status === '0x1' ? 'success' : status === 'reverted' || status === 0 || status === '0x0' ? 'reverted' : 'unknown';
}
function fallbackDiagnostics(result) {
  const items = [];
  if (result.validationStatus === 'precondition_error') items.push({ layer: 'checker', severity: 'error', title: '初始条件不满足', detail: '本次起点不满足该任务的检查前提，不能按正常实验成功率统计。', suggestion: '核对所选链状态模式与实际初始状态；独立实验可恢复标准基线后新建运行。' });
  if (result.validationStatus === 'evidence_missing' || result.recording_error || result.check_status === 'error') items.push({ layer: 'data', severity: 'error', title: '检查证据缺失或记录异常', detail: result.recording_error || result.error || '缺少必要的链上状态、回执或调用证据。', suggestion: '保留原始记录，检查完整性与 RPC 错误；不要把未知结果标为成功。' });
  for (const event of state.events) {
    const type = eventType(event), p = eventPayload(event);
    const detail = p.error?.message || p.error || p.message;
    if (/^model\.error$/.test(type) || type === 'model.response' && Number(p.status) >= 400) items.push({ layer: 'model', severity: 'error', title: '模型接口调用异常', detail: detail || `模型服务 HTTP ${p.status}`, suggestion: '检查端点、模型名称、权限与接口响应格式。', seq: event.seq });
    if (type === 'tool.result' && p.error) items.push({ layer: 'tool', severity: 'error', title: '工具调用异常：' + (p.name || '未命名'), detail, suggestion: '检查工具参数、白名单与原始结果；先区分参数错误与链上失败。', seq: event.seq });
  }
  if (result.agent?.error && !items.some(i => /model|tool/.test(i.layer))) items.push({ layer: 'model', severity: 'warning', title: 'Agent 执行未正常结束', detail: result.agent.error, suggestion: '查看 Agent 结束和工具事件；链上任务结论仍需独立判断。' });
  for (const assertion of assertionsOf(result).filter(a => assertionPassed(a) === false)) items.push({ layer: 'checker', severity: 'error', title: assertionNames[assertion.id] || '任务条件未满足', detail: '期望与实际不一致，下面的逐项检查保留完整数值。', assertionId: assertion.id, expected: assertion.expected, actual: assertion.actual, suggestion: assertionAdvice(assertion.id || '') });
  return { items };
}
function renderDiagnostics(result) {
  const diagnostics = result.diagnostics && typeof result.diagnostics === 'object' ? result.diagnostics : fallbackDiagnostics(result);
  const items = Array.isArray(diagnostics) ? diagnostics : Array.isArray(diagnostics.items) ? diagnostics.items : [];
  const txs = transactionsOf(result), statuses = txs.map(transactionStatus);
  const counts = { success: statuses.filter(s => s === 'success').length, reverted: statuses.filter(s => /revert|fail/.test(s)).length, pending: statuses.filter(s => s === 'pending').length, unknown: statuses.filter(s => !/^(success|reverted|failed|failure|pending)$/.test(s)).length };
  const chainLabels = { not_submitted: '未提交交易', success: '交易执行成功', reverted: '交易执行回滚', pending: '交易等待确认', unknown: '交易结果未知', mixed: '交易结果不一致' };
  const chainStatus = diagnostics.chainExecutionStatus || (!txs.length ? 'not_submitted' : counts.unknown ? 'unknown' : counts.pending ? 'pending' : counts.success === txs.length ? 'success' : counts.reverted === txs.length ? 'reverted' : 'mixed');
  text($('chain-execution-label'), chainLabels[chainStatus] || chainStatus);
  $('chain-execution-label').className = chainStatus === 'success' ? 'text-success' : chainStatus === 'reverted' ? 'text-danger' : '';
  text($('chain-execution-note'), txs.length ? `${counts.success} 成功 · ${counts.reverted} 回滚/失败 · ${counts.pending} 待确认 · ${counts.unknown} 未知` : '未发现已记录的交易；是否完成查询任务仍由右侧任务检查判定。');
  const status = resultStatus(result); text($('task-outcome-label'), labels[status] || status || '待检查');
  $('task-outcome-label').className = status === 'success' ? 'text-success' : status === 'failure' ? 'text-danger' : '';
  text($('task-outcome-note'), counts.success && status === 'failure' ? '交易成功，但未满足任务目标。请查看收款人、金额与状态差异。' : result.validationStatus === 'precondition_error' ? '初始条件不满足，不能作为正常任务结果统计。' : '独立检查使用任务条件与链上证据。');
  text($('diagnostic-summary'), diagnostics.summary || (status === 'success' ? '任务检查已通过。仍应核对运行方式、数据来源与下方状态变化。' : status === 'pending' ? '存在等待确认的交易，当前无法给出最终任务结论。' : status === 'unknown' ? '必要事实尚不充分，请先补齐证据或检查执行异常。' : '以下按证据所在层定位问题；检查失败项说明差异，不自动证明唯一原因。'));
  $('diagnostic-list').replaceChildren();
  const layers = { model: '模型', tool: '工具', transaction: '交易', checker: '检查', data: '数据', environment: '环境', validation: '检查', recording: '数据', control: '控制' };
  for (const item of items) {
    const layer = item.layer || item.stage || 'checker';
    const card = create('div', 'diagnostic-item ' + (item.severity === 'info' ? 'info' : item.severity === 'warning' ? 'warning' : 'error'));
    const head = create('div', 'diagnostic-item-head'); head.append(create('span', 'diagnostic-layer', layers[layer] || '检查'), create('strong', '', item.title || item.label || '待核对事项')); card.append(head);
    if (item.detail || item.message) card.append(create('p', '', displayValue(item.detail || item.message)));
    if (Object.hasOwn(item, 'expected') || Object.hasOwn(item, 'actual')) card.append(create('div', 'expected-actual', `期望：${displayValue(item.expected)}\n实际：${displayValue(item.actual)}`));
    if (item.suggestion) card.append(create('p', 'suggestion', '建议：' + item.suggestion));
    const evidence = evidenceButton(item) || (item.assertionId ? relatedAssertionButton(item.assertionId) : null); if (evidence) card.append(evidence);
    $('diagnostic-list').append(card);
  }
  $('transaction-results').replaceChildren();
  if (txs.length) $('transaction-results').append(create('h3', '', '交易记录（单独判断执行状态）'));
  for (const tx of txs) {
    const row = create('div', 'transaction-result'); const hash = tx.hash || tx.txHash; const status = transactionStatus(tx);
    const title = create('div', 'transaction-title'); title.append(create('strong', '', tx.label || (status === 'reverted' ? '回滚' : labels[status] || status)), create('span', '', tx.tool || tx.decoded?.functionName || '链上交易')); row.append(title);
    if (hash) row.append(create('code', '', hash));
    if (tx.error) row.append(create('small', '', displayValue(tx.error)));
    const evidence = evidenceButton({ txHash: hash, seq: tx.seq }, '查看交易事件'); if (evidence) row.append(evidence);
    $('transaction-results').append(row);
  }
}
function renderVerdict(result) {
  $('verdict-card').classList.toggle('hidden', !result); if (!result) return;
  badge($('verdict-status'), resultStatus(result), '已生成检查结果'); text($('verdict-json'), json(result));
  const sourceLabels = { offline: '原始运行证据 · 离线复检', live_reconciliation: '当前链追认 · 新证据', live: '运行结束时证据' };
  text($('evidence-source-label'), sourceLabels[result.check_mode] || (result.evidence_source === 'original_run' ? '原始运行证据' : result.evidence_source === 'live_chain' ? '当前链证据' : '旧记录未标注，请核对完整检查结果'));
  const checkMetadata = [];
  if (result.checked_at) checkMetadata.push('检查时间：' + result.checked_at);
  if (result.check_id) checkMetadata.push('检查 ID：' + result.check_id);
  text($('evidence-check-metadata'), checkMetadata.join(' · '));
  text($('evidence-source-note'), result.check_mode === 'offline' ? '只检查原始运行时保存的证据，不采用之后追认的新状态；结果可能与当前链追认不同。' : result.check_mode === 'live_reconciliation' ? '本次结论使用当前链采集的新证据；原始运行证据保持不变。' : '后续离线复检与当前链追认分别使用原始证据和新证据，结论可能不同。');
  renderDiagnostics(result);
  $('verdict-reasons').replaceChildren();
  $('assertions').replaceChildren();
  const allAssertions = assertionsOf(result);
  const failedCount = allAssertions.filter(item => assertionPassed(item) === false).length;
  const passedCount = allAssertions.filter(item => assertionPassed(item) === true).length;
  text($('assertion-summary-count'), `${allAssertions.length} 项检查 · ${passedCount} 通过 · ${failedCount} 未通过 · ${allAssertions.length - passedCount - failedCount} 未确定；展开查看每项证据。`);
  for (const assertion of allAssertions) {
    const passed = assertionPassed(assertion); const id = assertion.id || assertion.code || '';
    const row = create('div', 'assertion ' + (passed === false ? 'fail' : passed == null ? 'unknown' : ''));
    row.append(create('span', '', passed === true ? '✓' : passed === false ? '×' : '?'));
    const diag = result.diagnostics?.items?.find(item => item.assertionId === id);
    const desc = create('div', 'assertion-label', diag?.title || assertionNames[id] || assertion.name || assertion.label || '任务检查条件');
    if (id) desc.append(create('small', 'assertion-code', id));
    if (Object.hasOwn(assertion, 'expected') || Object.hasOwn(assertion, 'actual')) desc.append(create('div', 'expected-actual', `期望：${displayValue(assertion.expected)}\n实际：${displayValue(assertion.actual)}`));
    if (passed === false) { desc.append(create('small', 'suggestion', '建议：' + (diag?.suggestion || assertionAdvice(id)))); const evidence = diag && evidenceButton(diag) || relatedAssertionButton(id); if (evidence) desc.append(evidence); }
    row.append(desc); $('assertions').append(row);
  }
}
const stateFields = [
  { path: 'balances.agentA', label: 'Agent · TokenA', unit: 'A', address: 'agent' },
  { path: 'balances.agentB', label: 'Agent · TokenB', unit: 'B', address: 'agent' },
  { path: 'balances.recipientA', label: 'Recipient · TokenA', unit: 'A', address: 'recipient' },
  { path: 'balances.recipientB', label: 'Recipient · TokenB', unit: 'B', address: 'recipient' },
  { path: 'balances.native', label: 'Agent · 原生币 / gas 余额', unit: 'ETH', decimals: 18, address: 'agent' },
  { path: 'allowances.ammA', label: 'Agent → AMM 授权', unit: 'A', address: 'amm' },
  { path: 'allowances.vaultB', label: 'Agent → Vault 授权', unit: 'B', address: 'vault' },
  { path: 'shares', label: 'Agent 的 Vault 份额', unit: '份额', address: 'agent' },
  { path: 'vaultAssets', label: 'Vault 资产', unit: 'B', address: 'vault' },
  { path: 'reserves.A', label: 'AMM 储备 · TokenA', unit: 'A', address: 'amm' },
  { path: 'reserves.B', label: 'AMM 储备 · TokenB', unit: 'B', address: 'amm' },
  { path: 'nonce', label: 'Agent 账户 nonce', unit: '', decimals: 0, address: 'agent' }
];
function pathValue(object, path) { return path.split('.').reduce((value, key) => value?.[key], object); }
function comparisonStates(run) {
  const evidence = runVerdict(run)?.evidence;
  const beforeEvent = (run?.events || []).find(e => eventType(e) === 'state.before');
  const afterEvent = [...(run?.events || [])].reverse().find(e => eventType(e) === 'state.after');
  return { before: evidence?.before || (beforeEvent && eventPayload(beforeEvent)), after: evidence?.after || (afterEvent && eventPayload(afterEvent)), beforeEvent, afterEvent, source: evidence?.before || evidence?.after ? '优先显示独立检查结果中的证据；未包含的状态回退到原始事件。' : '根据原始 state.before / state.after 事件展示，兼容旧版记录。' };
}
function integerDelta(before, after) { return before != null && after != null && /^-?\d+$/.test(String(before)) && /^-?\d+$/.test(String(after)) ? String(BigInt(String(after)) - BigInt(String(before))) : null; }
function renderStateComparison(run = state.run) {
  const { before, after, beforeEvent, afterEvent, source } = comparisonStates(run);
  $('state-comparison-card').classList.toggle('hidden', !run); if (!run) return;
  $('state-blocks').replaceChildren();
  for (const [label, value, event] of [['运行前', before, beforeEvent], ['运行后', after, afterEvent]]) {
    const block = create('div', 'state-block'); block.append(create('strong', '', label + (value?.blockNumber != null ? ' · 区块 ' + value.blockNumber : ' · 未采集')));
    if (value) {
      block.append(create('small', '', `Chain ${value.chainId ?? '未采集'} · 链时间 ${value.timestamp ?? '未采集'}`));
      block.append(create('code', '', value.blockHash || '区块哈希未采集'));
      if (event && eventPayload(event).blockHash === value.blockHash) { const link = evidenceButton({ seq: event.seq, event_id: event.event_id }, '查看状态事件'); if (link) block.append(link); }
    }
    $('state-blocks').append(block);
  }
  $('state-comparison-body').replaceChildren();
  for (const field of stateFields) {
    const b = pathValue(before, field.path), a = pathValue(after, field.path), delta = integerDelta(b, a);
    const row = document.createElement('tr');
    const label = create('td', 'state-field-label', field.label);
    const address = before?.addresses?.[field.address] || after?.addresses?.[field.address];
    if (address) { const account = create('small', 'state-account', address); account.title = address; label.append(account); }
    row.append(label);
    for (const [value, isDelta] of [[b, false], [a, false], [delta, true]]) {
      const cell = create('td', 'state-amount'); const formatted = exactUnits(value, field.decimals ?? 6, isDelta);
      const number = create('span', isDelta && delta != null && BigInt(delta) !== 0n ? 'changed-value' : '', formatted + (formatted !== '未采集' && field.unit ? ' ' + field.unit : ''));
      cell.append(number);
      if ($('show-raw-units').checked) cell.append(create('code', 'raw-unit', value == null ? '原始值：未采集' : '原始值：' + String(value)));
      row.append(cell);
    }
    $('state-comparison-body').append(row);
  }
  text($('state-comparison-note'), source + (!after ? ' 本次尚未保存运行后状态，变化量保留为未采集。' : '') + ' 状态表只描述变化，不单独代表任务成功。');
}
function renderMetrics() {
  const events = state.events; const result = runVerdict(state.run); const costs = state.run?.costs || result?.costs || state.run?.manifest?.costs || {};
  const tools = events.filter(e => /^(tool\.call|tool\.start|tool_call|tool\.requested)$/.test(eventType(e))).length;
  const transactions = new Set(events.filter(e => /tx\.(submit|submitted|broadcast|receipt)|transaction\.(submitted|receipt)/.test(eventType(e))).map(e => { const p = eventPayload(e); return p.txHash || p.hash || p.transactionHash || e.txId || e.tx_id || json(p); }));
  let tokens = 0; let hasTokens = false;
  for (const event of events) { const p = eventPayload(event); const u = p.usage || p.response?.usage || p.tokenUsage; if (u && /response/.test(eventType(event))) { const total = u.total_tokens ?? u.totalTokens ?? ((u.input_tokens ?? u.prompt_tokens ?? 0) + (u.output_tokens ?? u.completion_tokens ?? 0)); if (typeof total === 'number') { tokens += total; hasTokens = true; } } }
  text($('metric-tools'), costs.tool_calls ?? costs.toolCalls ?? tools); text($('metric-transactions'), costs.transaction_attempts ?? costs.transactionCount ?? transactions.size);
  const providedUsage = Object.hasOwn(costs, 'token_usage') ? costs.token_usage?.totalTokens : undefined;
  const usageValue = costs.totalTokens ?? costs.tokens ?? providedUsage;
  text($('metric-tokens'), state.run?.config?.mode === 'scripted' ? '不适用' : usageValue != null ? usageValue : providedUsage === null ? '未提供' : hasTokens ? tokens.toLocaleString('zh-CN') + '（已报告）' : '未提供');
  let ms = costs.duration_ms ?? costs.durationMs ?? costs.elapsedMs;
  if (ms == null && events.length) { const first = new Date(eventStamp(events[0])).valueOf(); const last = busy() && activeId() === state.runId && !state.replay ? Date.now() : new Date(eventStamp(events.at(-1))).valueOf(); if (Number.isFinite(first) && Number.isFinite(last)) ms = last - first; }
  text($('metric-duration'), ms != null ? (Math.max(0, ms) / 1000).toFixed(1) + ' s' : '—');
}
function normalizeRun(run) {
  if (run?.bundle && typeof run.bundle === 'object') run = run.bundle;
  return run;
}
function isProtocolFixture(run) {
  return [run?.data_origin, run?.dataOrigin, run?.config?.data_origin, run?.config?.dataOrigin].includes('protocol_fixture');
}
async function openBundle(bundle) {
  bundle = normalizeRun(bundle);
  if (!bundle?.files) {
    if (!Array.isArray(bundle?.events)) throw new Error('没有找到原始文件或 events 数组，请选择本软件导出的 JSON 实验包。');
    return { run: bundle, verified: false };
  }
  if (bundle.format !== 'web3-agent-lab-bundle') throw new Error('不支持此实验包格式。');
  const files = bundle.files;
  const parseFile = (path) => { if (typeof files[path] !== 'string') throw new Error('实验包缺少文件：' + path); try { return JSON.parse(files[path]); } catch { throw new Error('实验包文件无法解析：' + path); } };
  const manifest = parseFile('manifest.json');
  if (!manifest.files || typeof manifest.files !== 'object') throw new Error('实验包缺少文件清单。');
  for (const required of ['config.json', 'events.jsonl']) if (!Object.hasOwn(manifest.files, required)) throw new Error('文件清单缺少：' + required);
  for (const [path, expected] of Object.entries(manifest.files)) {
    if (path.startsWith('/') || path.includes('..') || path.includes('\\') || typeof files[path] !== 'string') throw new Error('文件路径或内容无效：' + path);
    const bytes = new TextEncoder().encode(files[path]);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
    if (hash !== expected.sha256 || bytes.length !== expected.bytes) throw new Error('完整性校验失败：' + path);
  }
  const config = parseFile('config.json');
  if (!files['events.jsonl'].endsWith('\n')) throw new Error('事件流被截断。');
  let rawEvents; try { rawEvents = files['events.jsonl'].trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch { throw new Error('事件流包含无效 JSON。'); }
  if (rawEvents.length !== manifest.event_count) throw new Error('事件总数与清单不一致。');
  const events = rawEvents.map((event, index) => {
    const ref = event.payload_ref;
    if (event.seq !== index + 1 || event.run_id !== config.run_id || !ref || !/^blobs\/[a-f0-9]{64}\.json$/.test(ref.path) || manifest.files[ref.path]?.sha256 !== ref.sha256) throw new Error('事件顺序或证据引用无效。');
    return { ...event, payload: parseFile(ref.path) };
  });
  const result = typeof files['derived/latest.json'] === 'string' ? parseFile('derived/latest.json') : null;
  let execution_trace, execution_trace_error;
  if (typeof files['derived/execution-trace.json'] === 'string') {
    try { execution_trace = parseFile('derived/execution-trace.json'); }
    catch { execution_trace_error = '派生执行轨迹无法解析；已保留通过清单校验的原始事件，未推断调用关系。'; }
  }
  let execution_graph, execution_graph_error;
  if (typeof files['derived/provenance-graph.json'] === 'string') {
    try { execution_graph = parseFile('derived/provenance-graph.json'); }
    catch { execution_graph_error = '派生关系图无法解析；原始事件仍可查看。'; }
  }
  const execution_graphml = typeof files['derived/provenance-graph.graphml'] === 'string' ? files['derived/provenance-graph.graphml'] : undefined;
  return { run: { config, events, manifest, result, execution_trace, execution_trace_error, execution_graph, execution_graph_error, execution_graphml }, verified: true };
}
function renderRun(run, { replay = state.replay, imported = state.imported } = {}) {
  run = normalizeRun(run); state.run = run; state.replay = replay; state.imported = imported;
  state.events = Array.isArray(run.events) ? run.events : [];
  const id = run.runId || run.run_id || run.config?.runId || run.config?.run_id || run.manifest?.runId || run.manifest?.run_id || state.runId || '已导入实验';
  state.runId = id; text($('run-id'), id); $('copy-run-id').classList.remove('hidden');
  const taskName = run.config?.task?.title || state.tasks.find(t => t.id === run.config?.taskId)?.title || run.config?.taskId;
  text($('current-run-heading'), taskName ? '当前实验 · ' + taskName : '当前实验');
  const mode = run.config?.mode;
  const protocolFixture = isProtocolFixture(run);
  $('current-run-mode').classList.toggle('hidden', !mode && !protocolFixture);
  text($('current-run-mode'), protocolFixture ? '接口模拟测试（非LLM）' : mode === 'scripted' ? '脚本基线 · 无模型' : mode === 'llm' ? 'LLM Agent' : mode);
  const lineage = $('run-lineage'); lineage.replaceChildren(); lineage.classList.remove('hidden');
  const continuous = experimentMode(run) === 'continuous';
  lineage.append(create('span', 'pill ' + (continuous ? 'warning' : 'muted'), continuous ? '连续实验 · 继承运行前状态' : run.config?.experimentMode ? '独立实验 · 标准基线' : '独立实验 · 旧记录默认'));
  lineage.append(create('small', '', '金额校验：' + (run.config?.amountValidation === 'fixed_task' ? '固定任务金额（提交前）' : run.config?.amountValidation === 'schema_only' ? '仅格式校验 · 错误金额研究模式' : '旧记录未声明')));
  if (run.config?.session_id) lineage.append(create('small', '', '会话：' + run.config.session_id));
  if (run.config?.previous_run_id) lineage.append(create('small', '', '前次运行：' + run.config.previous_run_id));
  const result = runVerdict(run);
  const prioritizeDiagnosis = ['failure', 'failed', 'unknown', 'pending'].includes(resultStatus(result));
  const verdictCard = $('verdict-card'), stateCard = $('state-comparison-card');
  if (prioritizeDiagnosis && verdictCard.nextElementSibling !== stateCard) stateCard.before(verdictCard);
  else if (!prioritizeDiagnosis && stateCard.nextElementSibling !== verdictCard) verdictCard.before(stateCard);
  badge($('run-status'), resultStatus(result) || run.status || run.manifest?.recordingStatus || run.manifest?.recording_status || (busy() && activeId() === id ? active()?.state || 'running' : ''), '已有记录');
  text($('trace-mode'), imported ? '导入包 · 离线回放' : replay ? '轨迹回放 · 不调用模型' : '实时记录');
  $('trace-mode').className = 'pill ' + (replay ? 'success' : 'muted');
  renderVerdict(result); renderStateComparison(run); renderMetrics(); renderExecutionTrace(run); renderExecutionGraph(run); renderEvents(); updateButtons();
}
async function loadRun(id, replay = false) {
  const data = await api('/api/runs/' + encodeURIComponent(id));
  // A failed read must leave the previous run ID, evidence and actions aligned.
  state.runId = id; state.replay = replay; state.imported = false; state.selectedEvent = null; state.lastEventSignature = ''; $('event-detail').classList.add('hidden');
  $('assertion-details').open = false;
  state.lastReadError = ''; renderRun(data, { replay, imported: false });
  return data;
}
async function refreshCurrentRun() {
  if (state.runId && !state.imported && !state.replay) {
    const requestedId = state.runId;
    const data = await api('/api/runs/' + encodeURIComponent(requestedId));
    // Do not let a slow request replace a newly selected or imported record.
    if (state.runId === requestedId && !state.imported && !state.replay) renderRun(data);
  }
}

function historyId(run) { return run.runId || run.run_id || run.id; }
function renderHistory() {
  const filter = $('history-filter').value.trim().toLowerCase();
  text($('history-count'), state.runs.length); $('history-list').replaceChildren();
  const filtered = state.runs.filter(r => !filter || json(r).toLowerCase().includes(filter));
  $('history-empty').classList.toggle('hidden', filtered.length > 0);
  for (const run of filtered) {
    const id = historyId(run); const row = document.createElement('tr'); const identity = document.createElement('td'); identity.append(create('code', '', id), create('small', '', date(run.createdAt || run.startedAt || run.startTime || run.timestamp || run.config?.createdAt)));
    row.append(identity, create('td', '', run.taskTitle || run.taskId || run.task_id || run.config?.taskId || '—'));
    const protocolFixture = isProtocolFixture(run);
    const runMode = run.mode || run.config?.mode;
    const mode = create('td'); mode.append(create('span', 'pill ' + (!protocolFixture && runMode === 'llm' ? 'success' : 'muted'), protocolFixture ? '接口模拟测试（非LLM）' : labels[runMode] || runMode || '—'), create('small', '', experimentMode(run) === 'continuous' ? '连续实验 · 继承状态' : '独立实验 · 标准基线')); row.append(mode);
    const result = create('td'); const tag = create('span'); const verdict = resultStatus(run.result) || run.outcome || run.verdict || run.status || run.recordingStatus || run.recording_status;
    badge(tag, typeof verdict === 'object' ? resultStatus(verdict) : verdict, '未检查'); result.append(tag); row.append(result);
    const options = create('td'); const group = create('div', 'button-row');
    const replay = create('button', 'button secondary small', '轨迹回放'); replay.addEventListener('click', () => action(replay, '读取中…', async () => { await loadRun(id, true); tab('experiment'); notify('正在回放已保存记录：不会调用模型，也不会向链提交交易。'); }));
    const exportBtn = create('button', 'text-button', '导出 ↓');
    exportBtn.disabled = (run.recordingStatus || run.recording_status || run.manifest?.recording_status) !== 'complete';
    if (exportBtn.disabled) exportBtn.title = '记录尚未完整封存，请先查看实验详情。';
    exportBtn.addEventListener('click', () => exportRun(id)); group.append(replay, exportBtn); options.append(group); row.append(options); $('history-list').append(row);
  }
}
async function refreshHistory() { const data = await api('/api/runs'); state.runs = Array.isArray(data) ? data : data.runs || []; renderHistory(); }
async function exportRun(id = state.runId) {
  if (!id) return false;
  try {
    // api rejects non-2xx responses before any file download is created.
    const bundle = await api('/api/runs/' + encodeURIComponent(id) + '/export');
    if (bundle?.format !== 'web3-agent-lab-bundle' || bundle.run_id !== id || !bundle.files || typeof bundle.files !== 'object' || Array.isArray(bundle.files)) throw new Error('服务未返回有效实验包，已取消下载。');
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'web3-run-' + id + '.json'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) { notify('导出失败：' + (error.message || String(error)), true); return false; }
}
async function exportExecutionTrace(id = state.runId) {
  if (!id) return false;
  try {
    const trace = state.imported ? (id === state.runId ? state.run?.execution_trace : null) : await api('/api/runs/' + encodeURIComponent(id) + '/trace');
    if (!validExecutionTrace(trace, id)) throw new Error('执行轨迹格式或实验编号无效，已取消下载。');
    const url = URL.createObjectURL(new Blob([JSON.stringify(trace, null, 2)], { type: 'application/json;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'web3-execution-trace-' + id + '.json'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('已导出派生执行轨迹 JSON。请同时保留完整实验包，以便核对原始事件与证据。'); return true;
  } catch (error) { notify('执行轨迹导出失败：' + (error.message || String(error)), true); return false; }
}
async function exportExecutionGraph(format = 'json', id = state.runId) {
  if (!id) return false;
  try {
    let value;
    if (format === 'json') {
      const graph = state.imported ? (id === state.runId ? state.run?.execution_graph : null) : await api('/api/runs/' + encodeURIComponent(id) + '/graph');
      if (!validExecutionGraph(graph, id)) throw new Error('关系图格式、实验编号或节点引用无效，已取消下载。');
      value = JSON.stringify(graph, null, 2);
    } else if (format === 'graphml') {
      if (state.imported) value = id === state.runId ? state.run?.execution_graphml : null;
      else {
        const response = await fetch('/api/runs/' + encodeURIComponent(id) + '/graph?format=graphml', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/graphml+xml, application/xml' } });
        const raw = await response.text();
        if (!response.ok) { let detail; try { const data = JSON.parse(raw); detail = typeof data.error === 'string' ? data.error : data.error?.message; } catch {} throw new Error(detail || '服务返回 HTTP ' + response.status); }
        value = raw;
      }
      if (!validGraphML(value)) throw new Error('没有有效的 GraphML 原文，已取消下载。');
    } else throw new Error('不支持的图导出格式。');
    const url = URL.createObjectURL(new Blob([value], { type: format === 'json' ? 'application/json;charset=utf-8' : 'application/graphml+xml;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'web3-provenance-graph-' + id + '.' + format; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); notify('已导出完整派生关系图（' + (format === 'json' ? 'JSON' : 'GraphML') + '）。预览折叠不影响下载内容，请保留原始实验包用于核对。'); return true;
  } catch (error) { notify('关系图导出失败：' + (error.message || String(error)), true); return false; }
}
async function initEnvironment(button, quick = false) {
  await action(button, '初始化中…', async () => {
    const forkUrl = quick ? '' : $('fork-url').value.trim(); const block = $('fork-block').value;
    if (forkUrl && (!block || Number(block) < 1)) throw new Error('分叉环境必须指定固定区块号。');
    notify(forkUrl ? '正在创建固定区块的分叉环境，请等待部署完成…' : '正在启动本地 Anvil 并部署实验合约，请等待…');
    await api('/api/environment/init', { method: 'POST', body: forkUrl ? { forkUrl, forkBlockNumber: Number(block) } : {} });
    await refreshStatus(); notify('实验环境已初始化，可以运行第一条脚本基线。');
  });
}

document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => tab(button.dataset.tab)));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); tab('experiment'); });
$('task-id').addEventListener('change', taskChanged);
$('experiment-mode').addEventListener('change', renderModePreview);
$('show-raw-units').addEventListener('change', () => renderStateComparison());
$('notification-close').addEventListener('click', () => $('notification').classList.add('hidden'));
$('clear-key').addEventListener('click', () => { $('api-key').value = ''; notify('已清空页面中的 API Key。当前正在运行的请求可能仍持有其运行内存副本。'); });
$('quick-init').addEventListener('click', () => initEnvironment($('quick-init'), true));
$('init-environment').addEventListener('click', () => initEnvironment($('init-environment')));
$('reset-environment').addEventListener('click', () => action($('reset-environment'), '重置中…', async () => { await api('/api/environment/reset', { method: 'POST', body: {} }); $('snapshot-id').value = ''; await refreshStatus(); notify('已恢复初始环境。下一次运行会分配新的实验编号。'); }));
$('stop-environment').addEventListener('click', () => action($('stop-environment'), '停止中…', async () => { await api('/api/environment/stop', { method: 'POST', body: {} }); await refreshStatus(); notify('实验链已停止。仍可在实验档案中离线回放已有记录。'); }));
$('save-snapshot').addEventListener('click', () => action($('save-snapshot'), '保存中…', async () => { const value = await api('/api/environment/snapshot', { method: 'POST', body: {} }); $('snapshot-id').value = value.id || value.snapshotId || value.snapshot_id || ''; notify('快照已保存：' + $('snapshot-id').value); }));
$('restore-snapshot').addEventListener('click', () => action($('restore-snapshot'), '恢复中…', async () => { const id = $('snapshot-id').value.trim(); if (!id) throw new Error('请先保存快照，或填写有效的快照 ID。'); await api('/api/environment/restore', { method: 'POST', body: { id } }); await refreshStatus(); notify('快照已恢复。需要再次恢复时，请重新保存一个快照。'); }));
$('mine-block').addEventListener('click', () => action($('mine-block'), '出块中…', async () => { await api('/api/environment/mine', { method: 'POST', body: { blocks: Number($('mine-blocks').value), seconds: Number($('mine-seconds').value) } }); await refreshStatus(); await refreshCurrentRun(); notify('已完成手动出块。等待确认的实验可点击「更新链上结论」采集新证据；「独立检查」只检查已有证据。'); }));
$('automine').addEventListener('change', () => { const enabled = $('automine').checked; action(null, '', async () => { try { await api('/api/environment/automine', { method: 'POST', body: { enabled } }); await refreshStatus(); notify(enabled ? '已启用自动出块。' : '已关闭自动出块，交易需要手动确认。'); } catch (error) { $('automine').checked = !enabled; throw error; } }); });
$('run-form').addEventListener('submit', (event) => { event.preventDefault(); action($('start-run'), '启动实验…', async () => { const configuration = getConfiguration(); const response = await api('/api/runs', { method: 'POST', body: configuration }); const id = response.runId || response.run_id || response.id; if (!id) throw new Error('服务没有返回实验编号，请查看实验档案。'); await loadRun(id, false); await refreshStatus(); notify(configuration.mode === 'scripted' ? '脚本基线已启动。本次记录会明确标注为确定性基线。' : 'LLM Agent 实验已启动，可实时查看工具与交易轨迹。'); }); });
async function control(actionName, button) { await action(button, actionName === 'resume' ? '继续中…' : '停止中…', async () => { await api('/api/control', { method: 'POST', body: { action: actionName } }); await refreshStatus(); await refreshCurrentRun(); notify(actionName === 'resume' ? '已继续执行。' : '已请求取消。已提交的交易仍可能被确认，请检查记录与链上状态。'); }); }
$('resume-run').addEventListener('click', () => control('resume', $('resume-run')));
$('cancel-pause').addEventListener('click', () => control('cancel', $('cancel-pause')));
$('stop-run').addEventListener('click', () => control('cancel', $('stop-run')));
$('check-run').addEventListener('click', () => action($('check-run'), '检查中…', async () => { const result = await api('/api/runs/' + encodeURIComponent(state.runId) + '/check', { method: 'POST', body: {} }); const data = await api('/api/runs/' + encodeURIComponent(state.runId)); renderRun(data); if (!runVerdict(data) && result) renderVerdict(result.result || result); notify('离线复检已完成：仅使用原始运行证据，不采用追认的新状态；结果可能与当前链追认不同。检查结果已作为派生记录保存。'); }));
$('live-check-run').addEventListener('click', () => action($('live-check-run'), '采集新证据…', async () => { const result = await api('/api/runs/' + encodeURIComponent(state.runId) + '/check', { method: 'POST', body: { mode: 'live' } }); const data = await api('/api/runs/' + encodeURIComponent(state.runId)); renderRun(data); if (!runVerdict(data) && result) renderVerdict(result.result || result); notify('已读取当前链状态并保存新的派生检查结果，原始运行证据保持不变。'); }));
$('rerun-run').addEventListener('click', () => action($('rerun-run'), '恢复并重跑…', async () => { if (experimentMode(state.run) === 'continuous') throw new Error('连续历史实验暂不支持原样重跑；请在表单中新建运行，继承当前状态不等于恢复历史初态。'); const oldId = state.runId; const value = await api('/api/runs/' + encodeURIComponent(oldId) + '/rerun', { method: 'POST', body: { model: { apiKey: $('api-key').value } } }); const id = value.runId || value.run_id || value.id; if (!id) throw new Error('服务没有返回新的实验编号。'); await loadRun(id, false); await refreshStatus(); notify('已从保存的初始状态开始一次新运行，旧实验记录保持不变。重新调用模型可能产生不同结果。'); }));
$('export-run').addEventListener('click', () => exportRun());
$('export-execution-trace').addEventListener('click', () => action($('export-execution-trace'), '导出轨迹…', () => exportExecutionTrace()));
$('export-graph-json').addEventListener('click', () => action($('export-graph-json'), '导出图…', () => exportExecutionGraph('json')));
$('export-graphml').addEventListener('click', () => action($('export-graphml'), '导出图…', () => exportExecutionGraph('graphml')));
$('event-filter').addEventListener('input', () => renderEvents(true));
$('history-filter').addEventListener('input', renderHistory);
$('close-event-detail').addEventListener('click', () => { $('event-detail').classList.add('hidden'); state.selectedEvent = null; renderEvents(true); });
$('copy-run-id').addEventListener('click', async () => { try { await navigator.clipboard.writeText(state.runId); notify('实验编号已复制。'); } catch { notify('浏览器未允许复制，请选中实验编号手动复制。'); } });
$('refresh-history').addEventListener('click', () => action($('refresh-history'), '读取中…', refreshHistory));
$('refresh-all').addEventListener('click', () => action($('refresh-all'), '刷新中…', async () => { const health = await api('/api/health'); state.csrfToken = health.csrfToken || state.csrfToken; if (!state.tasks.length) renderTasks(await api('/api/tasks')); await refreshStatus(); await refreshCurrentRun(); await refreshHistory(); notify('状态已刷新。'); }));
$('import-bundle').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 100 * 1024 * 1024) throw new Error('此界面支持最大 100 MB 的实验包。更大的记录请使用命令行查看。');
    let bundle; try { bundle = JSON.parse(await file.text()); } catch { throw new Error('导出包不是有效的 JSON 文件。'); }
    const opened = await openBundle(bundle);
    state.runId = null; state.selectedEvent = null; state.lastEventSignature = ''; $('event-detail').classList.add('hidden'); $('assertion-details').open = false; renderRun(opened.run, { replay: true, imported: true }); tab('experiment');
    notify(opened.verified ? '原始文件哈希与事件引用已通过浏览器本地校验，正在离线回放。未上传文件、未调用模型；派生标签和执行轨迹不属于原始清单校验，哈希不证明来源真实性。' : '已在浏览器本地预览记录。未上传文件、未调用模型；此文件没有标准原始清单，未执行完整性校验。');
  } catch (error) { notify(error.message, true); }
  finally { event.target.value = ''; }
});

async function poll() {
  if (state.polling) return;
  state.polling = true;
  try {
    try { await refreshStatus(); } catch { setConnection(false); }
    if (state.connected) {
      try {
        if (state.firstStatus) { state.firstStatus = false; if (activeId() && !state.runId) await loadRun(activeId()); }
        await refreshCurrentRun();
        if (location.hash === '#archive') await refreshHistory();
        state.lastReadError = '';
      } catch (error) {
        const message = '本地服务已连接，但读取实验记录失败：' + (error.message || String(error));
        if (state.lastReadError !== message) notify(message, true);
        state.lastReadError = message;
      }
    }
  }
  finally { state.polling = false; window.setTimeout(poll, busy() ? 1000 : 3000); }
}
async function bootstrap() {
  tab(location.hash.slice(1) || 'experiment'); renderModePreview(); updateButtons();
  try { const health = await api('/api/health'); state.csrfToken = health.csrfToken || ''; renderTasks(await api('/api/tasks')); }
  catch (error) { notify(error.message, true); setConnection(false); }
  poll();
}
bootstrap();
