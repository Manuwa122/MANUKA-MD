import test from 'node:test';
import assert from 'node:assert/strict';
import { STICKER_PACK, stickerCategories, resolveStickerCategory, chooseSticker, makeSticker } from '../src/sticker-pack.js';
import { handleCommand } from '../src/commands.js';
test('there are at least 150 original sticker variants and matching categories',()=>{
 assert.ok(stickerCategories().length>=12);
 assert.ok(Object.values(STICKER_PACK).flat().length>=150);
 assert.equal(resolveStickerCategory('meme'),'meme');
 assert.equal(resolveStickerCategory('LOL'),'meme');
 assert.equal(resolveStickerCategory('gm'),'goodmorning');
 assert.equal(resolveStickerCategory('bad'),null);
 assert.equal(chooseSticker('love',()=>0).category,'love');
});
test('generates a usable webp WhatsApp sticker',async()=>{
 const buf=await makeSticker('meme',()=>0);
 assert.equal(buf.subarray(0,4).toString(),'RIFF');
 assert.equal(buf.subarray(8,12).toString(),'WEBP');
 assert.ok(buf.length<512*1024);
});
test('keyword sticker command and pack listing work',async()=>{
 const calls=[],sock={sendMessage:async(...args)=>calls.push(args)};
 const msg={key:{remoteJid:'demo@s.whatsapp.net',fromMe:true}};
 await handleCommand(sock,msg,{}, {command:'sticker',input:'meme'}, {localMemeSticker: async()=>Buffer.from('test-real-meme-sticker')});
 assert.ok(Buffer.isBuffer(calls[0][1].sticker));
 await handleCommand(sock,msg,{}, {command:'stickers',input:''});
 assert.equal(calls.slice(0,10).length,10);
 assert.match(calls[10][1].text,/389 original text stickers/);
});
