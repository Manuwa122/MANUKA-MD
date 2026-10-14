import test from 'node:test';
import assert from 'node:assert/strict';
import { findSong, songCaption, formatDuration } from '../src/music.js';
import { handleAdvanced } from '../src/advanced.js';

const track={trackName:'Sample Track',artistName:'Test Artist',collectionName:'Test Album',trackTimeMillis:185000,primaryGenreName:'Pop',releaseDate:'2024-01-01T00:00:00Z',trackViewUrl:'https://music.apple.com/test',previewUrl:'https://audio-ssl.itunes.apple.com/preview.m4a',artworkUrl100:'https://example.com/100x100bb.jpg'};
test('song metadata, duration and matching',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>({results:[track]})});
 const result=await findSong('Sample Track',fetcher);
 assert.equal(result.trackName,'Sample Track');
 assert.equal(formatDuration(result.trackTimeMillis),'3:05');
 assert.match(songCaption(result),/Test Artist/);
 await assert.rejects(findSong('',fetcher),/Usage/);
});
test('song command sends artwork and authorized short preview',async()=>{
 const calls=[];const sock={sendMessage:async(...args)=>{calls.push(args)}};
 const msg={key:{remoteJid:'test@s.whatsapp.net',fromMe:true}};
 await handleAdvanced(sock,msg,{}, {command:'song',input:'Sample Track'}, {musicFetch:async()=>({ok:true,json:async()=>({results:[track]})})},'self');
 assert.equal(calls.length,2);
 assert.match(calls[0][1].caption,/3:05/);
 assert.equal(calls[1][1].mimetype,'audio/mp4');
});
