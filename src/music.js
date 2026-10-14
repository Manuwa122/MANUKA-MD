import { musicBrainzSong, songSearchLinks } from './sinhala-music.js';
export function formatDuration(ms) {
 if(!Number.isFinite(Number(ms))||Number(ms)<0)return 'Unknown';
 const sec=Math.floor(Number(ms)/1000);
 return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}
export async function findSong(term, fetcher=fetch, secondaryFetch=null) {
 const title=String(term||'').trim();
 if(title.length<2||title.length>120)throw Error('Usage: .song <song name> (2–120 characters)');
 const norm=s=>String(s||'').toLocaleLowerCase().normalize('NFC').replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
 let tracks=[];
 // Sri Lankan storefront first, then global search; don't return a random unrelated song.
 for(const country of ['LK','US']) {
  const url=new URL('https://itunes.apple.com/search');
  url.searchParams.set('term',title);url.searchParams.set('entity','song');
  url.searchParams.set('country',country);url.searchParams.set('limit','25');
  try {
   const res=await fetcher(url,{signal:AbortSignal.timeout(9000)});
   if(!res.ok)continue;
   const data=await res.json();
   tracks=Array.isArray(data.results)?data.results.filter(x=>typeof x?.trackName==='string'):[];
   const exact=tracks.find(x=>norm(x.trackName)===norm(title));
   const partial=tracks.find(x=>norm(title).includes(norm(x.trackName))&&norm(x.trackName).length>=3)
     || tracks.find(x=>norm(x.trackName).includes(norm(title)) && norm(title).length>=4)
     || tracks.find(x=>{ const hay=norm(x.trackName+' '+(x.artistName||''));return norm(title).split(' ').filter(w=>w.length>=3).every(w=>hay.includes(w)); });
   if(exact||partial)return exact||partial;
  }catch { /* continue with alternate source */ }
 }
 if(secondaryFetch) return musicBrainzSong(title,secondaryFetch);
 // Preserve injected mock-fetch tests; use MusicBrainz only in normal runtime.
 if(fetcher===fetch)return musicBrainzSong(title,fetch);
 return null;
}
export function songCaption(song){
 const clean=(s,n=110)=>String(s||'Unknown').replace(/[\r\n\t]+/g,' ').slice(0,n);
 return ['╭━━━〔 🎶 MANUKA-MD MUSIC 〕━━━╮',
  '🎵 Song: '+clean(song.trackName),
  '🎤 Artist: '+clean(song.artistName),
  '💿 Album: '+clean(song.collectionName),
  '⏱ Duration: '+formatDuration(song.trackTimeMillis),
  '🎼 Genre: '+clean(song.primaryGenreName,65),
  '📅 Released: '+clean(song.releaseDate?.slice(0,10)||'Unknown',16),
  '╰━━━━━━━━━━━━━━━━━━━━━━━╯',
  '▶️ Official: '+(/^https:\/\//.test(song.trackViewUrl||'')?song.trackViewUrl:'Not available'),
  song.previewUrl?'🎧 Short official preview below (if available).':'🎧 Preview unavailable for this track.',
  '🔎 YouTube official search: '+songSearchLinks(song.trackName+' '+(song.artistName||'' )).youtube,
  '✦ Full songs require an authorized music service.'].join('\n');
}
