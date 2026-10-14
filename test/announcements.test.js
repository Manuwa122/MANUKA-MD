import test from 'node:test';
import assert from 'node:assert/strict';
import { announcementText, sendAnnouncement } from '../src/announcements.js';
test('announcements use distinct scripts for alive and ping',()=>{
 assert.match(announcementText('alive','MANUKA-MD'),/online/);
 assert.match(announcementText('ping','MANUKA-MD'),/Pong/);
 assert.throws(()=>announcementText('wrong'),/Unsupported/);
});
test('voice generation failure is nonfatal and leaves text intact',async()=>{
 const success=await sendAnnouncement({sendMessage:async()=>assert.fail('must not send')},'chat@s.whatsapp.net','ping',null,{python:'/no-such-python-executable'});
 assert.equal(success,false);
});
