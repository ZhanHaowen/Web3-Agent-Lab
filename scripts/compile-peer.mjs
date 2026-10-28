import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url);
let solc;try{solc=require(process.env.SOLC_JS_PATH?resolve(process.env.SOLC_JS_PATH):'solc');}catch{throw Error('Solidity 0.8.30 compiler is required. Install pinned solc or set SOLC_JS_PATH to index.js or the standalone soljson.js. No network downloads are performed by this script.');}
if(!solc.compile&&solc.cwrap){const raw=solc;const version=raw.cwrap('solidity_version','string',[]);const compile=raw.cwrap('solidity_compile','string',['string','number','number']);solc={version:()=>version(),compile:input=>compile(input,0,0)};}
if(!solc.version().startsWith('0.8.30+'))throw Error('Expected solc 0.8.30, found '+solc.version());
for(const name of ['LabPeerExchange','LabServiceEscrow']){
const content=(await readFile(join(root,'contracts/'+name+'.sol'),'utf8')).replace(/^\uFEFF/,'');
const result=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{[name+'.sol']:{content}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}})));
const errors=result.errors?.filter(e=>e.severity==='error')??[];if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join('\n'));
const c=result.contracts[name+'.sol'][name];
await writeFile(join(root,'contracts/artifacts/'+name+'.json'),JSON.stringify({contractName:name,compiler:solc.version(),evmVersion:'cancun',abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,deployedBytecode:'0x'+c.evm.deployedBytecode.object},null,2)+'\n');
console.log('Compiled '+name+' with '+solc.version());
}
