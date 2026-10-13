/* Pure, browser-safe schema 1 compatibility. No disk writes or history rebasing. */
import {validateProject} from './project.mjs';
export const WHITEOUT_LAYER_BINDINGS={
 far:['background','ground','hero','haze','snow'],walk:['background','ground','hero','haze','snow'],boot:['background','ground','hero','haze','snow'],
 meet:['background','ground','hero','opponent','haze','snow'],other:['background','ground','opponent','haze','snow'],
 charge:['background','ground','speed','hero','opponent','haze','snow'],clash:['background','ground','hero','opponent','snow'],
 impactA:['background','impact'],impactB:['background','impact'],after:['background','ground','hero','opponent','haze','snow'],
 drop:['background','ground','hero','opponent','drop','haze','snow'],backs:['background','ground','hero','opponent','haze','snow'],
 alone:['background','ground','opponent','hero','haze','snow','title']
};
const NAMES={background:'Background',ground:'Ground',hero:'Hero',opponent:'Opponent',haze:'Haze',snow:'Snow',speed:'Speed lines',impact:'Impact art',drop:'Blood drop',title:'Title'};
export function migrateWhiteoutProject(original){
 validateProject(original);if(original.id!=='whiteout')throw new Error('layer migration only supports Whiteout');
 const project=structuredClone(original);
 if(project.shots.every(s=>s.layerOrder!==undefined))return validateProject(project,{requireLayers:true});
 if(project.shots.some(s=>s.layerOrder!==undefined))throw new Error('cannot migrate a partially layered project');
 for(const shot of project.shots){
  const bindings=WHITEOUT_LAYER_BINDINGS[shot.id];if(!bindings)throw new Error('unknown Whiteout shot binding: '+shot.id);
  shot.layerOrder=[];
  for(const binding of bindings){
   const id=binding+':'+shot.id;let entity=shot.entities.find(e=>e.id===id);
   if(entity&&entity.type!=='object2d')throw new Error('layer identity already belongs to another entity: '+id);
   if(!entity){entity={id,name:NAMES[binding],type:'object2d',properties:{x:0,y:0,scale:1,opacity:1},keyframes:{}};shot.entities.push(entity);}
   entity.type='layer2d';entity.properties={...entity.properties,rotation:0};
   entity.layer={binding,parentId:null,space:'world',visible:true,locked:false,startFrame:0,endFrame:shot.durationFrames};
   shot.layerOrder.push(id);
  }
  for(const entity of shot.entities)if(entity.type==='object2d')entity.legacy={readOnly:true,reason:'This actor is not drawn in this shot'};
 }
 return validateProject(project,{requireLayers:true});
}
