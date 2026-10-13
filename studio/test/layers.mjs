import test from 'node:test';
import assert from 'node:assert/strict';
import fs,{mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
import {validateProject,applyOperations,evaluatedLayers,layerTree,isLayerLocked} from '../core/project.mjs';
import {migrateWhiteoutProject} from '../core/layer-migration.mjs';
import {migrateLayerState,migrateLayerFile,rollbackLayerFile} from '../core/layer-migration-store.mjs';
import {createProjectStore,sourceRevision,validateProjectState} from '../core/store.mjs';
import {digest,withSourceLock} from '../core/source-edit.mjs';
const entity=(id,binding)=>({id,name:binding,type:'layer2d',properties:{x:0,y:0,scale:1,rotation:0,opacity:1},keyframes:{},
 layer:{binding,parentId:null,space:'world',visible:true,locked:false,startFrame:0,endFrame:24}});
const project=()=>({id:'test',name:'Layers',fps:{num:24,den:1},width:320,height:180,shots:[{id:'shot',name:'Shot',durationFrames:24,
 entities:[entity('background','background'),entity('hero','hero'),entity('snow','snow')],layerOrder:['background','hero','snow']}],annotations:[]});
const group={type:'groupLayers',shotId:'shot',targetIds:['background','hero'],groupId:'group-1',name:'Actors and ground'};
const apply=(p,...operations)=>applyOperations(p,operations);
const req=(revision,operations,extra={})=>({baseRevision:revision,requestId:randomUUID(),actor:'ai',operations,...extra});
function disk(t,p=project(),schemaVersion=2){
 const root=mkdtempSync(join(tmpdir(),'studio-layers-'));t.after(()=>rmSync(root,{recursive:true,force:true}));mkdirSync(join(root,'work'));
 const work={id:p.id,dir:'work',project:'project.studio.json'},file=join(root,work.dir,work.project);
 writeFileSync(file,JSON.stringify({schemaVersion,project:p,generation:0,history:{past:[],future:[]},receipts:[]}));
 writeFileSync(join(root,'work','film.js'),'export const revision=1;');return{root,work,file,store:createProjectStore(root)};
}
const legacy=()=>({id:'whiteout',name:'Edited Whiteout',fps:{num:24,den:1},width:1920,height:1080,shots:[{id:'walk',name:'Owner name',durationFrames:47,
 sourceTiming:{startSeconds:3,durationSeconds:2,startFrame:73,durationFrames:47},entities:[
 {id:'camera:walk',name:'Camera',type:'camera2d',properties:{x:42,y:10,zoom:1.4},keyframes:{}},
 {id:'hero:walk',name:'Owner Hero',type:'object2d',properties:{x:77,y:2,scale:1.6,opacity:.7},keyframes:{x:[{frame:0,value:77,easing:'linear'},{frame:20,value:100,easing:'ease'}]}},
 {id:'audio:walk',name:'Mix',type:'audio',properties:{gain:.5,muted:false},keyframes:{}}]}],annotations:[{id:'note-1',shotId:'walk',targetId:'hero:walk',frame:3,text:'Keep this',status:'open'}]});

test('layer order rejects missing identities, cycles, camera nodes and split group subtrees',()=>{
 for(const mutate of [p=>p.shots[0].layerOrder.pop(),p=>p.shots[0].layerOrder[0]='missing',
  p=>p.shots[0].entities[0].layer.parentId='hero',p=>p.shots[0].entities[0].layer.endFrame=25,
  p=>p.shots[0].entities[0].layer.startFrame=24,p=>p.shots[0].entities[0].layer.space='elsewhere']){
  const p=project();mutate(p);assert.throws(()=>validateProject(p,{requireLayers:true}));
 }
 const p=apply(project(),group);p.shots[0].layerOrder=['group-1','background','snow','hero'];assert.throws(()=>validateProject(p),/contiguous/);
 const cyclic=apply(project(),group);cyclic.shots[0].entities.find(e=>e.id==='group-1').layer.parentId='group-1';assert.throws(()=>validateProject(cyclic),/cyclic/);
});
test('groups preserve paint order and move as one contiguous sibling subtree',()=>{
 let p=apply(project(),{...group,targetIds:['hero','background']});assert.deepEqual(p.shots[0].layerOrder,['group-1','background','hero','snow']);
 assert.deepEqual(layerTree(p.shots[0])[0].children.map(n=>n.entity.id),['background','hero']);
 p=apply(p,{type:'moveLayer',targetId:'group-1',index:1});assert.deepEqual(p.shots[0].layerOrder,['snow','group-1','background','hero']);
 assert.throws(()=>apply(project(),{...group,targetIds:['background','snow']}),/contiguous/);
 assert.throws(()=>apply(p,{...group,targetIds:['hero','snow'],groupId:'group-2'}),/same parent/);
 assert.throws(()=>apply(p,{type:'setLayer',targetId:'hero',patch:{parentId:null}}),/unsupported/);
});
test('effective visibility, range and solo inherit while locks are enforced for AI operations',()=>{
 let p=apply(project(),group,{type:'setLayer',targetId:'group-1',patch:{startFrame:5,endFrame:15}});
 assert.equal(evaluatedLayers(p.shots[0],4).find(e=>e.id==='hero').effectiveVisible,false);
 assert.equal(evaluatedLayers(p.shots[0],5).find(e=>e.id==='hero').effectiveVisible,true);
 assert.equal(evaluatedLayers(p.shots[0],15).find(e=>e.id==='hero').effectiveVisible,false);
 assert.deepEqual(evaluatedLayers(p.shots[0],8,{soloIds:['hero']}).filter(e=>e.type!=='group'&&e.effectiveVisible).map(e=>e.id),['hero']);
 p=apply(p,{type:'setLayer',targetId:'group-1',patch:{locked:true}});assert.equal(isLayerLocked(p.shots[0],'hero'),true);
 for(const op of [{type:'setProperty',targetId:'hero',property:'x',value:10},{type:'setKeyframe',targetId:'hero',property:'x',frame:2,value:10},
  {type:'setLayer',targetId:'hero',patch:{locked:false}},{type:'moveLayer',targetId:'hero',index:0},{type:'renameLayer',targetId:'hero',name:'Other'}])assert.throws(()=>apply(p,op),/locked/);
 assert.throws(()=>apply(p,{type:'setLayer',targetId:'group-1',patch:{locked:false,visible:false}}),/locked/);
 p=apply(p,{type:'setLayer',targetId:'group-1',patch:{locked:false}});assert.equal(isLayerLocked(p.shots[0],'hero'),false);
 p=apply(p,{type:'setLayer',targetId:'hero',patch:{locked:true}});assert.throws(()=>apply(p,{type:'moveLayer',targetId:'group-1',index:1}),/descendant/);
});
test('ungroup bakes parent visibility and range, retaining annotations and pixels states',()=>{
 for(const visible of [true,false]){
  let p=apply(project(),group,{type:'setLayer',targetId:'group-1',patch:{visible,startFrame:5,endFrame:15}},
   {type:'setLayer',targetId:'background',patch:{startFrame:16,endFrame:20}},
   {type:'addAnnotation',id:'group-note',shotId:'shot',targetId:'group-1',frame:10,text:'Keep this group'});
  const before=Array.from({length:24},(_,f)=>evaluatedLayers(p.shots[0],f).filter(e=>e.type!=='group').map(e=>[e.id,e.effectiveVisible]));
  p=apply(p,{type:'ungroupLayer',targetId:'group-1'});
  const after=Array.from({length:24},(_,f)=>evaluatedLayers(p.shots[0],f).map(e=>[e.id,e.effectiveVisible]));
  assert.deepEqual(after,before);assert.equal(p.annotations[0].text,'Keep this group');assert.equal(p.annotations[0].targetId,undefined);
 }
});
test('layer batches persist, undo/redo survives restart, retries are idempotent and context describes layers',t=>{
 const f=disk(t);const request=req(f.store.get(f.work).revision,[group,{type:'setLayer',targetId:'group-1',patch:{visible:false}}]);
 let r=f.store.transact(f.work,request);assert.equal(r.schemaVersion,2);assert.equal(createProjectStore(f.root).transact(f.work,request).replayed,true);
 const context=f.store.context(f.work,10);assert.equal(context.selection.layers.find(e=>e.id==='hero').effectiveVisible,false);
 r=f.store.transact(f.work,req(r.revision,[],{action:'undo'}));assert.deepEqual(r.project.shots[0].layerOrder,['background','hero','snow']);
 r=createProjectStore(f.root).transact(f.work,req(r.revision,[],{action:'redo'}));assert.equal(r.project.shots[0].layerOrder[0],'group-1');
 const before=readFileSync(f.file,'utf8');assert.throws(()=>f.store.transact(f.work,req(r.revision,[{type:'renameLayer',targetId:'hero',name:'Changed'},{type:'setLayer',targetId:'hero',patch:{endFrame:99}}])));assert.equal(readFileSync(f.file,'utf8'),before);
});
test('pure migration preserves edited Hero/camera/audio, IDs, keyframes, timing and annotations',()=>{
 const original=legacy(),copy=structuredClone(original),p=migrateWhiteoutProject(original);
 assert.deepEqual(original,copy);assert.deepEqual(p.annotations,original.annotations);assert.deepEqual(p.shots[0].sourceTiming,original.shots[0].sourceTiming);
 const hero=p.shots[0].entities.find(e=>e.id==='hero:walk');assert.equal(hero.name,'Owner Hero');assert.equal(hero.properties.x,77);assert.equal(hero.properties.rotation,0);
 assert.deepEqual(hero.keyframes,original.shots[0].entities[1].keyframes);assert.deepEqual(p.shots[0].entities[0],original.shots[0].entities[0]);
 assert.deepEqual(migrateWhiteoutProject(p),p);assert.equal(p.shots[0].entities.find(e=>e.id==='audio:walk').properties.gain,.5);
});
test('migration maps known snapshot hashes without legitimizing older external source changes',t=>{
 const f=disk(t,legacy(),1);let r=f.store.get(f.work);
 for(const zoom of [1.5,1.6])r=f.store.transact(f.work,req(r.revision,[{type:'setProperty',targetId:'camera:walk',property:'zoom',value:zoom}]));
 const old=JSON.parse(readFileSync(f.file,'utf8'));old.history.past[0].sourceHash='c'.repeat(64);old.history.past[0].expectedHash='d'.repeat(64);
 const {state,summary}=migrateLayerState(old,{beforeSourceHash:r.sourceRevision,afterSourceHash:'e'.repeat(64)});
 assert.equal(summary.rebased,1);assert.equal(summary.retained,1);assert.equal(summary.expectedRetained,1);assert.equal(state.history.past[0].sourceHash,'c'.repeat(64));
 assert.equal(state.history.past[0].expectedHash,'d'.repeat(64));assert.deepEqual(state.receipts,old.receipts);assert.equal(state.generation,old.generation);
 validateProjectState(state,f.work);
});
test('disk migration is explicit, reversible, preserves latest history/retry, and refuses stale manifests',t=>{
 const f=disk(t,legacy(),1);const edit=req(f.store.get(f.work).revision,[{type:'setProperty',targetId:'camera:walk',property:'zoom',value:1.7}]);
 const beforeEdit=f.store.transact(f.work,edit),before=readFileSync(f.file,'utf8'),manifest={documentHash:digest(before),sourceHash:beforeEdit.sourceRevision,generation:beforeEdit.generation};
 writeFileSync(join(f.root,'work','film.js'),'export const revision=2;');
 const dry=migrateLayerFile(f.root,f.work,{manifest});assert.equal(readFileSync(f.file,'utf8'),before);assert.ok(!existsSync(dry.backupPath));
 assert.throws(()=>migrateLayerFile(f.root,f.work,{manifest:{...manifest,documentHash:'a'.repeat(64)},dryRun:false}),e=>e.status===409);
 withSourceLock(f.file,()=>assert.throws(()=>migrateLayerFile(f.root,f.work,{manifest,dryRun:false}),e=>e.status===409));
 const applied=migrateLayerFile(f.root,f.work,{manifest,dryRun:false});assert.equal(readFileSync(applied.backupPath,'utf8'),before);
 assert.ok(applied.backupPath.includes('/.migration-backups/'));assert.equal(f.store.get(f.work).schemaVersion,2);
 assert.equal(f.store.transact(f.work,edit).replayed,true);assert.equal(f.store.transact(f.work,edit).appliedRevision,beforeEdit.revision);
 const migrated=readFileSync(f.file,'utf8'),head=f.store.get(f.work);
 let undone=f.store.transact(f.work,req(head.revision,[],{action:'undo'}));assert.equal(undone.project.shots[0].entities.find(e=>e.id==='camera:walk').properties.zoom,1.4);
 undone=f.store.transact(f.work,req(undone.revision,[],{action:'redo'}));assert.equal(undone.project.shots[0].entities.find(e=>e.id==='camera:walk').properties.zoom,1.7);
 assert.throws(()=>rollbackLayerFile(f.root,f.work,applied.receiptPath),e=>e.status===409);
 // A fixture can restore the exact just-migrated bytes to exercise safe rollback;
 // production rollback intentionally never discards subsequent edits.
 writeFileSync(f.file,migrated);rollbackLayerFile(f.root,f.work,applied.receiptPath);assert.equal(readFileSync(f.file,'utf8'),before);
});
test('migration retains an existing redo branch and rebases its expected snapshot correctly',t=>{
 const f=disk(t,legacy(),1);let head=f.store.get(f.work);
 for(const zoom of [1.5,1.8])head=f.store.transact(f.work,req(head.revision,[{type:'setProperty',targetId:'camera:walk',property:'zoom',value:zoom}]));
 head=f.store.transact(f.work,req(head.revision,[],{action:'undo'}));
 const original=JSON.parse(readFileSync(f.file,'utf8')),manifest={documentHash:digest(readFileSync(f.file)),sourceHash:head.sourceRevision,generation:head.generation};
 assert.equal(original.history.future.length,1);
 writeFileSync(join(f.root,'work','film.js'),'export const revision=2;');
 const migrated=migrateLayerFile(f.root,f.work,{manifest,dryRun:false});assert.equal(migrated.past,1);assert.equal(migrated.future,1);assert.equal(migrated.rebased,2);
 const state=JSON.parse(readFileSync(f.file,'utf8'));assert.deepEqual(state.receipts,original.receipts);assert.equal(state.generation,3);
 head=f.store.get(f.work);head=f.store.transact(f.work,req(head.revision,[],{action:'redo'}));
 assert.equal(head.project.shots[0].entities.find(e=>e.id==='camera:walk').properties.zoom,1.8);
 assert.ok(head.project.shots[0].layerOrder.includes('hero:walk'));
});
test('source revision includes both shared layer runtime modules',t=>{
 const f=disk(t);mkdirSync(join(f.root,'studio','core'),{recursive:true});const before=sourceRevision(f.root,f.work);
 for(const name of ['layers.mjs','layer-migration.mjs']){
  const path=join(f.root,'studio','core',name);writeFileSync(path,'export const version=1;');const added=sourceRevision(f.root,f.work);assert.notEqual(added,before);
  writeFileSync(path,'export const version=2;');assert.notEqual(sourceRevision(f.root,f.work),added);
 }
});
test('migration failure during a temp write preserves external bytes, with a durable backup',t=>{
 const f=disk(t,legacy(),1),before=readFileSync(f.file,'utf8'),manifest={documentHash:digest(before),sourceHash:sourceRevision(f.root,f.work),generation:0};
 const dry=migrateLayerFile(f.root,f.work,{manifest});const original=fs.fsyncSync;let changed=false,external;
 try{
  fs.fsyncSync=fd=>{
   const path=fs.readlinkSync('/proc/self/fd/'+fd);
   if(!changed&&path.endsWith('.tmp')&&path.includes('project.studio.json')){changed=true;const state=JSON.parse(before);state.project.name='A newer user edit';external=JSON.stringify(state);writeFileSync(f.file,external);}
   return original(fd);
  };syncBuiltinESMExports();
  assert.throws(()=>migrateLayerFile(f.root,f.work,{manifest,dryRun:false}),e=>e.status===409);
 }finally{fs.fsyncSync=original;syncBuiltinESMExports();}
 assert.ok(changed);assert.equal(readFileSync(f.file,'utf8'),external);assert.equal(readFileSync(dry.backupPath,'utf8'),before);
});
