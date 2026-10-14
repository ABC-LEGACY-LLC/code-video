/* The managed editor against an isolated project and server; no real work is edited. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join, relative} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';

const ROOT = new URL('../../', import.meta.url).pathname;
const config = mkdtempSync(join(tmpdir(), 'studio-editor-config-'));
mkdirSync(join(ROOT, 'build'), {recursive: true});
const dir = mkdtempSync(join(ROOT, 'build/editor-ui-'));
const workDir = relative(ROOT, dir);
const entity = id => ({id, name: 'Camera', type: 'camera2d', properties: {x: 0, y: 0, zoom: 1}, keyframes: {}});
const project = {id: 'editor-fixture', name: 'Editor fixture', fps: {num: 24, den: 1}, width: 640, height: 360,
 shots: [{id: 'shot-a', name: 'Opening', durationFrames: 24, entities: [entity('camera-a')]}, {id: 'shot-b', name: 'Ending', durationFrames: 24, entities: [entity('camera-b')]}], annotations: []};
writeFileSync(join(dir, 'project.studio.json'), JSON.stringify({schemaVersion: 1, generation: 0, project, history: {past: [], future: []}, receipts: []}));
writeFileSync(join(dir, 'index.html'), `<!doctype html><canvas width="640" height="360"></canvas><script>
let f=0,playing=false;window.__ready=true;window.__fps=24;window.__totalFrames=48;
window.__frameTo=n=>{f=n;return{frame:f}};window.__frame=()=>({frame:f,playing});window.__pause=()=>{playing=false};
window.__play=n=>{f=n;playing=true};setInterval(()=>{if(playing)f=(f+1)%48},50);
</script>`);
writeFileSync(join(config, 'works.json'), JSON.stringify({works: [
 {id: project.id, name: project.name, dir: workDir, page: workDir + '/index.html', project: 'project.studio.json', control: 'frameTo', suites: [], editor: {operations: ['renameShot', 'setProperty', 'setKeyframe', 'deleteKeyframe', 'addAnnotation', 'resolveAnnotation']}},
 {id: 'other-fixture', name: 'Other work', dir: workDir, page: workDir + '/index.html', control: 'frameTo', suites: []},
]}));
process.env.STUDIO_WORKS = join(config, 'works.json');
process.env.STUDIO_NOTES_DIR = join(config, 'notes');
process.env.STUDIO_LABS_LINES = join(config, 'labs');

test('managed editor: atomic edits, persistent history, keyframes, annotations, and conflicts', async t => {
 const {server} = await import('../server.mjs');
 const instance = server();
 await new Promise(resolve => instance.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${instance.address().port}`;
 const browser = await chromium.launch();
 const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 const read = async () => (await fetch(base + '/api/project?work=' + project.id)).json();
 const external = async value => {
  const current = await read();
  const response = await fetch(base + '/api/operations', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({work: project.id, baseRevision: current.revision, requestId: crypto.randomUUID(), actor: 'ai', label: 'AI change', operations: [{type: 'setProperty', targetId: 'camera-a', property: 'x', value}]})});
  assert.equal(response.status, 200);
 };
 const ready = async () => { await page.waitForSelector('[data-field="property|camera-a|x"]'); await page.waitForFunction(() => S.ready); };
 const idle = () => page.waitForFunction(() => !document.querySelector('[data-status]')?.textContent.includes('Saving'));
 try {
  await page.goto(base + '/#editor-fixture/editor'); await ready();
  await t.test('unsupported timing operations stay hidden', async () => {
   assert.equal(await page.locator('[data-prev-shot]').isVisible(), false);
   assert.equal(await page.locator('[data-next-shot]').isVisible(), false);
   assert.equal(await page.locator('[data-field="duration|shot-a"]').isVisible(), false);
  });
  await t.test('two fields are one transaction and survive reload / Undo / Redo', async () => {
   await page.locator('[data-field="property|camera-a|x"]').fill('42');
   await page.locator('[data-field="property|camera-a|y"]').fill('21');
   await page.locator('[data-apply]').click();
   await page.waitForFunction(() => document.querySelector('[data-status]').textContent.startsWith('Saved'));
   let data = await read(); assert.equal(data.history.entries.length, 1);
   assert.deepEqual(data.project.shots[0].entities[0].properties, {x: 42, y: 21, zoom: 1});
   await page.reload(); await ready();
   assert.equal(await page.locator('[data-field="property|camera-a|x"]').inputValue(), '42');
   await page.locator('[data-undo]').click(); await idle();
   data = await read(); assert.equal(data.project.shots[0].entities[0].properties.x, 0);
   await page.locator('[data-redo]').click(); await idle();
   data = await read(); assert.equal(data.project.shots[0].entities[0].properties.x, 42);
  });
  await t.test('keyframe uses current shot frame and does not change the base value', async () => {
   await page.evaluate(() => goTo(5)); await page.waitForFunction(() => S.frame === 5);
   await page.locator('[data-key-property]').selectOption('zoom');
   await page.locator('[data-key-value]').fill('2');
   await page.locator('[data-easing]').selectOption('ease');
   await page.locator('[data-set-key]').click(); await idle();
   const camera = (await read()).project.shots[0].entities[0];
   assert.equal(camera.properties.zoom, 1);
   assert.deepEqual(camera.keyframes.zoom, [{frame: 5, value: 2, easing: 'ease'}]);
   assert.match(await page.locator('[data-evaluated="zoom"]').textContent(), /At frame 5: 2/);
  });
  await t.test('external edits preserve drafts and require explicit review', async () => {
   await page.locator('[data-note]').fill('Keep the subject centred.');
   await page.locator('[data-field="property|camera-a|x"]').fill('77');
   await external(100);
   await page.evaluate(() => editor.refresh('editor-fixture'));
   assert.equal(await page.locator('[data-note]').inputValue(), 'Keep the subject centred.');
   assert.equal(await page.locator('[data-field="property|camera-a|x"]').inputValue(), '77');
   assert.equal(await page.locator('[data-apply]').isDisabled(), true);
   await page.locator('[data-review]').click();
   await page.waitForFunction(() => !document.querySelector('[data-apply]').disabled);
   assert.match(await page.locator('.editor-property').first().textContent(), /Saved base: 100/);
   await page.locator('[data-apply]').click(); await idle();
   assert.equal((await read()).project.shots[0].entities[0].properties.x, 77);
   assert.equal(await page.locator('[data-note]').inputValue(), 'Keep the subject centred.');
  });
  await t.test('annotations attach to object/frame and resolve with history', async () => {
   await page.locator('[data-add-note]').click(); await idle();
   let note = (await read()).project.annotations[0];
   assert.equal(note.frame, 5); assert.equal(note.targetId, 'camera-a'); assert.equal(note.status, 'open');
   await page.evaluate(() => goTo(12)); await page.waitForFunction(() => S.frame === 12);
   await page.locator('[data-note-jump]').click(); await page.waitForFunction(() => S.frame === 5);
   await page.locator('[data-note-resolve]').click(); await idle();
   note = (await read()).project.annotations[0]; assert.equal(note.status, 'resolved');
   assert.match(await page.locator('[data-history]').textContent(), /human/);
   assert.match(await page.locator('[data-history]').textContent(), /ai/);
  });
  await t.test('a race returns a visible conflict without silently retrying', async () => {
   await page.locator('[data-field="property|camera-a|y"]').fill('55');
   await external(101);
   await page.locator('[data-apply]').click();
   await page.waitForFunction(() => !document.querySelector('[data-conflict]').hidden);
   assert.equal((await read()).project.shots[0].entities[0].properties.y, 21);
   assert.equal(await page.locator('[data-field="property|camera-a|y"]').inputValue(), '55');
  });
  await t.test('export pauses all mutations', async () => {
   await page.locator('[data-review]').click(); await page.waitForFunction(() => !document.querySelector('[data-apply]').disabled);
   await page.evaluate(() => { exporting = {cancel: false}; setTransport(); });
   assert.equal(await page.locator('[data-apply]').isDisabled(), true);
   assert.equal(await page.locator('[data-field="property|camera-a|x"]').isDisabled(), true);
   assert.equal(await page.locator('[data-note-resolve]').isDisabled(), true);
   await page.evaluate(() => { document.querySelector('#stage').contentWindow.__exportMarker = 'preserved'; updateArrived(); reloadStage(); location.hash = '#other-fixture/editor'; });
   await page.waitForTimeout(650);
   assert.deepEqual(await page.evaluate(() => ({work: current.id, marker: document.querySelector('#stage').contentWindow.__exportMarker, pending: S.pending})), {work: 'editor-fixture', marker: 'preserved', pending: true});
   await page.evaluate(() => { S.pending = false; });
   await page.evaluate(() => { exporting = null; setTransport(); });
   assert.equal(await page.locator('[data-apply]').isDisabled(), false);
  });
  await t.test('saved-state export rejects drafts, then codec preparation locks editing and releases on failure', async () => {
   assert.match(await page.evaluate(()=>exportVideo({from:0,to:0,sound:false}).catch(e=>e.message)),/drafts/);
   await page.locator('[data-discard]').click();await page.waitForFunction(()=>!editor.snapshot().blocked);
   const result=await page.evaluate(async()=>{
    const original=VideoEncoder.isConfigSupported;let release,calls=0;
    VideoEncoder.isConfigSupported=()=>++calls===1?new Promise(r=>release=r):Promise.resolve({supported:false});
    try{const promise=exportVideo({from:0,to:0,sound:false}).catch(e=>e.message);const frozen=!!exporting&&document.querySelector('[data-apply]').disabled;while(!release)await new Promise(r=>setTimeout(r,5));release({supported:false});const error=await promise;return{frozen,released:exporting===null,error};}finally{VideoEncoder.isConfigSupported=original;}
   });assert.equal(result.frozen,true);assert.equal(result.released,true);assert.match(result.error,/no video encoder/);
  });
  await t.test('codec rejection releases the export lock',async()=>{
   const result=await page.evaluate(async()=>{const original=VideoEncoder.isConfigSupported;VideoEncoder.isConfigSupported=async()=>{throw new Error('codec probe failed');};try{await exportVideo({from:0,to:0,sound:false});}catch(error){return{error:error.message,released:exporting===null};}finally{VideoEncoder.isConfigSupported=original;}});
   assert.match(result.error,/no video encoder/);assert.equal(result.released,true);
  });
  await t.test('Cancel and Escape wake an export waiting in a hidden tab', async () => {
   const result = await page.evaluate(async () => {
    const descriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
    const results = [];
    try {
     for (const escape of [false, true]) {
      const job = exporting = {cancel: false};
      const wait = whileHidden(job).then(() => 'cancelled');
      if (escape) document.querySelector('#exportDlg').dispatchEvent(new Event('cancel', {cancelable: true}));
      else document.querySelector('#exCancel').click();
      results.push({result: await Promise.race([wait, new Promise(resolve => setTimeout(() => resolve('stuck'), 250))]), cancelled: job.cancel, listenerCleared: job.cancelWait === null});
     }
    } finally { exporting = null; if (descriptor) Object.defineProperty(document, 'hidden', descriptor); else delete document.hidden; setTransport(); }
    return results;
   });
   assert.deepEqual(result, [{result: 'cancelled', cancelled: true, listenerCleared: true}, {result: 'cancelled', cancelled: true, listenerCleared: true}]);
  });
  await t.test('annotation focus captures a playing frame and keeps it while typing and saving', async () => {
   await page.evaluate(() => goTo(4)); await page.waitForFunction(() => S.frame === 4);
   await page.locator('#playBtn').click();
   await page.waitForFunction(() => document.querySelector('#stage').contentWindow.__frame().frame > 4);
   await page.locator('[data-note]').focus();
   const frame = await page.evaluate(() => S.frame);
   assert.equal(await page.evaluate(() => S.mode), 'frame');
   assert.equal(await page.evaluate(() => document.querySelector('#stage').contentWindow.__frame().playing), false);
   await page.locator('[data-note]').fill('Captured while playing.');
   await page.waitForTimeout(350);
   assert.equal(await page.evaluate(() => S.frame), frame);
   assert.equal(await page.evaluate(() => document.querySelector('#stage').contentWindow.__frame().frame), frame);
   await page.locator('[data-add-note]').click(); await idle();
   const note = (await read()).project.annotations.at(-1);
   assert.equal(note.frame, frame); assert.equal(note.text, 'Captured while playing.');
  });
  await t.test('keyframe value focus pauses playback at the displayed frame', async () => {
   await page.evaluate(() => goTo(4)); await page.waitForFunction(() => S.frame === 4);
   await page.locator('#playBtn').click();
   await page.waitForFunction(() => document.querySelector('#stage').contentWindow.__frame().frame > 4);
   await page.locator('[data-key-value]').focus();
   const frame = await page.evaluate(() => S.frame);
   await page.locator('[data-key-value]').fill('3');
   await page.waitForTimeout(350);
   assert.equal(await page.evaluate(() => S.mode), 'frame');
   assert.equal(await page.evaluate(() => document.querySelector('#stage').contentWindow.__frame().frame), frame);
   await page.locator('[data-set-key]').click(); await idle();
   assert.equal((await read()).project.shots[0].entities[0].keyframes.zoom.find(key => key.frame === frame)?.value, 3);
  });
  assert.deepEqual(errors, []);
 } finally {
  await browser.close();
  instance.closeAllConnections(); await new Promise(resolve => instance.close(resolve));
  rmSync(dir, {recursive: true, force: true}); rmSync(config, {recursive: true, force: true});
 }
});
