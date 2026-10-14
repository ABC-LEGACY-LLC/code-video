import test from 'node:test';
import {get as httpGet} from 'node:http';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawn} from 'node:child_process';
import {chromium} from 'playwright';
const ROOT=new URL('../../',import.meta.url).pathname;
test('Creator: three scenes, assets, undo, AI preview, independent duplicate, browser video and portable source',async t=>{
 const config=mkdtempSync(join(tmpdir(),'creator-ui-')),created=new Set();writeFileSync(join(config,'works.json'),'{"works":[]}');process.env.STUDIO_WORKS=join(config,'works.json');process.env.STUDIO_NOTES_DIR=join(config,'notes');
 const {server,watchWorks}=await import('../server.mjs'),app=server(),unwatch=watchWorks();await new Promise(r=>app.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.address().port}`,browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1600,height:1050},colorScheme:'dark'});page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let portable;
 t.after(async()=>{portable?.kill();await browser.close();unwatch();app.closeAllConnections();await new Promise(r=>app.close(r));for(const id of created){rmSync(join(ROOT,'studio/projects/created',id),{recursive:true,force:true});rmSync(join(ROOT,'studio/assets',id),{recursive:true,force:true});}rmSync(config,{recursive:true,force:true});});
 const request={requestId:crypto.randomUUID(),actor:'ai',name:'API isolation fixture',format:'1:1',fps:30,durationSeconds:2,template:'blank'};
 const post=(path,body,headers={})=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
 await t.test('creation routes enforce origin and idempotency',async()=>{
  assert.equal((await post('/api/projects',request,{origin:'https://foreign.example'})).status,403);
  const response=await post('/api/projects',request);assert.equal(response.status,200);const value=await response.json();created.add(value.work.id);assert.equal((await(await post('/api/projects',request)).json()).replayed,true);assert.equal((await post('/api/projects',{...request,name:'Different'})).status,409);
 });
 await page.goto(base);await page.locator('[data-new-project]').click();await page.locator('dialog [name=name]').fill('Studio creator acceptance');await page.locator('dialog [name=template]').selectOption('title-sequence');await page.locator('dialog [name=duration]').fill('6');await page.locator('dialog button[type=submit]').click();await page.waitForFunction(()=>S.ready&&current?.name==='Studio creator acceptance');
 const id=await page.evaluate(()=>current.id);created.add(id);const read=async work=>await(await fetch(base+'/api/project?work='+(work||id))).json();
 await t.test('three scenes open in the generic player with visible artwork and persistent settings',async()=>{
  const head=await read();assert.equal(head.project.shots.length,3);assert.equal(head.project.width,1920);assert.equal(head.project.fps.num,24);assert.equal(head.project.shots.reduce((s,x)=>s+x.durationFrames,0),144);
  await page.evaluate(()=>goTo(24));await page.waitForFunction(()=>S.frame===24);const lit=await page.evaluate(()=>{const c=document.querySelector('#stage').contentWindow.document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>250)n++;return n;});assert.ok(lit>1000);assert.deepEqual(await page.evaluate(()=>[win().document.querySelector('canvas').width,win().__projectSize.width]),[720,1920]);
  await page.reload();await page.waitForFunction(()=>S.ready);assert.equal((await read()).project.shots.length,3);
 });
 await t.test('scene creation, duplication, deletion, reorder and undo through UI',async()=>{
  await page.locator('[data-scene-add]').click();await page.waitForFunction(()=>editor.snapshot().project.shots.length===4&&!editor.snapshot().blocked);
  await page.locator('[data-scene-copy]').click();await page.waitForFunction(()=>editor.snapshot().project.shots.length===5&&!editor.snapshot().blocked);
  await page.locator('[data-scene-delete]').click();await page.waitForFunction(()=>editor.snapshot().project.shots.length===4&&!editor.snapshot().blocked);
  await page.locator('[data-undo]').click();await page.waitForFunction(()=>editor.snapshot().project.shots.length===5&&!editor.snapshot().blocked);
  await page.locator('[data-redo]').click();await page.waitForFunction(()=>editor.snapshot().project.shots.length===4&&!editor.snapshot().blocked);
  const head=await read(),extra=head.project.shots.find(s=>s.name==='Scene 4');await page.locator('[data-shot]').selectOption(extra.id);await page.locator('[data-scene-delete]').click();await page.waitForFunction(()=>editor.snapshot().project.shots.length===3&&!editor.snapshot().blocked);
  const first=(await read()).project.shots[0];await page.locator('[data-shot]').selectOption(first.id);await page.locator('[data-next-shot]').click();await page.waitForFunction(id=>editor.snapshot().project.shots[1].id===id&&!editor.snapshot().blocked,first.id);await page.locator('[data-prev-shot]').click();await page.waitForFunction(id=>editor.snapshot().project.shots[0].id===id&&!editor.snapshot().blocked,first.id);
 });
 await t.test('component numeric properties can receive keyframes in the Inspector',async()=>{
  const head=await read(),shot=head.project.shots[0],shape=shot.entities.find(e=>e.component==='shape');await page.locator('[data-shot]').selectOption(shot.id);await page.locator('[data-jump-shot]').click();await page.locator('[data-entity]').selectOption(shape.id);await page.locator('[data-key-property]').selectOption('width');await page.locator('[data-key-value]').fill('720');await page.locator('[data-set-key]').click();await page.waitForFunction(()=>!editor.snapshot().blocked);assert.equal((await read()).project.shots[0].entities.find(e=>e.id===shape.id).keyframes.width[0].value,720);
 });
 await t.test('asset import, preview, reuse and missing-file detection',async()=>{
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=80;const g=c.getContext('2d');g.fillStyle='#ff5522';g.fillRect(0,0,120,80);return c.toDataURL().split(',')[1];});
  await page.locator('[data-sidebar=assets]').click();await page.locator('[data-asset-file]').setInputFiles({name:'brand.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.locator('.asset-card img').waitFor();await page.waitForFunction(()=>document.querySelector('.asset-card img').naturalWidth===120);
  await page.locator('.asset-card button').click();await page.waitForFunction(()=>!editor.snapshot().blocked);await page.locator('.asset-card button').click();await page.waitForFunction(()=>document.querySelector('.asset-card').textContent.includes('2 uses'));
  const asset=(await(await fetch(base+'/api/assets?work='+id)).json())[0],file=join(ROOT,asset.src.slice(3)),bytes=readFileSync(file);rmSync(file);await page.locator('[data-asset-refresh]').click();await page.getByText('Missing file. Reimport the original file to restore it.').waitFor();writeFileSync(file,bytes);await page.locator('[data-asset-refresh]').click();await page.waitForFunction(()=>document.querySelector('[data-asset-status]').textContent.includes('0 need attention'));
 });
 await t.test('video input uses decoded frame time and deterministic random seek',async()=>{
  // Synthetic source media fixture, not a finished film export.
  const video=await page.evaluate(async()=>{
   const width=160,height=90,fps=24,enc=await exportCodec(width,height,fps),canvas=new OffscreenCanvas(width,height),g=canvas.getContext('2d'),samples=[];let description,failed;
   const encoder=new VideoEncoder({error:e=>{failed=e;},output:(chunk,meta)=>{const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);samples.push({data,key:chunk.type==='key'});if(meta.decoderConfig?.description)description=new Uint8Array(meta.decoderConfig.description);}});encoder.configure(enc.config);
   try{for(let i=0;i<8;i++){g.fillStyle=i<3?'red':'blue';g.fillRect(0,0,width,height);const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});encoder.encode(frame,{keyFrame:true});frame.close();}await encoder.flush();if(failed)throw failed;return Array.from(new Uint8Array(await MP4.file({codec:enc.codec,description,width,height,fps,samples}).arrayBuffer()));}finally{encoder.close();}
  });
  const head=await read();await page.evaluate(id=>editor.select(id),head.project.shots[0].id);
  const generation=head.generation;await page.locator('[data-media]').setInputFiles({name:'color-source.mp4',mimeType:'video/mp4',buffer:Buffer.from(video)});await page.waitForFunction(g=>editor.snapshot().generation>g&&!editor.snapshot().blocked,generation);
  await page.evaluate(()=>reloadStage());await page.waitForFunction(()=>S.ready&&!S.restoring);
  const result=await page.evaluate(async()=>{const W=win(),c=W.document.querySelector('canvas'),out=[];for(const f of [0,4,0]){await W.__frameTo(f);out.push([...c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data]);}return out;});assert.notDeepEqual(result[0],result[1]);assert.deepEqual(result[0],result[2]);
 });
 await t.test('AI proposal Before/After uses the proposed project without persisting it',async()=>{
  const head=await read(),background=head.project.shots[0].entities.find(e=>e.component==='background');await page.locator('[data-proposal-details] summary').click();await page.locator('[data-proposal]').fill(JSON.stringify({baseRevision:head.revision,operations:[{type:'setProperty',targetId:background.id,property:'color',value:'#ff0000'}]}));await page.locator('[data-proposal-preview]').click();await page.waitForFunction(()=>document.querySelector('[data-proposal-status]').textContent!=='Preparing comparison…');assert.match(await page.locator('[data-proposal-status]').textContent(),/not saved/);await page.locator('[data-proposal-apply]').waitFor();
  const pixels=await page.evaluate(()=>[...document.querySelectorAll('.proposal-frame')].map(f=>[...f.contentWindow.document.querySelector('canvas').getContext('2d').getImageData(0,0,1,1).data]));assert.notDeepEqual(pixels[0],pixels[1]);assert.equal((await read()).revision,head.revision);await page.locator('[data-proposal-reject]').click();
 });
 await t.test('video exports and reopens in the browser without upload',async()=>{
  await page.reload();await page.waitForFunction(()=>S.ready);const uploads=[];const listener=r=>{if(r.method()==='POST'&&!r.url().endsWith('/api/snapshots'))uploads.push(r.url());};page.on('request',listener);
  const result=await page.evaluate(async()=>{const b=await exportVideo({from:12,to:35,width:480,sound:false}),url=URL.createObjectURL(b),v=document.createElement('video');v.muted=true;v.src=url;await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=j;});v.currentTime=.5;await new Promise(r=>v.onseeked=r);const c=document.createElement('canvas');c.width=480;c.height=270;const g=c.getContext('2d');g.drawImage(v,0,0,c.width,c.height);const pixel=[...g.getImageData(0,0,1,1).data];const result={bytes:b.size,width:v.videoWidth,height:v.videoHeight,duration:v.duration,pixel};URL.revokeObjectURL(url);return result;});page.off('request',listener);assert.equal(result.width,480);assert.equal(result.height,270);assert.ok(Math.abs(result.duration-1)<1/24);assert.deepEqual(uploads,[]);mkdirSync(join(ROOT,'build/phase3'),{recursive:true});const native=await page.evaluate(async()=>{const blob=await exportVideo({from:12,to:12,sound:false}),url=URL.createObjectURL(blob),v=document.createElement('video');v.src=url;await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=j;});const size=[v.videoWidth,v.videoHeight];URL.revokeObjectURL(url);await win().__frameTo(12);return{size,preview:win().document.querySelector('canvas').width};});assert.deepEqual(native,{size:[1920,1080],preview:720});writeFileSync(join(ROOT,'build/phase3/creator-export.json'),JSON.stringify({...result,native},null,2));
 });
 await t.test('downloaded source ZIP passes CRC and SHA and runs independently',async()=>{
  const head=await read(),response=await fetch(base+'/api/source-package?work='+id+'&revision='+head.revision);assert.equal(response.status,200);const zip=join(config,'source.zip');await page.locator('[data-project-actions]').click();const download=page.waitForEvent('download');await page.locator('[data-source-package]').click();await(await download).saveAs(zip);await page.locator('[data-close]').click();const unpack=join(config,'unpacked');mkdirSync(unpack);execFileSync('python3',['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',zip,unpack]);
  const manifest=JSON.parse(readFileSync(join(unpack,'manifest.json')));const {createHash}=await import('node:crypto');for(const [file,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(readFileSync(join(unpack,file))).digest('hex'),hash);assert.ok(!Object.keys(manifest.files).some(f=>/work.json|history|auth|\.env/.test(f)));
  portable=spawn(process.execPath,['serve.mjs'],{cwd:unpack,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});const endpoint=await new Promise((resolve,reject)=>{portable.stdout.once('data',data=>resolve(String(data).trim().replace('Project: ','')));portable.once('error',reject);portable.once('exit',code=>reject(new Error('source server exited '+code)));});
  assert.equal(await new Promise((resolve,reject)=>httpGet(endpoint,{headers:{host:'rebind.example'}},response=>{response.resume();resolve(response.statusCode);}).on('error',reject)),421);const preview=await browser.newPage();await preview.goto(endpoint);await preview.waitForFunction(()=>window.__ready===true);await preview.evaluate(async()=>{await window.__frameTo(30);await window.__prepareFrame?.();});assert.equal(await preview.evaluate(()=>window.__frame().frame),30);await preview.close();portable.kill();portable=null;
 });
 await t.test('project duplicate reopens with independent media and no inherited history',async()=>{
  await page.locator('[data-project-actions]').click();await page.locator('[data-copy-project]').click();await page.waitForFunction(old=>current?.id!==old&&S.ready,id);const copy=await page.evaluate(()=>current.id);created.add(copy);const head=await read(copy);assert.equal(head.generation,0);assert.equal(head.history.canUndo,false);assert.ok(head.project.shots.flatMap(s=>s.entities).filter(e=>e.content?.src).every(e=>e.content.src.includes(copy)));assert.equal(head.project.shots.length,3);
  await page.locator('[data-sidebar=layers]').click();await page.screenshot({path:join(ROOT,'build/phase3/creator-preview.png')});
 });
 assert.deepEqual(errors,[]);
});
