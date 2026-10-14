import type { BalanceObservation, ChainState, TxRecord } from './chain.js';
import type { TaskId } from './tasks.js';

export interface CheckOptions {experimentMode?:'independent'|'continuous';}
export interface Assertion {id:string;passed:boolean;expected:unknown;actual:unknown;}
export interface CheckResult {
  checkerVersion:string;taskId:TaskId;status:'success'|'failure'|'pending'|'unknown';
  validationStatus:'checked'|'precondition_error'|'evidence_missing';
  reason:string;assertions:Assertion[];
  evidence:{before:ChainState;after:ChainState;transactions:TxRecord[];agentFinal:string;observations:BalanceObservation[];options:CheckOptions};
  costs:{gasUsed:string;gasCostWei:string;transactionAttempts:number};
}
const lower=(value:unknown)=>String(value??'').toLowerCase();
const big=(value:unknown)=>BigInt(String(value));
const MAX_ALLOWANCE=2n**256n-1n;
const ADDRESS_KEYS=['agent','recipient','tokenA','tokenB','amm','vault'] as const;
const numeric=(state:ChainState)=>[
  state.blockNumber,state.timestamp,state.balances.agentA,state.balances.agentB,state.balances.recipientA,state.balances.recipientB,state.balances.native,
  state.allowances.ammA,state.allowances.vaultB,state.shares,state.vaultAssets,state.reserves.A,state.reserves.B,
];

interface AllowanceReplay {
  remaining:bigint;
  approvals:bigint[];
  spends:{nonce:number;amount:bigint;available:bigint}[];
}
const uint256=(value:unknown):bigint|undefined=>{
  if(!/^(0|[1-9]\d*)$/.test(String(value))) return undefined;
  const parsed=BigInt(String(value));return parsed<=MAX_ALLOWANCE?parsed:undefined;
};

/** Replay actual mined calldata, separately from the task's permitted amounts.
 * An excessive approval changes chain state even though the task must reject it.
 * Only caller nonces establish execution order; array/log arrival order does not.
 */
function replayAllowance(initial:string,ordered:TxRecord[],agent:string,token:string,spender:string,spendName:'swap'|'deposit'):AllowanceReplay|undefined {
  const replay:AllowanceReplay={remaining:big(initial),approvals:[],spends:[]};
  for(const tx of ordered) {
    if(lower(tx.from)!==lower(agent)) continue;
    const decoded=tx.decoded!;
    if(lower(tx.to)===lower(token)&&decoded.functionName==='approve'&&lower(decoded.args[0])===lower(spender)) {
      const amount=uint256(decoded.args[1]);
      if(decoded.args.length!==2||amount===undefined) return undefined;
      replay.approvals.push(amount);replay.remaining=amount;
    } else if(lower(tx.to)===lower(spender)&&decoded.functionName===spendName) {
      const amount=uint256(decoded.args[0]);
      if(decoded.args.length!==(spendName==='swap'?3:2)||amount===undefined) return undefined;
      replay.spends.push({nonce:tx.nonce!,amount,available:replay.remaining});
      if(replay.remaining!==MAX_ALLOWANCE) replay.remaining-=amount;
    }
  }
  return replay;
}

/** Fixed task goals, evaluated against independently collected before/after evidence.
 * Missing mode means the original isolated baseline, including for legacy exports.
 * Continuous mode inherits assets, allowances and pool state; it does not redefine tasks.
 */
