# V0.15.3 验证范围与复跑入口

当前交付为 **Windows x64、NOT_FULLY_ACCEPTED 研究预览版**。应分别核对“已上传便携包的历史报告”和“当前仓库源码产生的新结果”，不能仅按文件名或版本号将两者视为同一次验证。

## 已发布便携包的记录

[V0.15.3 验证摘要](V0.15.3验证摘要.md)和 `v0153-*.json` 记录以下结果：单元 76 项、预算核心 16 项、任意金额矩阵 9 项、同源主平台 9 项、真实 Windows 启停 3 项、HTTP 8 项、换币及五类旧任务 6 项、服务购买 16 项通过。范围存在交叉，不把各行相加作为完整验收数量。

原浏览器记录是本机 Chrome 11 项通过、1 项原生下载 BLOCKED；附件响应、自动保存、查看/复制 JSON 和离线读取已有验证，原生下载受环境限制，未标为通过。该记录不等同于托管 CI 执行过浏览器测试，也不代表真实模型成功率。

这些报告对应已发布便携构建 `599ca446019431ceda967fc8a474d86a0dc160b2347c4b021391e642f3b65a88`，完整原始清单见 [releases/V0.15.3-portable-build-info.json](releases/V0.15.3-portable-build-info.json)。它们不会因仓库重建而改写。当前根目录 `build-info.json` 应随当前构建生成；若哈希不同，旧报告仅用于原构建。

## 当前仓库如何复跑

先按[构建说明](third-party-rebuild.md)准备 Node 24.19.0、pnpm 11.19.0、固定依赖和 Anvil，执行 `pnpm build:budget` 与 `pnpm build`。测试入口和依赖详见[测试集合](../tests/README.md)。

| 范围 | 命令 |
| --- | --- |
| 声明接口类型 | `pnpm typecheck:interfaces` |
| 当前单元集合 | `pnpm test` |
| 预算核心与真实 Permit2 | `pnpm test:budget` |
| 任意金额与小数矩阵 | `pnpm test:budget:matrix` |
| 主平台同源、隔离与停止 | `pnpm test:budget:main` |
| HTTP 鉴权及导出 | `pnpm test:budget:http` |
| 真实 Windows 启动器 | `pnpm test:budget:launcher` |
| 保留场景 API 回归 | `pnpm test:peer-api` |
| 独立 worker 换币与原任务模板回归 | `pnpm test:v2` |
| 原服务购买回归 | `pnpm test:service` |

新报告、临时导出样例和可选截图写入 `artifacts/test-results/`，可用 `LAB_TEST_ARTIFACT_DIR` 指定独立结果目录。`docs/` 和 `examples/` 中已提交的旧证据不作为测试输出目的地。CI 的新工作流针对 Windows x64 构建和自动回归；实际运行结果以 GitHub Actions 对应提交为准，本页不预先宣称某次 CI 已通过。

本次源码同步另有一份[本地复跑记录](repository-sync-v0153-validation.json)：固定版本工具链的 12 个构建与验证步骤通过，包含新版预算测试及原功能回归。此记录属于本机 Windows 运行，不代表 GitHub Actions 已执行；本机因链接权限限制使用了相同锁文件的复制式依赖布局。原便携包报告保持不变。

## 保留的未完成范围

- 完整 TypeScript 运行时迁移及脱离固定 vendor 的干净全源码构建尚未完成。类型命令仅检查两个接口/类型测试文件，不覆盖 ESM 运行时。
- 真实模型、外部服务、独立人工检查及 V0.15.1 全部验收条件，不由脚本正常样例或本次预算功能自动补齐；见[原验收索引](验收证据索引_V0.15.1.md)。
- 新版 macOS 便携包与桌面验收未提供；V0.13 的三平台报告保留为对应版本的历史证据。
- 预算 signer 为受软件限制的 EOA，未实现智能账户 session key；预算执行中途崩溃后的恢复不在本版范围。
- 内部哈希检查只能检查包内一致性，不能认证采集者诚实，也不能证明历史链状态或模型响应在重新运行时相同。

原 V0.13 通用验证说明完整保存在 [archive/v0.13/validation.md](archive/v0.13/validation.md)。版本化报告、原始哈希与失败/BLOCKED 状态保持原样。