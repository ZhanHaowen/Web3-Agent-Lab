'use strict';
(() => {
  const TASK_IDS = ['balance', 'transfer', 'approve', 'swap', 'swap_deposit'];
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const stringify = value => JSON.stringify(value, null, 2);
  const statusLabel = value => ({ success: '成功', passed: '通过', failed: '失败', failure: '失败', pending: '等待确认', unknown: '结果未知', running: '运行中', starting: '正在启动', paused: '已暂停', cancelling: '正在停止后续操作', cancelled: '已停止', completed: '执行结束', query_only: '只读查询', not_submitted: '未提交交易', confirmed: '已确认', reverted: '链上回滚', waiting: '等待中' }[value] || value || '尚无结论');
  function amount(value, allowZero = false) {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d{1,6})?$/.test(text)) throw Error('金额必须是最多 6 位小数的代币数量字符串，不能使用科学计数法或原始精度换算。');
    const [a, b = ''] = text.split('.');
    const units = BigInt(a) * 1000000n + BigInt(b.padEnd(6, '0'));
    if ((!allowZero && units === 0n) || units > 2n ** 256n - 1n) throw Error('金额超出范围；数量必须大于 0，最低输出可以为 0。');
    return text;
  }
  function parameters(taskId, fields) {
    if (!TASK_IDS.includes(taskId)) throw Error('此预览只开放五类基础任务。');
    if (taskId === 'balance') return {};
    if (taskId === 'transfer' || taskId === 'approve') return { amount: amount(fields.amount) };
    return { amountIn: amount(fields.amountIn), minAmountOut: amount(fields.minAmountOut, true) };
  }
  function runPayload(fields) {
    let overrides;
    try { overrides = JSON.parse(fields.toolOverrides || '{}'); } catch { throw Error('工具返回替换必须是合法 JSON 对象。'); }
    if (!object(overrides)) throw Error('工具返回替换必须是 JSON 对象，不能是数组或 null。');
    if (!Array.isArray(fields.allowedTools) || !fields.allowedTools.length) throw Error('请至少选择一个允许工具。');
    const payload = { taskId: fields.taskId, mode: fields.mode === 'scripted' ? 'scripted' : 'llm', taskParameters: parameters(fields.taskId, fields), taskInput: fields.taskInput, allowedTools: [...fields.allowedTools], toolOverrides: overrides, pauseBeforeTool: !!fields.pauseBeforeTool, pauseBeforeTransaction: !!fields.pauseBeforeTransaction };
    if (payload.mode === 'llm') {
      if (!['api', 'local'].includes(fields.mode)) throw Error('未知模型后端。');
      const temperature = Number(fields.temperature), maxSteps = Number(fields.maxSteps);
      if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2 || !Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 100) throw Error('模型参数无效。Temperature 应为 0–2，步骤数应为 1–100 的整数。');
      payload.model = { provider: fields.mode, temperature, maxSteps };
      if (fields.systemPrompt?.trim()) payload.model.systemPrompt = fields.systemPrompt;
      if (fields.mode === 'api') {
        if (!fields.modelName?.trim()) throw Error('请填写服务商提供的模型 ID。');
        let url; try { url = new URL(fields.modelUrl); } catch { throw Error('模型 API 地址无效。'); }
        if (!['http:', 'https:'].includes(url.protocol)) throw Error('模型 API 地址须使用 HTTP 或 HTTPS。');
        Object.assign(payload.model, { model: fields.modelName.trim(), baseUrl: fields.modelUrl.trim(), apiKey: fields.modelKey || '' });
      }
    }
    return payload;
  }
  function createClient(fetcher) {
    let offline = false, token = '', epoch = 0;
    const pending = new Set();
    return {
      get offline() { return offline; },
      setToken(value) { token = value || ''; },
      enterOffline() { offline = true; epoch++; for (const controller of pending) controller.abort(); pending.clear(); },
      leaveOffline() { offline = false; epoch++; },
      async request(path, body) {
        if (offline) throw Error('离线回放模式禁止网络请求。');
        if (!/^\/(?:bootstrap|profiles|status|connect|disconnect|deploy|attach|manifest|manifests|resolve|run|runs|export|pause|resume|cancel|recheck|reconcile|verify|check-offline)(?:\?|$)/.test(path)) throw Error('未允许的测试网接口。');
        const generation = epoch, controller = new AbortController(); pending.add(controller);
        try {
          const response = await fetcher('/api/testnet' + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { 'x-testnet-token': token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal });
          const text = await response.text(); let value;
          try { value = text ? JSON.parse(text) : {}; } catch { throw Error('服务未返回 JSON，请确认服务器已包含测试网预览模块。'); }
          if (offline || epoch !== generation) throw Error('请求结果已过期，未用于离线回放。');
          if (!response.ok) throw Error(typeof value.error === 'string' ? value.error : value.error?.message || value.message || '请求失败：HTTP ' + response.status);
          return value;
        } finally { pending.delete(controller); }
      }
    };
  }
  const safePath = path => typeof path === 'string' && !path.startsWith('/') && !path.includes('..') && !path.includes('\\') && !path.includes(':') && !/[\u0000-\u001f]/.test(path);
  async function digest(text) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(v => v.toString(16).padStart(2, '0')).join(''); }
  function validGraph(graph, runId) {
    if (!object(graph) || graph.format !== 'web3-agent-provenance-graph' || graph.schema_version !== '1.0' || graph.directed !== true || graph.multigraph !== true || graph.run_id !== runId || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return false;
    const ids = new Set();
    for (const node of graph.nodes) { if (!object(node) || typeof node.id !== 'string' || ids.has(node.id)) return false; ids.add(node.id); }
    return graph.edges.every(edge => object(edge) && ids.has(edge.source) && ids.has(edge.target));
  }
  async function readBundle(input) {
    const bundle = input?.bundle || input;
    if (!object(bundle) || bundle.format !== 'web3-agent-lab-bundle' || !object(bundle.files)) throw Error('请选择本平台导出的完整 JSON 实验包。');
    const files = bundle.files;
    const parse = path => { if (!safePath(path) || typeof files[path] !== 'string') throw Error('缺少实验文件：' + path); try { return JSON.parse(files[path]); } catch { throw Error('文件不是合法 JSON：' + path); } };
    const manifest = parse('manifest.json');
    if (!object(manifest.files) || !Object.hasOwn(manifest.files, 'config.json') || !Object.hasOwn(manifest.files, 'events.jsonl')) throw Error('清单缺少配置或原始事件。');
    async function checkFiles(entries) {
      for (const [path, expected] of Object.entries(entries)) {
        if (!safePath(path) || typeof files[path] !== 'string' || !object(expected)) throw Error('无效的证据路径或内容：' + path);
        if (new TextEncoder().encode(files[path]).length !== expected.bytes || await digest(files[path]) !== expected.sha256) throw Error('文件完整性校验失败：' + path);
      }
    }
    await checkFiles(manifest.files);
    const config = parse('config.json');
    if (typeof config.run_id !== 'string' || config.run_id !== bundle.run_id || manifest.run_id !== config.run_id) throw Error('实验编号与清单不一致。');
    if (!files['events.jsonl'].endsWith('\n')) throw Error('原始事件流被截断。');
    let raw;
    try { raw = files['events.jsonl'].trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch { throw Error('原始事件流包含无效 JSON。'); }
    if (raw.length !== manifest.event_count) throw Error('事件数量与清单不一致。');
    const events = raw.map((event, index) => {
      const ref = event.payload_ref;
      if (event.seq !== index + 1 || event.run_id !== config.run_id || !object(ref) || !/^blobs\/[a-f0-9]{64}\.json$/.test(ref.path) || ref.path !== 'blobs/' + ref.sha256 + '.json' || manifest.files[ref.path]?.sha256 !== ref.sha256) throw Error('原始事件顺序或内容寻址引用无效。');
      return { ...event, payload: parse(ref.path) };
    });
    const warnings = [];
    let derivedVerified = false, derivedPaths = new Set();
    if (typeof files['derived/execution-trace-manifest.json'] === 'string') {
      try {
        const derived = parse('derived/execution-trace-manifest.json');
        if (derived.run_id !== config.run_id || derived.source_manifest_sha256 !== await digest(files['manifest.json']) || !object(derived.files)) throw Error('派生清单的来源不匹配。');
        await checkFiles(derived.files); derivedVerified = true; derivedPaths = new Set(Object.keys(derived.files));
      } catch (error) { warnings.push(error.message + ' 仅显示通过校验的原始事件。'); }
    } else warnings.push('缺少派生文件清单；未将未校验的图作为原始证据展示。');
    const optional = path => { try { return typeof files[path] === 'string' ? parse(path) : null; } catch { warnings.push('无法解析派生文件：' + path); return null; } };
    const graph = derivedVerified && derivedPaths.has('derived/provenance-graph.json') ? optional('derived/provenance-graph.json') : null;
    if (derivedVerified && !derivedPaths.has('derived/provenance-graph.json')) warnings.push('派生清单未覆盖图文件，未展示未校验关系。');
    if (graph && !validGraph(graph, config.run_id)) warnings.push('图的结构或实验编号无效，未展示关系。');
    return { nativeBundle: bundle, config, manifest, events, result: optional('derived/latest.json'), execution_trace: derivedVerified && derivedPaths.has('derived/execution-trace.json') ? optional('derived/execution-trace.json') : null, execution_graph: validGraph(graph, config.run_id) ? graph : null, derivedVerified, warnings, verified: true };
  }
  window.TestnetLabCore = { amount, parameters, runPayload, createClient, readBundle, validGraph, statusLabel, safePath };
  if (!document.getElementById('testnet-app')) return;

  const $ = id => document.getElementById(id);
  const make = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
  const text = (id, value) => { $(id).textContent = String(value ?? '—'); };
  const client = createClient((...args) => fetch(...args));
  const state = { profiles: [], tasks: [], status: {}, run: null, runId: null, bundle: null, manifest: null, pending: false, replayLimit: Infinity, timer: null, pollBusy: false, viewGeneration: 0 };
  function notice(message, error = false) { text('notice', message); $('notice').classList.toggle('error', error); }
  function shownEvents() { return (state.run?.events || []).slice(0, state.replayLimit); }
  function updateControls() {
    const offline = client.offline, busy = !!state.status.busy, active = state.status.active, writable = state.status.writable === true;
    $('offline-banner').hidden = !offline;
    $('connect-fields').disabled = offline || state.pending || busy;
    $('run-fields').disabled = offline || state.pending || busy;
    $('connect').disabled = offline || state.pending || busy;
    $('disconnect').disabled = offline || state.pending || busy || !state.status.connected;
    $('deploy').disabled = offline || state.pending || busy || !writable || !state.status.connected || !$('deploy-consent').checked;
    $('manifest-file').disabled = offline || state.pending || busy || !state.status.connected;
    $('manifest-export').disabled = offline || state.pending || !state.status.ready;
    $('start-run').disabled = offline || state.pending || busy || !state.status.ready || ($('task').value !== 'balance' && !writable);
    const ownActive = !offline && !!active && active.runId === state.runId;
    $('pause-run').disabled = offline || state.pending || !ownActive || active?.state === 'paused';
    $('resume-run').disabled = offline || state.pending || !ownActive || active?.state !== 'paused';
    $('cancel-run').disabled = offline || state.pending || !ownActive;
    $('recheck').disabled = offline || state.pending || busy || !state.runId || !state.status.connected;
    $('verify').disabled = offline || state.pending || busy || !state.runId;
    $('check-offline').disabled = offline || state.pending || busy || !state.runId;
    $('refresh').disabled = offline || state.pending;
    $('refresh-history').disabled = offline || state.pending;
    $('reconcile').disabled = offline || state.pending || busy || !state.status.connected;
    $('bundle-file').disabled = state.pending;
    $('load-evidence').disabled = offline || state.pending || !state.runId || ownActive;
    $('download-bundle').disabled = state.pending || !state.runId || (offline && !state.bundle) || ownActive;
    for (const button of document.querySelectorAll('[data-artifact]')) button.disabled = state.pending || !state.runId || ownActive || (offline && typeof state.bundle?.files?.[button.dataset.artifact] !== 'string');
    for (const id of ['replay-start', 'replay-step', 'replay-all']) $(id).disabled = !offline || !state.run;
    text('trace-mode', offline ? '离线 · 不发请求' : '在线记录');
  }
  async function action(fn, message) {
    if (state.pending) return;
    state.pending = true; updateControls();
    if (message) notice(message);
    try { await fn(); } catch (error) { if (error.name !== 'AbortError') notice(error.message, true); }
    finally { state.pending = false; updateControls(); }
  }
  function currentProfile() { return state.profiles.find(p => p.id === $('network').value); }
  function profileChanged() {
    const profile = currentProfile(); if (!profile) return;
    $('rpc-url').value = profile.rpcUrl || '';
    $('confirmations').value = profile.confirmations || 2;
    $('receipt-timeout').value = (profile.receiptTimeoutMs || 120000) / 1000;
    text('network-note', `chainId ${profile.chainId} · Gas ${profile.symbol} · 自有 Lab 合约预览，第三方协议需另行适配。`);
  }
  function taskChanged() {
    const task = state.tasks.find(t => t.id === $('task').value); if (!task) return;
    const p = task.taskParameters || {};
    $('amount').value = p.amount || (task.id === 'approve' ? '20' : '10');
    $('amount-in').value = p.amountIn || '10'; $('minimum').value = p.minAmountOut || '9';
    $('amount-field').hidden = !['transfer', 'approve'].includes(task.id);
    $('amount-in-field').hidden = $('minimum-field').hidden = !['swap', 'swap_deposit'].includes(task.id);
    $('task-input').value = task.input || ''; text('task-completion', task.completion);
    $('allowed-tools').replaceChildren();
    for (const tool of task.allowedTools || []) { const label = make('label'); const input = make('input'); input.type = 'checkbox'; input.value = tool; input.checked = true; label.append(input, make('span', tool)); $('allowed-tools').append(label); }
    updateControls();
  }
  function modeChanged() {
    const mode = $('mode').value; $('model-settings').hidden = mode === 'scripted'; $('api-settings').hidden = mode !== 'api'; $('local-note').hidden = mode !== 'local';
  }
  function formFields() {
    return { taskId: $('task').value, mode: $('mode').value, amount: $('amount').value, amountIn: $('amount-in').value, minAmountOut: $('minimum').value, taskInput: $('task-input').value, toolOverrides: $('tool-overrides').value, allowedTools: [...$('allowed-tools').querySelectorAll('input:checked')].map(el => el.value), modelName: $('model-name').value, modelUrl: $('model-url').value, modelKey: $('model-key').value, temperature: $('temperature').value, maxSteps: $('max-steps').value, systemPrompt: $('system-prompt').value, pauseBeforeTool: $('pause-tool').checked, pauseBeforeTransaction: $('pause-transaction').checked };
  }
  function renderStatus(status) {
    state.status = status || {};
    const environment = status.environment || {}, env = environment.env || environment, chain = status.chainState || {};
    const connectedProfile = state.profiles.find(p => p.id === env.profileId);
    text('connection-status', status.connected ? (status.writable ? '测试钱包已连接' : '只读已连接') : '未连接');
    text('chain-id', env.chainId ?? environment.profile?.chainId ?? (status.connected ? currentProfile()?.chainId : '—'));
    text('wallet-address', env.accounts?.agent || '—');
    const balance = chain.formatted?.balances?.native ?? environment.nativeBalanceFormatted ?? env.nativeBalanceFormatted ?? chain.nativeBalanceFormatted;
    text('gas-balance', balance == null ? '未提供（请查看连接信息）' : `${balance} ${connectedProfile?.symbol || environment.profile?.symbol || ''}`);
    text('wallet-mode', status.connected ? status.writable ? '可签名 · 仅已开放测试网' : '只读 · 无签名私钥' : '未连接');
    text('deployment-status', status.ready ? '已校验 / 就绪' : status.connected ? '需部署或导入' : '未准备');
    text('chain-state', stringify({ environment, chainState: status.chainState ?? null }));
    const active = status.active;
    $('pause-detail').hidden = !active?.pause;
    if (active?.pause) text('pause-detail', stringify(active.pause));
    if (!client.offline && active?.runId === state.runId) text('run-status', statusLabel(active.state));
    updateControls();
  }
  function eventSummary(event) {
    const p = event.payload || {};
    return [p.name || p.tool || p.toolName || p.method || p.functionName, p.txHash || p.hash || p.transactionHash, p.status || p.error?.message || p.error, event.payload_ref?.path].filter(value => typeof value === 'string').join(' · ');
  }
  function showEvent(event) { text('event-detail', stringify(event)); }
  function renderEvents() {
    const filter = $('event-filter').value.toLowerCase(), events = shownEvents();
    $('events').replaceChildren();
    const selected = events.filter(event => !filter || JSON.stringify(event).toLowerCase().includes(filter));
    for (const event of selected) {
      const button = make('button', undefined, 'testnet-event'); button.type = 'button';
      button.append(make('strong', `#${event.seq ?? '?'} · ${event.type || event.event || '事件'}`), make('small', eventSummary(event)));
      button.addEventListener('click', () => showEvent(event)); $('events').append(button);
    }
    if (!selected.length) $('events').append(make('p', '暂无匹配事件。', 'field-note'));
    text('event-count', events.length);
    text('model-count', events.filter(e => e.type === 'model.request').length);
    text('tool-count', events.filter(e => ['tool.call', 'tool.start'].includes(e.type)).length);
    const hashes = new Set(events.filter(e => /^(?:tx|transaction)\./.test(e.type || '')).map(e => e.payload?.txHash || e.payload?.hash || e.payload?.transactionHash).filter(Boolean));
    text('tx-count', hashes.size);
    text('replay-position', client.offline ? `${events.length} / ${state.run?.events?.length || 0} 个事件` : '');
  }
  function graphNode(node) {
    $('graph-detail').hidden = false; text('graph-detail', stringify(node)); $('graph-sources').replaceChildren();
    for (const source of node.source_events || []) {
      const seq = source.seq; const event = (state.run?.events || []).find(e => e.seq === seq);
      const button = make('button', event ? `原始事件 #${seq}` : `缺失事件 #${seq}`, 'button secondary small'); button.disabled = !event;
      if (event) button.addEventListener('click', () => showEvent(event)); $('graph-sources').append(button);
    }
  }
  function renderGraph() {
    const graph = state.run?.execution_graph || state.run?.provenance_graph; $('graph-view').replaceChildren(); $('graph-detail').hidden = true; $('graph-sources').replaceChildren();
    if (!validGraph(graph, state.runId)) { text('graph-note', '此记录尚无有效派生图。可在运行封存后加载完整证据；缺少的关联不会按事件邻近关系补造。'); return; }
    const all = graph.nodes, visible = all.slice(0, 160), positions = new Map(), kinds = [...new Set(visible.map(n => n.type || 'other'))];
    const rows = new Map(); const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const element = (tag, attrs, content) => { const node = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); if (content !== undefined) node.textContent = content; return node; };
    for (const node of visible) { const kind = node.type || 'other', row = rows.get(kind) || 0; rows.set(kind, row + 1); positions.set(node.id, { x: 20 + kinds.indexOf(kind) * 200, y: 20 + row * 76 }); }
    svg.setAttribute('width', String(Math.max(420, kinds.length * 200 + 20))); svg.setAttribute('height', String(Math.max(100, ...[...rows.values()].map(n => n * 76 + 20))));
    for (const edge of graph.edges) { const a = positions.get(edge.source), b = positions.get(edge.target); if (!a || !b) continue; const line = element('path', { d: `M ${a.x + 160} ${a.y + 24} C ${a.x + 180} ${a.y + 24},${b.x - 20} ${b.y + 24},${b.x} ${b.y + 24}`, class: 'tn-edge' }); line.append(element('title', {}, `${edge.source} → ${edge.target} · ${edge.type}`)); svg.append(line); }
    for (const node of visible) {
      const { x, y } = positions.get(node.id), group = element('g', { class: 'tn-node', tabindex: '0', role: 'button', 'aria-label': `${node.type}: ${node.label || node.id}` });
      group.append(element('rect', { x, y, width: 164, height: 50, rx: 7 }), element('text', { x: x + 9, y: y + 16, class: 'tn-kind' }, node.type), element('text', { x: x + 9, y: y + 35 }, String(node.label || node.id).slice(0, 21)), element('title', {}, String(node.label || node.id)));
      group.addEventListener('click', () => graphNode(node)); group.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); graphNode(node); } }); svg.append(group);
    }
    $('graph-view').append(svg);
    text('graph-note', `${graph.nodes.length} 节点 / ${graph.edges.length} 关系。${all.length > 160 ? '预览前 160 节点，下载保留全部。' : ''}点击节点查看参数与原事件引用。${(state.run.warnings || []).join(' ')}`);
  }
  function renderRun(run, id) {
    state.run = run; state.runId = id || run?.config?.run_id; state.replayLimit = Infinity;
    text('run-id', state.runId || '尚未选择实验');
    const result = run?.result, diagnostics = result?.diagnostics || {};
    text('run-status', !client.offline && state.status.active?.runId === state.runId ? statusLabel(state.status.active.state) : statusLabel(result?.status || run?.lifecycle?.status || 'unknown'));
    const transactions = result?.evidence?.transactions;
    const transactionStatus = Array.isArray(transactions) ? transactions.some(tx => tx.status === 'unknown') ? 'unknown' : transactions.some(tx => tx.status === 'pending') ? 'pending' : transactions.some(tx => tx.status === 'reverted') ? 'reverted' : transactions.length ? transactions.every(tx => tx.status === 'success') ? 'confirmed' : 'unknown' : run?.config?.taskId === 'balance' ? 'query_only' : 'not_submitted' : null;
    text('chain-outcome', statusLabel(diagnostics.chainExecutionStatus || run?.chainExecutionStatus || transactionStatus));
    text('task-outcome', statusLabel(result?.status));
    text('result-json', stringify({ config: run?.config, result: result ?? null, warnings: run?.warnings || [] }));
    $('assertions').replaceChildren();
    for (const row of result?.assertions || []) {
      const item = make('div', undefined, 'assertion' + (row.passed === false || row.pass === false ? ' fail' : ''));
      const values = make('div'); values.append(make('strong', row.label || row.name || row.id || '检查项'), make('small', `期望：${stringify(row.expected) ?? '未提供'} · 实际：${stringify(row.actual) ?? '未提供'}`)); item.append(make('span', row.passed === true || row.pass === true ? '✓' : row.passed === false || row.pass === false ? '×' : '?'), values); $('assertions').append(item);
    }
    renderEvents(); renderGraph(); updateControls();
  }
  async function openRun(id) {
    const generation = ++state.viewGeneration; const run = await client.request('/run?id=' + encodeURIComponent(id));
    if (client.offline || generation !== state.viewGeneration) return;
    state.bundle = null; renderRun(run, id);
  }
  async function loadEvidence() {
    if (state.bundle) return state.bundle;
    if (!state.runId) throw Error('请先选择实验。');
    const id = state.runId, generation = state.viewGeneration;
    const bundle = await client.request('/export?id=' + encodeURIComponent(id));
    const run = await readBundle(bundle);
    if (client.offline || generation !== state.viewGeneration || id !== state.runId) throw Error('实验选择已改变，请重新加载。');
    state.bundle = bundle; renderRun(run, id); return bundle;
  }
  function download(name, value, mime = 'application/json;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([typeof value === 'string' ? value : stringify(value)], { type: mime }));
    const anchor = make('a'); anchor.href = url; anchor.download = name.replace(/[^\w.\-\u3400-\u9fff]/g, '_'); document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function refreshHistory() {
    const result = await client.request('/runs'); if (client.offline) return;
    $('history').replaceChildren();
    for (const run of result.runs || []) {
      const id = run.run_id || run.runId || run.id, entry = make('div', undefined, 'history-entry'), label = make('div');
      label.append(make('code', id), make('small', `${run.taskId || run.config?.taskId || ''} · ${statusLabel(run.status || run.taskStatus || run.result?.status)}`));
      const button = make('button', '打开', 'button secondary small'); button.addEventListener('click', () => action(() => openRun(id), '正在打开实验…')); entry.append(label, button); $('history').append(entry);
    }
    if (!result.runs?.length) $('history').append(make('p', '尚无测试网实验记录。', 'field-note'));
  }
  async function refreshStatus() { const status = await client.request('/status'); if (!client.offline) renderStatus(status); return status; }
  async function poll() {
    if (client.offline || state.pending || state.pollBusy) return;
    state.pollBusy = true;
    try {
      const previous = state.status.active?.runId; const status = await refreshStatus();
      const id = status.active?.runId || previous;
      if (id && (!state.runId || state.runId === id)) await openRun(id);
      if (previous && !status.active) await refreshHistory();
    } catch (error) { if (!client.offline && error.name !== 'AbortError') notice('状态更新失败：' + error.message, true); }
    finally { state.pollBusy = false; }
  }
  async function bootstrap() {
    const result = await client.request('/bootstrap'); client.setToken(result.csrfToken);
    state.profiles = result.profiles || []; state.tasks = result.tasks || [];
    $('network').replaceChildren(); $('candidate-networks').replaceChildren();
    for (const profile of state.profiles) {
      if (profile.writeEnabled) { const option = make('option', `${profile.name} · ${profile.chainId}`); option.value = profile.id; $('network').append(option); }
      else { const row = make('div', undefined, 'candidate-row'); row.append(make('span', profile.name), make('span', `${profile.family} · 候选 / 专用适配，未开放`)); $('candidate-networks').append(row); }
    }
    const connectedProfileId = result.status?.environment?.profileId;
    if (state.profiles.some(p => p.id === connectedProfileId && p.writeEnabled)) $('network').value = connectedProfileId;
    else if (state.profiles.some(p => p.id === 'base-sepolia' && p.writeEnabled)) $('network').value = 'base-sepolia';
    profileChanged();
    $('task').replaceChildren();
    for (const task of state.tasks.filter(t => TASK_IDS.includes(t.id))) { const option = make('option', task.title); option.value = task.id; $('task').append(option); }
    taskChanged(); modeChanged(); renderStatus(result.status || {}); await refreshHistory();
    notice('可先不填私钥进行只读连接。选择环境与部署不会自动开始任务。');
    if (!state.timer) state.timer = setInterval(poll, 2500);
  }
  $('network').addEventListener('change', profileChanged);
  $('task').addEventListener('change', taskChanged); $('mode').addEventListener('change', modeChanged); $('deploy-consent').addEventListener('change', updateControls);
  $('connect-form').addEventListener('submit', e => { e.preventDefault(); action(async () => {
    const profile = currentProfile(); if (!profile?.writeEnabled) throw Error('请选择已开放的测试网预览环境。');
    const privateKey = $('private-key').value.trim(); $('private-key').value = '';
    const status = await client.request('/connect', { profileId: profile.id, rpcUrl: $('rpc-url').value.trim(), ...(privateKey ? { privateKey } : {}), ...($('account-address').value.trim() ? { accountAddress: $('account-address').value.trim() } : {}), ...($('recipient').value.trim() ? { recipient: $('recipient').value.trim() } : {}), confirmations: Number($('confirmations').value), receiptTimeoutMs: Number($('receipt-timeout').value) * 1000 });
    state.manifest = null; renderStatus(status); notice('连接已核验。写入前请显式部署或导入 Lab 合约清单。');
  }, '正在连接并校验 chainId…'); });
  $('disconnect').addEventListener('click', () => action(async () => { renderStatus(await client.request('/disconnect', {})); $('private-key').value = ''; state.manifest = null; text('manifest-view', '已断开。'); notice('测试网会话已断开，服务端内存签名凭据已清除。'); }));
  $('deploy').addEventListener('click', () => action(async () => {
    if (!$('deploy-consent').checked) throw Error('请先勾选本次显式部署选项。');
    $('deploy-consent').checked = false;
    const value = await client.request('/deploy', {}); state.manifest = value.manifest; text('manifest-view', stringify(value.manifest)); renderStatus(value.status || await client.request('/status')); notice('部署流程返回。请保存清单，并以回执和状态确认实际结果。');
  }, '正在部署 Lab 测试合约，请等待测试网确认…'));
  $('manifest-file').addEventListener('change', e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; action(async () => { const manifest = JSON.parse(await file.text()); renderStatus(await client.request('/attach', { manifest })); state.manifest = manifest; text('manifest-view', stringify(manifest)); notice('清单已通过服务端校验并接入。'); }, '正在校验部署清单…'); });
  $('manifest-export').addEventListener('click', () => action(async () => { const manifest = await client.request('/manifest'); state.manifest = manifest; text('manifest-view', stringify(manifest)); download('testnet-deployment-manifest.json', manifest); }));
  $('rebuild-input').addEventListener('click', () => action(async () => { const fields = formFields(), task = await client.request('/resolve', { taskId: fields.taskId, taskParameters: parameters(fields.taskId, fields) }); $('task-input').value = task.input || task.task?.input || ''; text('task-completion', task.completion || task.task?.completion); notice('已按人类可读金额重建任务输入。'); }));
  $('run-form').addEventListener('submit', e => { e.preventDefault(); action(async () => { const value = await client.request('/run', runPayload(formFields())); state.bundle = null; state.runId = value.runId; await refreshStatus(); await openRun(value.runId); notice('已创建测试网实验，原始事件会持续记录。'); }, '正在创建实验…'); });
  for (const name of ['pause', 'resume', 'cancel']) $(name + '-run').addEventListener('click', () => action(async () => { await client.request('/' + name, { id: state.runId }); await refreshStatus(); notice(name === 'cancel' ? '已请求停止后续操作；已广播交易仍需等待与对账。' : name === 'pause' ? '已请求在下一个安全检查点暂停。' : '已继续执行。'); }));
  $('recheck').addEventListener('click', () => action(async () => { await client.request('/recheck', { id: state.runId }); state.bundle = null; await openRun(state.runId); notice('已追加新的链上检查证据；未重新调用 Agent。'); }));
  $('reconcile').addEventListener('click', () => action(async () => { const result = await client.request('/reconcile', {}); renderStatus(result.status || await client.request('/status')); text('manifest-view', stringify(result)); notice('已读取已有交易的确认结果；未重发交易。部署未完成时，确认无未决交易后可再次显式部署以继续准备。'); }));
  $('verify').addEventListener('click', () => action(async () => { const result = await client.request('/verify', { id: state.runId }); text('event-detail', stringify(result)); notice('原始记录完整性校验结果已显示。哈希校验不等于来源真实性认证。'); }));
  $('check-offline').addEventListener('click', () => action(async () => { const result = await client.request('/check-offline', { id: state.runId }); state.bundle = null; await openRun(state.runId); text('event-detail', stringify(result)); notice('已在本机服务按封存证据重新检查任务；未请求链或模型。这与文件完整性校验和当前链上对账不同。'); }));
  $('event-filter').addEventListener('input', renderEvents);
  $('refresh').addEventListener('click', () => action(async () => { await refreshStatus(); if (state.runId) await openRun(state.runId); }));
  $('refresh-history').addEventListener('click', () => action(refreshHistory));
  $('load-evidence').addEventListener('click', () => action(async () => { await loadEvidence(); notice('完整实验包已加载并校验，可检查图、轨迹与原生响应。'); }));
  $('download-bundle').addEventListener('click', () => action(async () => download('web3-testnet-' + state.runId + '.json', state.bundle || await loadEvidence())));
  for (const button of document.querySelectorAll('[data-artifact]')) button.addEventListener('click', () => action(async () => { const bundle = state.bundle || await loadEvidence(), path = button.dataset.artifact; if (typeof bundle.files[path] !== 'string') throw Error('实验包没有此文件；未补造：' + path); download(state.runId + '-' + path.split('/').at(-1), bundle.files[path], path.endsWith('.csv') ? 'text/csv;charset=utf-8' : path.endsWith('.graphml') ? 'application/graphml+xml' : path.endsWith('.jsonl') ? 'application/x-ndjson' : 'application/json'); }));
  $('bundle-file').addEventListener('change', e => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    client.enterOffline(); state.viewGeneration++; clearInterval(state.timer); state.timer = null;
    state.bundle = null; renderRun(null, null); text('event-detail', '正在核验导入文件；未通过校验前不展示其事件。');
    action(async () => {
      if (file.size > 100 * 1024 * 1024) throw Error('实验包超过 100 MB，请先使用离线分析工具处理。');
      const bundle = JSON.parse(await file.text()), run = await readBundle(bundle);
      state.bundle = run.nativeBundle; renderRun(run, run.config.run_id);
      text('offline-note', '原始文件 SHA-256、字节数及事件引用已核验。' + (run.derivedVerified ? '派生图文件清单也已核验。' : '派生图未校验。') + ' 校验不等于可信来源认证。');
      notice('已进入离线回放；所有在线操作和轮询已停用。' + run.warnings.join(' '));
    });
  });
  $('leave-offline').addEventListener('click', () => { client.leaveOffline(); state.viewGeneration++; state.run = null; state.runId = null; state.bundle = null; state.replayLimit = Infinity; action(bootstrap, '正在恢复在线界面…'); });
  $('replay-start').addEventListener('click', () => { state.replayLimit = 0; renderEvents(); text('event-detail', '回放已回到起点，点击下一事件。'); });
  $('replay-step').addEventListener('click', () => { const total = state.run?.events?.length || 0; if (!Number.isFinite(state.replayLimit)) state.replayLimit = 0; state.replayLimit = Math.min(total, state.replayLimit + 1); renderEvents(); const event = shownEvents().at(-1); if (event) showEvent(event); });
  $('replay-all').addEventListener('click', () => { state.replayLimit = Infinity; renderEvents(); });
  window.addEventListener('pagehide', () => { client.enterOffline(); clearInterval(state.timer); $('private-key').value = ''; $('model-key').value = ''; });
  action(bootstrap);
})();
