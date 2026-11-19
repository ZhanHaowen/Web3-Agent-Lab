import {createRequire} from 'node:module';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {resolve, dirname, join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const compilerMeta=JSON.parse(await readFile(join(root,'tools/solc-0.8.17/upstream.json'),'utf8'));
const compilerHash='0x'+createHash('sha256').update(await readFile(join(root,'tools/solc-0.8.17/soljson.cjs'))).digest('hex');
if(compilerHash!==compilerMeta.sha256)throw Error('COMPILER_HASH');
const raw=createRequire(import.meta.url)(join(root,'tools/solc-0.8.17/soljson.cjs'));
const version=raw.cwrap('solidity_version','string',[])();
if(!version.startsWith('0.8.17+'))throw Error('COMPILER_VERSION');
const sources={};
async function walk(dir,prefix){for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory())await walk(join(dir,f.name),prefix+f.name+'/');else if(f.name.endsWith('.sol'))sources[prefix+f.name]={content:await readFile(join(dir,f.name),'utf8')};}}
await walk(join(root,'contracts/upstream/permit2/src'),'src/');
await walk(join(root,'contracts/upstream/solmate/src'),'solmate/src/');
const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'london',outputSelection:{'src/Permit2.sol':{'Permit2':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const output=JSON.parse(raw.cwrap('solidity_compile','string',['string','number','number'])(JSON.stringify(input),0,0));
const errors=(output.errors??[]).filter(e=>e.severity==='error');if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join('\n'));
const c=output.contracts['src/Permit2.sol'].Permit2;
const sourceHashes=Object.fromEntries(Object.entries(sources).sort().map(([p,s])=>[p,createHash('sha256').update(s.content).digest('hex')]));
await writeFile(join(root,'contracts/artifacts/Permit2.json'),JSON.stringify({contractName:'Permit2',compiler:version,optimizerRuns:200,viaIR:true,evmVersion:'london',sourceHashes,abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,deployedBytecode:'0x'+c.evm.deployedBytecode.object},null,2)+'\n');
console.log('Official Permit2 compiled offline:',version);

const walletFile='BudgetSessionWallet.sol';
const walletSources={[walletFile]:{content:await readFile(join(root,'contracts',walletFile),'utf8')}};
for(const name of ['ISignatureTransfer.sol','IEIP712.sol']){
 const upstream='src/interfaces/'+name;
 walletSources['upstream/permit2/'+upstream]=sources[upstream];
}
const walletInput={language:'Solidity',sources:walletSources,settings:{...input.settings,outputSelection:{[walletFile]:{'BudgetSessionWallet':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const walletOutput=JSON.parse(raw.cwrap('solidity_compile','string',['string','number','number'])(JSON.stringify(walletInput),0,0));
const walletErrors=(walletOutput.errors??[]).filter(e=>e.severity==='error');
if(walletErrors.length)throw Error(walletErrors.map(e=>e.formattedMessage).join('\n'));
const wallet=walletOutput.contracts[walletFile].BudgetSessionWallet;
await writeFile(join(root,'contracts/artifacts/BudgetSessionWallet.json'),JSON.stringify({contractName:'BudgetSessionWallet',compiler:version,optimizerRuns:200,viaIR:true,evmVersion:'london',abi:wallet.abi,bytecode:'0x'+wallet.evm.bytecode.object,deployedBytecode:'0x'+wallet.evm.deployedBytecode.object},null,2)+'\n');
console.log('BudgetSessionWallet compiled offline:',version);
