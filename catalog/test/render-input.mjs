import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sourceFingerprint,measurementStatus} from '../tools/fingerprint.mjs';
import {sampleCard,claimPass,metricValue} from '../tools/sample.mjs';
import {count} from '../tools/count.mjs';

const original=JSON.parse(readFileSync(new URL('../../studio/projects/whiteout/project.studio.json',import.meta.url)));
function fixture(t){
 const dir=mkdtempSync(join(tmpdir(),'render-input-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const file=join(dir,'project.studio.json');writeFileSync(join(dir,'scene.html'),'<canvas></canvas>');
 const save=state=>writeFileSync(file,JSON.stringify(state,null,2)+'\n');save(original);
 const card={name:'fixture',_f:join(dir,'card.json'),sources:['scene.html','project.studio.json'],frame:{file:'scene.html',project:'project.studio.json',frames:[0],hook:'__frameTo'}};
 return {dir,file,save,card};
}
const evidence=card=>({schema:2,measuredAt:'2026-10-13T00:00:00Z',...sourceFingerprint(card)});

test('history, generation, receipts, migration logs and JSON formatting do not change render identity or authored counts',t=>{
 const {file,save,card}=fixture(t),before=sourceFingerprint(card),counts=count([file],{project:file});card.measureEvidence=evidence(card);
 const edited=structuredClone(original);edited.generation++;edited.history.past.push(structuredClone(edited.history.past[0]));
 edited.receipts=[];edited.migrations=[{at:'later',note:'migration bookkeeping'}];save(edited);
 const after=sourceFingerprint(card);
 assert.equal(before.sourceHash,after.sourceHash);
 assert.notEqual(before.inputs.find(i=>i.file==='project.studio.json').sha256,after.inputs.find(i=>i.file==='project.studio.json').sha256,'byte provenance remains available');
 assert.deepEqual(count([file],{project:file}),counts);
 assert.equal(measurementStatus(card).status,'recorded');
 writeFileSync(file,JSON.stringify(Object.fromEntries(Object.entries(edited).reverse())));
 assert.equal(sourceFingerprint(card).sourceHash,before.sourceHash);
 assert.deepEqual(count([file],{project:file}),counts);
});

test('render changes become stale and undoing to the same authored state restores identity',t=>{
 const {save,card}=fixture(t);card.measureEvidence=evidence(card);
 const edits={
  visibility:p=>{p.project.shots[0].entities.find(e=>e.layer).layer.visible=false;},
  camera:p=>{p.project.shots[0].entities.find(e=>e.type==='camera2d').properties.x+=10;},
  animation:p=>{p.project.shots[0].entities.find(e=>e.type==='camera2d').keyframes.x=[{frame:0,value:12,easing:'linear'}];},
  timing:p=>{p.project.shots[0].durationFrames+=10;},
  order:p=>p.project.shots.reverse(),
  resolution:p=>{p.project.width=1280;},
  fps:p=>{p.project.fps.num=30;},
  audio:p=>{p.project.shots[0].entities.find(e=>e.type==='audioCue').properties.gain=.3;},
  futureProperty:p=>{p.project.renderSetting='must be retained';},
  schema:p=>{p.schemaVersion=1;}
 };
 for(const [name,edit] of Object.entries(edits)){
  const p=structuredClone(original);edit(p);save(p);assert.equal(measurementStatus(card).status,'stale',name);
 }
 const restored=structuredClone(original);restored.generation+=100;save(restored);
 assert.equal(measurementStatus(card).status,'recorded');
});

test('projection is explicit; runtime, media, fonts and undeclared JSON remain byte-sensitive',t=>{
 const {dir,file,save,card}=fixture(t);delete card.frame.project;const initial=sourceFingerprint(card);
 const edited=structuredClone(original);edited.generation++;save(edited);
 assert.notEqual(sourceFingerprint(card).sourceHash,initial.sourceHash,'a file name alone never opts in');
 card.frame.project='project.studio.json';
 for(const name of ['scene.js','image.png','font.woff2','other.json'])writeFileSync(join(dir,name),'first');
 const extra=['scene.js','image.png','font.woff2','other.json'];card.measureEvidence={schema:2,...sourceFingerprint(card,extra)};
 for(const name of extra){writeFileSync(join(dir,name),'changed');assert.equal(measurementStatus(card).status,'stale',name);writeFileSync(join(dir,name),'first');}
 assert.equal(measurementStatus(card).status,'recorded');
 writeFileSync(join(dir,'scene.html'),'<canvas id="changed"></canvas>');assert.equal(measurementStatus(card).status,'stale');
 assert.ok(count([file]).lines>count([file],{project:file}).lines,'raw counting remains available for undeclared sources');
});

test('invalid projects, unknown envelope fields and old evidence cannot silently become current',t=>{
 const {file,save,card}=fixture(t);card.measureEvidence=evidence(card);
 for(const change of [p=>{p.schemaVersion=99;},p=>{p.rendererSettings={background:'black'};},p=>{p.project.fps.num=0;}]){
  const p=structuredClone(original);change(p);save(p);assert.throws(()=>sourceFingerprint(card));assert.equal(measurementStatus(card).status,'stale');
 }
 writeFileSync(file,'{');assert.throws(()=>sourceFingerprint(card));save(original);
 card.measureEvidence={...evidence(card),schema:1};assert.equal(measurementStatus(card).status,'stale');
 card.measureEvidence=evidence(card);delete card.measureEvidence.inputs[0].renderHash;assert.equal(measurementStatus(card).status,'unverified');
 card.frame.project=42;assert.throws(()=>sourceFingerprint(card),/frame.project/);
});

test('rendered pixels stay the same after metadata edits and a real authored change fails the visual claim',async t=>{
 const {dir,save,card}=fixture(t);
 const state={schemaVersion:2,project:{id:'test',name:'Test',fps:{num:24,den:1},width:64,height:64,
  annotations:[],shots:[{id:'shot',name:'Shot',durationFrames:2,layerOrder:['background'],entities:[{id:'background',name:'Background',type:'layer2d',
   properties:{x:0,y:0,scale:1,rotation:0,opacity:1},keyframes:{},layer:{binding:'background',parentId:null,space:'world',visible:true,locked:false,startFrame:0,endFrame:2}}]}]},
  generation:1,history:{past:[],future:[]},receipts:[]};save(state);
 writeFileSync(join(dir,'scene.html'),`<canvas width="64" height="64"></canvas><script type="module">
  const state=await (await fetch('./project.studio.json')).json();
  window.__frameTo=()=>{const g=document.querySelector('canvas').getContext('2d');
   g.fillStyle=state.project.shots[0].entities[0].properties.opacity===1?'white':'black';g.fillRect(0,0,64,64);};window.__ready=true;
 </script>`);
 const first=await sampleCard(card,{root:dir});card.measureEvidence=first.evidence;
 assert.equal(first.evidence.schema,2);assert.ok(claimPass(metricValue(first.measure,'value.low'),'>',150));
 state.generation++;state.history.past.push({note:'bookkeeping only'});save(state);
 const repeated=await sampleCard(card,{root:dir});
 assert.equal(repeated.evidence.sourceHash,first.evidence.sourceHash);assert.equal(repeated.evidence.pixelHash,first.evidence.pixelHash);
 assert.equal(measurementStatus(card).status,'recorded');
 state.project.shots[0].entities[0].properties.opacity=0;save(state);
 assert.equal(measurementStatus(card).status,'stale');
 const changed=await sampleCard(card,{root:dir});assert.notEqual(changed.evidence.pixelHash,first.evidence.pixelHash);
 assert.equal(claimPass(metricValue(changed.measure,'value.low'),'>',150),false);
});
