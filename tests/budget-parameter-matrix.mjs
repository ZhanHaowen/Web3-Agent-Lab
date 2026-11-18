import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { artifactPath } from './helpers/artifacts.mjs';
import { authorize, finish, makeDecisionFixture, redeem, startBudgetModelFixture, transfer } from './helpers/budget-model.mjs';
import { createBudgetDecision } from '../src/budget/agent.mjs';
import { verify } from '../src/budget/checker.mjs';
import { LabChain, BudgetExperiment } from '../src/budget/engine.mjs';
import { ROOT, human, units } from '../src/budget/common.mjs';
import { inferTaskGoal } from '../src/budget/policy.mjs';

process.env.LAB_DATA_DIR = process.env.LAB_TEST_DATA_DIR ?? join(ROOT, 'data-budget-matrix/compatibility');
const results = [];
const scenarios = [
  { name: 'arbitrary integer amounts share the budget', initial: '1000', budget: '300',
    actions: [transfer('175'), authorize('180'), finish], actual: '175', direct: '175', rejected: true },
  { name: 'same payments fit a larger task budget', initial: '1000', budget: '400',
    actions: [transfer('175'), authorize('180'), redeem, finish], actual: '355', direct: '175' },
  { name: 'higher wallet balance does not change the task budget', initial: '5000', budget: '300',
    actions: [transfer('175'), authorize('180'), finish], actual: '175', direct: '175', rejected: true },
  { name: 'fractional amount above remainder is rejected', initial: '2', budget: '0.75',
    actions: [transfer('0.4'), authorize('0.5'), finish], actual: '0.4', direct: '0.4', rejected: true },
  { name: 'six-decimal exact boundary is accepted', initial: '0.00002', budget: '0.000005',
    actions: [transfer('0.000003'), authorize('0.000002'), redeem, finish], actual: '0.000005', direct: '0.000003' },
  { name: 'one minimal unit above the boundary is rejected', initial: '0.00002', budget: '0.000005',
    actions: [transfer('0.000003'), authorize('0.000003'), finish], actual: '0.000003', direct: '0.000003', rejected: true },
  { name: 'multiple direct transfers aggregate', initial: '1000', budget: '300',
    actions: [transfer('175'), transfer('180'), finish], actual: '175', direct: '175', rejected: true },
  { name: 'permit-only valid sequence', initial: '10', budget: '3',
    actions: [authorize('3'), redeem, finish], actual: '3', direct: '0' },
  { name: 'first payment above budget causes no token spend', initial: '10', budget: '3',
    actions: [transfer('3.1'), finish], actual: '0', direct: '0', rejected: true },
];

const initial = '200';
const budget = '100';
const wallets = ['local-eoa', 'smart-account'];
const toBase = amount => String(units(amount, true));

function payment(path, amount, shouldSettle = true) {
  if (path === 'T') return [transfer(amount)];
  return shouldSettle ? [authorize(amount), redeem] : [authorize(amount)];
}

function goalFor(order, amounts) {
  const totals = { T: 0n, S: 0n };
  for (const [index, path] of [...order].entries()) totals[path] += units(amounts[index]);
  return { direct: human(totals.T), permit2: human(totals.S) };
}

function pathScenarios() {
  return wallets.flatMap(backend => ['TT', 'SS', 'TS', 'ST'].flatMap(order =>
    ['exact-boundary', 'one-unit-over'].map(boundary => {
      const rejects = boundary === 'one-unit-over';
      const amounts = ['80', rejects ? '20.000001' : '20'];
      const paths = rejects ? order[0] : order;
      const settled = goalFor(paths, amounts);
      return {
        name: `${backend} ${order} ${boundary}`,
        id: `${backend}-${order}-${boundary}`,
        family: 'path-order',
        backend, order, amounts, boundary, paths,
        actions: [...payment(order[0], amounts[0]), ...payment(order[1], amounts[1], !rejects), finish],
        input: { initial, budget, wallet: { backend }, task: '执行本地预算边界对照。',
          taskGoal: { ...goalFor(order, amounts), mode: 'cumulative', confirmed: true } },
        actual: rejects ? '80' : budget,
        direct: settled.direct,
        permit2: settled.permit2,
        rejected: rejects,
      };
    })));
}

function pairedScenarios(model) {
  const task = '直接支付 50 BUD，再申请 50 BUD 的 Permit2 许可并兑现。';
  const explicit = { direct: '50', permit2: '50' };
  const prefill = inferTaskGoal(task);
  assert.deepEqual(prefill, explicit);
  const sources = [['manual', explicit], ['confirmed-prefill', prefill]];
  return wallets.flatMap(backend => sources.flatMap(([configSource, goal]) =>
    ['script', 'api-fixture'].map(executor => ({
      name: `${backend} 50+50 ${configSource} ${executor}`,
      id: `${backend}-50-50-${configSource}-${executor}`,
      family: 'config-source-and-executor',
      backend, configSource, executor,
      order: 'TS', paths: 'TS', amounts: ['50', '50'],
      actions: [...payment('T', '50'), ...payment('S', '50'), finish],
      input: { initial, budget, wallet: { backend }, task, model,
        taskGoal: { ...goal, mode: 'exact', confirmed: true } },
      actual: budget, direct: '50', permit2: '50',
    }))));
}

function confirmedPaths(events) {
  return events.filter(event => ['transaction.confirmed', 'relayer.confirmed'].includes(event.type))
    .map(event => event.type === 'transaction.confirmed' ? 'T' : 'S').join('');
}

