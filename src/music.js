export function formatDuration(ms) {
 if(!Number.isFinite(Number(ms))||Number(ms)<0)return 'Unknown';
 const sec=Math.floor(Number(ms)/1000);
 return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}
export async function findSong(term, fetcher=fetch) {
 const title=String(term||'').trim();
 if(title.length<2||title.length>120)throw Error('Usage: .song <song name> (2–120 characters)');
 const url=new URL('https://itunes.apple.com/search');
 url.searchParams.set('term',title);
 url.searchParams.set('entity','song');
 url.searchParams.set('limit','5');
 const res=await fetcher(url,{signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error('Music catalog unavailable. Please try again.');
 const json=await res.json();
 const tracks=(Array.isArray(json.results)?json.results:[]).filter(x=>x&&typeof x.trackName==='string');
 if(!tracks.length)return null;
 const exact=tracks.find(x=>x.trackName.toLowerCase()===title.toLowerCase());
 return exact||tracks[0];
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
  '✦ Full songs require an authorized music service.'].join('\n');
}
