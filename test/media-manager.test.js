import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { handleAdvanced } from '../src/advanced.js';
import { menuText } from '../src/menu.js';
const msg={key:{remoteJid:'user@s.whatsapp.net',fromMe:true,id:'x'}};
const run=async(cmd,name)=>{
 const calls=[];
 const sock={sendMessage:async(...a)=>calls.push(a)};
 await handleAdvanced(sock,msg,{}, {command:cmd,input:'https://example.com/public-media'}, {
   fetchFile: async(url,path)=>{
     await writeFile(path,Buffer.from('test data'));
     return {filename:name,mime:cmd==='moviefile'?'video/mp4':'audio/mpeg',size:9};
   }
 },'owner');
 return calls;
};
test('musicfile accepts an authorized direct audio file and sends document',async()=>{
 const c=await run('musicfile','sample.mp3');
 assert.equal(c.length,2);
 assert.equal(c[1][1].fileName,'sample.mp3');
});
test('moviefile accepts an authorized direct video file',async()=>{
 const c=await run('moviefile','sample.mp4');
 assert.equal(c[1][1].fileName,'sample.mp4');
 assert.equal(typeof c[1][1].document.url,'string'); // disk-backed file: never buffer a 2GB movie
});
test('cross-type or unknown files are rejected',async()=>{
 await assert.rejects(run('musicfile','sample.mp4'),/audio file/);
 await assert.rejects(run('moviefile','sample.mp3'),/video file/);
});
test('menu advertises movie and song downloads without promising full catalog downloads',()=>{
 const menu=menuText();
 assert.match(menu,/\.moviefile/);
 assert.match(menu,/\.musicfile/);
});
