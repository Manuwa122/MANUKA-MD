import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';

export class Settings {
  constructor(path = process.env.SETTINGS_FILE || './data/settings.json') {
    this.path = path;
    this.data = { mode: process.env.MODE || 'self', autoChats: [], welcomeGroups: [], autoVoiceChats: [] };
    this.pending = Promise.resolve();
  }
  async load() {
    try {
      const data = JSON.parse(await readFile(this.path, 'utf8'));
      if (!['self', 'public'].includes(data.mode) || !Array.isArray(data.autoChats) || !Array.isArray(data.welcomeGroups)) throw new Error('Invalid settings');
      this.data = { mode: data.mode, autoChats: data.autoChats.filter(x => typeof x === 'string'), welcomeGroups: data.welcomeGroups.filter(x => typeof x === 'string'), autoVoiceChats: (Array.isArray(data.autoVoiceChats) ? data.autoVoiceChats : []).filter(x => typeof x === 'string') };
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return this;
  }
  async update(change) {
    const operation = this.pending.then(async () => {
      const next = structuredClone(this.data);
      change(next);
      await mkdir(dirname(this.path), { recursive: true });
      await writeFile(`${this.path}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 });
      await rename(`${this.path}.tmp`, this.path);
      this.data = next;
    });
    this.pending = operation.catch(() => {});
    return operation;
  }
}

export function setMembership(list, id, enabled) {
  return enabled ? [...new Set([...list, id])] : list.filter(value => value !== id);
}

export function shouldAutoReply(msg, text, settings) {
  const jid = msg.key.remoteJid || '';
  return !msg.key.fromMe && !jid.endsWith('@g.us') && /@(s\.whatsapp\.net|lid)$/.test(jid)
    && settings.autoChats.includes(jid) && !!text.trim() && text.length <= 4000;
}
