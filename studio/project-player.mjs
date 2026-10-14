import {createRendererRegistry} from './sdk/registry.mjs';
import {registerCanvas2D} from './renderers/canvas2d.mjs';
import {installPageHooks} from './sdk/legacy.mjs';
import {basicComponents} from './components/basic2d.mjs';
try{
 const response=await fetch('./project.studio.json');if(!response.ok)throw new Error('Project could not load');
 const state=await response.json();
 const review=new URL(location.href).searchParams.has('review')&&window.frameElement?.studioPreviewProject;
 if(review)state.project=JSON.parse(JSON.stringify(review));
 const registry=createRendererRegistry();registerCanvas2D(registry);
 const runtime=await registry.open(state.project.renderer,{canvas:document.querySelector('canvas'),project:state.project,components:basicComponents,previewWidth:Math.round(state.project.width*Math.min(1,720/Math.max(state.project.width,state.project.height))),onProgress:value=>window.__progress=value});
 await runtime.renderFrame({frame:0});installPageHooks(window,runtime,{generation:state.generation});
 if(window.__renderAudio){const sound=document.createElement('button');sound.className='btn player-sound';sound.textContent='Sound off';sound.setAttribute('aria-pressed','false');sound.onclick=async()=>{try{await window.__setSound(!window.__audioState().enabled);sound.textContent=window.__audioState().enabled?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(window.__audioState().enabled));}catch(e){sound.textContent=e.message;}};document.body.append(sound);}
 if(!new URL(location.href).searchParams.has('embed')){
  const controls=document.createElement('div');controls.className='player-controls';controls.innerHTML='<button class="btn" type="button">Play</button><input type="range" min="0" step="1" value="0" aria-label="Video frame"><output></output>';
  const button=controls.querySelector('button'),slider=controls.querySelector('input'),output=controls.querySelector('output');slider.max=window.__totalFrames-1;
  button.onclick=()=>{if(window.__frame().playing)window.__pause();else window.__play();};slider.oninput=()=>{window.__pause();window.__frameTo(Number(slider.value));};
  const timer=setInterval(()=>{const state=window.__frame();slider.value=state.frame;button.textContent=state.playing?'Pause':'Play';output.textContent=`${state.frame} / ${window.__totalFrames-1}`;},100);addEventListener('pagehide',()=>clearInterval(timer),{once:true});document.body.append(controls);
 }

}catch(error){window.__failed=error.message;document.body.append(document.createTextNode(error.message));}
