import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { unwrap } from './utils.js';
import { safeFilename } from './downloads.js';
import { fetchFile } from './downloads.js';
import { sendVoice } from './voice.js';
import { setMembership } from './settings.js';

function owner(msg) { if (!msg.key.fromMe) throw new Error('Owner command: linked account එකෙන් යවන්න.'); }
function textLimit(value, max = 2000) { if (!value || value.length > max) throw new Error(`භාවිතය: text characters 1–${max} දෙන්න.`); return value; }
function channelId(value) { if (!/^\d+@newsletter$/.test(value)) throw new Error('Channel command: 123456@newsletter වැනි channel ID එකක් දෙන්න.'); return value; }
async function channelCall(sock, method, ...args) {
  if (typeof sock[method] !== 'function') throw new Error('Channel command: installed Baileys version does not support this operation.');
  try { return await sock[method](...args); } catch { throw new Error('Channel command rejected by WhatsApp. Channel ID, account permissions සහ connection බලන්න.'); }
}
export async function handleAdvanced(sock, msg, body, parsed, runtime, key) {
  const { command: cmd, input } = parsed;
  const jid = msg.key.remoteJid;
  const reply = text => sock.sendMessage(jid, { text }, { quoted: msg });
  if (cmd === 'document') {
    const context = body.extendedTextMessage?.contextInfo || body.imageMessage?.contextInfo || body.videoMessage?.contextInfo || body.documentMessage?.contextInfo;
    const source = unwrap(context?.quotedMessage || body);
    const entry = ['document','image','video','audio'].map(type => [type, source[type + 'Message']]).find(([,media]) => media);
    if (!entry) throw new Error('භාවිතය: file/image/video/audio message එකකට reply කරලා .document යවන්න.');
    const [type, media] = entry;
    const limit = 50 * 1024 * 1024;
    if (Number(media.fileLength || 0) > limit) throw new Error('Media command: maximum 50MB.');
    const stream = await downloadContentFromMessage(media, type);
    let size = 0; const chunks = [];
    try {
      for await (const chunk of stream) { size += chunk.length; if (size > limit) throw new Error('Media command: maximum 50MB.'); chunks.push(chunk); }
    } finally { stream.destroy(); }
    const ext = {image:'jpg',video:'mp4',audio:'ogg',document:'bin'}[type];
    const filename = safeFilename(input || media.fileName || `media.${ext}`);
    await sock.sendMessage(jid, { document: Buffer.concat(chunks), mimetype: media.mimetype || 'application/octet-stream', fileName: filename }, { quoted: msg });
    return true;
  }
  if (['file','download'].includes(cmd)) {
    if (!input || input.length > 4000) throw new Error('භාවිතය: .file https://example.com/file.zip');
    const dir = await mkdtemp(join(tmpdir(), 'manuka-file-'));
    try {
      const setting = Number(process.env.MAX_FILE_MB || 50);
      const limit = Math.max(1, Math.min(100, Number.isFinite(setting) ? setting : 50)) * 1024 * 1024;
      await reply('📥 Downloading file…');
      const path = join(dir, 'file'); const info = await (runtime.fetchFile || fetchFile)(input, path, limit);
      await sock.sendMessage(jid, { document: await readFile(path), mimetype: info.mime, fileName: info.filename, caption: `📦 ${info.filename} • ${(info.size / 1024 / 1024).toFixed(2)} MB` }, { quoted: msg });
    } finally { await rm(dir, { recursive: true, force: true }); }
    return true;
  }
  if (['voice','aivoice','autovoice'].includes(cmd)) {
    const voice = runtime.sendVoice || sendVoice;
    if (cmd === 'autovoice') {
      owner(msg);
      if (!/@(s\.whatsapp\.net|lid)$/.test(jid) || !['on','off'].includes(input)) throw new Error('භාවිතය: private chat එකක .autovoice on / off');
      await runtime.settings.update(data => { data.autoVoiceChats = setMembership(data.autoVoiceChats || [], jid, input === 'on'); });
      await reply(`🎙️ Auto voice ${input}. AI auto-replyත් අවශ්‍ය නම් .autoreply on යවන්න. Voice text goes to Google TTS.`); return true;
    }
    let language = process.env.VOICE_LANG || 'si', text = input;
    if (cmd === 'voice') {
      const match = input.match(/^(si|en|ta)\s+([\s\S]+)$/); if (match) { language = match[1]; text = match[2]; }
      text ||= body.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || body.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
    } else {
      textLimit(input, 3000);
      text = await runtime.ai.answer(`${key}:voice`, `Reply briefly in ${language === 'si' ? 'Sinhala script' : language === 'ta' ? 'Tamil script' : 'English'}, under 1200 characters, suitable for spoken audio.\n${input}`);
      await reply(text);
    }
    await voice(sock, jid, textLimit(text, 1500), msg, language); return true;
  }
  if (cmd === 'chat') {
    owner(msg);
    const [action, arg] = input.split(/\s+/);
    if (!['mute','unmute','pin','unpin','archive','unarchive','read','unread'].includes(action)) throw new Error('භාවිතය: .chat mute 8h / unmute / pin / unpin / archive / unarchive / read / unread');
    if (['pin','unpin','archive','unarchive','read','unread','mute','unmute'].includes(action) && arg && action !== 'mute') throw new Error('Chat command: current chat only; extra arguments remove කරන්න.');
    let patch;
    const lastMessages = [{ key: msg.key, messageTimestamp: Number(msg.messageTimestamp) || Math.floor(Date.now()/1000) }];
    if (action === 'mute') {
      const hours = { '1h':1, '8h':8, '24h':24, '7d':168 }[arg || '8h'];
      if (!hours) throw new Error('භාවිතය: .chat mute 1h / 8h / 24h / 7d');
      patch = { mute: Date.now() + hours * 3600000 };
    } else if (action === 'unmute') patch = { mute: null };
    else if (action === 'pin' || action === 'unpin') patch = { pin: action === 'pin' };
    else if (action === 'archive' || action === 'unarchive') patch = { archive: action === 'archive', lastMessages };
    else patch = { markRead: action === 'read', lastMessages };
    // Reply before mutation so sending an acknowledgement does not undo unread/archive.
    const acknowledgement = await reply(`⚙️ Applying ${action} to this chat…`);
    if (acknowledgement?.key && patch.lastMessages) {
      patch.lastMessages = [{ key: acknowledgement.key, messageTimestamp: Number(acknowledgement.messageTimestamp) || Math.floor(Date.now()/1000) }];
    }
    try { await sock.chatModify(patch, jid); } catch { throw new Error('Chat command: WhatsApp rejected update. Check Linked devices and retry.'); }
    return true;
  }
  if (cmd === 'channel') {
    owner(msg);
    const [action, target, ...rest] = input.split(/\s+/); const text = rest.join(' ');
    if (action === 'create') {
      const [name, ...description] = input.slice(7).split('|').map(x => x.trim());
      const data = await channelCall(sock, 'newsletterCreate', textLimit(name, 100), description.join(' | ').slice(0,2000));
      if (!data?.id) throw new Error('Channel command: WhatsApp returned no channel ID. Check WhatsApp before creating again.');
      await reply(`📰 Channel created\nID: ${data.id}\nSave this ID for .channel commands`); return true;
    }
    if (!['info','follow','unfollow','mute','unmute','name','desc','post'].includes(action)) throw new Error('භාවිතය: .channel create Name | Description\n.channel info/follow/unfollow/mute/unmute ID\n.channel name/desc/post ID text');
    let id, invite;
    if (action === 'info' && target?.startsWith('https://')) {
      const u = new URL(target);
      if (!['whatsapp.com','www.whatsapp.com'].includes(u.hostname) || !/^\/channel\/[A-Za-z0-9]+\/?$/.test(u.pathname) || u.username || u.password || u.port) throw new Error('Channel command: WhatsApp channel invite link එකක් දෙන්න.');
      invite = u.pathname.split('/')[2];
    } else id = channelId(target);
    if (action === 'info') {
      const data = await channelCall(sock, 'newsletterMetadata', invite ? 'invite' : 'jid', invite || id);
      if (!data) throw new Error('Channel command: channel not found.');
      const name = typeof data.name === 'string' ? data.name : data.name?.text;
      const description = typeof data.description === 'string' ? data.description : data.description?.text;
      await reply(`📰 ${name || id}\nID: ${data.id || id}\n${description || ''}\nSubscribers: ${data.subscribers ?? 'unknown'}\n${data.invite ? `https://whatsapp.com/channel/${data.invite}` : ''}`);
    } else if (action === 'post') {
      try { await sock.sendMessage(id, { text: textLimit(text,4000) }); } catch { throw new Error('Channel command: post rejected; linked account must own/admin this channel.'); }
      await reply('📰 Channel post sent ✅');
    } else {
      const methods = { follow:'newsletterFollow', unfollow:'newsletterUnfollow', mute:'newsletterMute', unmute:'newsletterUnmute', name:'newsletterUpdateName', desc:'newsletterUpdateDescription' };
      await channelCall(sock, methods[action], id, ...(['name','desc'].includes(action) ? [textLimit(text, action === 'name' ? 100 : 2000)] : []));
      await reply(`📰 ${action} completed ✅`);
    }
    return true;
  }
  if (['bookmark','snippet','exportdata'].includes(cmd)) {
    if (!/@(s\.whatsapp\.net|lid)$/.test(jid)) throw new Error('Personal command: private chat එකක භාවිත කරන්න.');
    if (!runtime.features) throw new Error('Personal command: restart bot.');
    if (cmd === 'exportdata') {
      const data = runtime.features.data[key] || {};
      await sock.sendMessage(jid, { document: Buffer.from(JSON.stringify(data,null,2)), mimetype:'application/json', fileName:'my-manuka-data.json' }, { quoted:msg }); return true;
    }
    textLimit(input || 'list', 1000);
    const [action, name, ...parts] = input.split(/\s+/); const value = parts.join(' ');
    const result = await runtime.features.update(key, user => {
      const list = user[cmd === 'bookmark' ? 'bookmarks' : 'snippets'] ||= [];
      if (!input || action === 'list') return list.map(x => `${x.name}: ${x.value}`).join('\n') || 'Empty. .'+cmd+' add name '+(cmd === 'bookmark' ? 'https://example.com' : 'reply text');
      if (!/^[a-zA-Z0-9_-]{1,32}$/.test(name || '')) throw new Error('Personal command: name එක letters/numbers/_/- characters 1–32 දෙන්න.');
      const index = list.findIndex(x => x.name === name);
      if (action === 'get') { if (index < 0) throw new Error('Personal command: entry not found.'); return list[index].value; }
      if (action === 'del') { if (index < 0) throw new Error('Personal command: entry not found.'); list.splice(index,1); return 'Deleted ✅'; }
      if (action !== 'add' || !value) throw new Error(`භාවිතය: .${cmd} add name value / list / get name / del name`);
      if (cmd === 'bookmark') { const u = new URL(value); if (!['https:','http:'].includes(u.protocol)) throw new Error('Personal command: HTTP/HTTPS bookmark දෙන්න.'); }
      if (index < 0 && list.length >= 100) throw new Error('Personal command: maximum 100 entries.');
      if (index >= 0) list[index] = {name,value}; else list.push({name,value});
      return 'Saved ✅';
    });
    await reply(result); return true;
  }
  return false;
}
