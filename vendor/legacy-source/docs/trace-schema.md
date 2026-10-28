# V0.13 执行轨迹与溯源图数据格式

本版把 Agent 的实际执行过程转为可核对的轨迹与通用溯源图。显示及发布包版本为 `V0.13`，程序版本为 `0.1.3`，修订标识为 `beta-1`；轨迹和图的 `schema_version` 仍为 `1.0`。本版新增可选的任务参数和父运行引用，轨迹构建器版本为 `1.2`、图构建器版本为 `1.1`；旧包缺失字段保持缺失，不改写历史证据。使用者已选择通用格式；本实现不声称符合某个特定 PGG 论文协议或 W3C PROV 规范。

## 如何取得文件

运行结束后，便利文件自动保存在 `data/derived/<run_id>/`，完整实验包也包含这些文件。GUI 可查看执行轨迹与可点击的图节点，并分别下载执行轨迹 JSON、图 JSON、GraphML。原“导出实验包”入口继续保留全部原始记录。

| 文件 | 用途 |
|---|---|
| execution-trace.json | 模型、工具、合约调用、交易、内部调用帧和显式关系 |
| execution-trace.md | 可直接阅读的步骤关系及详细参数、返回值、回执 |
| provenance-graph.json | 统一 nodes/edges 有向多重图 |
| provenance-graph.graphml | GraphML 图文件，用于支持该格式的图分析工具 |
| nodes.csv | 节点表；复杂属性在 attributes_json 列 |
| relations.csv | 边表及原始事件序号 |
| trace-events.jsonl | 展开 payload 的原始事件便利副本，无需逐个打开 blobs |
| execution-trace-manifest.json | 上述派生文件哈希和原始 manifest 哈希 |

这些都是派生视图。原始 `events.jsonl`、`blobs/`、`manifest.json` 保持不变，导出时根据通过校验的原始记录重新生成视图。文件哈希校验不等同于数据来源真实性证明。CSV 对公式起始字符进行转义；需要精确原值时使用 JSON。

已有实验包可在不启动模型或链的情况下重新生成文件，Windows 示例：

```powershell
.\runtime\node.exe .\dist\cli.mjs trace-files .\experiment.json .\trace-output
```

`trace-output` 应为新的空目录；同名文件已存在时拒绝覆盖。也可用 `trace <bundle.json>` 或 `graph <bundle.json>` 输出 JSON。Mac 使用本机架构对应的 `runtime/darwin-arm64/node` 或 `runtime/darwin-x64/node`。旧包不能凭空补齐以前没有采集的只读合约调用或内部调用轨迹。

## 原始关联字段

模型请求和响应使用 `links.modelCallId`；工具的 call、started、result 使用 `links.toolCallId`，由模型触发时同时保留 modelCallId。合约调用新增 `links.contractCallId`，相同编号写入相关交易准备、广播、状态、回执和调用轨迹事件。每个事件还有 run_id、event_id、seq、时间和内容寻址 payload_ref。

`contract.call` 包含 callId、kind（read 或 transaction）、tool、chainId、contract.address/label、function.name/signature/selector/args、request。`contract.result` 包含状态、结果或错误、耗时，以及可取得时的交易哈希和区块。函数参数使用实际 ABI 编码前的值；交易 calldata 保留真实字节。只读调用固定区块，记录真实返回值，不伪造交易哈希。

后台初始化、独立检查器状态采集与 Agent 主动调用区分开。只有工具实际请求 `get_state` 时，其合约读取才记为该工具的子调用。参数未通过校验时不会伪造合约调用；提交前取消与广播后未知结果也分别保留。

## 通用图结构

V0.13 的 `task.task_parameters` 来自采集时保存的 `config.taskParameters`，与脚本、工具金额校验和检查器使用同一目标。旧包不把当前默认参数补写成历史采集值。

续行创建新的运行编号。`continuation.parent` 保存父运行编号、父封存清单哈希、原始事件引用及继承交易；`state.continuation` 保存本轮出块后的真实观察。`continues_agent` 表示显式会话恢复，`observes_after_mining` 指向新观察。父工具结果用 `external_tool_result` 节点、`references_parent_tool_result` 和 `provides_parent_result` 连线表示，节点属性保留真实上游 `run_id`、事件编号及负载引用，`loaded:false` 明确上游全文未内联。本轮可点击来源指向本轮的父引用事件，不会把父事件序号错当成本轮序号。

原运行里记录为 pending 的工具结果保持原值；刷新后的回执属于新的观察和检查证据，不改成旧工具当时已知的信息。重复出现的父交易按哈希去重，不能把会话恢复推断为重新调用工具或重新提交交易。子运行交易/gas 为 `transaction_scope=cumulative_task`，模型调用/token 为 `model_scope=current_run`；汇总父子成本时需按交易哈希去重。

