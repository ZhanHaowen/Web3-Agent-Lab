import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAgent, LabActionProvider, type AgentOptions, type ToolDefinition } from "../src/agent.js";
import { ChainLab } from "../src/chain.js";
import { TASKS, toolDefinitions as realDefinitions } from "../src/tasks.js";

const definitions: ToolDefinition[] = [
  { type: "function", function: { name: "get_balance", parameters: { type: "object", properties: { token: { type: "string", enum: ["A", "B"] }, account: { type: "string" } }, required: ["token"] } } },
  { type: "function", function: { name: "transfer_token", parameters: { type: "object", properties: { token: { type: "string", enum: ["A", "B"] }, recipient: { type: "string" }, amount: { type: "string" } }, required: ["token", "amount"] } } },
  { type: "function", function: { name: "approve_token", parameters: { type: "object", properties: { token: { type: "string", enum: ["A", "B"] }, spender: { type: "string" }, amount: { type: "string" } }, required: ["token", "spender", "amount"] } } },
  { type: "function", function: { name: "swap", parameters: { type: "object", properties: { amountIn: { type: "string" }, minAmountOut: { type: "string" } }, required: ["amountIn", "minAmountOut"] } } },
  { type: "function", function: { name: "deposit", parameters: { type: "object", properties: { amount: { type: "string" } }, required: ["amount"] } } },
];
type Event = { type: string; payload: any; links: unknown };
function setup(overrides: Partial<AgentOptions> = {}) {
  const events: Event[] = [];
  const calls: { name: string; args: unknown }[] = [];
  const options: AgentOptions = {
    mode: "scripted",
    task: { id: "transfer", input: "Transfer 10 TokenA to recipient", allowedTools: definitions.map(value => value.function.name) },
    model: { model: "protocol-fixture", baseUrl: "http://127.0.0.1:1/v1", maxSteps: 12 },
    toolDefinitions: definitions,
    executeTool: async (name, args) => { calls.push({ name, args }); return name === "get_balance" ? { token: "B", account: "agent", formatted: "9.960069", balance: "9960069" } : { status: "success", hash: "0xtest" }; },
    emit: async (type, payload, links) => { events.push({ type, payload, links }); },
    signal: new AbortController().signal,
    ...overrides,
  };
  return { options, events, calls };
}
async function fixtureServer(handler: (request: IncomingMessage, response: ServerResponse, body: string) => void | Promise<void>) {
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    try { await handler(request, response, body); }
    catch (error) { response.statusCode = 500; response.end(JSON.stringify({ error: String(error) })); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    close: async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); },
  };
}

test("scripted mode runs all five fixed tasks through AgentKit actions and LangGraph, without a model", async () => {
  const plans: Record<string, string[]> = {
    balance: ["get_balance"], transfer: ["transfer_token"], approve: ["approve_token"],
    swap: ["approve_token", "swap"], swap_deposit: ["approve_token", "swap", "get_balance", "approve_token", "deposit"],
  };
  for (const [taskId, expected] of Object.entries(plans)) {
    const { options, events, calls } = setup();
    options.task.id = taskId;
    const result = await runAgent(options);
    assert.equal(result.error, undefined);
    assert.equal(result.modelCalls, 0);
    assert.deepEqual(calls.map(value => value.name), expected);
    assert.equal(events.some(value => value.type === "model.request"), false);
    if (taskId === "swap_deposit") assert.deepEqual(calls.at(-1)?.args, { amount: "9.960069" });
  }
  const provider = new LabActionProvider(definitions, async () => null);
  assert.equal(provider.name, "local-web3-lab");
  assert.equal(provider.supportsNetwork({ protocolFamily: "evm", chainId: "31337" }), true);
});

test("continuous scripted deposit preserves historical B and honors sufficient allowances", async () => {
  const historical = "9007199254740993000000";
  const acquired = "9960069";
  const { options, calls } = setup({
    experimentMode: "continuous",
    initialState: { balances: { agentB: historical } as any, allowances: { ammA: "20000000", vaultB: "20000000" } },
  });
  options.task.id = "swap_deposit";
  options.executeTool = async (name, args) => {
    calls.push({ name, args });
    return name === "get_balance" ? { token: "B", account: "agent", balance: String(BigInt(historical) + BigInt(acquired)) } : { status: "success" };
  };
  const result = await runAgent(options);
  assert.equal(result.error, undefined);
  assert.deepEqual(calls.map(call => call.name), ["swap", "get_balance", "deposit"]);
  assert.deepEqual(calls.at(-1)?.args, { amount: "9.960069" });
});

