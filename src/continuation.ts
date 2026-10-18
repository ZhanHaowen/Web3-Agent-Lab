import { sha256, json } from './store.js';

/** Reconstruct only provider-visible messages backed by sealed raw events. */
export function continuationHistory(events: any[]) {
  let requestIndex=-1;events.forEach((event,index)=>{if(event.type==='model.request') requestIndex=index;});
  if(requestIndex<0) throw new Error('CONTINUATION_HISTORY_MISSING: 原始记录没有模型请求历史');
  const request=events[requestIndex];
  const response=events.slice(requestIndex+1).find(event=>event.type==='model.response'&&event.links?.modelCallId===request.links?.modelCallId);
  if(!Array.isArray(request.payload?.request?.messages)||!response) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 最后一次模型交互不完整');
  const assistant=response.payload?.response?.choices?.[0]?.message;
  if(!assistant||assistant.role!=='assistant') throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 最后一次模型响应没有有效assistant消息');
  const messages=structuredClone(request.payload.request.messages);
  const calls=assistant.tool_calls;
  if(calls!==undefined&&!Array.isArray(calls)) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 非法tool_calls');
  messages.push({role:'assistant',content:assistant.content??null,...(calls?.length?{tool_calls:structuredClone(calls)}:{})});
  const toolEvents=events.filter(event=>event.seq>response.seq&&event.type==='tool.result');
  for(const call of calls??[]) {
    const matches=toolEvents.filter(event=>event.links?.toolCallId===call.id);
    if(matches.length!==1) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 工具调用缺少唯一结果，不能猜测或重新执行');
    messages.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(matches[0].payload.visible)});
  }
  // Validate tool-pair closure throughout the recovered history, including
  // earlier request messages supplied by prior continuation children.
  const pending=new Set<string>();
  for(const message of messages) {
    if(message.role==='assistant') {
      if(pending.size) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 未闭合工具调用');
      for(const call of message.tool_calls??[]) pending.add(call.id);
    } else if(message.role==='tool') {
      if(!pending.delete(message.tool_call_id)) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 孤立工具结果');
    } else if(pending.size) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 工具结果前出现新消息');
  }
  if(pending.size) throw new Error('CONTINUATION_HISTORY_INCOMPLETE: 未闭合工具调用');
  const observations=events.filter(event=>event.type==='tool.result').map(event=>({name:event.payload.name,raw:event.payload.raw,visible:event.payload.visible,...(event.payload.error?{error:event.payload.error}:{})}));
  return {messages,observations,historySha256:sha256(json(messages)),sourceEvents:[request,response,...toolEvents].map(event=>({run_id:event.run_id,event_id:event.event_id,seq:event.seq,payload_ref:event.payload_ref,...event.links}))};
}

export function parentReferences(events:any[],parentRunId:string,transactions:any[]) {
  const previous=events.find(event=>event.type==='continuation.parent')?.payload;
  const reference=(event:any)=>({run_id:event.run_id,event_id:event.event_id,seq:event.seq,payload_ref:event.payload_ref,...event.links});
  const parentToolReferences=[...(previous?.parentToolReferences??[]),...events.filter(event=>event.type==='tool.result').map(event=>({toolCallId:event.links?.toolCallId,...reference(event)}))];
  const inheritedTransactions=transactions.map(tx=>{
    const hash=tx.hash||tx.txHash;
    const refs=events.filter(event=>event.type.startsWith('tx.')&&hash&&(event.payload?.hash===hash||event.payload?.txHash===hash)).map(reference);
    const inherited=previous?.inheritedTransactions?.find((item:any)=>(item.hash||item.txHash)===hash);
    return {...tx,parentRunId:inherited?.parentRunId??parentRunId,source_event_refs:[...(inherited?.source_event_refs??[]),...refs]};
  });
  return {parentToolReferences,inheritedTransactions};
}

/** Cumulative checking must neither lose previous submissions nor count twice. */
export function mergeTransactions(...groups:any[][]) {
  const byHash=new Map<string,any>();const withoutHash:any[]=[];
  for(const tx of groups.flat()) {
    const hash=tx.hash||tx.txHash;
    if(hash) byHash.set(hash.toLowerCase(),{...byHash.get(hash.toLowerCase()),...tx});
    else withoutHash.push(tx);
  }
  return [...byHash.values(),...withoutHash].sort((a,b)=>(a.nonce??Number.MAX_SAFE_INTEGER)-(b.nonce??Number.MAX_SAFE_INTEGER));
}
