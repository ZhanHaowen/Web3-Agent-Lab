/**
 * Canonical type contract for the v2 control boundary.
 *
 * This file is additive. The executable ESM modules are not automatically
 * checked against these types. Their adapters must validate untrusted JSON,
 * authenticate identities, redact payloads and map legacy field names first.
 * Passing this contract's compilation does not establish AT-01 compliance.
 */

declare const opaque: unique symbol;
export type Branded<T, Name extends string> = T & { readonly [opaque]: Name };
export type AgentId = Branded<string, 'AgentId'>;
export type AgentRunId = Branded<string, 'AgentRunId'>;
export type JobId = Branded<string, 'JobId'>;
export type ExecutionId = Branded<string, 'ExecutionId'>;
export type IntentId = Branded<string, 'IntentId'>;
export type CommandId = Branded<string, 'CommandId'>;
export type EventId = Branded<string, 'EventId'>;
export type MessageId = Branded<string, 'MessageId'>;
export type QuoteId = Branded<string, 'QuoteId'>;
export type ModelCallId = Branded<string, 'ModelCallId'>;
export type StreamId = Branded<string, 'StreamId'>;
export type ChainInstanceId = Branded<string, 'ChainInstanceId'>;
export type InstallationId = Branded<string, 'InstallationId'>;
export type Address = Branded<string, 'Address'>;
export type HexData = Branded<string, 'HexData'>;
export type Bytes32Hex = Branded<string, 'Bytes32Hex'>;
export type TxHash = Branded<string, 'TxHash'>;
export type Sha256 = Branded<string, 'Sha256'>;
/** Human token units, validated as a decimal string with at most six places. */
export type HumanAmount = Branded<string, 'HumanAmount'>;
/** Unsigned integer decimal text. Stored as TEXT; never a JavaScript number. */
export type Uint256String = Branded<string, 'Uint256String'>;
export type LeaseEpoch = Branded<number, 'LeaseEpoch'>;
export type ProfileVersion = Branded<number, 'ProfileVersion'>;
export type SourceSequence = Branded<number, 'SourceSequence'>;
export type NonNegativeInteger = Branded<number, 'NonNegativeInteger'>;
export type IsoTimestamp = Branded<string, 'IsoTimestamp'>;
export type SemanticVersion = `${number}.${number}.${number}`;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export interface JsonObject { readonly [key: string]: JsonValue }
/** Runtime redaction is still required for every free-form JSON string. */
export type RedactedJsonObject = Branded<JsonObject, 'RedactedJsonObject'>;

export type TaskType = 'balance' | 'transfer' | 'approve' | 'swap' | 'swap_deposit' | 'peer_swap';
export type LegacyTaskType = Exclude<TaskType, 'peer_swap'>;
export type PeerRole = 'maker' | 'taker';
export type RoleId = PeerRole | 'agent';
export type RolesFor<T extends TaskType> = T extends 'peer_swap' ? PeerRole : 'agent';
export type ToolName =
  | 'get_balance' | 'transfer_token' | 'approve_token' | 'swap' | 'deposit'
  | 'send_message' | 'inspect_order' | 'approve_sell' | 'create_order'
  | 'approve_buy' | 'fill_order' | 'cancel_order' | 'expire_order' | 'wait' | 'finish';
export type ExecutionMode = 'scripted' | 'llm';
export type EnvironmentPolicy = Readonly<{
  mode: 'independent' | 'continuous';
  fixture: string;
}>;

export interface MakerGoal { readonly sellAmount: HumanAmount; readonly minBuy: HumanAmount }
export interface TakerGoal { readonly minReceive: HumanAmount; readonly maxPay: HumanAmount }
export type LegacyPrivateGoal = Readonly<Record<string, never>>;
export interface GoalsByRole { readonly maker: MakerGoal; readonly taker: TakerGoal; readonly agent: LegacyPrivateGoal }
export type PrivateGoalsFor<T extends TaskType> = Readonly<{
  [R in RolesFor<T>]: GoalsByRole[R]
}>;

