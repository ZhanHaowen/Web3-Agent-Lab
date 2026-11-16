import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { startTestnetFixture } from './testnet-fixture.mjs';
import { artifactDirectory, artifactPath } from './helpers/artifacts.mjs';

if (!process.env.TESTNET_PLAYWRIGHT_MODULE) throw Error('Set TESTNET_PLAYWRIGHT_MODULE to an installed Playwright module.');
const { chromium } = createRequire(import.meta.url)(process.env.TESTNET_PLAYWRIGHT_MODULE);
const out = artifactDirectory('testnet-browser');
const results = [], errors = [], requests = [];
const pass = name => { results.push({ name, passed: true }); console.log('PASS', name); };
const fixture = await startTestnetFixture({ out, autoDeploy: false, receiptTimeoutMs: 5000 });
let browser, page;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.TESTNET_BROWSER_PATH ? { executablePath: process.env.TESTNET_BROWSER_PATH } : {}) });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  // The focused fixture serves only /testnet assets and APIs. Reuse the actual
  // shared stylesheet without replacing any application or network response.
  await page.route(fixture.base + '/style.css', route => route.fulfill({ contentType: 'text/css', path: join(fixture.root, 'public/style.css') }));
  await page.goto(fixture.base + '/testnet.html');
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('可先不填私钥'));
  assert.equal(await page.locator('#network option').count(), 6);
  assert.equal(await page.locator('#candidate-networks .candidate-row').count(), 14);
  assert.equal(await page.locator('#start-run').isDisabled(), true);
  const links = await page.locator('aside a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  for (const path of ['/', '/tasks.html', '/services.html', '/budget.html', '/research.html', '/local-model.html']) assert.ok(links.includes(path));
  pass('six enabled profiles, fourteen catalog-only profiles and original local navigation');

  await page.locator('#rpc-url').fill(fixture.rpcUrl);
  await page.locator('#private-key').fill(fixture.privateKey);
  await page.locator('#recipient').fill(fixture.recipient);
  await page.getByText('确认与等待参数', { exact: true }).click();
  await page.locator('#confirmations').fill('1');
  await page.locator('#receipt-timeout').fill('5');
  await page.locator('#connect').click();
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('连接已核验'));
  assert.equal(await page.locator('#private-key').inputValue(), '');
  assert.equal(await page.locator('#chain-id').innerText(), '84532');
  assert.match(await page.locator('#wallet-mode').innerText(), /可签名/);
  pass('dedicated test wallet connection and immediate password-field clearing');

  await page.locator('#deploy-consent').check();
  await page.locator('#deploy').click();
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('部署流程返回'));
  await page.waitForFunction(() => !document.querySelector('#start-run').disabled);
  assert.match(await page.locator('#manifest-view').innerText(), /LabContracts|deploymentId/);
  assert.match(await page.locator('#gas-balance').innerText(), /ETH/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(out, '01-ready-desktop.png'), fullPage: true });
  const manifestDownload = page.waitForEvent('download'); await page.locator('#manifest-export').click();
  const manifestFile = join(out, 'deployment-manifest.json'); await (await manifestDownload).saveAs(manifestFile);
  pass('explicit Lab fixture deployment through standard RPC and visible native gas balance');

  const runIds = [];
  for (const task of ['balance', 'transfer', 'approve', 'swap', 'swap_deposit']) {
    await page.locator('#task').selectOption(task);
    const response = page.waitForResponse(response => response.url() === fixture.base + '/api/testnet/run' && response.request().method() === 'POST');
    await page.locator('#start-run').click();
    const started = await (await response).json(); assert.ok(started.runId); runIds.push(started.runId);
    const run = await fixture.waitRun(started.runId); assert.equal(run.result.status, 'success', JSON.stringify(run.result));
    await page.locator('#refresh').click();
    await page.waitForFunction(id => document.querySelector('#run-id').textContent === id && document.querySelector('#task-outcome').textContent === '成功', started.runId);
    assert.ok(await page.locator('#events .testnet-event').count() > 0);
    await page.locator('#events .testnet-event').first().click();
    assert.match(await page.locator('#event-detail').innerText(), /payload/);
    pass('real browser scripted ' + task + ' with on-chain independent success');
  }
  await page.locator('#task').selectOption('approve'); await page.locator('#amount').fill('22');
  await page.locator('#rebuild-input').click(); await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('重建任务输入'));
  await page.locator('#pause-tool').check(); await page.locator('#pause-transaction').check();
  const pausedResponse = page.waitForResponse(response => response.url() === fixture.base + '/api/testnet/run' && response.request().method() === 'POST');
  await page.locator('#start-run').click(); const pausedId = (await (await pausedResponse).json()).runId;
  const pausePhases = new Set();
  for (let i = 0; i < 20; i++) {
    await page.waitForFunction(id => !document.querySelector('#resume-run').disabled || document.querySelector('#run-id').textContent === id && document.querySelector('#task-outcome').textContent === '成功', pausedId);
    if (!fixture.service.active) break;
    pausePhases.add(fixture.service.active.pause?.phase);
    await page.locator('#resume-run').click();
    await page.waitForTimeout(100);
  }
  const pausedRun = await fixture.waitRun(pausedId); assert.equal(pausedRun.result.status, 'success');
  assert.ok(pausePhases.has('before_tool')); assert.ok(pausePhases.has('before_transaction'));
  assert.equal(pausedRun.config.taskParameters.amount, '22'); runIds.push(pausedId);
  await page.locator('#refresh').click(); await page.waitForFunction(() => document.querySelector('#task-outcome').textContent === '成功');
  pass('parameter rebuild and real before-tool / before-transaction pause-resume preserve target amount');
  const offlineCheckRpcCount = fixture.requests.length;
  await page.locator('#check-offline').click();
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('按封存证据重新检查任务'));
  assert.match(await page.locator('#event-detail').innerText(), /"check_mode": "offline"/);
  assert.equal(fixture.requests.length, offlineCheckRpcCount);
  pass('sealed-evidence task recheck uses local service without any RPC or model call');
  await page.locator('#load-evidence').click();
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('完整实验包已加载并校验'));
  assert.ok(await page.locator('#graph-view .tn-node').count() > 0);
  await page.locator('#graph-view .tn-node').first().click();
  assert.match(await page.locator('#graph-detail').innerText(), /source_events/);
  pass('raw event detail and explicit provenance graph nodes render from sealed evidence');

  const downloaded = page.waitForEvent('download'); await page.locator('#download-bundle').click();
  const bundleFile = join(out, 'browser-export.json'); await (await downloaded).saveAs(bundleFile);
  const bundle = JSON.parse(await readFile(bundleFile, 'utf8'));
  for (const name of ['derived/provenance-graph.json', 'derived/provenance-graph.graphml', 'derived/nodes.csv', 'derived/relations.csv', 'derived/execution-trace.json', 'derived/trace-events.jsonl']) assert.equal(typeof bundle.files[name], 'string');
  assert.ok(!JSON.stringify(bundle).includes(fixture.privateKey));
  for (const name of ['derived/provenance-graph.graphml', 'derived/nodes.csv']) {
    const download = page.waitForEvent('download'); await page.locator(`[data-artifact="${name}"]`).click();
    const dest = join(out, name.split('/').at(-1)); await (await download).saveAs(dest);
    assert.equal(await readFile(dest, 'utf8'), bundle.files[name]);
  }
  pass('native browser bundle, GraphML and CSV downloads preserve original file bytes without private key');

  // Switch the UI to offline; active requests are aborted before file parsing.
  await page.locator('#bundle-file').setInputFiles(bundleFile);
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('已进入离线回放'));
  const networkCount = requests.length, rpcCount = fixture.requests.length;
  assert.equal(await page.locator('#start-run').isDisabled(), true);
  assert.equal(await page.locator('#recheck').isDisabled(), true);
  await page.locator('#replay-start').click(); assert.equal(await page.locator('#event-count').innerText(), '0');
  await page.locator('#replay-step').click(); assert.equal(await page.locator('#event-count').innerText(), '1');
  await page.locator('#replay-all').click();
  await page.locator('#graph-view .tn-node').first().click();
  await page.waitForTimeout(3000);
  assert.equal(requests.length, networkCount); assert.equal(fixture.requests.length, rpcCount);
  await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(out, '02-offline-mobile.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  pass('offline import, step replay and graph inspection make zero HTTP/RPC requests; mobile layout fits');

  await page.locator('#leave-offline').click();
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('可先不填私钥'));
  await page.locator('#mode').selectOption('local'); assert.equal(await page.locator('#local-note').isVisible(), true); assert.equal(await page.locator('#api-settings').isVisible(), false);
  await page.locator('#mode').selectOption('api'); assert.equal(await page.locator('#api-settings').isVisible(), true);
  await page.locator('#mode').selectOption('scripted');
  await page.locator('#disconnect').click(); await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('会话已断开'));
  await page.locator('#rpc-url').fill(fixture.rpcUrl); await page.locator('#account-address').fill(fixture.account); await page.locator('#recipient').fill(fixture.recipient);
  await page.locator('#connect').click(); await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('连接已核验'));
  assert.match(await page.locator('#wallet-mode').innerText(), /只读/);
  await page.locator('#manifest-file').setInputFiles(manifestFile); await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('清单已通过'));
  await page.locator('#task').selectOption('transfer'); assert.equal(await page.locator('#start-run').isDisabled(), true);
  await page.locator('#task').selectOption('balance'); assert.equal(await page.locator('#start-run').isDisabled(), false);
  await page.locator('#pause-tool').uncheck(); await page.locator('#pause-transaction').uncheck();
  const readResponse = page.waitForResponse(response => response.url() === fixture.base + '/api/testnet/run' && response.request().method() === 'POST');
  await page.locator('#start-run').click(); const readId = (await (await readResponse).json()).runId;
  assert.equal((await fixture.waitRun(readId)).result.status, 'success'); runIds.push(readId);
  pass('exported manifest reattaches to readonly account; UI prohibits writes and balance query succeeds');
  assert.deepEqual(errors, []);
  pass('local/API model selectors remain explicit and no browser JavaScript errors');
  await writeFile(join(out, 'runs.json'), JSON.stringify({ runIds, chain_execution: 'isolated_evm_rpc', publicNetworkTransactionsSent: false }, null, 2));
} catch (error) {
  results.push({ name: 'browser suite', passed: false, error: error.message }); console.error(error.stack); process.exitCode = 1;
  await page?.screenshot({ path: join(out, 'failure.png'), fullPage: true }).catch(() => {});
} finally {
  await browser?.close(); await fixture.close();
  await writeFile(artifactPath('testnet-browser-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), scope: 'Headless browser + actual standard-RPC isolated EVM; not live public testnet transactions', results, errors }, null, 2) + '\n');
}
