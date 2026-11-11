import {createHash,generateKeyPairSync,sign,verify,randomUUID} from 'node:crypto';

export const AP2_COMMIT='e1ea56db72a6385bce3e5c1112b3a56ce60acb43';
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
const hash=x=>createHash('sha256').update(x).digest('base64url');
const fail=(code,message)=>Object.assign(Error(message),{code});
const key=()=>generateKeyPairSync('ec',{namedCurve:'prime256v1'});
function jwt(payload,k,kid){const head=b64({alg:'ES256',typ:'JWT',kid}),body=b64(payload),data=`${head}.${body}`;return`${data}.${sign('sha256',Buffer.from(data),{key:k.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;}
function checkJwt(token,k,kid,now){
 if(typeof token!=='string'||token.length>65536)throw fail('AP2_MALFORMED','Missing or oversized local mandate');
 const parts=token.split('.');if(parts.length!==3)throw fail('AP2_MALFORMED','Expected compact signed JWT');
 let h,p;try{h=JSON.parse(Buffer.from(parts[0],'base64url'));p=JSON.parse(Buffer.from(parts[1],'base64url'));}catch{throw fail('AP2_MALFORMED','Invalid mandate JSON');}
 if(h.alg!=='ES256'||h.kid!==kid||!verify('sha256',Buffer.from(parts.slice(0,2).join('.')),{key:k.publicKey,dsaEncoding:'ieee-p1363'},Buffer.from(parts[2],'base64url')))throw fail('AP2_BAD_SIGNATURE','Untrusted mandate signature');
 if(!Number.isInteger(p.exp)||!Number.isInteger(p.iat)||p.exp<=now||p.iat>now+5)throw fail('AP2_EXPIRED','Mandate expired or issued in the future');
 return p;
}

/** AP2-schema local authorization overlay, NOT a full AP2/SD-JWT implementation.
 * Trusted research authority is provisioned when the environment is created;
 * model-controlled tools never get either signing key. Keys/tokens are not exported.
 */
export function createAP2Authorizer({chainId,token,providers,budgetBase,ttlSeconds=300,clock=()=>Math.floor(Date.now()/1000)}){
 const merchantKey=key(),userKey=key(),scopeId=randomUUID(),consumed=new Map();let reserved=0n;
 const publicKeys={merchant:merchantKey.publicKey.export({format:'jwk'}),controller:userKey.publicKey.export({format:'jwk'})};
 const providerMap=new Map(providers.map(p=>[p.id,p.address.toLowerCase()]));
 function binding(x){return{requestId:x.requestId,providerId:x.providerId,payee:providerMap.get(x.providerId),chainId,asset:token.toLowerCase(),amountBase:String(x.amountBase),resourceHash:hash(x.resource)};}
 function amount(x){const n=BigInt(x.amountBase);if(n<=0n||n%10000n!==0n||n/10000n>BigInt(Number.MAX_SAFE_INTEGER))throw fail('AP2_MINOR_UNIT_UNSUPPORTED','AP2 USD minor-unit profile requires a positive integer cent (10000 base units at token decimals=6)');return n;}
 return{
  manifest:{profile:'ap2-schema-local-es256-overlay',upstreamCommit:AP2_COMMIT,fullProtocolCertification:false,selectiveDisclosure:false,trust:'local preconfigured research authority',currency:'USD',tokenUnitMapping:'1 USD = 1000000 research token base units; payment_amount uses integer USD cents',scopeId,publicKeys},
  issue(x){
   const n=amount(x);if(!providerMap.has(x.providerId))throw fail('AP2_PAYEE_DENIED','Provider outside delegated scope');
   if(consumed.has(x.requestId))throw fail('AP2_REPLAY','Request already consumed');
   if(reserved+n>BigInt(budgetBase))throw fail('AP2_BUDGET_DENIED','Request exceeds local authorization budget');
   const now=clock(),expiry=now+ttlSeconds,web3=binding(x);
   const checkout=jwt({iss:'lab-merchant',aud:scopeId,iat:now,exp:expiry,id:x.requestId,merchant:{id:x.providerId,name:x.providerId},total:{currency:'USD',amount:Number(n/10000n)},web3_payment:web3},merchantKey,'lab-merchant');
   const digest=hash(checkout);
   const checkoutMandate=jwt({vct:'mandate.checkout.1',checkout_jwt:checkout,checkout_hash:digest,iat:now,exp:expiry,aud:scopeId},userKey,'lab-controller');
   const paymentMandate=jwt({vct:'mandate.payment.1',transaction_id:digest,payee:{id:x.providerId,name:x.providerId},payment_amount:{currency:'USD',amount:Number(n/10000n)},payment_instrument:{id:`eip155:${chainId}/${token}`,type:'research-erc20-x402'},iat:now,exp:expiry,aud:scopeId,web3_payment:web3},userKey,'lab-controller');
   return{checkoutMandate,paymentMandate};
  },
  verify(envelope,x,{consume=true}={}){
   const now=clock(),c=checkJwt(envelope.checkoutMandate,userKey,'lab-controller',now),p=checkJwt(envelope.paymentMandate,userKey,'lab-controller',now);
   const ch=checkJwt(c.checkout_jwt,merchantKey,'lab-merchant',now),n=amount(x),expected=binding(x);
   if(c.vct!=='mandate.checkout.1'||p.vct!=='mandate.payment.1'||c.aud!==scopeId||p.aud!==scopeId||ch.aud!==scopeId)throw fail('AP2_SCOPE','Mandate type or audience mismatch');
   if(c.checkout_hash!==hash(c.checkout_jwt)||p.transaction_id!==c.checkout_hash)throw fail('AP2_CHECKOUT_BINDING','Checkout hash mismatch');
   if(p.payee?.id!==x.providerId||p.payment_amount?.currency!=='USD'||p.payment_amount?.amount!==Number(n/10000n)||ch.total?.amount!==Number(n/10000n))throw fail('AP2_AMOUNT_OR_PAYEE','Amount/payee mismatch');
   if(JSON.stringify(p.web3_payment)!==JSON.stringify(expected)||JSON.stringify(ch.web3_payment)!==JSON.stringify(expected))throw fail('AP2_WEB3_BINDING','Request, resource, chain, asset or recipient changed');
   if(consumed.has(x.requestId))throw fail('AP2_REPLAY','Mandate request already consumed');
   if(reserved+n>BigInt(budgetBase))throw fail('AP2_BUDGET_DENIED','Concurrent authorization exceeds scope');
   if(consume){consumed.set(x.requestId,n);reserved+=n;}
   return{verified:true,profile:'ap2-schema-local-es256-overlay',requestId:x.requestId,checkoutHash:c.checkout_hash,paymentMandateHash:hash(envelope.paymentMandate),checkoutMandateHash:hash(envelope.checkoutMandate),scopeId,amountBase:String(n),currency:'USD',minorAmount:Number(n/10000n),reservedBase:String(reserved)};
  },
 };
}
