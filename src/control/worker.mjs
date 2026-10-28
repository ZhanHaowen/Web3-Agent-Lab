import {readFile,writeFile,mkdir,unlink,readdir,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {AgentRuntime} from '../scenario/agent-runtime.mjs';
import {atomicWrite} from '../scenario/durable.mjs';
import {encode,sha} from './store.mjs';
process.env.LAB_AGENT_WORKER='1';process.env.LAB_LIBRARY_ONLY='1';
const lib=await import('../../dist/server.mjs');
const args=process.argv.slice(2),get=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined,folder=resolve(get('--profile')??'data/agents/agent-a');
await mkdir(folder,{recursive:true});
if(args.includes('--init')){
 const keyFile=join(folder,'wallet-secret.json');
 const privateKey='0x'+randomBytes(32).toString('hex'),signer=lib.privateKeyToAccount(privateKey);
 await atomicWrite(keyFile,encode({privateKey}));await atomicWrite(join(folder,'model-secret.json'),'{}');const pub={agentId:get('--id'),profileVersion:1,walletAddress:signer.address,capabilities:['peer_swap','balance','transfer','approve','swap','swap_deposit']};await atomicWrite(join(folder,'profile.json'),encode(pub));console.log(encode(pub));process.exit(0);
}
const profile=JSON.parse(await readFile(join(folder,'profile.json'),'utf8')),secret={...JSON.parse(await readFile(join(folder,'wallet-secret.json'),'utf8')),model:JSON.parse(await readFile(join(folder,'model-secret.json'),'utf8'))},identity=(await readFile(join(folder,'identity.token'),'utf8')).trim(),account=lib.privateKeyToAccount(secret.privateKey),url=get('--control')??'http://127.0.0.1:4317';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url))throw Error('LOCAL_CONTROL_REQUIRED');
const secrets=[identity,secret.privateKey,secret.model?.apiKey].filter(Boolean);const forms=[...new Set(secrets.flatMap(v=>{const out=[v];for(let i=0;i<3;i++)out.push(JSON.stringify(out.at(-1)).slice(1,-1));return out;}))].sort((a,b)=>b.length-a.length);
const scrub=x=>{if(typeof x==='string'){for(const v of forms)x=x.replaceAll(v,'[REDACTED]');return x;}if(typeof x==='bigint')return String(x);if(Array.isArray(x))return x.map(scrub);if(x&&typeof x==='object'){if(x instanceof Set)return [...x].map(scrub);return Object.fromEntries(Object.entries(x).filter(([,v])=>typeof v!=='function'&&v!==undefined).map(([k,v])=>[k,scrub(v)]));}return x;};
let epoch=0,stopped=false,working=false;const runtimes=new Map();await mkdir(join(folder,'outbox'),{recursive:true});await mkdir(join(folder,'checkpoints'),{recursive:true});
async function api(path,body){const r=await fetch(url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+identity},...(body===undefined?{}:{body:encode(body)}),signal:AbortSignal.timeout(15000)});const v=await r.json();if(!r.ok)throw Error(v.error??'CONTROL_HTTP');return v;}
async function register(){const r=await api('/api/v2/agents/register',{agentId:profile.agentId,address:account.address,pid:process.pid,profileVersion:profile.profileVersion,capabilities:profile.capabilities});epoch=r.leaseEpoch;}
async function checkpoint(runtime){await atomicWrite(join(folder,'checkpoints',runtime.executionId+'.json'),encode(scrub({executionId:runtime.executionId,agentRunId:runtime.agentRunId,state:runtime.state,decisions:runtime.decisions,seq:runtime.seq})));}
async function loadRuntime(command){let c=runtimes.get(command.executionId);if(c)return c;let stored;try{stored=JSON.parse(await readFile(join(folder,'checkpoints',command.executionId+'.json'),'utf8'));}catch{}
 c={executionId:command.executionId,agentRunId:command.agentRunId,state:stored?.state??{},decisions:stored?.decisions??{},seq:stored?.seq??0};runtimes.set(command.executionId,c);return c;}
