import test from 'node:test';
import assert from 'node:assert/strict';
import { wikiMovie } from '../src/wiki-movie.js';
import { handleAdvanced } from '../src/advanced.js';
const fake=async(url)=>{
 const u=String(url);
 const data=u.includes('w/api.php') ? {query:{pages:[{title:'Avatar (2009 film)',extract:'An epic science fiction film.',original:{source:'https://upload.wikimedia.org/poster.jpg'},pageprops:{wikibase_item:'Q1'}}]}} : u.includes('/Q1.json') ? {entities:{Q1:{claims:{P2047:[{mainsnak:{datavalue:{value:{amount:'+162'}}}}],P364:[{mainsnak:{datavalue:{value:{id:'Q2'}}}}]}}}} : {entities:{Q2:{labels:{en:{value:'English'}}}}};
 return {ok:true,json:async()=>data};
};
test('Wikipedia fallback extracts poster language runtime and description',async()=>{
 const m=await wikiMovie('Avatar',fake);
 assert.match(m.artworkUrl100,/wikimedia/);
 assert.equal(m.trackTimeMillis,162*60000);
 assert.equal(m.language,'English');
 assert.match(m.longDescription,/science fiction/);
});
test('movie returns image and metadata when iTunes yields no results',async()=>{
 const calls=[],sock={sendMessage:async(...a)=>calls.push(a)};
 await handleAdvanced(sock,{key:{remoteJid:'test@s.whatsapp.net'}},{},{command:'movie',input:'Avatar'},
 {movieFetch:async()=>({ok:true,json:async()=>({results:[]})}),wikiFetch:fake,posterFetch:async()=>{throw Error('offline')},openMovieFetch:async()=>({ok:true,json:async()=>({response:{docs:[]}})})},'test');
 assert.equal(calls.length,1);
 assert.match(calls[0][1].text,/Language: English/);
 assert.match(calls[0][1].text,/2h 42m/);
});
