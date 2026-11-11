import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),solc=require('solc');
if(!solc.version().startsWith('0.8.30+'))throw Error('Pinned solc 0.8.30 required');
const vendor=join(root,'packages/payment-adapters/vendor/x402/contracts/evm/src');
const entries={
 'ResearchEIP3009Token.sol':join(root,'contracts/ResearchEIP3009Token.sol'),
 'x402BatchSettlement.sol':join(vendor,'x402BatchSettlement.sol'),
 'periphery/ERC3009DepositCollector.sol':join(vendor,'periphery/ERC3009DepositCollector.sol'),
 'Multicall3.sol':join(root,'packages/payment-adapters/vendor/multicall3/Multicall3.sol'),
};
const sources=Object.fromEntries(Object.entries(entries).map(([name,path])=>[name,{content:readFileSync(path,'utf8')}]));
// Only the standalone Multicall3 helper's exact compiler pragma is relaxed.
// x402 source is unchanged. The original upstream helper stays vendored intact.
sources['Multicall3.sol'].content=sources['Multicall3.sol'].content.replace('pragma solidity 0.8.12;','pragma solidity ^0.8.12;');
const sourceHashes={};
const hash=s=>createHash('sha256').update(s).digest('hex');
for(const [name,{content}]of Object.entries(sources))sourceHashes[name]=hash(content);
const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input),{import(path){try{const absolute=path.startsWith('@openzeppelin/')?join(root,'packages/payment-adapters/node_modules',path):join(vendor,path);const content=readFileSync(absolute,'utf8');sourceHashes[path]=hash(content);return{contents:content};}catch(e){return{error:`Missing pinned dependency ${path}: ${e.message}`};}}}));
const errors=(output.errors??[]).filter(x=>x.severity==='error');if(errors.length)throw Error(errors.map(x=>x.formattedMessage).join('\n'));
const dir=join(root,'packages/payment-adapters/artifacts');mkdirSync(dir,{recursive:true});
for(const [source,name] of [['ResearchEIP3009Token.sol','ResearchEIP3009Token'],['x402BatchSettlement.sol','x402BatchSettlement'],['periphery/ERC3009DepositCollector.sol','ERC3009DepositCollector'],['Multicall3.sol','Multicall3']]){
 const c=output.contracts[source][name];
 writeFileSync(join(dir,name+'.json'),JSON.stringify({contractName:name,compiler:solc.version(),evmVersion:'cancun',sourceHashes,sourceTransform:name==='Multicall3'?'Compiler pragma 0.8.12 -> ^0.8.12 for pinned 0.8.30; original vendored source unchanged':null,abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,deployedBytecode:'0x'+c.evm.deployedBytecode.object,immutableReferences:c.evm.deployedBytecode.immutableReferences},null,2)+'\n');
 console.log('Compiled '+name);
}
