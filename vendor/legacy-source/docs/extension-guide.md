# 研究扩展接口说明

V.011新增：运行配置experimentMode默认independent，可设continuous；initialState传入Agent并记录为环境上下文。连续状态继承与失败诊断见版本说明。

本说明对应当前源码，供后续加入模型、任务和干预实验。先保留一个通过的基准运行，再改变一个变量；同一实验的原始文件不得原地修改。升级程序后重新构建，让新的源码哈希进入配置。

## 1. 更换模型或输入

GUI 的模型配置传入 `runAgent()`：`baseUrl`、`model`、`apiKey`、`temperature`、`maxSteps`、`systemPrompt`。运行器另支持 `requestTimeoutMs`，默认每次请求 120 秒；`maxSteps` 默认 12，上限 100。任务输入通过 `taskInput` 替换。密钥只用于请求头，记录器会移除敏感字段和已知密钥。

`baseUrl` 通常填服务的 `/v1` 根地址，运行器拼接 `/chat/completions`；也接受完整 `/chat/completions` 地址。当前接口为 `POST`、`stream:false`、`messages` 与 function tools。模型服务必须返回 `choices[0].message`，工具调用应包含稳定的 `id`、`function.name` 与 JSON 字符串 `function.arguments`。不支持的参数应按服务要求调整适配代码，并保持实际请求记录。

切换到 Anthropic 原生协议、Responses 等其他协议时，应在 `src/agent.ts` 的模型调用节点增加传输适配器，不能只更改 URL。保留以下证据：发送的消息与参数、完整接口响应、请求标识、调用顺序、错误和 usage。不要在记录中加入认证请求头，也不要索取隐藏思维。

`scripted` 是固定计划基线：修改自然语言输入不会改变其 10 TokenA 转账等固定动作。研究自然语言任务遵从性时使用 `llm` 模式。模型供应商的非确定性、失败和不完整 usage 必须保留；本运行器不隐式重试 HTTP 请求。

## 2. 更换模型看到的工具结果

GUI 的工具结果覆盖 JSON 对应 `toolOverrides`，例如：

```json
{"get_balance":{"token":"A","formatted":"999","balance":"999000000","address":"实验账户地址","blockHash":"被报告的区块哈希"}}
```

运行器先执行真实工具，将结果记录为 `tool.result.raw`，再将该工具对应覆盖值记录为 `tool.result.visible`，并把 visible 发送给模型。覆盖按工具名应用于该次运行中的每次同名调用。没有配置覆盖的工具保持原输出。覆盖不会取消真实交易，也不会修改链上状态。

故障模式 `transfer_revert` 和 `wrong_recipient` 是当前服务提供的两个可选干预样例，仅适用于 `scripted` 转账任务；它们在执行前记录原参数与有效参数。需要按调用次数、上下文或概率覆盖时，可把映射改为函数接口，但必须额外保存干预规则、随机种子、被命中的调用 ID 和原始结果。

## 3. 暂停与交易提交接口

| 位置 | 当前源码接口 | 行为 |
| --- | --- | --- |
| 工具调用前 | `AgentOptions.beforeTool(name,args,callId)` | 参数校验后、真实动作执行前等待；可由服务的 GUI 暂停/继续/取消控制 |
| 交易提交前 | `ChainLab.execute(...,{beforeSubmit(descriptor)})` | 交易参数准备及记录后、钱包广播前等待 |
| 事件采集 | `emit(type,payload,links)` | 等待原始事件写入；记录失败时不得继续后续侧作用 |
| 取消 | `AgentOptions.signal` | 中止模型 HTTP 请求，并在工具边界停止；已广播交易仍须由检查器确认状态 |

`ToolContext` 包含 `toolCallId`、可选 `modelCallId`、`attempt` 和 `signal`。模型接口中的工具 ID 应原样保留。同一模型回复包含多个工具时，本版顺序执行。图的状态位于进程内，关闭程序后不能从暂停节点继续；应读取旧轨迹或创建新的重新运行。

## 4. 增加工具或任务

新增工具通常涉及三个明确位置：

1. `src/tasks.ts` 的 `toolDefinitions`：写明函数名、参数含义、单位和必填项。当前 Zod 转换支持 object、string、number、integer、boolean、array 和 enum；金额的精度/取值约束还在链适配器中检查。复杂 JSON Schema 约束需扩展并测试转换器。
2. `src/chain.ts` 的 `execute()`：实现只读查询或交易，并在读数中绑定区块；交易走已有准备、暂停、广播、回执和轨迹采集边界。
3. 相应任务的 `allowedTools`：明确暴露该工具。本版不会自动暴露 SDK 默认钱包工具。

新增任务还需扩展 `TaskId`、`TASKS`、`src/checker.ts` 的独立断言与测试；如果希望提供脚本基线，再扩展 `src/agent.ts` 的 `scriptedCalls()`。只修改用户提示词不会自动产生新的任务完成标准。保持初始余额、合约地址、允许的交易、目标状态、失败和未知条件都可检验。

余额查询任务要求最终回复为 JSON：

```json
{"token":"A","address":"实际账户地址","balanceBaseUnits":"100000000","blockHash":"实际区块哈希"}
```

检查器核对独立链状态和原始读取证据。其余任务检查交易收款方、解码参数、回执和状态变化；Agent 的自然语言“成功”不构成完成证据。新增真实协议时必须另写该协议的状态/份额检查，不能复用实验 AMM 的固定公式。

## 5. 回放、重新运行和验证

轨迹回放读取 `events.jsonl` 与 payload 文件，不调用模型、工具或链。独立实验重新运行会创建新的 run ID，恢复实验基线并再次调用模型/工具；旧运行与新运行通过父 run ID 关联。手工出块、取消或干预过的运行，应保留这些控制事件，不能把结果差异解释为模型差异而忽略环境操作。

原始运行目录与派生检查结果分开。检查器版本变化后生成新结果文件；哈希校验用于发现损坏，不证明文件未被恶意重写。发布实验数据前保留其 `data_origin`：固定脚本、协议模拟服务和真实模型运行不得混为一类。

开发验证入口：`pnpm typecheck`、`pnpm test`、`pnpm build`。`tests/agent.test.ts` 包含 synthetic model protocol 测试，并使用真实 Anvil 执行工具；它验证接口和状态链路，不衡量真实大模型能力。外部模型、外部 RPC 的可用性和不同机器上的 macOS 启动仍应单独记录实测结果。

启动应用且没有正在运行的实验时，执行 `node scripts/model-e2e.mjs` 可对本机服务做完整接口集成测试。脚本会恢复基线、运行五种任务及一次模型 HTTP 429 故障，使用临时的本地协议模拟服务，不需要模型 API 账户；它检查原始记录、脱敏、离线检查和导出。所有运行标记为 `protocol_fixture`。可用 `LAB_URL` 指定应用地址，`LAB_MODEL_REPORT` 指定报告路径；默认报告为 `data/model-e2e-report.json`。此命令会改变当前实验链状态，应在独立测试时执行。

## V.011 接口与结果版本

checkTask第7个参数和ChainLab.check第6个参数接收{experimentMode}，默认independent兼容旧记录。checker 2.0.0使用本轮前后状态计算连续模式增量；旧结果不自动重写。src/diagnostics.ts的buildDiagnostics只从已记录证据派生中文提示，不修改任务结论。GUI对金额使用BigInt，不能把最小单位字符串直接转Number。beginRunCapture仅清当轮缓存；hasPendingTransactions同时检查pending和queued；导出的environment.initial只归档真实起点，不提供自动加载承诺。
