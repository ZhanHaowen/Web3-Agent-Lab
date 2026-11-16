# GUI final repeat after pause-gate fix

Run completed: 2026-11-16T06:05:51.545Z. Real browser: locally installed Microsoft Edge, headless Playwright. The fixture used isolated Anvil through standard EVM JSON-RPC. No public-network transactions were sent.

Verified `build-info.json` source hash: `8db44894e4113d749779100beedf56279fe8c3b73502f18b7ce05cf2e674bd02` (built 2026-11-16T06:04:45.92Z).

- Real browser checks: **15/15 passed**, no browser JavaScript errors.
- Static and DOM interaction tests: **10/10 passed**.
- Five task paths ran real isolated EVM transactions and independent checks: balance, transfer, approve, swap, swap_deposit.
- The parameter/pause case used amount 22, paused before a tool and before transaction submission, and resumed to the expected chain result.
- Sealed-evidence recheck, raw event details, graph nodes, manifest/bundle/GraphML/CSV downloads, readonly reattachment and zero-request offline replay passed.
- Offline replay was checked after a polling interval; mobile layout was checked at 390 px width.
- API/local model selectors were checked in the GUI. This GUI run does not itself assert actual local-model task competence; separate actual-Qwen evidence provides those results.

Commands, run from `work/public-web3-agent-lab`:

```powershell
$env:LAB_TEST_ARTIFACT_DIR='<workspace>/outputs/testnet-preview-dev/browser-final-02'
$env:TESTNET_PLAYWRIGHT_MODULE='__LOCAL_HOME__/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:TESTNET_BROWSER_PATH='__LOCAL_ABSOLUTE_PATH__ Files (x86)/Microsoft/Edge/Application/msedge.exe'
node tests/testnet-browser.mjs
node --test tests/testnet-ui.test.mjs
```

Raw evidence: `browser-command.log`, `ui-unit-results.txt`, `testnet-browser-results.json` and the screenshots/downloads under `testnet-browser/`. The earlier `browser-final` run is retained separately. Both command exit codes were 0. No repository code was modified during this repeat.
