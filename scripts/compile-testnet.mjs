// Public-testnet fixtures use a conservative EVM target. The original Anvil
// artifacts and historical release fixtures remain unchanged.
import solc from 'solc';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(join(root,'contracts/LabContracts.sol'),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const input={language:'Solidity',sources:{'LabContracts.sol':{content:source}},settings:{
 optimizer:{enabled:true,runs:200},evmVersion:'paris',
 outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}
}};
const output=JSON.parse(solc.compile(JSON.stringify(input)));
const errors=(output.errors??[]).filter(e=>e.severity==='error');
if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join('\n'));
const dir=join(root,'contracts/testnet-artifacts');await mkdir(dir,{recursive:true});
for(const name of ['LabToken','LabAMM','LabVault']){
 const artifact=output.contracts['LabContracts.sol'][name];
 const value={contractName:name,sourceFile:'contracts/LabContracts.sol',sourceSha256:sha(source),
  compiler:solc.version(),evmVersion:'paris',optimizer:input.settings.optimizer,abi:artifact.abi,
  bytecode:'0x'+artifact.evm.bytecode.object,deployedBytecode:'0x'+artifact.evm.deployedBytecode.object,
  bytecodeSha256:sha(Buffer.from(artifact.evm.bytecode.object,'hex')),
  immutableReferences:artifact.evm.deployedBytecode.immutableReferences,
  purpose:'Self-owned public-testnet experiment fixtures; not external DEX deployments'};
 await writeFile(join(dir,name+'.json'),JSON.stringify(value,null,2)+'\n');
}
console.log('Compiled 3 public-testnet fixtures with Paris EVM target; original Anvil artifacts unchanged.');
