import {basicDescriptors} from '../components/basic2d.mjs';
import {emptyShot} from './scenes.mjs';
import {validateProject} from './project.mjs';
export const FORMATS={'16:9':[1920,1080],'9:16':[1080,1920],'1:1':[1080,1080]};
export const TEMPLATE_IDS=['blank','title-sequence'];
const layer=(id,name,binding,duration)=>({id,name,type:'layer2d',properties:{x:0,y:0,scale:1,rotation:0,opacity:1},keyframes:{},layer:{binding,parentId:null,space:'screen',visible:true,locked:false,startFrame:0,endFrame:duration}});
export function createTemplate(id,input){
 const {name,format,fps,durationSeconds,template}=input;
 if(typeof name!=='string'||!name.trim()||name.trim().length>200)throw new Error('Enter a project name (1–200 characters)');
 if(!Object.hasOwn(FORMATS,format)||![24,25,30,60].includes(fps))throw new Error('Choose a supported format and FPS');
 if(!Number.isFinite(durationSeconds)||durationSeconds<1||durationSeconds>600)throw new Error('Choose a duration from 1 to 600 seconds');
 if(!TEMPLATE_IDS.includes(template))throw new Error('Choose Blank or Title sequence');
 const [width,height]=FORMATS[format],total=Math.round(durationSeconds*fps),count=template==='blank'?1:3;
 const project={id,name:name.trim(),renderer:'canvas2d',seed:2026,width,height,fps:{num:fps,den:1},components:structuredClone(basicDescriptors),shots:[],annotations:[]};
 for(let i=0;i<count;i++){
  const duration=Math.floor(total/count)+(i<total%count?1:0),shot=emptyShot(`${id}:s${i+1}`,template==='blank'?'Scene 1':['Opening','Story','Closing'][i],duration);
  const bg={...layer(`${shot.id}:bg`,'Background','background',duration),component:'background'};bg.properties.color=['#101827','#162b32','#261c37'][i];shot.entities.push(bg);shot.layerOrder.push(bg.id);
  if(template!=='blank'){
   const accent={...layer(`${shot.id}:shape`,'Accent','shape',duration),component:'shape'};
   Object.assign(accent.properties,{shape:'rectangle',color:['#8cb0ff','#62c486','#ffc97a'][i],width:Math.round(width*.7),height:12,radius:6,y:120});
   const title=layer(`${shot.id}:title`,'Title','text',duration);title.content={text:['YOUR STORY','MAKE IT MOVE','MAKE IT YOURS'][i],fontSize:Math.round(width*.055),fontFamily:'sans-serif',color:'#ffffff',align:'center',width:Math.round(width*.9),height:200};
   if(duration>2)title.keyframes.opacity=[{frame:0,value:0,easing:'ease'},{frame:Math.min(duration-1,Math.round(fps/2)),value:1,easing:'hold'}];
   shot.entities.push(accent,title);shot.layerOrder.push(accent.id,title.id);
  }
  project.shots.push(shot);
 }
 return validateProject(project,{requireLayers:true});
}
export const freshState=project=>({schemaVersion:2,generation:0,project,history:{past:[],future:[]},receipts:[]});
