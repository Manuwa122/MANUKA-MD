// Free Wikipedia movie metadata fallback: no API key needed.
// Film information is separate from download availability.
export async function wikiMovie(title, fetcher=fetch) {
 const q=String(title||'').trim();
 if(q.length<2||q.length>100)return null;
 try {
  const api=new URL('https://en.wikipedia.org/w/api.php');
  api.searchParams.set('action','query');
  api.searchParams.set('generator','search');
  api.searchParams.set('gsrsearch',q+' film');
  api.searchParams.set('gsrlimit','5');
  api.searchParams.set('prop','extracts|pageimages|pageprops');
  api.searchParams.set('exintro','1');api.searchParams.set('explaintext','1');api.searchParams.set('exchars','650');
  api.searchParams.set('piprop','original|thumbnail');api.searchParams.set('pithumbsize','640');
  api.searchParams.set('format','json');api.searchParams.set('formatversion','2');
  const res=await fetcher(api,{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'MANUKA-MD-MovieBot/4.2 (metadata lookup)'}});
  if(!res.ok)return null;
  const pages=(await res.json())?.query?.pages||[];
  const t=q.toLowerCase().replace(/\s*\(\d{4}\)$/,'').trim();
  const valid=pages.filter(p=>p.title&&p.title.toLowerCase().includes(t)&&!/disambiguation|list of|soundtrack/i.test(p.title));
  const best=valid.find(p=>/\bfilm\b|\bmovie\b/i.test(p.title))||valid[0];
  if(!best)return null;
  const wikiUrl='https://en.wikipedia.org/wiki/'+encodeURIComponent(best.title.replace(/ /g,'_'));
  let runtime=null,language=null;
  const id=best.pageprops?.wikibase_item;
  if(/^Q\d+$/.test(id||'')) {
   try {
    const d=await fetcher('https://www.wikidata.org/wiki/Special:EntityData/'+id+'.json',{signal:AbortSignal.timeout(6000),headers:{'User-Agent':'MANUKA-MD-MovieBot/4.2 (metadata lookup)'}});
    if(d.ok) {
     const entity=(await d.json())?.entities?.[id];
     const quantity=entity?.claims?.P2047?.[0]?.mainsnak?.datavalue?.value?.amount;
     if(quantity && Number(quantity)>0 && Number(quantity)<1000)runtime=Math.round(Number(quantity))*60000;
     const langId=entity?.claims?.P364?.[0]?.mainsnak?.datavalue?.value?.id;
     if(langId && entity?.claims) {
      const l=await fetcher('https://www.wikidata.org/wiki/Special:EntityData/'+langId+'.json',{signal:AbortSignal.timeout(6000),headers:{'User-Agent':'MANUKA-MD-MovieBot/4.2 (metadata lookup)'}});
      if(l.ok)language=(await l.json())?.entities?.[langId]?.labels?.en?.value||null;
     }
    }
   } catch { /* Wikidata unavailable; keep Wikipedia metadata */ }
  }
  return {
   trackName:best.title.replace(/\s*\((?:\d{4}\s+)?film\)$/i,''),
   releaseDate:(best.title.match(/\b(18|19|20)\d{2}\b/)||[])[0]||'',
   artworkUrl100:best.original?.source||best.thumbnail?.source||null,
   trackTimeMillis:runtime,language,primaryGenreName:'Film',
   artistName:'Not listed',longDescription:String(best.extract||'No synopsis available').slice(0,550),
   trackViewUrl:wikiUrl,metadataSource:'Wikipedia / Wikidata'
  };
 } catch {return null;}
}
