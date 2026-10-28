# V0.15.3 仓库与 Release 的同步说明

Release 附件和 main 中的代码是分别更新的。上传 Windows ZIP 后，还需要提交当前源码、页面、测试集合、兼容基线、合约产物、构建配置与文档。

## 仓库包含什么

- 当前 ESM 模块：src/control、src/scenario、src/budget，以及 public 页面和 tasks 定义。
- 兼容运行入口：dist/server.mjs、dist/cli.mjs、dist/agent-worker.mjs 和 vendor 固定基线。
- 官方 Permit2 源码、离线编译器、所需合约产物与第三方许可证。
- 当前 README、docs/tests/examples 索引及 Windows 验证工作流。
- 历史 TypeScript 源码和通用文档归档；原始报告保留原构建哈希。

不提交 runtime、node_modules、运行数据、凭据或本次测试的 artifacts。根目录忽略规则不能误伤 contracts/artifacts 中必需的合约产物；Git 属性须保留固定源码与证据的原始字节。

## 发布顺序

1. 从 main 建立升级分支，合入变更，使用锁定工具链构建并复跑测试。
2. 查看变更与测试结果，提交并推送分支。可审查 Pull Request 后合并，也可按仓库权限进行正常的快进更新。
3. main 更新后核对 README、测试索引和对应 Actions。新测试输出写入 artifacts/test-results，不覆盖旧报告。
4. 用户直接运行时下载 Release 的完整 Windows ZIP；源码仓库不包含便携运行程序。

本次本地验证见 [repository-sync-v0153-validation.json](repository-sync-v0153-validation.json)，托管 CI 以 GitHub 对应提交为准。

## 既有标签

当前 V0.15.3 Release 在源码同步之前创建，其标签仍指向旧提交。因此自动生成的 Source code ZIP 仍是该旧提交；已上传的 Windows 附件与它分别识别。保留原标签和发布附件，当前源码请查阅 main。以后发布新版本时，应先提交源码，再让新版本标签指向实际发布提交。
