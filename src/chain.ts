import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createPublicClient, createWalletClient, http, defineChain, parseUnits, formatUnits, encodeFunctionData, decodeFunctionData, decodeEventLog, getAbiItem, toFunctionSignature, isAddress, type Address, type Hex, type Abi } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { checkTask, type CheckOptions } from './checker.js';
import type { TaskId } from './tasks.js';
import { formatTokenState, type FormattedTokenState } from './units.js';
export { TASKS, toolDefinitions } from './tasks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_MNEMONIC = 'test test test test test test test test test test test junk';
const FIXED_TIMESTAMP = 1_700_000_000;
const json = (value: unknown) => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
const safe = <T>(value: T): T => JSON.parse(json(value));
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const localChain = defineChain({id:31337,name:'Web3 Agent Lab',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://127.0.0.1:8545']}}});

export interface ChainState {
  chainInstanceId: string; chainId: number; blockNumber: string; blockHash: string; timestamp: string;
  addresses: {agent: Address; recipient: Address; tokenA: Address; tokenB: Address; amm: Address; vault: Address};
  balances: {agentA: string; agentB: string; recipientA: string; recipientB: string; native: string};
  allowances: {ammA: string; vaultB: string}; shares: string; vaultAssets: string;
  reserves: {A: string; B: string}; nonce: number;
  formatted?: FormattedTokenState;
}
export interface TxRecord {
  hash?: string; txHash?: string; tool?: string; contractCallId?:string; args?: Record<string,unknown>; from?: string; to?: string;
  data?: string; value?: string; nonce?: number; status: 'success'|'reverted'|'pending'|'unknown';
  gas?: string; maxFeePerGas?:string;maxPriorityFeePerGas?:string;gasPrice?:string;type?:string;
  receipt?: any; decoded?: {functionName:string;args:unknown[]}; error?: string; trace?: unknown;
}
export interface TxHooks {
  emit?: (type:string,payload:unknown,links?:Record<string,unknown>) => Promise<unknown>;
  beforeSubmit?: (descriptor:Record<string,unknown>) => Promise<unknown>;
}
export interface StateInstrumentation {tool:string;hooks?:TxHooks;}
export interface BalanceObservation {tool:'get_balance';token:string;account:string;address:string;balance:string;formatted:string;decimals:number;blockNumber:string;blockHash:string;contractCallId?:string;}
interface ContractCall {
  callId:string;kind:'read'|'transaction';tool:string;chainId:number;
  contract:{address:Address;label:string};function:{name:string;signature:string;selector:Hex;args:unknown[]};
  request:{from?:Address;to:Address;data:Hex;value?:string;blockNumber?:string;blockHash?:string};
  amountConversions?: {parameter:string;token:string;unit:'token';decimals:6;input:string;baseUnits:string}[];
}
type Artifact = { abi: Abi; bytecode: Hex; compiler: string; evmVersion: string };
class RecordingError extends Error { readonly fatal=true; constructor(cause:unknown) {super('Durable transaction recording failed',{cause});this.name='RecordingError';} }

/** Owns a private loopback Anvil process. Never attaches to an arbitrary existing RPC. */
export class ChainLab {
  readonly rpcUrl: string;
  readonly anvilPath: string;
  readonly dataDir: string;
  publicClient: any;
  walletClient: any;
  transactions: TxRecord[] = [];
  observations: BalanceObservation[] = [];
  private process?: ChildProcess;
  private artifacts!: Record<string,Artifact>;
  private baselineSnapshot?: string;
  private baselineDump?: string;
  private snapshotIds = new Set<string>();
  private metadata: any;
  private automine = true;
  private readonly deployer = mnemonicToAccount(DEV_MNEMONIC,{addressIndex:0});
  private readonly agent = mnemonicToAccount(DEV_MNEMONIC,{addressIndex:1});
  private readonly recipient = mnemonicToAccount(DEV_MNEMONIC,{addressIndex:2});
  private readonly observer = mnemonicToAccount(DEV_MNEMONIC,{addressIndex:3});
  constructor(options:{rpcUrl?:string;anvilPath?:string;dataDir?:string} = {}) {
    this.rpcUrl = options.rpcUrl || 'http://127.0.0.1:8545';
    const url = new URL(this.rpcUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.pathname !== '/' || url.search) throw new Error('Managed Anvil RPC must be http://127.0.0.1:PORT');
    this.anvilPath = options.anvilPath || process.env.ANVIL_PATH || path.join(ROOT,'runtime',process.platform==='win32'?'anvil.exe':'anvil');
    this.dataDir = options.dataDir || path.join(ROOT,'data','chain');
    this.publicClient = createPublicClient({chain:localChain,transport:http(this.rpcUrl,{retryCount:0,timeout:10_000}),cacheTime:0});
    this.walletClient = createWalletClient({account:this.agent,chain:localChain,transport:http(this.rpcUrl,{retryCount:0,timeout:10_000})});
  }
  private async rpc(method:string,params:unknown[]=[]):Promise<any> { return this.publicClient.request({method,params}); }
  private async emit(hooks:TxHooks,type:string,payload:unknown,links?:Record<string,unknown>) {
    try {await hooks.emit?.(type,payload,links);} catch(error) {throw new RecordingError(error);}
  }
  /** Describe only successfully ABI-encoded calls; invalid tool inputs are not contract calls. */
  private contractCall(tool:string,kind:ContractCall['kind'],address:Address,abi:Abi,functionName:string,args:unknown[],request:Partial<ContractCall['request']>={}):ContractCall {
    const data=encodeFunctionData({abi,functionName,args});
    const item=getAbiItem({abi,name:functionName,args});
    if(!item||item.type!=='function') throw new Error('Encoded contract function ABI is unavailable');
    const decoded=decodeFunctionData({abi,data});
    const labels:Record<string,string>={tokenA:'TokenA',tokenB:'TokenB',amm:'AMM',vault:'Vault'};
    const key=Object.keys(this.metadata.contracts).find(key=>this.metadata.contracts[key].toLowerCase()===address.toLowerCase());
    return safe({callId:randomUUID(),kind,tool,chainId:this.metadata.chainId,
      contract:{address,label:key?labels[key]||key:'Unknown contract'},
      function:{name:decoded.functionName,signature:toFunctionSignature(item),selector:data.slice(0,10) as Hex,args:[...(decoded.args||[])]},
      request:{...request,to:address,data}});
  }
  private async readContract(address:Address,abi:Abi,functionName:string,args:unknown[],block:any,instrument?:StateInstrumentation):Promise<{result:any;contractCallId?:string}> {
    const request={address,abi,functionName,args,blockNumber:block.number};
    if(!instrument) return {result:await this.publicClient.readContract(request)};
    const call=this.contractCall(instrument.tool,'read',address,abi,functionName,args,{blockNumber:String(block.number),blockHash:block.hash});
    const hooks=instrument.hooks||{},links={contractCallId:call.callId},started=performance.now();
    await this.emit(hooks,'contract.call',call,links);
    try {
      const result=await this.publicClient.readContract(request);
      await this.emit(hooks,'contract.result',safe({callId:call.callId,kind:call.kind,status:'success',result,blockNumber:String(block.number),blockHash:block.hash,duration_ms:Math.round(performance.now()-started)}),links);
      return {result,contractCallId:call.callId};
    } catch(error:any) {
      if(error instanceof RecordingError) throw error;
      await this.emit(hooks,'contract.result',{callId:call.callId,kind:call.kind,status:'error',error:error?.shortMessage||error?.name||'Contract read error',stage:'read',blockNumber:String(block.number),blockHash:block.hash,duration_ms:Math.round(performance.now()-started)},links);
      throw error;
    }
  }
  private requireStarted() { if (!this.metadata || !this.process || this.process.exitCode !== null) throw new Error('实验链尚未启动，请先初始化环境。'); }
  async start(options:{forkUrl?:string;forkBlockNumber?:number|string}={}) {
    if (this.process && this.process.exitCode === null && this.metadata) return this.env();
    if (options.forkUrl && options.forkBlockNumber === undefined) throw new Error('Fork requires an explicit fixed forkBlockNumber.');
    if (options.forkBlockNumber !== undefined && (!/^\d+$/.test(String(options.forkBlockNumber)) || BigInt(options.forkBlockNumber)<0n)) throw new Error('Invalid fork block number.');
    await fs.access(this.anvilPath);
    // Do not silently use somebody else's chain if the selected port is occupied.
    try { await this.publicClient.getChainId(); throw new Error('RPC_PORT_OCCUPIED'); }
    catch (error:any) { if (error.message === 'RPC_PORT_OCCUPIED') throw new Error('RPC端口已被占用；请停止占用进程或更换端口。'); }
    this.artifacts = Object.fromEntries(await Promise.all(['LabToken','LabAMM','LabVault'].map(async name => [name,JSON.parse(await fs.readFile(path.join(ROOT,'contracts','artifacts',`${name}.json`),'utf8'))])));
    const args = ['--host','127.0.0.1','--port',new URL(this.rpcUrl).port || '80','--chain-id','31337','--timestamp',String(FIXED_TIMESTAMP),'--order','fifo','--hardfork','cancun','--silent'];
    if(options.forkUrl) args.push('--fork-url',options.forkUrl,'--fork-block-number',String(options.forkBlockNumber));
    let spawnError: NodeJS.ErrnoException|undefined;
    this.process = spawn(this.anvilPath,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});
    // Avoid writing process stderr: a fork URL can contain an RPC API credential.
    this.process.stdout?.resume(); this.process.stderr?.resume();
    this.process.once('error',error => {spawnError=error;});
    try {
      let ready = false;
      for(let attempt=0;attempt<120;attempt++) {
        if(spawnError) throw new Error(`Anvil无法启动: ${spawnError.code || 'spawn_error'}`);
        if(this.process.exitCode !== null) throw new Error(`Anvil exited (${this.process.exitCode}); check binary, fork endpoint and port.`);
        try { const version = await this.rpc('web3_clientVersion'); if (String(version).toLowerCase().includes('anvil')) {ready=true;break;} } catch {}
        await delay(100);
      }
      if(!ready) throw new Error('Anvil启动超时；请检查可执行文件和分叉RPC。');
      const initialBlock = await this.publicClient.getBlock();
      // One second per block eliminates wall-clock drift from otherwise identical local runs.
      await this.rpc('anvil_setBlockTimestampInterval',[1]);
      await this.rpc('evm_setAutomine',[true]); this.automine=true;
      const addresses = {deployer:this.deployer.address,agent:this.agent.address,recipient:this.recipient.address,observer:this.observer.address};
      for (const account of Object.values(addresses)) await this.rpc('anvil_setBalance',[account,'0x8ac7230489e80000']); // 10 ETH
      this.metadata = {chainId:31337,chainInstanceId:randomUUID(),rpcUrl:this.rpcUrl,accounts:addresses,contracts:{},fork:options.forkUrl?{blockNumber:String(options.forkBlockNumber),blockHash:initialBlock.hash,endpointHost:new URL(options.forkUrl).hostname}:null,versions:{anvil:await this.rpc('web3_clientVersion'),solc:this.artifacts.LabToken.compiler},protocol:'local constant-product fixture / 0.30% fee; one-to-one deposit shares'};
      const tokenA = await this.deploy('LabToken',['Token A','TKA']);
      const tokenB = await this.deploy('LabToken',['Token B','TKB']);
      const amm = await this.deploy('LabAMM',[tokenA,tokenB]);
      const vault = await this.deploy('LabVault',[tokenB]);
      this.metadata.contracts = {tokenA,tokenB,amm,vault};
      await this.setupWrite(tokenA,'mint',[this.agent.address,100_000_000n]);
      await this.setupWrite(tokenA,'mint',[amm,10_000_000_000n]);
      await this.setupWrite(tokenB,'mint',[amm,10_000_000_000n]);
      const initial = await this.state();
      this.metadata.baseline = {blockNumber:initial.blockNumber,blockHash:initial.blockHash,timestamp:initial.timestamp};
      this.baselineDump = await this.rpc('anvil_dumpState');
      this.baselineSnapshot = await this.rpc('evm_snapshot');
      this.snapshotIds.clear(); this.transactions=[];this.observations=[];
      await fs.mkdir(this.dataDir,{recursive:true});
      await fs.writeFile(path.join(this.dataDir,'baseline-state.json'),json({format:'anvil_dumpState',metadata:this.env(),state:this.baselineDump})+'\n');
      return this.env();
    } catch(error) { await this.stop(); throw error; }
  }
  private async deploy(name:string,args:unknown[]):Promise<Address> {
    const wallet = createWalletClient({account:this.deployer,chain:localChain,transport:http(this.rpcUrl,{retryCount:0})});
    const hash = await wallet.deployContract({abi:this.artifacts[name].abi,bytecode:this.artifacts[name].bytecode,args,gas:4_000_000n} as any);
    const receipt = await this.publicClient.waitForTransactionReceipt({hash,timeout:10_000,pollingInterval:50});
    if(receipt.status !== 'success' || !receipt.contractAddress) throw new Error(`Deploy ${name} failed`);
    return receipt.contractAddress;
  }
  private async setupWrite(address:Address,functionName:string,args:unknown[]) {
    const wallet = createWalletClient({account:this.deployer,chain:localChain,transport:http(this.rpcUrl,{retryCount:0})});
    const hash = await wallet.writeContract({address,abi:this.artifacts.LabToken.abi,functionName,args,gas:200_000n} as any);
    const receipt = await this.publicClient.waitForTransactionReceipt({hash,timeout:10_000,pollingInterval:50});
    if(receipt.status !== 'success') throw new Error(`Setup ${functionName} failed`);
  }
  env() { return this.metadata ? safe({...this.metadata,automine:this.automine}) : null; }
  /** Start a new capture boundary without changing EVM state or chain epoch. */
  beginRunCapture() {this.requireStarted();this.transactions=[];this.observations=[];}
  /** Includes nonce-gap queued transactions; failures are deliberately not treated as empty. */
  async hasPendingTransactions():Promise<boolean> {
    this.requireStarted();
    const status=await this.rpc('txpool_status');
    if(!status||!/^0x[0-9a-f]+$/i.test(status.pending)||!/^0x[0-9a-f]+$/i.test(status.queued)) throw new Error('Cannot verify transaction pool status');
    return BigInt(status.pending)>0n||BigInt(status.queued)>0n;
  }
  async exportBaseline() { this.requireStarted(); return {format:'anvil_dumpState',metadata:this.env(),state:this.baselineDump}; }
  async exportCurrentState() {
    this.requireStarted();
    const captured=await this.state();
    return {format:'anvil_dumpState',metadata:{...this.env(),captured:{blockNumber:captured.blockNumber,blockHash:captured.blockHash,chainInstanceId:captured.chainInstanceId},restoreGuarantee:'archival evidence only; automatic restoration is not implemented'},state:await this.rpc('anvil_dumpState') as string};
  }
  async stop() {
    const child=this.process; this.process=undefined; this.metadata=undefined; this.baselineSnapshot=undefined;
    if(child && child.exitCode === null) {child.kill(); await Promise.race([once(child,'exit').catch(()=>{}),delay(3_000)]);}
  }
  async reset() {
    this.requireStarted(); if(!this.baselineSnapshot) throw new Error('Baseline unavailable; restart environment.');
    const restored=await this.rpc('evm_revert',[this.baselineSnapshot]);
    if(!restored) throw new Error('Baseline snapshot expired; restart environment.');
    // Revert may not empty the transaction pool; remove every queued experiment tx.
    await this.rpc('anvil_dropAllTransactions');
    this.metadata.chainInstanceId=randomUUID();
    this.baselineSnapshot=await this.rpc('evm_snapshot'); this.snapshotIds.clear(); this.transactions=[];this.observations=[];
    await this.rpc('evm_setAutomine',[this.automine]);
    return this.state();
  }
  async snapshot() {this.requireStarted(); const id=await this.rpc('evm_snapshot'); this.snapshotIds.add(id); return id;}
  async restore(id:string) {
    this.requireStarted(); if(!this.snapshotIds.has(id)) throw new Error('Snapshot is not owned by this session.');
    if(!await this.rpc('evm_revert',[id])) throw new Error('Snapshot expired.');
    this.snapshotIds.delete(id); await this.rpc('anvil_dropAllTransactions');this.metadata.chainInstanceId=randomUUID(); return this.state();
  }
  async mine({blocks=1,seconds=1}:{blocks?:number;seconds?:number}={}) {
    this.requireStarted(); if(!Number.isInteger(blocks)||blocks<1||blocks>1000||!Number.isInteger(seconds)||seconds<1||seconds>86400) throw new Error('blocks=1..1000, seconds=1..86400');
    await this.rpc('anvil_mine',[`0x${blocks.toString(16)}`,`0x${seconds.toString(16)}`]); return this.state();
  }
  async setAutomine(enabled:boolean) {this.requireStarted();await this.rpc('evm_setAutomine',[enabled]);this.automine=enabled;return this.env();}
  async state(instrument?:StateInstrumentation):Promise<ChainState> {
    this.requireStarted(); const block=await this.publicClient.getBlock(); const blockNumber=block.number;
    const c=this.metadata.contracts;
    const read=async(address:Address,abi:Abi,functionName:string,args:unknown[]=[]) => (await this.readContract(address,abi,functionName,args,block,instrument)).result;
    const reads=[
      read(c.tokenA,this.artifacts.LabToken.abi,'balanceOf',[this.agent.address]),read(c.tokenB,this.artifacts.LabToken.abi,'balanceOf',[this.agent.address]),
      read(c.tokenA,this.artifacts.LabToken.abi,'balanceOf',[this.recipient.address]),read(c.tokenB,this.artifacts.LabToken.abi,'balanceOf',[this.recipient.address]),
      read(c.tokenA,this.artifacts.LabToken.abi,'allowance',[this.agent.address,c.amm]),read(c.tokenB,this.artifacts.LabToken.abi,'allowance',[this.agent.address,c.vault]),
      read(c.vault,this.artifacts.LabVault.abi,'balanceOf',[this.agent.address]),read(c.vault,this.artifacts.LabVault.abi,'totalAssets'),
      read(c.tokenA,this.artifacts.LabToken.abi,'balanceOf',[c.amm]),read(c.tokenB,this.artifacts.LabToken.abi,'balanceOf',[c.amm]),
      this.publicClient.getBalance({address:this.agent.address,blockNumber}),this.publicClient.getTransactionCount({address:this.agent.address,blockNumber}),
    ];
    // Settle every instrumented read before returning an error, so no late events follow tool.error.
    const results=instrument?await Promise.allSettled(reads):null;
    const failures=results?.filter((result):result is PromiseRejectedResult=>result.status==='rejected');
    const failure=failures?.find(result=>result.reason instanceof RecordingError)||failures?.[0];
    if(failure) throw failure.reason;
    const [agentA,agentB,recipientA,recipientB,ammA,vaultB,shares,vaultAssets,reserveA,reserveB,native,nonce]=results?results.map(result=>(result as PromiseFulfilledResult<any>).value):await Promise.all(reads);
    const state=safe({chainInstanceId:this.metadata.chainInstanceId,chainId:31337,blockNumber:String(blockNumber),blockHash:block.hash,timestamp:String(block.timestamp),addresses:{agent:this.agent.address,recipient:this.recipient.address,...c},balances:{agentA,agentB,recipientA,recipientB,native},allowances:{ammA,vaultB},shares,vaultAssets,reserves:{A:reserveA,B:reserveB},nonce}) as ChainState;
    return {...state,formatted:formatTokenState(state)};
  }
  private resolveAddress(value:unknown,defaultRole:string):Address {
    const role=String(value ?? defaultRole); const address=this.metadata.accounts[role]||this.metadata.contracts[role]||role;
    if(!isAddress(address)) throw new Error('Invalid account or contract address'); return address;
  }
  private amount(value:unknown):bigint {
    if(typeof value!=='string'||!/^\d+(?:\.\d{1,6})?$/.test(value)) throw new Error('Amount must be a nonnegative decimal string with <=6 fractional digits.');
    const amount=parseUnits(value,6); if(amount>=2n**256n) throw new Error('Amount exceeds uint256'); return amount;
  }
  async execute(name:string,args:Record<string,unknown>={},hooks:TxHooks={}):Promise<any> {
    this.requireStarted();
    const emit=(type:string,payload:unknown,links?:Record<string,unknown>)=>this.emit(hooks,type,payload,links);
    if(name==='get_state') return this.state({tool:name,hooks});
    const c=this.metadata.contracts;
    if(name==='get_balance') {
      if(args.token!=='A'&&args.token!=='B') throw new Error('token must be A or B');
      const address=this.resolveAddress(args.account,'agent'); const block=await this.publicClient.getBlock();
      const {result:balance,contractCallId}=await this.readContract(args.token==='A'?c.tokenA:c.tokenB,this.artifacts.LabToken.abi,'balanceOf',[address],block,{tool:name,hooks});
      const observation:BalanceObservation={tool:'get_balance',token:args.token,account:String(args.account||'agent'),address,balance:String(balance),formatted:formatUnits(balance,6),decimals:6,blockNumber:String(block.number),blockHash:block.hash,contractCallId};
      this.observations.push(safe(observation));return observation;
    }
    let address:Address,abi:Abi,functionName:string,parameters:unknown[];
    if(name==='transfer_token'||name==='approve_token') {
      if(args.token!=='A'&&args.token!=='B') throw new Error('token must be A or B');
      address=args.token==='A'?c.tokenA:c.tokenB;abi=this.artifacts.LabToken.abi;
      functionName=name==='transfer_token'?'transfer':'approve';
      parameters=[this.resolveAddress(name==='transfer_token'?args.recipient:args.spender,name==='transfer_token'?'recipient':'amm'),this.amount(args.amount)];
    } else if(name==='swap') {address=c.amm;abi=this.artifacts.LabAMM.abi;functionName='swap';parameters=[this.amount(args.amountIn),this.amount(args.minAmountOut),this.agent.address];}
    else if(name==='deposit') {address=c.vault;abi=this.artifacts.LabVault.abi;functionName='deposit';parameters=[this.amount(args.amount),this.agent.address];}
    else throw new Error(`Unknown chain tool: ${name}`);
    const call=this.contractCall(name,'transaction',address,abi,functionName,parameters,{from:this.agent.address,value:'0'});
    // Record the one conversion already used for ABI encoding, without re-parsing inputs.
    const amountFields=name==='swap' ? [['amountIn','A',0],['minAmountOut','B',1]] : [['amount',name==='deposit'?'B':String(args.token),name==='deposit'?0:1]];
    call.amountConversions=amountFields.map(([parameter,token,index])=>({parameter:String(parameter),token:String(token),unit:'token',decimals:6,input:String(args[String(parameter)]),baseUnits:String(parameters[Number(index)])}));
    const data=call.request.data,links={contractCallId:call.callId},started=performance.now();
    const contractResult=(payload:Record<string,unknown>)=>emit('contract.result',safe({callId:call.callId,kind:call.kind,...payload,duration_ms:Math.round(performance.now()-started)}),links);
    await emit('contract.call',call,links);
    let request:any,descriptor:Record<string,any>,stage='prepare';
    try {
      const nonce=await this.publicClient.getTransactionCount({address:this.agent.address,blockTag:'pending'});
      request=await this.walletClient.prepareTransactionRequest({to:address,data,value:0n,gas:1_000_000n,nonce});
      descriptor=safe({contractCallId:call.callId,amountConversions:call.amountConversions,chainId:31337,from:this.agent.address,to:address,data,value:'0',nonce,gas:'1000000',type:request.type,maxFeePerGas:request.maxFeePerGas,maxPriorityFeePerGas:request.maxPriorityFeePerGas,gasPrice:request.gasPrice,tool:name,args,signing:{kind:'local-development-account',address:this.agent.address,secretMaterial:'excluded'}});
      await emit('tx.prepared',descriptor,links);
      stage='before_submit';await hooks.beforeSubmit?.(descriptor);
    } catch(error:any) {
      if(error instanceof RecordingError) throw error;
      await contractResult({status:'error',error:error?.shortMessage||error?.name||'Transaction preparation interrupted',stage,submitted:false});
      throw error;
    }
    const record:TxRecord={...descriptor,status:'unknown'};
    try {
      // Explicit gas makes a protocol revert observable as a mined failed transaction.
      const hash=await this.walletClient.sendTransaction(request);
      record.hash=hash;record.txHash=hash;record.status='pending';this.transactions.push(record);
      await emit('tx.broadcast',{...descriptor,hash,txHash:hash,status:'pending'},links);
      const inspected=await this.inspectTransaction(hash);Object.assign(record,inspected,{tool:name,args});
      if(record.receipt) await emit('tx.receipt',record,links);
      else await emit('tx.status',record,links);
      if(record.receipt) {
        let trace:unknown;
        try { trace=await this.rpc('debug_traceTransaction',[hash,{tracer:'callTracer'}]); }
        catch {await emit('tx.trace_unavailable',{hash,contractCallId:call.callId,reason:'RPC trace not available'},links);}
        if(trace!==undefined) await emit('tx.trace',{hash,contractCallId:call.callId,trace},links);
      }
      const result:any=safe(record);
      if(name==='swap'&&inspected.status==='success') {
        for(const log of record.receipt.logs) if(log.address.toLowerCase()===c.amm.toLowerCase()) {
          try {
            const decoded=decodeEventLog({abi:this.artifacts.LabAMM.abi,data:log.data,topics:log.topics});
            if(decoded.eventName==='Swap') {const out=(decoded.args as any).amountOut;result.amountOut=String(out);result.amountOutFormatted=formatUnits(out,6);}
          } catch {}
        }
      }
      await contractResult({status:record.status,result,txHash:hash,blockNumber:record.receipt?.blockNumber,blockHash:record.receipt?.blockHash,submitted:true});
      return result;
    } catch(error:any) {
      if(error instanceof RecordingError) throw error;
      // Do not copy transport URLs or raw request headers into scientific records.
      record.error=error?.shortMessage||error?.name||'Transaction error';
      // Even a timeout without a returned hash might have submitted the transaction.
      // Only an actual status=0 receipt is classified as reverted.
      record.status='unknown';
      await emit('tx.error',safe(record),links);
      if(!record.hash) this.transactions.push(record);
      await contractResult({status:'unknown',error:record.error,txHash:record.txHash,stage:'submission_or_confirmation',submitted:record.hash?true:'unknown'});
      return safe(record);
    }
  }
  async inspectTransaction(hash:string):Promise<TxRecord> {
    const result:TxRecord={hash,txHash:hash,status:'unknown'};
    const captured=this.transactions.find(record=>(record.hash||record.txHash)===hash);
    if(captured?.contractCallId) result.contractCallId=captured.contractCallId;
    let tx:any;
    try {tx=await this.publicClient.getTransaction({hash});Object.assign(result,safe({from:tx.from,to:tx.to,data:tx.input,value:tx.value,nonce:tx.nonce,gas:tx.gas,maxFeePerGas:tx.maxFeePerGas,maxPriorityFeePerGas:tx.maxPriorityFeePerGas,gasPrice:tx.gasPrice,type:tx.type,chainId:tx.chainId,blockNumber:tx.blockNumber,blockHash:tx.blockHash,transactionIndex:tx.transactionIndex}));}
    catch(error:any) {result.error=error?.name||'transaction lookup unavailable';return result;}
    try {const receipt=await this.publicClient.getTransactionReceipt({hash});result.receipt=safe(receipt);result.status=receipt.status==='success'?'success':'reverted';}
    catch(error:any) {result.status=tx.blockNumber===null?'pending':'unknown';}
    const c=this.metadata?.contracts;
    if(c&&result.data&&result.to) {
      const target=result.to.toLowerCase();const abi=target===c.amm.toLowerCase()?this.artifacts.LabAMM.abi:target===c.vault.toLowerCase()?this.artifacts.LabVault.abi:this.artifacts.LabToken.abi;
      try {const decoded=decodeFunctionData({abi,data:result.data as Hex});result.decoded=safe({functionName:decoded.functionName,args:[...(decoded.args||[])]});} catch {}
    }
    return result;
  }
  async check(taskId:TaskId,before:ChainState,after:ChainState,txs:TxRecord[]=this.transactions,agentFinal='',options:CheckOptions={}) {
    this.requireStarted();
    const observations=this.observations.filter(item=>BigInt(item.blockNumber)>=BigInt(before.blockNumber)&&BigInt(item.blockNumber)<=BigInt(after.blockNumber));
    const runTxs=txs.filter(tx=>tx.nonce===undefined||tx.nonce>=before.nonce);
    const unavailable=(reason:string)=>({...checkTask(taskId,before,after,runTxs,agentFinal,observations,options),status:'unknown' as const,validationStatus:'evidence_missing' as const,reason});
    if(before.chainInstanceId!==this.metadata.chainInstanceId||after.chainInstanceId!==this.metadata.chainInstanceId) return unavailable('Chain epoch changed since this run; use offline replay for historical evidence.');
    try {
      const [initial,final]=await Promise.all([this.publicClient.getBlock({blockNumber:BigInt(before.blockNumber)}),this.publicClient.getBlock({blockNumber:BigInt(after.blockNumber)})]);
      if(initial.hash!==before.blockHash||final.hash!==after.blockHash) return unavailable('A referenced block was replaced; live evidence is no longer canonical.');
    } catch {return unavailable('Cannot verify referenced blocks against the live chain.');}
    const hashes=new Set(runTxs.map(tx=>tx.hash||tx.txHash).filter(Boolean) as string[]);
    // Scan the actual block interval: extra transactions omitted from Agent logs still count.
    const start=BigInt(before.blockNumber)+1n,end=BigInt(after.blockNumber);
    if(end-start>1000n) throw new Error('Checker interval exceeds 1000 blocks');
    for(let number=start;number<=end;number++) {
      const block=await this.publicClient.getBlock({blockNumber:number,includeTransactions:true});
      for(const tx of block.transactions) if(typeof tx!=='string'&&tx.from.toLowerCase()===before.addresses.agent.toLowerCase()) hashes.add(tx.hash);
    }
    const inspected=await Promise.all([...hashes].map(hash=>this.inspectTransaction(hash)));
    if(inspected.some(tx=>tx.receipt&&BigInt(tx.receipt.blockNumber)>end)) return unavailable('A supplied transaction was confirmed after the selected final state.');
    const actual=inspected.filter(tx=>(tx.nonce===undefined||tx.nonce>=before.nonce)&&(!tx.receipt||BigInt(tx.receipt.blockNumber)>=start));
    for(const tx of runTxs) if(!tx.hash&&!tx.txHash) actual.push(tx);
    return checkTask(taskId,before,after,actual,agentFinal,observations,options);
  }
}
