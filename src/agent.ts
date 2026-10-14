import { randomUUID } from "node:crypto";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ActionProvider, type Action, type Network } from "@coinbase/agentkit";
import { z } from "zod";
import type { ChainState } from "./chain.js";
import { formatTokenState } from "./units.js";

export interface ToolDefinition {
  type: "function";
  function: { name: string; description?: string; parameters: Record<string, unknown> };
}
export interface AgentTask { id: string; input: string; allowedTools: string[]; [key: string]: unknown }
export interface AgentModel {
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxSteps: number;
  systemPrompt?: string;
  requestTimeoutMs?: number;
}
export interface ToolContext { toolCallId: string; modelCallId?: string; attempt: number; signal: AbortSignal }
export interface AgentOptions {
  mode: "scripted" | "llm";
  task: AgentTask;
  model: AgentModel;
  toolDefinitions: ToolDefinition[];
  executeTool: (name: string, args: Record<string, unknown>, context?: ToolContext) => Promise<unknown>;
  emit: (type: string, payload: unknown, links?: Record<string, unknown>) => Promise<void>;
  beforeTool?: (name: string, args: Record<string, unknown>, callId: string) => Promise<void>;
  signal: AbortSignal;
  toolOverrides?: Record<string, unknown>;
  taskInput?: string;
  initialState?: Partial<ChainState>;
  experimentMode?: "independent" | "continuous";
  /** Fixed benchmark amounts are validated before execution; schema_only records unguarded experiments. */
  amountValidation?: "fixed_task" | "schema_only";
}
export interface AgentResult {
  final: string;
  modelCalls: number;
  usage: { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null };
  toolCalls: number;
  error?: string;
}
type Call = { id: string; type: "function"; function: { name: string; arguments: string }; modelCallId?: string };
type Message = { role: string; content: unknown; tool_calls?: Omit<Call, "modelCallId">[]; tool_call_id?: string };
type ToolObservation = { name: string; raw: unknown; visible: unknown; error?: string };

function serialize(value: unknown): string {
  return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item) ?? "null";
}
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function isFatal(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (("fatal" in error && error.fatal) || ("name" in error && error.name === "RecordingError")));
}
function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) throw new Error("AGENT_CANCELLED");
}

