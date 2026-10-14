// Find downloadable public-domain or openly licensed full-length films only.
// Search matches are independently checked against item metadata before any link is shown.
export async function findOpenMovie(title, fetcher = fetch) {
 const q=String(title||'').trim(); if(q.length<2||q.length>100)return null;
 const api=new URL('https://archive.org/advancedsearch.php');
 api.searchParams.set('q','mediatype:movies AND title:"'+q.replace(/["\\]/g,' ').slice(0,100)+'" AND (licenseurl:* OR collection:prelinger)');
 api.searchParams.set('fl[]','identifier');api.searchParams.set('rows','5');api.searchParams.set('output','json');
 try {
  const result=await fetcher(api,{signal:AbortSignal.timeout(8000)});
  if(!result.ok)return null;
  const docs=(await result.json())?.response?.docs||[];
  for(const d of docs) {
   if(!/^[a-zA-Z0-9_.-]{3,100}$/.test(d.identifier||''))continue;
   const metaRes=await fetcher('https://archive.org/metadata/'+encodeURIComponent(d.identifier),{signal:AbortSignal.timeout(8000)});
   if(!metaRes.ok)continue;
   const meta=await metaRes.json(), info=meta.metadata||{};
   const name=String(info.title||'').toLowerCase().trim(), wanted=q.toLowerCase().trim();
   if(!(name===wanted||name.startsWith(wanted+' (')))continue;
   const license=String(info.licenseurl||'').toLowerCase(), rights=String(info.rights||'').toLowerCase();
   const allowed=/creativecommons\.org\/licenses\/(by|by-sa|by-nc|by-nd|by-nc-sa|by-nc-nd)\//.test(license) || /creativecommons\.org\/publicdomain\//.test(license) || /public domain/.test(rights);
   if(!allowed)continue;
   const files=Array.isArray(meta.files)?meta.files:[];
   const file=files.find(f=>/\.(mp4|m4v|webm)$/i.test(f.name||'') && !String(f.name).includes('/'));
   if(!file)continue;
   const link='https://archive.org/download/'+encodeURIComponent(d.identifier)+'/'+encodeURIComponent(file.name);
   return {title:info.title,link,license:license||rights,size:Number(file.size)||null};
  }
 } catch { /* Open catalog temporarily unavailable. No unverified links. */ }
 return null;
}