function assertMatrixResult(scenario, execution) {
  assert.equal(confirmedPaths(execution.events), scenario.paths, 'confirmed path order');
  assert.equal(execution.check.routes.permit2, toBase(scenario.permit2), 'confirmed Permit2 amount');
  assert.equal(execution.check.task.status, scenario.rejected ? 'failed' : 'passed');
  assert.equal(execution.walletGrant.allowanceAtOpen, toBase(scenario.backend === 'smart-account' ? budget : initial));
  assert.deepEqual(execution.walletGrant.capabilities, { transfer: true, permit2: true });
  const confirmed = execution.events.filter(event => ['transaction.confirmed', 'relayer.confirmed'].includes(event.type));
  const requests = execution.events.filter(event => event.type === 'agent.tool_call' &&
    ['transfer_tokens', 'authorize_permit2'].includes(event.payload.name));
  assert.equal(requests.length, 2);
  assert.ok(confirmed[0].index < requests[1].index, 'first payment settles before the second request');
  if (scenario.rejected) {
    assert.equal(execution.blocked.layer, 'experiment_gateway');
    assert.equal(execution.blocked.walletReached, false);
    assert.equal(execution.check.actualSpent, toBase(scenario.amounts[0]));
  }
  assert.equal(verify(execution.bundle).status, 'success', 'offline evidence check');
}

const chain = new LabChain();
let fixture;
try {
  await chain.start();
  fixture = await startBudgetModelFixture();
  const fixtureModel = fixture.config().model;
  for (const scenario of [...scenarios, ...pathScenarios(), ...pairedScenarios(fixtureModel)]) {
    const input = {
      initial: scenario.initial,
      budget: scenario.budget,
      task: 'Observe exact amount accounting.',
      maxSteps: 8,
      model: { backend: 'local' },
      ...scenario.input,
    };
    const requestsBefore = fixture.requests.length;
    let decide = makeDecisionFixture(scenario.actions);
    if (scenario.executor === 'api-fixture') {
      fixture.plan(scenario.actions);
      decide = createBudgetDecision({
        model: { ...fixtureModel, provider: 'api' },
        ActionProvider: chain.lib.LabActionProvider,
      });
    }
    const execution = new BudgetExperiment(chain, input, () => {}, decide);
    const { name, id, family, backend, order, amounts, boundary, configSource, executor } = scenario;
    const result = { name, id, family, backend, order, amounts, boundary, configSource, executor };
    try {
      await execution.initialize();
      await execution.run();
      if (family) {
        const evidenceFile = `budget-matrix-evidence/${id}.json`;
        if (execution.bundle) {
          await writeFile(artifactPath(evidenceFile), JSON.stringify(execution.bundle, null, 2) + '\n');
          result.evidenceFile = evidenceFile;
        }
        Object.assign(result, { confirmedOrder: confirmedPaths(execution.events), initialAllowance: execution.initial.allowance,
          taskStatus: execution.check?.task?.status, rejection: execution.blocked ?? null });
      }
      assert.equal(execution.initial.balance, toBase(input.initial), 'initial wallet balance');
      assert.equal(execution.check.limit, toBase(input.budget), 'task budget');
      assert.equal(execution.ledger.limit, toBase(input.budget), 'wallet limit');
      assert.equal(execution.check.actualSpent, toBase(scenario.actual), 'actual asset outflow');
      assert.equal(execution.check.normalTransactionCounter, toBase(scenario.direct), 'direct transfer counter');
      assert.equal(execution.final.balance, String(units(input.initial) - units(scenario.actual, true)), 'final balance');
      assert.equal(execution.ledger.reserved, '0', 'no reservation remains after completed tool sequence');
      assert.equal(execution.check.status, 'success');
      assert.equal(Boolean(execution.blocked), Boolean(scenario.rejected));
      if (scenario.rejected) {
        assert.equal(execution.blocked.reason, 'TASK_BUDGET_EXCEEDED');
        const expectedPermits = family && scenario.paths.includes('S') ? 1 : 0;
        assert.equal(execution.events.filter(event => event.type === 'permit.signed').length, expectedPermits);
      }
      if (family) assertMatrixResult(scenario, execution);
      assert.equal(fixture.requests.length - requestsBefore, executor === 'api-fixture' ? scenario.actions.length : 0);
      results.push({ ...result, passed: true, actualSpent: execution.check.actualSpent });
      console.log('PASS', name);
    } catch (error) {
      results.push({ ...result, passed: false, error: error.message });
      console.error('FAIL', name, error.stack);
      process.exitCode = 1;
    } finally {
      await execution.close();
    }
  }
} finally {
  await fixture?.close();
  await chain.stop();
  const build = JSON.parse(await readFile(join(ROOT, 'build-info.json'), 'utf8'));
  await writeFile(artifactPath('v0153-parameter-results.json'), JSON.stringify({
    version: build.displayVersion, buildHash: build.sourceHash, time: new Date().toISOString(),
    amountUnit: 'BUD (six decimals); actualSpent and initialAllowance are in base units',
    pathOrder: { initial, budget, wallets, caseCount: 16, firstPayment: '80', boundaryPayments: ['20', '20.000001'] },
    pairedComparison: { caseCount: 8, configSources: ['manual', 'confirmed-prefill'], executors: ['script', 'api-fixture'],
      apiFixture: 'Fixed Chat Completions responses through the Agent tool adapter; no learned model.' },
    results,
  }, null, 2));
}

