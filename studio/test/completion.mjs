import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {applyOperations,validateProject,evaluateEntity} from '../core/project.mjs';
import {upgradeEditorProject} from '../core/editor-upgrade.mjs';
import {importAsset} from '../core/assets.mjs';
const project=()=>upgradeEditorProject(JSON.parse(readFileSync(new URL('../projects/whiteout/project.studio.json',import.meta.url))).project);
const text={text:'Test',fontSize:72,fontFamily:'sans-serif',color:'#ffffff',align:'center',width:400,height:100};
test('new text, duplicate procedural layers, deletion and content edit form atomic batches',()=>{
 const p=project();const added=applyOperations(p,[{type:'addLayer',shotId:'meet',id:'caption',name:'Caption',kind:'text',content:text},{type:'duplicateLayer',targetId:'hero:meet',id:'hero-copy'}]);
 assert.equal(added.shots.find(s=>s.id==='meet').layerOrder.at(-1),'caption');
 assert.equal(added.shots.find(s=>s.id==='meet').entities.filter(e=>e.layer?.binding==='hero').length,2);
 const changed=applyOperations(added,[{type:'setContent',targetId:'caption',content:{...text,text:'Hello'}}]);assert.equal(changed.shots.find(s=>s.id==='meet').entities.find(e=>e.id==='caption').content.text,'Hello');
 assert.throws(()=>applyOperations(added,[{type:'setContent',targetId:'caption',content:{...text,color:'url(https://bad)'}}]));
 const removed=applyOperations(added,[{type:'deleteLayer',targetId:'caption'}]);assert.ok(!removed.shots.find(s=>s.id==='meet').layerOrder.includes('caption'));
 assert.equal(p.shots.find(s=>s.id==='meet').entities.some(e=>e.id==='caption'),false);
});
test('locks protect media content and deletion; imported sources cannot load remote or active content',()=>{
 let p=applyOperations(project(),[{type:'addLayer',shotId:'meet',id:'caption',kind:'text',content:text},{type:'setLayer',targetId:'caption',patch:{locked:true}}]);
 for(const operation of [{type:'deleteLayer',targetId:'caption'},{type:'duplicateLayer',targetId:'caption',id:'copy'},{type:'setContent',targetId:'caption',content:text}])assert.throws(()=>applyOperations(p,[operation]),/locked/);
 for(const src of ['https://evil/image.png','/w/.env','data:image/svg+xml,foo','/w/studio/assets/whiteout/'+ 'f'.repeat(64)+'.svg'])assert.throws(()=>applyOperations(project(),[{type:'addLayer',shotId:'meet',id:'image-test',kind:'image',content:{src,width:100,height:100,offsetSeconds:0,playbackRate:1}}]));
});
test('upgrade is idempotent, exposes scene fades and cues, preserves authored offsets',()=>{
 const p=project();assert.deepEqual(upgradeEditorProject(p),p);
 const meet=p.shots.find(s=>s.id==='meet'),opponent=meet.entities.find(e=>e.id==='opponent:meet');assert.ok(evaluateEntity(opponent,0).opacity<.4);assert.ok(evaluateEntity(opponent,30).opacity>.9);
 assert.equal(p.shots.flatMap(s=>s.entities).filter(e=>e.cue).length,17);assert.ok(meet.entities.some(e=>e.id==='shake:meet'));
});
test('shot retiming scales keys, annotations, visibility and cue offsets while reorder keeps IDs',()=>{
 const p=project(),shot=p.shots.find(s=>s.id==='meet');p.annotations.push({id:'ann',shotId:'meet',frame:30,text:'Keep this',status:'open'});
 const after=applyOperations(p,[{type:'trimShot',shotId:'meet',durationFrames:19},{type:'moveShot',shotId:'meet',index:0}]);const q=after.shots[0];assert.equal(q.id,'meet');assert.equal(q.layerOrder.length,shot.layerOrder.length);assert.equal(after.annotations.at(-1).frame,15);
 assert.ok(q.entities.every(e=>!e.layer||e.layer.endFrame<=19));assert.ok(q.entities.every(e=>!e.cue||e.cue.frame<19));assert.doesNotThrow(()=>validateProject(after));
});
test('duplicating a procedural cue keeps its sound seed despite the new entity identity',()=>{
 const p=applyOperations(project(),[{type:'duplicateAudio',targetId:'cue:5',id:'sound-copy'},{type:'duplicateAudio',targetId:'sound-copy',id:'sound-copy-again'}]);
 const cues=p.shots.flatMap(s=>s.entities).filter(e=>e.id.startsWith('sound-copy'));
 assert.equal(cues[0].cue.seed,(0x53434f52+5*2654435761)>>>0);assert.deepEqual(cues[0].cue,cues[1].cue);
});
test('media uploads are immutable, type checked, bounded and reject active files',()=>{
 const root=mkdtempSync(join(tmpdir(),'studio-assets-'));mkdirSync(join(root,'studio'));try{
  const data=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(20)]).toString('base64');const a=importAsset(root,{id:'test'},{data});assert.equal(a.kind,'image');assert.deepEqual(importAsset(root,{id:'test'},{data}),a);
  assert.throws(()=>importAsset(root,{id:'test'},{data:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')}));assert.throws(()=>importAsset(root,{id:'../bad'},{data}));
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('completion migration preserves generations, receipts, undo/redo and refuses to rebase unrelated runtime history',async()=>{
 const {upgradeEditorState}=await import('../core/editor-migration.mjs'),{digest}=await import('../core/source-edit.mjs');
 const base=project(),edited=applyOperations(base,[{type:'setProperty',targetId:'camera:walk',property:'zoom',value:1.2}]),hash=p=>digest(JSON.stringify(p));
 const source='a'.repeat(64),next='b'.repeat(64),state={schemaVersion:2,generation:9,project:edited,receipts:[],history:{past:[{project:base,at:new Date().toISOString(),actor:{kind:'human',identity:'owner'},label:'Zoom',transactionId:'transaction-1',sourceHash:source,expectedHash:hash(edited)}],future:[]}};
 const result=upgradeEditorState(state,{beforeSourceHash:source,afterSourceHash:next});assert.equal(result.state.generation,9);assert.equal(result.state.history.past[0].sourceHash,next);assert.equal(result.rebased,1);assert.deepEqual(result.state.receipts,state.receipts);
 state.history.past[0].sourceHash='c'.repeat(64);const retained=upgradeEditorState(state,{beforeSourceHash:source,afterSourceHash:next});assert.equal(retained.retained,1);assert.equal(retained.state.history.past[0].sourceHash,'c'.repeat(64));
});

test('media byte ranges support seeking and reject invalid ranges',async t=>{
 const {createServer}=await import('node:http'),{serveFile}=await import('../core/http-file.mjs'),{writeFileSync}=await import('node:fs');
 const root=mkdtempSync(join(tmpdir(),'studio-range-')),file=join(root,'clip.mp4');writeFileSync(file,'0123456789');
 const server=createServer((req,res)=>serveFile(req,res,file,'video/mp4'));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(root,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port;
 for(const [range,status,body] of [['bytes=2-5',206,'2345'],['bytes=-3',206,'789'],['bytes=0-',206,'0123456789'],['bytes=11-',416,''],['bytes=4-2',416,''],['bytes=0-1,4-5',416,'']]){const r=await fetch(url,{headers:{range}});assert.equal(r.status,status);assert.equal(await r.text(),body);}
 const r=await fetch(url);assert.equal(r.headers.get('content-length'),'10');assert.equal(r.headers.get('accept-ranges'),'bytes');assert.equal(r.headers.get('x-content-type-options'),'nosniff');
});
