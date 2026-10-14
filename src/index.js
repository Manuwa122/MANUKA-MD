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
const seen = new Map(), cooldowns = new Map(), busy = new Set(), reacted = new Map();
const reactionEmoji = ['❤️', '👍', '✨', '💙', '🔥', '😊'];
let stopping = false, current, reconnect, reconnectAttempts = 0;
async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_DIR || './auth');
  const sock = makeWASocket({ logger, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) }, markOnlineOnConnect: false, syncFullHistory: false });
  current = sock;
  // Owner-controlled pairing-code mode. Never expose a pairing code on a public website.
  let pairingRequested = false;
  if (!state.creds.registered && process.env.PAIRING_PHONE) {
    const digits = process.env.PAIRING_PHONE.replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(digits)) throw new Error('PAIRING_PHONE must be 8–15 digits including country code.');
    sock.ev.on('connection.update', async ({ connection, qr }) => {
      if (pairingRequested || connection === 'open' || (!qr && connection !== 'connecting')) return;
      pairingRequested = true;
      try {
        const code = await sock.requestPairingCode(digits);
        console.log('PRIVATE WHATSAPP PAIRING CODE:', code, '(read from your own host logs only)');
      } catch {
        console.error('Pairing-code request failed. Use the QR in your private host logs.');
      }
    });
  }
  sock.ev.on('creds.update', () => saveCreds().catch(() => console.error('Session save failed. Check disk permissions.')));
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !process.env.PAIRING_PHONE) { console.log('WhatsApp > Linked devices > Link a device'); qrcode.generate(qr, { small: true }); }
    if (connection === 'open') { reconnectAttempts = 0; sock.sendPresenceUpdate(settings.data.presenceMode === 'online' ? 'available' : 'unavailable').catch(() => {}); console.log(`${process.env.BOT_NAME || 'MANUKA-MD'} connected. Send ${prefix}menu`); }
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
      if (jid === 'status@broadcast') {
        if (settings.data.autoStatusView && msg.message && !msg.key.fromMe) {
          try { await sock.readMessages([msg.key]); }
          catch { console.error('Status view receipt failed (WhatsApp support may vary).'); }
        }
        continue;
      }
      if (!msg.message || !jid || !/@(g\.us|s\.whatsapp\.net|lid)$/.test(jid)) continue;
      if (settings.data.autoReact && !msg.key.fromMe && msg.key.id && !msg.message?.reactionMessage) {
        const reactId = `${jid}:${msg.key.id}`;
        if (!reacted.has(reactId)) {
          reacted.set(reactId, Date.now());
          const emoji = reactionEmoji[Math.floor(Math.random() * reactionEmoji.length)];
          try { await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }); }
          catch { console.error('Auto reaction failed.'); }
        }
      }
      const body = unwrap(msg.message), text = textOf(body), parsed = parseCommand(text, prefix);
      const auto = !parsed && shouldAutoReply(msg, text, settings.data) && !settings.data.pausedChats?.includes(jid);
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
        const known = /Groq|API|rate limit|quota|Ollama|Media|Question|Sticker|Download|Supported|Group|භාවිතය|වෙන්න|දෙන්න|කරන්න|command|Channel|Chat|Voice|Personal|member|ලොකු|update/i.test(error.message || '');
        if (!auto) await sock.sendMessage(jid, { text: known ? error.message : 'Command failed. Check AI credentials, network, and bot logs.' }, { quoted: msg }).catch(() => {});
        console.error('Command failed:', parsed?.command || 'auto-reply', error.code || error.name);
      } finally { busy.delete(jid); }
    }
  });
}
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const map of [seen, cooldowns, reacted]) for (const [key, value] of map) if (value < cutoff) map.delete(key);
  ai.prune();
  if (settings.data.presenceMode === 'online') current?.sendPresenceUpdate('available').catch(() => {});
}, 60000).unref();
function shutdown() { stopping = true; clearTimeout(reconnect); current?.end(new Error('Shutdown')); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
connect().catch(() => { console.error('Startup failed. Check dependencies and auth folder permissions.'); process.exitCode = 1; });
