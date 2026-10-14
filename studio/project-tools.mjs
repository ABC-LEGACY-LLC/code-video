const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const post=async(path,body)=>{const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw new Error(data.error||r.status);return data;};
export function createProjectTools({host,editor,current,refresh,navigate,isExporting}){
 host.innerHTML='<button class="btn primary" data-new-project>New project</button><button class="btn" data-project-actions>Project…</button><p class="small mut" data-library-status role="status"></p>';
 const status=host.querySelector('[data-library-status]'),dialog=document.createElement('dialog');dialog.className='project-dialog';document.body.append(dialog);
 const blocked=()=>{if(isExporting())throw new Error('Finish or cancel the video export first');};
 async function open(mode){
  try{blocked();const work=current(),snap=editor()?.snapshot();if(mode!=='new'&&(!work?.creator||snap?.work.id!==work.id))throw new Error('Select a Studio-created project for these actions');if(mode!=='new'&&snap.blocked)throw new Error('Save or discard the current edits first');
   const id=crypto.randomUUID();dialog.innerHTML=`<form><h2>${mode==='new'?'New project':'Project settings'}</h2><label>Project name<input name="name" required maxlength="200" value="${mode==='new'?'Untitled video':esc(snap.project.name)}"></label>${mode==='new'?`<label>Start from<select name="template"><option value="blank">Blank · one scene</option><option value="title-sequence">Title sequence · three scenes</option></select></label><label>Format<select name="format"><option>16:9</option><option>9:16</option><option>1:1</option></select></label><label>Frames per second<select name="fps"><option>24</option><option>25</option><option>30</option><option>60</option></select></label><label>Total duration (seconds)<input name="duration" type="number" min="1" max="600" step="0.1" value="12" required></label><p class="mut">1920 × 1080 landscape, 1080 × 1920 portrait, or 1080 × 1080 square. You can change each scene’s timing later.</p>`:`<p class="mut">${snap.project.width} × ${snap.project.height} · ${snap.project.fps.num/snap.project.fps.den} fps · ${snap.project.shots.length} scenes</p>`}<p data-dialog-status role="status"></p><div class="editor-actions"><button class="btn primary" type="submit">${mode==='new'?'Create project':'Save name'}</button>${mode==='new'?'':'<button class="btn" type="button" data-copy-project>Duplicate project</button><button class="btn" type="button" data-source-package>Download source</button>'}<button class="btn" type="button" data-close>Cancel</button></div></form>`;
   const form=dialog.querySelector('form'),message=dialog.querySelector('[data-dialog-status]');let busy=false;
   const run=async fn=>{if(busy)return;busy=true;form.querySelectorAll('button').forEach(b=>b.disabled=true);message.textContent='Working…';try{blocked();await fn();}catch(e){message.textContent=e.message;}finally{busy=false;form.querySelectorAll('button').forEach(b=>b.disabled=false);}};
   dialog.oncancel=e=>{if(busy)e.preventDefault();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();
   form.onsubmit=e=>{e.preventDefault();run(async()=>{
    if(mode==='new'){const result=await post('api/projects',{requestId:id,actor:'human',name:form.elements.name.value,format:form.elements.format.value,fps:+form.elements.fps.value,durationSeconds:+form.elements.duration.value,template:form.elements.template.value});await refresh();navigate(result.work.id);}
    else{if(editor()?.snapshot()?.revision!==snap.revision)throw new Error('Project changed; close and reopen settings');const result=await editor().commit([{type:'renameProject',name:form.elements.name.value}],'Rename project');if(!result)throw new Error('Name was not saved; check the Editor');await refresh();}
    dialog.close();
   });};
   if(mode!=='new'){
    dialog.querySelector('[data-copy-project]').onclick=()=>run(async()=>{const result=await post('api/projects/duplicate',{work:work.id,baseRevision:snap.revision,requestId:id,actor:'human',name:form.elements.name.value.trim().slice(0,195)+' copy'});await refresh();navigate(result.work.id);dialog.close();});
    dialog.querySelector('[data-source-package]').onclick=()=>run(async()=>{const r=await fetch('api/source-package?work='+encodeURIComponent(work.id)+'&revision='+snap.revision);if(!r.ok)throw new Error((await r.json()).error);const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=url;a.download=work.id+'-source.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);message.textContent='Source downloaded. Unzip and run: node serve.mjs';});
   }
   dialog.showModal();form.elements.name.focus();form.elements.name.select();
  }catch(e){status.textContent=e.message;}
 }
 host.querySelector('[data-new-project]').onclick=()=>open('new');host.querySelector('[data-project-actions]').onclick=()=>open('settings');
 return{refresh(){host.querySelector('[data-project-actions]').disabled=!current()?.creator||isExporting();}};
}
