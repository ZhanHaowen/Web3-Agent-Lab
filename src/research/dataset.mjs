import { createHash } from 'node:crypto';
import { validatePublicObserver } from '../observer/index.mjs';
import { extractPublicFeatures } from '../observer/features.mjs';
const hash=x=>createHash('sha256').update(String(x)).digest('hex');
const outcome=t=>t.taskOutcome??'unknown';

// Runtime ports, sampling seeds, temperatures and manifest timestamps are not different models.
// When a weights hash is available it also groups aliases of the same local weights together.
export function modelGroupIdentity(identity={}) {
  const weights=identity?.localRuntime?.modelSha256??identity?.modelSha256;
  if(typeof weights==='string'&&weights.trim())return JSON.stringify({weightsSha256:weights.trim().toLowerCase()});
  return JSON.stringify({provider:identity?.provider??'unknown',model:identity?.model??'unknown'});
}

/** Private evaluator artifact. It intentionally contains truth and MUST NOT be an attacker export. */
export function makeDataset({samples,seed='research-v1',splitRatios=[0.6,0.2,0.2],groupBy='instance',featureOptions={}}) {
  if(!Array.isArray(samples)||!samples.length)throw Error('DATASET_EMPTY');
  if(!['instance','template','model','group'].includes(groupBy))throw Error('DATASET_GROUP_BY');
  if(splitRatios.length!==3||splitRatios.some(v=>!Number.isFinite(v)||v<0)||Math.abs(splitRatios.reduce((a,b)=>a+b,0)-1)>1e-9||splitRatios[0]===0)throw Error('DATASET_SPLIT_RATIOS');
  const ids=new Set(),rows=samples.map((s,i)=>{
    const id=s.sampleId??'sample-'+i;if(ids.has(id))throw Error('DATASET_DUPLICATE_ID');ids.add(id);
    if(!s.truth?.task?.family||s.truth.budgetBase==null||!s.truth.strategy)throw Error('DATASET_TRUTH_REQUIRED');
    const valid=validatePublicObserver(s.observer);if(!valid.ok)throw Error('DATASET_OBSERVER_'+valid.issues[0]);
    const t=s.truth,instance=t.task.instanceId;if(groupBy==='instance'&&!instance)throw Error('DATASET_INSTANCE_REQUIRED');
    const base=groupBy==='instance'?`${t.task.family}:${instance}`:groupBy==='template'?`${t.task.family}:${t.task.templateVersion??'unspecified'}`:groupBy==='model'?modelGroupIdentity(t.modelIdentity):s.groupId;
    if(!base)throw Error('DATASET_GROUP_REQUIRED');
    if(!Number.isSafeInteger(t.tokenDecimals)||t.tokenDecimals<0||t.tokenDecimals>30||!/^[0-9]+$/.test(String(t.budgetBase)))throw Error('DATASET_BUDGET');
    const budget=Number(t.budgetBase)/10**t.tokenDecimals;if(!Number.isFinite(budget))throw Error('DATASET_BUDGET_RANGE');
    return {sampleId:id,splitGroup:String(base),cloneGroup:s.cloneGroup??null,observerSha256:s.observer.provenance.contentSha256,features:extractPublicFeatures(s.observer,featureOptions),labels:{task:t.task.family,strategy:t.strategy,budget,budgetBase:String(t.budgetBase),tokenDecimals:t.tokenDecimals,outcome:outcome(t)},split:null};
  });
  // Group identity, repeated chain projections and explicitly declared clones form connected components.
  const parent=rows.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
  const seen=new Map();rows.forEach((r,i)=>{for(const k of ['group:'+r.splitGroup,'observer:'+r.observerSha256,...(r.cloneGroup?['clone:'+r.cloneGroup]:[])]){if(seen.has(k))parent[find(i)]=find(seen.get(k));else seen.set(k,i);}});
  const components=new Map();rows.forEach((r,i)=>{const root=find(i);if(!components.has(root))components.set(root,[]);components.get(root).push(r);});
  const groups=[...components.values()].map(g=>({id:hash(g.map(r=>r.splitGroup).sort().join('|')),rows:g})).sort((a,b)=>hash(seed+a.id).localeCompare(hash(seed+b.id)));
  const n=groups.length,trainN=Math.max(1,Math.floor(n*splitRatios[0])),valN=Math.floor(n*splitRatios[1]);
  groups.forEach((g,i)=>g.rows.forEach(r=>{r.componentId=g.id;r.split=i<trainN?'train':i<trainN+valN?'validation':'test';}));
  return {schema:'web3-private-inference-dataset-v1',visibility:'private-evaluator-only',seed:String(seed),groupBy,splitRatios,featureOptions,rows,retention:{inputSamples:samples.length,retainedSamples:rows.length,failedOrUnknown:rows.filter(r=>!['success','completed'].includes(r.labels.outcome)).length,filter:'none'},splitCounts:Object.fromEntries(['train','validation','test'].map(k=>[k,rows.filter(r=>r.split===k).length])),warnings:n<5?['Small group count: validation/test coverage may be empty; do not interpret metrics as a research conclusion.']:[]};
}

export function assertSplitIsolation(dataset) {
  const maps=new Map();
  for(const r of dataset.rows){for(const k of ['component:'+r.componentId,'group:'+r.splitGroup,'observer:'+r.observerSha256,...(r.cloneGroup?['clone:'+r.cloneGroup]:[])]){if(maps.has(k)&&maps.get(k)!==r.split)throw Error('DATASET_SPLIT_LEAKAGE');maps.set(k,r.split);}}
  return true;
}
