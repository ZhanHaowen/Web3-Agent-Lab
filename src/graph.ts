/** A directed multigraph of observed activities and resources. No inferred model reasoning. */
export interface GraphNode {
  id: string; type: string; label: string; attributes: Record<string, any>; source_events: any[];
}
export interface GraphEdge {
  id: string; source: string; target: string; type: string; attributes: Record<string, any>; source_events: any[];
}
export interface ProvenanceGraph {
  schema_version: '1.0'; format: 'web3-agent-provenance-graph'; run_id: string;
  directed: true; multigraph: true; nodes: GraphNode[]; edges: GraphEdge[];
  provenance: Record<string, any>; summary: Record<string, any>; warnings: any[];
}
const array = (value: any): any[] => Array.isArray(value) ? value : [];
const text = (value: any) => value == null ? '' : String(value);
const addressPattern = /^0x[a-f0-9]{40}$/i;
function eventRef(event: any) {
  return { seq: event.seq, event_id: event.event_id, type: event.type, timestamp: event.timestamp, monotonic_ms: event.monotonic_ms, payload_ref: event.payload_ref };
}
export function buildProvenanceGraph(trace: any, config: any = {}, events: any[] = []): ProvenanceGraph {
  const nodes = new Map<string, GraphNode>(); const edges: GraphEdge[] = [];
  const warnings: any[] = [...array(trace.warnings)];
  const addNode = (id: string, type: string, label: string, attributes: any, sources: any[] = []) => {
    if (!id) return;
    const existing = nodes.get(id);
    if (existing) {
      for (const ref of sources) if (!existing.source_events.some(r => r.seq === ref.seq && r.event_id === ref.event_id)) existing.source_events.push(ref);
      return;
    }
    nodes.set(id, { id, type, label, attributes, source_events: [...sources] });
  };
  const addEdge = (source: string, target: string, type: string, sources: any[] = [], attributes: any = {}, id?: string) => {
    if (!nodes.has(source) || !nodes.has(target)) {
      warnings.push({ code: 'UNRESOLVED_GRAPH_ENDPOINT', message: '关系的端点缺少实体记录，未推测补全。', source, target, type, source_events: sources }); return;
    }
    edges.push({ id: id || `graph-edge:${edges.length + 1}`, source, target, type, attributes, source_events: [...sources] });
  };
  const rootId = trace.task?.node_id || `task:${trace.run_id}`;
  const startEvent = events.find(event => event.type === 'agent.start') || events.find(event => event.type === 'run.started');
  addNode(rootId, 'task', text(trace.task?.id || config.taskId || '任务'), { ...trace.task, run_id: trace.run_id, session_id: config.session_id ?? null }, startEvent ? [eventRef(startEvent)] : []);
  const layers: [string, string, (entity: any) => string][] = [
    ['model_calls', 'model_call', e => `模型 ${e.model || e.modelCallId || e.id}`],
    ['tool_calls', 'tool_call', e => `工具 ${e.name || e.toolCallId || e.id}`],
    ['contract_calls', 'contract_call', e => `${e.kind === 'read' ? '只读' : '合约'} ${e.function?.name || e.function?.selector || e.contractCallId || e.id}`],
    ['transactions', 'transaction', e => `交易 ${e.hash || '未取得哈希'} · ${e.status || 'unknown'}`],
    ['call_frames', 'evm_call', e => `${e.type || 'EVM'} ${text(e.input).slice(0, 10) || '无calldata'}`],
  ];
  for (const [key, type, label] of layers) for (const entity of array(trace[key])) {
    const { source_events = [], ...attributes } = entity;
    addNode(entity.id || entity.callId, type, label(entity), attributes, source_events);
  }
  for (const edge of array(trace.edges)) addEdge(edge.from, edge.to, edge.relation, array(edge.source_events), { evidence_basis: 'explicit_recorded_reference' }, edge.id);

  const epoch = config.initial_state?.chainInstanceId || events.find(e => e.type === 'state.before')?.payload?.chainInstanceId || trace.run_id;
  const chainId = config.environment?.chainId || events.find(e => e.type === 'state.before')?.payload?.chainId || null;
  const labels = new Map<string, { label: string; kind: string }>();
  for (const [label, value] of Object.entries(config.environment?.contracts || {})) if (addressPattern.test(text(value))) labels.set(text(value).toLowerCase(), { label, kind: 'contract' });
  for (const [label, value] of Object.entries(config.environment?.accounts || {})) if (addressPattern.test(text(value)) && !labels.has(text(value).toLowerCase())) labels.set(text(value).toLowerCase(), { label, kind: 'address' });
  const resource = (address: any, sources: any[]) => {
    if (!addressPattern.test(text(address))) return null;
    const normalized = text(address).toLowerCase(); const known = labels.get(normalized);
    const id = `address:${epoch}:${chainId ?? 'unknown'}:${normalized}`;
    addNode(id, known?.kind || 'address', `${known?.label || '地址'} ${normalized.slice(0, 10)}…`, { address, chain_id: chainId, chain_instance_id: epoch, role: known?.label ?? null }, sources);
    return id;
  };
  for (const contract of array(trace.contract_calls)) {
    const sources = array(contract.source_events); const callee = resource(contract.contract?.address || contract.request?.to, sources);
    if (callee) addEdge(contract.id, callee, 'invokes_address', sources, { kind: contract.kind, function: contract.function });
    const from = resource(contract.request?.from, sources);
    if (from) addEdge(contract.id, from, 'originates_from', sources);
  }
  for (const tx of array(trace.transactions)) {
    const sources = array(tx.source_events);
    const from = resource(tx.request?.from, sources), to = resource(tx.request?.to, sources);
    if (from) addEdge(tx.id, from, 'originates_from', sources);
    if (to) addEdge(tx.id, to, 'sends_to', sources);
  }
  for (const frame of array(trace.call_frames)) {
    const sources = array(frame.source_events); const to = resource(frame.to, sources);
    if (to) addEdge(frame.id || frame.callId, to, 'evm_calls_address', sources, { call_type: frame.type });
  }
  for (const [type, relation] of [['state.before', 'has_initial_state'], ['state.after', 'has_final_state']]) {
    for (const event of events.filter(event => event.type === type)) {
      const id = `state:${trace.run_id}:${event.seq}`; const sources = [eventRef(event)];
      addNode(id, 'state', `${type === 'state.before' ? '运行前' : '运行后'}区块 ${event.payload?.blockNumber ?? '未知'}`, event.payload || {}, sources);
      addEdge(rootId, id, relation, sources, { meaning: 'run_boundary_snapshot_not_per_tool_causality' });
    }
  }
  if (config.previous_run_id) {
    const prior = `run-reference:${config.previous_run_id}`;
    addNode(prior, 'run_reference', '上一轮实验', { run_id: config.previous_run_id, session_id: config.session_id, evidence: 'config.previous_run_id', loaded: false });
    addEdge(prior, rootId, 'follows_run', [], { meaning: 'recorded_session_order_not_proof_of_causality', evidence_path: 'config.json#previous_run_id' });
  }
  const countBy = (list: { type: string }[]) => Object.fromEntries([...new Set(list.map(item => item.type))].map(type => [type, list.filter(item => item.type === type).length]));
  const graph: ProvenanceGraph = {
    schema_version: '1.0', format: 'web3-agent-provenance-graph', run_id: trace.run_id,
    directed: true, multigraph: true, nodes: [...nodes.values()], edges,
    provenance: { ...trace.provenance, graph_builder_version: '1.0', semantics: 'Observed execution provenance; temporal relationships are labeled separately. Not a specified PGG or W3C PROV conformance claim.' },
    summary: { node_count: nodes.size, edge_count: edges.length, node_types: countBy([...nodes.values()]), edge_types: countBy(edges) }, warnings,
  };
  validateProvenanceGraph(graph);
  return graph;
}
export function validateProvenanceGraph(graph: ProvenanceGraph) {
  const ids = new Set(graph.nodes.map(node => node.id));
  if (ids.size !== graph.nodes.length) throw new Error('GRAPH_DUPLICATE_NODE_ID');
  if (new Set(graph.edges.map(edge => edge.id)).size !== graph.edges.length) throw new Error('GRAPH_DUPLICATE_EDGE_ID');
  for (const edge of graph.edges) if (!ids.has(edge.source) || !ids.has(edge.target)) throw new Error('GRAPH_DANGLING_EDGE');
}
const xml = (value: any) => Buffer.from(text(value), 'utf8').toString('utf8').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const xmlId = (prefix: string, id: string) => prefix + Buffer.from(id, 'utf8').toString('base64url');
/** Flat directed GraphML. Nested application attributes are JSON strings, not XML subgraphs. */
export function renderGraphML(graph: ProvenanceGraph) {
  validateProvenanceGraph(graph);
  const keys = [
    ['n_id', 'node', 'original_id'], ['n_type', 'node', 'node_type'], ['n_label', 'node', 'label'], ['n_attributes', 'node', 'attributes_json'], ['n_events', 'node', 'source_events_json'],
    ['e_id', 'edge', 'original_id'], ['e_type', 'edge', 'edge_type'], ['e_attributes', 'edge', 'attributes_json'], ['e_events', 'edge', 'source_events_json'],
    ['g_run', 'graph', 'run_id'], ['g_provenance', 'graph', 'provenance_json'], ['g_warnings', 'graph', 'warnings_json'],
  ];
  const data = (key: string, value: any) => `      <data key="${key}">${xml(value)}</data>`;
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
    ...keys.map(([id, target, name]) => `  <key id="${id}" for="${target}" attr.name="${name}" attr.type="string"/>`),
    `  <graph id="${xmlId('g', graph.run_id)}" edgedefault="directed">`, data('g_run', graph.run_id), data('g_provenance', JSON.stringify(graph.provenance)), data('g_warnings', JSON.stringify(graph.warnings))];
  for (const node of graph.nodes) lines.push(`    <node id="${xmlId('n', node.id)}">`, data('n_id', node.id), data('n_type', node.type), data('n_label', node.label), data('n_attributes', JSON.stringify(node.attributes)), data('n_events', JSON.stringify(node.source_events)), '    </node>');
  for (const edge of graph.edges) lines.push(`    <edge id="${xmlId('e', edge.id)}" source="${xmlId('n', edge.source)}" target="${xmlId('n', edge.target)}">`, data('e_id', edge.id), data('e_type', edge.type), data('e_attributes', JSON.stringify(edge.attributes)), data('e_events', JSON.stringify(edge.source_events)), '    </edge>');
  lines.push('  </graph>', '</graphml>', '');
  return lines.join('\n');
}