// Only the JSON Schema subset used by this platform is accepted. Unknown schema
// shapes fail at startup instead of silently weakening argument validation.
function argumentSchema(schema: Record<string, unknown>): z.ZodTypeAny {
  if (Array.isArray(schema.enum)) {
    const values = schema.enum;
    return z.any().superRefine((value, ctx) => {
      if (!values.includes(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Value is outside enum" });
    });
  }
  switch (schema.type) {
    case "string": {
      let value = z.string();
      if (schema.pattern !== undefined) {
        if (typeof schema.pattern !== "string") throw new Error("Invalid string schema pattern");
        value = value.regex(new RegExp(schema.pattern), "Use a nonnegative human-readable decimal token amount, with at most 6 fractional digits; do not multiply by token precision.");
      }
      return value;
    }
    case "number": return z.number().finite();
    case "integer": return z.number().int();
    case "boolean": return z.boolean();
    case "array": return z.array(argumentSchema((schema.items ?? {}) as Record<string, unknown>));
    case "object": {
      const required = new Set(Array.isArray(schema.required) ? schema.required as string[] : []);
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const [key, value] of Object.entries((schema.properties ?? {}) as Record<string, Record<string, unknown>>)) {
        const entry = argumentSchema(value);
        shape[key] = required.has(key) ? entry : entry.optional();
      }
      return schema.additionalProperties === true ? z.object(shape).passthrough() : z.object(shape).strict();
    }
    default: throw new Error(`Unsupported tool schema type: ${String(schema.type)}`);
  }
}

/** A genuine AgentKit ActionProvider; execution remains in the local wallet adapter. */
export class LabActionProvider extends ActionProvider {
  constructor(
    private readonly definitions: ToolDefinition[],
    private readonly executor: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  ) { super("local-web3-lab", []); }

  supportsNetwork(network: Network): boolean { return network.protocolFamily === "evm"; }

  getActions(): Action[] {
    return this.definitions.map(definition => {
      const schema = argumentSchema(definition.function.parameters);
      return {
        name: definition.function.name,
        description: definition.function.description ?? definition.function.name,
        schema,
        invoke: async (args: unknown) => serialize(await this.executor(definition.function.name, schema.parse(args))),
      };
    });
  }
}

function decimalUnits(value: bigint): string {
  const fraction = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${value / 1_000_000n}${fraction ? `.${fraction}` : ""}`;
}

interface AmountIssue {
  code: "TOOL_AMOUNT_MISMATCH" | "TOOL_AMOUNT_EVIDENCE_REQUIRED";
  taskId: string; parameter: string; received: unknown; expected?: string;
  unit: "token"; tokenDecimals: 6; policy: "fixed_task"; message: string;
}
class AmountValidationError extends Error {
  constructor(readonly detail: AmountIssue) { super(`${detail.code}: ${detail.message}`); }
}
function humanBaseUnits(value: unknown): bigint | undefined {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,6})?$/.test(value)) return undefined;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}
function acquiredFromRaw(observations: ToolObservation[], initialState?: Partial<ChainState>, experimentMode = "independent"): bigint | undefined {
  // A return override is a model-visible intervention, never authoritative chain evidence.
  const reverseIndex = [...observations].reverse().findIndex(value => value.name === "swap" && !value.error && (value.raw as any)?.status === "success");
  if (reverseIndex < 0) return undefined;
  const swapIndex = observations.length - 1 - reverseIndex;
  const swap = observations[swapIndex].raw as any;
  if (/^\d+$/.test(String(swap.amountOut))) return BigInt(swap.amountOut);
  const agentAddress = initialState?.addresses?.agent?.toLowerCase();
  const balance = observations.slice(swapIndex + 1).reverse().find(value => {
    const raw = value.raw as any;
    const knownAgentAddress = agentAddress && typeof raw?.address === "string" && raw.address.toLowerCase() === agentAddress;
    const contradictoryAddress = agentAddress && typeof raw?.address === "string" && raw.address.toLowerCase() !== agentAddress;
    return value.name === "get_balance" && !value.error && raw?.token === "B" && !contradictoryAddress
      && (raw.account === "agent" || knownAgentAddress) && /^\d+$/.test(String(raw.balance));
  })?.raw as any;
  if (!balance || (experimentMode === "continuous" && initialState?.balances?.agentB === undefined)) return undefined;
  const acquired = BigInt(balance.balance) - BigInt(initialState?.balances?.agentB ?? "0");
  return acquired > 0n ? acquired : undefined;
}
/** Fixed task constraints never rewrite model proposals or decode guessed base units. */
function validateTaskAmounts(options: AgentOptions, name: string, args: Record<string, unknown>, observations: ToolObservation[]): void {
  if (options.amountValidation === "schema_only") return;
  const taskId = options.task.id;
  const expected: Record<string, string | undefined> = {};
  if (taskId === "transfer" && name === "transfer_token") expected.amount = "10";
  if (taskId === "approve" && name === "approve_token") expected.amount = "20";
  if (["swap", "swap_deposit"].includes(taskId)) {
    if (name === "swap") { expected.amountIn = "10"; expected.minAmountOut = "9"; }
    if (name === "approve_token" && args.token === "A") expected.amount = "10";
    if (taskId === "swap_deposit" && (name === "deposit" || (name === "approve_token" && args.token === "B"))) {
      const acquired = acquiredFromRaw(observations, options.initialState, options.experimentMode);
      expected.amount = acquired !== undefined ? decimalUnits(acquired) : undefined;
    }
  }
  for (const [parameter, value] of Object.entries(expected)) {
    if (value !== undefined && humanBaseUnits(args[parameter]) === humanBaseUnits(value)) continue;
    const detail: AmountIssue = {
      code: value === undefined ? "TOOL_AMOUNT_EVIDENCE_REQUIRED" : "TOOL_AMOUNT_MISMATCH",
      taskId, parameter, received: args[parameter], ...(value === undefined ? {} : { expected: value }),
      unit: "token", tokenDecimals: 6, policy: "fixed_task",
      message: value === undefined
        ? "Cannot determine this run's newly acquired TokenB. Execute the swap and inspect its confirmed output or read TokenB balance before approval/deposit. No transaction was submitted."
        : `${name}.${parameter} must be the human-readable token string \"${value}\" for this fixed task. Received ${serialize(args[parameter])}. Do not multiply by 10^6; the wallet adapter converts once. No transaction was submitted. Resubmit a corrected tool call.`,
    };
    throw new AmountValidationError(detail);
  }
}

