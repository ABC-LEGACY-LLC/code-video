// Explicit renderer registration. Registration alone never executes a renderer.
export const SDK_VERSION=1;
const methods=['renderFrame','audio','selection','inspect','cancel','dispose'];
export function createRendererRegistry(){
 const entries=new Map();
 return Object.freeze({
  register(description,create){
   const d=structuredClone(description);
   if(!/^[a-z][a-z0-9-]{0,79}$/.test(d.id)||!/^\d+\.\d+\.\d+$/.test(d.version)||d.sdkVersion!==SDK_VERSION||typeof create!=='function')throw new Error('invalid renderer registration');
   if(entries.has(d.id))throw new Error('renderer already registered: '+d.id);
   if(!d.capabilities||methods.some(k=>typeof d.capabilities[k]!=='boolean')||!d.capabilities.renderFrame||!d.capabilities.dispose)throw new Error('renderer capabilities must be explicit');
   if(!Array.isArray(d.auditChannels)||d.auditChannels.some(k=>!['color','geometry','depth','object-id','audio','text'].includes(k)))throw new Error('invalid audit channels');
   entries.set(d.id,{description:d,create});
  },
  describe(id){const e=entries.get(id);if(!e)throw new Error('unknown renderer: '+id);return structuredClone(e.description);},
  list(){return [...entries.values()].map(e=>structuredClone(e.description));},
  async open(id,options={}){
   const e=entries.get(id);if(!e)throw new Error('unknown renderer: '+id);
   options.signal?.throwIfAborted();options.onProgress?.({stage:'loading',progress:0});
   const controller=new AbortController(),timeoutMs=options.readyTimeoutMs??15000;
   if(!Number.isSafeInteger(timeoutMs)||timeoutMs<50||timeoutMs>60000)throw new Error('invalid readiness timeout');
   let closed=false,runtime,timer,abort;
   const opening=Promise.resolve().then(()=>e.create({...options,signal:controller.signal}));
   // A cancelled factory may complete later: release its resources then.
   opening.then(value=>{if(closed)value?.dispose?.();},()=>{});
   const interrupted=new Promise((_,reject)=>{
    abort=()=>{if(runtime)runtime.dispose?.();controller.abort();reject(new Error('renderer loading cancelled'));};
    options.signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>{controller.abort();reject(new Error('renderer readiness timed out'));},timeoutMs);
   });
   try{
    runtime=await Promise.race([opening,interrupted]);
    for(const method of methods)if(e.description.capabilities[method]&&typeof runtime?.[method]!=='function')throw new Error('renderer missing '+method);
    let disposed=false;const dispose=runtime.dispose.bind(runtime);runtime.dispose=()=>{if(disposed)return;disposed=true;options.signal?.removeEventListener('abort',abort);controller.abort();dispose();};
    options.signal?.throwIfAborted();options.onProgress?.({stage:'ready',progress:1});return runtime;
   }catch(error){closed=true;controller.abort();runtime?.dispose?.();options.onProgress?.({stage:'failed',message:error.message});throw error;}
   finally{clearTimeout(timer);if(closed)options.signal?.removeEventListener('abort',abort);}

  }
 });
}
