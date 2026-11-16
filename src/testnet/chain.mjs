import {readFile,mkdir,open,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {viem,privateKeyToAccount,mnemonicToAccount} from '../../packages/payment-adapters/runtime.mjs';
import {getNetworkProfile,validateRpcUrl} from './networks.mjs';

const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
const copy=value=>JSON.parse(json(value));
const lower=value=>String(value??'').toLowerCase();
const isHash=value=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const contractNames={tokenA:'LabToken',tokenB:'LabToken',amm:'LabAMM',vault:'LabVault'};
const walletQueues=new Map(),walletPending=new Map();
let knownDevelopmentAddresses;
function developmentAddress(address){
 // These are public test credentials, never actual application wallet material.
 knownDevelopmentAddresses??=new Set(Array.from({length:20},(_,addressIndex)=>lower(mnemonicToAccount('test test test test test test test test test test test junk',{addressIndex}).address)));
 return knownDevelopmentAddresses.has(lower(address));
}
function failure(code){const e=Error(code);e.code=code;return e;}
const sha=v=>createHash('sha256').update(v).digest('hex');
const safeError=(e,fallback)=>failure(typeof e?.code==='string'&&/^[A-Z][A-Z0-9_]{2,79}$/.test(e.code)?e.code:fallback);
async function durable(path,text){const f=await open(path,'a',0o600);try{await f.writeFile(text);await f.sync();}finally{await f.close();}}
async function atomic(path,value){const temp=path+'.'+randomUUID()+'.tmp';const f=await open(temp,'wx',0o600);try{await f.writeFile(json(value)+'\n');await f.sync();}finally{await f.close();}await rename(temp,path);}
function formatted(state){const map=(obj,native=false)=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,viem.formatUnits(BigInt(v),native&&k==='native'?18:6)]));return {unit:'token',tokenDecimals:6,nativeDecimals:18,balances:map(state.balances,true),allowances:map(state.allowances),reserves:map(state.reserves),shares:viem.formatUnits(BigInt(state.shares),6),vaultAssets:viem.formatUnits(BigInt(state.vaultAssets),6)};}

/** Standard RPC only. Ownership of a remote chain is never implied. Keys and
 * signed transaction bytes are held in private fields / lexical variables only.
 * This preview supports the versioned Lab fixture, not arbitrary ERC20/DEXs. */
