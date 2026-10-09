import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FeatureStore, handleFeature } from '../src/features.js';

test('concurrent personal updates persist, isolate users and roll back invalid changes', async () => {
 const dir = await mkdtemp(join(tmpdir(), 'features-'));
 try {
  const features = await new FeatureStore(join(dir, 'data.json')).load();
  const calls = [];
  const sock = { sendMessage: async (jid, content) => calls.push(content) };
  const msg = { key: { remoteJid: 'user@s.whatsapp.net' } };
  const run = (command, input, key = 'a') => handleFeature(sock, msg, {}, { command, input }, { features }, key);
  await Promise.all([run('note', 'add one'), run('task', 'add two'), run('expense', 'add 350 lunch', 'b')]);
  await run('task', 'done 1');
  await assert.rejects(run('expense', 'add -5 bad'));
  const reloaded = await new FeatureStore(features.path).load();
  assert.equal(reloaded.data.a.notes[0].text, 'one');
  assert.equal(reloaded.data.a.tasks[0].done, true);
  assert.equal(reloaded.data.a.expenses.length, 0);
  assert.equal(reloaded.data.b.expenses[0].amount, 350);
  await run('mydata', 'clear CONFIRM');
  assert.equal(features.data.a.notes.length, 0);
  assert.equal(features.data.b.expenses.length, 1);
 } finally { await rm(dir, { recursive: true, force: true }); }
});

test('personal commands are blocked in groups and polls validate before sending', async () => {
 const calls = [];
 const sock = { sendMessage: async (jid, content) => calls.push(content) };
 const msg = { key: { remoteJid: 'group@g.us' } };
 await assert.rejects(handleFeature(sock, msg, {}, { command: 'note', input: 'list' }, {}, 'a'));
 await assert.rejects(handleFeature(sock, msg, {}, { command: 'poll', input: 'Q | Yes | Yes' }, {}, 'a'));
 assert.equal(calls.length, 0);
 await handleFeature(sock, msg, {}, { command: 'poll', input: 'Q | Yes | No' }, {}, 'a');
 assert.deepEqual(calls[0].poll, { name: 'Q', values: ['Yes', 'No'], selectableCount: 1 });
});

test('AI tool sessions are separate and support quoted text', async () => {
 const calls = [];
 await handleFeature({ sendMessage: async () => {} }, { key: { remoteJid: 'a@s.whatsapp.net' } }, { extendedTextMessage: { contextInfo: { quotedMessage: { conversation: 'hello' } } } }, { command: 'summarize', input: '' }, { ai: { answer: async (...args) => { calls.push(args); return 'summary'; } } }, 'a');
 assert.equal(calls[0][0], 'a:tool:summarize');
 assert.match(calls[0][1], /hello/);
});
