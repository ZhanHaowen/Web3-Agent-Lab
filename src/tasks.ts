export type TaskId = 'balance' | 'transfer' | 'approve' | 'swap' | 'swap_deposit';
export interface TaskDefinition { id: TaskId; title: string; input: string; allowedTools: string[]; completion: string; }
export const TASKS: TaskDefinition[] = [
  {id:'balance',title:'查询余额',input:'使用get_balance查询实验账户agent的TokenA余额，不要提交交易。最终回答只能是JSON对象：{"token":"A","address":"查询返回的agent完整地址","balanceBaseUnits":"查询返回的balance整数最小单位字符串","blockHash":"查询返回的区块哈希"}。',allowedTools:['get_balance'],completion:'真实余额查询和最终JSON中token、账户地址、最小单位余额、区块哈希均与独立链状态相符，且未产生交易。'},
  {id:'transfer',title:'转账',input:'从 agent 向 recipient 转账10 TokenA，确认链上执行结果。调用transfer_token时amount填人类可读代币数量字符串"10"，不要乘代币精度；钱包适配器负责转换一次。',allowedTools:['get_balance','get_state','transfer_token'],completion:'相对本次初态，agent TokenA减少10，recipient增加10，转账收款地址正确且无额外副作用。'},
  {id:'approve',title:'代币授权',input:'将agent的TokenA对实验amm的allowance设置为恰好20 TokenA。正确调用参数为{"token":"A","spender":"amm","amount":"20"}，不要乘代币精度。approve是覆盖设置而非增加；已有授权恰好20时可不提交交易。查看状态时优先读取formatted.allowances.ammA中的代币数量。',allowedTools:['get_balance','get_state','approve_token'],completion:'最终allowance=20，代币余额和其他授权相对本次初态不变，授权对象正确。'},
  {id:'swap',title:'兑换',input:'使用实验amm将10 TokenA兑换为TokenB，最少接受9 TokenB，收款人为agent。调用swap传{"amountIn":"10","minAmountOut":"9"}，不要乘代币精度。先检查formatted.allowances.ammA中的代币数量；若授权至少10则直接兑换，否则调用approve_token传{"token":"A","spender":"amm","amount":"10"}。不要将原始整数allowance或balance直接填入工具amount。',allowedTools:['get_balance','get_state','approve_token','swap'],completion:'相对本次初态消耗10 TokenA，获得按当前池储备与0.30%费用计算且不少于9的TokenB；无多余转账或授权。'},
  {id:'swap_deposit',title:'兑换后存入',input:'使用实验amm将10 TokenA兑换为TokenB（至少9 TokenB），随后只将本次兑换新增的TokenB全部存入实验vault，份额归agent；保留运行前已有的TokenB和份额。用兑换后的B余额减去本次initialState中的B余额确定新增数量，或核对成功兑换的amountOut。先按需授权：已有allowance足够则跳过，否则设置为本次所需数量。工具amount/amountIn/minAmountOut使用十进制代币单位字符串；链状态余额和allowance为精度6的整数最小单位字符串，1 token=1000000最小单位。',allowedTools:['get_balance','get_state','approve_token','swap','deposit'],completion:'本次正确兑换、新增B全部进入vault、agent份额按本次存入增加；原有B余额、份额和其他账户资产保留。'},
];
const string = (description: string) => ({type:'string',description});
const amount = (description: string) => ({type:'string',pattern:'^\\d+(?:\\.\\d{1,6})?$',description:`${description}。人类可读代币数量字符串，例如"20"或"0.5"；不要乘以10^6，不要传原始整数余额/allowance。钱包适配器只转换一次。`});
const token = {type:'string',enum:['A','B'],description:'实验代币'};
const fn = (name: string, description: string, properties: Record<string,unknown>, required: string[]) => ({type:'function' as const,function:{name,description,parameters:{type:'object',properties,required,additionalProperties:false}}});
export const toolDefinitions = [
  fn('get_balance','读取指定账户的链上代币余额。balance为整数最小单位，formatted为6位精度代币单位。',{token,account:string('agent、recipient，或EVM地址；默认为agent')},['token']),
  fn('get_state','读取余额、授权、池储备和vault份额等实验状态。formatted中的值为人类可读代币数量；外层原始字段为最小单位整数，不能直接作为写入工具amount。',{},[]),
  fn('transfer_token','从agent转账代币。转账10 TokenA时amount必须填"10"，钱包适配器自动处理精度。',{token,recipient:string('recipient或EVM地址；默认为recipient'),amount:amount('转账代币数量')},['token','amount']),
  fn('approve_token','覆盖设置agent对spender的授权数量。授权20 TokenA时amount必须填"20"，不得预先换算成最小单位；授权不等于转账。',{token,spender:string('amm、vault，或EVM地址'),amount:amount('设置的完整授权数量，不是增量')},['token','spender','amount']),
  fn('swap','在实验amm用TokenA兑换TokenB给agent；须先授权TokenA。输入10、最少9时传amountIn="10",minAmountOut="9"。',{amountIn:amount('TokenA输入数量'),minAmountOut:amount('TokenB最低输出数量')},['amountIn','minAmountOut']),
  fn('deposit','把agent的TokenB存入实验vault，份额归agent；须先授权TokenB。金额来自兑换输出时优先使用amountOutFormatted。',{amount:amount('TokenB存入数量')},['amount']),
];
