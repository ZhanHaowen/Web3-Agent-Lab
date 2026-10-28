# V0.15.3 研究扩展指南

当前扩展入口是 ESM 模块和固定兼容基线。根目录旧 TypeScript 运行时/测试重复文件已移入历史快照，不能继续按 `src/server.ts`、`src/agent.ts` 等旧路径修改后期待主服务生效。旧指南原文见 [archive/v0.13/extension-guide.md](archive/v0.13/extension-guide.md)。

## 当前代码位置

| 位置 | 责任 |
| --- | --- |
| `src/control/tasks.mjs`、`routes.mjs`、`control.mjs` | 任务定义、发布 Job、分配角色、Execution 与控制 API |
| `src/control/worker.mjs`、`gateway.mjs`、`tx-routes.mjs` | 独立 Agent worker、受控交易意图、签名提交及租约边界 |
| `src/control/store.mjs`、`offline.mjs`、`checker.mjs` | 持久记录、离线证据和任务中心检查 |
| `src/scenario/` | 保留的场景、双 Agent 协商、钱包/服务注册及服务购买 |
| `src/budget/common.mjs`、`engine.mjs`、`signer.mjs` | 金额与配置、专用链执行、同一 EOA 的受限签名 |
| `src/budget/service.mjs`、`checker.mjs` | 主平台预算服务接入及独立资产/预算检查 |
| `public/budget-presets.js`、`budget.js` | 分类计算、参数预览、交互与离线展示 |
| `scripts/build-v014.mjs`、`vendor/v013-server.mjs` | 将当前模块接入固定的原平台基线并生成 `dist` |
| `vendor/legacy-source/` | 可核对的旧源码快照，供研究和后续完整迁移使用 |

`src/budget/server.mjs` 是开发用独立服务；产品入口由 `dist/server.mjs` 统一提供 `/budget.html` 与 `/api/budget/*`。新增产品页应遵循当前地址与相对导航，避免要求用户另开第二个平台。

## 添加角色、任务或工具

角色名描述任务中的责任，不自动授予钱包、工具或管理员权限。任务定义与 Job、Execution、Agent 配置分开；修改任务模板时同步检查角色要求、字段校验、环境策略、任务输入、检查器和离线导出。参考 [V0.15.1 手册](操作手册_V0.15.1.md)与 [Control API](control-api_V0.15.1.md)。

新交易工具应沿用受控意图路径：绑定当前 Agent、Execution 和租约，先持久化再请求签名，提交时核对原意图。不要把任意收款方/calldata 覆盖或任意原始签名暴露给任务输入。页面导入的任务数据不作为 JavaScript 执行。取消发生在广播之后时，仍需跟踪并核对已广播交易，不能改写为未发生。

默认双 Agent 场景用于两个经济主体，共享链和场景记录器，各自拥有模型、对话、提示词、工具权限、钱包、收件箱和成本记录。可以注册更多角色，并不代表调度器已通过大规模并发验收。原 V0.15 服务 Buyer/Provider/Evaluator 路径保留原架构，新增服务功能时应明确是否仍在该路径内，不把它描述成已完成 V2 worker 迁移。

## 扩展跨路径预算实验

金额使用十进制字符串与六位最小单位，配置规则位于 `src/budget/common.mjs`，页面分类规则位于 `public/budget-presets.js`。添加分类时让它根据当前预算、首笔和偏移量计算，避免写死测试数字；修改参数后应标为自定义，预览和执行参数分别展示。

增加一种资产效果路径时，同时考虑“已支出”和“已签但未兑现的承诺”。检查共同任务预算应绑定同一执行/会话/钱包；签名成功不等于已经转账，第三方广播不等于钱包没有支出。Checker 应从原始回执、代币转出日志和余额独立求出实际效果，不能只信某个入口自报的计数。

预算 signer 当前是软件限制的 EOA 子进程。普通 Permit2 不会自动将本地任务 ID 或剩余预算变成链上规则。研究其他签名协议或智能账户时，应新建明确的实现和验收范围，不能将当前演示结论直接外推。

## 构建、记录和验证

修改运行时代码后执行 `pnpm build:budget`（涉及 Permit2 时）、`pnpm build`，并运行与变更相关的[测试集合](../tests/README.md)。仅改接口文件时的 `pnpm typecheck:interfaces` 不检查 ESM 运行时。`pnpm dev` 监听已生成的 `dist/server.mjs`，不是完整源码热编译。

每份原始证据记录实际参数、身份、调用、回执和错误。模型服务的非确定性、缺失 usage 和工具失败应原样保留；不采集或推断隐藏思维。认证头、私钥与模型 Key 不写入导出。对已有证据的研究派生应另存文件，保留原始构建身份，不能回填历史结果。

新测试报告与临时样例写到 `artifacts/test-results/`；命名版本的 `docs/` 报告和 `examples/` 原始样例为封存资料。源码重建边界见[构建说明](third-party-rebuild.md)，数据格式见[证据格式](trace-schema.md)。