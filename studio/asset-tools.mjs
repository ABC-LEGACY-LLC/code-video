const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function createAssetTools({host,editor,current}){
 let generation=0,busy=false;
 host.innerHTML='<div class="asset-toolbar"><button class="btn" data-asset-import>Import media</button><button class="btn" data-asset-refresh>Refresh</button><input type="file" data-asset-file hidden accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,audio/wav,audio/mpeg,audio/ogg,.woff,.woff2,.ttf,.otf"><p class="small mut">Input media · up to 18 MB each. Add an asset to the scene selected in Editor. Use audio clips for music, voice and SFX. Fonts are attached to this project; use fonts you have permission to distribute.</p><p data-asset-status role="status"></p></div><div data-assets></div>';
 const status=host.querySelector('[data-asset-status]'),list=host.querySelector('[data-assets]');
 const pause=()=>host.querySelectorAll('video,audio').forEach(el=>el.pause());
 async function refresh(){pause();const seq=++generation,work=current();if(!work?.project){list.replaceChildren();status.textContent='Select an editable project to use its media.';return;}
  try{const r=await fetch('api/assets?work='+encodeURIComponent(work.id)),assets=await r.json();if(!r.ok)throw new Error(assets.error);if(seq!==generation)return;status.textContent=assets.length?`${assets.length} assets · ${assets.filter(a=>a.status!=='ready').length} need attention`:'No media yet. Import an image or video to begin.';
   list.replaceChildren();for(const asset of assets){const card=document.createElement('article');card.className='asset-card';card.innerHTML=`<strong>${esc(asset.name)}</strong><span class="small mut">${asset.kind} · ${asset.uses} uses · ${Math.round(asset.bytes/1024)} KB</span><p class="small" ${asset.status==='ready'?'hidden':''}>${asset.status==='missing'?'Missing file. Reimport the original file to restore it.':'File changed or unsafe. Restore the original source asset.'}</p><button class="btn" ${asset.status==='ready'?'':'disabled'}>${asset.kind==='font'?'Use project font':'Add to selected scene'}</button>`;
    if(asset.status==='ready'&&asset.kind!=='font'){const media=document.createElement(asset.kind==='image'?'img':asset.kind==='video'?'video':'audio');media.src=asset.src;if(asset.kind==='image'){media.alt=asset.name;media.loading='lazy';}else{media.controls=true;media.preload='metadata';}card.insertBefore(media,card.firstChild);}
    card.querySelector('button').onclick=async()=>{if(busy)return;try{const snap=editor()?.snapshot();if(snap?.work.id!==work.id||snap.blocked)throw new Error('Select a scene and save or discard pending edits first');busy=true;if(asset.kind==='font'){if(!snap.capabilities.operations.includes('addFont'))throw new Error('Project fonts are not supported by this renderer');const key='font-'+asset.src.split('/').at(-1).split('.')[0].slice(0,24);if(snap.project.fonts?.some(f=>f.id===key)){status.textContent='This font is already available in the text Inspector.';return;}const result=await editor().commit([{type:'addFont',id:key,name:asset.name,src:asset.src}],'Use project font',{baseRevision:snap.revision});if(!result)throw new Error('Font was not attached; check the Editor');await refresh();return;}const media=card.querySelector('img,video,audio');
      if(!(asset.kind==='image'?media.complete&&media.naturalWidth:media.readyState>=1))throw new Error('Wait for the media preview to load');
      const id='layer-'+crypto.randomUUID(),width=media.naturalWidth||media.videoWidth,height=media.naturalHeight||media.videoHeight,scale=Math.min(1,snap.project.width/width,snap.project.height/height);
      const op=asset.kind==='audio'?{type:'addAudio',shotId:snap.shot.id,id,name:asset.name,src:asset.src,durationFrames:Math.max(1,Math.min(216000,Math.round(media.duration*snap.project.fps.num/snap.project.fps.den)))}:{type:'addLayer',shotId:snap.shot.id,id,name:asset.name,kind:asset.kind,content:{src:asset.src,width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale)),offsetSeconds:0,playbackRate:1}};
      if(!snap.capabilities.operations.includes(op.type))throw new Error('This renderer does not support '+asset.kind+' layers');
      const result=await editor().commit([op],'Add asset to scene');if(!result)throw new Error('Asset was not placed; check the Editor');editor().select(id);await refresh();
     }catch(e){status.textContent=e.message;}finally{busy=false;}};
    list.append(card);
   }
  }catch(e){if(seq===generation)status.textContent=e.message;}
 }
 host.querySelector('[data-asset-refresh]').onclick=refresh;
 host.querySelector('[data-asset-import]').onclick=()=>host.querySelector('[data-asset-file]').click();
 host.querySelector('[data-asset-file]').onchange=async event=>{const file=event.target.files[0],work=current();event.target.value='';if(!file||busy)return;
  try{if(!work?.project)throw new Error('Select an editable project');if(file.size>18*1024*1024)throw new Error('Choose media up to 18 MB');busy=true;status.textContent='Importing…';
   const bytes=new Uint8Array(await file.arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));
   const r=await fetch('api/assets',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({work:work.id,name:file.name,data:btoa(raw)})});if(!r.ok)throw new Error((await r.json()).error);await refresh();
  }catch(e){status.textContent=e.message;}finally{busy=false;}
 };
 return{refresh,pause};
}
