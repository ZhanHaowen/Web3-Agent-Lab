import test from 'node:test';
import assert from 'node:assert/strict';
import {createBudgetDecision} from '../src/budget/agent.mjs';

class ActionProviderFixture {
  constructor([definition], execute) {
    this.definition = definition;
    this.execute = execute;
  }

  getActions() {
    return [{invoke:async args => JSON.stringify(await this.execute(this.definition.function.name, args))}];
  }
}

const toolCall = {id:'finish-1', type:'function', function:{name:'finish_task', arguments:'{}'}};
const reply = (...calls) => Response.json({choices:[{message:{role:'assistant', tool_calls:calls}}]});
const decideWith = (baseUrl, model = 'deepseek-flash') => createBudgetDecision({
  model:{provider:'api', baseUrl, model}, ActionProvider:ActionProviderFixture,
});
const input = {state:{step:1}, messages:[], record:() => {}};

test('official DeepSeek tool calls explicitly disable thinking and keep mandatory single-action execution', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const payload = JSON.parse(options.body);
    requests.push(payload);
    assert.equal(url.toString(), 'https://api.deepseek.com/chat/completions');
    if (payload.tool_choice === 'required' && payload.thinking?.type !== 'disabled') {
      return Response.json({error:{message:'Thinking mode does not support this tool_choice'}}, {status:400});
    }
    return requests.length === 1 ? reply(toolCall) : reply(toolCall, {...toolCall, id:'extra-tool'});
  });
  const events = [];
  const decide = decideWith('https://api.deepseek.com');
  const first = await decide({...input, record:(kind, payload) => events.push({kind, payload})});
  assert.equal(first.name, 'finish_task');
  assert.equal(requests[0].tool_choice, 'required');
  assert.equal(requests[0].parallel_tool_calls, false);
  assert.deepEqual(events.find(event => event.kind === 'request').payload.request.thinking, {type:'disabled'});
  await assert.rejects(decide({...input, state:{step:2}, messages:[first.assistant,
    {role:'tool', tool_call_id:toolCall.id, content:'{}'}]}), /MODEL_TOOL_CALL_REQUIRED/);
  assert.deepEqual(requests[1].thinking, {type:'disabled'});
  assert.equal(requests[1].messages.at(-1).tool_call_id, toolCall.id);
});

test('a compatible gateway gets the ordinary tool request even when it advertises the same model name', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(payload.tool_choice, 'required');
    assert.equal(Object.hasOwn(payload, 'thinking'), false);
    return reply(toolCall);
  });
  assert.equal((await decideWith('https://gateway.example/v1')(input)).name, 'finish_task');
});