```json
{
  "schema_version": "1.0",
  "format": "web3-agent-provenance-graph",
  "run_id": "实际实验编号",
  "directed": true,
  "multigraph": true,
  "nodes": [{"id":"工具实体ID","type":"tool_call","label":"工具 swap","attributes":{},"source_events":[]}],
  "edges": [],
  "provenance": {},
  "summary": {},
  "warnings": []
}
```

节点类型：task、model_call、tool_call、contract_call、transaction、evm_call、contract、address、state、run_reference。contract_call 是一次活动，contract 是可被多次调用的合约地址资源，两者不同。节点 ID 和边 ID 在单次运行图内唯一；不将裸地址视为跨不同链环境的同一对象。

| 关系 | 方向及依据 |
|---|---|
| supplies_task_input | 任务 → 首次包含该任务输入的模型请求 |
| scripted_task_step | 任务 → 实際脚本步骤引用的工具 |
| requests_tool | 模型调用 → 以显式 modelCallId 关联的工具调用 |
| provides_result | 工具 → 后续模型请求中实际出现的 tool_call_id 引用 |
| invokes_contract | 工具 → 以显式编号关联的合约调用 |
| prepares_transaction | 合约调用或工具 → 仅准备、尚无提交证据的交易对象 |
| attempts_submission | 合约调用或工具 → 已尝试发送但没有哈希的未知结果 |
| submits_transaction | 合约调用或工具 → 有广播或链上证据的交易 |
| references_transaction | 已有关联记录，但提交证据不足，不声称已广播 |
| evm_trace_root、evm_child_call | 交易 → EVM 根调用；父调用 → 子调用，依据 callTracer |
| invokes_address、sends_to、originates_from、evm_calls_address | 活动与实际目标/来源地址的关系，方向以边字段为准 |
| has_initial_state、has_final_state | 任务 → 该轮前后状态快照，不推断某个工具独自产生了全部变化 |
| follows_run | 上一轮引用 → 当前任务，只表示已记录的会话顺序 |

每个节点和边的 source_events 可定位原始 seq、event_id 和 payload_ref。没有显式关系时保留缺失提示，不能依靠事件相邻就断言因果。provides_result 只表明结果进入后续请求，不证明模型实际使用了它。重复调用和重试保留为独立实体，多条不同关系可以连接同一对节点。

模型响应中的工具提议不等于实际执行。模型消息只记录接口实际输出，内部 EVM 调用帧也不是模型内部思维。余额读取成功、交易执行成功与任务检查通过分别判断。

## 内部调用与 GraphML

能取得 Anvil `callTracer` 时，保留完整原树，并展开 CALL、STATICCALL 等调用帧及父子关系，包括地址、输入、输出、value、gas、gasUsed、错误。缺少 trace 时标记缺失，不生成假子调用。未知合约 ABI 只保留地址、selector 和 calldata，不猜测函数名或参数含义。

GraphML 输出平面的有向图，允许多重边；应用属性和事件引用分别写入 `attributes_json`、`source_events_json` 字符串。XML 的 id 编码后保证可用，原图 ID 保存在 `original_id`。GraphML 和 JSON 图的节点、边、属性可相互核对。[NetworkX 的官方 GraphML 文档](https://networkx.org/documentation/stable/reference/readwrite/graphml.html)提供相应读取接口；本项目的 `scripts/validate-graph.py` 可先核对 XML 与 JSON，安装 NetworkX 时还验证实际导入。

GUI 大图预览会明确限制显示数量，JSON 和 GraphML 下载保持全量。离线复检与后续链上追认不会改写原运行图；pending 运行出块后，原图依然表示当时的证据，后续追认结果在独立派生检查记录中。

## API

本地 GET `/api/runs/<id>/trace` 返回轨迹 JSON，`?format=markdown` 或 `jsonl` 返回对应文件；`/api/runs/<id>/graph` 返回图 JSON，`?format=graphml` 或 `csv` 返回图文件或边表。专用导出要求原始记录已封存且通过校验。运行详情的 execution_trace 和 execution_graph 允许显示正在采集的部分记录，不应将其误作完整封存数据。


## trace-2 金额校验与换算证据

本次仍使用兼容的schema_version 1.0；执行轨迹builder_version为1.1。task.amount_validation记录fixed_task、schema_only或legacy_unspecified。原始tool.call保存模型原提议，tool.validation记录签名前拒绝及期望的普通代币数量；对应工具派生状态为rejected，execution_started=false、submitted=false。显式拒绝时缺少tool.started不算漏采，且不生成合约或交易节点。

contract.call和交易描述新增amountConversions数组，每项为parameter、token、unit（token）、decimals（6）、input（原始工具数量字符串）与baseUnits（已编码的真实整数）。它从实际ABI参数取值，不再次解析或转换。get_state与初终态添加formatted便利视图，原始balances、allowances等字段仍为最小单位字符串。未知或旧字段不会由新版补造。

校验策略不更改原始模型提议；被拒绝的调用和纠正后的新调用拥有各自toolCallId。原始结果与模型可见替换结果继续分别保存。图源引用包含tool.validation，可检查拒绝来自工具执行前约束，而非链上回滚。
