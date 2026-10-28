import {createServer} from 'node:http';
export async function startModelFixture(){const requests=[];const server=createServer(async(req,res)=>{let body='';for await(const b of req)body+=b;const r=JSON.parse(body),initial=JSON.parse(r.messages.find(m=>m.role==='user').content),actor=initial.agentId,progress=JSON.parse(r.messages.filter(m=>m.role==='user'&&m.content.includes('platform_verified_progress')).at(-1).content),own=requests.filter(x=>x.actor===actor),used=r.messages.filter(m=>m.role==='assistant').flatMap(m=>m.tool_calls??[]).map(c=>c.function.name);requests.push({actor,initial,progress,request:r});let name='wait',args={},content=null;
 if(actor==='maker'){
  if(own.length===0)name='create_order';
  else if(!progress.quote){name='send_message';args={recipient:'taker',kind:'quote',payload:{sellAmount:initial.privateGoal.sellAmount,buyAmount:initial.privateGoal.minBuy}};}
  else if(progress.mutualAcceptance&&!progress.orderId)name=used.includes('approve_sell')?'create_order':'approve_sell';
  else if(progress.orderId&&!r.messages.some(m=>m.role==='assistant'&&m.tool_calls?.some(c=>c.function.name==='send_message'&&c.function.arguments.includes('order_ref')))){name='send_message';args={recipient:'taker',kind:'order_ref',quoteId:progress.quote.quoteId,payload:{orderId:progress.orderId}};}
 }else{
  if(own.length===0){name='send_message';args={recipient:'maker',kind:'inquiry'};}
  else if(progress.quote&&!progress.mutualAcceptance){const accepted=r.messages.filter(m=>m.role==='assistant').flatMap(m=>m.tool_calls??[]).filter(c=>c.function.name==='send_message'&&c.function.arguments.includes('accept')).length;
   if(!own.some(x=>x.textOnly)){requests.at(-1).textOnly=true;content='已接受报价；这只是文字，不应执行。';name=null;}
   else{name='send_message';args={recipient:'maker',kind:'accept',quoteId:accepted?progress.quote.quoteId:'wrong-quote-id'};}
  }else if(progress.orderId){if(!used.includes('inspect_order'))name='inspect_order';else if(!used.includes('approve_buy'))name='approve_buy';else name='fill_order';}
 }
 const id='shared-tool-'+(own.length+1),message={role:'assistant',content:content??'Fixture response',...(name?{tool_calls:[{id,type:'function',function:{name,arguments:JSON.stringify(args)}}]}:{})};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({model:'independent-worker-protocol-fixture',choices:[{message}],usage:{prompt_tokens:10,completion_tokens:10,total_tokens:20}}));});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {url:'http://127.0.0.1:'+server.address().port+'/v1',requests,close:()=>new Promise(r=>server.close(r))};}
