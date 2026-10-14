// Canvas CSS can letterbox its bitmap inside a larger element box. Picking,
// overlays and deltas must use the painted content rectangle, not that outer box.
export function canvasViewport(canvas){
 const r=canvas.getBoundingClientRect(),style=canvas.ownerDocument.defaultView.getComputedStyle(canvas),fit=style.objectFit;
 if(!['contain','scale-down'].includes(fit)||!canvas.width||!canvas.height)return{left:r.left,top:r.top,width:r.width,height:r.height};
 const scale=Math.min(r.width/canvas.width,r.height/canvas.height,...(fit==='scale-down'?[1]:[])),width=canvas.width*scale,height=canvas.height*scale;
 const pos=style.objectPosition.split(' '),offset=(value,space)=>value?.endsWith('%')?parseFloat(value)/100*space:value?.endsWith('px')?parseFloat(value):space/2;
 return{left:r.left+offset(pos[0],r.width-width),top:r.top+offset(pos[1]||pos[0],r.height-height),width,height};
}
// Geometry is in normalized screen coordinates; deltas return to each layer's
// coordinate space through its renderer-provided inverse camera transform.
export function selectionGeometry(snapshot,W){
 const ids=snapshot.selection?.length?snapshot.selection:[snapshot.entity?.id];
 return ids.map(id=>{const entity=snapshot.shot.entities.find(e=>e.id===id),g=W?.__layerGeometry?.(id);return entity?.type==='layer2d'&&g?{entity,g}:null;}).filter(Boolean);
}
export function boundsOf(g){const xs=g.points.map(p=>p.x),ys=g.points.map(p=>p.y);return{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};}
export function selectionBounds(items){const bs=items.map(({g})=>boundsOf(g));return{left:Math.min(...bs.map(b=>b.left)),right:Math.max(...bs.map(b=>b.right)),top:Math.min(...bs.map(b=>b.top)),bottom:Math.max(...bs.map(b=>b.bottom))};}
export function translated(g,dx,dy){const[a,b,c,d]=g.inverse;return{...g.values,x:g.values.x+a*dx*g.width+c*dy*g.height,y:g.values.y+b*dx*g.width+d*dy*g.height};}
export function transformOperations(items,values,frame){return items.flatMap(({entity,g},i)=>['x','y','scale','rotation'].filter(k=>values[i][k]!==undefined&&Math.abs(values[i][k]-g.values[k])>1e-8).map(property=>entity.keyframes[property]?.length?{type:'setKeyframe',targetId:entity.id,property,frame,value:Number(values[i][property].toFixed(6)),easing:entity.keyframes[property].find(k=>k.frame===frame)?.easing||'linear'}:{type:'setProperty',targetId:entity.id,property,value:Number(values[i][property].toFixed(6))}));}
export function arrangeSelection(items,action,frame){
 if(items.length<2)throw new Error('Select at least two visible unlocked layers');
 const box=selectionBounds(items),vertical=['top','middle','bottom','distributeY'].includes(action),axis=vertical?'y':'x',lo=vertical?'top':'left',hi=vertical?'bottom':'right';
 const offsets=new Map();
 if(action.startsWith('distribute')){
  if(items.length<3)throw new Error('Select at least three layers to distribute');
  const sorted=items.map(item=>({item,b:boundsOf(item.g)})).sort((a,b)=>(a.b[lo]+a.b[hi])-(b.b[lo]+b.b[hi])),first=(sorted[0].b[lo]+sorted[0].b[hi])/2,last=(sorted.at(-1).b[lo]+sorted.at(-1).b[hi])/2;
  sorted.forEach(({item,b},i)=>offsets.set(item,first+(last-first)*i/(items.length-1)-(b[lo]+b[hi])/2));
 }else{
  if(!['left','center','right','top','middle','bottom'].includes(action))throw new Error('Unknown alignment');
  const edge=['left','top'].includes(action)?lo:['right','bottom'].includes(action)?hi:null,target=edge?box[edge]:(box[lo]+box[hi])/2;
  for(const item of items){const b=boundsOf(item.g);offsets.set(item,target-(edge?b[edge]:(b[lo]+b[hi])/2));}
 }
 return transformOperations(items,items.map(item=>translated(item.g,axis==='x'?offsets.get(item):0,axis==='y'?offsets.get(item):0)),frame);
}
export function mountSelectionTools({container,s,shot,commit,windowOf,getFrame}){
 const ids=s.selection.filter(id=>shot.entities.some(e=>e.id===id&&e.type==='layer2d'));if(ids.length<2)return;
 const box=document.createElement('fieldset');box.dataset.selectionTools='';box.innerHTML=`<legend>${ids.length} layers selected</legend><p class="small mut">Align within the selection. Distribution uses equal center spacing. Animated transforms set a key at the playhead.</p><div class="editor-actions">${[['left','Left'],['center','Center'],['right','Right'],['top','Top'],['middle','Middle'],['bottom','Bottom'],['distributeX','Distribute X'],['distributeY','Distribute Y']].map(([a,b])=>`<button class="btn" type="button" data-arrange="${a}">${b}</button>`).join('')}</div>`;
 container.querySelector('[data-inspector]').before(box);
 box.onclick=e=>{const b=e.target.closest('[data-arrange]');if(!b)return;try{let start=0;for(const x of s.data.project.shots){if(x===shot)break;start+=x.durationFrames;}const frame=getFrame()-start;if(frame<0||frame>=shot.durationFrames)throw Error('Move the playhead into this scene');const items=selectionGeometry({shot,selection:ids},windowOf());if(items.length!==ids.length)throw Error('All selected layers must be visible and unlocked');const ops=arrangeSelection(items,b.dataset.arrange,frame);if(ops.length)commit(ops,'Arrange selected layers');}catch(error){s.error=error.message;container.querySelector('[data-error]').textContent=s.error;container.querySelector('[data-conflict]').hidden=false;}};
}
