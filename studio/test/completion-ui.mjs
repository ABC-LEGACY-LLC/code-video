import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,copyFileSync,rmSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {chromium} from 'playwright';
import {upgradeEditorProject} from '../core/editor-upgrade.mjs';
const ROOT=new URL('../../',import.meta.url).pathname,config=mkdtempSync(join(tmpdir(),'studio-completion-config-')),dir=mkdtempSync(join(ROOT,'studio/projects/completion-fixture-')),rel=relative(ROOT,dir);
const initial={schemaVersion:2,generation:0,project:upgradeEditorProject(JSON.parse(readFileSync(join(ROOT,'studio/projects/whiteout/project.studio.json'))).project),history:{past:[],future:[]},receipts:[]};
writeFileSync(join(dir,'project.studio.json'),JSON.stringify(initial));copyFileSync(join(ROOT,'studio/projects/whiteout/whiteout.html'),join(dir,'whiteout.html'));
writeFileSync(join(config,'works.json'),JSON.stringify({works:[{id:'whiteout',name:'Completion fixture',dir:rel,page:rel+'/whiteout.html',project:'project.studio.json',control:'frameTo',suites:[]},JSON.parse(readFileSync(join(ROOT,'studio/works.json'))).works.find(w=>w.id==='zarra')]}));
process.env.STUDIO_WORKS=join(config,'works.json');process.env.STUDIO_NOTES_DIR=join(config,'notes');process.env.STUDIO_LABS_LINES=join(config,'labs');
test('complete Human/AI editor with actual drawing, history, media and review',async t=>{
 const {server}=await import('../server.mjs'),instance=server();await new Promise(r=>instance.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+instance.address().port,browser=await chromium.launch({args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1600,height:1100}});page.setDefaultTimeout(12000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assetDir=join(ROOT,'studio/assets/whiteout'),existingAssets=new Set(existsSync(assetDir)?readdirSync(assetDir):[]),testAssets=new Set();
 const read=async()=> (await fetch(base+'/api/project?work=whiteout')).json();
 const act=async fn=>{const n=(await read()).generation;await fn();await page.waitForFunction(async n=>(await (await fetch('/api/project?work=whiteout')).json()).generation>n,n);await page.waitForFunction(n=>editor.snapshot().generation>n&&!editor.snapshot().blocked,n);};
 const reload=async()=>{await page.evaluate(()=>reloadStage());await page.waitForFunction(()=>S.ready&&!S.restoring);};
 const select=async id=>{await page.evaluate(id=>editor.select(id),id);};
 let caption;
 try{
  await page.route('https://**',r=>r.abort());await page.goto(base+'/#whiteout/editor');await page.waitForFunction(()=>S.ready&&editor?.snapshot());await page.evaluate(()=>{pauseStage();goTo(164);});await page.waitForFunction(()=>S.frame===164);
  await t.test('timeline selection synchronizes Inspector and Follow tracks matching layers',async()=>{
   await page.locator('.tl-item[aria-label*="Layer · Hero"]').filter({hasText:'Hero'}).nth(3).click();await page.waitForFunction(()=>editor.snapshot()?.entity.id==='hero:meet');
   await page.evaluate(()=>goTo(311));await page.waitForFunction(()=>editor.snapshot()?.entity.id==='hero:backs');
   await page.evaluate(()=>goTo(164));await page.waitForFunction(()=>editor.snapshot()?.entity.id==='hero:meet');
   assert.equal(await page.locator('#panel').evaluate(p=>p.scrollTop),0);
  });
  await t.test('text creation, direct move, reload selection, content, duplicate and Undo',async()=>{
   await act(()=>page.locator('[data-new-text]').click());caption=await page.evaluate(()=>editor.snapshot().entity.id);await reload();
   assert.equal(await page.evaluate(()=>editor.snapshot().entity.id),caption);
   const handle=page.frameLocator('#stage').locator('[data-transform="move"]');await handle.waitFor();const b=await handle.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+35,b.y+b.height/2+12,{steps:5});await act(()=>page.mouse.up());
   assert.ok((await read()).project.shots.flatMap(s=>s.entities).find(e=>e.id===caption).properties.x>0);
   await page.locator('[data-text]').fill('HELLO LAYERS');await act(()=>page.locator('[data-content-save]').click());assert.equal(await page.evaluate(()=>editor.snapshot().entity.content.text),'HELLO LAYERS');
   await act(()=>page.locator('[data-duplicate]').click());const duplicate=await page.evaluate(()=>editor.snapshot().entity.id);assert.notEqual(duplicate,caption);await act(()=>page.locator('[data-undo]').click());assert.ok(!(await read()).project.shots.flatMap(s=>s.entities).some(e=>e.id===duplicate));await select(caption);
  });
  await t.test('proposal renders before and after without writing, then applies with AI attribution and Undo',async()=>{
   const before=await read();await page.getByText('Review an AI proposal',{exact:true}).click();await page.locator('[data-proposal]').fill(JSON.stringify({baseRevision:before.revision,operations:[{type:'setProperty',targetId:caption,property:'x',value:250}]}));await page.locator('[data-proposal-preview]').click();await page.waitForFunction(()=>document.querySelector('[data-proposal-status]').textContent!=='Preparing comparison…');assert.match(await page.locator('[data-proposal-status]').textContent(),/not saved/);
   assert.equal((await read()).generation,before.generation);
   const pictures=await page.locator('.proposal-frame').evaluateAll(async frames=>Promise.all(frames.map(async f=>{const canvas=f.contentDocument.querySelector('canvas');return canvas.toDataURL();})));assert.notEqual(pictures[0],pictures[1]);
   await act(()=>page.locator('[data-proposal-apply]').click());assert.equal((await read()).history.entries.at(-1).actor.kind,'ai');await act(()=>page.locator('[data-undo]').click());
  });
  await t.test('keyframes move on the timeline and current audio renders a waveform',async()=>{
   await select(caption);await act(()=>page.evaluate(()=>editor.commit([{type:'setKeyframe',targetId:editor.snapshot().entity.id,property:'x',frame:4,value:0},{type:'setKeyframe',targetId:editor.snapshot().entity.id,property:'x',frame:20,value:200}],'Animate caption')));
   const key=page.locator('.key-diamond[data-property="x"][data-frame="20"]');await key.waitFor();await key.focus();await act(()=>page.keyboard.press('ArrowRight'));assert.equal((await read()).project.shots.flatMap(s=>s.entities).find(e=>e.id===caption).keyframes.x.at(-1).frame,21);
   await reload();await page.locator('[data-wave]').click();await page.waitForFunction(()=>document.querySelector('[data-tl-status]').textContent==='Full sequence mix');assert.equal(await page.locator('[data-waveform]').isVisible(),true);
  });
  await t.test('media decode and export use the prepared frame',async()=>{
   const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='red';g.fillRect(0,0,64,64);return c.toDataURL().split(',')[1];});
   await act(async()=>{await page.locator('[data-media]').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});});
   assert.equal(await page.evaluate(()=>editor.snapshot().entity.layer.binding),'image');testAssets.add((await page.evaluate(()=>editor.snapshot().entity.content.src)).split('/').at(-1));await reload();
   const result=await page.evaluate(async()=>{const blob=await exportVideo({from:164,to:166,width:320,sound:true});return{bytes:blob.size,type:blob.type,preview:win().__getLayerPreview()};});assert.ok(result.bytes>1000);assert.equal(result.preview.transform,null);
  });
  await t.test('video import seeks a different decoded frame; audio import reaches the rendered mix',async()=>{
   // A synthetic color clip is a source fixture. Finished film exports never leave the browser.
   const video=await page.evaluate(async()=>{
    const width=160,height=90,fps=24,enc=await exportCodec(width,height,fps),canvas=new OffscreenCanvas(width,height),g=canvas.getContext('2d'),samples=[];let description,failed;
    const encoder=new VideoEncoder({error:e=>{failed=e;},output:(chunk,meta)=>{const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);samples.push({data,key:chunk.type==='key'});if(meta.decoderConfig?.description)description=new Uint8Array(meta.decoderConfig.description);}});encoder.configure(enc.config);
    try{for(let i=0;i<8;i++){g.fillStyle=i<3?'red':'blue';g.fillRect(0,0,width,height);const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});encoder.encode(frame,{keyFrame:true});frame.close();}await encoder.flush();if(failed)throw failed;return Array.from(new Uint8Array(await MP4.file({codec:enc.codec,description,width,height,fps,samples}).arrayBuffer()));}finally{encoder.close();}
   });
   await act(()=>page.locator('[data-media]').setInputFiles({name:'clip.mp4',mimeType:'video/mp4',buffer:Buffer.from(video)}));
   const id=await page.evaluate(()=>editor.snapshot().entity.id);assert.equal(await page.evaluate(()=>editor.snapshot().entity.layer.binding),'video');testAssets.add((await page.evaluate(()=>editor.snapshot().entity.content.src)).split('/').at(-1));await reload();
   const hashes=await page.evaluate(async id=>{const W=win(),out=[];W.__setLayerPreview({soloId:id});for(const f of [164,167,164]){W.__frameTo(f);await W.__prepareFrame();const c=W.document.querySelector('canvas');out.push(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',c.getContext('2d').getImageData(0,0,c.width,c.height).data))).join(','));}W.__setLayerPreview({soloId:null});return out;},id);assert.notEqual(hashes[0],hashes[1]);assert.equal(hashes[0],hashes[2]);
   const sr=12000,frames=sr,wav=Buffer.alloc(44+frames*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*2,40);for(let i=0;i<frames;i++)wav.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/sr)*12000),44+i*2);
   await act(()=>page.locator('[data-media]').setInputFiles({name:'tone.wav',mimeType:'audio/wav',buffer:wav}));assert.equal(await page.evaluate(()=>editor.snapshot().entity.cue.voice),'file');testAssets.add((await page.evaluate(()=>editor.snapshot().entity.cue.src)).split('/').at(-1));await reload();
   const rms=await page.evaluate(async()=>{const audio=await win().__renderAudio(S.total/S.fps,12000),from=Math.round(164/24*12000),data=audio.channels[0].slice(from,from+12000);return Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length);});assert.ok(rms>.05);
  });
  await t.test('sound drafts survive an AI edit and explicit review before applying',async()=>{
   const saved=await read(),id=await page.evaluate(()=>editor.snapshot().entity.id);
   await page.locator('[data-cue-duration]').fill('12');await page.locator('[data-cue-offset]').fill('0.1');
   const response=await fetch(base+'/api/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({work:'whiteout',baseRevision:saved.revision,requestId:'sound-draft-external',actor:'ai',operations:[{type:'setProperty',targetId:id,property:'gain',value:.8}]})});assert.equal(response.status,200);
   await page.evaluate(()=>editor.refresh('whiteout'));await page.locator('[data-review]').waitFor();await page.locator('[data-review]').click();
   await page.waitForFunction(()=>document.querySelector('[data-version]').textContent!==''&&!document.querySelector('[data-cue-save]').disabled);
   assert.equal(await page.locator('[data-cue-duration]').inputValue(),'12');assert.equal(await page.locator('[data-cue-offset]').inputValue(),'0.1');
   await act(()=>page.locator('[data-cue-save]').click());const entity=(await read()).project.shots.flatMap(s=>s.entities).find(e=>e.id===id);assert.equal(entity.cue.durationFrames,12);assert.equal(entity.cue.offsetSeconds,.1);assert.equal(entity.properties.gain,.8);
  });
  await t.test('region annotations persist normalized coordinates and context includes the rendered image',async()=>{
   await page.locator('[data-region]').click();const overlay=page.frameLocator('#stage').locator('[data-region-overlay]');await overlay.waitFor();const b=await overlay.boundingBox();await page.mouse.move(b.x+b.width*.2,b.y+b.height*.2);await page.mouse.down();await page.mouse.move(b.x+b.width*.4,b.y+b.height*.6);await page.mouse.up();
   await page.locator('[data-note]').fill('Review this region');await act(()=>page.locator('[data-add-note]').click());const annotation=(await read()).project.annotations.at(-1);assert.ok(Math.abs(annotation.region[0]-.2)<.01);assert.ok(Math.abs(annotation.region[3]-.4)<.01);
   await reload();await page.context().grantPermissions(['clipboard-read','clipboard-write']);await page.locator('[data-copy-context]').click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('copied'));const context=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));assert.match(context.renderedFrame.image,/^data:image\/webp;base64,/);assert.equal(context.renderedFrame.documentGeneration,(await read()).generation);
  });
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1600,height:1100});
  assert.deepEqual(errors,[]);mkdirSync(join(ROOT,'build/completion'),{recursive:true});await page.screenshot({path:join(ROOT,'build/completion/editor.png'),fullPage:true});
  await t.test('Zarra waits for its asynchronous project before announcing readiness and frame rate',async()=>{
   await page.route('**/w/studio/projects/zarra/project.studio.json',async route=>{await new Promise(r=>setTimeout(r,1000));await route.continue();});
   await page.goto(base+'/#zarra/editor');await page.waitForFunction(()=>current?.id==='zarra'&&win().__ready===false);assert.equal(await page.evaluate(()=>S.ready),false);
   await page.waitForFunction(()=>S.ready);assert.equal(await page.evaluate(()=>S.fps),50/3);assert.equal(await page.evaluate(()=>typeof win().__layerGeometry),'function');assert.deepEqual(errors,[]);
  });
 }finally{await browser.close();instance.closeAllConnections();await new Promise(r=>instance.close(r));rmSync(dir,{recursive:true,force:true});rmSync(config,{recursive:true,force:true});for(const file of testAssets)if(!existingAssets.has(file))rmSync(join(assetDir,file),{force:true});}
});
