import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDiagnostics } from "../src/diagnostics.js";

test("amount guard diagnostics preserve tool provenance and distinguish rejection from a chain revert", () => {
  const secret = "provider-secret-must-not-appear";
  const events = [{ seq: 23, type: "tool.result", links: { toolCallId: "call-incorrect-approval" }, payload: { raw: { error: `TOOL_AMOUNT_MISMATCH ${secret}`, recoverable: true } } }];
  const diagnostics = buildDiagnostics({ status: "failure", assertions: [] }, events);
  assert.equal(diagnostics.chainExecutionStatus, "not_submitted");
  assert.equal(diagnostics.transactions.length, 0);
  const item = diagnostics.items.find(value => value.code === "TOOL_AMOUNT_MISMATCH")!;
  assert.equal(item.layer, "tool");
  assert.equal(item.severity, "warning");
  assert.equal(item.seq, 23);
  assert.equal(item.toolCallId, "call-incorrect-approval");
  assert.match(item.detail, /签名和交易提交前被拒绝/);
  assert.match(item.detail, /不是链上回滚/);
  assert.match(item.suggestion, /\"20\"/);
  assert.equal(diagnostics.items.some(value => value.code === "TX_REVERTED"), false);
  assert.equal(JSON.stringify(diagnostics).includes(secret), false);
});

test("successful recovery retains rejected proposal without reporting a failed contract execution", () => {
  const diagnostics = buildDiagnostics({ status: "success", assertions: [] }, [
    { seq: 4, type: "tool.result", payload: { error: "TOOL_AMOUNT_MISMATCH" } },
    { seq: 9, type: "tx.receipt", payload: { hash: `0x${"8".repeat(64)}`, receipt: { status: "success" } } },
  ]);
  assert.equal(diagnostics.chainExecutionStatus, "success");
  assert.equal(diagnostics.title, "任务检查通过");
  assert.match(diagnostics.summary, /目标已达成/);
  assert.doesNotMatch(diagnostics.summary, /执行错误/);
  assert.equal(diagnostics.items[0].code, "TOOL_AMOUNT_MISMATCH");
});

test("missing dynamic amount evidence is a recoverable pre-submission tool issue", () => {
  const diagnostics = buildDiagnostics({ status: "failure" }, [{ seq: 13, type: "tool.result", payload: { error: "TOOL_AMOUNT_EVIDENCE_REQUIRED: query actual B first" } }]);
  assert.equal(diagnostics.chainExecutionStatus, "not_submitted");
  assert.equal(diagnostics.items[0].code, "TOOL_AMOUNT_EVIDENCE_REQUIRED");
  assert.equal(diagnostics.items[0].severity, "warning");
  assert.match(diagnostics.items[0].detail, /签名和交易提交前/);
});

test("approval policy diagnostics show exact token units separately from actual allowance arithmetic", () => {
  const result = { status: "failure", assertions: [
    { id: "bounded-amm-approval", passed: false, expected: "10000000", actual: ["1000000000000000000000"] },
    { id: "amm-allowance-consumed", passed: true, expected: "999999999999990000000", actual: "999999999999990000000" },
    { id: "only-task-transactions", passed: false, expected: true, actual: false },
  ] };
  const before = JSON.stringify(result);
  const diagnostics = buildDiagnostics(result);
  const policy = diagnostics.items.find(value => value.code === "bounded-amm-approval")!;
  assert.match(policy.detail, /10 TokenA（最小单位 10000000）/);
  assert.match(policy.detail, /1000000000000000 TokenA（最小单位 1000000000000000000000）/);
  assert.deepEqual(policy.actual, ["1000000000000000000000"]);
  assert.equal(diagnostics.items.some(value => value.code === "amm-allowance-consumed"), false);
  assert.match(diagnostics.items.find(value => value.code === "only-task-transactions")!.suggestion, /合规重复授权允许/);
  assert.equal(JSON.stringify(result), before);
});

test("allowance mismatches describe ordered approval replacement rather than stale initial-only arithmetic", () => {
  for (const id of ["amm-allowance-consumed", "vault-allowance-consumed"]) {
    const diagnostics = buildDiagnostics({ status: "failure", assertions: [{ id, passed: false, expected: "0", actual: "1000000" }] });
    assert.match(diagnostics.items[0].detail, /nonce顺序/);
    assert.match(diagnostics.items[0].detail, /approve覆盖/);
    assert.match(diagnostics.items[0].suggestion, /实际/);
  }
});
