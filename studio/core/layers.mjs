/* Layer structure is independent of rendering. Order is bottom-to-top preorder:
   a group precedes its contiguous descendants but does not paint or transform. */
import {legacyBindings} from '../components/legacy.mjs';
export const LAYER_BINDINGS=legacyBindings;
export const LAYER_OPERATIONS=['setLayer','renameLayer','moveLayer','groupLayers','ungroupLayer','addLayer','duplicateLayer','deleteLayer','setContent'];
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const assert=(value,message)=>{if(!value)throw new Error(message);};
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
export function layerEntity(shot,id){const e=shot.entities.find(e=>e.id===id&&e.layer);assert(e,'unknown layer: '+id);return e;}
function ancestors(shot,entity){
 const out=[],seen=new Set([entity.id]);let id=entity.layer.parentId;
 while(id!==null){assert(!seen.has(id),'cyclic layer parent');seen.add(id);const parent=layerEntity(shot,id);assert(parent.type==='group','layer parent must be a group');out.push(parent);id=parent.layer.parentId;}
 return out;
}
export function isLayerLocked(shot,targetId){const e=layerEntity(shot,targetId);return[e,...ancestors(shot,e)].some(n=>n.layer.locked);}
function childMap(shot){
 const map=new Map([[null,[]]]);for(const e of shot.entities)if(e.type==='group')map.set(e.id,[]);
 for(const id of shot.layerOrder){const e=layerEntity(shot,id);assert(map.has(e.layer.parentId),'missing layer parent');map.get(e.layer.parentId).push(id);}
 return map;
}
function flatten(map,parent=null,seen=new Set()){
 const out=[];for(const id of map.get(parent)||[]){assert(!seen.has(id),'cyclic or duplicate layer order');seen.add(id);out.push(id);if(map.has(id))out.push(...flatten(map,id,seen));}return out;
}
export function validateLayers(shot,{required=false,components={}}={}){
 const visual=shot.entities.filter(e=>e.layer!==undefined||['layer2d','group'].includes(e.type));
 if(shot.layerOrder===undefined){assert(!required&&!visual.length,'shot needs layerOrder');return;}
 assert(Array.isArray(shot.layerOrder),'layerOrder must be an array');
 assert(shot.layerOrder.length===visual.length&&new Set(shot.layerOrder).size===visual.length,'layerOrder must contain each layer exactly once');
 const bindings=new Set();
 for(const e of shot.entities){
  if(!visual.includes(e)){assert(!['layer2d','group'].includes(e.type),'visual entity needs layer metadata');continue;}
  assert(['layer2d','group'].includes(e.type),'camera, audio and legacy objects are not visual layers');
  const l=e.layer;assert(record(l),'layer metadata must be a plain object');
  assert(Object.keys(l).every(k=>['binding','parentId','space','visible','locked','startFrame','endFrame'].includes(k)),'unknown layer metadata');
  assert(e.type==='group'?l.binding==='group':e.component!==undefined?(Object.hasOwn(components,e.component)&&l.binding===e.component):LAYER_BINDINGS.includes(l.binding),'unknown layer binding');
  if(!e.component&&['text','image','video'].includes(l.binding))validateContent(e.content,l.binding);
  else assert(e.content===undefined,'procedural layers have no media content');
  assert(l.parentId===null||typeof l.parentId==='string','invalid layer parent');
  assert(['world','screen'].includes(l.space)&&(!(e.type==='group')||l.space==='world'),'invalid layer space');
  assert(typeof l.visible==='boolean'&&typeof l.locked==='boolean','layer visibility and lock must be boolean');
  assert(Number.isSafeInteger(l.startFrame)&&Number.isSafeInteger(l.endFrame)&&l.startFrame>=0&&l.startFrame<l.endFrame&&l.endFrame<=shot.durationFrames,'invalid layer interval');
  ancestors(shot,e);
 }
 const map=childMap(shot),flat=flatten(map);
 assert(flat.length===visual.length&&flat.every((id,i)=>id===shot.layerOrder[i]),'group descendants must be contiguous in layerOrder');
}
export function layerTree(shot){
 if(!shot.layerOrder)return[];const map=childMap(shot);
 const tree=parent=>(map.get(parent)||[]).map(id=>({entity:layerEntity(shot,id),children:tree(id)}));return tree(null);
}
export function layerStates(shot,frame,{soloIds=[]}={}){
 if(!shot.layerOrder)return[];
 assert(Number.isSafeInteger(frame)&&frame>=0&&frame<shot.durationFrames,'invalid layer frame');
 assert(Array.isArray(soloIds)&&soloIds.every(id=>shot.layerOrder.includes(id)),'unknown solo layer');
 return shot.layerOrder.map(id=>{
  const e=layerEntity(shot,id),parents=ancestors(shot,e),chain=[e,...parents];
  const active=chain.every(n=>frame>=n.layer.startFrame&&frame<n.layer.endFrame);
  const solo=!soloIds.length||chain.some(n=>soloIds.includes(n.id));
  return{...e,active,effectiveVisible:active&&solo&&chain.every(n=>n.layer.visible),effectiveLocked:chain.some(n=>n.layer.locked),depth:parents.length,parentIds:parents.map(e=>e.id)};
 });
}
const subtree=(shot,id)=>{const at=shot.layerOrder.indexOf(id);return shot.layerOrder.slice(at).filter((key,i)=>i===0||ancestors(shot,layerEntity(shot,key)).some(e=>e.id===id));};
function editable(shot,id,{subtreeLocked=false}={}){
 assert(!isLayerLocked(shot,id),'layer or its ancestor is locked');
 if(subtreeLocked)assert(subtree(shot,id).every(key=>!isLayerLocked(shot,key)),'a descendant layer is locked');
}
export function applyLayerOperation(project,op){
 let shot,entity;
 if(op.type==='groupLayers'||op.type==='addLayer'){shot=project.shots.find(s=>s.id===op.shotId);assert(shot,'unknown shot');}
 else{for(const s of project.shots){const e=s.entities.find(e=>e.id===op.targetId&&e.layer);if(e){shot=s;entity=e;break;}}assert(entity,'unknown layer: '+op.targetId);}
 assert(Array.isArray(shot.layerOrder),'this shot has no layer editor');
 if(op.type==='addLayer'){
  assert(['text','image','video'].includes(op.kind),'choose text, image or video');
  validateContent(op.content,op.kind);
  const e={id:op.id,name:op.name||op.kind,type:'layer2d',properties:{x:0,y:0,scale:1,rotation:0,opacity:1},keyframes:{},layer:{binding:op.kind,parentId:null,space:'screen',visible:true,locked:false,startFrame:0,endFrame:shot.durationFrames},content:structuredClone(op.content)};
  shot.entities.push(e);shot.layerOrder.push(e.id);
 }else if(op.type==='setContent'){
  editable(shot,entity.id);assert(['text','image','video'].includes(entity.layer.binding),'this layer has procedural artwork');
  validateContent(op.content,entity.layer.binding);entity.content=structuredClone(op.content);
 }else if(op.type==='duplicateLayer'){
  editable(shot,entity.id,{subtreeLocked:true});assert(entity.type!=='group','duplicate individual layers; ungroup a folder first');
  const e=structuredClone(entity);e.id=op.id;e.name=op.name||entity.name+' copy';
  shot.entities.push(e);shot.layerOrder.splice(shot.layerOrder.indexOf(entity.id)+1,0,e.id);
 }else if(op.type==='deleteLayer'){
  editable(shot,entity.id,{subtreeLocked:true});const ids=new Set(subtree(shot,entity.id));
  shot.entities=shot.entities.filter(e=>!ids.has(e.id));shot.layerOrder=shot.layerOrder.filter(id=>!ids.has(id));
  for(const note of project.annotations)if(ids.has(note.targetId))delete note.targetId;
 }else if(op.type==='setLayer'){
  assert(record(op.patch)&&Object.keys(op.patch).length,'layer patch must be a plain object');
  assert(Object.keys(op.patch).every(k=>['visible','locked','startFrame','endFrame','space'].includes(k)),'unsupported layer patch');
  const unlock=Object.keys(op.patch).length===1&&op.patch.locked===false;
  if(unlock)assert(!ancestors(shot,entity).some(e=>e.layer.locked),'an ancestor layer is locked');else editable(shot,entity.id);
  Object.assign(entity.layer,op.patch);
 }else if(op.type==='renameLayer'){
  editable(shot,entity.id);assert(typeof op.name==='string'&&op.name.trim()&&op.name.length<=200,'invalid layer name');entity.name=op.name;
 }else if(op.type==='moveLayer'){
  editable(shot,entity.id,{subtreeLocked:true});const map=childMap(shot),siblings=map.get(entity.layer.parentId);
  assert(Number.isSafeInteger(op.index)&&op.index>=0&&op.index<siblings.length,'invalid sibling index');
  siblings.splice(siblings.indexOf(entity.id),1);siblings.splice(op.index,0,entity.id);shot.layerOrder=flatten(map);
 }else if(op.type==='groupLayers'){
  assert(Array.isArray(op.targetIds)&&op.targetIds.length>=2&&new Set(op.targetIds).size===op.targetIds.length,'choose at least two different layers');
  const selected=op.targetIds.map(id=>layerEntity(shot,id)),parent=selected[0].layer.parentId;
  assert(selected.every(e=>e.layer.parentId===parent),'group layers must have the same parent');
  selected.forEach(e=>editable(shot,e.id,{subtreeLocked:true}));
  assert(typeof op.groupId==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,119}$/.test(op.groupId),'invalid group ID');
  assert(!project.shots.some(s=>s.id===op.groupId||s.entities.some(e=>e.id===op.groupId))&&project.id!==op.groupId&&!project.annotations.some(n=>n.id===op.groupId),'duplicate stable ID');
  assert(typeof op.name==='string'&&op.name.trim()&&op.name.length<=200,'invalid group name');
  const map=childMap(shot),siblings=map.get(parent),indices=selected.map(e=>siblings.indexOf(e.id)).sort((a,b)=>a-b);
  assert(indices.at(-1)-indices[0]+1===indices.length,'group layers must be contiguous siblings');
  const children=siblings.slice(indices[0],indices[0]+indices.length);
  const group={id:op.groupId,name:op.name,type:'group',properties:{},keyframes:{},layer:{binding:'group',parentId:parent,space:'world',visible:true,locked:false,startFrame:0,endFrame:shot.durationFrames}};
  shot.entities.push(group);children.forEach(id=>{layerEntity(shot,id).layer.parentId=group.id;});
  siblings.splice(indices[0],children.length,group.id);map.set(group.id,children);shot.layerOrder=flatten(map);
 }else if(op.type==='ungroupLayer'){
  assert(entity.type==='group','layer is not a group');editable(shot,entity.id,{subtreeLocked:true});
  const map=childMap(shot),children=map.get(entity.id),siblings=map.get(entity.layer.parentId);
  children.forEach(id=>{const layer=layerEntity(shot,id).layer;
   layer.parentId=entity.layer.parentId;layer.visible=layer.visible&&entity.layer.visible;
   const start=Math.max(layer.startFrame,entity.layer.startFrame),end=Math.min(layer.endFrame,entity.layer.endFrame);
   if(start<end){layer.startFrame=start;layer.endFrame=end;}else layer.visible=false;
  });
  siblings.splice(siblings.indexOf(entity.id),1,...children);map.delete(entity.id);shot.entities=shot.entities.filter(e=>e.id!==entity.id);shot.layerOrder=flatten(map);
  for(const note of project.annotations)if(note.targetId===entity.id)delete note.targetId;
 }else throw new Error('unsupported layer operation');
}

