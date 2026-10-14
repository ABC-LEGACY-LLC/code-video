import {timingImpact} from './core/editing.mjs';
export function mountSceneTools({container,s,shot,commit}){
 const duration=container.querySelector('[data-field^="duration|"]');
 if(duration){
  const mode=document.createElement('label');mode.textContent='Duration edit ';const select=document.createElement('select');select.dataset.timingMode='';select.innerHTML=(s.data.capabilities.operations.includes('trimScene')?'<option value="trim">Trim · keep animation speed</option>':'')+'<option value="stretch">Stretch · retime animation</option>';s.timingMode ||= s.data.capabilities.operations.includes('trimScene')?'trim':'stretch';select.value=s.timingMode;mode.append(select);duration.closest('label').before(mode);
  const impact=document.createElement('p');impact.className='small mut';impact.dataset.timingImpact='';duration.closest('label').after(impact);
  const show=()=>{const n=Number(duration.value),i=timingImpact(s.data.project,shot.id,n);impact.textContent=select.value==='stretch'?'Keyframes, layer ranges, notes and cue timing scale with the scene. Video playback speed changes with the stretch. '+(s.data.project.renderer==='canvas2d'?'File audio speed and pitch change with it.':'Audio source playback speed stays unchanged.'):n<shot.durationFrames?`Trim keeps keyframe times (${i.keysOutside} outside the scene retained). Removes ${i.layersRemoved} layers, ${i.cuesRemoved} cues and ${i.notesRemoved} notes; cuts ${i.cuesCut} cues at the end. Undo restores them.`:'Trim extension adds scene time; existing layer and audio ranges stay unchanged.';};select.onchange=()=>{s.timingMode=select.value;show();};duration.addEventListener('input',show);show();
 }
 if(!s.data.capabilities.operations.includes('addShot'))return;
 const box=document.createElement('div');box.className='editor-actions';box.innerHTML='<button class="btn" type="button" data-scene-add>Add scene</button><button class="btn" type="button" data-scene-copy>Duplicate scene</button><button class="btn" type="button" data-scene-delete>Delete scene</button>';
 container.querySelector('.shot-details fieldset').append(box);
 const select=id=>()=>{s.shotId=id;s.entityId='';s.selection=[];s.followPlayhead=false;};
 box.querySelector('[data-scene-add]').onclick=()=>{const id='scene-'+crypto.randomUUID();commit([{type:'addShot',id,name:'Scene '+(s.data.project.shots.length+1),durationFrames:Math.round(4*s.data.project.fps.num/s.data.project.fps.den),index:s.data.project.shots.indexOf(shot)+1}],'Add scene',select(id));};
 box.querySelector('[data-scene-copy]').onclick=()=>{const id='scene-'+crypto.randomUUID();commit([{type:'duplicateShot',shotId:shot.id,id}],'Duplicate scene',select(id));};
 box.querySelector('[data-scene-delete]').onclick=()=>commit([{type:'deleteShot',shotId:shot.id}],'Delete scene');
}
