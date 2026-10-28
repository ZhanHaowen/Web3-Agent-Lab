import { randomUUID } from 'node:crypto';
import { copy,json,checkQuote } from './core.mjs';
const properties={recipient:{type:'string',enum:['maker','taker']},kind:{type:'string',enum:['inquiry','quote','accept','reject','order_ref']},
  payload:{type:'object',additionalProperties:true},quoteId:{type:'string'},replyTo:{type:'string'},orderId:{type:'string'},reason:{type:'string'}};
export function definitions(spec){return spec.tools.map(name=>({type:'function',function:{name,
  description:({send_message:'Send an actual business message. Required: recipient and kind. payload defaults to {} for accept/inquiry/reject. Quote payload requires sellAmount and buyAmount decimal strings. accept requires the received quoteId, e.g. {recipient:"maker",kind:"accept",quoteId:"received-id"}. order_ref payload requires orderId. Text alone never sends a message.',
    inspect_order:'Read and independently verify the current order against your accepted terms. Required before taker approval or fill.',
    approve_sell:'Maker precisely approves the accepted TokenA amount to the exchange.',create_order:'Maker escrows TokenA and opens the mutually accepted quote.',
    approve_buy:'Taker precisely approves the accepted TokenB amount to the exchange.',fill_order:'Taker atomically settles the inspected order.',
    cancel_order:'Maker cancels an open order before expiry and receives refund.',expire_order:'Refund expired open order to maker.',wait:'Yield this scheduler turn while waiting for messages or chain confirmation.',finish:'Finish your business decisions.'})[name],
  parameters:{type:'object',properties:name==='send_message'?properties:name==='finish'?{reason:{type:'string'}}:{},
    required:name==='send_message'?['recipient','kind']:[],additionalProperties:false}}}));}