export interface PeerSwapInput {
  readonly sellToken: 'A';
  readonly sellAmount: HumanAmount;
  readonly buyToken: 'B';
  readonly buyAmount: HumanAmount;
  readonly deadlineSeconds: NonNegativeInteger;
  readonly maxSteps: NonNegativeInteger;
  readonly mode: ExecutionMode;
  readonly automine: boolean;
  readonly manual: boolean;
  readonly pauseBeforeTransaction: boolean;
}
export interface LegacyParametersByTask {
  readonly balance: Readonly<Record<string, never>>;
  readonly transfer: Readonly<{ amount: HumanAmount }>;
  readonly approve: Readonly<{ amount: HumanAmount }>;
  readonly swap: Readonly<{ amountIn: HumanAmount; minAmountOut: HumanAmount }>;
  readonly swap_deposit: Readonly<{ amountIn: HumanAmount; minAmountOut: HumanAmount }>;
}
export type InputFor<T extends TaskType> = T extends 'peer_swap'
  ? PeerSwapInput
  : T extends LegacyTaskType ? LegacyParametersByTask[T] : never;

export type ParameterSchema =
  | Readonly<{ type: 'string'; format?: 'human-token-6' | 'uint256-decimal' | 'address'; enum?: readonly string[]; pattern?: string }>
  | Readonly<{ type: 'integer'; minimum?: number; maximum?: number }>
  | Readonly<{ type: 'boolean' }>
  | Readonly<{ type: 'array'; items: ParameterSchema; maxItems?: NonNegativeInteger }>
  | ObjectParameterSchema;
export interface ObjectParameterSchema {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, ParameterSchema>>;
  readonly required: readonly string[];
  readonly additionalProperties: false;
}

/** References deliberately exclude secret values and executable task uploads. */
export interface NoSecretMaterial {
  readonly privateKey?: never;
  readonly mnemonic?: never;
  readonly apiKey?: never;
  readonly identityToken?: never;
  readonly serializedTransaction?: never;
  readonly signature?: never;
}
export interface AgentProfile extends NoSecretMaterial {
  readonly agentId: AgentId;
  readonly installationId: InstallationId;
  readonly profileVersion: ProfileVersion;
  readonly walletRef: string;
  readonly walletAddress: Address;
  readonly modelRef: string;
  readonly capabilities: readonly TaskType[];
  readonly installedTools: readonly ToolName[];
  readonly authorizedTaskTypes: readonly TaskType[];
}

export interface TaskDefinition<T extends TaskType = TaskType> extends NoSecretMaterial {
  readonly schemaVersion: '2.0';
  readonly taskType: T;
  readonly version: SemanticVersion;
  readonly definitionHash: Sha256;
  readonly roles: readonly RolesFor<T>[];
  readonly inputSchema: ObjectParameterSchema;
  readonly requiredTools: Readonly<{ [R in RolesFor<T>]: readonly ToolName[] }>;
  readonly prompts: Readonly<{ [R in RolesFor<T>]: string }>;
  readonly uiSchema: JsonObject;
  readonly fixtureHash: Sha256;
  readonly checkerId: string;
  readonly checkerVersion: SemanticVersion;
  readonly executionAdapter: T;
  readonly executableJavaScript?: never;
}

export type JobState = 'published' | 'reserved' | 'assigned' | 'closed' | 'withdrawn';
export interface Job<T extends TaskType = TaskType> extends NoSecretMaterial {
  readonly jobId: JobId;
  readonly taskType: T;
  readonly version: SemanticVersion;
  readonly definitionHash: Sha256;
  readonly input: InputFor<T>;
  readonly privateGoals: PrivateGoalsFor<T>;
  readonly environment: EnvironmentPolicy;
  readonly assignmentMode: 'manual';
  readonly state: JobState;
  readonly createdAt: IsoTimestamp;
  readonly executionId: ExecutionId | null;
  readonly parentExecutionId: ExecutionId | null;
}
export type PublicJob<T extends TaskType = TaskType> = Pick<Job<T>,
  'jobId' | 'taskType' | 'version' | 'definitionHash' | 'input' | 'environment' | 'state' | 'createdAt'
>;

