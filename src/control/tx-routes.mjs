import {encode} from './store.mjs';
export async function txRoutes(req,res,path,body){
 if(!path.startsWith('/api/v2/tx-intents'))return false;
 const send=(n,x)=>this.b.send(res,n,x),a=this.auth(req),epoch=body.leaseEpoch;
 const rows=this.store.list('tx_intents').filter(t=>t.agentId===a.agentId);
 if(req.method==='GET'&&path==='/api/v2/tx-intents'){send(200,rows.map(t=>({...t,unsigned:t.unsigned})));return true;}
 if(req.method!=='POST')throw Object.assign(Error('METHOD_NOT_ALLOWED'),{status:405});
 const match=path.match(/^\/api\/v2\/tx-intents(?:\/([a-f0-9-]+)\/submit)?$/),intentId=match?.[1]??body.intentId,t=rows.find(t=>t.intentId===intentId);if(!t||t.executionId!==body.executionId)throw Error('INTENT_IDENTITY');
 const allowed=new Set(match?.[1]?['commandId','executionId','leaseEpoch','signature']:['intentId','executionId','leaseEpoch']);if(Object.keys(body).some(k=>!allowed.has(k)))throw Error('INTENT_FIELDS');const s=this.scenes.get(t.executionId),actor=s?.agents.find(x=>x.role===t.actorId);if(!s||!actor||s.abort.signal.aborted||this.current!==s.id||['completed','stopped'].includes(s.state))throw Error('EXECUTION_AUTHORIZATION_REVOKED');this.lease(s,actor);if(epoch!==a.epoch)throw Error('OLD_LEASE');
 if(!match?.[1]){send(200,{intentId:t.intentId,executionId:t.executionId,from:t.from,to:t.to,nonce:t.nonce,calldataHash:t.calldataHash,unsigned:t.unsigned,state:t.state});return true;}
 const c=this.store.get('commands',body.commandId);if(!c||c.type!=='sign'||c.intentId!==t.intentId||c.agentId!==a.agentId||c.leaseEpoch!==a.epoch)throw Error('SIGN_COMMAND_IDENTITY');
 if(typeof body.signature!=='string'||!/^0x[0-9a-f]{130}$/i.test(body.signature))throw Error('SIGNATURE_FORMAT');
 const unsigned={...t.unsigned,gas:BigInt(t.unsigned.gas),value:BigInt(t.unsigned.value),maxFeePerGas:BigInt(t.unsigned.maxFeePerGas),maxPriorityFeePerGas:BigInt(t.unsigned.maxPriorityFeePerGas)};
 this.b.addSecret(body.signature);let recovered;try{recovered=await this.b.recoverAddress({hash:this.b.keccak256(this.b.serializeTransaction(unsigned)),signature:body.signature});}catch{throw Error('SIGNATURE_INVALID');}if(recovered.toLowerCase()!==t.from.toLowerCase())throw Error('SIGNATURE_SENDER');
 const sig=body.signature,parts={r:sig.slice(0,66),s:'0x'+sig.slice(66,130),yParity:Number(BigInt('0x'+sig.slice(130)))-27},txHash=this.b.keccak256(this.b.serializeTransaction(unsigned,parts));if(t.signatureTxHash&&t.signatureTxHash!==txHash)throw Error('INTENT_SIGNATURE_CONFLICT');
 const nonceOwner=this.store.db.prepare('SELECT intent_id FROM wallet_nonces WHERE chain_instance=? AND address=? AND nonce=?').get(s.realm.epoch,t.from.toLowerCase(),t.nonce);if(nonceOwner?.intent_id!==t.intentId)throw Error('NONCE_RESERVATION');
 this.store.transaction(()=>{this.lease(s,actor);s.checkAbort();const fresh=this.store.get('tx_intents',t.key),command=this.store.get('commands',c.id);if([fresh.hash,fresh.signatureTxHash,command.result?.txHash].filter(Boolean).some(h=>h!==txHash))throw Error('INTENT_SIGNATURE_CONFLICT');fresh.signatureTxHash=txHash;command.status='done';command.result={ephemeralSignature:true,txHash};this.store.put('tx_intents',t.key,fresh);this.store.put('commands',c.id,command);});this.signatures.set(c.id,{signature:body.signature});send(200,{accepted:true,intentId:t.intentId,txHash,state:'signature_verified_not_broadcast'});return true;
}
