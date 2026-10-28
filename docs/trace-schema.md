# V0.15.3 证据、执行轨迹与离线读取

平台保留三类证据，不能将不同模块的 JSON 当成同一 schema。包内完整性与业务合规是两种检查；通过哈希校验不代表任务成功，也不认证采集者身份。保留原始构建、版本及失败状态，不用新版默认值补写历史记录。

## 读取入口

| 证据类型 | 标识与结构 | CLI |
| --- | --- | --- |
| 原单 Agent 实验包 | 保留原 manifest、`events.jsonl`、内容寻址 blobs 与派生轨迹；原轨迹/图 schema 为 `1.0` | `node dist/cli.mjs verify/check <bundle.json>`，分派到固定兼容读取器 |
| 多 Agent / 任务中心场景包 | `format: web3-agent-scenario`，`version: 2`，`files` 含 `manifest.json`、`raw/events.jsonl` 和负载 | `node dist/cli.mjs verify/replay/check <bundle.json>` |
| 跨路径预算包 | `format: web3-agent-budget-experiment`，`version: 1`，包含 `evidence.json` 与完整性清单 | `node src/budget/cli.mjs verify/check <bundle.json>` |

便携包将 `node` 换成 `runtime\node.exe`。参数中的斜杠表示可选命令，实际执行时只能选一个，例如 `node dist/cli.mjs verify examples/v2/peer-normal.json`。离线命令不继续任务、不调用模型或链。预算 CLI：退出 0 为成功，`check` 退出 2 为预算等业务断言未通过，退出 1 为格式或完整性错误。

## 单 Agent 历史轨迹

原始事件保留 `run_id`、`event_id`、`seq`、时间和 `payload_ref`；`links.modelCallId`、`toolCallId`、`contractCallId` 关联模型、工具、合约请求及交易。原始 `events.jsonl`、`blobs/` 和 `manifest.json` 是证据基础，轨迹和溯源图是可重建的派生视图。

保留的派生文件包括 `execution-trace.json/.md`、`provenance-graph.json/.graphml`、`nodes.csv`、`relations.csv`、`trace-events.jsonl` 及派生哈希清单。JSON 保存精确原值；CSV 可能为显示和公式安全做转义。一般有向多重图并不宣称符合特定论文协议或 W3C PROV 标准。

历史单 Agent 的 `trace`、`graph`、`trace-files` 等专用命令可直接通过 `node vendor/v013-cli.mjs` 使用。`trace-files` 要求新的空输出目录；旧证据不能凭空补齐当时未采集的内部调用或只读信息。具体字段与续行去重规则见[原格式说明](archive/v0.13/trace-schema.md)。

## 场景记录

场景包以同一 `scenarioId` / `episodeId` 汇总多个主体的事件。全局 `logicalClock` 表示记录顺序；独立 `streamId` 与 `seq` 表示流内顺序；`causalEventIds` 指向已记录的因果来源。`payloadRef` 与 manifest 校验每份负载。记录顺序不是链上共识或严格的分布式时间证明。

`verify` 核对内部文件、事件序列、引用与负载哈希；`replay` 展示记录顺序；`check` 从封存的检查证据重新计算任务结论。服务购买与旧任务封存证据按相应检查器分派，不执行包内代码。格式实现位于 `src/control/offline.mjs`、`src/scenario/`。

## 跨路径预算证据

`evidence.json` 记录实际配置、执行与会话 ID、owner/spender/recipient、代币及 Permit2 地址、初末余额与区块、入口账本、许可结构、签名哈希、第三方兑现交易、原始回执及日志、签名器审计和检查结论。金额配置为十进制字符串，链上金额和计数使用六位最小单位的整数字符串。

Checker 从指定代币原始 `Transfer` 日志提取 owner 的转出，按交易哈希与日志索引核对，并与余额减少额及账本比较。前置 ERC-20 `approve` 只是额度，不作为测试代币已支出。分离模式的正常交易计数可能小于实际累计流出；统一模式还需要核对未兑现预算预留。

“复现超支”与“预算检查未通过”可以同时成立：前者说明观察到了目标现象，后者说明业务行为违反预算。分离计数对照的统一承诺检查为不适用，不能据此宣称全部检查通过。包中不导出私钥、模型 Key 或可再次兑现的原始签名。

页面可离线打开旧 V0.15.2 与当前格式，但不会恢复运行目录或重放签名。预算样例见 [examples/budget-v0153](../examples/README.md)，操作与边界见 [V0.15.3 手册](操作手册_V0.15.3.md)。