import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {runResearchExperiment,readCompletedResearchExperiment} from '../src/research/engine.mjs';
import {expandExperimentMatrix} from '../src/research/manifest.mjs';
import {createPaymentEnvironment} from '../src/payments/index.mjs';
import {createEscrowEnvironment} from '../src/research/escrow.mjs';
import {createMppPaymentEnvironment} from '../src/payments/mpp.mjs';
import {LocalModelService} from '../src/local-model/service.mjs';
import {generateMarketplaceBackground} from '../src/research/background.mjs';
import {makeDataset} from '../src/research/dataset.mjs';
import {evaluateDataset,evaluateNegativeControls} from '../src/research/evaluation.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),[command,input,output]=process.argv.slice(2),json=x=>JSON.stringify(x,null,2)+'\n';
const read=async f=>JSON.parse(await readFile(f,'utf8'));
const paymentFactory=o=>o.scheme==='erc8183'?createEscrowEnvironment(o):o.scheme==='mpp-evm-charge'?createMppPaymentEnvironment(o):createPaymentEnvironment(o);
if(!['run','matrix','evaluate','verify'].includes(command)||!input){console.log('Usage: node scripts/research-cli.mjs run|matrix config.json [output-directory]\n       node scripts/research-cli.mjs evaluate experiment-directory [report.json]\n       node scripts/research-cli.mjs verify run-directory');process.exit(1);}
if(command==='verify'){const config=await read(join(input,'config.json'));console.log(json(await readCompletedResearchExperiment(input,config)));}
else if(command==='evaluate'){
 const samples=[];for(const name of await readdir(input)){try{const dir=join(input,name),truth=await read(join(dir,'private/ground-truth.json')),observer=await read(join(dir,'observer/observer.json'));samples.push({sampleId:name,truth,observer});}catch(e){if(e.code!=='ENOENT'&&e.code!=='ENOTDIR')throw e;}}
 const dataset=makeDataset({samples}),report={dataset,evaluation:evaluateDataset(dataset),controls:evaluateNegativeControls(dataset)};const file=resolve(output??join(input,'private-evaluation.json'));await writeFile(file,json(report));console.log(json({file,samples:samples.length,splitCounts:dataset.splitCounts}));
}else{
 const specification=await read(input),dest=resolve(output??join(root,'data-research-cli',randomUUID()));await mkdir(dest,{recursive:true});
 const configs=command==='matrix'?expandExperimentMatrix(specification).map(r=>r.config):[specification];
 const modelService=new LocalModelService({dataDir:resolve(process.env.RESEARCH_MODEL_DATA??join(root,'data'))}),abort=new AbortController();process.once('SIGINT',()=>abort.abort());
 const results=[];try{for(let index=0;index<configs.length;index++){
  if(abort.signal.aborted)break;const config=configs[index];if(config.model?.provider==='api')config.model.apiKey=process.env.RESEARCH_MODEL_API_KEY??config.model.apiKey;
  const id=randomUUID(),build=await read(join(root,'build-info.json')),summary=await runResearchExperiment(config,{root,outDir:join(dest,id),runId:id,paymentDataDir:join(dirname(dest),'research-runtime',id),paymentFactory,signal:abort.signal,
   softwareIdentity:{version:build.version,sourceHash:build.sourceHash,node:process.version,platform:process.platform,architecture:process.arch,background:process.env.RESEARCH_BACKGROUND==='1'},
   modelResolver:m=>modelService.resolveModel(m),runtimeEvidenceCursor:()=>modelService.evidenceCursor(),captureRuntimeEvidence:(m,c)=>modelService.captureEvidence(m,c),
   beforePurchase:process.env.RESEARCH_BACKGROUND==='1'?async({payments,purchaseIndex,journal})=>{const background=await generateMarketplaceBackground({rpcUrl:payments.rpcUrl,tokenAddress:payments.token.address,providers:payments.providers.map(p=>p.address),count:1,seed:String(config.seed)+':'+purchaseIndex});await journal.record('research.background',background);if(background.status!=='complete')throw Error('BACKGROUND_INCOMPLETE');}:undefined,
  });results.push(summary);console.log(json({index:index+1,total:configs.length,runId:id,status:summary.status,taskOutcome:summary.taskOutcome,checker:summary.checkerStatus}));
 }}finally{await modelService.shutdown();await writeFile(join(dest,'matrix-summary.json'),json({runs:results,stopped:abort.signal.aborted}));}console.log('Saved '+dest);
}
