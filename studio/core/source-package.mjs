import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {digest} from './source-edit.mjs';
import {assetBytes,listAssets} from './assets.mjs';
import {freshState} from './templates.mjs';
import {ProjectError} from './store.mjs';
import {assertPortableProject} from './project-library.mjs';
export const RUNTIME=['snapshot-resource.mjs','project-player.mjs','project-player.css','tokens.css','composition.mjs','media.mjs','audio.mjs','audio-transport.mjs','input-asset.mjs','typography.mjs','core/audio.mjs','core/typography.mjs','sdk/registry.mjs','sdk/clock.mjs','sdk/legacy.mjs','renderers/canvas2d.mjs','core/project.mjs','core/layers.mjs','core/scenes.mjs','core/editing.mjs','core/component-schema.mjs','core/http-file.mjs','components/legacy.mjs','components/basic2d.mjs'];
// Store-only ZIP: bounded in memory; no shell, temp archive, rendered output or private files.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
export function zipFiles(files){
 let offset=0;const chunks=[],central=[];
 for(const [name,data] of files){
  if(name.startsWith('/')||name.split('/').some(p=>!p||p==='..'||p.startsWith('.'))||name.includes('\\'))throw new Error('Unsafe package path');
  const n=Buffer.from(name),b=Buffer.from(data),crc=crc32(b),local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt32LE(crc,14);local.writeUInt32LE(b.length,18);local.writeUInt32LE(b.length,22);local.writeUInt16LE(n.length,26);chunks.push(local,n,b);
  const header=Buffer.alloc(46);header.writeUInt32LE(0x02014b50);header.writeUInt16LE(20,4);header.writeUInt16LE(20,6);header.writeUInt16LE(0x800,8);header.writeUInt32LE(crc,16);header.writeUInt32LE(b.length,20);header.writeUInt32LE(b.length,24);header.writeUInt16LE(n.length,28);header.writeUInt32LE(offset,42);central.push(header,n);offset+=local.length+n.length+b.length;
 }
 const c=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(c.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,c,end]);
}
export function sourcePackage(root,work,store,revision){
 if(work.creator!==1)throw new ProjectError('Source packages are available for Studio-created projects');
 const head=store.get(work);if(head.revision!==revision)throw new ProjectError('Project changed; refresh before exporting source',409);
 assertPortableProject(root,work,head.project);
 const files=[],add=(name,data)=>files.push([name,Buffer.from(data)]);
 for(const file of RUNTIME)add('studio/'+file,readFileSync(join(root,'studio',file)));
 add(work.page,readFileSync(join(root,work.page)));add(work.dir+'/'+work.project,JSON.stringify(freshState(head.project),null,2)+'\n');
 let bytes=0;for(const asset of listAssets(root,work,head.project)){const b=assetBytes(root,asset.src);bytes+=b.length;if(bytes>64*1024*1024)throw new ProjectError('Source package assets exceed 64 MB');add(asset.src.slice(3),b);}
 add('serve.mjs',`import http from 'node:http';\nimport {readFileSync,existsSync,realpathSync,statSync} from 'node:fs';\nimport {resolve,extname,sep} from 'node:path';\nimport {fileURLToPath} from 'node:url';\nimport {serveFile} from './studio/core/http-file.mjs';\nconst root=fileURLToPath(new URL('.',import.meta.url)).replace(/\\/$/,''),port=Number(process.env.PORT||8080);\nconst types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};\nconst server=http.createServer((req,res)=>{if(req.headers.host!=='127.0.0.1:'+server.address().port){res.writeHead(421);return res.end();}try{let path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path==='/'){res.writeHead(302,{location:'/w/${work.page}'});return res.end();}path=path.replace(/^\\/w\\//,'/');if(!['GET','HEAD'].includes(req.method)||path.split('/').some(p=>p.startsWith('.'))||path.includes('\\\\'))throw Error();const file=resolve(root,'.'+path);if(!file.startsWith(root+sep)||!existsSync(file)||!realpathSync(file).startsWith(root+sep)||!statSync(file).isFile()||!types[extname(file)])throw Error();serveFile(req,res,file,types[extname(file)]);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log('Project: http://127.0.0.1:'+server.address().port));\n`);
 if(head.project.fonts?.some(f=>f.license))add('FONT-LICENSES.txt',head.project.fonts.filter(f=>f.license).map(f=>f.name+'\n'+f.license).join('\n\n'));
 add('README.txt',`Studio source package: ${head.project.name}\n\nRun with Node.js 22 or later: node serve.mjs\nOpen http://127.0.0.1:8080 in a browser. No npm install required.\nUse Play and the frame slider to preview. Frame hooks are also exposed on window.\nEdit ${work.dir}/${work.project} to change the composition.\nThe manifest records the authored revision and SHA-256 of every included file.\nThis is source and imported input media. It contains no rendered final video, account data or edit history.\n`);
 add('manifest.json',JSON.stringify({schemaVersion:1,projectId:work.id,revision:head.revision,generation:head.generation,files:Object.fromEntries(files.map(([name,b])=>[name,digest(b)]))},null,2)+'\n');
 if(store.get(work).revision!==head.revision)throw new ProjectError('Project changed during source export',409);
 return zipFiles(files);
}
