# V0.13 Beta 反馈回归样例

本目录新增8份真实 Anvil 实验包：6份任务成功、1份原始 pending、1份链上成功但任务失败。此前38份V0.12样例及其索引保持原字节与原构建版本。

模型模式样例使用确定性的 HTTP 协议替身，`data_origin=protocol_fixture`；它们验证采集、金额校验、模型字段与续行基础设施，不能用于报告真实大模型能力。其余为脚本基线。

具体参数、反馈编号、原回归用例名称、RUN ID 和构建哈希见 index.json。06与07为关联父子；父工具返回保持pending，子运行中的确认状态来自新采集的链证据。父子 gas 不能直接相加；子运行交易成本范围为 cumulative_task，模型成本范围为 current_run。

图筛选、缩放等GUI行为另见 docs/v013-gui-regression.json；本目录原始包不受GUI筛选影响。CLI verify/check/trace-files均可离线运行。检查旧样例时使用其记录的目标和历史初态，不把旧构建标注改成V0.13。
