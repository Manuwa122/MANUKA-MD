import sharp from 'sharp';

// Never leave the movie reply without an image; use a branded original poster
// when external movie artwork is absent, blocked or unsupported by WhatsApp.
export function posterSvg(title, year='') {
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const name=escape(String(title||'MOVIE').slice(0,70));
 const yr=escape(String(year||'MOVIE INFORMATION').slice(0,20));
 return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1024" viewBox="0 0 720 1024">
 <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#071c19"/><stop offset=".55" stop-color="#0b4335"/><stop offset="1" stop-color="#061215"/></linearGradient></defs>
 <rect width="720" height="1024" fill="url(#bg)"/>
 <circle cx="360" cy="375" r="178" fill="#16a34a" opacity=".12"/>
 <circle cx="360" cy="375" r="136" fill="none" stroke="#4ade80" stroke-width="8" opacity=".65"/>
 <path d="M316 287 L316 463 L460 375 Z" fill="#86efac"/>
 <text x="360" y="110" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="bold" fill="#a7f3d0">MANUKA-MD</text>
 <text x="360" y="640" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#86efac">MOVIE INFORMATION</text>
 <foreignObject x="55" y="680" width="610" height="170"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:sans-serif;text-align:center;font-size:43px;font-weight:700;color:#fff;overflow-wrap:anywhere;">${name}</div></foreignObject>
 <text x="360" y="917" text-anchor="middle" font-family="sans-serif" font-size="27" fill="#bbf7d0">${yr}</text>
 </svg>`);
}
export async function moviePoster(title, year, urls=[], fetcher=fetch) {
 for(const url of urls) {
  if(typeof url!=='string'||!/^https:\/\//i.test(url))continue;
  try {
   const response=await fetcher(url,{signal:AbortSignal.timeout(7000),headers:{'User-Agent':'Mozilla/5.0 (compatible; MANUKA-MD/4.2)'}});
   const length=Number(response.headers?.get?.('content-length')||0);
   const type=response.headers?.get?.('content-type')||'';
   if(!response.ok || length>5*1024*1024 || (type && !/^image\//i.test(type)))continue;
   const data=Buffer.from(await response.arrayBuffer());
   if(data.length>5*1024*1024)continue;
   return await sharp(data).rotate().resize({width:720,height:1024,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();
  }catch { /* external host may block AWS servers */ }
 }
 return sharp(posterSvg(title,year)).jpeg({quality:85}).toBuffer();
}
