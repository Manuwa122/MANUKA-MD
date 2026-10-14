// Unicode-aware Sinhala / English song discovery, no API key required.
// MusicBrainz metadata is used only when Apple Music has no credible match.
export function songSearchLinks(term) {
 const q=String(term||'').trim();
 return {
  youtube:'https://www.youtube.com/results?'+new URLSearchParams({search_query:q+' official song'}).toString(),
  spotify:'https://open.spotify.com/search/'+encodeURIComponent(q),
  apple:'https://music.apple.com/lk/search?'+new URLSearchParams({term:q}).toString()
 };
}
export async function musicBrainzSong(term, fetcher=fetch) {
 const title=String(term||'').trim();
 if(title.length<2||title.length>120)return null;
 try {
  const url=new URL('https://musicbrainz.org/ws/2/recording/');
  url.searchParams.set('query','recording:"'+title.replace(/["\\]/g,' ').slice(0,115)+'"');
  url.searchParams.set('fmt','json');url.searchParams.set('limit','5');
  const res=await fetcher(url,{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'MANUKA-MD/4.2 (song metadata, contact via GitHub)',Accept:'application/json'}});
  if(!res.ok)return null;
  const recordings=(await res.json())?.recordings||[];
  const norm=s=>String(s||'').toLocaleLowerCase().normalize('NFC').replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
  const phrase=norm(title);
  const matched=recordings.find(x=>norm(x.title)===phrase)||recordings.find(x=>phrase.includes(norm(x.title)) && norm(x.title).length>=3);
  if(!matched)return null;
  const artist=(matched['artist-credit']||[]).map(x=>x.artist?.name||x.name||'').filter(Boolean).join(', ');
  const rel=matched.releases?.[0];
  return {
   trackName:matched.title,
   artistName:artist||'Unknown',
   collectionName:rel?.title||'Unknown',
   trackTimeMillis:matched.length||null,
   releaseDate:rel?.date||'',
   primaryGenreName:'Music',
   artworkUrl100:null,
   previewUrl:null,
   trackViewUrl:'https://musicbrainz.org/recording/'+encodeURIComponent(matched.id),
   metadataSource:'MusicBrainz'
  };
 }catch{return null;}
}
