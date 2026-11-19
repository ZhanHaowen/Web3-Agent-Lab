import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {BnbSdkService} from '../src/bnb-sdk/service.mjs';

// Runs the same isolated worker used by the GUI. Public writes are never enabled.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.some(a=>a!=='--fork'))throw Error('Usage: node scripts/bnb-sdk-smoke.mjs [--fork]');
const data=resolve(process.env.LAB_BNB_TEST_OUT??join(root,'artifacts','bnb-sdk-smoke',new Date().toISOString().replace(/[:.]/g,'-')));
const service=new BnbSdkService({root,data});
const cases=[{scenario:'x402-offline'}];
if(args.includes('--fork'))cases.push(
 {scenario:'deployment-probe',network:'bsc-testnet',rpcPreset:'default'},
 {scenario:'erc8004-fork',rpcPreset:'publicnode'},
 {scenario:'erc8183-fork',rpcPreset:'publicnode'});
const results=[];
try{
 for(const config of cases){
  const {id}=await service.start({config:{...config,timeoutSeconds:240}});
  await service.active.completion;
  const run=await service.readRun(id),check=await service.check(id),bundle=await service.bundle(id);
  await writeFile(join(data,`${id}.bundle.json`),JSON.stringify(bundle,null,2)+'\n');
  const result={id,scenario:config.scenario,state:run.state.state,status:run.summary?.status??'unknown',checkerStatus:check.status,events:run.events.length,bundleFiles:Object.keys(bundle.files).length};
  results.push(result);console.log(JSON.stringify(result));
 }
}finally{await service.shutdown();await mkdir(data,{recursive:true});await writeFile(join(data,'smoke-results.json'),JSON.stringify({version:'0.18.2',results},null,2)+'\n');}
if(results.some(r=>r.state!=='sealed'||r.status!=='passed'||r.checkerStatus!=='passed'))process.exitCode=1;
