import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ChainLab } from "../src/chain.js";
import { buildDiagnostics, ASSERTION_TEXT } from "../src/diagnostics.js";

test("real chain diagnostics distinguish successful wrong authorization, revert, pending, unknown and incorrect balance answer", { timeout: 120_000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), "web3-diagnostics-"));
  const chain = new ChainLab({ rpcUrl: "http://127.0.0.1:18551", dataDir: directory });
  let events: any[] = [];
  const hooks = { emit: async (type: string, payload: unknown) => { events.push({ type, payload, seq: events.length + 1, links: { toolCallId: "test-call" } }); } };
  try {
    await chain.start();
    await t.test("mined successful approve with incorrect amount gives concrete spender and units", async () => {
      await chain.reset(); events = []; const before = await chain.state();
      await chain.execute("approve_token", { token: "A", spender: "amm", amount: "10" }, hooks);
      const checked = await chain.check("approve", before, await chain.state());
      assert.equal(checked.status, "failure");
      const diagnostics = buildDiagnostics(checked, events);
      assert.equal(diagnostics.chainExecutionStatus, "success");
      assert.match(diagnostics.summary, /交易成功不等于任务成功/);
      const amount = diagnostics.items.find(item => item.assertionId === "allowance-exact")!;
      assert.equal(amount.expected, "20000000"); assert.equal(amount.actual, "10000000");
      assert.match(amount.detail, /20 TokenA/); assert.match(amount.detail, /10 TokenA/);
      const target = diagnostics.items.find(item => item.assertionId === "correct-approval-target-and-amount")!;
      assert.ok(target.detail.includes(before.addresses.amm));
      assert.ok(target.detail.includes(before.addresses.tokenA));
      assert.ok(target.detail.includes(diagnostics.transactions[0].hash!));
    });
    await t.test("unit error remains exact even when chain accepts huge approval", async () => {
      await chain.reset(); events = []; const before = await chain.state();
      await chain.execute("approve_token", { token: "A", spender: "amm", amount: "20000000" }, hooks);
      const checked = await chain.check("approve", before, await chain.state());
      const item = buildDiagnostics(checked, events).items.find(value => value.assertionId === "allowance-exact")!;
      assert.equal(item.actual, "20000000000000");
      assert.match(item.detail, /20000000 TokenA/);
    });
    await t.test("actual mined revert is identified without inventing an error cause", async () => {
      await chain.reset(); events = []; const before = await chain.state();
      await chain.execute("transfer_token", { token: "A", amount: "1000" }, hooks);
      const checked = await chain.check("transfer", before, await chain.state());
      const diagnostics = buildDiagnostics(checked, events);
      assert.equal(diagnostics.chainExecutionStatus, "reverted");
      const item = diagnostics.items.find(value => value.code === "TX_REVERTED")!;
      assert.ok(item.txHash); assert.ok(item.seq);
      assert.match(item.detail, /回执/); assert.doesNotMatch(item.detail, /余额不足导致/);
    });
    await t.test("pending and nonexistent hashes are not labelled reverted", async () => {
      await chain.reset(); events = []; await chain.setAutomine(false); const before = await chain.state();
      await chain.execute("transfer_token", { token: "A", amount: "10" }, hooks);
      const pending = buildDiagnostics(await chain.check("transfer", before, await chain.state()), events);
      assert.equal(pending.chainExecutionStatus, "pending");
      assert.equal(pending.items.some(item => item.code === "TX_REVERTED"), false);
      await chain.setAutomine(true); await chain.reset(); const unknownBefore = await chain.state();
      const missingHash = `0x${"7".repeat(64)}`;
      const unknown = await chain.check("transfer", unknownBefore, await chain.state(), [{ hash: missingHash, status: "unknown" }]);
      assert.equal(unknown.status, "unknown");
      const diagnostic = buildDiagnostics(unknown);
      assert.equal(diagnostic.chainExecutionStatus, "unknown");
      assert.equal(diagnostic.items.find(item => item.code === "TX_UNKNOWN")?.txHash, missingHash);
    });
    await t.test("balance JSON mismatch reports missing fields rather than a transaction failure", async () => {
      await chain.reset(); const before = await chain.state();
      await chain.execute("get_balance", { token: "A" });
      const checked = await chain.check("balance", before, await chain.state(), [], '{"token":"A","balanceBaseUnits":"100"}');
      const diagnostics = buildDiagnostics(checked);
      assert.equal(diagnostics.chainExecutionStatus, "not_submitted");
      const amount = diagnostics.items.find(item => item.assertionId === "answer-base-units")!;
      assert.equal(amount.expected, "100000000"); assert.equal(amount.actual, "100");
      assert.match(amount.detail, /0\.0001 TokenA/);
      assert.ok(diagnostics.items.some(item => item.assertionId === "answer-account"));
      assert.ok(diagnostics.items.some(item => item.assertionId === "answer-block-hash"));
      assert.equal(diagnostics.items.some(item => item.layer === "transaction"), false);
    });
  } finally {
    await chain.stop();
    await rm(directory, { recursive: true, force: true });
  }
});

