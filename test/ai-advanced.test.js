import test from 'node:test';
import assert from 'node:assert/strict';
import { AI, aiSettings } from '../src/ai.js';
test('advanced AI configuration is bounded and has useful defaults',()=>{
 assert.deepEqual(aiSettings({}),{maxTokens:1000,memoryTurns:6,temperature:0.5});
 assert.deepEqual(aiSettings({AI_MAX_TOKENS:'1600',AI_MEMORY_TURNS:'10',AI_TEMPERATURE:'0.35'}),{maxTokens:1600,memoryTurns:10,temperature:0.35});
 assert.equal(aiSettings({AI_MAX_TOKENS:'100000'}).maxTokens,1000);
});
test('Groq receives multilingual instructions and configurable context',async()=>{
 const old={AI_PROVIDER:process.env.AI_PROVIDER,GROQ_API_KEY:process.env.GROQ_API_KEY,AI_MAX_TOKENS:process.env.AI_MAX_TOKENS,AI_MEMORY_TURNS:process.env.AI_MEMORY_TURNS};
 process.env.AI_PROVIDER='groq';process.env.GROQ_API_KEY='gsk_test';
 process.env.AI_MAX_TOKENS='1600';process.env.AI_MEMORY_TURNS='2';
 const requests=[];const ai=new AI({request:async(_,o)=>{requests.push(JSON.parse(o.body));return {ok:true,json:async()=>({choices:[{message:{content:'OK'}}]})};}});
 try {
  for(let n=0;n<4;n++)await ai.answer('chat','meka mokakda '+n);
  assert.equal(requests[0].max_tokens,1600);
  assert.match(requests[0].messages[0].content,/Singlish/);
  assert.equal(requests.at(-1).messages.length,6);
  ai.clear('chat'); await ai.answer('chat','new');
  assert.equal(requests.at(-1).messages.length,2);
 } finally {
  for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});
