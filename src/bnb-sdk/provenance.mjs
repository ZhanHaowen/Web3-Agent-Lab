import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const json = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2);
const xml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const csv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** Derived records retain exact raw-event references. No inferred model/tool links. */
export function buildBnbProvenance(events, runId) {
  const nodes = [], edges = [], seen = new Set();
  const add = (id, type, label, data, event) => {
    if (!seen.has(id)) { seen.add(id); nodes.push({id,type,label,data,sourceEvents:event ? [event.eventId] : []}); }
    return id;
  };
  const edge = (source,target,type,event) => edges.push({id:`edge-${edges.length+1}`,source,target,type,sourceEvents:event?[event.eventId]:[]});
  const root = add(`run:${runId}`,'experiment','BNB SDK 独立实验',{runId},events[0]);
  for (const event of events) {
    const p = event.payload;
    if (event.type === 'operation.started') {
      const op = add(`op:${p.operationId}`,p.kind || 'sdk-call',p.name,p,event);
      edge(root,op,'executes',event);
      if (p.contract) edge(op,add(`contract:${p.contract.toLowerCase()}`,'contract',p.contract,{address:p.contract},event),p.kind==='signing'?'signs-for-contract':p.kind==='read'?'reads':'calls',event);
    }
    if (event.type === 'operation.result') {
      const node = nodes.find(n=>n.id===`op:${p.operationId}`);
      if(node){node.data.result=p.result;node.sourceEvents.push(event.eventId);}
    }
    if(event.type === 'transaction.recorded') {
      const txId=add(`tx:${p.transaction.hash}`,'transaction',p.transaction.hash,{transaction:p.transaction,receipt:p.receipt,block:p.block,traceAvailable:p.traceAvailable},event);
      if(seen.has(`op:${p.operationId}`)) edge(`op:${p.operationId}`,txId,'submits',event);
      if(p.transaction.to) edge(txId,add(`contract:${p.transaction.to.toLowerCase()}`,'contract',p.transaction.to,{address:p.transaction.to},event),'targets',event);
      const walk=(call,parent,path)=>{
        const {calls,...data}=call;
        const id=add(`${txId}:call:${path}`,'evm-call',`${call.type || 'CALL'} ${call.to || '(create)'}`,data,event);
        edge(parent,id,path==='0'?'evm-execution':'internal-call',event);
        for(const [i,child] of (calls || []).entries())walk(child,id,`${path}.${i}`);
      };
      if(p.traceAvailable && p.trace && typeof p.trace==='object')walk(p.trace,txId,'0');
    }
  }
  return {schemaVersion:'web3-agent-lab/bnb-provenance/1',runId,nodes,edges,missingRelations:[{relation:'model-call',reason:'This SDK experiment does not invoke an LLM; no model decision is fabricated.'}],source:'raw/events.jsonl'};
}

export function writeBnbDerived(outDir, events, runId, checks) {
  const dir=join(outDir,'derived');mkdirSync(dir,{recursive:true});
  const graph=buildBnbProvenance(events,runId);
  writeFileSync(join(dir,'graph.json'),json(graph));
  writeFileSync(join(dir,'checker.json'),json(checks));
  writeFileSync(join(dir,'execution-trace.json'),json({schemaVersion:1,runId,events}));
  writeFileSync(join(dir,'nodes.csv'),'id,type,label,source_events,data\n'+graph.nodes.map(n=>[n.id,n.type,n.label,n.sourceEvents.join('|'),JSON.stringify(n.data)].map(csv).join(',')).join('\n')+'\n');
  writeFileSync(join(dir,'edges.csv'),'id,source,target,type,source_events\n'+graph.edges.map(e=>[e.id,e.source,e.target,e.type,e.sourceEvents.join('|')].map(csv).join(',')).join('\n')+'\n');
  writeFileSync(join(dir,'graph.graphml'),'<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><key id="kind" for="all" attr.name="kind" attr.type="string"/><key id="label" for="node" attr.name="label" attr.type="string"/><key id="data" for="all" attr.name="data" attr.type="string"/><graph id="bnb" edgedefault="directed">'+graph.nodes.map(n=>`<node id="${xml(n.id)}"><data key="kind">${xml(n.type)}</data><data key="label">${xml(n.label)}</data><data key="data">${xml(JSON.stringify({data:n.data,sourceEvents:n.sourceEvents}))}</data></node>`).join('')+graph.edges.map(e=>`<edge id="${xml(e.id)}" source="${xml(e.source)}" target="${xml(e.target)}"><data key="kind">${xml(e.type)}</data><data key="data">${xml(JSON.stringify(e.sourceEvents))}</data></edge>`).join('')+'</graph></graphml>\n');
  return graph;
}
