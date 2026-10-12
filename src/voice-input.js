import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export function isIncomingVoice(msg, body, enabled) {
  const jid = msg?.key?.remoteJid || '';
  return Boolean(enabled && !msg?.key?.fromMe && /@(s\.whatsapp\.net|lid)$/.test(jid) && body?.audioMessage?.ptt);
}

export async function transcribeVoice(media, { request = fetch, download = downloadContentFromMessage } = {}) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error('Groq key required for voice transcription.');
  if (Number(media.seconds || 0) > 120 || Number(media.fileLength || 0) > 10485760) throw new Error('Voice note too long or large (max 2 min / 10 MB).');
  const chunks = [];
  let size = 0;
  for await (const chunk of await download(media, 'audio')) {
    size += chunk.length;
    if (size > 10485760) throw new Error('Voice note exceeds 10 MB.');
    chunks.push(chunk);
  }
  const form = new FormData();
  form.append('file', new Blob([Buffer.concat(chunks)], { type: 'audio/ogg' }), 'message.ogg');
  form.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo');
  const response = await request('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key },
    body: form, signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error('Transcription HTTP ' + response.status);
  const result = await response.json();
  if (!result.text?.trim()) throw new Error('Empty transcript.');
  return result.text.trim().slice(0, 3500);
}
