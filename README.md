# Web3 Agent Lab V0.15.3

本地 Web3 Agent 研究平台：在真实本地 EVM 上观察任务、角色协作、交易、签名及资产效果，保存可离线复查的证据。当前为 **Windows x64 研究预览版，NOT_FULLY_ACCEPTED**。

**直接使用：从 [V0.15.3 Release](https://github.com/ZhanHaowen/Web3-Agent-Lab/releases/tag/V0.15.3) 的附件下载完整 Windows ZIP，解压后双击 `start.cmd`。** 仓库和 GitHub 自动生成的 Source code ZIP 不含 Node/Anvil 运行程序，不能直接当作便携包运行。

## 本版更新

- 新增“跨路径资产授权与预算控制”：比较正常交易和 EIP-712 签名 → Permit2 兑现是否共同落实任务预算。
- 余额、预算、首笔交易、第二笔请求均可编辑，支持六位小数；分类模板按当前参数生成，不绑定某组数字。
- 任务中心、购买 Agent 服务、预算实验由同一个 `start.cmd` 启动，在侧栏切换；`stop.cmd` 统一关闭。
- 保留原单 Agent 实验、双 Agent 换币、服务购买与历史证据。

## 开始使用

1. 关闭旧实例，备份需要保留的数据，将新版完整解压到新目录。
2. 双击 `start.cmd`。默认平台地址为 `http://127.0.0.1:4317`；任务中心管理入口也可通过 `open-task-center.cmd` 打开。
3. 从侧栏进入“跨路径资产授权与预算控制”，填写初始余额、任务预算、首笔交易、第二笔金额、预算策略及第二条路径。
4. 直接运行自定义组合，或选择分类、填写偏移量并点击“按当前参数生成”；查看预览后运行。选择分类本身不会重置金额。
5. 查看交易回执、许可、正常入口计数和独立检查结论。证据自动保存到当前数据目录的 `budget/`，也可下载、查看/复制 JSON 或离线打开。
6. 使用 `stop.cmd` 关闭平台。自定义 `LAB_PORT` 后，侧栏和接口使用当前平台地址；预算页为 `/budget.html`。

完整操作见 [V0.15.3 手册](docs/操作手册_V0.15.3.md)；其他入口见[操作指南](docs/操作手册.md)。

## 各模块的研究范围

| 模块 | 当前能力与边界 |
| --- | --- |
| 任务与 Agent 中心 | 区分任务定义、已发布 Job、具体 Execution 和 Agent；独立进程、钱包、模型配置及角色分配。预览验收仍有未完成项。 |
| 双 Agent 换币 | 默认两个经济 Agent，共享场景记录和本地链；支持脚本与真实模型路径，不承诺大规模并发。 |
| 购买 Agent 服务 | Buyer、Provider、Evaluator 等角色的原 V0.15 实现继续保留，尚未迁移为任务中心的独立 V2 worker 架构。 |
| 跨路径预算实验 | 同一受限 EOA 经交易和签名兑现两条路径产生资产效果；比较分离计数和包含未兑现承诺的统一预算。 |

预算实验使用平台管理的独立临时链，不重置原任务中心链。分离计数是有意设置的研究对照；结果不能证明原版 V0.15.1 或 Permit2 本身存在同一漏洞。受限主体是软件控制的 EOA 签名进程，尚非智能账户 session key；该模块不支持中途崩溃后续跑。

## 从源码开发

当前运行时为 `src/control/`、`src/scenario/`、`src/budget/` 的 ESM 模块，加固定的 `vendor/v013-server.mjs` 兼容基线。完整 TypeScript 源码迁移及干净全源码构建验收尚未完成。历史 TypeScript 快照位于 `vendor/legacy-source/`，不是当前根目录的开发入口。

使用 Node **24.19.0** 和 pnpm **11.19.0**：

```powershell
pnpm install --frozen-lockfile
node scripts/setup-runtime.mjs
pnpm build:budget
pnpm build
pnpm typecheck:interfaces
pnpm test
pnpm start
```

`setup-runtime.mjs` 获取 Anvil，不安装便携启动器所需的 `runtime/node.exe`。源码开发可使用系统 Node 执行上述命令；需要运行 Windows 启动器测试时，须另备匹配的 `runtime/node.exe`。`pnpm dev` 在构建后监听 `dist/server.mjs`；`pnpm start:budget` 启动同一主服务，开发用独立预算服务为 `pnpm dev:budget-harness`。

`pnpm build` 编译换币/服务合约并生成兼容桥；`pnpm build:budget` 使用随仓库固定的离线编译器构建官方 Permit2。基础 LabContracts 产物保留在仓库，可选 `pnpm build:base-contracts` 重建。`typecheck:interfaces` 仅检查两个 TypeScript 接口/类型测试文件，不代表 ESM 运行时的完整类型检查。更多信息见[构建与第三方组件](docs/third-party-rebuild.md)。

## 测试、文档与版本身份

[测试集合](tests/README.md)列出单元、链上、HTTP、真实启动器和可选浏览器测试；新生成报告与样例位于 `artifacts/test-results/`，不会覆盖已发布证据。[样例索引](examples/README.md)区分单 Agent、场景和预算证据的离线读取入口。

文档入口：[文档索引](docs/README.md) · [版本更新说明](docs/版本说明_V0.15.3.md) · [验证范围与限制](docs/validation.md) · [扩展指南](docs/extension-guide.md) · [证据格式](docs/trace-schema.md)。新版 CI 范围是 Windows x64；V0.15.3 没有新增已验证的 macOS 便携包。V0.13 的跨平台记录作为历史证据保留。

**Release 附件与源码要分别识别。** 既有 `V0.15.3` 标签创建于本次源码同步之前，保留其原提交和已上传附件；标签页自动生成的 Source code 归档仍对应旧提交。当前源码请查看本仓库 `main`。已发布便携包构建信息存于 [V0.15.3-portable-build-info.json](docs/releases/V0.15.3-portable-build-info.json)，其 `sourceHash` 为 `599ca446019431ceda967fc8a474d86a0dc160b2347c4b021391e642f3b65a88`。仓库重建后的哈希可以不同；只能把报告用于其记录的构建和实测范围。

项目代码采用 [MIT License](LICENSE)；第三方组件保留各自许可证，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。