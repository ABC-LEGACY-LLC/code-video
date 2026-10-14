import {bounded} from './audit.mjs';
// Read ISO BMFF tables independently of the encoder. Bounds are checked before access.
export function readMP4(buffer){
 const v=new DataView(buffer),u=(p)=>v.getUint32(p),type=p=>String.fromCharCode(...new Uint8Array(buffer,p,4));
 function boxes(start,end){const out=[];for(let p=start;p<end;){if(p+8>end)throw new Error('Truncated MP4 box');const size=u(p);if(size<8||p+size>end)throw new Error('Invalid MP4 box size');out.push({type:type(p+4),start:p+8,end:p+size});p+=size;}return out;}
 const child=(b,name)=>{const o=boxes(b.start,b.end).find(b=>b.type===name);if(!o)throw new Error('Missing MP4 '+name);return o;};
 const moov=boxes(0,buffer.byteLength).find(b=>b.type==='moov');if(!moov)throw new Error('Missing MP4 movie');
 return boxes(moov.start,moov.end).filter(b=>b.type==='trak').map(trak=>{
  const mdia=child(trak,'mdia'),hdlr=child(mdia,'hdlr'),kind=type(hdlr.start+8),mdhd=child(mdia,'mdhd'),scale=u(mdhd.start+12),duration=u(mdhd.start+16)/scale,stbl=child(child(mdia,'minf'),'stbl'),stsz=child(stbl,'stsz'),count=u(stsz.start+8),fixed=u(stsz.start+4),stsd=child(stbl,'stsd'),entry=boxes(stsd.start+8,stsd.end)[0];
  if(!count||count>10000000||(!fixed&&stsz.start+12+count*4>stsz.end))throw new Error('Invalid sample table');
  const stco=child(stbl,'stco'),stsc=child(stbl,'stsc');if(u(stco.start+4)!==1||u(stsc.start+4)!==1)throw new Error('Unsupported export chunk layout');
  let offset=u(stco.start+8);const samples=[];for(let i=0;i<count;i++){const size=fixed||u(stsz.start+12+i*4);if(offset+size>buffer.byteLength)throw new Error('Truncated media sample');samples.push(new Uint8Array(buffer,offset,size));offset+=size;}
  const result={kind,scale,duration,count,codec:entry.type,samples};if(kind==='vide'){result.width=v.getUint16(entry.start+24);result.height=v.getUint16(entry.start+26);const config=boxes(entry.start+78,entry.end).find(b=>['avcC','vpcC'].includes(b.type));if(config)result.description=new Uint8Array(buffer,config.start,config.end-config.start);const sync=boxes(stbl.start,stbl.end).find(b=>b.type==='stss');result.keys=sync?Array.from({length:u(sync.start+4)},(_,i)=>u(sync.start+8+i*4)):samples.map((_,i)=>i+1);}
  return result;
 });
}
export function envelope(channels,sr,step=.01){const n=Math.ceil(channels[0].length/(sr*step)),out=[];for(let k=0;k<n;k++){let power=0,count=0;for(let i=Math.floor(k*sr*step);i<Math.min(channels[0].length,Math.floor((k+1)*sr*step));i++)for(const c of channels){power+=c[i]*c[i];count++;}out.push(Math.sqrt(power/Math.max(1,count)));}return out;}
export function audioTiming(reference,decoded,fps){
 const a=envelope(reference.channels,reference.sr),b=envelope(decoded.channels,decoded.sr),peak=Math.max(...a);if(peak<.001)return{status:Math.max(...b)<.002?'REVIEW':'FAIL',method:'silence',reason:'No timing landmark in silent audio',offsetSeconds:null};
 // Locate a strong changing envelope. Flat material has no defensible timing landmark.
 const min=Math.min(...a);if(peak-min<peak*.1)return{status:'REVIEW',method:'envelope',reason:'Audio has no distinct timing landmark',offsetSeconds:null};
 let best={error:Infinity,lag:0};for(let lag=-25;lag<=25;lag++){let sum=0,n=0;for(let i=0;i<Math.max(a.length,b.length);i++){const j=i+lag;sum+=((a[i]||0)-(b[j]||0))**2;n++;}const error=sum/Math.max(n,1);if(n&&(error<best.error||error===best.error&&Math.abs(lag)<Math.abs(best.lag)))best={error,lag};}
 if(!Number.isFinite(best.error))return{status:'REVIEW',method:'envelope',reason:'Clip is too short for timing comparison',offsetSeconds:null};
 const offsetSeconds=best.lag*.01;return{status:Math.abs(offsetSeconds)<=1/fps&&Math.sqrt(best.error)<Math.max(.01,peak*.25)?'PASS':'FAIL',method:'10 ms RMS envelope, +/-250 ms search',offsetSeconds,rmsError:Math.sqrt(best.error),toleranceSeconds:1/fps};
}
export async function verifyExport(blob,{width,height,fps,frames,audio,signal,onProgress=()=>{}}){
 const tracks=readMP4(await blob.arrayBuffer()),video=tracks.find(t=>t.kind==='vide'),sound=tracks.find(t=>t.kind==='soun'),expected=frames/fps;
 if(!video)throw new Error('Export contains no video');
 const findings=[],add=(rule,ok,message)=>findings.push({rule,status:ok?'PASS':'FAIL',message});
 add('frame-count',video.count===frames,`${video.count} encoded frames / ${frames} expected`);add('dimensions',video.width===width&&video.height===height,`${video.width} x ${video.height}`);add('duration',Math.abs(video.duration-expected)<=1/fps,`${video.duration.toFixed(4)} seconds`);add('audio-track',!!sound===!!audio,audio?'Requested audio track is present':'No audio requested');
 let decodedFrames=0,decoder,decodeError,dimensionErrors=0;try{
  const config=video.codec==='avc1'?{codec:'avc1.'+Array.from(video.description.slice(1,4),n=>n.toString(16).padStart(2,'0')).join(''),description:video.description}:{codec:'vp09.00.40.08'};
  decoder=new VideoDecoder({output:frame=>{decodedFrames++;if(frame.displayWidth!==width||frame.displayHeight!==height)dimensionErrors++;frame.close();},error:e=>{decodeError=e;}});decoder.configure(config);
  for(let i=0;i<video.count;i++){signal?.throwIfAborted();if(decodeError)throw decodeError;decoder.decode(new EncodedVideoChunk({type:video.keys.includes(i+1)?'key':'delta',timestamp:Math.round(i*1e6/fps),data:video.samples[i]}));if(i%24===0){onProgress({stage:'verify-video',done:i,total:video.count});await bounded((async()=>{while(decoder.decodeQueueSize>4&&!decodeError){signal?.throwIfAborted();await new Promise(r=>setTimeout(r,0));}})(),signal);await new Promise(r=>setTimeout(r,0));}}
  await bounded(decoder.flush(),signal);if(decodeError)throw decodeError;add('decode-all-frames',decodedFrames===frames&&!dimensionErrors,`${decodedFrames} frames reopened and decoded`);
 }finally{try{decoder?.close();}catch{}}
 let timing=null;if(audio&&sound){onProgress({stage:'verify-audio',done:0,total:1});const ac=new AudioContext({sampleRate:audio.sr});try{const decoded=await bounded(ac.decodeAudioData(await blob.arrayBuffer()),signal,60000);add('audio-duration',Math.abs(decoded.duration-expected)<=Math.max(1/fps,.05),`${decoded.duration.toFixed(4)} seconds including codec padding`);timing=audioTiming(audio,{sr:decoded.sampleRate,channels:Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i))},fps);findings.push({rule:'audio-sync',...timing,message:timing.reason||`Audio offset ${timing.offsetSeconds.toFixed(3)} s`});}finally{await ac.close();}}
 signal?.throwIfAborted();return{schemaVersion:1,createdAt:new Date().toISOString(),findings,decodedFrames,timing,bytes:blob.size,limits:['Video frames were decoded; artistic quality was not certified.','Audio timing compares 10 ms energy envelopes, not phonemes. Flat audio requires review.','Audio duration allows one frame or 50 ms of codec padding.']};
}
