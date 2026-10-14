export const movieRuntime = ms => Number.isFinite(Number(ms)) && Number(ms)>0 ? Math.floor(Number(ms)/3600000)+'h '+Math.floor(Number(ms)%3600000/60000)+'m' : 'Not listed';
export function movieDetails(movie) {
 const field=(v,max=240)=>String(v||'Not listed').replace(/[\r\n]+/g,' ').slice(0,max);
 const title=field(movie.trackName||movie.collectionName,130);
 const year=field(movie.releaseDate?.slice(0,4)||'Unknown',10);
 const desc=field(movie.longDescription||movie.shortDescription||movie.description||'No synopsis available.',450);
 const director=field(movie.artistName||movie.directorName||'Not listed');
 const link=/^https:\/\//.test(movie.trackViewUrl||'')?movie.trackViewUrl:null;
 return {title,year,caption:['╭━━〔 🎬 MANUKA-MD MOVIE HUB 〕━━╮','🎞️ '+title+' ('+year+')','⏱ Duration: '+movieRuntime(movie.trackTimeMillis),'🎭 Genre: '+field(movie.primaryGenreName,60),'🎬 Director / Studio: '+director,'📝 Story: '+desc,'╰━━━━━━━━━━━━━━━━━━━━╯',link?'▶️ Official catalog / watch options: '+link:'▶️ Official catalog link unavailable'].join('\n'),link};
}
export function watchSearch(title) {
 return 'https://www.google.com/search?'+new URLSearchParams({q:String(title).slice(0,100)+' movie where to watch legally rent stream'}).toString();
}
