import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,statSync,utimesSync,mkdirSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sampleCard,sourceFingerprint,measurementStatus,metricValue,claimPass,breakClaim} from '../tools/sample.mjs';
import {metrics} from '../tools/measure.mjs';
import {startPreview} from '../tools/preview.mjs';
import {count} from '../tools/count.mjs';
import {confirm} from '../tools/card.mjs';

test('changed runtime pixels fail a claim even when the committed numbers still pass',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'catalog-freshness-'));
 try{
  writeFileSync(join(dir,'scene.html'),`<canvas width="64" height="64"></canvas>
   <script src="scene.js"></script><script>
   window.__ready=true; window.__frameTo=async()=>{
    await new Promise(r=>setTimeout(r,5));
    const c=document.querySelector('canvas'),g=c.getContext('2d');
    g.fillStyle=window.color;g.fillRect(0,0,c.width,c.height);
   };</script>`);
  const script=join(dir,'scene.js');writeFileSync(script,"window.color='white';");
  const k={name:'test film',_f:join(dir,'card.json'),sources:['scene.html'],
   frame:{file:'scene.html',hook:'__frameTo',frames:[0]},measure:{value:[255,255]}};
  const good=await sampleCard(k,{root:dir});
  assert.equal(claimPass(metricValue(good.measure,'value.low'),'>',150),true);
  assert.ok(good.evidence.inputs.some(i=>i.file==='scene.js'),'loaded dependency is fingerprinted');
  assert.equal(good.evidence.samplingMode,'hook');
  assert.equal(good.evidence.pixelHash.length,64);
  k.measureEvidence=good.evidence;
  assert.equal(measurementStatus(k).status,'recorded');
  const time=statSync(script);
  writeFileSync(script,"window.color='black';");utimesSync(script,time.atime,time.mtime);
  assert.equal(measurementStatus(k).status,'stale','content changes with unchanged mtime are stale');
  const bad=await sampleCard(k,{root:dir});
  assert.equal(claimPass(metricValue(k.measure,'value.low'),'>',150),true,'old snapshot still passes');
  assert.equal(claimPass(metricValue(bad.measure,'value.low'),'>',150),false,'actual black render fails');
  assert.notEqual(good.evidence.sourceHash,bad.evidence.sourceHash);
  assert.notEqual(good.evidence.pixelHash,bad.evidence.pixelHash);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('preview serves same-origin modules and JSON but rejects hidden, dependency and escaping paths',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'catalog-preview-'));
 const outside=dir+'.json';
 let preview;
 try{
  writeFileSync(join(dir,'scene.html'),'<canvas></canvas>');
  writeFileSync(join(dir,'project.studio.json'),'{"ok":true}');
  writeFileSync(join(dir,'scene.mjs'),'export const ok=true;');
  writeFileSync(join(dir,'.env'),'SECRET=yes');
  writeFileSync(join(dir,'.secrets.json'),'{"secret":true}');
  writeFileSync(join(dir,'credentials.json'),'{"secret":true}');
  mkdirSync(join(dir,'node_modules'));writeFileSync(join(dir,'node_modules','secret.json'),'{}');
  writeFileSync(outside,'{"outside":true}');symlinkSync(outside,join(dir,'escape.json'));
  preview=await startPreview(join(dir,'scene.html'),{root:dir});
  const json=await fetch(preview.origin+'/project.studio.json');
  assert.equal(json.status,200);assert.deepEqual(await json.json(),{ok:true});
  assert.match((await fetch(preview.origin+'/scene.mjs')).headers.get('content-type'),/javascript/);
  assert.equal(preview.fileForURL(preview.origin+'/project.studio.json'),join(dir,'project.studio.json'));
  for(const path of ['/.env','/%2eenv','/.secrets.json','/credentials.json','/node_modules/secret.json','/escape.json','/../etc/passwd','/%2fetc/passwd'])
   assert.equal((await fetch(preview.origin+path)).status,404,path);
  assert.equal((await fetch(preview.url,{method:'POST'})).status,405);
  assert.equal(preview.fileForURL('https://example.com/project.studio.json'),null);
 }finally{if(preview)await preview.close();rmSync(dir,{recursive:true,force:true});rmSync(outside,{force:true});}
});

