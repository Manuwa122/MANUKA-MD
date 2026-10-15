// Group discovery adapted for Baileys; only linked owner may list group names.
export async function listOwnerGroups(sock,msg) {
 if(!msg?.key?.fromMe)throw Error('Group listing is owner-only.');
 if(typeof sock.groupFetchAllParticipating!=='function')throw Error('Group listing unavailable with current WhatsApp connection.');
 const all=await sock.groupFetchAllParticipating();
 const groups=Object.entries(all||{}).filter(([jid,group])=>jid.endsWith('@g.us')&&group&&typeof group==='object').sort((a,b)=>String(a[1].subject||'').localeCompare(String(b[1].subject||'')));
 const lines=groups.slice(0,100).map(([jid,info],i)=>String(i+1)+'. '+String(info.subject||'Unnamed Group').replace(/[\r\n]/g,' ').slice(0,65)+' — '+(Array.isArray(info.participants)?info.participants.length:'?')+' members');
 const text='👥 MANUKA-MD GROUP DIRECTORY\n\n'+(lines.join('\n')||'No groups found.')+'\n\nTotal groups: '+groups.length+'\nUse .groupstats inside a group to see its statistics.';
 return sock.sendMessage(msg.key.remoteJid,{text},{quoted:msg});
}