export interface Binding<R extends RoleId = RoleId> extends NoSecretMaterial {
  readonly executionId: ExecutionId;
  readonly agentId: AgentId;
  readonly agentRunId: AgentRunId;
  readonly roleId: R;
  readonly profileVersion: ProfileVersion;
  readonly leaseEpoch: LeaseEpoch;
  readonly walletAddress: Address;
}
export type BindingsFor<T extends TaskType> = Readonly<{ [R in RolesFor<T>]: Binding<R> }>;
export interface Lease<R extends RoleId = RoleId> extends Binding<R> {
  readonly leaseId: string;
  readonly issuedAt: IsoTimestamp;
  readonly expiresAt: IsoTimestamp | null;
  readonly revoked: boolean;
  readonly allowedTools: readonly ToolName[];
}

export type ExecutionState =
  | 'queued' | 'reserving' | 'running' | 'paused' | 'recovering'
  | 'completed' | 'stopped' | 'requires_attention';
export type BusinessOutcome = 'fulfilled' | 'no_deal' | 'failed' | 'unknown';
export type FundsOutcome = 'none' | 'open' | 'pending' | 'settled' | 'refunded' | 'unknown';
export interface EvidenceSeal {
  readonly manifestHash: Sha256;
  readonly eventCount: NonNegativeInteger;
  readonly sealedAt: IsoTimestamp;
}
export type ExecutionLifecycle =
  | Readonly<{ state: 'queued' | 'reserving'; sealed: false; funds: 'none'; business: 'unknown'; startedAt: null; endedAt: null }>
  | Readonly<{ state: 'running' | 'paused' | 'recovering' | 'requires_attention'; sealed: false; funds: FundsOutcome; business: BusinessOutcome; startedAt: IsoTimestamp; endedAt: null }>
  | Readonly<{ state: 'completed' | 'stopped'; sealed: true; funds: 'none' | 'settled' | 'refunded'; business: BusinessOutcome; startedAt: IsoTimestamp; endedAt: IsoTimestamp; seal: EvidenceSeal }>;
export interface ExecutionIdentity<T extends TaskType = TaskType> extends NoSecretMaterial {
  readonly executionId: ExecutionId;
  readonly jobId: JobId;
  readonly taskType: T;
  readonly attempt: NonNegativeInteger;
  readonly definitionHash: Sha256;
  readonly bindings: BindingsFor<T>;
  readonly chainInstanceId: ChainInstanceId | null;
  readonly initialStateRef: Sha256 | null;
  readonly parentExecutionId: ExecutionId | null;
}
export type Execution<T extends TaskType = TaskType> = ExecutionIdentity<T> & ExecutionLifecycle;

export interface UnsignedEip1559Transaction {
  readonly chainId: 31337;
  readonly type: 'eip1559';
  readonly to: Address;
  readonly data: HexData;
  readonly valueWei: Uint256String;
  readonly nonce: NonNegativeInteger;
  readonly gasLimit: Uint256String;
  readonly maxFeePerGasWei: Uint256String;
  readonly maxPriorityFeePerGasWei: Uint256String;
}
export interface ReceiptLog {
  readonly address: Address;
  readonly topics: readonly Bytes32Hex[];
  readonly data: HexData;
  readonly logIndex: NonNegativeInteger;
  readonly transactionIndex: NonNegativeInteger;
}
export interface TxReceipt<S extends 'success' | 'reverted' = 'success' | 'reverted'> {
  readonly status: S;
  readonly transactionHash: TxHash;
  readonly blockNumber: Uint256String;
  readonly blockHash: Bytes32Hex;
  readonly transactionIndex: NonNegativeInteger;
  readonly from: Address;
  readonly to: Address;
  readonly gasUsed: Uint256String;
  readonly effectiveGasPriceWei: Uint256String;
  readonly logs: readonly ReceiptLog[];
}
export type TxState = 'reserved' | 'broadcasting' | 'pending' | 'confirmed' | 'reverted' | 'unknown' | 'cancelled_before_signing';
export interface TxIntentIdentity extends NoSecretMaterial {
  readonly intentId: IntentId;
  readonly executionId: ExecutionId;
  readonly agentId: AgentId;
  readonly agentRunId: AgentRunId;
  readonly roleId: RoleId;
  readonly leaseEpoch: LeaseEpoch;
  readonly chainInstanceId: ChainInstanceId;
  readonly from: Address;
  readonly calldataHash: Bytes32Hex;
  readonly unsigned: UnsignedEip1559Transaction;
  readonly preparedEventId: EventId;
  readonly preparedAt: IsoTimestamp;
}
export type TxIntentLifecycle =
  | Readonly<{ state: 'reserved'; hash: null; receipt: null }>
  | Readonly<{ state: 'broadcasting' | 'pending'; hash: TxHash; hashPersistedAt: IsoTimestamp; receipt: null }>
  | Readonly<{ state: 'confirmed'; hash: TxHash; hashPersistedAt: IsoTimestamp; receipt: TxReceipt<'success'> }>
  | Readonly<{ state: 'reverted'; hash: TxHash; hashPersistedAt: IsoTimestamp; receipt: TxReceipt<'reverted'> }>
  | Readonly<{ state: 'unknown'; hash: TxHash | null; hashPersistedAt: IsoTimestamp | null; receipt: null; reason: 'rpc_unavailable' | 'response_lost' | 'nonce_conflict' | 'chain_identity_changed' | 'receipt_unavailable' }>
  | Readonly<{ state: 'cancelled_before_signing'; hash: null; receipt: null; cancellationEventId: EventId }>;