export class PublicEvmChain {
 #account;#url;#closed=false;#metadata=null;#manifest=null;#artifacts={};#pending=new Map();#events=[];#broken=false;#eventQueue=Promise.resolve();#attached=false;#deployPromise=null;
 constructor({root,dataDir,profileId,rpcUrl,privateKey,accountAddress,recipient,lib={},allowLoopback=false,receiptTimeoutMs,confirmations}={}){
  this.profile=getNetworkProfile(profileId);if(!this.profile.writeEnabled)throw failure('TESTNET_PROFILE_CATALOG_ONLY');
  this.root=resolve(root??process.cwd());this.dataDir=resolve(dataDir??join(this.root,'data','testnet',randomUUID()));this.lib=lib;
  const url=validateRpcUrl(rpcUrl??this.profile.rpcUrl,{allowLoopback});this.#url=url.href;this.endpointHost=url.hostname;
  this.executionMode=allowLoopback&&url.protocol==='http:'?'isolated_evm_rpc':'public_evm';
  if(privateKey){if(!/^0x[0-9a-f]{64}$/i.test(privateKey))throw failure('INVALID_TEST_PRIVATE_KEY');try{this.#account=privateKeyToAccount(privateKey);}catch{throw failure('INVALID_TEST_PRIVATE_KEY');}if(developmentAddress(this.#account.address))throw failure('PUBLIC_DEVELOPMENT_KEY_FORBIDDEN');}
  this.address=this.#account?.address??accountAddress;if(!viem.isAddress(this.address))throw failure('TEST_ACCOUNT_ADDRESS_REQUIRED');
  if(accountAddress&&lower(accountAddress)!==lower(this.address))throw failure('SIGNER_ADDRESS_MISMATCH');
  if(recipient&&!viem.isAddress(recipient))throw failure('INVALID_RECIPIENT');this.recipient=recipient;
  this.receiptTimeoutMs=receiptTimeoutMs??this.profile.receiptTimeoutMs;this.confirmations=confirmations??this.profile.confirmations;
  if(!Number.isSafeInteger(this.receiptTimeoutMs)||this.receiptTimeoutMs<100||this.receiptTimeoutMs>600000||!Number.isSafeInteger(this.confirmations)||this.confirmations<1||this.confirmations>64)throw failure('INVALID_CONFIRMATION_POLICY');
  const chain=viem.defineChain({id:this.profile.chainId,name:this.profile.name,nativeCurrency:{name:this.profile.symbol,symbol:this.profile.symbol,decimals:18},rpcUrls:{default:{http:[this.#url]}}});
  // fetch follows no redirects: do not silently submit to a redirected RPC host.
  const transport=()=>viem.http(this.#url,{retryCount:0,timeout:15000,fetchOptions:{redirect:'error'}});
  this.publicClient=viem.createPublicClient({chain,transport:transport(),cacheTime:0,pollingInterval:500});
  this.walletClient=this.#account?viem.createWalletClient({chain,account:this.#account,transport:transport()}):null;
  this.transactions=[];this.observations=[];this.runId=null;
 }
 #walletKey(){return `${this.profile.chainId}:${lower(this.address)}`;}
 #ensure(){if(!this.#metadata||this.#closed)throw failure('TESTNET_NOT_CONNECTED');if(this.#broken)throw failure('DURABLE_RECORDING_FAILED');}
 #ready(){this.#ensure();if(!this.#attached||this.#manifest?.status!=='ready')throw failure('TESTNET_FIXTURE_NOT_READY');}
 #secretSafe(value){
  const clean=(v,k='',parent='')=>{if(k==='signature'&&parent==='function'&&typeof v==='string'&&/^[A-Za-z_]\w*\([A-Za-z0-9_,()[\]]*\)$/.test(v))return v;if(/^(private.?key|mnemonic|signature|serializedTransaction|rawTransaction|rpcUrl|url)$/i.test(k))return '[REDACTED]';if(typeof v==='bigint')return String(v);if(Array.isArray(v))return v.map(x=>clean(x));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([key,x])=>[key,clean(x,key,k)]));if(typeof v==='string'&&/^https?:\/\//i.test(v))return '[RPC_URL_REDACTED]';return v;};
  return clean(value);
 }
 async #emit(type,payload,hooks={},links={}){
  const perform=async()=>{
  const event={seq:this.#events.length+1,at:new Date().toISOString(),type,runId:this.runId,payload:this.#secretSafe(payload),links:copy(links)};
  try{await durable(join(this.dataDir,'tx-events.jsonl'),json(event)+'\n');this.#events.push(event);await hooks.emit?.(type,event.payload,event.links);return event;}
  catch{this.#broken=true;throw failure('DURABLE_RECORDING_FAILED');}
  };const result=this.#eventQueue.then(perform);this.#eventQueue=result.catch(()=>{});return result;
 }
 async #saveManifest(){try{await atomic(join(this.dataDir,'deployment.json'),this.#manifest);}catch{this.#broken=true;throw failure('DURABLE_RECORDING_FAILED');}}
 async #network(){try{if(await this.publicClient.getChainId()!==this.profile.chainId)throw failure('TESTNET_CHAIN_ID_MISMATCH');}catch(e){throw safeError(e,'RPC_NETWORK_UNAVAILABLE');}}
 #fingerprints(){return Object.fromEntries(Object.entries(this.#artifacts).map(([name,a])=>[name,{sourceSha256:a.sourceSha256,bytecodeSha256:a.bytecodeSha256,compiler:a.compiler,evmVersion:a.evmVersion}]));}
 async connect(){try{return await this.#connect();}catch(e){throw safeError(e,'TESTNET_CONNECT_FAILED');}}
 async #connect(){
  if(this.#closed)throw failure('TESTNET_CLOSED');await this.#network();
  const genesis=await this.publicClient.getBlock({blockNumber:0n});const latest=await this.publicClient.getBlock();
  await mkdir(this.dataDir,{recursive:true});
  try{
   const content=await readFile(join(this.dataDir,'tx-events.jsonl'),'utf8');
   this.#events=content.trim()?content.trim().split('\n').map(line=>JSON.parse(line)):[];
   for(const e of this.#events){if(e.type==='tx.intent'&&e.payload.chainId===this.profile.chainId&&lower(e.payload.from)===lower(this.address))this.#pending.set(e.payload.hash,e.payload);if(e.type==='tx.confirmed'){this.#pending.delete(e.payload.hash);walletPending.delete(this.#walletKey()+':'+e.payload.hash);}}
  }catch(e){if(e.code!=='ENOENT')throw failure('CORRUPT_TESTNET_JOURNAL');}
  for(const [hash,r] of this.#pending)walletPending.set(this.#walletKey()+':'+hash,r);
  for(const name of ['LabToken','LabAMM','LabVault']){const a=JSON.parse(await readFile(join(this.root,'contracts','testnet-artifacts',name+'.json'),'utf8'));if(a.evmVersion!=='paris'||a.bytecodeSha256!==sha(Buffer.from(a.bytecode.slice(2),'hex')))throw failure('FIXTURE_BUILD_FINGERPRINT_MISMATCH');this.#artifacts[name]=a;}
  this.#metadata={profileId:this.profile.id,chainId:this.profile.chainId,chainInstanceId:randomUUID(),chain_execution:this.executionMode,networkName:this.profile.name,endpointHost:this.endpointHost,genesisHash:genesis.hash,accounts:{agent:this.address,deployer:this.address,...(this.recipient?{recipient:this.recipient}:{})},contracts:{},connectedAt:new Date().toISOString(),blockNumber:String(latest.number),confirmationPolicy:{confirmations:this.confirmations,timeoutMs:this.receiptTimeoutMs,meaning:'canonical inclusion depth; not a claim of L1 rollup finality'},capabilities:this.profile.capabilities};
  try{const saved=JSON.parse(await readFile(join(this.dataDir,'deployment.json'),'utf8'));if(saved.chainId!==this.profile.chainId||lower(saved.accounts?.agent)!==lower(this.address)||saved.genesisHash!==genesis.hash)throw failure('SAVED_DEPLOYMENT_IDENTITY_MISMATCH');this.#manifest=saved;}
  catch(e){if(e.code!=='ENOENT')throw e.code?e:failure('CORRUPT_DEPLOYMENT_MANIFEST');}
  this.#metadata.nativeBalance=String(await this.publicClient.getBalance({address:this.address}));this.#metadata.nativeBalanceFormatted=viem.formatUnits(BigInt(this.#metadata.nativeBalance),18);
  await this.#emit('network.connected',this.env());
  return this.env();
 }
 env(){if(!this.#metadata)return null;return copy({...this.#metadata,signerAvailable:!!this.#account,readiness:this.#attached?'ready':this.#manifest?.status==='ready'?'needs-attach':this.#manifest?.status??'connected',contracts:this.#manifest?.contracts??{},accounts:{...this.#metadata.accounts,...(this.recipient?{recipient:this.recipient}:{})},deploymentId:this.#manifest?.deploymentId??null,unresolved:[...new Set([...this.#pending.keys(),...[...walletPending].filter(([k])=>k.startsWith(this.#walletKey()+':')).map(([,v])=>v.hash)])]});}
 getManifest(){this.#ready();return copy(this.#manifest);}
 beginRunCapture(runId=null){this.#ready();if(this.env().unresolved.length)throw failure('UNRESOLVED_TESTNET_TRANSACTION');this.transactions=[];this.observations=[];this.runId=runId;}
 async #serial(fn){const key=this.#walletKey(),old=walletQueues.get(key)??Promise.resolve();const p=old.then(fn);walletQueues.set(key,p.catch(()=>{}));return p;}
 async #writeGuard(){this.#ensure();if(!this.#account||!this.walletClient)throw failure('TESTNET_READ_ONLY');if([...walletPending.keys()].some(k=>k.startsWith(this.#walletKey()+':'))||this.#pending.size)throw failure('UNRESOLVED_TESTNET_TRANSACTION');await this.#network();}
 async #transact(request,description,hooks={}){
  return this.#serial(async()=>{
   await this.#writeGuard();let prepared,signed,hash;
   try{
    const nonce=await this.publicClient.getTransactionCount({address:this.address,blockTag:'pending'});
    const block=await this.publicClient.getBlock(),type=typeof block.baseFeePerGas==='bigint'?'eip1559':'legacy';
    const fees=await this.publicClient.estimateFeesPerGas({type});
    const gas=await this.publicClient.estimateGas({...request,account:this.address});
    // Supply fee/gas fields explicitly: newer viem versions opportunistically
    // invoke eth_fillTransaction, which is absent from many public gateways.
    prepared=await this.walletClient.prepareTransactionRequest({...request,...fees,gas,type,account:this.#account,chainId:this.profile.chainId,nonce,parameters:['chainId','nonce','type']});
    if(prepared.chainId!==this.profile.chainId||prepared.nonce!==nonce||lower(prepared.to)!==lower(request.to)||prepared.data!==request.data||prepared.value!==request.value)throw failure('PREPARED_TRANSACTION_IDENTITY_MISMATCH');
    signed=await this.walletClient.signTransaction(prepared);hash=viem.keccak256(signed);
   }catch{throw failure('TESTNET_PREPARE_FAILED');}
   const record=copy({...description,hash,txHash:hash,chainId:this.profile.chainId,from:this.address,to:prepared.to??null,data:prepared.data??'0x',value:prepared.value??0n,nonce:prepared.nonce,gas:prepared.gas,type:prepared.type,maxFeePerGas:prepared.maxFeePerGas,maxPriorityFeePerGas:prepared.maxPriorityFeePerGas,gasPrice:prepared.gasPrice,status:'unknown',signing:{kind:'dedicated-test-account',address:this.address,secretMaterial:'excluded'}});
   const links={...(description.contractCallId?{contractCallId:description.contractCallId}:{}),txHash:hash};
   await this.#emit('tx.prepared',record,hooks,links);await hooks.beforeSubmit?.(copy(record));
   this.#ensure();await this.#network();
   // Mark globally before durable IO: recording failure must not permit another
   // writer to advance this wallet while submission certainty is unresolved.
   this.#pending.set(hash,record);walletPending.set(this.#walletKey()+':'+hash,record);
   await this.#emit('tx.intent',{...record,submission:'not-yet-broadcast'},hooks,links);
   this.transactions.push(record);
   try{const returned=await this.publicClient.sendRawTransaction({serializedTransaction:signed});if(lower(returned)!==lower(hash))throw failure('TX_HASH_MISMATCH');record.status='pending';await this.#emit('tx.broadcast',record,hooks,links);}
   catch(e){if(this.#broken)throw e;record.status='unknown';record.error='BROADCAST_RESULT_UNKNOWN';await this.#emit('tx.status',record,hooks,links);return copy(record);}
   finally{signed=undefined;}
   const until=Date.now()+this.receiptTimeoutMs;let inspected;
   do{inspected=await this.inspectTransaction(hash);if(['success','reverted'].includes(inspected.status))break;if(Date.now()<until)await sleep(Math.min(500,until-Date.now()));}while(Date.now()<until);
   Object.assign(record,inspected,{tool:description.tool,args:description.args,operation:description.operation});
   if(['success','reverted'].includes(record.status)){
    await this.#emit('tx.receipt',record,hooks,links);await this.#emit('tx.confirmed',record,hooks,links);
    this.#pending.delete(hash);walletPending.delete(this.#walletKey()+':'+hash);
    // A public RPC can intentionally omit trace; this does not invalidate receipts.
    try{const trace=await this.publicClient.request({method:'debug_traceTransaction',params:[hash,{tracer:'callTracer'}]});await this.#emit('tx.trace',{hash,contractCallId:record.contractCallId,trace},hooks,links);}
    catch(e){if(this.#broken)throw e;await this.#emit('tx.trace_unavailable',{hash,contractCallId:record.contractCallId,reason:'RPC trace not available'},hooks,links);}
   }else{record.error='CONFIRMATION_INCOMPLETE';await this.#emit('tx.status',record,hooks,links);}
   return copy(record);
  });
 }
 async inspectTransaction(hash){
  this.#ensure();if(!isHash(hash))throw failure('INVALID_TX_HASH');const out={hash,txHash:hash,status:'unknown'};
  try{
   await this.#network();const tx=await this.publicClient.getTransaction({hash});
   if(lower(tx.hash)!==lower(hash)||lower(tx.from)!==lower(this.address)||Number(tx.chainId)!==this.profile.chainId)return {...out,error:'TRANSACTION_IDENTITY_MISMATCH'};
   Object.assign(out,copy({from:tx.from,to:tx.to,data:tx.input,value:tx.value,nonce:tx.nonce,chainId:tx.chainId,gas:tx.gas,gasPrice:tx.gasPrice,maxFeePerGas:tx.maxFeePerGas,maxPriorityFeePerGas:tx.maxPriorityFeePerGas,type:tx.type}));
   let receipt;try{receipt=await this.publicClient.getTransactionReceipt({hash});}catch{return {...out,status:tx.blockNumber===null?'pending':'unknown'};}
   if(lower(receipt.transactionHash)!==lower(hash)||lower(receipt.from)!==lower(this.address)||lower(receipt.to)!==lower(tx.to)||!['success','reverted'].includes(receipt.status))return {...out,error:'RECEIPT_IDENTITY_MISMATCH'};
   const canonical=await this.publicClient.getBlock({blockNumber:receipt.blockNumber});
   if(canonical.hash!==receipt.blockHash)return {...out,error:'RECEIPT_REORGED'};
   const head=await this.publicClient.getBlockNumber({cacheTime:0});const depth=head-receipt.blockNumber+1n;
   if(depth<1n)return {...out,error:'RECEIPT_AHEAD_OF_HEAD'};
   Object.assign(out,{receipt:copy(receipt),confirmations:Number(depth),requiredConfirmations:this.confirmations,status:depth>=BigInt(this.confirmations)?(receipt.status==='success'?'success':'reverted'):'pending'});
   const c=this.#manifest?.contracts;if(c&&tx.to){const name=lower(tx.to)===lower(c.amm)?'LabAMM':lower(tx.to)===lower(c.vault)?'LabVault':'LabToken';try{out.decoded=copy(viem.decodeFunctionData({abi:this.#artifacts[name].abi,data:tx.input}));}catch{}}
   return out;
  }catch{return {...out,error:'RPC_EVIDENCE_UNAVAILABLE'};}
 }
 async reconcile(records=[]){
  this.#ensure();for(const r of records){const hash=r.hash??r.txHash;if(isHash(hash)&&(!r.from||lower(r.from)===lower(this.address))&&(!r.chainId||r.chainId===this.profile.chainId)&&!['success','reverted'].includes(r.status)){this.#pending.set(hash,{...r,hash});walletPending.set(this.#walletKey()+':'+hash,{...r,hash});}}
  const results=[];for(const [hash,original] of [...this.#pending]){const inspected={...original,...await this.inspectTransaction(hash)};if(['success','reverted'].includes(inspected.status)){await this.#emit('tx.confirmed',inspected);this.#pending.delete(hash);walletPending.delete(this.#walletKey()+':'+hash);}else await this.#emit('tx.reconciled',inspected);const inRun=this.transactions.find(t=>t.hash===hash);if(inRun)Object.assign(inRun,inspected);results.push(inspected);}return copy(results);
 }
 async deploy(hooks={}){if(this.#deployPromise)return this.#deployPromise;const p=this.#deploy(hooks).catch(e=>{throw safeError(e,'TESTNET_DEPLOY_FAILED');});this.#deployPromise=p;try{return await p;}finally{this.#deployPromise=null;}}
 async #deploy(hooks={}){
  this.#ensure();if(!this.recipient||lower(this.recipient)===lower(this.address))throw failure('DISTINCT_RECIPIENT_REQUIRED');
  if(this.#manifest?.status==='ready'){await this.attach(this.#manifest);return copy(this.#manifest);}
  if(!this.#manifest){this.#manifest={schema:'web3-agent-lab-public-fixture-v1',deploymentId:randomUUID(),status:'partial',profileId:this.profile.id,chainId:this.profile.chainId,genesisHash:this.#metadata.genesisHash,accounts:{agent:this.address,deployer:this.address,recipient:this.recipient},contracts:{},deployments:{},setup:{},tokenDecimals:6,fixture:'LabContracts.sol/paris',artifacts:this.#fingerprints(),createdAt:new Date().toISOString()};await this.#saveManifest();}
  const m=this.#manifest;if(json(m.artifacts)!==json(this.#fingerprints())||m.fixture!=='LabContracts.sol/paris')throw failure('FIXTURE_BUILD_FINGERPRINT_MISMATCH');
  // A crash after confirmed journal append but before manifest update is
  // recovered by operation name; never blindly redeploy a confirmed stage.
  for(const event of this.#events){const r=event.payload;if(event.type==='tx.confirmed'&&r.status==='success'&&r.deploymentId===m.deploymentId){if(r.operation?.startsWith('deploy:')){const key=r.operation.slice(7);if(r.receipt?.contractAddress){m.contracts[key]=r.receipt.contractAddress;m.deployments[key]={txHash:r.hash,address:r.receipt.contractAddress,receipt:r.receipt};}}if(r.operation?.startsWith('setup:'))m.setup[r.operation.slice(6)]={txHash:r.hash,receipt:r.receipt};}}
  for(const key of ['tokenA','tokenB','amm','vault']){
   const name=contractNames[key],args=key==='tokenA'?['Token A','TKA']:key==='tokenB'?['Token B','TKB']:key==='amm'?[m.contracts.tokenA,m.contracts.tokenB]:[m.contracts.tokenB];
   const data=viem.encodeDeployData({abi:this.#artifacts[name].abi,bytecode:this.#artifacts[name].bytecode,args});
   if(m.contracts[key]){const hash=m.deployments[key]?.txHash;if(!isHash(hash))throw failure('PARTIAL_DEPLOYMENT_PROOF_MISSING');const prior=await this.inspectTransaction(hash),code=await this.publicClient.getCode({address:m.contracts[key]});if(prior.status!=='success'||prior.to!==null||prior.data!==data||lower(prior.receipt?.contractAddress)!==lower(m.contracts[key])||!code||code==='0x')throw failure('PARTIAL_DEPLOYMENT_PROOF_MISMATCH');continue;}
   const r=await this.#transact({data,value:0n},{operation:'deploy:'+key,deploymentId:m.deploymentId,tool:'deploy_fixture'},hooks);
   if(r.status!=='success'||!r.receipt?.contractAddress){await this.#saveManifest();throw failure('FIXTURE_DEPLOYMENT_INCOMPLETE');}
   m.contracts[key]=r.receipt.contractAddress;m.deployments[key]={txHash:r.hash,address:r.receipt.contractAddress,receipt:r.receipt};await this.#saveManifest();
  }
  const setup=[['agentA',m.contracts.tokenA,this.address,100000000n],['poolA',m.contracts.tokenA,m.contracts.amm,10000000000n],['poolB',m.contracts.tokenB,m.contracts.amm,10000000000n]];
  for(const [key,to,receiver,amount] of setup){const data=viem.encodeFunctionData({abi:this.#artifacts.LabToken.abi,functionName:'mint',args:[receiver,amount]});if(m.setup[key]){const prior=await this.inspectTransaction(m.setup[key].txHash);if(prior.status!=='success'||lower(prior.to)!==lower(to)||prior.data!==data||prior.value!=='0')throw failure('PARTIAL_SETUP_PROOF_MISMATCH');continue;}const r=await this.#transact({to,data,value:0n},{operation:'setup:'+key,deploymentId:m.deploymentId,tool:'initialize_fixture'},hooks);if(r.status!=='success'){await this.#saveManifest();throw failure('FIXTURE_SETUP_INCOMPLETE');}m.setup[key]={txHash:r.hash,receipt:r.receipt};await this.#saveManifest();}
  m.codeHashes={};for(const [key,address] of Object.entries(m.contracts)){const code=await this.publicClient.getCode({address});if(!code||code==='0x')throw failure('FIXTURE_CODE_MISSING');m.codeHashes[key]=viem.keccak256(code);}
  m.status='ready';m.completedAt=new Date().toISOString();await this.#saveManifest();await this.attach(m);this.transactions=[];return copy(m);
 }
 async attach(manifest){try{return await this.#attach(manifest);}catch(e){throw safeError(e,'TESTNET_ATTACH_FAILED');}}
 async #attach(manifest){
  this.#ensure();await this.#network();const input=copy(manifest);
  const allowed=['schema','deploymentId','status','profileId','chainId','genesisHash','accounts','contracts','deployments','setup','tokenDecimals','fixture','artifacts','createdAt','completedAt','codeHashes'];
  if(Object.keys(input).some(k=>!allowed.includes(k)))throw failure('UNEXPECTED_MANIFEST_FIELD');
  const m={schema:input.schema,deploymentId:input.deploymentId,status:input.status,profileId:input.profileId,chainId:input.chainId,genesisHash:input.genesisHash,accounts:{agent:input.accounts?.agent,deployer:input.accounts?.deployer,recipient:input.accounts?.recipient},contracts:Object.fromEntries(Object.keys(contractNames).map(k=>[k,input.contracts?.[k]])),deployments:{},setup:{},tokenDecimals:input.tokenDecimals,fixture:input.fixture,artifacts:input.artifacts,createdAt:input.createdAt,completedAt:input.completedAt,codeHashes:Object.fromEntries(Object.keys(contractNames).map(k=>[k,input.codeHashes?.[k]]))};
  if(!/^[0-9a-f-]{36}$/i.test(m.deploymentId)||m.profileId!==this.profile.id||lower(m.accounts.deployer)!==lower(this.address)||m.fixture!=='LabContracts.sol/paris'||json(m.artifacts)!==json(this.#fingerprints())||!Number.isFinite(Date.parse(m.createdAt))||!Number.isFinite(Date.parse(m.completedAt)))throw failure('FIXTURE_BUILD_FINGERPRINT_MISMATCH');
  if(m.schema!=='web3-agent-lab-public-fixture-v1'||m.status!=='ready'||m.chainId!==this.profile.chainId||m.genesisHash!==this.#metadata.genesisHash||lower(m.accounts?.agent)!==lower(this.address)||m.tokenDecimals!==6||!viem.isAddress(m.accounts?.recipient)||lower(m.accounts?.recipient)===lower(this.address))throw failure('INVALID_FIXTURE_MANIFEST');
  if(this.recipient&&lower(this.recipient)!==lower(m.accounts.recipient))throw failure('MANIFEST_RECIPIENT_MISMATCH');
  const expectedKeys=['tokenA','tokenB','amm','vault'];if(expectedKeys.some(k=>!viem.isAddress(m.contracts?.[k])||!isHash(m.codeHashes?.[k])||!isHash(input.deployments?.[k]?.txHash))||new Set(expectedKeys.map(k=>lower(m.contracts[k]))).size!==4)throw failure('INCOMPLETE_FIXTURE_MANIFEST');
  for(const key of expectedKeys){
   const address=m.contracts[key],artifact=this.#artifacts[contractNames[key]],code=await this.publicClient.getCode({address});if(!code||code==='0x'||viem.keccak256(code)!==m.codeHashes[key])throw failure('FIXTURE_CODE_HASH_MISMATCH');
   const args=key==='tokenA'?['Token A','TKA']:key==='tokenB'?['Token B','TKB']:key==='amm'?[m.contracts.tokenA,m.contracts.tokenB]:[m.contracts.tokenB];
   const tx=await this.publicClient.getTransaction({hash:input.deployments[key].txHash}),r=await this.inspectTransaction(input.deployments[key].txHash);
   if(r.status!=='success'||lower(r.receipt?.contractAddress)!==lower(address)||tx.to!==null||tx.input!==viem.encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args}))throw failure('FIXTURE_CREATION_PROOF_MISMATCH');
   m.deployments[key]={txHash:r.hash,address:r.receipt.contractAddress,receipt:r.receipt};
  }
  for(const [key,to,receiver,amount] of [['agentA',m.contracts.tokenA,this.address,100000000n],['poolA',m.contracts.tokenA,m.contracts.amm,10000000000n],['poolB',m.contracts.tokenB,m.contracts.amm,10000000000n]]){
   const hash=input.setup?.[key]?.txHash;if(!isHash(hash))throw failure('FIXTURE_SETUP_PROOF_MISSING');
   const r=await this.inspectTransaction(hash),data=viem.encodeFunctionData({abi:this.#artifacts.LabToken.abi,functionName:'mint',args:[receiver,amount]});
   if(r.status!=='success'||lower(r.to)!==lower(to)||r.data!==data||r.value!=='0')throw failure('FIXTURE_SETUP_PROOF_MISMATCH');
   m.setup[key]={txHash:hash,receipt:r.receipt};
  }
  const read=(address,abi,functionName,args=[])=>this.publicClient.readContract({address,abi,functionName,args});
  for(const key of ['tokenA','tokenB']){if(Number(await read(m.contracts[key],this.#artifacts.LabToken.abi,'decimals'))!==6||lower(await read(m.contracts[key],this.#artifacts.LabToken.abi,'owner'))!==lower(this.address))throw failure('FIXTURE_TOKEN_IDENTITY_MISMATCH');}
  if(lower(await read(m.contracts.amm,this.#artifacts.LabAMM.abi,'tokenA'))!==lower(m.contracts.tokenA)||lower(await read(m.contracts.amm,this.#artifacts.LabAMM.abi,'tokenB'))!==lower(m.contracts.tokenB)||lower(await read(m.contracts.vault,this.#artifacts.LabVault.abi,'asset'))!==lower(m.contracts.tokenB))throw failure('FIXTURE_ASSET_BINDING_MISMATCH');
  this.#manifest=m;this.#attached=true;this.recipient=m.accounts.recipient;this.#metadata.chainInstanceId=m.deploymentId;await this.#saveManifest();await this.#emit('environment.attached',this.env());return this.env();
 }
 async #call(tool,address,abi,functionName,args,block,hooks={}){
  const callId=randomUUID(),data=viem.encodeFunctionData({abi,functionName,args});const item=viem.getAbiItem({abi,name:functionName,args});
  const call={callId,kind:'read',tool,chainId:this.profile.chainId,contract:{address,label:functionName},function:{name:functionName,signature:viem.toFunctionSignature(item),selector:data.slice(0,10),args:copy(args)},request:{to:address,data,blockNumber:String(block.number),blockHash:block.hash}};
  await this.#emit('contract.call',call,hooks,{contractCallId:callId});
  try{const result=await this.publicClient.readContract({address,abi,functionName,args,blockNumber:block.number});await this.#emit('contract.result',{callId,kind:'read',status:'success',result,blockNumber:String(block.number),blockHash:block.hash},hooks,{contractCallId:callId});return {result,callId};}
  catch(e){if(this.#broken)throw e;await this.#emit('contract.result',{callId,kind:'read',status:'error',error:'CONTRACT_READ_FAILED'},hooks,{contractCallId:callId});throw failure('CONTRACT_READ_FAILED');}
 }
 async state(instrument){try{return await this.#state(instrument);}catch(e){throw safeError(e,'TESTNET_STATE_FAILED');}}
 async #state(instrument){
  this.#ready();await this.#network();const b=await this.publicClient.getBlock(),c=this.#manifest.contracts;
  const read=async(address,abi,fn,args=[])=>instrument?(await this.#call(instrument.tool,address,abi,fn,args,b,instrument.hooks)).result:this.publicClient.readContract({address,abi,functionName:fn,args,blockNumber:b.number});
  const a=this.#artifacts,values=await Promise.allSettled([read(c.tokenA,a.LabToken.abi,'balanceOf',[this.address]),read(c.tokenB,a.LabToken.abi,'balanceOf',[this.address]),read(c.tokenA,a.LabToken.abi,'balanceOf',[this.recipient]),read(c.tokenB,a.LabToken.abi,'balanceOf',[this.recipient]),read(c.tokenA,a.LabToken.abi,'allowance',[this.address,c.amm]),read(c.tokenB,a.LabToken.abi,'allowance',[this.address,c.vault]),read(c.vault,a.LabVault.abi,'balanceOf',[this.address]),read(c.vault,a.LabVault.abi,'totalAssets'),read(c.tokenA,a.LabToken.abi,'balanceOf',[c.amm]),read(c.tokenB,a.LabToken.abi,'balanceOf',[c.amm]),this.publicClient.getBalance({address:this.address,blockNumber:b.number}),this.publicClient.getTransactionCount({address:this.address,blockNumber:b.number})]);
  if(values.some(v=>v.status==='rejected'))throw failure('STATE_EVIDENCE_UNAVAILABLE');
  if((await this.publicClient.getBlock({blockNumber:b.number})).hash!==b.hash)throw failure('STATE_REORGED');
  const [agentA,agentB,recipientA,recipientB,ammA,vaultB,shares,vaultAssets,A,B,native,nonce]=values.map(v=>v.value);
  this.#metadata.nativeBalance=String(native);this.#metadata.nativeBalanceFormatted=viem.formatUnits(native,18);
  const s=copy({chainInstanceId:this.#manifest.deploymentId,chainId:this.profile.chainId,blockNumber:String(b.number),blockHash:b.hash,timestamp:String(b.timestamp),addresses:{agent:this.address,recipient:this.recipient,...c},balances:{agentA,agentB,recipientA,recipientB,native},allowances:{ammA,vaultB},shares,vaultAssets,reserves:{A,B},nonce});return {...s,formatted:formatted(s)};
 }
 #amount(value){if(typeof value!=='string'||!/^\d+(?:\.\d{1,6})?$/.test(value))throw failure('AMOUNT_REQUIRES_HUMAN_TOKEN_STRING');const n=viem.parseUnits(value,6);if(n>=2n**256n)throw failure('AMOUNT_OUT_OF_RANGE');return n;}
 #address(value,fallback){const v=String(value??fallback),address=this.env().accounts[v]??this.#manifest.contracts[v]??v;if(!viem.isAddress(address))throw failure('INVALID_TOOL_ADDRESS');return address;}
 async execute(name,args={},hooks={}){try{return await this.#execute(name,args,hooks);}catch(e){throw safeError(e,'TESTNET_EXECUTION_ERROR');}}
 async #execute(name,args={},hooks={}){
  this.#ready();await this.#network();const c=this.#manifest.contracts,a=this.#artifacts;
  const allowed={get_state:[],get_balance:['token','account'],transfer_token:['token','recipient','amount'],approve_token:['token','spender','amount'],swap:['amountIn','minAmountOut'],deposit:['amount']};
  if(!allowed[name])throw failure('UNKNOWN_TESTNET_TOOL');
  if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).some(k=>!allowed[name].includes(k)))throw failure('INVALID_TOOL_ARGUMENTS');
  if(name==='get_state')return this.state({tool:name,hooks});
  if(name==='get_balance'){
   if(!['A','B'].includes(args.token))throw failure('UNKNOWN_FIXTURE_TOKEN');const address=this.#address(args.account,'agent'),b=await this.publicClient.getBlock();
   const {result,callId}=await this.#call(name,args.token==='A'?c.tokenA:c.tokenB,a.LabToken.abi,'balanceOf',[address],b,hooks);
   if((await this.publicClient.getBlock({blockNumber:b.number})).hash!==b.hash)throw failure('QUERY_BLOCK_REORGED');
   const observation={tool:name,token:args.token,account:args.account??'agent',address,balance:String(result),formatted:viem.formatUnits(result,6),decimals:6,blockNumber:String(b.number),blockHash:b.hash,contractCallId:callId};this.observations.push(observation);return copy(observation);
  }
  let address,abi,functionName,params;
  if(['transfer_token','approve_token'].includes(name)){if(!['A','B'].includes(args.token))throw failure('UNKNOWN_FIXTURE_TOKEN');address=args.token==='A'?c.tokenA:c.tokenB;abi=a.LabToken.abi;functionName=name==='transfer_token'?'transfer':'approve';params=[this.#address(name==='transfer_token'?args.recipient:args.spender,name==='transfer_token'?'recipient':'amm'),this.#amount(args.amount)];}
  else if(name==='swap'){address=c.amm;abi=a.LabAMM.abi;functionName='swap';params=[this.#amount(args.amountIn),this.#amount(args.minAmountOut),this.address];}
  else if(name==='deposit'){address=c.vault;abi=a.LabVault.abi;functionName='deposit';params=[this.#amount(args.amount),this.address];}
  else throw failure('UNKNOWN_TESTNET_TOOL');
  const callId=randomUUID(),data=viem.encodeFunctionData({abi,functionName,args:params}),item=viem.getAbiItem({abi,name:functionName,args:params});
  const fields=name==='swap'?[['amountIn','A',0],['minAmountOut','B',1]]:[['amount',name==='deposit'?'B':args.token,name==='deposit'?0:1]];
  const amountConversions=fields.map(([parameter,token,index])=>({parameter,token,unit:'token',decimals:6,input:String(args[parameter]),baseUnits:String(params[index])}));
  await this.#emit('contract.call',{callId,kind:'transaction',tool:name,chainId:this.profile.chainId,contract:{address,label:functionName},function:{name:functionName,signature:viem.toFunctionSignature(item),selector:data.slice(0,10),args:params},request:{from:this.address,to:address,data,value:'0'},amountConversions},hooks,{contractCallId:callId});
  try{
   const r=await this.#transact({to:address,data,value:0n},{tool:name,args,contractCallId:callId,amountConversions,operation:'task:'+name},hooks);
   if(name==='swap'&&r.status==='success'){for(const log of r.receipt.logs??[])if(lower(log.address)===lower(c.amm)){try{const d=viem.decodeEventLog({abi:a.LabAMM.abi,data:log.data,topics:log.topics});if(d.eventName==='Swap'){r.amountOut=String(d.args.amountOut);r.amountOutFormatted=viem.formatUnits(d.args.amountOut,6);}}catch{}}}
   await this.#emit('contract.result',{callId,kind:'transaction',status:r.status,txHash:r.hash,result:r,submitted:true},hooks,{contractCallId:callId});return r;
  }catch(e){if(this.#broken)throw e;await this.#emit('contract.result',{callId,kind:'transaction',status:'error',error:e.code??'TESTNET_EXECUTION_ERROR',submitted:false},hooks,{contractCallId:callId});throw e;}
 }
 async check(taskId,before,after,txs=this.transactions,final='',options={}){
  this.#ready();if(typeof this.lib.checkTask!=='function')throw failure('CHECKER_NOT_CONFIGURED');
  const policy={...options,experimentMode:'continuous',expectedChainId:this.profile.chainId,balanceQueryPolicy:'observed_block',externalEvidenceVerified:true,externalEvidenceReason:undefined};
  const feeScope=result=>({...result,costs:{...result.costs,executionGasOnly:true,gasCostScope:'gasUsed * effectiveGasPrice; excludes chain-specific L1 data fees and additional network fees',additionalNetworkFees:'not_normalized; retain provider receipt fields for separate analysis'}});
  const unavailable=reason=>feeScope(this.lib.checkTask(taskId,before,after,txs,final,this.observations,{...policy,externalEvidenceVerified:false,externalEvidenceReason:reason}));
  try{
   if(before.chainInstanceId!==this.#manifest.deploymentId||after.chainInstanceId!==this.#manifest.deploymentId)return unavailable('Fixture identity changed');
   for(const s of [before,after,...this.observations]){const b=await this.publicClient.getBlock({blockNumber:BigInt(s.blockNumber)});if(b.hash!==s.blockHash)return unavailable('Referenced block no longer canonical');}
   const hashes=new Set(txs.map(t=>t.hash??t.txHash).filter(Boolean)),start=BigInt(before.blockNumber)+1n,end=BigInt(after.blockNumber);
   if(end-start>1000n)return unavailable('Public checker interval exceeds 1000 blocks');
   for(let n=start;n<=end;n++){const b=await this.publicClient.getBlock({blockNumber:n,includeTransactions:true});for(const tx of b.transactions)if(typeof tx!=='string'&&lower(tx.from)===lower(this.address))hashes.add(tx.hash);}
   const actual=await Promise.all([...hashes].map(h=>this.inspectTransaction(h)));
   if(actual.some(t=>t.receipt&&(BigInt(t.receipt.blockNumber)<start||BigInt(t.receipt.blockNumber)>end)))return unavailable('Transaction outside captured state interval');
   // A reorg can happen while a long block interval is scanned. Check the
   // captured anchors again after all independent transaction lookups, rather
   // than combining an old state with receipts from a new branch.
   for(const s of [before,after,...this.observations]){const b=await this.publicClient.getBlock({blockNumber:BigInt(s.blockNumber)});if(b.hash!==s.blockHash)return unavailable('Captured state changed while collecting transaction evidence');}
   return feeScope(this.lib.checkTask(taskId,before,after,actual,final,this.observations,policy));
  }catch{return unavailable('RPC evidence unavailable');}
 }
 async shutdown(){this.#closed=true;this.#account=undefined;this.walletClient=null;this.#url=undefined;}
}
