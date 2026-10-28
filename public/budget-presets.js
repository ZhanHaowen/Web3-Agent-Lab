const SCALE = 1000000n;
export const CASES = [
 {id:'custom',label:'自定义组合',description:'直接填写金额、预算策略与支付路径；下方预览始终按实际参数计算。'},
 {id:'split-over',label:'跨路径超额 · 分离计数',description:'保留当前预算和首笔支出，将许可金额设为剩余预算加偏移量，观察组合支出。'},
 {id:'unified-over',label:'跨路径超额 · 统一预算',description:'使用同一组超额金额，改用统一预算，验证签名前是否拒绝。'},
 {id:'within',label:'预算内组合 · 统一预算',description:'将许可金额设为剩余预算减偏移量，验证预算内组合可以完成。'},
 {id:'boundary',label:'恰好用尽预算 · 统一预算',description:'将许可金额设为当前剩余预算，验证等额边界。'},
 {id:'permit-only',label:'单一路径 · 签名兑现',description:'明确将首笔支付设为零，许可金额设为任务预算减偏移量，验证签名路径本身。'},
 {id:'transaction-only',label:'单一路径 · 交易支付',description:'保留首笔支出，将第二笔交易设为剩余预算加偏移量，验证正常入口累计限制。'}
];
export function parseAmount(value, {zero=false, label='金额'}={}) {
 if(typeof value!=='string'||!/^(0|[1-9]\d{0,8})(\.\d{1,6})?$/.test(value))throw Error(label+'须为最多六位小数的普通十进制数');
 const [integer,fraction='']=value.split('.'),amount=BigInt(integer)*SCALE+BigInt(fraction.padEnd(6,'0'));
 if(!zero&&amount===0n)throw Error(label+'须大于零');
 return amount;
}
export function formatAmount(value) {
 const amount=BigInt(value),negative=amount<0n,n=negative?-amount:amount;
 const fraction=(n%SCALE).toString().padStart(6,'0').replace(/0+$/,'');
 return (negative?'-':'')+(n/SCALE).toString()+(fraction?'.'+fraction:'');
}
function readConfig(input) {
 const config=Object.fromEntries(['initial','budget','payment','permit','mode','secondPath'].map(k=>[k,input[k]]));
 const initial=parseAmount(config.initial,{label:'初始余额'}),budget=parseAmount(config.budget,{label:'任务预算'});
 const payment=parseAmount(config.payment,{zero:true,label:'首笔交易'}),permit=parseAmount(config.permit,{label:'第二笔金额'});
 if(budget>initial)throw Error('任务预算不能大于初始钱包余额');
 if(!['split','unified'].includes(config.mode)||!['permit','transaction'].includes(config.secondPath))throw Error('请选择有效的预算策略与支付路径');
 return {config,initial,budget,payment,permit};
}
export function generateCase(type,input,delta='1') {
 if(!CASES.some(c=>c.id===type))throw Error('未知实验分类');
 const source=type==='custom'?input:{...input,permit:'1',...(type==='permit-only'?{payment:'0'}:{})};
 const {config,initial,budget,payment}=readConfig(source);
 if(type==='custom')return {...config};
 const remaining=budget-payment;
 const offset=type==='boundary'?0n:parseAmount(delta,{label:'偏移量'});
 let second;
 if(type==='permit-only'){
  second=budget-offset;
  if(second<=0n)throw Error('仅签名分类要求偏移量小于任务预算');
  return {...config,payment:'0',permit:formatAmount(second),mode:'unified',secondPath:'permit'};
 }
 if(payment>budget)throw Error('首笔交易已超过任务预算，请先降低首笔交易金额');
 if(remaining<=0n)throw Error('首笔交易已用尽预算，没有可生成的正数剩余额度');
 if(type==='within'){
  second=remaining-offset;
  if(second<=0n)throw Error('预算内分类要求偏移量小于当前剩余预算');
 }else if(type==='boundary')second=remaining;
 else {
  if(payment===0n)throw Error('超额组合分类要求首笔交易大于零');
  second=remaining+offset;
  if(second>budget)throw Error('生成金额超过单张许可或单笔的任务上限，请减小偏移量');
  if(payment+second>initial)throw Error('钱包不足以覆盖生成的组合支出，请增加初始余额或减小偏移量');
 }
 // The generated value must obey the same input precision/size as the runtime.
 parseAmount(formatAmount(second),{label:'生成的第二笔金额'});
 return {...config,permit:formatAmount(second),mode:type==='split-over'?'split':'unified',secondPath:type==='transaction-only'?'transaction':'permit'};
}
export function previewConfig(input) {
 try {
  const {initial,budget,payment,permit,config}=readConfig(input);
  const remaining=budget-payment,total=payment+permit;
  let classification,behavior,expectedSpent,warning=false;
  if(payment>budget){
   classification='首笔交易超出任务预算';behavior='正常入口应拒绝首笔交易，后续许可不会产生。';expectedSpent=0n;
  }else if(config.secondPath==='transaction'&&total>budget){
   classification='交易入口累计超额';behavior='正常入口应拒绝第二笔交易。';expectedSpent=payment;
  }else if(config.secondPath==='permit'&&config.mode==='unified'&&total>budget){
   classification='跨路径累计超额';behavior='统一预算应在发出许可签名前拒绝第二笔请求。';expectedSpent=payment;
  }else if(config.secondPath==='permit'&&permit>budget){
   classification='单张许可超出任务上限';behavior='即使分离计数，许可入口的单张上限也应拒绝请求。';expectedSpent=payment;
  }else if(total>initial){
   classification='钱包余额不足';behavior='余额不足以兑现组合支出；这不能作为共同预算生效的证据。';expectedSpent=null;warning=true;
  }else {
   expectedSpent=total;
   classification=payment===0n&&config.secondPath==='permit'?'仅签名路径':total===budget?'恰好用尽预算':total<budget?'预算内组合支出':'跨路径超额支出';
   behavior=total>budget?'分离计数可能允许两个入口各自通过，实际合计将超过任务预算。':'当前组合在任务预算内，预计可完成支付。';
  }
  const show=value=>value===null?null:formatAmount(value);
  return {valid:true,classification,behavior,warning,remaining:show(remaining),plannedTotal:show(total),expectedSpent:show(expectedSpent),expectedBalance:show(expectedSpent===null?null:initial-expectedSpent),expectedOverspend:show(expectedSpent!==null&&expectedSpent>budget?expectedSpent-budget:0n)};
 }catch(e){return {valid:false,error:e.message};}
}
