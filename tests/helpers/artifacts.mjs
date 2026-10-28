import {mkdirSync} from 'node:fs';
import {dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPOSITORY_ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const ARTIFACT_ROOT=resolve(REPOSITORY_ROOT,process.env.LAB_TEST_ARTIFACT_DIR||'artifacts/test-results');
function within(path,parent){
 const rel=relative(parent,path);
 return rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel));
}
// Test execution must never replace the committed release evidence or fixtures.
if(relative(REPOSITORY_ROOT,ARTIFACT_ROOT)===''||['docs','examples','.git'].some(dir=>within(ARTIFACT_ROOT,resolve(REPOSITORY_ROOT,dir)))){
 throw Error('TEST_ARTIFACT_DIRECTORY_RESERVED');
}
export function artifactDirectory(...parts){
 const path=resolve(ARTIFACT_ROOT,...parts);
 if(!within(path,ARTIFACT_ROOT))throw Error('TEST_ARTIFACT_PATH_ESCAPE');
 mkdirSync(path,{recursive:true});return path;
}
export function artifactPath(...parts){
 const path=resolve(ARTIFACT_ROOT,...parts);
 if(path===ARTIFACT_ROOT||!within(path,ARTIFACT_ROOT))throw Error('TEST_ARTIFACT_PATH_ESCAPE');
 mkdirSync(dirname(path),{recursive:true});return path;
}
