import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createTemplate} from '../core/templates.mjs';
import {applyOperations,validateProject} from '../core/project.mjs';
import {createProjectStore} from '../core/store.mjs';
import {createLibrary,createdWorks} from '../core/project-library.mjs';
import {listAssets,importAsset,assetBytes} from '../core/assets.mjs';
import {sourcePackage,zipFiles} from '../core/source-package.mjs';
const request=()=>({requestId:crypto.randomUUID(),actor:'human',name:'New story',format:'16:9',fps:24,durationSeconds:12,template:'title-sequence'});
const template=()=>createTemplate('example',request());
const png=Buffer.from('89504e470d0a1a0a0000000049484452','hex');
function fixture(t){const root=mkdtempSync(join(tmpdir(),'studio-creator-'));mkdirSync(join(root,'studio/projects'),{recursive:true});t.after(()=>rmSync(root,{recursive:true,force:true}));const store=createProjectStore(root);return{root,store,library:createLibrary(root,store)};}
test('templates validate all formats and FPS, exact total frames and bounded input',()=>{
 for(const format of ['16:9','9:16','1:1'])for(const fps of [24,25,30,60])for(const variant of ['blank','title-sequence']){const p=createTemplate('example',{...request(),format,fps,durationSeconds:2.1,template:variant});assert.equal(p.shots.reduce((sum,s)=>sum+s.durationFrames,0),Math.round(2.1*fps));assert.equal(p.shots.length,variant==='blank'?1:3);validateProject(p,{requireLayers:true});}
 for(const invalid of [{name:''},{format:'../../tmp'},{fps:NaN},{fps:0},{durationSeconds:601},{template:'../../code'}])assert.throws(()=>createTemplate('example',{...request(),...invalid}));
});
test('scene duplication remaps nested layers and annotations; delete, last-scene and lock rules are atomic',()=>{
 let p=template(),s=p.shots[0];
 p=applyOperations(p,[{type:'groupLayers',shotId:s.id,targetIds:s.layerOrder.slice(1),groupId:'group',name:'Text and shape'},{type:'addAnnotation',id:'note',shotId:s.id,frame:10,targetId:s.layerOrder[1],text:'Change accent'},{type:'duplicateShot',shotId:s.id,id:'copy'}]);
 const copied=p.shots[1],ids=new Set(copied.entities.map(e=>e.id)),note=p.annotations[1];assert.equal(copied.id,'copy');assert.equal(note.shotId,'copy');assert.ok(ids.has(note.targetId));for(const e of copied.entities)if(e.layer?.parentId)assert.ok(ids.has(e.layer.parentId));assert.ok(copied.layerOrder.every(id=>ids.has(id)));validateProject(p,{requireLayers:true});
 const before=JSON.stringify(p);assert.throws(()=>applyOperations(p,[{type:'deleteShot',shotId:'copy'},{type:'setProperty',targetId:'missing',property:'x',value:2}]));assert.equal(JSON.stringify(p),before);
 p=applyOperations(p,[{type:'deleteShot',shotId:'copy'}]);assert.equal(p.annotations.length,1);
 p=applyOperations(p,[{type:'setLayer',targetId:s.layerOrder[0],patch:{locked:true}}]);assert.throws(()=>applyOperations(p,[{type:'deleteShot',shotId:s.id}]),/Unlock/);
 const blank=createTemplate('blank',{...request(),template:'blank'});assert.throws(()=>applyOperations(blank,[{type:'deleteShot',shotId:blank.shots[0].id}]),/at least/);
 assert.throws(()=>applyOperations(blank,[{type:'addShot',id:blank.shots[0].id,name:'Duplicate',durationFrames:48}]),/duplicate/);
});
test('creation retries, unique identities, persistence, validation and shared Human/AI history',t=>{
 const {root,store,library}=fixture(t),r=request(),{work}=library.create(r);assert.equal(library.create(r).replayed,true);assert.throws(()=>library.create({...r,name:'Changed'}),/already used/);
 assert.equal(createdWorks(root).length,1);const start=store.get(work);assert.ok(start.capabilities.operations.includes('addShot'));assert.ok(start.capabilities.operations.includes('addAudio'));
 const change={baseRevision:start.revision,requestId:crypto.randomUUID(),actor:'ai',operations:[{type:'addShot',id:'fourth',name:'Fourth',durationFrames:72}]};const next=store.transact(work,change);assert.equal(next.project.shots.length,4);assert.equal(store.transact(work,change).replayed,true);
 assert.throws(()=>store.transact(work,{...change,requestId:crypto.randomUUID()}),/changed/);
 const undo=store.transact(work,{baseRevision:next.revision,requestId:crypto.randomUUID(),actor:'human',action:'undo'});assert.deepEqual(undo.project,start.project);
 const redo=store.transact(work,{baseRevision:undo.revision,requestId:crypto.randomUUID(),actor:'human',action:'redo'});assert.equal(redo.project.shots.length,4);
 const legacy={...work,creator:undefined};assert.ok(!store.get(legacy).capabilities.operations.includes('deleteShot'));
});
test('asset inventory detects missing/changed references and rejects symlink parents before writes',t=>{
 const {root,store,library}=fixture(t),{work}=library.create(request()),asset=importAsset(root,work,{data:png.toString('base64'),name:'logo.png'});let p=store.get(work).project;
 p=applyOperations(p,[{type:'addLayer',shotId:p.shots[0].id,id:'image',kind:'image',content:{src:asset.src,width:100,height:100,offsetSeconds:0,playbackRate:1}}]);
 assert.deepEqual(listAssets(root,work,p).map(a=>[a.name,a.uses,a.status]),[['logo.png',1,'ready']]);rmSync(join(root,asset.src.slice(3)));assert.equal(listAssets(root,work,p)[0].status,'missing');importAsset(root,work,{data:png.toString('base64')});assert.equal(listAssets(root,work,p)[0].status,'ready');writeFileSync(join(root,asset.src.slice(3)),'corrupt');assert.equal(listAssets(root,work,p)[0].status,'invalid');assert.throws(()=>assetBytes(root,asset.src),/changed/);
 const outside=mkdtempSync(join(tmpdir(),'creator-outside-'));t.after(()=>rmSync(outside,{recursive:true,force:true}));symlinkSync(outside,join(root,'studio/assets/evil'));assert.throws(()=>importAsset(root,{id:'evil'},{data:png.toString('base64')}),/Unsafe/);assert.equal(existsSync(join(outside,asset.src.split('/').at(-1))),false);
});
test('project duplicate copies media and remaps references, independent of source deletion',t=>{
 const {root,store,library}=fixture(t),{work}=library.create(request()),asset=importAsset(root,work,{data:png.toString('base64'),name:'logo.png'}),head=store.get(work);
 const current=store.transact(work,{baseRevision:head.revision,requestId:crypto.randomUUID(),actor:'human',operations:[{type:'addLayer',shotId:head.project.shots[0].id,id:'img',kind:'image',content:{src:asset.src,width:100,height:100,offsetSeconds:0,playbackRate:1}}]});
 const req={requestId:crypto.randomUUID(),actor:'ai',name:'Copy',baseRevision:current.revision},copy=library.create(req,work);assert.equal(library.create(req,work).replayed,true);const state=store.get(copy.work);assert.equal(state.generation,0);assert.equal(state.history.canUndo,false);assert.notEqual(state.project.id,current.project.id);
 const src=state.project.shots[0].entities.find(e=>e.content?.src).content.src;assert.ok(src.includes(copy.work.id));assert.notEqual(src,asset.src);rmSync(join(root,asset.src.slice(3)));assert.deepEqual(assetBytes(root,src),png);
 assert.throws(()=>library.create({...req,requestId:crypto.randomUUID(),baseRevision:'stale'},work),/changed/);
});
test('ZIP rejects traversal and writes a standard archive signature',()=>{
 const zip=zipFiles([['README.txt','hello']]);assert.equal(zip.readUInt32LE(),0x04034b50);assert.equal(zip.readUInt32LE(zip.length-22),0x06054b50);assert.throws(()=>zipFiles([['../secret','x']]),/Unsafe/);
});

test('customized player code is refused instead of silently lost by duplication or packaging',t=>{
 const {root,store,library}=fixture(t),{work}=library.create(request());writeFileSync(join(root,work.page),'<!doctype html><script src="./custom.mjs"></script>');const head=store.get(work);
 assert.throws(()=>library.create({requestId:crypto.randomUUID(),actor:'ai',name:'Copy',baseRevision:head.revision},work),/customized runtime/);
 assert.throws(()=>sourcePackage(root,work,store,head.revision),/customized runtime/);
});
