/* The pilot is exercised through the real page with in-memory project variants;
   tests never write the authored project, its history, or another agent's changes.
   WHITEOUT_BASELINE may name a pre-migration HTML snapshot for exact pixel parity. */
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,extname,dirname} from 'node:path';
import {chromium} from 'playwright';
import {applyOperations} from '../core/project.mjs';
import {migrateWhiteoutProject} from '../core/layer-migration.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const hashFile=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const sourceFiles=['studio/projects/whiteout/whiteout.html','studio/projects/whiteout/project.studio.json','studio/core/project.mjs','studio/core/layers.mjs','studio/core/layer-migration.mjs','studio/test/whiteout-project.mjs'];
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,hashFile(resolve(root,file))]));
let migrationEvidence=null;
const saved=JSON.parse(readFileSync(resolve(root,'studio/projects/whiteout/project.studio.json'),'utf8'));
const original={...saved,schemaVersion:2,project:migrateWhiteoutProject(saved.project)};
let state=structuredClone(original);
const server=http.createServer((req,res)=>{
 try{
  const path=new URL(req.url,'http://test').pathname;
  if(path.endsWith('/project.studio.json')){res.setHeader('content-type','application/json');return res.end(JSON.stringify(state));}
  const file=path==='/baseline.html'?process.env.WHITEOUT_BASELINE:resolve(root,'.'+path);
  if(!file)throw new Error('no baseline');
  res.setHeader('content-type',extname(file)==='.mjs'?'text/javascript':'text/html');res.end(readFileSync(file));
 }catch(error){res.writeHead(404);res.end(String(error.message));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({args:['--disable-accelerated-2d-canvas']});
const context=await browser.newContext();
await context.route('https://**',route=>route.abort());
const pages=[];
async function open(path='/studio/projects/whiteout/whiteout.html'){
 const page=await context.newPage();pages.push(page);
 await page.goto(base+path+'?embed=1');
 await page.waitForFunction(()=>window.__ready||window.__failed);
 assert.equal(await page.evaluate(()=>window.__failed),undefined);
 await page.evaluate(()=>window.__pause());return page;
}
async function picture(page,frame){
 return page.evaluate(async frame=>{
  if(frame!==null){window.__rewind();window.__frameTo(frame);}
  const canvas=document.querySelector('canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))).map(n=>n.toString(16).padStart(2,'0')).join('');
 },frame);
}
async function variant(operations){
 state={...structuredClone(original),project:applyOperations(original.project,operations),generation:7};return open();
}
try{
 const page=await open();
 const total=original.project.shots.reduce((n,s)=>n+s.durationFrames,0);
 assert.equal(await page.evaluate(()=>window.__totalFrames),total);
 assert.equal(await page.evaluate(()=>window.__studioProject.generation),original.generation);
 let start=0;
 for(const shot of original.project.shots){
  assert.equal(await page.evaluate(f=>window.__frameTo(f).shot,start),shot.id);start+=shot.durationFrames;
 }
 if(process.env.WHITEOUT_BASELINE){
  const baselineHash=hashFile(process.env.WHITEOUT_BASELINE),comparisons=[];
  const baseline=await open('/baseline.html');
  const frames=new Set([0,50,100,300,420,450,total-1]);let f=0;
  for(const shot of original.project.shots){if(f)frames.add(f-1);frames.add(f);f+=shot.durationFrames;}
  for(const frame of frames){
   const after=await picture(page,frame),before=await picture(baseline,frame);
   comparisons.push({frame,before,after});assert.equal(after,before,'migration changed frame '+frame);
  }
  migrationEvidence={schemaVersion:1,status:'PASS',baseline:{file:process.env.WHITEOUT_BASELINE,sha256:baselineHash},sources:sourceHashes,
   environment:{browser:browser.version(),node:process.version,platform:process.platform,arch:process.arch,
    canvas:{width:1920,height:1080},viewport:page.viewportSize(),launchArgs:['--disable-accelerated-2d-canvas'],
    fonts:'HTTPS font requests blocked in both pages; identical installed fallback fonts'},
   comparison:{algorithm:'SHA-256 of Canvas RGBA pixels',frameCount:comparisons.length,mismatches:0,frames:comparisons}};
  console.log('PASS baseline migration parity:',frames.size,'frames including every shot boundary');
 }
 const original100=await picture(page,100);
 const pausedImpact=await picture(page,231);await page.waitForTimeout(120);
 assert.equal(await picture(page,null),pausedImpact,'preview-only shake changed a paused frame');
 const camera=await variant([{type:'setProperty',targetId:'camera:walk',property:'x',value:160},
  {type:'setKeyframe',targetId:'camera:walk',property:'zoom',frame:0,value:1},
  {type:'setKeyframe',targetId:'camera:walk',property:'zoom',frame:46,value:1.5}]);
 assert.notEqual(await picture(camera,100),original100,'camera/keyframe did not affect pixels');
 assert.equal(await camera.evaluate(()=>window.__studioProject.generation),7);
 const hero=await variant([{type:'setProperty',targetId:'hero:walk',property:'opacity',value:0}]);
 assert.notEqual(await picture(hero,100),original100,'Hero opacity did not affect pixels');
 const boot=await variant([{type:'setProperty',targetId:'hero:boot',property:'x',value:300}]);
 assert.notEqual(await picture(boot,140),await picture(page,140),'boot close-up ignored Hero transform');
 const trimmed=await variant([{type:'trimShot',shotId:'far',durationFrames:80}]);
 assert.equal(await trimmed.evaluate(()=>window.__totalFrames),total+7);
 assert.equal(await trimmed.evaluate(()=>window.__frameTo(79).shot),'far');
 assert.equal(await trimmed.evaluate(()=>window.__frameTo(80).shot),'walk');
 const moved=await variant([{type:'moveShot',shotId:'walk',index:0}]);
 assert.equal(await moved.evaluate(()=>window.__frameTo(0).shot),'walk');
 assert.equal(await moved.evaluate(()=>window.__frameTo(47).shot),'far');
 const sound=async p=>p.evaluate(async()=>{
  const before=JSON.stringify(window.__probe());
  const a=await window.__renderAudio(2,24000),b=await window.__renderAudio(2,24000);
  let peak=0,different=0,maxDifference=0;
  for(let c=0;c<a.channels.length;c++)for(let i=0;i<a.channels[c].length;i++){
   peak=Math.max(peak,Math.abs(a.channels[c][i]));if(a.channels[c][i]!==b.channels[c][i])different++;
   maxDifference=Math.max(maxDifference,Math.abs(a.channels[c][i]-b.channels[c][i]));
  }
  return {peak,different,maxDifference,unchanged:before===JSON.stringify(window.__probe())};
 });
 /* Independent WebAudio render threads can differ below one 24-bit PCM step. */
 const audible=await sound(page);assert.ok(audible.peak>0.001);assert.ok(audible.maxDifference<=1e-7);assert.ok(audible.unchanged);
 const quiet=await variant([{type:'setProperty',targetId:'audio:far',property:'gain',value:0.5}]);
 const quieter=await sound(quiet);assert.ok(Math.abs(quieter.peak-audible.peak*0.5)<1e-7,'mix gain is not applied to rendered audio');
 const muted=await variant([{type:'setProperty',targetId:'audio:far',property:'muted',value:true}]);
 const silence=await sound(muted);assert.equal(silence.peak,0);assert.equal(silence.different,0);
 assert.equal(await picture(page,100),original100,'rendering audio changed subsequent visual simulation');
 await page.click('#snd');
 await page.waitForFunction(()=>window.__audioState().playing||window.__audioState().error);
 assert.equal(await page.evaluate(()=>window.__audioState().error),null);
 await page.evaluate(()=>window.__pause());assert.equal(await page.evaluate(()=>window.__audioState().playing),false);
 await page.evaluate(()=>window.__play(100));await page.waitForFunction(()=>window.__audioState().playing);
 const offset=await page.evaluate(()=>window.__audioState().offsetFrame);assert.ok(offset>=100&&offset<=104,'audio resumed at the wrong frame');
 await page.evaluate(()=>window.__frameTo(50));assert.equal(await page.evaluate(()=>window.__audioState().playing),false);
 if(migrationEvidence){
  for(const [file,hash] of Object.entries(sourceHashes))assert.equal(hashFile(resolve(root,file)),hash,'source changed while migration evidence was measured: '+file);
  assert.equal(hashFile(process.env.WHITEOUT_BASELINE),migrationEvidence.baseline.sha256,'baseline changed while it was measured');
  const evidence=resolve(root,'build/migration/whiteout.json');mkdirSync(dirname(evidence),{recursive:true});
  writeFileSync(evidence,JSON.stringify({...migrationEvidence,checkedAt:new Date().toISOString()},null,2)+'\n');
  console.log('Migration evidence:',evidence);
 }
 console.log('PASS project boundaries, camera/keyframes, Hero/boot transforms, trim/reorder, generation, repeatable audio (1e-7), gain/mute, pause/resume and simulation isolation');
}finally{
 await browser.close();await new Promise(r=>{server.close(r);server.closeAllConnections();});
}
