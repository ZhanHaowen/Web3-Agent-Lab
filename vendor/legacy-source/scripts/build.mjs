import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const root = process.cwd();
const sdkEntry = path.join(path.dirname(require.resolve('@coinbase/agentkit')), 'action-providers/actionProvider.js');
const source = [];
async function walk(dir) {
  for (const item of (await readdir(dir, { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
    const p=path.join(dir,item.name); if(item.isDirectory()) await walk(p);
    else source.push([path.relative(root,p).replaceAll('\\','/'), createHash('sha256').update(await readFile(p)).digest('hex')]);
  }
}
for(const dir of ['src','public','contracts','scripts']) await walk(dir);
for(const p of ['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','Start.command','Stop.command','start.cmd','stop.cmd']) source.push([p,createHash('sha256').update(await readFile(p)).digest('hex')]);
const pkg=JSON.parse(await readFile('package.json','utf8'));
await writeFile('build-info.json', JSON.stringify({ version:pkg.version, displayVersion:pkg.displayVersion, releaseRevision:pkg.releaseRevision, releaseLabel:pkg.releaseLabel, builtAt:new Date().toISOString(), node:process.version, sourceHash:createHash('sha256').update(JSON.stringify(source)).digest('hex'), files:Object.fromEntries(source), agentkitEntry:'@coinbase/agentkit@0.10.4/dist/action-providers/actionProvider.js' },null,2));
await mkdir('dist',{recursive:true});
const result = await build({
  entryPoints:['src/server.ts','src/cli.ts'], outdir:'dist', outExtension:{'.js':'.mjs'},
  bundle:true, platform:'node', target:'node22', format:'esm', sourcemap:true,
  banner:{js:"import {createRequire as __createRequire} from 'node:module'; const require=__createRequire(import.meta.url);"},
  plugins:[{name:'pinned-agentkit-action-provider',setup(b){b.onResolve({filter:/^@coinbase\/agentkit$/},()=>({path:sdkEntry}));}}],
  metafile:true, logLevel:'info'
});
await writeFile('dist/metafile.json',JSON.stringify(result.metafile,null,2));
