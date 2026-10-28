# V0.15.3 框架与实现边界

本页描述仓库现有实现，不是对外部框架当前状态的重新调研。旧候选框架对比和当时来源保存在 [archive/v0.13/framework-selection.md](archive/v0.13/framework-selection.md)，应按其日期阅读。

## 当前分层

```text
浏览器：任务中心 / 原实验与服务页 / 跨路径预算页
                  ↓ 同一主服务地址
兼容桥 dist/server.mjs
  ├─ src/control：Job / Execution / Agent worker / 受控意图 / 持久记录
  ├─ src/scenario：保留的双 Agent 场景和 V0.15 服务购买
  ├─ src/budget：隔离链 / 受限 EOA signer / Permit2 / 预算 Checker
  └─ vendor/v013-server.mjs：固定单 Agent 平台与公共链适配基线
                  ↓
本机 Anvil / 测试合约 / 内容哈希证据与离线检查器
```

`start.cmd` 启动这套主服务，侧栏切换模块。预算使用额外的受管临时链以隔离原任务链，而非另开一个面向用户的网页平台。`src/budget/server.mjs` 仅为开发测试 harness。

## 固定基线与新模块

原单 Agent 平台基于 AgentKit 的定制 ActionProvider、LangGraph 显式状态图、viem 钱包/RPC 和 Anvil。它没有启用官方默认钱包工具全集，也不是 Coinbase CDP 托管钱包的完整部署。脚本与兼容 Chat Completions 的模型路径保留原工具和记录边界；协议夹具只是链路测试，不是真实模型效果证明。

这部分运行时代码固定在 `vendor/v013-server.mjs`，历史 TypeScript 源码在 `vendor/legacy-source/`。当前新增的 `src/control/`、`src/scenario/` 和 `src/budget/` 为直接 ESM 实现，通过构建脚本接入兼容桥。不能将每个新模块都描述为由 LangGraph 编排，也不能将当前 `pnpm build` 说成已脱离 vendor 的全源码 TypeScript 重建。

任务中心引入独立 worker、角色分配、受控签名、持久 Job/Execution。原 V0.15 Buyer/Provider/Evaluator 服务路径继续保留原架构，尚未迁移到该 worker 系统。预算 signer 为软件限制的 EOA 进程，不实现智能账户 session key。

## 锁定工具与版本

| 组件 | 仓库锁定值 | 当前作用 |
| --- | --- | --- |
| Node / pnpm | 24.19.0 / 11.19.0 | 源码开发与 SQLite 运行环境 |
| AgentKit | 0.10.4 | 原平台定制 ActionProvider 基线 |
| LangGraph / LangChain Core | 1.4.18 / 1.2.12 | 原平台编排与依赖 |
| viem | 2.38.3 | 本地钱包、RPC、交易和回执 |
| zod / reflect-metadata | 3.25.76 / 0.2.2 | 参数校验与兼容依赖 |
| Anvil | 1.7.1 | 本地 EVM；下载记录由 setup-runtime 保存 |
| solc | 0.8.30 | 实验换币、服务及基础合约 |
| 固定离线 soljson | 0.8.17 | 官方 Permit2 本地构建 |
| TypeScript | 5.9.3 | 当前声明接口的限定范围检查 |

具体依赖以 `package.json`、`pnpm-lock.yaml` 和编译器来源记录为准。便携包依赖固定 vendor 基线中已打包的代码；仅升级根依赖不会自动替换其中嵌入的库。需要修改嵌入组件时，应走显式重建和回归路线，见[构建与第三方组件](third-party-rebuild.md)。

当前发布仍为 NOT_FULLY_ACCEPTED；Windows 预算回归不能替代所有原验收、真实模型或 macOS 体验验收。测试范围见[验证说明](validation.md)。