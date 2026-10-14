import test from 'node:test';
import assert from 'node:assert/strict';
import { movieDetails, watchSearch, movieRuntime } from '../src/movie-details.js';
import { handleAdvanced } from '../src/advanced.js';
const message={key:{remoteJid:'user@s.whatsapp.net',fromMe:true,id:'movie-test'}};
test('movie metadata, synopsis and legal search link are formatted',()=>{
 const info=movieDetails({trackName:'Sample Movie',releaseDate:'2023-02-01',trackTimeMillis:7200000,artistName:'Example Director',longDescription:'A test story.',trackViewUrl:'https://itunes.apple.com/example'});
 assert.match(info.caption,/2h 0m/);
 assert.match(info.caption,/Example Director/);
 assert.match(info.caption,/A test story/);
 assert.match(watchSearch('Sample Movie'),/where%20to%20watch|where\+to\+watch/);
 assert.equal(movieRuntime(0),'Not listed');
});
test('movie request still responds with legal-watch search when catalog errors',async()=>{
 const calls=[];const sock={sendMessage:async(...args)=>calls.push(args)};
 await handleAdvanced(sock,message,{}, {command:'movie',input:'A Movie Name'},{
  movieFetch:async()=>{throw Error('blocked');}
 },'user');
 assert.equal(calls.length,1);
 assert.match(calls[0][1].text,/Primary movie catalog temporarily unavailable/);
 assert.match(calls[0][1].text,/google.com\/search/);
});
