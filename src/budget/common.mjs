import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
export const clone=value=>JSON.parse(stringify(value));
export const sha=value=>createHash('sha256').update(typeof value==='string'?value:stringify(value)).digest('hex');
export function units(value,zero=false){
 if(typeof value!=='string'||!/^(0|[1-9]\d{0,8})(\.\d{1,6})?$/.test(value))throw Error('AMOUNT_DECIMAL_STRING');
 const [a,b='']=value.split('.'),n=BigInt(a)*1000000n+BigInt(b.padEnd(6,'0'));
 if(!zero&&n===0n)throw Error('AMOUNT_POSITIVE');return n;
}
export const human=n=>{const x=BigInt(n);return (x/1000000n)+'.'+(x%1000000n).toString().padStart(6,'0');};
export function config(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('CONFIG_OBJECT');
 const allowed=['mode','initial','budget','payment','permit','secondPath'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))throw Error('UNKNOWN_CONFIG_FIELD');
 const c={mode:'split',initial:'200',budget:'100',payment:'80',permit:'60',secondPath:'permit',...input};
 if(!['split','unified'].includes(c.mode)||!['permit','transaction'].includes(c.secondPath))throw Error('CONFIG_ENUM');
 for(const k of ['initial','budget','permit'])units(c[k]);units(c.payment,true);
 if(units(c.budget)>units(c.initial))throw Error('BUDGET_EXCEEDS_BALANCE');return c;
}
export const PERMIT_TYPES={
 TokenPermissions:[{name:'token',type:'address'},{name:'amount',type:'uint256'}],
 PermitTransferFrom:[{name:'permitted',type:'TokenPermissions'},{name:'spender',type:'address'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'}]
};
let boundLibrary=null;
export function bindLibrary(lib){boundLibrary=lib;}
export async function library(){
 if(boundLibrary)return boundLibrary;
 process.env.LAB_LIBRARY_ONLY='1';process.env.LAB_AGENT_WORKER='1';process.env.LAB_ROOT=ROOT;
 return import('../../dist/server.mjs');
}
