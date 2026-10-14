import test from 'node:test';
import assert from 'node:assert/strict';
import { tmdbMovie } from '../src/tmdb-movie.js';
import { handleAdvanced } from '../src/advanced.js';
const mock=async(url,options)=>{
 const u=String(url);
 assert.equal(new URL(u).hostname,'api.themoviedb.org');
 assert.equal(options.headers.Authorization,'Bearer fake-private-token');
 return {ok:true,json:async()=>u.includes('search/movie')?{results:[{id:123,title:'Sample Film'}]}:{
 id:123,title:'Sample Film',poster_path:'/sample.jpg',runtime:141,release_date:'2025-01-01',
 original_language:'en',spoken_languages:[{iso_639_1:'en',english_name:'English'}],
 genres:[{name:'Adventure'}],overview:'A film about adventure.',vote_average:7.5
 }};
};
test('TMDB provides poster runtime and language with bearer token',async()=>{
 const m=await tmdbMovie('Sample Film',mock,{token:'fake-private-token',key:''});
 assert.equal(m.artworkUrl100,'https://image.tmdb.org/t/p/w780/sample.jpg');
 assert.equal(m.trackTimeMillis,141*60000);
 assert.equal(m.language,'English');
 assert.match(m.longDescription,/adventure/);
});
test('TMDB remains optional without key',async()=>{
 assert.equal(await tmdbMovie('Sample Film',async()=>{throw Error('should not call')},{key:'',token:''}),null);
});
test('movie prioritizes TMDB metadata when configured',async()=>{
 const calls=[],sock={sendMessage:async(...args)=>calls.push(args)};
 await handleAdvanced(sock,{key:{remoteJid:'user@s.whatsapp.net'}},{},{command:'movie',input:'Sample Film'},{
  movieFetch:async()=>({ok:true,json:async()=>({results:[]})}),
  tmdbFetch:mock,tmdbCredentials:{key:'',token:'fake-private-token'},
  openMovieFetch:async()=>({ok:true,json:async()=>({response:{docs:[]}})}),
  posterFetch:async()=>{throw Error('image offline');}
 },'user');
 assert.match(calls.at(-1)[1].text,/Language: English/);
 assert.match(calls.at(-1)[1].text,/2h 21m/);
 assert.match(calls.at(-1)[1].text,/TMDB/);
});
