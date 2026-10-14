import {mkdirSync,existsSync,writeFileSync,lstatSync,realpathSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve,sep,relative} from 'node:path';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const ASSET=/^\/w\/studio\/assets\/([a-zA-Z0-9_-]+)\/([a-f0-9]{64})\.(png|jpg|webp|mp4|webm|wav|mp3|ogg|woff|woff2|ttf|otf)$/;
const kind=ext=>['woff','woff2','ttf','otf'].includes(ext)?'font':['png','jpg','webp'].includes(ext)?'image':['wav','mp3','ogg'].includes(ext)?'audio':'video';
// Check each ancestor before creating or reading through it.
export function safeDirectory(root,path,{create=false}={}){
 const base=realpathSync(root),target=resolve(root,path),rel=relative(base,target);
 if(!rel||rel.startsWith('..')||rel.includes('\\'))throw new Error('Unsafe directory');
 let at=base;for(const part of rel.split(sep)){at=join(at,part);if(!existsSync(at)){if(create)mkdirSync(at);else return null;}if(lstatSync(at).isSymbolicLink()||!lstatSync(at).isDirectory())throw new Error('Unsafe directory');}return at;
}
export function assetBytes(root,src){
 const m=ASSET.exec(src);if(!m)throw new Error('Invalid asset reference');
 const dir=safeDirectory(root,'studio/assets/'+m[1]),file=dir&&join(dir,m[2]+'.'+m[3]);
 if(!file||!existsSync(file))throw new Error('Missing asset: '+src);
 if(!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())throw new Error('Unsafe asset');
 if(lstatSync(file).size>18*1024*1024)throw new Error('Asset exceeds 18 MB');
 const bytes=readFileSync(file);if(hash(bytes)!==m[2])throw new Error('Asset content changed: '+src);return bytes;
}
export function assetReferences(project){
 const refs=new Map();for(const f of project.fonts||[])refs.set(f.src,(refs.get(f.src)||0)+1);for(const shot of project.shots)for(const e of shot.entities){const src=e.content?.src||e.cue?.src;if(src)refs.set(src,(refs.get(src)||0)+1);}return refs;
}
export function listAssets(root,work,project){
 const refs=assetReferences(project),dir=safeDirectory(root,'studio/assets/'+work.id),sources=new Set(refs.keys());
 if(dir)for(const f of readdirSync(dir))if(ASSET.test('/w/studio/assets/'+work.id+'/'+f))sources.add('/w/studio/assets/'+work.id+'/'+f);
 return [...sources].sort().map(src=>{const m=ASSET.exec(src);let status='ready',bytes=0,name=m?.[2].slice(0,12)+'.'+m?.[3];
  try{const b=assetBytes(root,src);bytes=b.length;}catch(error){status=error.message.startsWith('Missing')?'missing':'invalid';}
  if(m)try{const metadataFile=join(root,'studio/assets',m[1],m[2]+'.name.json');if(lstatSync(metadataFile).isSymbolicLink()||lstatSync(metadataFile).size>4096)throw new Error('Unsafe metadata');const metadata=JSON.parse(readFileSync(metadataFile,'utf8'));if(typeof metadata.name==='string')name=metadata.name.slice(0,200);}catch{}
  return{src,name,kind:kind(m?.[3]),bytes,status,uses:refs.get(src)||0};
 });
}
// Content-addressed input media never changes earlier history. Final renders stay in the browser.
export function importAsset(root,work,request){
 if(typeof request.data!=='string'||request.data.length>24*1024*1024||request.data.length%4!==0||/[^A-Za-z0-9+/=]/.test(request.data))throw new Error('Choose media up to 18 MB.');
 const b=Buffer.from(request.data,'base64');if(b.toString('base64')!==request.data)throw new Error('Invalid media encoding');if(b.length<12)throw new Error('Empty media file.');
 const starts=hex=>b.subarray(0,hex.length/2).equals(Buffer.from(hex,'hex'));
 const ext=starts('774f4632')?'woff2':starts('774f4646')?'woff':starts('00010000')?'ttf':starts('4f54544f')?'otf':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE'?'wav':starts('4f676753')?'ogg':starts('494433')||(b[0]===255&&(b[1]&224)===224)?'mp3':starts('89504e470d0a1a0a')?'png':starts('ffd8ff')?'jpg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':b.toString('ascii',4,8)==='ftyp'?'mp4':starts('1a45dfa3')?'webm':null;
 if(!ext)throw new Error('Supported media: PNG, JPEG, WebP, MP4, WebM, WAV, MP3, Ogg, WOFF/WOFF2, TTF and OTF.');
 if(!/^[a-zA-Z0-9_-]+$/.test(work.id))throw new Error('Invalid work.');
 const dir=safeDirectory(root,'studio/assets/'+work.id,{create:true}),id=hash(b),file=join(dir,id+'.'+ext);
 if(existsSync(file)){if(lstatSync(file).isSymbolicLink()||!lstatSync(file).isFile()||hash(readFileSync(file))!==id)throw new Error('Existing asset is unsafe or changed');}
 else writeFileSync(file,b,{flag:'wx',mode:0o644});
 if(typeof request.name==='string'&&request.name.trim())try{writeFileSync(join(dir,id+'.name.json'),JSON.stringify({name:request.name.trim().slice(0,200)}),{flag:'wx',mode:0o644});}catch(e){if(e.code!=='EEXIST')throw e;}
 return{src:'/w/studio/assets/'+work.id+'/'+id+'.'+ext,kind:kind(ext),bytes:b.length};
}
