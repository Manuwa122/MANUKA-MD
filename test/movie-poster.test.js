import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { moviePoster } from '../src/movie-poster.js';
import { handleAdvanced } from '../src/advanced.js';
test('movie poster is valid image even if source website blocks requests',async()=>{
 const image=await moviePoster('Unknown Film','2026',['https://example.com/blocked'],async()=>{throw Error('blocked')});
 const meta=await sharp(image).metadata();
 assert.equal(meta.format,'jpeg');assert.equal(meta.width,720);
});
test('movie sends poster even when both catalogs return zero results',async()=>{
 const calls=[],sock={sendMessage:async(...args)=>calls.push(args)};
 await handleAdvanced(sock,{key:{remoteJid:'user@s.whatsapp.net'}},{},{command:'movie',input:'Unknown Film'},{
 movieFetch:async()=>({ok:true,json:async()=>({results:[]})}),
 openMovieFetch:async()=>({ok:true,json:async()=>({response:{docs:[]}})}),
 posterFetch:async()=>{throw Error('offline');}
 },'user');
 assert.equal(calls.length,1);
 const meta=await sharp(calls[0][1].image).metadata();
 assert.equal(meta.format,'jpeg');
 assert.match(calls[0][1].caption,/No verified free full-film download available/);
});
