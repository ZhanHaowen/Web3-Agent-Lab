import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import solc from 'solc';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'contracts/LabContracts.sol'), 'utf8');
if (!solc.version().startsWith('0.8.30+')) throw new Error(`Expected solc 0.8.30, found ${solc.version()}`);
const result = JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'LabContracts.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}})));
for (const error of result.errors || []) {
  if (error.severity === 'error') throw new Error(error.formattedMessage);
}
await fs.mkdir(path.join(root, 'contracts/artifacts'), {recursive:true});
for (const [name, contract] of Object.entries(result.contracts['LabContracts.sol'])) {
  await fs.writeFile(path.join(root, `contracts/artifacts/${name}.json`), JSON.stringify({contractName:name,compiler:solc.version(),evmVersion:'cancun',abi:contract.abi,bytecode:`0x${contract.evm.bytecode.object}`,deployedBytecode:`0x${contract.evm.deployedBytecode.object}`},null,2)+'\n');
}
console.log('Compiled LabToken, LabAMM, LabVault with pinned solc 0.8.30.');
