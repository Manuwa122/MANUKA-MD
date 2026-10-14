// Optional TMDB enrichment. Configure TMDB_API_KEY or TMDB_READ_TOKEN in .env.
// Do not log tokens; never commit credentials.
export async function tmdbMovie(title, fetcher=fetch, credentials={}) {
 const key=credentials.key ?? process.env.TMDB_API_KEY;
 const token=credentials.token ?? process.env.TMDB_READ_TOKEN;
 if(!key && !token)return null;
 const term=String(title||'').trim();
 if(term.length<2||term.length>100)return null;
 const headers={Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})};
 const api=(route,params={})=>{
  const u=new URL('https://api.themoviedb.org/3/'+route);
  if(!token)u.searchParams.set('api_key',key);
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
  return u;
 };
 try {
  const res=await fetcher(api('search/movie',{query:term,include_adult:'false'}),{headers,signal:AbortSignal.timeout(8500)});
  if(!res.ok)return null;
  const choices=(await res.json())?.results||[];
  const wanted=term.toLowerCase().replace(/\s*\(\d{4}\)$/,'');
  const best=choices.find(x=>String(x.title||'').toLowerCase()===wanted)||choices[0];
  if(!best||!Number.isSafeInteger(best.id)||best.id<1)return null;
  const detail=await fetcher(api('movie/'+best.id),{headers,signal:AbortSignal.timeout(8500)});
  if(!detail.ok)return null;
  const m=await detail.json();
  const poster=m.poster_path&&/^\/[a-zA-Z0-9_\/-]+\.(jpg|png|webp)$/.test(m.poster_path)
   ? 'https://image.tmdb.org/t/p/w780'+m.poster_path : null;
  const lang=m.spoken_languages?.find(x=>x.iso_639_1===m.original_language)?.english_name || m.spoken_languages?.[0]?.english_name || m.original_language || null;
  return {
   trackName:m.title||best.title,
   releaseDate:m.release_date||best.release_date||'',
   trackTimeMillis:m.runtime?Number(m.runtime)*60000:null,
   language:lang,
   primaryGenreName:(m.genres||[]).map(x=>x.name).join(', '),
   longDescription:m.overview||best.overview||'No synopsis available.',
   artworkUrl100:poster,
   trackViewUrl:'https://www.themoviedb.org/movie/'+best.id,
   voteAverage:m.vote_average,
   metadataSource:'TMDB'
  };
 } catch{return null;}
}
