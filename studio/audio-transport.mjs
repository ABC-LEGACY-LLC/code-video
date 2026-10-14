// Visual playback uses the audio device clock when sound is enabled.
export function createPlayback(page,runtime){
 let context=null,source=null,buffer=null,enabled=false,error=null,epoch=0,clockStart=0,base=0;
 const stop=()=>{epoch++;try{source?.stop();}catch{}source?.disconnect();source=null;};
 return{
  enabled:()=>enabled,state:()=>({enabled,playing:!!source,error}),stop,
  async enable(value){enabled=value;error=null;if(value){context||=new AudioContext({sampleRate:48000});await context.resume();}else stop();},
  async start(frame){stop();const ticket=epoch;base=performance.now();if(!enabled)return;try{context||=new AudioContext({sampleRate:48000});await context.resume();if(!buffer){const pcm=await runtime.audio({duration:page.__totalFrames/page.__fps,sampleRate:context.sampleRate});buffer=context.createBuffer(pcm.channels.length,pcm.channels[0].length,pcm.sr);pcm.channels.forEach((c,i)=>buffer.copyToChannel(c,i));}if(ticket!==epoch)return;source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(context.destination);clockStart=context.currentTime+.025;source.start(clockStart,frame/page.__fps);}catch(e){error=e.message;enabled=false;stop();throw e;}},
  elapsed:()=>enabled&&source?Math.max(0,context.currentTime-clockStart):Math.max(0,(performance.now()-base)/1000),
  dispose(){stop();buffer=null;context?.close();context=null;}
 };
}
