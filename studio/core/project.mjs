/* Shared authored data and operations. Browser and AI send the same operations. */
import {validateLayers,layerStates,isLayerLocked,applyLayerOperation,LAYER_OPERATIONS} from './layers.mjs';
import {validateComponents,componentFor,validatePropertyValue} from './component-schema.mjs';
import {validateLegacyVoice} from '../components/legacy.mjs';
export {layerTree,isLayerLocked,LAYER_OPERATIONS} from './layers.mjs';
import {EDITING_OPERATIONS,applyEditingOperation} from './editing.mjs';
import {SCENE_OPERATIONS,applySceneOperation} from './scenes.mjs';
import {AUDIO_OPERATIONS,applyAudioOperation,validateAudio,linkedBefore,syncLinked} from './audio.mjs';
import {TYPOGRAPHY_OPERATIONS,applyTypographyOperation,validateTypography} from './typography.mjs';
export const SCHEMA_VERSION=2;
const number=(min,max,unit,initial=0)=>({type:'number',min,max,unit,default:initial,animatable:true});
export const ENTITY_TYPES={
 camera2d:{x:number(-4000,4000,'px'),y:number(-4000,4000,'px'),zoom:number(0.1,8,'×',1)},
 object2d:{x:number(-4000,4000,'px'),y:number(-4000,4000,'px'),scale:number(0.1,8,'×',1),opacity:number(0,1,'',1)},
 layer2d:{x:number(-4000,4000,'px'),y:number(-4000,4000,'px'),scale:number(0.1,8,'×',1),rotation:number(-3600,3600,'°'),opacity:number(0,1,'',1)},
 effect:{strength:number(0,10,'',0),frequency:number(0.1,60,'Hz',12)},
 audioCue:{gain:number(0,4,'',1),muted:{type:'boolean',default:false,animatable:false},fadeIn:number(0,30,'s'),fadeOut:number(0,30,'s')},
 group:{},
 audio:{gain:number(0,4,'gain',1),muted:{type:'boolean',default:false,animatable:false}},
 camera3d:{az:number(-360,360,'°'),el:number(-89,89,'°'),distance:number(0.1,100,'units',7),fov:number(5,120,'°',27)}
};
const ID=/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,119}$/;
function assert(ok,message){if(!ok)throw new Error(message);}
export const isPlainRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
 &&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function record(value,what){assert(isPlainRecord(value),`${what} must be a plain object`);}
