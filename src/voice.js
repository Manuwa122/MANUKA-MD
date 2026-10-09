import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
export async function sendVoice(sock, jid, text, quoted, language = process.env.VOICE_LANG || 'si') {
  if (!['si','en','ta'].includes(language) || !text.trim() || text.length > 1500) throw new Error('Voice command: si/en/ta text characters 1–1500 දෙන්න.');
  const dir = await mkdtemp(join(tmpdir(), 'manuka-voice-'));
  try {
    const mp3 = join(dir, 'voice.mp3'), ogg = join(dir, 'voice.ogg');
    await run(process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3'), [fileURLToPath(new URL('../scripts/tts.py', import.meta.url)), language, mp3, text], { timeout: 60000, windowsHide: true, maxBuffer: 65536 });
    await run(process.env.FFMPEG_PATH || 'ffmpeg', ['-y','-i',mp3,'-c:a','libopus','-b:a','32k','-ac','1','-ar','48000',ogg], { timeout: 30000, windowsHide: true, maxBuffer: 65536 });
    if ((await stat(ogg)).size > 5 * 1024 * 1024) throw new Error('Voice command: generated voice is too large.');
    await sock.sendMessage(jid, { audio: await readFile(ogg), mimetype: 'audio/ogg; codecs=opus', ptt: true }, quoted ? { quoted } : {});
  } catch { throw new Error('Voice command failed: Python + gTTS + FFmpeg සහ internet connection බලන්න. Text reply සඳහා .ai භාවිත කරන්න.'); }
  finally { await rm(dir, { recursive: true, force: true }); }
}
