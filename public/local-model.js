'use strict';
const $ = id => document.getElementById(id); let csrf = '', status = null, busy = false, initialized = false;
async function api(path, body) {
  const r = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Lab-Token': csrf }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const value = await r.json(); if (!r.ok || value.ok === false) throw Error(typeof value.error === 'string' ? value.error : value.error?.message || value.message || 'HTTP ' + r.status); return value;
}
function render(s, fill = false) {
  status = s; const running = Boolean(s.running), ready = Boolean(s.ready);
  $('state').textContent = ready ? '模型已就绪' : running ? '进程运行中，等待就绪' : s.error ? '未就绪 · 查看错误' : '模型未启动';
  $('endpoint').textContent = s.baseURL || s.baseUrl || '127.0.0.1 · 未启动';
  $('status-note').textContent = s.error ? (typeof s.error === 'string' ? s.error : JSON.stringify(s.error)) : ready ? '可以在实验页面选择本地后端。任务是否完成仍由独立检查器判定。' : '保存配置后启动。首次校验大文件可能需要一些时间。';
  $('detail').textContent = JSON.stringify(s, null, 2);
  $('save').disabled = busy || running; $('start').disabled = busy || running; $('stop').disabled = busy || !running; $('refresh').disabled = busy;
  if (fill && s.config) {
    const fields = { modelPath: 'model-path', serverPath: 'server-path', modelSha256: 'model-sha', serverSha256: 'server-sha', contextSize: 'context-size', maxOutputTokens: 'max-output', threads: 'threads', gpuLayers: 'gpu-layers', port: 'port', templatePath: 'template-path', templateSha256: 'template-sha' };
    for (const [name, id] of Object.entries(fields)) if (s.config[name] != null) $(id).value = s.config[name];
    if (s.config.serverSha256) $('pin-runtime').checked = false;
    $('server-sha').disabled = $('pin-runtime').checked;
  }
}
async function refresh(fill = false) { render(await api('/api/local-model/status'), fill); }
async function action(button, label, fn) {
  if (busy) return; busy = true; const old = button.textContent; button.textContent = label; $('notice').textContent = label; if (status) render(status);
  try { await fn(); $('notice').textContent = '操作已完成。'; } catch (e) { $('notice').textContent = '操作未完成：' + e.message; }
  finally { busy = false; button.textContent = old; try { await refresh(); } catch {} if (status) render(status); }
}
$('config-form').onsubmit = e => { e.preventDefault(); action($('save'), '正在校验本机文件…', async () => {
  const body = { modelPath: $('model-path').value.trim(), serverPath: $('server-path').value.trim(), modelSha256: $('model-sha').value.trim(), pinRuntime: $('pin-runtime').checked, contextSize: Number($('context-size').value), maxOutputTokens: Number($('max-output').value), threads: Number($('threads').value), gpuLayers: $('gpu-layers').value.trim(), port: Number($('port').value) };
  if (!$('pin-runtime').checked && $('server-sha').value.trim()) body.serverSha256 = $('server-sha').value.trim();
  if ($('template-path').value.trim()) { body.templatePath = $('template-path').value.trim(); body.templateSha256 = $('template-sha').value.trim(); }
  await api('/api/local-model/configure', body); await refresh(true);
}); };
$('start').onclick = () => action($('start'), '正在校验并加载模型…', () => api('/api/local-model/start', {}));
$('stop').onclick = () => action($('stop'), '正在停止本机推理进程…', () => api('/api/local-model/stop', {}));
$('refresh').onclick = () => action($('refresh'), '正在刷新…', () => refresh(!initialized));
$('pin-runtime').onchange = () => { $('server-sha').disabled = $('pin-runtime').checked; };
$('pin-runtime').onchange();
(async () => { try { const h = await api('/api/health'); csrf = h.csrfToken; $('health').textContent = (h.version?.displayVersion || 'V0.16.0') + ' · 已连接'; await refresh(true); initialized = true; $('notice').textContent = '本地模型管理已连接。'; } catch (e) { $('notice').textContent = '无法连接：' + e.message; } })();
