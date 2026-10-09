import { sendVoice } from './voice.js';
import { FeatureStore } from './features.js';
import 'dotenv/config';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { handleCommand } from './commands.js';
import { parseCommand, unwrap, textOf } from './utils.js';
import { Settings, shouldAutoReply } from './settings.js';
import { AI } from './ai.js';
const logger = pino({ level: 'silent' });
const prefix = process.env.PREFIX || '.';
if (!prefix.trim()) throw new Error('PREFIX cannot be empty');
if (!['self','public'].includes(process.env.MODE || 'self')) throw new Error('MODE must be self or public');
const settings = await new Settings().load();
const ai = new AI();
const metrics = { processed: 0, errors: 0 };
const features = await new FeatureStore().load();
const runtime = { settings, ai, metrics, features };
const seen = new Map(), cooldowns = new Map(), busy = new Set();
let stopping = false, current, reconnect, reconnectAttempts = 0;
async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_DIR || './auth');
  const sock = makeWASocket({ logger, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) }, markOnlineOnConnect: false, syncFullHistory: false });
  current = sock;
  sock.ev.on('creds.update', () => saveCreds().catch(() => console.error('Session save failed. Check disk permissions.')));
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) { console.log('WhatsApp > Linked devices > Link a device'); qrcode.generate(qr, { small: true }); }
    if (connection === 'open') { reconnectAttempts = 0; console.log(`${process.env.BOT_NAME || 'MANUKA-MD'} connected. Send ${prefix}menu`); }
    if (connection === 'close' && !stopping) {
      const code = lastDisconnect?.error?.output?.statusCode;
      if ([DisconnectReason.loggedOut, DisconnectReason.badSession, DisconnectReason.connectionReplaced].includes(code)) {
        console.log('Session ended. Check Linked devices; for logout, remove auth folder and restart to scan QR.');
      } else {
        clearTimeout(reconnect);
        const delay = Math.min(30000, 3000 * 2 ** Math.min(reconnectAttempts++, 4));
        reconnect = setTimeout(() => connect().catch(() => { console.error('Reconnect failed. Restart bot.'); }), delay);
      }
    }
  });
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (action !== 'add' || !settings.data.welcomeGroups.includes(id)) return;
    try {
      const mentions = participants.map(p => typeof p === 'string' ? p : p.id).filter(Boolean);
      if (!mentions.length) return;
      const meta = await sock.groupMetadata(id);
      await sock.sendMessage(id, { text: `👋 Welcome ${mentions.map(j => '@' + j.split('@')[0]).join(', ')}!\n✨ ${meta.subject}\n${process.env.BOT_NAME || 'MANUKA-MD'} • ${prefix}menu`, mentions });
    } catch { console.error('Welcome message failed.'); }
  });
  sock.ev.on('messages.upsert', async ({ type, messages }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      const jid = msg.key.remoteJid;
      if (!msg.message || !jid || !/@(g\.us|s\.whatsapp\.net|lid)$/.test(jid)) continue;
      const body = unwrap(msg.message), text = textOf(body), parsed = parseCommand(text, prefix);
      const auto = !parsed && shouldAutoReply(msg, text, settings.data);
      if (!auto && (!parsed || (settings.data.mode === 'self' && !msg.key.fromMe))) continue;
      const id = `${jid}:${msg.key.id}`;
      if (seen.has(id)) continue;
      seen.set(id, Date.now());
      const sender = msg.key.participant || jid;
      const now = Date.now();
      if (busy.has(jid) || now - (cooldowns.get(sender) || 0) < 3000 || busy.size >= 3) continue;
      cooldowns.set(sender, now); busy.add(jid);
      try {
        if (auto) {
          const voiceEnabled = settings.data.autoVoiceChats.includes(jid);
          const voiceLanguage = { si: 'Sinhala script', en: 'English', ta: 'Tamil script' }[process.env.VOICE_LANG || 'si'] || 'Sinhala script';
          const prompt = voiceEnabled ? `Reply briefly in ${voiceLanguage}, under 1200 characters, suitable for spoken audio.\nUser message:\n${text.slice(0,3500)}` : text;
          const answer = await ai.answer(`${jid}:${jid}`, prompt);
          await sock.sendMessage(jid, { text: `🤖 ${process.env.BOT_NAME || 'MANUKA-MD'} AI\n${answer}` }, { quoted: msg });
          if (settings.data.autoVoiceChats.includes(jid)) {
            try { await sendVoice(sock, jid, answer.slice(0,1500), msg); }
            catch { await sock.sendMessage(jid, { text: '🎙️ Voice unavailable. Python/gTTS/FFmpeg setup බලන්න. Text answer ඉහත ඇත.' }, { quoted: msg }); }
          }
        } else await handleCommand(sock, msg, body, parsed, runtime);
        metrics.processed++;
      }
      catch (error) {
        metrics.errors++;
        const known = /Ollama|Media|Question|Sticker|Download|Supported|Group|භාවිතය|වෙන්න|දෙන්න|කරන්න|command|Channel|Chat|Voice|Personal|member|ලොකු|update/i.test(error.message || '');
        if (!auto) await sock.sendMessage(jid, { text: known ? error.message : 'Command failed. Ollama / FFmpeg / yt-dlp setup සහ connection බලන්න.' }, { quoted: msg }).catch(() => {});
        console.error('Command failed:', parsed?.command || 'auto-reply', error.code || error.name);
      } finally { busy.delete(jid); }
    }
  });
}
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const map of [seen, cooldowns]) for (const [key, value] of map) if (value < cutoff) map.delete(key);
  ai.prune();
}, 60000).unref();
function shutdown() { stopping = true; clearTimeout(reconnect); current?.end(new Error('Shutdown')); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
connect().catch(() => { console.error('Startup failed. Check dependencies and auth folder permissions.'); process.exitCode = 1; });
