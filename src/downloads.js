import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { basename } from 'node:path';

export function publicIPv4(ip) {
  if (isIP(ip) !== 4) return false;
  const [a,b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0,168].includes(b)) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && [18,19,51].includes(b)) || (a === 203 && b === 0));
}
export function fileURL(text) {
  let u; try { u = new URL(text); } catch { throw new Error('Download command: valid HTTPS direct-file URL දෙන්න.'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || u.hostname.length > 253)
    throw new Error('Download command: public HTTPS URL එකක් දෙන්න.');
  return u;
}
export function safeFilename(name) {
  return basename(name.replace(/\\/g, '/')).replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '_').replace(/^\.+/, '').slice(0,150) || 'download.bin';
}
export async function fetchFile(url, path, limit = 50 * 1024 * 1024, dependencies = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    for (let hop = 0; hop <= 5; hop++) {
      const u = fileURL(url);
      const addresses = await (dependencies.lookup || lookup)(u.hostname, { all: true, family: 4 });
      if (!addresses.length || addresses.some(x => !publicIPv4(x.address))) throw new Error('Download command: private/reserved network URLs blocked.');
      if (controller.signal.aborted) throw new Error('Download command: timed out.');
      const response = await new Promise((resolve, reject) => {
        const req = (dependencies.get || https.get)(u, { signal: controller.signal, lookup: (_host, options, cb) => options?.all ? cb(null, [addresses[0]]) : cb(null, addresses[0].address, 4), headers: { 'User-Agent': 'MANUKA-MD/3.0', 'Accept-Encoding': 'identity' } }, resolve);
        req.on('error', reject);
      });
      if ([301,302,303,307,308].includes(response.statusCode)) {
        const location = response.headers.location; response.destroy();
        if (!location || hop === 5) throw new Error('Download command: too many redirects.');
        url = new URL(location, u).href; continue;
      }
      if (response.statusCode !== 200) { response.destroy(); throw new Error(`Download command: server returned ${response.statusCode}; use a public direct link.`); }
      if (Number(response.headers['content-length']) > limit) { response.destroy(); throw new Error('Download command: file exceeds size limit.'); }
      const mime = String(response.headers['content-type'] || 'application/octet-stream').split(';')[0];
      if (/text\/html/i.test(mime)) { response.destroy(); throw new Error('Download command: link is a webpage; give a direct file link.'); }
      let size = 0;
      const cap = new Transform({ transform(chunk, _enc, cb) { size += chunk.length; cb(size > limit ? new Error('Download command: file exceeds size limit.') : null, chunk); } });
      const disposition = String(response.headers['content-disposition'] || '');
      const named = disposition.match(/filename="?([^";]+)"?/i)?.[1];
      let pathName = u.pathname.split('/').pop() || 'download.bin';
      try { pathName = decodeURIComponent(pathName); } catch { /* keep literal filename */ }
      const filename = safeFilename(named || pathName);
      await pipeline(response, cap, createWriteStream(path, { flags: 'wx', mode: 0o600 }), { signal: controller.signal });
      return { filename, mime, size };
    }
  } finally { clearTimeout(timer); }
}
