import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const escape=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const csv=x=>'"'+String(x??'').replaceAll('"','""')+'"';
/** Derived researcher graph. Only explicit event causality / shared IDs imply edges. */
export async function writeResearchProvenance(outDir){
 const events=(await readFile(join(outDir,'raw/events.jsonl'),'utf8')).trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
 const nodes=[],edges=[],byEvent=new Set(events.map(e=>e.eventId)),entities=new Map();
 for(const event of events){
  const payload=JSON.parse(await readFile(join(outDir,event.payloadRef.path),'utf8'));
  nodes.push({id:event.eventId,kind:event.type,eventRef:event.eventId,payloadRef:event.payloadRef,sequence:event.seq});
  for(const parent of event.causalEventIds??[])if(byEvent.has(parent))edges.push({id:'edge-'+edges.length,source:parent,target:event.eventId,relation:'explicit_event_cause',eventRef:event.eventId});
  const refs={request:payload?.requestId??payload?.purchase?.requestId,purchase:payload?.purchaseId??payload?.purchase?.purchaseId,transaction:payload?.txHash??payload?.hash??payload?.receipt?.transactionHash};
  for(const [kind,id]of Object.entries(refs)){if(typeof id!=='string'||!id)continue;const entity=kind+':'+id;if(!entities.has(entity)){entities.set(entity,true);nodes.push({id:entity,kind,identity:id,eventRef:event.eventId});}edges.push({id:'edge-'+edges.length,source:event.eventId,target:entity,relation:'records_identifier',eventRef:event.eventId});}
 }
 const graph={schema:'web3-private-provenance-v1',visibility:'private-researcher-only',nodes,edges,missingRelations:['No temporal adjacency is presented as causality.','Model-internal reasoning and unavailable EVM trace edges are not reconstructed.'],source:'raw/events.jsonl + content-addressed payloads'};
 const graphml='<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns"><key id="kind" for="node" attr.name="kind" attr.type="string"/><key id="relation" for="edge" attr.name="relation" attr.type="string"/><key id="eventRef" for="all" attr.name="eventRef" attr.type="string"/><graph id="research" edgedefault="directed">'+nodes.map(n=>`<node id="${escape(n.id)}"><data key="kind">${escape(n.kind)}</data><data key="eventRef">${escape(n.eventRef)}</data></node>`).join('')+edges.map(e=>`<edge id="${e.id}" source="${escape(e.source)}" target="${escape(e.target)}"><data key="relation">${escape(e.relation)}</data><data key="eventRef">${escape(e.eventRef)}</data></edge>`).join('')+'</graph></graphml>';
 const dir=join(outDir,'derived');await mkdir(dir,{recursive:true});
 for(const [name,text]of Object.entries({'graph.json':JSON.stringify(graph,null,2),'graph.graphml':graphml,'nodes.csv':['id,kind,eventRef',...nodes.map(n=>[n.id,n.kind,n.eventRef].map(csv).join(','))].join('\n'),'edges.csv':['id,source,target,relation,eventRef',...edges.map(e=>[e.id,e.source,e.target,e.relation,e.eventRef].map(csv).join(','))].join('\n')}))await writeFile(join(dir,name),text+'\n');return graph;
}
