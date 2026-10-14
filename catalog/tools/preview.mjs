/* Browser measurements use the same HTTP/module semantics as the Studio. This
   temporary server binds only loopback and serves the selected work plus shared
   renderer code, never the rest of the workspace or node_modules. */
import {serveFile} from '../../studio/core/http-file.mjs';
import {createServer} from 'node:http';
import {createReadStream,realpathSync,statSync} from 'node:fs';
import {dirname,extname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,'');
const inside=(root,file)=>file===root||file.startsWith(root+sep);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg',
 '.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif',
 '.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf',
 '.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.mp4':'video/mp4',
 '.webm':'video/webm','.glsl':'text/plain','.frag':'text/plain','.vert':'text/plain'};
/* private/ holds what a work took from someone else's reference: never served */
const forbidden=p=>p.split(/[\\/]/).some(s=>s.startsWith('.')||s==='node_modules'||s==='private'
 ||/^(?:secrets?|credentials?|sessions?|auth)(?:[.-]|$)/i.test(s));

export async function startPreview(file,{root=REPO}={}){
 root=realpathSync(root);file=realpathSync(file);
 if(!inside(root,file)||forbidden(relative(root,file))) throw new Error('preview file is outside its allowed root');
 const rel=relative(root,file),parts=rel.split(sep),created=parts[0]==='studio'&&parts[1]==='projects'&&parts[2]==='created'&&parts.length>4;
 const roots=root===realpathSync(REPO)
  ? (parts[0]==='studio'&&parts[1]==='projects'&&parts.length>3
    ? [resolve(root,...parts.slice(0,created?4:3)),resolve(root,'studio/core'),resolve(root,'studio/components'),resolve(root,'studio/sdk'),resolve(root,'studio/renderers'),...['audio.mjs','audio-transport.mjs','typography.mjs','snapshot-resource.mjs','input-asset.mjs'].map(p=>resolve(root,'studio',p)),resolve(root,'studio/media.mjs'),resolve(root,'studio/composition.mjs'),resolve(root,'studio/assets',parts[created?3:2]),resolve(root,'studio/project-player.mjs'),resolve(root,'studio/project-player.css'),resolve(root,'studio/tokens.css'),resolve(root,'core')]
    : [])
  : [root]; // explicit fixture root; production callers never take this from a card
 if(!roots.length) throw new Error('preview only serves studio project files');
 let origin;
 function fileForURL(input){
  try{
   const url=new URL(input,origin||'http://127.0.0.1');
   if(origin&&url.origin!==origin)return null;
   const pathname=decodeURIComponent(url.pathname);
   if(pathname.includes('\\')||pathname.includes('\0'))return null;
   const name=pathname.replace(/^\/w\//,'/').replace(/^\//,'');
   if(!name||isAbsolute(name)||forbidden(name))return null;
   const candidate=resolve(root,name),actual=realpathSync(candidate);
   if(!inside(root,actual)||forbidden(relative(root,actual))||!roots.some(r=>inside(r,actual)))return null;
   if(!types[extname(actual).toLowerCase()]||!statSync(actual).isFile())return null;
   return actual;
  }catch{return null;}
 }
 const server=createServer((req,res)=>{
  /* a page elsewhere could rebind a name to 127.0.0.1 and read this port: only the
     address this server gave out is answered */
  if(!origin||req.headers.host!==origin.slice('http://'.length)){res.writeHead(421);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const target=fileForURL(req.url);
  if(!target){res.writeHead(404);res.end('Not found');return;}
  serveFile(req,res,target,types[extname(target).toLowerCase()]);
 });
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 origin='http://127.0.0.1:'+server.address().port;
 const url=origin+'/'+rel.split(sep).map(encodeURIComponent).join('/');
 return {url,origin,fileForURL,close:()=>new Promise((ok,fail)=>{
  server.close(err=>err?fail(err):ok());server.closeAllConnections();
 })};
}
