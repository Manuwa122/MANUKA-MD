import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, unwrap, textOf, downloadURL, adminAllowed } from '../src/utils.js';
test('commands accept custom prefix, captions, and preserve input', () => {
 assert.equal(parseCommand('hello'), null);
 assert.deepEqual(parseCommand('!AI hello world', '!'), { command: 'ai', args: ['hello','world'], input: 'hello world' });
 assert.equal(textOf(unwrap({ ephemeralMessage: { message: { imageMessage: { caption: '.s' } } } })), '.s');
});
test('downloader rejects arbitrary hosts and credentials', () => {
 for (const url of ['http://youtube.com/a', 'https://127.0.0.1/a', 'https://youtube.com.evil.test/a', 'https://user@youtube.com/a', 'file:///etc/passwd']) assert.throws(() => downloadURL(url));
 assert.equal(downloadURL('https://youtu.be/example'), 'https://youtu.be/example');
});
test('group management requires both admins', () => {
 const people = [{id:'user',admin:'admin'}, {id:'bot',admin:null}];
 assert.equal(adminAllowed(people,'user','bot'), false);
 people[1].admin = 'admin';
 assert.equal(adminAllowed(people,'user','bot'), true);
 assert.equal(adminAllowed(people,'stranger','bot'), false);
});
