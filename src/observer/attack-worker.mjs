import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const UNKNOWN='__unknown__';
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const median=a=>{const v=[...a].sort((x,y)=>x-y),m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2;};
const distance=(a,b)=>Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i])**2,0)/Math.max(1,a.length));
const keys=(o,allowed)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!allowed.includes(k)))throw Error('ATTACK_INPUT_FIELDS');};
export function validateAttackInput(input) {
  keys(input,['schema','train','validation','test','options']);if(input.schema!=='web3-isolated-attack-input-v1')throw Error('ATTACK_INPUT_SCHEMA');
  keys(input.options,['rejectThreshold','targetValidationRisk','budgetCoverage','k']);
  if(!Number.isSafeInteger(input.options.k)||input.options.k<1||!Number.isFinite(input.options.budgetCoverage)||!(input.options.budgetCoverage>0&&input.options.budgetCoverage<1)||!Number.isFinite(input.options.targetValidationRisk)||!(input.options.targetValidationRisk>=0&&input.options.targetValidationRisk<=1))throw Error('ATTACK_OPTIONS');
  if(input.options.rejectThreshold!==null&&(!Number.isFinite(input.options.rejectThreshold)||!(input.options.rejectThreshold>=0&&input.options.rejectThreshold<=1)))throw Error('ATTACK_THRESHOLD');
  const ids=new Set();for(const split of ['train','validation','test']){
    if(!Array.isArray(input[split]))throw Error('ATTACK_SPLIT');
    for(const r of input[split]){keys(r,split==='test'?['sampleId','features']:['sampleId','features','labels']);if(typeof r.sampleId!=='string'||!/^s[0-9]{1,10}$/.test(r.sampleId)||ids.has(r.sampleId))throw Error('ATTACK_ANONYMOUS_ID');ids.add(r.sampleId);keys(r.features,Object.keys(r.features??{}));for(const v of Object.values(r.features))if(!Number.isFinite(v))throw Error('ATTACK_FEATURE_NONNUMERIC');
      if(split!=='test'){keys(r.labels,['task','strategy','budget']);if(typeof r.labels.task!=='string'||typeof r.labels.strategy!=='string'||r.labels.task===UNKNOWN||r.labels.strategy===UNKNOWN||!Number.isFinite(r.labels.budget)||r.labels.budget<0)throw Error('ATTACK_LABELS');}
    }
  }
  if(!input.train.length)throw Error('ATTACK_NO_TRAIN');return true;
}
/** The input has no test truth or private mapping. Process separation is not an OS sandbox. */
export function runAttackBaseline(input) {
  validateAttackInput(input);const {train,validation,test,options}=input;
  const featureKeys=[...new Set(train.flatMap(r=>Object.keys(r.features)))].sort(),means=featureKeys.map(k=>mean(train.map(r=>r.features[k]??0))),scales=featureKeys.map((k,i)=>Math.sqrt(mean(train.map(r=>((r.features[k]??0)-means[i])**2)))||1);
  const vector=r=>featureKeys.map((k,i)=>((r.features[k]??0)-means[i])/scales[i]);
  const classification={};
  for(const key of ['task','strategy']){
    const labels=[...new Set(train.map(r=>r.labels[key]))].sort(),centroids=labels.map(l=>{const v=train.filter(r=>r.labels[key]===l).map(vector);return featureKeys.map((_,i)=>mean(v.map(x=>x[i])));}),radii=labels.map((l,i)=>Math.max(0.1,...train.filter(r=>r.labels[key]===l).map(r=>distance(vector(r),centroids[i]))));
    const raw=r=>{const d=centroids.map(c=>distance(vector(r),c)),i=d.indexOf(Math.min(...d)),scores=d.map(x=>Math.exp(-(x-d[i])));return {sampleId:r.sampleId,label:labels[i],confidence:scores[i]/scores.reduce((a,b)=>a+b,0),distance:d[i],outsideTrainingRadius:d[i]>radii[i]*1.5+0.5};};
    const apply=(rows,t,rejectAll=false)=>rows.map(r=>{const p=raw(r);return {...p,predicted:rejectAll||p.outsideTrainingRadius||p.confidence<t?UNKNOWN:p.label};});
    let threshold=options.rejectThreshold??0.6,calibration=options.rejectThreshold===null?'default-no-validation':'explicit-fixed-before-test',rejectAll=false;
    if(options.rejectThreshold===null&&validation.length){const candidates=[0,0.4,0.5,0.6,0.7,0.8,0.9,0.95,1].map(t=>{const p=apply(validation,t),accepted=p.map((x,i)=>({x,i})).filter(x=>x.x.predicted!==UNKNOWN);return {t,coverage:accepted.length/p.length,risk:mean(accepted.map(({x,i})=>Number(x.predicted!==validation[i].labels[key])))};}).filter(c=>c.risk!==null&&c.risk<=options.targetValidationRisk).sort((a,b)=>b.coverage-a.coverage||a.t-b.t);threshold=candidates[0]?.t??1;rejectAll=!candidates.length;calibration=rejectAll?'validation-no-acceptable-operating-point':'validation-risk-coverage-selection';}
    classification[key]={method:'training-only-standardized-nearest-centroid',threshold,rejectAll,calibration,trainingClasses:labels,predictions:apply(test,threshold,rejectAll)};
  }
  const budgetPredict=r=>median(train.map(t=>({t,d:distance(vector(r),vector(t))})).sort((a,b)=>a.d-b.d).slice(0,options.k).map(x=>x.t.labels.budget));
  const errors=validation.map(r=>Math.abs(budgetPredict(r)-r.labels.budget)).sort((a,b)=>a-b),rank=Math.ceil((errors.length+1)*options.budgetCoverage),radius=rank>errors.length?Infinity:errors[rank-1];
  return {schema:'web3-isolated-attack-predictions-v1',classification,budget:{method:'k-nearest-neighbour median + validation absolute-error calibration',k:options.k,nominalCoverage:options.budgetCoverage,calibrationSamples:errors.length,intervalKind:Number.isFinite(radius)?'finite-calibrated':'unbounded-insufficient-calibration',predictions:test.map(r=>{const predicted=budgetPredict(r);return {sampleId:r.sampleId,predicted,lower:Math.max(0,predicted-radius),upper:Number.isFinite(radius)?predicted+radius:null};})},inputIsolation:'train/validation allowed labels, test features only; process separation is not an OS security sandbox'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>20_000_000)throw Error('ATTACK_INPUT_SIZE');}process.stdout.write(JSON.stringify(runAttackBaseline(JSON.parse(text))));}
  catch(error){process.stderr.write(error.message);process.exitCode=1;}
}
