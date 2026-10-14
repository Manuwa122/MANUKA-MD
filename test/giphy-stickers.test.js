import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { findGiphySticker } from '../src/giphy-stickers.js';
import { handleCommand } from '../src/commands.js';
test('GIPHY searches sticker endpoint and converts real image to WebP',async()=>{
 const png=await sharp({create:{width:64,height:64,channels:4,background:'#ffa500'}}).png().toBuffer();
 const request=async url=>{
  const u=new URL(url);
  if(u.hostname==='api.giphy.com') {
   assert.equal(u.pathname,'/v1/stickers/search');
   assert.equal(u.searchParams.get('api_key'),'test');
   return {ok:true,json:async()=>({data:[{images:{fixed_width_small_still:{url:'https://media.giphy.com/example.png'}}}]})};
  }
  assert.equal(u.hostname,'media.giphy.com');
  return {ok:true,headers:{get:()=>String(png.length)},arrayBuffer:async()=>png};
 };
 const result=await findGiphySticker('meme',request,'test');
 assert.equal(result.subarray(0,4).toString(),'RIFF');
 assert.equal(result.subarray(8,12).toString(),'WEBP');
});
test('Missing key does not call service',async()=>{
 const result=await findGiphySticker('meme',async()=>assert.fail('should not fetch'),'');
 assert.equal(result,null);
});
test('.sticker meme uses GIPHY image before local pack',async()=>{
 const calls=[];const sock={sendMessage:async(...args)=>calls.push(args)};
 const sample=Buffer.from('giphy-mock-image');
 await handleCommand(sock,{key:{remoteJid:'test@s.whatsapp.net',fromMe:true}},{},{command:'sticker',input:'meme'},{
  findGiphySticker:async()=>sample,
  localMemeSticker:async()=>assert.fail('should not call local pack')
 });
 assert.equal(calls[0][1].sticker,sample);
});
