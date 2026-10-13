/* Pure local provenance checks; usable by Studio without a browser dependency. */
import {dirname,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,renderInput,RENDER_INPUT_VERSION} from './render-input.mjs';
const TOOL_INPUTS=[fileURLToPath(import.meta.url),fileURLToPath(new URL('./sample.mjs',import.meta.url)),fileURLToPath(new URL('./measure.mjs',import.meta.url)),
 fileURLToPath(new URL('./preview.mjs',import.meta.url)),fileURLToPath(new URL('./render-input.mjs',import.meta.url)),
 ...['http-file.mjs','project.mjs','layers.mjs','component-schema.mjs','../components/legacy.mjs'].map(name=>fileURLToPath(new URL('../../studio/core/'+name,import.meta.url)))];
export function frameSpec(k){
 if(k.frame.project!==undefined&&(typeof k.frame.project!=='string'||!k.frame.project.trim()))throw new Error('frame.project must name an authored document');
 return {...k.frame,file:resolve(dirname(k._f),k.frame.file),...(k.frame.project?{project:resolve(dirname(k._f),k.frame.project)}:{})};
}
const sampling=k=>({frames:k.frame.frames,hook:k.frame.hook||null,
 size:k.frame.size||[720,518],blur:k.frame.blur||0,measurementWidth:320,
 liveWarmupMs:k.frame.hook?0:1400,project:k.frame.project||null});

export function sourceFingerprint(k,extra=[]){
 const base=dirname(k._f),frame=frameSpec(k);
 const files=[...new Set([...k.sources.map(p=>resolve(base,p)),frameSpec(k).file,
  ...(frame.project?[frame.project]:[]),...TOOL_INPUTS,...extra.map(p=>resolve(base,p))])].sort();
 const inputs=files.map(file=>({file:relative(base,file),...renderInput(file,frame)}));
 const spec=sampling(k);
 const identity=inputs.map(({file,renderHash,projection})=>({file,renderHash,projection}));
 return {sourceHash:hash(JSON.stringify({version:RENDER_INPUT_VERSION,sampling:spec,inputs:identity})),sampling:spec,inputs};
}

/* Used only to label recorded card numbers. The audit never trusts this label in
   place of rendering. Legacy numbers without provenance remain unverified. */
export function measurementStatus(k){
 const evidence=k.measureEvidence;
 if(!evidence||![1,RENDER_INPUT_VERSION].includes(evidence.schema)||!Array.isArray(evidence.inputs))
  return {status:'unverified',reason:'recorded numbers have no input provenance; run card.mjs refresh'};
 if(evidence.schema!==RENDER_INPUT_VERSION)
  return {status:'stale',reason:'recorded evidence uses the previous fingerprint contract; rerun measurements'};
 if(evidence.inputs.some(i=>!i||typeof i.file!=='string'||!['bytes-v1','studio-project-v1'].includes(i.projection)
   ||!(/^[a-f0-9]{64}$/).test(i.renderHash)||!(/^[a-f0-9]{64}$/).test(i.sha256)))
  return {status:'unverified',reason:'recorded input fingerprints are incomplete; rerun measurements'};
 try{
  if(sourceFingerprint(k,evidence.inputs.map(i=>i.file)).sourceHash!==evidence.sourceHash)
   return {status:'stale',reason:'local measurement inputs or sampling settings changed'};
 }catch(err){ return {status:'stale',reason:err.message}; }
 return {status:'recorded',reason:'recorded '+evidence.measuredAt+
  (evidence.samplingMode==='live-clock'?' using live-clock sampling':'')+
  (evidence.externalResources?.length?'; external resources were used':'')};
}

