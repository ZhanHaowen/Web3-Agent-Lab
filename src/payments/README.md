# Research payment adapters

These profiles execute real HTTP protocol exchanges and real token bytecode on an independently owned, loopback Anvil chain. They require no commercial payment account or external facilitator. All assets and deterministic Anvil accounts are test-only.

## Supported profiles and boundaries

- **x402 exact**: official `@x402/{core,evm,fetch}` 2.30.0 client, resource server and facilitator. A real HTTP 402 challenge is followed by EIP-3009 signing, verification and an ERC-20 transfer. Settlement and service delivery are separate outcomes.
- **x402 batch-settlement**: official SDK vouchers, upstream `x402BatchSettlement` and `ERC3009DepositCollector` contracts. Service can be delivered while the voucher is committed but unsettled. `settle()` claims and settles actual accumulated charges; provider balance changes are checked independently. `refund()` returns unused channel principal only; it does not refund consumed services.
- **AP2 local authorization overlay**: ES256 merchant checkout plus controller checkout/payment mandates, checkout hash linkage, trusted local issuer keys, amount/payee/chain/token/resource binding, expiry, replay protection and cumulative authorization budget. It follows the current AP2 mandate field conventions and USD integer-cent amount convention. It is a research subset with a custom `research-erc20-x402` instrument and `web3_payment` binding. It is **not** a full AP2 implementation, schema certification, interoperable SD-JWT selective-disclosure flow, identity federation or open-mandate delegation. Sub-cent values are rejected explicitly; no rounding or repeated token scaling occurs.
- **MPP evm/charge**: official `mppx` 0.18.0 native `WWW-Authenticate: Payment` / `Authorization: Payment` / `Payment-Receipt` flow. SDK verifies signatures and challenge-bound payment terms; a custom settler simulates and submits the real EIP-3009 transfer. The token independently enforces nonce replay protection. This profile does **not** implement Tempo/session, Stripe, external providers or production facilitator deployment. AP2 overlay is currently available with the x402 profiles, not MPP.

The local EIP-3009 token permits unrestricted minting for fixtures; do not deploy it with real assets. Batch SDK canonical contracts are installed using Anvil `anvil_setCode` with constructor-initialized upstream runtime. The manifest records originating deployments and runtime hashes. This is genuine execution of upstream contract bytecode in a controlled test environment, not a claim of production CREATE2 deployment. Multicall3's pinned `=0.8.12` pragma is relaxed only in compiler input to compile with pinned solc 0.8.30; the original source remains unchanged and artifact metadata records the transformation.

## API and integration

```js
import {createPaymentEnvironment} from './index.mjs';
import {createMppPaymentEnvironment} from './mpp.mjs';
const env = await createPaymentEnvironment({
  root, dataDir: uniqueRunDirectory,
  scheme: 'exact', // or 'batch-settlement'
  authorization: 'ap2', // or 'none'
  initialBalance: '1000000', budgetBase: '100000',
  emit: async event => collect(event), signal,
});
try {
  const purchase = await env.pay({
    requestId: 'unique-id', providerId: 'discover-lite',
    amountBase: '10000', resource: 'shared-service',
    body: {query: '...'}, result: {coverage: 1},
  });
  // Use only purchase.delivery.result for Agent decisions.
  const reconciliation = await env.settle();
} finally { await env.close(); }
```

`result` is the local service fixture's server-side output; it is returned to the agent only when actually received in an HTTP success response. `fault: 'withheld' | 'http_failure'` produces a genuine HTTP 503 after accepted payment. HTTP failure never automatically releases committed liability. `chargedBase`, `settledBase`, `reservedBase`, `refundedBase` are decimal integer base-unit strings; `reservedBase` is the unsettled portion of `chargedBase`, not an additional charge.

MPP uses `createMppPaymentEnvironment({root,dataDir,...})`, the same result interface, scheme `mpp-evm-charge`, and authorization `none`.

`settle()` reconciles late-mined exact/MPP transactions from receipt Transfer logs. Unknown broadcast outcomes keep their liabilities locked. Batch interruption recovery is deliberately conservative: uncertain deposit/voucher outcomes remain unknown and require inspecting saved evidence; the adapter does not claim crash-safe persistent SDK channel state. Do not resume a new process as if its channel state had been restored.

Each data directory is single-run: an existing `payment-events.jsonl` causes refusal, avoiding mixed raw captures. Different experiments have separate Anvil processes, wallets and dynamic ports. `close()` terminates only its owned process. A non-enumerable `chainAccess` exposes local clients to other trusted experiment adapters; it is not serialized into exports.

## Evidence

- `payment-deployment.json`: SDK versions, profile, test token, accounts, chain, initial block, contract origins and limitations.
- `payment-events.jsonl`: append-only HTTP requests/responses, authorization descriptions, broadcasts, receipts, actual service delivery and financial outcomes.
- `payment-evidence.json`: final events, transactions, unresolved broadcasts and purchases. Raw data stays separate from derived research labels/graphs.
- Transactions contain calldata, receipt/logs, block timestamp and `debug_traceTransaction` callTracer output when available. Missing traces explicitly state `unavailable`; no invented call edges.
- Private keys, mnemonics, reusable payment signatures, AP2 JWTs and HTTP credentials are never exported. Authorization data carries SHA-256 references. Mined transaction calldata is public chain evidence, including already-consumed signatures where present. This is intentionally a sanitized raw capture, not a recoverable credential archive.
- Public adversary views must be independently derived from RPC blocks/transactions/logs, never from private request IDs, resource names, labels, precise HTTP times or AP2 budgets.

## Reproducibility and tests

Dependencies are pinned separately in `packages/payment-adapters/pnpm-lock.yaml`; root packaging builds self-contained runtime bridges. From the repository root:

```powershell
pnpm --dir packages/payment-adapters install --ignore-workspace --frozen-lockfile
node scripts/compile-research-payments.mjs
node tests/research-payments.mjs
node --test tests/research-payments.test.mjs
node tests/research-payments-mpp.mjs
node tests/research-payments-adversarial.mjs
```

Integration tests independently check recipient/payer balances, HTTP failures after payment, deferred batch settlement, leftover-principal refund, wire headers, AP2 cryptographic checks, signature exclusion, idempotency conflicts, token replay rejection and delayed-confirmation reconciliation. Test runs save unique output directories. Seeds do not make cryptographic nonces, network timing or probabilistic model outputs byte-identical; preserve actual differences rather than claiming deterministic whole-run replay.

## Upstream sources

- x402 contracts and SDK audit source: https://github.com/x402-foundation/x402/tree/b70d6d5e3c08804670e254e178e92b16f8629682
- x402 batch specification: https://github.com/x402-foundation/x402/blob/b70d6d5e3c08804670e254e178e92b16f8629682/specs/schemes/batch-settlement/scheme_batch_settlement.md
- AP2 schema reference: https://github.com/google-agentic-commerce/AP2/tree/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/code/sdk/schemas/ap2
- Multicall3: https://github.com/mds1/multicall3/tree/b667d67ecfa5361a81e8f110234ce242613b0012
- MPP: https://github.com/wevm/mppx ; installed npm version 0.18.0 is pinned by lockfile integrity. Audited upstream reference commit `066a75bb2ded40919b2eb135992d51d919c86468` is recorded separately; no unsupported claim that npm metadata declares this git commit.

Vendored upstream licenses are retained beside their source files. OpenZeppelin 5.6.1 and all transitive packages retain their package licenses.
