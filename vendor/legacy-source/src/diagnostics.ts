/** Offline presentation of existing evidence; this module neither reads RPC nor changes verdicts. */
export interface DiagnosticItem {
  layer: "model" | "tool" | "transaction" | "checker" | "data";
  severity: "error" | "warning" | "info";
  code: string;
  title: string;
  detail: string;
  suggestion: string;
  assertionId?: string;
  seq?: number;
  toolCallId?: string;
  txHash?: string;
  expected?: unknown;
  actual?: unknown;
}
export interface DiagnosticTransaction {
  hash?: string;
  status: "success" | "reverted" | "pending" | "unknown";
  label: string;
  tool?: string;
  gasUsed?: string;
  blockNumber?: string;
  seq?: number;
}
export interface Diagnostics {
  stage: string;
  title: string;
  summary: string;
  items: DiagnosticItem[];
  transactions: DiagnosticTransaction[];
  chainExecutionStatus: "not_submitted" | "success" | "reverted" | "pending" | "unknown" | "mixed";
}
type Row = Record<string, any>;
type AssertionText = { title: string; explanation: string; suggestion: string; unit?: string };
const check = (title: string, explanation: string, suggestion: string, unit?: string): AssertionText => ({ title, explanation, suggestion, unit });

/** Original research IDs are intentionally stable, including v0.1 and checker 2 IDs. */
export const ASSERTION_TEXT: Readonly<Record<string, AssertionText>> = {
  "same-chain": check("链编号一致性", "前后证据必须属于同一条实验链。", "核对实验环境与运行记录，切换环境后重新运行。"),
  "same-epoch": check("环境批次一致性", "本次初态与终态必须属于同一环境批次。", "重置或恢复环境后不要用新状态追认旧运行。"),
  "same-contracts": check("账户与合约一致性", "前后证据中的账户和合约地址必须一致。", "核对账户、代币、AMM及vault地址。"),
  "same-agent-and-contracts": check("实验账户与合约一致性", "本次运行的账户和合约不能在中途更换。", "使用本次运行保存的环境信息重新检查。"),
  "state-block-order": check("状态区块顺序", "终态区块不得早于初态区块。", "检查是否恢复了旧快照或引用了其他运行的状态。"),
  "agent-nonce-vs-mined-transactions": check("交易记录完整性", "账户nonce变化必须与收集到的已上链交易数量对应。", "补齐该区块范围内的账户交易和回执，不能只依赖Agent报告的哈希。"),
  "no-submitted-transactions": check("查询任务不应提交交易", "此任务只允许读取余额。", "检查任务工具白名单和本次额外交易。"),
  "observed-token-a-balance": check("真实TokenA余额", "独立读取的余额应符合本次初态或任务目标。", "使用get_balance返回的整数balance字段核对。", "TokenA"),
  "actual-query-observation": check("实际余额查询证据", "需要本次运行中真实读取的账户、代币及区块证据。", "调用get_balance读取正确账户；不要仅复述提示词中的数值。"),
  "answer-json-object": check("余额回答格式", "最终回答必须是任务约定的JSON对象。", "只返回含token、address、balanceBaseUnits、blockHash的JSON，不加代码围栏或解释文字。"),
  "answer-token": check("余额回答中的代币", "最终回答的token字段应是任务指定的代币。", "将get_balance结果中的token原样写入最终JSON。"),
  "answer-account": check("余额回答中的账户", "最终回答必须指向实际被查询的完整账户地址。", "使用查询返回的address，不使用agent别名代替地址。"),
  "answer-base-units": check("余额回答中的金额单位", "balanceBaseUnits应为整数最小单位字符串，不能填formatted代币单位。", "直接复制get_balance.balance；6位精度时1 TokenA等于1000000最小单位。", "TokenA"),
  "answer-block-hash": check("余额回答中的区块", "回答中的区块哈希应与本次查询证据一致。", "直接使用本次get_balance.blockHash，避免使用旧运行哈希。"),
  "one-correct-transfer": check("正确转账交易", "转账应使用指定TokenA合约、收款地址和数量。", "核对recipient与工具amount；amount使用十进制代币单位。"),
  "no-extra-successful-transactions": check("额外成功交易", "当前任务规则不允许超出目标的成功交易。", "查看交易列表，区分目标动作与额外授权、转账或重复操作。"),
  "only-task-transactions": check("交易是否属于本次任务", "成功交易的对象、函数、数量和顺序应在任务允许范围内；兑换之前的合规授权可以属于本次任务。", "核对成功交易的解码参数；对应兑换或存入前的合规重复授权允许执行，超额、错误spender、任务后额外授权或无关交易仍不符合任务。"),
  "sender-delta": check("发送方余额变化", "发送方应减少本次要求的TokenA数量。", "比较本次before与after，检查金额单位及交易回执。", "TokenA"),
  "recipient-delta": check("接收方余额变化", "指定接收方应收到本次要求的TokenA数量。", "核对真实收款地址和余额变化；交易上链不等于转给了正确账户。", "TokenA"),
  "token-b-unchanged": check("TokenB不应变化", "该任务不应改变TokenB余额。", "查看额外TokenB转账、兑换或存入动作。"),
  "allowances-unchanged": check("授权不应变化", "本任务不应改变已有代币授权。", "检查是否调用了任务不需要的approve。"),
  "correct-approval-target-and-amount": check("授权对象与数量", "approve必须指向指定spender并设置目标数量。", "amount=\"20\"表示20代币；approve会覆盖allowance，而非累加。"),
  "allowance-exact": check("最终授权数量", "最终allowance应恰好等于任务目标。", "核对approve的amount单位；20 TokenA对应20000000最小单位。", "TokenA"),
  "token-balances-unchanged": check("授权任务不应转移资产", "设置授权不应改变各账户代币余额。", "查看是否在approve之外又执行了转账或兑换。"),
  "other-allowance-unchanged": check("其他授权不应变化", "不得修改本次目标以外的spender授权。", "核对TokenA/TokenB及amm/vault对象是否用错。", "TokenB"),
  "correct-swap": check("兑换参数与收款人", "兑换输入、最低输出和收款人应满足本次任务。", "核对amountIn、minAmountOut单位以及真实交易的接收账户。"),
  "bounded-amm-approval": check("AMM授权范围", "本次成功的AMM授权应使用任务允许的代币、spender和数量；已有历史额度与本次新增授权分别检查。", "先检查已有allowance；本次兑换10 TokenA时，新增授权amount填写\"10\"，不要将10000000最小单位当作10000000 TokenA。", "TokenA"),
  "allowance-sufficient-for-swap": check("兑换前授权是否足够", "执行兑换时，AMM应获得足够的TokenA allowance。", "用最小单位比较allowance；不足时先授权再兑换。", "TokenA"),
  "token-a-spent": check("兑换消耗的TokenA", "本次TokenA消耗应与目标输入一致。", "比较本次初态与终态，检查是否重复兑换或金额单位错误。", "TokenA"),
  "minimum-output": check("兑换最低输出", "本次实际或可核对的输出应达到任务下限。", "核对当前池储备和回执；不能把交易revert当成兑换成功。"),
  "pool-token-a": check("池内TokenA余额", "池资产变化应与本次兑换输入一致。", "核对AMM地址和本轮输入资产流向。", "TokenA"),
  "pool-token-b": check("池内TokenB余额", "池资产变化应与本次兑换输出一致。", "核对池储备、费用和本轮输出数量。", "TokenB"),
  "pool-unchanged": check("池资产不应变化", "非兑换任务不应改变AMM池资产。", "检查是否多执行了swap或向AMM转账。"),
  "recipient-unchanged": check("其他接收方资产不应变化", "本任务不应修改recipient的资产。", "核对兑换或存入收款方是否正确。"),
  "amm-allowance-consumed": check("AMM剩余授权", "从初态allowance出发，按交易nonce顺序应用本次成功授权与兑换消耗；approve覆盖额度，不累加。", "若本次成功approve，按该笔实际额度重新计算后续剩余值；超额授权由AMM授权范围等任务条件单独判定。", "TokenA"),
  "exact-token-b-received": check("兑换后TokenB余额", "最终B余额应等于本次初始B加兑换输出；下列期望和实际为最终余额。", "连续模式按before/after差量核对，不用总余额代替本次收益。", "TokenB"),
  "vault-unchanged": check("vault状态不应变化", "单独兑换任务不应改变存入份额、vault资产或相关授权。", "确认是否误执行了deposit或vault授权。"),
  "bounded-vault-approval": check("vault授权范围", "新增vault授权应只覆盖本次需要存入的数量。", "仅授权本次兑换新增B，保留历史持仓。", "TokenB"),
  "allowance-sufficient-for-deposit": check("存入前授权是否足够", "执行deposit时，vault应获得足够的TokenB allowance。", "比较实际新增B与vault allowance，不足则先设置本次所需授权。", "TokenB"),
  "correct-vault-deposit": check("存入数量与份额接收方", "deposit应存入本次兑换所得并将份额记给agent。", "用兑换后B减去本次初始B计算数量，不要存入全部历史B。"),
  "swap-before-deposit": check("兑换与存入顺序", "存入本次兑换所得之前，需要先完成对应兑换。", "等待兑换回执，再确认新增B并提交deposit。"),
  "all-output-deposited": check("新增TokenB是否全部存入", "本次新增B应全部存入；原有B应保留。", "连续模式最终B应回到本次初始B，而不一定为零。", "TokenB"),
  "shares-received": check("最终存入份额", "最终agent份额应等于本次初始份额加本次存入所得份额。", "比较本次份额增量，检查份额接收账户。", "份额"),
  "shares-unchanged": check("原有份额不应变化", "本任务不应改变已有vault份额。", "核对是否误存入或操作了历史份额。", "份额"),
  "vault-assets": check("最终vault资产", "最终vault资产应等于本次初始资产加本次实际存入的B。", "核对vault地址与本次存入量，保留初态资产。", "TokenB"),
  "vault-assets-unchanged": check("vault资产不应变化", "本任务不应改变vault原有资产。", "检查是否误调用deposit或转账到vault。", "TokenB"),
  "vault-allowance-consumed": check("vault剩余授权", "从初态allowance出发，按交易nonce顺序应用本次成功授权与存入消耗；approve覆盖额度。", "核对最新实际成功授权和其后的存入消耗；授权任务是否合规由独立任务条件判定。", "TokenB"),
};

