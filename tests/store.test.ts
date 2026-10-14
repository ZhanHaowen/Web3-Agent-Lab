import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Recorder, Redactor, readRun, verifyRun, exportRun } from '../src/store.js';

test('recorder redacts secrets, preserves raw/visible outputs, validates and detects corruption', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'web3-record-'));
  const redactor = new Redactor(); redactor.add('my-private-api-secret');
  const r = new Recorder(dir, redactor);
  await r.start({ mode: 'scripted', apiKey: 'my-private-api-secret' });
  await Promise.all(Array.from({ length: 10 }, (_, i) => r.emit('tool.result', { raw: { value: i }, visible: { value: 99 }, text: 'echo my-private-api-secret', privateKey: 'nope' })));
  await r.seal();
  assert.equal((await verifyRun(dir, r.runId)).valid, true);
  const run = await readRun(dir, r.runId);
  assert.equal(run.events.length, 11);
  assert.deepEqual(run.events.map(e => e.seq), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.equal(run.events[1].payload.raw.value, 0);
  assert.equal(run.events[1].payload.visible.value, 99);
  const exported = JSON.stringify(await exportRun(dir, r.runId));
  assert.ok(!exported.includes('my-private-api-secret'));
  assert.ok(!exported.includes('nope'));
  await assert.rejects(r.emit('late', {}), /SEALED/);
  await writeFile(join(r.folder, 'blobs', run.events[1].payload_ref.sha256 + '.json'), '{}');
  assert.equal((await verifyRun(dir, r.runId)).valid, false);
  await assert.rejects(exportRun(dir, r.runId), /VALID_SEALED/);
});

test('unsealed recordings remain explicitly incomplete', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'web3-incomplete-'));
  const r = new Recorder(dir); await r.start({ mode: 'scripted' });
  assert.deepEqual((await verifyRun(dir, r.runId)).errors, ['UNSEALED_RECORDING']);
  await r.seal('incomplete');
  assert.equal((await readRun(dir, r.runId)).manifest.recording_status, 'incomplete');
});
