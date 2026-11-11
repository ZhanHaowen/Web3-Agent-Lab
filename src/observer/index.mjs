import { createHash } from 'node:crypto';

export const OBSERVER_SCHEMA = 'web3-public-observer-v1';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const address = x => { if (!/^0x[0-9a-fA-F]{40}$/.test(x ?? '')) throw Error('OBSERVER_ADDRESS'); return x.toLowerCase(); };
const hex = (x, bytes) => { if (typeof x !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(x) || (bytes != null && x.length !== 2 + 2 * bytes)) throw Error('OBSERVER_HEX'); return x.toLowerCase(); };
const quantity = x => { if (typeof x !== 'string' || !/^(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(x)) throw Error('OBSERVER_QUANTITY'); return BigInt(x).toString(); };
const rpcQuantity = x => '0x' + BigInt(x).toString(16);
const compare = (a,b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;
const order = (a,b) => compare(a.blockNumber,b.blockNumber) || compare(a.transactionIndex,b.transactionIndex) || compare(a.logIndex ?? '0',b.logIndex ?? '0');
const allowedProfiles = ['public-chain', 'public-chain+publiccatalog'];

export function createRpc(rpcUrl) {
  const u = new URL(rpcUrl);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw Error('OBSERVER_RPC_URL');
  let id = 0;
  return async (method, params = []) => {
    const response = await fetch(u, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}), signal:AbortSignal.timeout(30000) });
    if (!response.ok) throw Error('OBSERVER_RPC_HTTP_' + response.status);
    const result = await response.json();
    if (result.error || !Object.hasOwn(result,'result')) throw Error('OBSERVER_RPC_ERROR_' + method);
    return result.result;
  };
}

function catalogProjection(input) {
  if (!Array.isArray(input) || input.length > 10000) throw Error('OBSERVER_PUBLIC_CATALOG');
  const keys = new Set(['address','name','advertisedPrices','publishedAtBlock']);
  return input.map(row => {
    if (!row || Object.keys(row).some(k=>!keys.has(k))) throw Error('OBSERVER_CATALOG_FIELDS');
    if (typeof row.name !== 'string' || row.name.length > 160) throw Error('OBSERVER_CATALOG_NAME');
    return {address:address(row.address),name:row.name,publishedAtBlock:quantity(row.publishedAtBlock),advertisedPrices:(row.advertisedPrices??[]).map(p=>{
      if (Object.keys(p).some(k=>!['asset','amount'].includes(k))) throw Error('OBSERVER_CATALOG_PRICE_FIELDS');
      return {asset:p.asset==='native'?'native':address(p.asset),amount:quantity(p.amount)};
    })};
  }).sort((a,b)=>a.address.localeCompare(b.address)||a.name.localeCompare(b.name));
}