async function emit(c,type,payload,actor,causes=[]){if(Buffer.byteLength(encode(scrub(payload)))>6*1024*1024)throw Error('EVENT_PAYLOAD_LIMIT');c.seq++;const e={executionId:c.executionId,agentRunId:c.agentRunId,streamId:profile.agentId+':'+c.agentRunId,seq:c.seq,eventId:randomUUID(),leaseEpoch:epoch,type,payload:scrub(payload),causes};const file=join(folder,'outbox',e.eventId+'.json');await atomicWrite(file,encode(e));await checkpoint(c);const ack=await api('/api/v2/agent/events',e);await unlink(file);return ack.event;}
async function execute(command){const c=await loadRuntime(command);if(command.type==='bind'){return {confirmed:true,profileVersion:profile.profileVersion,address:account.address,definitionHash:command.definitionHash};}
 if(command.type==='shutdown'){stopped=true;return {stopping:true};}
 if(command.type==='sign'){
  if(command.leaseEpoch!==epoch||command.transaction.chainId!==31337||command.address.toLowerCase()!==account.address.toLowerCase())throw Error('SIGN_IDENTITY');
  const prepared=await api('/api/v2/tx-intents',{intentId:command.intentId,executionId:command.executionId,leaseEpoch:epoch});if(encode(prepared.unsigned)!==encode(command.transaction))throw Error('INTENT_DESCRIPTOR_CHANGED');const t=prepared.unsigned;if(!command.allowedTargets.some(x=>x.toLowerCase()===t.to.toLowerCase())||BigInt(t.gas)>800000n||BigInt(t.value)!==0n)throw Error('SIGN_SCOPE');
  const tx={...t,gas:BigInt(t.gas),value:0n,maxFeePerGas:BigInt(t.maxFeePerGas),maxPriorityFeePerGas:BigInt(t.maxPriorityFeePerGas),type:'eip1559'};
  const signature=await account.sign({hash:lib.keccak256(lib.serializeTransaction(tx))});return {signature};
 }
 if(c.decisions[command.id])return c.decisions[command.id];
 if(command.type==='result'){
  const a=new AgentRuntime(command.spec);Object.assign(a,c.state);a.result(command.call,command.value);c.state=scrub({...a,gasUsedWei:String(a.gasUsedWei),ownToolIds:[...a.ownToolIds]});delete c.state.spec;c.decisions[command.id]={ack:true};await checkpoint(c);return {ack:true};
 }
 if(command.type!=='step')throw Error('COMMAND_TYPE');
 const spec={...command.spec,model:{...secret.model,...command.spec.model,baseUrl:secret.model.baseUrl??'',model:secret.model.model??'',apiKey:secret.model.apiKey??'',systemPrompt:command.spec.model.systemPrompt||secret.model.systemPrompt||'',requestTimeoutMs:secret.model.requestTimeoutMs??command.spec.model.requestTimeoutMs}},a=new AgentRuntime(spec);Object.assign(a,c.state);a.spec=spec;a.agentRunId=c.agentRunId;a.ownToolIds=new Set(c.state.ownToolIds??[]);a.gasUsedWei=BigInt(c.state.gasUsedWei??0);a.address=account.address;
 const context={...command.context,abort:new AbortController(),bus:{receive:async()=>command.inbox??[]},progress:()=>command.progress,emit:(type,payload,actor,causes)=>emit(c,type,payload,actor,causes)};
 let call;if(command.legacyPlan){c.stage??=c.state.stage??0;call=command.legacyPlan[c.stage++]??{wait:true};a.stage=c.stage;}else call=await a.step(context);
 c.state=scrub({...a,gasUsedWei:String(a.gasUsedWei),ownToolIds:[...a.ownToolIds]});delete c.state.spec;
 const result=scrub({call,costs:a.costs,history:a.history,stage:a.stage});c.decisions[command.id]=result;await checkpoint(c);return result;
}
async function replayOutbox(){const files=await readdir(join(folder,'outbox'));const entries=[];for(const f of files)if(f.endsWith('.json'))entries.push({file:f,e:JSON.parse(await readFile(join(folder,'outbox',f),'utf8'))});entries.sort((a,b)=>a.e.seq-b.e.seq);for(const x of entries){const ack=await api('/api/v2/agent/events',{...x.e,sourceLeaseEpoch:x.e.leaseEpoch,leaseEpoch:epoch});if(ack.ack)await unlink(join(folder,'outbox',x.file));}}
await register(); // Durable outbox retries below after heartbeat starts; lease rebind may require an administrator.
const heartbeat=setInterval(()=>api('/api/v2/agents/heartbeat',{agentId:profile.agentId,leaseEpoch:epoch,pid:process.pid,rss:process.memoryUsage().rss,cpu:process.cpuUsage()}).catch(()=>{}),2000);heartbeat.unref();
process.on('SIGTERM',()=>{stopped=true;});process.on('SIGINT',()=>{stopped=true;});
while(!stopped){try{await access(join(folder,'stop.flag'));break;}catch{}try{await replayOutbox();const {commands}=await api('/api/v2/agent/commands?epoch='+epoch);for(const command of commands){working=true;let response;try{response={result:await execute(command)};}catch(e){response={error:scrub(String(e.message))};}if(command.type==='sign'&&!response.error)await api('/api/v2/tx-intents/'+command.intentId+'/submit',{commandId:command.id,executionId:command.executionId,leaseEpoch:epoch,signature:response.result.signature});else await api('/api/v2/agent/results',{commandId:command.id,executionId:command.executionId,leaseEpoch:epoch,...response});working=false;} }catch(e){if(String(e.message).includes('OLD_LEASE'))break;}
 await new Promise(r=>setTimeout(r,150));}
clearInterval(heartbeat);console.log('Agent stopped '+profile.agentId);

