import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,copyFileSync,rmSync,mkdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';
const ROOT=new URL('../../',import.meta.url).pathname;
test('SDK component works through the real Inspector, AI API, selection and deterministic export frames',async t=>{
 const dir=mkdtempSync(join(ROOT,'studio/projects/sdk-fixture-')),config=mkdtempSync(join(tmpdir(),'sdk-ui-'));
 for(const file of ['index.html','badge.mjs','project.studio.json'])copyFileSync(join(ROOT,'studio/projects/sdk-motion',file),join(dir,file));
 const state=JSON.parse(readFileSync(join(dir,'project.studio.json')));state.project.id='sdk-fixture';writeFileSync(join(dir,'project.studio.json'),JSON.stringify(state));
 const workDir=relative(ROOT,dir);writeFileSync(join(config,'works.json'),JSON.stringify({works:[{id:'sdk-fixture',name:'SDK fixture',dir:workDir,page:workDir+'/index.html',project:'project.studio.json',control:'frameTo',suites:[]}]}));
 process.env.STUDIO_WORKS=join(config,'works.json');process.env.STUDIO_NOTES_DIR=join(config,'notes');
 const {server}=await import('../server.mjs'),app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${app.address().port}`,browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1600,height:1050},colorScheme:'dark'});page.setDefaultTimeout(15000);
 t.after(async()=>{await browser.close();app.closeAllConnections();await new Promise(r=>app.close(r));rmSync(dir,{recursive:true,force:true});rmSync(config,{recursive:true,force:true});});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const read=async()=>await(await fetch(base+'/api/project?work=sdk-fixture')).json();
 await page.goto(base+'/#sdk-fixture/editor');await page.waitForFunction(()=>S.ready);await page.locator('[data-entity]').selectOption('shot-1-title');
 await t.test('schema builds string/color/enum/boolean/numeric controls and adds new instances',async()=>{
  assert.equal(await page.locator('[data-field="property|shot-1-title|text"]').getAttribute('type'),'text');
  assert.equal(await page.locator('[data-field="property|shot-1-title|color"]').getAttribute('type'),'color');
  assert.equal(await page.locator('[data-field="property|shot-1-title|dots"]').getAttribute('type'),'checkbox');
  await page.locator('[data-field="property|shot-1-title|text"]').fill('EDITED BY HUMAN');
  await page.locator('[data-field="property|shot-1-title|style"]').selectOption('outline');
  await page.locator('[data-apply]').click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('Saved'));
  const edited=await read();assert.equal(edited.project.shots[0].entities[1].properties.text,'EDITED BY HUMAN');assert.equal(edited.project.shots[0].entities[1].properties.style,'outline');
  await page.locator('[data-add-component]').click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('Saved'));
  assert.equal((await read()).project.shots[0].entities.length,3);
  await page.locator('[data-undo]').click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('Saved'));
 });
 await t.test('AI context has the same schema, validates property values, detects conflict',async()=>{
  const head=await read(),ctx=await(await fetch(base+'/api/context?work=sdk-fixture&frame=36')).json();assert.equal(ctx.selection.entities[1].schema.text.type,'string');
  const payload={work:'sdk-fixture',baseRevision:head.revision,requestId:crypto.randomUUID(),actor:'ai',operations:[{type:'setProperty',targetId:'shot-1-title',property:'text',value:'EDITED BY AI'}]};
  const post=body=>fetch(base+'/api/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post(payload)).status,200);assert.equal((await post({...payload,requestId:crypto.randomUUID()})).status,409);
  const current=await read();assert.equal((await post({...payload,baseRevision:current.revision,requestId:crypto.randomUUID(),operations:[{...payload.operations[0],property:'radius',value:999}]})).status,400);
 });
 await page.reload();await page.waitForFunction(()=>S.ready);await page.locator('[data-entity]').selectOption('shot-1-title');
 await t.test('random seek matches direct seek and export resolution; selection uses stable IDs',async()=>{
  const result=await page.evaluate(async()=>{
   const w=document.querySelector('#stage').contentWindow,r=w.__renderer,c=w.document.querySelector('canvas');
   await r.renderFrame({frame:36});const a=c.toDataURL();await r.renderFrame({frame:200});await r.renderFrame({frame:0});await r.renderFrame({frame:36});const b=c.toDataURL();
   const selected=r.selection({x:.5,y:.5}),geometry=r.selection({id:selected});await r.renderFrame({frame:36,quality:'export',width:960,height:540});const exported=c.toDataURL();
   await r.renderFrame({frame:36,width:480,height:270});const size=[c.width,c.height];await w.__frameTo(36);return{same:a===b,exportSame:a===exported,selected,geometry,size};
  });assert.equal(result.same,true);assert.equal(result.exportSame,true);assert.equal(result.selected,'shot-1-title');assert.equal(result.geometry.id,'shot-1-title');assert.deepEqual(result.size,[480,270]);
  await page.evaluate(()=>goTo(36));await page.waitForFunction(()=>S.frame===36);mkdirSync(join(ROOT,'build/phase2'),{recursive:true});await page.screenshot({path:join(ROOT,'build/phase2/component-preview.png')});
 });
 await t.test('SDK frames encode, reopen and display without any server upload',async()=>{
  const uploads=[];page.on('request',r=>{if(r.method()!=='GET'&&!r.url().endsWith('/api/snapshots'))uploads.push(r.url());});
  const result=await page.evaluate(async()=>{
   const blob=await exportVideo({from:24,to:47,width:480,sound:false}),url=URL.createObjectURL(blob),video=document.createElement('video');video.muted=true;video.src=url;
   await new Promise((r,j)=>{video.onloadedmetadata=r;video.onerror=j;});video.currentTime=.5;await new Promise(r=>video.onseeked=r);
   const c=document.createElement('canvas');c.width=480;c.height=270;const g=c.getContext('2d');g.drawImage(video,0,0);const d=g.getImageData(0,0,480,270).data;let lit=0;
   for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>90)lit++;
   const result={bytes:blob.size,width:video.videoWidth,height:video.videoHeight,duration:video.duration,lit};URL.revokeObjectURL(url);return result;
  });
  assert.equal(result.width,480);assert.equal(result.height,270);assert.ok(Math.abs(result.duration-1)<1/24);assert.ok(result.lit>1000);assert.deepEqual(uploads,[]);
  writeFileSync(join(ROOT,'build/phase2/sdk-export.json'),JSON.stringify(result,null,2)+'\n');
 });
 assert.deepEqual(errors,[]);
});

test('isolated code has no Studio access; infinite work times out and cancellation recovers',async t=>{
 const {server}=await import('../server.mjs'),app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.address().port}`;
 const browser=await chromium.launch(),page=await browser.newPage();t.after(async()=>{await browser.close();app.closeAllConnections();await new Promise(r=>app.close(r));});
 await page.goto(base+'/w/studio/sdk-preview.html');
 const requests=[];app.on('request',req=>{if(req.url.includes('/blocked-probe'))requests.push(req.url);});
 const result=await page.evaluate(async base=>{
  const {createIsolatedCanvas2D}=await import('./sdk/isolated.mjs');const project={width:320,height:180,seed:123,fps:{num:24,den:1},shots:[{id:'one',durationFrames:96}]},canvas=document.createElement('canvas');
  const source=`async function({context:g,width,height}){
   let blocked=0;
   try{await fetch('${base}/blocked-probe',{credentials:'include'});}catch{blocked++;}
   try{await import('${base}/blocked-probe.mjs');}catch{blocked++;}
   try{new WebSocket('ws://127.0.0.1:9/blocked-probe');await new Promise((r,j)=>setTimeout(j,25));}catch{blocked++;}
   try{document.cookie;}catch{blocked++;}
   try{parent.document.body.innerHTML='escaped';}catch{blocked++;}
   try{await new Promise((r,j)=>{const x=indexedDB.open('studio');x.onsuccess=r;x.onerror=j;});}catch{blocked++;}
   try{new Worker(URL.createObjectURL(new Blob(['while(true){}'])));}catch{blocked++;}
   if(blocked!==7)throw Error('Only '+blocked+' operations were blocked');
   g.fillStyle='#00ff00';g.fillRect(0,0,width,height);
  }`;
  const runtime=await createIsolatedCanvas2D({canvas,project,source,timeoutMs:2000});await runtime.renderFrame({frame:1});const pixel=Array.from(canvas.getContext('2d').getImageData(0,0,1,1).data);runtime.dispose();
  const loop=await createIsolatedCanvas2D({canvas,project,source:'function(){while(true){}}',timeoutMs:300});let timeout='';const start=performance.now();try{await loop.renderFrame({frame:0});}catch(e){timeout=e.message;}const elapsed=performance.now()-start;
  const pending=loop.renderFrame({frame:0}).catch(e=>e.message);setTimeout(()=>loop.cancel(),30);const cancelled=await pending;loop.dispose();
  const clean=await createIsolatedCanvas2D({canvas,project,source:'function({context:g,random,width,height}){g.fillStyle=`rgb(${Math.floor(random(0)*255)},100,50)`;g.fillRect(0,0,width,height);}'});
  await clean.renderFrame({frame:12});const first=canvas.toDataURL();await clean.renderFrame({frame:2});await clean.renderFrame({frame:12});const repeat=first===canvas.toDataURL();clean.dispose();
  return{pixel,timeout,elapsed,cancelled,repeat,iframes:document.querySelectorAll('iframe').length,stillHere:document.title};
 },base);
 assert.deepEqual(result.pixel,[0,255,0,255]);assert.match(result.timeout,/time limit/);assert.ok(result.elapsed<2000);assert.match(result.cancelled,/cancelled/);assert.equal(result.repeat,true);assert.equal(result.iframes,0);assert.equal(result.stillHere,'Code preview · Studio');assert.deepEqual(requests,[]);
 await page.locator('#run').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='Frame 24 ready.');
 await page.locator('#source').fill('function(){while(true){}}');await page.locator('#run').click();await page.locator('#cancel').click();await page.waitForFunction(()=>!document.querySelector('#run').disabled);
 assert.match(await page.locator('#status').textContent(),/cancel/i);
});
