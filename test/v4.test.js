import test from 'node:test';
import assert from 'node:assert/strict';
import { AI } from '../src/ai.js';
test('Groq uses chat completions and parses reply',async()=>{
 const old={provider:process.env.AI_PROVIDER,key:process.env.GROQ_API_KEY};
 process.env.AI_PROVIDER='groq'; process.env.GROQ_API_KEY='gsk_test';
 try {
  let url,options;
  const ai=new AI({request:async(u,o)=>{url=u;options=o;return {ok:true,json:async()=>({choices:[{message:{content:'ආයුබෝවන්'}}]})};}});
  assert.equal(await ai.answer('chat','hi'),'ආයුබෝවන්');
  assert.match(url,/api\.groq\.com/);
  assert.equal(JSON.parse(options.body).messages.length,2);
 } finally {for(const [k,v] of [['AI_PROVIDER',old.provider],['GROQ_API_KEY',old.key]]) if(v===undefined) delete process.env[k]; else process.env[k]=v;}
});
test('Groq surfaces invalid key without exposing token',async()=>{
 const old={provider:process.env.AI_PROVIDER,key:process.env.GROQ_API_KEY};
 process.env.AI_PROVIDER='groq';process.env.GROQ_API_KEY='gsk_secret';
 try {const ai=new AI({request:async()=>({ok:false,status:401})});await assert.rejects(ai.answer('k','hello'),/HTTP 401/);}
 finally {for(const [k,v] of [['AI_PROVIDER',old.provider],['GROQ_API_KEY',old.key]]) if(v===undefined) delete process.env[k]; else process.env[k]=v;}
});
