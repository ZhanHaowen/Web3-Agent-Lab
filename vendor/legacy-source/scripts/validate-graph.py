"""Validate exported graph consistency and optionally GraphML interoperability with NetworkX.
Usage: python scripts/validate-graph.py provenance-graph.json provenance-graph.graphml
NetworkX is an optional analysis dependency, not needed to run the application.
"""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

graph = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
root = ET.parse(sys.argv[2]).getroot()
namespace = {'g': 'http://graphml.graphdrawing.org/xmlns'}
assert root.tag == '{http://graphml.graphdrawing.org/xmlns}graphml'
keys = {key.attrib['id']: key.attrib['attr.name'] for key in root.findall('g:key', namespace)}
def values(element):
    return {keys[item.attrib['key']]: item.text or '' for item in element.findall('g:data', namespace)}
xml_graph = root.find('g:graph', namespace)
assert xml_graph is not None and xml_graph.attrib['edgedefault'] == 'directed'
json_nodes = {node['id']: node for node in graph['nodes']}
json_edges = {edge['id']: edge for edge in graph['edges']}
xml_nodes = xml_graph.findall('g:node', namespace)
xml_edges = xml_graph.findall('g:edge', namespace)
assert len(json_nodes) == len(xml_nodes) == len(graph['nodes'])
assert len(json_edges) == len(xml_edges) == len(graph['edges'])
node_ids = {node.attrib['id']: values(node)['original_id'] for node in xml_nodes}
for node in xml_nodes:
    data = values(node)
    original = json_nodes[data['original_id']]
    assert data['node_type'] == original['type']
    assert json.loads(data['attributes_json']) == original['attributes']
    assert json.loads(data['source_events_json']) == original['source_events']
for edge in xml_edges:
    data = values(edge)
    original = json_edges[data['original_id']]
    assert node_ids[edge.attrib['source']] == original['source']
    assert node_ids[edge.attrib['target']] == original['target']
    assert data['edge_type'] == original['type']
    assert json.loads(data['attributes_json']) == original['attributes']
    assert json.loads(data['source_events_json']) == original['source_events']
report = {'run_id': graph['run_id'], 'nodes': len(xml_nodes), 'edges': len(xml_edges), 'xml_and_json_equivalent': True, 'networkx_tested': False}
try:
    import networkx as nx
except ImportError:
    pass
else:
    loaded = nx.read_graphml(sys.argv[2], force_multigraph=True)
    assert loaded.is_directed() and loaded.is_multigraph()
    assert loaded.number_of_nodes() == len(json_nodes)
    assert loaded.number_of_edges() == len(json_edges)
    assert set(nx.get_node_attributes(loaded, 'original_id').values()) == set(json_nodes)
    report.update(networkx_tested=True, networkx_version=nx.__version__)
print(json.dumps(report, ensure_ascii=False, indent=2))
