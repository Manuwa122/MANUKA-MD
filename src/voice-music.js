import { readdir, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { jingleWav } from './jingle.js';
import { writeFile } from 'node:fs/promises';
const extensions=new Set(['.mp3','.wav','.m4a','.ogg','.opus','.flac']);
let cursor=0;
export async function pickBackgroundTrack(dir=process.env.VOICE_MUSIC_DIR) {
 if(!dir)return null;
 try {
  const base=resolve(dir),entries=(await readdir(base,{withFileTypes:true}))
   .filter(e=>e.isFile() && extensions.has(extname(e.name).toLowerCase()))
   .map(e=>e.name).sort();
  if(!entries.length)return null;
  // Deterministic round-robin avoids repeating one track on successive replies.
  const picked=join(base,entries[cursor++ % entries.length]);
  const size=(await stat(picked)).size;
  return size>0 && size<=30*1024*1024 ? picked : null;
 }catch{return null;}
}
export async function backgroundForVoice(dir,picker=pickBackgroundTrack) {
 return (await picker()) || await writeFile(join(dir,'original-jingle.wav'),jingleWav()).then(()=>join(dir,'original-jingle.wav'));
}
export function mixVoiceArgs(voice,music,result,{musicVolume=0.10,voiceGain=1.55}={}) {
 const mv=Math.max(0.02,Math.min(0.20,Number(musicVolume)||0.10));
 const vg=Math.max(0.8,Math.min(2,Number(voiceGain)||1.55));
 const filter='[0:a]volume='+vg+',aecho=0.75:0.8:40:0.1[v];[1:a]volume='+mv+'[m];[v][m]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[out]';
 return ['-y','-i',voice,'-stream_loop','-1','-i',music,'-filter_complex',filter,'-map','[out]','-ac','1','-ar','48000','-c:a','libopus','-b:a','40k',result];
}
export function resetMusicRotationForTest(){cursor=0;}