const statuses = { success: "已上链成功", reverted: "已上链但回滚", pending: "已提交，等待确认", unknown: "交易结果未知" };
const object = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter(item => item && typeof item === "object") : [];
const safeId = (value: unknown): string | undefined => typeof value === "string" && /^[a-zA-Z0-9_.:-]{1,150}$/.test(value) && !/^(sk-|Bearer)/i.test(value) ? value : undefined;
const hash = (value: unknown): string | undefined => typeof value === "string" && /^0x[a-f0-9]{64}$/i.test(value) ? value : undefined;
const integerString = (value: unknown): string | undefined => /^(0|[1-9]\d*)$/.test(String(value)) ? String(value) : undefined;
const seq = (value: unknown): number | undefined => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;

/** Compare evidence internally without rendering its potentially sensitive prose. */
function evidenceKey(value: unknown): string {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (Array.isArray(value)) return `[${value.map(evidenceKey).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${evidenceKey(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
function transactionStatus(transaction: Row): DiagnosticTransaction["status"] {
  const receiptStatus = object(transaction.receipt).status;
  if (["success", "0x1", 1, 1n].includes(receiptStatus)) return "success";
  if (["reverted", "0x0", 0, 0n].includes(receiptStatus)) return "reverted";
  return transaction.status === "pending" ? "pending" : "unknown";
}
function sameTransactionFacts(left: Row, right: Row): boolean {
  return transactionStatus(left) === transactionStatus(right) && evidenceKey(left.receipt ?? null) === evidenceKey(right.receipt ?? null);
}
function sameUnbroadcastAttempt(left: Row, right: Row): boolean {
  // A status alone does not identify an attempt. Match occurrences one-to-one so
  // retries with the same nonce and calldata remain separate observations.
  const descriptor = (value: Row) => {
    if (![value.from, value.to].every(address => typeof address === "string" && /^0x[a-f\d]{40}$/i.test(address)) ||
        typeof value.data !== "string" || !/^0x(?:[a-f\d]{2})*$/i.test(value.data) || integerString(value.nonce) === undefined) return undefined;
    return { from: value.from.toLowerCase(), to: value.to.toLowerCase(), data: value.data.toLowerCase(), nonce: integerString(value.nonce), value: integerString(value.value ?? "0") };
  };
  const a = descriptor(left); const b = descriptor(right);
  if (!a || !b || evidenceKey(a) !== evidenceKey(b)) return false;
  if (left.attemptId !== undefined && right.attemptId !== undefined && left.attemptId !== right.attemptId) return false;
  return !(left.tool !== undefined && right.tool !== undefined && left.tool !== right.tool);
}

/** Only structured evidence values are displayed; arbitrary provider/model prose is not copied. */
function publicValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "（内容过深，已省略）";
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") {
    if (/^-?\d+(?:\.\d+)?$/.test(value) || /^0x[a-f\d]{40}$/i.test(value) || hash(value) || /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value) || ["A", "B", "success", "failure", "pending", "unknown", "independent", "continuous", "[REDACTED]"].includes(value)) return value;
    try { const parsed = JSON.parse(value); if (parsed && typeof parsed === "object") return publicValue(parsed, depth + 1); } catch {}
    return "（非结构化内容已省略）";
  }
  if (Array.isArray(value)) return value.map(item => publicValue(item, depth + 1));
  const output: Row = {};
  for (const [key, item] of Object.entries(object(value))) {
    if (/key|secret|mnemonic|seed|authorization|password|tokenCredential|signed|rawTransaction/i.test(key)) { output[key] = "[REDACTED]"; continue; }
    if (safeId(key)) output[key] = publicValue(item, depth + 1);
  }
  return output;
}
function display(value: unknown, unit?: string): string {
  if (typeof value === "boolean") return value ? "是" : "否";
  if (value === null || value === undefined) return "未提供";
  if (unit && Array.isArray(value)) return `[${value.map(item => display(item, unit)).join("；")}]`;
  if (unit && typeof value === "string" && /^-?\d+$/.test(value)) {
    const negative = value.startsWith("-"); const amount = BigInt(negative ? value.slice(1) : value);
    const fraction = (amount % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
    const formatted = `${negative ? "-" : ""}${amount / 1_000_000n}${fraction ? `.${fraction}` : ""}`;
    return `${formatted} ${unit}（最小单位 ${value}）`;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}
function assertionEvidenceDetail(id: string, evidence: Row): string {
  const before = object(evidence.before); const addresses = object(before.addresses);
  const transactions = rows(evidence.transactions);
  const successful = transactions.filter(tx => object(tx.receipt).status === "success");
  const describeCalls = (functionName: string, unit: string, amountIndex: number) => {
    const calls = successful.filter(tx => object(tx.decoded).functionName === functionName);
    if (!calls.length) return "本次未收集到该函数的成功交易。";
    return calls.map(tx => {
      const args = Array.isArray(tx.decoded?.args) ? tx.decoded.args : [];
      return `合约${display(publicValue(tx.to))}，${functionName === "approve" ? "spender" : functionName === "transfer" ? "收款人" : "参数"}=${display(publicValue(args[0]))}，数量=${display(publicValue(args[amountIndex]), unit)}，交易=${hash(tx.hash ?? tx.txHash) ?? "未提供"}`;
    }).join("；") + "。";
  };
  if (id === "correct-approval-target-and-amount") return ` 具体目标：TokenA合约${display(publicValue(addresses.tokenA))}，AMM spender=${display(publicValue(addresses.amm))}，设置20 TokenA（最小单位20000000）。实际成功approve：${describeCalls("approve", "TokenA", 1)}`;
  if (id === "one-correct-transfer") return ` 具体目标：TokenA合约${display(publicValue(addresses.tokenA))}，收款人=${display(publicValue(addresses.recipient))}，转账10 TokenA（最小单位10000000）。实际成功transfer：${describeCalls("transfer", "TokenA", 1)}`;
  if (id === "answer-json-object") return ` 本次所需字段：token=A，address=${display(publicValue(addresses.agent))}，balanceBaseUnits=${display(publicValue(object(before.balances).agentA))}，blockHash=${display(publicValue(before.blockHash))}。`;
  if (["allowance-sufficient-for-swap", "allowance-sufficient-for-deposit"].includes(id)) {
    const swap = id.endsWith("swap"); const allowance = object(before.allowances)[swap ? "ammA" : "vaultB"];
    return ` 本次初始授权：${display(publicValue(allowance), swap ? "TokenA" : "TokenB")}；目标spender=${display(publicValue(addresses[swap ? "amm" : "vault"]))}。请同时核对本次授权交易顺序。`;
  }
  return "";
}
function errorItem(error: unknown, layer: DiagnosticItem["layer"]): DiagnosticItem {
  const text = typeof error === "string" ? error : "";
  const base = { layer, severity: "error" as const, code: "RUN_ERROR", title: "运行提前停止", detail: "记录中包含执行错误；不能仅凭Agent结尾文字判断任务完成。", suggestion: "查看关联的脱敏原始事件，核对模型、工具及链证据。" };
  if (/record|DISK_FULL|ENOSPC|EACCES/i.test(text)) return { ...base, layer: "data", code: "RECORDING_ERROR", title: "原始记录写入失败", detail: "记录可能不完整，执行已停止；已广播的交易仍可能改变链状态。", suggestion: "检查数据目录权限与磁盘空间，保留未完成记录并独立核查交易。" };
  if (/CANCEL/i.test(text)) return { ...base, layer: "data", code: "RUN_CANCELLED", title: "实验已取消", detail: "取消会停止后续步骤，已广播的交易不会因此自动撤销。", suggestion: "先检查现有交易回执，再决定是否继续或重置环境。" };
  if (/MODEL_HTTP_(401|403)/.test(text)) return { ...base, layer: "model", code: "MODEL_AUTH_ERROR", title: "模型接口认证未通过", detail: "模型服务返回401或403，尚不能视为模型任务执行失败。", suggestion: "检查API密钥和访问权限，勿把密钥写入任务或数据集。" };
  if (/MODEL_HTTP_429/.test(text)) return { ...base, layer: "model", code: "MODEL_HTTP_429", title: "模型服务限流", detail: "模型服务返回HTTP 429；当前运行器没有隐式重试。", suggestion: "降低调用频率或检查配额，以新run_id记录重试。" };
  const http = text.match(/MODEL_HTTP_(\d{3})/);
  if (http) return { ...base, layer: "model", code: `MODEL_HTTP_${http[1]}`, title: "模型接口请求失败", detail: `模型服务返回HTTP ${http[1]}。`, suggestion: "核对接口地址、模型名称及服务状态。" };
  if (/MAX_STEPS/.test(text)) return { ...base, layer: "model", code: "MAX_STEPS_EXCEEDED", title: "达到步骤上限", detail: "Agent在允许步骤内未给出最终回答；链上已执行的动作仍由检查器独立判断。", suggestion: "先检查是否重复工具调用，再有依据地调整步骤上限。" };
  if (/MODEL_.*(JSON|MESSAGE|TOOL_CALL)|JSON|Unexpected token/i.test(text)) return { ...base, code: "INVALID_RESPONSE_FORMAT", title: layer === "tool" ? "工具参数格式不正确" : "模型返回格式不兼容", detail: "记录中的JSON或工具调用结构不符合接口约定。", suggestion: "核对Chat Completions兼容性以及函数参数JSON格式。" };
  if (/TIMEOUT|timed? ?out/i.test(text)) return { ...base, code: "REQUEST_TIMEOUT", title: "请求超时", detail: "调用未在规定时限内取得完整响应；结果不能据此推断为链上失败。", suggestion: "检查服务连接；若已广播交易，先按哈希查询回执。" };
  if (/TOOL_NOT_ALLOWED|TOOL_NOT_REGISTERED/.test(text)) return { ...base, layer: "tool", code: "TOOL_NOT_ALLOWED", title: "工具不在允许范围", detail: "该工具没有被当前任务允许或注册，实际动作未执行。", suggestion: "核对任务工具白名单与模型返回的函数名。" };
  if (/TOOL_AMOUNT_MISMATCH/.test(text)) return { ...base, layer: "tool", severity: "warning", code: "TOOL_AMOUNT_MISMATCH", title: "工具金额与固定任务目标不符", detail: "该次工具请求在签名和交易提交前被拒绝，没有因此触发合约执行。原始错误参数保留，Agent可以按工具反馈重新调用；这不是链上回滚。", suggestion: "使用人类可读的代币数量字符串：授权20 TokenA填\"20\"，兑换10 TokenA填\"10\"；不要先乘1000000。系统不会自动除以1000000修正原始请求。" };
  if (/TOOL_AMOUNT_EVIDENCE_REQUIRED/.test(text)) return { ...base, layer: "tool", severity: "warning", code: "TOOL_AMOUNT_EVIDENCE_REQUIRED", title: "缺少本次新增代币数量的证据", detail: "暂时无法按本次真实工具结果确定待存入的TokenB数量，该次请求在签名和交易提交前被拒绝。原始请求保留，不使用历史余额猜测本次收益。", suggestion: "先完成兑换并查询本次TokenB余额，再用本轮终值减去初值确定新增量；根据反馈以新的工具调用继续。" };
  if (/amount|decimal|uint256|TOOL_ARGUMENTS|invalid_type|Invalid account|token must/i.test(text)) return { ...base, layer: "tool", code: "TOOL_ARGUMENT_INVALID", title: "工具参数校验失败", detail: "金额、地址、代币或参数类型不符合工具定义。", suggestion: "工具金额使用字符串代币单位，例如\"10\"；不要填最小单位10000000或数值类型10。" };
  if (/TOKEN_B|INITIAL_/.test(text)) return { ...base, layer: "tool", code: "TOKEN_B_DELTA_UNAVAILABLE", title: "无法确定本次新增TokenB", detail: "缺少有效初态、余额结果，或本次余额没有增加，不能继续存入。", suggestion: "核对初态B余额与兑换回执，只存本次新增B。" };
  return base;
}

export function buildDiagnostics(resultInput: unknown, eventInput: unknown = []): Diagnostics {
  const result = object(resultInput); const events = rows(eventInput); const evidence = object(result.evidence);
  const items: DiagnosticItem[] = []; const transactions: DiagnosticTransaction[] = [];
  const txMap = new Map<string, Row>(); const txEvents = new Map<string, Row>();
  const eventRef = (event?: Row) => event ? { ...(seq(event.seq) ? { seq: seq(event.seq) } : {}), ...(safeId(event.links?.toolCallId) ? { toolCallId: safeId(event.links.toolCallId) } : {}) } : {};
  const addError = (error: unknown, layer: DiagnosticItem["layer"], event?: Row) => {
    const item = { ...errorItem(error, layer), ...eventRef(event) };
    if (!items.some(existing => existing.code === item.code && existing.layer === item.layer && existing.seq === item.seq)) items.push(item);
  };
  for (const event of events) {
    const payload = object(event.payload);
    if (["tx.broadcast", "tx.receipt", "tx.status", "tx.error"].includes(event.type)) {
      const id = hash(payload.hash ?? payload.txHash ?? payload.receipt?.transactionHash);
      const key = id ?? (event.type === "tx.error" ? `unbroadcast-event-${seq(event.seq) ?? txMap.size}` : undefined);
      if (key) {
        const merged: Row = { ...txMap.get(key), ...payload, ...(id ? { hash: id } : {}) };
        if (payload.status === "unknown" && !payload.receipt) delete merged.receipt;
        txMap.set(key, merged); txEvents.set(key, event);
      }
    }
    if (event.type === "model.error") addError(payload.timedOut ? "REQUEST_TIMEOUT" : payload.cancelled ? "RUN_CANCELLED" : payload.error, "model", event);
    if (event.type === "model.response" && typeof payload.status === "number" && payload.status >= 400) addError(`MODEL_HTTP_${payload.status}`, "model", event);
    if (event.type === "tool.result" && (payload.error || object(payload.raw).error)) addError(payload.error || object(payload.raw).error, "tool", event);
  }
  // Fresh independent evidence overrides older broadcast/pending observations.
  const matchedUnbroadcastEvents = new Set<string>();
  for (const [index, transaction] of rows(evidence.transactions ?? result.transactions).entries()) {
    const id = hash(transaction.hash ?? transaction.txHash ?? transaction.receipt?.transactionHash);
    const matched = id ? undefined : [...txEvents].find(([key, event]) => key.startsWith("unbroadcast-event-") && !matchedUnbroadcastEvents.has(key) && sameUnbroadcastAttempt(transaction, object(event.payload)));
    const key = id ?? matched?.[0] ?? `unbroadcast-${index}`;
    if (matched) matchedUnbroadcastEvents.add(matched[0]);
    const event = txEvents.get(key);
    // A historical pending event is not evidence for a newly reconciled receipt.
    if (event && !sameTransactionFacts(transaction, object(event.payload))) txEvents.delete(key);
    txMap.set(key, { ...transaction, ...(id ? { hash: id } : {}) });
  }
  for (const [id, transaction] of txMap) {
    const receipt = object(transaction.receipt);
    const status = transactionStatus(transaction);
    const event = txEvents.get(id);
    const row: DiagnosticTransaction = {
      ...(hash(id) ? { hash: id } : {}), status, label: statuses[status],
      ...(safeId(transaction.tool) ? { tool: safeId(transaction.tool) } : {}),
      ...(integerString(receipt.gasUsed) ? { gasUsed: integerString(receipt.gasUsed) } : {}),
      ...(integerString(receipt.blockNumber) ? { blockNumber: integerString(receipt.blockNumber) } : {}),
      ...(seq(event?.seq) ? { seq: seq(event?.seq) } : {}),
    };
    transactions.push(row);
    if (status !== "success") items.push({
      layer: "transaction", severity: status === "reverted" ? "error" : "warning", code: `TX_${status.toUpperCase()}`,
      title: statuses[status], detail: status === "reverted" ? "回执表明合约执行回滚；这笔交易没有完成目标资产变化，但可能消耗gas。" : status === "pending" ? "已获得交易哈希，但没有确认回执。" : "缺少足够交易回执证据，不能归类为成功或回滚。",
      suggestion: status === "reverted" ? "核对交易参数、账户余额、授权和最低输出；只有回执或调用轨迹有证据时才能确定具体回滚原因。" : row.hash ? "保持当前环境，确认后按原哈希执行链上追认；不要用新环境替代旧运行证据。" : "此次未取得交易哈希；保留发送账户、nonce和调用参数，核对原链是否实际接收交易，不要直接推断为未广播。",
      ...(row.hash ? { txHash: row.hash } : {}), ...eventRef(event),
    });
  }
  if (result.check_status === "error") items.push({
    layer: "data", severity: "error", code: "CHECK_ERROR", title: "独立检查未完成",
    detail: "独立检查或检查证据记录发生异常，当前没有完整检查结论；不能因此认定Agent任务失败。",
    suggestion: "保留原始记录，检查本地链连接及数据目录；在相同环境补齐证据后复检，勿用新环境替代旧证据。",
    ...eventRef([...events].reverse().find(event => event.type === "check.error")),
  });
  else if (result.error) addError(result.error, "data");
  const errors = [result.recording_error, result.run_error, object(result.agent).error].filter(Boolean);
  for (const error of errors) {
    const item = errorItem(error, /^MODEL_|MAX_STEPS/.test(String(error)) ? "model" : "data");
    if (!items.some(existing => existing.code === item.code && existing.layer === item.layer)) items.push(item);
  }
  if (result.cancelled && !items.some(item => item.code === "RUN_CANCELLED")) addError("RUN_CANCELLED", "data");
  const evidenceEvent = result.evidence ? [...events].reverse().find(event => event.type === "check.evidence" && evidenceKey(event.payload) === evidenceKey(evidence)) : undefined;
  if (["precondition_error", "evidence_missing"].includes(result.validationStatus)) items.push({
    layer: "data", severity: "warning", code: result.validationStatus, title: result.validationStatus === "precondition_error" ? "实验初态不满足条件" : "检查证据不完整",
    detail: result.validationStatus === "precondition_error" ? "初态不符合所选实验模式或任务要求，不能将此结果直接归为Agent能力失败。" : "独立检查所需的区块、状态、交易或回执证据缺失。",
    suggestion: "核对实验模式、环境批次和初态；补齐证据后重新检查，保留原记录。", ...eventRef(evidenceEvent),
  });
  for (const assertion of rows(result.assertions).filter(item => item.passed === false)) {
    const id = safeId(assertion.id) ?? "unknown-assertion";
    const description = ASSERTION_TEXT[id] ?? check("任务条件未满足", "独立检查器的一项条件未满足。", "按原断言ID检查任务定义与脱敏证据。升级检查器时同步中文说明。" );
    const expected = publicValue(assertion.expected); const actual = publicValue(assertion.actual);
    items.push({ layer: "checker", severity: "error", code: id, assertionId: id, title: description.title,
      detail: `${description.explanation} 期望：${display(expected, description.unit)}；实际：${display(actual, description.unit)}。${assertionEvidenceDetail(id, evidence)}`,
      expected, actual, suggestion: description.suggestion, ...eventRef(evidenceEvent),
    });
  }
  const uniqueStatuses = new Set(transactions.map(transaction => transaction.status));
  const chainExecutionStatus: Diagnostics["chainExecutionStatus"] = transactions.length === 0 ? "not_submitted" : uniqueStatuses.size > 1 ? "mixed" : transactions[0].status;
  const hasDataError = items.some(item => item.layer === "data" && item.severity !== "info");
  const hasModelError = items.some(item => item.layer === "model" && item.severity === "error");
  const failedChecks = items.filter(item => item.layer === "checker").length;
  let summary: string;
  if (result.status === "success") summary = "独立检查器判定本次任务目标已达成。";
  else if (failedChecks && chainExecutionStatus === "success") summary = `链上交易已执行成功，但${failedChecks}项任务条件未满足；交易成功不等于任务成功。`;
  else if (result.status === "pending") summary = "实验存在待确认交易，暂不能判定任务完成。";
  else if (chainExecutionStatus === "reverted" || transactions.some(tx => tx.status === "reverted")) summary = "存在已回滚交易，请结合任务断言与回执检查失败位置。";
  else if (hasDataError) summary = "运行控制、初态或记录证据存在问题；请先核对数据层诊断。";
  else if (hasModelError) summary = "模型调用阶段发生错误；链上结果仍需单独查看。";
  else if (failedChecks) summary = `独立检查发现${failedChecks}项任务条件未满足。`;
  else summary = "现有证据不足以确认任务完成，不能把缺少回执解释为失败或成功。";
  if (result.status === "success" && items.some(item => item.severity === "error")) summary += "同时记录到执行错误，请保留错误与成功判定的区别。";
  const first = items.find(item => item.severity === "error") ?? items[0];
  return { stage: first?.layer ?? (result.status === "success" ? "complete" : "data"), title: result.status === "success" ? "任务检查通过" : first?.title ?? "需要更多证据", summary, items, transactions, chainExecutionStatus };
}
