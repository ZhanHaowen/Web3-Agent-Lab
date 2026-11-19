# V0.18.2 本地测试证据

[测试报告](../../V0.18.2-TEST-REPORT.md)包含范围与结论；summary.json 是本轮汇总。

- baseline/：改造前227项单元测试与类型检查。
- regression/：26阶段完整本地回归原始日志。
- post-portability/：末次图语义/二进制路径修正后最终代码复测。
- live-bnb/：真实 SDK 原始事件、内容寻址数据、派生图及独立检查结果。5次通过、2次RPC故障unknown均保留；不存在公网写入。
- gui/：真实浏览器中的合成离线数据夹具检查，不冒充链上执行。
- module/：开发过程中保留的定向测试；最终测试计数以summary.json为准。
- named-test-cases.csv：最终Node与保留TypeScript逐项结果；包含关系见报告，不重复计总数。

最终来源摘要：`99832d0799876455511da738315e8fceabb0fa885e2be432d7c951472ba7d4e4`。原始记录与派生文件保持目录分离。SHA256SUMS.txt用于文件完整性核对，并非外部可信时间戳或链上真实性证明。

完整测试日志另提供逐字节相同的 `.txt` 副本，以兼容便携包排除运行日志的策略；映射及原始摘要见 `packaging-log-map.json`。`SHA256SUMS.txt` 校验可分发副本。原始测试汇总中的绝对 `.log` 路径仍是本次测试工作目录。
