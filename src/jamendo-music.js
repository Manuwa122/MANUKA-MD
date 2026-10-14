// Jamendo Music API v3.0: free-to-discover indie music with explicit download permission.
// A developer client ID from https://developer.jamendo.com/ is required.
const norm=s=>String(s||'').normalize('NFC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
export async function findJamendoTrack(input, fetcher=fetch, clientId=process.env.JAMENDO_CLIENT_ID) {
 const query=String(input||'').trim();
 if(!clientId || query.length<2 || query.length>120)return null;
 const url=new URL('https://api.jamendo.com/v3.0/tracks/');
 url.searchParams.set('client_id',clientId);
 url.searchParams.set('format','json');
 url.searchParams.set('search',query);
 url.searchParams.set('limit','20');
 url.searchParams.set('type','both');
 url.searchParams.set('imagesize','300');
 url.searchParams.set('audioformat','mp32');
 url.searchParams.set('audiodlformat','mp32');
 try {
  const res=await fetcher(url,{signal:AbortSignal.timeout(9000)});
  if(!res.ok)return null;
  const rows=(await res.json())?.results;
  if(!Array.isArray(rows))return null;
  const q=norm(query);
  const match=rows.find(x=>norm(x.name)===q)
    || rows.find(x=>norm(x.name+' '+(x.artist_name||''))===q)
    || rows.find(x=>norm(x.name).length>3 && q.includes(norm(x.name)))
    || rows.find(x=>q.length>=4 && norm(x.name).includes(q));
  if(!match)return null;
  // Explicit artist opt-in, not merely an audio stream URL.
  const permitted=match.audiodownload_allowed===true
    && typeof match.audiodownload==='string'
    && /^https:\/\//.test(match.audiodownload);
  return {
   trackName:match.name,artistName:match.artist_name||'Unknown',
   collectionName:match.album_name||'Single',
   trackTimeMillis:Math.round(Number(match.duration)||0)*1000,
   primaryGenreName:'Independent Music',
   releaseDate:match.releasedate||'',
   artworkUrl100:match.image||match.album_image||null,
   trackViewUrl:match.shareurl||('https://www.jamendo.com/track/'+encodeURIComponent(String(match.id||''))),
   previewUrl:null,
   fullAudioUrl:permitted?match.audiodownload:null,
   downloadAllowed:permitted,
   metadataSource:'Jamendo'
  };
 } catch {return null;}
}
