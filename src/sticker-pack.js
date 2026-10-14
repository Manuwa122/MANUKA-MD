import sharp from 'sharp';

export const STICKER_PACK = Object.freeze({
 meme:['BRUH','NO WAY','SUS','WHAT?!','LOL','EPIC FAIL','BIG BRAIN','WHY THO','SEND HELP','CAUGHT IN 4K','NPC MODE','ME IRL'],
 funny:['HAHAHA','HEHE','ROFL','I CANT','TOO FUNNY','JOKES ON YOU','LOL BRO','FUNNY MOMENT','HILARIOUS','LAUGH TIME','CRYING LOL','WHEEZE'],
 love:['LOVE YOU','MISS YOU','HUGS','FOREVER','MY LOVE','HEARTS','SWEET','XOXO','YOU + ME','ADORABLE','ONLY YOU','BIG HUG'],
 sad:['SAD','MISS YOU','CRYING','HEARTBROKEN','NOT OK','WHY ME','LONELY','TEARS','OH NO','HURTS','GOODBYE','BLUE MOOD'],
 happy:['SO HAPPY','YAY!','SMILE','GOOD VIBES','SUNSHINE','CELEBRATE','HAPPY DAY','SO GOOD','CHEERS','WOW!','DANCE','BLISS'],
 angry:['NOPE!','STOP!','ENOUGH','NOT COOL','SERIOUSLY?!','RAGE','WHATEVER','SO DONE','NOT TODAY','ANGRY MODE','GRRR','BOOM'],
 reaction:['OKAY','WOW!','OMG','REALLY?','YES!','NO!','WAIT','SURE','FACTS','AGREED','HUH?','NICE'],
 sinhala:['AYYO','AMMO','ANE','ELA KIRI','PATTA','SUPIRI','HARI HARI','MONAWADA','PISSU DA','MARU','SHAA','AKKE'],
 anime:['KAWAII','SENPAI','NANI?!','SUGOI','POWER UP','BAKA!','UWU','ONII CHAN','CHIBI','ANIME MODE','YAMETE','HERO'],
 gaming:['GG WP','EZ CLAP','NOOB','OP','LEVEL UP','VICTORY','GAME OVER','RESPAWN','CLUTCH','AFK','LAG!','BOSS MODE'],
 study:['EXAM TIME','STUDY MODE','FOCUS','A+','GENIUS','BRAIN ON','LATE NIGHT','DONE!','HOMEWORK','DEADLINE','TOP MARKS','BREAK TIME'],
 goodmorning:['GOOD MORNING','WAKE UP','RISE N SHINE','HELLO DAY','COFFEE TIME','NEW DAY','SUN IS UP','MORNING!','GOOD VIBES','FRESH START','HI THERE','SMILE TODAY'],
 goodnight:['GOOD NIGHT','SWEET DREAMS','SLEEP WELL','NIGHT NIGHT','REST UP','SEE YOU','MOON TIME','ZZZ','DREAM BIG','SLEEP MODE','LATE NIGHT','BYE FOR NOW']
});
const aliases={gm:'goodmorning',gn:'goodnight',cry:'sad',laugh:'funny',romantic:'love',game:'gaming',school:'study',lol:'meme',wow:'reaction',si:'sinhala'};
const palettes={
 meme:['#191b33','#9c4dff','#ffcb47'], funny:['#2c1249','#ed6bfa','#ffe46a'],
 love:['#491433','#f05d9a','#ffd6eb'],sad:['#132944','#5da6f0','#c8e2ff'],
 happy:['#124a43','#50e0b4','#fdf089'],angry:['#4b1925','#ff674f','#ffd584'],
 reaction:['#1d2851','#7388ff','#f4e9ff'],sinhala:['#243a28','#8fe16e','#fff38c'],
 anime:['#352659','#bd8aff','#ffe1f8'],gaming:['#112f32','#39e5d8','#e8fae6'],
 study:['#1c3760','#80befc','#d9f1ff'],goodmorning:['#69452a','#ffd17c','#fff1ca'],
 goodnight:['#1b224f','#7d82ed','#e8e8ff']
};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let counter=0;
export function stickerCategories(){return Object.keys(STICKER_PACK);}
export function resolveStickerCategory(input){
 const term=String(input||'').toLowerCase().trim().replace(/[^a-z0-9]/g,'');
 const category=aliases[term]||term;
 return Object.hasOwn(STICKER_PACK,category)?category:null;
}
export function chooseSticker(category,random=Math.random){
 if(!Object.hasOwn(STICKER_PACK,category))throw Error('Sticker category unavailable');
 const texts=STICKER_PACK[category];
 const n=counter++;
 const value=Number(random());
 const offset=Number.isFinite(value)?Math.floor(Math.max(0,Math.min(0.99999,value))*texts.length):0;
 return {text:texts[(n+offset)%texts.length],category,index:n};
}
export async function makeSticker(category,random=Math.random) {
 const {text,index}=chooseSticker(category,random);
 const [dark,bright,light]=palettes[category];
 const fontSize=text.length>16?48:text.length>11?56:text.length>8?67:88;
 const angle=[-6,3,-3,5,0][index%5];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
 <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${bright}"/></linearGradient>
 <filter id="shadow"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-opacity=".43"/></filter></defs>
 <rect x="15" y="15" width="482" height="482" rx="108" fill="url(#bg)" stroke="${light}" stroke-width="6"/>
 <circle cx="92" cy="86" r="51" fill="${light}" opacity=".15"/><circle cx="447" cy="415" r="73" fill="${light}" opacity=".12"/>
 <path d="M65 398 L110 343 M400 133 L453 90 M379 433 L437 455" stroke="${light}" stroke-width="12" stroke-linecap="round" opacity=".50"/>
 <g transform="rotate(${angle} 256 256)" filter="url(#shadow)">
 <text x="256" y="253" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-weight="900" font-size="${fontSize}" stroke="${dark}" stroke-width="12" stroke-linejoin="round" paint-order="stroke fill" fill="${light}">${esc(text)}</text>
 </g><text x="256" y="421" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="${light}">MANUKA-MD</text>
 </svg>`;
 return sharp(Buffer.from(svg)).webp({quality:83}).toBuffer();
}
