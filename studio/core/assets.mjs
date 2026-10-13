import {mkdirSync,existsSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
// Content-addressed media is immutable; adding an asset never changes earlier history.
export function importAsset(root,work,request){
 if(typeof request.data!=='string'||request.data.length>24*1024*1024||request.data.length%4!==0||/[^A-Za-z0-9+/=]/.test(request.data))throw new Error('Choose media up to 18 MB.');
 const b=Buffer.from(request.data,'base64');if(b.toString('base64')!==request.data)throw new Error('Invalid media encoding');if(b.length<12)throw new Error('Empty media file.');
 const starts=hex=>b.subarray(0,hex.length/2).equals(Buffer.from(hex,'hex'));
 const ext=b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE'?'wav':starts('4f676753')?'ogg':starts('494433')||(b[0]===255&&(b[1]&224)===224)?'mp3':starts('89504e470d0a1a0a')?'png':starts('ffd8ff')?'jpg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':b.toString('ascii',4,8)==='ftyp'?'mp4':starts('1a45dfa3')?'webm':null;
 if(!ext)throw new Error('Supported media: PNG, JPEG, WebP, MP4, WebM, WAV, MP3 and Ogg.');
 if(!/^[a-zA-Z0-9_-]+$/.test(work.id))throw new Error('Invalid work.');
 const base=resolve(root,'studio/assets'),dir=join(base,work.id);mkdirSync(dir,{recursive:true});
 if(lstatSync(base).isSymbolicLink()||lstatSync(dir).isSymbolicLink()||!realpathSync(dir).startsWith(realpathSync(root)+sep))throw new Error('Unsafe media directory.');
 const id=createHash('sha256').update(b).digest('hex'),file=join(dir,id+'.'+ext);
 if(!existsSync(file))writeFileSync(file,b,{flag:'wx',mode:0o644});
 return{src:'/w/studio/assets/'+work.id+'/'+id+'.'+ext,kind:['png','jpg','webp'].includes(ext)?'image':['wav','mp3','ogg'].includes(ext)?'audio':'video',bytes:b.length};
}
