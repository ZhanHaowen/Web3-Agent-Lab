import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
const meta=JSON.parse(await readFile('dist/metafile.json','utf8'));
const packages=new Map();
for(const input of Object.keys(meta.inputs).filter(p=>p.includes('node_modules'))){
 let dir=path.dirname(path.resolve(input));
 while(dir!==path.dirname(dir)){
  try{const pkg=JSON.parse(await readFile(path.join(dir,'package.json'),'utf8'));if(pkg.name&&pkg.version){packages.set(pkg.name+'@'+pkg.version,{...pkg,dir});break;}}catch{}
  dir=path.dirname(dir);
 }
}
await mkdir('licenses',{recursive:true});
let text='# Third party notices\n\nThis distribution contains bundled JavaScript, official Node.js and Foundry Anvil runtimes. Individual components retain their original licenses.\n\n| Package | Version | Declared license |\n|---|---|---|\n';
for(const pkg of [...packages.values()].sort((a,b)=>a.name.localeCompare(b.name))){
 text+=`| ${pkg.name} | ${pkg.version} | ${typeof pkg.license==='string'?pkg.license:JSON.stringify(pkg.license??'see package')} |\n`;
 const names=(await readdir(pkg.dir)).filter(n=>/^(license|licence|copying|notice)(\.|$)/i.test(n));
 for(const name of names){const p=path.join(pkg.dir,name);if((await stat(p)).isFile())await writeFile(path.join('licenses',`${pkg.name.replaceAll('/','_')}@${pkg.version}-${name}`),await readFile(p));}
}
text+='\nNode.js 24.19.0: licenses/NODE-LICENSE.txt. Anvil 1.7.1: licenses/FOUNDRY-LICENSE-APACHE and licenses/FOUNDRY-LICENSE-MIT. Download provenance and SHA checks are in runtime-provenance.json.\n';
// Keep this redistribution appendix when regenerating the dependency inventory.
// The corresponding archives and verified provenance are maintained in licenses/sources/.
if (packages.has('rpc-websockets@9.3.9')) {
 const files = ['licenses/LGPL-3.0.txt','licenses/GPL-3.0.txt','licenses/sources/rpc-websockets-9.3.9-npm.tgz','licenses/sources/rpc-websockets-9.3.9-source.tar.gz','licenses/sources/rpc-websockets-9.3.9-provenance.json','docs/third-party-rebuild.md'];
 for (const file of files) await stat(file); // Fail rather than generate a notice for absent materials.
 text+='\n## Bundled LGPL component and corresponding sources\n\nThe server bundle includes unmodified `rpc-websockets` 9.3.9, Copyright (c) Elpheria j.d.o.o., under LGPL-3.0-only. Its original notice is retained in `licenses/rpc-websockets@9.3.9-LICENSE`; full LGPLv3 and GPLv3 texts are supplied in `licenses/LGPL-3.0.txt` and `licenses/GPL-3.0.txt`. The platform\'s MIT license applies to original platform code and does not replace these terms.\n\nThe exact npm archive, upstream source at npm\'s recorded `gitHead`, and verified download hashes are supplied in `licenses/sources/`. See [third-party sources and rebuilding](docs/third-party-rebuild.md) for modifying the library and rebuilding the combined application. Retain these source materials and notices when redistributing the bundled software.\n';
}
await writeFile('THIRD_PARTY_NOTICES.md',text);console.log('Licenses collected for '+packages.size+' bundled packages');
