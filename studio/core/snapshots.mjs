// Immutable SOURCE snapshots. No rendered video is accepted or stored here.
import {readFileSync,readdirSync,lstatSync,existsSync,mkdirSync,mkdtempSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import {join,dirname,extname} from 'node:path';
import {digest} from './source-edit.mjs';
import {safeDirectory,assetReferences,assetBytes} from './assets.mjs';
import {RUNTIME} from './source-package.mjs';
import {freshState} from './templates.mjs';
import {ProjectError} from './store.mjs';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const sha=x=>digest(JSON.stringify(canonical(x))),valid=id=>/^[a-f0-9]{64}$/.test(id||'');
const LIMIT=96*1024*1024,STORE_LIMIT=512*1024*1024;
const allowed=/\.(html|m?js|css|json|svg|png|jpe?g|webp|mp4|webm|wav|mp3|ogg|woff2?|ttf|otf)$/;
export function createSnapshots(root,store){
 const directory=()=>safeDirectory(root,'build/snapshots',{create:true});
 function collect(work,revision){
  if(!work.project||!work.page)throw new ProjectError('This work needs a managed project and frame renderer before it can be frozen',422);
  const head=store.get(work);if(revision&&head.revision!==revision)throw new ProjectError('Project changed. Refresh before freezing.',409);
  const files=new Map(),originals=new Map();let bytes=0;
  const add=(name,data)=>{if(files.has(name))return;bytes+=data.length;if(bytes>LIMIT||files.size>=2048)throw new ProjectError('Snapshot exceeds 96 MB or 2048 source files',413);files.set(name,data);};
  const read=name=>{
   if(name.includes('\\')||name.split('/').some(p=>!p||p.startsWith('.'))||!allowed.test(name))throw new ProjectError('Unsafe snapshot source',422);
   const dir=safeDirectory(root,dirname(name)),file=dir&&join(dir,name.split('/').at(-1));
   if(!file||!existsSync(file)||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink()||lstatSync(file).size>LIMIT)throw new ProjectError('Missing or unsafe snapshot source: '+name,422);
   const data=readFileSync(file);originals.set(name,digest(data));add(name,data);
  };
  for(const name of new Set([...RUNTIME,'core/layer-migration.mjs','core/editor-upgrade.mjs','audit.mjs','export-verify.mjs','export-engine.mjs']))read('studio/'+name);
  function walk(path){const dir=safeDirectory(root,path);if(!dir)throw new ProjectError('Missing source directory',422);for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   if(e.name.startsWith('.')||['node_modules','build','out','private','history'].includes(e.name))continue;
   const name=path+'/'+e.name;if(name===work.dir+'/'+work.project||e.name==='work.json')continue;
   if(e.isSymbolicLink())throw new ProjectError('Snapshot source contains a symlink',422);
   if(e.isDirectory())walk(name);else if(allowed.test(name))read(name);
  }}walk(work.dir);
  if(!files.has(work.page))throw new ProjectError('Snapshot entry point is missing',422);
  // Mutable remote imports cannot be called reproducible; never silently substitute fonts.
  for(const [name,b] of files)if(/\.(html|m?js|css)$/.test(name)&&/(?:src|href)\s*=\s*["'](?:https?:)?\/\/|(?:import\s*(?:\(|[^;]*?from\s*)|url\(\s*|fetch\(\s*)["'](?:https?:)?\/\//i.test(b.toString()))throw new ProjectError('Pin external dependencies locally before freezing: '+name,422);
  add(work.dir+'/'+work.project,Buffer.from(JSON.stringify(freshState(head.project))+'\n'));
  for(const src of assetReferences(head.project).keys())add(src.slice(3),assetBytes(root,src));
  const projectHash=sha(head.project),fileHashes=Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([k,b])=>[k,digest(b)]));
  const identity={schemaVersion:1,work:work.id,page:work.page,projectHash,files:fileHashes,seed:head.project.seed??null,renderer:head.project.renderer||'legacy-page',rendererVersion:head.project.renderer==='canvas2d'?/version:'([^']+)'/.exec(files.get('studio/renderers/canvas2d.mjs').toString())?.[1]||'unknown':'legacy source hash',sdkVersion:1,dependencies:{kind:'bundled-source',network:'blocked',node:process.version}};
  // Re-read after collection: a mixed source graph is never published.
  if(store.get(work).revision!==head.revision||[...originals].some(([name,hash])=>digest(readFileSync(join(root,name)))!==hash))throw new ProjectError('Source changed during snapshot. Retry.',409);
  const id=sha(identity);return{files,manifest:{...identity,id,bytes,createdAt:new Date().toISOString(),capturedRevision:head.revision,sourceHash:head.sourceRevision},head};
 }
 function get(id){if(!valid(id))throw new ProjectError('Invalid snapshot',404);const dir=safeDirectory(root,'build/snapshots/'+id);if(!dir)throw new ProjectError('Snapshot not found. Freeze again.',404);const file=join(dir,'manifest.json');if(lstatSync(file).isSymbolicLink())throw new ProjectError('Unsafe snapshot',422);const m=JSON.parse(readFileSync(file));const {id:recorded,bytes,createdAt,capturedRevision,sourceHash,...identity}=m;if(recorded!==id||sha(identity)!==id)throw new ProjectError('Snapshot manifest changed',422);return m;}
 return{
  get,
  capture(work,revision){const {files,manifest}=collect(work,revision),base=directory(),target=join(base,manifest.id);
   if(existsSync(target)){get(manifest.id);for(const [name,b] of files)if(!readFileSync(join(target,'files',name)).equals(b))throw new ProjectError('Snapshot bytes changed',422);return get(manifest.id);}
   let used=0;for(const id of readdirSync(base))if(valid(id))used+=get(id).bytes;
   if(used+manifest.bytes>STORE_LIMIT)throw new ProjectError('Source snapshot storage is full (512 MB). Archive unused snapshots before retrying.',507);
   const temp=mkdtempSync(join(base,'.capture-'));try{for(const [name,b] of files){const file=join(temp,'files',name);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,b,{flag:'wx'});}writeFileSync(join(temp,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');renameSync(temp,target);}finally{rmSync(temp,{recursive:true,force:true});}return manifest;
  },
  freshness(work,id){const manifest=get(id);if(manifest.work!==work.id)throw new ProjectError('Snapshot belongs to another work',404);try{const now=collect(work);return{current:now.manifest.id===id,snapshotId:id,currentId:now.manifest.id};}catch(e){return{current:false,snapshotId:id,reason:e.message};}},
  file(id,name){const manifest=get(id);if(!Object.hasOwn(manifest.files,name))throw new ProjectError('File is not in this snapshot',404);const dir=safeDirectory(root,'build/snapshots/'+id+'/files/'+dirname(name)),file=dir&&join(dir,name.split('/').at(-1));if(!file||lstatSync(file).isSymbolicLink())throw new ProjectError('Unsafe snapshot file',422);const b=readFileSync(file);if(digest(b)!==manifest.files[name])throw new ProjectError('Snapshot file changed',422);return{file,manifest};}
 };
}
