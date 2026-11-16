// Local review gate. Never publishes, downloads a model or submits public-chain
// transactions. Every integration suite owns its local service/data directory.
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {resolve,dirname,join,delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
const freePort=async()=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));return port;};
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const out=resolve(process.env.LAB_REGRESSION_OUT??join(root,'artifacts/test-results/testnet-review-'+stamp));
await mkdir(out,{recursive:true});
if(process.version!=='v24.19.0')throw Error('Use pinned runtime/node.exe v24.19.0 for this review gate.');
const steps=[
 ['01-budget-build',['scripts/compile-budget.mjs']],
 ['02-platform-build',['--run','build']],
 ['03-doctor',['dist/cli.mjs','doctor']],
 ['04-typecheck',['node_modules/typescript/bin/tsc','-p','tsconfig.control.json','--noEmit']],
 ['05-unit',['--test','tests/*.test.mjs']],
 ['06-legacy-source',['--import','./scripts/register-agentkit.mjs','--import','tsx','--test','tests/*.test.ts']],
 ['07-testnet-integration',['tests/testnet-integration.mjs']],
 ['08-original-api',['tests/legacy-regression-wrapper.mjs']],
 ['09-allowance-matrix',['tests/legacy-allowance-matrix.mjs']],
 ['10-peer-contract',['tests/peer-contract.mjs']],
 ['11-peer-integration',['tests/peer-integration.mjs']],
 ['12-independent-workers',['tests/v2-integration.mjs']],
 ['13-worker-shutdown-recovery',['tests/v2-shutdown-recovery.mjs']],
 ['14-service-contract',['tests/service-contract.mjs']],
 ['15-service-integration',['tests/service-integration.mjs']],
 ['16-budget-core',['tests/budget-integration.mjs']],
 ['17-budget-parameters',['tests/budget-parameter-matrix.mjs']],
 ['18-budget-main',['tests/budget-main-integration.mjs']],
 ['19-budget-http',['tests/budget-http.mjs']],
 ['20-windows-launcher',['tests/budget-launcher.mjs']],
 ['21-x402-ap2',['tests/research-payments.mjs']],
 ['22-mpp',['tests/research-payments-mpp.mjs']],
 ['23-payment-adversarial',['tests/research-payments-adversarial.mjs']],
 ['24-research-escrow',['tests/research-escrow.mjs']],
 ['25-research-engine',['tests/research-integration.mjs']],
 ['26-research-dataset',['tests/research-dataset-smoke.mjs']],
];
const selected=process.env.LAB_REGRESSION_STEPS?.split(',');
const report={schema:'testnet-local-review-regression-v1',startedAt:new Date().toISOString(),
 baselineCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),
 branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),
 node:process.version,platform:process.platform,arch:process.arch,out,
 scope:'Windows local isolated integration and regression. No real testnet broadcasts, no GitHub update. Actual model and GUI runs reported separately.',
 selectedSteps:selected??null,steps:[]};
const save=()=>writeFile(join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
for(const [name,args]of steps){
 if(selected&&!selected.includes(name))continue;
 const data=join(out,'isolated',name),artifacts=join(out,'results',name);
 await mkdir(data,{recursive:true});await mkdir(artifacts,{recursive:true});
 const logPath=join(out,name+'.log'),log=createWriteStream(logPath,{flags:'wx'});
 const startedAt=new Date().toISOString(),start=performance.now();
 const env={...process.env,PATH:dirname(process.execPath)+delimiter+process.env.PATH,
  LAB_ROOT:root,LAB_LIBRARY_ONLY:'',LAB_AGENT_WORKER:'',ANVIL_PATH:join(root,'runtime',process.platform==='win32'?'anvil.exe':'anvil'),
  LAB_DATA_DIR:data,LAB_TEST_DATA_DIR:data,LAB_TEST_ARTIFACT_DIR:artifacts,
  LAB_RESEARCH_TEST_OUT:join(artifacts,'research'),LAB_TESTNET_TEST_OUT:join(artifacts,'testnet'),TESTNET_TEST_OUTPUT:join(artifacts,'testnet')};
 const cwd=name==='06-legacy-source'?join(root,'vendor/legacy-source'):root;
 if(name==='06-legacy-source')env.LAB_ROOT=cwd;
 delete env.LAB_TEST_PORT;delete env.LAB_TEST_CHAIN_PORT;
 // Worker recovery deliberately preserves its owned chain across server exits.
 // Fresh ports make repeated review runs independent of that previous instance.
 if(['12-independent-workers','13-worker-shutdown-recovery'].includes(name)){
  env.LAB_TEST_PORT=String(await freePort());env.LAB_TEST_CHAIN_PORT=String(await freePort());
 }
 console.log('START '+name);
 let tail='',timedOut=false,launchError=null;
 const child=spawn(process.execPath,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log.write(chunk);tail=(tail+chunk.toString()).slice(-16000);});
 child.once('error',error=>{launchError=error.message;});
 const timer=setTimeout(()=>{timedOut=true;child.kill();},20*60*1000);
 const exit=await new Promise(ok=>child.once('close',(code,signal)=>ok({code,signal})));
 clearTimeout(timer);await new Promise(ok=>log.end(ok));
 const bytes=await readFile(logPath);
 const match=key=>{const matches=[...tail.matchAll(new RegExp('(?:# |ℹ )'+key+' (\\d+)','g'))];return matches.length?Number(matches.at(-1)[1]):null;};
 const item={name,command:[process.execPath,...args],cwd,startedAt,finishedAt:new Date().toISOString(),elapsedMs:Math.round(performance.now()-start),
  exitCode:exit.code,signal:exit.signal,timedOut,launchError,passed:exit.code===0&&!timedOut&&!launchError,
  counts:{tests:match('tests'),pass:match('pass'),fail:match('fail'),skipped:match('skipped')},
  log:logPath,logSha256:createHash('sha256').update(bytes).digest('hex'),artifacts};
 report.steps.push(item);await save();console.log(JSON.stringify({name,passed:item.passed,exitCode:item.exitCode,counts:item.counts,elapsedMs:item.elapsedMs}));
 if(!item.passed)console.log(tail.slice(-4000));
 if(!item.passed&&name==='02-platform-build'){report.buildBlocked=true;break;}
}
try{const build=JSON.parse(await readFile(join(root,'build-info.json'),'utf8'));report.build={sourceHash:build.sourceHash,builtAt:build.builtAt,version:build.version};}catch{}
report.finishedAt=new Date().toISOString();report.passed=report.steps.length>0&&report.steps.every(s=>s.passed);
report.passedSteps=report.steps.filter(s=>s.passed).length;report.failedSteps=report.steps.filter(s=>!s.passed).length;
await save();console.log(JSON.stringify({report:join(out,'summary.json'),passed:report.passed,passedSteps:report.passedSteps,failedSteps:report.failedSteps}));
if(!report.passed)process.exitCode=1;
