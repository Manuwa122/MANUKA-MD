import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { MultiUserManager } from '../src/multiuser.js';

test('multi-user requests require matching own number; only approved bots launch and persist',async()=>{
 const root=await mkdtemp(join(tmpdir(),'manuka-multi-'));
 const spawns=[], messages=[];
 const spawn=(file,args,opts)=>{const p=new EventEmitter();p.stdout=new EventEmitter();p.stderr=new EventEmitter();p.kill=()=>{p.emit('exit',0)};spawns.push({file,opts,p});return p};
 try{
  const m=new MultiUserManager({root,spawn,max:1});await m.init();
  await assert.rejects(m.request('94771111111@s.whatsapp.net','94772222222',async()=>{}),/use your own WhatsApp number/);
  assert.match(await m.request('94771111111@s.whatsapp.net','94771111111',async x=>messages.push(x)),/approval requested/);
  assert.match(await m.request('107654321098765@lid','94772222222',async x=>messages.push(x)),/approval requested/);
  assert.match(m.list(),/pending/);
  assert.equal(spawns.length,0);
  assert.match(m.list(),/pending/);
  await m.approve('94771111111',async(to,text)=>messages.push({to,text}));
  assert.equal(spawns.length,1);
  assert.match(spawns[0].opts.env.AUTH_DIR,/auth$/);
  assert.equal(spawns[0].opts.env.MULTIUSER_CHILD,'1');
  spawns[0].p.stdout.emit('data',Buffer.from('PRIVATE WHATSAPP PAIRING CODE: ABCD1234\n'));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(messages.at(-1).to,'94771111111@s.whatsapp.net');
  assert.match(messages.at(-1).text,/ABCD1234/);
  await m.stop('94771111111');
  assert.match(m.list(),/stopped/);
  const second=new MultiUserManager({root,spawn,max:1});await second.init();
  assert.match(second.list(),/stopped/);
  await second.remove('94771111111');
  assert.equal(second.list(),'No bot requests.');
 }finally{await rm(root,{recursive:true,force:true});}
});
