import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomInt } from 'node:crypto';

export class FeatureStore {
  constructor(path = process.env.FEATURES_FILE || './data/features.json') { this.path = path; this.data = {}; this.pending = Promise.resolve(); }
  async load() {
    try { this.data = JSON.parse(await readFile(this.path, 'utf8')); if (!this.data || Array.isArray(this.data) || typeof this.data !== 'object') throw new Error('Invalid feature data'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    return this;
  }
  async update(key, change) {
    const op = this.pending.then(async () => {
      const next = structuredClone(this.data);
      const user = next[key] ||= { notes: [], tasks: [], expenses: [], quiz: null };
      const result = change(user);
      await mkdir(dirname(this.path), { recursive: true });
      await writeFile(this.path + '.tmp', JSON.stringify(next), { mode: 0o600 });
      await rename(this.path + '.tmp', this.path); this.data = next; return result;
    });
    this.pending = op.catch(() => {}); return op;
  }
}
const questions = [
  ['Which OSI layer routes packets?', ['Physical', 'Network', 'Session'], 2, 'Network layer uses logical addresses and routing.'],
  ['Which protocol resolves a domain name to an IP address?', ['DNS', 'FTP', 'SMTP'], 1, 'DNS resolves domain names.'],
  ['Which device separates broadcast domains?', ['Hub', 'Repeater', 'Router'], 3, 'A router separates broadcast domains.'],
  ['Which storage is volatile?', ['SSD', 'RAM', 'ROM'], 2, 'RAM loses its contents when power is removed.'],
  ['Which protocol provides encrypted remote terminal access?', ['Telnet', 'SSH', 'HTTP'], 2, 'SSH encrypts the remote terminal connection.'],
  ['What does a primary key identify?', ['A unique row', 'A whole database', 'A duplicate row'], 1, 'A primary key uniquely identifies a row.']
];
const aiTools = {
  explain: 'Explain this in simple Sinhala with key English terms, an example and a short recap.',
  study: 'Create a compact study pack: explanation, key facts, three practice questions and answers. State uncertainty.',
  rewrite: 'Rewrite this clearly and professionally while preserving its meaning. Return the rewritten text.',
  translate: 'Translate the following text to the language requested by the user. If unspecified, translate English to Sinhala and Sinhala/Singlish to English.',
  ideas: 'Generate five distinct, practical creative ideas for this request, with a concrete first step for each.',
  caption: 'Write five short, original social captions for this subject in the user’s language.',
  summarize: 'Summarize the supplied text with key points and explicitly stated action items. Do not invent facts.'
};
export async function handleFeature(sock, msg, body, parsed, runtime, key) {
  const { command: cmd, input } = parsed;
  const reply = text => sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  const p = process.env.PREFIX || '.';
  if (aiTools[cmd]) {
    const quoted = body.extendedTextMessage?.contextInfo?.quotedMessage;
    const source = input || quoted?.conversation || quoted?.extendedTextMessage?.text;
    if (!source || source.length > 3000) throw new Error('Feature command: text characters 1–3000 දෙන්න හෝ text message එකකට reply කරන්න.');
    await reply(await runtime.ai.answer(`${key}:tool:${cmd}`, `${aiTools[cmd]}\n\nUser text:\n${source}`)); return true;
  }
  if (cmd === 'choose') {
    const options = input.split('|').map(x => x.trim()).filter(Boolean);
    if (options.length < 2 || options.length > 12 || input.length > 1000) throw new Error(`භාවිතය: ${p}choose tea | coffee (2–12 options)`);
    await reply(`🎯 My pick: ${options[randomInt(options.length)]}\nRandom choice • තීරණය ඔයාගේ!`); return true;
  }
  if (cmd === 'style') {
    if (!input || input.length > 500) throw new Error(`භාවිතය: ${p}style MANUKA MD (≤500 characters)`);
    const styled = input.replace(/[A-Za-z0-9]/g, c => String.fromCodePoint(c >= '0' && c <= '9' ? 0x1d7ec + c.charCodeAt(0) - 48 : c >= 'a' && c <= 'z' ? 0x1d5ee + c.charCodeAt(0) - 97 : 0x1d5d4 + c.charCodeAt(0) - 65));
    await reply(`✨ TEXT STUDIO\n\n${styled}\n\n✦ ${input} ✦\n\n『 ${input} 』`); return true;
  }
  if (cmd === 'poll') {
    const [name, ...values] = input.split('|').map(x => x.trim());
    if (!name || name.length > 200 || values.length < 2 || values.length > 12 || values.some(x => !x || x.length > 100) || new Set(values).size !== values.length) throw new Error(`භාවිතය: ${p}poll Question | Option A | Option B (2–12 unique options)`);
    await sock.sendMessage(msg.key.remoteJid, { poll: { name, values, selectableCount: 1 } }); return true;
  }
  if (!['note', 'task', 'expense', 'quiz', 'answer', 'mydata'].includes(cmd)) return false;
  if (msg.key.remoteJid.endsWith('@g.us')) throw new Error('Feature command: personal notes/tasks/expenses/quiz private chat එකක භාවිත කරන්න.');
  if (!runtime.features) throw new Error('Feature command: restart bot.');
  if (input.length > 1000) throw new Error('Feature command: input ≤1000 characters දෙන්න.');
  const text = await runtime.features.update(key, user => {
    if (cmd === 'mydata') {
      if (input === 'clear CONFIRM') { user.notes = []; user.tasks = []; user.expenses = []; user.quiz = null; user.bookmarks = []; user.snippets = []; return '🧹 Your notes, tasks, expenses, quiz, bookmarks and snippets cleared.'; }
      return `🔐 MY SPACE\nNotes: ${user.notes.length}\nTasks: ${user.tasks.length}\nExpenses: ${user.expenses.length}\nBookmarks: ${(user.bookmarks || []).length}\nSnippets: ${(user.snippets || []).length}\nData stays on the bot computer.\nClear: ${p}mydata clear CONFIRM`;
    }
    if (cmd === 'quiz') {
      const index = randomInt(questions.length); user.quiz = index;
      const [q, options] = questions[index];
      return `🧠 ICT QUICK QUIZ\n${q}\n${options.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n${p}answer 1 / 2 / 3`;
    }
    if (cmd === 'answer') {
      if (user.quiz === null) return `Start with ${p}quiz`;
      if (!/^[123]$/.test(input)) throw new Error(`භාවිතය: ${p}answer 1 / 2 / 3`);
      const [, options, correct, why] = questions[user.quiz]; user.quiz = null;
      return `${Number(input) === correct ? '✅ Correct!' : '📚 Try the next one!'}\nAnswer: ${options[correct - 1]}\n${why}`;
    }
    const [action, ...rest] = input.split(/\s+/); const value = rest.join(' ');
    const list = user[cmd === 'note' ? 'notes' : cmd === 'task' ? 'tasks' : 'expenses'];
    if (!input || action === 'list') {
      if (cmd === 'expense') return `💰 EXPENSES • LKR\n${list.map((x, i) => `${i + 1}. ${x.label}: ${x.amount.toFixed(2)}`).join('\n') || 'No expenses'}\nTotal: ${list.reduce((sum, x) => sum + x.amount, 0).toFixed(2)}`;
      return `${cmd === 'note' ? '📒 NOTES' : '✅ TASKS'}\n${list.map((x, i) => `${i + 1}. ${cmd === 'task' ? (x.done ? '☑' : '☐') + ' ' : ''}${x.text}`).join('\n') || 'Empty'}\n${p}${cmd} add <text> • ${p}${cmd} del <number>${cmd === 'task' ? ` • ${p}task done <number>` : ''}`;
    }
    if (action === 'add') {
      if (!value || list.length >= 100) throw new Error('Feature command: text දෙන්න; maximum 100 entries.');
      if (cmd === 'expense') {
        const [amountText, ...label] = rest; const amount = Number(amountText);
        if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9 || !label.length) throw new Error(`භාවිතය: ${p}expense add 350 lunch (LKR)`);
        list.push({ amount: Math.round(amount * 100) / 100, label: label.join(' ') });
      } else list.push({ text: value, done: false });
      return `✅ Saved #${list.length}`;
    }
    if (action === 'del' || (cmd === 'task' && action === 'done')) {
      const index = Number(value) - 1;
      if (!/^\d+$/.test(value) || !Number.isInteger(index) || index < 0 || index >= list.length) throw new Error('Feature command: valid entry number දෙන්න.');
      if (action === 'del') list.splice(index, 1); else list[index].done = true;
      return '✅ Updated';
    }
    throw new Error(`භාවිතය: ${p}${cmd} list / add / del${cmd === 'task' ? ' / done' : ''}`);
  });
  await reply(text); return true;
}
