/**
 * Compile-only contract assertions plus small boundary-validator checks.
 * Run the strict compiler with: tsc -p tsconfig.control.json
 * Node's native TypeScript stripping can execute the validators, but is NOT a
 * replacement for the compiler or proof that the existing ESM conforms.
 */
import {
  address, baseUnits, bytes32, chainInstanceId, commandId, eventId,
  executionId, hexData, humanAmount, installationId, intentId, isoTimestamp,
  jobId, leaseEpoch, modelCallId, nonNegativeInteger, profileVersion,
  sha256, sourceSequence, streamId, agentId, agentRunId, txHash,
} from '../src/control/types.ts';
import type {
  ActorRoleContext, AgentProfile, Binding, Execution, ExecutionIdentity,
  ExecutionState, HumanAmount, Job, Lease, LeaseEpoch, PublicJob,
  RedactedJsonObject, TaskDefinition, TxIntent, TxIntentIdentity,
  TxIntentLifecycle, TxReceipt, TxState, Uint256String,
  UnsignedEip1559Transaction, WorkerCommand, WorkerEvent,
} from '../src/control/types.ts';

function expectType<T>(_value: T): void {}
function expectRejected(fn: () => unknown): void {
  let rejected = false;
  try { fn(); } catch { rejected = true; }
  if (!rejected) throw new Error('Boundary validator unexpectedly accepted an invalid value');
}

const a = address('0x1111111111111111111111111111111111111111');
const b = address('0x2222222222222222222222222222222222222222');
const h = sha256('a'.repeat(64));
const bytes = bytes32('0x' + 'b'.repeat(64));
const transactionHash = txHash('0x' + 'c'.repeat(64));
const now = isoTimestamp('2026-10-27T00:00:00.000Z');
const exId = executionId('execution-1');
const jId = jobId('job-1');
const runId = agentRunId('run-maker-1');
const ep = leaseEpoch(1);
const pv = profileVersion(1);
const amountA = humanAmount('10');
const amountB = humanAmount('20');
// This is an already-redacted fixture, not a redaction implementation.
const redactedFixture = { public: true } as unknown as RedactedJsonObject;

const definition = {
  schemaVersion: '2.0', taskType: 'peer_swap', version: '1.0.0', definitionHash: h,
  roles: ['maker', 'taker'],
  inputSchema: {
    type: 'object',
    properties: { sellAmount: { type: 'string', format: 'human-token-6' } },
    required: ['sellAmount'], additionalProperties: false,
  },
  requiredTools: { maker: ['send_message', 'create_order'], taker: ['send_message', 'fill_order'] },
  prompts: { maker: 'Use your own wallet and goal.', taker: 'Inspect the received order.' },
  uiSchema: {}, fixtureHash: h, checkerId: 'peer-2.0', checkerVersion: '2.0.0',
  executionAdapter: 'peer_swap',
} as const satisfies TaskDefinition<'peer_swap'>;
expectType<TaskDefinition<'peer_swap'>>(definition);

const peerJob = {
  jobId: jId, taskType: 'peer_swap', version: '1.0.0', definitionHash: h,
  input: {
    sellToken: 'A', sellAmount: amountA, buyToken: 'B', buyAmount: amountB,
    deadlineSeconds: nonNegativeInteger(300), maxSteps: nonNegativeInteger(60),
    mode: 'scripted', automine: true, manual: false, pauseBeforeTransaction: false,
  },
  privateGoals: {
    maker: { sellAmount: amountA, minBuy: amountB },
    taker: { minReceive: amountA, maxPay: amountB },
  },
  environment: { mode: 'independent', fixture: 'peer-default' }, assignmentMode: 'manual',
  state: 'published', createdAt: now, executionId: null, parentExecutionId: null,
} as const satisfies Job<'peer_swap'>;
const publicJob: PublicJob<'peer_swap'> = {
  jobId: peerJob.jobId, taskType: peerJob.taskType, version: peerJob.version,
  definitionHash: peerJob.definitionHash, input: peerJob.input,
  environment: peerJob.environment, state: peerJob.state, createdAt: peerJob.createdAt,
};
expectType<PublicJob<'peer_swap'>>(publicJob);

