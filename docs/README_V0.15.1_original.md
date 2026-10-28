# Web3 Agent Lab V0.15.1

本版是按《V0.14 增量实现方案与验收标准》修订 2 制作的规范修订预览版，验收状态为 **NOT_FULLY_ACCEPTED**。新增可先发布任务、再启动和分配独立 Agent 的任务中心；保留原单 Agent 实验与 V0.15 购买 Agent 服务。

## 开始使用

1. 用旧版 `stop.cmd` 关闭旧实例，备份数据，将本 ZIP 完整解压到新目录。
2. 双击 `start.cmd` 启动本地服务，再双击 `open-task-center.cmd` 打开本实例任务中心。
3. 先发布“原子换币”任务，再创建 `agent-a`、`agent-b` 的离线配置，分别启动独立进程。
4. 将 Maker、Taker 分配给两个在线 Agent 并开始。默认脚本实验为 Maker 用 10 A 换取 Taker 的 20 B；最终双方余额应分别为 90 A/20 B 与 10 A/80 B，托管归零。
5. 需要购买 Agent 服务时，从首页打开原 V0.15 服务入口。默认正确报告实验为 Buyer 100 B → 95 B、Provider 0 B → 5 B。服务购买沿用原实现。

任务中心使用本机管理员会话。入口脚本读取本实例私有令牌，页面通过 URL 片段初始化后清除片段，换取 HttpOnly 浏览器会话；会话失效后重新运行入口脚本。不要分享管理员令牌或 Agent 配置目录。

详细操作见 [V0.15.1 操作手册](docs/操作手册_V0.15.1.md)、[修订范围与验收说明](docs/V0.14修订范围与验收说明.md) 和 [验收证据阅读说明](docs/验收证据索引_V0.15.1.md)。V0.15 服务用法见 [原服务购买手册](docs/操作手册_V0.15.md)。

最终结果见 [最终验证摘要](docs/最终验证摘要_V0.15.1.md)、[36 项验收 JSON](docs/v0151-final-acceptance.json) 和 [验收 CSV](docs/v0151-final-acceptance.csv)。这些记录区分已通过测试与尚未覆盖的标准，不把预览版标成正式验收通过。

## 能力与边界

任务中心提供六类固定版本模板：balance、transfer、approve、swap、swap_deposit、peer_swap。前五类当前使用脚本适配器；原单 Agent 页面保留模型模式。peer_swap 支持脚本与两个独立模型会话，两方可使用相同 API、模型和 Key。

控制端与两个 Agent 分别运行；Agent 读取各自钱包秘密并签名，控制端负责授权核验、交易意图与哈希持久化、广播和对账。交易意图的准备与提交 HTTP 接口已实现，准确路径和权限见 [控制接口说明](docs/control-api_V0.15.1.md)。停止决策不会自动退款；Open、Pending 或 Unknown 必须先对账并显式清退。

V0.15 保护清单中的 **11 个文件均保持原始哈希**，包括服务模块、界面、合约和产物。固定提交 `cc51b37456eaec19ffcd002e07a33d8466fdff28` 的 **42 个基线文件哈希匹配，其中 12 个为原始 TypeScript 源文件**，保存在 `vendor/legacy-source/`。这两项是文件级核验，不代表全部运行回归或完整源码重建验收通过。

## 运行、检查与重新构建

Windows x64 包自带 Node 与 Anvil，运行无需安装 Python、Docker 或 Solidity 编译器。本地脚本实验可离线运行；模型实验按所选接口联网。

```text
runtime\node.exe dist\cli.mjs doctor
runtime\node.exe dist\cli.mjs verify "执行包.json"
runtime\node.exe dist\cli.mjs replay "执行包.json"
runtime\node.exe dist\cli.mjs check "执行包.json"
```

开发重新构建需要固定 Node 24.19.0、pnpm 11.19.0 和依赖。`scripts/compile-peer.mjs` 从 `SOLC_JS_PATH` 指定文件或已安装的 `solc` 包加载 0.8.30，不使用私有 tools 目录，也不自动下载编译器。已有合约产物足以运行。

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
```

`pnpm typecheck` 仅对 `tsconfig.control.json` 指定的严格接口与类型测试做检查，**不检查完整 ESM 运行时**。当前 build 编译合约并构建兼容桥，使用随包固定的旧 bundle；这不等于从全部 TypeScript 源码重新编译运行时。完整 TS 运行时迁移、干净依赖安装及第三方全量源码构建仍属于未完成验收范围。历史脚本名 `build-v014`、`package-v014` 保留，输出标签为 V0.15.1。

## 验收状态与发布内容

当前版本不声称 AT-01 至 AT-36 全通过。真实模型 10 次完整尝试、Apple Silicon macOS 实机、独立人工核验，以及未完整运行的恢复、身份对抗与故障注入条目，必须在报告中保留实际缺口。协议夹具不能代替真实模型实验；单次重启不能证明任意崩溃点均可无损恢复。

每份验收报告只证明其自身 `buildHash` 及实测范围。`docs/acceptance-v014/`、`docs/acceptance-case21/` 和历史 `v014*`、`v015*` 报告可能来自不同构建；只有与交付 `build-info.json` 相匹配的最新复测，才可作为该构建的对应证据。旧报告不因被收入新包而升级为新版本验收。

打包脚本排除 data* 运行目录、build 诊断目录、私有工具、依赖目录与凭据文件；ZIP 内不携带用户钱包、API Key 或管理员令牌。启动后生成的运行目录需要单独保管和备份。
