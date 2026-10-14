import test from 'node:test';
import assert from 'node:assert/strict';
import { findSong } from '../src/music.js';
import { musicBrainzSong, songSearchLinks } from '../src/sinhala-music.js';

test('Sinhala Unicode song names match on Sri Lanka storefront',async()=>{
 const title='මැණිකේ මගේ හිතේ';
 const fetcher=async url=>{
  assert.equal(new URL(url).searchParams.get('country'),'LK');
  return {ok:true,json:async()=>({results:[{trackName:title,artistName:'Singer',trackTimeMillis:200000}]})};
 };
 assert.equal((await findSong(title,fetcher)).trackName,title);
});
test('Sinhala song metadata falls back to MusicBrainz',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>({results:[]})});
 const secondary=async()=>({ok:true,json:async()=>({recordings:[{id:'123',title:'මැණිකේ මගේ හිතේ',length:205000,'artist-credit':[{name:'Example Singer'}]}]})});
 const result=await findSong('මැණිකේ මගේ හිතේ',fetcher,secondary);
 assert.equal(result.artistName,'Example Singer');
 assert.equal(result.trackTimeMillis,205000);
});
test('Sinhala and Singlish queries remain encoded in official search URLs',()=>{
 for(const term of ['මැණිකේ මගේ හිතේ','Manike Mage Hithe']){
  const links=songSearchLinks(term);
  assert.equal(new URL(links.youtube).searchParams.get('search_query'),term+' official song');
 }
});
test('MusicBrainz rejects unrelated tracks',async()=>{
 const x=await musicBrainzSong('මැණිකේ මගේ හිතේ',async()=>({ok:true,json:async()=>({recordings:[{title:'Another Track'}]})}));
 assert.equal(x,null);
});

test('partial Sinhala song titles match catalog recordings',async()=>{
 const q='මැණිකේ';
 const result=await findSong(q,async()=>({ok:true,json:async()=>({results:[{trackName:'මැණිකේ මගේ හිතේ',artistName:'Artist Name'}]})}));
 assert.equal(result.trackName,'මැණිකේ මගේ හිතේ');
});
test('YouTube Music fallback preserves Sinhala script',()=>{
 const link=songSearchLinks('මැණිකේ මගේ හිතේ').youtubeMusic;
 assert.equal(new URL(link).searchParams.get('q'),'මැණිකේ මගේ හිතේ');
});
