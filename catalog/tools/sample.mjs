/* An audit always renders current inputs. Card.measure is a historical snapshot,
   never a cache hit. Hashes identify what was sampled; they do not turn a timed,
   live-only page or a remotely loaded font into a deterministic renderer. */
import {createHash} from 'crypto';
import {dirname,relative} from 'path';
import {capture,metrics} from './measure.mjs';

import {sourceFingerprint,frameSpec} from './fingerprint.mjs';
import {RENDER_INPUT_VERSION} from './render-input.mjs';
export {sourceFingerprint,frameSpec,measurementStatus} from './fingerprint.mjs';

export async function sampleCard(k,options={}){
 const before=sourceFingerprint(k);
 const captured=await capture(frameSpec(k),options);
 if(sourceFingerprint(k).sourceHash!==before.sourceHash)
  throw new Error(k.name+': source changed during measurement; rerun on stable inputs');
 const state=sourceFingerprint(k,captured.resources.map(r=>r.file));
 for(const resource of captured.resources){
  const file=relative(dirname(k._f),resource.file);
  if(state.inputs.find(input=>input.file===file)?.renderHash!==resource.renderHash)
   throw new Error(k.name+': render resource changed after sampling: '+file);
 }
 const pixels=createHash('sha256');
 for(const f of captured.frames){
  pixels.update(JSON.stringify([f.w,f.h])); pixels.update(f.data);
 }
 const evidence={schema:RENDER_INPUT_VERSION,measuredAt:new Date().toISOString(),...state,
  pixelHash:pixels.digest('hex'),browser:captured.browser,node:process.version,
  samplingMode:k.frame.hook?'hook':'live-clock',externalResources:captured.externalResources};
 return {frames:captured.frames,measure:metrics(captured.frames),evidence};
}

export const metricValue=(o,key)=>key==='value.range'?o.value[1]-o.value[0]
 :key==='value.low'?o.value[0]:o[key];
export function claimPass(value,op,limit){
 if(!['>','<'].includes(op)||!Number.isFinite(limit)) throw new Error('unsupported claim threshold');
 return Number.isFinite(value)&&(op==='>'?value>limit:value<limit);
}

/* Deliberately damage pixels, then run the real measurement again. Returning the
   threshold itself would only prove the comparison operator, not the measurement. */
export function breakClaim(frames,key,op){
 const known=['hardEdgeShare:>','value.range:>','value.low:>','saturation:>',
  'saturation:<','ink:>','ink:<','lightField:>'];
 if(!known.includes(key+':'+op)) throw new Error('no pixel calibration for '+key+' '+op);
 return frames.map(f=>{
  const data=Uint8ClampedArray.from(f.data);
  for(let i=0;i<f.w*f.h;i++){
   let rgb;
   if(key==='saturation'&&op==='>'){
    const gray=Math.round(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2]);
    rgb=[gray,gray,gray];
   }else if(key==='saturation') rgb=[255,0,0];
   else if(key==='hardEdgeShare') rgb=Array(3).fill(96+Math.round(64*(i%f.w)/(f.w-1)));
   else if(key==='value.range') rgb=[128,128,128];
   else if(key==='ink'&&op==='>') rgb=[255,255,255];
   else rgb=[0,0,0];
   data.set([...rgb,255],i*4);
  }
  return {...f,data};
 });
}

/* Blur the captured pixels instead of rerendering a moving page for the control. */
export function blurFrames(frames,radius=3){
 return frames.map(f=>{
  const data=new Uint8ClampedArray(f.data.length);
  for(let y=0;y<f.h;y++) for(let x=0;x<f.w;x++){
   const sums=[0,0,0];let n=0;
   for(let dy=-radius;dy<=radius;dy++) for(let dx=-radius;dx<=radius;dx++){
    const yy=Math.max(0,Math.min(f.h-1,y+dy)),xx=Math.max(0,Math.min(f.w-1,x+dx));
    const j=(yy*f.w+xx)*4;for(let c=0;c<3;c++)sums[c]+=f.data[j+c]; n++;
   }
   const i=(y*f.w+x)*4;for(let c=0;c<3;c++)data[i+c]=Math.round(sums[c]/n);data[i+3]=255;
  }
  return {...f,data};
 });
}
