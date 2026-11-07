'use strict';
(() => {
  const LOCAL_MODEL = 'qwen3-4b-instruct-2507-q8';
  const make = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
  function bind({ id, anchor, modelInput, urlInput, keyInput }) {
    const label = make('label', '模型后端', 'field model-backend-field');
    const select = make('select'); select.id = id + '-provider'; select.setAttribute('aria-label', '模型后端');
    for (const [value, title] of [['api', '远程 / 自管兼容 API'], ['local', '本地 Qwen3 4B · 无需 API Key']]) { const o = make('option', title); o.value = value; select.append(o); }
    label.append(select); anchor.prepend(label);
    const note = make('p', '', 'field-note model-backend-note'); label.after(note);
    const link = make('a', '配置与管理本地模型 ↗'); link.href = '/local-model.html'; link.target = '_blank'; link.rel = 'noopener';
    let apiModel = modelInput.value;
    function sync() {
      const local = select.value === 'local';
      if (local) { apiModel = modelInput.value; modelInput.value = LOCAL_MODEL; }
      else if (modelInput.readOnly) modelInput.value = apiModel;
      modelInput.readOnly = local;
      for (const input of [urlInput, keyInput]) { input.disabled = local; const row = input.closest('label'); if (row) row.hidden = local; }
      note.replaceChildren(document.createTextNode(local ? '本机推理与本地链。需先配置模型；实验开始时校验并自动启动，不可用时直接报错，不回退远程服务。' : '使用支持工具调用的 Chat Completions 接口。Key 不进入实验包；独立 worker 的 Key 会保存在本机 model-secret.json，请保护数据目录。'));
      if (local) { note.append(document.createTextNode(' '), link); }
    }
    select.addEventListener('change', sync); sync();
    return {
      get provider() { return select.value; },
      read(extra = {}) {
        const { apiKey: _key, baseUrl: _url, baseURL: _URL, ...settings } = extra;
        return select.value === 'local'
          ? { ...settings, provider: 'local', model: LOCAL_MODEL }
          : { ...settings, provider: 'api', baseUrl: urlInput.value.trim(), model: modelInput.value.trim(), apiKey: keyInput.value };
      },
      // Replays retain the recorded backend; never switch a historical local run to API.
      credentials(recordedModel) { return recordedModel?.provider === 'local' ? {} : { apiKey: keyInput.value }; }
    };
  }
  window.LabModelUI = { bind, LOCAL_MODEL };
})();
