import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { artifactDirectory, artifactPath } from './helpers/artifacts.mjs';
import { authorize, finish, makeDecisionFixture, redeem, startBudgetModelFixture, transfer } from './helpers/budget-model.mjs';
import { LabChain, BudgetExperiment } from '../src/budget/engine.mjs';
import { BudgetService } from '../src/budget/service.mjs';
import { ROOT, clone, config, stringify } from '../src/budget/common.mjs';
import { seal, verify } from '../src/budget/checker.mjs';

process.env.LAB_DATA_DIR = process.env.LAB_TEST_DATA_DIR ?? join(ROOT, 'data-budget-tests/compatibility');
const results = [];
let chain;

async function test(name, run) {
  const started = Date.now();
  try {
    await run();
    results.push({ name, passed: true, elapsedMs: Date.now() - started });
    console.log('PASS', name);
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
    console.error('FAIL', name, error.stack);
    process.exitCode = 1;
  }
}

async function experiment(actions, check, overrides = {}) {
  const input = {
    initial: '200',
    budget: '100',
    task: 'Run the fixture payment decisions.',
    model: { backend: 'local' },
    maxSteps: 8,
    ...overrides,
  };
  const execution = new BudgetExperiment(chain, input, () => {}, makeDecisionFixture(actions));
  try {
    await execution.initialize();
    await check(execution);
  } finally {
    await execution.close();
  }
}

function assertRejectionEvidence(execution, type, expected) {
  const rejected = execution.events.find(event => event.type === type && event.payload.reason === expected.reason);
  assert.ok(rejected, `Missing ${type} for ${expected.reason}`);
  const { toolCallId } = rejected.payload;
  assert.ok(toolCallId);
  const toolCall = execution.events.find(event => event.type === 'agent.tool_call' && event.payload.toolCallId === toolCallId);
  assert.equal(toolCall?.payload.name, rejected.payload.tool);
  const toolResult = execution.events.find(event => event.type === 'agent.tool_result' &&
    event.payload.toolCallId === toolCallId && event.payload.result.status === 'rejected');
  assert.ok(toolResult, `Missing tool result for ${expected.reason}`);
  assert.equal(toolResult.payload.step, rejected.payload.step);
  const evidence = execution.bundle.files['evidence.json'];
  assert.deepEqual(evidence.events.find(event => event.index === rejected.index), rejected);
  assert.deepEqual(evidence.events.find(event => event.index === toolResult.index), toolResult);
  for (const payload of [rejected.payload, toolResult.payload.result]) {
    const { reason, layer, walletReached, walletResult } = payload;
    assert.deepEqual({ reason, layer, walletReached, walletResult }, expected);
  }
  if (type === 'budget.rejected') assert.deepEqual(evidence.blocked, rejected.payload);
}

