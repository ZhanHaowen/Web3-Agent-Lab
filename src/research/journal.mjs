import {mkdir, readdir, readFile, writeFile, appendFile, rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {finalizeModelCapture, modelRecordRedactor} from '../model/capture.mjs';
import {sha256, stringify} from './manifest.mjs';
import {writeResearchProvenance} from './provenance.mjs';

export async function atomicJson(path, value) {
  const tmp = path + '.' + randomUUID() + '.tmp'; await writeFile(tmp, stringify(value) + '\n', {flag: 'wx'}); await rename(tmp, path);
}
export class ResearchJournal {
  constructor({outDir, runId, model = {}, emit}) {
    this.outDir = outDir; this.runId = runId; this.externalEmit = emit; this.redactor = modelRecordRedactor(model); this.events = []; this.queue = Promise.resolve();
  }
  async init() {
    await mkdir(this.outDir, {recursive: true});
    if ((await readdir(this.outDir)).length) throw Error('RESEARCH_OUTPUT_NOT_EMPTY');
    for (const dir of ['raw/blobs','private']) await mkdir(join(this.outDir, dir), {recursive: true});
    await writeFile(join(this.outDir, 'raw/events.jsonl'), '', {flag: 'wx'});
  }
  clean(value) { return finalizeModelCapture(value, v => this.redactor.clean(v)); }
  async record(type, payload, links = {}, cause) {
    const operation = this.queue.then(async () => {
      const clean = this.clean(payload), text = stringify(clean), sha = sha256(text), path = `raw/blobs/${sha}.json`;
      await writeFile(join(this.outDir, path), text);
      const event = {schema: 'web3-research-event-v1', runId: this.runId, eventId: randomUUID(), seq: this.events.length + 1, timestamp: new Date().toISOString(), type,
        links: this.redactor.clean(links), causalEventIds: cause?.eventId ? [cause.eventId] : [], payloadRef: {path, sha256: sha, bytes: Buffer.byteLength(text)}};
      await appendFile(join(this.outDir, 'raw/events.jsonl'), JSON.stringify(event) + '\n'); this.events.push(event);
      if (this.externalEmit) await this.externalEmit(event, clean);
      return event;
    });
    this.queue = operation;
    return operation;
  }
  async file(name, value) { await atomicJson(join(this.outDir, name), this.clean(value)); }
  async seal() {
    await this.queue;
    await writeResearchProvenance(this.outDir);
    const files = {};
    async function walk(base, relative = '') {
      for (const entry of await readdir(base, {withFileTypes: true})) {
        const path = relative ? `${relative}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await walk(join(base, entry.name), path);
        else if (entry.isFile() && path !== 'integrity.json' && !path.endsWith('.tmp')) {
          const bytes = await readFile(join(base, entry.name)); files[path] = {sha256: sha256(bytes), bytes: bytes.length};
        }
      }
    }
    await walk(this.outDir);
    const integrity = {schema: 'web3-research-integrity-v1', runId: this.runId, files, eventCount: this.events.length};
    await atomicJson(join(this.outDir, 'integrity.json'), integrity); return integrity;
  }
}
