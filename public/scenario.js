'use strict';
const $=id=>document.getElementById(id);let csrf='',scene=null,offline=false,bundle=null,loading=false,graphScene=null,elapsedClock=null;
const txt=(node,value)=>node.textContent=value==null?'—':String(value);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)txt(n,text);if(cls)n.className=cls;return n;}
function notify(message){txt($('notice'),message);}
async function api(path,body){const r=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Lab-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const j=await r.json();if(!r.ok)throw Error(j.error||`HTTP ${r.status}`);return j;}
function model(role){return{baseUrl:$(role+'-url').value.trim(),model:$(role+'-model').value.trim(),apiKey:$(role+'-key').value,systemPrompt:$(role+'-prompt').value,temperature:0};}
function spec(){return{template:'peer_swap',mode:$('mode').value,experimentMode:$('experiment').value,expectedOutcome:$('expected').value,ttl:Number($('ttl').value),maxSteps:Number($('max-steps').value),manual:$('manual').checked,automine:$('automine').checked,pauseBeforeTool:$('pause-tool').checked,pauseBeforeTransaction:$('pause-tx').checked,
agents:[{goal:{sellAmount:$('maker-sell').value,minBuy:$('maker-min').value},model:model('maker')},{goal:{minReceive:$('taker-min').value,maxPay:$('taker-max').value},model:model('taker')}]};}
async function action(fn,button=null,pendingLabel='处理中…'){
  if(button?.dataset.busy==='true')return;
  const original=button?.textContent;
  if(button){button.dataset.busy='true';button.classList.add('is-busy');button.disabled=true;button.setAttribute('aria-busy','true');txt(button,pendingLabel);notify(pendingLabel);updateAvailability();}
  try{await fn();if(button&&$('notice').textContent===pendingLabel)notify('操作已完成。');}
  catch(e){notify('操作未完成：'+e.message);}
  finally{if(button){delete button.dataset.busy;button.classList.remove('is-busy');button.removeAttribute('aria-busy');button.disabled=false;txt(button,original);updateAvailability();}}
}
const activeStates=['initializing','running','paused','pending','pending_reconciliation'];
function updateAvailability(){
  const live=!!scene&&!offline&&!scene.archived,active=live&&activeStates.includes(scene.state),pending=scene?.transactions?.some(t=>['pending','unknown','broadcasting'].includes(t.state));
  const setupBusy=['start','init','rerun'].some(id=>$(id)?.dataset.busy==='true');
  const enabled={start:!active&&!setupBusy,init:!active&&!setupBusy,step:live&&['running','pending'].includes(scene.state)&&!scene.stepInProgress,
    pause:live&&['running','pending'].includes(scene.state),resume:live&&(scene.state==='paused'||scene.pausedAgents?.length>0),stop:active,
    mine:active&&(!scene.stepInProgress||scene.state==='paused'),cancel:live&&scene.order?.state==1&&!pending&&!scene.stepInProgress,
    expire:live&&scene.order?.state==1&&!pending&&!scene.stepInProgress,rerun:!!scene&&!offline&&!active&&!setupBusy,export:!!scene,'graph-export':!!scene};
  for(const [id,available]of Object.entries(enabled)){const b=$(id);if(b)b.disabled=b.dataset.busy==='true'||!available;}
  for(const b of document.querySelectorAll('.pause-agent,.resume-agent'))b.disabled=b.dataset.busy==='true'||!active;
}
function updateElapsed(){
  if(!$('elapsed'))return;if(!elapsedClock){txt($('elapsed'),'—');return;}
  const ms=elapsedClock.ms+(elapsedClock.running?performance.now()-elapsedClock.receivedAt:0);
  txt($('elapsed'),ms<60000?`${(ms/1000).toFixed(1)} s`:`${Math.floor(ms/60000)} 分 ${Math.floor(ms/1000)%60} 秒`);
}
function bind(id,label,fn){const b=$(id);b.onclick=()=>action(fn,b,label);}
function amount(n){if(n==null)return '—';const v=BigInt(n);return`${v/1000000n}.${(v%1000000n).toString().padStart(6,'0')}`.replace(/\.?0+$/,'');}
function showDetail(value){txt($('detail'),JSON.stringify(value,null,2));}
const states={draft:'待启动',initializing:'初始化中',running:'运行中',paused:'暂停',pending:'待确认',pending_reconciliation:'停止后待对账',completed:'已结束',error:'基础设施错误',interrupted:'进程中断 · 只读档案'};
function render(){if(!scene)return;txt($('state'),states[scene.state]||scene.state);txt($('identity'),`${offline?'离线回放 · ':''}${scene.id} / episode ${scene.episodeId} / 步数 ${scene.steps}`);
  updateAvailability();$('pause-detail').hidden=!scene.paused;txt($('pause-detail'),JSON.stringify(scene.paused,null,2));
  if(Number.isFinite(scene.elapsedMs))elapsedClock={id:scene.id,ms:scene.elapsedMs,receivedAt:performance.now(),running:!offline&&!scene.archived&&!!scene.startedAt&&!scene.endedAt&&activeStates.includes(scene.state)};else elapsedClock=null;
  updateElapsed();txt($('metric-models'),(scene.agents??[]).reduce((n,a)=>n+(a.costs?.modelCalls??0),0));txt($('metric-tools'),(scene.agents??[]).reduce((n,a)=>n+(a.costs?.toolCalls??0),0));txt($('metric-transactions'),scene.transactions?.length??0);
  const stages={need_inquiry:'需要发送询价',awaiting_inquiry_or_quote:'等待询价或发送报价',awaiting_peer_acceptance:'等待对方接受报价',need_quote_decision:'需要接受、还价或拒绝',maker_prepare_order:'已达成协议，准备授权和创建订单',awaiting_order:'等待 Maker 创建订单',order_open:'订单已创建，核对条款并成交',awaiting_chain_confirmation:'等待链上确认或对账'};
  txt($('phase-status'),scene.state==='completed'?'实验已结束；请查看下方结论。':Object.entries(scene.progress??{}).map(([id,p])=>`${id==='maker'?'Maker':'Taker'}：${stages[p.stage]??p.stage}`).join('；')||'等待场景准备。');
  $('agent-status').replaceChildren();for(const a of scene.agents??[]){const box=el('div');box.append(el('h3',a.agentId),el('p',a.address,'mono'),el('p',`模型调用 ${a.costs?.modelCalls??0} · 工具 ${a.costs?.toolCalls??0} · Token ${a.costs?.usageComplete===false?'不完整':a.costs?.totalTokens??0}`),el('p',`Gas 成本 ${a.gasUsedWei??'未知'} wei`));const lastError=scene.progress?.[a.agentId]?.lastToolError;if(lastError)box.append(el('p',`最近未成功的操作：${lastError.tool??'模型'} · ${lastError.error}`,'fail'));$('agent-status').append(box);}
  $('assets').replaceChildren();for(const role of ['maker','taker','escrow']){const tr=el('tr'),b=role==='escrow'?scene.before?.escrow:scene.before?.assets?.[role],a=role==='escrow'?scene.after?.escrow:scene.after?.assets?.[role];
    for(const v of [role,amount(b?.A),amount(a?.A),amount(b?.B),amount(a?.B),b?.address??scene.before?.exchange??'—'])tr.append(el('td',v));$('assets').append(tr);}
  const check=scene.check;$('verdict').replaceChildren();if(check){$('verdict').append(el('h3',`${check.status} · ${check.business_outcome}`,check.status==='success'?'pass':'fail'),el('p',`结算：${check.settlement_status}；证据：${check.evidence_completeness}`),el('p',`目标：Maker ${check.agent_goal_results?.maker} / Taker ${check.agent_goal_results?.taker}`));
    if(scene.error){const reasons={MODEL_BUDGET_EXCEEDED:'模型调用或 Token 已达预算上限；请查看最后的协商阶段与错误。',SCENARIO_STOPPED:'用户已停止实验；已广播交易仍需确认或对账。'};$('verdict').append(el('p',`停止原因：${reasons[scene.error]??scene.error}`,'fail'));}
    const d=el('details');d.append(el('summary','逐项检查依据'));for(const a of check.assertions??[])d.append(el('p',`${a.passed?'✓':'✗'} ${a.id}：期望 ${JSON.stringify(a.expected)} / 实际 ${JSON.stringify(a.actual)}`,a.passed?'pass':'fail'));$('verdict').append(d);
  }else txt($('verdict'),scene.error||'运行结束或对账后生成独立结论');
  $('messages').replaceChildren();for(const m of scene.messages??[]){const box=el('div',undefined,'message');box.dataset.sender=m.senderAgentId;box.append(el('strong',`${m.senderAgentId} → ${m.recipientAgentId} · ${m.kind}`),el('p',JSON.stringify(m.visiblePayload??m.payload)));box.onclick=()=>showDetail(m);$('messages').append(box);}
  txt($('order'),JSON.stringify({quote:scene.quote,orderId:scene.orderId,order:scene.order},null,2));$('transactions').replaceChildren();for(const t of scene.transactions??[]){const box=el('div',`${t.actorId} · ${t.functionName} · ${t.state}\n${t.hash??'哈希未知，先对账'}`,'tx mono');box.onclick=()=>showDetail(t);$('transactions').append(box);}
  if(scene.state==='completed'&&graphScene!==scene.id){graphScene=scene.id;action(drawGraph);}
}
async function load(id){scene=await api('/api/scenarios/'+id);offline=false;bundle=null;render();}
async function currentBundle(){if(bundle)return bundle;if(!scene)throw Error('请先打开一个场景');bundle=await api(`/api/scenarios/${scene.id}/export`);return bundle;}
function download(name,data){const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
async function drawGraph(){const b=await currentBundle(),g=JSON.parse(b.files['derived/graph.json']),filter=$('filter').value;
  const nodes=g.nodes.filter(n=>filter==='all'||(n.agentId??'scene')===filter);const positions=new Map(),svg=svgEl('svg',{width:1050,height:Math.max(430,nodes.length*38+50)});
  for(const [i,n]of nodes.entries()){const x=n.agentId==='maker'?30:n.agentId==='taker'?700:365,y=30+i*38;positions.set(n.id,{x,y});}
  for(const edge of g.edges){const a=positions.get(edge.from),z=positions.get(edge.to);if(a&&z)svg.append(svgEl('line',{x1:a.x+150,y1:a.y+14,x2:z.x+150,y2:z.y+14,stroke:'#c2d2dc','stroke-width':1}));}
  for(const n of nodes){const {x,y}=positions.get(n.id),rect=svgEl('rect',{x,y,width:300,height:28,rx:5,fill:n.agentId==='maker'?'#d8efeb':n.agentId==='taker'?'#e2e7f6':'#e8eef1'}),label=svgEl('text',{x:x+8,y:y+18});label.textContent=n.label;
    rect.onclick=()=>{const events=b.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse),e=events.find(e=>e.eventId===n.eventRef);showDetail({event:e,payload:e?JSON.parse(b.files[e.payloadRef.path]):null});};svg.append(rect,label);}
  $('graph').replaceChildren(svg);
}
async function control(name,body={}){if(offline)throw Error('离线回放禁止执行');if(!scene)throw Error('请先创建场景');if(scene.archived&&name!=='rerun')throw Error('历史场景只读；可从初态创建新运行');const r=await api(`/api/scenarios/${scene.id}/${name}`,body);if(r.id)scene=r;bundle=null;render();}
bind('start','正在初始化并启动…',async()=>{scene=await api('/api/scenarios',spec());offline=false;bundle=null;graphScene=null;scene=await api(`/api/scenarios/${scene.id}/start`,{});render();notify('实验已启动，右侧将持续更新进度与耗时。');});
bind('init','正在初始化实验链…',async()=>{await api('/api/environment/init',{});notify('本地实验链已初始化。');});
const actionLabels={step:'正在执行单步…',pause:'正在暂停…',stop:'正在停止并对账…',cancel:'正在取消并退款…',expire:'正在清退过期订单…'};
for(const name of ['step','pause','stop','cancel','expire'])bind(name,actionLabels[name],()=>control(name));
bind('resume','正在继续…',()=>control('resume',{manual:$('manual').checked}));
bind('mine','正在出块并对账…',()=>control('mine',{blocks:Number($('blocks').value),seconds:Number($('seconds').value)}));
document.querySelectorAll('.pause-agent').forEach(b=>b.onclick=()=>action(()=>control('pause',{agentId:b.dataset.agent}),b,'正在暂停…'));
document.querySelectorAll('.resume-agent').forEach(b=>b.onclick=()=>action(()=>control('resume',{agentId:b.dataset.agent}),b,'正在恢复…'));
bind('rerun','正在创建新实验…',async()=>{await control('rerun',{agents:[{model:{apiKey:$('maker-key').value}},{model:{apiKey:$('taker-key').value}}]});scene=await api(`/api/scenarios/${scene.id}/start`,{});render();notify('已从共同初态启动新实验。');});
bind('export','正在导出场景包…',async()=>{if(!scene)throw Error('请先打开场景');download(`web3-scenario-${scene.id}.json`,await currentBundle());});
bind('graph-export','正在导出完整图…',async()=>{const b=await currentBundle();download(`web3-scenario-graph-${scene.id}.json`,b.files['derived/graph.json']);});
$('filter').onchange=()=>action(drawGraph);
bind('import','正在选择场景包…',()=>{$('file').click();notify('请选择本地场景 JSON，读取时不会调用模型或链。');});
$('file').onchange=()=>action(async()=>{const file=$('file').files[0];if(!file)return;if(file.size>100*1024*1024)throw Error('场景包超过 100MB');const b=JSON.parse(await file.text());if(b.format!=='web3-agent-scenario'||b.version!==2)throw Error('此处只读场景 schema v2；V0.13 单 Agent 包请到原实验档案打开');
  const manifest=JSON.parse(b.files['manifest.json']);for(const [path,entry]of Object.entries(manifest.files)){const bytes=new TextEncoder().encode(b.files[path]??''),digest=await crypto.subtle.digest('SHA-256',bytes);const actual=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');if(actual!==entry.sha256||bytes.length!==entry.bytes)throw Error('完整性校验失败：'+path);}
  const spec=JSON.parse(b.files['scenario.json']),events=b.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse),payload=e=>JSON.parse(b.files[e.payloadRef.path]);
  const created=events.find(e=>e.type==='scenario.created'),initial=events.find(e=>e.type==='environment.initial');
  scene={id:b.scenarioId,episodeId:b.episodeId,state:'completed',spec,steps:events.filter(e=>e.type==='scheduler.step').length,
    before:JSON.parse(b.files['environment/initial.json']),after:JSON.parse(b.files['environment/final.json']),check:JSON.parse(b.files['labels/checker-peer-1.0.json']),
    ...(()=>{const t=JSON.parse(b.files['derived/execution-trace.json']);return{transactions:t.transactions,messages:t.messages,elapsedMs:t.timing?.elapsedMs,startedAt:t.timing?.startedAt,endedAt:t.timing?.endedAt};})(),agents:[]};
  for(const id of ['maker','taker']){const config=spec.agents.find(a=>a.agentId===id);scene.agents.push({agentId:id,address:scene.before?.assets?.[id]?.address,costs:{usageComplete:false}});}
  const evidence=events.filter(e=>e.type==='check.evidence').at(-1);if(evidence){const e=payload(evidence);scene.order=e.order;scene.quote=e.quote;}
  bundle=b;offline=true;render();await drawGraph();notify('已在浏览器本地验证文件哈希并回放；没有调用模型或链。哈希不证明采集者身份。');});
bind('refresh-archive','正在读取档案…',async()=>{const list=await api('/api/scenarios');$('archive').replaceChildren();for(const s of list.filter(s=>s.template!=='service_purchase').reverse()){const item=el('div',`${s.id} · ${states[s.state]??s.state} · ${s.check?.status??'未判定'}`,'archive-entry mono');item.onclick=()=>action(()=>load(s.id));$('archive').append(item);}});
setInterval(()=>{if(scene&&!offline&&!loading){loading=true;api('/api/scenarios/'+scene.id).then(s=>{scene=s;bundle=null;render();}).catch(e=>notify(e.message)).finally(()=>loading=false);}},1200);
setInterval(updateElapsed,100);
updateAvailability();
action(async()=>{const h=await api('/api/health');csrf=h.csrfToken;txt($('health'),`${h.version?.displayVersion??'V0.15'} · 已连接`);$('refresh-archive').click();});