export function validateContent(c,kind){
 assert(record(c),'layer content must be an object');
 const common=['width','height'],keys=kind==='text'?['text','fontSize','fontFamily','color','align','caption',...common]:['src','offsetSeconds','playbackRate',...common];
 assert(Object.keys(c).every(k=>keys.includes(k)),'unknown content field');
 for(const k of common)assert(Number.isFinite(c[k])&&c[k]>=1&&c[k]<=7680,'invalid content dimensions');
 if(kind==='text'){
  assert(typeof c.text==='string'&&c.text.length<=4000,'invalid text');
  assert(Number.isFinite(c.fontSize)&&c.fontSize>=8&&c.fontSize<=500,'invalid font size');
  assert(['sans-serif','serif','monospace'].includes(c.fontFamily)||/^font-[a-zA-Z0-9_-]{1,80}$/.test(c.fontFamily),'invalid font family');
  assert(/^#[0-9a-f]{6}$/i.test(c.color),'use a six digit color');
  assert(['left','center','right'].includes(c.align),'invalid alignment');
 }else{
  assert(typeof c.src==='string'&&/^\/w\/studio\/assets\/[a-zA-Z0-9_-]+\/[a-f0-9]{64}\.(png|jpg|webp|mp4|webm)$/.test(c.src),'choose an imported media asset');
  assert(kind==='image'?/\.(png|jpg|webp)$/.test(c.src):/\.(mp4|webm)$/.test(c.src),'media type does not match layer');
  assert(Number.isFinite(c.offsetSeconds)&&c.offsetSeconds>=0&&c.offsetSeconds<=21600,'invalid media offset');
  assert(Number.isFinite(c.playbackRate)&&c.playbackRate>=0.1&&c.playbackRate<=8,'invalid media speed');
 }
}
