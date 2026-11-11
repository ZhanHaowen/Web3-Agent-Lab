/** Opt-in actual pinned Qwen + actual Anvil payments. No commercial API key,
 * scripted fallback, or fabricated successful task completion. */
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {LocalModelService} from '../src/local-model/service.mjs';
import {runResearchExperiment} from '../src/research/engine.mjs';
import {createPaymentEnvironment} from '../src/payments/index.mjs';
import {createEscrowEnvironment} from '../src/research/escrow.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), stamp=new Date().toISOString().replace(/[:.]/g,'-');
if(process.argv.includes('--help')){console.log('LAB_LOCAL_CONFIG=<existing pinned config.json> LAB_LOCAL_TEST_PORT=8496 LAB_RESEARCH_TEST_OUT=<fresh evidence directory> runtime/node.exe tests/research-local-model.mjs');process.exit(0);}
const sourceConfig=resolve(process.env.LAB_LOCAL_CONFIG??join(root,'../v016-data/local-model/config.json'));
const out=resolve(process.env.LAB_RESEARCH_TEST_OUT??join(root,'artifacts/test-results/research-local-'+stamp));
const data=resolve(process.env.LAB_LOCAL_TEST_DATA??join(root,'data-research-llm-test',stamp));
const config=JSON.parse(await readFile(sourceConfig,'utf8'));config.port=Number(process.env.LAB_LOCAL_TEST_PORT??8496);
await mkdir(join(data,'local-model'),{recursive:true});await writeFile(join(data,'local-model/config.json'),JSON.stringify(config,null,2),{flag:'wx'});await mkdir(out,{recursive:true});
const local=new LocalModelService({dataDir:data}), sha=x=>createHash('sha256').update(x).digest('hex');
const sourceFiles=['src/research/engine.mjs','src/research/workload.mjs','src/research/catalog.mjs','src/research/manifest.mjs','src/research/private-ledger.mjs','src/research/journal.mjs','src/research/provenance.mjs','src/research/checker.mjs','src/research/escrow.mjs','src/payments/index.mjs','src/payments/ap2.mjs','src/observer/index.mjs'];
const sourceHashes=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,sha(await readFile(join(root,file)))])));
const report={schema:'research-real-local-report-v1',startedAt:new Date().toISOString(),out,data,sourceHashes,noScriptedFallback:true,modelAbilitySeparateFromPlatform:true,cases:[]};
const save=()=>writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
try{
 await local.initialized;await local.start();report.runtime={...local.status(),config:undefined};await save();
 const cases=[{family:'evidence_review',scheme:'exact'},{family:'risk_analysis',scheme:'batch'},{family:'trend_analysis',scheme:'erc8183'}];
 for(const [index,item] of cases.entries()){
  const row={...item,startedAt:new Date().toISOString()},runDir=join(out,item.family+'-'+item.scheme);report.cases.push(row);await save();
  const input={seed:113+index,task:{family:item.family,instanceId:'real-qwen-'+index,difficulty:3},mode:'llm',strategy:'adaptive',budgetBase:'150000',initialBalanceBase:'1000000',maxSteps:14,
   model:{provider:'local',temperature:0,maxOutputTokens:768,requestTimeoutMs:120000},payment:{scheme:item.scheme}};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),900000);
  try{
   row.summary=await runResearchExperiment(input,{outDir:runDir,root,paymentDataDir:join(data,'payments-'+index),signal:controller.signal,
    paymentFactory:options=>options.scheme==='erc8183'?createEscrowEnvironment(options):createPaymentEnvironment(options),
    modelResolver:model=>local.resolveModel(model),captureRuntimeEvidence:(model,cursor)=>local.captureEvidence(model,cursor),runtimeEvidenceCursor:()=>local.evidenceCursor(),softwareIdentity:{sourceHashes}});
   const events=(await readFile(join(runDir,'raw/events.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
   const rows=await Promise.all(events.map(async event=>({event,payload:JSON.parse(await readFile(join(runDir,event.payloadRef.path),'utf8'))})));
   const requests=rows.filter(r=>r.event.type==='model.request'),responses=rows.filter(r=>r.event.type==='model.response'),errors=rows.filter(r=>r.event.type==='model.error'),native=rows.filter(r=>r.event.type==='model.runtime_evidence');
   row.modelRequests=requests.length;row.modelResponses=responses.length;row.modelErrors=errors.length;
   row.nativeFiles=native.flatMap(r=>r.payload.files??[]).map(f=>typeof f.content==='string'?{role:f.role,bytes:Buffer.from(f.content,'base64').length,shaMatches:sha(Buffer.from(f.content,'base64'))===f.sha256}:{role:f.role,unavailable:f.unavailable??'missing content'});
   row.requiredRuntimeEvidence=['manifest','props','events'].every(role=>row.nativeFiles.some(f=>f.role===role&&f.shaMatches===true));
   row.rawBodiesValid=[...requests,...responses].every(r=>typeof r.payload.body==='string'&&sha(r.payload.body)===r.payload.capture.recordedBodySha256);
   row.callTerminalCoverage=requests.every(r=>[...responses,...errors].some(t=>t.payload.modelCallId===r.payload.modelCallId));
   row.localOnly=requests.length>0&&requests.every(r=>r.payload.provider==='local'&&r.payload.backend.localRuntime.modelSha256===config.modelSha256);
   row.platformPass=row.summary.recordingComplete&&row.summary.checkerStatus==='pass'&&row.rawBodiesValid&&row.callTerminalCoverage&&row.localOnly&&native.length===1&&row.requiredRuntimeEvidence&&row.nativeFiles.filter(f=>f.bytes!==undefined).every(f=>f.shaMatches);
   row.taskOutcome=row.summary.taskOutcome;
   assert.ok(row.platformPass,'native capture / observer / independent checker must all validate');
  }catch(error){row.error=error.stack;row.platformPass=false;process.exitCode=1;}finally{clearTimeout(timer);row.finishedAt=new Date().toISOString();await save();}
  console.log(JSON.stringify({family:item.family,scheme:item.scheme,platformPass:row.platformPass,taskOutcome:row.taskOutcome,modelRequests:row.modelRequests,modelErrors:row.modelErrors,error:row.error}));
 }
}catch(error){report.error=error.stack;process.exitCode=1;}
finally{await local.shutdown();report.finishedAt=new Date().toISOString();report.ownedModelStopped=!local.status().running;report.platformPass=!report.error&&report.cases.length===3&&report.cases.every(r=>r.platformPass);await save();console.log(JSON.stringify({report:join(out,'report.json'),platformPass:report.platformPass,ownedModelStopped:report.ownedModelStopped,error:report.error}));}
