# Web3 Agent Lab

当前版本 **V0.13 Beta**（程序版本 `0.1.3`，修订 `beta-1`，检查器 `2.2.0`，2026-10-19）。本版逐项修复真实使用反馈：图的关系筛选与交互、档案搜索和双状态筛选、模型与任务配置展示、手动出块时间、自定义任务目标，以及出块后的 Agent 会话续行。逐条原因、改动、操作和验证见 [V0.13 更新说明](docs/版本说明_V0.13.md)。

授权与兑换的工具金额采用人类可读单位，例如 6 位小数代币的 `"20"` 只在合约编码时转为 `"20000000"`。本次 `taskParameters` 同时驱动脚本基线、工具金额校验和独立检查器；可声明兑换 `30`、最低输出 `27`，或从支持的中英文模板和参数 JSON 提取。冲突或歧义明确拒绝。默认在签名前拒绝不符合本次任务目标的金额，保留错误提议并允许 Agent 纠正；可显式切换仅格式校验开展错误行为实验。

执行轨迹关联任务、模型、工具、合约调用、交易与 EVM 内部调用，保留原始/可见结果及来源事件。图可按关系类型筛选、按颜色区分，点击节点或连线高亮，缩放、拖动、展开大视图和更多节点；下载保留完整图。轨迹回放不调用模型；「出块并继续 Agent」恢复原模型历史并追加最新链状态，创建关联子运行，沿原任务起点累计检查。数据格式见 [执行轨迹与溯源图说明](docs/trace-schema.md)。

