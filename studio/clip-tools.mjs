const audio=e=>e?.type==='audioCue'&&e.cue?.voice==='file';
const bounds=e=>audio(e)?{startFrame:e.cue.frame,endFrame:e.cue.frame+e.cue.durationFrames,locked:!!e.cue.linkedVideoId}:e?.layer;
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function createClipTools({host,body,editor,getState,jump,snap,isExporting}){
 const bar=document.createElement('div');bar.className='clip-tools';bar.setAttribute('role','group');bar.setAttribute('aria-label','Selected clip timing');host.insertBefore(bar,body);let signature='',drag=null,suppressClick=false,focusedClip=null;const drafts=new Map();const draftKey=s=>s.work.id+'|'+s.entity?.id;
 document.addEventListener('focusin',e=>{focusedClip=e.target.closest('[data-clip-id]')?.dataset.clipId||null;});
 function refresh(){
  const s=editor()?.snapshot(),allowed=s?.capabilities.operations.includes('moveClip');bar.hidden=!allowed;if(!allowed)return;
  const e=s.entity,clip=e?.type==='layer2d'||audio(e),token=JSON.stringify([s.work.id,s.revision,e?.id]);
  if(token!==signature&&!drag){signature=token;bar.innerHTML=clip?`<strong>${esc(e.name)}</strong><label>In <input data-clip-in type="number" min="0" max="${s.shot.durationFrames-1}" value="${bounds(e).startFrame}"></label><label>Out <input data-clip-out type="number" min="1" max="${audio(e)?bounds(e).startFrame+216000:s.shot.durationFrames}" value="${bounds(e).endFrame}"></label><button class="btn" data-clip-action="move">Move to In</button><button class="btn" data-clip-action="trim">Trim to In / Out</button><label>Duration <input data-clip-duration type="number" min="1" max="${audio(e)?216000:s.shot.durationFrames-bounds(e).startFrame}" value="${bounds(e).endFrame-bounds(e).startFrame}"></label><button class="btn" data-clip-action="stretch">Stretch</button><button class="btn" data-clip-action="split">Split at playhead</button><button class="btn" data-clip-action="duplicate">Duplicate</button><button class="btn" data-clip-action="discard">Discard timing draft</button><p class="small mut">Drag a clip to move it; drag an edge to trim. Out is exclusive. Trim preserves speed; linked audio follows its video. Stretch changes video speed and pitch of linked audio. Escape cancels a drag.</p><span data-clip-status role="status"></span>`:'<p class="small mut">Select a visual or audio clip to move, trim, split or duplicate it.</p><span data-clip-status role="status"></span>';}
  const draft=drafts.get(draftKey(s));if(draft){for(const key of ['in','out','duration']){const input=bar.querySelector('[data-clip-'+key+']');if(input&&document.activeElement!==input)input.value=draft[key];}if(s.revision!==draft.revision)status('Project changed while timing was drafted. Discard the timing draft to review current values.');}
  for(const b of bar.querySelectorAll('button,input'))b.disabled=s.blocked||isExporting()||!!e?.cue?.linkedVideoId;const stretch=bar.querySelector('[data-clip-action=stretch]');if(stretch)stretch.disabled ||= audio(e);
  const split=bar.querySelector('[data-clip-action=split]');if(split)split.disabled ||= s.local<0||s.local>=s.shot.durationFrames||s.local<=bounds(e).startFrame||s.local>=bounds(e).endFrame;
  for(const el of body.querySelectorAll('.tl-item')){
   const item=getState().tracks?.[Number(el.dataset.t)]?.items?.[Number(el.dataset.i)],entity=s.project.shots.flatMap(x=>x.entities).find(e=>e.id===item?.targetId&&(e.type==='layer2d'||audio(e)));
   if(!entity)continue;el.dataset.clipId=entity.id;el.tabIndex=0;el.classList.toggle('clip-selected',entity.id===s.entity?.id);if(focusedClip===entity.id&&document.activeElement===document.body)el.focus({preventScroll:true});el.title=entity.name+' · drag to move; edge handles trim';
   if(!el.querySelector('[data-clip-edge]'))for(const edge of ['in','out']){const h=document.createElement('span');h.className='clip-edge clip-edge-'+edge;h.dataset.clipEdge=edge;h.title='Trim '+edge;el.append(h);}
  }
 }
 async function commit(s,ops,name){const result=await editor().commit(ops,name,{baseRevision:drafts.get(draftKey(s))?.revision||s.revision});if(result)drafts.delete(draftKey(s));signature='';refresh();if(!result)status('Not applied. Check the Inspector for drafts, locked layers or a conflict.');return result;}
 const status=text=>{const el=bar.querySelector('[data-clip-status]');if(el)el.textContent=text;};
 bar.oninput=()=>{const s=editor()?.snapshot();if(!s?.entity||!bounds(s.entity))return;drafts.set(draftKey(s),{revision:drafts.get(draftKey(s))?.revision||s.revision,...Object.fromEntries(['in','out','duration'].map(k=>[k,bar.querySelector('[data-clip-'+k+']').value]))});status('Timing draft · choose Move, Trim or Stretch to save.');};
 bar.onclick=async event=>{const b=event.target.closest('[data-clip-action]'),s=editor()?.snapshot();if(!b||!s||s.blocked)return;if(JSON.stringify([s.work.id,s.revision,s.entity?.id])!==signature){refresh();status('Selection changed. Review the current clip timing.');return;}const e=s.entity,a=b.dataset.clipAction,id='layer-'+crypto.randomUUID(),start=Number(bar.querySelector('[data-clip-in]').value),end=Number(bar.querySelector('[data-clip-out]').value),duration=Number(bar.querySelector('[data-clip-duration]').value);
  if(a==='discard'){drafts.delete(draftKey(s));signature='';refresh();return;}if(![...bar.querySelectorAll('input')].every(i=>i.value!==''&&i.reportValidity()))return;
  const op=a==='move'?{type:audio(e)?'moveAudio':'moveClip',targetId:e.id,startFrame:start}:a==='trim'?{type:audio(e)?'trimAudio':'trimClip',targetId:e.id,startFrame:start,endFrame:end}:a==='stretch'?{type:'stretchClip',targetId:e.id,durationFrames:duration}:a==='split'?{type:audio(e)?'splitAudio':'splitClip',targetId:e.id,frame:s.local,id}:{type:audio(e)?'duplicateAudio':'duplicateLayer',targetId:e.id,id};
  const result=await commit(s,[op],a[0].toUpperCase()+a.slice(1)+' clip');if(result&&['split','duplicate'].includes(a))editor().select(id);
 };
 body.addEventListener('pointerdown',event=>{
  const el=event.target.closest('[data-clip-id]'),s=editor()?.snapshot();if(!el||!s||s.blocked||drafts.has(draftKey(s))||isExporting()||!s.capabilities.operations.includes('moveClip'))return;
  const shot=s.project.shots.find(x=>x.entities.some(e=>e.id===el.dataset.clipId)),entity=shot.entities.find(e=>e.id===el.dataset.clipId);if(bounds(entity).locked)return;
  let start=0;for(const x of s.project.shots){if(x===shot)break;start+=x.durationFrames;}
  const item=getState().tracks[Number(el.dataset.t)].items[Number(el.dataset.i)];if(item.f!==start+bounds(entity).startFrame||item.n!==bounds(entity).endFrame-bounds(entity).startFrame){status('Preview is reloading. Try again once it is ready.');return;}
  editor().select(entity.id);el.focus();drag={el,s,shot,entity,start,edge:event.target.dataset.clipEdge||'move',x:event.clientX,width:el.parentElement.getBoundingClientRect().width,from:bounds(entity).startFrame,to:bounds(entity).endFrame,moved:false};el.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
 },true);
 body.addEventListener('pointermove',event=>{if(!drag)return;const d=drag,n=getState().total,delta=Math.round((event.clientX-d.x)/d.width*n),old=bounds(d.entity);d.moved ||= Math.abs(event.clientX-d.x)>3;
  let frame=(d.edge==='out'?old.endFrame:old.startFrame)+delta;
  if(snap()){const points=[0,d.shot.durationFrames,getState().frame-d.start,...d.shot.entities.filter(e=>bounds(e)&&e.id!==d.entity.id).flatMap(e=>[bounds(e).startFrame,bounds(e).endFrame])],threshold=n/d.width*6,nearest=points.sort((a,b)=>Math.abs(a-frame)-Math.abs(b-frame))[0];if(Math.abs(nearest-frame)<=threshold)frame=nearest;}
  if(d.edge==='move'){d.from=Math.max(0,Math.min((audio(d.entity)?d.shot.durationFrames-1:d.shot.durationFrames-(old.endFrame-old.startFrame)),frame));d.to=d.from+old.endFrame-old.startFrame;}
  else if(d.edge==='in')d.from=Math.max(old.startFrame,Math.min(old.endFrame-1,frame));else d.to=Math.max(old.startFrame+1,Math.min(old.endFrame,frame));
  d.el.style.left=100*(d.start+d.from)/n+'%';d.el.style.width=100*(d.to-d.from)/n+'%';status(`${d.edge==='move'?'Move':'Trim'}: ${d.from}–${d.to}f`);event.stopPropagation();
 },true);
 function restore(d){const n=getState().total;d.el.style.left=100*(d.start+bounds(d.entity).startFrame)/n+'%';d.el.style.width=100*(bounds(d.entity).endFrame-bounds(d.entity).startFrame)/n+'%';}
 body.addEventListener('pointerup',async event=>{const d=drag;drag=null;if(!d)return;if(!d.moved){restore(d);return;}suppressClick=true;event.preventDefault();event.stopPropagation();if(d.from===bounds(d.entity).startFrame&&d.to===bounds(d.entity).endFrame){restore(d);return;}
  const op=d.edge==='move'?{type:audio(d.entity)?'moveAudio':'moveClip',targetId:d.entity.id,startFrame:d.from}:{type:audio(d.entity)?'trimAudio':'trimClip',targetId:d.entity.id,startFrame:d.from,endFrame:d.to};const result=await commit(d.s,[op],d.edge==='move'?'Move clip':'Trim clip');if(!result)restore(d);
 },true);
 body.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
 const cancel=()=>{if(drag){restore(drag);drag=null;suppressClick=true;status('Drag cancelled.');}};body.addEventListener('pointercancel',cancel);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){cancel();e.preventDefault();}});
 body.addEventListener('keydown',async e=>{const el=e.target.closest('[data-clip-id]'),s=editor()?.snapshot();if(!el||s?.blocked||!s.capabilities.operations.includes('moveClip'))return;
  if(e.key==='Enter'){const item=getState().tracks[Number(el.dataset.t)].items[Number(el.dataset.i)];jump(item.f);editor().select(el.dataset.clipId);e.preventDefault();return;}
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();const shot=s.project.shots.find(x=>x.entities.some(e=>e.id===el.dataset.clipId)),entity=shot.entities.find(e=>e.id===el.dataset.clipId);if(bounds(entity).locked)return;const next=bounds(entity).startFrame+(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?10:1);if(next>=0&&(audio(entity)?next<shot.durationFrames:next+bounds(entity).endFrame-bounds(entity).startFrame<=shot.durationFrames))await commit(s,[{type:audio(entity)?'moveAudio':'moveClip',targetId:entity.id,startFrame:next}],'Nudge clip');
 });
 return{refresh};
}
