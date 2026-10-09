import { handleAdvanced } from './advanced.js';
import { handleFeature } from './features.js';
import { downloadContentFromMessage, jidNormalizedUser } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { unwrap, downloadURL, adminAllowed } from './utils.js';
const run = promisify(execFile);
const maxBytes = 20 * 1024 * 1024;
import { menuText, duration } from './menu.js';
import { AI } from './ai.js';
import { setMembership } from './settings.js';
const fallbackAI = new AI();
async function mediaBuffer(media, type) {
  if (Number(media.fileLength || 0) > maxBytes) throw new Error('Media එක 20MB ට අඩු වෙන්න ඕනේ.');
  const stream = await downloadContentFromMessage(media, type);
  const parts = []; let bytes = 0;
  for await (const part of stream) {
    bytes += part.length;
    if (bytes > maxBytes) { stream.destroy(); throw new Error('Media එක ලොකු වැඩියි.'); }
    parts.push(part);
  }
  return Buffer.concat(parts);
}
export async function handleCommand(sock, msg, body, parsed, runtime = {}) {
  const jid = msg.key.remoteJid;
  const reply = text => sock.sendMessage(jid, { text }, { quoted: msg });
  const { command: cmd, input } = parsed;
  const ai = runtime.ai || fallbackAI;
  const memoryKey = `${jid}:${msg.key.fromMe ? 'self' : msg.key.participant || jid}`;
  if (await handleAdvanced(sock, msg, body, parsed, { ...runtime, ai }, memoryKey)) return;
  if (await handleFeature(sock, msg, body, parsed, { ...runtime, ai }, memoryKey)) return;
  if (['menu', 'help'].includes(cmd)) {
    const text = menuText(runtime.settings?.data.mode || process.env.MODE || 'self');
    if (process.env.MENU_IMAGE) {
      try { return await sock.sendMessage(jid, { image: await readFile(process.env.MENU_IMAGE), caption: text }, { quoted: msg }); }
      catch { /* text menu remains available if banner is missing */ }
    }
    return reply(text);
  }
  if (cmd === 'health') return reply(`🟢 MANUKA-MD v4.0 healthy\\nUptime: ${duration(process.uptime())}\\nRAM: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(0)} MB\\nProcessed: ${runtime.metrics?.processed || 0}\\nErrors: ${runtime.metrics?.errors || 0}`);\n  if (cmd === 'ping') return reply(`Pong! 🟢 ${process.env.BOT_NAME || 'MANUKA-MD'} online`);
  if (cmd === 'status') return reply(`🟢 ${process.env.BOT_NAME || 'MANUKA-MD'} v4.0.0\nUptime: ${duration(process.uptime())}\nMode: ${runtime.settings?.data.mode || process.env.MODE || 'self'}\nAI: ${(process.env.AI_PROVIDER || 'ollama').toUpperCase()} / ${(process.env.AI_PROVIDER === 'groq' ? process.env.GROQ_MODEL || 'openai/gpt-oss-20b' : process.env.OLLAMA_MODEL || 'llama3.2')}\nProcessed: ${runtime.metrics?.processed || 0}\nErrors: ${runtime.metrics?.errors || 0}`);
  if (cmd === 'owner') return reply(`👑 ${process.env.OWNER_NAME || 'Manuka Chamath'}\n✦ Creator of ${process.env.BOT_NAME || 'MANUKA-MD'}`);
  if (cmd === 'resetai') { ai.clear(memoryKey); return reply('AI history cleared ✅'); }
  if (['mode', 'autoreply', 'settings'].includes(cmd)) {
    if (!msg.key.fromMe) throw new Error('Owner command: linked account එකෙන් යවන්න.');
    if (!runtime.settings) throw new Error('Settings unavailable. Bot restart කරන්න.');
    if (cmd === 'settings') return reply(`⚙️ Mode: ${runtime.settings.data.mode}\nAuto-reply chats: ${runtime.settings.data.autoChats.length}\nWelcome groups: ${runtime.settings.data.welcomeGroups.length}\nPrefix: ${process.env.PREFIX || '.'}`);
    if (cmd === 'mode') {
      if (!['self', 'public'].includes(input)) throw new Error('භාවිතය: mode self / public');
      await runtime.settings.update(data => { data.mode = input; });
      return reply(`Mode: ${input} ✅`);
    }
    if (!/@(s\.whatsapp\.net|lid)$/.test(jid)) throw new Error('Auto-reply private chat එකක සකස් කරන්න.');
    if (!['on', 'off'].includes(input)) throw new Error('භාවිතය: autoreply on / off');
    await runtime.settings.update(data => { data.autoChats = setMembership(data.autoChats, jid, input === 'on'); });
    return reply(`🤖 AI auto-reply ${input.toUpperCase()} — මේ chat එක සඳහා. Replies AI විසින් ජනනය කරයි.`);
  }
  if (cmd === 'ai') {
    if (!input) return reply(`භාවිතය: ${process.env.PREFIX || '.'}ai ඔයාගේ ප්‍රශ්නය`);
    return reply(await ai.answer(memoryKey, input));
  }
  if (['sticker','s'].includes(cmd)) {
    const context = body.extendedTextMessage?.contextInfo || body.imageMessage?.contextInfo || body.videoMessage?.contextInfo;
    const source = unwrap(context?.quotedMessage || body);
    const media = source.imageMessage || source.videoMessage;
    if (!media) return reply('Image/video එකකට reply කරලා .sticker යවන්න.');
    const video = !!source.videoMessage;
    if (video && (!media.seconds || media.seconds > 10)) throw new Error('Video duration එක තත්පර 10 ට අඩු වෙන්න ඕනේ.');
    const buffer = await mediaBuffer(media, video ? 'video' : 'image');
    if (!video) {
      const sticker = await sharp(buffer, { limitInputPixels: 40000000 }).rotate().resize(512, 512, { fit: 'contain', background: '#00000000' }).webp().toBuffer();
      return sock.sendMessage(jid, { sticker }, { quoted: msg });
    }
    const dir = await mkdtemp(join(tmpdir(), 'manuka-sticker-'));
    try {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(join(dir, 'input.mp4'), buffer);
      await run(process.env.FFMPEG_PATH || 'ffmpeg', ['-y','-i',join(dir,'input.mp4'),'-t','10','-vf','fps=10,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000','-c:v','libwebp','-loop','0','-an',join(dir,'sticker.webp')], { timeout: 60000, windowsHide: true });
      const sticker = await readFile(join(dir,'sticker.webp'));
      if (sticker.length > 1024 * 1024) throw new Error('Sticker ලොකු වැඩියි. Shorter video එකක් දෙන්න.');
      return await sock.sendMessage(jid, { sticker }, { quoted: msg });
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
  if (['audio','video','tiktok','tt'].includes(cmd)) {
    const url = downloadURL(input);
    if (['tiktok','tt'].includes(cmd) && !/(^|\.)tiktok\.com$/.test(new URL(url).hostname)) throw new Error('භාවිතය: .tiktok TikTok-video-link');
    await reply('📥 Downloading media…');
    const dir = await mkdtemp(join(tmpdir(), 'manuka-download-'));
    try {
      const args = ['--ignore-config','--no-playlist','--max-filesize','20M','--match-filter','duration <= 300 & !is_live','--socket-timeout','15','--retries','1','--no-warnings','--restrict-filenames','-o',join(dir,'media.%(ext)s')];
      if (cmd === 'audio') args.push('-f','bestaudio/best','-x','--audio-format','mp3');
      else args.push('-f','best[ext=mp4][height<=720]/best[ext=mp4]');
      if (process.env.FFMPEG_PATH) args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
      await run(process.env.YTDLP_PATH || 'yt-dlp', [...args, '--', url], { timeout: 120000, windowsHide: true, maxBuffer: 1024 * 1024 });
      const names = (await readdir(dir)).filter(n => cmd === 'audio' ? n.endsWith('.mp3') : n.endsWith('.mp4'));
      if (names.length !== 1) throw new Error('Download unavailable හෝ duration/size limit ඉක්මවා ඇත.');
      const path = join(dir, names[0]);
      if ((await stat(path)).size > maxBytes) throw new Error('Download එක 20MB ට වැඩියි.');
      const buffer = await readFile(path);
      return await sock.sendMessage(jid, cmd === 'audio' ? { audio: buffer, mimetype: 'audio/mpeg' } : { video: buffer, mimetype: 'video/mp4', caption: 'MANUKA-MD' }, { quoted: msg });
    } catch (error) {
      if (/Download/.test(error.message)) throw error;
      throw new Error('Download failed: update yt-dlp, check FFmpeg and use a public video ≤5 min / ≤20MB. Login/region restrictions may prevent downloads.');
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
  if (['group','subject','desc','kick','promote','demote','welcome'].includes(cmd)) {
    if (!jid.endsWith('@g.us')) throw new Error('මේ command එක group එකක භාවිත කරන්න.');
    const meta = await sock.groupMetadata(jid);
    const bot = jidNormalizedUser(sock.user.id);
    const sender = msg.key.fromMe ? bot : msg.key.participant;
    if (!adminAllowed(meta.participants, sender, bot)) throw new Error('ඔයා සහ bot දෙන්නාම group admins වෙන්න ඕනේ.');
    if (cmd === 'welcome') {
      if (!runtime.settings) throw new Error('Settings unavailable. Bot restart කරන්න.');
      if (!['on', 'off'].includes(input)) throw new Error('භාවිතය: welcome on / off');
      await runtime.settings.update(data => { data.welcomeGroups = setMembership(data.welcomeGroups, jid, input === 'on'); });
      return reply(`Welcome messages ${input.toUpperCase()} ✅`);
    }
    if (cmd === 'group') {
      if (!['open','close'].includes(input)) throw new Error('භාවිතය: .group open / close');
      await sock.groupSettingUpdate(jid, input === 'close' ? 'announcement' : 'not_announcement');
    } else if (cmd === 'subject') {
      if (!input || input.length > 100) throw new Error('Group name එක characters 1–100 අතර දෙන්න.');
      await sock.groupUpdateSubject(jid, input);
    } else if (cmd === 'desc') {
      if (!input || input.length > 2000) throw new Error('Description එක characters 1–2000 අතර දෙන්න.');
      await sock.groupUpdateDescription(jid, input);
    } else {
      const target = body.extendedTextMessage?.contextInfo?.participant;
      if (!target || !meta.participants.some(p => p.id === target)) throw new Error('Group member message එකකට reply කරන්න.');
      if (target === bot || target === meta.owner || meta.participants.find(p => p.id === target)?.admin === 'superadmin') throw new Error('මේ member වෙනස් කළ නොහැක.');
      const results = await sock.groupParticipantsUpdate(jid, [target], cmd === 'kick' ? 'remove' : cmd);
      if (results.some(r => String(r.status) !== '200')) throw new Error('Group member update rejected by WhatsApp.');
    }
    return reply('Group update completed ✅');
  }
  return reply(`Unknown command. ${process.env.PREFIX || '.'}menu බලන්න.`);
}
