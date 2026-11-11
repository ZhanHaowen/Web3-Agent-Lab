// A protocol name is not a compatibility claim. Execution profiles are explicit.
export const PROTOCOLS = Object.freeze([
  {id:'x402',name:'x402',layer:'settlement',sources:['https://github.com/x402-foundation/x402'],profiles:['x402-exact','x402-batch'],boundary:'Pinned official EVM SDK; local test token. Other networks and schemes are not implied.'},
  {id:'ap2',name:'AP2 v0.2',layer:'authorization',sources:['https://ap2-protocol.org/ap2/specification/'],profiles:['ap2-x402-exact','ap2-x402-batch'],boundary:'Local signed mandate binding overlay; not a complete credential-provider / SD-JWT ecosystem certification.'},
  {id:'mpp',name:'Machine Payments Protocol',layer:'settlement',sources:['https://mpp.dev/','https://github.com/wevm/mppx'],profiles:['mpp-evm-charge'],boundary:'Official mppx EVM charge on local Anvil. Tempo, session vouchers and Stripe/card rails are not implied.'},
  {id:'l402',name:'L402',layer:'settlement',sources:['https://github.com/lightninglabs/aperture'],profiles:[],boundary:'Requires Lightning invoice payment and macaroon verification. EVM transfers do not implement L402.'},
  {id:'acp-commerce',name:'ACP · OpenAI / Stripe',layer:'commerce',sources:['https://www.agenticcommerce.dev/'],profiles:[],boundary:'Checkout and delegated payment credentials; external PSP sandbox required for settlement tests.'},
  {id:'ucp',name:'Universal Commerce Protocol',layer:'commerce',sources:['https://ucp.dev/specification/overview/'],profiles:[],boundary:'Discovery / checkout / order lifecycle, optionally AP2. Not itself a settlement rail.'},
  {id:'visa-tap',name:'Visa Trusted Agent Protocol',layer:'identity-authorization',sources:['https://developer.visa.com/docs/trusted-agent-protocol'],profiles:[],boundary:'HTTP signature and trusted-agent verification do not alone prove a Visa payment settled.'},
  {id:'mastercard-agent-pay',name:'Mastercard Agent Pay',layer:'identity-authorization',sources:['https://www.mastercard.com/us/en/business/solutions/mastercard-agent-pay.html'],profiles:[],boundary:'Network tokenization / consent / payment controls require network onboarding and sandbox credentials.'},
  {id:'erc8183',name:'ERC-8183',layer:'escrow',sources:['https://ercs.ethereum.org/ERCS/erc-8183'],profiles:['erc8183-core'],boundary:'Local core job escrow: client / provider / evaluator, completion / rejection / expiry refunds. No hooks, fees or ERC-2771; not Virtuals SDK certification.'},
  {id:'virtuals-acp',name:'Virtuals Agent Commerce Protocol',layer:'escrow',sources:['https://os.virtuals.io/acp/overview'],profiles:[],boundary:'Different ACP from OpenAI / Stripe; SDK and reference deployment must be tested separately.'},
  {id:'nevermined',name:'Nevermined',layer:'metering-settlement',sources:['https://nevermined.ai/docs/getting-started/overview'],profiles:[],boundary:'Plans, credits, metering and settlement; hosted service configuration required.'},
  {id:'kyapay',name:'KYA / KYAPay',layer:'identity-authorization',sources:['https://kyapay.org/'],profiles:[],boundary:'Identity, user intent and tokenized payment credentials; do not equate local schema parsing with network acceptance.'},
]);

export function executionProfiles() {
  return [
    {id:'x402-exact',scheme:'exact',authorization:'none',label:'x402 · EVM exact',scope:'local official SDK'},
    {id:'x402-batch',scheme:'batch-settlement',authorization:'none',label:'x402 · EVM batch settlement',scope:'local official SDK'},
    {id:'ap2-x402-exact',scheme:'exact',authorization:'ap2',label:'AP2 local overlay + x402 exact',scope:'local mandate subset'},
    {id:'ap2-x402-batch',scheme:'batch-settlement',authorization:'ap2',label:'AP2 local overlay + x402 batch',scope:'local mandate subset'},
    {id:'erc8183-core',scheme:'erc8183',authorization:'none',label:'ERC-8183 · 本地任务托管',scope:'local core standard'},
    {id:'mpp-evm-charge',scheme:'mpp-evm-charge',authorization:'none',label:'MPP · EVM charge',scope:'local official SDK'},
  ];
}

export function resolvePaymentProfile(id) {
  const profile=executionProfiles().find(p=>p.id===id);
  if(!profile) throw Error('PAYMENT_PROFILE_NOT_IMPLEMENTED');
  return {...profile};
}

export function protocolMatrix() {
  return {schema:'web3-protocol-capabilities-v1',reviewedAt:'2026-11-11',
    claim:'Inventory and runnable profiles are separate. A profile is verified only by a saved test report.',
    protocols:PROTOCOLS.map(p=>({...p,implementation:p.profiles.length?'local_profile':'not_implemented',verification:'see-test-report'})),
    profiles:executionProfiles(),
    adjacent:['ERC-4337 / EIP-7702: account execution','ERC-8004: identity / reputation','MCP / A2A: tool and agent transport'],
    privacyComparators:['PrivateX402','A402','TACEO Confidential x402']};
}
