// Every edge is supported by an explicit event reference; chronology alone is not causality.
export function deriveGraph(events,files,scene){
  const nodes=new Map(),edges=[],edgeKeys=new Set(),providerCalls=new Map();
  function node(id,kind,label,agentId=null,eventRef=null,extra={}){if(!nodes.has(id))nodes.set(id,{id,kind,label,agentId,eventRef,...extra});return id;}
  function edge(from,to,kind,eventRef){if(!from||!to||!nodes.has(from)||!nodes.has(to))return;const key=[from,to,kind,eventRef].join(':');if(edgeKeys.has(key))return;edgeKeys.add(key);edges.push({id:key,from,to,kind,eventRef});}
  for(const a of scene.agents){node('agent:'+a.agentRunId,'agent',a.agentId,a.agentId);if(a.address){node('wallet:'+a.address.toLowerCase(),'wallet',a.address,a.agentId);}}
  const orderKey=id=>`order:${scene.realm?.epoch}:${scene.realm?.scope}:${scene.realm?.exchange}:${id}`;
  for(const e of events){node(e.eventId,e.type,`${e.agentId??'scene'} ${e.type}`,e.agentId,e.eventId);
    for(const cause of e.causalEventIds)edge(cause,e.eventId,'causes',e.eventId);
    if(e.agentRunId)edge('agent:'+e.agentRunId,e.eventId,'performed',e.eventId);
    const text=files[e.payloadRef.path];if(!text)continue;const p=JSON.parse(text);
    if(e.type==='environment.initial')for(const a of scene.agents)edge('agent:'+a.agentRunId,'wallet:'+a.address.toLowerCase(),'uses_wallet',e.eventId);
    if(e.type==='model.request'){const id=`model:${e.agentRunId}:${p.modelCallId}`;node(id,'model_call',`${e.agentId} model`,e.agentId,e.eventId);edge(e.eventId,id,'records_request',e.eventId);}
    if(e.type==='model.response'){const id=`model:${e.agentRunId}:${p.modelCallId}`;edge(id,e.eventId,'returned',e.eventId);
      for(const call of p.response?.choices?.[0]?.message?.tool_calls??[])providerCalls.set(`${e.agentRunId}:${call.id}`,id);}
    if(e.type==='tool.call'){const id=`tool:${p.toolCallKey}`;node(id,'tool_call',`${e.agentId} ${p.name}`,e.agentId,e.eventId);edge(e.eventId,id,'records_tool',e.eventId);
      edge(providerCalls.get(`${e.agentRunId}:${p.providerToolCallId}`),id,'proposed',e.eventId);}
    if(e.type.startsWith('message.')){const m=p,id='message:'+m.messageId;
      node(id,'message',`${m.kind??e.type} ${m.senderAgentId??''} → ${m.recipientAgentId??''}`,m.senderAgentId??e.agentId,e.eventId);
      edge(e.eventId,id,e.type.replace('message.',''),e.eventId);
      if(m.replyTo)edge('message:'+m.replyTo,id,'replies_to',e.eventId);
      if(m.quoteId){const q='quote:'+m.quoteId;node(q,'quote','报价 '+m.quoteId.slice(0,8),m.senderAgentId,e.eventId);edge(id,q,m.kind??'references',e.eventId);}
      if(m.kind==='order_ref'&&m.payload?.orderId){const o=orderKey(m.payload.orderId);node(o,'order',m.payload.orderId,e.agentId,e.eventId);edge(id,o,'claims_order',e.eventId);}}
    if(['service.request','service.job_observed','artifact.generated','artifact.delivered','artifact.evaluation'].includes(e.type)){
      const job='job:'+scene.realm?.epoch+':'+scene.realm?.exchange+':'+p.jobId;node(job,'service_job',p.jobId??'service job',null,e.eventId);edge(e.eventId,job,'records_job',e.eventId);
      if(p.artifactHash){const id='artifact:'+p.artifactHash;node(id,'artifact',p.artifactHash,e.agentId,e.eventId);edge(e.eventId,id,e.type,e.eventId);edge(id,job,'delivers_for',e.eventId);}
    }
    if(e.type==='tx.intent'){const id='intent:'+p.intentId;node(id,'transaction_intent',`${e.agentId} ${p.functionName}`,e.agentId,e.eventId);edge(e.eventId,id,'prepared',e.eventId);}
    if(e.type==='tx.broadcast'||e.type==='tx.receipt'){const id='tx:'+p.hash;node(id,'transaction',`${e.agentId} ${p.functionName} ${p.state}`,e.agentId,e.eventId);
      edge('intent:'+p.intentId,id,'broadcast_as',e.eventId);edge(id,e.eventId,'evidence',e.eventId);
      if(['fillOrder','cancelOrder','expireOrder'].includes(p.functionName)&&p.args?.[0]){const o=orderKey(p.args[0]);node(o,'order',p.args[0],null,e.eventId);edge(id,o,p.functionName,e.eventId);}}
    if(e.type==='order.observed'){const o=orderKey(p.orderId);node(o,'order',p.orderId,null,e.eventId);edge(o,e.eventId,'observed',e.eventId);}
    if(e.type==='tx.receipt'&&scene.spec?.template==='service_purchase'){
      const job='job:'+scene.realm?.epoch+':'+scene.realm?.exchange+':'+scene.jobId;node(job,'service_job',scene.jobId,null,e.eventId);edge('tx:'+p.hash,job,p.functionName,e.eventId);
    }
    if(e.type==='tx.trace'&&p.trace){function walk(call,path,parent){const id=`evm:${p.hash}:${path}`;node(id,'evm_call',`${call.type??'CALL'} ${call.to??''}`,e.agentId,e.eventId,{tracePath:path});edge(parent,id,'calls',e.eventId);(call.calls??[]).forEach((c,i)=>walk(c,`${path}.${i}`,id));}walk(p.trace,'0','tx:'+p.hash);}
  }
  return {schemaVersion:2,nodes:[...nodes.values()],edges};
}
