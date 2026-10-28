# 框架选型与实现边界

核对日期：2026-09-27。下表是官方源码和文档调研，不表示本项目已经部署或测试了全部候选。

| 候选 | 查询、交易与扩展 | 本地链、记录与复现 | 本阶段结论 |
| --- | --- | --- | --- |
| Coinbase AgentKit TypeScript | 钱包与 ActionProvider 分离，支持自定义动作；适合包装查询、授权、兑换等工具。模型和提示词由上层编排器决定。 | 可用自定义本地钱包适配；在动作调用和交易提交边界插入记录。默认示例面向 CDP 服务，不能直接把所有默认工具视为离线兼容。 | **采用其 ActionProvider 工具接口**，配合本项目的本地交易适配器。 |
| GOAT SDK | 模块化钱包、工具插件及框架适配器；官方仓库含 EVM 转账、兑换和 DeFi 示例。 | 可参考 viem 钱包与插件边界进行 RPC 和日志适配；需要锁定整个历史依赖树。 | 官方仓库 README 已声明归档、只读、不再接受更新。保留设计参考，本阶段不接入。 |
| elizaOS | TypeScript AgentRuntime 与插件体系，模型处理器、动作和评估器可替换；当前官方项目包含 EVM 钱包能力。 | 自部署路径存在；实验专用 RPC、交易拦截、不可变原始数据仍需自行适配。其完整应用、记忆及插件栈扩大了首版改造范围。 | 适合以后研究长期运行、记忆或多插件 Agent；本阶段不增加第二套运行时。 |

官方来源：[AgentKit 仓库](https://github.com/coinbase/agentkit)、[ActionProvider 源码](https://github.com/coinbase/agentkit/blob/main/typescript/agentkit/src/action-providers/actionProvider.ts)、[GOAT 仓库及归档说明](https://github.com/goat-sdk/goat)、[elizaOS 官方 README](https://github.com/elizaOS/eliza/blob/main/README.md)。这些链接的 `main` 会更新；本软件的运行依据是随附锁文件和源码版本。

## 实际采用的组合

```text
本机浏览器 GUI → Node 本地服务 → LangGraph 显式状态图
                           → AgentKit LabActionProvider
                           → viem 本地签名与 RPC → Anvil
                           → JSONL / 内容哈希文件 → 独立检查器
```

`src/agent.ts` 的 `LabActionProvider` **实际继承 AgentKit SDK 的 ActionProvider**，覆盖 `getActions()`，返回经过 Zod 参数校验的动作。工具调用通过这些动作的 `invoke()` 执行。它没有调用 `AgentKit.from()`，没有启用默认钱包动作或 Coinbase CDP 托管钱包；私有测试钱包与交易构造在 `src/chain.ts` 中由 viem 实现。因此应将软件描述为“基于 AgentKit ActionProvider 接口的定制实验平台”，不能描述为官方 AgentKit 默认 Agent 的完整部署。

LangGraph 的实际拓扑为 `START → decide → tools → decide → END`。`llm` 模式由模型决定工具调用；`scripted` 模式使用固定五类任务计划，完全不调用模型。两种模式共用工具、链执行和采集路径。没有使用发布版 AgentKit LangChain 适配包，也未启用 LangGraph 持久化 checkpoint 或 LangSmith。暂停由本地服务的显式等待接口实现。

模型层使用兼容 Chat Completions 的 HTTP 接口，保存实际请求 JSON、实际响应及工具消息；不要求模型提供内部思维。当前只支持非流式文本与 function tools。换用不兼容该协议的服务需要新增传输适配器。接口缺少 usage 时成本记为未知，重新调用同一模型也不保证输出一致。

## 固定版本

| 组件 | 本仓库固定版本 | 用途 |
| --- | --- | --- |
| `@coinbase/agentkit` | 0.10.4 | 自定义 ActionProvider |
| `@langchain/langgraph` / `@langchain/core` | 1.4.18 / 1.2.12 | 显式 Agent 状态图及依赖 |
| `viem` | 2.38.3 | 本地账户签名、读链和回执 |
| `zod` / `reflect-metadata` | 3.25.76 / 0.2.2 | 参数校验、SDK 依赖 |
| Anvil | 1.7.1 | 独立 EVM 进程、快照、手动出块和分叉 |
| Solidity / TypeScript | 0.8.30 / 5.9.3 | 实验合约编译 / 应用编译 |

以 `package.json`、`pnpm-lock.yaml`、`build-info.json` 及运行时下载清单为准；升级其中任何一项后重跑类型检查、单元测试和实际 Anvil 集成测试。完整依赖较大，发布包由构建脚本打包所需运行路径；保持第三方许可文件。

本地基础协议是项目自带的两种测试 ERC-20、0.30% 费用常数乘积 AMM 和 1:1 存入份额合约，适合测试和数据管线验收。**它们不是 Uniswap/Aave 的生产实现。** 分叉模式固定远端区块，并在分叉链上部署同一套实验合约；真实生产协议的地址、ABI、工具和专门检查器仍需另外增加。

其他官方参考：[LangGraph JS](https://github.com/langchain-ai/langgraphjs)、[viem](https://github.com/wevm/viem)、[Foundry](https://github.com/foundry-rs/foundry)。本版提供本地单实验运行、回放和重新运行，不包含多用户调度、分布式追踪后端或生产链广播入口。
