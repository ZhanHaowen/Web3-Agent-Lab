import {artifactPath} from './helpers/artifacts.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {LabChain,BudgetExperiment} from '../src/budget/engine.mjs';
import {ROOT,units} from '../src/budget/common.mjs';

process.env.LAB_DATA_DIR=join(ROOT,'data-v0153-parameter-test/compatibility');
const results=[];
const build=JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8'));
const cases=[
 {name:'large arbitrary amounts reproduce cross-path overspend',config:{initial:'1000',budget:'300',payment:'175',permit:'180',mode:'split'},expected:{actual:'355',normal:'175',balance:'645',overspend:'55',status:'failed',reproduction:true,blocked:false}},
 {name:'same arbitrary amounts are blocked by unified budget',config:{initial:'1000',budget:'300',payment:'175',permit:'180',mode:'unified'},expected:{actual:'175',normal:'175',balance:'825',overspend:'0',status:'success',reproduction:false,blocked:true}},
 {name:'fractional split amounts reproduce exact decimal overspend',config:{initial:'2',budget:'0.75',payment:'0.4',permit:'0.5',mode:'split'},expected:{actual:'0.9',normal:'0.4',balance:'1.1',overspend:'0.15',status:'failed',reproduction:true,blocked:false}},
 {name:'fractional unified budget rejects amount above remainder',config:{initial:'2',budget:'0.75',payment:'0.4',permit:'0.5',mode:'unified'},expected:{actual:'0.4',normal:'0.4',balance:'1.6',overspend:'0',status:'success',reproduction:false,blocked:true}},
 {name:'six-decimal exact boundary is accepted',config:{initial:'0.00002',budget:'0.000005',payment:'0.000003',permit:'0.000002',mode:'unified'},expected:{actual:'0.000005',normal:'0.000003',balance:'0.000015',overspend:'0',status:'success',reproduction:false,blocked:false}},
 {name:'one minimal unit above remaining budget is rejected',config:{initial:'0.00002',budget:'0.000005',payment:'0.000003',permit:'0.000003',mode:'unified'},expected:{actual:'0.000003',normal:'0.000003',balance:'0.000017',overspend:'0',status:'success',reproduction:false,blocked:true}},
 {name:'transaction-only arbitrary amounts share normal entry limit',config:{initial:'1000',budget:'300',payment:'175',permit:'180',mode:'split',secondPath:'transaction'},expected:{actual:'175',normal:'175',balance:'825',overspend:'0',status:'success',reproduction:false,blocked:true}},
 {name:'raising only task budget permits the same two payments',config:{initial:'1000',budget:'400',payment:'175',permit:'180',mode:'unified'},expected:{actual:'355',normal:'175',balance:'645',overspend:'0',status:'success',reproduction:false,blocked:false}},
 {name:'raising only wallet balance does not change task budget',config:{initial:'5000',budget:'300',payment:'175',permit:'180',mode:'split'},expected:{actual:'355',normal:'175',balance:'4645',overspend:'55',status:'failed',reproduction:true,blocked:false}}
];
let chain;
try{
 chain=new LabChain();await chain.start();
 for(const item of cases){
  const started=Date.now(),e=new BudgetExperiment(chain,item.config);
  try{
   await e.initialize();await e.run();
   const expected=item.expected;
   assert.equal(e.initial.balance,String(units(item.config.initial)),'configured wallet balance');
   assert.equal(e.ledger.limit,String(units(item.config.budget)),'configured task budget');
   assert.equal(e.check.actualSpent,String(units(expected.actual,true)),'actual asset outflow');
   assert.equal(e.check.normalTransactionCounter,String(units(expected.normal,true)),'normal transaction counter');
   assert.equal(e.final.balance,String(units(expected.balance,true)),'final wallet balance');
   assert.equal(e.check.overspend,String(units(expected.overspend,true)),'overspend amount');
   assert.equal(e.check.status,expected.status,'independent checker status');
   assert.equal(e.check.reproduction,expected.reproduction,'reproduction result');
   assert.equal(Boolean(e.blocked),expected.blocked,'expected authorization rejection');
   if(expected.blocked){
    assert.equal(e.blocked.reason,'TASK_BUDGET_EXCEEDED');
    assert.equal(e.events.some(x=>x.type==='permit.signed'),false,'rejected request must not produce a signature');
   }else if(item.config.mode==='unified'){
    assert.equal(e.ledger.reserved,'0','settled permit reservation');
   }
   results.push({name:item.name,passed:true,config:e.config,actualSpent:e.check.actualSpent,normalTransactionCounter:e.check.normalTransactionCounter,finalBalance:e.final.balance,overspend:e.check.overspend,checkerStatus:e.check.status,elapsedMs:Date.now()-started});
   console.log('PASS',item.name);
  }catch(error){
   results.push({name:item.name,passed:false,config:item.config,error:error.message,elapsedMs:Date.now()-started});
   throw error;
  }finally{await e.close();}
 }
}finally{
 await chain?.stop();
 await writeFile(artifactPath('v0153-parameter-results.json'),JSON.stringify({version:'V0.15.3',buildHash:build.sourceHash,time:new Date().toISOString(),status:results.length===cases.length&&results.every(r=>r.passed)?'passed':results.length===0?'blocked':'failed',plannedCases:cases.length,executedCases:results.length,realEVM:results.length>0,officialPermit2:results.length>0,results},null,2)+'\n');
}
