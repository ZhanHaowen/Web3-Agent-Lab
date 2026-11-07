#!/usr/bin/env node
// Explicit setup only. Starting the platform never downloads a model or a runtime.
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ASSET, LocalModelService, sha256 } from '../src/local-model/service.mjs';

const help = `Web3 Agent Lab V0.16.0: optional local Qwen3 4B setup

No operation is performed without explicit arguments. Model weights are about
4.28 GB and are not included in Git or platform packages. Internet is needed only
for an explicit download. A pre-downloaded model and llama-server can be imported
without network access. Keep the runtime's DLL / dylib / .so dependencies together.

Import prepared assets (Windows example):
  node scripts/setup-local-model.mjs --import-model "C:/models/qwen3-4b-instruct-2507-q8_0.gguf" --server "C:/llama-b12019/llama-server.exe" --data-dir "C:/Web3AgentData"

Import prepared assets (macOS example; runtime must match Intel / Apple Silicon):
  node scripts/setup-local-model.mjs --import-model "$HOME/models/qwen3-4b-instruct-2507-q8_0.gguf" --server "$HOME/llama-b12019/llama-server" --data-dir "$HOME/Web3AgentData"

Download the pinned model; interrupted transfers resume from <file>.partial:
  node scripts/setup-local-model.mjs --download-model --model-dir "./models" --server "/absolute/path/to/llama-server" --data-dir "./data"

Optional: --server-sha256 HEX --context-size 16384 --max-output-tokens 768
          --threads 6 --gpu-layers auto --port 8495
          --template /absolute/template.jinja --template-sha256 HEX

The default model SHA-256 is fixed in src/local-model/assets.json. If no runtime
SHA is supplied, this explicit import calculates and pins your local executable
and nearby runtime libraries. That records identity; it is not an upstream signature.
Use the official llama.cpp release ${DEFAULT_ASSET.runtime.testedRelease}:
${DEFAULT_ASSET.runtime.releaseUrl}
Tested: Windows x64 Vulkan. macOS startup is supported by design but requires its
own release package and platform regression; a Windows executable cannot run there.
After setup, select Local Qwen3 4B in the GUI and start the runtime. No API Key,
cloud fallback, automatic dependency installation or implicit download is used.
`;

/** Downloads one pinned asset with byte-range resume, then verifies all bytes. */
export async function downloadModel(destination, { asset = DEFAULT_ASSET, fetchImpl = fetch, progress = console.log } = {}) {
  const target = path.resolve(destination), partial = target + '.partial';
  await mkdir(path.dirname(target), { recursive: true });
  const existing = await stat(target).catch(() => null);
  if (existing) {
    if (existing.size === asset.bytes && await sha256(target) === asset.sha256) return target;
    throw new Error('EXISTING_MODEL_SHA256_MISMATCH: refusing to overwrite; choose another destination');
  }
  let offset = (await stat(partial).catch(() => null))?.size ?? 0;
  if (offset > asset.bytes) throw new Error('PARTIAL_LARGER_THAN_EXPECTED: choose a fresh destination');
  if (offset < asset.bytes) {
    progress(`Downloading ${asset.id}; resume offset ${offset}/${asset.bytes} bytes`);
    const response = await fetchImpl(asset.downloadUrl, { headers: offset ? { Range: `bytes=${offset}-` } : {}, signal: AbortSignal.timeout(60 * 60 * 1000) });
    if (!response.ok || !response.body) throw new Error(`MODEL_DOWNLOAD_HTTP_${response.status}`);
    if (offset && response.status === 206) {
      const contentRange = response.headers.get('content-range');
      if (!contentRange?.startsWith(`bytes ${offset}-`) || !contentRange.endsWith(`/${asset.bytes}`)) throw new Error('MODEL_DOWNLOAD_RANGE_MISMATCH');
    } else if (response.status === 200) {
      offset = 0; // Server ignored Range: truncate only our own .partial file.
    } else if (response.status !== 206 || offset !== 0) throw new Error('MODEL_DOWNLOAD_UNEXPECTED_RANGE_STATUS');
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial, { flags: offset ? 'a' : 'w' }));
  }
  const size = (await stat(partial)).size;
  if (size !== asset.bytes) throw new Error(`MODEL_DOWNLOAD_SIZE_MISMATCH:${size}`);
  progress('Verifying complete model SHA-256 ...');
  if (await sha256(partial) !== asset.sha256) throw new Error('MODEL_DOWNLOAD_SHA256_MISMATCH: partial preserved; do not use it');
  await rename(partial, target);
  await writeFile(target + '.asset.json', JSON.stringify({ ...asset, verifiedAt: new Date().toISOString(), actualSha256: asset.sha256 }, null, 2) + '\n');
  return target;
}

