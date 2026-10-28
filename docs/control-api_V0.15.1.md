# V0.15.1 控制接口中的交易意图边界

本文描述当前 `src/control/routes.mjs`、`tx-routes.mjs`、`gateway.mjs` 与 `worker.mjs` 的实际接口，不将拟议接口当作已实现功能。完整任务控制仍由任务中心操作手册说明。

## 身份与权限

Agent 请求携带自身 `Authorization: Bearer <identity.token>`，并使用当前租约代次。V2 管理员通过独立令牌换取 HttpOnly 会话；旧 health CSRF 不是管理员身份。Agent Bearer 无权读取完整 Execution 或管理员导出。

交易意图由受控工具路径先准备并持久化。以下接口只操作已绑定本 Agent、当前 Execution 与租约的既有意图，不接受任意收款方或 calldata 覆盖。

| 请求 | 用途 | 请求字段 |
|---|---|---|
| `GET /api/v2/tx-intents` | 读取本 Agent 的意图 | 无请求体 |
| `POST /api/v2/tx-intents` | 准备签名：核对身份并返回既有意图的 unsigned 内容 | `intentId`、`executionId`、`leaseEpoch` |
| `POST /api/v2/tx-intents/<intentId>/submit` | 提交对应签名命令的签名 | `commandId`、`executionId`、`leaseEpoch`、`signature` |

当前没有 `/api/v2/tx-intents/prepare` 这个额外路径；准备动作使用集合路径的 POST。`submit` 只接受上述字段，不能用请求体更改已准备的交易。

## 从准备到广播

1. 网关为合法工具动作预留 nonce，持久化意图、发送方、目标、calldata 哈希与 unsigned 交易，并向绑定 Agent 下发签名命令。
2. Agent 用上述准备接口获取该意图，在本进程读取 `wallet-secret.json` 完成本地签名。控制端不读取钱包秘密。
3. Agent 调用 submit。控制端检查当前租约、Execution 仍获授权、签名命令归属与 nonce 预留，恢复签名地址并比对发送方。
4. submit 成功返回 `signature_verified_not_broadcast`，表示签名验证完成。网关随后在广播前持久化交易哈希，再广播并记录回执；submit 返回本身不证明上链或业务成功。

签名在控制端只作短暂内存交接。持久化记录保留交易哈希及状态，不保存原始签名或已签原始交易字节。网络响应丢失后应按已持久化意图与哈希对账，不用新 nonce 另付一次。

这些接口已经存在于运行源码中，仍需依据对应构建的测试报告判断其身份隔离、崩溃恢复与重放对抗覆盖程度。接口存在不等于整个验收标准已通过。