try {
  chain = new LabChain();
  await chain.start(process.env.LAB_TEST_CHAIN_PORT ? Number(process.env.LAB_TEST_CHAIN_PORT) : undefined);
  await test('direct spend limits new permits and a revised sequence uses both paths', () =>
    experiment([transfer('80'), authorize('21'), authorize('20'), redeem, finish], async execution => {
      await execution.run();
      assert.equal(execution.stage, 'completed');
      assert.equal(execution.config.mode, 'unified');
      assert.equal(execution.ledger.spent, '100000000');
      assert.equal(execution.ledger.reserved, '0');
      assert.equal(execution.ledger.remaining, '0');
      assert.equal(execution.final.balance, '100000000');
      assert.equal(execution.check.actualSpent, '100000000');
      assert.equal(execution.check.normalTransactionCounter, '80000000');
      assert.equal(execution.check.status, 'success');
      assert.equal(execution.check.relayedOutflowObserved, true);
      assertRejectionEvidence(execution, 'budget.rejected', {
        reason: 'TASK_BUDGET_EXCEEDED', layer: 'experiment_gateway', walletReached: false, walletResult: null,
      });
      assert.equal(execution.events.filter(event => event.type === 'permit.signed').length, 1);
      assert.notEqual(execution.signer.pid, process.pid);
      assert.notEqual(execution.owner.toLowerCase(), execution.spender.toLowerCase());
      assert.equal(verify(execution.bundle).status, 'success');
      assert.ok(!stringify(execution.bundle).includes('"signature":'));
    }));

  await test('an outstanding permit reserves budget against direct spending', () =>
    experiment([authorize('60'), transfer('41'), transfer('40'), redeem, finish], async execution => {
      await execution.step();
      assert.equal(execution.ledger.reserved, '60000000');
      assert.equal(execution.ledger.spent, '0');
      await execution.step();
      assert.equal(execution.blocked.reason, 'TASK_BUDGET_EXCEEDED');
      assert.equal((await execution.snapshot()).balance, '200000000');
      await execution.run();
      assert.equal(execution.ledger.spent, '100000000');
      assert.equal(execution.ledger.transactionSpent, '40000000');
      assert.equal(execution.ledger.reserved, '0');
      assert.equal(execution.check.status, 'success');
    }));

  await test('exact amounts on both chain paths pass independent task and budget checks', () =>
    experiment([transfer('30.000001'), authorize('69.999999'), redeem, finish], async execution => {
      await execution.run();
      assert.equal(execution.check.status, 'success');
      assert.equal(execution.check.task.status, 'passed');
      assert.deepEqual(execution.check.task.actual, { direct: '30000001', permit2: '69999999' });
      assert.deepEqual(execution.check.task.actual, execution.check.task.expected);
      assert.deepEqual(verify(execution.bundle).task, execution.check.task);
    }, { taskGoal: { direct: '30.000001', permit2: '69.999999' } }));

  await test('wrong-path substitution is rejected before payment and the original task remains incomplete', () =>
    experiment([transfer('70'), finish], async execution => {
      await execution.run();
      assert.equal(execution.check.status, 'success');
      assert.equal(execution.check.task.status, 'failed');
      assert.deepEqual(execution.check.task.actual, { direct: '0', permit2: '0' });
    }, { taskGoal: { direct: '30', permit2: '40' } }));

  await test('task text alone does not lock a hypothetical payment as the current business goal', () =>
    experiment([transfer('5'), finish], async execution => {
      await execution.run();
      assert.equal(execution.check.actualSpent, '5000000');
      assert.equal(execution.check.task.status, 'not_configured');
      const opened = execution.events.find(event => event.type === 'session.opened');
      assert.equal(opened.payload.taskGoal, null);
    }, { task: '若后续审批通过，再直接支付 40 BUD，申请 80 BUD 的 Permit2 许可。本次只支付 5 BUD。' }));

  await test('an unredeemed signature reserves funds but does not count as task payment', () =>
    experiment([transfer('30'), authorize('40'), finish], async execution => {
      await execution.run();
      assert.equal(execution.check.status, 'success');
      assert.equal(execution.check.task.status, 'failed');
      assert.deepEqual(execution.check.task.actual, { direct: '30000000', permit2: '0' });
      assert.equal(execution.ledger.reserved, '40000000');
    }, { taskGoal: { direct: '30', permit2: '40' } }));

  await test('confirmed effects determine task outcome even when Agent stops at the step limit', () =>
    experiment([transfer('5')], async execution => {
      await execution.run();
      assert.equal(execution.agentOutcome, 'step_limit');
      assert.equal(execution.check.status, 'success');
      assert.equal(execution.check.task.status, 'passed');
    }, { maxSteps: 1, taskGoal: { direct: '5', permit2: '0' } }));

  await test('smart account uses one distinct session for direct payment and ERC-1271 Permit2 clearance', () =>
    experiment([transfer('30'), authorize('70'), redeem, finish], async execution => {
      await execution.run();
      const grant = execution.walletGrant;
      assert.equal(grant.source, 'wallet_contract');
      assert.notEqual(grant.sessionSigner, grant.account);
      assert.notEqual(grant.sessionSigner, grant.administrator);
      assert.notEqual(grant.submitter, grant.sessionSigner);
      assert.equal(grant.spender, grant.account);
      assert.equal(grant.allowanceAtOpen, '100000000');
      const payment = execution.transactions.find(tx => tx.action === 'task.payment');
      const redemption = execution.transactions.find(tx => tx.action === 'relayer.redeem');
      assert.equal(payment.from.toLowerCase(), grant.sessionSigner.toLowerCase());
      assert.equal(redemption.from.toLowerCase(), grant.submitter.toLowerCase());
      assert.equal(redemption.to.toLowerCase(), grant.account.toLowerCase());
      assert.equal(execution.events.find(event => event.type === 'permit.signed').payload.verification, 'erc1271');
      assert.deepEqual(execution.check.routes, { direct: '30000000', permit2: '70000000' });
      assert.equal(execution.check.status, 'success');
      assert.equal(execution.check.task.status, 'passed');
      assert.equal(verify(execution.bundle).status, 'success');
      const changed = clone(execution.bundle.files['evidence.json']);
      changed.walletGrant.sessionSigner = grant.administrator;
      assert.equal(verify(seal(changed)).status, 'failed');
    }, { wallet: { backend: 'smart-account' }, taskGoal: { direct: '30', permit2: '70' } }));

  await test('gateway preserves smart account reservation and the contract rejects an unauthorized caller', () =>
    experiment([authorize('60'), transfer('41'), transfer('40'), redeem, finish], async execution => {
      await execution.step();
      assert.equal(execution.ledger.reserved, '60000000');
      assert.equal((await execution.snapshot()).balance, '200000000');
      await assert.rejects(execution.pc.simulateContract({
        address: execution.owner, abi: execution.wallet.artifact.abi, account: execution.walletGrant.administrator,
        functionName: 'pay', args: [1n],
      }), /SessionUnauthorized/);
      const pay = execution.wallet.pay.bind(execution.wallet);
      const walletPayments = [];
      execution.wallet.pay = amount => {
        walletPayments.push(amount);
        return pay(amount);
      };
      await execution.step();
      assert.deepEqual(walletPayments, []);
      await execution.run();
      assert.deepEqual(walletPayments, ['40']);
      assertRejectionEvidence(execution, 'budget.rejected', {
        reason: 'TASK_BUDGET_EXCEEDED', layer: 'experiment_gateway', walletReached: false, walletResult: null,
      });
      assert.equal(execution.check.actualSpent, '100000000');
      assert.equal(execution.check.status, 'success');
    }, { wallet: { backend: 'smart-account' } }));

  for (const backend of ['local-eoa', 'smart-account']) {
    await test(`${backend} disables Permit2 without disabling permitted direct transfers`, () =>
      experiment([authorize('20'), transfer('10'), finish], async execution => {
        await execution.run();
        assert.deepEqual(execution.walletGrant.capabilities, { transfer: true, permit2: false });
        assert.equal(execution.walletGrant.allowanceAtOpen, '0');
        const smartAccount = backend === 'smart-account';
        assertRejectionEvidence(execution, 'permission.rejected', {
          reason: 'PERMIT_DISABLED',
          layer: smartAccount ? 'wallet_contract' : 'wallet_process',
          walletReached: true,
          walletResult: smartAccount
            ? { operation: 'reservePermit', kind: 'contract_simulation', code: 'PermitDisabled' }
            : { operation: 'permit', kind: 'signer_response', code: 'PERMIT_DISABLED' },
        });
        assert.equal(execution.check.actualSpent, '10000000');
        assert.equal(execution.check.status, 'success');
      }, { wallet: { backend, permit2: false } }));

    await test(`${backend} completes a cumulative goal across multiple payments on each path`, () =>
      experiment([transfer('10'), transfer('21'), transfer('20'), authorize('20'), redeem, authorize('15'), redeem, finish],
        async execution => {
          await execution.run();
          assert.equal(execution.check.status, 'success');
          assert.equal(execution.check.task.status, 'passed');
          assert.deepEqual(execution.check.task.actual, { direct: '30000000', permit2: '35000000' });
          assert.equal(execution.transactions.filter(tx => tx.action === 'task.payment').length, 2);
          assert.equal(execution.transactions.filter(tx => tx.action === 'relayer.redeem').length, 2);
          assertRejectionEvidence(execution, 'permission.rejected', {
            reason: 'TASK_AMOUNT_MISMATCH', layer: 'agent_tool', walletReached: false, walletResult: null,
          });
          assert.equal(verify(execution.bundle).task.status, 'passed');
          const exactEvidence = clone(execution.bundle.files['evidence.json']);
          exactEvidence.config.taskGoal.mode = 'exact';
          const opened = exactEvidence.events.find(event => event.type === 'session.opened');
          opened.payload.taskGoal.mode = 'exact';
          assert.equal(verify(seal(exactEvidence)).task.status, 'failed');
        }, { wallet: { backend }, taskGoal: { mode: 'cumulative', direct: '30', permit2: '35', confirmed: true } }));

    await test(`${backend} records a lower wallet cap separately from the task authorization`, () =>
      experiment([transfer('25'), authorize('35'), redeem, transfer('1'), finish], async execution => {
        await execution.run();
        assert.equal(execution.check.status, 'success');
        assert.equal(execution.check.task.status, 'failed');
        assert.equal(execution.check.actualSpent, '60000000');
        assert.equal(execution.check.limit, '100000000');
        assert.equal(execution.check.walletLimit, '60000000');
        assert.equal(execution.ledger.limit, '60000000');
        const evidence = execution.bundle.files['evidence.json'];
        assert.deepEqual(evidence.taskAuthorization, { budget: '100000000' });
        assert.deepEqual(evidence.walletRequest, { backend, limit: '60000000', capabilities: { transfer: true, permit2: true } });
        assert.equal(evidence.walletGrant.limit, '60000000');
        const opened = evidence.events.find(event => event.type === 'session.opened');
        assert.deepEqual(opened.payload.taskAuthorization, evidence.taskAuthorization);
        assert.deepEqual(opened.payload.walletRequest, evidence.walletRequest);
        assert.deepEqual(opened.payload.taskGoal, evidence.config.taskGoal);
        const smartAccount = backend === 'smart-account';
        assertRejectionEvidence(execution, 'budget.rejected', {
          reason: 'TASK_BUDGET_EXCEEDED',
          layer: smartAccount ? 'wallet_contract' : 'wallet_process',
          walletReached: true,
          walletResult: { operation: 'pay', kind: smartAccount ? 'contract_simulation' : 'signer_response',
            code: smartAccount ? 'TaskBudgetExceeded' : 'TASK_BUDGET_EXCEEDED' },
        });
        assert.equal(verify(execution.bundle).status, 'success');
        const inconsistent = clone(evidence);
        inconsistent.walletRequest.limit = '70000000';
        assert.equal(verify(seal(inconsistent)).status, 'failed');
      }, { wallet: { backend, limit: '60' }, taskGoal: { mode: 'cumulative', direct: '35', permit2: '35', confirmed: true } }));
  }

  await test('expired EOA permit is rejected by the adapter before on-chain submission', () =>
    experiment([authorize('10'), redeem, finish], async execution => {
      await execution.step();
      const deadline = BigInt(execution.pendingPermit.deadline);
      const block = await chain.pc.getBlock();
      await chain.rpc('evm_increaseTime', [Number(deadline - block.timestamp + 1n)]);
      await chain.rpc('evm_mine');
      const now = (await chain.pc.getBlock()).timestamp;
      assert.ok(now > deadline && now < BigInt(execution.policy.expiresAt));

      await execution.run();
      assertRejectionEvidence(execution, 'permission.rejected', {
        reason: 'PERMIT_EXPIRED', layer: 'wallet_adapter', walletReached: false, walletResult: null,
      });
      assert.ok(!execution.events.some(event => event.type === 'relayer.broadcast'));
      assert.equal(execution.check.actualSpent, '0');
      assert.equal(execution.check.reserved, '10000000');
      assert.equal(verify(execution.bundle).status, 'success');
    }, { wallet: { backend: 'local-eoa' }, policy: { enabled: true } }));

  await test('signer accepts only the experiment session and registered parameters', () =>
    experiment([finish], async execution => {
      await assert.rejects(execution.signer.call('pay', execution.scope({ sessionId: 'wrong', amount: '80' })), /SESSION_SCOPE/);
      await assert.rejects(execution.signer.call('pay', execution.scope({ amount: '80', recipient: execution.spender })), /PAY_FIELDS/);
      await assert.rejects(execution.signer.call('permit', execution.scope({ amount: '60', spender: execution.recipient })), /PERMIT_FIELDS/);
      assert.equal((await execution.snapshot()).balance, '200000000');
    }));

  await test('unified checker detects inconsistent ledger and tampered bundle', () =>
    experiment([transfer('15'), finish], async execution => {
      await execution.run();
      const bad = clone(execution.bundle);
      bad.files['evidence.json'].final.balance = '200000000';
      assert.throws(() => verify(bad), /BUNDLE_HASH/);
      const forged = clone(execution.bundle.files['evidence.json']);
      forged.ledger.spent = '0';
      assert.equal(verify(seal(forged)).status, 'failed');
    }));

  await test('prior sealed experiment bundles remain readable and retain original results', async () => {
    const path = join(ROOT, 'examples/budget/01-split-overspend.json');
    const bundle = JSON.parse(await readFile(path, 'utf8'));
    const result = verify(bundle);
    assert.equal(result.actualSpent, '140000000');
    assert.equal(result.reproduction, true);
    const check = spawnSync(process.execPath, [join(ROOT, 'src/budget/cli.mjs'), 'check', path], { encoding: 'utf8', windowsHide: true });
    assert.equal(check.status, 2, check.stderr);
  });

  await test('configuration cannot select historical budget or fixed scripted fields', async () => {
    assert.throws(() => config({ mode: 'split' }));
    for (const key of ['payment', 'permit', 'secondPath']) assert.throws(() => config({ [key]: '20' }));
    assert.throws(() => config({ budget: '201' }), /BUDGET_EXCEEDS_BALANCE/);
  });

  await test('configured local backend uses its resolver and gates every model request', async () => {
    const model = await startBudgetModelFixture();
    model.plan([authorize('15'), redeem, finish]);
    let resolves = 0, checks = 0;
    const service = new BudgetService({
      data: artifactDirectory('budget-agent-local-fixture', randomUUID()),
      modelResolver: async options => {
        assert.equal(options.provider, 'local');
        assert.equal(options.baseUrl, undefined);
        resolves++;
        return { ...options, model: 'resolved-local-fixture', baseUrl: model.baseUrl };
      },
      assertLocalModel: options => {
        assert.equal(options.provider, 'local');
        assert.equal(options.baseUrl, model.baseUrl);
        checks++;
      },
    });
    try {
      await service.init();
      const state = await service.mutate('/run', { config: model.config({ model: { backend: 'local' } }) });
      assert.equal(resolves, 1);
      assert.equal(checks, 3);
      assert.equal(state.agentOutcome, 'finished');
      assert.equal(state.check.actualSpent, '15000000');
      assert.ok(model.requests.every(request => request.authorization === undefined && request.body.model === 'resolved-local-fixture'));
      assert.ok(state.events.filter(event => event.type === 'model.request').every(event => event.payload.provider === 'local'));
    } finally {
      await service.shutdown();
      await model.close();
    }
  });
} finally {
  await chain?.stop();
  const build = JSON.parse(await readFile(join(ROOT, 'build-info.json'), 'utf8'));
  await writeFile(artifactPath('v0153-budget-results.json'), JSON.stringify({
    version: build.displayVersion, buildHash: build.sourceHash, time: new Date().toISOString(), results,
  }, null, 2));
}

