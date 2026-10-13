const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function createTimelineTools({host,body,editor,windowOf,getState,jump,isExporting}){
 const bar=document.createElement('div');bar.className='tl-bar';bar.innerHTML='<label>Zoom <input data-zoom type="range" min="1" max="12" step="0.5" value="1" aria-label="Timeline zoom"></label><label><input type="checkbox" data-snap checked> Snap to frames / cuts</label><button class="btn" data-wave>Show audio waveform</button><span data-tl-status role="status"></span>';
 host.insertBefore(bar,body);const box=document.createElement('details');box.className='animation-timeline';box.open=true;box.innerHTML='<summary data-title>Selected element · keyframes</summary><div class="animation-scroll"><div data-ruler></div><div data-keys></div><canvas data-waveform hidden height="64"></canvas></div>';host.append(box);
 const zoom=bar.querySelector('[data-zoom]'),snap=bar.querySelector('[data-snap]'),status=bar.querySelector('[data-tl-status]'),scroll=box.querySelector('.animation-scroll'),ruler=box.querySelector('[data-ruler]'),lanes=box.querySelector('[data-keys]'),wave=box.querySelector('canvas');let signature='',drag=null,waveRevision=null;
 function size(){const labels=parseFloat(getComputedStyle(body).getPropertyValue('--lab'))||168;body.style.gridTemplateColumns=`var(--lab) ${Math.max(100,body.clientWidth-labels-32)*Number(zoom.value)}px`;body.style.setProperty('--timeline-width',`${Math.max(100,body.clientWidth-labels-32)*Number(zoom.value)}px`);ruler.style.width=lanes.style.width=wave.style.width=`${Math.max(200,scroll.clientWidth)*Number(zoom.value)}px`;}
 zoom.oninput=()=>{size();signature='';refresh();};new ResizeObserver(size).observe(body);
 function refresh(){
  const s=editor()?.snapshot();box.hidden=!s?.entity;if(!s)return;const token=JSON.stringify([s.entity,s.shot.durationFrames,zoom.value]);if(token===signature||drag)return;signature=token;
  box.querySelector('[data-title]').textContent=s.entity.name+' · keyframes';size();
  const max=s.shot.durationFrames-1,step=Math.max(1,Math.ceil(s.shot.durationFrames/(8*Number(zoom.value))));ruler.innerHTML='';for(let f=0;f<=max;f+=step){const b=document.createElement('button');b.className='ruler-mark';b.style.left=100*f/Math.max(1,max)+'%';b.textContent=f+'f';b.onclick=()=>jump(s.start+f);ruler.append(b);}
  lanes.innerHTML=Object.entries(s.entity.keyframes).filter(([,keys])=>keys.length).map(([property,keys])=>`<div class="animation-lane"><span>${esc(property)}</span>${keys.map(k=>`<button class="key-diamond" data-property="${esc(property)}" data-frame="${k.frame}" style="left:${100*k.frame/Math.max(1,max)}%" aria-label="${esc(property)}, frame ${k.frame}, value ${k.value}" title="${esc(property)} · ${k.frame}f · ${k.value}"></button>`).join('')}</div>`).join('')||'<p class="small mut">Set a keyframe in the Inspector to animate this element.</p>';
 }
 lanes.addEventListener('pointerdown',e=>{const b=e.target.closest('.key-diamond'),s=editor()?.snapshot();if(!b||!s||s.blocked||isExporting())return;const frame=Number(b.dataset.frame),property=b.dataset.property;drag={b,s,property,key:s.entity.keyframes[property].find(k=>k.frame===frame),frame,x:e.clientX,width:b.parentElement.getBoundingClientRect().width};b.setPointerCapture(e.pointerId);e.preventDefault();});
 lanes.addEventListener('pointermove',e=>{if(!drag)return;const d=drag,max=d.s.shot.durationFrames-1;let f=Math.max(0,Math.min(max,Math.round(d.key.frame+(e.clientX-d.x)/d.width*max)));if(snap.checked){const points=[0,max,Math.max(0,Math.min(max,getState().frame-d.s.start))];const closest=points.find(p=>Math.abs(f-p)<=Math.max(1,max/d.width*6));if(closest!==undefined)f=closest;}d.frame=f;d.b.style.left=100*f/Math.max(1,max)+'%';status.textContent=`${d.property} → ${f}f`;});
 lanes.addEventListener('pointerup',async()=>{const d=drag;drag=null;if(!d)return;
  if(d.frame===d.key.frame){jump(d.s.start+d.frame);return;}
  if(d.s.entity.keyframes[d.property].some(k=>k.frame===d.frame)){status.textContent='A keyframe already occupies that frame.';signature='';refresh();return;}
  await editor().commit([{type:'deleteKeyframe',targetId:d.s.entity.id,property:d.property,frame:d.key.frame},{type:'setKeyframe',targetId:d.s.entity.id,property:d.property,frame:d.frame,value:d.key.value,easing:d.key.easing}],'Move keyframe');signature='';refresh();status.textContent='';
 });
 lanes.addEventListener('pointercancel',()=>{drag=null;signature='';refresh();});
 lanes.addEventListener('keydown',async e=>{const b=e.target.closest('.key-diamond'),s=editor()?.snapshot();if(!b||s?.blocked||isExporting())return;const property=b.dataset.property,frame=Number(b.dataset.frame),key=s.entity.keyframes[property].find(k=>k.frame===frame);
  if(e.key==='Enter'){jump(s.start+frame);return;}if(!['ArrowLeft','ArrowRight','Delete','Backspace'].includes(e.key))return;e.preventDefault();const ops=[{type:'deleteKeyframe',targetId:s.entity.id,property,frame}];
  if(e.key.startsWith('Arrow')){const next=frame+(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?10:1);if(next<0||next>=s.shot.durationFrames||s.entity.keyframes[property].some(k=>k.frame===next))return;ops.push({type:'setKeyframe',targetId:s.entity.id,property,frame:next,value:key.value,easing:key.easing});}
  await editor().commit(ops,'Edit keyframe');signature='';refresh();
 });
 bar.querySelector('[data-wave]').onclick=async()=>{
  const s=editor()?.snapshot(),W=windowOf();if(!s||isExporting()||!W.__renderAudio){status.textContent='No rendered audio is available for this work.';return;}
  if(!wave.hidden){wave.hidden=true;return;}status.textContent='Rendering waveform…';
  try{const state=getState(),audio=await W.__renderAudio(state.total/state.fps,12000);if(W!==windowOf())return;wave.width=Math.min(4096,Math.max(800,state.total*2));const g=wave.getContext('2d');g.clearRect(0,0,wave.width,64);g.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--acc');const data=audio.channels[0];for(let x=0;x<wave.width;x++){let peak=0;for(let i=Math.floor(x*data.length/wave.width);i<Math.floor((x+1)*data.length/wave.width);i++)peak=Math.max(peak,Math.abs(data[i]));g.fillRect(x,32-peak*31,1,Math.max(1,peak*62));}wave.hidden=false;status.textContent='Full sequence mix';waveRevision=JSON.stringify(s.project);
  }catch(e){status.textContent=e.message;}
 };
 wave.onclick=e=>{const state=getState(),r=wave.getBoundingClientRect();jump(Math.round((e.clientX-r.left)/r.width*(state.total-1)));};
 setInterval(()=>{refresh();const s=editor()?.snapshot();if(waveRevision&&JSON.stringify(s?.project)!==waveRevision){wave.hidden=true;waveRevision=null;}},300);
 return{refresh(){size();signature='';refresh();}};
}
