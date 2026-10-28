import {writeTaskPackages} from './task-packages.mjs';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=x=>createHash('sha256').update(x).digest('hex');
let source=await readFile(join(root,'vendor/v013-server.mjs'),'utf8');
const baseline=JSON.parse(await readFile(join(root,'vendor/v013-build-info.json'),'utf8'));
function replaceOnce(a,b){if(source.split(a).length!==2)throw Error('V013_ANCHOR_NOT_UNIQUE: '+a.slice(0,80));source=source.replace(a,b);}
source='import { BudgetService } from "../src/budget/service.mjs";\nimport { LabControl } from "../src/control/control.mjs";\nimport { ScenarioService } from "../src/scenario/service.mjs";\n'+source;
const bridge=`
var scenarioService = new ScenarioService({ root:ROOT3, data:DATA, chain:chain2,
  createWalletClient, mnemonicToAccount, localChain, http, encodeFunctionData, keccak256,
  clean:value=>redactor.clean(value), addSecret:value=>redactor.add(value), send,
  requireReady, lock:()=>{requireIdle();requireReady();busy=true;},
  unlock:()=>{busy=false;refresh().catch(()=>{});}
});
var budgetService=(process.env.LAB_LIBRARY_ONLY||process.env.LAB_AGENT_WORKER)?null:new BudgetService({root:ROOT3,data:join3(DATA,"budget"),port:PORT,lib:{createWalletClient,createPublicClient,privateKeyToAccount,localChain,http,decodeEventLog,decodeFunctionData,keccak256}});
var labControl=process.env.LAB_AGENT_WORKER?null:new LabControl({root:ROOT3,data:DATA,chain:chain2,url:'http://127.0.0.1:'+PORT,
 createWalletClient,mnemonicToAccount,localChain,http,encodeFunctionData,keccak256,recoverAddress,serializeTransaction,resolveTask,checkTask,scriptedCalls,validateTaskAmounts,decodeFunctionData,
 clean:value=>redactor.clean(value),addSecret:value=>redactor.add(value),send,admin:req=>!req.headers.authorization&&req.headers['x-lab-token']===TOKEN,
 lock:()=>{requireIdle();requireReady();busy=true;},hold:()=>{busy=true;},unlock:()=>{busy=false;},isIdle:()=>!busy,
 markReady:()=>{ready=true;},ensureReady:async()=>{if(!ready){requireIdle();chain2.preserveChain=true;await chain2.start();ready=true;}return chain2.env();}
});
`;
replaceOnce('this.process = spawn(this.anvilPath, args, { stdio: [\"ignore\", \"pipe\", \"pipe\"], windowsHide: true });','this.process = spawn(this.anvilPath, args, { stdio: [\"ignore\", \"pipe\", \"pipe\"], windowsHide: true, detached: !!this.preserveChain });');
replaceOnce('async function bodyJSON(req) {','async function bodyJSON(req,maxSize=1024*1024) {');
replaceOnce('if (size5 > 1024 * 1024) throw new Error(\"REQUEST_TOO_LARGE\");','if (size5 > maxSize) throw new Error(\"REQUEST_TOO_LARGE\");');
replaceOnce('var server = createServer(async (req, res) => {',bridge+'\nvar server = createServer(async (req, res) => {');
replaceOnce('const path4 = url2.pathname;','const path4 = url2.pathname;\n    if (await budgetService?.handle(req,res,path4)) return;');
replaceOnce('const body = req.method === "POST" ? await bodyJSON(req) : {};','const body = req.method === "POST" ? await bodyJSON(req,path4.startsWith("/api/v2/agent/")?8*1024*1024:1024*1024) : {};\n    if (await labControl?.handle(req,res,path4,body)) return;\n    if (await scenarioService.handle(req,res,path4,body)) return;');
replaceOnce('if (req.method !== \"GET\" && req.headers[\"x-lab-token\"] !== TOKEN)', 'if (req.method !== \"GET\" && !(path4.startsWith(\"/api/v2/agent/\") || path4.startsWith(\"/api/v2/tx-intents\") || path4 === \"/api/v2/agents/register\" || path4 === \"/api/v2/agents/heartbeat\") && req.headers[\"x-lab-token\"] !== TOKEN)');
replaceOnce('controller?.abort();\n  const deadline','controller?.abort();\n  await budgetService?.shutdown();\n  await labControl?.shutdown();\n  for (const s of scenarioService.scenes.values()) s.abort.abort();\n  const deadline');
replaceOnce('  await chain2.stop().catch(() => {\n  });', '  if (!labControl?.preserveOnExit) await chain2.stop().catch(() => {\n  });');
replaceOnce('server.listen(PORT, "127.0.0.1", () => console.log(`Web3 Agent Lab http://127.0.0.1:${PORT}`));','if (!process.env.LAB_LIBRARY_ONLY) server.listen(PORT, "127.0.0.1", () => console.log(`Web3 Agent Lab V0.15.3 http://127.0.0.1:${PORT}`));');
replaceOnce('await mkdir4(DATA, { recursive: true });','await mkdir4(DATA, { recursive: true });\nawait budgetService?.init();');
source+='\nexport {createWalletClient,createPublicClient,mnemonicToAccount,localChain,http,encodeFunctionData,decodeEventLog,decodeFunctionData,keccak256,parseAbi,ChainLab,checkTask,scenarioService,labControl,privateKeyToAccount,recoverAddress,serializeTransaction,resolveTask,scriptedCalls,validateTaskAmounts};\n';
await mkdir(join(root,'dist'),{recursive:true});
await writeFile(join(root,'dist/server.mjs'),source);
await writeFile(join(root,'dist/cli.mjs'),'import \"../src/control/cli.mjs\";\n');
await writeFile(join(root,'dist/agent-worker.mjs'),'import \"../src/control/worker.mjs\";\n');
await writeTaskPackages(root);
const files={};async function walk(dir){for(const ent of (await readdir(join(root,dir),{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){if(ent.name==='__pycache__'||ent.name.endsWith('.pyc'))continue;const p=dir+'/'+ent.name;if(ent.isDirectory())await walk(p);else files[p]=sha(await readFile(join(root,p)));}}
for(const d of ['src','public','contracts','scripts','tests','vendor','tasks','tools'])await walk(d);
for(const f of ['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','start.cmd','stop.cmd','Start.command','Stop.command','open-task-center.cmd','start-agent-a.cmd','start-agent-b.cmd','tsconfig.control.json','start-budget-lab.cmd','stop-budget-lab.cmd'])files[f]=sha(await readFile(join(root,f)));
await writeFile(join(root,'build-info.json'),JSON.stringify({version:'0.1.5-3',displayVersion:'V0.15.3',releaseLabel:'V0.15.3',releaseRevision:'integrated-authorization-research-preview',
  builtAt:new Date().toISOString(),sourceHash:sha(JSON.stringify(files)),files,
  compatibilityBase:{version:baseline.version,sourceHash:baseline.sourceHash,bundleSha256:sha(await readFile(join(root,'vendor/v013-server.mjs')))},
  sourceDisclosure:'Pinned V0.13 TypeScript sources recovered under vendor/legacy-source. New control runtime is executable ESM with separately strict TypeScript contracts; full TypeScript runtime port is not claimed.'},null,2)+'\n');
console.log('Built V0.15.3 compatibility bridge and source manifest.');
