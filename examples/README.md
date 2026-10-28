# 样例与离线复查

本目录保存已封存的研究证据。保留每个样例自身的版本、构建哈希、原始事件和预期结论，不统一改写为当前构建。重新运行可能产生不同钱包、时间、交易哈希和模型输出。新测试生成的样例放在 `artifacts/test-results/`，不会覆盖这里。

## 按证据类型选择读取入口

| 目录 | 内容 | 离线入口 |
| --- | --- | --- |
| 根目录及 `amount-fix/`、`feedback-v013/` | 单 Agent 历史任务、参数和续行证据 | `node dist/cli.mjs verify` / `check`，由兼容读取器分派 |
| `peer-v014/`、`service-v015/`、`v2/` | 双 Agent、服务和任务中心场景证据 | `node dist/cli.mjs verify` / `replay` / `check` |
| `budget/`、`budget-v0153/` | 跨路径资产授权与预算控制 | `node src/budget/cli.mjs verify` / `check` |

每条命令后都要接完整的 JSON 文件路径。便携包用户将 `node` 换成 `runtime\node.exe`。先 `verify` 检查包内完整性，再 `check` 评估业务断言。`check` 返回非零可能是案例有意展示预算违规，须结合检查明细判断，不能据此认定文件损坏。`verify` 通过也不证明采集者身份或历史状态真实。

## V0.15.3 预算样例

| 文件 | 参数与目的 |
| --- | --- |
| [01-custom-split.json](budget-v0153/01-custom-split.json) | 余额 1000、预算 300、首笔 175、许可 180；分离计数展示合计 355 的跨路径超支 |
| [02-custom-unified.json](budget-v0153/02-custom-unified.json) | 相同金额，统一预算在第二笔签名前拒绝 |
| [03-fractional-split.json](budget-v0153/03-fractional-split.json) | 余额 2、预算 0.75、首笔 0.4、许可 0.5；小数金额对照 |
| [04-generated-boundary.json](budget-v0153/04-generated-boundary.json) | 预算 250、首笔 90、第二笔 160；统一预算恰好用尽边界 |

例如：

```powershell
node src/budget/cli.mjs verify examples/budget-v0153/01-custom-split.json
node src/budget/cli.mjs check examples/budget-v0153/01-custom-split.json
node src/budget/cli.mjs check examples/budget-v0153/02-custom-unified.json
node dist/cli.mjs verify examples/v2/peer-normal.json
```

第一份分离计数样例完整性应可通过，业务检查会报告风险复现/预算违规；统一预算样例用于验证阻止第二笔。此处只解释已封存案例，不连接链或发出新许可。

参数不限于这些组合。要产生自己的证据，请在主平台“跨路径资产授权与预算控制”页自定义金额或按分类生成，再运行与导出。详见[操作手册](../docs/操作手册_V0.15.3.md)和[证据格式](../docs/trace-schema.md)。