// This catalog is an integration allowlist, not a claim that protocol deployments
// or public RPCs were tested end-to-end. No automatic faucet or mainnet access.
const rows = [
 ['ethereum-sepolia','Ethereum Sepolia',11155111,'ETH','https://rpc.sepolia.org','evm',false],
 ['bsc-testnet','BNB Smart Chain Testnet',97,'tBNB','https://bsc-testnet-dataseed.bnbchain.org','evm',true],
 ['base-sepolia','Base Sepolia',84532,'ETH','https://sepolia.base.org','evm',true],
 ['arbitrum-sepolia','Arbitrum Sepolia',421614,'ETH','https://sepolia-rollup.arbitrum.io/rpc','evm',true],
 ['op-sepolia','OP Sepolia',11155420,'ETH','https://sepolia.optimism.io','evm',true],
 ['solana-devnet','Solana Devnet',null,'SOL','https://api.devnet.solana.com','solana',false],
 ['polygon-amoy','Polygon PoS Amoy',80002,'POL','https://polygon-amoy.drpc.org','evm',true],
 ['avalanche-fuji','Avalanche Fuji C-Chain',43113,'AVAX','https://api.avax-test.network/ext/bc/C/rpc','evm',true],
 ['sui-testnet','Sui Testnet',null,'SUI','https://graphql.testnet.sui.io/graphql','sui',false],
 ['aptos-testnet','Aptos Testnet',2,'APT','https://api.testnet.aptoslabs.com/v1','aptos',false],
 ['tron-shasta','TRON Shasta',null,'TRX','https://api.shasta.trongrid.io','tron',false],
 ['ton-testnet','TON Testnet',null,'TON','https://testnet.toncenter.com/api/v2','ton',false],
 ['monad-testnet','Monad Testnet',10143,'MON','https://testnet-rpc.monad.xyz','evm',false],
 ['zksync-sepolia','ZKsync Era Sepolia',300,'ETH','https://sepolia.era.zksync.dev','eravm',false],
 ['linea-sepolia','Linea Sepolia',59141,'ETH','https://rpc.sepolia.linea.build','evm',false],
 ['mantle-sepolia','Mantle Sepolia',5003,'MNT','https://rpc.sepolia.mantle.xyz','evm',false],
 ['unichain-sepolia','Unichain Sepolia',1301,'ETH','https://sepolia.unichain.org','evm',false],
 ['xlayer-testnet','X Layer Testnet',1952,'OKB','https://testrpc.xlayer.tech/terigon','evm',false],
 ['cronos-testnet','Cronos EVM Testnet',338,'tCRO','https://evm-t3.cronos.com','evm',false],
 ['opbnb-testnet','opBNB Testnet',5611,'tBNB','https://opbnb-testnet-rpc.bnbchain.org','evm',false],
];
export const NETWORK_PROFILES=Object.freeze(rows.map(([id,name,chainId,symbol,rpcUrl,family,writeEnabled])=>Object.freeze({id,name,chainId,symbol,rpcUrl,family,writeEnabled,testnet:true,confirmations:2,receiptTimeoutMs:120000,status:writeEnabled?'write-preview':'catalog-only',capabilities:Object.freeze({snapshot:false,reset:false,mine:false,setBalance:false,trace:'rpc-dependent',assets:'own-six-decimal-fixture'})})));
export const TESTNET_NETWORKS=NETWORK_PROFILES;
export const listNetworks=()=>NETWORK_PROFILES.map(p=>({...p,capabilities:{...p.capabilities}}));
export function getNetworkProfile(id){const p=NETWORK_PROFILES.find(p=>p.id===id);if(!p)throw Error('UNKNOWN_TESTNET_PROFILE');return p;}
export function validateRpcUrl(value,{allowLoopback=false}={}){
 let url;try{url=new URL(value);}catch{throw Error('INVALID_RPC_URL');}
 const host=url.hostname.toLowerCase();
 const local=host==='localhost'||host==='127.0.0.1'||host==='[::1]';
 const privateHost=local||/^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)||host.endsWith('.localhost')||host.endsWith('.local')||host==='[::]'||/^\[(fc|fd|fe80)/i.test(host);
 if(url.username||url.password||url.hash)throw Error('RPC_CREDENTIALS_IN_AUTHORITY_OR_FRAGMENT_FORBIDDEN');
 if(allowLoopback&&local&&url.protocol==='http:')return url;
 if(url.protocol!=='https:'||privateHost)throw Error('PUBLIC_RPC_REQUIRES_HTTPS');
 return url;
}
