import test from 'node:test';
import assert from 'node:assert/strict';
import { findTenorSticker } from '../src/tenor-stickers.js';
import { handleCommand } from '../src/commands.js';
import sharp from 'sharp';
test('Tenor API search converts a remote sticker to WhatsApp WebP',async()=>{
 const png=await sharp({create:{width:64,height:64,channels:4,background:'#ffc700'}}).png().toBuffer();
 const req=async url=>{
  const u=new URL(url);
  if(u.hostname==='tenor.googleapis.com'){
   assert.equal(u.searchParams.get('searchfilter'),'sticker');
   return {ok:true,json:async()=>({results:[{media_formats:{tinygif:{url:'https://media.tenor.com/demo.gif'}}}]})};
  }
  return {ok:true,headers:{get:()=>null},arrayBuffer:async()=>png};
 };
 const b=await findTenorSticker('meme',req,'test-key');
 assert.equal(b.subarray(8,12).toString(),'WEBP');
});
test('Tenor missing key returns null without requests',async()=>{
 assert.equal(await findTenorSticker('meme',async()=>{throw Error('unwanted')},''),null);
});
test('Sticker command prioritizes online images when configured',async()=>{
 const prev=process.env.TENOR_API_KEY; process.env.TENOR_API_KEY='test-key';
 try{
  const calls=[];const sock={sendMessage:async(...a)=>calls.push(a)};
  const fake=Buffer.from('remote');
  await handleCommand(sock,{key:{remoteJid:'test@s.whatsapp.net',fromMe:true}},{},{command:'sticker',input:'meme'},{
   findTenorSticker:async()=>fake,localMemeSticker:async()=>null
  });
  assert.equal(calls[0][1].sticker,fake);
 }finally{if(prev===undefined)delete process.env.TENOR_API_KEY;else process.env.TENOR_API_KEY=prev;}
});
