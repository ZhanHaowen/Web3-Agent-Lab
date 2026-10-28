import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {AdminAuth} from '../src/control/admin-auth.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const directory=()=>join(root,'data-acceptance-unit-admin-'+randomUUID());
function response(){const headers=new Map();return {headers,setHeader:(key,value)=>headers.set(key.toLowerCase(),value),getHeader:key=>headers.get(key.toLowerCase())};}
function bootstrap(auth){const res=response(),body=auth.bootstrap({method:'POST',headers:{}},{secret:auth.secret},res);const header=res.headers.get('set-cookie');return {body,header,cookie:header.split(';')[0],token:header.slice(header.indexOf('=')+1).split(';')[0]};}

test('admin secret is a persistent independent 32-byte random hex token',async()=>{
 const dir=directory(),redacted=[];const a=new AdminAuth(dir,value=>redacted.push(value));
 assert.match(a.secret,/^[a-f0-9]{64}$/);assert.equal((await readFile(join(dir,'control-admin.token'),'utf8')).trim(),a.secret);assert.deepEqual(redacted,[a.secret]);
 const b=new AdminAuth(dir);assert.equal(b.secret,a.secret);assert.notEqual(new AdminAuth(directory()).secret,a.secret);
});

test('empty malformed and duplicate secret headers fail closed',()=>{
 const a=new AdminAuth(directory());
 for(const req of [{headers:{}},{headers:{'x-control-admin':''}},{headers:{'x-control-admin':'wrong'}},{headers:{'x-control-admin':' '.repeat(64)}},{headers:{'x-control-admin':[a.secret,a.secret]}},{headers:{'X-Control-Admin':a.secret,'x-control-admin':a.secret}}])assert.equal(a.authorize(req),false);
 assert.equal(a.authorize({headers:{'X-Control-Admin':a.secret}}),true);
 assert.equal(a.authorize({headers:{'x-control-admin':a.secret.slice(0,-1)+'g'}}),false);
});

test('Authorization presence always prevents admin access even with a valid secret or cookie',()=>{
 const a=new AdminAuth(directory()),{cookie}=bootstrap(a);
 for(const headers of [{authorization:'Bearer worker','x-control-admin':a.secret},{Authorization:'',Cookie:cookie},{authorization:undefined,'x-control-admin':a.secret},{authorization:['Bearer worker'],cookie}])assert.equal(a.authorize({headers}),false);
 assert.equal(a.authorize({headers:{'x-control-admin':a.secret},rawHeaders:['Authorization','Bearer worker']}),false);
});

test('bootstrap requires POST and exact secret and reveals no cookie value in its body',()=>{
 const a=new AdminAuth(directory());
 assert.throws(()=>a.bootstrap({method:'GET'},{secret:a.secret},response()),e=>e.status===405);
 for(const body of [undefined,null,{}, {secret:''},{secret:'wrong'}, {secret:a.secret+'\r\nInjected: yes'}])assert.throws(()=>a.bootstrap({method:'POST'},body,response()),e=>e.status===403);
 const {body,header,token}=bootstrap(a);assert.deepEqual(body,{authenticated:true});assert.ok(!JSON.stringify(body).includes(token));assert.match(header,/; HttpOnly;/);assert.match(header,/; SameSite=Strict;/);assert.match(header,/; Path=\/api\/v2;/);assert.match(header,/Max-Age=28800$/);
});

test('session storage keeps token hashes with expiry and defaults to eight hours',()=>{
 let now=1000;const a=new AdminAuth(directory(),()=>{},{now:()=>now});const {cookie,token}=bootstrap(a);
 assert.equal(a.authorize({headers:{cookie}}),true);assert.ok(!a.sessions.has(token));const digest=createHash('sha256').update(token).digest('hex');assert.equal(a.sessions.get(digest),1000+8*60*60*1000);
 now+=8*60*60*1000-1;assert.equal(a.authorize({headers:{cookie}}),true);now++;assert.equal(a.authorize({headers:{cookie}}),false);assert.equal(a.sessions.has(digest),false);
});

test('cookies are bound to one live AdminAuth instance and are not reusable after restart',()=>{
 const dir=directory(),a=new AdminAuth(dir),b=new AdminAuth(dir),{cookie}=bootstrap(a);
 assert.equal(a.authorize({headers:{cookie}}),true);assert.equal(b.authorize({headers:{cookie}}),false);assert.equal(b.authorize({headers:{'x-control-admin':a.secret}}),true);
});

test('normal multiple cookies and quoted values work; duplicate session cookies do not',()=>{
 const a=new AdminAuth(directory()),{cookie,token}=bootstrap(a);
 assert.equal(a.authorize({headers:{cookie:'theme=dark; '+cookie+'; other=value'}}),true);
 assert.equal(a.authorize({headers:{Cookie:`other="a; b"; LabControlSession="${token}"; theme=dark`}}),true);
 assert.equal(a.authorize({headers:{cookie:['theme=dark',cookie]}}),true);
 assert.equal(a.authorize({headers:{cookie:cookie+'; '+cookie}}),false);
 assert.equal(a.authorize({headers:{cookie:'LabControlSession=; '+cookie}}),false);
});

test('malformed escaping and encoded or injected cookie values never authenticate or throw',()=>{
 const a=new AdminAuth(directory()),{token}=bootstrap(a);
 const values=[`LabControlSession=${token}%0d%0a`, `LabControlSession="${token}\\"`, `LabControlSession=${token}; LabControlSession=other`, `LabControlSession="${token};x"`, 'LabControlSession=%ZZ', 'LabControlSession=', 'LabControlSession="unterminated'];
 for(const cookie of values){let value;assert.doesNotThrow(()=>{value=a.authorize({headers:{cookie}});});assert.equal(value,false,cookie);}
});

test('bootstrap preserves unrelated response cookies and registers session for redaction',()=>{
 const redacted=[],a=new AdminAuth(directory(),x=>redacted.push(x)),res=response();res.setHeader('Set-Cookie','OtherCookie=one; HttpOnly');
 const body=a.bootstrap({method:'POST'},{secret:a.secret},res);assert.deepEqual(body,{authenticated:true});const headers=res.getHeader('Set-Cookie');assert.ok(Array.isArray(headers));assert.equal(headers[0],'OtherCookie=one; HttpOnly');const token=headers[1].split(';')[0].split('=')[1];assert.deepEqual(redacted,[a.secret,token]);
});

test('invalid existing token files are not silently overwritten',async()=>{
 const dir=directory();await mkdir(dir,{recursive:true});const path=join(dir,'control-admin.token');await writeFile(path,'broken-token');assert.throws(()=>new AdminAuth(dir),/CONTROL_ADMIN_TOKEN_INVALID/);assert.equal(await readFile(path,'utf8'),'broken-token');
});
