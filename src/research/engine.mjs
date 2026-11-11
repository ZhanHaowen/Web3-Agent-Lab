import {randomUUID} from 'node:crypto';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {join, resolve, dirname, relative, isAbsolute, sep} from 'node:path';
import {capturedChatCompletion, modelSamplingParameters, recordUsage, normalizeModelMetadata} from '../model/capture.mjs';
import {redactRuntimeEvidence} from '../local-model/service.mjs';
import {capturePublicChain, observerFiles, createRpc} from '../observer/index.mjs';
import {checkResearchRun} from './checker.mjs';
import {catalogSnapshot, providerById} from './catalog.mjs';
import {createWorkload, serviceResult, assessTask, assessServiceResult, scriptedDecision, TASK_VERSION} from './workload.mjs';
import {PrivateBudgetLedger} from './private-ledger.mjs';
import {normalizeResearchConfig, researchManifest, stringify, sha256} from './manifest.mjs';
import {ResearchJournal} from './journal.mjs';

const tools = [
  {type: 'function', function: {name: 'purchase_service', description: 'Purchase one service at its fixed published integer base-unit price. Select according to your private task, budget and procurement strategy; inspect the actual returned result before deciding the next purchase.',
    parameters: {type: 'object', properties: {providerId: {type: 'string'}, reason: {type: 'string'}}, required: ['providerId'], additionalProperties: false}}},
  {type: 'function', function: {name: 'finish_task', description: 'Stop purchases and submit your answer. Payment alone does not complete the task. Do not invent service results.',
    parameters: {type: 'object', properties: {answer: {type: 'string'}, reason: {type: 'string'}}, required: ['answer'], additionalProperties: false}}},
];
function validateDecision(decision) {
  if (!decision || typeof decision !== 'object' || !['purchase','finish'].includes(decision.action)) throw Error('RESEARCH_DECISION_ACTION');
  if (decision.reason !== undefined && (typeof decision.reason !== 'string' || decision.reason.length > 4000)) throw Error('RESEARCH_DECISION_REASON');
  if (decision.action === 'purchase') providerById(decision.providerId);
  else if (typeof decision.answer !== 'string' || decision.answer.length > 4000) throw Error('RESEARCH_DECISION_ANSWER');
  return decision;
}
const safeError = error => ({name: error?.name ?? 'Error', message: String(error?.message ?? error)});
const isAbort = signal => { if (signal?.aborted) throw Error('RESEARCH_CANCELLED'); };
function paymentResultForTruth(purchase, result) {
  purchase.paymentId = result.paymentId ?? purchase.paymentId ?? null;
  purchase.txHash = result.txHash ?? purchase.txHash ?? null;
  purchase.publicPaymentRefs = result.publicPaymentRefs ?? purchase.publicPaymentRefs ?? (purchase.txHash ? [{txHash: purchase.txHash}] : []);
  purchase.paymentStatus = result.status;
}

/**
 * Runs one controlled research episode. A paymentFactory creates a real isolated
 * environment; injected test payments must explicitly declare synthetic_fixture.
 * Full researcher truth never doubles as the public observer input.
 */