test("offline diagnostics preserve bigint precision, omit arbitrary secrets and do not mutate evidence", () => {
  const secret = "plain-secret-should-not-render";
  const result = {
    status: "failure", run_error: `MODEL_HTTP_401 apiKey=${secret}`,
    assertions: [{ id: "allowance-exact", passed: false, expected: "9007199254740993000000", actual: "9007199254740993000001" }, { id: "unknown-test", passed: false, expected: { privateKey: secret }, actual: secret }],
  };
  const original = JSON.stringify(result);
  const diagnostics = buildDiagnostics(result, [{ seq: 3, type: "model.response", payload: { status: 401, response: { echoedSecret: secret } } }]);
  const item = diagnostics.items.find(value => value.assertionId === "allowance-exact")!;
  assert.equal(item.actual, "9007199254740993000001");
  assert.match(item.detail, /9007199254740993\.000001 TokenA/);
  assert.equal(JSON.stringify(diagnostics).includes(secret), false);
  assert.equal(JSON.stringify(result), original);
  assert.equal(diagnostics.items.find(value => value.code === "MODEL_AUTH_ERROR")?.seq, 3);
});

test("fresh independent unknown evidence overrides an old successful receipt", () => {
  const hash = `0x${"a".repeat(64)}`;
  const diagnostics = buildDiagnostics({ status: "unknown", evidence: { transactions: [{ hash, status: "unknown" }] } }, [
    { seq: 1, type: "tx.receipt", payload: { hash, status: "success", receipt: { status: "success", gasUsed: "21000" } } },
  ]);
  assert.equal(diagnostics.chainExecutionStatus, "unknown");
  assert.equal(diagnostics.transactions[0].gasUsed, undefined);
  assert.equal(diagnostics.transactions[0].seq, undefined);
});

test("checker failure is a data error without leaking exception prose or inventing a model failure", () => {
  const secret = "raw-rpc-password-must-not-render";
  const diagnostics = buildDiagnostics({ status: "unknown", check_status: "error", error: `RPC unavailable: ${secret}`, assertions: [] });
  assert.equal(diagnostics.items.length, 1);
  assert.equal(diagnostics.items[0].code, "CHECK_ERROR");
  assert.equal(diagnostics.items[0].layer, "data");
  assert.equal(diagnostics.items[0].severity, "error");
  assert.match(diagnostics.items[0].detail, /不能因此认定Agent任务失败/);
  assert.equal(diagnostics.items[0].seq, undefined);
  assert.equal(JSON.stringify(diagnostics).includes(secret), false);
  const nonCheckerError = buildDiagnostics({ status: "unknown", error: secret });
  assert.equal(nonCheckerError.items[0].code, "RUN_ERROR");
  assert.equal(nonCheckerError.items.some(item => item.code === "CHECK_ERROR"), false);
});

test("one no-hash submission appearing in events and checker evidence is counted once", () => {
  const attempt = { from: `0x${"1".repeat(40)}`, to: `0x${"2".repeat(40)}`, nonce: 0, data: "0x1234", value: "0", tool: "transfer_token", status: "unknown", error: "submission timeout" };
  const diagnostics = buildDiagnostics({ status: "unknown", evidence: { transactions: [attempt] } }, [
    { seq: 8, type: "tx.error", payload: attempt, links: { toolCallId: "call-transfer" } },
  ]);
  assert.equal(diagnostics.transactions.length, 1);
  assert.equal(diagnostics.transactions[0].seq, 8);
  const unknown = diagnostics.items.filter(item => item.code === "TX_UNKNOWN");
  assert.equal(unknown.length, 1);
  assert.equal(unknown[0].toolCallId, "call-transfer");
  assert.match(unknown[0].suggestion, /未取得交易哈希/);
});

