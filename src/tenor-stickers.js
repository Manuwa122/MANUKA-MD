import sharp from 'sharp';
let searchCounter=0;
const allowedHost=h=>h==='media.tenor.com'||h.endsWith('.tenor.com');
export async function findTenorSticker(query,request=fetch,key=process.env.TENOR_API_KEY){
 const q=String(query||'').trim();
 if(!key||q.length<2||q.length>70)return null;
 const url=new URL('https://tenor.googleapis.com/v2/search');
 url.searchParams.set('key',String(key));
 url.searchParams.set('client_key','manuka_md');
 url.searchParams.set('q',q);
 url.searchParams.set('searchfilter','sticker');
 url.searchParams.set('contentfilter','medium');
 url.searchParams.set('limit','12');
 url.searchParams.set('random','true');
 const r=await request(url,{signal:AbortSignal.timeout(9000)});
 if(!r.ok)return null;
 const results=(await r.json())?.results;
 if(!Array.isArray(results)||!results.length)return null;
 const item=results[(searchCounter++)%results.length];
 const formats=item?.media_formats||{};
 const candidates=['tinygif','nanogif','webp_transparent','gif','mediumgif'].map(n=>formats[n]?.url).filter(Boolean);
 for(const link of candidates){
  try{
   const u=new URL(link);
   if(u.protocol!=='https:'||!allowedHost(u.hostname)||u.username||u.password)continue;
   const media=await request(u,{signal:AbortSignal.timeout(12000)});
   if(!media.ok)continue;
   const len=Number(media.headers?.get?.('content-length')||0);
   if(len>3*1024*1024)continue;
   const bytes=Buffer.from(await media.arrayBuffer());
   if(bytes.length>3*1024*1024)continue;
   const output=await sharp(bytes,{animated:false,limitInputPixels:16_000_000}).resize(512,512,{fit:'contain',background:'#00000000'}).webp({quality:80}).toBuffer();
   if(output.length<512*1024)return output;
  }catch{/* try next safe rendition */}
 }
 return null;
}
