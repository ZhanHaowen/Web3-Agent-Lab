import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { checkTask } from './checker.js';
import { sha256, json, executionTraceFiles } from './store.js';

async function main() {
  const [command, file] = process.argv.slice(2);
  if (['verify','replay','check','trace','graph','trace-files'].includes(command) && file) {
    const bundle = JSON.parse(await readFile(resolve(file),'utf8'));
    if(bundle.format !== 'web3-agent-lab-bundle') throw new Error('Unsupported bundle format');
    const manifest=JSON.parse(bundle.files['manifest.json']);
    for(const [name, metadata] of Object.entries(manifest.files) as any) {
      const text=bundle.files[name];
      if(typeof text !== 'string' || sha256(text)!==metadata.sha256 || Buffer.byteLength(text)!==metadata.bytes) throw new Error('HASH_MISMATCH:'+name);
    }
    const events=bundle.files['events.jsonl'].trim().split('\n').map((s:string)=>JSON.parse(s));
    if(events.length!==manifest.event_count || !bundle.files['events.jsonl'].endsWith('\n')) throw new Error('INVALID_EVENT_COUNT_OR_TRUNCATED');
    for(const [i,event] of events.entries()) {
      if(event.seq!==i+1||event.run_id!==bundle.run_id||!manifest.files[event.payload_ref.path]||manifest.files[event.payload_ref.path].sha256!==event.payload_ref.sha256) throw new Error('INVALID_EVENT_REFERENCE');
      event.payload=JSON.parse(bundle.files[event.payload_ref.path]);
    }
    const config=JSON.parse(bundle.files['config.json']);
    if(config.run_id!==bundle.run_id||manifest.run_id!==bundle.run_id) throw new Error('RUN_ID_MISMATCH');
    if(['trace','graph','trace-files'].includes(command)) {
      const built=executionTraceFiles({config,events,manifest},bundle.files['manifest.json']);
      if(command==='trace') console.log(json(built.trace));
      if(command==='graph') console.log(json(built.graph));
      if(command==='trace-files') {
        const target=process.argv[4]; if(!target) throw new Error('OUTPUT_DIRECTORY_REQUIRED');
        const dir=resolve(target); await mkdir(dir,{recursive:true});
        for(const [name,content] of Object.entries(built.files)) await writeFile(join(dir,name.slice('derived/'.length)),content,{encoding:'utf8',flag:'wx'});
        console.log(json({run_id:bundle.run_id,directory:dir,files:Object.keys(built.files).map(name=>name.slice('derived/'.length))}));
      }
      return;
    }
    if(command==='verify') console.log(json({valid:true,run_id:bundle.run_id,events:events.length,recording_status:manifest.recording_status}));
    if(command==='replay') for(const event of events) console.log(json(event));
    if(command==='check') {
      const e=events.find((e:any)=>e.type==='check.evidence')?.payload;
      if(!e) throw new Error('MISSING_CHECK_EVIDENCE');
      console.log(json((checkTask as any)(config.taskId,e.before,e.after,e.transactions,e.agentFinal,e.observations,{experimentMode:config.experimentMode||'independent',taskParameters:config.taskParameters})));
    }
    return;
  }
  const base='http://127.0.0.1:'+(process.env.LAB_PORT||4317);
  if(command==='init'||command==='reset'||command==='run') {
    const health=await(await fetch(base+'/api/health')).json() as any;
    const target=command==='init'?'/api/environment/init':command==='reset'?'/api/environment/reset':'/api/runs';
    const body=command==='run'?{taskId:file||'transfer',mode:'scripted',faultMode:'normal',experimentMode:process.argv.includes('--continuous')?'continuous':'independent'}:{};
    const response=await fetch(base+target,{method:'POST',headers:{'content-type':'application/json','x-lab-token':health.csrfToken},body:JSON.stringify(body)});
    console.log(await response.text()); if(!response.ok) process.exitCode=1; return;
  }
  console.log('Web3 Agent Lab V0.13 Beta CLI\n  init | reset | run [balance|transfer|approve|swap|swap_deposit] [--continuous]\n  verify <bundle.json> | replay <bundle.json> | check <bundle.json>\n  trace <bundle.json> | graph <bundle.json>\n  trace-files <bundle.json> <new-output-directory>\nOffline commands never initialize Anvil or call a model. Trace views are regenerated from verified raw evidence.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