export class AgentRuntime {
  constructor(spec){this.spec=spec;this.agentId=spec.agentId;this.agentRunId=randomUUID();this.role=spec.role;
    this.messages=[];this.history=[];this.costs={modelCalls:0,toolCalls:0,promptTokens:0,completionTokens:0,totalTokens:0,usageComplete:true};
    this.gasUsedWei=0n;this.finished=false;this.stage=0;this.inspected=null;this.pendingCalls=[];this.ownToolIds=new Set();}
  async step(s){
    const inbox=await s.bus.receive(this);this.history.push(...inbox);
    if(s.spec.mode==='scripted')return this.scripted(s,inbox);
    return this.llm(s,inbox);
  }
  async scripted(s){
    const last=kind=>this.history.filter(m=>m.kind===kind).at(-1);
    if(this.role==='taker'){
      if(this.stage===0){this.stage++;return {name:'send_message',args:{recipient:'maker',kind:'inquiry',payload:{request:'Quote TokenA for TokenB'}}};}
      if(this.stage===1&&last('quote')){this.stage++;const m=last('quote');let accepted=true;try{checkQuote(this.spec,m.visiblePayload);}catch{accepted=false;}
        return {name:'send_message',args:{recipient:'maker',kind:accepted?'accept':'reject',quoteId:m.quoteId,replyTo:m.messageId,payload:{reason:accepted?'within_private_goal':'outside_private_goal'}}};}
      if(this.stage===2&&last('order_ref')){this.stage++;return {name:'inspect_order',args:{}};}
      if(this.stage===3){this.stage++;return {name:'approve_buy',args:{}};}
      if(this.stage===4){this.stage++;return {name:'fill_order',args:{}};}
    }else{
      if(this.stage===0&&last('inquiry')){this.stage++;return {name:'send_message',args:{recipient:'taker',kind:'quote',replyTo:last('inquiry').messageId,payload:{sellAmount:this.spec.goal.sellAmount,buyAmount:this.spec.goal.minBuy}}};}
      if(this.stage===1&&last('accept')){this.stage++;return {name:'approve_sell',args:{}};}
      if(this.stage===2){this.stage++;return {name:'create_order',args:{}};}
      if(this.stage===3&&s.orderId){this.stage++;return {name:'send_message',args:{recipient:'taker',kind:'order_ref',quoteId:s.quote.quoteId,payload:{orderId:s.orderId}}};}
    }
    if(last('reject'))return {name:'finish',args:{reason:'rejected'}};
    return {wait:true};
  }
  definitions(){return definitions(this.spec);}
  initialContext(){return null;}
  async llm(s,inbox){
    if(this.costs.modelCalls>=this.spec.maxModelCalls||this.costs.totalTokens>=this.spec.maxTokens)throw Error('MODEL_BUDGET_EXCEEDED');
    if(!this.messages.length)this.messages=[{role:'system',content:this.spec.model.systemPrompt||'Operate only your own local experiment wallet. Negotiate using messages. Never claim settlement without chain evidence.'},
      {role:'user',content:json(this.initialContext(s)??{agentId:this.agentId,role:this.role,privateGoal:this.spec.goal,address:this.address,peer:this.role==='maker'?'taker':'maker',
        process:'Taker sends inquiry; Maker sends quote; peer accepts, counterquotes or rejects. Quote payload has sellAmount of TokenA and buyAmount of TokenB. Only the other agent can accept a quote. After mutual acceptance Maker approves sell and creates order, then sends order_ref; Taker inspects, approves buy, fills. Use wait to yield, not finish, while expecting messages. Only human decimal strings for quotes. You do not know the other agent private goal.'})}];
    this.deferredInbox=[...(this.deferredInbox??[]),...inbox];
    if(this.pendingCalls.length)return this.pendingCalls.shift();
    if(this.deferredInbox.length){const observed=this.deferredInbox;this.deferredInbox=[];this.messages.push({role:'user',content:json({source:'inbox',messages:observed.map(m=>({messageId:m.messageId,quoteId:m.quoteId,kind:m.kind,sender:m.senderAgentId,payload:m.visiblePayload})),causalEventIds:observed.map(m=>m.consumedEventId)})});}
    const m=this.spec.model,u=new URL(m.baseUrl);u.pathname=u.pathname.replace(/\/$/,'').replace(/\/chat\/completions$/,'')+'/chat/completions';
    const progress=s.progress(this);
    const context={role:'user',content:json({source:'platform_verified_progress',...progress,
      instruction:'Only successful tool results change the platform state. An error means the action did not succeed. Use a real tool_call; JSON or promises in assistant text do not execute. If waiting for the peer, call wait. The platform does not choose your price or acceptance.'})};
    this.messages.push(context);
    const contextEvent=await s.emit('agent.progress',{message:context,progress},this,inbox.map(m=>m.consumedEventId));
    const request={model:m.model,messages:copy(this.messages),tools:this.definitions().filter(d=>progress.allowedActions.includes(d.function.name)),tool_choice:'auto',stream:false,temperature:m.temperature};
    const requestId=randomUUID();const e=await s.emit('model.request',{modelCallId:requestId,endpoint:u.toString(),request},this,[contextEvent.eventId]);
    const response=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json',...(m.apiKey?{Authorization:`Bearer ${m.apiKey}`}:{})},
      body:JSON.stringify(request),signal:AbortSignal.any([s.abort.signal,AbortSignal.timeout(m.requestTimeoutMs)]),redirect:'error'});
    this.costs.modelCalls++;const body=await response.text();if(body.length>2000000)throw Error('MODEL_RESPONSE_TOO_LARGE');let data;
    try{data=JSON.parse(body);}catch{throw Error('MODEL_INVALID_JSON');}
    await s.emit('model.response',{modelCallId:requestId,status:response.status,response:data},this,[e.eventId]);
    if(!response.ok)throw Error(`MODEL_HTTP_${response.status}`);
    const msg=data.choices?.[0]?.message;if(msg?.role!=='assistant')throw Error('MODEL_ASSISTANT_REQUIRED');
    for(const [key,source] of [['promptTokens','prompt_tokens'],['completionTokens','completion_tokens'],['totalTokens','total_tokens']]){
      const n=data.usage?.[source];if(Number.isSafeInteger(n)&&n>=0)this.costs[key]+=n;else this.costs.usageComplete=false;}
    if(msg.tool_calls&&!Array.isArray(msg.tool_calls))throw Error('MODEL_TOOL_CALLS');
    if((msg.tool_calls?.length??0)>16)throw Error('MODEL_TOOL_CALL_LIMIT');
    this.messages.push(copy(msg));
    for(const call of msg.tool_calls??[]){if(!call.id||this.ownToolIds.has(call.id)||call.type!=='function')throw Error('MODEL_TOOL_ID');
      this.ownToolIds.add(call.id);let args;try{args=JSON.parse(call.function.arguments);}catch{args=null;}
      this.pendingCalls.push({name:call.function.name,args,providerToolCallId:call.id,modelCallId:requestId,causes:[e.eventId]});}
    if(!this.pendingCalls.length){this.messages.push({role:'user',content:'刚才只有文字，没有实际执行操作。即使文字写着“已接受”，平台也未收到 accept。请依据 platform_verified_progress 调用一个允许的工具；等待时调用 wait，不要重复输出工具 JSON 代码块。'});return {wait:true};}
    return this.pendingCalls.shift();
  }
  result(call,value){if(call.providerToolCallId)this.messages.push({role:'tool',tool_call_id:call.providerToolCallId,content:json(value)});}
}
