import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {hash,json} from './core.mjs';
import {atomicWrite} from './durable.mjs';

export const unresolvedTxStates=new Set(['broadcasting','pending','unknown']);

// The business operation survives a new model call/worker command. Its payload
// is checked separately: changing an amount must not manufacture a new operation.
export function operationIdentity(s,actor,address,functionName,args){
 const acceptance=s.acceptance;
 const accepted=acceptance?.acceptanceId??acceptance?.termsHash??(s.accepted&&(s.quote?.quoteId??s.accepted));
 const identity={executionId:s.id,actor:actor.role??actor.agentId,address:accepted?null:String(address).toLowerCase(),functionName,
  acceptance:accepted??null,command:accepted?null:(actor.activeCommand??`${actor.agentRunId}:${s.steps??actor.costs?.toolCalls??0}`)};
 return {operationId:hash(identity),operationPayloadHash:hash({address:String(address).toLowerCase(),functionName,args}),
  ...(acceptance?{acceptanceId:acceptance.acceptanceId,quoteId:acceptance.quoteId,termsHash:acceptance.termsHash,quoteVersion:acceptance.quoteVersion}:{})};
}

export function assertSameOperation(tx,operation){
 if(tx.operationPayloadHash&&tx.operationPayloadHash!==operation.operationPayloadHash)throw Error('OPERATION_PARAMETERS_CHANGED');
}

/** Administrative cleanup is the only automatic caller allowed a new attempt.
 * A control ID identifies one attempt; repeating that control never creates more.
 */
export function selectOperationAttempt(s,transactions,operation,functionName){
 const attempts=transactions.filter(t=>t.operationId===operation.operationId);
 const authorization=s.cleanupRetryAuthorization;
 const allowed=authorization?.functionName===functionName&&['cancelOrder','expireOrder'].includes(functionName)&&typeof authorization.controlId==='string'&&authorization.controlId.length>0;
 if(allowed){const same=attempts.find(t=>t.cleanupControlId===authorization.controlId);if(same)return {existing:same};}
 const latest=attempts.at(-1);
 if(latest)assertSameOperation(latest,operation);
 if(!allowed||!latest||latest.state!=='reverted'||latest.receipt?.status!=='reverted')return {
  existing:latest,metadata:!latest&&allowed?{attempt:1,cleanupControlId:authorization.controlId}: {attempt:1}};
 return {existing:null,prior:latest,metadata:{attempt:(latest.attempt??1)+1,priorIntentId:latest.intentId,
  priorReceiptHash:latest.hash,cleanupControlId:authorization.controlId}};
}

export function missingTransaction(error){
 return /Transaction(?:Receipt)?NotFoundError/.test(error?.name??'')||/transaction(?: receipt)? (?:was )?not found/i.test(error?.shortMessage??error?.message??'');
}

// These files are runtime secrets, never event payloads, s.files or exported
// bundles. Encrypt pending raw transactions at rest with a per-installation key.
// POSIX permissions are restrictive; Windows uses the user's inherited data ACL.
export class TransactionRecoveryCache {
 constructor(data){this.folder=join(data,'runtime-private','tx-recovery');}
 async key(){
  if(!this.keyPromise)this.keyPromise=(async()=>{await mkdir(this.folder,{recursive:true,mode:0o700});const path=join(this.folder,'local.key');
   try{await writeFile(path,randomBytes(32),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
   const key=await readFile(path);if(key.length!==32)throw Error('RECOVERY_KEY_INVALID');return key;})();
  return this.keyPromise;
 }
 path(tx){return join(this.folder,hash({executionId:tx.executionId,intentId:tx.intentId})+'.enc.json');}
 async put(tx,raw){const key=await this.key(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const aad=json({intentId:tx.intentId,hash:tx.hash});cipher.setAAD(Buffer.from(aad));const encrypted=Buffer.concat([cipher.update(raw,'utf8'),cipher.final()]);
  await atomicWrite(this.path(tx),json({version:1,iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:encrypted.toString('hex')}));}
 async get(tx){let saved;try{saved=JSON.parse(await readFile(this.path(tx),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}
  const decipher=createDecipheriv('aes-256-gcm',await this.key(),Buffer.from(saved.iv,'hex'));decipher.setAAD(Buffer.from(json({intentId:tx.intentId,hash:tx.hash})));decipher.setAuthTag(Buffer.from(saved.tag,'hex'));
  return Buffer.concat([decipher.update(Buffer.from(saved.ciphertext,'hex')),decipher.final()]).toString('utf8');}
}