/** A direct RPC projection. No input bundle, task membership, event clock or truth is accepted. */
export async function capturePublicChain(options) {
  if (Object.keys(options).some(k=>!['rpcUrl','fromBlock','toBlock','profile','publicCatalog','maxBlocks'].includes(k))) throw Error('OBSERVER_PRIVATE_INPUT_OR_UNKNOWN_FIELD');
  const {rpcUrl,fromBlock,toBlock,profile='public-chain',publicCatalog=[],maxBlocks=1000}=options;
  if (!allowedProfiles.includes(profile)) throw Error('OBSERVER_PROFILE_UNSUPPORTED');
  if (profile==='public-chain' && publicCatalog.length) throw Error('OBSERVER_CATALOG_PROFILE_REQUIRED');
  const start=BigInt(fromBlock),end=BigInt(toBlock);
  if(start<0n||end<start||!Number.isSafeInteger(maxBlocks)||maxBlocks<1||maxBlocks>10000||end-start+1n>BigInt(maxBlocks)) throw Error('OBSERVER_RANGE');
  const rpc=createRpc(rpcUrl),chainId=quantity(await rpc('eth_chainId')),blocks=[],transactions=[],logs=[],payments=[];
  const transactionHashes=new Set(),logKeys=new Set();
  for(let n=start;n<=end;n++) {
    const block=await rpc('eth_getBlockByNumber',[rpcQuantity(n),true]);
    if(!block||quantity(block.number)!==String(n)||!Array.isArray(block.transactions)) throw Error('OBSERVER_BLOCK_MISSING');
    const b={number:quantity(block.number),hash:hex(block.hash,32),parentHash:hex(block.parentHash,32),timestamp:quantity(block.timestamp)};
    if(blocks.length&&b.parentHash!==blocks.at(-1).hash) throw Error('OBSERVER_NONCANONICAL_CHAIN');
    blocks.push(b);
    const indices=new Set();
    for(const tx of block.transactions) {
      if(!tx||typeof tx!=='object') throw Error('OBSERVER_FULL_TRANSACTION_REQUIRED');
      const hash=hex(tx.hash,32),transactionIndex=quantity(tx.transactionIndex);
      if(transactionHashes.has(hash)||indices.has(transactionIndex)||BigInt(transactionIndex)>=BigInt(block.transactions.length)||hex(tx.blockHash,32)!==b.hash||quantity(tx.blockNumber)!==b.number) throw Error('OBSERVER_TRANSACTION_IDENTITY');
      transactionHashes.add(hash);indices.add(transactionIndex);
      const r=await rpc('eth_getTransactionReceipt',[hash]);
      if(!r||hex(r.transactionHash,32)!==hash||hex(r.blockHash,32)!==b.hash||quantity(r.blockNumber)!==b.number||quantity(r.transactionIndex)!==transactionIndex||!Array.isArray(r.logs)) throw Error('OBSERVER_RECEIPT_IDENTITY');
      const status=quantity(r.status);if(!['0','1'].includes(status)) throw Error('OBSERVER_RECEIPT_STATUS');
      const t={hash,blockNumber:b.number,blockHash:b.hash,blockTimestamp:b.timestamp,transactionIndex,from:address(tx.from),to:tx.to===null?null:address(tx.to),nonce:quantity(tx.nonce),value:quantity(tx.value),input:hex(tx.input),gas:quantity(tx.gas),gasUsed:quantity(r.gasUsed),effectiveGasPrice:quantity(r.effectiveGasPrice??tx.gasPrice),status};
      transactions.push(t);
      if(status==='1'&&BigInt(t.value)>0n&&t.to) payments.push({id:hash+':native',kind:'native-top-level',asset:'native',payer:t.from,payee:t.to,amount:t.value,broadcaster:t.from,transactionHash:hash,blockNumber:b.number,blockHash:b.hash,blockTimestamp:b.timestamp,transactionIndex,logIndex:null});
      for(const item of r.logs) {
        const l={address:address(item.address),topics:item.topics.map(x=>hex(x,32)),data:hex(item.data),blockNumber:quantity(item.blockNumber),blockHash:hex(item.blockHash,32),transactionHash:hex(item.transactionHash,32),transactionIndex:quantity(item.transactionIndex),logIndex:quantity(item.logIndex),removed:Boolean(item.removed)};
        const key=l.transactionHash+':'+l.logIndex;
        if(l.removed||l.blockHash!==b.hash||l.blockNumber!==b.number||l.transactionHash!==hash||l.transactionIndex!==transactionIndex||logKeys.has(key)) throw Error('OBSERVER_LOG_IDENTITY');
        logKeys.add(key);logs.push(l);
        if(status==='1'&&l.topics.length===3&&l.topics[0]===TRANSFER&&/^0x[0-9a-f]{64}$/.test(l.data)&&/^0x0{24}/.test(l.topics[1])&&/^0x0{24}/.test(l.topics[2])) {
          payments.push({id:key,kind:'erc20-transfer',asset:l.address,payer:address('0x'+l.topics[1].slice(-40)),payee:address('0x'+l.topics[2].slice(-40)),amount:BigInt(l.data).toString(),broadcaster:t.from,transactionHash:hash,blockNumber:b.number,blockHash:b.hash,blockTimestamp:b.timestamp,transactionIndex,logIndex:l.logIndex});
        }
      }
    }
  }
  const anchor=await rpc('eth_getBlockByNumber',[rpcQuantity(end),false]);
  if(!anchor||hex(anchor.hash,32)!==blocks.at(-1).hash) throw Error('OBSERVER_REORG_DURING_CAPTURE');
  transactions.sort(order);logs.sort(order);payments.sort(order);
  const output={schema:OBSERVER_SCHEMA,profile,chainId,range:{fromBlock:String(start),toBlock:String(end)},blocks,transactions,logs,payments};
  if(profile==='public-chain+publiccatalog') output.publicCatalog=catalogProjection(publicCatalog);
  output.provenance={source:'direct-json-rpc',complete:true,ordering:'blockNumber,transactionIndex,logIndex',timeSource:'block.timestamp_seconds',paymentScope:'successful top-level native value and ERC-20-shaped Transfer logs; internal native transfers are not decoded',catalogSource:profile==='public-chain+publiccatalog'?'explicitly-declared-public-catalog':null,authentication:'trusted RPC observation; no consensus or receipt-inclusion proof',contentSha256:digest(output)};
  return output;
}

