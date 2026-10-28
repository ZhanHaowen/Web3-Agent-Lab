import {units,normalize,hash,copy} from '../scenario/core.mjs';
const legacy={balance:{},transfer:{amount:'10'},approve:{amount:'20'},swap:{amountIn:'10',minAmountOut:'9'},swap_deposit:{amountIn:'10',minAmountOut:'9'}};
export const capabilities={peer_swap:['send_message','inspect_order','approve_sell','create_order','approve_buy','fill_order','cancel_order','expire_order','wait','finish'],balance:['read_balance'],transfer:['transfer_token'],approve:['approve_token'],swap:['approve_token','swap'],swap_deposit:['approve_token','swap','deposit']};
export function builtins(){return [...Object.keys(legacy),'peer_swap'].map(taskType=>({taskType,version:'1.0.0',roles:taskType==='peer_swap'?['maker','taker']:['agent'],checkerId:taskType==='peer_swap'?'peer-2.0':'legacy-2.2',checkerVersion:taskType==='peer_swap'?'2.0.0':'2.2.0',requiredTools:capabilities[taskType],schema:taskType==='peer_swap'?{sellAmount:'decimal',buyAmount:'decimal',deadlineSeconds:'integer'}:Object.fromEntries(Object.keys(legacy[taskType]).map(k=>[k,'decimal'])),prompts:taskType==='peer_swap'?{maker:'Use only Maker tools and your private sell goal. Do not invent acceptance or payment.',taker:'Use only Taker tools and your own budget. Accept a real received quoteId and inspect the chain order.'}:{agent:'Execute the installed task using its declared amounts and original amount guard.'},definitionHash:null})).map(d=>({...d,definitionHash:hash({...d,definitionHash:undefined})}));}
export function definition(body){if(!capabilities[body.taskType]||!/^\d+\.\d+\.\d+$/.test(body.version))throw Error('TASK_TYPE_OR_VERSION');const base=builtins().find(x=>x.taskType===body.taskType);
 if(body.checkerId&&body.checkerId!==base.checkerId)throw Error('CHECKER_NOT_INSTALLED');if(body.requiredTools?.some(t=>!capabilities[body.taskType].includes(t)))throw Error('TOOL_NOT_INSTALLED');
 const d={...base,version:body.version,...(body.prompts?{prompts:body.prompts}:{}),...(body.ui?{ui:body.ui}:{})};d.definitionHash=hash({...d,definitionHash:undefined});return d;}
export function jobSpec(body,def,resolveTask){
 const input=copy(body.input??{}),environment=body.environment??{mode:'independent'},goals=body.privateGoals??{};
 if(!['independent','continuous'].includes(environment.mode))throw Error('ENVIRONMENT_MODE');
 if(def.taskType==='peer_swap'){
  if(Object.keys(input).some(k=>!['sellToken','buyToken','sellAmount','buyAmount','deadlineSeconds','maxSteps','mode','automine','manual','pauseBeforeTransaction'].includes(k)))throw Error('UNKNOWN_INPUT_FIELD');
  if((input.sellToken??'A')!=='A'||(input.buyToken??'B')!=='B')throw Error('FIXED_ASSETS_REQUIRED');
  const n=normalize({mode:'scripted',ttl:input.deadlineSeconds??300,maxSteps:input.maxSteps??60,automine:input.automine!==false,manual:!!input.manual,pauseBeforeTransaction:!!input.pauseBeforeTransaction,experimentMode:environment.mode,
   agents:[{goal:{sellAmount:input.sellAmount??'10',minBuy:goals.maker?.minBuy??input.buyAmount??'20'}},{goal:{minReceive:goals.taker?.minReceive??input.sellAmount??'10',maxPay:goals.taker?.maxPay??input.buyAmount??'20'}}]});
  for(const a of n.agents)a.model.systemPrompt=def.prompts?.[a.role]??a.model.systemPrompt;
  n.mode=input.mode??'scripted';if(!['scripted','llm'].includes(n.mode))throw Error('MODE');
  return {input:{sellToken:'A',buyToken:'B',sellAmount:input.sellAmount??'10',buyAmount:input.buyAmount??'20',deadlineSeconds:n.ttl,...input},environment,privateGoals:{maker:n.agents[0].goal,taker:n.agents[1].goal},runtimeSpec:n};
 }
 const fields=legacy[def.taskType];if(Object.keys(input).some(k=>!Object.hasOwn(fields,k)))throw Error('UNKNOWN_INPUT_FIELD');for(const [k,v]of Object.entries({...fields,...input}))try{if(k==='minAmountOut'&&typeof v==='string'&&/^0(?:\.0{1,6})?$/.test(v)){}else units(v);}catch{throw Error('FIELD_'+k+'_DECIMAL');}
 const resolved=resolveTask(def.taskType,{taskParameters:{...fields,...input},taskInput:body.taskInput});
 return {input:{...fields,...input},environment,privateGoals:goals,runtimeSpec:{taskType:def.taskType,mode:body.mode??'scripted',task:resolved,automine:true,manual:!!body.manual}};
}
