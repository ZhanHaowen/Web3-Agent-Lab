import {clone,sha,stringify} from './common.mjs';
import {bundleEvidence,checkBundle} from '../../public/budget-evidence.js';
export {checkEvidence} from '../../public/budget-evidence.js';

export function seal(evidence){
 const files={'evidence.json':clone(evidence)},manifest=Object.fromEntries(Object.entries(files).map(([p,v])=>[p,sha(stringify(v))]));
 return {format:'web3-agent-budget-experiment',version:1,files,manifest};
}
export function verify(bundle){
 return checkBundle(bundle,sha(stringify(bundleEvidence(bundle))));
}
