// Timeline operations use shot-frame coordinates. Offscreen keys are retained so
// trimming or moving a clip never approximates its interpolation curve.
import {isLayerLocked} from './layers.mjs';
export const EDITING_OPERATIONS=['moveClip','trimClip','stretchClip','splitClip','trimScene','editKeyframes'];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const integer=(n,min,max,label)=>assert(Number.isSafeInteger(n)&&n>=min&&n<=max,`${label} must be an integer between ${min} and ${max}`);
const editable=(shot,e)=>assert(!e.legacy?.readOnly&&(!e.layer||!isLayerLocked(shot,e.id)),'Unlock the layer and its parents before editing');
function keysMap(e,map){for(const [property,keys] of Object.entries(e.keyframes)){const result=keys.map(k=>({...k,frame:map(k.frame)}));assert(new Set(result.map(k=>k.frame)).size===result.length,'This stretch would merge keyframes; use a longer duration');e.keyframes[property]=result.sort((a,b)=>a.frame-b.frame);}}
function removedByTrim(shot,duration){
 const ids=new Set(shot.entities.filter(e=>e.layer&&e.layer.startFrame>=duration||e.cue&&e.cue.frame>=duration).map(e=>e.id));let changed=true;
 while(changed){changed=false;for(const e of shot.entities)if(e.layer&&ids.has(e.layer.parentId)&&!ids.has(e.id)){ids.add(e.id);changed=true;}}return ids;
}
export function timingImpact(project,shotId,duration){
 const s=project.shots.find(s=>s.id===shotId);if(!s)return null;const removed=removedByTrim(s,duration);
 return{layersRemoved:s.entities.filter(e=>e.layer&&removed.has(e.id)).length,keysOutside:s.entities.filter(e=>!removed.has(e.id)).reduce((n,e)=>n+Object.values(e.keyframes).flat().filter(k=>k.frame>=duration).length,0),cuesRemoved:s.entities.filter(e=>e.cue&&removed.has(e.id)).length,cuesCut:s.entities.filter(e=>e.cue&&e.cue.frame<duration&&e.cue.frame+e.cue.durationFrames>duration).length,notesRemoved:project.annotations.filter(n=>n.shotId===shotId&&(n.frame>=duration||removed.has(n.targetId))).length};
}
export function applyEditingOperation(project,op){
 if(op.type==='trimScene'){
  const shot=project.shots.find(s=>s.id===op.shotId);assert(shot,'Unknown scene');integer(op.durationFrames,1,36000,'Scene duration');shot.entities.forEach(e=>editable(shot,e));
  const duration=op.durationFrames,removed=removedByTrim(shot,duration);
  shot.entities=shot.entities.filter(e=>!removed.has(e.id));shot.layerOrder=shot.layerOrder.filter(id=>!removed.has(id));
  for(const e of shot.entities){if(e.layer)e.layer.endFrame=Math.min(e.layer.endFrame,duration);if(e.cue)e.cue.durationFrames=Math.min(e.cue.durationFrames,duration-e.cue.frame);}
  project.annotations=project.annotations.filter(n=>n.shotId!==shot.id||n.frame<duration&&!removed.has(n.targetId));shot.durationFrames=duration;return;
 }
 let shot,entity;for(const s of project.shots){const e=s.entities.find(e=>e.id===op.targetId);if(e){shot=s;entity=e;break;}}assert(entity,'Unknown timeline element');editable(shot,entity);
 if(op.type==='editKeyframes'){
  const keys=entity.keyframes[op.property];assert(Array.isArray(keys),'Choose an animated property');assert(Array.isArray(op.frames)&&op.frames.length>0&&new Set(op.frames).size===op.frames.length,'Choose different keyframes');assert(['move','copy','delete'].includes(op.action),'Choose move, copy or delete');
  const chosen=op.frames.map(f=>{const key=keys.find(k=>k.frame===f);assert(key,'Keyframe no longer exists');return key;});
  const keep=op.action==='copy'?keys:keys.filter(k=>!op.frames.includes(k.frame));
  if(op.action!=='delete'){
   integer(op.delta,-216000,216000,'Keyframe offset');for(const key of chosen){const frame=key.frame+op.delta;integer(frame,0,shot.durationFrames-1,'Keyframe destination');assert(!keep.some(k=>k.frame===frame),'A keyframe already occupies that frame');keep.push({...key,frame});}
  }
  entity.keyframes[op.property]=keep.sort((a,b)=>a.frame-b.frame);return;
 }
 assert(entity.type==='layer2d','Choose an individual visual clip');const layer=entity.layer,start=layer.startFrame,end=layer.endFrame;
 if(op.type==='moveClip'){
  integer(op.startFrame,0,shot.durationFrames-(end-start),'Clip start');const delta=op.startFrame-start;layer.startFrame+=delta;layer.endFrame+=delta;keysMap(entity,f=>f+delta);
  for(const note of project.annotations)if(note.targetId===entity.id){integer(note.frame+delta,0,shot.durationFrames-1,'Attached annotation destination');note.frame+=delta;}
 }else if(op.type==='trimClip'){
  integer(op.startFrame,start,end-1,'Trim in');integer(op.endFrame,op.startFrame+1,end,'Trim out');
  if(entity.layer.binding==='video')entity.content.offsetSeconds+=(op.startFrame-start)*project.fps.den/project.fps.num*entity.content.playbackRate;
  layer.startFrame=op.startFrame;layer.endFrame=op.endFrame;
 }else if(op.type==='stretchClip'){
  integer(op.durationFrames,1,shot.durationFrames-start,'Clip duration');const ratio=op.durationFrames/(end-start);keysMap(entity,f=>Math.round(start+(f-start)*ratio));layer.endFrame=start+op.durationFrames;
  if(entity.layer.binding==='video')entity.content.playbackRate/=ratio;
  for(const n of project.annotations)if(n.targetId===entity.id){n.frame=Math.round(start+(n.frame-start)*ratio);integer(n.frame,0,shot.durationFrames-1,'Attached annotation destination');}
 }else if(op.type==='splitClip'){
  integer(op.frame,start+1,end-1,'Split frame');const copy=structuredClone(entity);copy.id=op.id;copy.name=(entity.name.slice(0,190)+' · split');copy.layer.startFrame=op.frame;layer.endFrame=op.frame;
  if(copy.layer.binding==='video')copy.content.offsetSeconds+=(op.frame-start)*project.fps.den/project.fps.num*copy.content.playbackRate;
  shot.entities.push(copy);shot.layerOrder.splice(shot.layerOrder.indexOf(entity.id)+1,0,copy.id);for(const n of project.annotations)if(n.targetId===entity.id&&n.frame>=op.frame)n.targetId=copy.id;
 }else throw new Error('Unknown editing operation');
}
