// Opt-in real neural inference. Requires a running platform and explicitly imported
// pinned assets. Does not download, supply a cloud key, or substitute scripted tools.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.LAB_TEST_BASE_URL??'http://127.0.0.1:4531';
const out=resolve(root,process.env.LAB_TEST_ARTIFACT_DIR??'artifacts/test-results/v016/real-local');
await mkdir(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let token;
async function api(route,body){const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...(token?{'x-lab-token':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(180000)});const text=await response.text();if(!response.ok)throw Error(`HTTP_${response.status}:${route}:${text.slice(0,500)}`);return JSON.parse(text);}
const summary={version:'V0.16.0',startedAt:new Date().toISOString(),scope:'Real managed local Qwen3 4B and Anvil; platform integrity and model task outcome are separate',runs:[]};
const save=async()=>writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const guidance='You operate a local Web3 experiment using only the supplied tools. Execute actual tool calls; never narrate simulated results. Read each tool result before choosing the next call. All tool amount parameters are human-readable decimal strings, never base units. Before an operation that pulls ERC20 tokens (including an AMM swap and a Vault deposit), inspect the allowance for the relevant token and spender and approve that spender if needed. Approval is not the requested swap or deposit: execute the requested operation after its approval. For a composed task, continue until every requested stage has successful chain evidence. After a revert, inspect relevant state and errors before deciding whether to retry. Never repeat a successful operation. Preserve exact observation values and required string types in final answers. A separate checker judges chain state. If unable to complete, report that accurately.';
async function runTask(taskId,round,profile,experimentMode='independent',rerunId){
 const name=`${profile}-${experimentMode}-${round}-${taskId}${rerunId?'-rerun':''}`,start=Date.now();
 const row={name,taskId,round,profile,experimentMode};summary.runs.push(row);await save();
 try{
  const model={provider:'local',temperature:0,maxSteps:12,maxOutputTokens:768,requestTimeoutMs:120000,...(profile==='workflow-guidance'?{systemPrompt:guidance}:{})};
  const created=await api(rerunId?`/api/runs/${rerunId}/rerun`:'/api/runs',rerunId?{}:{taskId,mode:'llm',experimentMode,model,dataOrigin:'real_managed_local_v016_regression'});row.runId=created.runId;
  let done=false;while(Date.now()-start<300000){const state=await api('/api/status');if(!state.busy&&state.active?.runId===row.runId){done=true;break;}await sleep(200);}
  if(!done){row.watchdogCancelled=true;await api('/api/control',{action:'cancel'});for(let n=0;n<100;n++){if(!(await api('/api/status')).busy){done=true;break;}await sleep(200);}if(!done)throw Error('REAL_MODEL_CANCEL_DID_NOT_FINISH');}
  const run=await api(`/api/runs/${row.runId}`),bundle=await api(`/api/runs/${row.runId}/export`);
  const file=join(out,name+'.json');await writeFile(file,JSON.stringify(bundle));
  row.taskStatus=run.result?.status;row.runError=run.result?.run_error??null;row.costs=run.result?.costs;row.failedAssertions=(run.result?.assertions??[]).filter(a=>!a.passed);
  const events=run.events??[],requests=events.filter(e=>e.type==='model.request'),responses=events.filter(e=>e.type==='model.response'),native=events.filter(e=>e.type==='model.runtime_evidence');
  row.eventCounts=Object.fromEntries([...new Set(events.map(e=>e.type))].map(type=>[type,events.filter(e=>e.type===type).length]));
  row.requestCount=requests.length;row.responseCount=responses.length;row.rawBodiesValid=[...requests,...responses].every(e=>typeof e.payload?.body==='string'&&sha(e.payload.body)===e.payload.capture?.recordedBodySha256);
  row.managedLocalIdentity=requests.length>0&&requests.every(e=>e.payload.provider==='local'&&e.payload.backend?.localRuntime?.modelSha256==='af6e43ab13611311226e6f809f6a39b1a87b6df613bbf79468059f92ce819c4a');
  row.nativeEvidenceCount=native.length;
  row.bundleVerification=bundle.verification?.valid===true;
  const verification=spawnSync(process.execPath,[join(root,'dist/cli.mjs'),'verify',file],{cwd:root,encoding:'utf8',windowsHide:true});
  row.offlineVerifyExit=verification.status;await writeFile(join(out,name+'.verify.log'),verification.stdout+verification.stderr);
  const check=spawnSync(process.execPath,[join(root,'dist/cli.mjs'),'check',file],{cwd:root,encoding:'utf8',windowsHide:true});
  row.offlineCheckExit=check.status;await writeFile(join(out,name+'.check.log'),check.stdout+check.stderr);
  // A failed model task must also fail its independent offline checker, not be
  // silently relabelled as a platform failure or made successful by fallback.
  let offlineResult;try{offlineResult=JSON.parse(check.stdout);}catch{}
  row.offlineTaskStatus=offlineResult?.status;
  row.checkerConsistent=[0,2].includes(check.status)&&offlineResult?.status===row.taskStatus;
  row.platformPass=row.rawBodiesValid&&row.managedLocalIdentity&&row.bundleVerification&&verification.status===0&&row.checkerConsistent&&native.length>0;
  row.bundle=name+'.json';
 }catch(error){row.harnessError=error.stack;row.platformPass=false;}
 row.elapsedMs=Date.now()-start;await save();console.log(JSON.stringify(row));return row;
}
try{
 const health=await api('/api/health');token=health.csrfToken;summary.build=health.version;
 const state=await api('/api/local-model/status');summary.runtime=state;
 if(state.state!=='ready'&&state.status!=='ready')await api('/api/local-model/start',{});
 await api('/api/environment/init',{});await api('/api/environment/automine',{enabled:true});
 const rounds=Number(process.env.LAB_REAL_ROUNDS??3);
 for(let round=1;round<=rounds;round++)for(const task of ['balance','transfer','approve','swap','swap_deposit'])await runTask(task,round,'default');
 for(const task of ['balance','transfer','approve','swap','swap_deposit'])await runTask(task,1,'workflow-guidance');
 const balance=summary.runs.find(r=>r.taskId==='balance'&&r.profile==='default'&&r.platformPass);if(balance)await runTask('balance',1,'default','independent',balance.runId);
 await api('/api/environment/reset',{});
 for(const task of ['balance','transfer','approve','swap','swap_deposit'])await runTask(task,1,'workflow-guidance','continuous');
}catch(error){summary.harnessError=error.stack;process.exitCode=1;}
finally{
 summary.endedAt=new Date().toISOString();summary.counts={platformPass:summary.runs.filter(r=>r.platformPass).length,modelSuccess:summary.runs.filter(r=>r.taskStatus==='success').length,total:summary.runs.length};
 if(summary.runs.some(r=>!r.platformPass))process.exitCode=1;await save();console.log(JSON.stringify({event:'real-local-complete',counts:summary.counts,harnessError:summary.harnessError}));
}
