import { backgroundForVoice, mixVoiceArgs } from './voice-music.js';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run=promisify(execFile);

// Short English synthesized announcement with an original instrumental background.
// No copyrighted soundtrack is bundled or downloaded.
export function announcementText(command, botName='MANUKA-MD') {
 const safe=String(botName).replace(/[^a-zA-Z0-9 -]/g,'').slice(0,35)||'MANUKA MD';
 if(command==='alive'||command==='uptime')return 'Hello! '+safe+' is online and ready to help you. All systems operational.';
 if(command==='ping')return 'Pong! '+safe+' is connected and responding.';
 if(command==='menu')return 'Welcome to '+safe+'. Your smart WhatsApp companion. Explore AI, music, movies, and more.';
 throw Error('Unsupported announcement');
}
export async function sendAnnouncement(sock,jid,command,msg,options={}) {
 const dir=await mkdtemp(join(tmpdir(),'manuka-announce-'));
 try {
  const text=announcementText(command,process.env.BOT_NAME||'MANUKA-MD');
  const voice=join(dir,'voice.mp3'), result=join(dir,'reply.ogg');
  const background=await backgroundForVoice(dir);
  await run(options.python||process.env.PYTHON_PATH||'python3',
   [fileURLToPath(new URL('../scripts/tts.py',import.meta.url)),'en',voice,text],
   {timeout:35000,windowsHide:true,maxBuffer:65536});
  await run(options.ffmpeg||process.env.FFMPEG_PATH||'ffmpeg',
   mixVoiceArgs(voice,background,result),
   {timeout:30000,windowsHide:true,maxBuffer:65536});
  if((await stat(result)).size>2*1024*1024)throw Error('Announcement too large');
  await sock.sendMessage(jid,{audio:await readFile(result),mimetype:'audio/ogg; codecs=opus',ptt:false},{quoted:msg});
  return true;
 } catch {
  return false; // Text response remains the primary response.
 } finally {await rm(dir,{force:true,recursive:true});}
}
