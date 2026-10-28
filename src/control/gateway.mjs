import {readFile} from 'node:fs/promises';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import {WalletRegistry} from '../scenario/wallet-registry.mjs';import {copy,hash,units} from '../scenario/core.mjs';
export class RemoteRegistry extends WalletRegistry {
 constructor(control){super(control.b);this.control=control;}
 async initialize(s){const {chain,b,control}=this,job=control.store.get('jobs',s.jobId),bindings=s.bindings;
  if(s.spec.experimentMode==='continuous'){
   const saved=control.store.get('meta','peer-realm');if(!saved||saved.epoch!==chain.env().chainInstanceId)throw Error('CONTINUOUS_INITIAL_STATE_UNAVAILABLE');
   if(Object.keys(bindings).some(role=>saved.accounts[role].address.toLowerCase()!==bindings[role].address.toLowerCase()))throw Error('CONTINUOUS_WALLET_MISMATCH');s.realm=saved;
  }else{
   await chain.reset();await chain.setAutomine(true);const c=chain.env().contracts,art=JSON.parse(await readFile(join(b.root,'contracts/artifacts/LabPeerExchange.json'),'utf8')),scope='0x'+hash(randomUUID());
   const owner=b.createWalletClient({account:chain.deployer,chain:b.localChain,transport:b.http(chain.rpcUrl,{retryCount:0})});const h=await owner.deployContract({abi:art.abi,bytecode:art.bytecode,args:[c.tokenA,c.tokenB,scope],gas:5000000n}),receipt=await chain.publicClient.waitForTransactionReceipt({hash:h,timeout:15000,pollingInterval:50});if(receipt.status!=='success')throw Error('DEPLOY');
   const accounts={};for(const role of ['maker','taker']){accounts[role]={address:bindings[role].address};await chain.rpc('anvil_setBalance',[accounts[role].address,'0x8ac7230489e80000']);}
   await chain.setupWrite(c.tokenA,'mint',[accounts.maker.address,100000000n]);await chain.setupWrite(c.tokenB,'mint',[accounts.taker.address,100000000n]);
   s.realm={epoch:chain.env().chainInstanceId,exchange:receipt.contractAddress,scope,accounts,abi:art.abi,contractCodeHash:b.keccak256(await chain.publicClient.getBytecode({address:receipt.contractAddress})),deployment:copy(receipt)};
   control.store.put('meta','peer-realm',s.realm);
  }
  for(const a of s.agents){a.address=s.realm.accounts[a.role].address;}
  s.orders=[];s.before=await this.state(s);await chain.setAutomine(s.spec.automine);await control.saveEnvironment();
  await s.emit('environment.initial',{state:s.before,exchange:s.realm.exchange,sessionScope:s.realm.scope,abi:s.realm.abi,contractCodeHash:s.realm.contractCodeHash,deployment:s.realm.deployment});
 }
 async assertEnvironment(s){const pc=this.chain.publicClient,r=s.realm;if(this.chain.env()?.chainInstanceId!==r.epoch)throw Error('STALE_CHAIN');if(await pc.getChainId()!==31337)throw Error('CHAIN_ID_CHANGED');if(s.before){const block=await pc.getBlock({blockNumber:BigInt(s.before.blockNumber)});if(block.hash!==s.before.blockHash)throw Error('CHAIN_START_CHANGED');}const code=await pc.getBytecode({address:r.exchange});if(!code||this.b.keccak256(code)!==r.contractCodeHash)throw Error('EXCHANGE_CODE_CHANGED');if(r.abi.some(x=>x.type==='function'&&x.name==='sessionScope')){const scope=await pc.readContract({address:r.exchange,abi:r.abi,functionName:'sessionScope'});if(scope!==r.scope)throw Error('SCOPE_CHANGED');}}
 async submit(...args){const [s,actor]=args,key=s.realm.epoch+':'+actor.address.toLowerCase(),prev=this.queues.get(key)??Promise.resolve();const op=prev.catch(()=>{}).then(()=>this.executeSubmit(...args));this.queues.set(key,op);return op;}
 async executeSubmit(s,actor,address,abi,functionName,args,causes=[]){
  const control=this.control,store=control.store,lease=control.lease(s,actor),key=s.id+':'+actor.agentRunId+':'+(actor.activeCommand??s.steps)+':'+functionName;
  let tx=store.get('tx_intents',key);
  if(tx&&tx.state!=='reserved'){await this.reconcile(s);return copy(s.transactions.find(t=>t.intentId===tx.intentId)??tx);}
  await this.assertEnvironment(s);if(s.pending.length)throw Error('RECONCILE_FIRST');s.checkAbort();
  const nonce=tx?.nonce??await this.chain.publicClient.getTransactionCount({address:actor.address,blockTag:'pending'}),data=this.b.encodeFunctionData({abi,functionName,args});const fees=await this.chain.publicClient.estimateFeesPerGas(),maxFee=fees.maxFeePerGas??await this.chain.publicClient.getGasPrice();
  if(actor.gasUsedWei+800000n*maxFee>BigInt(actor.spec.maxGasWei))throw Error('GAS_BUDGET');
  const unsigned=tx?.unsigned??{chainId:31337,type:'eip1559',to:address,data,value:'0',nonce,gas:'800000',maxFeePerGas:String(maxFee),maxPriorityFeePerGas:String(fees.maxPriorityFeePerGas??1000000000n)};
  tx=tx??{key,intentId:randomUUID(),executionId:s.id,actorId:actor.role,agentId:lease.agentId,agentRunId:actor.agentRunId,leaseEpoch:lease.epoch,from:actor.address,to:address,chainId:31337,nonce,functionName,args:copy(args),calldataHash:this.b.keccak256(data),gas:'800000',value:'0',unsigned,state:'reserved'};
  store.transaction(()=>{store.db.prepare('INSERT OR IGNORE INTO wallet_nonces VALUES(?,?,?,?)').run(s.realm.epoch,actor.address.toLowerCase(),nonce,tx.intentId);const held=store.db.prepare('SELECT intent_id FROM wallet_nonces WHERE chain_instance=? AND address=? AND nonce=?').get(s.realm.epoch,actor.address.toLowerCase(),nonce);if(held.intent_id!==tx.intentId)throw Error('NONCE_RESERVED');const e=control.event(s,'tx.intent',tx,actor,causes);tx.intentEventId=e.eventId;store.put('tx_intents',key,tx);});
  await control.archive(s);control.fault('after_intent_persist');
  if(s.spec.pauseBeforeTransaction)await s.gate('before_transaction',actor,tx);
  s.checkAbort();control.lease(s,actor);
  const signed=await control.dispatch(actor.profileId,{type:'sign',intentId:tx.intentId,executionId:s.id,agentRunId:actor.agentRunId,address:actor.address,transaction:unsigned,allowedTargets:Object.values(this.chain.env().contracts).concat(s.realm.exchange)});
  control.lease(s,actor);s.checkAbort();
  const typeTx={...unsigned,value:0n,gas:800000n,maxFeePerGas:BigInt(unsigned.maxFeePerGas),maxPriorityFeePerGas:BigInt(unsigned.maxPriorityFeePerGas)};
  const recovered=await this.b.recoverAddress({hash:this.b.keccak256(this.b.serializeTransaction(typeTx)),signature:signed.signature});if(recovered.toLowerCase()!==actor.address.toLowerCase())throw Error('SIGNATURE_SENDER');
  const sig=signed.signature,sigParts={r:sig.slice(0,66),s:'0x'+sig.slice(66,130),yParity:Number(BigInt('0x'+sig.slice(130)))-27};
  const raw=this.b.serializeTransaction(typeTx,sigParts);this.b.addSecret(raw);tx.hash=this.b.keccak256(raw);const committed=store.get('tx_intents',key);if(committed?.signatureTxHash&&committed.signatureTxHash!==tx.hash)throw Error('INTENT_SIGNATURE_CONFLICT');tx.signatureTxHash=committed?.signatureTxHash??tx.hash;tx.state='broadcasting';
  store.transaction(()=>{store.put('tx_intents',key,tx);control.event(s,'tx.hash_durable',{...tx,unsigned:undefined},actor,causes);});
  s.transactions.push(tx);s.pending.push(tx);await s.persist();await control.archive(s);
  try{await this.assertEnvironment(s);control.lease(s,actor);s.checkAbort();const h=await this.chain.publicClient.sendRawTransaction({serializedTransaction:raw});if(h!==tx.hash)throw Error('HASH_MISMATCH');control.fault('after_broadcast',functionName);tx.state='pending';await s.emit('tx.broadcast',tx,actor,causes);}
  catch(error){tx.state='unknown';tx.error=error.shortMessage??error.message;await s.emit('tx.unknown',tx,actor,causes);}
  store.put('tx_intents',key,tx);await this.reconcile(s);return copy(tx);
 }
 async reconcile(s){const previous=s.reconcileQueue??Promise.resolve();const op=previous.catch(()=>{}).then(async()=>{await super.reconcile(s);for(const tx of s.transactions)this.control.store.put('tx_intents',tx.key,tx);});s.reconcileQueue=op;return op;}
 async scan(s){const pc=this.chain.publicClient,end=await pc.getBlockNumber(),start=BigInt(s.before.blockNumber),found=[],known=new Map(s.transactions.map(t=>[t.hash?.toLowerCase(),t]));if(end-start>2000n)throw Error('SCAN_BOUND');
  const addresses=s.agents.map(a=>a.address.toLowerCase());for(let n=start+1n;n<=end;n++){const b=await pc.getBlock({blockNumber:n,includeTransactions:true});for(const t of b.transactions){if(typeof t==='string'||!addresses.includes(t.from.toLowerCase()))continue;const r=await pc.getTransactionReceipt({hash:t.hash});found.push({hash:t.hash,from:t.from,to:t.to,nonce:t.nonce,input:t.input,blockNumber:String(b.number),transactionIndex:r.transactionIndex,status:r.status,recorded:known.has(t.hash.toLowerCase())});}}
  found.sort((a,b)=>Number(BigInt(a.blockNumber)-BigInt(b.blockNumber))||a.transactionIndex-b.transactionIndex);return {transactions:found,unrecorded:found.filter(t=>!t.recorded),ordering:'blockNumber,transactionIndex,logIndex; nonce only within sender'};
 }
}
