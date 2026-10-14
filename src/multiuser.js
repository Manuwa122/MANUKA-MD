import { fork } from 'node:child_process';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const idFor = phone => createHash('sha256').update(phone).digest('hex').slice(0,20);
const valid = phone => /^\d{8,15}$/.test(phone);
const jidPhone = jid => (jid || '').split('@')[0];
export class MultiUserManager {
 constructor({ root=process.env.MULTIUSER_DIR || './data/multiuser', max=1, spawn=fork }={}) {
  this.root=resolve(root); this.max=max; this.spawn=spawn; this.records=new Map(); this.children=new Map();
  this.queue=Promise.resolve();
 }
 async init(){
  await mkdir(this.root,{recursive:true,mode:0o700});
  try {
   const rows=JSON.parse(await readFile(join(this.root,'records.json'),'utf8'));
   for(const r of rows) if(r && valid(r.phone) && r.id===idFor(r.phone) && typeof r.requester==='string' && /@(s\.whatsapp\.net|lid)$/.test(r.requester) && ['pending','approved','stopped'].includes(r.status)) this.records.set(r.id,{...r,status:r.status==='approved'?'stopped':r.status});
  } catch(e){if(e.code!=='ENOENT') throw e;}
 }
 serial(fn){const p=this.queue.then(fn);this.queue=p.catch(()=>{});return p;}
 async save(){const tmp=join(this.root,'records.tmp');await writeFile(tmp,JSON.stringify([...this.records.values()]),{mode:0o600});await rename(tmp,join(this.root,'records.json'));}
 get(phone){return this.records.get(idFor(phone));}
 list(){return [...this.records.values()].map(r=>r.phone.slice(0,-4).replace(/./g,'*')+r.phone.slice(-4)+' — '+r.status).join('\n')||'No bot requests.';}
 async request(jid,phone,notifyOwner){
  return this.serial(async()=>{
   if(!valid(phone)||!/@(s\.whatsapp\.net|lid)$/.test(jid)||(jid.endsWith('@s.whatsapp.net')&&jidPhone(jid)!==phone)) throw Error('Pair request: use your own WhatsApp number with country code (digits only).');
   const id=idFor(phone),old=this.records.get(id);
   if(old && old.requester!==jid) throw Error('Request already exists for this phone.');
   if(old && old.status!=='pending') throw Error('Already approved. Contact owner.');
   this.records.set(id,{id,phone,requester:jid,status:'pending'});await this.save();
   await notifyOwner('🔐 New MANUKA-MD request: '+phone+'\nApprove from OWNER linked account: .approve '+phone+'\nIMPORTANT: for LID chats the requested number cannot be verified automatically. Verify the requester owns that number out-of-band BEFORE approving.');
   return '📨 Owner approval requested. Do not share pairing codes.';
  });
 }
 async launch(r,send){
  if(this.children.has(r.id)) throw Error('Already running.');
  const base=join(this.root,r.id),auth=join(base,'auth');
  await mkdir(auth,{recursive:true,mode:0o700});await mkdir(join(base,'data'),{recursive:true,mode:0o700});
  const c=this.spawn(join(process.cwd(),'src','index.js'),[],{cwd:process.cwd(),env:{...process.env,MULTIUSER_CHILD:'1',PAIRING_PHONE:r.phone,MODE:'self',AUTH_DIR:auth,SETTINGS_FILE:join(base,'data','settings.json'),FEATURES_FILE:join(base,'data','features.json')},stdio:['ignore','pipe','pipe','ipc']});
  this.children.set(r.id,c);
  let buffer='',delivered=false;
  c.stdout?.on('data',part=>{
   buffer+=String(part);
   const lines=buffer.split('\n');buffer=lines.pop();
   for(const line of lines){
    const match=line.match(/PRIVATE WHATSAPP PAIRING CODE:\s*([A-Z0-9-]{6,20})/);
    if(match && !delivered){delivered=true;Promise.resolve(send(r.requester,'🔐 Your private MANUKA-MD pairing code: '+match[1]+'\nWhatsApp → Linked devices → Link with phone number. Do not forward.')).catch(()=>{});}
    else if(line.startsWith('PAIR_DIAG ')) console.log('[Child bot]',line.trim().slice(0,180));
   }
   if(buffer.length>4096)buffer=buffer.slice(-1024);
  });
  c.stderr?.on('data',chunk=>{ const lines=String(chunk).split('\n'); for(const line of lines){ if(line.startsWith('PAIR_DIAG ')) console.error('[Child bot]',line.trim().slice(0,180)); } });
  c.on('exit',()=>this.children.delete(r.id));
 }
 async approve(phone,send){return this.serial(async()=>{
  const r=this.get(phone);if(!r||r.status!=='pending')throw Error('No pending pairing request.');
  if(this.children.size>=this.max)throw Error('Server limit reached. Stop a bot first.');
  r.status='approved';await this.save();await this.launch(r,send);return '✅ Approved and starting bot for '+phone+'.';
 });}
 async stop(phone){return this.serial(async()=>{
  const r=this.get(phone);if(!r)throw Error('Bot not found.');
  this.children.get(r.id)?.kill('SIGTERM');this.children.delete(r.id);r.status='stopped';await this.save();return '⏹ Bot stopped. Session preserved.';
 });}
 async start(phone,send){return this.serial(async()=>{
  const r=this.get(phone);if(!r||r.status!=='stopped')throw Error('No stopped approved bot.');
  if(this.children.size>=this.max)throw Error('Server limit reached.');
  r.status='approved';await this.save();await this.launch(r,send);return '▶️ Bot started.';
 });}
 async remove(phone){return this.serial(async()=>{
  const r=this.get(phone);if(!r)throw Error('Bot not found.');
  this.children.get(r.id)?.kill('SIGTERM');this.children.delete(r.id);
  this.records.delete(r.id);await this.save();await rm(join(this.root,r.id),{recursive:true,force:true});return '🗑️ Bot removed.';
 });}
}