export function validatePublicObserver(observer) {
  const issues=[];
  try {
    const top=['schema','profile','chainId','range','blocks','transactions','logs','payments','provenance',...(observer?.profile==='public-chain+publiccatalog'?['publicCatalog']:[])];
    if(!observer||Object.keys(observer).some(k=>!top.includes(k))||observer.schema!==OBSERVER_SCHEMA||!allowedProfiles.includes(observer.profile)) throw Error('OBSERVER_SCHEMA_OR_FIELDS');
    const checkKeys=(rows,keys)=>{if(!Array.isArray(rows)||rows.some(r=>!r||Object.keys(r).length!==keys.length||Object.keys(r).some(k=>!keys.includes(k))))throw Error('OBSERVER_NONPUBLIC_FIELD');};
    checkKeys([observer.range],['fromBlock','toBlock']);
    checkKeys([observer.provenance],['source','complete','ordering','timeSource','paymentScope','catalogSource','authentication','contentSha256']);
    checkKeys(observer.blocks,['number','hash','parentHash','timestamp']);
    checkKeys(observer.transactions,['hash','blockNumber','blockHash','blockTimestamp','transactionIndex','from','to','nonce','value','input','gas','gasUsed','effectiveGasPrice','status']);
    checkKeys(observer.logs,['address','topics','data','blockNumber','blockHash','transactionHash','transactionIndex','logIndex','removed']);
    checkKeys(observer.payments,['id','kind','asset','payer','payee','amount','broadcaster','transactionHash','blockNumber','blockHash','blockTimestamp','transactionIndex','logIndex']);
    if(observer.profile==='public-chain+publiccatalog')catalogProjection(observer.publicCatalog);
    const {provenance,...body}=observer;
    if(provenance?.source!=='direct-json-rpc'||provenance.complete!==true||provenance.timeSource!=='block.timestamp_seconds'||provenance.contentSha256!==digest(body))throw Error('OBSERVER_PROVENANCE_HASH');
    const blocks=new Map(observer.blocks.map(b=>[b.number,b]));
    if(blocks.size!==observer.blocks.length||BigInt(observer.range.toBlock)-BigInt(observer.range.fromBlock)+1n!==BigInt(blocks.size))throw Error('OBSERVER_BLOCK_RANGE');
    observer.blocks.forEach((b,i)=>{hex(b.hash,32);hex(b.parentHash,32);quantity(b.timestamp);if(b.number!==String(BigInt(observer.range.fromBlock)+BigInt(i))||(i&&b.parentHash!==observer.blocks[i-1].hash))throw Error('OBSERVER_BLOCK_ORDER');});
    const txs=new Map(observer.transactions.map(t=>[t.hash,t]));if(txs.size!==observer.transactions.length)throw Error('OBSERVER_DUPLICATE_TRANSACTION');
    const txSlots=new Set();for(const [i,t] of observer.transactions.entries()){hex(t.hash,32);address(t.from);if(t.to!==null)address(t.to);hex(t.input);for(const k of ['value','nonce','gas','gasUsed','effectiveGasPrice','transactionIndex'])quantity(t[k]);if(!['0','1'].includes(t.status))throw Error('OBSERVER_RECEIPT_STATUS');const slot=t.blockNumber+':'+t.transactionIndex;if(txSlots.has(slot))throw Error('OBSERVER_TRANSACTION_SLOT');txSlots.add(slot);const b=blocks.get(t.blockNumber);if(!b||b.hash!==t.blockHash||b.timestamp!==t.blockTimestamp||(i&&order(observer.transactions[i-1],t)>0))throw Error('OBSERVER_TRANSACTION_ORDER');}
    for(const [i,l] of observer.logs.entries()){address(l.address);l.topics.forEach(x=>hex(x,32));hex(l.data);quantity(l.logIndex);const t=txs.get(l.transactionHash);if(!t||l.blockHash!==t.blockHash||l.blockNumber!==t.blockNumber||l.transactionIndex!==t.transactionIndex||l.removed||(i&&order(observer.logs[i-1],l)>0))throw Error('OBSERVER_LOG_ORDER');}
    const logs=new Map(observer.logs.map(l=>[l.transactionHash+':'+l.logIndex,l]));if(logs.size!==observer.logs.length)throw Error('OBSERVER_DUPLICATE_LOG');
    const ids=new Set();for(const p of observer.payments){const t=txs.get(p.transactionHash);if(!t||t.status!=='1'||p.broadcaster!==t.from||p.blockHash!==t.blockHash||p.blockTimestamp!==t.blockTimestamp||p.transactionIndex!==t.transactionIndex||p.blockNumber!==t.blockNumber||ids.has(p.id))throw Error('OBSERVER_PAYMENT_IDENTITY');ids.add(p.id);
      if(p.kind==='erc20-transfer'){const l=logs.get(p.id);if(!l||l.topics.length!==3||l.topics[0]!==TRANSFER||p.asset!==l.address||p.amount!==BigInt(l.data).toString()||p.payer!=='0x'+l.topics[1].slice(-40)||p.payee!=='0x'+l.topics[2].slice(-40)||p.logIndex!==l.logIndex)throw Error('OBSERVER_TRANSFER_DERIVATION');}
      else if(p.kind!=='native-top-level'||p.id!==t.hash+':native'||p.asset!=='native'||p.payer!==t.from||p.payee!==t.to||p.amount!==t.value||p.logIndex!==null)throw Error('OBSERVER_NATIVE_DERIVATION');
    }
    for(const t of observer.transactions)if(t.status==='1'&&BigInt(t.value)>0n&&t.to&&!ids.has(t.hash+':native'))throw Error('OBSERVER_MISSING_NATIVE_PAYMENT');
    for(const l of observer.logs)if(txs.get(l.transactionHash)?.status==='1'&&l.topics.length===3&&l.topics[0]===TRANSFER&&/^0x[0-9a-f]{64}$/.test(l.data)&&/^0x0{24}/.test(l.topics[1])&&/^0x0{24}/.test(l.topics[2])&&!ids.has(l.transactionHash+':'+l.logIndex))throw Error('OBSERVER_MISSING_TRANSFER_PAYMENT');
  }catch(e){issues.push(e.message);}
  return {ok:issues.length===0,issues,scope:'schema, recorded source declaration, hash and cross-record consistency; not RPC authenticity'};
}

