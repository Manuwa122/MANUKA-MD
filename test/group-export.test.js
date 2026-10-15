import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGroupExport, handleExportReaction } from '../src/group-export.js';
const group='test-export@g.us';
function mock() {
 const sent=[];
 return {sent,groupMetadata:async()=>({subject:'Testing',participants:[{id:'123@s.whatsapp.net',admin:'admin'},{id:'456@s.whatsapp.net',admin:null},{id:'789@s.whatsapp.net',admin:null}]}),sendMessage:async(...args)=>sent.push(args)};
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
 const csv=s.sent.at(-1)[1].document.toString();
 assert.match(csv,/456/);
 assert.doesNotMatch(csv,/789/);
 assert.doesNotMatch(csv,/123/);
 await handleGroupExport(s,message('456@s.whatsapp.net'),'exportconsent','off');
 await handleGroupExport(s,message(undefined,true),'groupexport');
 assert.doesNotMatch(s.sent.at(-1)[1].document.toString(),/456/);
});

test('owner sends tap-to-consent request; only verified reactions affect export',async()=>{
 const s=mock();
 s.sendMessage=async(...args)=>{s.sent.push(args);return {key:{id:'request-123'}};};
 await handleGroupExport(s,message(undefined,true),'exportrequest');
 assert.match(s.sent.at(-1)[1].text,/React ✅/);
 const valid={key:{remoteJid:group,participant:'456@s.whatsapp.net',fromMe:false},message:{reactionMessage:{key:{id:'request-123'},text:'✅'}}};
 assert.equal(await handleExportReaction(s,valid),true);
 const forged={key:{...valid.key,participant:'789@s.whatsapp.net'},message:{reactionMessage:{key:{id:'wrong-id'},text:'✅'}}};
 assert.equal(await handleExportReaction(s,forged),false);
 await handleGroupExport(s,message(undefined,true),'groupexport');
 const csv=s.sent.at(-1)[1].document.toString();
 assert.match(csv,/456/);assert.doesNotMatch(csv,/789/);
 valid.message.reactionMessage.text='❌';
 assert.equal(await handleExportReaction(s,valid),true);
 await handleGroupExport(s,message(undefined,true),'groupexport');
 assert.doesNotMatch(s.sent.at(-1)[1].document.toString(),/456/);
});
