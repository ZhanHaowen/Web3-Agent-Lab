import {createHash} from 'node:crypto';
import {CAPABILITIES} from './catalog.mjs';

export const TASK_VERSION = 'shared-corpus-tasks-1.0.0';
export const FAMILIES = Object.freeze(['evidence_review', 'risk_analysis', 'trend_analysis']);
const digest = value => createHash('sha256').update(String(value)).digest('hex');
const integer = (key, max) => parseInt(digest(key).slice(0, 8), 16) % max;
export function answerFor(family, records) {
  if (family === 'evidence_review') return String(records.filter(r => r.supported).length);
  if (family === 'risk_analysis') return String(records.reduce((n, r) => n + r.exposure * r.severity, 0));
  if (family === 'trend_analysis') { const delta = records.at(-1).measurement - records[0].measurement; return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'; }
  throw Error('RESEARCH_TASK_FAMILY');
}
export function createWorkload(task, seed) {
  const records = Array.from({length: 8}, (_, i) => ({id: `record-${i + 1}`, supported: integer(`${seed}:${task.instanceId}:${i}:support`, 2) === 1,
    exposure: 1 + integer(`${seed}:${task.instanceId}:${i}:exposure`, 9), severity: 1 + integer(`${seed}:${task.instanceId}:${i}:severity`, 5),
    measurement: integer(`${seed}:${task.instanceId}:${i}:measure`, 100)}));
  const objective = {evidence_review: 'Count the supported claims in the complete evidence corpus; answer an integer.',
    risk_analysis: 'Sum exposure multiplied by severity over the complete evidence corpus; answer an integer.',
    trend_analysis: 'Compare the final measurement with the first measurement; answer up, down, or flat.'}[task.family];
  if (!objective) throw Error('RESEARCH_TASK_FAMILY');
  return {version: TASK_VERSION, family: task.family, instanceId: task.instanceId, difficulty: task.difficulty,
    corpusId: digest(`${seed}:${task.instanceId}`).slice(0, 20), records, expectedAnswer: answerFor(task.family, records),
    requiredCoverage: [50, 75, 100][task.difficulty - 1],
    capabilityOrder: [...CAPABILITIES].sort((a, b) => integer(`${seed}:${task.instanceId}:${a}`, 10000) - integer(`${seed}:${task.instanceId}:${b}`, 10000)),
    publicTask: {objective, corpusReference: digest(`${seed}:${task.instanceId}`).slice(0, 20), recordCount: records.length,
      requiredCapabilities: [...CAPABILITIES], requiredCoverage: [50, 75, 100][task.difficulty - 1],
      completionRule: 'Obtain each capability with required coverage and give the correct answer; payment alone is not completion.'}};
}
// This is the explicit local service implementation, not invented model output.
// The caller must use the body actually received over HTTP, never this object as a delivery fallback.
export function serviceResult(workload, provider, input = {}, purchaseIndex = 0) {
  const length = provider.tier === 'pro' ? workload.records.length : 4 + integer(`${workload.corpusId}:${provider.providerId}`, 3);
  const records = workload.records.slice(0, length);
  const common = {schema: 'research-service-result-v1', providerId: provider.providerId, capability: provider.capability,
    corpusReference: workload.corpusId, coverage: Math.floor(100 * length / workload.records.length), recordCount: length,
    totalRecords: workload.records.length, implementation: provider.implementation, serviceVersion: provider.version};
  if (provider.capability === 'discovery') return {...common, records};
  if (provider.capability === 'analysis') return {...common, answer: answerFor(workload.family, records), method: workload.family,
    evidenceDigest: digest(JSON.stringify(records))};
  return {...common, checkedRecordIds: records.map(r => r.id), checks: records.map(r => ({recordId: r.id, passed: true})),
    evidenceDigest: digest(JSON.stringify(records))};
}
export function assessTask(workload, purchases, answer) {
  const delivered = purchases.filter(p => p.deliveryStatus === 'delivered' && p.result?.schema === 'research-service-result-v1' && p.result.corpusReference === workload.corpusId);
  const utilities = delivered.map(p => ({purchaseId: p.purchaseId, capability: p.capability, ...assessServiceResult(workload, p)}));
  const coverage = Object.fromEntries(CAPABILITIES.map(capability => [capability, Math.max(0, ...utilities.filter(p => p.capability === capability).map(p => p.coverage))]));
  const checks = CAPABILITIES.map(capability => ({id: `${capability}_coverage`, expected: workload.requiredCoverage, actual: coverage[capability], passed: coverage[capability] >= workload.requiredCoverage}));
  checks.push({id: 'answer_correct', expected: workload.expectedAnswer, actual: typeof answer === 'string' ? answer.trim().toLowerCase() : null,
    passed: typeof answer === 'string' && answer.trim().toLowerCase() === workload.expectedAnswer});
  return {status: checks.every(c => c.passed) ? 'success' : 'failure', coverage, assertions: checks, serviceAssessments: utilities};
}
export function assessServiceResult(workload, purchase) {
  const r = purchase.result;
  if (!r || r.schema !== 'research-service-result-v1' || r.corpusReference !== workload.corpusId || r.providerId !== purchase.providerId || r.capability !== purchase.capability || r.totalRecords !== workload.records.length || !Number.isInteger(r.recordCount) || r.recordCount < 1 || r.recordCount > workload.records.length) return {valid: false, coverage: 0, reason: 'SERVICE_IDENTITY_OR_SHAPE'};
  const expected = workload.records.slice(0, r.recordCount), expectedCoverage = Math.floor(100 * expected.length / workload.records.length);
  let valid = false;
  if (r.capability === 'discovery') valid = JSON.stringify(r.records) === JSON.stringify(expected);
  else if (r.capability === 'analysis') valid = r.answer === answerFor(workload.family, expected) && r.evidenceDigest === digest(JSON.stringify(expected));
  else if (r.capability === 'verification') valid = JSON.stringify(r.checkedRecordIds) === JSON.stringify(expected.map(v => v.id)) && JSON.stringify(r.checks) === JSON.stringify(expected.map(v => ({recordId: v.id, passed: true}))) && r.evidenceDigest === digest(JSON.stringify(expected));
  // Explicitly degraded service results remain delivered but provide no usable evidence.
  if (r.degraded === true && r.coverage === 0) return {valid, coverage: 0, reason: 'DECLARED_DEGRADED_RESULT'};
  valid = valid && r.coverage === expectedCoverage;
  return {valid, coverage: valid ? expectedCoverage : 0, reason: valid ? 'CORPUS_RESULT_VERIFIED' : 'RESULT_CONTENT_OR_COVERAGE_MISMATCH'};
}
export function scriptedDecision({strategy, workload, purchases, catalog, remainingBudgetBase}) {
  const delivered = purchases.filter(p => p.deliveryStatus === 'delivered');
  const attempted = new Set(purchases.map(p => p.providerId));
  const coverage = Object.fromEntries(CAPABILITIES.map(c => [c, Math.max(0, ...delivered.filter(p => p.capability === c).map(p => Number(p.result?.coverage) || 0))]));
  const candidates = [];
  for (const capability of workload.capabilityOrder) {
    const existing = delivered.filter(p => p.capability === capability);
    const satisfied = strategy === 'cost' ? existing.length > 0 : coverage[capability] >= workload.requiredCoverage;
    if (satisfied) continue;
    const options = catalog.filter(p => p.capability === capability && !attempted.has(p.providerId));
    options.sort((a, b) => strategy === 'quality' ? Number(BigInt(b.priceBase) - BigInt(a.priceBase)) : Number(BigInt(a.priceBase) - BigInt(b.priceBase)));
    const provider = options.find(p => BigInt(p.priceBase) <= BigInt(remainingBudgetBase));
    if (provider) candidates.push(provider);
  }
  if (candidates.length) return {action: 'purchase', providerId: candidates[0].providerId, reason: `${strategy}: acquire missing or insufficient ${candidates[0].capability}`};
  const analyses = delivered.filter(p => p.capability === 'analysis' && typeof p.result?.answer === 'string').sort((a, b) => Number(b.result.coverage) - Number(a.result.coverage));
  return {action: 'finish', answer: analyses[0]?.result.answer ?? '', reason: 'No remaining affordable untried service improves the configured policy.'};
}
