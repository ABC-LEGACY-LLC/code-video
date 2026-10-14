import {createAudio,audioClips} from '../audio.mjs';
import {createComposition} from '../composition.mjs';
import {validateComponents} from '../core/component-schema.mjs';
import {frameClock,randomAt} from '../sdk/clock.mjs';
const canonical=v=>v&&typeof v==='object'?(Array.isArray(v)?v.map(canonical):Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]))):v;
export const canvas2dDescription={id:'canvas2d',version:'1.1.0',sdkVersion:1,
 capabilities:{renderFrame:true,audio:true,selection:true,inspect:true,cancel:true,dispose:true},auditChannels:['color','geometry','audio','text']};
export function registerCanvas2D(registry){registry.register(canvas2dDescription,createCanvas2D);}
export async function createCanvas2D({canvas,project,components={},signal,previewWidth}){
 validateComponents(Object.fromEntries(Object.entries(components).map(([id,c])=>[id,c.description])));
 for(const [id,description] of Object.entries(project.components||{})){
  const c=components[id];if(!c||typeof c.paint!=='function'||JSON.stringify(canonical(c.description))!==JSON.stringify(canonical(description)))throw new Error('component implementation/schema mismatch: '+id);
 }
 if(previewWidth!==undefined&&(!Number.isSafeInteger(previewWidth)||previewWidth<16||previewWidth>7680))throw new Error('invalid preview width');
 signal?.throwIfAborted();
 const source=document.createElement('canvas');source.width=project.width;source.height=project.height;
 const initialized=[];let composition,sound;
 try{
 for(const id of Object.keys(project.components||{})){const c=components[id];initialized.push(c);await c.load?.({project,signal});signal?.throwIfAborted();}
 composition=await createComposition({canvas:source,width:project.width,height:project.height,project,components,setContext(){},paint(binding){throw new Error('no painter registered for '+binding);}});
 sound=await createAudio(project,{signal});
 await document.fonts.ready;signal?.throwIfAborted();
 }catch(error){composition?.dispose();sound?.dispose();for(const c of initialized.reverse())c.dispose?.();throw error;}
 let disposed=false,epoch=0,frame=0,tail=Promise.resolve();
 const alive=()=>{if(disposed)throw new Error('renderer disposed');signal?.throwIfAborted();};
 const runtime={
  description:canvas2dDescription,canvas,project,
  renderFrame(request){
   const ticket=epoch;
   const task=tail.then(async()=>{
    alive();request.signal?.throwIfAborted();if(ticket!==epoch)throw new Error('render cancelled');
    const clock=frameClock(project,request.frame),proxy=previewWidth&&request.width===undefined&&request.height===undefined&&(!request.quality||request.quality==='preview'),ratio=proxy?Math.min(1,previewWidth/project.width):1,width=request.width??Math.round(project.width*ratio),height=request.height??Math.round(project.height*ratio);
    if(![width,height].every(n=>Number.isSafeInteger(n)&&n>=16&&n<=7680)||width*height>33554432)throw new Error('invalid render dimensions');
    if(request.quality!==undefined&&!['preview','export','audit'].includes(request.quality))throw new Error('invalid quality');
    if(source.width!==width)source.width=width;if(source.height!==height)source.height=height;
    composition.draw(request.frame);await composition.prepare();
    alive();request.signal?.throwIfAborted();if(ticket!==epoch)throw new Error('render cancelled');
    if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
    const g=canvas.getContext('2d');g.reset();g.drawImage(source,0,0,width,height);frame=request.frame;
    return{frame,shot:clock.shotId,clock,width,height};
   });tail=task.catch(()=>{});return task;
  },
  audio:request=>sound.audio(request),audioChecks:()=>sound.inspect(),audioClip:(id,sr)=>sound.clip(id,sr),
  selection({id,x,y}={}){alive();return id?composition.geometry(id):composition.pick(x,y);},
  inspect(){alive();return{frame,clock:frameClock(project,frame),channels:['color','geometry','audio','text'],text:composition.textMetrics()};},
  preview(next){alive();composition.preview(next);const g=canvas.getContext('2d');g.reset();g.drawImage(source,0,0,canvas.width,canvas.height);return composition.getPreview();},
  getPreview:()=>composition.getPreview(),tracks:()=>[...composition.tracks(),...audioClips(project).map(({entity:e,start})=>({id:e.id,name:'Audio · '+(e.mix?.role||'sfx')+' · '+e.name,kind:'clips',items:[{f:start+e.cue.frame,n:e.cue.durationFrames,label:e.name,targetId:e.id}]}))],
  cancel(){epoch++;sound.cancel();},dispose(){if(disposed)return;disposed=true;epoch++;composition.dispose();sound.dispose();for(const c of initialized.reverse())c.dispose?.();source.width=source.height=1;}
 };
 return runtime;
}
export {randomAt};
