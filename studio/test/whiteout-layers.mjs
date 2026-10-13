/* Real renderer checks. Both pages receive in-memory documents; no authored JSON,
   history or live Studio state is written. The baseline is the preserved schema1
   renderer/project/module captured before the layer migration. */
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {validateProject,applyOperations} from '../core/project.mjs';
import {migrateWhiteoutProject} from '../core/layer-migration.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const baselineDir=resolve(root,process.env.WHITEOUT_LAYER_BASELINE||'build/layer-baseline');
const hasBaseline=['project.studio.json','project.mjs','whiteout.html'].every(file=>existsSync(resolve(baselineDir,file)));
if(process.env.WHITEOUT_LAYER_BASELINE)assert.ok(hasBaseline,'explicit baseline is incomplete');
const original=JSON.parse(readFileSync(resolve(hasBaseline?baselineDir:resolve(root,'studio/projects/whiteout'),'project.studio.json'),'utf8'));
const oldCore=hasBaseline?await import(pathToFileURL(resolve(baselineDir,'project.mjs')).href):null;
const comparisons=[];
let legacy=structuredClone(original),state={...structuredClone(original),schemaVersion:2,project:migrateWhiteoutProject(original.project)};
const server=http.createServer((req,res)=>{
 try{
  const path=new URL(req.url,'http://fixture').pathname;
  if(path==='/baseline/project.studio.json'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(legacy));}
  if(path.endsWith('/project.studio.json')){res.setHeader('content-type','application/json');return res.end(JSON.stringify(state));}
  const file=path==='/baseline/whiteout.html'?resolve(baselineDir,'whiteout.html')
   :path==='/core/project.mjs'?resolve(baselineDir,'project.mjs'):resolve(root,'.'+path);
  res.setHeader('content-type',extname(file)==='.mjs'?'text/javascript':'text/html');res.end(readFileSync(file));
 }catch(error){res.writeHead(404);res.end(String(error.message));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({args:['--disable-accelerated-2d-canvas']});
const context=await browser.newContext();await context.route('https://**',route=>route.abort());
const pages=[];
async function open(path='/studio/projects/whiteout/whiteout.html'){
 const page=await context.newPage();pages.push(page);await page.goto(base+path+'?embed=1');
 await page.waitForFunction(()=>window.__ready||window.__failed);
 assert.equal(await page.evaluate(()=>window.__failed),undefined);
 await page.evaluate(()=>window.__pause());return page;
}
async function picture(page,frame,{rewind=true,soloId=null}={}){
 return page.evaluate(async({frame,rewind,soloId})=>{
  if(window.__setLayerPreview)window.__setLayerPreview({soloId,selectedId:null});
  if(frame!==null){if(rewind)window.__rewind();window.__frameTo(frame);}
  const c=document.querySelector('#cv'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',p))).map(n=>n.toString(16).padStart(2,'0')).join('');
 },{frame,rewind,soloId});
}
async function variant(change){
 const project=migrateWhiteoutProject(original.project);change(project);validateProject(project,{requireLayers:true});
 state={...structuredClone(original),schemaVersion:2,project};return open();
}
const shot=(p,id)=>p.shots.find(s=>s.id===id),entity=(p,id)=>p.shots.flatMap(s=>s.entities).find(e=>e.id===id);
const starts=new Map();let total=0;for(const s of original.project.shots){starts.set(s.id,total);total+=s.durationFrames;}
try{
 const page=await open();
 if(hasBaseline){
 const baseline=await open('/baseline/whiteout.html');
 const frames=new Set([0,50,100,140,300,420,450,total-1,total]);
 for(const s of original.project.shots){
  const start=starts.get(s.id);if(start)frames.add(start-1);frames.add(start);frames.add(start+Math.floor(s.durationFrames/2));
  for(const e of s.entities)for(const keys of Object.values(e.keyframes))for(const key of keys)frames.add(start+key.frame);
 }
 for(const f of [...frames].sort((a,b)=>a-b)){
  const after=await picture(page,f),before=await picture(baseline,f);comparisons.push({frame:f,before,after});
  assert.equal(after,before,'default legacy parity at frame '+f);
  assert.deepEqual(await page.evaluate(()=>__probe()),await baseline.evaluate(()=>__probe()),'simulation parity at '+f);
 }
 console.log('PASS default legacy parity:',frames.size,'frames, every boundary and authored keyframe');
 const variants=[
  ['walk',{x:93,y:-41,scale:1.23,opacity:.47}],
  ['boot',{x:-147,y:62,scale:.83,opacity:.56}],
  ['drop',{x:-83,y:27,scale:1.17,opacity:.42}],
  ['far',{x:110,y:-55,scale:1.5,opacity:.3}]
 ];
 for(const [id,values] of variants){
  legacy={...structuredClone(original),project:oldCore.applyOperations(original.project,Object.entries(values).map(([property,value])=>({type:'setProperty',targetId:'hero:'+id,property,value})))};
  const before=await open('/baseline/whiteout.html');
  const after=await variant(p=>{const e=entity(p,'hero:'+id);Object.assign(e.properties,values);});
  const f=starts.get(id)+Math.floor(shot(original.project,id).durationFrames/2);
  assert.equal(await picture(after,f),await picture(before,f),'legacy Hero pivot/opacity: '+id);
  await before.close();await after.close();
 }
 console.log('PASS non-default Hero x/y/scale/opacity parity: far, walk, boot, drop');
 await baseline.close();
 }else console.log('SKIP optional legacy parity: set WHITEOUT_LAYER_BASELINE to preserved pre-migration sources');
 await picture(page,total);assert.equal(await page.evaluate(()=>__frame().frame),total,'end sentinel cannot render');
 await page.evaluate(()=>{__setLayerPreview({soloId:'hero:alone'});__pickLayer(.4,.5);});
 await picture(page,100);
 const render=async(change,frame,options)=>{const p=await variant(change);try{return await picture(p,frame,options);}finally{await p.close();}};
 const set=(id,patch)=>p=>Object.assign(entity(p,id).layer,patch);
 const props=(id,patch)=>p=>{const e=entity(p,id);Object.assign(e.properties,patch);for(const key of Object.keys(patch))delete e.keyframes[key];};
 const defaults=new Map();
 const basePicture=async f=>{if(!defaults.has(f))defaults.set(f,await picture(page,f));return defaults.get(f);};
 // Every real drawing pass can disappear independently; opacity zero must agree.
 for(const [binding,id,frame] of [['background','walk',100],['ground','walk',100],['hero','walk',100],['opponent','meet',185],['haze','walk',100],['snow','walk',100],['speed','charge',224],['impact','impactA',232],['drop','drop',300],['title','alone',458]]){
  const target=binding+':'+id,hidden=await render(set(target,{visible:false}),frame);
  assert.notEqual(hidden,await basePicture(frame),'hidden '+target+' left pixels unchanged');
  assert.equal(await render(props(target,{opacity:0}),frame),hidden,'zero opacity '+target);
 }
 console.log('PASS all 10 drawing bindings: independent visibility and zero opacity');
 const hiddenHero=await render(set('hero:walk',{visible:false}),100);
 assert.equal(await render(p=>{const s=shot(p,'walk');s.layerOrder=s.layerOrder.filter(id=>id!=='hero:walk');s.layerOrder.unshift('hero:walk');},100),hiddenHero,'background did not occlude reordered Hero');
 for(const id of ['hero:walk','snow:walk'])assert.notEqual(await render(props(id,{rotation:23}),100),await basePicture(100),'rotation '+id);
 const animated=await variant(p=>{entity(p,'hero:walk').keyframes.x=[{frame:0,value:0,easing:'linear'},{frame:46,value:200,easing:'linear'}];});
 assert.equal(await picture(animated,96),await render(props('hero:walk',{x:100}),96),'interpolated layer transform');await animated.close();
 const group=p=>Object.assign(p,applyOperations(p,[{type:'groupLayers',shotId:'walk',targetIds:['ground:walk','hero:walk'],groupId:'actors:walk',name:'Actors'}]));
 assert.equal(await render(group,100),await basePicture(100),'group changed the composition');
 assert.equal(await render(p=>{group(p);entity(p,'actors:walk').layer.visible=false;},100),await render(p=>{entity(p,'ground:walk').layer.visible=false;entity(p,'hero:walk').layer.visible=false;},100),'group visibility did not propagate');
 const timed=await variant(set('hero:walk',{startFrame:20,endFrame:30})),hidden=await variant(set('hero:walk',{visible:false}));
 for(const local of [19,20,29,30])assert.equal(await picture(timed,73+local),local>=20&&local<30?await basePicture(73+local):await picture(hidden,73+local),'exclusive layer range at '+local);
 await timed.close();await hidden.close();
 console.log('PASS painter order, actor/effect rotation, keyframes, groups and exclusive in/out');
 const solo={soloId:'hero:walk'};
 const screen=await render(p=>{entity(p,'hero:walk').layer.space='screen';},100,solo);
 const screenMoved=await render(p=>{entity(p,'hero:walk').layer.space='screen';entity(p,'camera:walk').properties.x=180;},100,solo);
 assert.equal(screenMoved,screen,'screen layer followed camera');
 assert.notEqual(await render(props('camera:walk',{x:180}),100,solo),screen,'world layer ignored camera');
 const soloPage=await variant(()=>{});await picture(soloPage,100,solo);
 const probe=await soloPage.evaluate(()=>__probe());
 for(let n=0;n<3;n++)await soloPage.evaluate(()=>{__pickLayer(.47,.62);__setLayerPreview({selectedId:'hero:walk'});});
 assert.deepEqual(await soloPage.evaluate(()=>__probe()),probe,'picking/selection changed simulation');
 assert.equal(await picture(soloPage,300,solo),await basePicture(300),'Solo from another shot blanked the frame');
 const normalProbe=await page.evaluate(()=>{__frameTo(100);return __probe();});
 await picture(soloPage,100,solo);assert.deepEqual(await soloPage.evaluate(()=>__probe()),normalProbe,'Solo changed physics');
 assert.equal(await picture(soloPage,300),await basePicture(300),'Solo/picking changed later frames');
 await soloPage.close();
 const picker=await variant(()=>{});await picture(picker,100);
 assert.equal(await picker.evaluate(()=>__pickLayer(.47,.62)),'hero:walk','actual Hero pixel was not selected');
 assert.notEqual(await picker.evaluate(()=>__pickLayer(.47,.62,{allLayers:true})),'hero:walk','Alt-pick did not use strict atmospheric stack');
 assert.equal(await picker.evaluate(()=>__pickLayer(-1,.5)),null);await picker.close();
 const locked=await variant(set('hero:walk',{locked:true}));await picture(locked,100);
 assert.notEqual(await locked.evaluate(()=>__pickLayer(.47,.62)),'hero:walk','locked layer selected');await locked.close();
 const matte=await variant(p=>{for(const e of shot(p,'walk').entities)if(e.layer)e.layer.visible=false;});await picture(matte,100);
 assert.equal(await matte.evaluate(()=>{const c=document.querySelector('#cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4)if(d[i]!==223||d[i+1]!==227||d[i+2]!==228||d[i+3]!==255)return false;return true;}),true,'hidden scene must keep an opaque export matte');await matte.close();
 const tracks=await page.evaluate(()=>__tracks());
 assert.equal(tracks.filter(t=>t.id.startsWith('layer:')).length,10);
 assert.equal(tracks.flatMap(t=>t.id.startsWith('layer:')?t.items:[]).length,68);
 assert.ok(tracks.find(t=>t.id==='layer:hero').items.some(c=>c.targetId==='hero:walk'&&c.f===73&&c.n===47));
 console.log('PASS world/screen, real pixel picking, locks, cross-shot Solo, physics isolation, opaque matte and 68 timeline clips');
 if(hasBaseline){
  const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
  const output=resolve(root,'build/migration');mkdirSync(output,{recursive:true});
  writeFileSync(resolve(output,'whiteout-layers.json'),JSON.stringify({status:'PASS',checkedAt:new Date().toISOString(),browser:browser.version(),node:process.version,
   baseline:Object.fromEntries(['whiteout.html','project.mjs','project.studio.json'].map(f=>[f,hash(resolve(baselineDir,f))])),
   sources:Object.fromEntries(['studio/projects/whiteout/whiteout.html','studio/core/project.mjs','studio/core/layers.mjs','studio/core/layer-migration.mjs'].map(f=>[f,hash(resolve(root,f))])),
   comparison:{algorithm:'SHA-256 of Canvas RGBA pixels; HTTPS fonts blocked equally',frames:comparisons}},null,2)+'\n');
 }
 console.log('PASS Whiteout layer renderer checks');
}finally{await browser.close();await new Promise(r=>{server.close(r);server.closeAllConnections();});}
