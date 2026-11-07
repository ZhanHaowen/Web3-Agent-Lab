'use strict';
(() => {
  const make = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = String(text); if (cls) n.className = cls; return n; };
  const type = e => e.type || e.event_type || e.eventType || e.kind || '';
  const isModel = e => /^(model[._]|local[._]model[._]|inference[._])/.test(type(e));
  function collect({ bundle, events, runId } = {}) {
    const files = bundle?.files || {}, eventPath = typeof files['raw/events.jsonl'] === 'string' ? 'raw/events.jsonl' : typeof files['events.jsonl'] === 'string' ? 'events.jsonl' : null;
    const missing = [];
    if (eventPath) events = files[eventPath].split('\n').filter(Boolean).map((line, index) => { try { return JSON.parse(line); } catch { missing.push({ path: eventPath, line: index + 1, reason: 'invalid_json' }); return null; } }).filter(Boolean);
    const all = Array.isArray(events) ? events : [];
    const selected = all.filter(isModel), retained = {}, seen = new Set(), external = new Map();
    const bundlePath = path => typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..') && !/^[a-z][a-z0-9+.-]*:/i.test(path);
    function follow(value, reference = false, runtimeMetadata = false) {
      if (!value || typeof value !== 'object') return;
      if (runtimeMetadata && typeof value.path === 'string' && !bundlePath(value.path) && typeof value.sha256 === 'string') external.set(value.path, { path: value.path, sha256: value.sha256, status: 'external_fingerprint_not_embedded' });
      if (typeof value.path === 'string' && reference && !bundlePath(value.path) && !seen.has(value.path)) { seen.add(value.path); missing.push({ path: value.path, reason: 'unsafe_or_external_bundle_reference' }); }
      if (bundlePath(value.path) && (reference || typeof value.sha256 === 'string' || Object.hasOwn(files, value.path)) && !seen.has(value.path)) {
        const path = value.path; seen.add(path);
        if (typeof files[path] === 'string') { retained[path] = files[path]; try { follow(JSON.parse(files[path])); } catch {} }
        else missing.push({ path, reason: 'referenced_file_unavailable' });
      }
      for (const [key, v] of Object.entries(value)) if (v && typeof v === 'object') follow(v, /ref$/i.test(key) || /_ref$/.test(key), runtimeMetadata || key === 'localRuntime');
    }
    const entries = selected.map(event => {
      follow(event);
      const ref = event.payloadRef || event.payload_ref;
      let payload = event.payload ?? event.data;
      if (ref?.path && typeof files[ref.path] === 'string') { try { payload = JSON.parse(files[ref.path]); } catch { payload = { unavailable: 'invalid_payload_json', path: ref.path }; } }
      if (payload === undefined) payload = { unavailable: 'payload_not_collected_or_not_in_bundle' };
      return { event, payload };
    });
    if (eventPath) retained[eventPath] = files[eventPath];
    if (typeof files['manifest.json'] === 'string') retained['manifest.json'] = files['manifest.json'];
    return { format: 'web3-model-evidence-view', version: 1, runId: runId || bundle?.run_id || bundle?.scenarioId || bundle?.executionId || null,
      source: eventPath ? 'original_bundle_files' : 'event_view_only',
      note: '这是原生模型记录的索引与文件子集，非完整实验包。文件文本保持导出包原样；清单可能同时引用未包含的其他文件。缺失证据不补造。',
      events: entries, files: retained, missing, externalFingerprints: [...external.values()],
      coverage: { modelEvents: entries.length, hasRequest: selected.some(e => /request/.test(type(e))), hasResponse: selected.some(e => /response/.test(type(e))),
        recordedBodies: entries.filter(e => typeof e.payload?.body === 'string' || typeof e.payload?.rawText === 'string').length,
        partialBodies: entries.filter(e => e.payload?.bodyComplete === false).length }
    };
  }
  function download(name, value) { const a = make('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' })); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function mount({ host, getSource }) {
    host.classList.add('model-evidence');
    const title = make('h2', '模型原生请求与响应'), note = make('p', '保留实际接口请求、返回与错误，API 密钥等敏感信息已脱敏。原始记录与派生图分开；不采集模型未提供的内部思维。旧数据缺少原文时明确标记。', 'field-note hint');
    const actions = make('div', undefined, 'model-evidence-actions'), read = make('button', '读取原生记录', 'button secondary small'), save = make('button', '下载模型原生记录', 'button secondary small'); read.type = save.type = 'button';
    const status = make('p', '选择一次实验后读取。离线导入包只在当前浏览器中读取。', 'field-note hint'); status.setAttribute('role', 'status');
    const select = make('select'); select.setAttribute('aria-label', '模型原生事件'); select.hidden = true;
    const detail = make('pre', '尚未读取模型记录。', 'raw-json'); detail.hidden = true;
    const bodyBox = make('details'), bodyLabel = make('summary', '接口 body 原文（不重新格式化）'), bodyText = make('pre', '', 'raw-json'); bodyBox.hidden = true; bodyBox.append(bodyLabel, bodyText);
    let data;
    async function load() {
      data = collect(await getSource()); select.replaceChildren();
      for (const [i, item] of data.events.entries()) { const e = item.event; const option = make('option', `${e.seq ?? e.logicalClock ?? i + 1} · ${type(e)} · ${e.agentId ?? e.roleId ?? 'Agent'} · ${item.payload?.modelCallId ?? ''}`); option.value = String(i); select.append(option); }
      select.hidden = !data.events.length; detail.hidden = !data.events.length;
      status.textContent = `${data.events.length} 条模型事件；${data.coverage.recordedBodies} 条含接口原文；${data.coverage.partialBodies} 条 body 不完整；${data.missing.length} 项引用未包含。` + (data.externalFingerprints.length ? `${data.externalFingerprints.length} 项外部模型/运行时资产仅保存指纹，不内嵌权重，不计缺失。` : '') + (!data.events.length ? '脚本基线没有模型调用；旧记录也可能尚未采集。' : '') + (data.source === 'event_view_only' ? '当前仅有事件视图，原始文件不可用；请保留完整实验包。' : '原始文件文本按实验包保留；下载索引不能替代完整实验包。');
      show(); return data;
    }
    function show() { const item = data?.events[Number(select.value || 0)]; bodyBox.hidden = !item; if (item) { detail.textContent = JSON.stringify(item, null, 2); bodyText.textContent = typeof item.payload?.body === 'string' ? item.payload.body : typeof item.payload?.rawText === 'string' ? item.payload.rawText : '该事件未记录接口 body 原文（旧数据或非 HTTP 事件）；未从解析对象补造。'; } }
    async function act(button, fn) { const old = button.textContent; read.disabled = save.disabled = true; button.textContent = '读取中…'; try { await fn(); } catch (e) { status.textContent = '无法读取：' + e.message; } finally { button.textContent = old; read.disabled = save.disabled = false; } }
    read.onclick = () => act(read, load); save.onclick = () => act(save, async () => { const value = await load(); download(`model-native-${value.runId || 'imported'}.json`, value); }); select.onchange = show;
    actions.append(read, save); host.append(title, note, actions, status, select, bodyBox, detail);
    return { clear() { data = null; select.hidden = detail.hidden = bodyBox.hidden = true; status.textContent = '实验已切换，请重新读取本次原生记录。'; } };
  }
  window.LabModelEvidence = { collect, mount };
})();
