import {createRendererRegistry} from './sdk/registry.mjs';
import {registerIsolatedCanvas2D} from './sdk/isolated.mjs';
const $=s=>document.querySelector(s),registry=createRendererRegistry();registerIsolatedCanvas2D(registry);
const project={width:960,height:540,fps:{num:24,den:1},seed:2026,shots:[{id:'preview',durationFrames:240}]};
$('#source').value=`function render({context: g, width, height, clock, random}) {
  g.fillStyle = '#101918';
  g.fillRect(0, 0, width, height);
  g.fillStyle = '#b4f272';
  for (let i = 0; i < 30; i++) {
    g.beginPath();
    g.arc(random(i * 2) * width, random(i * 2 + 1) * height, 4, 0, Math.PI * 2);
    g.fill();
  }
  g.font = 'bold 48px sans-serif';
  g.textAlign = 'center';
  g.fillText('Frame ' + clock.frame, width / 2, height / 2);
}`;
let runtime=null,controller=null;
$('#cancel').onclick=()=>{controller?.abort();runtime?.dispose();$('#status').textContent='Preview cancelled.';};
$('#run').onclick=async()=>{
 runtime?.dispose();controller=new AbortController();$('#run').disabled=true;$('#cancel').disabled=false;
 try{
  $('#status').textContent='Starting preview…';
  runtime=await registry.open('isolated-canvas2d',{canvas:$('canvas'),project,source:$('#source').value,signal:controller.signal});
  $('#status').textContent='Rendering…';await runtime.renderFrame({frame:Number($('#frame').value)});
  $('#status').textContent='Frame '+$('#frame').value+' ready.';
 }catch(error){$('#status').textContent=controller.signal.aborted?'Preview cancelled.':error.message;}
 finally{$('#run').disabled=false;$('#cancel').disabled=true;}
};
addEventListener('pagehide',()=>runtime?.dispose());
