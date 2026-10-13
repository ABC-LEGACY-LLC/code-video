// Decoding belongs to the renderer. Video frame preparation is awaited by scrubbing and export.
export async function loadMedia(project){
 const media=new Map();
 await Promise.all(project.shots.flatMap(s=>s.entities).filter(e=>e.content&&['image','video'].includes(e.layer?.binding)).map(async e=>{
  const c=e.content;if(media.has(e.id))return;
  const el=document.createElement(e.layer.binding==='image'?'img':'video');media.set(e.id,el);
  if(el.tagName==='VIDEO'){el.muted=true;el.preload='auto';el.playsInline=true;}
  const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Media timed out: '+e.name)),10000);el.addEventListener(el.tagName==='IMG'?'load':'loadeddata',()=>{clearTimeout(timer);resolve();},{once:true});el.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Media could not decode: '+e.name));},{once:true});});
  el.src=c.src;await ready;
 }));
 return{
  dispose(){for(const el of media.values()){if(el.tagName==='VIDEO')el.pause();el.removeAttribute('src');if(el.tagName==='VIDEO')el.load();}media.clear();},
  hasVideo:project.shots.some(s=>s.entities.some(e=>e.content&&e.layer?.binding==='video')),
  paint(g,e,width,height){const c=e.content;g.save();g.translate((width-c.width)/2,(height-c.height)/2);
   if(e.layer.binding==='text'){g.font=`${c.fontSize}px ${c.fontFamily}`;g.fillStyle=c.color;g.textAlign=c.align;g.textBaseline='top';const x=c.align==='left'?0:c.align==='right'?c.width:c.width/2;
    c.text.split('\n').forEach((line,i)=>g.fillText(line,x,i*c.fontSize*1.2,c.width));
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
