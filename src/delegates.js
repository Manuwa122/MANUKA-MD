// Delegated bot operators can run only an explicit safe command allowlist.
// Never grant owner privileges merely because a message claims to be an owner.
export const DELEGATE_COMMANDS=new Set([
 'menu','help','ping','alive','uptime','status','ai','aivoice','voice',
 'sticker','stickers','s','song','movie','movies','film','groupcount','groupadmins','groupstats'
]);
export function normalizeDelegateNumber(input) {
 const digits=String(input||'').replace(/^\+/,'');
 if(!/^[1-9][0-9]{7,14}$/.test(digits))throw Error('Use country-code number, e.g. 947XXXXXXXX (8–15 digits).');
 return digits+'@s.whatsapp.net';
}
export function delegatedPermission(msg,command,settings){
 if(msg?.key?.fromMe)return true;
 if(!DELEGATE_COMMANDS.has(command))return false;
 const id=msg?.key?.participant||msg?.key?.remoteJid;
 // Enforce exact authenticated WhatsApp sender JID match (not caller-supplied text).
 return Boolean(id && Array.isArray(settings?.delegatedOperators) && settings.delegatedOperators.includes(id));
}
export async function delegateCommand(sock,msg,input,settings) {
 if(!msg.key.fromMe)throw Error('Only the original linked bot owner can grant/revoke permissions.');
 if(!settings)throw Error('Settings unavailable.');
 const jid=msg.key.remoteJid;
 const reply=text=>sock.sendMessage(jid,{text},{quoted:msg});
 const [action,number,...extra]=String(input||'').trim().split(/\s+/);
 if(action==='list')return reply('🔐 Delegated operators: '+(settings.data.delegatedOperators||[]).length+'\n'+(settings.data.delegatedOperators||[]).map(x=>x.split('@')[0]).join('\n'));
 if(!['add','remove'].includes(action)||extra.length||!number) return reply('Usage: .delegate add 947XXXXXXXX | .delegate remove 947XXXXXXXX | .delegate list');
 const operator=normalizeDelegateNumber(number);
 await settings.update(data=>{
  const current=Array.isArray(data.delegatedOperators)?data.delegatedOperators:[];
  data.delegatedOperators=action==='add'?[...new Set([...current,operator])]:current.filter(x=>x!==operator);
 });
 return reply('🔐 Operator '+(action==='add'?'approved':'revoked')+': '+operator.split('@')[0]+'\nAllowed: '+[...DELEGATE_COMMANDS].join(', ')+'\nSensitive owner settings and exports remain owner-only.');
}
