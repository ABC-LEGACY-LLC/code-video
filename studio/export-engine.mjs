import {adaptLegacyPage} from './sdk/legacy.mjs';
import {verifyExport} from './export-verify.mjs';
import {bounded} from './audit.mjs';
const MP4=(()=>{
 const u8=n=>[n&255], u16=n=>[(n>>8)&255,n&255], u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
 const str=t=>[...t].map(c=>c.charCodeAt(0)), zero=n=>new Array(n).fill(0);
 const box=(type,...parts)=>{ const body=parts.flat(); return [...u32(body.length+8),...str(type),...body]; };
 const full=(type,ver,flags,...parts)=>box(type,[ver,(flags>>16)&255,(flags>>8)&255,flags&255],...parts);
 const MATRIX=[...u32(0x10000),...zero(12),...u32(0x10000),...zero(12),...u32(0x40000000)];
 /* a video track and, when there is sound, an audio track; each track's samples in one
    chunk (video, then audio), the index (moov) before the data */
 function file({codec,description,width,height,fps,samples,audio}){
  const T=Math.round(fps*1000), n=samples.length, vdur=n*1000, ms=Math.round(vdur/T*1000);
  const visual=(type,cfg)=>box(type,zero(6),u16(1),zero(16),u16(width),u16(height),u32(0x480000),u32(0x480000),zero(4),u16(1),zero(32),u16(24),u16(0xffff),cfg);
  const ventry=codec==='avc'?visual('avc1',box('avcC',[...description]))
   :visual('vp09',full('vpcC',1,0,u8(0),u8(40),u8(0x82),u8(1),u8(1),u8(1),u16(0)));
  const sound=(type,cfg)=>box(type,zero(6),u16(1),zero(8),u16(audio.channels),u16(16),zero(4),u32(audio.sr<<16>>>0),cfg);
  const desc=(tag,...body)=>{ const d=body.flat(); return [tag,d.length,...d]; };       // every one here is under 128 bytes
  const aentry=()=>audio.codec==='aac'
   ?sound('mp4a',full('esds',0,0,desc(3,u16(0),u8(0),desc(4,u8(0x40),u8(0x15),zero(3),u32(audio.bitrate),u32(audio.bitrate),desc(5,[...audio.description])),desc(6,u8(2)))))
   :(d=>sound('Opus',box('dOps',u8(0),u8(d[9]),u16(d[10]|d[11]<<8),u32((d[12]|d[13]<<8|d[14]<<16|d[15]<<24)>>>0),u16(d[16]|d[17]<<8),u8(0))))(audio.description);
  const runs=L=>{ const o=[]; for(const s of L){ const p=o[o.length-1]; if(p&&p[1]===s.dur) p[0]++; else o.push([1,s.dur]); } return o; };
  const trak=({id,kind,scale,dur,entry,L,stts,keys,off})=>box('trak',
   full('tkhd',0,3,u32(0),u32(0),u32(id),zero(4),u32(Math.round(dur/scale*1000)),zero(8),u16(0),u16(kind==='soun'?1:0),u16(kind==='soun'?0x100:0),zero(2),MATRIX,
    u32(kind==='vide'?width<<16:0),u32(kind==='vide'?height<<16:0)),
   box('mdia',
    full('mdhd',0,0,u32(0),u32(0),u32(scale),u32(dur),u16(0x55c4),u16(0)),
    full('hdlr',0,0,u32(0),str(kind),zero(12),str(kind==='vide'?'VideoHandler':'SoundHandler'),[0]),
    box('minf',
     kind==='vide'?full('vmhd',0,1,zero(8)):full('smhd',0,0,zero(4)),
     box('dinf',full('dref',0,0,u32(1),full('url ',0,1))),
     box('stbl',
      full('stsd',0,0,u32(1),entry),
      full('stts',0,0,u32(stts.length),stts.flatMap(([c,d])=>[...u32(c),...u32(d)])),
      keys?full('stss',0,0,u32(keys.length),keys.flatMap(u32)):[],
      full('stsc',0,0,u32(1),u32(1),u32(L.length),u32(1)),
      full('stsz',0,0,u32(0),u32(L.length),L.flatMap(s=>u32(s.data.byteLength))),
      full('stco',0,0,u32(1),u32(off))))));
  const bytes=L=>L.reduce((a,s)=>a+s.data.byteLength,0), vsize=bytes(samples), A=audio?audio.samples:[];
  const moov=off=>box('moov',
   full('mvhd',0,0,u32(0),u32(0),u32(1000),u32(ms),u32(0x10000),u16(0x100),zero(10),MATRIX,zero(24),u32(audio?3:2)),
   trak({id:1,kind:'vide',scale:T,dur:vdur,entry:ventry,L:samples,stts:[[n,1000]],keys:samples.flatMap((s,i)=>s.key?[i+1]:[]),off}),
   audio?trak({id:2,kind:'soun',scale:audio.sr,dur:A.reduce((a,s)=>a+s.dur,0),entry:aentry(),L:A,stts:runs(A),off:off+vsize}):[]);
  const ftyp=box('ftyp',str('isom'),u32(0x200),str('isom'),str('iso2'),str(codec==='avc'?'avc1':'vp09'),str('mp41'));
  const head=moov(ftyp.length+moov(0).length+8);
  return new Blob([new Uint8Array(ftyp),new Uint8Array(head),new Uint8Array([...u32(vsize+bytes(A)+8),...str('mdat')]),...samples.map(s=>s.data),...A.map(s=>s.data)],{type:'video/mp4'});
 }
 return {file};
})();
/* which encoder this browser has: H.264 where it is there, VP9 (also in an mp4) where not */
async function exportCodec(width,height,fps){
 if(!('VideoEncoder' in window)) return null;
 const big=width*height>1920*1088;
 for(const c of [{codec:'avc',config:{codec:big?'avc1.640033':'avc1.640028',avc:{format:'avc'}}},{codec:'vp9',config:{codec:'vp09.00.40.08'}}]){
  const config={...c.config,width,height,framerate:fps,bitrate:Math.round(Math.max(2e6,width*height*fps*0.18)),latencyMode:'quality'};
  try{ if((await VideoEncoder.isConfigSupported(config)).supported) return {...c,config}; }catch(e){}
 }
 return null;
}
/* THE SOUND OF AN EXPORT. A work that can render its sound offline (__renderAudio) gives
   the samples for the whole film; the part that belongs to the exported frames is cut out
   and encoded here: AAC where the browser has it, Opus where not. */
