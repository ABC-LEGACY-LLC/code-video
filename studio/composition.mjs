import {frameClock,randomAt} from './sdk/clock.mjs';
import {validateProject,evaluatedLayers,evaluateEntity} from './core/project.mjs';
import {loadMedia} from './media.mjs';
// Reusable Canvas2D adapter: source painters remain independent of editor state.
export async function createComposition({canvas,project,setContext,paint,components={},blend=()=> 'source-over'}){
 validateProject(project,{requireLayers:true});const media=await loadMedia(project),g=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 const scratch=document.createElement('canvas');scratch.width=W;scratch.height=H;const layer=scratch.getContext('2d');
 let frame=0,preview={soloId:null,selectedId:null,transform:null},geometry=new Map();
 const shotAt=n=>{let start=0;for(const shot of project.shots){if(n<start+shot.durationFrames)return{shot,start,local:n-start};start+=shot.durationFrames;}const shot=project.shots.at(-1);return{shot,start:start-shot.durationFrames,local:shot.durationFrames-1};};
 function draw(n){const clock=frameClock(project,n);frame=n;const {shot,local}=shotAt(n),records=evaluatedLayers(shot,local,{soloIds:shot.layerOrder.includes(preview.soloId)?[preview.soloId]:[]}),camera=shot.entities.find(e=>e.type==='camera2d'),v=camera?evaluateEntity(camera,local):{x:0,y:0,zoom:1};
  const world=new DOMMatrix().translate(W/2+v.x,H/2+v.y).scale(v.zoom).translate(-W/2,-H/2);media.sync(shot,local,project.fps.num/project.fps.den);g.reset();g.fillStyle='#000000';g.fillRect(0,0,W,H);geometry.clear();
  for(const e of records){if(!e.effectiveVisible||e.type==='group')continue;const v=preview.transform?.targetId===e.id?{...e.values,...preview.transform.properties}:e.values;
   const base=e.layer.space==='screen'?new DOMMatrix():world,m=base.translate(W/2+v.x,H/2+v.y).rotate(v.rotation).scale(v.scale).translate(-W/2,-H/2);
   layer.reset();layer.setTransform(m);setContext(layer);
   try{if(e.component){const c=components[e.component];if(!c)throw new Error('missing component painter: '+e.component);const result=c.paint({context:layer,width:W,height:H,entity:e,properties:v,clock,random:(sample=0)=>randomAt(clock.seed,clock.frame,e.id,sample)});if(result?.then)throw new Error('component paint must be synchronous; load resources before ready');}else if(e.content)media.paint(layer,e,W,H);else paint(e.layer.binding,n);}finally{setContext(g);}
   g.globalAlpha=v.opacity;g.globalCompositeOperation=blend(e.layer.binding);g.drawImage(scratch,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
   const bounds=e.component?components[e.component].bounds?.({properties:v,width:W,height:H,clock}):null;
   const width=bounds?.width||e.content?.width||W,height=bounds?.height||e.content?.height||H,point=(x,y)=>{const p=m.transformPoint({x,y});return{x:p.x/W,y:p.y/H};},inv=base.inverse();
   geometry.set(e.id,{id:e.id,values:v,locked:e.effectiveLocked,width:W,height:H,pivot:point(W/2,H/2),points:[point((W-width)/2,(H-height)/2),point((W+width)/2,(H-height)/2),point((W+width)/2,(H+height)/2),point((W-width)/2,(H+height)/2)],inverse:[inv.a,inv.b,inv.c,inv.d]});
  }
  return{frame:n,shot:shot.id};
 }
 return{draw,project,dispose(){media.dispose();scratch.width=scratch.height=1;geometry.clear();},
  preview(next){preview={...preview,...next};draw(frame);return{...preview};},getPreview:()=>({...preview}),geometry:id=>{const g=geometry.get(id);return g&&!g.locked?g:null;},
  async prepare(){if(!media.hasVideo)return;const {shot,local}=shotAt(frame);await media.prepare(shot,local,project.fps.num/project.fps.den);draw(frame);},
  pick(x,y){const p={x,y};for(const [id,geo] of [...geometry].reverse()){if(geo.locked)continue;const xs=geo.points.map(p=>p.x),ys=geo.points.map(p=>p.y);if(p.x>=Math.min(...xs)&&p.x<=Math.max(...xs)&&p.y>=Math.min(...ys)&&p.y<=Math.max(...ys))return id;}return null;},
  tracks(){let start=0;const tracks=new Map();for(const shot of project.shots){for(const id of shot.layerOrder){const e=shot.entities.find(e=>e.id===id);if(e.type==='group')continue;const key=e.layer.binding;if(!tracks.has(key))tracks.set(key,{id:key,name:e.name,kind:'clips',items:[]});tracks.get(key).items.push({f:start+e.layer.startFrame,n:e.layer.endFrame-e.layer.startFrame,label:e.name,targetId:e.id});}start+=shot.durationFrames;}return[...tracks.values()];}
 };
}
