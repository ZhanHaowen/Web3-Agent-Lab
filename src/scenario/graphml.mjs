// Preserve the complete derived graph, including relation kinds and raw-event
// references, rather than exporting topology without its evidence semantics.
const xml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function graphML(graph){
 const keys=['kind','label','agentId','eventRef','record'];
 const data=record=>keys.map(key=>`<data key="${key}">${xml(key==='record'?JSON.stringify(record):record[key])}</data>`).join('');
 return `<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns">${keys.map(key=>`<key id="${key}" for="all" attr.name="${key}" attr.type="string"/>`).join('')}<graph id="provenance" edgedefault="directed">${graph.nodes.map(node=>`<node id="${xml(node.id)}">${data(node)}</node>`).join('')}${graph.edges.map((edge,index)=>`<edge id="edge-${index}" source="${xml(edge.from)}" target="${xml(edge.to)}">${data(edge)}</edge>`).join('')}</graph></graphml>`;
}
