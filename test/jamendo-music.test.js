import test from 'node:test';
import assert from 'node:assert/strict';
import { findJamendoTrack } from '../src/jamendo-music.js';
import { handleAdvanced } from '../src/advanced.js';

const track={id:'12',name:'Free Track',artist_name:'Free Artist',duration:185,
 album_name:'Free Album',image:'https://img.example.com/cover.jpg',
 shareurl:'https://www.jamendo.com/track/12',audiodownload_allowed:true,
 audiodownload:'https://cdn.example.com/stream?file=12'};
const makeFetch=(results)=>async url=>{
 assert.equal(new URL(url).hostname,'api.jamendo.com');
 assert.equal(new URL(url).searchParams.get('client_id'),'test-client');
 return {ok:true,json:async()=>({results})};
};
test('Jamendo finds exact song and validates explicit download permission',async()=>{
 const a=await findJamendoTrack('Free Track',makeFetch([track]),'test-client');
 assert.equal(a.downloadAllowed,true);
 assert.equal(a.trackTimeMillis,185000);
 assert.equal(a.artworkUrl100,track.image);
 const b=await findJamendoTrack('Free Track',makeFetch([{...track,audiodownload_allowed:false}]),'test-client');
 assert.equal(b.downloadAllowed,false);
 assert.equal(b.fullAudioUrl,null);
});
test('Jamendo rejects unrelated songs and works without any client ID',async()=>{
 assert.equal(await findJamendoTrack('My Song',makeFetch([track]),'test-client'),null);
 assert.equal(await findJamendoTrack('Free Track',async()=>{throw Error('must not call')},''),null);
});
test('song command sends full Jamendo audio when authorized and available',async()=>{
 const sent=[], sock={sendMessage:async(...x)=>sent.push(x)};
 await handleAdvanced(sock,{key:{remoteJid:'test@s.whatsapp.net'}},{},{command:'song',input:'Free Track'},{
  findOwnedSong:async()=>null,
  jamendoClientId:'test-client',jamendoFetch:makeFetch([track]),
  sendOwnedSong:async(_,__,___,selected)=>{assert.equal(selected.filename,'jamendo-track.mp3');sent.push(['audio sent']);}
 },'user');
 assert.equal(sent.length,2);
 assert.match(sent[0][1].text,/download permitted/);
});
