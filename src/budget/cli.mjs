import {readFile} from 'node:fs/promises';
import {verify} from './checker.mjs';
const [command,file]=process.argv.slice(2);
if(!['verify','check'].includes(command)||!file){console.error('Usage: runtime\\node.exe src\\budget\\cli.mjs verify|check <experiment.json>');process.exitCode=1;}
else{
 try{const result=verify(JSON.parse(await readFile(file,'utf8')));console.log(JSON.stringify({integrity:'passed',...result},null,2));if(command==='check'&&result.status!=='success')process.exitCode=2;}
 catch(e){console.error(e.message);process.exitCode=1;}
}
