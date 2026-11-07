# V0.16.0 测试集合

本版新结果见 [V0.16.0 回归报告](../docs/V0.16.0回归测试报告.md)。以下旧数量保留为历史集合说明，不当作当前通过数。默认单元集合包含本地服务生命周期/身份/证据完整性、双后端界面、HTTP 原文/错误采集、worker 失败持久化与 GraphML 元数据。

真实模型测试须先在运行中的平台导入固定 Qwen3 4B 并启动本地服务，再设置 `LAB_TEST_BASE_URL`（默认 `http://127.0.0.1:4531`）与独立的 `LAB_TEST_ARTIFACT_DIR`：

```powershell
node tests/v016-local-real.mjs
node tests/v016-local-workers.mjs --help
```

前者执行三轮五任务默认提示词、一轮显式流程提示词、独立重跑与连续五任务；后者验证真实独立 worker，以及本地模型与 API 协议夹具混合模式。两脚本共用平台时必须顺序执行。它们不下载权重、不使用云端 Key，不把脚本或协议夹具算作真实商业模型。模型任务失败与平台证据检查失败分别报告。

`v016-maker-rejection.mjs` 用明确标注的 API 协议夹具、两个独立 worker 与真实 Anvil 补测 Maker 主动拒绝，不替代语言模型能力测试。CLI `check` 的历史与新版入口退出码不同，自动化应解析检查结果的 `status`，不要只看进程成功退出。

当前自动化针对 Windows x64、本地测试资产与真实 Anvil。先按[构建说明](../docs/third-party-rebuild.md)安装固定依赖，准备 Anvil，执行 `pnpm build:budget`、`pnpm build`。默认测试不要求真实模型 Key；脚本或协议夹具不证明真实模型能力。

## 当前入口

| 命令 | 测试范围 | 已发布便携包记录 |
| --- | --- | --- |
| `pnpm typecheck:interfaces` | `src/control/types.ts` 与 `tests/control-types.test.ts` 的接口类型 | 只覆盖这两个文件，不是运行时全面类型检查 |
| `pnpm test` / `pnpm test:unit` | 根目录 `*.test.mjs`；控制鉴权、持久记录、恢复、暂停、场景、服务与分类计算 | 76 通过，其中分类生成 10 项 |
| `pnpm test:budget` | `budget-integration.mjs`，真实链、Permit2、签名与累计预算 | 16 通过 |
| `pnpm test:budget:matrix` | `budget-parameter-matrix.mjs`，任意金额、小数、最小单位和边界 | 9 通过 |
| `pnpm test:budget:main` | `budget-main-integration.mjs`，主平台同源、原链隔离、启动/关闭竞态 | 9 通过 |
| `pnpm test:budget:http` | `budget-http.mjs`，开发预算服务的鉴权、幂等推进和导出接口 | 8 通过 |
| `pnpm test:budget:launcher` | `budget-launcher.mjs`，实际 `start.cmd` / `stop.cmd` | 3 通过 |
| `pnpm test:peer-api` | `peer-integration.mjs`，保留场景 API 的协商、暂停、连续运行和协议夹具 | 历史场景集合；按本次输出判断 |
| `pnpm test:v2` | `v2-integration.mjs`，独立 worker 换币与五类保留任务模板 | 6 通过 |
| `pnpm test:peer-chain` | `peer-contract.mjs`，原子换币合约级检查 | 按本次运行输出判断 |
| `pnpm test:service` | `service-integration.mjs`，原 V0.15 服务购买路径 | 16 通过 |

表中数量来自已发布便携包的[验证摘要](../docs/V0.15.3验证摘要.md)，用于说明集合覆盖，不能当作当前提交已经复跑成功。范围可能重叠，不将表中数量相加。新运行以实际输出、报告 `buildHash` 和对应提交为准。

Windows 启动器测试还要求 `runtime/node.exe`；`setup-runtime.mjs` 只获取 Anvil。源码开发可使用系统 Node；CI 将固定版本的 Node 复制到启动器目录后执行。端口和测试数据目录由各集成脚本分配，测试过程会创建本地进程和临时链。

## 新结果保存在哪里

新报告、生成样例与可选截图统一写入 `artifacts/test-results/`。可设置 `LAB_TEST_ARTIFACT_DIR` 改为独立目录，例如：

```powershell
$env:LAB_TEST_ARTIFACT_DIR = 'artifacts/test-results/my-run'
pnpm test:budget:matrix
```

该目录不会提交为发布证据。测试输出不能设为 `docs/`、`examples/`、`.git/` 或仓库根目录；已封存的报告和样例保持原始字节。若需分享新结果，先核对构建身份、脱敏和实际范围，再另行整理。

## 可选浏览器与历史回归

`node tests/budget-gui.mjs` 需要另外提供 Playwright 模块路径 `BUDGET_PLAYWRIGHT_MODULE`，以及可用的 Chrome（默认 Windows 安装路径，可由 `BUDGET_BROWSER_PATH` 指定）。它不在默认单元集合中。原便携包记录为 11 项通过、1 项原生下载 BLOCKED；不能把自动保存或 HTTP 附件测试替代原生下载通过。

`node tests/legacy-regression-wrapper.mjs` 在隔离服务与数据目录上调用当前 `scripts/e2e.mjs`、`amount-e2e.mjs`、`feedback-e2e.mjs`、`v013-e2e.mjs`，用于检查兼容路径。它不在默认单元集合中。`vendor/legacy-source/tests/` 中的旧 TypeScript 测试和原 GUI 验收属于历史基线，不能混算为 V0.15.3 默认测试数。新版托管 CI 范围为 Windows x64，不宣称已跑 macOS 桌面或云端 GUI。

离线样例检查见[样例索引](../examples/README.md)；验收边界、未完成条件和原报告的构建身份见[验证说明](../docs/validation.md)。
