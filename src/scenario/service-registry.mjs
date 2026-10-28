import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {WalletRegistry} from './wallet-registry.mjs';
import {hash,copy} from './core.mjs';
import {POLICY} from './service-core.mjs';
export class ServiceRegistry extends WalletRegistry {
 async initialize(s){
  const {b,chain}=this;await chain.reset();await chain.setAutomine(true);const c=chain.env().contracts;
  const accounts=Object.fromEntries(['buyer','provider','evaluator'].map((id,i)=>[id,b.mnemonicToAccount('test test test test test test test test test test test junk',{addressIndex:i+7})]));
  for(const a of Object.values(accounts))await chain.rpc('anvil_setBalance',[a.address,'0x8ac7230489e80000']);
  const artifact=JSON.parse(await readFile(join(b.root,'contracts/artifacts/LabServiceEscrow.json'),'utf8'));
  const scope='0x'+hash(randomUUID()),owner=b.createWalletClient({account:chain.deployer,chain:b.localChain,transport:b.http(chain.rpcUrl,{retryCount:0})});
  const tx=await owner.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,args:[c.tokenB,accounts.provider.address,accounts.evaluator.address,scope],gas:5000000n});
  const receipt=await chain.publicClient.waitForTransactionReceipt({hash:tx,timeout:15000,pollingInterval:50});if(receipt.status!=='success')throw Error('SERVICE_DEPLOY_FAILED');
  await chain.setupWrite(c.tokenB,'mint',[accounts.buyer.address,100000000n]);await chain.setupWrite(c.tokenA,'mint',[accounts.provider.address,100000000n]);
  s.realm={epoch:chain.env().chainInstanceId,exchange:receipt.contractAddress,scope,accounts,abi:artifact.abi,contractCodeHash:b.keccak256(await chain.publicClient.getBytecode({address:receipt.contractAddress})),deployment:copy(receipt)};
  s.pending=[];s.transactions=[];s.orders=[];
  for(const a of s.agents){a.wallet=accounts[a.agentId];a.address=a.wallet.address;a.client=b.createWalletClient({account:a.wallet,chain:b.localChain,transport:b.http(chain.rpcUrl,{retryCount:0})});}
  s.before=await this.state(s);const block=await chain.publicClient.getBlock();
  const account=s.spec.reportAccount==='recipient'?chain.env().accounts.recipient:accounts[s.spec.reportAccount].address;
  s.request={schema:POLICY,chainId:31337,blockNumber:String(block.number),blockHash:block.hash,token:s.spec.reportToken==='A'?c.tokenA:c.tokenB,account:typeof account==='string'?account:account.address};
  s.salt='0x'+hash(randomUUID());s.deadline=String(block.timestamp+BigInt(s.spec.ttl));
  s.jobId=await chain.publicClient.readContract({address:s.realm.exchange,abi:s.realm.abi,functionName:'jobIdFor',args:[accounts.buyer.address,s.salt]});
  await chain.setAutomine(s.spec.automine);await s.emit('environment.initial',{state:s.before,exchange:s.realm.exchange,sessionScope:scope,contractCodeHash:s.realm.contractCodeHash,abi:s.realm.abi,epoch:s.realm.epoch,deployment:s.realm.deployment});
  await s.emit('service.request',{request:s.request,requestHash:'0x'+hash(s.request),jobId:s.jobId,settlementMode:'service_escrow',policy:POLICY});
 }
 async state(s){
  const pc=this.chain.publicClient,c=this.chain.env().contracts,r=s.realm,block=await pc.getBlock();
  const read=(address,fn,args)=>pc.readContract({address,abi:this.chain.artifacts.LabToken.abi,functionName:fn,args,blockNumber:block.number});
  const assets={};for(const id of ['buyer','provider','evaluator']){const address=r.accounts[id].address;assets[id]={address,A:String(await read(c.tokenA,'balanceOf',[address])),B:String(await read(c.tokenB,'balanceOf',[address])),allowanceA:String(await read(c.tokenA,'allowance',[address,r.exchange])),allowanceB:String(await read(c.tokenB,'allowance',[address,r.exchange])),native:String(await pc.getBalance({address,blockNumber:block.number}))};}
  return {chainInstanceId:r.epoch,chainId:31337,blockNumber:String(block.number),blockHash:block.hash,timestamp:String(block.timestamp),sessionScope:r.scope,exchange:r.exchange,tokens:c,assets,escrow:{A:String(await read(c.tokenA,'balanceOf',[r.exchange])),B:String(await read(c.tokenB,'balanceOf',[r.exchange]))},supply:{A:String(await read(c.tokenA,'totalSupply',[])),B:String(await read(c.tokenB,'totalSupply',[]))}};
 }
 async order(s,id){return copy(await this.chain.publicClient.readContract({address:s.realm.exchange,abi:s.realm.abi,functionName:'getJob',args:[id]}));}
 async readReport(s){
  const pc=this.chain.publicClient,r=s.request,block=await pc.getBlock({blockNumber:BigInt(r.blockNumber)});if(block.hash!==r.blockHash)throw Error('REFERENCE_BLOCK_CHANGED');
  const balance=await pc.readContract({address:r.token,abi:this.chain.artifacts.LabToken.abi,functionName:'balanceOf',args:[r.account],blockNumber:BigInt(r.blockNumber)});
  const decimals=await pc.readContract({address:r.token,abi:this.chain.artifacts.LabToken.abi,functionName:'decimals',blockNumber:BigInt(r.blockNumber)});
  return {...copy(r),balance:String(balance),decimals:Number(decimals)};
 }
}
