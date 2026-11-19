'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const text = (value) => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const stateName = (run) => String(typeof run?.state === 'string' ? run.state : run?.state?.state ?? run?.status ?? 'unknown');
  const activeStates = new Set(['starting', 'queued', 'running', 'pausing', 'pause_requested', 'paused', 'cancelling', 'cancel_requested']);
  const stateLabels = { starting: '正在启动', queued: '等待执行', running: '运行中', pausing: '等待暂停', pause_requested: '等待暂停', paused: '已暂停', cancelling: '正在停止', cancel_requested: '正在停止', completed: '已完成', succeeded: '已完成', success: '已完成', sealed: '已封存', failed: '执行失败', cancelled: '已停止', timeout: '超时', timed_out: '超时', unknown: '状态未知', error: '启动失败' };
  const resultLabels = { passed: '通过', failed: '未通过', cancelled: '已停止', unknown: '结果未知' };
  const fallbackScenarios = [
    { id: 'x402-offline', label: 'x402 本地签名与预算检查', description: '真实本地签名、预算与资产路由检查；不进行 HTTP 服务购买或链上结算。' },
    { id: 'deployment-probe', label: '公开网络部署探测（只读）', description: '核验网络、区块与预设合约代码；不发送公开链交易。' },
    { id: 'erc8004-fork', label: 'ERC-8004 身份注册（本地分叉）', description: '在独立 BSC 分叉中调用 SDK 注册身份并读取结果。' },
    { id: 'erc8183-fork', label: 'ERC-8183 未注资任务（本地分叉）', description: '创建并取消未注资任务；本版不执行付款、交付和退款。' },
  ];
  const data = {
    offline: new URLSearchParams(location.search).get('offline') === '1',
    token: null, ready: false, busy: false, run: null, bundle: null, capabilities: {},
    events: [], cursor: null, selectedEvent: null, poll: null, pollVersion: 0, controllers: new Set(), serial: 0, loading: false,
  };
  function notice(message, tone = '') { $('notice').textContent = message; $('notice').dataset.tone = tone; }
  function element(tag, content, className) { const e = document.createElement(tag); if (content != null) e.textContent = String(content); if (className) e.className = className; return e; }
  function empty(target, message) { target.replaceChildren(element('p', message, 'bnb-empty')); }
  function showError(error) { if (error?.name !== 'AbortError') notice(error?.message || String(error), 'error'); }
  function setOffline() {
    data.offline = true; data.serial += 1; data.pollVersion += 1; data.ready = false; data.busy = false;
    clearTimeout(data.poll); for (const controller of data.controllers) controller.abort(); data.controllers.clear();
    $('offline-banner').hidden = false; $('service-status').textContent = '离线只读';
    $('refresh').disabled = true; $('refresh-history').disabled = true; $('run-fields').disabled = true;
    empty($('history'), '离线模式不读取服务器档案。请导入已下载的实验包。');
    updateControls();
  }
  async function api(path, body) {
    if (data.offline) throw new Error('离线回放不会访问实验服务。');
    const controller = new AbortController(); data.controllers.add(controller);
    try {
      const headers = { Accept: 'application/json' };
      if (data.token) headers['x-bnb-sdk-token'] = data.token;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetch(`/api/bnb-sdk/${path}`, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
      const result = await response.json().catch(() => ({ error: `服务返回了无法解析的响应（${response.status}）` }));
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : result.error?.message || result.message || `请求失败（${response.status}）`);
      return result;
    } finally { data.controllers.delete(controller); }
  }
  function normalizeList(value, fallback = []) {
    if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? { id: item, label: item } : item);
    if (value && typeof value === 'object') return Object.entries(value).map(([id, item]) => ({ id, ...(typeof item === 'string' ? { label: item } : item) }));
    return fallback;
  }
  function configureCapabilities(capabilities) {
    data.capabilities = capabilities || {};
    $('capabilities').textContent = text(data.capabilities);
    const previous = $('scenario').value;
    $('scenario').replaceChildren(...normalizeList(data.capabilities.scenarios, fallbackScenarios).map((s) => new Option(s.label || s.name || s.id, s.id)));
    if ([...$('scenario').options].some((s) => s.value === previous)) $('scenario').value = previous;
    updateScenario();
  }
  function updateScenario() {
    const scenario = normalizeList(data.capabilities.scenarios, fallbackScenarios).find((s) => s.id === $('scenario').value) || {};
    $('scenario-note').textContent = scenario.description || fallbackScenarios.find((s) => s.id === scenario.id)?.description || '';
    const previous = $('network').value;
    let networks = normalizeList(data.capabilities.networks, [{ id: 'bsc-testnet', label: 'BSC 测试网 · chainId 97' }, { id: 'bsc-mainnet', label: 'BSC 主网 · 只读探测' }]);
    if (Array.isArray(scenario.networks)) networks = networks.filter((n) => scenario.networks.includes(n.id) || scenario.networks.includes(Number(n.chainId)));
    $('network').replaceChildren(...networks.map((n) => new Option(n.label || n.name || n.id, n.id)));
    if ([...$('network').options].some((n) => n.value === previous)) $('network').value = previous;
    const offlineSigning = $('scenario').value === 'x402-offline';
    $('rpc-preset').disabled = offlineSigning;
    $('fork-block').disabled = !$('scenario').value.endsWith('-fork');
    updateNetwork();
  }
  function updateNetwork() {
    const network = normalizeList(data.capabilities.networks).find((n) => String(n.id) === $('network').value);
    $('network-note').textContent = network?.description || ($('scenario').value.endsWith('-fork') ? '读取源网络并在本机创建独立分叉；交易只提交到该本地分叉。' : $('scenario').value === 'x402-offline' ? '使用该网络的官方资产配置验证签名，不进行网络结算。' : '仅调用只读 RPC，不创建或广播交易。');
  }
  function updateControls() {
    const state = stateName(data.run), active = activeStates.has(state), selected = Boolean(data.run?.id), online = data.ready && !data.offline;
    $('run-fields').disabled = !online || data.busy;
    $('pause').disabled = !online || !active || ['paused', 'cancelling', 'cancel_requested'].includes(state);
    $('resume').disabled = !online || state !== 'paused';
    $('cancel').disabled = !online || !active || ['cancelling', 'cancel_requested'].includes(state);
    $('check').disabled = !online || !selected || active;
    $('download-bundle').disabled = !selected || (!data.offline && active) || (data.offline && !data.bundle);
    for (const button of document.querySelectorAll('[data-artifact]')) button.disabled = !selected || (!data.offline && active) || (Boolean(data.bundle) && !findFile(data.bundle, button.dataset.artifact));
    for (const id of ['replay-start', 'replay-step', 'replay-all']) $(id).disabled = !data.events.length || (!data.offline && active);
  }
  function renderChecker(checker) {
    $('assertions').replaceChildren();
    if (!checker) { $('check-outcome').textContent = '尚未检查'; return; }
    const result = checker.passed ?? checker.pass ?? checker.ok;
    $('check-outcome').textContent = result === true ? '通过' : result === false ? '未通过' : resultLabels[checker.status] || checker.status || checker.verdict || '查看检查详情';
    const checks = checker.checks || checker.assertions || [];
    for (const check of Array.isArray(checks) ? checks : []) {
      const pass = check.passed ?? check.pass ?? check.ok ?? (check.status === 'passed' ? true : check.status === 'failed' ? false : undefined);
      const box = element('div', null, `bnb-check ${pass === true ? 'pass' : pass === false ? 'fail' : ''}`);
      box.append(element('strong', `${pass === true ? '通过' : pass === false ? '未通过' : '记录'} · ${check.label || check.name || check.id || check.description || '检查项'}`));
      if (check.message || check.reason || check.detail) box.append(element('span', text(check.message || check.reason || check.detail)));
      if (check.expected !== undefined || check.actual !== undefined) box.append(element('small', `预期：${text(check.expected)}；实际：${text(check.actual)}`));
      $('assertions').append(box);
    }
  }
  function renderRun(run, preserveCursor = false) {
    data.run = run;
    data.events = Array.isArray(run?.events) ? run.events : [];
    if (!preserveCursor) data.cursor = null;
    const state = stateName(run);
    $('run-id').textContent = run?.id || '尚未选择实验';
    $('run-status').textContent = stateLabels[state] || state;
    $('outcome').textContent = run?.summary?.status ? `${stateLabels[state] || state} · ${resultLabels[run.summary.status] || run.summary.status}` : stateLabels[state] || state;
    $('summary').textContent = text({ state: run?.state, summary: run?.summary, checker: run?.checker });
    const pause = run?.state?.pause ?? run?.state?.checkpoint ?? run?.pause;
    $('pause-detail').hidden = state !== 'paused';
    $('pause-detail').textContent = pause ? text(pause) : '执行已暂停；点击“继续当前操作”允许下一次操作。';
    renderChecker(run?.checker || run?.summary?.checker);
    renderEvents(); renderGraph(run?.graph); updateControls();
  }
  function eventId(event, index) { return event.id ?? event.eventId ?? event.event_id ?? event.seq ?? index; }
  function renderEvents() {
    const available = data.cursor === null ? data.events : data.events.slice(0, data.cursor);
    const filter = $('event-filter').value.toLowerCase().trim();
    const rows = available.map((event, index) => ({ event, index })).filter(({ event }) => !filter || JSON.stringify(event).toLowerCase().includes(filter));
    $('events').replaceChildren();
    $('event-count').textContent = `${available.length} / ${data.events.length} 个事件`;
    $('replay-position').textContent = data.cursor === null ? '显示完整已保存轨迹。' : `回放进度：${data.cursor} / ${data.events.length}。回放不会重新执行实验。`;
    if (!rows.length) empty($('events'), data.events.length ? '当前进度或筛选条件下没有事件。' : '尚无事件；开始实验或导入实验包。');
    for (const { event, index } of rows.slice(-1000)) {
      const button = element('button', null, 'bnb-event'); button.type = 'button';
      button.append(element('strong', `#${eventId(event, index)} · ${event.type || event.kind || event.event || 'event'}`));
      button.append(element('small', String(event.timestamp || event.at || event.time || event.operation || event.name || '')));
      button.addEventListener('click', () => selectEvent(event, button));
      $('events').append(button);
    }
    if (rows.length > 1000) $('events').prepend(element('p', '界面仅显示最近 1000 条匹配事件；导出文件保留全部记录。', 'field-note'));
    if (data.cursor !== null && data.cursor > 0) $('event-detail').textContent = text(data.events[data.cursor - 1]);
  }
  function selectEvent(event, button) {
    document.querySelectorAll('.bnb-event.selected').forEach((node) => node.classList.remove('selected'));
    button?.classList.add('selected'); data.selectedEvent = event; $('event-detail').textContent = text(event);
  }
  function svgElement(tag, attributes = {}, content) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (content != null) node.textContent = String(content);
    return node;
  }
  function selectable(node, label, handler) { node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', label); node.addEventListener('click', handler); node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } }); }
  function showGraphDetail(item, kind) {
    $('graph-detail').hidden = false; $('graph-detail').textContent = `${kind}\n${text(item)}`; $('source-links').replaceChildren();
    const refs = item.rawEventRefs || item.eventRefs || item.sourceEvents || item.sourceEventIds || item.eventIds || item.event_ids || (item.eventId ? [item.eventId] : []);
    for (const reference of Array.isArray(refs) ? refs : [refs]) {
      const ref = typeof reference === 'object' ? reference.eventId ?? reference.id ?? reference.seq : reference;
      if (ref == null) continue;
      const index = data.events.findIndex((event, i) => String(eventId(event, i)) === String(ref));
      if (index < 0) continue;
      const button = element('button', `原始事件 ${ref}`, 'button secondary small'); button.type = 'button';
      button.addEventListener('click', () => { selectEvent(data.events[index]); $('event-detail').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      $('source-links').append(button);
    }
  }
  function renderGraph(graph) {
    $('graph-view').replaceChildren(); $('relations').replaceChildren(); $('graph-detail').hidden = true; $('source-links').replaceChildren();
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph?.edges) ? graph.edges : Array.isArray(graph?.relations) ? graph.relations : [];
    if (!nodes.length) { empty($('graph-view'), '该记录尚无派生图数据。缺失的节点和关系不会由界面补造。'); $('graph-note').textContent = '只有已采集证据支持的关系才会显示。'; return; }
    const shown = nodes.slice(0, 240), kinds = [...new Set(shown.map((node) => String(node.type || node.kind || 'record')))];
    const counts = new Map(), positions = new Map();
    for (const node of shown) { const kind = String(node.type || node.kind || 'record'), row = counts.get(kind) || 0; counts.set(kind, row + 1); positions.set(String(node.id), { x: 25 + kinds.indexOf(kind) * 210, y: 30 + row * 76 }); }
    const width = Math.max(700, kinds.length * 210 + 50), height = Math.max(180, Math.max(...counts.values()) * 76 + 40);
    const svg = svgElement('svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': '已有证据关系图' });
    const defs = svgElement('defs'), marker = svgElement('marker', { id: 'bnb-edge-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
    marker.append(svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#aec8bc' })); defs.append(marker); svg.append(defs);
    for (const edge of edges) {
      const from = positions.get(String(edge.source?.id ?? edge.source ?? edge.from)), to = positions.get(String(edge.target?.id ?? edge.target ?? edge.to));
      if (!from || !to) continue;
      const x1 = from.x + 178, y1 = from.y + 25, x2 = to.x, y2 = to.y + 25;
      const path = `M ${x1} ${y1} C ${x1 + 35} ${y1}, ${x2 - 35} ${y2}, ${x2} ${y2}`;
      svg.append(svgElement('path', { d: path, class: 'edge', 'marker-end': 'url(#bnb-edge-arrow)' }));
      const hit = svgElement('path', { d: path, class: 'edge-hit' });
      selectable(hit, `关系 ${edge.type || edge.relation || edge.kind || ''}`, () => showGraphDetail(edge, '关系')); svg.append(hit);
    }
    for (const node of shown) {
      const position = positions.get(String(node.id)), group = svgElement('g', { class: 'node', transform: `translate(${position.x},${position.y})` });
      group.append(svgElement('rect', { width: 178, height: 52, rx: 7 }));
      const label = String(node.label || node.name || node.id || 'record');
      group.append(svgElement('text', { x: 10, y: 18, class: 'kind' }, String(node.type || node.kind || 'record').slice(0, 25)), svgElement('text', { x: 10, y: 37 }, label.length > 22 ? `${label.slice(0, 21)}…` : label), svgElement('title', {}, label));
      selectable(group, `节点 ${label}`, () => showGraphDetail(node, '节点')); svg.append(group);
    }
    $('graph-view').append(svg);
    for (const edge of edges.slice(0, 1000)) {
      const button = element('button', null, 'bnb-relation'); button.type = 'button';
      button.append(element('strong', edge.type || edge.relation || edge.kind || '关系'), element('small', `${edge.source?.id ?? edge.source ?? edge.from} → ${edge.target?.id ?? edge.target ?? edge.to}`));
      button.addEventListener('click', () => showGraphDetail(edge, '关系')); $('relations').append(button);
    }
    $('graph-note').textContent = `共 ${nodes.length} 个节点、${edges.length} 条关系。${nodes.length > 240 ? '界面展示前 240 个节点，导出保留全部。' : ''}图展示当前记录中的全部已有关系，离线逐条回放仅截断事件列表。`;
  }
  async function history() {
    const serial = data.serial, result = await api('runs');
    if (data.offline || serial !== data.serial) return;
    const runs = Array.isArray(result.runs) ? result.runs : [];
    data.busy = Boolean(result.active); $('history').replaceChildren();
    if (!runs.length) empty($('history'), '尚无独立 BNB SDK 实验。');
    for (const run of runs.slice(0, 150)) {
      const row = element('div', null, 'bnb-history-entry'), info = element('div');
      info.append(element('code', run.id), element('small', `${stateLabels[stateName(run)] || stateName(run)} · ${run.summary?.scenario || run.scenario || ''}`));
      const button = element('button', '查看', 'button secondary small'); button.type = 'button'; button.addEventListener('click', () => loadRun(run.id).catch(showError)); row.append(info, button); $('history').append(row);
    }
    updateControls();
  }
  async function loadRun(id, preserveCursor = false) {
    const serial = data.serial, run = await api(`run?id=${encodeURIComponent(id)}`);
    if (data.offline || serial !== data.serial) return;
    if (data.run?.id !== id) { data.bundle = null; $('event-detail').textContent = '点击事件查看参数、结果和原始引用。'; }
    renderRun({ ...run, id: run.id || id }, preserveCursor);
  }
  async function poll(version) {
    if (data.offline || version !== data.pollVersion) return;
    if (!data.loading) {
      data.loading = true;
      try { if (data.run && activeStates.has(stateName(data.run))) await loadRun(data.run.id, true); await history(); }
      catch (error) { showError(error); } finally { data.loading = false; }
    }
    if (!data.offline && version === data.pollVersion) data.poll = setTimeout(() => poll(version), 1800);
  }
  async function initialize() {
    if (data.offline) { setOffline(); notice('离线回放已启用。请导入此前下载的 BNB SDK 实验包。'); return; }
    const serial = data.serial, pollVersion = ++data.pollVersion;
    clearTimeout(data.poll);
    try {
      const health = await api('health'); if (data.offline || serial !== data.serial) return;
      data.token = health.csrfToken; data.busy = Boolean(health.busy);
      if (!data.token) throw new Error('服务没有返回实验令牌，请重启平台后刷新。');
      const capabilities = health.capabilities || await api('capabilities'); if (data.offline || serial !== data.serial) return;
      configureCapabilities(capabilities); data.ready = true; $('service-status').textContent = '服务已连接'; updateControls();
      notice('独立实验服务已就绪。选择场景后开始运行；现有平台入口保持独立。', 'success');
      await poll(pollVersion);
    } catch (error) { if (data.offline || serial !== data.serial) return; $('service-status').textContent = '未连接'; data.ready = false; updateControls(); showError(error); }
  }
  async function start(event) {
    event.preventDefault(); if (!data.ready || data.offline || data.busy) return;
    const timeoutSeconds = Number($('timeout').value), forkValue = $('fork-block').value.trim();
    const config = { scenario: $('scenario').value, network: $('network').value, rpcPreset: $('rpc-preset').value, timeoutSeconds, pauseBeforeOperations: $('pause-operations').checked };
    if (!Number.isSafeInteger(timeoutSeconds) || timeoutSeconds < 30 || timeoutSeconds > 600) return notice('运行超时需要填写 30–600 之间的整数。', 'error');
    if (forkValue && !$('fork-block').disabled) { const block = Number(forkValue); if (!Number.isSafeInteger(block) || block < 1) return notice('分叉区块需要填写正整数。', 'error'); config.forkBlock = block; }
    data.busy = true; updateControls(); notice('正在创建独立实验…');
    try { const result = await api('run', { config }); if (data.offline) return; data.bundle = null; await loadRun(result.id); notice(`实验 ${result.id} 已启动。`); await history(); }
    catch (error) { data.busy = false; updateControls(); showError(error); }
  }
  async function action(name) {
    if (!data.run || data.offline) return;
    const id = data.run.id;
    try { const result = await api(name, { id }); if (data.offline) return; if (name === 'check') { data.bundle = null; data.run.checker = result.checker || result; renderChecker(data.run.checker); } await loadRun(id, true); notice(({ pause: '已请求在下一操作前暂停。', resume: '已允许继续当前操作。', cancel: '已请求停止实验，正在保留已有证据。', check: '已根据保存的证据完成重新检查。' })[name]); }
    catch (error) { showError(error); }
  }
  function safeBundle(value) {
    if (!value || value.schema !== 'web3-bnb-sdk-bundle-v1' || typeof value.runId !== 'string' || !value.runId || !value.files || typeof value.files !== 'object' || Array.isArray(value.files)) throw new Error('不是支持的 BNB SDK 实验包（web3-bnb-sdk-bundle-v1）。');
    const entries = Object.entries(value.files); let total = 0;
    if (!entries.length || entries.length > 10000) throw new Error('实验包文件数无效或超过限制。');
    for (const [path, content] of entries) {
      if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some((part) => part === '..' || part === '.') || /^[a-z]:/i.test(path) || typeof content !== 'string') throw new Error('实验包包含无效文件路径或内容。');
      total += content.length; if (total > 100 * 1024 * 1024) throw new Error('实验包超过当前浏览器 100 MB 读取限制。');
    }
    return value;
  }
  function findFile(bundle, path) {
    if (!bundle?.files) return null;
    if (Object.hasOwn(bundle.files, path)) return { path, content: bundle.files[path] };
    const aliases = { 'derived/graph.json': ['derived/provenance-graph.json'], 'derived/graph.graphml': ['derived/provenance-graph.graphml'], 'derived/edges.csv': ['derived/relations.csv'], 'derived/checker.json': ['checker.json'] };
    for (const candidate of aliases[path] || []) if (Object.hasOwn(bundle.files, candidate)) return { path: candidate, content: bundle.files[candidate] };
    return null;
  }
  function jsonFile(bundle, path, fallback = null) { const file = findFile(bundle, path); if (!file) return fallback; try { return JSON.parse(file.content); } catch { throw new Error(`文件 ${file.path} 不是有效 JSON。`); } }
  function runFromBundle(bundle) {
    const summary = jsonFile(bundle, 'summary.json', {}), state = bundle.state || jsonFile(bundle, 'state.json', summary.state || 'sealed');
    const file = findFile(bundle, 'raw/events.jsonl');
    const events = file ? file.content.split(/\r?\n/).filter((line) => line.trim()).map((line, i) => { try { return JSON.parse(line); } catch { throw new Error(`原始事件第 ${i + 1} 行不是有效 JSON。`); } }) : [];
    const resolved = events.map((event) => {
      const reference = typeof event.payloadRef === 'string' ? event.payloadRef : event.payloadRef?.path;
      if (!reference || !Object.hasOwn(bundle.files, reference)) return event;
      try { return { ...event, payload: JSON.parse(bundle.files[reference]) }; } catch { return event; }
    });
    return { id: bundle.runId, state, summary, checker: jsonFile(bundle, 'derived/checker.json'), events: resolved, graph: jsonFile(bundle, 'derived/graph.json') };
  }
  async function importBundle(file) {
    if (!file) return;
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error('实验包超过当前浏览器 100 MB 读取限制。');
      const bundle = safeBundle(JSON.parse(await file.text())), run = runFromBundle(bundle);
      setOffline(); data.bundle = bundle; renderRun(run); notice(`已离线打开 ${bundle.runId}，全部在线请求已停止。`, 'success');
    } catch (error) { showError(error); } finally { $('bundle-file').value = ''; }
  }
  async function getBundle() {
    if (data.bundle) return data.bundle;
    if (!data.run) throw new Error('请先选择实验。');
    const id = data.run.id, result = safeBundle(await api(`export?id=${encodeURIComponent(id)}`));
    if (data.offline) throw new Error('页面已切换到离线模式，请使用当前导入的实验包。');
    if (data.run?.id !== id) throw new Error('所选实验已变化，请重新下载。');
    data.bundle = result; updateControls(); return result;
  }
  function download(name, content, mime = 'application/json') {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name.replace(/[^\w.\-\u4e00-\u9fff]/g, '_'); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportArtifact(path) {
    try { const bundle = await getBundle(), file = findFile(bundle, path); if (!file) throw new Error(`记录中缺少 ${path}；不会生成替代证据。`); download(`${bundle.runId}-${file.path.split('/').pop()}`, file.content, path.endsWith('.csv') ? 'text/csv' : path.endsWith('.graphml') ? 'application/graphml+xml' : path.endsWith('.jsonl') ? 'application/x-ndjson' : 'application/json'); }
    catch (error) { showError(error); }
  }
  $('run-form').addEventListener('submit', start);
  $('scenario').addEventListener('change', updateScenario); $('network').addEventListener('change', updateNetwork);
  $('event-filter').addEventListener('input', renderEvents);
  $('refresh').addEventListener('click', () => initialize()); $('refresh-history').addEventListener('click', () => history().catch(showError));
  for (const name of ['pause', 'resume', 'cancel', 'check']) $(name).addEventListener('click', () => action(name));
  $('bundle-file').addEventListener('change', (event) => importBundle(event.target.files[0]));
  $('replay-start').addEventListener('click', () => { data.cursor = 0; $('event-detail').textContent = '回放已回到起点，点击下一事件继续。'; renderEvents(); });
  $('replay-step').addEventListener('click', () => { data.cursor = Math.min(data.events.length, (data.cursor ?? 0) + 1); renderEvents(); });
  $('replay-all').addEventListener('click', () => { data.cursor = null; renderEvents(); });
  $('download-bundle').addEventListener('click', async () => { try { const bundle = await getBundle(); download(`${bundle.runId}-bnb-sdk.json`, JSON.stringify(bundle, null, 2)); } catch (error) { showError(error); } });
  for (const button of document.querySelectorAll('[data-artifact]')) button.addEventListener('click', () => exportArtifact(button.dataset.artifact));
  window.addEventListener('pagehide', () => { clearTimeout(data.poll); for (const controller of data.controllers) controller.abort(); });
  initialize();
})();