function argumentsFrom(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (['--help', '-h', '--download-model'].includes(flag)) parsed[flag] = true;
    else if (/^--(?:import-model|model-dir|server|server-sha256|data-dir|context-size|max-output-tokens|threads|gpu-layers|port|template|template-sha256)$/.test(flag)) {
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`MISSING_ARGUMENT:${flag}`);
      parsed[flag] = argv[++index];
    } else throw new Error(`UNKNOWN_ARGUMENT:${flag}`);
  }
  return parsed;
}
async function runtimeLibraries(serverPath) {
  const folder = path.dirname(serverPath), names = (await readdir(folder)).sort();
  const result = [];
  for (const name of names) {
    if (!/\.(?:dll|dylib|so(?:\.\d+)*)$/i.test(name)) continue;
    const file = path.join(folder, name);
    if ((await stat(file)).isFile()) result.push({ path: file, sha256: await sha256(file) });
  }
  return result;
}
export async function main(argv = process.argv.slice(2)) {
  const args = argumentsFrom(argv);
  if (!argv.length || args['--help'] || args['-h']) { console.log(help); return; }
  if (!args['--server']) throw new Error('--server is required; install the correct official runtime before setup');
  if (!!args['--import-model'] === !!args['--download-model']) throw new Error('Choose exactly one: --import-model or --download-model');
  const serverPath = path.resolve(args['--server']);
  if (!(await stat(serverPath)).isFile()) throw new Error('SERVER_NOT_A_FILE');
  const modelPath = args['--import-model'] ? path.resolve(args['--import-model']) : await downloadModel(path.resolve(args['--model-dir'] ?? './models', DEFAULT_ASSET.file));
  if ((await stat(modelPath)).size !== DEFAULT_ASSET.bytes || await sha256(modelPath) !== DEFAULT_ASSET.sha256) throw new Error('IMPORTED_MODEL_SHA256_MISMATCH');
  const service = new LocalModelService({ dataDir: path.resolve(args['--data-dir'] ?? './data') });
  const config = {
    modelPath, serverPath, serverSha256: args['--server-sha256'], pinRuntime: !args['--server-sha256'],
    contextSize: args['--context-size'], maxOutputTokens: args['--max-output-tokens'], threads: args['--threads'],
    gpuLayers: args['--gpu-layers'], port: args['--port'],
    templatePath: args['--template'] ? path.resolve(args['--template']) : undefined, templateSha256: args['--template-sha256'],
    runtimeFiles: await runtimeLibraries(serverPath), runtimeVersion: DEFAULT_ASSET.runtime.testedRelease + ' (operator selected; hash recorded)',
  };
  const status = await service.configure(config);
  console.log(JSON.stringify({ configured: status.configured, configFile: service.configFile,
    model: status.model, modelSha256: status.config.modelSha256, runtimeSha256: status.config.serverSha256,
    pinnedDependencies: status.config.runtimeFiles.length, baseURL: status.baseURL, runtimeStarted: false }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(cause => { console.error(cause.message); process.exitCode = 1; });
}
