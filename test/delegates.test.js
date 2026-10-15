import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Settings } from '../src/settings.js';
import { delegatedPermission,normalizeDelegateNumber,delegateCommand } from '../src/delegates.js';
import { handleCommand } from '../src/commands.js';

test('owner grants and revokes safe delegated command access, persisted across reload',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'delegates-test-'));
 try{
  const settings=await new Settings(join(dir,'settings.json')).load();
  const sent=[];const sock={sendMessage:async(...a)=>sent.push(a)};
  const owner={key:{fromMe:true,remoteJid:'admin@s.whatsapp.net'}};
  await handleCommand(sock,owner,{},{command:'delegate',input:'add 94771234567'},{settings});
  const id=normalizeDelegateNumber('94771234567');
  assert.ok(settings.data.delegatedOperators.includes(id));
  const member={key:{fromMe:false,remoteJid:id}};
  assert.equal(delegatedPermission(member,'ping',settings.data),true);
  assert.equal(delegatedPermission(member,'groupexport',settings.data),false);
  assert.equal(delegatedPermission(member,'delegate',settings.data),false);
  const restored=await new Settings(settings.path).load();
  assert.equal(delegatedPermission(member,'ai',restored.data),true);
  await handleCommand(sock,owner,{},{command:'delegate',input:'remove 94771234567'},{settings});
  assert.equal(delegatedPermission(member,'ping',settings.data),false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('non-owner cannot add operators and invalid numbers are rejected',async()=>{
 const settings={data:{delegatedOperators:[]},update:async()=>assert.fail('no write')};
 await assert.rejects(delegateCommand({},{key:{fromMe:false,remoteJid:'other@s.whatsapp.net'}},'add 94771234567',settings),/Only the original/);
 assert.throws(()=>normalizeDelegateNumber('not-a-number'),/country-code/);
});
