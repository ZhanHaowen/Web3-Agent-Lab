import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
export const sha=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
export const encode=x=>JSON.stringify(x,(_k,v)=>typeof v==='bigint'?String(v):v);
export function canonical(x){return x&&typeof x==='object'?Array.isArray(x)?x.map(canonical):Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;}
export class ControlStore {
 constructor(folder){mkdirSync(folder,{recursive:true});this.db=new DatabaseSync(join(folder,'control.sqlite'));this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  for(const t of ['jobs','executions','agents','leases','messages','tx_intents','commands','task_definitions','checkpoints','meta'])this.db.exec(`CREATE TABLE IF NOT EXISTS ${t}(id TEXT PRIMARY KEY,data TEXT NOT NULL)`);
  this.db.exec('CREATE TABLE IF NOT EXISTS wallet_nonces(chain_instance TEXT,address TEXT,nonce INTEGER,intent_id TEXT UNIQUE,PRIMARY KEY(chain_instance,address,nonce));');
  this.db.exec('CREATE TABLE IF NOT EXISTS idempotency (id TEXT PRIMARY KEY, request_hash TEXT NOT NULL, response TEXT NOT NULL); CREATE TABLE IF NOT EXISTS event_outbox (event_id TEXT PRIMARY KEY,execution_id TEXT NOT NULL,stream_id TEXT NOT NULL,seq INTEGER NOT NULL,event TEXT NOT NULL,payload TEXT NOT NULL,archived INTEGER NOT NULL DEFAULT 0, UNIQUE(stream_id,seq));');
 }
 get(t,id){const r=this.db.prepare(`SELECT data FROM ${this.table(t)} WHERE id=?`).get(id);return r?JSON.parse(r.data):null;}
 list(t){return this.db.prepare(`SELECT data FROM ${this.table(t)} ORDER BY rowid`).all().map(r=>JSON.parse(r.data));}
 table(t){if(!['jobs','executions','agents','leases','messages','tx_intents','commands','task_definitions','checkpoints','meta'].includes(t))throw Error('TABLE');return t;}
 put(t,id,x){this.db.prepare(`INSERT INTO ${this.table(t)} VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`).run(id,encode(x));return x;}
 transaction(fn){if(this.depth)return fn();this.db.exec('BEGIN IMMEDIATE');this.depth=1;try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}finally{this.depth=0;}}
 idem(scope,key,body,fn){if(typeof key!=='string'||key.length<4||key.length>180)throw Error('IDEMPOTENCY_KEY_REQUIRED');const id=scope+':'+key,h=sha(canonical(body));return this.transaction(()=>{const old=this.db.prepare('SELECT * FROM idempotency WHERE id=?').get(id);if(old){if(old.request_hash!==h)throw Object.assign(Error('IDEMPOTENCY_CONFLICT'),{status:409});return JSON.parse(old.response);}const value=fn();this.db.prepare('INSERT INTO idempotency VALUES(?,?,?)').run(id,h,encode(value));return value;});}
 event(executionId,type,payload,actor={}){const streamId=actor.streamId??executionId+':control',seq=actor.seq??Number(this.db.prepare('SELECT COALESCE(MAX(seq),0)+1 AS n FROM event_outbox WHERE stream_id=?').get(streamId).n),eventId=actor.eventId??randomUUID();
  const prior=this.db.prepare('SELECT * FROM event_outbox WHERE event_id=? OR (stream_id=? AND seq=?)').get(eventId,streamId,seq);
  const text=encode(payload);if(prior){const old=JSON.parse(prior.event);const same=old.eventId===eventId&&old.executionId===executionId&&old.streamId===streamId&&old.seq===seq&&old.episodeId===(actor.episodeId??executionId)&&old.agentId===(actor.agentId??null)&&old.agentRunId===(actor.agentRunId??null)&&old.roleId===(actor.roleId??null)&&old.leaseEpoch===(actor.leaseEpoch??null);if(!same||prior.payload!==text||old.type!==type)throw Error('EVENT_ID_CONFLICT');return old;}
  const e={schemaVersion:'2.0',scenarioId:executionId,executionId,episodeId:actor.episodeId??executionId,eventId,logicalClock:Number(this.db.prepare('SELECT COUNT(*)+1 AS n FROM event_outbox WHERE execution_id=?').get(executionId).n),streamId,seq,timestamp:new Date().toISOString(),type,agentId:actor.agentId??null,roleId:actor.roleId??null,agentRunId:actor.agentRunId??null,leaseEpoch:actor.leaseEpoch??null,causalEventIds:(actor.causes??[]).filter(Boolean),causedBy:(actor.causes??[]).filter(Boolean),payloadRef:{path:'raw/blobs/'+sha(text)+'.json',sha256:sha(text),bytes:Buffer.byteLength(text)}};
  e.payload_ref=e.payloadRef;this.db.prepare('INSERT INTO event_outbox(event_id,execution_id,stream_id,seq,event,payload) VALUES(?,?,?,?,?,?)').run(eventId,executionId,streamId,seq,encode(e),text);return e;
 }
 events(id){return this.db.prepare('SELECT event,payload,archived FROM event_outbox WHERE execution_id=? ORDER BY rowid').all(id).map(r=>({event:JSON.parse(r.event),text:r.payload,archived:r.archived}));}
 close(){this.db.close();}
}

