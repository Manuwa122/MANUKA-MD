import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Settings, setMembership, shouldAutoReply } from '../src/settings.js';
import { AI } from '../src/ai.js';
import { handleCommand } from '../src/commands.js';
import { menuText } from '../src/menu.js';

test('settings persist concurrent changes across restart', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'manuka-test-'));
  try {
    const settings = await new Settings(join(dir, 'settings.json')).load();
    await Promise.all([
      settings.update(s => { s.mode = 'public'; }),
      settings.update(s => { s.autoChats = setMembership(s.autoChats, '123@s.whatsapp.net', true); })
    ]);
    const reloaded = await new Settings(settings.path).load();
    assert.equal(reloaded.data.mode, 'public');
    assert.deepEqual(reloaded.data.autoChats, ['123@s.whatsapp.net']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('auto-reply excludes own messages, groups and chats not enabled', () => {
  const data = { autoChats: ['123@s.whatsapp.net', 'group@g.us'] };
  const message = { key: { remoteJid: '123@s.whatsapp.net', fromMe: false } };
  assert.equal(shouldAutoReply(message, 'hello', data), true);
  assert.equal(shouldAutoReply({ key: { ...message.key, fromMe: true } }, 'hello', data), false);
  assert.equal(shouldAutoReply({ key: { remoteJid: 'group@g.us' } }, 'hello', data), false);
  assert.equal(shouldAutoReply({ key: { remoteJid: 'other@s.whatsapp.net' } }, 'hello', data), false);
});

test('AI isolates chat histories, resets and expires memory', async () => {
  const requests = []; let time = 0;
  const ai = new AI({ clock: () => time, request: async (_, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ message: { content: 'answer' } }) };
  } });
  await ai.answer('a', 'first'); await ai.answer('a', 'second'); await ai.answer('b', 'separate');
  assert.equal(requests[1].messages.length, 4);
  assert.equal(requests[2].messages.length, 2);
  ai.clear('a'); await ai.answer('a', 'reset');
  assert.equal(requests[3].messages.length, 2);
  time = 31 * 60 * 1000; ai.prune(); assert.equal(ai.histories.size, 0);
});

test('owner controls reject incoming commands before writing', async () => {
  let writes = 0;
  const settings = { data: {}, update: async () => { writes++; } };
  for (const command of ['mode', 'autoreply', 'settings']) {
    await assert.rejects(handleCommand({}, { key: { remoteJid: '123@s.whatsapp.net' } }, {}, { command, input: 'on' }, { settings }), /Owner/);
  }
  assert.equal(writes, 0);
});

test('menu reflects configured prefix and name', () => {
  const old = { prefix: process.env.PREFIX, name: process.env.BOT_NAME };
  try {
    process.env.PREFIX = '!'; process.env.BOT_NAME = 'CUSTOM';
    assert.match(menuText('public'), /CUSTOM/);
    assert.match(menuText('public'), /!autoreply/);
    assert.match(menuText('public'), /PUBLIC/);
  } finally {
    for (const [key, value] of [['PREFIX', old.prefix], ['BOT_NAME', old.name]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
