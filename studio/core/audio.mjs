// Generic file audio. Timing is in shot frames; offsets are seconds in the source.
import {isLayerLocked} from './layers.mjs';
export const AUDIO_OPERATIONS=['setAudioMix','moveAudio','trimAudio','splitAudio','linkAudio','detachAudio','resetAudioFades'];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const int=(n,min,max)=>assert(Number.isSafeInteger(n)&&n>=min&&n<=max,'Invalid audio frame range');
export function validateAudio(project){
 for(const shot of project.shots)for(const e of shot.entities){
  if(e.mix!==undefined){assert(project.renderer==='canvas2d'&&e.type==='audioCue'&&e.cue.voice==='file','Mix controls require Canvas2D file audio');assert(e.mix&&Object.keys(e.mix).every(k=>['role','solo'].includes(k))&&['music','voice','sfx'].includes(e.mix.role)&&typeof e.mix.solo==='boolean','Invalid audio mix');}
  if(e.cue?.envelope!==undefined){const a=e.cue.envelope;assert(project.renderer==='canvas2d'&&a&&Object.keys(a).every(k=>['startFrame','durationFrames'].includes(k)),'Invalid audio envelope');int(a.startFrame,-216000,432000);int(a.durationFrames,1,216000);}
  if(e.cue?.playbackRate!==undefined)assert(project.renderer==='canvas2d'&&Number.isFinite(e.cue.playbackRate)&&e.cue.playbackRate>=.1&&e.cue.playbackRate<=8,'Invalid audio playback speed');
  if(e.cue?.linkedVideoId!==undefined){const v=shot.entities.find(v=>v.id===e.cue.linkedVideoId);assert(project.renderer==='canvas2d'&&v?.layer?.binding==='video','Linked video must be in the same scene');assert(e.cue.frame===v.layer.startFrame&&e.cue.durationFrames===v.layer.endFrame-v.layer.startFrame&&e.cue.offsetSeconds===v.content.offsetSeconds&&(e.cue.playbackRate??1)===v.content.playbackRate,'Linked audio timing must match its video');assert(shot.entities.filter(x=>x.cue?.linkedVideoId===v.id).length===1,'Video already has linked audio');}
 }
}
const sync=(cue,v)=>Object.assign(cue,{frame:v.layer.startFrame,durationFrames:v.layer.endFrame-v.layer.startFrame,offsetSeconds:v.content.offsetSeconds,playbackRate:v.content.playbackRate});
export function applyAudioOperation(project,op){
 assert(project.renderer==='canvas2d','Generic audio requires Canvas2D');
 const shot=project.shots.find(s=>s.entities.some(e=>e.id===op.targetId)),e=shot?.entities.find(e=>e.id===op.targetId);assert(e?.type==='audioCue'&&e.cue.voice==='file','Choose a file audio clip');const c=e.cue;
 if(op.type==='setAudioMix'){assert(op.patch&&Object.keys(op.patch).length&&Object.keys(op.patch).every(k=>['role','solo'].includes(k)),'Invalid audio mix patch');e.mix={role:'sfx',solo:false,...e.mix,...op.patch};return;}
 if(op.type==='resetAudioFades'){delete c.envelope;return;}
 if(op.type==='detachAudio'){delete c.linkedVideoId;return;}
 if(op.type==='linkAudio'){const v=shot.entities.find(e=>e.id===op.videoId);assert(v?.layer?.binding==='video','Choose a video in this scene');assert(!isLayerLocked(shot,v.id),'Unlock the video before linking');delete c.envelope;c.linkedVideoId=v.id;sync(c,v);return;}
 assert(!c.linkedVideoId,'Detach audio to edit its timing independently, or edit its video');
 const start=c.frame,end=start+c.durationFrames,fps=project.fps.num/project.fps.den;
 if(op.type==='moveAudio'){int(op.startFrame,0,shot.durationFrames-1);const delta=op.startFrame-start;c.frame=op.startFrame;if(c.envelope)c.envelope.startFrame+=delta;for(const keys of Object.values(e.keyframes))for(const k of keys)k.frame+=delta;for(const n of project.annotations)if(n.targetId===e.id)n.frame+=delta;}
 else if(op.type==='trimAudio'){int(op.startFrame,start,Math.min(end-1,shot.durationFrames-1));int(op.endFrame,op.startFrame+1,end);c.offsetSeconds+=(op.startFrame-start)/fps*(c.playbackRate??1);c.frame=op.startFrame;c.durationFrames=op.endFrame-op.startFrame;}
 else if(op.type==='splitAudio'){int(op.frame,start+1,Math.min(end-1,shot.durationFrames-1));c.envelope??={startFrame:start,durationFrames:c.durationFrames};const copy=structuredClone(e);copy.id=op.id;copy.name=e.name.slice(0,190)+' · split';copy.cue.frame=op.frame;copy.cue.durationFrames=end-op.frame;copy.cue.offsetSeconds+=(op.frame-start)/fps*(c.playbackRate??1);c.durationFrames=op.frame-start;shot.entities.push(copy);for(const n of project.annotations)if(n.targetId===e.id&&n.frame>=op.frame)n.targetId=copy.id;}
}
// A linked pair follows visual edit operations atomically, including split and deletion.
export function linkedBefore(project){return project.shots.flatMap(s=>s.entities.filter(e=>e.cue?.linkedVideoId).map(e=>({shotId:s.id,audio:structuredClone(e),video:structuredClone(s.entities.find(v=>v.id===e.cue.linkedVideoId))})));}
export function syncLinked(project,before,op){
 for(const b of before){const s=project.shots.find(s=>s.id===b.shotId);if(!s)continue;let a=s.entities.find(e=>e.id===b.audio.id);const v=s.entities.find(e=>e.id===b.video.id);
  if(!v){s.entities=s.entities.filter(e=>e.id!==b.audio.id);for(const n of project.annotations)if(n.targetId===b.audio.id)delete n.targetId;continue;}
  if(!a||a.cue.linkedVideoId!==v.id)continue;
  if(['moveClip','stretchClip'].includes(op.type)&&op.targetId===v.id){const delta=v.layer.startFrame-b.video.layer.startFrame,ratio=(v.layer.endFrame-v.layer.startFrame)/(b.video.layer.endFrame-b.video.layer.startFrame);for(const keys of Object.values(a.keyframes))for(const k of keys)k.frame=op.type==='moveClip'?k.frame+delta:Math.round(v.layer.startFrame+(k.frame-b.video.layer.startFrame)*ratio);for(const n of project.annotations)if(n.targetId===a.id)n.frame=op.type==='moveClip'?n.frame+delta:Math.round(v.layer.startFrame+(n.frame-b.video.layer.startFrame)*ratio);}
  if(op.type==='moveClip'&&op.targetId===v.id&&a.cue.envelope)a.cue.envelope.startFrame+=v.layer.startFrame-b.video.layer.startFrame;
  if(op.type==='stretchClip'&&op.targetId===v.id&&a.cue.envelope){const ratio=(v.layer.endFrame-v.layer.startFrame)/(b.video.layer.endFrame-b.video.layer.startFrame);a.cue.envelope.startFrame=Math.round(v.layer.startFrame+(a.cue.envelope.startFrame-b.video.layer.startFrame)*ratio);a.cue.envelope.durationFrames=Math.max(1,Math.round(a.cue.envelope.durationFrames*ratio));}
  if(op.type==='splitClip'&&op.targetId===v.id)a.cue.envelope??={startFrame:b.audio.cue.frame,durationFrames:b.audio.cue.durationFrames};
  sync(a.cue,v);
  if(['splitClip','duplicateLayer'].includes(op.type)&&op.targetId===v.id){const copy=structuredClone(b.audio),video=s.entities.find(e=>e.id===op.id);copy.id=op.id+':audio';copy.name=copy.name.slice(0,190)+' copy';copy.cue.linkedVideoId=video.id;if(op.type==='splitClip')copy.cue.envelope=structuredClone(a.cue.envelope);sync(copy.cue,video);s.entities.push(copy);if(op.type==='splitClip')for(const n of project.annotations)if(n.targetId===a.id&&n.frame>=op.frame)n.targetId=copy.id;}
 }
}
