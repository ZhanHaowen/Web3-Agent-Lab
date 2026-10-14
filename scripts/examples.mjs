import { mkdir, writeFile } from 'node:fs/promises';
const base='http://127.0.0.1:'+(process.env.LAB_PORT||4317);
const health=await(await fetch(base+'/api/health')).json();
const post=async(path,body={})=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-lab-token':health.csrfToken},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;};
if(!(await(await fetch(base+'/api/status')).json()).ready)await post('/api/environment/init');
const cases=[];
for(const taskId of ['balance','transfer','approve','swap','swap_deposit'])for(let i=0;i<3;i++)cases.push({taskId,mode:'scripted',expected:'success',case:'normal'});
for(const faultMode of ['transfer_revert','wrong_recipient'])for(let i=0;i<3;i++)cases.push({taskId:'transfer',mode:'scripted',faultMode,expected:'failure',case:faultMode});
for(let i=0;i<3;i++)cases.push({taskId:'balance',mode:'scripted',toolOverrides:{get_balance:{token:'A',address:'0x0000000000000000000000000000000000000000',balance:'999000000',formatted:'999',blockHash:'0x00'}},expected:'failure',case:'altered_tool_return'});
for(let i=0;i<3;i++)cases.push({taskId:'transfer',mode:'scripted',expected:'pending',case:'manual_pending'});
for(let i=0;i<3;i++)cases.push({taskId:'transfer',mode:'scripted',allowedTools:['get_balance'],expected:'failure',case:'missing_transfer_tool'});
cases.push({taskId:'transfer',mode:'scripted',expected:'success',case:'sequence_start'});
for(const taskId of ['transfer','balance','approve','swap_deposit'])cases.push({taskId,mode:'scripted',experimentMode:'continuous',expected:'success',case:'continuous'});
const summaries=[];await mkdir('examples',{recursive:true});
for(const [index,item] of cases.entries()){
  await post('/api/environment/automine',{enabled:item.expected!=='pending'});
  const {expected,...body}=item;const {runId}=await post('/api/runs',body);
  for(let i=0;i<300;i++){const s=await(await fetch(base+'/api/status')).json();if(!s.busy)break;await new Promise(r=>setTimeout(r,100));}
  const run=await(await fetch(base+'/api/runs/'+runId)).json();
  if(run.result?.status!==expected)throw Error(`${item.case} expected ${expected}, got ${run.result?.status}`);
  const bundle=await(await fetch(base+'/api/runs/'+runId+'/export')).json();
  const filename=`${String(index+1).padStart(2,'0')}-${item.taskId}-${item.case}.json`;
  await writeFile('examples/'+filename,JSON.stringify(bundle,null,2));
  summaries.push({filename,runId,taskId:item.taskId,case:item.case,status:run.result.status,mode:'scripted',experimentMode:run.config.experimentMode,session_id:run.config.session_id,previous_run_id:run.config.previous_run_id,chain_execution:'real_anvil',sourceHash:run.config.build.sourceHash});
  console.log(`${index+1}/${cases.length} ${item.taskId} ${item.case}: ${run.result.status}`);
}
await post('/api/environment/automine',{enabled:true});await post('/api/environment/reset');
await writeFile('examples/index.json',JSON.stringify({description:'Real-Anvil scripted infrastructure demonstrations, including a linked continuous sequence. Not LLM research performance measurements.',createdAt:new Date().toISOString(),runs:summaries},null,2));