async function exportAudio(from,to,fps,environment={}){
 const W=environment.page; if(typeof W.__renderAudio!=='function'||!('AudioEncoder' in window)) return null;
 const r=await environment.renderer.audio({duration:environment.total/fps,sampleRate:48000}), sr=r.sr;
 const whole=r.channels?r.channels.map(c=>Float32Array.from(c)):[Float32Array.from(r.pcm)];
 const a=Math.round(from/fps*sr), b=Math.min(whole[0].length,Math.round((to+1)/fps*sr)), n=b-a, ch=whole.length; if(n<=0) return null;
 let cfg=null, codec=null;
 for(const [k,c] of [['aac','mp4a.40.2'],['opus','opus']]){ const t={codec:c,sampleRate:sr,numberOfChannels:ch,bitrate:ch>1?160000:96000};
  if(await AudioEncoder.isConfigSupported(t).then(x=>x.supported,()=>false)){ cfg=t; codec=k; break; } }
 if(!cfg) return null;
 const samples=[]; let description=null, failed=null;
 const enc=new AudioEncoder({error:e=>{ failed=e; },output:(c,m)=>{ const d=new Uint8Array(c.byteLength); c.copyTo(d);
  samples.push({data:d,dur:Math.round((c.duration||0)*sr/1e6)});
  if(m&&m.decoderConfig&&m.decoderConfig.description) description=new Uint8Array(m.decoderConfig.description.buffer||m.decoderConfig.description); }});
 enc.configure(cfg);
 try{
 const STEP=sr;                                        // a second at a time
 for(let i=0;i<n;i+=STEP){ environment.signal?.throwIfAborted();const m=Math.min(STEP,n-i), d=new Float32Array(m*ch);
  whole.forEach((c,k)=>d.set(c.subarray(a+i,a+i+m),k*m));
  const packet=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:m,numberOfChannels:ch,timestamp:Math.round(i*1e6/sr),data:d});try{enc.encode(packet);}finally{packet.close();}while(enc.encodeQueueSize>3){environment.signal?.throwIfAborted();if(failed)throw failed;await nextTurn();}await nextTurn(); }
 await (environment.bounded||((p)=>p))(enc.flush(),environment.signal,60000);if(failed) throw failed;
 if(!description||!samples.length) return null;
 return {codec,description,sr,channels:ch,bitrate:cfg.bitrate,samples,reference:{sr,channels:whole.map(c=>c.slice(a,b))}};
 }finally{try{enc.close();}catch{}}
}
const even=n=>Math.max(2,Math.round(n/2)*2);
const nextTurn=()=>new Promise(r=>{ const c=new MessageChannel(); c.port1.onmessage=()=>r(); c.port2.postMessage(0); });
/* a tab in the background stops drawing frames, so an export waits there, and says so */
const whileHidden=job=>!document.hidden||job.cancel?null:new Promise(r=>{
 const finish=()=>{ document.removeEventListener('visibilitychange',check); if(job.cancelWait===finish) job.cancelWait=null; r(); };
 const check=()=>{ if(!document.hidden||job.cancel) finish(); };
 job.cancelWait=finish; document.addEventListener('visibilitychange',check); check();
});

