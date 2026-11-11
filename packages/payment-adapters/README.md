# Isolated protocol SDK dependencies

This independently pinned package keeps official x402 and MPP SDK dependencies separate from the platform's existing AgentKit dependency graph. Install using `pnpm --dir packages/payment-adapters install --ignore-workspace --frozen-lockfile`.

`index.mjs` and `mpp.mjs` are stable bridges; platform packaging may bundle them as `runtime.mjs` and `mpp-runtime.mjs` so deployed software does not require a development node_modules tree. Generated Solidity artifacts are local test fixtures, not production deployment artifacts.

Protocol scope, limitations, sources, tests and export security are documented in `src/payments/README.md`. Upstream licenses are in the corresponding vendor directories; source hash manifests are embedded in compiled artifacts.
