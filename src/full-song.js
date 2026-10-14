import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchFile, safeFilename } from './downloads.js';

// Owner-managed authorized full-song library. JSON array:
// [{"title":"...","artist":"...","url":"https://.../song.mp3"}]
// Never guess download URLs from commercial music catalog previews.
const norm=s=>String(s||'').normalize('NFC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
export async function findOwnedSong(query, file=process.env.SONG_LIBRARY_FILE) {
 if(!file)return null;
 try {
  const tracks=JSON.parse(await readFile(file,'utf8'));
  if(!Array.isArray(tracks))return null;
  const q=norm(query);
  if(q.length<2)return null;
  return tracks.find(t=>t && norm(t.title)===q)
   || tracks.find(t=>t && norm(t.title+' '+(t.artist||''))===q)
   || tracks.find(t=>t && norm(t.title).length>=4 && q.includes(norm(t.title)))
   || null;
 } catch{return null;}
}
export async function sendOwnedSong(sock,jid,msg,track,download=fetchFile) {
 const url=String(track?.url||'');
 if(!/^https:\/\//.test(url))throw Error('Full song requires a public authorized HTTPS audio link');
 const dir=await mkdtemp(join(tmpdir(),'manuka-fullsong-'));
 try {
  const filename=join(dir,'track');
  const mb=Number(process.env.MAX_SONG_MB||75);
  const max=Math.max(1,Math.min(100,Number.isFinite(mb)?mb:75))*1024*1024;
  const info=await download(url,filename,max);
  const requested=safeFilename(track.filename || info.filename || 'song.mp3');
  const match=/\.(mp3|m4a|ogg|opus|wav|aac|flac)$/i.test(requested);
  if(!match || /text\/html/.test(info.mime||''))throw Error('Full song source did not return a valid audio file');
  const mime={mp3:'audio/mpeg',m4a:'audio/mp4',ogg:'audio/ogg',opus:'audio/ogg',wav:'audio/wav',aac:'audio/aac',flac:'audio/flac'}[requested.split('.').pop().toLowerCase()];
  await sock.sendMessage(jid,{audio:{url:filename},mimetype:mime,ptt:false},{quoted:msg});
  return true;
 } finally {await rm(dir,{force:true,recursive:true});}
}
