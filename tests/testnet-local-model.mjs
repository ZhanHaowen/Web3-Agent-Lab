/** Opt-in actual managed Qwen + an isolated EVM exposed through standard RPC.
 * Never broadcasts to a public network. Model task ability is not platform integrity. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalModelService} from '../src/local-model/service.mjs';
import {startTestnetFixture} from './testnet-fixture.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const out=resolve(process.env.TESTNET_TEST_OUTPUT??join(root,'artifacts/test-results/testnet-local-'+stamp));
const config=JSON.parse(await readFile(process.env.LAB_LOCAL_CONFIG??join(root,'../v016-data/local-model/config.json'),'utf8'));
config.port=Number(process.env.LAB_LOCAL_TEST_PORT??8498);
await mkdir(join(out,'model-data/local-model'),{recursive:true});
await writeFile(join(out,'model-data/local-model/config.json'),JSON.stringify(config,null,2),{flag:'wx'});
const sha=x=>createHash('sha256').update(x).digest('hex');
const local=new LocalModelService({dataDir:join(out,'model-data')});
const report={schema:'testnet-actual-local-model-v1',startedAt:new Date().toISOString(),
 scope:'Actual pinned Qwen inference + real isolated EVM standard-RPC transport; not public-network settlement.',
 noScriptedFallback:true,tests:[],out};
const save=()=>writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
let fixture;
try{
 await local.initialized;
 fixture=await startTestnetFixture({out:join(out,'fixture'),modelResolver:model=>local.resolveModel(model),
  captureRuntimeEvidence:(model,cursor)=>local.captureEvidence(model,cursor),runtimeEvidenceCursor:()=>local.evidenceCursor()});
 for(const taskId of ['balance','transfer','approve','swap','swap_deposit']){
  const row={taskId,startedAt:new Date().toISOString()};report.tests.push(row);await save();
  try{
   // Starting from a stopped managed runtime also exercises the cold-start resolver.
   const created=await fixture.request('/run',{taskId,mode:'llm',model:{provider:'local',temperature:0,maxSteps:16,maxOutputTokens:768,requestTimeoutMs:120000}},202);
   row.runId=created.runId;
   const until=Date.now()+8*60*1000;
   while(fixture.service.busy&&Date.now()<until)await new Promise(r=>setTimeout(r,200));
   if(fixture.service.busy){await fixture.request('/cancel',{id:created.runId},202);row.watchdogCancelled=true;}
   const run=await fixture.waitRun(created.runId),bundle=await fixture.request('/export?id='+created.runId);
   const file=join(out,taskId+'.bundle.json');await writeFile(file,JSON.stringify(bundle));
   const requests=run.events.filter(e=>e.type==='model.request'),responses=run.events.filter(e=>e.type==='model.response'),errors=run.events.filter(e=>e.type==='model.error');
   const native=run.events.filter(e=>e.type==='model.runtime_evidence');
   row.requestCount=requests.length;row.responseCount=responses.length;row.modelErrors=errors.length;
   row.taskStatus=run.result?.status;row.runError=run.result?.run_error??null;row.failedAssertions=(run.result?.assertions??[]).filter(a=>!a.passed);
   row.rawBodiesValid=[...requests,...responses].every(e=>typeof e.payload.body==='string'&&sha(e.payload.body)===e.payload.capture?.recordedBodySha256);
   row.callTerminalCoverage=requests.every(e=>[...responses,...errors].some(t=>t.payload.modelCallId===e.payload.modelCallId));
   row.managedLocalIdentity=requests.length>0&&requests.every(e=>e.payload.provider==='local'&&e.payload.backend?.localRuntime?.modelSha256===config.modelSha256);
   row.nativeEvidenceCount=native.length;row.bundleVerified=bundle.verification?.valid===true;
   row.graphNodes=run.provenance_graph?.nodes?.length??0;row.graphEdges=run.provenance_graph?.edges?.length??0;
   for(const command of ['verify','check']){
    const proc=spawnSync(process.execPath,[join(root,'dist/cli.mjs'),command,file],{cwd:root,encoding:'utf8',windowsHide:true});
    await writeFile(join(out,taskId+'.'+command+'.log'),(proc.stdout??'')+(proc.stderr??''));row[command+'Exit']=proc.status;
    if(command==='check'){try{row.offlineTaskStatus=JSON.parse(proc.stdout).status;}catch{row.offlineTaskStatus=null;}}
   }
   row.platformPass=row.rawBodiesValid&&row.callTerminalCoverage&&row.managedLocalIdentity&&native.length===1&&row.bundleVerified&&row.verifyExit===0&&[0,2].includes(row.checkExit)&&row.offlineTaskStatus===row.taskStatus&&row.graphNodes>0;
  }catch(e){row.platformPass=false;row.error=e.stack;}
  row.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify(row));
 }
}catch(e){report.error=e.stack;process.exitCode=1;}
finally{
 await fixture?.close();await local.shutdown();report.finishedAt=new Date().toISOString();
 report.platformPass=!report.error&&report.tests.length===5&&report.tests.every(t=>t.platformPass);
 report.counts={total:report.tests.length,platformPass:report.tests.filter(t=>t.platformPass).length,modelTaskSuccess:report.tests.filter(t=>t.taskStatus==='success').length};
 report.ownedModelStopped=!local.status().running;await save();
 if(!report.platformPass)process.exitCode=1;console.log(JSON.stringify({report:join(out,'report.json'),...report.counts,platformPass:report.platformPass}));
}