export type TxIntent = TxIntentIdentity & TxIntentLifecycle;

export interface BusinessMessage extends NoSecretMaterial {
  readonly messageId: MessageId;
  readonly executionId: ExecutionId;
  readonly fromAgentId: AgentId;
  readonly toRoleId: RoleId;
  readonly type: 'inquiry' | 'quote' | 'accept' | 'reject' | 'order_ref';
  readonly replyTo: MessageId | null;
  readonly quoteId: QuoteId | null;
  readonly senderSeq: SourceSequence;
  readonly payload: RedactedJsonObject;
  readonly sentEventId: EventId;
  readonly deliveredEventId: EventId | null;
  readonly consumedEventId: EventId | null;
}
export interface ActorRoleContext<R extends RoleId> {
  readonly roleId: R;
  readonly privateGoal: GoalsByRole[R];
  readonly publicInput: JsonObject;
  readonly definitionHash: Sha256;
  readonly ownWalletAddress: Address;
  readonly allowedTools: readonly ToolName[];
}
export type OwnRoleContext = { [R in RoleId]: ActorRoleContext<R> }[RoleId];
export interface WorkerCommandIdentity {
  readonly commandId: CommandId;
  readonly executionId: ExecutionId;
  readonly agentId: AgentId;
  readonly agentRunId: AgentRunId;
  readonly profileVersion: ProfileVersion;
  readonly leaseEpoch: LeaseEpoch;
  readonly definitionHash: Sha256;
}
export interface ToolDecision {
  readonly name: ToolName;
  readonly arguments: JsonObject;
  readonly providerToolCallId: string | null;
  readonly modelCallId: ModelCallId | null;
  readonly causes: readonly EventId[];
}
export type WorkerCommand = WorkerCommandIdentity & (
  | Readonly<{ type: 'bind'; context: OwnRoleContext; reservationExpiresAt: IsoTimestamp }>
  | Readonly<{ type: 'step'; context: OwnRoleContext; inbox: readonly BusinessMessage[]; progress: RedactedJsonObject }>
  | Readonly<{ type: 'result'; call: ToolDecision; value: RedactedJsonObject }>
  | Readonly<{ type: 'sign'; intentId: IntentId; expectedSender: Address; transaction: UnsignedEip1559Transaction; allowedTargets: readonly Address[]; calldataHash: Bytes32Hex }>
  | Readonly<{ type: 'shutdown'; reason: 'operator_request' | 'control_shutdown' | 'lease_revoked' }>
);
/** Signature material is an in-memory result, never a persisted TxIntent. */
export interface EphemeralSigningResult { readonly signatureHex: HexData; readonly intentId: IntentId }

