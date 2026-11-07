# V0.16.0 构建、源码与第三方组件

当前运行入口为 `dist/server.mjs`。V0.16 从 `vendor/legacy-source/src/` 保留的 TypeScript 源码重建单 Agent server/CLI，再组合 `src/control/`、`src/scenario/`、`src/budget/`、`src/model/` 和 `src/local-model/` ESM 模块。历史 vendor 预编译包继续保留，不再作为本版采集实现的不可变输入。控制/场景模块仍是 ESM，不宣称整个运行时已迁移并全面通过 TypeScript 类型检查。

## 当前源码开发路线

使用 Node 24.19.0 和 pnpm 11.19.0，安装依赖及获取 Anvil 需要网络或对应本地缓存：

```powershell
pnpm install --frozen-lockfile
node scripts/setup-runtime.mjs
pnpm build:budget
pnpm build
pnpm typecheck:interfaces
pnpm test
pnpm start
```

- `setup-runtime.mjs` 校验 npm 分发包完整性后获取 Anvil 1.7.1。它需要可用的 `tar`，仅安装 Anvil，不提供 `runtime/node.exe`。源码开发使用系统 Node 即可；真实 Windows 启动器还需要匹配的 Node 放在该路径。CI 从固定 setup-node 运行程序复制。
- `build:budget` 使用仓库内 `tools/solc-0.8.17/` 固定编译器与来源摘要，离线编译 `contracts/upstream/` 中的官方 Permit2 及所需 Solmate 代码。
- `build` 用固定 `solc@0.8.30` 编译 `LabPeerExchange` 和 `LabServiceEscrow`，再执行 `build-legacy.mjs`，从保留源码及根锁文件安装的依赖生成 `build/legacy-*.mjs`；`build-v014.mjs` 消费这些新产物生成兼容桥、CLI 和当前构建信息。锚点必须唯一，否则构建失败。编译不自动下载其他编译器；可用 `SOLC_JS_PATH` 指定本地匹配编译器入口。
- 基础 LabContracts 产物保留在 `contracts/artifacts/`，需要时用 `pnpm build:base-contracts` 重建。
- `typecheck:interfaces`（以及当前 `typecheck` 别名）只检查 `src/control/types.ts` 和 `tests/control-types.test.ts`，不检查全部 ESM 运行时。完整类型迁移仍未完成。
- `pnpm dev` 监听已生成的 `dist/server.mjs`；修改源码后仍需按影响范围重建。`start:budget` 使用主服务；`dev:budget-harness` 仅用于独立开发测试。

仓库的 `.gitattributes` 保持原始文本字节，避免 Git 自动换行破坏固定源码摘要或封存证据。修改内容后产生新的 `sourceHash` 是正常的，不能将原报告哈希回填成新值来伪装复现。

## 发布附件与源码身份

完整 Windows Release ZIP 含运行程序；GitHub 自动生成的 Source code ZIP 和普通克隆不含 Node/Anvil 便携运行程序。既有 `V0.15.3` 标签创建于当前源码同步之前，继续保留旧提交及已上传附件；当前源码请查阅 `main`，不要从标签的 Source code 归档推断新版源码内容。

已上传便携包的原始信息保存在 [releases/V0.15.3-portable-build-info.json](releases/V0.15.3-portable-build-info.json)，原 `sourceHash` 是 `599ca446019431ceda967fc8a474d86a0dc160b2347c4b021391e642f3b65a88`。本次仓库同步改变了构建/测试/文档，新构建哈希可不同。历史报告只能用于它记录的构建与实测范围，新增结果写到 `artifacts/test-results/`。

V0.16 的 `pnpm build` 会重新打包源码实际引用的依赖，但不会自动从上游源码重新编译每一个第三方 npm 包。`build-info.json` 固定当前源文件和 dist 输出，`node dist/cli.mjs doctor` 检验两者。修改依赖或兼容桥后应完整重建并回归，不把新构建当作旧实验的原构建。

## 历史源码与嵌入组件的修改路线

复现 V0.13 时可在独立目录复制 `vendor/legacy-source/` 历史树，按历史提交的锁文件和脚本执行。开发 V0.16 则修改当前保留的 TS 源码并运行根 `pnpm build`；不要使用旧 `scripts/build.mjs` 覆盖当前兼容桥。原依赖替换步骤完整保存在 [archive/v0.13/third-party-rebuild.md](archive/v0.13/third-party-rebuild.md)。

若修改 rpc-websockets 等依赖，按归档步骤编译上游源码、创建 pnpm patch、确认 bundler 实际选中修改输入，再运行当前根构建。仍需核对兼容桥锚点、工具权限、回归与构建清单；单纯把修改后的库放到 bundle 旁边不会替换内部代码。V0.16 未进行修改版第三方库的专门验收。

原实验文件应保留原始构建哈希。分发修改后的组合程序时，保留相应源码、补丁、许可证、修改说明及构建信息。

## 许可证与来源材料

项目原代码采用 [MIT](../LICENSE)。第三方库、运行程序、Permit2 及 Solmate 保留自身许可；根 MIT 不替代它们。见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)、`licenses/`、`contracts/upstream/`、编译器来源清单和便携包运行程序来源记录。

固定 bundle 包含未修改的 rpc-websockets 9.3.9（LGPL-3.0-only）。以下材料继续保留在 `licenses/sources/`：

| 文件 | 内容 |
| --- | --- |
| `rpc-websockets-9.3.9-npm.tgz` | 对应锁文件的 npm 分发包，来源材料含完整性记录 |
| `rpc-websockets-9.3.9-source.tar.gz` | npm gitHead `af8980776b55c2320b790556f775266fd5afc3ce` 的上游源码、配置、许可和测试 |
| `rpc-websockets-9.3.9-provenance.json` | 官方来源、摘要及核对结果 |

原著作权声明在 `licenses/rpc-websockets@9.3.9-LICENSE`，完整许可在 `licenses/LGPL-3.0.txt` 与 `licenses/GPL-3.0.txt`。项目允许为调试该库的修改而修改及逆向组合程序，没有激活或签名机制阻止本地运行修改构建。来源与重建说明记录所交付材料，不是对所有下游分发安排的认证。
