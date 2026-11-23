import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { units,copy,hash,json } from './core.mjs';
import {TransactionRecoveryCache,operationIdentity,assertSameOperation,selectOperationAttempt,missingTransaction,unresolvedTxStates} from './transaction-recovery.mjs';
export class WalletRegistry {
  constructor(bridge){this.b=bridge;this.chain=bridge.chain;this.queues=new Map();this.realm=null;this.recovery=new TransactionRecoveryCache(bridge.data);}
  async initialize(s){
    const {b,chain}=this; const c=chain.env().contracts;
    if(s.spec.experimentMode==='continuous'){
      if(!this.realm||this.realm.epoch!==chain.env().chainInstanceId)throw Error('CONTINUOUS_REALM_REQUIRED');
      if(!await chain.publicClient.getBytecode({address:this.realm.exchange}))throw Error('REALM_REPLACED');
    }else{
      await chain.reset();await chain.setAutomine(true);
      const accounts=Object.fromEntries(['maker','taker'].map((id,i)=>[id,b.mnemonicToAccount('test test test test test test test test test test test junk',{addressIndex:i+4})]));
      for(const a of Object.values(accounts))await chain.rpc('anvil_setBalance',[a.address,'0x8ac7230489e80000']);
      const artifact=JSON.parse(await readFile(join(b.root,'contracts/artifacts/LabPeerExchange.json'),'utf8'));
      const scope='0x'+hash(randomUUID());const owner=b.createWalletClient({account:chain.deployer,chain:b.localChain,transport:b.http(chain.rpcUrl,{retryCount:0})});
      const tx=await owner.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args:[c.tokenA,c.tokenB,scope],gas:5000000n});
      const receipt=await chain.publicClient.waitForTransactionReceipt({hash:tx,timeout:15000,pollingInterval:50});
      if(receipt.status!=='success')throw Error('EXCHANGE_DEPLOY_FAILED');
      await chain.setupWrite(c.tokenA,'mint',[accounts.maker.address,100000000n]);
      await chain.setupWrite(c.tokenB,'mint',[accounts.taker.address,100000000n]);
      this.realm={epoch:chain.env().chainInstanceId,exchange:receipt.contractAddress,scope,accounts,abi:artifact.abi,
        contractCodeHash:b.keccak256(await chain.publicClient.getBytecode({address:receipt.contractAddress})),deployment:copy(receipt)};
    }
    s.realm=this.realm;s.pending=[];s.transactions=[];s.orders=[];
    for(const a of s.agents){a.wallet=this.realm.accounts[a.agentId];a.address=a.wallet.address;
      a.client=b.createWalletClient({account:a.wallet,chain:b.localChain,transport:b.http(chain.rpcUrl,{retryCount:0})});}
    s.before=await this.state(s);await chain.setAutomine(s.spec.automine);
    await s.emit('environment.initial',{state:s.before,exchange:this.realm.exchange,sessionScope:this.realm.scope,
      contractCodeHash:this.realm.contractCodeHash,abi:this.realm.abi,epoch:this.realm.epoch,deployment:this.realm.deployment});
  }
  async state(s){
    const pc=this.chain.publicClient,c=this.chain.env().contracts,r=s.realm,block=await pc.getBlock();
    const read=(address,fn,args)=>pc.readContract({address,abi:this.chain.artifacts.LabToken.abi,functionName:fn,args,blockNumber:block.number});
    const assets={};for(const id of ['maker','taker']){const address=r.accounts[id].address;
      assets[id]={address,A:String(await read(c.tokenA,'balanceOf',[address])),B:String(await read(c.tokenB,'balanceOf',[address])),
        allowanceA:String(await read(c.tokenA,'allowance',[address,r.exchange])),allowanceB:String(await read(c.tokenB,'allowance',[address,r.exchange])),
        native:String(await pc.getBalance({address,blockNumber:block.number})),nonce:await pc.getTransactionCount({address,blockNumber:block.number})};}
    return {chainInstanceId:r.epoch,chainId:31337,blockNumber:String(block.number),blockHash:block.hash,timestamp:String(block.timestamp),
      sessionScope:r.scope,exchange:r.exchange,tokens:c,assets,
      escrow:{A:String(await read(c.tokenA,'balanceOf',[r.exchange])),B:String(await read(c.tokenB,'balanceOf',[r.exchange]))},
      supply:{A:String(await read(c.tokenA,'totalSupply',[])),B:String(await read(c.tokenB,'totalSupply',[]))}};
  }
  async order(s,id){return copy(await this.chain.publicClient.readContract({address:s.realm.exchange,abi:s.realm.abi,functionName:'getOrder',args:[id]}));}
  async ids(s,quote){const c=this.chain.env().contracts,pc=this.chain.publicClient,r=s.realm;
    const args=[r.accounts.maker.address,r.accounts.taker.address,c.tokenA,units(quote.sellAmount),c.tokenB,units(quote.buyAmount),BigInt(quote.deadline),quote.salt];
    const termsHash=await pc.readContract({address:r.exchange,abi:r.abi,functionName:'hashTerms',args});
    const id=await pc.readContract({address:r.exchange,abi:r.abi,functionName:'orderIdFor',args:[r.accounts.maker.address,quote.salt]});
    return {id,termsHash,args:args.slice(1)};
  }
  async assertEnvironment(s){
    if(this.chain.env()?.chainInstanceId!==s.realm.epoch)throw Error('STALE_SCENARIO_CHAIN');
    const code=await this.chain.publicClient.getBytecode({address:s.realm.exchange});
    if(!code||this.b.keccak256(code)!==s.realm.contractCodeHash)throw Error('EXCHANGE_CODE_CHANGED');
  }
  async persistTransactions(s){await s.persist();}
  async assertCleanupRetry(s,prior){
    await this.assertEnvironment(s);
    const receipt=await this.chain.publicClient.getTransactionReceipt({hash:prior.hash});
    if(receipt?.status!=='reverted'||receipt.transactionHash!==prior.hash)throw Error('CLEANUP_RETRY_REVERT_NOT_CONFIRMED');
    const consumed=await this.chain.publicClient.getTransactionCount({address:prior.from,blockTag:'latest'});
    if(consumed<=prior.nonce)throw Error('CLEANUP_RETRY_NONCE_NOT_CONSUMED');
  }
  remember(s,tx){
    const existing=s.transactions.find(t=>t.intentId===tx.intentId);if(!existing)s.transactions.push(tx);
    const live=existing??tx;if(unresolvedTxStates.has(live.state)&&!s.pending.some(t=>t.intentId===live.intentId))s.pending.push(live);return live;
  }
  async prepareSigned(s,actor,tx,raw,causes=[]){
    this.b.addSecret(raw);const expected=this.b.keccak256(raw);if(tx.hash&&tx.hash!==expected)throw Error('INTENT_SIGNATURE_CONFLICT');
    tx.hash=expected;tx.signatureTxHash=expected;tx.state='broadcasting';tx.broadcastAttempted??=false;
    // Secret bytes become durable before the public hash and before any network send.
    await this.recovery.put(tx,raw);tx.recoveryAvailable=true;this.remember(s,tx);
    await s.emit('tx.hash_durable',{...tx,unsigned:undefined},actor,causes);await this.persistTransactions(s);
  }
  async broadcastPrepared(s,actor,tx,raw,causes=[],recovery=false){
    s.checkAbort();await this.assertEnvironment(s);this.control?.lease(s,actor);
    if(this.b.keccak256(raw)!==tx.hash)throw Error('RECOVERY_HASH_MISMATCH');
    tx.broadcastAttempted=true;tx.broadcastAttempts=(tx.broadcastAttempts??0)+1;tx.lastBroadcastAt=new Date().toISOString();
    await s.emit(recovery?'tx.rebroadcast_attempt':'tx.broadcast_attempt',{...tx,unsigned:undefined},actor,causes);await this.persistTransactions(s);
    s.checkAbort();
    try{const hash=await this.chain.publicClient.sendRawTransaction({serializedTransaction:raw});if(hash!==tx.hash)throw Error('HASH_MISMATCH');
      this.control?.fault('after_broadcast',tx.functionName);tx.state='pending';delete tx.error;await s.emit('tx.broadcast',tx,actor,causes);
    }catch(error){tx.state='unknown';tx.error=error.shortMessage??error.message;await s.emit('tx.unknown',tx,actor,causes);}
    await this.persistTransactions(s);
  }
  async submit(s,actor,address,abi,functionName,args,causes=[]){
    const queueKey=s.realm.epoch+':'+actor.address.toLowerCase(),prev=this.queues.get(queueKey)??Promise.resolve();
    const op=prev.catch(()=>{}).then(async()=>{
      const operation=operationIdentity(s,actor,address,functionName,args),selection=selectOperationAttempt(s,s.transactions,operation,functionName),prior=selection.existing;
      if(prior){assertSameOperation(prior,operation);await this.reconcile(s);return copy(prior);}
      await this.assertEnvironment(s);if(s.pending.length)throw Error('WALLET_PENDING_RECONCILE_FIRST');
      if(selection.prior)await this.assertCleanupRetry(s,selection.prior);
      s.checkAbort();const nonce=await this.chain.publicClient.getTransactionCount({address:actor.address,blockTag:'pending'});
      const data=this.b.encodeFunctionData({abi,functionName,args});const descriptor={...operation,...selection.metadata,intentId:randomUUID(),executionId:s.id,actorId:actor.agentId,toolEventId:causes[0]??null,
        agentRunId:actor.agentRunId,from:actor.address,to:address,chainId:31337,nonce,functionName,args:copy(args),
        calldataHash:this.b.keccak256(data),gas:'800000',value:'0',state:'reserved'};
      if(actor.gasUsedWei>=BigInt(actor.spec.maxGasWei))throw Error('GAS_BUDGET_EXCEEDED');
      // Bound worst-case additional gas against the remaining budget, before signing.
      const fees=await this.chain.publicClient.estimateFeesPerGas();const maxFee=fees.maxFeePerGas??await this.chain.publicClient.getGasPrice();
      if(actor.gasUsedWei+800000n*maxFee>BigInt(actor.spec.maxGasWei))throw Error('GAS_BUDGET_RESERVATION');
      const prepared=await s.emit('tx.intent',descriptor,actor,causes);descriptor.intentEventId=prepared.eventId;
      if(s.spec.pauseBeforeTransaction)await s.gate('before_transaction',actor,descriptor);
      s.checkAbort();const signer=actor.wallet??actor.client?.account;if(!signer?.signTransaction)throw Error('LOCAL_SIGNER_UNAVAILABLE');
      const raw=await signer.signTransaction({type:'eip1559',chainId:31337,to:address,data,value:0n,nonce,gas:800000n,
        maxFeePerGas:maxFee,maxPriorityFeePerGas:fees.maxPriorityFeePerGas??1000000000n});
      await this.prepareSigned(s,actor,descriptor,raw,[prepared.eventId]);await this.broadcastPrepared(s,actor,descriptor,raw,[prepared.eventId]);
      await this.reconcile(s);return copy(descriptor);
    });this.queues.set(queueKey,op);return op;
  }
  async reconcile(s,options={}){
    const previous=s.reconcileQueue??Promise.resolve();const op=previous.catch(()=>{}).then(()=>this.reconcileNow(s,options));s.reconcileQueue=op;return op;
  }
  async reconcileNow(s,{rebroadcast=false}={}){
    if(!s.pending.length)return 0;
    await this.assertEnvironment(s);
    for(const tx of [...new Map(s.pending.map(t=>[t.intentId,t])).values()]){
      const actor=s.agents.find(a=>a.agentId===tx.actorId||a.role===tx.actorId);if(!actor)throw Error('TX_ACTOR_UNKNOWN');
      if(!tx.hash){
        // Search the sender/nonce before ever allowing a replacement payment.
        const pc=this.chain.publicClient,end=await pc.getBlockNumber(),start=BigInt(s.before.blockNumber);
        if(end-start>1000n)throw Error('RECONCILIATION_INTERVAL');
        for(let n=start;n<=end;n++){const block=await pc.getBlock({blockNumber:n,includeTransactions:true});
          const found=block.transactions.find(t=>typeof t!=='string'&&t.from.toLowerCase()===tx.from.toLowerCase()&&t.nonce===tx.nonce);
          if(found){if(this.b.keccak256(found.input)!==tx.calldataHash||found.to?.toLowerCase()!==tx.to.toLowerCase()||BigInt(found.value??0)!==BigInt(tx.value??0))throw Error('NONCE_CONFLICT');tx.hash=found.hash;break;}}
        if(!tx.hash)continue;
      }
      let receipt;try{receipt=await this.chain.publicClient.getTransactionReceipt({hash:tx.hash});}
      catch(error){tx.lastObservationError=error.shortMessage??error.message;
        if(rebroadcast&&!s.abort.signal.aborted&&missingTransaction(error))await this.tryRebroadcast(s,actor,tx);
        continue;}
      if(!receipt)continue;
      tx.receipt=copy(receipt);tx.state=receipt.status==='success'?'confirmed':'reverted';
      if(!tx.gasAccounted){actor.gasUsedWei+=receipt.gasUsed*receipt.effectiveGasPrice;tx.gasAccounted=true;}
      if(tx.state==='reverted')tx.failure={code:'TRANSACTION_REVERTED',retry:'explicit_policy_required',businessSucceeded:false};
      let e={eventId:tx.receiptEventId};if(!tx.receiptEventId){e=await s.emit('tx.receipt',tx,actor,[tx.intentEventId]);tx.receiptEventId=e.eventId;}
      s.pending=s.pending.filter(p=>p.intentId!==tx.intentId);await this.persistTransactions(s);
      try{tx.trace=await this.chain.rpc('debug_traceTransaction',[tx.hash,{tracer:'callTracer'}]);await s.emit('tx.trace',{hash:tx.hash,trace:tx.trace},actor,[e.eventId]);}
      catch{await s.emit('tx.trace_unavailable',{hash:tx.hash,status:'unavailable'},actor,[e.eventId]);}
    }
    await this.persistTransactions(s);
    return s.pending.length;
  }
  async tryRebroadcast(s,actor,tx){
    // A failed RPC read is not evidence of absence. Never re-sign or allocate a
    // nonce here; the only permitted recovery is replay of identical raw bytes.
    try{await this.chain.publicClient.getTransaction({hash:tx.hash});return;}catch(error){if(!missingTransaction(error))return;}
    const nonce=await this.chain.publicClient.getTransactionCount({address:tx.from,blockTag:'latest'});
    if(nonce>tx.nonce){tx.state='unknown';tx.recoveryBlocked='NONCE_ALREADY_CONSUMED';await this.persistTransactions(s);return;}
    const pendingNonce=await this.chain.publicClient.getTransactionCount({address:tx.from,blockTag:'pending'});
    if(pendingNonce>tx.nonce){tx.state='unknown';tx.recoveryBlocked='NONCE_PENDING_CONFLICT';await this.persistTransactions(s);return;}
    const raw=await this.recovery.get(tx);if(!raw){tx.recoveryBlocked='SIGNED_TRANSACTION_CACHE_UNAVAILABLE';await this.persistTransactions(s);return;}
    this.b.addSecret(raw);await this.broadcastPrepared(s,actor,tx,raw,[tx.intentEventId],true);
  }
}
