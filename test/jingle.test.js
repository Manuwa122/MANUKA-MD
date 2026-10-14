import test from 'node:test';
import assert from 'node:assert/strict';
import { jingleWav } from '../src/jingle.js';
import { menuText } from '../src/menu.js';
test('original intro WAV is valid, short and reasonably small', () => {
 const audio=jingleWav();
 assert.equal(audio.toString('ascii',0,4),'RIFF');
 assert.equal(audio.toString('ascii',8,12),'WAVE');
 assert.ok(audio.length>20000&&audio.length<160000);
});
test('premium menu documents music and poster commands',()=>{
 const text=menuText('self');
 assert.match(text,/\.jingle/);
 assert.match(text,/\.poster/);
 assert.match(text,/\.alive/);
});
