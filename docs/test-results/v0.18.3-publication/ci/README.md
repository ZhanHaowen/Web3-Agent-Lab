# V0.18.3 GitHub Actions 独立回归证据

本目录来自已经完成且结果为 **success** 的 [GitHub Actions 运行 45150369771](https://github.com/ZhanHaowen/Web3-Agent-Lab/actions/runs/45150369771)，运行代码提交为 `6dec27e81e1cc5c4f277bb0e28a08a5cd37bd85d`。这是一轮独立 CI 执行，不是把本机历史测试换名后作为 CI 结果。

版本：**0.18.3**；被测源文件哈希：`feee79814a33eb5f19698a899586a5892706f40f6c5f512d0f0c5414784715dd`。实际环境为 Windows x64、Node 24.19.0、本地 Anvil。原始时间、命令、回执摘要和状态值见对应 JSON。

- [full-summary.json](full-summary.json)：26/26 阶段通过；其中单元测试 317/317、旧源代码测试 145/145。核验器另行验证了 26 份原始日志哈希，并核对两组测试的日志计数；这些数字属于不同统计层级，不累加为统一用例总数。
- [peer-summary.json](peer-summary.json)：13/13 项交易恢复与报价绑定专项通过，各项清理错误为空；逐项记录已与下载的 P01—P13 原始 result 文件核对一致。
- [budget-results.json](budget-results.json)：23/23 项预算约束通过。
- [bnb-smoke-results.json](bnb-smoke-results.json)：BNB SDK 的 x402-offline 场景通过，14 个事件、20 个包文件。
- [legacy-acceptance-summary.json](legacy-acceptance-summary.json)：保留旧验收的 **NOT_FULLY_ACCEPTED** 和 **AT-15 BLOCKED**。两个无资金转移分支通过，但脚本在第一方拒绝后结束，没有独立的 Maker 拒绝事件。不能将 CI success 表述为全部历史验收条件已覆盖。
- [independent-verification.json](independent-verification.json)：完成状态及提交核验、文件来源、原始 SHA-256、逐阶段日志哈希和具体范围。

以上五份报告是 GitHub Artifact 下载后的**原字节副本**，没有更改状态、数值、哈希或路径；其中 CI runner 路径和未公开文件引用只是原始运行记录，不保证可作为仓库下载链接。完整原始日志已核验但未在本目录重复发布。未复制数据库、运行时私有材料、API 密钥或签名原文。

本轮使用确定性模型协议夹具，不是实际 LLM 能力评估；没有验证 macOS、浏览器人工视觉、公共测试网写入、公链最终性/重组或新 EXE。旧 AT-11 注释属于旧套件范围，新专项对接口级 pending 和恢复的补充以 peer-summary 为准；本轮仍没有录屏验收。旧夹具 baseCommit 沿用历史值，实际 CI 提交和源文件哈希以本目录独立核验记录为准。

CI 平台的成功结论与上述保留的覆盖限制同时成立。[上级说明](../README.md) 和 [版本测试报告](../../../V0.18.3-TEST-REPORT.md) 说明本地证据与发布范围。
