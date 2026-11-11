import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dir=join(root,'packages/payment-adapters'),sha=x=>createHash('sha256').update(x).digest('hex');
const output={schema:'bundled-payment-runtime-v1',purpose:'Offline runtime deployment; source and lockfile remain alongside bundles.',lockSha256:sha(await readFile(join(dir,'pnpm-lock.yaml'))),outputs:{}};
for(const [entry,name]of [['index.mjs','runtime.mjs'],['mpp.mjs','mpp-runtime.mjs']]){
 const result=await build({entryPoints:[join(dir,entry)],outfile:join(dir,name),platform:'node',format:'esm',target:'node24',bundle:true,metafile:true,legalComments:'linked',external:['@modelcontextprotocol/sdk/*'],banner:{js:'import {createRequire as __labRequire} from "node:module"; const require=__labRequire(import.meta.url);'}});
 output.outputs[name]={sha256:sha(await readFile(join(dir,name))),inputs:Object.keys(result.metafile.inputs).map(p=>p.replaceAll('\\','/')).sort()};
}
output.excludedOptionalSurface='MPP MCP helpers are not used by the HTTP EVM profile; their optional @modelcontextprotocol/sdk import is external and unavailable in the portable package.';
await writeFile(join(dir,'runtime-build.json'),JSON.stringify(output,null,2)+'\n');console.log('Bundled pinned x402 and MPP HTTP runtime dependencies.');
