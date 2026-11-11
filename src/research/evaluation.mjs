import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertSplitIsolation } from './dataset.mjs';
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const median=a=>{if(!a.length)return null;const v=[...a].sort((x,y)=>x-y),i=Math.floor(v.length/2);return v.length%2?v[i]:(v[i-1]+v[i])/2;};
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const UNKNOWN='__unknown__';
export function buildAttackInput(dataset,{rejectThreshold=null,targetValidationRisk=0.2,budgetCoverage=0.9,k=3}={}) {
  assertSplitIsolation(dataset);const input={schema:'web3-isolated-attack-input-v1',train:[],validation:[],test:[],options:{rejectThreshold,targetValidationRisk,budgetCoverage,k}},privateMapping={};
  dataset.rows.forEach((r,i)=>{const sampleId='s'+i;privateMapping[sampleId]=r.sampleId;const row={sampleId,features:structuredClone(r.features)};if(r.split!=='test')row.labels={task:r.labels.task,strategy:r.labels.strategy,budget:r.labels.budget};if(!input[r.split])throw Error('DATASET_SPLIT');input[r.split].push(row);});
  return {input,privateMapping};
}
function classMetrics(rows,predictions,key,trainLabels) {
  const mapped=rows.map(r=>trainLabels.has(r.labels[key])?r.labels[key]:UNKNOWN),labels=[...new Set([...mapped,...predictions.map(p=>p.predicted)])].sort(),matrix=Object.fromEntries(labels.map(a=>[a,Object.fromEntries(labels.map(b=>[b,0]))]));
  for(let i=0;i<rows.length;i++)matrix[mapped[i]][predictions[i].predicted]++;
  const perClass=labels.map(label=>{const tp=matrix[label][label],fp=labels.reduce((s,l)=>s+(l===label?0:matrix[l][label]),0),fn=labels.reduce((s,l)=>s+(l===label?0:matrix[label][l]),0),precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0;return {label,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0,support:labels.reduce((s,l)=>s+matrix[label][l],0)};});
  const accepted=predictions.map((p,i)=>({p,i})).filter(x=>x.p.predicted!==UNKNOWN),unknownCount=mapped.filter(x=>x===UNKNOWN).length;
  const known=predictions.map((p,i)=>({p,i})).filter(({i})=>mapped[i]!==UNKNOWN);
  return {n:rows.length,labels,confusionMatrix:matrix,perClass,macroF1:mean(perClass.map(c=>c.f1)),macroF1Scope:'union of observed truth and predicted labels, including unknown; rejection of unseen labels is not recovery of their original class',accuracy:mean(predictions.map((p,i)=>Number(p.predicted===mapped[i]))),knownLabelCount:known.length,knownLabelAccuracy:mean(known.map(({p,i})=>Number(p.predicted===mapped[i]))),unknownOnlyTest:rows.length>0&&known.length===0,coverage:rows.length?accepted.length/rows.length:null,selectiveRisk:mean(accepted.map(({p,i})=>Number(p.predicted!==mapped[i]))),unknownCount,unknownRejectionRate:unknownCount?predictions.filter((p,i)=>mapped[i]===UNKNOWN&&p.predicted===UNKNOWN).length/unknownCount:null};
}
/** Child process gets no test truth. Parent joins private labels only after predictions return. */
export function evaluateDataset(dataset,options={}) {
  const {input,privateMapping}=buildAttackInput(dataset,options),serialized=JSON.stringify(input);
  const child=spawnSync(process.execPath,[fileURLToPath(new URL('../observer/attack-worker.mjs',import.meta.url))],{input:serialized,encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:20_000_000,env:{...(process.env.SystemRoot?{SystemRoot:process.env.SystemRoot}:{})}});
  if(child.error||child.status!==0)throw Error('ATTACK_WORKER_FAILED '+(child.error?.code??child.stderr.slice(0,200)));
  const output=JSON.parse(child.stdout),test=dataset.rows.filter(r=>r.split==='test'),classification={};
  const join=predictions=>{if(predictions.length!==test.length)throw Error('ATTACK_PREDICTION_COUNT');const map=new Map(predictions.map(p=>[privateMapping[p.sampleId],{...p,sampleId:privateMapping[p.sampleId]}]));return test.map(r=>{const p=map.get(r.sampleId);if(!p)throw Error('ATTACK_PREDICTION_IDENTITY');return p;});};
  for(const key of ['task','strategy']){const model=output.classification[key],predictions=join(model.predictions);classification[key]={...model,...classMetrics(test,predictions,key,new Set(model.trainingClasses)),predictions};}
  const bp=join(output.budget.predictions).map((p,i)=>({...p,truth:test[i].labels.budget,covered:test[i].labels.budget>=p.lower&&(p.upper===null||test[i].labels.budget<=p.upper),width:p.upper===null?null:p.upper-p.lower}));
  const trainBudgets=input.train.map(r=>r.labels.budget),constantPrediction=median(trainBudgets),constantMAE=mean(bp.map(p=>Math.abs(constantPrediction-p.truth))),distinctTrainBudgets=new Set(trainBudgets).size,distinctTestBudgets=new Set(bp.map(p=>p.truth)).size;
  return {schema:'web3-private-inference-evaluation-v1',visibility:'private-evaluator-only',observerWindowAssumption:{kind:'oracle-window',source:'researcher-selected public block range',automaticTaskSegmentation:false},splitCounts:{train:input.train.length,validation:input.validation.length,test:test.length},classification,budget:{...output.budget,units:'human token units from private truth decimals',mae:mean(bp.map(p=>Math.abs(p.predicted-p.truth))),constantMedianBaseline:{prediction:constantPrediction,mae:constantMAE},distinctTrainBudgets,distinctTestBudgets,empiricalCoverage:mean(bp.map(p=>Number(p.covered))),meanIntervalWidth:bp.some(p=>p.width===null)?null:mean(bp.map(p=>p.width)),predictions:bp},attackInput:{schema:input.schema,sha256:hash(serialized),bytes:Buffer.byteLength(serialized),testFields:['sampleId','features'],testTruthPassed:false,identity:'anonymous sequential identifiers',isolation:output.inputIsolation},retention:dataset.retention,warnings:[...(dataset.warnings??[]),...Object.entries(classification).filter(([_k,c])=>c.unknownOnlyTest).map(([key])=>key+': all test labels are unseen in training; open-set rejection scores do not measure recovery of task/strategy labels.'),...(distinctTrainBudgets<2||distinctTestBudgets<2?['Budget labels lack variation in train or test; low MAE cannot establish private-budget inference.']:[]),'Oracle-window condition: researcher-selected public block range; automatic task segmentation is not implemented.','Small constructed datasets, correlated histories and distribution shift do not imply a statistical coverage guarantee.','Failed/unknown episodes remain included. This baseline is not an optimal attacker or universal privacy guarantee.']};
}
export function evaluateNegativeControls(dataset,options={}) {
  const empty=structuredClone(dataset);for(const r of empty.rows)r.features={};
  const shuffled=structuredClone(dataset);
  for(const split of ['train','validation','test']){const rows=shuffled.rows.filter(r=>r.split===split),labels=rows.map(r=>r.labels);for(let i=labels.length-1;i>0;i--){const j=parseInt(hash(dataset.seed+':'+split+':'+i).slice(0,8),16)%(i+1);[labels[i],labels[j]]=[labels[j],labels[i]];}rows.forEach((r,i)=>r.labels=labels[i]);}
  return {emptyFeatures:evaluateDataset(empty,options),shuffledLabels:evaluateDataset(shuffled,options),note:'Negative controls are diagnostic, with no fixed expected accuracy assertion. Label permutations stay inside each split.'};
}
