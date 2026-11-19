import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { checkBnbRun, readVerifiedBnbEvents } from './checker.mjs';
import { writeBnbDerived } from './provenance.mjs';

const SDK_COMMIT='260e16196931780d0370bd3a9d9b67ece744bb9d';
const SLOT='0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const RECIPIENT='0x0000000000000000000000000000000000005678';
const KNOWN_IMPLEMENTATIONS={97:{commerce:'0x153783ddbdf5233c591965f04644b1df2d1a7815',router:'0x40c0254610d92f1eb9c2d7d5d2114bc4c99d935e'},56:{commerce:'0xd5f9b570c96b5d67702d508c0bfb8b3b09209787',router:'0xf0cf8f47e5c035f16247ff16e9f367e477ee5007'}};
const sha=value=>createHash('sha256').update(value).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// Transport errors may echo a not-yet-broadcast signed transaction or authorization.
const safeError=error=>String(error?.message||error?.shortMessage||error).replace(/0x[a-fA-F0-9]{128,}/g,'[LONG_HEX_REDACTED]').slice(0,16000);
const abortError=()=>Object.assign(new Error('Experiment cancelled'),{name:'AbortError'});

export const BNB_EIP3009_TYPES={
  EIP712Domain:[{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}],
  TransferWithAuthorization:[{name:'from',type:'address'},{name:'to',type:'address'},{name:'value',type:'uint256'},{name:'validAfter',type:'uint256'},{name:'validBefore',type:'uint256'},{name:'nonce',type:'bytes32'}],
};

/** Immutable raw journal; secret values are removed before serialization. */
export function createBnbJournal(outDir,runId,emit=()=>{}) {
  mkdirSync(join(outDir,'raw/blobs'),{recursive:true});
  const filename=join(outDir,'raw/events.jsonl');writeFileSync(filename,'',{flag:'wx'});
  const secrets=new Set();let seq=0,prevHash='0'.repeat(64);
  const scrub=value=>{
    if(typeof value==='string'){for(const secret of secrets)if(secret)value=value.split(secret).join('[REDACTED]');return value;}
    if(Array.isArray(value))return value.map(scrub);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/^(privateKey|mnemonic|password|apiKey|authorization|signature|signedTransaction)$/i.test(k)?'[REDACTED]':scrub(v)]));
    return typeof value==='bigint'?value.toString():value;
  };
  return {
    addSecret:value=>{if(value)secrets.add(String(value));},
    event(type,payload={}){
      payload=scrub(payload);const bytes=JSON.stringify(payload,null,2),payloadSha256=sha(bytes),payloadRef=`raw/blobs/${payloadSha256}.json`;
      if(!existsSync(join(outDir,payloadRef)))writeFileSync(join(outDir,payloadRef),bytes,{flag:'wx'});
      const core={seq:++seq,eventId:`${runId}:${seq}`,runId,time:new Date().toISOString(),type,payloadRef,payloadSha256,prevHash};
      const row={...core,hash:sha(JSON.stringify(core))};prevHash=row.hash;
      appendFileSync(filename,JSON.stringify(row)+'\n');emit({...row,payload});return row;
    },
  };
}

async function freePort(){return new Promise((resolvePort,reject)=>{const server=createServer();server.unref();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(error=>error?reject(error):resolvePort(port));});});}

/** Fixed distribution paths only; no inherited ANVIL_PATH or executable from user input. */
export function resolveBnbAnvil(root,{platform=process.platform,arch=process.arch,exists=existsSync}={}) {
  const candidates=[];
  if(platform==='win32')candidates.push(join(root,'runtime','anvil.exe'));
  else if(platform==='darwin'){
    if(!['arm64','x64'].includes(arch))throw new Error(`Unsupported macOS architecture: ${arch}`);
    candidates.push(join(root,'runtime',`darwin-${arch}`,'anvil'),join(root,'runtime','anvil'));
  }else if(platform==='linux')candidates.push(join(root,'runtime','anvil'));
  else throw new Error(`Unsupported Anvil platform: ${platform}`);
  const executable=candidates.find(path=>exists(path));
  if(!executable)throw new Error(`Bundled Anvil executable is missing for ${platform}/${arch}; install platform runtime first`);
  return executable;
}

