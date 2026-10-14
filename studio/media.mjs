import {snapshotResource} from './snapshot-resource.mjs';
// Decoding belongs to the renderer. Video frame preparation is awaited by scrubbing and export.
import {loadFonts,textLayout} from './typography.mjs';
export async function loadMedia(project){
 const fonts=await loadFonts(project),layouts=new Map(),textLayouts=new Map(),media=new Map();
 try{await Promise.all(project.shots.flatMap(s=>s.entities).filter(e=>e.content&&['image','video'].includes(e.layer?.binding)).map(async e=>{
  const c=e.content;if(media.has(e.id))return;
  const el=document.createElement(e.layer.binding==='image'?'img':'video');media.set(e.id,el);
  if(el.tagName==='VIDEO'){el.muted=true;el.preload='auto';el.playsInline=true;}
  const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Media timed out: '+e.name)),10000);el.addEventListener(el.tagName==='IMG'?'load':'loadeddata',()=>{clearTimeout(timer);resolve();},{once:true});el.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Media could not decode: '+e.name));},{once:true});});
  el.src=snapshotResource(c.src);await ready;
 }));}catch(error){fonts.dispose();for(const el of media.values()){el.removeAttribute('src');if(el.tagName==='VIDEO')el.load();}throw error;}
 return{
  inspect:()=>[...layouts.values()],beginFrame:()=>layouts.clear(),
  dispose(){textLayouts.clear();fonts.dispose();for(const el of media.values()){if(el.tagName==='VIDEO')el.pause();el.removeAttribute('src');if(el.tagName==='VIDEO')el.load();}media.clear();},
  hasVideo:project.shots.some(s=>s.entities.some(e=>e.content&&e.layer?.binding==='video')),
  paint(g,e,width,height){const c=e.content;g.save();g.translate((width-c.width)/2,(height-c.height)/2);
   if(e.layer.binding==='text'){const family=fonts.family(c.fontFamily);g.font=`${c.fontSize}px ${family}`;let layout=textLayouts.get(e.id);if(!layout){layout=textLayout(g,c,family);textLayouts.set(e.id,layout);}layouts.set(e.id,{id:e.id,...layout,pinned:!['sans-serif','serif','monospace'].includes(c.fontFamily)});g.fillStyle=c.color;g.textAlign=c.align;g.textBaseline='top';const pad=layout.padding,x=c.align==='left'?pad:c.align==='right'?c.width-pad:c.width/2;
    if(c.caption){g.fillStyle=c.caption.background;g.fillRect(0,0,c.width,c.height);g.fillStyle=c.color;g.beginPath();g.rect(0,0,c.width,c.height);g.clip();}
    layout.lines.forEach((line,i)=>{if(c.caption)g.fillText(line,x,pad+i*layout.lineHeight);else g.fillText(line,x,i*c.fontSize*1.2,c.width);});
   }else{const el=media.get(e.id);if(el?.readyState>=2||el?.complete)g.drawImage(el,0,0,c.width,c.height);}g.restore();
  },
  async prepare(shot,local,fps){await Promise.all(shot.entities.filter(e=>e.content&&e.layer?.binding==='video').map(async e=>{const el=media.get(e.id),c=e.content;
   const time=Math.max(0,Math.min(el.duration-0.001,c.offsetSeconds+Math.max(0,local-e.layer.startFrame)/fps*c.playbackRate));
   const same=Math.abs(el.currentTime-time)<0.0001;if(same&&!el.seeking)return;
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{el.removeEventListener('seeked',done);reject(new Error('Video frame seek timed out'));},5000);function done(){clearTimeout(timer);resolve();}el.addEventListener('seeked',done,{once:true});if(!same)el.currentTime=time;});
  }));},
  sync(shot,local,fps){for(const e of shot.entities.filter(e=>e.content&&e.layer?.binding==='video')){const el=media.get(e.id),time=Math.max(0,Math.min(el.duration-0.001,e.content.offsetSeconds+Math.max(0,local-e.layer.startFrame)/fps*e.content.playbackRate));if(!el.seeking&&Math.abs(el.currentTime-time)>1/fps)el.currentTime=time;}}
 };
}
