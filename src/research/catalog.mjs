import {createHash} from 'node:crypto';

export const CATALOG_VERSION = 'shared-paid-tools-1.0.0';
export const CAPABILITIES = Object.freeze(['discovery', 'analysis', 'verification']);
// Prices and provider identities are shared across every task family and budget.
export const CATALOG = Object.freeze(CAPABILITIES.flatMap((capability, index) => ['lite', 'pro'].map(tier => Object.freeze({
  providerId: `${['discover', 'analyze', 'verify'][index]}-${tier}`,
  capability, tier, priceBase: tier === 'lite' ? '10000' : '30000', tokenDecimals: 6,
  description: `${capability} service; ${tier === 'lite' ? 'partial evidence at lower cost' : 'complete local benchmark evidence at higher cost'}`,
  implementation: 'deterministic_local_research_service', version: '1.0.0',
}))));
export function catalogSnapshot() { return JSON.parse(JSON.stringify(CATALOG)); }
export function providerById(id) { const value = CATALOG.find(p => p.providerId === id); if (!value) throw Error('RESEARCH_PROVIDER_UNKNOWN'); return value; }
export function catalogHash() { return createHash('sha256').update(JSON.stringify(CATALOG)).digest('hex'); }
