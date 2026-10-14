import {fetchInput} from './input-asset.mjs';
// The same planar PCM is used by playback, waveform, checks and export.
export function audioClips(project){let start=0;const clips=[];for(const shot of project.shots){for(const entity of shot.entities)if(entity.cue?.voice==='file')clips.push({entity,shot,start});start+=shot.durationFrames;}return clips;}
function curve(entity,property){const keys=entity.keyframes[property]||[],base=entity.properties[property];let next=1;return frame=>{if(!keys.length)return base;if(frame<=keys[0].frame)return keys[0].value;while(next<keys.length&&keys[next].frame<=frame)next++;if(next>=keys.length)return keys.at(-1).value;const a=keys[next-1],b=keys[next];let u=(frame-a.frame)/(b.frame-a.frame);if(a.easing==='hold')u=0;else if(a.easing==='ease')u=u*u*(3-2*u);return a.value+(b.value-a.value)*u;};}
const enabled=(clips,e)=>!e.properties.muted&&(!clips.some(c=>c.entity.mix?.solo)||e.mix?.solo);
export async function mixAudio(project,sources,{duration,sampleRate=48000,signal,onlyId,yieldTask=()=>new Promise(r=>setTimeout(r,0))}={}){
 const fps=project.fps.num/project.fps.den,total=project.shots.reduce((n,s)=>n+s.durationFrames,0)/fps;
 duration??=total;if(!Number.isFinite(duration)||duration<=0||duration>total+.001||!Number.isSafeInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Invalid audio render request');
 signal?.throwIfAborted();const count=Math.round(duration*sampleRate);if(count>32_000_000)throw new Error('Audio mix exceeds this browser render budget (32 million samples per channel). Use a shorter project.');
 const channels=[new Float32Array(count),new Float32Array(count)],clips=audioClips(project),events=[];let work=0;
 for(const {entity:e,start} of clips){signal?.throwIfAborted();if(onlyId?e.id!==onlyId:!enabled(clips,e))continue;const c=e.cue,source=sources.get(c.src);if(!source)throw new Error('Audio source is not decoded: '+e.name);
  const begin=(start+c.frame)/fps,end=Math.min(duration,begin+c.durationFrames/fps),first=Math.round(begin*sampleRate),last=Math.min(count,Math.round(end*sampleRate)),rate=c.playbackRate??1,srcChannels=source.channels,srcRate=source.sampleRate,srcFrames=srcChannels[0].length;
  if(first>=count)continue;
  let peak=0,firstSound=null;const gainCurve=curve(e,'gain'),inCurve=curve(e,'fadeIn'),outCurve=curve(e,'fadeOut');
  const gainAt=i=>{const local=(i/sampleRate-start/fps)*fps,fadeIn=inCurve(local),fadeOut=outCurve(local),envelopeStart=(start+(c.envelope?.startFrame??c.frame))/fps,elapsed=i/sampleRate-envelopeStart,remaining=envelopeStart+(c.envelope?.durationFrames??c.durationFrames)/fps-i/sampleRate;return(e.properties.muted?0:gainCurve(local))*Math.max(0,Math.min(1,fadeIn>0?elapsed/fadeIn:1,fadeOut>0?remaining/fadeOut:1));};
  for(let i=first;i<last;i++){
   const pos=(c.offsetSeconds+(i-first)/sampleRate*rate)*srcRate,at=Math.floor(pos),f=pos-at;if(at>=srcFrames)break;
   const gain=gainAt(i);
   for(let ch=0;ch<2;ch++){const data=srcChannels[Math.min(ch,srcChannels.length-1)],value=(data[at]*(1-f)+(data[Math.min(at+1,srcFrames-1)]||0)*f)*gain;channels[ch][i]+=value;peak=Math.max(peak,Math.abs(value));if(firstSound===null&&Math.abs(value)>.001)firstSound=i/sampleRate;}
   if(++work%131072===0){await yieldTask();signal?.throwIfAborted();}
  }
  events.push({id:e.id,name:e.name,startSeconds:begin,endSeconds:end,firstSound,peak,sourceEndsEarly:c.offsetSeconds+(last-first)/sampleRate*rate>srcFrames/srcRate+1/fps});
 }
 return{sr:sampleRate,sampleRate,channels,numberOfFrames:count,startTime:0,events};
}
export function analyzeAudio(audio,{fps=24,silenceSeconds=.5}={}){
 const {channels,sr}=audio,n=channels[0].length;let peak=0,clippingSamples=0,nonFiniteSamples=0;const silent=[],window=Math.max(1,Math.round(sr*.02));let quiet=null;
 for(let i=0;i<n;i+=window){let power=0;for(let j=i;j<Math.min(n,i+window);j++)for(const c of channels){const v=c[j];if(!Number.isFinite(v)){nonFiniteSamples++;continue;}peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>=1)clippingSamples++;power+=v*v;}
  const active=(audio.events||[]).some(e=>e.peak>.001&&i/sr>=e.startSeconds&&i/sr<e.endSeconds),low=active&&Math.sqrt(power/(window*channels.length))<.001;
  if(low&&quiet===null)quiet=i;else if(!low&&quiet!==null){if((i-quiet)/sr>=silenceSeconds)silent.push({from:quiet/sr,to:i/sr});quiet=null;}
 }
 if(quiet!==null&&(n-quiet)/sr>=silenceSeconds)silent.push({from:quiet/sr,to:n/sr});
 return{sampleRate:sr,channels:channels.length,durationSeconds:n/sr,peak,clippingSamples,nonFiniteSamples,silenceCandidates:silent,sourceEndsEarly:(audio.events||[]).filter(e=>e.sourceEndsEarly).map(e=>e.id),silentClips:(audio.events||[]).filter(e=>e.peak<=.001).map(e=>e.id),events:audio.events||[],frameToleranceSeconds:1/fps};
}
export function waveform(channels,width=800){const n=channels[0].length,out=new Float32Array(width);for(let x=0;x<width;x++)for(let i=Math.floor(x*n/width);i<Math.floor((x+1)*n/width);i++)for(const c of channels)out[x]=Math.max(out[x],Math.abs(c[i]));return out;}
export async function createAudio(project,{signal}={}){
 const clips=audioClips(project),sources=new Map(),controller=new AbortController();let disposed=false,cache=null,pending=null,rendering=new AbortController();
 const abort=()=>controller.abort(signal?.reason);if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});const decoding=clips.length?new AudioContext({sampleRate:48000}):null;
 try{for(const src of new Set(clips.map(c=>c.entity.cue.src))){const bytes=await fetchInput(src,{signal:controller.signal});const b=await decoding.decodeAudioData(bytes);if([...sources.values()].reduce((n,s)=>n+s.channels[0].length*s.channels.length,0)+b.length*Math.min(2,b.numberOfChannels)>64_000_000)throw new Error('Decoded audio exceeds the browser memory budget');controller.signal.throwIfAborted();sources.set(src,{sampleRate:b.sampleRate,channels:Array.from({length:Math.min(2,b.numberOfChannels)},(_,i)=>b.getChannelData(i).slice())});}}
 catch(e){controller.abort();signal?.removeEventListener('abort',abort);throw new Error('Audio could not load: '+e.message);}finally{await decoding?.close();}
 const audio=async({duration,sampleRate=48000}={})=>{if(disposed)throw new Error('Audio disposed');const key=JSON.stringify([duration,sampleRate]);if(cache?.key===key)return cache.value;if(pending?.key===key)return pending.promise;const promise=mixAudio(project,sources,{duration,sampleRate,signal:rendering.signal}).then(value=>{if(!disposed)cache={key,value};return value;}).finally(()=>{if(pending?.promise===promise)pending=null;});pending={key,promise};return promise;};
 return{audio,cancel(){rendering.abort();rendering=new AbortController();pending=null;},async clip(id,sampleRate=12000){const record=clips.find(c=>c.entity.id===id);if(!record)throw new Error('Choose an audio clip');const duration=project.shots.reduce((n,s)=>n+s.durationFrames,0)*project.fps.den/project.fps.num,result=await mixAudio(project,sources,{duration,sampleRate,onlyId:id,signal:rendering.signal}),offsetFrame=record.start+record.entity.cue.frame,fps=project.fps.num/project.fps.den,first=Math.round(offsetFrame/fps*sampleRate),last=Math.min(result.numberOfFrames,Math.round((offsetFrame+record.entity.cue.durationFrames)/fps*sampleRate));return{...result,channels:result.channels.map(c=>c.slice(first,last)),offsetFrame,frameCount:(last-first)/sampleRate*fps};},async inspect(){return analyzeAudio(await audio({duration:project.shots.reduce((n,s)=>n+s.durationFrames,0)*project.fps.den/project.fps.num,sampleRate:48000}),{fps:project.fps.num/project.fps.den});},dispose(){disposed=true;controller.abort();rendering.abort();signal?.removeEventListener('abort',abort);cache=null;pending=null;sources.clear();}};
}