function taskAmountTargets(taskId: string): Record<string, unknown> {
  switch (taskId) {
    case "transfer": return { transfer_token: { amount: "10" } };
    case "approve": return { approve_token: { token: "A", spender: "amm", amount: "20" } };
    case "swap": return { swap: { amountIn: "10", minAmountOut: "9" }, approve_token_if_needed: { token: "A", spender: "amm", amount: "10" } };
    case "swap_deposit": return { swap: { amountIn: "10", minAmountOut: "9" }, approve_token_if_needed: { token: "A", spender: "amm", amount: "10" }, tokenB_approval_and_deposit: "Only this run's confirmed newly acquired TokenB, expressed in human-readable token units" };
    default: return {};
  }
}
function scriptedCalls(taskId: string, observations: ToolObservation[], initialState?: Partial<ChainState>, experimentMode = "independent"): { name: string; args: Record<string, unknown> }[] {
  const inputA = { token: "A", spender: "amm", amount: "10" };
  const ammAllowance = BigInt(initialState?.allowances?.ammA ?? "0");
  const approveA = ammAllowance >= 10_000_000n ? [] : [{ name: "approve_token", args: inputA }];
  switch (taskId) {
    case "balance": return [{ name: "get_balance", args: { token: "A", account: "agent" } }];
    case "transfer": return [{ name: "transfer_token", args: { token: "A", recipient: "recipient", amount: "10" } }];
    case "approve": return initialState?.allowances?.ammA === "20000000" ? [] : [{ name: "approve_token", args: { token: "A", spender: "amm", amount: "20" } }];
    case "swap": return [
      ...approveA,
      { name: "swap", args: { amountIn: "10", minAmountOut: "9" } },
    ];
    case "swap_deposit": {
      if (experimentMode === "continuous" && initialState?.balances?.agentB === undefined) throw new Error("INITIAL_TOKEN_B_BALANCE_REQUIRED");
      const balance = [...observations].reverse().find(value => value.name === "get_balance")?.visible;
      let acquired = 0n;
      if (balance !== undefined) {
        if (!balance || typeof balance !== "object" || !("balance" in balance) || !/^\d+$/.test(String(balance.balance))) throw new Error("INVALID_OBSERVED_TOKEN_B_BALANCE");
        acquired = BigInt(String(balance.balance)) - BigInt(initialState?.balances?.agentB ?? "0");
        if (acquired <= 0n) throw new Error("NO_NEW_TOKEN_B_FROM_SWAP");
      }
      const amount = decimalUnits(acquired);
      const approveB = acquired > 0n && BigInt(initialState?.allowances?.vaultB ?? "0") >= acquired ? [] : [{ name: "approve_token", args: { token: "B", spender: "vault", amount } }];
      return [
        ...approveA,
        { name: "swap", args: { amountIn: "10", minAmountOut: "9" } },
        { name: "get_balance", args: { token: "B", account: "agent" } },
        ...approveB,
        { name: "deposit", args: { amount } },
      ];
    }
    default: throw new Error(`No scripted baseline for task ${taskId}`);
  }
}

function endpoint(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Model base URL must use http(s), with no embedded credentials, query or fragment");
  }
  url.pathname = `${url.pathname.replace(/\/$/, "").replace(/\/chat\/completions$/, "")}/chat/completions`;
  return url.toString();
}

