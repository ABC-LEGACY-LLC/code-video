import {canvasViewport,selectionGeometry,selectionBounds,translated,transformOperations} from './selection-tools.mjs';
// DOM overlays are excluded from the film canvas and exports.
export function mountStageTools(W,{editor,isExporting,pause}){
 if(typeof W.__layerGeometry!=='function')return;W.__studioCanvasViewport=canvasViewport;
 const doc=W.document,ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');svg.setAttribute('aria-label','Selected layer transform handles');svg.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;overflow:visible';
 const color=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim(),node=(tag,attrs)=>{const e=doc.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;};
 const polygon=node('polygon',{fill:'transparent',stroke:color,'stroke-width':2,'data-transform':'move',tabindex:0,role:'button','aria-label':'Move selected layers; arrow keys nudge; Shift adds to selection'});polygon.style.pointerEvents='all';polygon.style.cursor='move';
 const scale=node('circle',{r:7,fill:color,'data-transform':'scale',tabindex:0,role:'button','aria-label':'Scale selected layers proportionally'}),rotation=node('circle',{r:7,fill:color,'data-transform':'rotation',tabindex:0,role:'button','aria-label':'Rotate selected layer'});for(const e of [scale,rotation]){e.style.pointerEvents='all';e.style.cursor='grab';}
 doc.body.append(svg);let drag=null,items=[],raf;
 const canvas=()=>doc.querySelector('canvas'),clear=()=>W.__setLayerPreview?.({transform:null,transforms:null});
 function draw(){
  if(!svg.isConnected)return;const s=editor()?.snapshot(),c=canvas();items=s&&!s.blocked&&s.local>=0&&s.local<s.shot.durationFrames&&!isExporting()?selectionGeometry(s,W):[];
  if(items.length!==(s?.selection?.length||1)||!items.length||!c||W.__frame?.().playing){svg.style.display='none';raf=W.requestAnimationFrame(draw);return;}
  svg.style.display='block';const r=canvasViewport(c),b=selectionBounds(items),points=items.length===1?items[0].g.points:[{x:b.left,y:b.top},{x:b.right,y:b.top},{x:b.right,y:b.bottom},{x:b.left,y:b.bottom}],p=points.map(p=>({x:r.left+p.x*r.width,y:r.top+p.y*r.height}));polygon.setAttribute('points',p.map(p=>`${p.x},${p.y}`).join(' '));scale.setAttribute('cx',p[2].x);scale.setAttribute('cy',p[2].y);rotation.style.display=items.length===1?'':'none';rotation.setAttribute('cx',(p[0].x+p[1].x)/2);rotation.setAttribute('cy',(p[0].y+p[1].y)/2-24);raf=W.requestAnimationFrame(draw);
 }
 svg.addEventListener('pointerdown',event=>{
  const kind=event.target.dataset.transform,s=editor()?.snapshot();if(!kind||!items.length||s?.blocked||isExporting())return;pause();const rect=canvasViewport(canvas()),b=selectionBounds(items),center=items.length===1?items[0].g.pivot:{x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};
  drag={kind,items:structuredClone(items),revision:s.revision,frame:s.local,x:event.clientX,y:event.clientY,rect,center,values:items.map(i=>({...i.g.values})),moved:false};event.target.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
 });
 svg.addEventListener('pointermove',event=>{if(!drag)return;const d=drag;d.moved ||= Math.hypot(event.clientX-d.x,event.clientY-d.y)>2;const x=(event.clientX-d.rect.left)/d.rect.width,y=(event.clientY-d.rect.top)/d.rect.height;
  d.values=d.items.map(({g})=>{
   if(d.kind==='move')return translated(g,(event.clientX-d.x)/d.rect.width,(event.clientY-d.y)/d.rect.height);
   if(d.kind==='scale'){const px=d.rect.left+d.center.x*d.rect.width,py=d.rect.top+d.center.y*d.rect.height,ratio=Math.hypot(event.clientX-px,event.clientY-py)/Math.max(1,Math.hypot(d.x-px,d.y-py)),v=translated(g,(g.pivot.x-d.center.x)*(ratio-1),(g.pivot.y-d.center.y)*(ratio-1));return{...v,scale:g.values.scale*ratio};}
   const a=Math.atan2((y-d.center.y)*d.rect.height,(x-d.center.x)*d.rect.width)-Math.atan2(d.y-d.rect.top-d.center.y*d.rect.height,d.x-d.rect.left-d.center.x*d.rect.width);let rotation=g.values.rotation+a*180/Math.PI;if(event.shiftKey)rotation=Math.round(rotation/15)*15;return{...g.values,rotation};
  });
  W.__setLayerPreview({transform:d.items.length===1?{targetId:d.items[0].entity.id,properties:d.values[0]}:null,transforms:Object.fromEntries(d.items.map((i,j)=>[i.entity.id,d.values[j]]))});
 });
 svg.addEventListener('pointerup',async event=>{const d=drag;drag=null;if(!d)return;try{if(d.moved){const ops=transformOperations(d.items,d.values,d.frame);if(ops.length)await editor().commit(ops,'Transform selected layers',{baseRevision:d.revision});}else{const id=W.__pickLayer?.((d.x-d.rect.left)/d.rect.width,(d.y-d.rect.top)/d.rect.height,{allLayers:event.altKey});if(id)editor().pick(id,event.shiftKey||event.ctrlKey||event.metaKey);}}finally{clear();}});
 svg.addEventListener('pointercancel',()=>{drag=null;clear();});doc.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&!event.target.closest('input,textarea,select')&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();editor().history(event.shiftKey||event.key.toLowerCase()==='y'?'redo':'undo');return;}if(event.key==='Escape'&&drag){drag=null;clear();event.preventDefault();}});
 svg.addEventListener('keydown',async event=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!items.length)return;event.preventDefault();event.stopPropagation();const s=editor().snapshot();if(s.blocked)return;const pixels=(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)*(event.shiftKey?10:1),x=['ArrowLeft','ArrowRight'].includes(event.key),values=items.map(({g})=>translated(g,x?pixels/g.width:0,x?0:pixels/g.height));await editor().commit(transformOperations(items,values,s.local),'Nudge selected layers',{baseRevision:s.revision});
 });
 draw();W.addEventListener('pagehide',()=>{W.cancelAnimationFrame(raf);svg.remove();},{once:true});
}
