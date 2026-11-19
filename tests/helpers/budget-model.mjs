import { createServer } from 'node:http';

export const transfer = amount => ({ name: 'transfer_tokens', args: { amount } });
export const authorize = amount => ({ name: 'authorize_permit2', args: { amount } });
export const redeem = { name: 'redeem_permit2', args: {} };
export const finish = { name: 'finish_task', args: {} };

export function makeDecisionFixture(actions) {
  const queue = [...actions];
  return async () => {
    const decision = queue.shift();
    if (!decision) throw Error('FIXTURE_EXHAUSTED');
    return {
      ...decision,
      invoke: execute => execute(decision.name, decision.args),
    };
  };
}

export async function startBudgetModelFixture() {
  let actions = [];
  const requests = [];
  const server = createServer(async (request, response) => {
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const index = requests.length + 1;
      requests.push({ path: request.url, authorization: request.headers.authorization, body });
      const decision = actions.shift();
      if (request.method !== 'POST' || request.url !== '/v1/chat/completions' || !decision) {
        response.writeHead(400).end('unexpected fixture request');
        return;
      }
      const message = decision.message ?? {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: 'budget-fixture-call-' + index,
          type: 'function',
          function: { name: decision.name, arguments: JSON.stringify(decision.args) },
        }],
      };
      if (decision.delay) await new Promise(resolve => setTimeout(resolve, decision.delay));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        model: 'budget-protocol-fixture',
        choices: [{ finish_reason: 'tool_calls', message }],
        usage: { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 },
      }));
    } catch {
      response.writeHead(400).end('invalid fixture request');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = 'http://127.0.0.1:' + server.address().port + '/v1';
  return {
    baseUrl,
    requests,
    plan(next) { actions = [...next]; },
    config(overrides = {}) {
      return {
        initial: '200',
        budget: '100',
        task: 'Verify direct and Permit2 payments with a single task budget.',
        maxSteps: 8,
        model: { backend: 'api', baseUrl, model: 'budget-protocol-fixture' },
        ...overrides,
      };
    },
    close() { return new Promise(resolve => server.close(resolve)); },
  };
}