const profile = {
  agentId: agentId('agent-a'), installationId: installationId('installation-a'),
  profileVersion: pv, walletRef: 'local-wallet-a', walletAddress: a,
  modelRef: 'local-model-a', capabilities: ['peer_swap'],
  installedTools: ['send_message', 'create_order'], authorizedTaskTypes: ['peer_swap'],
} as const satisfies AgentProfile;
const makerBinding = {
  executionId: exId, agentId: profile.agentId, agentRunId: runId,
  roleId: 'maker', profileVersion: pv, leaseEpoch: ep, walletAddress: a,
} as const satisfies Binding<'maker'>;
const takerBinding = {
  ...makerBinding, agentId: agentId('agent-b'), agentRunId: agentRunId('run-taker-1'),
  roleId: 'taker', walletAddress: b,
} as const satisfies Binding<'taker'>;
const lease = {
  ...makerBinding, leaseId: 'lease-1', issuedAt: now,
  expiresAt: null, revoked: false, allowedTools: ['send_message', 'create_order'],
} as const satisfies Lease<'maker'>;
expectType<Lease>(lease);

const executionIdentity = {
  executionId: exId, jobId: jId, taskType: 'peer_swap',
  attempt: nonNegativeInteger(1), definitionHash: h,
  bindings: { maker: makerBinding, taker: takerBinding },
  chainInstanceId: chainInstanceId('chain-1'), initialStateRef: h, parentExecutionId: null,
} as const satisfies ExecutionIdentity<'peer_swap'>;
const queued = {
  ...executionIdentity, state: 'queued', sealed: false, funds: 'none', business: 'unknown',
  startedAt: null, endedAt: null,
} as const satisfies Execution<'peer_swap'>;
const completed = {
  ...executionIdentity, state: 'completed', sealed: true, funds: 'settled', business: 'fulfilled',
  startedAt: now, endedAt: now,
  seal: { manifestHash: h, eventCount: nonNegativeInteger(7), sealedAt: now },
} as const satisfies Execution<'peer_swap'>;
expectType<Execution<'peer_swap'>>(queued);
expectType<Execution<'peer_swap'>>(completed);

const unsigned = {
  chainId: 31337, type: 'eip1559', to: b, data: hexData('0x1234'),
  valueWei: baseUnits('0'), nonce: nonNegativeInteger(0), gasLimit: baseUnits('800000'),
  maxFeePerGasWei: baseUnits('2000000000'), maxPriorityFeePerGasWei: baseUnits('1000000000'),
} as const satisfies UnsignedEip1559Transaction;
const intentIdentity = {
  intentId: intentId('intent-1'), executionId: exId, agentId: profile.agentId,
  agentRunId: runId, roleId: 'maker', leaseEpoch: ep,
  chainInstanceId: chainInstanceId('chain-1'), from: a,
  calldataHash: bytes, unsigned, preparedEventId: eventId('prepared-1'), preparedAt: now,
} as const satisfies TxIntentIdentity;
const reserved = { ...intentIdentity, state: 'reserved', hash: null, receipt: null } as const satisfies TxIntent;
const unknownIntent = {
  ...intentIdentity, state: 'unknown', hash: null, hashPersistedAt: null,
  receipt: null, reason: 'response_lost',
} as const satisfies TxIntent;
const receipt = {
  status: 'success', transactionHash, blockNumber: baseUnits('12'), blockHash: bytes,
  transactionIndex: nonNegativeInteger(0), from: a, to: b,
  gasUsed: baseUnits('21000'), effectiveGasPriceWei: baseUnits('1000000000'), logs: [],
} as const satisfies TxReceipt<'success'>;
const confirmed = {
  ...intentIdentity, state: 'confirmed', hash: transactionHash, hashPersistedAt: now, receipt,
} as const satisfies TxIntent;
expectType<TxIntent>(reserved);
expectType<TxIntent>(unknownIntent);
expectType<TxIntent>(confirmed);

const ownRoleContext = {
  roleId: 'maker', privateGoal: { sellAmount: amountA, minBuy: amountB },
  publicInput: { sellToken: 'A', buyToken: 'B' }, definitionHash: h,
  ownWalletAddress: a, allowedTools: ['send_message', 'create_order'],
} as const satisfies ActorRoleContext<'maker'>;
const commandIdentity = {
  commandId: commandId('command-1'), executionId: exId, agentId: profile.agentId,
  agentRunId: runId, profileVersion: pv, leaseEpoch: ep, definitionHash: h,
};
const bindCommand = {
  ...commandIdentity, type: 'bind', context: ownRoleContext, reservationExpiresAt: now,
} as const satisfies WorkerCommand;
const signCommand = {
  ...commandIdentity, type: 'sign', intentId: intentIdentity.intentId,
  expectedSender: a, transaction: unsigned, allowedTargets: [b], calldataHash: bytes,
} as const satisfies WorkerCommand;
expectType<WorkerCommand>(bindCommand);
expectType<WorkerCommand>(signCommand);

