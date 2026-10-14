import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pickBackgroundTrack, backgroundForVoice, mixVoiceArgs, resetMusicRotationForTest } from '../src/voice-music.js';
import { announcementText } from '../src/announcements.js';
test('rotates local licensed tracks without downloading external URLs',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'manuka-music-'));
 try {
  await writeFile(join(dir,'01.mp3'),'test');await writeFile(join(dir,'02.wav'),'test');
  resetMusicRotationForTest();
  assert.equal((await pickBackgroundTrack(dir)).endsWith('01.mp3'),true);
  assert.equal((await pickBackgroundTrack(dir)).endsWith('02.wav'),true);
  assert.equal((await pickBackgroundTrack(dir)).endsWith('01.mp3'),true);
  assert.match(await backgroundForVoice(dir,async()=>null),/original-jingle.wav$/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('voice mixing uses full-voice duration, low-volume music and opus encoding',()=>{
 const args=mixVoiceArgs('voice.mp3','music.mp3','voice.ogg');
 assert.ok(args.includes('-filter_complex'));
 assert.match(args.join(' '),/duration=first/);
 assert.match(args.join(' '),/volume=0.1/);
 assert.ok(args.includes('libopus'));
});
test('menu has a spoken branded greeting',()=>{
 assert.match(announcementText('menu','MANUKA-MD'),/Welcome/);
});
