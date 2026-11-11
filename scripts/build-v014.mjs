import {writeTaskPackages} from './task-packages.mjs';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=x=>createHash('sha256').update(x).digest('hex');
let source=await readFile(join(root,'build/legacy-server.mjs'),'utf8');
const baseline=JSON.parse(await readFile(join(root,'vendor/v013-build-info.json'),'utf8'));
const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
function replaceOnce(a,b){if(source.split(a).length!==2)throw Error('V013_ANCHOR_NOT_UNIQUE: '+a.slice(0,80));source=source.replace(a,b);}
source='import { ResearchService } from "../src/research/service.mjs";\nimport { LocalModelService } from "../src/local-model/service.mjs";\nimport { BudgetService } from "../src/budget/service.mjs";\nimport { LabControl } from "../src/control/control.mjs";\nimport { ScenarioService } from "../src/scenario/service.mjs";\n'+source;
const bridge=`
var localModelService = (process.env.LAB_LIBRARY_ONLY||process.env.LAB_AGENT_WORKER)?null:new LocalModelService({dataDir:DATA,beforeChange:()=>{
  requireIdle();
  if (researchService?.busy) throw Error('RESEARCH_EXPERIMENT_ACTIVE');
  if (labControl?.store.list('agents').some(a=>a.provider==='local'&&(Date.now()-(a.heartbeat??0)<6000||((p)=>p&&p.exitCode===null&&!p.killed)(labControl.workers.get(a.agentId))))) throw Error('LOCAL_MODEL_WORKERS_ONLINE: stop local Agent workers before changing or stopping inference');
}});
async function resolveModelConfiguration(model) {
  if (!localModelService) return model;
  return localModelService.resolveModel(model ?? {});
}
setModelResolver(resolveModelConfiguration);
async function captureLocalRuntimeEvidence(models,cursor=null) {
  const model=(models??[]).find(m=>m?.provider==='local');
  return model&&localModelService?localModelService.captureEvidence(model,cursor,value=>redactor.clean(value)):null;
}
setRuntimeEvidenceHooks({cursor:()=>localModelService?.evidenceCursor()??null,capture:(model,cursor)=>captureLocalRuntimeEvidence([model],cursor)});
var scenarioService = new ScenarioService({ root:ROOT3, data:DATA, chain:chain2,
  createWalletClient, mnemonicToAccount, localChain, http, encodeFunctionData, keccak256,
  clean:value=>redactor.clean(value), addSecret:value=>redactor.add(value), send,
  requireReady, resolveModel:resolveModelConfiguration,captureRuntimeEvidence:captureLocalRuntimeEvidence,assertLocalModel:model=>localModelService?.assertModel(model), lock:()=>{requireIdle();requireReady();busy=true;},
  unlock:()=>{busy=false;refresh().catch(()=>{});}
});
var budgetService=(process.env.LAB_LIBRARY_ONLY||process.env.LAB_AGENT_WORKER)?null:new BudgetService({root:ROOT3,data:join3(DATA,"budget"),port:PORT,lib:{createWalletClient,createPublicClient,privateKeyToAccount,localChain,http,decodeEventLog,decodeFunctionData,keccak256}});
var researchService=(process.env.LAB_LIBRARY_ONLY||process.env.LAB_AGENT_WORKER)?null:new ResearchService({root:ROOT3,data:join3(DATA,"research"),port:PORT,modelResolver:resolveModelConfiguration,captureRuntimeEvidence:(model,cursor)=>captureLocalRuntimeEvidence([model],cursor),runtimeEvidenceCursor:()=>localModelService?.evidenceCursor()??null});
var labControl=process.env.LAB_AGENT_WORKER?null:new LabControl({root:ROOT3,data:DATA,chain:chain2,url:'http://127.0.0.1:'+PORT,
 createWalletClient,mnemonicToAccount,localChain,http,encodeFunctionData,keccak256,recoverAddress,serializeTransaction,resolveTask,checkTask,scriptedCalls,validateTaskAmounts,decodeFunctionData,
 clean:value=>redactor.clean(value),addSecret:value=>redactor.add(value),send,resolveModel:resolveModelConfiguration,captureRuntimeEvidence:captureLocalRuntimeEvidence,assertLocalModel:model=>localModelService?.assertModel(model),admin:req=>!req.headers.authorization&&req.headers['x-lab-token']===TOKEN,
 lock:()=>{requireIdle();requireReady();busy=true;},hold:()=>{busy=true;},unlock:()=>{busy=false;},isIdle:()=>!busy,
 markReady:()=>{ready=true;},ensureReady:async()=>{if(!ready){requireIdle();chain2.preserveChain=true;await chain2.start();ready=true;}return chain2.env();}
});
`;
replaceOnce('this.process = spawn(this.anvilPath, args, { stdio: [\"ignore\", \"pipe\", \"pipe\"], windowsHide: true });','this.process = spawn(this.anvilPath, args, { stdio: [\"ignore\", \"pipe\", \"pipe\"], windowsHide: true, detached: !!this.preserveChain });');
replaceOnce('async function bodyJSON(req) {','async function bodyJSON(req,maxSize=1024*1024) {');
replaceOnce('if (size5 > 1024 * 1024) throw new Error(\"REQUEST_TOO_LARGE\");','if (size5 > maxSize) throw new Error(\"REQUEST_TOO_LARGE\");');
replaceOnce('var server = createServer(async (req, res) => {',bridge+'\nvar server = createServer(async (req, res) => {');
replaceOnce('const path4 = url2.pathname;','const path4 = url2.pathname;\n    if (await researchService?.handle(req,res,path4)) return;\n    if (await budgetService?.handle(req,res,path4)) return;');
replaceOnce('const body = req.method === "POST" ? await bodyJSON(req) : {};','const body = req.method === "POST" ? await bodyJSON(req,path4.startsWith("/api/v2/agent/")?8*1024*1024:1024*1024) : {};\n    if (await localModelService?.handle(req,res,path4,body)) return;\n    if (await labControl?.handle(req,res,path4,body)) return;\n    if (await scenarioService.handle(req,res,path4,body)) return;');
replaceOnce('if (req.method !== \"GET\" && req.headers[\"x-lab-token\"] !== TOKEN)', 'if (req.method !== \"GET\" && !(path4.startsWith(\"/api/v2/agent/\") || path4.startsWith(\"/api/v2/tx-intents\") || path4 === \"/api/v2/agents/register\" || path4 === \"/api/v2/agents/heartbeat\") && req.headers[\"x-lab-token\"] !== TOKEN)');
replaceOnce('controller?.abort();\n  const deadline','controller?.abort();\n  await researchService?.shutdown();\n  await budgetService?.shutdown();\n  await labControl?.shutdown();\n  for (const s of scenarioService.scenes.values()) s.abort.abort();\n  await localModelService?.shutdown();\n  const deadline');
replaceOnce('  await chain2.stop().catch(() => {\n  });', '  if (!labControl?.preserveOnExit) await chain2.stop().catch(() => {\n  });');
replaceOnce('server.listen(PORT, "127.0.0.1", () => console.log(`Web3 Agent Lab http://127.0.0.1:${PORT}`));','if (!process.env.LAB_LIBRARY_ONLY) server.listen(PORT, "127.0.0.1", () => console.log(`Web3 Agent Lab '+pkg.displayVersion+' http://127.0.0.1:${PORT}`));');
replaceOnce('await mkdir4(DATA, { recursive: true });','await mkdir4(DATA, { recursive: true });\nawait budgetService?.init();');
source+='\nexport {createWalletClient,createPublicClient,mnemonicToAccount,localChain,http,encodeFunctionData,decodeEventLog,decodeFunctionData,keccak256,parseAbi,ChainLab,checkTask,scenarioService,labControl,privateKeyToAccount,recoverAddress,serializeTransaction,resolveTask,scriptedCalls,validateTaskAmounts};\n';
await mkdir(join(root,'dist'),{recursive:true});
await writeFile(join(root,'dist/server.mjs'),source);
await writeFile(join(root,'dist/cli.mjs'),'import \"../src/control/cli.mjs\";\n');
await writeFile(join(root,'dist/agent-worker.mjs'),'import \"../src/control/worker.mjs\";\n');
await writeFile(join(root,'dist/legacy-cli.mjs'),await readFile(join(root,'build/legacy-cli.mjs')));
await writeTaskPackages(root);
const files={};async function walk(dir){for(const ent of (await readdir(join(root,dir),{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){if(['__pycache__','node_modules','.git'].includes(ent.name)||ent.name.endsWith('.pyc'))continue;const p=dir+'/'+ent.name;if(ent.isDirectory())await walk(p);else files[p]=sha(await readFile(join(root,p)));}}
for(const d of ['src','public','contracts','scripts','tests','vendor','tasks','tools','packages','examples/research'])await walk(d);
for(const f of ['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','start.cmd','stop.cmd','Start.command','Stop.command','open-task-center.cmd','start-agent-a.cmd','start-agent-b.cmd','tsconfig.control.json','start-budget-lab.cmd','stop-budget-lab.cmd','open-research.cmd'])files[f]=sha(await readFile(join(root,f)));
await writeFile(join(root,'build-info.json'),JSON.stringify({version:pkg.version,displayVersion:pkg.displayVersion,releaseLabel:pkg.releaseLabel,releaseRevision:pkg.releaseRevision,
  builtAt:new Date().toISOString(),sourceHash:sha(JSON.stringify(files)),files,
  outputs:Object.fromEntries(await Promise.all(['dist/server.mjs','dist/cli.mjs','dist/agent-worker.mjs','dist/legacy-cli.mjs'].map(async p=>[p,sha(await readFile(join(root,p)))]))),
  compatibilityBase:{version:baseline.version,sourceHash:baseline.sourceHash,bundleSha256:sha(await readFile(join(root,'vendor/v013-server.mjs')))},
  rebuiltLegacySha256:sha(await readFile(join(root,'build/legacy-server.mjs'))),
  sourceDisclosure:'Retained TypeScript sources under vendor/legacy-source are rebuilt for the current release. The historical V0.13 bundle is preserved. Control, model and local-runtime modules are executable ESM with separately checked interface types.'},null,2)+'\n');
console.log('Built '+pkg.displayVersion+' compatibility bridge and source manifest.');