export async function runResearchExperiment(input, options = {}) {
  const config = normalizeResearchConfig(input);
  if (!options.outDir) throw Error('RESEARCH_OUTPUT_REQUIRED');
  const outDir = resolve(options.outDir), runId = options.runId ?? randomUUID();
  if (typeof runId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(runId)) throw Error('RESEARCH_RUN_ID');
  const journal = new ResearchJournal({outDir, runId, model: config.model ?? {}, emit: options.emit});
  await journal.init();
  const startedAt = new Date().toISOString(), startedMono = performance.now();
  const ledger = new PrivateBudgetLedger(config), workload = createWorkload(config.task, config.seed), catalog = catalogSnapshot();
  const purchases = [], decisionLabels = [], background = [], errors = [], costs = {modelCalls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, usageComplete: true};
  let payments, ownsPayments = false, model, runtimeCursor, answer = null, finishReason = 'step_limit', observer = null, manifest,
    evidenceOrigin = 'unknown', recordingComplete = true, completedNormally = false, lastEvent, steps = 0, capitalRefund = null, chainBalances = null;
  const persistPrivate = async () => {
    await journal.file('private/budget-ledger.json', ledger.snapshot());
    await journal.file('private/purchase-links.json', {schema: 'web3-private-purchase-links-v1', runId, purchases: purchases.map(p => ({purchaseId: p.purchaseId, requestId: p.requestId, paymentId: p.paymentId ?? null, txHash: p.txHash ?? null, publicPaymentRefs: p.publicPaymentRefs ?? [], step: p.step}))});
  };
  const reportError = async (phase, error) => { const record = {phase, ...safeError(error)}; errors.push(record); await journal.record('research.error', record); };
  try {
    await journal.file('config.json', config);
    await journal.file('catalog.json', catalog);
    await journal.record('research.created', {runId, config, taskVersion: TASK_VERSION, catalog});
    if (config.mode === 'llm') {
      model = options.modelResolver ? await options.modelResolver(config.model) : config.model;
      if (!model || model.provider !== config.model.provider) throw Error('RESEARCH_MODEL_BACKEND_CHANGED');
      normalizeModelMetadata(model); modelSamplingParameters(model);
      journal.redactor.add(model);
      if (model.provider === 'local') {
        if (!options.modelResolver || !model.localRuntime?.modelSha256 || !model.localRuntime?.runtimeSha256 || !options.captureRuntimeEvidence) throw Error('RESEARCH_LOCAL_MANAGED_EVIDENCE_REQUIRED');
        runtimeCursor = options.runtimeEvidenceCursor ? await options.runtimeEvidenceCursor() : null;
      }
    }
    isAbort(options.signal);
    if (options.paymentFactory) {
      const paymentDataDir = resolve(options.paymentDataDir ?? join(dirname(outDir), '..', 'payment-runtime', runId));
      const runtimeRelative = relative(outDir, paymentDataDir);
      if (runtimeRelative === '' || (!isAbsolute(runtimeRelative) && runtimeRelative !== '..' && !runtimeRelative.startsWith('..' + sep))) throw Error('RESEARCH_SECRET_RUNTIME_OUTSIDE_EXPORT_REQUIRED');
      payments = await options.paymentFactory({root: options.root, dataDir: paymentDataDir, scheme: config.payment.scheme === 'batch' ? 'batch-settlement' : config.payment.scheme,
        authorization: config.payment.authorization, initialBalance: config.initialBalanceBase, budgetBase: config.budgetBase,
        providers: catalog.map(p => ({id: p.providerId})), signal: options.signal,
        emit: event => journal.record(event.type, event.payload ?? event)});
      ownsPayments = true;
      evidenceOrigin = payments.evidenceOrigin ?? 'real_chain';
    } else {
      payments = options.payments;
      if (!payments || payments.evidenceOrigin !== 'synthetic_fixture') throw Error('RESEARCH_INJECTED_PAYMENT_MUST_BE_FIXTURE');
      evidenceOrigin = 'synthetic_fixture';
    }
    if (typeof payments?.pay !== 'function') throw Error('RESEARCH_PAYMENT_ADAPTER_REQUIRED');
    manifest = researchManifest(config, {runId, evidenceOrigin, modelIdentity: model ? {...normalizeModelMetadata(model), baseUrl: model.baseUrl, sampling: modelSamplingParameters(model)} : {provider: 'scripted', model: null},
      deploymentManifest: payments.deploymentManifest, softwareIdentity: options.softwareIdentity});
    await journal.file('manifest.json', manifest); await persistPrivate();
    const messages = [{role: 'system', content: model?.systemPrompt || 'Execute a paid-tool research task using actual tool calls. Choose purchases according to the supplied private strategy and budget, inspect real results, and finish with an answer. Currency values are integer base units, not human decimal amounts. Do not simulate payment or invent results. One tool call per response.'},
      {role: 'user', content: stringify({task: workload.publicTask, privateBudgetBase: config.budgetBase, procurementStrategy: config.strategy, catalog,
        strategyMeaning: {cost: 'Prefer least expensive services; stop rather than automatically upgrading solely to maximize quality.', quality: 'Prefer complete, high-coverage evidence subject to the budget.', adaptive: 'Start with lower-cost evidence, then buy additional or upgraded services when actual results have insufficient coverage.'}[config.strategy]})}];
    for (let step = 0; step < config.maxSteps; step++) {
      isAbort(options.signal); steps = step + 1;
      const remainingBudgetBase = ledger.snapshot().totals.remainingBudgetBase;
      let decision, modelToolCall;
      if (config.mode === 'scripted') decision = scriptedDecision({strategy: config.strategy, workload, purchases, catalog, remainingBudgetBase});
      else {
        messages.push({role: 'user', content: stringify({source: 'private_experiment_progress', step, remainingBudgetBase,
          recentPurchases: purchases.map(p => ({providerId: p.providerId, capability: p.capability, deliveryStatus: p.deliveryStatus, result: p.result ?? null})),
          instruction: 'Choose one purchase_service or finish_task tool call. Task completion is assessed independently.'})});
        const result = await capturedChatCompletion({model, request: {model: model.model, messages: structuredClone(messages), tools, tool_choice: 'required', parallel_tool_calls: false, stream: false, ...modelSamplingParameters(model)}, signal: options.signal,
          emit: (...args) => journal.record(...args), onAttempt: () => { costs.modelCalls++; }, onUsage: usage => recordUsage(costs, usage)});
        const message = result.data.choices?.[0]?.message;
        if (!message || message.role !== 'assistant' || !Array.isArray(message.tool_calls) || message.tool_calls.length !== 1) throw Error('RESEARCH_MODEL_ONE_TOOL_CALL_REQUIRED');
        messages.push(message); modelToolCall = message.tool_calls[0];
        if (modelToolCall.type !== 'function' || !modelToolCall.id || !['purchase_service','finish_task'].includes(modelToolCall.function?.name)) throw Error('RESEARCH_MODEL_TOOL');
        let args; try { args = JSON.parse(modelToolCall.function.arguments); } catch { throw Error('RESEARCH_MODEL_TOOL_JSON'); }
        if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).some(k => !(modelToolCall.function.name === 'purchase_service' ? ['providerId','reason'] : ['answer','reason']).includes(k))) throw Error('RESEARCH_MODEL_TOOL_ARGUMENTS');
        decision = modelToolCall.function.name === 'purchase_service' ? {action: 'purchase', ...args} : {action: 'finish', ...args};
      }
      try { validateDecision(decision); }
      catch (error) {
        await journal.record('research.decision_rejected', {step, decision, error: safeError(error)});
        if (!modelToolCall) throw error;
        messages.push({role: 'tool', tool_call_id: modelToolCall.id, content: stringify({error: error.message, submitted: false})}); continue;
      }
      const stage = purchases.length ? 'evidence_followup' : 'initial_purchase';
      decisionLabels.push({step, action: decision.action, reasonSource: config.mode === 'llm' ? 'model_tool_call' : 'scripted_policy', stage, remainingBudgetBase, decision});
      lastEvent = await journal.record('research.decision', {step, mode: config.mode, strategy: config.strategy, stage, decision, remainingBudgetBase});
      if (decision.action === 'finish') { answer = decision.answer; finishReason = 'agent_finished'; completedNormally = true; break; }
      const provider = providerById(decision.providerId), purchaseIndex = purchases.length;
      if (options.beforePurchase) {
        const backgroundResult = await options.beforePurchase({payments, purchaseIndex, journal, runId});
        if (backgroundResult !== undefined) { background.push(backgroundResult); await journal.record('research.background_interleaved', backgroundResult); await journal.file('private/background.json', background); }
      }
      const purchase = {purchaseId: randomUUID(), requestId: randomUUID(), step, providerId: provider.providerId, capability: provider.capability, tier: provider.tier,
        quotedAmountBase: provider.priceBase, deliveryStatus: 'not_requested', paymentStatus: 'not_requested'};
      try { ledger.reserve(purchase); }
      catch (error) {
        await journal.record('research.purchase_rejected', {step, providerId: provider.providerId, error: safeError(error), submitted: false}, {}, lastEvent);
        if (modelToolCall) { messages.push({role: 'tool', tool_call_id: modelToolCall.id, content: stringify({error: error.message, submitted: false})}); continue; }
        throw error;
      }
      purchases.push(purchase); await persistPrivate();
      let expected = serviceResult(workload, provider, {}, purchaseIndex);
      const fault = config.workload.faults.find(f => f.purchaseIndex === purchaseIndex);
      if (fault?.kind === 'low_quality') expected = {...expected, coverage: 0, degraded: true};
      await journal.record('research.purchase_requested', {purchase, fault: fault ?? null}, {}, lastEvent);
      try {
        const result = await payments.pay({requestId: purchase.requestId, providerId: provider.providerId, amountBase: provider.priceBase,
          resource: `/tools/${provider.capability}`, body: {task: workload.publicTask, corpusReference: workload.corpusId}, result: expected,
          ...(fault ? {fault: fault.kind} : {})});
        await journal.record('research.payment_result', {purchaseId: purchase.purchaseId, result});
        ledger.apply(purchase.purchaseId, result); paymentResultForTruth(purchase, result);
        const delivery = result.delivery;
        purchase.deliveryStatus = delivery?.status ?? 'unknown';
        if (!['delivered','withheld','failed','unknown'].includes(purchase.deliveryStatus)) throw Error('RESEARCH_DELIVERY_STATUS');
        if (purchase.deliveryStatus === 'delivered') {
          if (!Object.hasOwn(delivery, 'result')) throw Error('RESEARCH_DELIVERED_BODY_MISSING');
          purchase.result = delivery.result;
        }
        purchase.utility = purchase.deliveryStatus === 'delivered' ? assessServiceResult(workload, purchase) : null;
        await journal.record('research.service_observation', {purchaseId: purchase.purchaseId, deliveryStatus: purchase.deliveryStatus, result: purchase.result ?? null});
        if (modelToolCall) messages.push({role: 'tool', tool_call_id: modelToolCall.id, content: stringify({paymentStatus: result.status, deliveryStatus: purchase.deliveryStatus, result: purchase.result ?? null, remainingBudgetBase: ledger.snapshot().totals.remainingBudgetBase})});
      } catch (error) {
        ledger.unknown(purchase.purchaseId, error.message); purchase.paymentStatus = 'unknown'; purchase.deliveryStatus = 'unknown';
        await reportError('payment_or_delivery', error); await persistPrivate(); finishReason = 'unresolved_payment'; break;
      }
      await persistPrivate();
      if (!ledger.snapshot().invariants.withinBudget || !ledger.snapshot().invariants.withinInitialBalance) throw Error('RESEARCH_PAYMENT_EXCEEDED_RESERVED_LIMIT');
      if (['pending','unknown'].includes(purchase.paymentStatus) && purchase.paymentStatus === 'unknown') { finishReason = 'unresolved_payment'; break; }
    }
  } catch (error) {
    finishReason = options.signal?.aborted ? 'cancelled' : 'error';
    try { await reportError('execution', error); } catch { recordingComplete = false; }
  }

  // Reconcile known obligations before collecting the public chain. Never treat
  // an HTTP error or a failed model decision as proof that payment was refunded.
  if (payments && config.finalizePayments && typeof payments.settle === 'function') {
    try {
      const settlement = await payments.settle();
      await journal.record('research.settlement', settlement);
      for (const result of settlement?.payments ?? []) {
        const purchase = purchases.find(p => result.requestId && p.requestId === result.requestId || result.paymentId && p.paymentId === result.paymentId);
        if (!purchase) { await journal.record('research.unmatched_settlement', result); continue; }
        ledger.apply(purchase.purchaseId, result); paymentResultForTruth(purchase, result);
      }
      await persistPrivate();
      if (typeof payments.refund === 'function' && config.payment.scheme === 'batch') {
        capitalRefund = await payments.refund();
        await journal.record('research.unused_capital_refunded', {kind: 'unused_channel_capital_not_service_refund', result: capitalRefund});
      }
    } catch (error) { try { await reportError('settlement', error); } catch { recordingComplete = false; } }
  }
  if (model?.provider === 'local') {
    try {
      const evidence = await options.captureRuntimeEvidence(model, runtimeCursor);
      if (!evidence || !Array.isArray(evidence.files) || !['manifest','props','events'].every(role => evidence.files.some(f => f.role === role && f.encoding === 'base64' && typeof f.content === 'string' && sha256(Buffer.from(f.content,'base64')) === f.sha256))) throw Error('RESEARCH_LOCAL_RUNTIME_EVIDENCE_INCOMPLETE');
      await journal.record('model.runtime_evidence', redactRuntimeEvidence(evidence, value => journal.redactor.clean(value)));
    } catch (error) { recordingComplete = false; try { await reportError('runtime_capture', error); } catch {} }
  }
  if (payments?.rpcUrl && evidenceOrigin === 'real_chain') {
    try {
      if (options.beforeClose) await options.beforeClose({payments, journal, runId});
      const rpc = createRpc(payments.rpcUrl), toBlock = BigInt(await rpc('eth_blockNumber', [])).toString();
      observer = await capturePublicChain({rpcUrl: payments.rpcUrl, fromBlock: String(payments.startBlock ?? '0'), toBlock});
      await mkdir(join(outDir, 'observer'), {recursive: true});
      for (const [name, text] of Object.entries(observerFiles(observer))) await writeFile(join(outDir, 'observer', name), text);
      await journal.record('research.public_projection_created', {profile: observer.profile, range: observer.range, sha256: observer.provenance?.contentSha256});
    } catch (error) { recordingComplete = false; try { await reportError('observer_capture', error); } catch {} }
  }
  if (payments?.privateEvidence) {
    try { await journal.file('private/payment-evidence.json', typeof payments.privateEvidence === 'function' ? await payments.privateEvidence() : payments.privateEvidence); }
    catch (error) { recordingComplete = false; try { await reportError('payment_evidence', error); } catch {} }
  }
  if (typeof payments?.balances === 'function') {
    try { chainBalances = await payments.balances(); await journal.file('private/payment-closeout.json', {schema: 'web3-research-capital-closeout-v1', chainBalances, capitalRefund,
      distinction: 'Unused channel capital returned to the wallet is not a refund of a failed request and does not reduce settled service charges.'}); }
    catch (error) { recordingComplete = false; try { await reportError('chain_balances', error); } catch {} }
  }
  if (ownsPayments && payments?.close) {
    try { await payments.close(); } catch (error) { try { await reportError('payment_close', error); } catch { recordingComplete = false; } }
  }
  const assessment = assessTask(workload, purchases, answer), finances = ledger.snapshot();
  const unresolved = finances.entries.some(e => ['reserved','unknown','pending'].includes(e.state));
  const truth = {schema: 'web3-research-truth-v1', runId, task: {...config.task, templateVersion: TASK_VERSION}, strategy: config.strategy,
    budgetBase: config.budgetBase, initialBalanceBase: config.initialBalanceBase, tokenDecimals: config.tokenDecimals, mode: config.mode, modelIdentity: manifest?.modelIdentity ?? null,
    seed: config.seed, startedAt, endedAt: new Date().toISOString(), taskOutcome: assessment.status, purchases, decisionLabels,
    groundTruth: {expectedAnswer: workload.expectedAnswer, corpus: workload.records, requiredCoverage: workload.requiredCoverage},
    submittedAnswer: answer, assessment, serviceImplementation: 'deterministic_local_research_service', evidenceOrigin};
  const summary = {schema: 'web3-research-summary-v1', runId, outDir, startedAt, endedAt: truth.endedAt, durationMs: Math.round(performance.now() - startedMono),
    status: !recordingComplete ? 'recording_failure' : unresolved ? 'requires_attention' : errors.length ? 'error' : 'completed', finishReason,
    taskOutcome: assessment.status, completedNormally, steps, purchases: purchases.length, mode: config.mode, strategy: config.strategy, evidenceOrigin,
    finances: finances.totals, chainBalances, capitalRefund: capitalRefund ? {refundedBase: capitalRefund.refundedBase, kind: 'unused_channel_capital'} : null, costs, errors: journal.redactor.clean(errors), recordingComplete, observerPresent: Boolean(observer),
    observer: observer ? {range: observer.range, windowGasUsed: String(observer.transactions.reduce((n,tx)=>n+BigInt(tx.gasUsed),0n)),
      windowGasCostWei: String(observer.transactions.reduce((n,tx)=>n+BigInt(tx.gasUsed)*BigInt(tx.effectiveGasPrice),0n)),
      scope: 'All receipt gas in the captured public block window, including background and setup transactions; not net Agent-only gas.'} : null,
    privacyDatasetReady: false, privateFiles: ['private/ground-truth.json','private/budget-ledger.json','private/purchase-links.json']};
  const checker = checkResearchRun({summary, truth, ledger: finances, observer});
  summary.checkerStatus = checker.status;
  summary.privacyDatasetReady = evidenceOrigin === 'real_chain' && recordingComplete && Boolean(observer) && checker.status === 'pass';
  try {
    if (!manifest) { manifest = researchManifest(config, {runId, evidenceOrigin, softwareIdentity: options.softwareIdentity}); await journal.file('manifest.json', manifest); }
    await persistPrivate(); await journal.file('private/ground-truth.json', truth); await journal.file('checker.json', checker);
    await journal.record('research.finished', summary); await journal.file('summary.json', summary); await journal.seal();
  } catch (error) { summary.status = 'recording_failure'; summary.recordingComplete = false; summary.privacyDatasetReady = false; throw Object.assign(Error('RESEARCH_FINAL_EVIDENCE_WRITE_FAILED: ' + error.message), {summary}); }
  return summary;
}

/** Resume only a sealed identical experiment; unsealed monetary work is not replayed. */
export async function readCompletedResearchExperiment(outDir, config) {
  const directory = resolve(outDir), summary = JSON.parse(await readFile(join(directory, 'summary.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')), integrity = JSON.parse(await readFile(join(directory, 'integrity.json'), 'utf8'));
  if (!summary.recordingComplete || summary.status === 'requires_attention') throw Error('RESEARCH_RESUME_RECONCILIATION_REQUIRED');
  const requested = researchManifest(normalizeResearchConfig(config));
  if (manifest.configHash !== requested.configHash) throw Error('RESEARCH_RESUME_CONFIG_CHANGED');
  for (const [path, metadata] of Object.entries(integrity.files)) {
    if (path.includes('..') || path.startsWith('/') || path.includes('\\')) throw Error('RESEARCH_INTEGRITY_PATH');
    const value = await readFile(join(directory, path)); if (sha256(value) !== metadata.sha256 || value.length !== metadata.bytes) throw Error('RESEARCH_INTEGRITY_MISMATCH');
  }
  return {...summary, resumedReadOnly: true};
}
