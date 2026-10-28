import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { units,copy,hash,json } from './core.mjs';
export class WalletRegistry {
  constructor(bridge){this.b=bridge;this.chain=bridge.chain;this.queues=new Map();this.realm=null;}
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
  async submit(s,actor,address,abi,functionName,args,causes=[]){
    const prev=this.queues.get(actor.address)??Promise.resolve();
    const op=prev.catch(()=>{}).then(async()=>{
      if(this.chain.env()?.chainInstanceId!==s.realm.epoch)throw Error('STALE_SCENARIO_CHAIN');
      const code=await this.chain.publicClient.getBytecode({address:s.realm.exchange});
      if(!code||this.b.keccak256(code)!==s.realm.contractCodeHash)throw Error('EXCHANGE_CODE_CHANGED');
      if(s.pending.some(t=>t.actorId===actor.agentId))throw Error('WALLET_PENDING_RECONCILE_FIRST');
      s.checkAbort();const nonce=await this.chain.publicClient.getTransactionCount({address:actor.address,blockTag:'pending'});
      const data=this.b.encodeFunctionData({abi,functionName,args});const descriptor={intentId:randomUUID(),actorId:actor.agentId,
        agentRunId:actor.agentRunId,from:actor.address,to:address,chainId:31337,nonce,functionName,args:copy(args),
        calldataHash:this.b.keccak256(data),gas:'800000',value:'0',state:'reserved'};
      if(actor.gasUsedWei>=BigInt(actor.spec.maxGasWei))throw Error('GAS_BUDGET_EXCEEDED');
      // Bound worst-case additional gas against the remaining budget, before signing.
      const fees=await this.chain.publicClient.estimateFeesPerGas();const maxFee=fees.maxFeePerGas??await this.chain.publicClient.getGasPrice();
      if(actor.gasUsedWei+800000n*maxFee>BigInt(actor.spec.maxGasWei))throw Error('GAS_BUDGET_RESERVATION');
      const prepared=await s.emit('tx.intent',descriptor,actor,causes);descriptor.intentEventId=prepared.eventId;
      if(s.spec.pauseBeforeTransaction)await s.gate('before_transaction',actor,descriptor);
      s.checkAbort();descriptor.state='broadcasting';await s.emit('tx.broadcasting',descriptor,actor,[prepared.eventId]);
      try{
        descriptor.hash=await actor.client.sendTransaction({to:address,data,value:0n,nonce,gas:800000n,
          maxFeePerGas:maxFee,maxPriorityFeePerGas:fees.maxPriorityFeePerGas??1000000000n});
        descriptor.state='pending';await s.emit('tx.broadcast',descriptor,actor,[prepared.eventId]);
      }catch(error){descriptor.state='unknown';descriptor.error=error.shortMessage??error.message;
        s.transactions.push(descriptor);s.pending.push(descriptor);await s.emit('tx.unknown',descriptor,actor,[prepared.eventId]);
        return copy(descriptor);}
      s.transactions.push(descriptor);s.pending.push(descriptor);await this.reconcile(s);return copy(descriptor);
    });this.queues.set(actor.address,op);return op;
  }
  async reconcile(s){
    for(const tx of [...s.pending]){
      const actor=s.agents.find(a=>a.agentId===tx.actorId);
      if(!tx.hash){
        // Search the sender/nonce before ever allowing a replacement payment.
        const pc=this.chain.publicClient,end=await pc.getBlockNumber(),start=BigInt(s.before.blockNumber);
        if(end-start>1000n)throw Error('RECONCILIATION_INTERVAL');
        for(let n=start;n<=end;n++){const block=await pc.getBlock({blockNumber:n,includeTransactions:true});
          const found=block.transactions.find(t=>typeof t!=='string'&&t.from.toLowerCase()===tx.from.toLowerCase()&&t.nonce===tx.nonce);
          if(found){if(this.b.keccak256(found.input)!==tx.calldataHash)throw Error('NONCE_CONFLICT');tx.hash=found.hash;break;}}
        if(!tx.hash)continue;
      }
      let receipt;try{receipt=await this.chain.publicClient.getTransactionReceipt({hash:tx.hash});}catch{continue;}
      tx.receipt=copy(receipt);tx.state=receipt.status==='success'?'confirmed':'reverted';
      actor.gasUsedWei+=receipt.gasUsed*receipt.effectiveGasPrice;
      const e=await s.emit('tx.receipt',tx,actor,[tx.intentEventId]);
      try{tx.trace=await this.chain.rpc('debug_traceTransaction',[tx.hash,{tracer:'callTracer'}]);await s.emit('tx.trace',{hash:tx.hash,trace:tx.trace},actor,[e.eventId]);}
      catch{await s.emit('tx.trace_unavailable',{hash:tx.hash,status:'unavailable'},actor,[e.eventId]);}
      s.pending=s.pending.filter(p=>p!==tx);
    }
    return s.pending.length;
  }
}
