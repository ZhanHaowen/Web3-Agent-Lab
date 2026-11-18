// Lab gateway constraints; both existing wallet backends retain their budget checks.
export function normalizePolicy(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('POLICY_CONFIG');
 if(Object.keys(input).some(k=>!['enabled','windowHours','recipientAllowed','spenderAllowed','contractAllowed','highRisk','onViolation','delaySeconds','allowedRecipients','allowedSpenders','allowedContracts'].includes(k)))throw Error('POLICY_FIELDS');
 const p={enabled:true,windowHours:24,recipientAllowed:true,spenderAllowed:true,contractAllowed:true,highRisk:false,onViolation:'deny',delaySeconds:0,...input};
 if(['enabled','recipientAllowed','spenderAllowed','contractAllowed','highRisk'].some(k=>typeof p[k]!=='boolean')||!Number.isFinite(p.windowHours)||p.windowHours<=0||p.windowHours>8760||!Number.isSafeInteger(p.windowHours*3600)||!Number.isSafeInteger(p.delaySeconds)||p.delaySeconds<0||p.delaySeconds>31536001||!['deny','review'].includes(p.onViolation))throw Error('POLICY_CONFIG');
 for(const [key,symbol]of [['allowedRecipients','service'],['allowedSpenders','spender'],['allowedContracts','permit2']]){p[key]=p[key]??[symbol];if(!Array.isArray(p[key])||p[key].length>100||p[key].some(x=>typeof x!=='string'||!(x===symbol||/^0x[0-9a-fA-F]{40}$/.test(x))))throw Error('POLICY_ALLOWLIST');}
 return p;
}
export function inferTaskGoal(task){
 if(/不要|不得|禁止|无需|不必|不能|不应|如果|除非|待[^，。；]*确认|USDC/i.test(task))return null;
 const direct=[...task.matchAll(/(?:直接支付|直接转账|直接转款)\s*(\d+(?:\.\d{1,6})?)(?![\d.])/gi)];
 const permit=[...task.matchAll(/(?:申请|授权|兑换|兑现)\s*(\d+(?:\.\d{1,6})?)\s*(?:BUD)?(?:\s*的)?\s*(?:Permit2|许可)|Permit2\s*(?:许可)?\s*(?:兑换|兑现|支付)?\s*(\d+(?:\.\d{1,6})?)(?![\d.])/gi)];
 return direct.length===1&&permit.length===1?{direct:direct[0][1],permit2:permit[0][1]??permit[0][2]}:null;
}
export function violations(p,permit){
 const reasons=[];
 if(!p.recipientAllowed||!p.allowedRecipients.some(x=>x.toLowerCase()===p.recipient.toLowerCase()))reasons.push('RECIPIENT_NOT_ALLOWLISTED');
 if(permit&&(!p.spenderAllowed||!p.allowedSpenders.some(x=>x.toLowerCase()===p.spender.toLowerCase())))reasons.push('SPENDER_NOT_ALLOWLISTED');
 if(permit&&(!p.contractAllowed||!p.allowedContracts.some(x=>x.toLowerCase()===p.contract.toLowerCase())))reasons.push('CONTRACT_NOT_ALLOWLISTED');
 if(p.highRisk)reasons.push('HIGH_RISK_ACTION');
 return reasons;
}
