// Scene identity is independent of its position on the timeline.
import {isLayerLocked} from './layers.mjs';
export const SCENE_OPERATIONS=['addShot','duplicateShot','deleteShot','renameProject'];
export function emptyShot(id,name,durationFrames){
 return{id,name,durationFrames,entities:[{id:id+':camera',name:'Camera',type:'camera2d',properties:{x:0,y:0,zoom:1},keyframes:{}}],layerOrder:[]};
}
export function copyShot(source,id,annotations=[]){
 const shot=structuredClone(source),ids=new Map(source.entities.map((e,i)=>[e.id,`${id}:e${i}`]));
 shot.id=id;delete shot.sourceTiming;
 for(const e of shot.entities){e.id=ids.get(e.id);if(e.cue?.linkedVideoId)e.cue.linkedVideoId=ids.get(e.cue.linkedVideoId);if(e.layer?.parentId)e.layer.parentId=ids.get(e.layer.parentId);}
 shot.layerOrder=shot.layerOrder.map(key=>ids.get(key));
 return{shot,annotations:annotations.filter(n=>n.shotId===source.id).map((n,i)=>({...structuredClone(n),id:`${id}:n${i}`,shotId:id,...(n.targetId?{targetId:ids.get(n.targetId)}:{})}))};
}
export function applySceneOperation(project,op){
 if(op.type==='renameProject'){project.name=op.name;return;}
 if(op.type==='addShot'){
  if(typeof op.id!=='string'||op.id.length>90)throw new Error('Scene ID must contain at most 90 characters');
  const index=op.index??project.shots.length;
  if(!Number.isInteger(index)||index<0||index>project.shots.length)throw new Error('Invalid scene position');
  project.shots.splice(index,0,emptyShot(op.id,op.name||'Scene',op.durationFrames));return;
 }
 const index=project.shots.findIndex(s=>s.id===op.shotId),source=project.shots[index];
 if(!source)throw new Error('Unknown scene');
 if(op.type==='duplicateShot'){
  if(typeof op.id!=='string'||op.id.length>90)throw new Error('Scene ID must contain at most 90 characters');
  const copy=copyShot(source,op.id,project.annotations);copy.shot.name=op.name||source.name.slice(0,195)+' copy';
  project.shots.splice(index+1,0,copy.shot);project.annotations.push(...copy.annotations);
 }else{
  if(project.shots.length===1)throw new Error('Keep at least one scene');
  if(source.entities.some(e=>e.layer&&isLayerLocked(source,e.id)))throw new Error('Unlock layers before deleting this scene');
  project.shots.splice(index,1);project.annotations=project.annotations.filter(n=>n.shotId!==source.id);
 }
}