export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  const result: AgentResult = {
    final: "", modelCalls: 0, toolCalls: 0,
    usage: { promptTokens: null, completionTokens: null, totalTokens: null },
  };
  const maxSteps = Math.min(100, Math.max(1, Math.floor(options.model.maxSteps || 12)));
  const allowed = new Set(options.task.allowedTools);
  const definitions = structuredClone(options.toolDefinitions.filter(item => allowed.has(item.function.name)));
  const observations: ToolObservation[] = [];
  const usageReports = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const seenCallIds = new Set<string>();
  const input = options.taskInput ?? options.task.input;
  const State = Annotation.Root({
    messages: Annotation<Message[]>({ reducer: (_previous, next) => next, default: () => [] }),
    pending: Annotation<Call[]>({ reducer: (_previous, next) => next, default: () => [] }),
    done: Annotation<boolean>({ reducer: (_previous, next) => next, default: () => false }),
    steps: Annotation<number>({ reducer: (_previous, next) => next, default: () => 0 }),
  });

  const graph = new StateGraph(State)
    .addNode("decide", async state => {
      checkAbort(options.signal);
      if (options.mode === "scripted") {
        const lastStatus = (observations.at(-1)?.raw as any)?.status;
        // A known pending/reverted/unknown transaction cannot be treated as a
        // successful prerequisite for the next deterministic action.
        const transactionStopped = ["pending", "reverted", "unknown"].includes(lastStatus);
        const plan = transactionStopped ? [] : scriptedCalls(options.task.id, observations, options.initialState, options.experimentMode);
        const step = plan[state.steps];
        if (!step || observations.at(-1)?.error) {
          const balance = observations.at(-1)?.visible as Record<string, unknown> | undefined;
          result.final = options.task.id === "balance" && !observations.at(-1)?.error ? serialize({
            token: balance?.token, address: balance?.address,
            balanceBaseUnits: balance?.balance, blockHash: balance?.blockHash,
          }) : serialize({ mode: "scripted", note: "Deterministic baseline; task completion is decided by the independent checker", observations });
          return { done: true, pending: [] };
        }
        if (state.steps >= maxSteps) throw new Error("MAX_STEPS_EXCEEDED");
        const call: Call = { id: `scripted_${randomUUID()}`, type: "function", function: { name: step.name, arguments: serialize(step.args) } };
        await options.emit("scripted.step", { step: state.steps + 1, call, inputInterpretation: "fixed-task-plan" });
        return { pending: [call], steps: state.steps + 1 };
      }

      if (state.steps >= maxSteps) throw new Error("MAX_STEPS_EXCEEDED");
      if (!options.model.model.trim()) throw new Error("MODEL_ID_REQUIRED");
      const modelCallId = randomUUID();
      const request = {
        model: options.model.model, messages: state.messages,
        tools: definitions, tool_choice: "auto", stream: false,
        ...(options.model.temperature === undefined ? {} : { temperature: options.model.temperature }),
      };
      const body = serialize(request);
      const url = endpoint(options.model.baseUrl);
      const links = { modelCallId, attempt: 1 };
      // The body logged here is byte-for-byte the JSON body sent below. Headers
      // are deliberately excluded; the recorder additionally redacts secrets.
      await options.emit("model.request", { endpoint: url, request: JSON.parse(body), body, attempt: 1 }, links);
      checkAbort(options.signal);
      result.modelCalls++;
      const timeout = AbortSignal.timeout(options.model.requestTimeoutMs ?? 120_000);
      const requestSignal = AbortSignal.any([options.signal, timeout]);
      let response: Response;
      let responseText: string;
      try {
        response = await fetch(url, {
          method: "POST", headers: {
            "Content-Type": "application/json",
            ...(options.model.apiKey ? { Authorization: `Bearer ${options.model.apiKey}` } : {}),
          }, body, signal: requestSignal, redirect: "error",
        });
        responseText = await response.text();
      } catch (error) {
        await options.emit("model.error", { error: errorText(error), cancelled: options.signal.aborted, timedOut: timeout.aborted, attempt: 1 }, links);
        throw error;
      }
      let data: any;
      try { data = JSON.parse(responseText); }
      catch {
        await options.emit("model.response", { status: response.status, body: responseText, parseError: true, requestId: response.headers.get("x-request-id") }, links);
        throw new Error(`MODEL_INVALID_JSON_HTTP_${response.status}`);
      }
      await options.emit("model.response", { status: response.status, response: data, body: responseText, requestId: response.headers.get("x-request-id") }, links);
      for (const [outputKey, sourceKey] of [["promptTokens", "prompt_tokens"], ["completionTokens", "completion_tokens"], ["totalTokens", "total_tokens"]] as const) {
        const count = data?.usage?.[sourceKey];
        if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
          result.usage[outputKey] = (result.usage[outputKey] ?? 0) + count;
          usageReports[outputKey]++;
        }
      }
      if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
      const message = data?.choices?.[0]?.message;
      if (!message || typeof message !== "object" || message.role !== "assistant") throw new Error("MODEL_ASSISTANT_MESSAGE_MISSING");
      const calls: Call[] = [];
      if (message.tool_calls !== undefined && !Array.isArray(message.tool_calls)) throw new Error("MODEL_INVALID_TOOL_CALLS");
      if ((message.tool_calls?.length ?? 0) > 16) throw new Error("MODEL_TOO_MANY_TOOL_CALLS");
      for (const call of message.tool_calls ?? []) {
        if (call.type !== "function" || typeof call.id !== "string" || !call.id || typeof call.function?.name !== "string" || typeof call.function.arguments !== "string") throw new Error("MODEL_INVALID_TOOL_CALL");
        if (seenCallIds.has(call.id)) throw new Error("MODEL_DUPLICATE_TOOL_CALL_ID");
        seenCallIds.add(call.id);
        calls.push({ id: call.id, type: "function", function: { name: call.function.name, arguments: call.function.arguments }, modelCallId });
      }
      const assistant: Message = {
        role: "assistant", content: message.content ?? null,
        ...(calls.length ? { tool_calls: calls.map(({ modelCallId: _id, ...call }) => call) } : {}),
      };
      if (!calls.length) result.final = typeof message.content === "string" ? message.content : serialize(message.content ?? null);
      return { messages: [...state.messages, assistant], pending: calls, done: calls.length === 0, steps: state.steps + 1 };
    })
    .addNode("tools", async state => {
      const messages = [...state.messages];
      for (const call of state.pending) {
        checkAbort(options.signal);
        const name = call.function.name;
        const links = { toolCallId: call.id, ...(call.modelCallId ? { modelCallId: call.modelCallId } : {}), attempt: 1 };
        result.toolCalls++;
        await options.emit("tool.call", { name, arguments: call.function.arguments, ...links }, links);
        let raw: unknown;
        let visible: unknown;
        let failure: string | undefined;
        let action: Action | undefined;
        let parsed: Record<string, unknown> | undefined;
        let overridden = false;
        let amountIssue: AmountIssue | undefined;
        try {
          if (!allowed.has(name)) throw new Error(`TOOL_NOT_ALLOWED: ${name}`);
          const args = JSON.parse(call.function.arguments);
          if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("TOOL_ARGUMENTS_MUST_BE_OBJECT");
          const provider = new LabActionProvider(definitions, (actionName, actionArgs) => options.executeTool(actionName, actionArgs, { ...links, signal: options.signal }));
          action = provider.getActions().find(value => value.name === name);
          if (!action) throw new Error(`TOOL_NOT_REGISTERED: ${name}`);
          parsed = action.schema.parse(args) as Record<string, unknown>;
          validateTaskAmounts(options, name, parsed, observations);
          await options.beforeTool?.(name, parsed, call.id);
          checkAbort(options.signal);
        } catch (error) {
          if (options.signal.aborted || isFatal(error)) throw error;
          failure = errorText(error);
          amountIssue = error instanceof AmountValidationError ? error.detail : undefined;
          raw = { error: failure, ...(amountIssue ? { ...amountIssue, submitted: false, recoverable: true } : {}) };
          visible = raw;
        }
        // Keep this durable rejection record outside the retryable tool catch.
        if (amountIssue) await options.emit("tool.validation", { name, status: "rejected", ...amountIssue, submitted: false, recoverable: true }, links);
        if (action && parsed && !failure) {
          // Recorder errors propagate out of the graph. In particular, a failed
          // durable pre-tool write must never become a retryable tool response.
          await options.emit("tool.started", { name, args: parsed }, links);
          try {
            raw = JSON.parse(await action.invoke(parsed));
            overridden = Boolean(options.toolOverrides && Object.hasOwn(options.toolOverrides, name));
            visible = overridden ? structuredClone(options.toolOverrides![name]) : raw;
          } catch (error) {
            if (options.signal.aborted || isFatal(error)) throw error;
            failure = errorText(error);
            raw = { error: failure };
            visible = raw;
          }
        }
        await options.emit("tool.result", { name, raw, visible, overridden, ...(failure ? { error: failure } : {}) }, links);
        observations.push({ name, raw, visible, ...(failure ? { error: failure } : {}) });
        if (options.mode === "llm") messages.push({ role: "tool", tool_call_id: call.id, content: serialize(visible) });
      }
      return { messages, pending: [] };
    })
    .addEdge(START, "decide")
    .addConditionalEdges("decide", state => state.done ? END : "tools", [END, "tools"])
    .addEdge("tools", "decide")
    .compile();

  try {
    // Validate tools before any model call or side effect.
    new LabActionProvider(definitions, async () => null).getActions();
    await options.emit("agent.start", {
      mode: options.mode, taskId: options.task.id, input,
      framework: { agentkit: "0.10.4", langgraph: "1.4.18" },
      maxSteps, tools: definitions,
      experimentMode: options.experimentMode ?? "independent",
      amountValidation: options.amountValidation ?? "fixed_task",
      ...(options.mode === "scripted" ? { modelUsed: false, inputInterpretation: "fixed-task-plan" } : {}),
    });
    const contextMessage = {
      role: "system",
      content: `实验环境上下文（程序显式提供并单独记录，不改写用户输入）：\n${serialize({
        experimentMode: options.experimentMode ?? "independent",
        tokenDecimals: 6,
        amountValidation: options.amountValidation ?? "fixed_task",
        units: "所有写入工具的amount、amountIn、minAmountOut只接受人类可读的十进制代币数量字符串；不要乘代币精度，也不要直接填入链状态中的整数。转换只由钱包适配器执行一次。优先读取formatted中的代币数量，原始balances、allowances、shares和get_balance.balance保留整数最小单位供核验。",
        examples: [{ requested: "20 TokenA", toolArgument: { amount: "20" } }, { requested: "0.5 TokenB", toolArgument: { amount: "0.5" } }],
        fixedTaskTargetsInTokens: taskAmountTargets(options.task.id),
        targetPolicy: "任务模板的验收金额固定；修改任务输入不会修改独立检查器的验收目标。fixed_task策略在执行前校验这些金额，错误返回后可用新工具调用纠正；schema_only策略仅校验格式，用于有意研究错误行为。",
        ...(options.initialState ? { initialStateFormatted: formatTokenState(options.initialState), initialState: options.initialState } : {}),
        scope: "本次目标相对本次initialState判定。兑换后存入仅存本次兑换新增的TokenB，保留本次运行前已有的TokenB及份额。",
      })}`,
    };
    await options.emit("agent.context", { message: contextMessage, source: options.initialState ? "run_initial_state_and_unit_contract" : "unit_contract", userInputUnchanged: true });
    await graph.invoke({ messages: [
      { role: "system", content: options.model.systemPrompt ?? "You operate a local Web3 experiment. Use only the supplied tools. Inspect tool results, use the requested amounts and recipient, and report observations accurately. A separate checker judges chain state. Do not claim success without evidence." },
      { role: "user", content: input },
      contextMessage,
    ] }, { recursionLimit: maxSteps * 2 + 5 });
  } catch (error) {
    result.error = errorText(error);
    if (!result.final) result.final = "Agent stopped before a final response. See recorded error and independent checker.";
  }
  // Partial usage is retained in raw response events; do not present a partial
  // subtotal as the complete run cost when a provider omitted any call's usage.
  for (const key of ["promptTokens", "completionTokens", "totalTokens"] as const) {
    if (usageReports[key] !== result.modelCalls) result.usage[key] = null;
  }
  await options.emit("agent.end", { ...result, mode: options.mode });
  return result;
}
