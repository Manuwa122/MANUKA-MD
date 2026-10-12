import test from 'node:test';
import assert from 'node:assert/strict';
import { isIncomingVoice, transcribeVoice } from '../src/voice-input.js';

test('opt-in only permits incoming private voice notes', () => {
 const msg = { key: { remoteJid: '123@s.whatsapp.net', fromMe: false } };
 assert.equal(isIncomingVoice(msg, {audioMessage:{ptt:true}}, true), true);
 assert.equal(isIncomingVoice(msg, {audioMessage:{ptt:true}}, false), false);
 assert.equal(isIncomingVoice({...msg,key:{...msg.key,fromMe:true}}, {audioMessage:{ptt:true}}, true), false);
 assert.equal(isIncomingVoice({key:{remoteJid:'group@g.us',fromMe:false}}, {audioMessage:{ptt:true}}, true), false);
});
test('transcription returns text from mocked Groq response', async () => {
 const old = process.env.GROQ_API_KEY;
 process.env.GROQ_API_KEY = 'test';
 try {
  const out = await transcribeVoice({seconds:1}, {
   download: async function*(){ yield Buffer.from('test audio'); },
   request: async()=>({ok:true,json:async()=>({text:'hello'})})
  });
  assert.equal(out,'hello');
 } finally {
  if(old===undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = old;
 }
});
