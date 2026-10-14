import {snapshotResource} from './snapshot-resource.mjs';
// Imported input identities are SHA-256 references, checked again before decoding.
export async function fetchInput(src,{signal}={}){
 const hash=/^\/w\/studio\/assets\/[a-zA-Z0-9_-]+\/([a-f0-9]{64})\.[a-z0-9]+$/.exec(src)?.[1];if(!hash)throw new Error('Invalid imported asset');
 const controller=new AbortController(),abort=()=>controller.abort(signal?.reason),timer=setTimeout(()=>controller.abort(new Error('Input asset timed out')),10000);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 try{const response=await fetch(snapshotResource(src),{signal:controller.signal});if(!response.ok)throw new Error('Input asset is missing');const bytes=await response.arrayBuffer();if(bytes.byteLength>18*1024*1024)throw new Error('Input asset exceeds 18 MB');const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(actual!==hash)throw new Error('Input asset changed; restore the original file');return bytes;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