[GitHub 仓库](https://github.com/ZhanHaowen/Web3-Agent-Lab) · [V0.13 下载页](https://github.com/ZhanHaowen/Web3-Agent-Lab/releases/tag/v0.13) · [V0.12 历史版本](https://github.com/ZhanHaowen/Web3-Agent-Lab/releases/tag/v0.12)

一个可在 Windows 和 macOS 部署的本地 Web3 Agent 实验平台。原生 Anvil 执行真实 EVM 交易，浏览器 GUI 操作实验，AgentKit ActionProvider 与 LangGraph 组织工具和模型调用，独立检查器读取链上证据。

## 开箱使用

1. 将对应系统 ZIP 完整解压到可写目录。Windows x64 双击 `start.cmd`；Mac 双击 `Start.command`，自动选择 Apple Silicon 或 Intel 运行文件。
2. 浏览器打开 `http://127.0.0.1:4317`，进入「链与环境」，点击「初始化环境」。
3. 在「运行实验」选择「转账」与「脚本基线」，点击「开始实验」。预期检查成功，真实链上转移 10 TokenA。
4. 在「实验档案」回放、导出；选 LLM Agent 后填写兼容工具调用的模型端点与模型名称。云模型通常还需要 API Key，本地无鉴权接口可以留空。
5. Windows 用 `stop.cmd`，Mac 用 `Stop.command` 关闭后台服务。

运行文件已随包附带，无需安装 Node、Docker、Python 或开发工具。仅本地脚本基线可以完全断网运行。Windows 包面向 Windows 10/11 x64；Mac Apple Silicon 包内 Anvil 声明最低 macOS 15.5，Intel 包内 Node 声明最低 macOS 13.5，启动脚本会检查系统版本。源码开发另见下文。

完整说明：[中文操作手册](docs/操作手册.md)。软件使用浏览器 GUI，不是经过签名公证的原生桌面安装器。Windows 已实际测试；macOS 提供对应原生运行文件和启动脚本，尚无 Mac 真机验证。Mac 若缺少脚本权限，可执行 `chmod +x Start.command Stop.command`；按系统提示处理可信文件的首次打开，不必关闭系统防护。

## 能力与数据边界

- 五类任务模板：查询余额、转账、授权、兑换、兑换后存入。可配置金额和兑换最低输出；代币、接收方和协议沿模板。自建代币 6 位小数、兑换池 0.30% 费率、Vault 为 1:1 实验份额模型。
- 独立实验默认恢复标准基线；连续实验继承当前链上余额、授权、池储备和仓位。支持环境重建、同进程快照、出块顺序 FIFO、手动出块与时间推进、固定区块分叉。
- 替换模型/提示词/任务输入/工具可见返回、限制允许工具、工具执行前和交易提交前暂停。
- 原始配置、实际模型请求/响应、工具原始/可见结果、交易参数/哈希/回执/可用 trace、前后状态和成本写入 JSONL 与 SHA-256 blob。
- 成功、失败、待确认、未知分别保存；记录封存状态与任务状态独立。派生判定按版本追加。
- 结果页分开显示交易执行与任务判定，提供中文失败项、期望值、实际值和建议，并展示余额、授权、储备与仓位的前值、后值及变化量。
- 档案按中文/英文任务、请求模型、接口自报模型、任务输入搜索；任务结果与链上执行结果独立组合筛选，直接查看历史输入和脱敏配置。
- 手动出块的秒数表示每块间隔，反馈实际区块数与时间差；「更新链上结论」仅检查器，「出块并继续 Agent」再次调用模型，两者独立。
- 离线轨迹回放不调用模型或链；独立实验重新运行恢复标准基线，验证源码及初始区块哈希，生成新 run_id。连续实验支持离线回放/复检，但不提供跨会话自动恢复任意起点的原样重跑。

脚本基线与协议模拟模型测试不代表真实 LLM 能力。任务文字解析只支持明确模板和声明参数；无法解析时要求结构化参数，不承诺任意自然语言语义理解。API Key 只驻留内存并在保存前脱敏；续行需重新提供所需密钥，不保存签名原文、私钥、助记词。公开开发账户仅用于本地测试。本版分叉任务仍使用自建合约，尚无真实 Uniswap/Aave 动作适配器。

## 示例与验证

`examples/` 提供 46 个完整实验包：38 个原有 V0.12 样例保持原始字节及构建身份，另新增 8 个 V0.13 反馈样例。原有样例中，35 个为真实 Anvil 执行的脚本基线：15 次五类正常基线、6 次真实失败/错误收款人交易、3 次工具返回替换、3 次待确认、3 次工具禁用失败，另有 5 轮连续状态继承示例（1 轮独立起点＋4 轮连续运行）。`examples/amount-fix/` 的另外 3 个包使用本地协议模拟模型与真实 Anvil，展示授权参数纠正、兑换参数纠正，以及仅格式校验模式下的超额授权。`examples/feedback-v013/` 的 8 个新包涵盖 30/27 自定义目标、精确小数、模型参数纠错、pending 父运行及恢复后的子运行、交易成功但任务失败。46 个包逐一通过完整性及独立检查，详见 `docs/example-validation-v013.json`。各类示例均不能用于报告真实模型成功率。在 GUI「实验档案 → 打开导出包」选择任一 JSON，仅在浏览器本地读入并校验。

`docs/validation.md` 和 JSON 测试报告说明本次实际验证范围。V0.13 已针对六组反馈建立任务规格、真实 Anvil 时间与状态、会话恢复、HTTP API、GUI 和浏览器回归；完整结果以 [验证记录](docs/validation.md) 为准。模型接口使用明确标记的本地协议替身；实际云模型效果需自行配置后采集。V0.12 的[跨平台 CI 记录](https://github.com/ZhanHaowen/Web3-Agent-Lab/actions/runs/38572309517)属于历史版本，V0.13 CI 请查看本仓库 Actions。CI 不能替代 Mac 桌面实机验收。

## 源码开发

安装 Node.js 24.19.0 和 pnpm 11.19.0，再执行：

```sh
pnpm install --frozen-lockfile
node scripts/setup-runtime.mjs
pnpm build
pnpm typecheck
pnpm test
pnpm start
```

`setup-runtime.mjs` 从 Foundry 官方 npm 包下载 Anvil 1.7.1，验证 SHA-512 后提取到本项目；需要系统 `tar` 命令。Windows 与 macOS 通常自带 tar。固定依赖见 `package.json` 与 `pnpm-lock.yaml`，合约使用 solc 0.8.30。`build-info.json` 保存源码哈希及构建版本；启动期间不要重新构建同一目录。

服务启动后，可单独执行：

```sh
node dist/cli.mjs init
node dist/cli.mjs reset
node dist/cli.mjs run transfer
node dist/cli.mjs run transfer --continuous
node scripts/e2e.mjs
node scripts/model-e2e.mjs
node scripts/feedback-e2e.mjs
node scripts/examples.mjs
```

测试与示例脚本会多次重置实验链，仅在隔离测试实例执行。同一实例上的集成测试不可并行。反馈测试默认连接4437端口，可用LAB_PORT指定。

## 纯离线命令

```sh
node dist/cli.mjs verify examples/01-balance-normal.json
node dist/cli.mjs replay examples/01-balance-normal.json
node dist/cli.mjs check examples/01-balance-normal.json
```

部署包可将 `node` 替换为 Windows 的 `runtime/node.exe` 或 Mac 的 `runtime/darwin-arm64/node` / `runtime/darwin-x64/node`。这些命令不需要启动 GUI、Anvil 或模型。哈希只检测文件变更，不证明数据采集者的真实性。

## 文件和扩展入口

`src/tasks.ts` 统一任务规格与解析；`src/agent.ts` 编排与模型适配；`src/continuation.ts` 以原始事件恢复会话并累计交易证据；`src/chain.ts` 环境和交易；`src/checker.ts` 独立检查；`src/store.ts` 脱敏、采集和完整性；`src/server.ts` 本地 API；`public/` GUI；`data/` 运行数据。

默认 GUI/RPC 端口为 4317/8547，数据在包内 `data/`。维护者可以设置 `LAB_PORT`、`LAB_CHAIN_PORT`、`LAB_DATA_DIR`、`ANVIL_PATH`；只监听 127.0.0.1。多个实例必须使用不同端口和数据目录，避免同时写同一数据目录。详细改造见 [扩展指南](docs/extension-guide.md) 与 [选型说明](docs/framework-selection.md)。

本项目原始代码为 MIT；依赖保留各自许可，见 `THIRD_PARTY_NOTICES.md` 和 `licenses/`。不要删除随软件发布的第三方许可文件。
