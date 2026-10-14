import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findOwnedSong,sendOwnedSong } from '../src/full-song.js';
import { handleAdvanced } from '../src/advanced.js';
test('Sinhala and English full tracks are matched in authorized catalog',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'songs-test-'));
 try {
  const p=join(dir,'songs.json');
  await writeFile(p,JSON.stringify([{title:'මැණිකේ මගේ හිතේ',url:'https://example.com/song.mp3'},{title:'Example English Track',artist:'Singer',url:'https://example.com/another.mp3'}]));
  assert.equal((await findOwnedSong('මැණිකේ මගේ හිතේ',p)).url,'https://example.com/song.mp3');
  assert.ok(await findOwnedSong('Example English Track',p));
  assert.equal(await findOwnedSong('Missing Song',p),null);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('Authorized full audio is passed as disk-backed media',async()=>{
 const calls=[],sock={sendMessage:async(...a)=>calls.push(a)};
 await sendOwnedSong(sock,'test@s.whatsapp.net',null,{url:'https://example.com/song.mp3'},async(_,path)=>{
  await writeFile(path,'fake test bytes');return {filename:'song.mp3',mime:'audio/mpeg',size:15};
 });
 assert.equal(calls[0][1].mimetype,'audio/mpeg');
 assert.equal(typeof calls[0][1].audio.url,'string');
});
test('song command prioritizes available full authorized audio over preview',async()=>{
 const calls=[],sock={sendMessage:async(...a)=>calls.push(a)};
 await handleAdvanced(sock,{key:{remoteJid:'test@s.whatsapp.net'}},{},{command:'song',input:'මැණිකේ'},{
  findOwnedSong:async()=>({title:'මැණිකේ',url:'https://example.com/song.mp3'}),
  sendOwnedSong:async()=>{calls.push(['audio delivered']);}
 },'test');
 assert.equal(calls.length,2);
 assert.match(calls[0][1].text,/Authorized full audio/);
});