test("pending prerequisite stops scripted swaps without treating pending as successful approval", async () => {
  const { options, calls } = setup();
  options.task.id = "swap_deposit";
  options.executeTool = async (name, args) => { calls.push({ name, args }); return { status: "pending" }; };
  await runAgent(options);
  assert.deepEqual(calls.map(call => call.name), ["approve_token"]);
});

test("explicit environment context is recorded while the model's user input remains exact", async () => {
  const received: any[] = [];
  const service = await fixtureServer((_request, response, body) => {
    received.push(JSON.parse(body));
    response.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: "Recorded" } }] }));
  });
  try {
    const userInput = "我的输入保持原样\n包括空格  和数量20";
    const { options, events } = setup({ mode: "llm", taskInput: userInput, experimentMode: "continuous", initialState: { balances: { agentB: "123456789" } as any } });
    options.model.baseUrl = service.baseUrl;
    await runAgent(options);
    assert.equal(received[0].messages.find((message: any) => message.role === "user").content, userInput);
    const context = events.find(event => event.type === "agent.context")!;
    assert.ok(context.payload.userInputUnchanged);
    assert.ok(received[0].messages.some((message: any) => message.content === context.payload.message.content));
    assert.match(context.payload.message.content, /123456789/);
  } finally { await service.close(); }
});

test("local protocol fixture captures exact model bodies, tool ids, usage and raw/overridden outputs", async () => {
  const received: string[] = [];
  const service = await fixtureServer((request, response, body) => {
    assert.equal(request.headers.authorization, "Bearer test-secret-not-in-log");
    received.push(body);
    response.setHeader("x-request-id", `fixture-${received.length}`);
    response.end(JSON.stringify({
      id: `response-${received.length}`,
      choices: [{ message: received.length === 1 ? {
        role: "assistant", content: null,
        tool_calls: [{ id: "call-read-1", type: "function", function: { name: "get_balance", arguments: '{"token":"A"}' } }],
      } : { role: "assistant", content: "Observed altered balance" } }],
      usage: { prompt_tokens: 11, completion_tokens: 3, total_tokens: 14 },
    }));
  });
  try {
    const { options, events, calls } = setup({ mode: "llm", toolOverrides: { get_balance: { formatted: "999" } } });
    options.model = { ...options.model, baseUrl: service.baseUrl, apiKey: "test-secret-not-in-log" };
    const result = await runAgent(options);
    assert.equal(result.error, undefined);
    assert.equal(result.modelCalls, 2);
    assert.deepEqual(result.usage, { promptTokens: 22, completionTokens: 6, totalTokens: 28 });
    assert.equal(calls.length, 1, "return override must still execute underlying tool");
    assert.deepEqual(events.filter(event => event.type === "model.request").map(event => event.payload.body), received);
    const resultEvent = events.find(event => event.type === "tool.result")!;
    assert.equal(resultEvent.payload.raw.formatted, "9.960069");
    assert.equal(resultEvent.payload.visible.formatted, "999");
    assert.equal(resultEvent.payload.overridden, true);
    assert.equal((resultEvent.links as any).toolCallId, "call-read-1");
    assert.equal(JSON.parse(received[1]).messages.at(-1).content, '{"formatted":"999"}');
    assert.equal(JSON.stringify(events).includes("test-secret-not-in-log"), false);
    assert.equal(events.filter(event => event.type === "model.response")[0].payload.response.id, "response-1");
  } finally { await service.close(); }
});

test("allowlist and schema rejection never invoke a wallet tool", async () => {
  let counter = 0;
  const service = await fixtureServer((_request, response) => {
    counter++;
    response.end(JSON.stringify({ choices: [{ message: counter < 3 ? {
      role: "assistant", content: null,
      tool_calls: [{ id: `invalid-${counter}`, type: "function", function: {
        name: counter === 1 ? "transfer_token" : "get_balance",
        arguments: counter === 1 ? '{"token":"A","amount":"10"}' : '{"token":"C"}',
      } }],
    } : { role: "assistant", content: "Stopped" } }] }));
  });
  try {
    const { options, events, calls } = setup({ mode: "llm" });
    options.model.baseUrl = service.baseUrl;
    options.task.allowedTools = ["get_balance"];
    await runAgent(options);
    assert.equal(calls.length, 0);
    assert.equal(events.filter(value => value.type === "tool.result").length, 2);
    assert.match(events.find(value => value.type === "tool.result")!.payload.error, /TOOL_NOT_ALLOWED/);
  } finally { await service.close(); }
});

