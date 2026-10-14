/* Layer editor and preview/export behavior against isolated authored state. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join, relative} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';

const ROOT = new URL('../../', import.meta.url).pathname;
const config = mkdtempSync(join(tmpdir(), 'studio-layers-config-'));
mkdirSync(join(ROOT, 'build'), {recursive: true});
const dir = mkdtempSync(join(ROOT, 'build/layers-ui-')), workDir = relative(ROOT, dir);
const visual = (id, name, binding) => ({id, name, type: 'layer2d', properties: {x: 0, y: 0, scale: 1, rotation: 0, opacity: 1}, keyframes: {}, layer: {binding, parentId: null, space: 'world', visible: true, locked: false, startFrame: 0, endFrame: 120}});
const initial = {id: 'layers-fixture', name: 'Layer fixture', fps: {num: 24, den: 1}, width: 640, height: 360,
 shots: [{id: 'shot-a', name: 'Opening', durationFrames: 120, layerOrder: ['background-a', 'hero-a', 'snow-a'], entities: [
  {id: 'camera-a', name: 'Camera', type: 'camera2d', properties: {x: 0, y: 0, zoom: 1}, keyframes: {}},
  visual('background-a', 'Background', 'background'), visual('hero-a', 'Hero', 'hero'), visual('snow-a', 'Snow', 'snow'),
 ]}, {id: 'shot-b', name: 'Ending', durationFrames: 120, layerOrder: [], entities: []}], annotations: []};
writeFileSync(join(dir, 'project.studio.json'), JSON.stringify({schemaVersion: 2, generation: 0, project: initial, history: {past: [], future: []}, receipts: []}));
writeFileSync(join(dir, 'index.html'), `<!doctype html><style>body{margin:0}canvas{width:100%;height:auto}</style><canvas width="640" height="360"></canvas><script>
let f=0,preview={soloId:null,selectedId:null};const cv=document.querySelector('canvas'),g=cv.getContext('2d');
function draw(){g.fillStyle=preview.soloId?'#bd423c':'#2d7255';g.fillRect(0,0,640,360)}
window.__ready=true;window.__fps=24;window.__totalFrames=240;window.__frameTo=n=>{f=n;draw();return{frame:f}};window.__frame=()=>({frame:f,playing:false});window.__pause=()=>{};
window.__getLayerPreview=()=>({...preview});window.__previewLog=[];
window.__setLayerPreview=value=>{preview={...value};window.__previewLog.push({...preview});draw()};
window.__pickLayer=(x,y)=>{window.__lastPick=[x,y];return x<.5?'hero-a':'snow-a'};
draw();
</script>`);
writeFileSync(join(config, 'works.json'), JSON.stringify({works: [{id: initial.id, name: initial.name, dir: workDir, page: workDir + '/index.html', project: 'project.studio.json', control: 'frameTo', suites: []}]}));
process.env.STUDIO_WORKS = join(config, 'works.json'); process.env.STUDIO_NOTES_DIR = join(config, 'notes'); process.env.STUDIO_LABS_LINES = join(config, 'labs');

test('Human layers share operations, hierarchy, preview and export semantics', async t => {
 const {server} = await import('../server.mjs'); const instance = server();
 await new Promise(resolve => instance.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${instance.address().port}`, browser = await chromium.launch();
 const page = await browser.newPage({viewport: {width: 1440, height: 1100}}); page.setDefaultTimeout(10000);
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 const read = async () => (await fetch(base + '/api/project?work=' + initial.id)).json();
 const generation = async () => (await read()).generation;
 const entity = async id => (await read()).project.shots[0].entities.find(entity => entity.id === id);
 const act = async action => { const before = await generation(); await action(); await page.waitForFunction(async ({base, id, before}) => (await (await fetch(base + '/api/project?work=' + id)).json()).generation > before, {base, id: initial.id, before}); await page.waitForFunction(() => !document.querySelector('[data-status]')?.textContent.includes('Saving')); };
 const select = id => page.locator(`[data-layer-select="${id}"]`).click();
 let groupId;
 try {
  await page.goto(base + '/#layers-fixture/editor'); await page.waitForSelector('[data-layer-id]', {state: 'attached'}); await page.waitForFunction(() => S.ready);
  await page.locator('#sidebar-layers').click();
  await t.test('front-to-back tree selects visual inspector, camera remains available', async () => {
   assert.deepEqual(await page.locator('[data-layer-id]').evaluateAll(rows => rows.map(row => row.dataset.layerId)), ['snow-a', 'hero-a', 'background-a']);
   await select('hero-a'); assert.equal(await page.locator('[data-entity]').inputValue(), 'hero-a');
   assert.equal(await page.locator('[data-field="property|hero-a|rotation"]').isVisible(), true);
   await page.locator('[data-entity]').selectOption('camera-a'); assert.equal(await page.locator('[data-field="property|camera-a|zoom"]').isVisible(), true);
  });
  await t.test('visibility saves, Undo/Redo persist, Solo stays preview-only', async () => {
   await act(() => page.locator('[data-layer-visible="snow-a"]').click()); assert.equal((await entity('snow-a')).layer.visible, false);
   await act(() => page.locator('[data-undo]').click()); assert.equal((await entity('snow-a')).layer.visible, true);
   await act(() => page.locator('[data-redo]').click()); assert.equal((await entity('snow-a')).layer.visible, false);
   await act(() => page.locator('[data-undo]').click());
   const before = await read(); await page.locator('[data-layer-solo="hero-a"]').click();
   assert.equal(await page.locator('[data-solo-notice]').isVisible(), true);
   assert.equal(await page.evaluate(() => document.querySelector('#stage').contentWindow.__getLayerPreview().soloId), 'hero-a');
   assert.equal((await read()).revision, before.revision);
   await page.locator('[data-clear-solo]').click();
  });
  await t.test('accessible reorder and drag reorder preserve a single shared order', async () => {
   await select('hero-a'); await act(() => page.locator('[data-layer-up]').click());
   assert.deepEqual((await read()).project.shots[0].layerOrder, ['background-a', 'snow-a', 'hero-a']);
   await act(() => page.locator('[data-layer-down]').click());
   await act(async () => { await page.locator('[data-layer-id="hero-a"]').dragTo(page.locator('[data-layer-id="snow-a"]')); });
   assert.deepEqual((await read()).project.shots[0].layerOrder, ['background-a', 'snow-a', 'hero-a']);
   await act(() => page.locator('[data-layer-down]').click());
  });
  await t.test('contiguous multi-selection groups and exposes group rename', async () => {
   await select('background-a'); await page.locator('[data-layer-check="snow-a"]').check(); assert.equal(await page.locator('[data-layer-group]').isDisabled(), true);
   await select('hero-a'); await page.locator('[data-layer-check="snow-a"]').check();
   await act(() => page.locator('[data-layer-group]').click());
   const shot = (await read()).project.shots[0]; groupId = shot.entities.find(entity => entity.type === 'group').id;
   assert.deepEqual(shot.layerOrder, ['background-a', groupId, 'hero-a', 'snow-a']);
   assert.equal((await entity('hero-a')).layer.parentId, groupId);
   assert.equal(await page.locator(`[data-layer-id="hero-a"]`).getAttribute('aria-level'), '2');
   await page.locator(`[data-field="layerName|${groupId}"]`).fill('Atmosphere');
   await act(() => page.locator('[data-apply]').click()); assert.equal((await entity(groupId)).name, 'Atmosphere');
   await act(() => page.locator(`[data-layer-visible="${groupId}"]`).click());
   assert.equal((await entity('hero-a')).layer.visible, true); assert.match(await page.locator('[data-layer-state="hero-a"]').textContent(), /hidden/);
   await act(() => page.locator(`[data-layer-visible="${groupId}"]`).click());
  });
  await t.test('group lock reaches descendants and only the group can be unlocked', async () => {
   await act(() => page.locator(`[data-layer-lock="${groupId}"]`).click());
   await select('hero-a');
   assert.equal(await page.locator('[data-field="property|hero-a|x"]').isDisabled(), true);
   assert.equal(await page.locator('[data-layer-lock="hero-a"]').isDisabled(), true);
   assert.equal(await page.locator('[data-layer-up]').isDisabled(), true);
   await act(() => page.locator(`[data-layer-lock="${groupId}"]`).click());
   assert.equal(await page.locator('[data-field="property|hero-a|x"]').isDisabled(), false);
  });
  await t.test('timing, screen space, rename and transforms apply atomically; keyframes stay separate', async () => {
   await select('hero-a'); const before = (await read()).history.entries.length;
   await page.locator('[data-field="layerName|hero-a"]').fill('Lead');
   await page.locator('[data-field="layer|hero-a|startFrame"]').fill('5');
   await page.locator('[data-field="layer|hero-a|endFrame"]').fill('100');
   await page.locator('[data-field="layer|hero-a|space"]').selectOption('screen');
   await page.locator('[data-field="property|hero-a|rotation"]').fill('15');
   await act(() => page.locator('[data-apply]').click());
   const hero = await entity('hero-a'); assert.equal(hero.name, 'Lead'); assert.equal(hero.layer.space, 'screen'); assert.equal(hero.layer.startFrame, 5); assert.equal(hero.layer.endFrame, 100); assert.equal(hero.properties.rotation, 15);
   assert.equal((await read()).history.entries.length, before + 1);
   await page.evaluate(() => goTo(10)); await page.waitForFunction(() => S.frame === 10);
   await page.locator('[data-key-property]').selectOption('rotation'); await page.locator('[data-key-value]').fill('45');
   await act(() => page.locator('[data-set-key]').click()); assert.equal((await entity('hero-a')).keyframes.rotation[0].frame, 10);
   assert.equal((await entity('hero-a')).properties.rotation, 15);
  });
  await t.test('ungroup removes the folder and keeps child order and authored settings', async () => {
   await select(groupId); await act(() => page.locator('[data-layer-ungroup]').click());
   const shot = (await read()).project.shots[0]; assert.deepEqual(shot.layerOrder, ['background-a', 'hero-a', 'snow-a']); assert.equal(shot.entities.some(entity => entity.id === groupId), false);
   assert.equal((await entity('hero-a')).layer.parentId, null); assert.equal((await entity('hero-a')).layer.startFrame, 5);
  });
  await t.test('an AI layer edit preserves Human draft and requires conflict review', async () => {
   await select('hero-a'); await page.locator('[data-field="property|hero-a|x"]').fill('25');
   const current = await read(); const response = await fetch(base + '/api/operations', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({work: initial.id, baseRevision: current.revision, requestId: crypto.randomUUID(), actor: 'ai', label: 'AI layer visibility', operations: [{type: 'setLayer', targetId: 'snow-a', patch: {visible: false}}]})}); assert.equal(response.status, 200);
   await page.evaluate(() => editor.refresh('layers-fixture'));
   assert.equal(await page.locator('[data-apply]').isDisabled(), true); assert.equal(await page.locator('[data-field="property|hero-a|x"]').inputValue(), '25');
   await page.locator('[data-review]').click(); await page.waitForFunction(() => !document.querySelector('[data-apply]').disabled);
   await act(() => page.locator('[data-apply]').click()); assert.equal((await entity('hero-a')).properties.x, 25);
  });
  await t.test('canvas picking uses normalized coordinates and changes only selection', async () => {
   const before = await generation();
   await page.frameLocator('#stage').locator('canvas').click({position: {x: 100, y: 100}});
   assert.equal(await page.locator('[data-entity]').inputValue(), 'hero-a'); assert.equal(await generation(), before);
   const coords = await page.evaluate(() => document.querySelector('#stage').contentWindow.__lastPick); assert.ok(coords.every(value => value >= 0 && value <= 1));
  });
  await t.test('Solo and selection survive source reload and clear only while exporting', async () => {
   await page.locator('[data-layer-solo="hero-a"]').click();
   await page.locator('#exportBtn').click(); assert.match(await page.locator('#exportWhat').textContent(), /all authored visible layers; Solo preview/); await page.locator('#exCancel').click();
   await page.evaluate(() => reloadStage()); await page.waitForFunction(() => S.ready && document.querySelector('#stage').contentWindow.__getLayerPreview().soloId === 'hero-a');
   const outcome=await page.evaluate(async()=>{
    const W=win(),before=W.__getLayerPreview(),original=VideoEncoder.isConfigSupported;let release,calls=0;
    VideoEncoder.isConfigSupported=()=>++calls===1?new Promise(r=>release=r):Promise.resolve({supported:false});
    try{const pending=exportVideo({from:10,to:10,width:160,sound:false}).catch(e=>e.message);while(!release)await new Promise(r=>setTimeout(r,5));const during=W.__getLayerPreview(),frozen=exporting.frozen.page.__getLayerPreview();release({supported:false});await pending;return{before,during,frozen,after:W.__getLayerPreview()};}finally{VideoEncoder.isConfigSupported=original;}
   });
   assert.deepEqual(outcome.during,outcome.before);assert.deepEqual(outcome.frozen,{soloId:null,selectedId:null});assert.deepEqual(outcome.after,outcome.before);
   const success=await page.evaluate(async()=>{const W=win(),before=W.__getLayerPreview();let cleanFrame=false;const blob=await exportVideo({from:10,to:10,width:160,sound:false,onStep:()=>{const p=exporting.frozen.page.__getLayerPreview();cleanFrame=p.soloId===null&&p.selectedId===null;}});return{bytes:blob.size,before,after:W.__getLayerPreview(),cleanFrame};});
   assert.ok(success.bytes>0);assert.equal(success.cleanFrame,true);assert.deepEqual(success.after,success.before);
  });
  await t.test('playhead beyond the selected shot stays readable and marks layers outside the shot', async () => {
   await page.locator('[data-follow-playhead]').uncheck();
   await page.evaluate(() => goTo(130)); await page.waitForFunction(() => S.frame === 130);
   assert.match(await page.locator('[data-layer-state="hero-a"]').textContent(), /outside this shot/);
   assert.equal(await page.locator('[data-layer-id="hero-a"]').evaluate(row => row.classList.contains('inactive')), true);
   assert.equal(await page.locator('[data-set-key]').isDisabled(), true);
   await page.evaluate(() => goTo(10)); await page.waitForFunction(() => S.frame === 10);
  });
  await t.test('cancelling an encoded export restores Solo and selection', async () => {
   const result = await page.evaluate(async () => {
    const W = document.querySelector('#stage').contentWindow, before = W.__getLayerPreview();
    let error;
    try { await exportVideo({from: 10, to: 12, width: 160, sound: false, onStep: () => cancelExport()}); } catch (failure) { error = failure.message; }
    return {before, after: W.__getLayerPreview(), error, released: exporting === null};
   });
   assert.equal(result.error, 'cancelled'); assert.equal(result.released, true); assert.deepEqual(result.after, result.before);
  });
  await t.test('mobile Layers panel stays bounded and keyboard navigation works', async () => {
   await page.setViewportSize({width: 390, height: 844});
   assert.equal(await page.locator('#layers-panel').isVisible(), true);
   const box = await page.locator('#layers-panel').boundingBox(); assert.ok(box.height <= 844 * 0.38 + 1);
   await page.locator('[data-layer-select="snow-a"]').focus(); await page.keyboard.press('ArrowDown');
   assert.equal(await page.evaluate(() => document.activeElement.dataset.layerSelect), 'hero-a');
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  });
  assert.deepEqual(errors, []);
  if (process.env.LAYERS_SCREENSHOT) await page.screenshot({path: process.env.LAYERS_SCREENSHOT, fullPage: true});
 } finally { await browser.close(); instance.closeAllConnections(); await new Promise(resolve => instance.close(resolve)); rmSync(dir, {recursive: true, force: true}); rmSync(config, {recursive: true, force: true}); }
});
