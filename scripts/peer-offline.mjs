import {readFile} from 'node:fs/promises';
import {hash,json} from '../src/scenario/core.mjs';
import {checkServiceEvidence} from '../src/scenario/service-core.mjs';
import {checkEvidence} from '../src/scenario/checker.mjs';
const [command='verify',file]=process.argv.slice(2);
if(!file||!['verify','replay','check'].includes(command))throw Error('Usage: node scripts/peer-offline.mjs verify|replay|check scene.json');
const input=await readFile(file,'utf8');if(Buffer.byteLength(input)>100*1024*1024)throw Error('PACKAGE_TOO_LARGE');
const b=JSON.parse(input);if(b.format!=='web3-agent-scenario'||b.version!==2)throw Error('SCENARIO_FORMAT_V2_REQUIRED');
const m=JSON.parse(b.files['manifest.json']);let checked=0;
for(const [name,entry]of Object.entries(m.files)){
  if(typeof b.files[name]!=='string'||hash(b.files[name])!==entry.sha256||Buffer.byteLength(b.files[name])!==entry.bytes)throw Error('INTEGRITY_FAILED '+name);checked++;
}
const events=b.files['raw/events.jsonl'].trim().split('\n').map(JSON.parse),ids=new Set();
for(const [i,e]of events.entries()){
  if(e.logicalClock!==i+1||ids.has(e.eventId)||e.scenarioId!==b.scenarioId||e.episodeId!==b.episodeId)throw Error('EVENT_IDENTITY_OR_SEQUENCE');
  for(const cause of e.causalEventIds)if(!ids.has(cause))throw Error('UNRESOLVED_CAUSE '+cause);
  ids.add(e.eventId);if(!m.files[e.payloadRef.path]||hash(b.files[e.payloadRef.path])!==e.payloadRef.sha256)throw Error('PAYLOAD_REFERENCE');
}
if(command==='verify')console.log(json({verified:true,files:checked,events:events.length,note:'Internal integrity only; not publisher authentication.'}));
if(command==='replay')for(const e of events)console.log(`${e.logicalClock}\t${e.agentId??'scene'}\t${e.type}\t${e.eventId}`);
if(command==='check'){
  const e=events.filter(e=>e.type==='check.evidence').at(-1);if(!e)throw Error('CHECK_EVIDENCE_UNAVAILABLE');
  const evidence=JSON.parse(b.files[e.payloadRef.path]);const result=evidence.spec.template==='service_purchase'?checkServiceEvidence(evidence):checkEvidence(evidence);console.log(json(result));
  if(result.status!=='success')process.exitCode=2;
}
