// In-memory group-export opt-ins. Each member must explicitly opt in from
// their own WhatsApp account. Never export unconsenting group phone numbers.
const consent=new Map();
function members(meta){return Array.isArray(meta?.participants)?meta.participants:[];}
function idOf(p){return typeof p==='string'?p:p?.id;}
function safeCell(s){const str=String(s??'').replace(/[\r\n,"]/g,' ').slice(0,100);return /^[=+@\-]/.test(str)?"'"+str:str;}
export async function handleGroupExport(sock,msg,command,input=''){
 const jid=msg.key.remoteJid;
 if(!jid?.endsWith('@g.us'))throw Error('This command works inside a WhatsApp group.');
 const reply=text=>sock.sendMessage(jid,{text},{quoted:msg});
 const meta=await sock.groupMetadata(jid);
 const people=members(meta),sender=msg.key.participant||msg.key.remoteJid;
 const group=consent.get(jid)||new Set();
 if(command==='exportconsent'){
  const action=String(input).trim().toLowerCase();
  if(!['on','off'].includes(action))return reply('Use .exportconsent on or .exportconsent off');
  // Group-message sender is authoritative: consent is never granted by an admin on behalf of others.
  if(!msg.key.participant||msg.key.fromMe)throw Error('Send consent from your own group membership account.');
  if(!people.some(p=>idOf(p)===sender))throw Error('Not a current group member.');
  if(action==='on')group.add(sender);else group.delete(sender);
  consent.set(jid,group);
  return reply(action==='on'?'✅ Your number is included in future consent-based group exports until the bot restarts.':'✅ Your number will not be exported.');
 }
 if(command==='groupcount')return reply('👥 Members: '+people.length);
 const admins=people.filter(p=>p?.admin);
 if(command==='groupadmins')return reply('👑 Group admins: '+admins.length);
 if(command==='groupstats')return reply('📊 Group: '+String(meta.subject||'Group').slice(0,100)+'\n👥 Members: '+people.length+'\n👑 Admins: '+admins.length+'\n✅ Export opt-ins: '+people.filter(p=>group.has(idOf(p))).length);
 if(command==='groupexport'){
  if(!msg.key.fromMe)throw Error('Group export is owner-only. Send command from the linked bot account.');
  const eligible=people.map(idOf).filter(id=>id&&group.has(id));
  const records=eligible.map((id,i)=>[i+1,safeCell(id.split('@')[0])].join(','));
  const csv='Index,Consented WhatsApp identifier\r\n'+records.join('\r\n')+'\r\n';
  return sock.sendMessage(jid,{document:Buffer.from(csv,'utf8'),mimetype:'text/csv',fileName:'MANUKA-MD-consented-group-members.csv',caption:'📋 Consented members: '+eligible.length+'. Members not opted in are excluded.'},{quoted:msg});
 }
 return false;
}
