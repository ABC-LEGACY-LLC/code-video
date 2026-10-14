import {existsSync,readFileSync,writeFileSync,readdirSync,renameSync,rmSync,lstatSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {digest,withSourceLock} from './source-edit.mjs';
import {createTemplate,freshState} from './templates.mjs';
import {EDITING_OPERATIONS} from './editing.mjs';
import {copyShot,SCENE_OPERATIONS} from './scenes.mjs';
import {LAYER_OPERATIONS,validateProject} from './project.mjs';
import {safeDirectory,listAssets,assetBytes,importAsset} from './assets.mjs';
import {ProjectError} from './store.mjs';
import {basicDescriptors} from '../components/basic2d.mjs';
export const CREATED_DIR='studio/projects/created';
import {AUDIO_OPERATIONS} from './audio.mjs';
import {TYPOGRAPHY_OPERATIONS} from './typography.mjs';
const ops=[...AUDIO_OPERATIONS,...TYPOGRAPHY_OPERATIONS,'addAudio','setCue','deleteAudio','duplicateAudio',...EDITING_OPERATIONS,'stretchShot',...SCENE_OPERATIONS,'addComponent','setProperty','setKeyframe','deleteKeyframe','renameShot','trimShot','moveShot','addAnnotation','resolveAnnotation',...LAYER_OPERATIONS];
export const playerHTML='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Studio project</title><link rel="stylesheet" href="../../../tokens.css"><link rel="stylesheet" href="../../../project-player.css"><style>body{margin:0;background:var(--stage);display:grid;place-items:center;min-height:100vh}canvas{width:100%;height:auto;max-height:100vh;object-fit:contain}</style><canvas></canvas><script>window.__ready=false;</script><script type="module" src="../../../project-player.mjs"></script></html>\n';
const canonical=value=>value&&typeof value==='object'?(Array.isArray(value)?value.map(canonical):Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]))):value;
export function assertPortableProject(root,work,project){
 if(project.renderer!=='canvas2d'||JSON.stringify(canonical(project.components))!==JSON.stringify(canonical(basicDescriptors))||readFileSync(join(root,work.page),'utf8')!==playerHTML)throw new ProjectError('This project has a customized runtime. Duplication and source packages currently support the built-in Studio player; preserve customized code through your repository.');
}
function workFor(id,name){const dir=CREATED_DIR+'/'+id;return{id,name,dir,page:dir+'/index.html',project:'project.studio.json',control:'frameTo',suites:[],creator:1,editor:{operations:ops}};}
export function createdWorks(root){
 const dir=safeDirectory(root,CREATED_DIR);if(!dir)return[];
 return readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&/^project-[a-f0-9]{24}$/.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>{
  try{const file=join(dir,e.name,'project.studio.json'),receipt=join(dir,e.name,'work.json');if(lstatSync(file).isSymbolicLink()||lstatSync(receipt).isSymbolicLink())return[];const state=JSON.parse(readFileSync(file,'utf8')),meta=JSON.parse(readFileSync(receipt,'utf8'));if(meta.creator!==1||state.project.id!==e.name)return[];return[workFor(e.name,state.project.name)];}catch{return[];}
 });
}
export function createLibrary(root,store){
 function create(request,sourceWork=null){
  if(!/^[\w:-]{8,120}$/.test(request.requestId||''))throw new ProjectError('Provide a unique requestId (8–120 characters)');
  if(!['human','ai'].includes(request.actor))throw new ProjectError('actor must be human or ai');
  if(sourceWork&&sourceWork.creator!==1)throw new ProjectError('Duplicate is available for Studio-created projects');
  const payload=sourceWork?{source:sourceWork.id,baseRevision:request.baseRevision,name:request.name,actor:request.actor}:{name:request.name,format:request.format,fps:request.fps,durationSeconds:request.durationSeconds,template:request.template,actor:request.actor};
  const signature=digest(JSON.stringify(payload)),id='project-'+digest(request.requestId).slice(0,24),parent=safeDirectory(root,CREATED_DIR,{create:true}),target=join(parent,id);
  return withSourceLock(join(parent,'library'),()=>{
   if(existsSync(target)){const meta=JSON.parse(readFileSync(join(target,'work.json'),'utf8'));if(meta.requestId!==request.requestId||meta.signature!==signature)throw new ProjectError('requestId was already used with different values',409);const work=workFor(id,JSON.parse(readFileSync(join(target,'project.studio.json'),'utf8')).project.name);return{work,replayed:true};}
   const snapshot=sourceWork?store.get(sourceWork):null;
   if(snapshot&&snapshot.revision!==request.baseRevision)throw new ProjectError('Project changed; refresh before duplicating',409);
   let project;
   if(snapshot){
    assertPortableProject(root,sourceWork,snapshot.project);
    if(typeof request.name!=='string'||!request.name.trim()||request.name.length>200)throw new ProjectError('Enter a project name (1–200 characters)');
    project=structuredClone(snapshot.project);project.id=id;project.name=request.name.trim();project.annotations=[];
    project.shots=snapshot.project.shots.map((s,i)=>{const copy=copyShot(s,`${id}:s${i}`,snapshot.project.annotations);project.annotations.push(...copy.annotations);return copy.shot;});
   }else project=createTemplate(id,request);
   const temp=mkdtempSync(join(parent,'.creating-'));let published=false;
   try{
    if(snapshot){
     const assets=listAssets(root,sourceWork,snapshot.project),map=new Map();let size=0;
     for(const asset of assets){const bytes=assetBytes(root,asset.src);size+=bytes.length;if(size>64*1024*1024)throw new ProjectError('Project assets exceed the 64 MB duplication limit');const imported=importAsset(root,{id},{data:bytes.toString('base64'),name:asset.name});map.set(asset.src,imported.src);}
     for(const font of project.fonts||[])font.src=map.get(font.src);
     for(const shot of project.shots)for(const entity of shot.entities){if(entity.content?.src)entity.content.src=map.get(entity.content.src);if(entity.cue?.src)entity.cue.src=map.get(entity.cue.src);}
    }
    validateProject(project,{requireLayers:true});
    writeFileSync(join(temp,'project.studio.json'),JSON.stringify(freshState(project),null,2)+'\n',{flag:'wx'});
    writeFileSync(join(temp,'index.html'),playerHTML,{flag:'wx'});
    writeFileSync(join(temp,'work.json'),JSON.stringify({creator:1,requestId:request.requestId,signature,createdAt:new Date().toISOString(),actor:request.actor,template:sourceWork?'duplicate':request.template},null,2)+'\n',{flag:'wx'});
    if(snapshot&&store.get(sourceWork).revision!==snapshot.revision)throw new ProjectError('Project changed while duplicating; try again',409);
    renameSync(temp,target);published=true;return{work:workFor(id,project.name),replayed:false};
   }finally{if(!published)rmSync(temp,{recursive:true,force:true});}
  });
 }
 return{create};
}
