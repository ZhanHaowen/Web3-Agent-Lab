import {artifactPath,artifactDirectory} from './helpers/artifacts.mjs';
import {spawn} from 'node:child_process';
import {createConnection} from 'node:net';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import os from 'node:os';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const port=19317,chainPort=19357,url=`http://127.0.0.1:${port}`;
const dataDirectory=join(root,'data-acceptance-legacy-'+randomUUID());
const reportDirectory=artifactDirectory('acceptance-legacy');
const build=JSON.parse(await readFile(join(root,'build-info.json'),'utf8'));
const suites=[
 {name:'e2e',file:'scripts/e2e.mjs',report:artifactPath('e2e-results.json')},
 {name:'amount-e2e',file:'scripts/amount-e2e.mjs',report:artifactPath('amount-validation.json')},
 {name:'feedback-e2e',file:'scripts/feedback-e2e.mjs',report:artifactPath('feedback-e2e-results.json')},
 {name:'v013-e2e',file:'scripts/v013-e2e.mjs',report:artifactPath('v013-regression.json')},
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const env={...process.env,LAB_ROOT:root,LAB_DATA_DIR:dataDirectory,LAB_PORT:String(port),LAB_CHAIN_PORT:String(chainPort),EXPECTED_LAB_VERSION:build.displayVersion};
delete env.LAB_LIBRARY_ONLY;delete env.LAB_AGENT_WORKER;
let server,csrf='',owned=false,serverLog='',serverError='',health;
const results=[];
await mkdir(reportDirectory,{recursive:true});

async function availablePort(number){return new Promise((resolve,reject)=>{const socket=createConnection({host:'127.0.0.1',port:number});socket.setTimeout(1200);socket.once('connect',()=>{socket.destroy();reject(Error('ISOLATED_PORT_ALREADY_IN_USE '+number));});socket.once('error',error=>{socket.destroy();if(error.code==='ECONNREFUSED')resolve();else reject(error);});socket.once('timeout',()=>{socket.destroy();reject(Error('ISOLATED_PORT_PROBE_TIMEOUT '+number));});});}
async function api(path,body){const response=await fetch(url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Lab-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(5000)});const value=await response.json();if(!response.ok)throw Error(path+' '+JSON.stringify(value));return value;}
async function boot(){
 await availablePort(port);await availablePort(chainPort);
 server=spawn(process.execPath,[join(root,'dist/server.mjs')],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',b=>{serverLog+=b;if(serverLog.length>2_000_000)serverLog=serverLog.slice(-2_000_000);});
 server.stderr.on('data',b=>{serverError+=b;if(serverError.length>2_000_000)serverError=serverError.slice(-2_000_000);});
 server.on('error',e=>{serverError+='\n'+e.stack;});
 for(let i=0;i<160;i++){
  if(server.exitCode!==null)throw Error('ISOLATED_SERVER_EXIT '+server.exitCode+' '+serverError);
  try{health=await api('/api/health');csrf=health.csrfToken;const status=await api('/api/status');if(resolve(status.dataDirectory)!==resolve(dataDirectory))throw Error('INSTANCE_DATA_DIRECTORY_MISMATCH');owned=true;return;}
  catch(error){if(error.message.includes('INSTANCE_DATA_DIRECTORY_MISMATCH'))throw error;await sleep(100);}
 }
 throw Error('ISOLATED_SERVER_START_TIMEOUT '+serverError);
}
async function idleAndReset(){
 let status=await api('/api/status');
 if(status.busy){await api('/api/control',{action:'cancel'});for(let i=0;i<300;i++){status=await api('/api/status');if(!status.busy)break;await sleep(100);}if(status.busy)throw Error('PREVIOUS_SUITE_DID_NOT_RELEASE_INSTANCE');}
 if(!status.ready)await api('/api/environment/init',{});
 await api('/api/environment/automine',{enabled:true});
 await api('/api/environment/reset',{});
}
async function execute(suite){
 const startedAt=new Date().toISOString(),script=join(root,suite.file),scriptBytes=await readFile(script),started=performance.now();
 let previousReportHash=null;try{previousReportHash=hash(await readFile(suite.report));}catch{}
 let stdout='',stderr='',timedOut=false,spawnError=null;
 const child=spawn(process.execPath,[script],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>{stdout+=b;process.stdout.write(b);});child.stderr.on('data',b=>{stderr+=b;process.stderr.write(b);});
 const timer=setTimeout(()=>{timedOut=true;child.kill();},480000);
 const status=await new Promise(resolve=>{child.once('error',e=>{spawnError=e.stack;resolve({exitCode:null,signal:null});});child.once('exit',(exitCode,signal)=>resolve({exitCode,signal}));});clearTimeout(timer);
 let originalReport=null,reportReadError=null,originalBytes;
 try{originalBytes=await readFile(suite.report);originalReport=JSON.parse(originalBytes.toString('utf8').replace(/^\uFEFF/,''));}
 catch(error){reportReadError=error.message;}
 const reportUpdated=!!originalBytes&&hash(originalBytes)!==previousReportHash;
 const rows=originalReport?.tests??originalReport?.results??[];
 const failureRows=rows.filter(row=>row.passed===false);
 const result={suite:suite.name,script:suite.file,scriptSha256:hash(scriptBytes),scriptHashMatchesBuildInfo:build.files?.[suite.file]===hash(scriptBytes),startedAt,endedAt:new Date().toISOString(),durationMs:Math.round(performance.now()-started),...status,timedOut,spawnError,status:status.exitCode===0&&!timedOut&&!spawnError&&reportUpdated&&!failureRows.length?'PASS':'FAIL',builtSourceHash:health.version.sourceHash,buildDisplayVersion:health.version.displayVersion,expectedLabVersion:env.EXPECTED_LAB_VERSION,origin:'Original regression scripts against isolated real Anvil; model calls use protocol fixtures, not a real cloud model.',reportUpdated,reportReadError,reportedPassed:rows.filter(row=>row.passed===true).length,reportedFailed:failureRows.length,reportFile:suite.report,versionMetadataAdaptation:['feedback-e2e','v013-e2e'].includes(suite.name)?"Only version assertion accepts EXPECTED_LAB_VERSION, default remains V0.13; business assertions unchanged.":null};
 await writeFile(join(reportDirectory,suite.name+'.stdout.txt'),stdout);await writeFile(join(reportDirectory,suite.name+'.stderr.txt'),stderr+(spawnError??''));
 if(originalReport)await writeFile(join(reportDirectory,suite.name+'.original-report.json'),JSON.stringify(originalReport,null,2));
 await writeFile(join(reportDirectory,suite.name+'.result.json'),JSON.stringify(result,null,2));results.push(result);console.log('LEGACY SUITE '+suite.name+' '+result.status+' exit='+result.exitCode+' tests='+result.reportedPassed+'/'+result.reportedFailed);
}
try{
 await boot();
 for(const suite of suites){
  try{await idleAndReset();await execute(suite);}
  catch(error){const result={suite:suite.name,script:suite.file,status:'FAIL',exitCode:null,error:error.stack,builtSourceHash:health?.version?.sourceHash??build.sourceHash,startedAt:new Date().toISOString(),endedAt:new Date().toISOString()};results.push(result);await writeFile(join(reportDirectory,suite.name+'.result.json'),JSON.stringify(result,null,2));console.error('LEGACY SUITE '+suite.name+' FAIL '+error.stack);}
 }
}catch(error){results.push({suite:'wrapper-setup',status:'FAIL',exitCode:null,error:error.stack});console.error(error.stack);}
finally{
 let shutdown={requested:false,confirmed:false,error:null};
 if(owned&&server?.exitCode===null){try{const status=await api('/api/status');if(resolve(status.dataDirectory)!==resolve(dataDirectory))throw Error('SHUTDOWN_INSTANCE_MISMATCH');await api('/api/shutdown',{});shutdown.requested=true;for(let i=0;i<100&&server.exitCode===null;i++)await sleep(100);shutdown.confirmed=server.exitCode!==null;}catch(error){shutdown.error=error.message;}if(server.exitCode===null)server.kill();}
 const summary={suite:'isolated-original-legacy-regressions',platform:os.platform(),arch:os.arch(),node:process.version,controlPort:port,rpcPort:chainPort,dataDirectory,builtSourceHash:health?.version?.sourceHash??build.sourceHash,buildDisplayVersion:health?.version?.displayVersion??build.displayVersion,versionMetadataAdaptation:'feedback-e2e and v013-e2e only replace fixed V0.13 comparison with EXPECTED_LAB_VERSION ?? V0.13; no business assertions changed.',scope:'All scripts run serially on this new isolated instance; no requests to user port 4317.',results,shutdown,passed:results.length===suites.length&&results.every(row=>row.status==='PASS')};
 await writeFile(join(reportDirectory,'server.stdout.txt'),serverLog);await writeFile(join(reportDirectory,'server.stderr.txt'),serverError);await writeFile(join(reportDirectory,'summary.json'),JSON.stringify(summary,null,2));console.log('LEGACY WRAPPER '+(summary.passed?'PASS':'FAIL')+' '+reportDirectory);if(!summary.passed)process.exitCode=1;
}
