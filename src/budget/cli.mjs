import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {verify} from './checker.mjs';
const [command,file]=process.argv.slice(2);
if(!['verify','check','summarize'].includes(command)||!file){console.error('Usage: runtime\\node.exe src\\budget\\cli.mjs verify|check <experiment.json> or summarize <archive-directory>');process.exitCode=1;}
else{
 try{
  if(command==='summarize')console.log(JSON.stringify(await summarize(file),null,2));
  else{
   const result=verify(JSON.parse(await readFile(file,'utf8')));
   console.log(JSON.stringify({integrity:'passed',...result},null,2));
   if(command==='check'&&result.status!=='success')process.exitCode=2;
  }
 }
 catch(e){console.error(e.message);process.exitCode=1;}
}

async function summarize(directory){
 const groups=new Map(),invalid=[];
 const files=(await readdir(directory,{withFileTypes:true})).filter(entry=>entry.isFile()&&entry.name.endsWith('.json')&&entry.name!=='current.json');
 for(const {name} of files.sort((a,b)=>a.name.localeCompare(b.name))){
  try{
   const bundle=JSON.parse(await readFile(join(directory,name),'utf8'));
   const check=verify(bundle),evidence=bundle.files['evidence.json'],sample=evidence.config.sample;
   const kind=['natural','historical','control'].includes(sample?.kind)?sample.kind:'unspecified';
   if(!groups.has(kind))groups.set(kind,{runs:0,incomplete:0,withRejections:0,withoutCandidateId:0,candidates:new Map()});
   const group=groups.get(kind);
   group.runs++;
   if(check.evidenceStatus==='incomplete')group.incomplete++;
   if(evidence.blocked||evidence.events.some(event=>['budget.rejected','permission.rejected'].includes(event.type)))group.withRejections++;
   if(!sample?.candidateId){group.withoutCandidateId++;continue;}
   const candidate=JSON.stringify([sample.reference,sample.candidateId]);
   const screening=['eligible','ineligible'].includes(sample.screening)?sample.screening:'undetermined';
   const previous=group.candidates.get(candidate);
   group.candidates.set(candidate,previous&&previous!==screening?'undetermined':screening);
  }catch(error){invalid.push({file:name,error:error.message});}
 }
 return {groups:Object.fromEntries([...groups].map(([kind,{candidates,...counts}])=>{
  const screening={eligible:0,ineligible:0,undetermined:0};
  for(const result of candidates.values())screening[result]++;
  return [kind,{...counts,screenedCandidates:candidates.size,screening}];
 })),invalid};
}
