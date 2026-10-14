import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { moviePoster, commonsPosterUrls, wikipediaPosterUrls } from '../src/movie-poster.js';
import { handleAdvanced } from '../src/advanced.js';

test('never substitutes an invented poster when all sources fail',async()=>{
 const image=await moviePoster('Unknown Film','2026',['https://example.com/blocked'],async()=>{throw Error('blocked')});
 assert.equal(image,null);
});
test('Commons poster search matches film title and rejects unrelated images',async()=>{
 const response={ok:true,json:async()=>({query:{pages:[
  {title:'File:Avatar film poster.jpg',imageinfo:[{mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/poster.jpg'}]},
  {title:'File:Other film poster.jpg',imageinfo:[{mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/other.jpg'}]}
 ]}})};
 const matches=await commonsPosterUrls('Avatar','',async()=>response);
 assert.deepEqual(matches,['https://upload.wikimedia.org/poster.jpg']);
});
test('movie sends descriptive text instead of a fake image when no art is available',async()=>{
 const calls=[],sock={sendMessage:async(...args)=>calls.push(args)};
 await handleAdvanced(sock,{key:{remoteJid:'user@s.whatsapp.net'}},{},{command:'movie',input:'Unknown Film'},{
 movieFetch:async()=>({ok:true,json:async()=>({results:[]})}),
 openMovieFetch:async()=>({ok:true,json:async()=>({response:{docs:[]}})}),
 posterFetch:async()=>{throw Error('offline');}
 },'user');
 assert.equal(calls.length,2);
 assert.equal(calls[0][1].image,undefined);
 assert.match(calls[0][1].text,/Real movie poster unavailable/);
});

test('Wikipedia REST summary poster search returns matching movie artwork',async()=>{
 const urls=await wikipediaPosterUrls('Avatar','2009',async url=>({
  ok:true,json:async()=>({title:'Avatar (2009 film)',originalimage:{source:'https://upload.wikimedia.org/example.jpg'}})
 }));
 assert.deepEqual(urls,['https://upload.wikimedia.org/example.jpg','https://upload.wikimedia.org/example.jpg']);
});