function id(value){assert(typeof value==='string'&&ID.test(value),'invalid stable ID');}
function integer(value,min,max,what){assert(Number.isSafeInteger(value)&&value>=min&&value<=max,`${what} must be an integer between ${min} and ${max}`);}
function string(value,max,what){assert(typeof value==='string'&&value.trim()&&value.length<=max,`invalid ${what}`);}
const propertyValue=validatePropertyValue;
export function entitySchema(project,entity){
 const base=typeof entity?.type==='string'&&Object.hasOwn(ENTITY_TYPES,entity.type)?ENTITY_TYPES[entity.type]:null;
 assert(base,'unknown entity type');const component=componentFor(project,entity);
 return component?{...base,...component.properties}:base;
}
export function validateProject(project,{requireLayers=false}={}){
 record(project,'project');validateComponents(project.components);
 if(project.seed!==undefined)integer(project.seed,0,0xffffffff,'project seed');
 if(project.renderer!==undefined)assert(typeof project.renderer==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(project.renderer),'invalid renderer ID');
 id(project.id);string(project.name,200,'project name');record(project.fps,'fps');
 integer(project.fps?.num,1,120000,'fps numerator');integer(project.fps?.den,1,10000,'fps denominator');
 assert(project.fps.num/project.fps.den>=1&&project.fps.num/project.fps.den<=120,'fps must be between 1 and 120');
 integer(project.width,16,7680,'width');integer(project.height,16,7680,'height');
 assert(Array.isArray(project.shots)&&project.shots.length>0&&project.shots.length<=500,'project needs 1–500 shots');
 const ids=new Set([project.id]), add=value=>{id(value);assert(!ids.has(value),'duplicate stable ID: '+value);ids.add(value);};
 let total=0;
 for(const shot of project.shots){
  record(shot,'shot');
  add(shot.id);string(shot.name,200,'shot name');integer(shot.durationFrames,1,36000,'shot duration');total+=shot.durationFrames;
  if(shot.sourceTiming!==undefined){const t=shot.sourceTiming;record(t,'source timing');
   const limit=216000*project.fps.den/project.fps.num+1;
   assert(Number.isFinite(t.startSeconds)&&t.startSeconds>=0&&Number.isFinite(t.durationSeconds)&&t.durationSeconds>0&&t.startSeconds+t.durationSeconds<=limit,'invalid source timing');
   integer(t.startFrame,0,216000,'source start frame');integer(t.durationFrames,1,36000,'source duration');}
  assert(Array.isArray(shot.entities)&&shot.entities.length<=200,'invalid entities');
  for(const entity of shot.entities){
   record(entity,'entity');
   if(entity.legacy!==undefined){record(entity.legacy,'legacy entity');assert(entity.legacy.readOnly===true&&typeof entity.legacy.reason==='string','invalid legacy entity');}
   if(entity.type==='audioCue')validateCue(entity.cue,shot);
   add(entity.id);string(entity.name,200,'entity name');
   const schema=entitySchema(project,entity);
   record(entity.properties,'entity properties');record(entity.keyframes,'entity keyframes');
   for(const [key,value] of Object.entries(entity.properties)) propertyValue(Object.hasOwn(schema,key)?schema[key]:null,value);
   for(const key of Object.keys(schema)) assert(Object.hasOwn(entity.properties,key),'missing property: '+key);
   for(const [key,keys] of Object.entries(entity.keyframes)){
    assert(Object.hasOwn(schema,key)&&schema[key].animatable,'property cannot be animated');assert(Array.isArray(keys)&&keys.length<=1000,'too many keyframes');
    let previous=-Infinity;
    for(const k of keys){record(k,'keyframe');integer(k.frame,-216000,216000,'keyframe');assert(k.frame>previous,'keyframes must be unique and sorted');previous=k.frame;
     propertyValue(schema[key],k.value);assert(['linear','hold','ease'].includes(k.easing),'unknown easing');}
   }
  }
  validateLayers(shot,{required:requireLayers,components:project.components});
  if(requireLayers)for(const e of shot.entities)if(e.type==='object2d')assert(e.legacy?.readOnly,'schema 2 object needs a layer or an explicit legacy binding');
 }
 validateAudio(project);validateTypography(project);
 assert(total<=216000,'sequence is too long');
 assert(Array.isArray(project.annotations)&&project.annotations.length<=1000,'invalid annotations');
 for(const note of project.annotations){
  record(note,'annotation');
  add(note.id);const shot=project.shots.find(s=>s.id===note.shotId);assert(shot,'annotation shot is missing');
  integer(note.frame,0,shot.durationFrames-1,'annotation frame');string(note.text,4000,'annotation');
  assert(['open','resolved'].includes(note.status),'invalid annotation status');
  if(note.targetId) assert(shot.entities.some(e=>e.id===note.targetId),'annotation object is missing');
  if(note.region){assert(Array.isArray(note.region)&&note.region.length===4,'invalid annotation region');
   note.region.forEach(v=>assert(Number.isFinite(v)&&v>=0&&v<=1,'region must use normalized coordinates'));
   assert(note.region[0]+note.region[2]<=1.000001&&note.region[1]+note.region[3]<=1.000001,'region is outside the frame');}
 }
 return project;
}
export function entityAt(project,targetId){
 for(const shot of project.shots){const entity=shot.entities.find(e=>e.id===targetId);if(entity)return{shot,entity};}
 throw new Error('unknown object: '+targetId);
}
export function evaluateEntity(entity,frame){
 const values={...entity.properties};
 for(const [key,keys] of Object.entries(entity.keyframes)){
  if(!keys.length)continue;
  if(frame<=keys[0].frame){values[key]=keys[0].value;continue;}
  const next=keys.findIndex(k=>k.frame>frame);
  if(next<0){values[key]=keys.at(-1).value;continue;}
  const a=keys[next-1],b=keys[next];let u=(frame-a.frame)/(b.frame-a.frame);
  if(a.easing==='hold')u=0;else if(a.easing==='ease')u=u*u*(3-2*u);
  values[key]=a.value+(b.value-a.value)*u;
 }
 return values;
}
export function evaluatedLayers(shot,frame,options){return layerStates(shot,frame,options).map(e=>({...e,values:evaluateEntity(e,frame)}));}
export function frameContext(project,frame=0){
 const total=project.shots.reduce((n,s)=>n+s.durationFrames,0);integer(frame,0,total-1,'sequence frame');let start=0;
 for(const shot of project.shots){if(frame<start+shot.durationFrames)return{frame,localFrame:frame-start,totalFrames:total,shotId:shot.id,shotStart:start,
  entities:shot.entities.map(e=>({...e,values:evaluateEntity(e,frame-start),schema:entitySchema(project,e)})),layers:evaluatedLayers(shot,frame-start),annotations:project.annotations.filter(n=>n.shotId===shot.id)};start+=shot.durationFrames;}
}
function editableEntity(shot,entity){assert(!entity.legacy?.readOnly,'this legacy entity is read-only');if(entity.layer)assert(!isLayerLocked(shot,entity.id),'layer or its ancestor is locked');}
export function applyOperations(original,operations){
 validateProject(original);
 assert(Array.isArray(operations)&&operations.length>0&&operations.length<=100,'send 1–100 operations');
 const project=structuredClone(original);
 for(const op of operations){
  record(op,'operation');
  const links=linkedBefore(project);
  if(AUDIO_OPERATIONS.includes(op.type))applyAudioOperation(project,op);
  else if(TYPOGRAPHY_OPERATIONS.includes(op.type))applyTypographyOperation(project,op);
  else if(EDITING_OPERATIONS.includes(op.type)){
   applyEditingOperation(project,op);
  }else if(SCENE_OPERATIONS.includes(op.type)){
   applySceneOperation(project,op);
  }else if(op.type==='addComponent'){
   const shot=project.shots.find(s=>s.id===op.shotId);assert(shot&&Array.isArray(shot.layerOrder),'choose a managed shot');
   assert(typeof op.component==='string'&&Object.hasOwn(project.components||{},op.component),'unknown component');
   const c=project.components[op.component],properties=Object.fromEntries(Object.entries({...ENTITY_TYPES.layer2d,...c.properties}).map(([k,d])=>[k,d.default]));
   const e={id:op.id,name:op.name||c.label,type:'layer2d',component:op.component,properties,keyframes:{},layer:{binding:op.component,parentId:null,space:'screen',visible:true,locked:false,startFrame:0,endFrame:shot.durationFrames}};
   shot.entities.push(e);shot.layerOrder.push(e.id);
  }else if(LAYER_OPERATIONS.includes(op.type)){
   applyLayerOperation(project,op);
  }else if(op.type==='addAudio'){
   const shot=project.shots.find(s=>s.id===op.shotId);assert(shot,'unknown shot');
   shot.entities.push({id:op.id,name:op.name||'Audio',type:'audioCue',properties:{gain:1,muted:false,fadeIn:0,fadeOut:0},keyframes:{},cue:{voice:'file',frame:0,durationFrames:op.durationFrames,args:[],src:op.src,offsetSeconds:0}});
  }else if(op.type==='deleteAudio'||op.type==='duplicateAudio'){
   const {shot,entity}=entityAt(project,op.targetId);assert(entity.type==='audioCue','choose an audio cue');
   if(op.type==='duplicateAudio'){const copy=structuredClone(entity);copy.cue.seed=entity.cue.seed??((0x53434f52+Number(entity.id.split(':').at(-1))*2654435761)>>>0);delete copy.cue.linkedVideoId;copy.id=op.id;copy.name=entity.name.slice(0,195)+' copy';shot.entities.push(copy);}
   else{shot.entities=shot.entities.filter(e=>e.id!==entity.id);for(const note of project.annotations)if(note.targetId===entity.id)delete note.targetId;}
  }else if(op.type==='setCue'){
   const {shot,entity}=entityAt(project,op.targetId);assert(entity.type==='audioCue','choose an audio cue');
   assert(isPlainRecord(op.patch)&&Object.keys(op.patch).every(k=>['frame','durationFrames','args','offsetSeconds',...(project.renderer==='canvas2d'?['playbackRate']:[])].includes(k)),'invalid audio patch');
   assert(!entity.cue.linkedVideoId,'Detach audio to edit its timing independently, or edit its video');
   if(entity.cue.envelope&&op.patch.frame!==undefined)entity.cue.envelope.startFrame+=op.patch.frame-entity.cue.frame;
   Object.assign(entity.cue,op.patch);validateCue(entity.cue,shot);
  }else if(op.type==='setProperty'){
   const {shot,entity}=entityAt(project,op.targetId),schema=entitySchema(project,entity);editableEntity(shot,entity);
   assert(typeof op.property==='string'&&Object.hasOwn(schema,op.property),'unknown property');
   propertyValue(schema[op.property],op.value);entity.properties[op.property]=op.value;
  }else if(op.type==='setKeyframe'||op.type==='deleteKeyframe'){
   const {shot,entity}=entityAt(project,op.targetId),type=entitySchema(project,entity);
   editableEntity(shot,entity);
   assert(typeof op.property==='string'&&Object.hasOwn(type,op.property),'unknown property');
   const schema=type[op.property];assert(schema.animatable,'property cannot be animated');
   integer(op.frame,0,shot.durationFrames-1,'keyframe');
   const keys=entity.keyframes[op.property]||[];entity.keyframes[op.property]=keys.filter(k=>k.frame!==op.frame);
   if(op.type==='setKeyframe'){propertyValue(schema,op.value);entity.keyframes[op.property].push({frame:op.frame,value:op.value,easing:op.easing||'linear'});entity.keyframes[op.property].sort((a,b)=>a.frame-b.frame);}
  }else if(op.type==='renameShot'||op.type==='trimShot'||op.type==='stretchShot'||op.type==='moveShot'){
   const i=project.shots.findIndex(s=>s.id===op.shotId);assert(i>=0,'unknown shot');
   if(op.type==='renameShot'){string(op.name,200,'shot name');project.shots[i].name=op.name;}
   if(op.type==='trimShot'||op.type==='stretchShot')retimeShot(project,project.shots[i],op.durationFrames,op.type==='stretchShot');
   if(op.type==='moveShot'){integer(op.index,0,project.shots.length-1,'shot index');project.shots.splice(op.index,0,...project.shots.splice(i,1));}
  }else if(op.type==='addAnnotation'){
   project.annotations.push({id:op.id,shotId:op.shotId,frame:op.frame,text:op.text,status:'open',...(op.targetId?{targetId:op.targetId}:{}),...(op.region?{region:op.region}:{} )});
  }else if(op.type==='resolveAnnotation'){
   const note=project.annotations.find(n=>n.id===op.id);assert(note,'unknown annotation');assert(typeof op.resolved==='boolean','resolved must be boolean');note.status=op.resolved?'resolved':'open';
  }else throw new Error('unsupported operation: '+op.type);
  syncLinked(project,links,op);
 }
 return validateProject(project);
}

