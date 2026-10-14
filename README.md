# Web3 Agent Lab

当前版本 **V0.12 Beta**（程序版本 `0.1.2`，修订 `beta-1`）。`V0.12` 是界面与发布包的展示版本，`0.1.2` 是 `package.json` 的程序版本；两者指向同一版软件。V0.12 整合此前真实使用反馈修复、连续实验模式及执行轨迹功能，并统一公开仓库交付的版本标识。

授权与兑换的工具金额采用人类可读单位，例如 6 位小数代币的 `"20"` 只在合约编码时转为 `"20000000"`。默认在签名前拒绝不符合固定任务金额的参数，保留错误提议并允许 Agent 纠正；可显式切换仅格式校验开展错误行为实验。检查器按实际授权覆盖和后续消耗顺序计算 allowance，接受合法前置授权，仍会判定超额授权不合规。

执行轨迹显式关联任务、模型、工具、合约调用、交易与 EVM 内部调用，保留原始/可见工具结果及来源事件。GUI 支持调用详情、可点击图预览、离线回放，以及 JSON / GraphML / CSV 导出。数据格式、证据边界和离线文件生成方法见 [执行轨迹与溯源图说明](docs/trace-schema.md)。此前修复历史见 [V.011 版本说明](docs/版本说明_V.011.md)。

[GitHub 仓库](https://github.com/ZhanHaowen/Web3-Agent-Lab) · [V0.12 下载页](https://github.com/ZhanHaowen/Web3-Agent-Lab/releases/tag/v0.12)

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

- 五类固定任务：查询余额、转账、授权、兑换、兑换后存入。自建代币 6 位小数、兑换池 0.30% 费率、Vault 为 1:1 实验份额模型。
- 独立实验默认恢复标准基线；连续实验继承当前链上余额、授权、池储备和仓位。支持环境重建、同进程快照、出块顺序 FIFO、手动出块与时间推进、固定区块分叉。
- 替换模型/提示词/任务输入/工具可见返回、限制允许工具、工具执行前和交易提交前暂停。
- 原始配置、实际模型请求/响应、工具原始/可见结果、交易参数/哈希/回执/可用 trace、前后状态和成本写入 JSONL 与 SHA-256 blob。
- 成功、失败、待确认、未知分别保存；记录封存状态与任务状态独立。派生判定按版本追加。
- 结果页分开显示交易执行与任务判定，提供中文失败项、期望值、实际值和建议，并展示余额、授权、储备与仓位的前值、后值及变化量。
- 离线轨迹回放不调用模型或链；独立实验重新运行恢复标准基线，验证源码及初始区块哈希，生成新 run_id。连续实验支持离线回放/复检，但不提供跨会话自动恢复任意起点的原样重跑。

脚本基线与协议模拟模型测试不代表真实 LLM 能力。更改输入不会自动改变固定检查器目标。API Key 只驻留内存并在保存前脱敏；不保存签名原文、私钥、助记词。公开开发账户仅用于本地测试。本版分叉任务仍使用自建合约，尚无真实 Uniswap/Aave 动作适配器。主网分叉需要历史 RPC，不能把本地分叉测试视为真实生产网络行为。

## 示例与验证

`examples/` 提供 38 个完整实验包。其中 35 个为真实 Anvil 执行的脚本基线：15 次五类正常基线、6 次真实失败/错误收款人交易、3 次工具返回替换、3 次待确认、3 次工具禁用失败，另有 5 轮连续状态继承示例（1 轮独立起点＋4 轮连续运行）。`examples/amount-fix/` 的另外 3 个包使用本地协议模拟模型与真实 Anvil，展示授权参数纠正、兑换参数纠正，以及仅格式校验模式下的超额授权。两类示例均不能用于报告真实模型成功率。在 GUI「实验档案 → 打开导出包」选择任一 JSON，仅在浏览器本地读入并校验。

`docs/validation.md` 和 JSON 测试报告说明本次实际验证范围。未获得真实云模型 API 凭据，模型接口使用明确标记的本地协议替身测试；实际云模型效果需自行配置后采集。Windows、macOS Apple Silicon 和 Intel 的 GitHub Actions 构建、类型检查及测试均已通过（[运行记录](https://github.com/ZhanHaowen/Web3-Agent-Lab/actions/runs/38572309517)）；这不等同于 Mac 桌面实机验收。

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

`src/agent.ts` 编排与模型适配；`src/chain.ts` 环境和交易；`src/checker.ts` 独立检查；`src/store.ts` 脱敏、采集和完整性；`src/server.ts` 本地 API；`public/` GUI；`contracts/` 源码和编译产物；`data/` 运行数据。

默认 GUI/RPC 端口为 4317/8547，数据在包内 `data/`。维护者可以设置 `LAB_PORT`、`LAB_CHAIN_PORT`、`LAB_DATA_DIR`、`ANVIL_PATH`；只监听 127.0.0.1。多个实例必须使用不同端口和数据目录，避免同时写同一数据目录。详细改造见 [扩展指南](docs/extension-guide.md) 与 [选型说明](docs/framework-selection.md)。

本项目原始代码为 MIT；依赖保留各自许可，见 `THIRD_PARTY_NOTICES.md` 和 `licenses/`。不要删除随软件发布的第三方许可文件。
