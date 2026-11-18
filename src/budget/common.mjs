import {AMOUNT_PATTERN,clone,stringify,units} from '../../public/budget-evidence.js';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {normalizePolicy} from './policy.mjs';
function chatCompletionEndpoint(baseUrl) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error('MODEL_ENDPOINT'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('MODEL_ENDPOINT');
  if (url.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('REMOTE_MODEL_REQUIRES_HTTPS');
  url.pathname = url.pathname.replace(/\/$/, '').replace(/\/chat\/completions$/, '') + '/chat/completions';
  return url.toString();
}
export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export {AMOUNT_PATTERN,clone,stringify,units};
export const sha=value=>createHash('sha256').update(typeof value==='string'?value:stringify(value)).digest('hex');
export const human=n=>{const x=BigInt(n);return (x/1000000n)+'.'+(x%1000000n).toString().padStart(6,'0');};
export function config(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('CONFIG_OBJECT');
 const allowed=['mode','initial','budget','task','maxSteps','model','wallet','taskGoal','policy','sample'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))throw Error('UNKNOWN_CONFIG_FIELD');
 const {mode='unified',initial='200',budget='100',task,maxSteps=8,model}=input;
 if(mode!=='unified')throw Error('CONFIG_ENUM');
 if(units(budget)>units(initial))throw Error('BUDGET_EXCEEDS_BALANCE');
 if(typeof task!=='string'||!task.trim()||task.length>4000)throw Error('BUDGET_TASK_REQUIRED');
 if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>24)throw Error('BUDGET_MODEL_STEP_LIMIT');
 if(!model||typeof model!=='object'||Array.isArray(model)||!['local','api'].includes(model.backend))throw Error('MODEL_BACKEND');
 const fields=model.backend==='local'?['backend','temperature']:['backend','baseUrl','model','temperature'];
 if(Object.keys(model).some(k=>!fields.includes(k)))throw Error('MODEL_CONFIG_FIELDS');
 const normalized={backend:model.backend};
 if(model.temperature!==undefined){
  if(!Number.isFinite(model.temperature)||model.temperature<0||model.temperature>2)throw Error('MODEL_PARAMETER_temperature');
  normalized.temperature=model.temperature;
 }
 if(model.backend==='api'){
  if(typeof model.baseUrl!=='string'||model.baseUrl.length>2048)throw Error('MODEL_ENDPOINT');
  if(typeof model.model!=='string'||!model.model.trim()||model.model.length>200)throw Error('MODEL_NAME');
  chatCompletionEndpoint(model.baseUrl);
  normalized.baseUrl=model.baseUrl.trim();
  normalized.model=model.model.trim();
 }
 const wallet=input.wallet===undefined?{}:input.wallet;
 if(!wallet||typeof wallet!=='object'||Array.isArray(wallet)||Object.keys(wallet).some(key=>!['backend','transfer','permit2','limit'].includes(key)))throw Error('WALLET_CONFIG');
 const {backend='local-eoa',transfer=true,permit2=true,limit=budget}=wallet;
 if(!['local-eoa','smart-account'].includes(backend)||typeof transfer!=='boolean'||typeof permit2!=='boolean')throw Error('WALLET_CONFIG');
 if(units(limit)>units(budget))throw Error('WALLET_LIMIT_EXCEEDS_TASK_BUDGET');
 const result={mode,initial,budget,task:task.trim(),maxSteps,model:normalized,wallet:{backend,transfer,permit2,limit}};
 if(input.policy!==undefined)result.policy=normalizePolicy(input.policy);
 if(input.sample!==undefined){
  const sample=input.sample;
  if(!sample||typeof sample!=='object'||Array.isArray(sample)||
     Object.keys(sample).some(key=>!['kind','screening','candidateId','reference','configurationSource'].includes(key)))throw Error('SAMPLE_CONFIG');
  const {kind='unspecified',screening='undetermined',candidateId='',reference='',configurationSource='operator'}=sample;
  if(!['natural','historical','control','unspecified'].includes(kind)||!['eligible','ineligible','undetermined'].includes(screening)||
     !['operator','confirmed-prefill','fixture'].includes(configurationSource)||
     [candidateId,reference].some(value=>typeof value!=='string'||value.length>400)||
     (['natural','historical'].includes(kind)&&(!candidateId.trim()||!reference.trim())))throw Error('SAMPLE_CONFIG');
  result.sample={kind,screening,candidateId:candidateId.trim(),reference:reference.trim(),configurationSource};
 }
 if(input.taskGoal!==undefined){
  const goal=input.taskGoal;
  if(!goal||typeof goal!=='object'||Array.isArray(goal)||Object.keys(goal).some(key=>!['mode','confirmed','direct','permit2'].includes(key))||
     !Object.hasOwn(goal,'direct')||!Object.hasOwn(goal,'permit2'))throw Error('TASK_GOAL');
  const legacy=Object.keys(goal).length===2;
  if(!legacy&&goal.confirmed!==true)throw Error('TASK_GOAL_CONFIRMATION_REQUIRED');
  const mode=legacy?'exact':goal.mode;
  if(!['exact','cumulative'].includes(mode))throw Error('TASK_GOAL');
  units(goal.direct,true);units(goal.permit2,true);
  result.taskGoal={mode,direct:goal.direct,permit2:goal.permit2,confirmed:true};
 }
 return result;
}
export const PERMIT_TYPES={
 TokenPermissions:[{name:'token',type:'address'},{name:'amount',type:'uint256'}],
 PermitTransferFrom:[{name:'permitted',type:'TokenPermissions'},{name:'spender',type:'address'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]
};
let boundLibrary=null;
export function bindLibrary(lib){boundLibrary=lib;}
export async function library(){
 if(boundLibrary)return boundLibrary;
 process.env.LAB_LIBRARY_ONLY='1';process.env.LAB_AGENT_WORKER='1';process.env.LAB_ROOT=ROOT;
 return import('../../dist/server.mjs');
}
