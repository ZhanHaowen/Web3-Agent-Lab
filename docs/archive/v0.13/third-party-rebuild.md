# Third-party sources and rebuilding

> V0.15.1 preview scope: the current root build compiles the peer/service contracts and creates a compatibility bridge over the pinned vendor bundle. It is not a full TypeScript runtime rebuild. `pnpm typecheck` checks only the strict control interface and its type tests from `tsconfig.control.json`; it does not type-check the ESM runtime. The full clean-source rebuild acceptance remains incomplete. The historical TypeScript source snapshot is under `vendor/legacy-source/`; its 42 tracked baseline files, including 12 original TypeScript source files, match the pinned build manifest. See the current README and `V0.14修订范围与验收说明.md` for the release boundary.

For the current contract compilation entry, install pinned `solc@0.8.30` or set `SOLC_JS_PATH` to a local compiler entry file. `scripts/compile-peer.mjs` performs no downloads and does not rely on a private tools directory.

The platform's original source code is MIT licensed. Third-party libraries and runtimes retain their own licenses; the root MIT license does not replace them. `THIRD_PARTY_NOTICES.md` identifies bundled packages. The Node.js and Foundry license texts are in `licenses/`; runtime download URLs and hashes are included in the portable packages' `runtime-provenance.json`.

## rpc-websockets 9.3.9

The server bundle includes unmodified `rpc-websockets` 9.3.9 code under LGPL-3.0-only. Its upstream copyright notice remains in `licenses/rpc-websockets@9.3.9-LICENSE`. Full license texts are supplied as `licenses/LGPL-3.0.txt` and `licenses/GPL-3.0.txt`.

The following files accompany both source and portable releases:

| File in `licenses/sources/` | Purpose |
|---|---|
| `rpc-websockets-9.3.9-npm.tgz` | Exact npm distribution used by the dependency lockfile; its npm SHA-512 integrity value was verified. |
| `rpc-websockets-9.3.9-source.tar.gz` | Upstream TypeScript source, build configuration, package lockfile, license and tests at npm's `gitHead`, `af8980776b55c2320b790556f775266fd5afc3ce`. |
| `rpc-websockets-9.3.9-provenance.json` | Official download locations, hashes and verification results. All five TypeScript sources embedded in the npm Node CommonJS source map match this source archive byte for byte. |

Upstream: <https://github.com/elpheria/rpc-websockets>. These archives preserve upstream content. They do not contain project credentials or user experiment data. The project permits modification and reverse engineering of its combined work for debugging modifications to this library; no product activation or signature check prevents running a rebuilt local server.

## Historical original-source build route

The following commands describe the original source-release workflow, now preserved in `vendor/legacy-source/`. They do not certify the current root compatibility build. Use a separate copy of that source snapshot, Node.js 24.19.0 and pnpm 11.19.0. In its source root:

```sh
pnpm install --frozen-lockfile
node scripts/setup-runtime.mjs
pnpm build
pnpm typecheck
pnpm test
pnpm start
```

`scripts/build.mjs` bundles the installed dependency code into `dist/server.mjs` and `dist/cli.mjs`. `dist/metafile.json` identifies the actual library inputs. The build also updates `build-info.json`; keep that file and the rebuilt application together. Source development uses the installed Node runtime; the portable package's launcher requires its bundled runtime directory.

## Modify and rebuild rpc-websockets

Work in a separate copy of the source release. Extract the supplied source archive into a temporary work directory, retaining its full directory structure. In its extracted `rpc-websockets-af8980776b55c2320b790556f775266fd5afc3ce` directory, edit `src/` as desired, then install the upstream locked build dependencies and compile:

```sh
npm ci
npm run typecheck
node -e "require('node:fs').mkdirSync('dist',{recursive:true})"
npx eslint --fix "src/**/*.ts"
npx tsup
```

The last four commands perform the upstream build steps with a cross-platform directory creation command. The upstream test commands and their requirements remain in its own `package.json`. Install/build commands require network access unless the relevant dependencies are already cached. A modified build is not expected to have identical bytes or hashes to the distributed binary; the upstream build has not been independently certified reproducible here.

In the **platform source root**, create a pnpm dependency patch:

```sh
pnpm patch rpc-websockets@9.3.9
```

pnpm prints an editable temporary package directory. Copy the rebuilt upstream `dist/` contents into that directory's `dist/`, retaining the other package files and its original license notice. Do not edit the shared pnpm store directly. Commit the local dependency patch with the printed directory path:

```sh
pnpm patch-commit <editable-package-directory>
pnpm build
pnpm typecheck
pnpm test
pnpm start
```

Retain the generated patch and updated pnpm settings/lockfile with the modified source. The second build incorporates the modified library into the application's server bundle. Review `dist/metafile.json` to confirm the selected input. This provides a source-level replacement route; copying a library beside the already bundled `dist/server.mjs` alone does not replace its embedded code.

Run this replacement in a fresh local experiment directory. Existing experiment records contain the source hash from their original build and should not be relabelled as records of the modified build. When distributing a modified library or combined application, retain the relevant source, notices, license texts and modification/rebuild information.

## Scope of these materials

These files document the supplied components, their provenance and a rebuilding route. They are not a certification of every downstream redistribution arrangement. Check the actual license texts and any additional components introduced by later modifications.
