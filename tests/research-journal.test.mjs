import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, writeFile, rename} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {atomicJson} from '../src/research/journal.mjs';

async function target() {
  const folder = await mkdtemp(join(tmpdir(), 'web3-research-journal-test-'));
  const path = join(folder, 'budget-ledger.json');
  await writeFile(path, '{"settledBase":"10000"}\n');
  return {folder, path, previous: await readFile(path, 'utf8')};
}
const failure = code => Object.assign(new Error('injected rename failure: ' + code), {code});

test('atomic research ledger write retries only the same Windows rename and preserves old bytes until success', async () => {
  const {folder, path, previous} = await target(), attempts = [], waits = [];
  const codes = ['EPERM', 'EACCES', 'EBUSY'];
  await atomicJson(path, {settledBase: '80000'}, {
    platform: 'win32', wait: async ms => waits.push(ms),
    renameFile: async (from, to) => {
      attempts.push({from, to, bytes: await readFile(from, 'utf8')});
      assert.equal(await readFile(path, 'utf8'), previous);
      if (attempts.length <= codes.length) throw failure(codes[attempts.length - 1]);
      await rename(from, to);
    },
  });
  assert.equal(attempts.length, 4);
  assert.equal(new Set(attempts.map(x => x.from)).size, 1);
  assert.equal(new Set(attempts.map(x => x.bytes)).size, 1);
  assert.ok(attempts.every(x => x.to === path));
  assert.deepEqual(waits, [25, 50, 100]);
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {settledBase: '80000'});
  assert.deepEqual(await readdir(folder), ['budget-ledger.json']);
});

test('exhausted Windows rename retries fail closed without replacing the persisted ledger', async () => {
  const {folder, path, previous} = await target(), waits = [], attempts = [];
  const error = failure('EPERM');
  await assert.rejects(atomicJson(path, {settledBase: '80000'}, {
    platform: 'win32', wait: async ms => waits.push(ms),
    renameFile: async (from, to) => { attempts.push({from, to}); throw error; },
  }), got => got === error);
  assert.equal(attempts.length, 8);
  assert.deepEqual(waits, [25, 50, 100, 200, 250, 250, 250]);
  assert.equal(new Set(attempts.map(x => x.from)).size, 1);
  assert.equal(await readFile(path, 'utf8'), previous);
  assert.equal((await readdir(folder)).filter(x => x.endsWith('.tmp')).length, 1);
});

test('non-transient rename failure propagates immediately and preserves the previous ledger', async () => {
  const {path, previous} = await target(); let attempts = 0, waits = 0;
  const error = failure('EIO');
  await assert.rejects(atomicJson(path, {settledBase: '80000'}, {
    platform: 'win32', wait: async () => { waits++; },
    renameFile: async () => { attempts++; throw error; },
  }), got => got === error);
  assert.equal(attempts, 1); assert.equal(waits, 0);
  assert.equal(await readFile(path, 'utf8'), previous);
});

test('Windows-specific rename recovery does not mask an EPERM on other platforms', async () => {
  const {path, previous} = await target(); let attempts = 0, waits = 0;
  await assert.rejects(atomicJson(path, {settledBase: '80000'}, {
    platform: 'linux', wait: async () => { waits++; },
    renameFile: async () => { attempts++; throw failure('EPERM'); },
  }), {code: 'EPERM'});
  assert.equal(attempts, 1); assert.equal(waits, 0);
  assert.equal(await readFile(path, 'utf8'), previous);
});

test('failure to write the temporary bytes is never retried as a rename', async () => {
  const {folder} = await target(); let attempts = 0, waits = 0;
  await assert.rejects(atomicJson(join(folder, 'missing-directory', 'ledger.json'), {}, {
    platform: 'win32', wait: async () => { waits++; },
    renameFile: async () => { attempts++; },
  }), {code: 'ENOENT'});
  assert.equal(attempts, 0); assert.equal(waits, 0);
});
