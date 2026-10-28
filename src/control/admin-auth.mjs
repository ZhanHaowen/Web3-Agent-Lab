import {mkdirSync,readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';

const DEFAULT_SESSION_TTL_MS=8*60*60*1000;
const SESSION_COOKIE='LabControlSession';
const digest=value=>createHash('sha256').update(value).digest();
const fail=(message,status)=>Object.assign(Error(message),{status});

function headerEntries(req,name){
 const wanted=name.toLowerCase(),headers=req?.headers??{};
 return Object.entries(headers).filter(([key])=>key.toLowerCase()===wanted).map(([,value])=>value);
}
function hasAuthorization(req){
 if(headerEntries(req,'authorization').length)return true;
 const raw=req?.rawHeaders;
 return Array.isArray(raw)&&raw.some((value,index)=>index%2===0&&String(value).toLowerCase()==='authorization');
}
function singleHeader(req,name){
 const entries=headerEntries(req,name);
 if(entries.length!==1||typeof entries[0]!=='string')return null;
 return entries[0];
}

// Parse cookie pairs without URL-decoding their contents. The issued session
// value is opaque hexadecimal; quoted/escaped input cannot inject a delimiter
// into the token or a response header. Duplicate session names are ambiguous.
function sessionCookie(req){
 const entries=headerEntries(req,'cookie');
 if(!entries.length)return null;
 const fragments=[];
 for(const entry of entries){
  if(typeof entry==='string')fragments.push(entry);
  else if(Array.isArray(entry)&&entry.every(value=>typeof value==='string'))fragments.push(...entry);
  else return null;
 }
 const text=fragments.join('; ');
 if(text.length>16384)return null;
 const pairs=[];let start=0,quoted=false,escaped=false;
 for(let i=0;i<=text.length;i++){
  const ch=text[i];
  if(i===text.length||ch===';'&&!quoted){pairs.push(text.slice(start,i));start=i+1;escaped=false;continue;}
  if(escaped){escaped=false;continue;}
  if(ch==='\\'&&quoted){escaped=true;continue;}
  if(ch==='"')quoted=!quoted;
 }
 if(quoted||escaped)return null;
 const found=[];
 for(const pair of pairs){
  const equal=pair.indexOf('=');if(equal<0)continue;
  const name=pair.slice(0,equal).trim();if(name!==SESSION_COOKIE)continue;
  let value=pair.slice(equal+1).trim();
  if(value.startsWith('"')){
   if(value.length<2||!value.endsWith('"'))return null;
   value=value.slice(1,-1).replace(/\\(.)/g,'$1');
  }
  found.push(value);
 }
 if(found.length!==1||!(/^[a-f0-9]{64}$/).test(found[0]))return null;
 return found[0];
}

export class AdminAuth {
 constructor(dataDir,addSecret=()=>{},options={}){
  mkdirSync(dataDir,{recursive:true});
  const path=join(dataDir,'control-admin.token');
  let secret;
  try{
   const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())throw fail('CONTROL_ADMIN_TOKEN_NOT_REGULAR_FILE',500);
   secret=readFileSync(path,'utf8').trim();
  }catch(error){
   if(error.code!=='ENOENT')throw error;
   secret=randomBytes(32).toString('hex');
   try{writeFileSync(path,secret,{encoding:'utf8',mode:0o600,flag:'wx'});}
   catch(writeError){
    if(writeError.code!=='EEXIST')throw writeError;
    const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())throw fail('CONTROL_ADMIN_TOKEN_NOT_REGULAR_FILE',500);
    secret=readFileSync(path,'utf8').trim();
   }
  }
  if(!/^[a-f0-9]{64}$/.test(secret))throw fail('CONTROL_ADMIN_TOKEN_INVALID',500);
  this.secret=secret;
  this.secretDigest=digest(secret);
  this.sessions=new Map();
  this.sessionTtlMs=options.sessionTtlMs??DEFAULT_SESSION_TTL_MS;
  if(!Number.isSafeInteger(this.sessionTtlMs)||this.sessionTtlMs<=0)throw fail('CONTROL_ADMIN_SESSION_TTL_INVALID',500);
  this.now=options.now??Date.now;
  this.addSecret=typeof addSecret==='function'?addSecret:()=>{};
  this.addSecret(secret);
 }
 validSecret(candidate){
  // Hash both inputs to the same length before the constant-time comparison.
  // The size cap only protects local HTTP processing from oversized headers.
  if(typeof candidate!=='string'||candidate.length>4096)return false;
  const equal=timingSafeEqual(this.secretDigest,digest(candidate));
  return candidate.length===64&&/^[a-f0-9]{64}$/.test(candidate)&&equal;
 }
 authorize(req){
  if(hasAuthorization(req))return false;
  const header=singleHeader(req,'x-control-admin');
  if(header!==null&&this.validSecret(header))return true;
  const token=sessionCookie(req);if(!token)return false;
  const key=digest(token).toString('hex'),expiresAt=this.sessions.get(key);
  if(expiresAt===undefined)return false;
  if(this.now()>=expiresAt){this.sessions.delete(key);return false;}
  return true;
 }
 bootstrap(req,body,res){
  if(req?.method!=='POST')throw fail('ADMIN_BOOTSTRAP_POST_REQUIRED',405);
  if(!this.validSecret(body?.secret))throw fail('ADMIN_SECRET_REQUIRED',403);
  const now=this.now();for(const [key,expiry]of this.sessions)if(expiry<=now)this.sessions.delete(key);
  const token=randomBytes(32).toString('hex');
  this.sessions.set(digest(token).toString('hex'),now+this.sessionTtlMs);
  this.addSecret(token);
  const cookie=`${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/v2; Max-Age=${Math.ceil(this.sessionTtlMs/1000)}`;
  const previous=typeof res?.getHeader==='function'?res.getHeader('Set-Cookie'):undefined;
  res.setHeader('Set-Cookie',previous===undefined?cookie:Array.isArray(previous)?[...previous,cookie]:[previous,cookie]);
  return {authenticated:true};
 }
}