test("matching no-hash attempts one-to-one preserves repeated submissions with the same nonce", () => {
  const attempt = { from: `0x${"1".repeat(40)}`, to: `0x${"2".repeat(40)}`, nonce: 0, data: "0x1234", status: "unknown" };
  const events = [
    { seq: 3, type: "tx.error", payload: attempt, links: { toolCallId: "first-call" } },
    { seq: 6, type: "tx.error", payload: attempt, links: { toolCallId: "retry-call" } },
  ];
  const diagnostics = buildDiagnostics({ status: "unknown", evidence: { transactions: [{ ...attempt }, { ...attempt }] } }, events);
  assert.equal(diagnostics.transactions.length, 2);
  assert.deepEqual(diagnostics.transactions.map(tx => tx.seq), [3, 6]);
  assert.deepEqual(diagnostics.items.filter(item => item.code === "TX_UNKNOWN").map(item => item.toolCallId), ["first-call", "retry-call"]);
  const partialEvidence = buildDiagnostics({ status: "unknown", evidence: { transactions: [attempt] } }, events);
  assert.equal(partialEvidence.transactions.length, 2);
});

test("different no-hash attempts cannot be collapsed just because their status matches", () => {
  const attempt = { from: `0x${"1".repeat(40)}`, to: `0x${"2".repeat(40)}`, nonce: 0, data: "0x1234", status: "unknown" };
  const diagnostics = buildDiagnostics({ status: "unknown", evidence: { transactions: [{ ...attempt, nonce: 1 }] } }, [
    { seq: 4, type: "tx.error", payload: attempt },
  ]);
  assert.equal(diagnostics.transactions.length, 2);
  assert.deepEqual(diagnostics.transactions.map(tx => tx.seq), [4, undefined]);
});

test("live reconciliation does not cite historical pending events as new receipt or assertion evidence", () => {
  const txHash = `0x${"4".repeat(64)}`;
  const original = { before: { blockNumber: "18" }, after: { blockNumber: "18" }, transactions: [{ hash: txHash, status: "pending" }] };
  const fresh = { ...original, after: { blockNumber: "19" }, transactions: [{ hash: txHash, status: "success", receipt: { status: "success", gasUsed: "21000", blockNumber: "19" } }] };
  const events = [
    { seq: 5, type: "tx.status", payload: original.transactions[0] },
    { seq: 6, type: "check.evidence", payload: original },
  ];
  const assertions = [{ id: "allowance-exact", expected: "20000000", actual: "10000000", passed: false }];
  const reconciled = buildDiagnostics({ status: "failure", check_mode: "live_reconciliation", evidence: fresh, assertions }, events);
  assert.equal(reconciled.chainExecutionStatus, "success");
  assert.equal(reconciled.transactions[0].seq, undefined);
  assert.equal(reconciled.items.find(item => item.assertionId)?.seq, undefined);
  const offline = buildDiagnostics({ status: "pending", check_mode: "offline", evidence: original, assertions }, events);
  assert.equal(offline.transactions[0].seq, 5);
  assert.equal(offline.items.find(item => item.assertionId)?.seq, 6);
});

test("unchanged check evidence keeps its source even when object keys have different order", () => {
  const evidence = { before: { blockNumber: "18", chainId: 31337 }, transactions: [] };
  const diagnostics = buildDiagnostics({ status: "failure", evidence, assertions: [{ id: "answer-account", expected: `0x${"1".repeat(40)}`, actual: null, passed: false }] }, [
    { seq: 6, type: "check.evidence", payload: { transactions: [], before: { chainId: 31337, blockNumber: "18" } } },
  ]);
  assert.equal(diagnostics.items.find(item => item.assertionId)?.seq, 6);
});

test("every concrete checker assertion has a Chinese explanation", async () => {
  const source = await readFile(new URL("../src/checker.ts", import.meta.url), "utf8");
  const ids = [...source.matchAll(/(?:add|exactCount)\('([^']+)'/g)].map(match => match[1]);
  assert.ok(ids.length > 30);
  for (const id of ids) assert.ok(ASSERTION_TEXT[id], `Missing Chinese explanation for ${id}`);
});