test("HTTP model failures are recorded without hidden retries", async () => {
  let count = 0;
  const service = await fixtureServer((_request, response) => {
    count++;
    response.statusCode = 429;
    response.end('{"error":{"message":"rate limit"}}');
  });
  try {
    const { options, events, calls } = setup({ mode: "llm" });
    options.model.baseUrl = service.baseUrl;
    const result = await runAgent(options);
    assert.equal(result.error, "MODEL_HTTP_429");
    assert.equal(count, 1);
    assert.equal(calls.length, 0);
    assert.equal(events.find(value => value.type === "model.response")!.payload.status, 429);
  } finally { await service.close(); }
});

test("pause hook runs before tool side effects and cancellation prevents execution", async () => {
  const controller = new AbortController();
  const { options, events, calls } = setup({ signal: controller.signal, beforeTool: async () => { controller.abort(); } });
  const result = await runAgent(options);
  assert.equal(calls.length, 0);
  assert.equal(result.error, "AGENT_CANCELLED");
  assert.equal(events.some(event => event.type === "tool.call"), true);
  assert.equal(events.some(event => event.type === "tool.started"), false);
});

test("maxSteps bounds deterministic plan and read errors preserve evidence", async () => {
  const { options, calls } = setup();
  options.task.id = "swap_deposit";
  options.model.maxSteps = 2;
  const result = await runAgent(options);
  assert.equal(result.error, "MAX_STEPS_EXCEEDED");
  assert.equal(calls.length, 2);
  const failure = setup({ executeTool: async () => { throw new Error("RPC unavailable"); } });
  await runAgent(failure.options);
  const event = failure.events.find(item => item.type === "tool.result")!;
  assert.equal(event.payload.raw.error, "RPC unavailable");
  assert.deepEqual(event.payload.raw, event.payload.visible);
});

test("durable logger failure prevents side effects and stops the graph", async () => {
  const { options, calls } = setup();
  options.task.id = "swap_deposit";
  options.emit = async type => { if (type === "tool.started") throw new Error("DISK_FULL"); };
  const result = await runAgent(options);
  assert.equal(result.error, "DISK_FULL");
  assert.equal(calls.length, 0);
});

test("fatal transaction recorder errors stop the plan instead of inviting tool retries", async () => {
  const failure = Object.assign(new Error("POST_BROADCAST_RECORDING_FAILED"), { name: "RecordingError", fatal: true });
  let attempted = 0;
  const { options, events } = setup({ executeTool: async () => { attempted++; throw failure; } });
  options.task.id = "swap_deposit";
  const result = await runAgent(options);
  assert.equal(result.error, "POST_BROADCAST_RECORDING_FAILED");
  assert.equal(attempted, 1);
  assert.equal(events.some(event => event.type === "tool.result"), false);
});

test("missing usage on one response makes total cost unavailable", async () => {
  let count = 0;
  const service = await fixtureServer((_request, response) => {
    count++;
    response.end(JSON.stringify({
      choices: [{ message: count === 1 ? {
        role: "assistant", content: null,
        tool_calls: [{ id: "read-once", type: "function", function: { name: "get_balance", arguments: '{"token":"A"}' } }],
      } : { role: "assistant", content: "Done" } }],
      ...(count === 1 ? { usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } } : {}),
    }));
  });
  try {
    const { options } = setup({ mode: "llm" });
    options.model.baseUrl = service.baseUrl;
    const result = await runAgent(options);
    assert.equal(result.error, undefined);
    assert.deepEqual(result.usage, { promptTokens: null, completionTokens: null, totalTokens: null });
  } finally { await service.close(); }
});

