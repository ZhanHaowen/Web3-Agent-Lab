# V0.12 发布验证与既有验证记录

## V0.12 版本升级

记录日期：2026 年 10 月 14 日。显示及发布包版本 `V0.12`，程序版本 `0.1.2`，修订 `beta-1`，检查器仍为 `2.1.0`。本次整合 V.011 金额修复版的既有功能，统一程序、GUI、CLI 与启动脚本的版本标识；依赖锁和检查器算法不因版本升级而改变。

版本标识更新后已实际执行 TypeScript 静态检查、修改脚本的 JavaScript 语法检查和 diff 空白检查，均通过。随后重新编译合约及应用，并对最终构建执行下表中的测试。构建源码摘要为 `a9259402915b5c6d535ac16857a3050f90367cb232c55df859cb63febcf1d15e`，与 `build-info.json`、38 个重新采集的示例包及相关接口报告一致。

| V0.12 本次检查 | 结果 | 证据 |
|---|---|---|
| 固定版本合约和应用构建 | 通过 | build-info.json |
| 单元与真实 Anvil 测试 | 119/119 通过，含子测试 | docs/unit-tests.txt |
| GUI 结构及状态测试 | 18/18 通过 | docs/ui-smoke.txt |
| 原使用反馈接口回归 | 9/9 通过 | docs/feedback-e2e-results.json，build 为 V0.12 |
| 金额修复专项接口 | 8/8 通过 | docs/amount-validation.json |
| 轨迹与图接口回归 | 10/10 通过 | docs/trace-e2e-results.json |
| 35 个脚本基线重新采集 | 全部达到各自预期状态 | examples/index.json |
| 3 个金额协议样例重新采集 | 2 个纠正成功、1 个保留超额授权失败 | examples/amount-fix/index.json |
| 38 个示例离线校验和独立检查 | 全部通过；派生文件哈希、图关系端点、构建摘要一致 | docs/offline-validation.json、docs/example-validation.json |

本次接口验收共 27 项。测试服务使用隔离端口 `4437/18577` 和 `data/qa-v012`，完成后已通过关闭接口停止。未修改既有用户研究数据。报告中的 `V.011-user-feedback` 是历史回归用例组名称；其本次 `build` 字段标识实际测试版本 V0.12。

本次未重新执行旧有 HTTP 综合用例 15 项、独立模型接口用例 6 项、Edge 浏览器操作及 NetworkX 互操作验收；下节保留此前金额修复版的验证范围，不将这些旧报告计入 V0.12 新执行数量。GUI 结构测试不等同于真实浏览器或 macOS 真机测试。

公开仓库提交 `42a7fdf2d30b19b5e0fedfef250bca814b31bb5c` 已通过 GitHub Actions 的 Windows、macOS Apple Silicon 和 Intel 三个平台的固定依赖安装、构建、类型检查和测试。[远程运行记录](https://github.com/ZhanHaowen/Web3-Agent-Lab/actions/runs/38572309517)及 `docs/ci-validation.json` 保存对应提交和结果；后续发行提交仅补充文档与验证报告，应用源码及上述构建摘要不变。托管 CI 测试不等同于 Mac 桌面安装与 GUI 实机验收。

解压后的 Windows V0.12 部署包已使用其自带 Node 与编译程序实际运行：授权 20、连续兑换 10 均成功，授权余量从 20 降为 10；包内 CLI 的完整性验证、独立检查和图生成通过。Windows/macOS ZIP 的文件完整性、源码摘要及无用户数据检查通过，macOS 启动脚本 LF 与执行权限正确。对应证据见 `docs/package-validation.json`；文档更新后的重新打包仅复查文件与哈希，不重复计入一次应用执行测试。

模型测试仍使用明确标记的本地协议模拟器，不代表真实 LLM 能力；macOS 运行文件的打包与完整性验证不等同于桌面实机执行。

## 既有 V.011 金额修复版验证

验证日期：2026年10月14日。显示版本V.011，程序版本0.1.1，发行V.011-Trace-Fix1，修订trace-2，检查器2.1.0。此节描述当时验证范围；上表已重跑项目的同名报告文件已更新为 V0.12，不再作为旧构建的独立证据。保留的历史报告以其中的 build/sourceHash 为准，当前根目录 build-info.json 不用于代替历史版本身份。依赖锁未升级。

| 检查 | 结果 | 证据 |
|---|---|---|
| TypeScript静态检查 | 通过 | tsc --noEmit |
| 单元与真实Anvil测试 | 119/119通过，含子测试 | docs/unit-tests.txt |
| 原有HTTP回归 | 15/15通过 | docs/e2e-results.json |
| 原使用反馈回归 | 9/9通过 | docs/feedback-e2e-results.json |
| 模型协议与真实链交互 | 6/6通过 | docs/model-e2e-report.json；非真实LLM |
| 轨迹与图接口回归 | 10/10通过 | docs/trace-e2e-results.json |
| 金额修复专项接口 | 8/8通过 | docs/amount-validation.json |
| GUI结构及状态测试 | 18/18通过 | docs/ui-smoke.txt |
| Windows Edge实际GUI操作 | 通过 | docs/gui-e2e-results.json、trace-gui-e2e-results.json、amount-gui-validation.json |
| GraphML和JSON互操作 | 通过，NetworkX3.5读取一致 | docs/graphml-validation.json |
| 示例包离线校验与独立检查 | 38/38通过 | docs/offline-validation.json；35个脚本基线与3个金额协议样例 |
| macOS运行文件 | 复用校验通过的官方arm64/x64文件 | runtime-provenance.json；未在Mac真机执行 |

金额专项先传入错误的20000000，再传入20：只产生一笔正确授权交易；原始错误提议、tool.validation、工具返回及后续模型请求保留。连续兑换错误输入10000000被拒绝后改为10，复用已有20授权，剩余10。不开启固定金额校验时复现实际超额授权：初态100000000000000，新的approve为1000000000000000000000，兑换消耗10000000后真实余量999999999999990000000。检查器2.1.0忠实核算余量，同时继续判定授权范围不合规。合法的前置授权不会被作为无关交易拒绝。

119项测试还覆盖动态存入额只用本轮原始兑换证据、错误账户/旧余额拒绝、已有B与份额保留、schema_only错误实验、未知及待确认交易、快照/环境身份、交易记录顺序、最大授权、重复正确授权、记录失败、图的显式拒绝状态、未执行工具不伪造合约调用、GraphML/JSON和原始哈希校验。

GUI验收实际点击默认金额校验、切换研究模式并检查记录标签、查看错误参数与纠正调用、展开合约金额换算、点击图节点、导入完整实验包、离线图下载和移动端布局。测试截图仅用于内部质量检查。

模型服务为明确标记的本地协议模拟器，不代表真实LLM能力或外部端点兼容性验证。没有使用外部模型凭据或公共主网RPC。只使用隔离测试端口、测试数据和实验账户，不修改原软件的用户数据。Mac运行包未经本次真机验证，Apple Silicon需macOS15.5+，Intel需13.5+。

固定任务金额校验是一项显式实验条件，不代替对象、账户和副作用验证。fixed_task与schema_only应分组分析，不能将模型纠错后的最终成功解释为首次参数正确。连续历史实验仍不支持跨会话自动恢复；旧原始记录和标签不重写，复检追加新检查器版本结果。
