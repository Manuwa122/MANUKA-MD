import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCommand } from '../src/commands.js';
function mock() {
 const calls = [];
 return { calls, user: { id: '123:1@s.whatsapp.net' },
 sendMessage: async (...args) => calls.push(args),
 groupMetadata: async () => ({ owner: 'owner@s.whatsapp.net', participants: [{id:'123@s.whatsapp.net',admin:'admin'}, {id:'member@s.whatsapp.net',admin:null}] }),
 groupSettingUpdate: async (...args) => calls.push(args),
 groupParticipantsUpdate: async () => [{ status: '403' }] };
}
const msg = {key:{remoteJid:'group@g.us',fromMe:true}};
test('self admin can close group', async () => {
 const sock = mock();
 await handleCommand(sock,msg,{}, {command:'group',input:'close'});
 assert.deepEqual(sock.calls[0], ['group@g.us','announcement']);
});
test('non-admin is denied before mutation', async () => {
 const sock = mock();
 await assert.rejects(handleCommand(sock,{key:{remoteJid:'group@g.us',participant:'member@s.whatsapp.net'}},{},{command:'group',input:'close'}));
 assert.equal(sock.calls.length,0);
});
test('WhatsApp rejection is not reported as success', async () => {
 const sock = mock();
 await assert.rejects(handleCommand(sock,msg,{extendedTextMessage:{contextInfo:{participant:'member@s.whatsapp.net'}}},{command:'kick',input:''}), /rejected/);
 assert.equal(sock.calls.length,0);
});
