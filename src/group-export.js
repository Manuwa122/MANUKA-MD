import { getAggregateVotesInPollMessage, jidNormalizedUser } from '@whiskeysockets/baileys';
// In-memory group-export opt-ins. Each member must explicitly opt in from
// their own WhatsApp account. Never export unconsenting group phone numbers.
const consent=new Map();
const requests=new Map();
const polls=new Map();
export function getTrackedPollMessage(key){
 const poll=polls.get(key?.remoteJid);
 return poll && poll.id===key?.id ? poll.message : undefined;
}
function members(meta){return Array.isArray(meta?.participants)?meta.participants:[];}
function idOf(p){return typeof p==='string'?p:p?.id;}
function voterId(v){return typeof v==='string'?v:(v?.voter||v?.id||v?.participant||null);}
function validJid(id){return typeof id==='string' && /@(s\.whatsapp\.net|lid)$/.test(id);}
function ownChat(sock){const id=sock.user?.id;if(!id)throw Error('Bot account unavailable for private export.');return jidNormalizedUser(id);}
function safeCell(s){const str=String(s??'').replace(/[\r\n,"]/g,' ').slice(0,100);return /^[=+@\-]/.test(str)?"'"+str:str;}
// A tap on the bot's exact request message records opt-in; never use anonymous poll totals.
export async function handleExportReaction(sock,msg){
 const jid=msg?.key?.remoteJid;
 if(!jid?.endsWith('@g.us')||msg.key.fromMe)return false;
 const event=msg.message?.reactionMessage;
 const request=requests.get(jid);
 if(!request || !event?.key?.id || event.key.id!==request.id)return false;
 const sender=msg.key.participant;
 if(!sender || typeof sender!=='string')return false;
 const meta=await sock.groupMetadata(jid);
 if(!members(meta).some(p=>idOf(p)===sender))return false;
 const group=consent.get(jid)||new Set();
 if(event.text==='✅')group.add(sender);
 else if(event.text==='❌'||event.text==='')group.delete(sender);
 else return false;
 consent.set(jid,group);
 return true;
}
export async function handleExportPollUpdate(sock,updates) {
 let processed=0;
 for(const event of updates||[]){
  const key=event?.key, jid=key?.remoteJid;
  const poll=polls.get(jid);
  if(!poll||key.id!==poll.id||!Array.isArray(event?.update?.pollUpdates))continue;
  // Every voter replaces their earlier vote; do not keep stale Yes after a No.
  for(const update of event.update.pollUpdates){
   const author=update?.pollUpdateMessageKey?.participant || update?.pollUpdateMessageKey?.remoteJid;
   if(!author)continue;
   poll.updates=poll.updates.filter(old=>
    (old?.pollUpdateMessageKey?.participant || old?.pollUpdateMessageKey?.remoteJid)!==author);
   poll.updates.push(update);
  }
  if(poll.updates.length>3000)poll.updates=poll.updates.slice(-3000);
  let aggregates;
  try{aggregates=getAggregateVotesInPollMessage({message:poll.message,pollUpdates:poll.updates});}
  catch{continue;} // Do not assume permission from unverifiable votes.
  const yes=new Set((aggregates.find(x=>x.name==='✅ ඔව්, මම එකඟයි')?.voters||[]).map(voterId).filter(Boolean));
  const no=new Set((aggregates.find(x=>x.name==='❌ නැහැ, මම එකඟ නැහැ')?.voters||[]).map(voterId).filter(Boolean));
  const meta=await sock.groupMetadata(jid);
  const active=new Set(members(meta).flatMap(p=>[idOf(p),p?.phoneNumber,p?.lid].filter(validJid)));
  const canonical=new Map(members(meta).flatMap(p=>[idOf(p),p?.phoneNumber,p?.lid].filter(validJid).map(alias=>[alias,idOf(p)])));
  const group=consent.get(jid)||new Set();
  for(const old of poll.consented)group.delete(old);
  poll.consented=new Set();
  for(const voter of yes){
   if(validJid(voter)&&active.has(voter)&&!no.has(voter)){
    const member=canonical.get(voter);
    if(!member)continue;
    group.add(member);poll.consented.add(member);
   }
  }
  consent.set(jid,group);
  processed++;
 }
 return processed;
}
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
 if(command==='exportrequest'){
  if(!msg.key.fromMe)throw Error('Only the linked owner can send export requests.');
  const sent=await sock.sendMessage(jid,{poll:{
   name:'📋 MANUKA-MD: ඔබේ WhatsApp අංකය Excel ලැයිස්තුවට ඇතුළත් කිරීමට එකඟද? එකඟ අයගේ විස්තර bot හිමිකරුට පමණක් private CSV ලෙස යවනු ලැබේ.',
   values:['✅ ඔව්, මම එකඟයි','❌ නැහැ, මම එකඟ නැහැ'],
   selectableCount:1
  }},{quoted:msg});
  if(!sent?.key?.id||!sent.message)throw Error('Poll tracking unavailable: unable to record consent.');
  polls.set(jid,{id:sent.key.id,message:sent.message,updates:[],consented:new Set()});
  requests.delete(jid);
  return sent;
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
  const recipient=ownChat(sock);
  await sock.sendMessage(recipient,{document:Buffer.from(csv,'utf8'),mimetype:'text/csv',fileName:'MANUKA-MD-consented-group-members.csv',caption:'📋 '+String(meta.subject||'Group').slice(0,60)+' — එකඟ වූ සාමාජිකයන්: '+eligible.length+'. අවසර නොදුන් අය ඇතුළත් නැත.'});
  return reply('✅ එකඟ වූ සාමාජිකයන්ගේ CSV file එක ඔබේ private chat එකට යැව්වා.');
 }
 return false;
}
