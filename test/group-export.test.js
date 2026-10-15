import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGroupExport, handleExportReaction, getTrackedPollMessage, handleExportPollUpdate } from '../src/group-export.js';
const group='test-export@g.us';
function mock() {
 const sent=[];
 return {sent,user:{id:'999:1@s.whatsapp.net'},groupMetadata:async()=>({subject:'Testing',participants:[{id:'123@s.whatsapp.net',admin:'admin'},{id:'456@s.whatsapp.net',admin:null},{id:'789@s.whatsapp.net',admin:null}]}),sendMessage:async(...args)=>sent.push(args)};
}
const message=(participant,fromMe=false)=>({key:{remoteJid:group,participant,fromMe}});
test('group statistics return counts without disclosing phone numbers',async()=>{
 const s=mock();await handleGroupExport(s,message('456@s.whatsapp.net'),'groupstats');
 assert.match(s.sent[0][1].text,/Members: 3/);
 assert.match(s.sent[0][1].text,/Admins: 1/);
 assert.doesNotMatch(s.sent[0][1].text,/456/);
});
test('export only includes members who personally opted in',async()=>{
 const s=mock();
 await handleGroupExport(s,message('456@s.whatsapp.net'),'exportconsent','on');
 await assert.rejects(handleGroupExport(s,message('456@s.whatsapp.net'),'groupexport'),/owner-only/);
 await handleGroupExport(s,message(undefined,true),'groupexport');
 const csv=s.sent.at(-2)[1].document.toString();
 assert.equal(s.sent.at(-2)[0],'999@s.whatsapp.net');
 assert.match(csv,/456/);
 assert.doesNotMatch(csv,/789/);
 assert.doesNotMatch(csv,/123/);
 await handleGroupExport(s,message('456@s.whatsapp.net'),'exportconsent','off');
 await handleGroupExport(s,message(undefined,true),'groupexport');
 assert.doesNotMatch(s.sent.at(-2)[1].document.toString(),/456/);
});

test('exportrequest sends Sinhala native poll, not an English reaction message',async()=>{
 const s=mock();
 s.sendMessage=async(...args)=>{s.sent.push(args);return {key:{id:'poll-123'},message:{pollCreationMessage:{name:'test'}}};};
 await handleGroupExport(s,message(undefined,true),'exportrequest');
 const poll=s.sent.at(-1)[1].poll;
 assert.match(poll.name,/ඔබේ WhatsApp අංකය/);
 assert.deepEqual(poll.values,['✅ ඔව්, මම එකඟයි','❌ නැහැ, මම එකඟ නැහැ']);
 assert.equal(poll.selectableCount,1);
 await handleGroupExport(s,message(undefined,true),'groupexport');
 assert.doesNotMatch(s.sent.at(-2)[1].document.toString(),/456/);
});

test('stored poll creation is retrievable for Baileys vote decryption',async()=>{
 const sock=mock();
 sock.sendMessage=async(...args)=>{sock.sent.push(args);return {key:{remoteJid:group,id:'live-poll'},message:{pollCreationMessage:{options:[{optionName:'✅ ඔව්, මම එකඟයි'},{optionName:'❌ නැහැ, මම එකඟ නැහැ'}]}}};};
 await handleGroupExport(sock,message(undefined,true),'exportrequest');
 const original=getTrackedPollMessage({remoteJid:group,id:'live-poll'});
 assert.ok(original?.pollCreationMessage);
 assert.equal(getTrackedPollMessage({remoteJid:group,id:'another'}),undefined);
 assert.equal(await handleExportPollUpdate(sock,[{key:{remoteJid:group,id:'unrelated'},update:{pollUpdates:[]}}]),0);
});