export function publicPaymentGraph(observer) {
  const valid=validatePublicObserver(observer);if(!valid.ok)throw Error(valid.issues[0]);
  const nodes=new Map(),edges=[];
  const node=(id,kind,extra={})=>{if(!nodes.has(id))nodes.set(id,{id,kind,...extra});return id;};
  for(const t of observer.transactions){const tx=node('tx:'+t.hash,'transaction',{hash:t.hash,blockNumber:t.blockNumber,transactionIndex:t.transactionIndex,blockTimestamp:t.blockTimestamp,status:t.status});edges.push({id:'broadcast:'+t.hash,from:node('account:'+t.from,'account',{address:t.from}),to:tx,kind:'broadcast',transactionHash:t.hash});}
  for(const p of observer.payments){edges.push({id:'payment:'+p.id,from:node('account:'+p.payer,'account',{address:p.payer}),to:node('account:'+p.payee,'account',{address:p.payee}),kind:p.kind,asset:p.asset,amount:p.amount,transactionHash:p.transactionHash,logIndex:p.logIndex});}
  return {schema:'web3-public-payment-graph-v1',observerSha256:observer.provenance.contentSha256,nodes:[...nodes.values()],edges};
}

export function observerFiles(observer) {
  const graph=publicPaymentGraph(observer),esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),csv=s=>'"'+String(s??'').replaceAll('"','""')+'"';
  const graphml='<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><key id="record" for="all" attr.name="record" attr.type="string"/><graph edgedefault="directed">'+graph.nodes.map(n=>`<node id="${esc(n.id)}"><data key="record">${esc(JSON.stringify(n))}</data></node>`).join('')+graph.edges.map(e=>`<edge id="${esc(e.id)}" source="${esc(e.from)}" target="${esc(e.to)}"><data key="record">${esc(JSON.stringify(e))}</data></edge>`).join('')+'</graph></graphml>';
  return {'observer.json':JSON.stringify(observer,null,2),'graph.json':JSON.stringify(graph,null,2),'graph.graphml':graphml,'nodes.csv':'id,kind,record\n'+graph.nodes.map(n=>[n.id,n.kind,JSON.stringify(n)].map(csv).join(',')).join('\n'),'edges.csv':'id,from,to,kind,record\n'+graph.edges.map(e=>[e.id,e.from,e.to,e.kind,JSON.stringify(e)].map(csv).join(',')).join('\n')};
}