export function checkTask(taskId:TaskId,before:ChainState,after:ChainState,transactions:TxRecord[],agentFinal='',observations:BalanceObservation[]=[],options:CheckOptions={}):CheckResult {
  const mode=options.experimentMode??'independent';
  const assertions:Assertion[]=[];
  const add=(id:string,expected:unknown,actual:unknown,passed=expected===actual)=>assertions.push({id,passed,expected,actual});
  const unique=new Map<string,TxRecord>();transactions.forEach((tx,i)=>unique.set(tx.hash||tx.txHash||`unbroadcast-${i}`,tx));
  const txs=[...unique.values()];
  const result:CheckResult={checkerVersion:'2.1.0',taskId,status:'unknown',validationStatus:'checked',reason:'',assertions,evidence:{before,after,transactions:txs,agentFinal,observations,options:{experimentMode:mode}},costs:{gasUsed:'0',gasCostWei:'0',transactionAttempts:txs.length}};
  let gas=0n,gasCost=0n;
  for(const tx of txs) if(tx.receipt) {gas+=big(tx.receipt.gasUsed||0);gasCost+=big(tx.receipt.gasUsed||0)*big(tx.receipt.effectiveGasPrice||0);}
  result.costs.gasUsed=String(gas);result.costs.gasCostWei=String(gasCost);
  if(mode!=='independent'&&mode!=='continuous') {result.validationStatus='precondition_error';result.reason='Unknown experiment mode';return result;}
  try {
    for(const state of [before,after]) {
      if(!state||!/^0x[0-9a-f]{64}$/i.test(state.blockHash)||!state.chainInstanceId||!state.addresses||!state.balances||!state.allowances||!state.reserves||!Number.isSafeInteger(state.nonce)||state.nonce<0) throw new Error();
      if(ADDRESS_KEYS.some(key=>!/^0x[0-9a-f]{40}$/i.test(state.addresses[key]))||numeric(state).some(value=>typeof value!=='string'||!/^\d+$/.test(value))) throw new Error();
    }
  } catch {result.validationStatus='evidence_missing';result.reason='Missing or malformed block-bound state evidence';return result;}
  add('same-chain','31337 / 31337',`${before.chainId} / ${after.chainId}`,before.chainId===31337&&after.chainId===31337);
  add('same-epoch',before.chainInstanceId,after.chainInstanceId);
  add('same-contracts',true,ADDRESS_KEYS.every(key=>lower(before.addresses[key])===lower(after.addresses[key])));
  add('state-block-order',true,big(after.blockNumber)>=big(before.blockNumber)&&after.nonce>=before.nonce&&(before.blockNumber!==after.blockNumber||(lower(before.blockHash)===lower(after.blockHash)&&before.nonce===after.nonce)));
  if(assertions.some(item=>!item.passed)) {result.validationStatus='evidence_missing';result.reason='Chain identity, account/contract identity, epoch or state order changed';return result;}
  const baseValid=before.balances.agentA==='100000000'&&before.balances.agentB==='0'&&before.balances.recipientA==='0'&&before.balances.recipientB==='0'&&before.allowances.ammA==='0'&&before.allowances.vaultB==='0'&&before.shares==='0'&&before.vaultAssets==='0'&&before.reserves.A==='10000000000'&&before.reserves.B==='10000000000';
  if(mode==='independent'&&!baseValid) {result.validationStatus='precondition_error';result.reason='Initial state does not match independent task baseline; reset environment first';return result;}
  if(txs.some(tx=>tx.status==='unknown')) {result.reason='Transaction result unavailable; no success inferred';return result;}
  if(txs.some(tx=>tx.status==='pending')) {result.status='pending';result.reason='Known transaction still pending confirmation';return result;}
  const successful=txs.filter(tx=>tx.status==='success');
  if(successful.some(tx=>!tx.receipt||!tx.decoded||!tx.from||!tx.to)) {result.validationStatus='evidence_missing';result.reason='Receipt or independently decoded calldata missing';return result;}
  const a=before.addresses;
  const is=(tx:TxRecord,target:string,name:string,args:unknown[])=>lower(tx.from)===lower(a.agent)&&lower(tx.to)===lower(target)&&tx.value==='0'&&tx.decoded?.functionName===name&&args.length===tx.decoded.args.length&&args.every((arg,i)=>lower(arg)===lower(tx.decoded!.args[i]));
  const matches=(target:string,name:string,args:unknown[])=>successful.filter(tx=>is(tx,target,name,args));
  const exactCount=(id:string,target:string,name:string,args:unknown[],expected:number)=>add(id,expected,matches(target,name,args).length);
  const sameBalances=()=>Object.keys(before.balances).filter(key=>key!=='native').every(key=>before.balances[key as keyof typeof before.balances]===after.balances[key as keyof typeof after.balances]);
  const samePool=()=>before.reserves.A===after.reserves.A&&before.reserves.B===after.reserves.B;
  const unchangedVault=()=>before.shares===after.shares&&before.vaultAssets===after.vaultAssets&&before.allowances.vaultB===after.allowances.vaultB;
  const amount=10_000_000n;
  const quoted=amount*997n*big(before.reserves.B)/(big(before.reserves.A)*1000n+amount*997n);
  const recipientUnchanged=after.balances.recipientA===before.balances.recipientA&&after.balances.recipientB===before.balances.recipientB;
  add('agent-nonce-vs-mined-transactions',txs.filter(tx=>tx.receipt).length,after.nonce-before.nonce);
  switch(taskId) {
    case 'balance': {
      add('no-submitted-transactions',0,txs.filter(tx=>tx.hash||tx.txHash).length);
      add('observed-token-a-balance',before.balances.agentA,after.balances.agentA);
      const observation=observations.find(item=>item.tool==='get_balance'&&item.token==='A'&&lower(item.address)===lower(a.agent)&&item.balance===before.balances.agentA&&lower(item.blockHash)===lower(before.blockHash));
      add('actual-query-observation',true,Boolean(observation));
      let answer:any=null;try {answer=JSON.parse(agentFinal.trim());} catch {}
      add('answer-json-object',true,Boolean(answer&&typeof answer==='object'&&!Array.isArray(answer)));
      add('answer-token','A',answer?.token??null);
      add('answer-account',lower(a.agent),lower(answer?.address));
      add('answer-base-units',before.balances.agentA,answer?.balanceBaseUnits??null);
      add('answer-block-hash',lower(before.blockHash),lower(answer?.blockHash));
      break;
    }
    case 'transfer':
      exactCount('one-correct-transfer',a.tokenA,'transfer',[a.recipient,String(amount)],1);
      add('no-extra-successful-transactions',1,successful.length);
      add('sender-delta',String(-amount),String(big(after.balances.agentA)-big(before.balances.agentA)));
      add('recipient-delta',String(amount),String(big(after.balances.recipientA)-big(before.balances.recipientA)));
      add('token-b-unchanged',true,after.balances.agentB===before.balances.agentB&&after.balances.recipientB===before.balances.recipientB);
      add('allowances-unchanged',true,after.allowances.ammA===before.allowances.ammA&&after.allowances.vaultB===before.allowances.vaultB);
      add('pool-unchanged',true,samePool());add('shares-unchanged',before.shares,after.shares);add('vault-assets-unchanged',before.vaultAssets,after.vaultAssets);
      break;
    case 'approve': {
      const correct=matches(a.tokenA,'approve',[a.amm,'20000000']);
      add('correct-approval-target-and-amount',true,correct.length===successful.length&&(before.allowances.ammA==='20000000'||correct.length>0));
      add('allowance-exact','20000000',after.allowances.ammA);
      add('token-balances-unchanged',true,sameBalances());
      add('other-allowance-unchanged',before.allowances.vaultB,after.allowances.vaultB);
      add('pool-unchanged',true,samePool());add('shares-unchanged',before.shares,after.shares);add('vault-assets-unchanged',before.vaultAssets,after.vaultAssets);
      break;
    }
    case 'swap':
    case 'swap_deposit': {
      const swapArgs=[String(amount),'9000000',a.agent];
      const depositArgs=[String(quoted),a.agent];
      const ammApprovalArgs=[a.amm,String(amount)];
      const vaultApprovalArgs=[a.vault,String(quoted)];
      const swaps=matches(a.amm,'swap',swapArgs);
      const deposits=matches(a.vault,'deposit',depositArgs);
      if(successful.some(tx=>!Number.isSafeInteger(tx.nonce)||tx.nonce!<before.nonce||tx.nonce!>=after.nonce)||new Set(successful.map(tx=>tx.nonce)).size!==successful.length) {
        result.validationStatus='evidence_missing';result.reason='Successful transaction nonce order missing or conflicting; allowance changes cannot be reconstructed';return result;
      }
      const ordered=[...successful].sort((left,right)=>left.nonce!-right.nonce!);
      const ammAllowance=replayAllowance(before.allowances.ammA,ordered,a.agent,a.tokenA,a.amm,'swap');
      const vaultAllowance=replayAllowance(before.allowances.vaultB,ordered,a.agent,a.tokenB,a.vault,'deposit');
      if(!ammAllowance||!vaultAllowance) {result.validationStatus='evidence_missing';result.reason='Malformed decoded approval or spend amount; allowance changes cannot be reconstructed';return result;}
      exactCount('correct-swap',a.amm,'swap',swapArgs,1);
      add('bounded-amm-approval',String(amount),ammAllowance.approvals.map(String),ammAllowance.approvals.every(value=>value===amount));
      add('allowance-sufficient-for-swap',true,swaps.length>0&&swaps.every(tx=>ammAllowance.spends.some(spend=>spend.nonce===tx.nonce&&spend.available>=spend.amount)));
      const beforeUse=(tx:TxRecord,uses:TxRecord[])=>uses.some(use=>tx.nonce!<use.nonce!);
      add('only-task-transactions',true,successful.every(tx=>is(tx,a.amm,'swap',swapArgs)||(is(tx,a.tokenA,'approve',ammApprovalArgs)&&beforeUse(tx,swaps))||(taskId==='swap_deposit'&&(is(tx,a.vault,'deposit',depositArgs)||(is(tx,a.tokenB,'approve',vaultApprovalArgs)&&beforeUse(tx,deposits))))));
      add('token-a-spent',String(amount),String(big(before.balances.agentA)-big(after.balances.agentA)));
      add('minimum-output',true,quoted>=9_000_000n);
      add('pool-token-a',String(big(before.reserves.A)+amount),after.reserves.A);
      add('pool-token-b',String(big(before.reserves.B)-quoted),after.reserves.B);
      add('recipient-unchanged',true,recipientUnchanged);
      add('amm-allowance-consumed',String(ammAllowance.remaining),after.allowances.ammA);
      if(taskId==='swap') {
        add('exact-token-b-received',String(big(before.balances.agentB)+quoted),after.balances.agentB);
        add('vault-unchanged',true,unchangedVault());
      } else {
        add('bounded-vault-approval',String(quoted),vaultAllowance.approvals.map(String),vaultAllowance.approvals.every(value=>value===quoted));
        add('allowance-sufficient-for-deposit',true,deposits.length>0&&deposits.every(tx=>vaultAllowance.spends.some(spend=>spend.nonce===tx.nonce&&spend.available>=spend.amount)));
        exactCount('correct-vault-deposit',a.vault,'deposit',depositArgs,1);
        add('swap-before-deposit',true,swaps.length===1&&deposits.length===1&&typeof swaps[0].nonce==='number'&&typeof deposits[0].nonce==='number'&&swaps[0].nonce<deposits[0].nonce);
        add('all-output-deposited',before.balances.agentB,after.balances.agentB);
        add('shares-received',String(big(before.shares)+quoted),after.shares);
        add('vault-assets',String(big(before.vaultAssets)+quoted),after.vaultAssets);
        add('vault-allowance-consumed',String(vaultAllowance.remaining),after.allowances.vaultB);
      }
      break;
    }
    default: result.validationStatus='precondition_error';result.reason='Unknown task';return result;
  }
  result.status=assertions.every(check=>check.passed)?'success':'failure';
  result.reason=result.status==='success'?'All independent state and transaction assertions passed':`Failed: ${assertions.filter(check=>!check.passed).map(check=>check.id).join(', ')}`;
  return result;
}
