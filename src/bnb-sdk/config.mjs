export const VERSION='V0.18.3 Transaction Recovery Beta';
export const SDK_COMMIT='260e16196931780d0370bd3a9d9b67ece744bb9d';
export const NETWORKS={
 'bsc-testnet':{id:'bsc-testnet',label:'BNB 测试网 97',chainId:97,rpcs:{default:'https://data-seed-prebsc-2-s2.binance.org:8545',publicnode:'https://bsc-testnet-rpc.publicnode.com'}},
 'bsc-mainnet':{id:'bsc-mainnet',label:'BNB 主网 56 · 只读',chainId:56,rpcs:{default:'https://bsc-dataseed.binance.org',publicnode:'https://bsc-rpc.publicnode.com'}}
};
export const SCENARIOS=[
 {id:'x402-offline',label:'x402 离线签名与预算',description:'真实本地签名、验签及额度检查；不发送 HTTP 付款或链上交易。',networks:['bsc-testnet'],environment:'offline',model:false},
 {id:'deployment-probe',label:'部署只读探测',description:'核对网络、代码、代理实现及代币元数据；不签名、不写链。',networks:['bsc-testnet','bsc-mainnet'],environment:'public-readonly',model:false},
 {id:'erc8004-fork',label:'分叉身份登记',description:'在本地 BSC 分叉登记身份并独立读取所有权；只向本地链发送交易。',networks:['bsc-testnet'],environment:'local-fork',model:false},
 {id:'erc8183-fork',label:'分叉托管任务创建与取消',description:'创建并取消未注资任务；不代表注资、交付、结算或退款闭环。',networks:['bsc-testnet'],environment:'local-fork',model:false}
];
export function capabilities(){return {schema:'web3-bnb-sdk-capabilities-v1',version:VERSION,sdk:{version:'0.6.1',commit:SDK_COMMIT},scenarios:SCENARIOS,networks:Object.values(NETWORKS).map(({rpcs,...n})=>({...n,rpcPresets:Object.keys(rpcs)})),limitations:['脚本实验，不调用模型。','公网仅只读；签名交易仅在独立本地分叉执行。','完整注资、交付、结算、退款和真实 x402 HTTP 支付尚未开放。','不接入 TWAK、Altana、Turnkey 或代付服务。','分叉依赖历史 RPC；封存轨迹可离线回放，重新运行仍可能受节点历史状态限制。']};}
export function normalizeConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('CONFIG_REQUIRED');
 const keys=['scenario','network','rpcPreset','forkBlock','timeoutSeconds','pauseBeforeOperations'];
 if(Object.keys(input).some(k=>!keys.includes(k)))throw Error('CONFIG_FIELD');
 const scenario=input.scenario??'x402-offline',descriptor=SCENARIOS.find(s=>s.id===scenario);
 if(!descriptor)throw Error('SCENARIO');
 const network=input.network??'bsc-testnet';if(!descriptor.networks.includes(network))throw Error('NETWORK');
 const rpcPreset=input.rpcPreset??'publicnode';if(!Object.hasOwn(NETWORKS[network].rpcs,rpcPreset))throw Error('RPC_PRESET');
 const timeoutSeconds=input.timeoutSeconds??240;if(!Number.isInteger(timeoutSeconds)||timeoutSeconds<30||timeoutSeconds>600)throw Error('TIMEOUT');
 const forkBlock=input.forkBlock===null||input.forkBlock===''?undefined:input.forkBlock;
 if(forkBlock!==undefined&&(!Number.isSafeInteger(forkBlock)||forkBlock<1))throw Error('FORK_BLOCK');
 if(input.pauseBeforeOperations!==undefined&&typeof input.pauseBeforeOperations!=='boolean')throw Error('PAUSE_OPTION');
 return {scenario,network,rpcPreset,rpcUrl:NETWORKS[network].rpcs[rpcPreset],chainId:NETWORKS[network].chainId,forkBlock,timeoutSeconds,pauseBeforeOperations:input.pauseBeforeOperations??false,environment:descriptor.environment};
}