/** Only four validated scenarios; this worker never sends writes to public RPC. */
export async function runBnbExperiment(config,{root,outDir,runId,signal,checkpoint=async()=>{},emit=()=>{}}) {
  const supported=['x402-offline','erc8004-fork','erc8183-fork','deployment-probe'];
  if(!supported.includes(config.scenario))throw new Error('Unsupported BNB SDK scenario');
  if(!['bsc-testnet','bsc-mainnet'].includes(config.network))throw new Error('Unsupported network');
  if(config.network==='bsc-mainnet'&&config.scenario!=='deployment-probe')throw new Error('Mainnet is read-only deployment-probe only');
  if(config.scenario!=='x402-offline'&&!/^https:\/\//.test(config.rpcUrl||''))throw new Error('Public read-only RPC must be HTTPS');
  const journal=createBnbJournal(outDir,runId,emit),start=Date.now();
  const ensure=()=>{if(signal?.aborted)throw abortError();};
  const step=async(operation,phase='before-operation')=>{ensure();journal.event('checkpoint.entered',{phase,operation});await checkpoint({phase,operation});ensure();journal.event('checkpoint.released',{phase,operation});};
  let child,network,client,snapshot,operationNumber=0,lastOperation,stage='setup';
  const event=(type,payload)=>journal.event(type,payload);
  const operation=async(name,args,fn,{contract,kind='sdk-call',pause=false}={})=>{
    ensure();const operationId=`operation-${++operationNumber}`;lastOperation=operationId;
    if(pause)await step(name,'before-sign-or-submit');
    event('operation.started',{operationId,name,kind,args,contract});
    try{const result=await fn();ensure();event('operation.result',{operationId,result});return {result,operationId};}
    catch(error){event('operation.error',{operationId,message:safeError(error)});throw error;}
  };
  const runtimePath=resolve(root,'packages/bnb-sdk-lab/runtime.mjs');
  event('run.started',{runId,config,sdk:{name:'@bnbagent/sdk',version:'0.6.1',commit:SDK_COMMIT},runtime:{node:process.version,platform:process.platform},scope:config.scenario==='x402-offline'?'offline-signing':config.scenario==='deployment-probe'?'public-readonly':'local-pinned-bsc-fork',publicWrites:false});
  try{
    ensure();
    const sdk=await import(pathToFileURL(runtimePath).href);
    event('runtime.loaded',{file:'packages/bnb-sdk-lab/runtime.mjs',sha256:sha(readFileSync(runtimePath))});
    network={...sdk.NETWORKS[config.network],rpcUrl:config.rpcUrl,usePaymaster:false,paymasterUrl:undefined};
    if(config.scenario==='deployment-probe'){
      client=sdk.createPublicClient({transport:sdk.http(config.rpcUrl,{timeout:15000,retryCount:0})});
      await recordDeployment(sdk,client,network,config,event,ensure);
    }else{
      const key=sdk.generatePrivateKey();journal.addSecret(key);
      const wallet=new sdk.EVMWalletProvider({password:randomBytes(32).toString('hex'),privateKey:key,persist:false,walletsDir:join(outDir,'.unused-ephemeral-wallets')});
      event('wallet.created',{address:wallet.address,ephemeral:true,persisted:false,backend:'EVMWalletProvider'});
      if(config.scenario==='x402-offline'){
        stage='scenario';
        for(const [kind,net,token] of [['chain-31337','eip155:31337',RECIPIENT],['unknown-token','eip155:97',RECIPIENT]]){
          let rejected=false,message;
          try{sdk.resolveExpectedEip3009Route(net,token);}catch(error){rejected=true;message=safeError(error);}
          event('x402.rejection',{kind,rejected,message});
        }
        const route=sdk.resolveExpectedEip3009Route('eip155:97','TEST_U');
        const signer=new sdk.X402Signer(wallet,{sessionBudget:{[route.address]:100n},maxValuePerCall:{[route.address]:100n}});
        const domain={name:route.name,version:route.version,chainId:route.chainId,verifyingContract:route.address};
        const request=()=>{const now=BigInt(Math.floor(Date.now()/1000));return {domain,types:BNB_EIP3009_TYPES,message:{from:wallet.address,to:RECIPIENT,value:60n,validAfter:now-30n,validBefore:now+300n,nonce:'0x'+randomBytes(32).toString('hex')},expectedRoute:route,expectedTo:RECIPIENT};};
        const opts=request();await step('X402Signer.signPayment','before-sign-or-submit');
        const operationId=`operation-${++operationNumber}`;event('operation.started',{operationId,name:'X402Signer.signPayment',kind:'signing',args:opts,contract:route.address});
        const signed=await signer.signPayment(opts);journal.addSecret(signed.signature);ensure();
        const verified=await sdk.verifyTypedData({address:wallet.address,domain,types:BNB_EIP3009_TYPES,primaryType:'TransferWithAuthorization',message:opts.message,signature:signed.signature});
        event('operation.result',{operationId,result:{signatureVerified:verified,signatureExported:false,budgetSpent:signer.budget.spent(route.address)}});
        event('x402.validation',{operationId,signatureVerified:verified,request:opts,requestSha256:sha(JSON.stringify(plain(opts))),route,budgetSpent:signer.budget.spent(route.address),budgetCap:'100',signatureExported:false,settlementPerformed:false});
        await step('X402Signer.signPayment over budget','before-sign-or-submit');
        let rejected=false,message;try{const second=await signer.signPayment(request());journal.addSecret(second.signature);}catch(error){rejected=true;message=safeError(error);}
        event('x402.rejection',{kind:'cumulative-budget',rejected,message,budgetSpent:signer.budget.spent(route.address)});
      }else{
        const upstream=sdk.createPublicClient({transport:sdk.http(config.rpcUrl,{timeout:15000,retryCount:0})});
        const deployment=await recordDeployment(sdk,upstream,network,config,event,ensure);
        const port=await freePort(),url=`http://127.0.0.1:${port}`;
        const executable=resolveBnbAnvil(root);
        child=spawn(executable,['--host','127.0.0.1','--port',String(port),'--chain-id','97','--fork-url',config.rpcUrl,'--fork-block-number',String(deployment.blockNumber),'--silent'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
        emit({type:'bnb.resource'},{pid:child.pid,resource:'anvil'});
        let spawnError=null;child.once('error',error=>{spawnError=error;});
        child.stdout.on('data',bytes=>event('anvil.stdout',{text:String(bytes).slice(0,8000)}));child.stderr.on('data',bytes=>event('anvil.stderr',{text:String(bytes).slice(0,8000)}));
        event('fork.started',{pid:child.pid,localRpc:url,upstreamRpc:config.rpcUrl,blockNumber:deployment.blockNumber,blockHash:deployment.blockHash,usePaymaster:false});
        client=sdk.createPublicClient({transport:sdk.http(url,{timeout:45000,retryCount:0}),pollingInterval:100});
        let ready=false;
        for(let i=0;i<90;i++){ensure();if(spawnError)throw spawnError;if(child.exitCode!==null)throw new Error(`Anvil exited during startup (${child.exitCode})`);try{if(await client.getChainId()===97){ready=true;break;}}catch{}await delay(300);}
        if(!ready)throw new Error('Pinned Anvil fork did not become ready');
        network={...network,rpcUrl:url,usePaymaster:false,paymasterUrl:undefined};
        const rpc=(method,params=[])=>client.request({method,params});
        await rpc('anvil_setBalance',[wallet.address,'0x'+sdk.parseEther('100').toString(16)]);
        snapshot=await rpc('evm_snapshot');event('snapshot.saved',{snapshot});
        let createdId,registry,commerce;
        const recordTransaction=async(hash,operationId)=>{
          const receipt=await client.waitForTransactionReceipt({hash,timeout:60000});
          const transaction=await client.getTransaction({hash}),block=await client.getBlock({blockHash:receipt.blockHash});
          let trace,traceAvailable=false;
          try{trace=await rpc('debug_traceTransaction',[hash,{tracer:'callTracer'}]);traceAvailable=!!trace;}catch(error){event('trace.unavailable',{hash,message:safeError(error)});}
          event('transaction.recorded',{operationId,transaction,receipt,block:{number:block.number,hash:block.hash,timestamp:block.timestamp},trace,traceAvailable});
          if(receipt.status!=='success')throw new Error(`Transaction reverted: ${hash}`);
        };
        stage='scenario';
        if(config.scenario==='erc8004-fork'){
          registry=new sdk.ContractInterface({client,contractAddress:network.registryContract,walletProvider:wallet,receiptTimeout:60});
          const uri='data:application/json;base64,'+Buffer.from(JSON.stringify({name:'Web3 Agent Lab BNB SDK isolated experiment',type:'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',description:'Local pinned fork only',runId})).toString('base64');
          const registered=await operation('ERC8004.registerAgent',{uri,metadata:[{key:'experiment',value:runId}]},()=>registry.registerAgent(uri,[{key:'experiment',value:runId}]),{contract:network.registryContract,pause:true});
          createdId=registered.result.agentId;if(createdId===null||createdId===undefined)throw new Error('Registration receipt did not contain agent ID');
          await recordTransaction(registered.result.transactionHash,registered.operationId);
          const read=await operation('ERC8004.getAgentInfo',{agentId:createdId},()=>registry.getAgentInfo(createdId),{contract:network.registryContract,kind:'read'});
          event('state.identity',{operationId:read.operationId,contract:network.registryContract,wallet:wallet.address,agentId:createdId,expectedUri:uri,info:read.result});
        }else{
          commerce=await sdk.ERC8183Client.create({walletProvider:wallet,network});
          const token=await commerce.paymentToken(),metadata=await commerce.tokenMetadata(token),window=await commerce.policy.disputeWindow();
          event('erc8183.token',{token,metadata,disputeWindow:window,amountUnit:'base-units',fundingPerformed:false});
          const block=await client.getBlock(),args={provider:RECIPIENT,expiredAt:block.timestamp+window+86400n,description:`Web3 Agent Lab local fork experiment ${runId}`};
          const created=await operation('ERC8183.createJob',args,()=>commerce.createJob(args),{contract:network.commerceContract,pause:true});
          createdId=created.result.jobId;if(createdId===null||createdId===undefined)throw new Error('Create receipt did not contain job ID');
          await recordTransaction(created.result.transactionHash,created.operationId);
          const before=await operation('ERC8183.getJob',{jobId:createdId},()=>commerce.getJob(createdId),{contract:network.commerceContract,kind:'read'});
          event('state.job',{phase:'created',operationId:before.operationId,wallet:wallet.address,job:before.result});
          const cancelled=await operation('ERC8183.cancelOpen',{jobId:createdId},()=>commerce.cancelOpen(createdId),{contract:network.commerceContract,pause:true});
          await recordTransaction(cancelled.result.transactionHash,cancelled.operationId);
          const after=await operation('ERC8183.getJob',{jobId:createdId},()=>commerce.getJob(createdId),{contract:network.commerceContract,kind:'read'});
          event('state.job',{phase:'cancelled',operationId:after.operationId,wallet:wallet.address,job:after.result});
        }
        ensure();const reverted=await rpc('evm_revert',[snapshot]);let absent=false;
        try{if(registry)await registry.getAgentInfo(createdId);else {const job=await commerce.getJob(createdId);absent=String(job.client).toLowerCase()==='0x0000000000000000000000000000000000000000';}}catch(error){
          // A failed public RPC is not proof of absence: require the local EVM's revert classification.
          absent=/revert|nonexistent|not found|invalid.*(?:agent|job)|ERC721/i.test(safeError(error));
          event('snapshot.readback',{message:safeError(error),absenceConfirmed:absent});
        }
        event('snapshot.restored',{snapshot,reverted,createdStateAbsent:absent});
      }
    }
    ensure();event('run.completed',{scenario:config.scenario,elapsedMs:Date.now()-start});
  }catch(error){
    const kind=signal?.aborted||error?.name==='AbortError'?'cancelled':stage==='setup'||/fetch failed|timeout|timed out|ECONN|HTTP request failed|missing trie|header not found/i.test(safeError(error))?'environment':'execution';
    event('run.error',{kind,message:safeError(error),stage,operationId:lastOperation});
  }finally{
    if(child&&child.exitCode===null){child.kill();await Promise.race([new Promise(r=>child.once('exit',r)),delay(1500)]);event('fork.stopped',{pid:child.pid,exitCode:child.exitCode});}
  }
  const checker=checkBnbRun(outDir),events=readVerifiedBnbEvents(outDir);
  writeBnbDerived(outDir,events,runId,checker);
  const summary={schemaVersion:1,runId,scenario:config.scenario,network:config.network,status:checker.status,startedAt:events[0].time,finishedAt:new Date().toISOString(),elapsedMs:Date.now()-start,sdkVersion:'0.6.1',sdkCommit:SDK_COMMIT,transactionCount:checker.transactionCount,checks:checker.checks,publicWrites:false,limitations:config.scenario==='x402-offline'?['Actual SDK offline signature and guards only; no HTTP 402 round-trip, payment or settlement.','Signature is not exported; offline recheck verifies the saved verification result and integrity.']:config.scenario==='deployment-probe'?['Bytecode and implementation-slot presence only; not proof of business transaction success.']:['Actual deployed bytecode on local BSC testnet fork; not a public-network transaction.','ERC-8183 scope is unfunded create/cancel; no delivery, funded settlement or refund claim.','Fixed-block replay requires an upstream RPC retaining that historical state.'],artifacts:['raw/events.jsonl','derived/checker.json','derived/graph.json','derived/graph.graphml','derived/nodes.csv','derived/edges.csv','derived/execution-trace.json']};
  writeFileSync(join(outDir,'summary.json'),JSON.stringify(summary,null,2));emit({type:'bnb.completed',payload:summary});return summary;
}

async function recordDeployment(sdk,client,network,config,event,ensure){
  ensure();const chainId=await client.getChainId();if(chainId!==network.chainId)throw new Error(`RPC chain mismatch: expected ${network.chainId}, got ${chainId}`);
  const blockNumber=config.forkBlock?BigInt(config.forkBlock):await client.getBlockNumber();
  const block=await client.getBlock({blockNumber});
  const contracts=[];
  for(const [role,address] of [['registry',network.registryContract],['commerce',network.commerceContract],['router',network.routerContract],['policy',network.policyContract]]){
    ensure();const code=await client.getBytecode({address,blockNumber});
    if(!code||code==='0x')throw new Error(`No ${role} bytecode at pinned block ${blockNumber}`);
    const entry={role,address,codeBytes:(code.length-2)/2,codeSha256:sha(Buffer.from(code.slice(2),'hex')),code};
    if(role!=='policy'){
      const storage=await client.getStorageAt({address,slot:SLOT,blockNumber});
      entry.implementationSlot=storage;
      if(storage&&BigInt(storage)!==0n){
        entry.implementation='0x'+storage.slice(-40);const implCode=await client.getBytecode({address:entry.implementation,blockNumber});
        entry.implementationCode=implCode;entry.implementationCodeBytes=implCode?(implCode.length-2)/2:0;entry.implementationCodeSha256=implCode?sha(Buffer.from(implCode.slice(2),'hex')):null;
        entry.manifestImplementation=KNOWN_IMPLEMENTATIONS[chainId]?.[role]??null;
        entry.manifestMatches=entry.manifestImplementation?entry.manifestImplementation.toLowerCase()===entry.implementation.toLowerCase():null;
      }
    }
    contracts.push(entry);
  }
  const paymentToken=await client.readContract({address:network.commerceContract,blockNumber,abi:[{type:'function',name:'paymentToken',stateMutability:'view',inputs:[],outputs:[{type:'address'}]}],functionName:'paymentToken'});
  const b402Route=sdk.resolveExpectedEip3009Route(`eip155:${chainId}`,chainId===97?'TEST_U':'U');
  const tokens=[];
  for(const [role,address] of [['erc8183-payment-token',paymentToken],['b402-eip3009-token',b402Route.address]]){
    ensure();const code=await client.getBytecode({address,blockNumber});if(!code||code==='0x')throw new Error(`No ${role} bytecode at pinned block`);
    const decimals=await client.readContract({address,blockNumber,abi:[{type:'function',name:'decimals',stateMutability:'view',inputs:[],outputs:[{type:'uint8'}]}],functionName:'decimals'});
    const symbol=await client.readContract({address,blockNumber,abi:[{type:'function',name:'symbol',stateMutability:'view',inputs:[],outputs:[{type:'string'}]}],functionName:'symbol'});
    contracts.push({role,address,codeBytes:(code.length-2)/2,codeSha256:sha(Buffer.from(code.slice(2),'hex')),code});
    tokens.push({role,address,decimals:Number(decimals),symbol,...(role==='b402-eip3009-token'?{eip712Domain:{name:b402Route.name,version:b402Route.version,chainId,verifyingContract:address},catalogDecimals:b402Route.decimals}:{})});
  }
  const result={chainId,network:config.network,rpcUrl:config.rpcUrl,blockNumber:blockNumber.toString(),blockHash:block.hash,blockTimestamp:block.timestamp.toString(),contracts,tokens,hashAlgorithm:'SHA-256 of decoded runtime bytecode (not EVM keccak codehash)',publicWrites:false};
  event('deployment.snapshot',result);return result;
}
