import test from 'node:test';
import assert from 'node:assert/strict';
import { findOpenMovie } from '../src/open-movies.js';
test('verified open-license movie returns an actual media link',async()=>{
 const fetcher=async(url)=>{
  const u=String(url);
  return {ok:true,json:async()=>u.includes('advancedsearch')?{response:{docs:[{identifier:'testmovie123'}]}}:{metadata:{title:'Test Movie',licenseurl:'https://creativecommons.org/licenses/by/4.0/'},files:[{name:'Test Movie.mp4',size:'300000000'}]}};
 };
 const x=await findOpenMovie('Test Movie',fetcher);
 assert.match(x.link,/archive.org\/download\/testmovie123\/Test%20Movie.mp4/);
 assert.equal(x.size,300000000);
});
test('unlicensed files never produce full-movie download links',async()=>{
 const fetcher=async(url)=>({ok:true,json:async()=>String(url).includes('advancedsearch')?{response:{docs:[{identifier:'notlicensed'}]}}:{metadata:{title:'Test Movie'},files:[{name:'test.mp4'}]}});
 assert.equal(await findOpenMovie('Test Movie',fetcher),null);
});