export interface WorkerEventIdentity extends NoSecretMaterial {
  readonly schemaVersion: '2.0';
  readonly executionId: ExecutionId;
  readonly agentRunId: AgentRunId;
  readonly streamId: StreamId;
  readonly seq: SourceSequence;
  readonly eventId: EventId;
  readonly leaseEpoch: LeaseEpoch;
  readonly timestamp: IsoTimestamp;
  readonly causes: readonly EventId[];
}
export type WorkerEvent = WorkerEventIdentity & (
  | Readonly<{ type: 'model.request'; payload: Readonly<{ modelCallId: ModelCallId; endpoint: string; request: RedactedJsonObject }> }>
  | Readonly<{ type: 'model.response'; payload: Readonly<{ modelCallId: ModelCallId; status: NonNegativeInteger; response: RedactedJsonObject }> }>
  | Readonly<{ type: 'agent.progress'; payload: Readonly<{ message: RedactedJsonObject; progress: RedactedJsonObject }> }>
  | Readonly<{ type: 'agent.error'; payload: Readonly<{ code: string; message: string; recoverable: boolean; submitted: boolean }> }>
  | Readonly<{ type: 'agent.wait'; payload: Readonly<{ reason: 'message_or_chain' | 'yield_scheduler' | 'reconciliation_required' }> }>
);
/** Authentication injects these fields; caller-supplied actor IDs are not authority. */
export type IngestedWorkerEvent = WorkerEvent & Readonly<{
  agentId: AgentId;
  roleId: RoleId;
  profileVersion: ProfileVersion;
}>;

const MAX_UINT256 = (1n << 256n) - 1n;
export function baseUnits(value: string): Uint256String {
  if (typeof value !== 'string' || !/^\d+$/.test(value) || BigInt(value) > MAX_UINT256) throw new TypeError('UINT256_DECIMAL_REQUIRED');
  return value as Uint256String;
}
export function humanAmount(value: string): HumanAmount {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,6})?$/.test(value)) throw new TypeError('HUMAN_DECIMAL_REQUIRED');
  const [whole = '', fraction = ''] = value.split('.');
  if (BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0')) > MAX_UINT256) throw new TypeError('UINT256_RANGE');
  return value as HumanAmount;
}
export function address(value: string): Address {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new TypeError('ADDRESS_REQUIRED');
  return value as Address;
}
export function hexData(value: string): HexData {
  if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) throw new TypeError('EVEN_HEX_DATA_REQUIRED');
  return value as HexData;
}
export function bytes32(value: string): Bytes32Hex {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new TypeError('BYTES32_REQUIRED');
  return value as Bytes32Hex;
}
export function txHash(value: string): TxHash {
  bytes32(value);
  return value as TxHash;
}
export function sha256(value: string): Sha256 {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new TypeError('SHA256_REQUIRED');
  return value as Sha256;
}
function integer(value: number, positive: boolean): number {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) throw new TypeError('SAFE_INTEGER_REQUIRED');
  return value;
}
export const nonNegativeInteger = (value: number): NonNegativeInteger => integer(value, false) as NonNegativeInteger;
export const leaseEpoch = (value: number): LeaseEpoch => integer(value, true) as LeaseEpoch;
export const profileVersion = (value: number): ProfileVersion => integer(value, true) as ProfileVersion;
export const sourceSequence = (value: number): SourceSequence => integer(value, true) as SourceSequence;
export function isoTimestamp(value: string): IsoTimestamp {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw new TypeError('UTC_TIMESTAMP_REQUIRED');
  return value as IsoTimestamp;
}
function identifier<Name extends string>(value: string): Branded<string, Name> {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(value)) throw new TypeError('IDENTIFIER_REQUIRED');
  return value as Branded<string, Name>;
}
export const agentId = (v: string): AgentId => identifier<'AgentId'>(v);
export const agentRunId = (v: string): AgentRunId => identifier<'AgentRunId'>(v);
export const jobId = (v: string): JobId => identifier<'JobId'>(v);
export const executionId = (v: string): ExecutionId => identifier<'ExecutionId'>(v);
export const intentId = (v: string): IntentId => identifier<'IntentId'>(v);
export const commandId = (v: string): CommandId => identifier<'CommandId'>(v);
export const eventId = (v: string): EventId => identifier<'EventId'>(v);
export const messageId = (v: string): MessageId => identifier<'MessageId'>(v);
export const quoteId = (v: string): QuoteId => identifier<'QuoteId'>(v);
export const modelCallId = (v: string): ModelCallId => identifier<'ModelCallId'>(v);
export const streamId = (v: string): StreamId => identifier<'StreamId'>(v);
export const chainInstanceId = (v: string): ChainInstanceId => identifier<'ChainInstanceId'>(v);
export const installationId = (v: string): InstallationId => identifier<'InstallationId'>(v);
