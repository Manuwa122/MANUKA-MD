// Original royalty-free MANUKA-MD intro melody, generated locally as a short WAV.
export function jingleWav() {
  const rate=16000, seconds=3.4, samples=Math.floor(rate*seconds), audio=Buffer.alloc(samples*2);
  const melody=[[0,523.25,.28],[.32,659.25,.28],[.64,783.99,.35],[1.03,1046.50,.48],[1.62,783.99,.28],[1.94,1046.50,.72]];
  for(let i=0;i<samples;i++){
    const t=i/rate;let v=0;
    for(const [start,hz,len] of melody){
      const dt=t-start;if(dt<0||dt>len)continue;
      const fade=Math.min(1,dt/.035,(len-dt)/.11);
      v+=Math.max(0,fade)*(.22*Math.sin(2*Math.PI*hz*dt)+.055*Math.sin(2*Math.PI*hz*2*dt));
    }
    v*=Math.min(1,t/.04,(seconds-t)/.15);
    audio.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v*28000))),i*2);
  }
  const wav=Buffer.alloc(44+audio.length);
  wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
  wav.write('data',36);wav.writeUInt32LE(audio.length,40);audio.copy(wav,44);
  return wav;
}
