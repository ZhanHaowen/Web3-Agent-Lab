import {artifactPath,artifactDirectory} from './helpers/artifacts.mjs';
import {spawn} from 'node:child_process';import {resolve,join} from 'node:path';import {readFile,writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const root=resolve(new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')),url='http://127.0.0.1:19017',data=join(root,'data-v2-test-'+crypto.randomUUID());
let token='',admin='',log='';const p=spawn(process.execPath,['dist/server.mjs'],{cwd:root,env:{...process.env,LAB_ROOT:root,LAB_DATA_DIR:data,LAB_PORT:'19017',LAB_CHAIN_PORT:'19057'},windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.on('data',b=>log+=b);p.stderr.on('data',b=>log+=b);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function api(path,body,key='test-'+crypto.randomUUID()){const r=await fetch(url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Lab-Token':token,'X-Control-Admin':admin,'Idempotency-Key':key},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(60000)});const v=await r.json();if(!r.ok)throw Error(path+' '+JSON.stringify(v));return v;}
try{for(let i=0;i<100;i++){try{token=(await api('/api/health')).csrfToken;admin=(await readFile(join(data,'control-admin.token'),'utf8')).trim();break;}catch{await sleep(100);}}if(!token)throw Error('START '+log);
 const j=await api('/api/v2/jobs',{taskType:'peer_swap',input:{sellAmount:'10',buyAmount:'20'}});console.log('Published offline',j.id);assert.equal(j.state,'published');
 for(const id of ['agent-a','agent-b']){await api('/api/v2/agents',{agentId:id});await api('/api/v2/agents/'+id+'/start',{});}
 for(let i=0;i<100;i++){if((await api('/api/v2/agents')).every(a=>a.online))break;await sleep(100);}
 console.log('Agents',await api('/api/v2/agents'));const e=await api('/api/v2/jobs/'+j.id+'/assign',{roles:{maker:'agent-a',taker:'agent-b'},start:true});console.log('Assigned',e.id);
 let s;for(let i=0;i<500;i++){s=await api('/api/v2/executions/'+e.id);if(['completed','stopped','requires_attention','recovering','error'].includes(s.state))break;await sleep(100);}
 console.log('Result',s.state,s.error,s.check?.status,(await api('/api/v2/diagnostics')).lastError);assert.equal(s.state,'completed',JSON.stringify(s));assert.equal(s.check.status,'success',JSON.stringify(s.check));
 const b=await api('/api/v2/executions/'+e.id+'/export');await mkdir(artifactDirectory('fixtures/v2'),{recursive:true});await writeFile(artifactPath('fixtures/v2/peer-normal.json'),JSON.stringify(b,null,2));console.log('PASS independently signed peer trade');
 for(const taskType of ['balance','transfer','approve','swap','swap_deposit']){const job=await api('/api/v2/jobs',{taskType,input:{}});const ex=await api('/api/v2/jobs/'+job.id+'/assign',{roles:{agent:'agent-a'},start:true});let state;for(let i=0;i<400;i++){state=await api('/api/v2/executions/'+ex.id);if(['completed','requires_attention','stopped'].includes(state.state))break;await sleep(100);}console.log('Legacy',taskType,state.state,state.check?.status,state.error);assert.equal(state.check?.status,'success',JSON.stringify(state.check??state));}

}catch(e){console.error(e.stack);console.error(log.slice(-3000));process.exitCode=1;}finally{try{await api('/api/shutdown',{});}catch{}p.kill();}

