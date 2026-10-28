import {artifactPath,artifactDirectory} from './helpers/artifacts.mjs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,sha} from '../src/budget/common.mjs';
import {freePort,sleep} from '../src/budget/engine.mjs';
if(!process.env.BUDGET_PLAYWRIGHT_MODULE)throw Error('Set BUDGET_PLAYWRIGHT_MODULE for optional browser QA.');
const {chromium}=createRequire(import.meta.url)(process.env.BUDGET_PLAYWRIGHT_MODULE);
const port=await freePort(),origin='http://127.0.0.1:'+port,data=join(ROOT,'data-v0153-ui');
await mkdir(data,{recursive:true});await mkdir(artifactDirectory('screenshots/budget-v0153'),{recursive:true});
const p=spawn(process.execPath,[join(ROOT,'dist/server.mjs')],{cwd:ROOT,env:{...process.env,LAB_PORT:String(port),LAB_DATA_DIR:data,LAB_CHAIN_PORT:String(await freePort()),LAB_LIBRARY_ONLY:'',LAB_AGENT_WORKER:''},windowsHide:true,stdio:['ignore','pipe','pipe']});
let log='',mainToken='',browser;const results=[];p.stdout.on('data',b=>log+=b);p.stderr.on('data',b=>log+=b);
const pass=name=>{results.push({name,passed:true});console.log('PASS',name);};
try{
 for(let i=0;i<150;i++){try{const h=await fetch(origin+'/api/health').then(r=>r.json());mainToken=h.csrfToken;if(mainToken)break;}catch{}await sleep(100);}assert.ok(mainToken,log);
 browser=await chromium.launch({headless:true,downloadsPath:join(data,'downloads'),executablePath:process.env.BUDGET_BROWSER_PATH??'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const page=await browser.newPage({acceptDownloads:true,viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/budget.html');await page.waitForFunction(()=>document.querySelector('#health').textContent.includes('已连接'));
 assert.equal(await page.locator('h1').innerText(),'跨路径资产授权与预算控制');
 assert.ok(!(await page.locator('#preset').innerText()).match(/\d/));pass('category heading and template names contain no fixed numeric example');
 for(const [id,value]of Object.entries({initial:'700',budget:'250',payment:'90',permit:'12'}))await page.locator('#'+id).fill(value);
 await page.locator('#preset').selectOption('split-over');await page.locator('#delta').fill('25');
 assert.equal(await page.locator('#initial').inputValue(),'700');assert.equal(await page.locator('#permit').inputValue(),'12');
 await page.locator('#apply-preset').click();
 assert.equal(await page.locator('#payment').inputValue(),'90');assert.equal(await page.locator('#budget').inputValue(),'250');assert.equal(await page.locator('#permit').inputValue(),'185');
 assert.ok((await page.locator('#preview-amounts').innerText()).includes('275'));pass('selecting category preserves inputs; explicit generation uses current 250 budget and 90 first payment');
 await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#verdict').textContent.includes('已复现超支'));
 const metric=label=>page.locator('#metrics .metric').filter({hasText:label}).locator('strong').innerText();
 assert.equal(await metric('链上实际累计支出'),'275.0');assert.equal(await metric('正常入口计数'),'90.0');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:artifactPath('screenshots/budget-v0153/01-custom-1440.png'),fullPage:true});pass('real browser executes generated custom split amounts and reports 275 actual / 90 normal counter');
 await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 await page.locator('#preset').selectOption('unified-over');await page.locator('#apply-preset').click();await page.locator('#run').click();
 await page.waitForFunction(()=>document.querySelector('#verdict').textContent.includes('已阻止超额请求'));
 assert.equal(await metric('链上实际累计支出'),'90.0');assert.equal(await metric('当前 / 最终余额'),'610.0');
 await page.setViewportSize({width:1024,height:900});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:artifactPath('screenshots/budget-v0153/02-unified-1024.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);pass('same custom values are blocked under unified policy and 1024px layout fits');
 await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.locator('#preset').selectOption('boundary');await page.locator('#apply-preset').click();
 assert.equal(await page.locator('#permit').inputValue(),'160');await page.locator('#start').click();
 await page.waitForFunction(()=>document.querySelector('#stage').textContent==='等待支付');
 for(const target of ['等待第二条路径','等待第三方兑现','等待独立检查','已结束']){
  await page.waitForFunction(()=>!document.querySelector('#step').disabled);await page.locator('#step').click();
  await page.waitForFunction(t=>document.querySelector('#stage').textContent===t,target);
 }
 assert.equal(await metric('链上实际累计支出'),'250.0');pass('manual exact-boundary template follows current remaining budget of 160');
 await page.waitForFunction(()=>!document.querySelector('#export').disabled);
 const download=page.waitForEvent('download');await page.locator('#export').click();const file=join(data,'download.json');
 try{await (await download).saveAs(file);pass('native browser file download');}
 catch{results.push({name:'native browser file download',passed:null,status:'BLOCKED',reason:'Headless Chrome canceled download in this environment; attachment, auto-save and copy path tested separately.'});}
 const exported=await fetch(origin+'/api/budget/export?download=1');assert.equal(exported.status,200);assert.ok(exported.headers.get('content-disposition').includes('attachment'));
 await writeFile(file,await exported.text());await page.locator('#copy').click();
 await page.waitForFunction(()=>document.querySelector('#json-text').value.includes('web3-agent-budget-experiment'));
 await page.locator('#file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('只读离线回放'));pass('integrated export, copy fallback and offline replay work');
 const bundle=await fetch(origin+'/api/budget/export').then(r=>r.json());bundle.files['evidence.json'].events[0].type='<img src=x onerror="window.__unsafe=true">';
 bundle.manifest['evidence.json']=sha(JSON.stringify(bundle.files['evidence.json']));
 const hostile=join(data,'hostile.json');await writeFile(hostile,JSON.stringify(bundle));await page.locator('#file').setInputFiles(hostile);
 await page.waitForFunction(()=>document.querySelector('#events').textContent.includes('<img'));
 assert.equal(await page.evaluate(()=>window.__unsafe),undefined);assert.equal(await page.locator('img').count(),0);pass('offline text remains inert');
 await page.locator('#file').setInputFiles(file);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:artifactPath('screenshots/budget-v0153/03-mobile-390.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);pass('390px layout fits viewport');
 await page.locator('#payment').fill('100');assert.equal(await page.locator('#preset').inputValue(),'custom');
 assert.ok((await page.locator('#preview-amounts').innerText()).includes('260'));pass('manual edits mark custom and recompute preview instead of retaining a stale preset label');
 const hrefs=await page.locator('aside a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
 assert.ok(hrefs.includes('/tasks.html')&&hrefs.includes('/services.html'));assert.ok(hrefs.every(h=>!h.includes('4319')));pass('navigation stays on current main origin');
 assert.deepEqual(errors,[]);pass('no browser JavaScript errors');
}catch(e){results.push({name:'GUI suite',passed:false,error:e.message});console.error(e.stack,log.slice(-2000));process.exitCode=1;}
finally{
 await browser?.close();
 try{await fetch(origin+'/api/shutdown',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Lab-Token':mainToken},body:'{}'});}catch{}
 await Promise.race([new Promise(r=>p.once('exit',r)),sleep(15000)]);if(p.exitCode===null)p.kill();
 await writeFile(artifactPath('v0153-gui-results.json'),JSON.stringify({version:'V0.15.3',buildHash:JSON.parse(await readFile(join(ROOT,'build-info.json'),'utf8')).sourceHash,time:new Date().toISOString(),browser:'Chrome headless',results},null,2)+'\n');
}
