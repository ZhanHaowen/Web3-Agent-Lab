# V0.18.0 GitHub Actions 验证证据

[Windows V0.18.0 verification / run 43817559055](https://github.com/ZhanHaowen/Web3-Agent-Lab/actions/runs/43817559055) 已完成，结论为 success。

- 被测代码提交：`5d00cfc215daa33c3040909edff0948326eb0138`。
- 原始构建源码指纹：`bb1039fb642b27d9d893158f73e81ad81cceb6c58e9f1ea2f9b45dceb533c5ea`，与发布前本地构建一致。
- 执行环境：GitHub-hosted Windows x64，Node.js 24.19.0。
- 结果：26/26 阶段通过；基础单元测试 227/227、原单 Agent 源码测试 145/145。详细项目以原始 summary 和各阶段日志为准。
- 回归时间（UTC）：2026-11-16T06:34:53.693Z 至 2026-11-16T06:44:16.107Z。

## 文件内容与完整性

保留原始 artifact `windows-v0180-validation` 的全部 40 个文件：26 份完整阶段日志、`summary.json` 和 `results/` 下 13 份结果 JSON。复制时逐文件验证字节完全一致，没有改写日志中的 GitHub runner 通用路径。

`github-run.json` 是 GitHub Actions 的 headSha、job、step 和结论元数据；`github-evidence-readback.json` 是另外完成的已发布仓库证据只读核对副本。`scan-summary.json` 记录本次发布前模式扫描、原始文件清单和哈希。`SHA256SUMS` 覆盖本目录中除自身以外的文件。

扫描没有发现匹配规则的非脱敏凭据、默认 Anvil 私钥或本机用户目录。模式扫描不能证明任意编码的秘密均不存在；本目录不包含下载临时签名 URL、完整实验数据包、私钥、真实模型服务配置或用户本机数据。

## 验证边界

本 CI 使用隔离的本地 Anvil / 标准 EVM RPC 验证测试网适配器与原功能回归。通过结果不等于六个公网测试网已完成真实成交验收，也不覆盖 macOS 实机、真实商业模型调用或 GUI 浏览器操作。浏览器和真实本地模型验证见本版本各自报告。

原始 summary 的 scope 是测试脚本产生的通用字符串；其中“no GitHub update”表示测试脚本本身不发布内容，不应解读为此次运行未发生在 GitHub Actions。目录后续仅作为文档证据发布；被测代码身份由上述提交和源码指纹确定。
