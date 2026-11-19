// This process owns SDK imports and any local fork. It never accepts a signing key.
import {runBnbExperiment} from './runner.mjs';
const abort=new AbortController();let started=false,pauseRequested=false,waiting=null;
function send(value){if(process.connected)process.send(value);}
function cancel(){abort.abort();waiting?.reject(Error('BNB_CANCELLED'));waiting=null;}
process.on('disconnect',cancel);process.on('SIGTERM',cancel);process.on('SIGINT',cancel);
process.on('message',async message=>{
 if(message?.type==='cancel'){cancel();return;}
 if(message?.type==='pause'){pauseRequested=true;return;}
 if(message?.type==='resume'){pauseRequested=false;waiting?.resolve();waiting=null;return;}
 if(message?.type!=='start'||started)return;started=true;
 const {config,root,outDir,runId}=message;
 const deadline=setTimeout(cancel,config.timeoutSeconds*1000);deadline.unref();
 try{
  const summary=await runBnbExperiment(config,{root,outDir,runId,signal:abort.signal,
   emit:(event,payload)=>send({type:'event',event,payload}),
   checkpoint:async detail=>{
    if(abort.signal.aborted)throw Error('BNB_CANCELLED');
    if(!pauseRequested&&!config.pauseBeforeOperations)return;
    await new Promise((resolve,reject)=>{waiting={resolve,reject};send({type:'paused',detail});});
    if(abort.signal.aborted)throw Error('BNB_CANCELLED');send({type:'resumed',detail});
   }});
  send({type:'complete',summary});
 }catch(error){send({type:'failed',error:String(error.message).slice(0,1000),cancelled:abort.signal.aborted});}
 finally{clearTimeout(deadline);if(process.connected)process.disconnect();}
});
