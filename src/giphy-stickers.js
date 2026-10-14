import sharp from 'sharp';
let counter=0;
export async function findGiphySticker(query, request=fetch, key=process.env.GIPHY_API_KEY) {
 const q=String(query||'').trim();
 if(!key||q.length<2||q.length>70)return null;
 const url=new URL('https://api.giphy.com/v1/stickers/search');
 url.searchParams.set('api_key',String(key));url.searchParams.set('q',q);
 url.searchParams.set('limit','15');url.searchParams.set('rating','pg');
 const response=await request(url,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)return null;
 const data=(await response.json())?.data;
 if(!Array.isArray(data)||!data.length)return null;
 const item=data[(counter++)%data.length];
 const images=item?.images||{};
 const candidates=[images.fixed_width_small_still?.url,images.fixed_height_small_still?.url,
 images.original_still?.url,images.fixed_width?.url,images.original?.url].filter(Boolean);
 for(const link of candidates){
  try{
   const u=new URL(link);
   if(u.protocol!=='https:'||!['media.giphy.com','i.giphy.com'].includes(u.hostname)&&!u.hostname.endsWith('.giphy.com'))continue;
   if(u.username||u.password||u.port)continue;
   const media=await request(u,{signal:AbortSignal.timeout(12000)});
   if(!media.ok)continue;
   const len=Number(media.headers?.get?.('content-length')||0);
   if(len>3*1024*1024)continue;
   const bytes=Buffer.from(await media.arrayBuffer());
   if(bytes.length>3*1024*1024)continue;
   const webp=await sharp(bytes,{animated:false,limitInputPixels:16_000_000}).resize(512,512,{fit:'contain',background:'#00000000'}).webp({quality:80}).toBuffer();
   if(webp.length<=500*1024)return webp;
  }catch{/* attempt alternate image rendition */}
 }
 return null;
}
