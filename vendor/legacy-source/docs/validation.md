# V0.13 Beta 发布验证

记录日期：2026-10-19（Asia/Shanghai）。程序0.1.3，展示/发布标识V0.13，修订beta-1，检查器2.2.0。最终构建源码摘要为 `3f10a3f81cae7c8cfc622005a8b81a4eeaadb823cd693961d08ccb91d437d6d3`；逐文件摘要见build-info.json。

## 反馈逐项验收

| 编号 | 用户问题 | 实际验收 |
|---|---|---|
| F1 | 图混乱，不能筛选/放大/高亮 | 关系多选、颜色、节点/边点击、邻接高亮、缩放/拖动/大视图/展开、完整下载和离线回放；在生产相同CSP与实际服务下验证真实颜色和下载内容。 |
| F2 | 任务/状态筛选失效，含义不清 | 中文/英文关键词与3个下拉条件AND组合，刷新保留；错误收款人可同时显示交易成功、任务失败；纯查询明确无交易。 |
| F3 | 模型、输入和配置难查 | 请求别名与响应model分列；直接打开本次输入/参数/脱敏配置；缺失数据不补写；接口自报不证明底层权重版本。 |
| F4 | 推进100秒只增1秒 | 1块×100秒、3块×7秒、非法数值拒绝及真实GUI区块时间差全部通过。 |
| F5 | 自定义30/27仍按10/9判定 | taskParameters统一驱动脚本、guard、checker和离线复检；四种自定义写入任务、六位小数、解析及歧义拒绝通过。 |
| F6 | 出块后Agent未继续决策 | 仅检查器不调用模型；续行真实历史+新链状态进入关联子运行；多轮累计原目标、交易去重、父raw不变、密钥脱敏及非法续行拒绝通过。 |

## 本机执行结果

| 检查 | 结果 | 报告或复跑入口 |
|---|---|---|
| 固定依赖构建与TypeScript | 通过 | build-info.json；pnpm build；pnpm typecheck |
| 单元及真实Anvil测试 | 145/145，无跳过，含子测试 | unit-tests-v013.txt；pnpm test |
| GUI DOM结构及行为 | 24/24 | ui-smoke-v013.txt；node --test tests/ui-smoke.mjs |
| 反馈专项HTTP API | 22/22 | v013-regression.json；scripts/v013-e2e.mjs |
| 原HTTP综合回归 | 15/15 | e2e-results.json；scripts/e2e.mjs |
| 既有连续实验反馈 | 9/9 | feedback-e2e-results.json；scripts/feedback-e2e.mjs |
| 授权金额精度 | 8/8 | amount-validation.json；scripts/amount-e2e.mjs |
| 轨迹与图接口 | 10/10 | trace-e2e-results.json；scripts/trace-e2e.mjs |
| Edge真实CSP与API fixture | 11项 | v013-gui-regression.json；tests/gui-browser.cjs |
| Edge实际服务与真实Anvil联动 | 10项，无页面错误/CSP违规 | v013-real-gui.json；模型为协议fixture |

五套HTTP脚本共64项实际执行用例。任务规格9项、时间/历史9项及后端API7项已包含在145项中，不重复相加。浏览器fixture用于界面交互；实际服务与链联测另行执行，未把fixture断言当作实际EVM行为。

主测试实例使用隔离端口4453/18593和QA数据目录，单元测试各自使用临时目录与独立链端口；不修改用户实验数据。报告保留UTC时间戳，本记录日期按Asia/Shanghai表示。

## 样例与复现

原有38份V0.12样例保留原始字节和原构建身份；新增8份V0.13样例在examples/feedback-v013，包括自定义转账、授权、兑换/存入、参数纠错、等待确认、会话续行及交易成功但任务失败。46份样例逐一做原始哈希/事件引用、CLI verify/check、派生哈希、图端点校验，证据见offline-validation-v013.json和example-validation-v013.json。新旧sourceHash分别保留，不能统一改写成新构建。

模型使用明确标记的本地协议服务，用于检验消息、工具、状态和采集链路；不代表真实LLM成功率或供应商模型快照验证。Windows使用headless Edge和真实Anvil；Mac桌面双击、权限提示及GUI尚未实机验收，三平台托管CI记录见ci-validation-v013.json。

续行交易/gas使用transaction_scope=cumulative_task，模型调用/token使用model_scope=current_run；父子gas不可直接相加，应按交易哈希去重。手动时间是每块间隔。相同参数与初态不保证新LLM响应或新run字节相同。

## 补充修复和历史证据

模型端点的用户名密码、query和fragment在创建原始记录前拒绝；专项测试确认400且档案数不增加。图动态颜色改用CSSOM，保留CSP，无unsafe-inline。

V0.12历史说明在[历史验证](validation_V0.12.md)。部分根目录同名报告现为V0.13；原始旧报告请使用[v0.12 tag](https://github.com/ZhanHaowen/Web3-Agent-Lab/tree/v0.12/docs)，不能用当前报告替代历史证据。

## Windows 解压包验收

使用 Windows ZIP 自带的 Node、Anvil 和编译程序，在隔离端口4463/18603实际运行，反馈专项22/22通过；8个新样例的 CLI verify/check/graph 共24次通过。CRC、源码摘要和禁入目录检查通过，Mac脚本LF及执行权限正确。证据见package-validation-v013.json与package-v013-regression.json。最终仅补文档的重打包须保证应用及运行文件字节不变；最终ZIP哈希由Release校验表给出。

## GitHub 三平台验证

运行 https://github.com/ZhanHaowen/Web3-Agent-Lab/actions/runs/39147266797 已 completed/success；测试提交为5585d4d8371c229042d8b51658d16cc7febf628e。Windows、macos-latest与macos-15-intel均通过固定依赖安装、Anvil下载校验、构建、类型检查、pnpm test和UI DOM测试。远程精确用例数量未从日志另行提取，不将本地145/24冒充远程观测计数。报告ci-validation-v013.json保存各step结论。最终发行提交仅追加本文档和验收报告，应用源码摘要及已实测Windows程序字节不变。Mac托管测试仍不等同桌面GUI实机验收。
