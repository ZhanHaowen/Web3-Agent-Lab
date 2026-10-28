import { createHash, randomUUID } from 'node:crypto';
export const json = value => JSON.stringify(value, (_k,v)=>typeof v==='bigint'?v.toString():v,2);
export const copy = value => JSON.parse(json(value));
export const hash = value => createHash('sha256').update(typeof value==='string'?value:json(value)).digest('hex');
export const units = value => {
  if(typeof value!=='string'||!/^\d+(?:\.\d{1,6})?$/.test(value)) throw Error('AMOUNT_FORMAT');
  const [a,b='']=value.split('.'); const n=BigInt(a)*1000000n+BigInt(b.padEnd(6,'0'));
  if(n<=0n||n>=2n**256n) throw Error('AMOUNT_RANGE'); return n;
};
export const decimal = value => `${BigInt(value)/1000000n}.${(BigInt(value)%1000000n).toString().padStart(6,'0')}`.replace(/\.?0+$/,'');
export function normalize(input={}) {
  if(input.agents&&(!Array.isArray(input.agents)||input.agents.length!==2))throw Error('THIS_RELEASE_REQUIRES_TWO_AGENTS');
  if(input.template&&input.template!=='peer_swap') throw Error('UNSUPPORTED_TEMPLATE');
  const spec={schemaVersion:2,template:'peer_swap',mode:input.mode??'scripted',
    experimentMode:input.experimentMode??'independent',expectedOutcome:input.expectedOutcome??'filled',
    maxSteps:input.maxSteps??60,maxMessages:input.maxMessages??100,ttl:input.ttl??600,
    manual:!!input.manual,pauseBeforeTool:!!input.pauseBeforeTool,pauseBeforeTransaction:!!input.pauseBeforeTransaction,
    automine:input.automine!==false,parentScenarioRunId:input.parentScenarioRunId??null,
    agents:[0,1].map((i)=>{
      const role=i===0?'maker':'taker',x=input.agents?.[i]??{};
      return {agentId:role,walletId:role,role,initialA:i===0?'100':'0',initialB:i===0?'0':'100',
        goal:i===0?{sellAmount:x.goal?.sellAmount??'10',minBuy:x.goal?.minBuy??'20'}:
          {minReceive:x.goal?.minReceive??'10',maxPay:x.goal?.maxPay??'20'},
        model:{baseUrl:x.model?.baseUrl??'',model:x.model?.model??'',apiKey:x.model?.apiKey??'',
          systemPrompt:x.model?.systemPrompt??'',temperature:x.model?.temperature??0,
          requestTimeoutMs:Math.min(180000,Math.max(1000,x.model?.requestTimeoutMs??120000))},
        maxModelCalls:Math.min(100,Math.max(1,x.maxModelCalls??20)),maxTokens:Math.min(1000000,Math.max(1,x.maxTokens??100000)),
        maxGasWei:String(x.maxGasWei??'100000000000000000'),
        tools:i===0?['send_message','inspect_order','approve_sell','create_order','cancel_order','expire_order','wait','finish']:
          ['send_message','inspect_order','approve_buy','fill_order','expire_order','wait','finish']};})};
  if(!['scripted','llm'].includes(spec.mode)||!['independent','continuous'].includes(spec.experimentMode)) throw Error('INVALID_MODE');
  if(!['filled','no_deal'].includes(spec.expectedOutcome)) throw Error('INVALID_EXPECTATION');
  if(!Number.isSafeInteger(spec.maxSteps)||spec.maxSteps<1||spec.maxSteps>200) throw Error('STEP_BUDGET');
  if(!Number.isSafeInteger(spec.ttl)||spec.ttl<2||spec.ttl>86400) throw Error('TTL_RANGE');
  if(!Number.isSafeInteger(spec.maxMessages)||spec.maxMessages<1||spec.maxMessages>1000) throw Error('MESSAGE_BUDGET');
  for(const a of spec.agents){Object.values(a.goal).forEach(units); if(!/^\d+$/.test(a.maxGasWei))throw Error('GAS_BUDGET');
    if(spec.mode==='llm'){const u=new URL(a.model.baseUrl);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('MODEL_ENDPOINT');if(u.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('REMOTE_MODEL_REQUIRES_HTTPS');if(!a.model.model.trim())throw Error('MODEL_ID_REQUIRED');}}
  return spec;
}
export function checkQuote(actor,quote) {
  const a=units(quote.sellAmount),b=units(quote.buyAmount),g=actor.goal;
  if(actor.role==='maker'&&(a!==units(g.sellAmount)||b*units(g.sellAmount)<units(g.minBuy)*a))throw Error('MAKER_GOAL_REJECTED');
  if(actor.role==='taker'&&(a<units(g.minReceive)||b>units(g.maxPay)))throw Error('TAKER_GOAL_REJECTED');
  return {sellAmount:decimal(a),buyAmount:decimal(b)};
}
export class MessageBus {
  constructor(scenario,emit){this.scenario=scenario;this.emit=emit;this.outbox=[];this.inboxes=new Map((scenario.agents??[{agentId:'maker'},{agentId:'taker'}]).map(a=>[a.agentId,[]]));this.delivered=new Set();this.consumed=new Set();}
  async send(actor,args,causes=[]){
    if(!this.inboxes.has(args.recipient)||args.recipient===actor.agentId)throw Error('MESSAGE_RECIPIENT');
    if(!['inquiry','quote','accept','reject','order_ref'].includes(args.kind))throw Error('MESSAGE_KIND');
    if(this.outbox.length>=this.scenario.spec.maxMessages)throw Error('MESSAGE_BUDGET');
    const m={schemaVersion:2,scenarioId:this.scenario.id,episodeId:this.scenario.episodeId,messageId:randomUUID(),
      senderAgentId:actor.agentId,recipientAgentId:args.recipient,conversationId:this.scenario.id,
      replyTo:args.replyTo??null,kind:args.kind,requestId:args.requestId??null,quoteId:args.quoteId??null,
      orderRef:args.orderRef??null,payload:copy(args.payload??{}),causalEventIds:causes};
    if(Buffer.byteLength(json(m.payload))>16384)throw Error('MESSAGE_TOO_LARGE');
    m.payloadHash=hash(m.payload);m.visiblePayload=copy(m.payload);m.visiblePayloadHash=m.payloadHash;
    const sent=await this.emit('message.sent',m,actor,causes);m.sentEventId=sent.eventId;this.outbox.push(m);
    await this.deliver(m);return m;
  }
  async deliver(m){const key=`${m.episodeId}:${m.messageId}`;
    if(m.episodeId!==this.scenario.episodeId)throw Error('STALE_EPISODE');
    if(this.delivered.has(key)){await this.emit('message.duplicate',{messageId:m.messageId},null,[m.sentEventId]);return false;}
    this.delivered.add(key);this.inboxes.get(m.recipientAgentId).push(m);
    const e=await this.emit('message.delivered',m,null,[m.sentEventId]);m.deliveredEventId=e.eventId;return true;
  }
  async receive(actor){const list=this.inboxes.get(actor.agentId).splice(0);const out=[];
    for(const m of list){const key=`${m.episodeId}:${m.messageId}`;if(this.consumed.has(key))continue;this.consumed.add(key);
      const e=await this.emit('message.consumed',{messageId:m.messageId,visiblePayload:m.visiblePayload},actor,[m.deliveredEventId]);out.push({...copy(m),consumedEventId:e.eventId});}return out;
  }
}
