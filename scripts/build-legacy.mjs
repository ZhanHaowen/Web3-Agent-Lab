// V0.16 rebuilds the retained TypeScript implementation. The historical V0.13
// bundle stays immutable; the bridge consumes this fresh, local build instead.
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const sdkEntry=join(dirname(require.resolve('@coinbase/agentkit')),'action-providers/actionProvider.js');
await mkdir(join(root,'build'),{recursive:true});
await build({absWorkingDir:root,entryPoints:{'legacy-server':'vendor/legacy-source/src/server.ts','legacy-cli':'vendor/legacy-source/src/cli.ts'},
 outdir:join(root,'build'),outExtension:{'.js':'.mjs'},bundle:true,platform:'node',target:'node24',format:'esm',sourcemap:false,
 banner:{js:"import {createRequire as __createRequire} from 'node:module'; const require=__createRequire(import.meta.url);"},
 plugins:[{name:'pinned-agentkit-action-provider',setup(b){b.onResolve({filter:/^@coinbase\/agentkit$/},()=>({path:sdkEntry}));}}],logLevel:'info'});
