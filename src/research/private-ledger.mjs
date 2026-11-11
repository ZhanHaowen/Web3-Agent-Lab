export function baseUnits(value, field = 'amount') {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value) || BigInt(value) >= 2n ** 256n) throw Error('RESEARCH_BASE_UNITS_' + field);
  return BigInt(value);
}
export class PrivateBudgetLedger {
  constructor({budgetBase, initialBalanceBase, tokenDecimals = 6}) {
    this.budgetBase = String(baseUnits(budgetBase, 'budget')); this.initialBalanceBase = String(baseUnits(initialBalanceBase, 'balance')); this.tokenDecimals = tokenDecimals; this.entries = [];
  }
  snapshot() {
    const sum = field => this.entries.reduce((n, e) => n + BigInt(e[field]), 0n);
    const settled = sum('settledBase'), reserved = sum('reservedBase'), refunded = sum('refundedBase'), liability = settled + reserved - refunded;
    return {schema: 'web3-private-budget-ledger-v1', budgetSemantics: 'net-settled-plus-reserved-less-confirmed-refunds', budgetBase: this.budgetBase, initialBalanceBase: this.initialBalanceBase, tokenDecimals: this.tokenDecimals,
      entries: structuredClone(this.entries), totals: {settledBase: String(settled), reservedBase: String(reserved), refundedBase: String(refunded), liabilityBase: String(liability),
        remainingBudgetBase: String(BigInt(this.budgetBase) - liability), estimatedSpendableBudgetFromInitial: String(BigInt(this.initialBalanceBase) - liability)},
      liquidityNote: 'Initial principal minus accounted payment liability; not actual liquid wallet balance. Channel deposits and unused-capital refunds are recorded separately from task spending.',
      invariants: {withinBudget: liability <= BigInt(this.budgetBase), withinInitialBalance: liability <= BigInt(this.initialBalanceBase), nonnegative: this.entries.every(e => BigInt(e.liabilityBase) >= 0n)}};
  }
  reserve({purchaseId, requestId, quotedAmountBase}) {
    if (this.entries.some(e => e.purchaseId === purchaseId || e.requestId === requestId)) throw Error('RESEARCH_DUPLICATE_PURCHASE');
    const amount = baseUnits(quotedAmountBase), snapshot = this.snapshot();
    if (amount <= 0n) throw Error('RESEARCH_ZERO_PURCHASE');
    if (amount > BigInt(snapshot.totals.remainingBudgetBase)) throw Error('RESEARCH_BUDGET_EXCEEDED');
    if (amount > BigInt(snapshot.totals.estimatedSpendableBudgetFromInitial)) throw Error('RESEARCH_BALANCE_EXCEEDED');
    const entry = {purchaseId, requestId, quotedAmountBase, state: 'reserved', settledBase: '0', reservedBase: quotedAmountBase, refundedBase: '0', liabilityBase: quotedAmountBase,
      history: [{event: 'reserved', at: new Date().toISOString(), reservedBase: quotedAmountBase}]}; this.entries.push(entry); return structuredClone(entry);
  }
  apply(purchaseId, result) {
    const entry = this.entries.find(e => e.purchaseId === purchaseId); if (!entry) throw Error('RESEARCH_PURCHASE_UNKNOWN');
    if (!['settled', 'pending', 'failed', 'unknown'].includes(result.status)) throw Error('RESEARCH_PAYMENT_STATUS');
    const charged = baseUnits(result.chargedBase ?? (result.status === 'failed' ? '0' : entry.quotedAmountBase), 'charged');
    const settled = baseUnits(result.settledBase ?? (result.status === 'settled' ? String(charged) : '0'), 'settled');
    const reserved = baseUnits(result.reservedBase ?? (['pending', 'unknown'].includes(result.status) ? String(charged) : '0'), 'reserved');
    const refunded = baseUnits(result.refundedBase ?? '0', 'refunded');
    if (refunded > settled) throw Error('RESEARCH_UNPROVEN_REFUND');
    if (result.status === 'failed' && (charged || settled || reserved || refunded)) throw Error('RESEARCH_FAILED_PAYMENT_WITH_LIABILITY');
    // A late HTTP error cannot replace an already settled payment with zero cost.
    if (settled < BigInt(entry.settledBase)) throw Error('RESEARCH_SETTLEMENT_REGRESSION');
    Object.assign(entry, {state: result.status, settledBase: String(settled), reservedBase: String(reserved), refundedBase: String(refunded), liabilityBase: String(settled + reserved - refunded),
      paymentId: result.paymentId ?? entry.paymentId ?? null, txHash: result.txHash ?? entry.txHash ?? null, publicPaymentRefs: result.publicPaymentRefs ?? entry.publicPaymentRefs ?? []});
    entry.history.push({event: 'payment_result', at: new Date().toISOString(), state: entry.state, settledBase: entry.settledBase, reservedBase: entry.reservedBase, refundedBase: entry.refundedBase});
    // Preserve an adapter-reported overcharge as evidence, then stop procurement;
    // discarding it would incorrectly hide the possible monetary liability.
    if (settled + reserved > BigInt(entry.quotedAmountBase)) throw Error('RESEARCH_PAYMENT_QUOTE_EXCEEDED');
    return structuredClone(entry);
  }
  unknown(purchaseId, error) {
    const entry = this.entries.find(e => e.purchaseId === purchaseId); if (!entry) throw Error('RESEARCH_PURCHASE_UNKNOWN');
    entry.state = 'unknown'; entry.history.push({event: 'payment_unknown', at: new Date().toISOString(), error: String(error)}); return structuredClone(entry);
  }
}
