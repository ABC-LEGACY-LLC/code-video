// Trusted pages remain compatible. This adapter does not claim to isolate them.
export function adaptLegacyPage(page,{fps=24,totalFrames,control='frameTo'}={}){
 let disposed=false;
 const alive=()=>{if(disposed)throw new Error('renderer disposed');if(page.__failed)throw new Error(String(page.__failed));};
 const capabilities={renderFrame:control==='frameTo'&&typeof page.__frameTo==='function'||control==='seek'&&typeof page.__seek==='function',
  audio:typeof page.__renderAudio==='function',selection:typeof page.__pickLayer==='function',inspect:true,cancel:true,dispose:true};
 return{description:{id:'legacy-page',version:'1.0.0',sdkVersion:1,capabilities,auditChannels:['color',...(capabilities.audio?['audio']:[])]},
  async renderFrame({frame,width,height,signal}){alive();signal?.throwIfAborted();if(!Number.isSafeInteger(frame)||frame<0||frame>=totalFrames)throw new Error('frame outside sequence');
   if(control==='frameTo'){const result=await (page.__sizable&&width&&height?page.__frameTo(frame,width,height):page.__frameTo(frame));await page.__prepareFrame?.();alive();signal?.throwIfAborted();return result||{frame};}
   if(control==='seek'){await page.__seek(frame/fps);await new Promise(r=>page.requestAnimationFrame(()=>page.requestAnimationFrame(r)));return page.__frame?.()||{frame};}
   throw new Error('renderer has no frame capability');
  },
  async audio({duration,sampleRate=48000}){alive();if(!capabilities.audio)throw new Error('audio is unsupported');if(!Number.isFinite(duration)||duration<=0||duration>21600||!Number.isSafeInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('invalid audio request');
   const result=await page.__renderAudio(duration,sampleRate),channels=result.channels||[result.pcm],sr=result.sr;
   if(!Number.isSafeInteger(sr)||sr<8000||sr>192000||!channels.length||channels.length>8||channels.some(c=>!c||typeof c.length!=='number'||c.length!==channels[0].length))throw new Error('invalid rendered audio');
   return{...result,sampleRate:sr,channels,numberOfFrames:channels[0].length,startTime:0};},
  selection({id,x,y}={}){alive();return id?page.__layerGeometry?.(id):page.__pickLayer?.(x,y);},
  inspect(){alive();return{frame:page.__frame?.(),project:page.__studioProject||null};},
  cancel(){page.__pause?.();},dispose(){disposed=true;}
 };
}
// Let new SDK pages participate in the existing Studio transport and export UI.
export function installPageHooks(page,runtime,{generation=0,revision}={}){
 const project=runtime.project;let frame=0,playing=false,epoch=0;
 page.__studioProject={generation,revision};page.__fps=project.fps.num/project.fps.den;page.__totalFrames=project.shots.reduce((n,s)=>n+s.durationFrames,0);
 let start=0;page.__shots=project.shots.map(s=>{const row={k:s.id,f:start,df:s.durationFrames};start+=s.durationFrames;return row;});
 page.__frame=()=>({frame,playing});page.__pause=()=>{playing=false;epoch++;};
 page.__frameTo=async(n,width,height)=>{const result=await runtime.renderFrame({frame:n,width,height});frame=n;return result;};page.__sizable=true;
 page.__play=(from=frame)=>{page.__pause();playing=true;const token=epoch,base=performance.now();
  const tick=async()=>{if(!playing||token!==epoch)return;const next=(from+Math.floor((performance.now()-base)*page.__fps/1000))%page.__totalFrames;
   try{await page.__frameTo(next);if(playing&&token===epoch)page.requestAnimationFrame(tick);}catch(error){page.__failed=error.message;page.__pause();}};tick();};
 page.__tracks=()=>runtime.tracks?.()||[];page.__pickLayer=(x,y)=>runtime.selection({x,y});page.__layerGeometry=id=>runtime.selection({id});
 page.__setLayerPreview=value=>runtime.preview(value);page.__getLayerPreview=()=>runtime.getPreview();
 page.__renderer=runtime;page.__ready=true;
 page.addEventListener('pagehide',()=>{page.__pause();runtime.dispose();},{once:true});
}
