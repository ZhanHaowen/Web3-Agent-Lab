# V0.18.3 公开测试证据

这些文件来自 **2026 年 11 月 23 日实际执行的 Windows 本地隔离回归**，用于配合 [V0.18.3 测试报告](../../V0.18.3-TEST-REPORT.md) 核验发布说明。它们是可公开的汇总和逐项说明，**不是完整实验数据集，也不是新执行了一轮测试**。

后来独立完成的 GitHub Windows 验证单独保存在 [ci 子目录](ci/README.md)，不覆盖本目录的本地记录。远端同样通过 26 个阶段、13 项恢复专项、23 项预算及 BNB 离线冒烟，并保留 AT-15 部分覆盖。

实际测试版本为 `0.18.3`，Node `24.19.0`，本地 Anvil `1.7.1`。被测源文件哈希：

```text
feee79814a33eb5f19698a899586a5892706f40f6c5f512d0f0c5414784715dd
```

代码基线为 `333ffb8611386a7690348e86910da8427cd5edba`。测试时修复尚未提交，因此该基线提交本身不等于最终被测文件；应同时核对源文件哈希和发布代码。全量回归在北京时间 17:33:19—17:41:17 执行，专项回归在 17:33:53—17:36:28 执行。

## 文件与实际结果

- [review-summary.json](review-summary.json)：最终审核汇总，包含运行环境、不同层级的计数、限制及原始证据哈希。
- [full-summary.json](full-summary.json)：26 个回归阶段的命令、耗时、退出码和原始日志 SHA-256；26/26 阶段通过。其内单元测试 317/317、旧版源代码测试 145/145，无失败或跳过。26 个阶段与 317、145 个测试属于嵌套统计，不能累加成统一用例数。
- [peer-summary.json](peer-summary.json)：13 项交易恢复与报价绑定专项全部通过，包含执行编号、交易哈希、nonce、真实崩溃退出码和逐项状态。每项清理错误列表均为空。
- [peer-cases-zh.md](peer-cases-zh.md)：上述 13 项的中文逐项说明，区分已完成成交、仅恢复到下一暂停点、退款完成与拒绝错误调用。
- [budget-results.json](budget-results.json)：23/23 项预算约束补充测试通过，覆盖普通账户和智能账户的权限限制、人工复核、精确金额及有效期检查。
- [bnb-smoke-results.json](bnb-smoke-results.json)：独立 BNB SDK 模块的 `x402-offline` 场景通过，记录 14 个事件、20 个实验包文件；不代表公网或分叉交易测试。
- [legacy-acceptance-summary.json](legacy-acceptance-summary.json)：保留原验收补充套件的完整汇总，包括 **AT-15 的 `BLOCKED` 和整体 `NOT_FULLY_ACCEPTED`**，没有将部分覆盖改写为完全通过。
- [research-dataset-smoke-report.json](research-dataset-smoke-report.json)：研究数据链路冒烟测试通过，保留全部 36 个样本，其中 24 个为任务失败或未知；训练/验证/测试划分为 18/6/12。`testTruthPassed: false` 保留原值。这里验证采集、保留及划分行为，不能表述为全部任务成功或推断模型有效。
- [source-index.json](source-index.json)：原始文件相对路径、原始字节数与 SHA-256、公开副本字节数与 SHA-256，以及转换和筛选说明。

## 派生副本与原始记录的区别

JSON 文件只将本机仓库绝对路径替换为仓库相对路径，并统一缩进与末尾换行；实际状态、交易哈希、时间、计数和失败说明均保留。中文逐项说明只增加公开发布提示，正文保留。因此公开副本的 SHA-256 可能不同于原件，应分别使用索引中的 `sourceSha256` 和 `publishedSha256` 核对。

汇总中出现的 `Pxx.result.json`、`Pxx-*.json`、日志和 `artifacts/…` 路径指向测试机器上的原始证据。它们没有随这组最小汇总全部公开，不能将这些引用误认为仓库中现有的下载文件。源代码中的测试脚本可用于重新执行并生成自己的完整证据；原件哈希用于校验已有原件，不保证重新执行后具有相同时间戳、随机编号或交易哈希。

## 必须保留的覆盖边界

1. **AT-15 仍为部分覆盖。** 目标不相容时的拒绝和步数耗尽两个无资金移动分支通过，但脚本在第一方拒绝后结束，没有生成严格旧验收标准要求的另一方独立拒绝事件。回归进程退出成功不能替代该验收条件。
2. 原验收补充汇总中的 AT-11 注释属于该旧套件的覆盖说明。新专项 P01、P04、P07、P10 增补了接口层的 pending、迟到确认和重启恢复验证；本轮仍没有浏览器录屏或人工 GUI 视觉验收。
3. 专项运行使用真实本地 EVM 和独立进程；模型交互使用确定性工具调用协议夹具，**不是实际 LLM 能力测评**。P09 使用原工作台执行路径，其余专项主要使用独立 Agent 执行路径。
4. 没有实际公网测试网写入、macOS 实机运行、新 EXE 验收、公链重组/最终性测试或性能扩展性评估。不能将本地 Anvil 回执成功扩展为全部网络上的不可逆确认保证。
5. `legacy-acceptance-summary.json` 中的历史 `baseCommit` 是旧测试夹具沿用的元数据，原值未修改；本轮实际仓库基线、版本与被测哈希以本目录审核汇总及全量构建记录交叉核对。
6. 缺少接受快照的旧版未完结执行不在自动迁移范围；应先在旧版核对 pending 和开放托管资金。

## 公开材料检查

仅选取上述汇总及说明，未复制数据库、运行时私有目录、签名交易原文、私钥、助记词、API 凭据或完整原始实验包。选中文件经过字段/常见凭据格式扫描与内容复核，未发现凭据值；这是对本目录所选文件的检查，不是对所有本地实验数据的安全声明。

可在仓库根目录执行下列命令核验公开副本哈希；不需要访问本机原始路径：

```powershell
./runtime/node.exe -e "const fs=require('node:fs'),c=require('node:crypto'),p='docs/test-results/v0.18.3-publication/'; for(const f of JSON.parse(fs.readFileSync(p+'source-index.json')).files){const h=c.createHash('sha256').update(fs.readFileSync(p+f.published)).digest('hex'); if(h!==f.publishedSha256)throw Error(f.published); } console.log('Published evidence hashes verified');"
```

完整执行命令、功能影响和升级注意事项见 [测试报告](../../V0.18.3-TEST-REPORT.md) 与 [更新说明](../../V0.18.3-RELEASE-NOTES.md)。
