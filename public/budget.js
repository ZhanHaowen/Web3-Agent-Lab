import {CASES,generateCase,previewConfig,formatAmount} from './budget-presets.js';
'use strict';
const $=id=>document.getElementById(id);let token='',scene=null,working=false,offline=false;
const names={idle:'尚未创建',initializing:'初始化中',payment:'等待支付',authorization:'等待第二条路径',redemption:'等待第三方兑现',check:'等待独立检查',completed:'已结束',error:'出现错误'};
const eventNames={'session.opened':'① 同一任务授权已建立','transaction.request':'请求正常支付','transaction.confirmed':'正常支付已确认','transaction.skipped':'跳过第一笔支付','permit.request':'② 请求签署支付许可','pay.request':'② 请求第二笔正常支付','permit.signed':'许可已签署，尚未转出资产','budget.rejected':'共同预算拒绝请求','relayer.submit':'③ 第三方提交兑现','relayer.confirmed':'第三方兑现已确认','checker.result':'④ 独立检查结束','experiment.error':'执行错误'};
const format=n=>{if(n==null)return '—';const v=BigInt(n),neg=v<0n,x=neg?-v:v;return (neg?'-':'')+(x/1000000n)+'.'+(x%1000000n).toString().padStart(6,'0').replace(/0+$/,'').padEnd(1,'0');};
function text(id,v){$(id).textContent=v??'—';}
function node(tag,content,cls){const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;}
function cfg(){return Object.fromEntries(['mode','initial','budget','payment','permit','secondPath'].map(k=>[k,$(k).value]));}
async function api(path,body){
 const r=await fetch('/api/budget'+path.slice(4),{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Budget-Token':token},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const b=await r.json();if(!r.ok)throw Error(b.error);return b;
}
function locked(){return working||(!offline&&scene&&!['completed','idle'].includes(scene.stage));}
function updatePreview(){
 const p=previewConfig(cfg());
 if(!p.valid){text('preview-class','请检查参数');text('preview-amounts',p.error);text('preview-behavior','');$('preview-class').className='fail';}
 else{text('preview-class',p.classification);$('preview-class').className=p.warning?'fail':'';text('preview-amounts','首笔之后剩余预算 '+p.remaining+'；计划合计 '+p.plannedTotal+'。');text('preview-behavior',p.behavior+' '+(p.expectedSpent!==null?'预计实际支出 '+p.expectedSpent+'，最终余额 '+p.expectedBalance+'。':''));}
 return p;
}
function available(){
 const isLocked=locked(),valid=previewConfig(cfg()).valid;
 for(const id of ['run','start'])$(id).disabled=isLocked||!valid;
 $('step').disabled=working||offline||!scene||['completed','error','idle'].includes(scene.stage);
 $('export').disabled=working||offline||!scene?.check;$('copy').disabled=working||offline||!scene?.check;
 for(const id of ['preset','mode','initial','budget','payment','permit','secondPath'])$(id).disabled=isLocked;
 $('delta').disabled=isLocked||$('preset').value==='custom'||$('preset').value==='boundary';
 $('apply-preset').disabled=isLocked||$('preset').value==='custom';
}
function render(){
 if(!scene)return;available();text('stage',(offline?'离线 · ':'')+(names[scene.stage]??scene.stage));
 text('execution-config',scene.config?'本次记录：预算 '+scene.config.budget+'，首笔 '+scene.config.payment+'，第二笔 '+scene.config.permit+'（'+(scene.config.secondPath==='permit'?'签名兑现':'正常交易')+'）；'+(scene.config.mode==='unified'?'统一预算':'分离计数'):'');
 text('identity',scene.id?'Execution '+scene.id+'\nSession '+scene.sessionId:'尚未创建');
 text('phase',({payment:'下一步：Agent 从正常入口支付。',authorization:'下一步：同一任务申请第二条路径的支出权限。',redemption:'签名已产生。下一步由独立第三方兑现。',check:'下一步：读取链上日志与余额进行独立检查。',completed:'执行已结束；预算合规与风险复现分别判定。',error:'执行中断：'+scene.error})[scene.stage]??'等待执行');
 const l=scene.ledger??{},c=scene.check,initial=scene.initial?.balance;
 const values=[['初始钱包余额',initial],['用户任务预算',l.limit],['正常入口计数',l.transactionSpent],['未兑现预算预留',l.reserved],['链上实际累计支出',c?.actualSpent],['当前 / 最终余额',scene.final?.balance??(initial!=null&&l.spent!=null?String(BigInt(initial)-BigInt(l.spent)):null)],['超过预算',c?.overspend],['实际流出与正常计数差',c?.accountingGap],['可用任务预算',l.remaining]];
 $('metrics').replaceChildren(...values.map(([label,v])=>{const d=node('div',undefined,'metric');d.append(node('span',label),node('strong',format(v)));return d;}));
 let verdict='独立检查尚未执行',cls='';
 if(c){verdict=c.reproduction?'已复现超支：预算检查未通过':scene.blocked?'已阻止超额请求：'+(c.status==='success'?'预算检查通过':'证据检查未通过'):c.status==='success'?'未超出任务预算 · 检查通过':'检查未通过';cls=c.status==='success'?'pass':'fail';}
 if(offline)verdict='离线记录回放 · 实际支出 '+format(c?.actualSpent)+'；完整检查请运行 CLI';text('verdict',verdict);$('verdict').className=cls;
 $('assertions').replaceChildren(...(c?.assertions??[]).map(a=>{
  if(a.id==='unified_commitments_within_budget'&&scene.config?.mode!=='unified')return node('p','— 统一预算承诺检查：当前分离计数模式不适用','not-applicable');
  const labels={balance_matches_outgoing_logs:'余额差与资产流出日志一致',all_outflows_have_success_receipts:'每笔资产流出都有成功回执',task_budget_not_exceeded:'实际支出没有超过任务预算',unified_commitments_within_budget:'统一预算包含未兑现承诺',fixed_chain:'固定本地链身份',raw_receipt_logs_match_derived_transfers:'原始回执日志与派生转账一致',single_execution_and_session:'所有动作属于同一执行与会话'};
  return node('p',(a.passed?'✓ ':'✗ ')+(labels[a.id]??a.id),a.passed?'pass':'fail');
 }));
 $('addresses').replaceChildren(...[['Agent 钱包',scene.owner],['第三方 spender',scene.spender],['收款账户',scene.recipient],['测试代币',scene.token],['官方 Permit2 本地部署',scene.permit2],['签名进程 PID',scene.signerPid]].map(([k,v])=>node('p',k+'：'+(v??'—'))));
 const signed=scene.events?.find(e=>e.type==='permit.signed');text('permit-detail',signed?JSON.stringify(signed.payload,null,2):scene.blocked?'请求已被拒绝，未产生许可':'尚未签名');
 $('events').replaceChildren(...(scene.events??[]).map(e=>{const d=node('div',undefined,'event');d.append(node('strong',eventNames[e.type]??e.type),node('p',new Date(e.time).toLocaleTimeString()+' · '+e.type));const detail=document.createElement('details');detail.append(node('summary','查看事件证据'),node('pre',JSON.stringify(e.payload,null,2)));d.append(detail);return d;}));
 $('transactions').replaceChildren(...(scene.transactions??[]).map(t=>{const b=node('button',t.action+' · '+t.status+'\n发送者 '+t.from+'\n'+t.hash,'tx');b.onclick=()=>text('detail',JSON.stringify(t,null,2));return b;}));
}
async function action(label,fn,id){
 if(working)return;working=true;offline=false;text('notice',label);available();if(id)$(id).classList.add('busy');
 try{await fn();text('notice','操作完成。'+(scene?.check?.reproduction?'已复现实际支出 '+format(scene.check.actualSpent)+'、正常入口计数 '+format(scene.check.normalTransactionCounter)+'。':'请查看执行阶段与检查结论。'));}
 catch(e){text('notice','操作未完成：'+e.message);}
 finally{working=false;if(id)$(id).classList.remove('busy');render();available();}
}
function categoryHelp(){
 const type=$('preset').value,entry=CASES.find(c=>c.id===type);text('case-help',entry?.description??'');
 text('generation-status',type==='custom'?'当前按自定义组合运行；不会自动替换你的金额。':'待生成：选择分类不修改金额。点击生成才应用规则；直接运行使用当前实际参数。');
 available();
}
$('preset').onchange=categoryHelp;
$('apply-preset').onclick=()=>{
 if(locked())return;
 try{const result=generateCase($('preset').value,cfg(),$('delta').value);for(const [k,v]of Object.entries(result))$(k).value=v;text('generation-status','已按当前参数生成。除“仅签名”会将首笔设为零外，初始余额、预算和首笔支出保持你的设置。');text('notice','对照参数已生成。请核对下方预览后运行。');updatePreview();available();}
 catch(e){text('generation-status','无法生成：'+e.message);text('notice','无法生成对照：'+e.message);}
};
for(const id of ['mode','initial','budget','payment','permit','secondPath'])$(id).addEventListener('input',()=>{
 $('preset').value='custom';categoryHelp();text('generation-status','参数已修改，当前按自定义组合判断。');updatePreview();available();
});
$('delta').addEventListener('input',()=>text('generation-status','偏移量已修改；点击生成按钮后才应用。'));
$('run').onclick=()=>action('正在运行真实链上对照实验…',async()=>{scene=await api('/api/run',{config:cfg()});},'run');
$('start').onclick=()=>action('正在部署实验资产并建立受限会话…',async()=>{scene=await api('/api/start',{config:cfg()});},'start');
$('step').onclick=()=>action('正在推进一个阶段…',async()=>{scene=await api('/api/step',{executionId:scene.id});},'step');
$('export').onclick=()=>{if(!scene?.check||offline)return;const a=document.createElement('a');a.href='/api/budget/export?download=1';a.download='budget-'+scene.id+'.json';a.click();text('notice','已请求下载；同一证据包已自动保存为 平台数据目录/budget/'+scene.id+'.json。也可点击查看 / 复制 JSON。');};
$('copy').onclick=async()=>{try{const b=await api('/api/export');$('json-text').value=JSON.stringify(b,null,2);$('json-view').hidden=false;$('json-text').select();try{await navigator.clipboard.writeText($('json-text').value);text('notice','完整 JSON 已复制，也已自动保存到平台数据目录的 budget 子目录。');}catch{text('notice','完整 JSON 已显示，按 Ctrl+C 复制；平台数据目录的 budget 子目录也有同一文件。');}}catch(e){text('notice',e.message);}};
$('open').onclick=()=>$('file').click();
$('file').onchange=async()=>{
 try{
  if(scene&&!['completed','idle'].includes(scene.stage)&&!offline)throw Error('先完成当前执行再离线打开');
  const f=$('file').files[0];if(!f)return;if(f.size>10*1024*1024)throw Error('文件超过 10MB');
  const b=JSON.parse(await f.text());if(b.format!=='web3-agent-budget-experiment'||b.version!==1)throw Error('证据包格式错误');
  const e=b.files?.['evidence.json'];if(!e)throw Error('缺少证据');
  const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(e)));const hash=[...new Uint8Array(h)].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==b.manifest?.['evidence.json'])throw Error('哈希不匹配');
  // Read-only browser replay. Full checker recomputation is provided by the CLI.
  const actual=e.transfers.filter(t=>t.from.toLowerCase()===e.owner.toLowerCase()).reduce((n,t)=>n+BigInt(t.value),0n),limit=BigInt(e.ledger.limit);
  scene={...e,id:e.executionId,stage:'completed',check:{actualSpent:String(actual),overspend:String(actual>limit?actual-limit:0n),accountingGap:String(actual-BigInt(e.ledger.transactionSpent)),status:actual<=limit?'success':'failed',reproduction:actual>limit&&e.config.secondPath==='permit',assertions:[]}};
  offline=true;$('json-view').hidden=true;$('json-text').value='';render();text('notice','只读离线回放，文件哈希通过；完整业务复查请使用随包 CLI。');
 }catch(e){text('notice','离线打开失败：'+e.message);}
};
setInterval(async()=>{if(offline)return;try{scene=await api('/api/state');render();}catch{}},700);
categoryHelp();updatePreview();
(async()=>{try{const h=await api('/api/health');token=h.csrfToken;text('health',h.version+' · 已连接');scene=await api('/api/state');render();available();}catch(e){text('notice',e.message);}})();
