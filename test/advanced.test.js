import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { handleAdvanced } from '../src/advanced.js';
import { handleCommand } from '../src/commands.js';
import { publicIPv4, fileURL, safeFilename, fetchFile } from '../src/downloads.js';
import { Settings } from '../src/settings.js';
import { FeatureStore } from '../src/features.js';
const msg = { key: { remoteJid:'user@s.whatsapp.net', fromMe:true, id:'command' }, messageTimestamp:123 };
function mock() { const calls = []; return { calls, sendMessage: async (...args) => { calls.push(args); return { key:{...msg.key,id:'ack'}, messageTimestamp:124 }; } }; }
const run = (sock, command, input, runtime = {}, message = msg) => handleAdvanced(sock, message, {}, {command,input}, runtime, 'user');

test('owner guard rejects all account mutation commands before calls', async () => {
 const sock = mock(); sock.chatModify = async () => assert.fail('must not mutate');
 for (const [command,input] of [['chat','pin'],['channel','create New'],['channel','post 123@newsletter hello'],['autovoice','on']]) {
  await assert.rejects(run(sock,command,input,{}, {...msg,key:{...msg.key,fromMe:false}}), /Owner/);
 }
 assert.equal(sock.calls.length,0);
});
test('chat applies mute, archive, unread, pin and read patches to current chat', async () => {
 const sock = mock(); sock.chatModify = async (...args) => sock.calls.push(args);
 for (const action of ['mute 8h','unmute','archive','unarchive','unread','read','pin','unpin']) await run(sock,'chat',action);
 assert.ok(sock.calls[1][0].mute > Date.now());
 assert.deepEqual(sock.calls[3][0],{mute:null});
 assert.equal(sock.calls[5][0].archive,true);
 assert.equal(sock.calls[9][0].markRead,false);
 assert.equal(sock.calls[13][0].pin,true);
 assert.equal(sock.calls[1][1],msg.key.remoteJid);
 await assert.rejects(run(sock,'chat','mute 500h'), /භාවිතය/);
});
test('channel operations pass correct Baileys arguments and reject failure', async () => {
 const sock = mock(); const mutations = [];
 sock.newsletterCreate = async (...a) => { mutations.push(a); return {id:'123@newsletter'}; };
 sock.newsletterMetadata = async (...a) => { mutations.push(a); return {id:'123@newsletter', name:{text:'News'}, description:{text:'Updates'},subscribers:5}; };
 sock.newsletterUpdateName = async (...a) => mutations.push(a);
 await run(sock,'channel','create News | Latest updates');
 await run(sock,'channel','info https://whatsapp.com/channel/ABC123');
 await run(sock,'channel','name 123@newsletter New Name');
 await run(sock,'channel','post 123@newsletter Hello subscribers');
 assert.deepEqual(mutations,[['News','Latest updates'],['invite','ABC123'],['123@newsletter','New Name']]);
 assert.equal(sock.calls.at(-2)[0],'123@newsletter');
 assert.match(sock.calls[1][1].text,/News/);
 sock.newsletterUpdateName = async () => { throw new Error('denied'); };
 await assert.rejects(run(sock,'channel','name 123@newsletter Failed'), /rejected/);
 await assert.rejects(run(sock,'channel','post user@s.whatsapp.net Bad'), /Channel/);
 await assert.rejects(run(sock,'channel','follow 123@newsletter'), /does not support/);
});
test('voice supports explicit language, quoted text and AI text fallback', async () => {
 const sock = mock(); const voices = [];
 const runtime = { sendVoice:async (...args)=>voices.push(args), ai:{answer:async()=> 'ආයුබෝවන්'} };
 await run(sock,'voice','si ආයුබෝවන්',runtime);
 await handleAdvanced(sock,msg,{extendedTextMessage:{contextInfo:{quotedMessage:{conversation:'Hello'}}}}, {command:'voice',input:''},runtime,'user');
 await run(sock,'aivoice','hello',runtime);
 assert.equal(voices[0][2],'ආයුබෝවන්'); assert.equal(voices[0][4],'si');
 assert.equal(voices[1][2],'Hello');
 runtime.sendVoice=async()=>{throw new Error('Voice unavailable');};
 await assert.rejects(run(sock,'aivoice','hello',runtime),/Voice/);
 assert.equal(sock.calls.at(-1)[1].text,'ආයුබෝවන්');
});
test('auto voice persists, old settings migrate, and never changes another chat', async () => {
 const dir=await mkdtemp(join(tmpdir(),'manuka-settings-'));
 try {
  const path=join(dir,'settings.json'); await writeFile(path,JSON.stringify({mode:'self',autoChats:[],welcomeGroups:[]}));
  const settings=await new Settings(path).load(); assert.deepEqual(settings.data.autoVoiceChats,[]);
  await run(mock(),'autovoice','on',{settings});
  assert.deepEqual((await new Settings(path).load()).data.autoVoiceChats,[msg.key.remoteJid]);
  await run(mock(),'autovoice','off',{settings}); assert.deepEqual(settings.data.autoVoiceChats,[]);
 } finally { await rm(dir,{recursive:true,force:true}); }
});
test('bookmarks/snippets persist per user; export excludes another user; clear deletes extras', async () => {
 const dir=await mkdtemp(join(tmpdir(),'manuka-personal-'));
 try {
  const features=await new FeatureStore(join(dir,'data.json')).load(); const sock=mock();
  await run(sock,'bookmark','add site https://example.com',{features});
  await run(sock,'snippet','add thanks Thank you!',{features});
  await features.update('other',u=>{u.snippets=[{name:'secret',value:'private'}];});
  await run(sock,'snippet','get thanks',{features}); assert.equal(sock.calls.at(-1)[1].text,'Thank you!');
  await run(sock,'exportdata','',{features});
  const data=JSON.parse(sock.calls.at(-1)[1].document); assert.equal(data.bookmarks[0].name,'site'); assert.ok(!JSON.stringify(data).includes('private'));
  await handleCommand(sock,msg,{}, {command:'mydata',input:'clear CONFIRM'},{features});
  // handleCommand keys include chat + sender, so clear using the matching store key explicitly below.
  const {handleFeature}=await import('../src/features.js');
  await handleFeature(sock,msg,{}, {command:'mydata',input:'clear CONFIRM'}, {features}, 'user');
  assert.deepEqual(features.data.user.snippets,[]); assert.deepEqual(features.data.user.bookmarks,[]); assert.equal(features.data.other.snippets[0].value,'private');
  await assert.rejects(run(sock,'bookmark','add bad file:///etc/passwd',{features}), /HTTP/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('file command delivers document and removes temporary downloads even after failure', async () => {
 const sock=mock(); let path;
 const runtime={fetchFile:async (_url,p)=>{path=p;await writeFile(p,'file bytes');return {filename:'a.zip',mime:'application/zip',size:10};}};
 await run(sock,'file','https://example.com/a.zip',runtime);
 assert.equal(sock.calls.at(-1)[1].document.toString(),'file bytes');
 assert.equal(sock.calls.at(-1)[1].fileName,'a.zip'); await assert.rejects(access(dirname(path)));
 runtime.fetchFile=async(_url,p)=>{path=p;await writeFile(p,'partial');throw new Error('Download failed');};
 await assert.rejects(run(sock,'file','https://example.com/a.zip',runtime),/Download/); await assert.rejects(access(dirname(path)));
});
test('direct downloader validates public addresses, URLs and filenames', () => {
 for (const ip of ['127.0.0.1','10.0.0.1','172.16.1.2','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','198.18.0.1','224.0.0.1','::1','::ffff:127.0.0.1']) assert.equal(publicIPv4(ip),false,ip);
 assert.equal(publicIPv4('8.8.8.8'),true);
 for (const url of ['file:///etc/passwd','http://example.com','https://user:pass@example.com','https://example.com:8443']) assert.throws(()=>fileURL(url));
 assert.equal(safeFilename('../../bad.zip'),'bad.zip');
});
function responses(items, dns = async()=>[{address:'8.8.8.8',family:4}]) {
 let count=0;
 return {lookup:dns, get:(_u,options,cb)=>{
  const req=new EventEmitter(); const item=items[count++];
  queueMicrotask(()=>{const stream=Readable.from(item.chunks || [Buffer.from('hello')]);stream.statusCode=item.status || 200;stream.headers=item.headers || {'content-type':'application/zip'};cb(stream);});
  assert.ok(options.lookup); return req;
 }, count:()=>count};
}
test('direct downloader streams public file and refuses private redirect before connecting', async () => {
 const dir=await mkdtemp(join(tmpdir(),'manuka-stream-'));
 try {
  const dependencies=responses([{}]); const path=join(dir,'good');
  const result=await fetchFile('https://example.com/test.zip',path,10,dependencies);
  assert.equal(result.size,5);assert.equal((await readFile(path)).toString(),'hello');
  const bad=responses([{status:302,headers:{location:'https://127.0.0.1/secret'}}],async host=>[{address:host === '127.0.0.1' ? host:'8.8.8.8',family:4}]);
  await assert.rejects(fetchFile('https://example.com/start',join(dir,'bad'),10,bad), /private/);
  assert.equal(bad.count(),1);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('direct downloader rejects streamed oversize, HTML and endless redirects', async () => {
 const dir=await mkdtemp(join(tmpdir(),'manuka-stream-'));
 try {
  await assert.rejects(fetchFile('https://example.com/a',join(dir,'size'),2,responses([{}])),/size limit/);
  await assert.rejects(fetchFile('https://example.com/a',join(dir,'html'),10,responses([{headers:{'content-type':'text/html'}}])),/webpage/);
  await assert.rejects(fetchFile('https://example.com/a',join(dir,'redirect'),10,responses(Array.from({length:6},()=>({status:302,headers:{location:'/next'}})))),/redirects/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
