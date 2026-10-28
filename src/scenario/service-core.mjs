import {normalize,units,hash,json} from './core.mjs';
export const POLICY='balance-report-v1';
export const serviceTools={buyer:['send_message','approve_budget','create_job','fund_job','inspect_job','refund_job','cancel_job','wait','finish'],provider:['send_message','inspect_job','generate_report','submit_report','wait','finish'],evaluator:['inspect_job','evaluate_report','wait']};
export function normalizeService(input){
 if(input.settlementMode&&input.settlementMode!=='service_escrow')throw Error('SERVICE_SETTLEMENT_MODE');
 const shared=normalize({...input,template:'peer_swap',expectedOutcome:'filled',experimentMode:'independent',agents:input.agents?.slice(0,2)});
 if(input.experimentMode&&input.experimentMode!=='independent')throw Error('SERVICE_INDEPENDENT_ONLY');
 const payment=input.payment??'5';units(payment);if(units(payment)>100000000n)throw Error('PAYMENT_EXCEEDS_INITIAL_FUNDS');
 const reportMode=input.reportMode??'correct',evaluatorMode=input.evaluatorMode??'honest';
 if(!['correct','wrong_balance','wrong_block','malformed','hash_mismatch','withhold'].includes(reportMode))throw Error('REPORT_MODE');
 if(!['honest','wrong_approve','wrong_reject','offline'].includes(evaluatorMode))throw Error('EVALUATOR_MODE');
 const reportToken=input.reportToken??'A',reportAccount=input.reportAccount??'buyer';
 if(!['A','B'].includes(reportToken)||!['buyer','provider','recipient'].includes(reportAccount))throw Error('REPORT_TARGET');
 const expectedOutcome=input.expectedOutcome??'completed';if(!['completed','rejected','refunded','quality_failure','no_deal'].includes(expectedOutcome))throw Error('SERVICE_EXPECTATION');
 const goals=[{maxPay:input.agents?.[0]?.goal?.maxPay??payment},{minPrice:input.agents?.[1]?.goal?.minPrice??payment}];goals.forEach(g=>Object.values(g).forEach(units));
 return {...shared,template:'service_purchase',settlementMode:'service_escrow',expectedOutcome,payment,reportMode,evaluatorMode,reportToken,reportAccount,
 agents:[...shared.agents.map((a,i)=>({...a,agentId:i?'provider':'buyer',role:i?'provider':'buyer',walletId:i?'provider':'buyer',initialA:i?'100':'0',initialB:i?'0':'100',goal:goals[i],tools:serviceTools[i?'provider':'buyer']})),
 {...shared.agents[0],agentId:'evaluator',role:'evaluator',walletId:'evaluator',initialA:'0',initialB:'0',goal:{policy:POLICY},model:{...shared.agents[0].model,baseUrl:'',model:'',apiKey:'',systemPrompt:''},tools:serviceTools.evaluator}]};
}
export function serviceDefinitions(spec){
 const desc={send_message:'Send a message to buyer or provider. inquiry/accept/reject may omit payload; quote needs payload.price (human decimal TokenB); accept needs quoteId from a received quote.',approve_budget:'Buyer approves exact agreed payment to fixed escrow.',create_job:'Buyer creates agreed report job, without funding.',fund_job:'Buyer funds current job with exact expectedBudget.',inspect_job:'Read and verify on-chain job and request.',generate_report:'Provider generates JSON from pinned block, token and account.',submit_report:'Provider delivers and commits generated report.',evaluate_report:'System evaluator checks report and accepts or rejects on chain.',refund_job:'Refund funded/submitted job at or after deadline.',cancel_job:'Buyer cancels unfunded job.',wait:'Yield scheduler turn.',finish:'End own decisions; does not move funds.'};
 return spec.tools.map(name=>({type:'function',function:{name,description:desc[name],parameters:{type:'object',properties:name==='send_message'?{recipient:{type:'string',enum:['buyer','provider']},kind:{type:'string',enum:['inquiry','quote','accept','reject','order_ref']},quoteId:{type:'string'},replyTo:{type:'string'},payload:{type:'object',additionalProperties:true}}:name==='finish'?{reason:{type:'string'}}:{},required:name==='send_message'?['recipient','kind']:[],additionalProperties:false}}}));
}
export function assessReport(request,artifact,commitment,reference){
 const checks=[],add=(id,expected,actual)=>checks.push({id,expected,actual,passed:json(expected)===json(actual)});
 add('report_present',true,!!artifact);add('reference_present',true,!!reference);
 if(artifact){add('artifact_commitment',commitment,'0x'+hash(artifact));add('schema',POLICY,artifact.schema);
 for(const k of ['chainId','blockNumber','blockHash','token','account'])add(k,request[k],artifact[k]);
 if(reference){add('reference_block',request.blockHash,reference.blockHash);add('balance_raw',reference.balance,artifact.balance);add('decimals',reference.decimals,artifact.decimals);}}
 return {policy:POLICY,quality:checks.every(c=>c.passed)?'passed':'failed',assertions:checks};
}
export function checkServiceEvidence(e){
 const checks=[],add=(id,expected,actual)=>checks.push({id,expected,actual,passed:json(expected)===json(actual)});
 const status=Number(e.job?.status??0),paid=status===4,refund=[5,6].includes(status),budget=units(e.spec.payment),b=e.before,a=e.after;
 const quality=assessReport(e.request,e.artifact,e.job?.artifactHash,e.checkerReference);
 const settled=paid?'paid':refund?'refunded':status===7?'cancelled':status===2||status===3?'escrowed':'none';
 if(b&&a){const delta=id=>BigInt(a.assets[id].B)-BigInt(b.assets[id].B);
 add('buyer_payment',String(paid||status===2||status===3?-budget:0n),String(delta('buyer')));add('provider_payment',String(paid?budget:0n),String(delta('provider')));
 add('escrow_payment',String(status===2||status===3?budget:0n),a.escrow.B);add('tokenA_conservation',b.supply.A,a.supply.A);add('tokenB_conservation',b.supply.B,a.supply.B);
 for(const id of ['buyer','provider','evaluator'])add(id+'_no_A_change',b.assets[id].A,a.assets[id].A);add('evaluator_no_payment',b.assets.evaluator.B,a.assets.evaluator.B);}
 if(status){add('job_buyer',b.assets.buyer.address.toLowerCase(),e.job.buyer.toLowerCase());add('job_budget',String(budget),String(e.job.budget));add('job_request_commitment','0x'+hash(e.request),e.job.requestHash);}
 const successful=e.transactions.filter(t=>t.state==='confirmed');add('at_most_one_payment',true,successful.filter(t=>t.functionName==='evaluate'&&t.args?.[2]===true).length<=1);
 if(status){add('create_receipt',1,successful.filter(t=>t.functionName==='createJob'&&t.receipt?.status==='success').length);}
 if([2,3,4,5,6].includes(status))add('funding_receipt',1,successful.filter(t=>t.functionName==='fundJob'&&t.receipt?.status==='success').length);
 if(paid){add('paid_artifact_quality','passed',quality.quality);add('payment_receipt',1,successful.filter(t=>t.functionName==='evaluate'&&t.args?.[2]===true&&t.receipt?.status==='success').length);
 add('buyer_budget',true,budget<=units(e.spec.agents[0].goal.maxPay));add('provider_price',true,budget>=units(e.spec.agents[1].goal.minPrice));}

 const outcome=paid?(quality.quality==='passed'?'completed':'paid_bad_artifact'):status===5?'rejected':status===6?'refunded':status===7?'cancelled':e.rejected&&status===0?'no_deal':'incomplete';
 add('expected_business_outcome',true,e.spec.expectedOutcome==='quality_failure'?outcome==='paid_bad_artifact':e.spec.expectedOutcome===outcome);
 const pending=e.transactions.some(t=>['unknown','pending','broadcasting','reserved'].includes(t.state));
 return {checkerVersion:'service-1.0',status:!pending&&checks.every(c=>c.passed)?'success':'failure',settlement_status:pending?'pending_or_unknown':settled,business_outcome:outcome,artifact_quality:e.artifact?quality.quality:'not_delivered',artifact_integrity:quality.assertions.find(c=>c.id==='artifact_commitment')?.passed??false,evaluator:e.evaluation??null,
 agent_goal_results:{buyer:paid&&quality.quality==='passed'?'success':refund?'refunded':'failure',provider:paid?'paid':refund?'unpaid':'incomplete'},evidence_completeness:e.checkerReference?'recorded':'incomplete',quality,assertions:checks};
}