test('changing the sampling contract invalidates stored provenance; old cards stay unverified',()=>{
 const dir=mkdtempSync(join(tmpdir(),'catalog-inputs-'));
 try{
  writeFileSync(join(dir,'scene.html'),'<canvas></canvas>');
  const k={_f:join(dir,'card.json'),sources:['scene.html'],frame:{file:'scene.html',frames:[1]}};
  assert.equal(measurementStatus(k).status,'unverified');
  k.measureEvidence={schema:2,...sourceFingerprint(k),measuredAt:'2026-01-01T00:00:00Z'};
  assert.equal(measurementStatus(k).status,'recorded');
  k.frame.frames=[2];
  assert.equal(measurementStatus(k).status,'stale');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('known-bad pixel mutations fail each supported visual promise',()=>{
 const f={w:16,h:16,data:new Uint8ClampedArray(16*16*4).fill(255)};
 const claims=[['hardEdgeShare','>',20],['value.range','>',180],['value.low','>',150],
  ['saturation','>',45],['saturation','<',6],['ink','>',8],['ink','<',5]];
 for(const [key,op,limit] of claims){
  const value=metricValue(metrics(breakClaim([f],key,op)),key);
  assert.ok(Number.isFinite(value),key+' has a real numeric control');
  assert.equal(claimPass(value,op,limit),false,key+' '+op+' '+limit);
 }
 assert.equal(claimPass(NaN,'>',0),false);
 assert.throws(()=>breakClaim([f],'unknown','>'),/no pixel calibration/);
});

test('production preview exposes one work and shared renderer code, not workspace state',async()=>{
 const file=fileURLToPath(new URL('../../studio/projects/whiteout/whiteout.html',import.meta.url));
 const preview=await startPreview(file);
 try{
  assert.match(preview.origin,/^http:\/\/127\.0\.0\.1:/);
  assert.equal((await fetch(preview.url)).status,200);
  assert.equal((await fetch(preview.origin+'/studio/core/project.mjs')).status,200);
  for(const path of ['/studio/auth.mjs','/catalog/cards/2-whiteout.json','/studio/projects/mushuk/mushuk.html'])
   assert.equal((await fetch(preview.origin+path)).status,404,path);
 }finally{await preview.close();}
});

test('authored JSON shot counts are bound to current data and notice a missing shot',()=>{
 const dir=mkdtempSync(join(tmpdir(),'catalog-count-'));
 try{
  const file=join(dir,'project.studio.json');
  const doc={schemaVersion:1,project:{fps:{num:24,den:1},shots:[{durationFrames:3},{durationFrames:5}]}};
  writeFileSync(file,JSON.stringify(doc));
  const value=count([file]);
  assert.equal(value.tables.SHOTS,2);assert.equal(value.totalFrames,8);assert.equal(value.shortestShotFrames,3);
  assert.equal(confirm('2 authored shots',value.tables.SHOTS).ok,true);
  doc.schemaVersion=2;
  doc.project.shots[0].entities=[{layer:{binding:'background'}},{layer:{binding:'hero'}},{layer:{binding:'group'}}];
  doc.project.shots[1].entities=[{layer:{binding:'hero'}}];
  writeFileSync(file,JSON.stringify(doc));
  const layered=count([file]);
  assert.equal(layered.totalFrames,8);
  assert.equal(layered.visualLayers,3);
  assert.deepEqual(layered.layerBindings,['background','hero']);
  doc.project.shots.pop();writeFileSync(file,JSON.stringify(doc));
  assert.equal(confirm('2 authored shots',count([file]).tables.SHOTS).ok,false);
  doc.schemaVersion=3;writeFileSync(file,JSON.stringify(doc));
  assert.throws(()=>count([file]),/invalid authored Studio shot timing/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
