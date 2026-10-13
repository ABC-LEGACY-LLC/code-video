// Handles live in the DOM, never in the film canvas or exported pixels.
export function mountStageTools(W,{editor,isExporting,pause}){
 if(typeof W.__layerGeometry!=='function')return;
 const doc=W.document,ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');
 svg.setAttribute('aria-label','Selected layer transform handles');svg.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;overflow:visible';
 const color=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim();
 const node=(tag,attrs)=>{const el=doc.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);svg.append(el);return el;};
 const polygon=node('polygon',{fill:'transparent',stroke:color,'stroke-width':2,'data-transform':'move',tabindex:0,role:'button','aria-label':'Move selected layer; arrow keys nudge'});
 polygon.style.pointerEvents='all';polygon.style.cursor='move';
 const scale=node('circle',{r:7,fill:color,'data-transform':'scale',role:'button','aria-label':'Scale selected layer'}),rotation=node('circle',{r:7,fill:color,'data-transform':'rotation',role:'button','aria-label':'Rotate selected layer'});
 for(const el of [scale,rotation]){el.style.pointerEvents='all';el.style.cursor='grab';}
 doc.body.append(svg);let drag=null,geometry=null,raf;
 const canvas=()=>doc.querySelector('canvas');
 const clear=()=>W.__setLayerPreview?.({transform:null});
 function draw(){
  if(!svg.isConnected)return;
  const s=editor()?.snapshot(),c=canvas();
  geometry=s?.entity?.layer&&!s.blocked&&!isExporting()?W.__layerGeometry(s.entity.id):null;
  if(!geometry||!c||W.__frame?.().playing){svg.style.display='none';raf=W.requestAnimationFrame(draw);return;}
  svg.style.display='block';const r=c.getBoundingClientRect(),toPixel=p=>({x:r.left+p.x*r.width,y:r.top+p.y*r.height}),points=geometry.points.map(toPixel);
  polygon.setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' '));
  scale.setAttribute('cx',points[2].x);scale.setAttribute('cy',points[2].y);
  const top={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};rotation.setAttribute('cx',top.x);rotation.setAttribute('cy',top.y-24);
  raf=W.requestAnimationFrame(draw);
 }
 svg.addEventListener('pointerdown',event=>{
  const kind=event.target.dataset.transform;if(!kind||!geometry||isExporting())return;
  pause();const s=editor().snapshot();if(s.blocked)return;
  const r=canvas().getBoundingClientRect(),pivot={x:r.left+geometry.pivot.x*r.width,y:r.top+geometry.pivot.y*r.height};
  drag={kind,id:s.entity.id,entity:s.entity,local:s.local,geometry:structuredClone(geometry),x:event.clientX,y:event.clientY,pivot,rect:r,values:{...geometry.values},moved:false};
  event.target.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
 });
 svg.addEventListener('pointermove',event=>{if(!drag)return;const d=drag,g=d.geometry,v={...g.values};d.moved ||= Math.hypot(event.clientX-d.x,event.clientY-d.y)>2;
  if(d.kind==='move'){const dx=(event.clientX-d.x)/d.rect.width*g.width,dy=(event.clientY-d.y)/d.rect.height*g.height,[a,b,c,f]=g.inverse;v.x=Math.max(-4000,Math.min(4000,v.x+a*dx+c*dy));v.y=Math.max(-4000,Math.min(4000,v.y+b*dx+f*dy));}
  if(d.kind==='scale'){const before=Math.hypot(d.x-d.pivot.x,d.y-d.pivot.y),after=Math.hypot(event.clientX-d.pivot.x,event.clientY-d.pivot.y);v.scale=Math.max(.1,Math.min(8,v.scale*after/Math.max(1,before)));}
  if(d.kind==='rotation'){const angle=Math.atan2(event.clientY-d.pivot.y,event.clientX-d.pivot.x)-Math.atan2(d.y-d.pivot.y,d.x-d.pivot.x);v.rotation=Math.max(-3600,Math.min(3600,v.rotation+angle*180/Math.PI));if(event.shiftKey)v.rotation=Math.round(v.rotation/15)*15;}
  d.values=v;W.__setLayerPreview({transform:{targetId:d.id,properties:v}});
 });
 const commit=d=>{const keys=d.kind==='move'?['x','y']:[d.kind];return editor().commit(keys.filter(k=>d.values[k]!==d.geometry.values[k]).map(property=>d.entity.keyframes[property]?.length?{type:'setKeyframe',targetId:d.id,property,frame:d.local,value:d.values[property],easing:'linear'}:{type:'setProperty',targetId:d.id,property,value:d.values[property]}),'Transform layer');};
 svg.addEventListener('pointerup',async event=>{const d=drag;drag=null;if(!d)return;try{if(d.moved)await commit(d);else{const id=W.__pickLayer?.((d.x-d.rect.left)/d.rect.width,(d.y-d.rect.top)/d.rect.height,{allLayers:event.altKey});if(id)editor().pick(id);}}finally{clear();}});
 svg.addEventListener('pointercancel',()=>{drag=null;clear();});
 doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){drag=null;clear();event.preventDefault();}});
 polygon.addEventListener('keydown',async event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!geometry)return;event.preventDefault();event.stopPropagation();const s=editor().snapshot();if(s.blocked)return;const property=['ArrowLeft','ArrowRight'].includes(event.key)?'x':'y',delta=(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)*(event.shiftKey?10:1),value=Math.max(-4000,Math.min(4000,geometry.values[property]+delta));await editor().commit([{type:s.entity.keyframes[property]?.length?'setKeyframe':'setProperty',targetId:s.entity.id,property,value,...(s.entity.keyframes[property]?.length?{frame:s.local,easing:'linear'}:{})}],'Nudge layer');});
 draw();W.addEventListener('pagehide',()=>{W.cancelAnimationFrame(raf);svg.remove();},{once:true});
}