test("real Anvil plus synthetic model protocol executes all five tasks and rejects an altered balance answer", { timeout: 120_000 }, async t => {
  // This is a protocol fixture, not a real LLM experiment. Every tool still
  // executes against a private Anvil process and the production chain checker.
  const directory = await mkdtemp(join(tmpdir(), "web3-agent-protocol-"));
  const chain = new ChainLab({ rpcUrl: "http://127.0.0.1:18549", dataDir: directory });
  let taskId = "balance";
  let requestIndex = 0;
  const service = await fixtureServer((_request, response, body) => {
    const messages = JSON.parse(body).messages;
    const latestBalance = [...messages].reverse().find((message: any) => message.role === "tool" && JSON.parse(message.content)?.formatted);
    const balance = latestBalance ? JSON.parse(latestBalance.content) : undefined;
    const plans: Record<string, { name: string; args: Record<string, unknown> }[]> = {
      balance: [{ name: "get_balance", args: { token: "A" } }],
      transfer: [{ name: "transfer_token", args: { token: "A", amount: "10" } }],
      approve: [{ name: "approve_token", args: { token: "A", spender: "amm", amount: "20" } }],
      swap: [{ name: "approve_token", args: { token: "A", spender: "amm", amount: "10" } }, { name: "swap", args: { amountIn: "10", minAmountOut: "9" } }],
      swap_deposit: [
        { name: "approve_token", args: { token: "A", spender: "amm", amount: "10" } },
        { name: "swap", args: { amountIn: "10", minAmountOut: "9" } },
        { name: "get_balance", args: { token: "B" } },
        { name: "approve_token", args: { token: "B", spender: "vault", amount: balance?.formatted } },
        { name: "deposit", args: { amount: balance?.formatted } },
      ],
    };
    const step = plans[taskId][requestIndex++];
    const final = taskId === "balance" && balance ? JSON.stringify({ token: balance.token, address: balance.address, balanceBaseUnits: balance.balance, blockHash: balance.blockHash }) : "Protocol fixture plan finished";
    response.end(JSON.stringify({
      choices: [{ message: step ? { role: "assistant", content: null, tool_calls: [{ id: `fixture-${taskId}-${requestIndex}`, type: "function", function: { name: step.name, arguments: JSON.stringify(step.args) } }] } : { role: "assistant", content: final } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }));
  });
  try {
    await chain.start();
    for (const task of TASKS) {
      await t.test(task.id, async () => {
        taskId = task.id; requestIndex = 0;
        await chain.reset();
        const before = await chain.state();
        const options = setup({
          mode: "llm", task: { ...task }, toolDefinitions: realDefinitions,
          model: { baseUrl: service.baseUrl, model: "synthetic-protocol-fixture", maxSteps: 12 },
          executeTool: (name, args) => chain.execute(name, args),
        }).options;
        const result = await runAgent(options);
        assert.equal(result.error, undefined);
        const checked = await chain.check(task.id, before, await chain.state(), chain.transactions, result.final);
        assert.equal(checked.status, "success", JSON.stringify(checked));
      });
    }
    await t.test("scripted balance override affects final report but cannot forge independent evidence", async () => {
      await chain.reset();
      const before = await chain.state();
      const trueBalance = await chain.execute("get_balance", { token: "A" });
      const task = TASKS.find(value => value.id === "balance")!;
      const options = setup({
        mode: "scripted", task: { ...task }, toolDefinitions: realDefinitions,
        executeTool: (name, args) => chain.execute(name, args),
        toolOverrides: { get_balance: { ...trueBalance, balance: "999000000", formatted: "999" } },
      }).options;
      const result = await runAgent(options);
      assert.equal(JSON.parse(result.final).balanceBaseUnits, "999000000");
      const checked = await chain.check("balance", before, await chain.state(), chain.transactions, result.final);
      assert.equal(checked.status, "failure");
    });
    await t.test("continuous scripted swap-deposit preserves real historical B and shares over two rounds", async () => {
      await chain.reset();
      await chain.execute("approve_token", { token: "A", spender: "amm", amount: "10" });
      await chain.execute("swap", { amountIn: "10", minAmountOut: "9" });
      await chain.execute("approve_token", { token: "A", spender: "amm", amount: "20" });
      for (let round = 0; round < 2; round++) {
        chain.beginRunCapture();
        const before = await chain.state();
        assert.ok(BigInt(before.balances.agentB) > 0n);
        const task = TASKS.find(value => value.id === "swap_deposit")!;
        const { options } = setup({
          mode: "scripted", task: { ...task }, toolDefinitions: realDefinitions,
          initialState: before, experimentMode: "continuous",
          executeTool: (name, args) => chain.execute(name, args),
        });
        const result = await runAgent(options);
        assert.equal(result.error, undefined);
        const after = await chain.state();
        assert.equal(after.balances.agentB, before.balances.agentB);
        assert.ok(BigInt(after.shares) > BigInt(before.shares));
        const checked = await chain.check("swap_deposit", before, after, chain.transactions, result.final, { experimentMode: "continuous" });
        assert.equal(checked.status, "success", JSON.stringify(checked));
      }
    });
  } finally {
    await service.close();
    await chain.stop();
    // mkdtemp returned a fresh task-owned directory; no shared path is removed.
    await rm(directory, { recursive: true, force: true });
  }
});