function validateCue(c,shot){
 record(c,'audio cue');integer(c.frame,0,shot.durationFrames-1,'cue frame');integer(c.durationFrames,1,216000,'cue duration');
 if(c.seed!==undefined)integer(c.seed,0,0xffffffff,'sound seed');
 if(c.voice==='file'){
  assert(typeof c.src==='string'&&/^\/w\/studio\/assets\/[a-zA-Z0-9_-]+\/[a-f0-9]{64}\.(wav|mp3|ogg|mp4|webm)$/.test(c.src),'choose imported audio');
  assert(Number.isFinite(c.offsetSeconds)&&c.offsetSeconds>=0&&c.offsetSeconds<=21600,'invalid audio offset');return;
 }
 validateLegacyVoice(c);
}

function retimeShot(project,shot,duration,extended=false){
 integer(duration,1,36000,'shot duration');assert(!shot.entities.some(e=>e.layer&&isLayerLocked(shot,e.id)),'unlock layers before changing shot duration');const old=shot.durationFrames,ratio=duration/old;
 const frame=f=>Math.min(duration-1,Math.round(f*ratio));
 for(const e of shot.entities){
  for(const [key,keys] of Object.entries(e.keyframes)){const unique=new Map();for(const k of keys){const at=extended?Math.round(k.frame*ratio):frame(k.frame);if(extended)assert(!unique.has(at),'This stretch would merge keyframes; use a longer duration');unique.set(at,{...k,frame:at});}e.keyframes[key]=[...unique.values()];}
  if(e.layer){e.layer.startFrame=frame(e.layer.startFrame);e.layer.endFrame=Math.max(e.layer.startFrame+1,Math.min(duration,Math.round(e.layer.endFrame*ratio)));}
  if(extended&&e.layer?.binding==='video')e.content.playbackRate/=ratio;
  if(e.cue){if(e.cue.envelope){e.cue.envelope.startFrame=Math.round(e.cue.envelope.startFrame*ratio);e.cue.envelope.durationFrames=Math.max(1,Math.round(e.cue.envelope.durationFrames*ratio));}if(extended&&project.renderer==='canvas2d'&&e.cue.voice==='file')e.cue.playbackRate=(e.cue.playbackRate??1)/ratio;e.cue.frame=frame(e.cue.frame);e.cue.durationFrames=Math.max(1,Math.round(e.cue.durationFrames*ratio));}
 }
 for(const n of project.annotations)if(n.shotId===shot.id)n.frame=frame(n.frame);
 shot.durationFrames=duration;
}
