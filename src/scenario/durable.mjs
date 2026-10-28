import {writeFile,rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
// Windows scanners/readers may briefly hold the destination. Never unlink the
// committed journal or continue a side effect before rename succeeds.
export async function atomicWrite(path,text,{renameFile=rename,attempts=8}={}){
 const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,text,{mode:0o600});
 for(let i=0;;i++){
  try{await renameFile(temp,path);return;}
  catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code)||i>=attempts-1)throw error;await new Promise(r=>setTimeout(r,25*(i+1)));}
 }
}
