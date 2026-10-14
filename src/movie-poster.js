import sharp from 'sharp';

// Search Wikimedia Commons for an explicitly named poster; never use an unrelated
// image simply to satisfy the image requirement.
export async function commonsPosterUrls(title, year='', fetcher=fetch) {
 const name=String(title||'').trim().slice(0,90);
 if(name.length<2)return [];
 const api=new URL('https://commons.wikimedia.org/w/api.php');
 api.searchParams.set('action','query');api.searchParams.set('generator','search');
 api.searchParams.set('gsrnamespace','6');
 api.searchParams.set('gsrsearch','intitle:"'+name.replace(/["\\]/g,' ')+'" film poster"');
 api.searchParams.set('gsrlimit','10');
 api.searchParams.set('prop','imageinfo');
 api.searchParams.set('iiprop','url|mime');
 api.searchParams.set('iiurlwidth','720');
 api.searchParams.set('format','json');api.searchParams.set('formatversion','2');
 try {
  const response=await fetcher(api,{signal:AbortSignal.timeout(7000),headers:{'User-Agent':'MANUKA-MD/4.2 (film poster lookup)'}});
  if(!response.ok)return [];
  const pages=(await response.json())?.query?.pages||[];
  const terms=name.toLowerCase().split(/\s+/).filter(x=>x.length>2);
  return pages.filter(p=>{
   const label=String(p.title||'').toLowerCase();
   return /poster|film|movie/.test(label) && terms.every(x=>label.includes(x))
      && (!year || !/\b(?:19|20)\d{2}\b/.test(label) || label.includes(String(year)));
  }).flatMap(p=>(p.imageinfo||[]).filter(i=>/^image\/(jpeg|png|webp)$/.test(i.mime||'')).map(i=>i.thumburl||i.url).filter(x=>/^https:\/\//.test(x||''))).slice(0,3);
 } catch {return [];}
}
// Wikipedia REST page summaries provide thumbnail/original artwork independently
// of the often-blocked MediaWiki action search API.
export async function wikipediaPosterUrls(title, year='', fetcher=fetch) {
 const name=String(title||'').trim().slice(0,90);
 if(name.length<2)return [];
 const attempts=[year ? name+' ('+year+' film)' : name+' (film)',name];
 const urls=[];
 for(const page of attempts) {
  const api='https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(page.replace(/ /g,'_'));
  try {
   const res=await fetcher(api,{signal:AbortSignal.timeout(6000),headers:{'User-Agent':'MANUKA-MD/4.2 (movie image lookup)'}});
   if(!res.ok)continue;
   const data=await res.json();
   const label=String(data.title||'').toLowerCase();
   if(!label.includes(name.toLowerCase()))continue;
   const photo=data.originalimage?.source||data.thumbnail?.source;
   if(typeof photo==='string' && /^https:\/\//.test(photo))urls.push(photo);
  } catch { /* next page */ }
 }
 return urls;
}
export async function moviePoster(title, year, urls=[], fetcher=fetch) {
 const candidates=[...urls,...await wikipediaPosterUrls(title,year,fetcher),...await commonsPosterUrls(title,year,fetcher)];
 for(const url of candidates) {
  if(typeof url!=='string'||!/^https:\/\//i.test(url))continue;
  try {
   const response=await fetcher(url,{signal:AbortSignal.timeout(7000),headers:{'User-Agent':'Mozilla/5.0 (compatible; MANUKA-MD/4.2)'}});
   const length=Number(response.headers?.get?.('content-length')||0);
   const type=response.headers?.get?.('content-type')||'';
   if(!response.ok || length>5*1024*1024 || (type && !/^image\//i.test(type)))continue;
   const data=Buffer.from(await response.arrayBuffer());
   if(data.length>5*1024*1024)continue;
   return await sharp(data).rotate().resize({width:720,height:1024,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();
  }catch { /* try another verified matching image */ }
 }
 return null; // Never send a fake poster as if it were movie artwork.
}
