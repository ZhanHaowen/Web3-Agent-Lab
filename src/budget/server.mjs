// Optional development harness. The release UI is hosted by dist/server.mjs.
import {createServer} from 'node:http';
import {join,resolve} from 'node:path';
import {ROOT} from './common.mjs';
import {BudgetService} from './service.mjs';
const port=Number(process.env.BUDGET_PORT??4319),data=resolve(process.env.BUDGET_DATA_DIR??join(ROOT,'data-budget'));
process.env.LAB_DATA_DIR=join(data,'compatibility');
const service=new BudgetService({port,data,standalone:true});await service.init();
let closing=false;
const server=createServer(async(req,res)=>{
 let path=new URL(req.url,'http://127.0.0.1:'+port).pathname;
 if(path==='/'){res.writeHead(302,{Location:'/budget.html'});res.end();return;}
 if(path==='/api/shutdown'&&req.method==='POST'){
  const origin='http://127.0.0.1:'+port;
  if(req.headers.origin!==origin||req.headers['x-budget-token']!==service.token){res.writeHead(403);res.end('{}');return;}
  res.writeHead(200,{'Content-Type':'application/json'});res.end('{"stopping":true}');setTimeout(shutdown,25);return;
 }
 if(path.startsWith('/api/')&&!path.startsWith('/api/budget/'))path='/api/budget'+path.slice('/api'.length);
 if(await service.handle(req,res,path))return;
 res.writeHead(404);res.end('Not found');
});
async function shutdown(){if(closing)return;closing=true;await service.shutdown();server.close(()=>process.exit(0));}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
server.on('error',e=>{console.error(e.code??e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('Budget development harness: http://127.0.0.1:'+port+'/budget.html'));
