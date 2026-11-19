import {fork} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {ROOT, PERMIT_TYPES, clone, units} from './common.mjs';

export class WalletRejection extends Error {
  constructor(reason, layer, walletResult = null) {
    super(reason);
    this.layer = layer;
    this.walletResult = walletResult;
  }
}

class SignerProcess {
  async start() {
    this.pending = new Map();
    this.child = fork(join(ROOT, 'src/budget/signer.mjs'), [], {
      cwd:ROOT, windowsHide:true, stdio:['ignore','ignore','ignore','ipc'],
      env:{...process.env, LAB_LIBRARY_ONLY:'1', LAB_AGENT_WORKER:'1'},
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('SIGNER_START_TIMEOUT')), 15000);
      this.child.on('message', message => {
        if (message.ready) {
          clearTimeout(timer);
          this.address = message.address;
          this.pid = message.pid;
          resolve();
          return;
        }
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        clearTimeout(request.timer);
        if (message.error) {
          request.reject(new WalletRejection(message.error, 'wallet_process', {
            operation:request.method, kind:'signer_response', code:message.error,
          }));
        } else {
          request.resolve(message.result);
        }
      });
      this.child.once('error', error => { clearTimeout(timer); reject(error); });
      this.child.once('exit', () => {
        clearTimeout(timer);
        reject(Error('SIGNER_EXIT'));
        for (const request of this.pending.values()) {
          clearTimeout(request.timer);
          request.reject(Error('SIGNER_EXIT'));
        }
        this.pending.clear();
      });
    });
  }

  call(method, body = {}) {
    if (!this.child?.connected) throw Error('SIGNER_EXIT');
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error('SIGNER_TIMEOUT')); }, 30000);
      this.pending.set(id, {resolve, reject, timer, method});
      this.child.send({id, method, body}, error => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  async stop() {
    const child = this.child;
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    if (child.connected) child.disconnect();
    await Promise.race([exited, delay(1500, undefined, {ref:false})]);
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}

class EoaAdapter {
  constructor(options) {
    Object.assign(this, options);
    this.signer = new SignerProcess();
    this.layer = 'wallet_process';
  }

  async prepare() {
    await this.signer.start();
    this.assertActive();
    this.address = this.signer.address;
    this.spender = this.relayer.account.address;
    await this.chain.fund(this.address);
  }

  async open() {
    const requested = this.config.wallet;
    const result = await this.signer.call('bootstrap', {
      rpcUrl:this.chain.url, token:this.token, permit2:this.permit2, initial:this.config.initial,
      spender:this.spender, recipient:this.recipient, routes:requested, policy:this.config.policy,
    });
    await this.record(result.hash, 'setup.approvePermit2');
    const ledger = await this.signer.call('open', this.scope({budget:requested.limit}));
    const policy = await this.signer.call('policy', this.scope());
    if (policy.limit !== String(units(requested.limit)) || policy.limit !== ledger.limit ||
        policy.transfer !== requested.transfer || policy.permit2 !== requested.permit2) {
      throw Error('WALLET_POLICY_MISMATCH');
    }
    this.grant = grantSnapshot(this, policy, {sessionSigner:this.address});
    return ledger;
  }

  pay(amount) { return this.signer.call('pay', this.scope({amount})); }
  authorize(amount) { return this.signer.call('permit', this.scope({amount})); }
  close() { return this.signer.stop(); }

  async submitRedemption({typedData, signature}) {
    const message = typedData.message;
    const amount = BigInt(message.permitted.amount);
    const permit = {permitted:{token:message.permitted.token, amount}, nonce:BigInt(message.nonce), deadline:BigInt(message.deadline)};
    const block = await this.chain.pc.getBlock();
    if (block.timestamp > permit.deadline) throw new WalletRejection('PERMIT_EXPIRED', 'wallet_adapter');
    this.assertActive();
    return this.relayer.writeContract({address:this.permit2, abi:this.permitArtifact.abi, functionName:'permitTransferFrom',
      args:[permit, {to:this.recipient, requestedAmount:amount}, this.address, signature], gas:500000n});
  }

  confirmRedemption(hash, nonce) { return this.signer.call('settle', this.scope({hash, nonce})); }
}

const contractErrors = {
  TaskBudgetExceeded:'TASK_BUDGET_EXCEEDED', TransferDisabled:'TRANSFER_DISABLED', PermitDisabled:'PERMIT_DISABLED',
  SessionExpired:'SESSION_EXPIRED', PermitAlreadyPending:'PERMIT_ALREADY_PENDING', NoPendingPermit:'NO_PENDING_PERMIT',
  InvalidPermitDeadline:'PERMIT_EXPIRED', InvalidPermitSignature:'PERMIT_SIGNATURE_REJECTED',
};

class SmartAccountAdapter {
  constructor(options) {
    Object.assign(this, options);
    this.layer = 'wallet_contract';
  }

  async prepare() {
    this.artifact = JSON.parse(await readFile(join(ROOT, 'contracts/artifacts/BudgetSessionWallet.json'), 'utf8'));
    const account = this.chain.lib.privateKeyToAccount('0x' + randomBytes(32).toString('hex'));
    this.session = this.createClient(account);
    await this.chain.fund(account.address);
    const {limit, transfer, permit2} = this.config.wallet;
    this.address = await this.deploy(this.artifact, [this.token, this.permit2, account.address, this.recipient,
      this.relayer.account.address, units(limit), BigInt(this.config.policy?.enabled?this.config.policy.windowHours*3600:3600), transfer, permit2]);
    this.spender = this.address;
  }

  read(functionName, args = []) {
    return this.chain.pc.readContract({address:this.address, abi:this.artifact.abi, functionName, args});
  }

  async open() {
    const names = ['administrator','sessionSigner','recipient','relayer','token','permit2','limit','expiresAt','transferAllowed','permitAllowed'];
    const values = await Promise.all(names.map(name => this.read(name)));
    const policy = Object.fromEntries(names.map((name, index) => [name, values[index]]));
    const expected = {administrator:this.admin.account.address, sessionSigner:this.session.account.address, recipient:this.recipient,
      relayer:this.relayer.account.address, token:this.token, permit2:this.permit2};
    const requested = this.config.wallet;
    if (Object.keys(expected).some(key => policy[key].toLowerCase() !== expected[key].toLowerCase()) ||
        policy.limit !== units(requested.limit) || policy.transferAllowed !== requested.transfer ||
        policy.permitAllowed !== requested.permit2) throw Error('WALLET_POLICY_MISMATCH');
    this.grant = grantSnapshot(this, {limit:policy.limit, transfer:policy.transferAllowed, permit2:policy.permitAllowed}, {
      administrator:policy.administrator, sessionSigner:policy.sessionSigner, expiresAt:policy.expiresAt,
      accountCodeHash:this.chain.lib.keccak256(await this.chain.pc.getBytecode({address:this.address})),
    });
    return this.ledger();
  }

  async ledger() {
    const [spent, transactionSpent, reserved] = await this.read('budgetState');
    const limit = BigInt(this.grant.limit);
    return clone({spent, transactionSpent, reserved, limit, remaining:limit-spent-reserved});
  }

  async submit(client, functionName, args) {
    const call = {address:this.address, abi:this.artifact.abi, functionName, args, account:client.account};
    try {
      await this.chain.pc.simulateContract(call);
    } catch (error) {
      for (let cause = error; cause; cause = cause.cause) {
        const code = cause.data?.errorName;
        const reason = contractErrors[code];
        if (typeof reason === 'string') {
          throw new WalletRejection(reason, 'wallet_contract', {
            operation:functionName, kind:'contract_simulation', code,
          });
        }
      }
      throw error;
    }
    this.assertActive();
    return client.writeContract({...call, gas:700000n});
  }

  async confirmedLedger(hash) {
    const receipt = await this.chain.pc.waitForTransactionReceipt({hash, timeout:20000, pollingInterval:40});
    if (receipt.status !== 'success') throw Error('CHAIN_REVERT');
    return this.ledger();
  }

  async pay(amount) {
    const hash = await this.submit(this.session, 'pay', [units(amount)]);
    return {hash, ledger:await this.confirmedLedger(hash)};
  }

  async authorize(amount) {
    const block = await this.chain.pc.getBlock();
    const expiry = BigInt(this.grant.expiresAt);
    if (block.timestamp >= expiry) throw new WalletRejection('SESSION_EXPIRED', 'wallet_adapter');
    const deadline = block.timestamp + 600n < expiry ? block.timestamp + 600n : expiry;
    const value = units(amount);
    const hash = await this.submit(this.session, 'reservePermit', [value, deadline]);
    await this.record(hash, 'wallet.permitReservation');
    const [reserved, nonce, confirmedDeadline, digest] = await this.read('pending');
    if (reserved !== value || deadline !== confirmedDeadline) throw Error('WALLET_RESERVATION_MISMATCH');
    const typedData = {domain:{name:'Permit2', chainId:31337, verifyingContract:this.permit2}, types:PERMIT_TYPES,
      primaryType:'PermitTransferFrom', message:{permitted:{token:this.token, amount:value}, spender:this.spender, nonce, deadline}};
    this.assertActive();
    const signature = await this.session.account.signTypedData(typedData);
    if (await this.read('isValidSignature', [digest, signature]) !== '0x1626ba7e') throw Error('WALLET_RESERVATION_SIGNATURE_UNCONFIRMED');
    return clone({typedData, signature, reservationHash:hash, verification:'erc1271', ledger:await this.ledger()});
  }

  submitRedemption({signature}) { return this.submit(this.relayer, 'redeemPermit', [signature]); }
  confirmRedemption() { return this.ledger(); }
  close() { this.session = null; }
}

function grantSnapshot(adapter, policy, identities) {
  return clone({backend:adapter.config.wallet.backend, source:adapter.layer, ...adapter.scope(),
    administrator:null, expiresAt:null, ...identities,
    account:adapter.address, submitter:adapter.relayer.account.address, spender:adapter.spender,
    token:adapter.token, permit2:adapter.permit2, recipient:adapter.recipient, limit:policy.limit,
    capabilities:{transfer:policy.transfer, permit2:policy.permit2},
  });
}

const adapters = new Map([['local-eoa', EoaAdapter], ['smart-account', SmartAccountAdapter]]);
export function createBudgetWallet(options) {
  const Adapter = adapters.get(options.config.wallet.backend);
  if (!Adapter) throw Error('WALLET_CONFIG');
  return new Adapter(options);
}
