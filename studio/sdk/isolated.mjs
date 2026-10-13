// Untrusted source runs only in a worker created by an opaque-origin iframe.
// The iframe bridge is fixed trusted code; source is sent as a message, never HTML.
// CSP is inherited by blob workers. No network or Studio credentials are granted.
import {frameClock,randomAt} from './clock.mjs';
export const isolatedDescription={id:'isolated-canvas2d',version:'1.0.0',sdkVersion:1,
 capabilities:{renderFrame:true,audio:false,selection:false,inspect:true,cancel:true,dispose:true},auditChannels:['color']};
export function registerIsolatedCanvas2D(registry){registry.register(isolatedDescription,createIsolatedCanvas2D);}
function bridge(){
 let port,worker,url;
 const stop=()=>{worker?.terminate();worker=null;if(url)URL.revokeObjectURL(url);url=null;};
 addEventListener('message',event=>{
  if(event.source!==parent||port||event.data!=='studio-isolated-v1'||event.ports.length!==1)return;
  port=event.ports[0];port.onmessage=({data:m})=>{
   if(m.type==='stop'){stop();return;}
   if(m.type!=='render')return;
   stop();
   // A fresh worker per frame prevents state accumulated by prior seeks.
   url=URL.createObjectURL(new Blob([m.program],{type:'text/javascript'}));
   worker=new Worker(url);
   let replied=false;
   worker.onmessage=({data})=>{
    if(replied)return;replied=true;
    if(data?.bitmap instanceof ImageBitmap){port.postMessage({id:m.id,bitmap:data.bitmap},[data.bitmap]);}
    else port.postMessage({id:m.id,error:String(data?.error||'invalid worker result').slice(0,500)});
    stop();
   };
   worker.onerror=()=>{port.postMessage({id:m.id,error:'Component failed to execute'});stop();};
   worker.postMessage(m.input);
  };port.start();port.postMessage({type:'ready'});
 });
}
const csp="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; connect-src 'none'; img-src 'none'; media-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
export async function createIsolatedCanvas2D({canvas,project,source,properties={},timeoutMs=2000,signal,mount=document.body}){
 if(typeof source!=='string'||source.length<1||source.length>100000)throw new Error('component source must be 1–100000 characters');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<50||timeoutMs>10000)throw new Error('invalid preview timeout');
 const inputProperties=JSON.parse(JSON.stringify(properties));if(JSON.stringify(inputProperties).length>32000)throw new Error('properties exceed preview limit');
 signal?.throwIfAborted();
 const iframe=document.createElement('iframe');iframe.hidden=true;iframe.sandbox='allow-scripts';iframe.title='Isolated code runtime';
 iframe.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="${csp}"><script>(${bridge.toString()})();<\/script>`;
 const channel=new MessageChannel();let pending=null,disposed=false,serial=0,lastFrame=null;
 const stop=(reason=new Error('render cancelled'))=>{channel.port1.postMessage({type:'stop'});if(pending){clearTimeout(pending.timer);pending.reject(reason);pending=null;}};
 const runtime={description:isolatedDescription,canvas,project,
  renderFrame(request){
   if(disposed)return Promise.reject(new Error('renderer disposed'));
   if(pending)return Promise.reject(new Error('a frame is already rendering'));
   const clock=frameClock(project,request.frame),width=request.width??project.width,height=request.height??project.height;
   if(![width,height].every(n=>Number.isSafeInteger(n)&&n>=16&&n<=2048)||width*height>2097152)throw new Error('isolated preview is limited to 2 megapixels and 2048 per side');
   signal?.throwIfAborted();request.signal?.throwIfAborted();const id=++serial;
   const program=`'use strict';\n// Remove nested workers; network is denied by inherited CSP.\nObject.defineProperty(globalThis,'Worker',{value:undefined,writable:false,configurable:false});\nObject.defineProperty(globalThis,'SharedWorker',{value:undefined,writable:false,configurable:false});\nconst sample=${randomAt.toString()};\nonmessage=async({data:input})=>{try{\n const {width,height,clock,properties}=input;let index=0;Math.random=()=>sample(clock.seed,clock.frame,'default',index++);\n const canvas=new OffscreenCanvas(width,height);const context=canvas.getContext('2d');\n const render=(${source}\n);\n await render({context,width,height,clock,properties,random:(i=0)=>sample(clock.seed,clock.frame,'component',i)});\n const bitmap=canvas.transferToImageBitmap();postMessage({bitmap},[bitmap]);\n }catch(error){postMessage({error:String(error.message).slice(0,500)});}};`;
   return new Promise((resolve,reject)=>{
    const abort=()=>stop(new Error('render cancelled'));
    const finish=fn=>value=>{request.signal?.removeEventListener('abort',abort);fn(value);};
    pending={id,width,height,frame:request.frame,resolve:finish(resolve),reject:finish(reject),timer:setTimeout(()=>stop(new Error('Component exceeded its frame time limit')),timeoutMs)};
    request.signal?.addEventListener('abort',abort,{once:true});
    channel.port1.postMessage({type:'render',id,program,input:{width,height,clock,properties:inputProperties}});
   });
  },
  inspect(){return{frame:lastFrame,isolated:true,channels:['color'],limits:{timeoutMs,maxPixels:2097152}};},
  cancel(){stop();},dispose(){if(disposed)return;disposed=true;stop(new Error('renderer disposed'));channel.port1.close();iframe.remove();signal?.removeEventListener('abort',abortAll);}
 };
 const abortAll=()=>runtime.dispose();signal?.addEventListener('abort',abortAll,{once:true});
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Isolated runtime did not start')),timeoutMs);
   const abort=()=>{clearTimeout(timer);reject(new Error('runtime cancelled'));};signal?.addEventListener('abort',abort,{once:true});
   channel.port1.onmessage=({data})=>{if(data?.type==='ready'){clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve();}};
   iframe.onload=()=>iframe.contentWindow.postMessage('studio-isolated-v1','*',[channel.port2]);mount.append(iframe);
  });
  channel.port1.onmessage=({data})=>{
   const p=pending;if(!p||data?.id!==p.id){data?.bitmap?.close?.();return;}
   clearTimeout(p.timer);pending=null;
   if(data.bitmap instanceof ImageBitmap){const bitmap=data.bitmap;
    if(bitmap.width!==p.width||bitmap.height!==p.height){bitmap.close();p.reject(new Error('invalid frame dimensions'));return;}
    canvas.width=p.width;canvas.height=p.height;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();lastFrame=p.frame;
    p.resolve({frame:p.frame,width:p.width,height:p.height});
   }else p.reject(new Error(String(data?.error||'invalid frame result').slice(0,500)));
  };
  return runtime;
 }catch(error){runtime.dispose();throw error;}
}
