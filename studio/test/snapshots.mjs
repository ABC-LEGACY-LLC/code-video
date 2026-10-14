import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createProjectStore} from '../core/store.mjs';
import {createLibrary} from '../core/project-library.mjs';
import {createSnapshots} from '../core/snapshots.mjs';
import {importAsset} from '../core/assets.mjs';
import {RUNTIME} from '../core/source-package.mjs';
import {sampleFrames} from '../audit.mjs';
import {audioTiming,readMP4} from '../export-verify.mjs';
const ROOT=new URL('../../',import.meta.url).pathname;
function fixture(t){const root=mkdtempSync(join(tmpdir(),'snapshot-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));mkdirSync(join(root,'studio/projects'),{recursive:true});for(const p of [...RUNTIME,'core/layer-migration.mjs','core/editor-upgrade.mjs','audit.mjs','export-verify.mjs','export-engine.mjs']){mkdirSync(join(root,'studio',p,'..'),{recursive:true});cpSync(join(ROOT,'studio',p),join(root,'studio',p));}const store=createProjectStore(root),library=createLibrary(root,store),{work}=library.create({requestId:crypto.randomUUID(),actor:'human',name:'Frozen source',format:'16:9',fps:24,durationSeconds:3,template:'title-sequence'});return{root,store,work,snapshots:createSnapshots(root,store)};}
test('snapshot preserves exact bytes; history alone keeps identity; source and authored edits invalidate',t=>{
 const {root,store,work,snapshots}=fixture(t),h=store.get(work),one=snapshots.capture(work,h.revision);assert.equal(snapshots.capture(work,h.revision).id,one.id);
 const file=snapshots.file(one.id,work.dir+'/'+work.project).file,doc=JSON.parse(readFileSync(file));assert.equal(doc.generation,0);assert.deepEqual(doc.history,{past:[],future:[]});assert.deepEqual(doc.project,h.project);
 let next=store.transact(work,{baseRevision:h.revision,requestId:crypto.randomUUID(),actor:'human',operations:[{type:'renameShot',shotId:h.project.shots[0].id,name:'Changed'}]});assert.equal(snapshots.freshness(work,one.id).current,false);assert.deepEqual(JSON.parse(readFileSync(file)).project,h.project);assert.throws(()=>snapshots.capture(work,h.revision),/changed/i);
 next=store.transact(work,{baseRevision:next.revision,requestId:crypto.randomUUID(),actor:'human',action:'undo'});assert.notEqual(next.revision,h.revision);assert.equal(snapshots.capture(work,next.revision).id,one.id);
 const source=join(root,work.page),bytes=readFileSync(source);writeFileSync(source,Buffer.concat([bytes,Buffer.from('\n<!-- changed -->')]));assert.equal(snapshots.freshness(work,one.id).current,false);assert.ok(readFileSync(snapshots.file(one.id,work.page).file).equals(bytes));
 writeFileSync(snapshots.file(one.id,work.page).file,'tampered');assert.throws(()=>snapshots.file(one.id,work.page),/changed/);
});
test('snapshot rejects escaping paths, symlinks and remote dependencies; missing files do not reuse live source',t=>{
 const {root,store,work,snapshots}=fixture(t),one=snapshots.capture(work,store.get(work).revision);for(const path of ['../../.env','studio/server.mjs',work.dir+'/work.json'])assert.throws(()=>snapshots.file(one.id,path),/not in/);assert.throws(()=>snapshots.get('../x'),/Invalid/);
 const page=join(root,work.page),bytes=readFileSync(page);writeFileSync(page,'<script src="https://example.com/changed.js"></script>');assert.throws(()=>snapshots.capture(work),/Pin external/);writeFileSync(page,bytes);symlinkSync(page,join(root,work.dir,'alias.mjs'));assert.throws(()=>snapshots.capture(work),/symlink/);
});
test('frame coverage includes cuts and layer boundaries and is explicitly capped',t=>{const {store,work}=fixture(t),p=store.get(work).project;p.shots[0].entities.find(e=>e.layer).layer.startFrame=2;const coverage=sampleFrames(p);assert.ok(coverage.frames.includes(2));assert.ok(coverage.frames.includes(p.shots[0].durationFrames));assert.equal(sampleFrames(p,5).frames.length,5);});
test('audio timing catches a shifted cue and marks unmeasurable material for review',()=>{
 const sr=1000,a=new Float32Array(3000),b=new Float32Array(3000);for(let i=750;i<1000;i++)a[i]=.5;for(let i=850;i<1100;i++)b[i]=.5;assert.equal(audioTiming({sr,channels:[a]},{sr,channels:[a]},24).status,'PASS');const bad=audioTiming({sr,channels:[a]},{sr,channels:[b]},24);assert.equal(bad.status,'FAIL');assert.ok(Math.abs(bad.offsetSeconds-.1)<.011);assert.equal(audioTiming({sr,channels:[a.fill(.5)]},{sr,channels:[b.fill(.5)]},24).status,'REVIEW');assert.throws(()=>readMP4(new ArrayBuffer(12)),/Invalid/);
});

test('snapshot pins imported asset bytes and refuses changed live assets',t=>{
 const {root,store,work,snapshots}=fixture(t),h=store.get(work),bytes=Buffer.from('89504e470d0a1a0a0000000049484452','hex'),asset=importAsset(root,work,{data:bytes.toString('base64')});
 const next=store.transact(work,{baseRevision:h.revision,requestId:crypto.randomUUID(),actor:'human',operations:[{type:'addLayer',shotId:h.project.shots[0].id,id:'image',kind:'image',content:{src:asset.src,width:100,height:100,offsetSeconds:0,playbackRate:1}}]}),snapshot=snapshots.capture(work,next.revision);
 writeFileSync(join(root,asset.src.slice(3)),'changed source');assert.equal(snapshots.freshness(work,snapshot.id).current,false);assert.ok(readFileSync(snapshots.file(snapshot.id,asset.src.slice(3)).file).equals(bytes));assert.throws(()=>snapshots.capture(work),/changed/);
});