const eventIdentity = {
  schemaVersion: '2.0', executionId: exId, agentRunId: runId,
  streamId: streamId('agent-a:run-maker-1'), seq: sourceSequence(1),
  eventId: eventId('event-1'), leaseEpoch: ep, timestamp: now, causes: [],
} as const;
const modelEvent = {
  ...eventIdentity, type: 'model.request',
  payload: { modelCallId: modelCallId('model-call-1'), endpoint: 'http://127.0.0.1:7000/v1', request: redactedFixture },
} as const satisfies WorkerEvent;
expectType<WorkerEvent>(modelEvent);

// Exhaustiveness is intentional: adding a lifecycle state requires review here.
const executionStates = {
  queued: true, reserving: true, running: true, paused: true, recovering: true,
  completed: true, stopped: true, requires_attention: true,
} satisfies Record<ExecutionState, boolean>;
const txStates = {
  reserved: true, broadcasting: true, pending: true, confirmed: true, reverted: true,
  unknown: true, cancelled_before_signing: true,
} satisfies Record<TxState, boolean>;
expectType<Record<ExecutionState, boolean>>(executionStates);
expectType<Record<TxState, boolean>>(txStates);

if (false) {
  // @ts-expect-error Integer chain amounts cannot be JavaScript numbers.
  const numberAmount: Uint256String = 20000000;
  // @ts-expect-error Human units and ABI base units are deliberately distinct.
  const mixedUnits: HumanAmount = baseUnits('20000000');
  // @ts-expect-error Profile versions cannot be used as execution lease epochs.
  const wrongEpoch: LeaseEpoch = pv;
  // @ts-expect-error A peer task cannot declare the single-agent role.
  const wrongRoles: TaskDefinition<'peer_swap'>['roles'] = ['agent'];
  // @ts-expect-error A maker must not receive the taker's goal shape.
  const peerGoal: ActorRoleContext<'maker'>['privateGoal'] = { minReceive: amountA, maxPay: amountB };
  // @ts-expect-error Public task projections do not expose role goals.
  const leakedGoal = publicJob.privateGoals;
  // @ts-expect-error A profile contains secret references, never the private key itself.
  const leakedProfile: AgentProfile = { ...profile, privateKey: 'secret' };
  // @ts-expect-error Persisted transaction intents cannot contain raw signatures.
  const leakedSignature: TxIntent = { ...reserved, signature: '0xdeadbeef' };
  // @ts-expect-error Persisted transaction intents cannot contain signed raw bytes.
  const leakedRawTransaction: TxIntent = { ...reserved, serializedTransaction: '0xdeadbeef' };
  // @ts-expect-error A pending transaction requires a durable transaction hash.
  const missingDurableHash: TxIntent = { ...intentIdentity, state: 'pending', hash: null, hashPersistedAt: now, receipt: null };
  // @ts-expect-error A confirmed state cannot contain a reverted receipt.
  const wrongReceipt: Extract<TxIntentLifecycle, { state: 'confirmed' }>['receipt'] = { ...receipt, status: 'reverted' };
  // @ts-expect-error A terminal execution cannot retain open escrow funds.
  const unsafeTerminal: Execution<'peer_swap'> = { ...completed, funds: 'open' };
  // @ts-expect-error Terminal metadata cannot claim completion before sealing.
  const unsealedTerminal: Execution<'peer_swap'> = { ...completed, sealed: false };
  // @ts-expect-error A worker cannot claim a trusted transaction broadcast event.
  const forgedChainEvent: WorkerEvent['type'] = 'tx.broadcast';
  // @ts-expect-error Request payloads require the explicit redaction boundary brand.
  const rawRequest: WorkerEvent = { ...modelEvent, payload: { ...modelEvent.payload, request: { apiKey: 'example' } } };
  // @ts-expect-error A nonce is a safe integer, not a token amount.
  const amountAsNonce: UnsignedEip1559Transaction['nonce'] = amountA;
  // @ts-expect-error Only the fixed local experiment chain is supported here.
  const wrongChain: UnsignedEip1559Transaction['chainId'] = 1;
  // @ts-expect-error Frozen role bindings cannot be mutated in place.
  makerBinding.walletAddress = b;
}

// These checks are executable with Node's native TS stripping, independently of
// the compile-time assertions above. A compiler is still mandatory for those.
expectType<string>(baseUnits('20000000'));
expectType<string>(humanAmount('20.000001'));
for (const invalid of ['1e6', '-1', '1.0000001', ' 20', '20 ']) expectRejected(() => humanAmount(invalid));
for (const invalid of ['1e6', '-1', '1.0', '0x10', (1n << 256n).toString()]) expectRejected(() => baseUnits(invalid));
expectRejected(() => leaseEpoch(0));
expectRejected(() => nonNegativeInteger(-1));
expectRejected(() => sourceSequence(1.5));
expectRejected(() => address('0x1234'));
expectRejected(() => hexData('0x123'));
expectRejected(() => sha256('not-a-hash'));