export async function encodeFrozen({page:W,manifest,from,to,width,sound,job,onStep=()=>{},onPause=()=>{},auditSnapshotId}){
 W.__pause?.();const preview=W.__getLayerPreview?.();if(preview)W.__setLayerPreview?.({...preview,soloId:null,selectedId:null,...(Object.hasOwn(preview,'transform')?{transform:null,transforms:null}:{})});
 const fps=W.__fps,total=W.__totalFrames,renderer=adaptLegacyPage(W,{fps,totalFrames:total}),environment={page:W,renderer,total,signal:job.controller.signal,bounded};
 const canvas=()=>[...W.document.querySelectorAll('canvas')].sort((a,b)=>b.width*b.height-a.width*a.height)[0];let encoder;
 try{
 const src=canvas(),native=W.__projectSize||src,w=even(width||native.width),h=even(w*native.height/native.width);
 const enc=await bounded(exportCodec(w,h,fps),job.controller.signal,15000); if(!enc) throw new Error('this browser has no video encoder (WebCodecs); a current Chrome, Edge or Firefox has');
 if(job.cancel) throw new Error('cancelled');
 const samples=[]; let description=null, failed=null;
 encoder=new VideoEncoder({error:e=>{ failed=e; },
  output:(chunk,meta)=>{ const d=new Uint8Array(chunk.byteLength); chunk.copyTo(d); samples.push({data:d,key:chunk.type==='key'});
   if(meta&&meta.decoderConfig&&meta.decoderConfig.description) description=new Uint8Array(meta.decoderConfig.description.buffer||meta.decoderConfig.description); }});
 encoder.configure(enc.config);
 const scaled=new OffscreenCanvas(w,h), g=scaled.getContext('2d'), turn=nextTurn;
 const paint=()=>new Promise(r=>W.requestAnimationFrame(()=>W.requestAnimationFrame(r)));
  /* a work whose sound follows its drawing records the frames as they are drawn, and its
     sound is made after them; the others render theirs first, while the film is as it was */
  const record=sound&&typeof W.__soundRecord==='function';
  let audio=sound&&!record?await bounded(exportAudio(from,to,fps,environment),job.controller.signal,60000):null;
  if(record) W.__soundRecord(true);
  for(let n=from,i=0;n<=to;n++,i++){
   if(document.hidden){ onPause(true); await whileHidden(job); onPause(false); }
   if(job.cancel) throw new Error('cancelled');
   if(failed) throw failed;

   if(typeof W.__frameTo==='function'){ await bounded(renderer.renderFrame({frame:n,width:w,height:h,quality:'export'}),job.controller.signal); }
   else { W.__seek(n/fps); await paint(); }             // a film on a clock draws on its own next frame
   const c=canvas(); g.drawImage(c,0,0,w,h);
   const frame=new VideoFrame(scaled,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
   encoder.encode(frame,{keyFrame:i%48===0}); frame.close();
   onStep(i+1,to-from+1);
   while(encoder.encodeQueueSize>3){job.controller.signal.throwIfAborted();if(failed)throw failed;await turn();}
   await turn();                                        // the studio stays answerable, and Cancel is heard
  }
  await bounded(encoder.flush(),job.controller.signal,60000); if(failed) throw failed;
  if(record){ W.__soundRecord(false); audio=await bounded(exportAudio(from,to,fps,environment),job.controller.signal,60000); }
  if(enc.codec==='avc'&&!description) throw new Error('the encoder gave no stream description');
  if(sound&&typeof W.__renderAudio==='function'&&!audio)throw new Error('Audio encoding failed; sound was requested');
  const blob=MP4.file({codec:enc.codec,description,width:w,height:h,fps,samples,audio});

  const verification=await verifyExport(blob,{width:w,height:h,fps,frames:to-from+1,audio:audio?.reference,signal:job.controller.signal,onProgress:p=>{onStep(p.done,p.total,p.stage);}});
  const report={...verification,snapshotId:manifest?.id||null,work:manifest.work,from,to,width:w,height:h,fps,auditSnapshotId:auditSnapshotId===manifest.id?manifest.id:null,snapshotLimit:manifest?null:'Legacy export: immutable source snapshot unavailable'};
  report.snapshot=manifest;report.environment={userAgent:navigator.userAgent};Object.defineProperty(blob,'studioReport',{value:report});
  if(verification.findings.some(f=>f.status==='FAIL'))throw new Error('Export verification failed: '+verification.findings.filter(f=>f.status==='FAIL').map(f=>f.rule).join(', '));
  return blob;
 }finally{try{encoder?.close();}catch{}try{W.__soundRecord?.(false);}catch{}}
}
