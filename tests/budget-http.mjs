import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { artifactPath } from './helpers/artifacts.mjs';
import { authorize, finish, redeem, startBudgetModelFixture, transfer } from './helpers/budget-model.mjs';
import { ROOT } from '../src/budget/common.mjs';
import { freePort, sleep } from '../src/budget/engine.mjs';
import { verify } from '../src/budget/checker.mjs';

const fixture = await startBudgetModelFixture();
const port = process.env.LAB_TEST_PORT ? Number(process.env.LAB_TEST_PORT) : await freePort();
const origin = 'http://127.0.0.1:' + port;
const apiKey = 'budget-test-credential-canary';
const data = process.env.LAB_TEST_DATA_DIR ?? join(ROOT, 'data-budget-http');
const launch = () => spawn(process.execPath, [join(ROOT, 'src/budget/server.mjs')], {
  cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, BUDGET_PORT: String(port), BUDGET_DATA_DIR: data },
});
let child = launch();
let log = '', token = '';
child.stdout.on('data', chunk => log += chunk);
child.stderr.on('data', chunk => log += chunk);
const results = [];

async function call(path, body, headers = {}) {
  const response = await fetch(origin + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Budget-Token': token, ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const value = (response.headers.get('content-type') ?? '').includes('json') ? await response.json() : await response.text();
  return { status: response.status, value };
}

async function ok(path, body) {
  const result = await call(path, body);
  assert.equal(result.status, 200, JSON.stringify(result.value));
  return result.value;
}

function pass(name) {
  results.push({ name, passed: true });
  console.log('PASS', name);
}

try {
  for (let i = 0; i < 100 && !token; i++) {
    try { token = (await call('/api/health')).value.csrfToken; } catch {}
    if (!token) await sleep(100);
  }
  assert.ok(token, log);
  assert.equal((await call('/api/run', {}, { 'X-Budget-Token': '' })).status, 403);
  assert.equal((await call('/api/run', {}, { Origin: 'http://example.com' })).status, 403);
  assert.equal((await call('/api/run', { config: fixture.config({ mode: 'split' }) })).status, 400);
  assert.equal((await call('/api/run', { config: fixture.config({ unknown: 1 }) })).status, 400);
  pass('HTTP keeps its origin and token gate and rejects removed configuration');

  fixture.plan([{ ...authorize('60'), delay: 300 }, transfer('41'), transfer('40'), redeem, finish]);
  let state = await ok('/api/start', { config: fixture.config(), apiKey });
  assert.equal(state.stage, 'decision');
  assert.equal(fixture.requests.length, 0, '/start does not ask the model to trade');
  const executionId = state.id;
  assert.equal((await call('/api/step', { executionId: 'stale' })).status, 400);

  const responses = await Promise.all([call('/api/step', { executionId }), call('/api/step', { executionId })]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  state = await ok('/api/state');
  assert.equal(state.ledger.reserved, '60000000');
  assert.equal(fixture.requests.length, 1);
  pass('concurrent clicks request only one model decision and reserve once');

  state = await ok('/api/step', { executionId });
  assert.equal(state.blocked.reason, 'TASK_BUDGET_EXCEEDED');
  assert.equal(state.ledger.spent, '0');
  for (let step = 0; step < 3; step++) state = await ok('/api/step', { executionId });
  assert.equal(state.stage, 'completed');
  assert.equal(state.check.actualSpent, '100000000');
  assert.equal(state.check.normalTransactionCounter, '40000000');
  assert.equal(state.check.status, 'success');
  assert.equal(state.ledger.reserved, '0');
  assert.equal(fixture.requests.length, 5);
  assert.ok(fixture.requests.every(request => request.authorization === 'Bearer ' + apiKey));
  assert.deepEqual(fixture.requests[0].body.tools.map(tool => tool.function.name).sort(),
    ['authorize_permit2', 'finish_task', 'redeem_permit2', 'transfer_tokens']);
  assert.ok(fixture.requests[2].body.messages.some(message =>
    message.role === 'tool' && message.content.includes('TASK_BUDGET_EXCEEDED')));
  pass('API backend sees the budget rejection and completes a valid reordered sequence');

  const bundle = await ok('/api/export');
  assert.equal(bundle.format, 'web3-agent-budget-experiment');
  assert.ok(!JSON.stringify(bundle).includes('"signature":'));
  assert.ok(!JSON.stringify(bundle).includes(apiKey));
  assert.ok(!JSON.stringify(state).includes(apiKey));
  assert.ok(bundle.files['evidence.json'].events.some(event => event.type === 'model.request'));
  assert.ok(bundle.files['evidence.json'].events.some(event => event.type === 'model.response'));
  pass('evidence includes model exchanges and excludes credentials and reusable signatures');

  const sample = {kind:'control',screening:'eligible',candidateId:'archive-test',reference:'HTTP fixture',configurationSource:'fixture'};
  fixture.plan([transfer('2'), transfer('3')]);
  state = await ok('/api/run', { config: fixture.config({ maxSteps: 2,sample }) });
  assert.equal(state.stage, 'completed');
  assert.equal(state.agentOutcome, 'step_limit');
  assert.equal(state.check.actualSpent, '5000000');
  assert.equal(fixture.requests.length, 7);
  assert.equal((await call('/api/step', { executionId })).status, 400);
  pass('automatic run respects maxSteps and stale IDs cannot advance it');

  fixture.plan([{ message: { role: 'assistant', content: 'I transferred tokens without calling a tool.' } }]);
  await ok('/api/run', { config: fixture.config() });
  state = await ok('/api/state');
  assert.equal(state.stage, 'completed');
  assert.equal(state.agentOutcome, 'model_error');
  assert.equal(state.ledger.spent, '0');
  assert.equal(state.ledger.reserved, '0');
  assert.ok(state.error);
  assert.equal(fixture.requests.length, 8);
  pass('model prose without a tool never initiates a payment');

  fixture.plan([transfer('17')]);
  state = await ok('/api/start',{config:fixture.config({sample,taskGoal:{direct:'17',permit2:'0'}})});
  const interruptedId = state.id;
  await ok('/api/step',{executionId:interruptedId});
  assert.equal((await call('/api/shutdown',{})).status,200);
  if(child.exitCode===null)await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(5000)]);
  assert.equal(child.exitCode,0);
  child=launch();
  token='';
  for(let i=0;i<100&&!token;i++){
    try{token=(await call('/api/health')).value.csrfToken;}catch{}
    if(!token)await sleep(100);
  }
  assert.ok(token);
  assert.equal((await ok('/api/state')).stage,'idle');
  const interrupted=await ok('/api/export?executionId='+interruptedId);
  assert.equal(interrupted.files['evidence.json'].archive.reason,'PLATFORM_STOPPING');
  const partial=verify(interrupted);
  assert.equal(partial.budgetStatus,'undetermined');
  assert.equal(partial.task.status,'undetermined');
  assert.equal(partial.observedSpent,'17000000');
  assert.deepEqual(partial.confirmedSpending.map(item=>item.cumulative),['17000000']);
  const rejected=await ok('/api/export?executionId='+executionId);
  assert.equal(verify(rejected).outcome,'budget_blocked');
  const summary=spawnSync(process.execPath,[join(ROOT,'src/budget/cli.mjs'),'summarize',data],{encoding:'utf8',windowsHide:true});
  assert.equal(summary.status,0,summary.stderr);
  const control=JSON.parse(summary.stdout).groups.control;
  assert.equal(control.runs,2);
  assert.equal(control.incomplete,1);
  assert.equal(control.screenedCandidates,1);
  assert.equal(control.screening.eligible,1);
  pass('archives survive restart, preserve incomplete receipts and deduplicate screened candidates');
} catch (error) {
  results.push({ name: 'HTTP suite', passed: false, error: error.message });
  console.error(error.stack, log.slice(-2000));
  process.exitCode = 1;
} finally {
  try { await call('/api/shutdown', {}); } catch {}
  if (child.exitCode === null) await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(5000)]);
  if (child.exitCode === null) child.kill();
  await fixture.close();
  const build = JSON.parse(await readFile(join(ROOT, 'build-info.json'), 'utf8'));
  await writeFile(artifactPath('v0153-http-results.json'), JSON.stringify({
    version: build.displayVersion, buildHash: build.sourceHash, time: new Date().toISOString(), results,
  }, null, 2));
}

