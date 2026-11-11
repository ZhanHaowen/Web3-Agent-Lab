import {createHash} from 'node:crypto';
import {modelSamplingParameters, modelRecordRedactor} from '../model/capture.mjs';
import {baseUnits} from './private-ledger.mjs';
import {CATALOG_VERSION, catalogHash} from './catalog.mjs';
import {FAMILIES, TASK_VERSION} from './workload.mjs';

export const RESEARCH_VERSION = 'research-pipeline-1.0.0';
export const stringify = value => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? String(item) : item, 2);
export const sha256 = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stringify(value)).digest('hex');
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function only(value, keys, field) { if (!object(value) || Object.keys(value).some(k => !keys.includes(k))) throw Error('RESEARCH_CONFIG_' + field); }
export function normalizeResearchConfig(input = {}) {
  only(input, ['schema','seed','task','mode','strategy','budgetBase','initialBalanceBase','tokenDecimals','maxSteps','model','payment','workload','finalizePayments','experimentId'], 'FIELDS');
  if (input.schema !== undefined && input.schema !== 'web3-research-config-v1') throw Error('RESEARCH_CONFIG_SCHEMA');
  const config = {schema: 'web3-research-config-v1', seed: input.seed ?? 1, task: {family: 'evidence_review', instanceId: 'instance-001', difficulty: 2, ...input.task},
    mode: input.mode ?? 'scripted', strategy: input.strategy ?? 'adaptive', budgetBase: input.budgetBase ?? '100000', initialBalanceBase: input.initialBalanceBase ?? '1000000',
    tokenDecimals: input.tokenDecimals ?? 6, maxSteps: input.maxSteps ?? 16, payment: {scheme: 'exact', authorization: 'none', ...input.payment},
    workload: {faults: [], ...input.workload}, finalizePayments: input.finalizePayments !== false, ...(input.experimentId ? {experimentId: input.experimentId} : {}), ...(input.model ? {model: structuredClone(input.model)} : {})};
  only(config.task, ['family','instanceId','difficulty'], 'TASK'); only(config.payment, ['scheme','authorization'], 'PAYMENT'); only(config.workload, ['faults'], 'WORKLOAD');
  if (!Number.isSafeInteger(config.seed) || config.seed < 0 || config.seed > 2147483647) throw Error('RESEARCH_SEED');
  if (!FAMILIES.includes(config.task.family) || typeof config.task.instanceId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(config.task.instanceId) || ![1,2,3].includes(config.task.difficulty)) throw Error('RESEARCH_TASK');
  if (!['scripted','llm'].includes(config.mode) || !['cost','quality','adaptive'].includes(config.strategy)) throw Error('RESEARCH_POLICY');
  if (config.tokenDecimals !== 6) throw Error('RESEARCH_TOKEN_DECIMALS_6_REQUIRED');
  const budget = baseUnits(config.budgetBase, 'budget'), balance = baseUnits(config.initialBalanceBase, 'balance');
  if (!budget || !balance || budget > balance) throw Error('RESEARCH_BUDGET_BALANCE');
  if (!Number.isSafeInteger(config.maxSteps) || config.maxSteps < 1 || config.maxSteps > 40) throw Error('RESEARCH_STEP_LIMIT');
  if (!['exact','batch','erc8183','mpp-evm-charge'].includes(config.payment.scheme) || !['none','ap2'].includes(config.payment.authorization)) throw Error('RESEARCH_PAYMENT_MODE');
  if (config.payment.scheme === 'erc8183' && config.payment.authorization !== 'none') throw Error('RESEARCH_ESCROW_AP2_NOT_IMPLEMENTED');
  if (config.payment.scheme === 'mpp-evm-charge' && config.payment.authorization !== 'none') throw Error('RESEARCH_MPP_AP2_NOT_IMPLEMENTED');
  if (config.payment.authorization === 'ap2' && budget % 10000n !== 0n) throw Error('RESEARCH_AP2_CENT_ALIGNMENT');
  if (input.finalizePayments !== undefined && typeof input.finalizePayments !== 'boolean') throw Error('RESEARCH_FINALIZE_FLAG');
  if (input.experimentId !== undefined && (typeof input.experimentId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(input.experimentId))) throw Error('RESEARCH_EXPERIMENT_ID');
  if (!Array.isArray(config.workload.faults) || config.workload.faults.length > 40) throw Error('RESEARCH_FAULTS');
  const positions = new Set();
  for (const fault of config.workload.faults) {
    only(fault, ['purchaseIndex','kind'], 'FAULT');
    if (!Number.isInteger(fault.purchaseIndex) || fault.purchaseIndex < 0 || fault.purchaseIndex > 39 || !['withheld','low_quality','http_failure','timeout'].includes(fault.kind) || positions.has(fault.purchaseIndex)) throw Error('RESEARCH_FAULT');
    if (fault.kind === 'timeout' && config.payment.scheme !== 'erc8183') throw Error('RESEARCH_FAULT_TIMEOUT_ESCROW_ONLY');
    positions.add(fault.purchaseIndex);
  }
  if (config.mode === 'llm') {
    if (!object(config.model) || !['local','api'].includes(config.model.provider)) throw Error('RESEARCH_MODEL_REQUIRED');
    modelSamplingParameters(config.model);
    if (config.model.provider === 'api') {
      if (!config.model.model || typeof config.model.model !== 'string') throw Error('RESEARCH_MODEL_ID');
      const url = new URL(config.model.baseUrl);
      if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (url.protocol === 'http:' && !['127.0.0.1','localhost','[::1]'].includes(url.hostname))) throw Error('RESEARCH_MODEL_ENDPOINT');
    }
  } else if (config.model) throw Error('RESEARCH_SCRIPTED_MODEL_CONFIG_FORBIDDEN');
  return config;
}
export function researchManifest(config, {runId, evidenceOrigin, modelIdentity, deploymentManifest, softwareIdentity} = {}) {
  const clean = modelRecordRedactor(config.model ?? {}).clean;
  const recordedConfig = clean(config);
  return {schema: 'web3-research-manifest-v1', version: RESEARCH_VERSION, runId, createdAt: new Date().toISOString(),
    evidenceOrigin, config: recordedConfig, configHash: sha256(recordedConfig), catalogVersion: CATALOG_VERSION, catalogHash: catalogHash(),
    taskVersion: TASK_VERSION, modelIdentity: clean(modelIdentity ?? null), deploymentManifest: clean(deploymentManifest ?? null), softwareIdentity: softwareIdentity ?? null,
    modelResponsePolicy: {toolChoice:'required',parallelToolCalls:false,completion:'explicit_finish_task',scriptedFallback:false},
    serviceImplementation: 'deterministic_local_research_service', units: 'all currency is integer token base units; decimals=6',
    dataBoundary: {raw: 'private researcher evidence including model and service bodies', private: 'ground truth, budget and linkage; never attacker input', observer: 'must be independently collected from public RPC by observer module'},
    deterministicScope: 'Seed fixes corpus and batch order. LLM, chain timing, transaction hashes and identifiers are not byte-deterministic.'};
}
/** Reproducible factor expansion; every repeated instance remains a single split group. */
export function expandExperimentMatrix({base = {}, factors = {}, replicates = 1, seed = 1}) {
  only(factors, ['family','strategy','budgetBase','model','difficulty'], 'MATRIX_FACTORS');
  if (!Number.isInteger(replicates) || replicates < 1 || replicates > 100 || !Number.isSafeInteger(seed) || seed < 0) throw Error('RESEARCH_MATRIX_SIZE');
  let rows = [{}];
  for (const [field, values] of Object.entries(factors)) {
    if (!Array.isArray(values) || !values.length || values.length > 100) throw Error('RESEARCH_MATRIX_FACTOR');
    rows = rows.flatMap(row => values.map(value => ({...row, [field]: value})));
    if (rows.length * replicates > 10000) throw Error('RESEARCH_MATRIX_SIZE');
  }
  const result = [];
  for (let replicate = 0; replicate < replicates; replicate++) for (const row of rows) {
    const config = {...structuredClone(base), seed: (seed + replicate) % 2147483648, task: {...base.task, instanceId: `${base.task?.instanceId ?? 'instance'}-${replicate + 1}`}};
    for (const [field, value] of Object.entries(row)) {
      if (['family','difficulty'].includes(field)) config.task[field] = value;
      else if (field === 'model') { config.model = value; config.mode = 'llm'; }
      else config[field] = value;
    }
    const normalized = normalizeResearchConfig(config);
    result.push({replicate, groupId: `${normalized.task.family}:${normalized.task.instanceId}`, config: normalized,
      matrixCellHash: sha256({...row, replicate})});
  }
  // Stable shuffle independent of execution results, hardware or wall-clock time.
  result.sort((a, b) => sha256(`${seed}:${a.matrixCellHash}`).localeCompare(sha256(`${seed}:${b.matrixCellHash}`)));
  return result.map((row, index) => ({...row, scheduleIndex: index}));
}
