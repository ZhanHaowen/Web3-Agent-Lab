/** Retry delivery of an already made decision; never repeat inference on an ACK failure. */
export function cachedDecisionFailure(runtime, commandId) {
  const prior = runtime.failures?.[commandId];
  return prior ? Object.assign(new Error(prior.error), { modelCosts: prior.costs }) : null;
}

export async function runRecordedDecision(runtime, commandId, operation, persist, clean = value => value) {
  const oldFailure = cachedDecisionFailure(runtime, commandId);
  if (oldFailure) throw oldFailure;
  if (Object.hasOwn(runtime.decisions, commandId)) return runtime.decisions[commandId];
  let result;
  try { result = await operation(); }
  catch (error) {
    runtime.failures ??= {};
    runtime.failures[commandId] = clean({ error: String(error?.message ?? error), costs: runtime.state?.costs ?? null });
    await persist(runtime);
    throw cachedDecisionFailure(runtime, commandId);
  }
  runtime.decisions[commandId] = result;
  await persist(runtime);
  return result;
}
