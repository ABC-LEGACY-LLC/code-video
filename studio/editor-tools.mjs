const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function mountEditorTools({container,s,shot,entity,commit,api,update,getFrame}){
 const originalContent=entity?.content;entity=entity?.content?{...entity,content:s.extraDrafts?.[entity.id]||entity.content}:entity;
 const originalCue=entity?.cue;if(originalCue&&s.cueDrafts?.[entity.id])entity={...entity,cue:s.cueDrafts[entity.id]};
 const cueLabels={wind:['Voice level'],drone:['Start frequency (Hz)','End frequency (Hz)','Voice level'],breathS:['Voice level'],steel:['Voice level'],nz:['Voice level','Filter','Frequency (Hz)','Resonance','Pan (-1 to 1)','End frequency (Hz)']};
 const allowed=op=>s.data.capabilities.operations.includes(op);
 if(!allowed('addLayer')&&!allowed('addComponent'))return;
 const box=document.createElement('section');box.className='editor-tools';
 box.innerHTML=`<fieldset><legend>Create layers</legend>${allowed('addComponent')?`<label>Component<select data-component>${Object.entries(s.data.project.components||{}).map(([id,c])=>`<option value="${esc(id)}">${esc(c.label)} · ${esc(c.version)}</option>`).join('')}</select></label><button class="btn" data-add-component>Add component</button>`:''}<div class="editor-actions"><button class="btn" data-new-text ${allowed('addLayer')?'':'hidden'}>Add text</button><button class="btn" data-import ${allowed('addLayer')?'':'hidden'}>Import media</button><input hidden type="file" data-media accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,${allowed('addAudio')?'audio/wav,audio/mpeg,audio/ogg':''}"></div><p class="small mut">${allowed('addLayer')?'Media up to 18 MB. Images, video and audio. Video picture and imported audio have separate controls.':'Components start with their declared property defaults.'}</p><div class="editor-actions"><button class="btn" data-duplicate>Duplicate selected</button><button class="btn" data-remove>Delete selected</button></div></fieldset>
 ${entity?.content?`<fieldset data-content><legend>Layer content</legend>${entity.layer.binding==='text'?`<label>Text<textarea data-text maxlength="4000">${esc(entity.content.text)}</textarea></label><label>Font<select data-font>${['sans-serif','serif','monospace'].map(f=>`<option ${entity.content.fontFamily===f?'selected':''}>${f}</option>`).join('')}</select></label><label>Font size<input data-size type="number" min="8" max="500" value="${entity.content.fontSize}"></label><label>Color<input data-color type="color" value="${entity.content.color}"></label><label>Alignment<select data-align>${['left','center','right'].map(f=>`<option ${entity.content.align===f?'selected':''}>${f}</option>`).join('')}</select></label>`:`<label>Start in media (seconds)<input data-offset type="number" min="0" value="${entity.content.offsetSeconds}"></label><label>Playback speed<input data-rate type="number" min="0.1" max="8" step="0.1" value="${entity.content.playbackRate}"></label>`}<div class="editor-pair"><label>Width<input data-width type="number" min="1" max="7680" value="${entity.content.width}"></label><label>Height<input data-height type="number" min="1" max="7680" value="${entity.content.height}"></label></div><button class="btn" data-content-save>Apply content</button></fieldset>`:''}
 ${entity?.cue?`<fieldset data-cue-fields><legend>Sound cue · ${esc(entity.cue.voice)}</legend><label>Start frame in shot<input data-cue-frame type="number" min="0" max="${shot.durationFrames-1}" value="${entity.cue.frame}"></label><label>Duration (frames)<input data-cue-duration type="number" min="1" max="216000" value="${entity.cue.durationFrames}"></label>${entity.cue.voice==='file'?`<label>Start in audio (seconds)<input data-cue-offset type="number" min="0" max="21600" step="0.01" value="${entity.cue.offsetSeconds}"></label>`:(cueLabels[entity.cue.voice]||[]).map((label,i)=>`<label>${label}${typeof entity.cue.args[i]==='string'?`<select data-cue-arg="${i}">${['bandpass','lowpass','highpass'].map(v=>`<option ${v===entity.cue.args[i]?'selected':''}>${v}</option>`).join('')}</select>`:`<input data-cue-arg="${i}" type="number" step="any" value="${entity.cue.args[i]}">`}</label>`).join('')}<p class="small mut">The cue follows this shot when reordered. Gain, mute and fades are in the Inspector above. A long cue can continue across a cut.</p><button class="btn" data-cue-save>Apply sound cue</button><div class="editor-actions"><button class="btn" data-cue-copy>Duplicate cue</button><button class="btn" data-cue-delete>Delete cue</button></div></fieldset>`:''}
 <details data-proposal-details ${s.proposalOpen?'open':''}><summary>Review an AI proposal</summary><p class="small mut">Paste a JSON operations array, or an object with operations and baseRevision. Preview compares this frame without saving.</p><textarea data-proposal rows="6" aria-label="AI proposal JSON" placeholder='{"baseRevision":"…","operations":[…]}'>${esc(s.proposalText||'')}</textarea><button class="btn" data-proposal-preview>Preview proposal</button><p data-proposal-status role="status"></p><div data-comparison></div><div class="editor-actions"><button class="btn primary" data-proposal-apply hidden>Apply proposal</button><button class="btn" data-proposal-reject hidden>Discard proposal</button></div></details>`;
 container.querySelector('.editor').append(box);
 if(box.querySelector('[data-add-component]'))box.querySelector('[data-add-component]').onclick=()=>commit([{type:'addComponent',shotId:shot.id,id:'layer-'+crypto.randomUUID(),component:box.querySelector('[data-component]').value}],'Add component');
 const content=box.querySelector('[data-content]');if(content)container.querySelector('[data-inspector]').append(content);
 const q=selector=>container.querySelector(selector),id=()=> 'layer-'+crypto.randomUUID();
 const fail=e=>{s.error=e.message;update();};
 q('[data-new-text]').onclick=()=>{const key=id();commit([{type:'addLayer',shotId:shot.id,id:key,name:'Text',kind:'text',content:{text:'Your text',fontSize:72,fontFamily:'sans-serif',color:'#15171d',align:'center',width:900,height:180}}],'Add text',()=>{s.entityId=key;s.selection=[key];});};
 q('[data-import]').onclick=()=>q('[data-media]').click();
 q('[data-media]').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>18*1024*1024)throw new Error('Choose media up to 18 MB.');q('[data-import]').disabled=true;
   const url=URL.createObjectURL(file),el=document.createElement(file.type.startsWith('image/')?'img':file.type.startsWith('audio/')?'audio':'video');
   let width,height,duration;
   try{await new Promise((resolve,reject)=>{el.onload=el.onloadedmetadata=resolve;el.onerror=()=>reject(new Error('This media cannot be decoded'));el.src=url;});width=el.naturalWidth||el.videoWidth;height=el.naturalHeight||el.videoHeight;duration=el.duration;}finally{el.removeAttribute('src');URL.revokeObjectURL(url);}
   const bytes=new Uint8Array(await file.arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));
   const asset=await api('api/assets',{work:s.work.id,data:btoa(raw)}),key=id(),scale=Math.min(1,s.data.project.width/width,s.data.project.height/height);
   await commit([asset.kind==='audio'?{type:'addAudio',shotId:shot.id,id:key,name:file.name.slice(0,200),src:asset.src,durationFrames:Math.max(1,Math.min(216000,Math.round(duration*s.data.project.fps.num/s.data.project.fps.den)))}:{type:'addLayer',shotId:shot.id,id:key,name:file.name.slice(0,200),kind:asset.kind,content:{src:asset.src,width:Math.round(width*scale),height:Math.round(height*scale),offsetSeconds:0,playbackRate:1}}],'Import media',()=>{s.entityId=key;s.selection=[key];});
  }catch(e){fail(e);}finally{q('[data-import]').disabled=false;}
 };
 q('[data-duplicate]').disabled=!entity?.layer||entity.type==='group';q('[data-remove]').disabled=!entity?.layer;
 q('[data-duplicate]').onclick=()=>{const key=id();commit([{type:'duplicateLayer',targetId:entity.id,id:key}],'Duplicate layer',()=>{s.entityId=key;s.selection=[key];});};
 q('[data-remove]').onclick=()=>commit([{type:'deleteLayer',targetId:entity.id}],'Delete layer');
 if(entity?.content){
  for(const input of container.querySelectorAll('[data-content] input,[data-content] textarea,[data-content] select'))input.addEventListener('input',()=>{
   const c={...entity.content,width:Number(q('[data-width]').value),height:Number(q('[data-height]').value)};
   if(entity.layer.binding==='text')Object.assign(c,{text:q('[data-text]').value,fontSize:Number(q('[data-size]').value),fontFamily:q('[data-font]').value,color:q('[data-color]').value,align:q('[data-align]').value});
   else Object.assign(c,{offsetSeconds:Number(q('[data-offset]').value),playbackRate:Number(q('[data-rate]').value)});
   s.extraDrafts ||= {};if(JSON.stringify(c)===JSON.stringify(originalContent))delete s.extraDrafts[entity.id];else s.extraDrafts[entity.id]=c;update();
  });
 }
 if(entity?.content)q('[data-content-save]').onclick=()=>{
  const c={...entity.content,width:Number(q('[data-width]').value),height:Number(q('[data-height]').value)};
  if(entity.layer.binding==='text')Object.assign(c,{text:q('[data-text]').value,fontSize:Number(q('[data-size]').value),fontFamily:q('[data-font]').value,color:q('[data-color]').value,align:q('[data-align]').value});
  else Object.assign(c,{offsetSeconds:Number(q('[data-offset]').value),playbackRate:Number(q('[data-rate]').value)});
  commit([{type:'setContent',targetId:entity.id,content:c}],'Update content',()=>{delete s.extraDrafts?.[entity.id];});
 };
 if(entity?.cue){q('[data-cue-copy]').onclick=()=>commit([{type:'duplicateAudio',targetId:entity.id,id:id()}],'Duplicate audio cue');q('[data-cue-delete]').onclick=()=>commit([{type:'deleteAudio',targetId:entity.id}],'Delete audio cue');}
 if(entity?.cue){
  const patch=()=>({frame:Number(q('[data-cue-frame]').value),durationFrames:Number(q('[data-cue-duration]').value),...(entity.cue.voice==='file'?{offsetSeconds:Number(q('[data-cue-offset]').value)}:{args:[...container.querySelectorAll('[data-cue-arg]')].map(el=>el.tagName==='SELECT'?el.value:Number(el.value))})});
  for(const input of container.querySelectorAll('[data-cue-fields] input,[data-cue-fields] select'))input.addEventListener('input',()=>{const cue={...originalCue,...patch()};s.cueDrafts||={};if(JSON.stringify(cue)===JSON.stringify(originalCue))delete s.cueDrafts[entity.id];else s.cueDrafts[entity.id]=cue;update();});
  q('[data-cue-save]').onclick=()=>commit([{type:'setCue',targetId:entity.id,patch:patch()}],'Update sound cue',()=>{delete s.cueDrafts?.[entity.id];});
 }
 q('[data-proposal]').oninput=e=>{s.proposalText=e.target.value;};q('[data-proposal-details]').ontoggle=e=>{s.proposalOpen=e.target.open;};
 let proposal=null;
 q('[data-proposal-preview]').onclick=async()=>{
  try{q('[data-proposal-status]').textContent='Preparing comparison…';
   const input=JSON.parse(q('[data-proposal]').value);proposal=await api('api/proposal',{work:s.work.id,baseRevision:input.baseRevision||s.data.revision,operations:Array.isArray(input)?input:input.operations});
   q('[data-comparison]').replaceChildren();
   await Promise.all(['before','after'].map(async key=>{
    const wrap=document.createElement('div'),title=document.createElement('strong');title.textContent=key==='before'?'Before':'Proposed';wrap.append(title);
    const frame=document.createElement('iframe');frame.title=title.textContent;frame.className='proposal-frame';frame.studioPreviewProject=proposal[key];frame.src='/w/'+s.work.page+'?embed&review=1';wrap.append(frame);q('[data-comparison]').append(wrap);
    await new Promise((resolve,reject)=>{let tries=0;const timer=setInterval(async()=>{if(!frame.isConnected){clearInterval(timer);return resolve();}const w=frame.contentWindow;if(w.__failed){clearInterval(timer);reject(new Error(w.__failed));}else if(w.__ready){clearInterval(timer);try{w.__pause?.();await w.__frameTo(Math.min(getFrame(),w.__totalFrames-1));await w.__prepareFrame?.();resolve();}catch(e){reject(e);}}else if(++tries>80){clearInterval(timer);reject(new Error('Comparison preview timed out'));}},200);});
   }));
   q('[data-proposal-status]').textContent=`${proposal.operations.length} operations · frame ${getFrame()} · not saved`;q('[data-proposal-apply]').hidden=false;q('[data-proposal-reject]').hidden=false;
  }catch(e){proposal=null;q('[data-proposal-status]').textContent=e.message;q('[data-proposal-apply]').hidden=true;}
 };
 q('[data-proposal-reject]').onclick=()=>{proposal=null;q('[data-comparison]').replaceChildren();q('[data-proposal-apply]').hidden=true;q('[data-proposal-reject]').hidden=true;q('[data-proposal-status]').textContent='Proposal discarded.';};
 q('[data-proposal-apply]').onclick=()=>{if(!proposal)return;if(proposal.baseRevision!==s.data.revision){q('[data-proposal-status]').textContent='Project changed. Preview again before applying.';return;}commit(proposal.operations,'Apply reviewed AI proposal',null,'ai');};
}
