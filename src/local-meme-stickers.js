import { readdir,readFile,stat } from 'node:fs/promises';
import { join,resolve,extname } from 'node:path';
import sharp from 'sharp';
const allowed=new Set(['.png','.jpg','.jpeg','.webp','.gif']);
let cursor=0;
export async function localMemeSticker(dir=process.env.STICKER_MEME_DIR) {
 if(!dir)return null;
 try{
  const base=resolve(dir);
  const names=(await readdir(base,{withFileTypes:true})).filter(x=>x.isFile() && allowed.has(extname(x.name).toLowerCase())).map(x=>x.name).sort();
  if(!names.length)return null;
  for(let tries=0;tries<names.length;tries++){
   const filename=join(base,names[cursor++%names.length]);
   if((await stat(filename)).size>3*1024*1024)continue;
   const image=await readFile(filename);
   try {
    return await sharp(image,{animated:false,limitInputPixels:20000000}).rotate().resize(512,512,{fit:'contain',background:'#00000000'}).webp({quality:82}).toBuffer();
   }catch{/* skip invalid formats */}
  }
 }catch{/* missing folder */}
 return null;
}
