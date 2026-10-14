import {validatePropertyValue} from './core/component-schema.mjs';
import {mountSelectionTools} from './selection-tools.mjs';
import {mountSceneTools} from './scene-tools.mjs';
import {mountEditorTools} from './editor-tools.mjs';
import {entitySchema, evaluateEntity, layerTree, evaluatedLayers, isLayerLocked} from './core/project.mjs';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const label = value => ({camera2d: '2D camera', object2d: 'Object', layer2d: 'Visual layer', group: 'Group', camera3d: '3D camera', audio: 'Audio', audioCue: 'Audio clip', fadeIn: 'Fade in', fadeOut: 'Fade out', x: 'Horizontal position', y: 'Vertical position', zoom: 'Zoom', scale: 'Scale', rotation: 'Rotation', opacity: 'Opacity', gain: 'Volume', muted: 'Muted', az: 'Azimuth', el: 'Elevation', distance: 'Distance', fov: 'Field of view'}[value] || value);
const requestId = () => crypto.randomUUID();

export function createEditor({container, layerContainer, getFrame, isExporting, jump, pause, isVisible, onSaved, showInspector, setPreview, canFollow, markRegion, getImageContext, windowOf, onSelectionChange}) {
 const states = new Map();
 let active = null, mounted = null;
 const dirty = s => Object.keys(s.extraDrafts||{}).length > 0 || Object.keys(s.cueDrafts||{}).length > 0 || Object.keys(s.fields).length > 0 || !!s.note.trim() || s.keyDirty;
 const stateFor = work => {
  if (!states.has(work.id)) states.set(work.id, {work, data: null, incoming: null, fields: {}, note: '', shotId: '', entityId: '', keyProperty: '', keyValue: '', keyDirty: false, easing: 'linear', loading: false, busy: false, error: '', message: '', conflict: false, selection: [], collapsed: new Set(), soloId: null, followPlayhead: true, lastFrame: null});
  return states.get(work.id);
 };
 const selected = s => {
  const shots = s.data?.project.shots || [], shot = shots.find(x => x.id === s.shotId) || shots[0];
  const entity = shot?.entities.find(x => x.id === s.entityId) || shot?.entities[0];
  let start = 0; for (const x of shots) { if (x === shot) break; start += x.durationFrames; }
  return {shot, entity, start, local: getFrame() - start};
 };
 async function api(url, body) {
  const response = await fetch(url, body ? {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)} : undefined);
  const value = await response.json();
  if (!response.ok) throw Object.assign(new Error(value.error || `Request failed (${response.status})`), {status: response.status});
  return value;
 }
 const shown = s => active === s && isVisible();
 function fieldValue(s, key, saved) { return Object.hasOwn(s.fields, key) ? s.fields[key] : saved; }
 function setField(s, key, value, saved) {
  if (String(value) === String(saved)) delete s.fields[key]; else s.fields[key] = value;
  s.error = ''; s.message = ''; update();
 }
 function normalize(s) {
  const {shot, entity} = selected(s);
  s.shotId = shot?.id || ''; s.entityId = entity?.id || '';
  const schema = entity ? entitySchema(s.data.project,entity) : {};
  if (!schema[s.keyProperty]?.animatable) { s.keyProperty = Object.keys(schema).find(key => schema[key].animatable) || ''; s.keyDirty = false; }
  s.selection = s.selection.filter(id => shot?.layerOrder?.includes(id));
  if (s.soloId && !s.data?.project.shots.some(shot => shot.layerOrder?.includes(s.soloId))) s.soloId = null;
 }
 async function refresh(s, {review = false} = {}) {
  if (s.loading) return;
  s.loading = true;
  try {
   const next = await api('api/project?work=' + encodeURIComponent(s.work.id));
   if (s.data && next.generation < s.data.generation) return;
   if (s.data && !review && (s.conflict || (next.revision !== s.data.revision && dirty(s)))) {
    s.incoming = next; s.conflict = true; s.error = 'The project changed while you were editing. Your draft is kept. Review the latest version before applying it.';
    if (active === s) update();
   } else {
    const changed = !s.data || next.revision !== s.data.revision;
    s.data = next; s.incoming = null; s.conflict = false; s.error = '';
    if (review) s.message = 'Latest version loaded. Your draft is kept; compare the saved values before applying.';
    normalize(s);
    if (active === s && (changed || review || mounted !== s)) render(s);
   }
  } catch (error) {
   s.error = error.status === 404 ? 'This work uses its existing source controls. The managed editor is not available for it yet.' : error.message;
   if (active === s) render(s);
  } finally { s.loading = false; if (active === s) update(); }
 }
 function render(s) {
  if (active === s) renderLayers(s);
  if (!shown(s)) return;
  mounted = s;
  if (!s.data) { container.innerHTML = `<section class="editor"><h3>Editor</h3><p role="status">${esc(s.error || 'Loading project…')}</p><button class="btn" data-retry>Refresh</button></section>`; container.querySelector('[data-retry]').onclick = () => refresh(s); return; }
  normalize(s);
  const {shot, entity, start} = selected(s), project = s.data.project, schema = entity ? entitySchema(s.data.project,entity) : {};
  const readOnly = entity?.legacy?.readOnly || (entity?.layer && isLayerLocked(shot, entity.id));
  const numberInput = (key, value, def) => `<input data-field="${esc(key)}" type="number" value="${esc(fieldValue(s, key, value))}" min="${def.min}" max="${def.max}" step="${def.step || 'any'}" required>`;
  const props = Object.entries(schema).map(([key, def]) => {
   const draftKey = `property|${entity.id}|${key}`, value = entity.properties[key], input = def.type === 'boolean'
    ? `<input data-field="${esc(draftKey)}" type="checkbox" ${fieldValue(s, draftKey, value) ? 'checked' : ''}>`
    : def.type==='enum' ? `<select data-field="${esc(draftKey)}">${def.options.map(v=>`<option value="${esc(v)}" ${fieldValue(s,draftKey,value)===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`
    : ['string','color'].includes(def.type) ? `<input data-field="${esc(draftKey)}" type="${def.type==='color'?'color':'text'}" value="${esc(fieldValue(s,draftKey,value))}" ${def.maxLength?`maxlength="${def.maxLength}"`:''}>`
    : numberInput(draftKey, value, def);
   return `<div class="editor-property"><label>${esc(def.label||label(key))}${def.unit ? ` <span class="mut">(${esc(def.unit)})</span>` : ''}${input}</label><small class="mut">Saved base: ${esc(value)}${entity.keyframes[key]?.length ? ' · animated' : ''}</small>${def.animatable ? `<small data-evaluated="${esc(key)}" class="editor-evaluated"></small>` : ''}</div>`;
  }).join('');
  container.innerHTML = `<section class="editor" aria-label="Project editor">
   <div class="editor-header"><div><h3>Editor</h3><strong class="editor-selection-context" data-selection-context></strong><span class="small mut" data-version></span></div><div class="editor-actions"><button class="btn" data-undo>Undo</button><button class="btn" data-redo>Redo</button></div></div>
   <p class="editor-status small" role="status" aria-live="polite" data-status></p>
   <div class="editor-conflict" data-conflict hidden><p role="alert" data-error></p><button class="btn" data-review>Review latest version</button></div>
   <form data-properties><details class="shot-details" ${entity?.layer ? '' : 'open'}><summary>Shot · ${esc(shot.name)} · ${shot.durationFrames} frames</summary><fieldset data-edit-fields><legend>Shot</legend>
    <label>Selected shot<select data-shot>${project.shots.map((x, i) => `<option value="${esc(x.id)}" ${x.id === shot.id ? 'selected' : ''}>${i + 1}. ${esc(x.name)}</option>`).join('')}</select></label>
    <div class="editor-actions"><button class="btn" type="button" data-jump-shot>Go to shot</button><button class="btn" type="button" data-current-shot>Select shot at playhead</button><button class="btn" type="button" data-prev-shot data-requires-op="moveShot">Move earlier</button><button class="btn" type="button" data-next-shot data-requires-op="moveShot">Move later</button></div>
    <label data-requires-op="renameShot">Name<input data-field="name|${esc(shot.id)}" value="${esc(fieldValue(s, `name|${shot.id}`, shot.name))}" maxlength="200" required></label>
    <label data-requires-op="trimShot">Duration (frames)${numberInput(`duration|${shot.id}`, shot.durationFrames, {min: 1, max: 36000, step: 1})}</label>
    <p class="small mut" data-requires-op="trimShot">Stretch changes animation and cue timing with the scene. Trim keeps animation speed.</p>
    ${s.data.capabilities.operations.includes('trimShot') ? '' : `<p class="small mut">${shot.durationFrames} frames · shot timing follows the authored soundtrack.</p>`}
   </fieldset></details><fieldset data-edit-fields data-inspector><legend>Inspector</legend>
    <label>Selected element<select data-entity><optgroup label="Cameras and audio">${shot.entities.filter(e => !e.layer).map(e => `<option value="${esc(e.id)}" ${e.id === entity?.id ? 'selected' : ''}>${esc(e.name)} · ${esc(label(e.type))}</option>`).join('')}</optgroup><optgroup label="Visual layers">${shot.entities.filter(e => e.layer).map(e => `<option value="${esc(e.id)}" ${e.id === entity?.id ? 'selected' : ''}>${esc(e.name)} · ${esc(label(e.type))}</option>`).join('')}</optgroup></select></label>
    ${readOnly ? `<p class="editor-lock-notice" data-locked-notice>${esc(entity.legacy?.reason || 'This layer is locked. Unlock it or its parent group in Layers to edit.')}</p>` : ''}
    ${entity?.layer ? `<div class="editor-layer-settings" data-layer-settings>
     <label>Layer name<input data-field="layerName|${esc(entity.id)}" value="${esc(fieldValue(s, `layerName|${entity.id}`, entity.name))}" maxlength="200" required></label>
     <div class="editor-pair"><label>In frame<input type="number" data-field="layer|${esc(entity.id)}|startFrame" value="${esc(fieldValue(s, `layer|${entity.id}|startFrame`, entity.layer.startFrame))}" min="0" max="${shot.durationFrames - 1}" step="1" required></label><label>Out frame (exclusive)<input type="number" data-field="layer|${esc(entity.id)}|endFrame" value="${esc(fieldValue(s, `layer|${entity.id}|endFrame`, entity.layer.endFrame))}" min="1" max="${shot.durationFrames}" step="1" required></label></div>
     <p class="small mut">Visibility window within this shot: visible from In, hidden at Out. This does not change the timing of the animation.</p>
     ${entity.type === 'layer2d' ? `<label>Coordinate space<select data-field="layer|${esc(entity.id)}|space"><option value="world" ${fieldValue(s, `layer|${entity.id}|space`, entity.layer.space) === 'world' ? 'selected' : ''}>World · follows the camera</option><option value="screen" ${fieldValue(s, `layer|${entity.id}|space`, entity.layer.space) === 'screen' ? 'selected' : ''}>Screen · fixed to the frame</option></select></label>` : '<p class="small mut">A group organizes layers. Visibility, lock and timing apply to its descendants.</p>'}
    </div>` : ''}
    <div class="editor-properties" data-requires-op="setProperty">${props || '<p class="mut">No editable elements in this shot.</p>'}</div>
   </fieldset><div class="editor-actions editor-apply"><button class="btn primary" type="submit" data-apply>Apply changes</button><button class="btn" type="button" data-discard>Discard field changes</button></div></form>
   <fieldset data-edit-fields ${s.keyProperty ? '' : 'hidden'}><legend>Keyframe</legend>
    <p class="small" data-frame></p><label>Property<select data-key-property>${Object.entries(schema).filter(([, def]) => def.animatable).map(([key]) => `<option value="${esc(key)}" ${key === s.keyProperty ? 'selected' : ''}>${esc(label(key))}</option>`).join('')}</select></label>
    <div class="editor-pair"><label>Value<input type="number" data-key-value step="any" required></label><label>Interpolation<select data-easing><option value="linear">Linear</option><option value="ease">Ease in / out</option><option value="hold">Hold</option></select></label></div>
    <div class="editor-actions"><button class="btn" data-set-key data-requires-op="setKeyframe">Set at current frame</button><button class="btn" data-delete-key data-requires-op="deleteKeyframe">Delete keyframe</button></div>
    <div class="editor-key-list" data-key-list></div>
   </fieldset>
   <fieldset data-edit-fields><legend>Frame annotations</legend><p class="small mut">Saved with a shot and frame. AI tools can read the same annotations and project context.</p>
    <label>Annotation<textarea data-note maxlength="4000" placeholder="Describe the change you want at this frame…">${esc(s.note)}</textarea></label>
    <label class="editor-check"><input type="checkbox" data-note-target ${s.attachTarget === false ? '' : 'checked'}> Attach to selected element</label>
    <div class="editor-actions"><button class="btn" data-region>Mark region</button><button class="btn" data-clear-region ${s.noteRegion?'':'hidden'}>Clear region</button></div><p class="small mut" data-region-info>${s.noteRegion?`Region marked at sequence frame ${s.regionFrame}`:''}</p>
    <div class="editor-actions"><button class="btn" data-add-note data-requires-op="addAnnotation">Save annotation</button><button class="btn" data-copy-context>Copy AI context</button></div>
   </fieldset><div data-note-list></div>
   <details class="editor-history"><summary>Change history <span data-history-count></span></summary><ol data-history></ol></details>
  </section>`;
  container.querySelector('[data-shot]').onchange = event => { s.shotId = event.target.value; s.entityId = ''; s.selection = []; s.keyDirty = false; s.followPlayhead = false; render(s); preview(s); };
  container.querySelector('[data-entity]').onchange = event => { s.entityId = event.target.value; s.selection = shot.layerOrder?.includes(s.entityId) ? [s.entityId] : []; s.keyDirty = false; render(s); preview(s); };
  for (const input of container.querySelectorAll('[data-field]')) input.oninput = () => {
   const [kind, id, key] = input.dataset.field.split('|');
   const saved = kind === 'name' ? shot.name : kind === 'duration' ? shot.durationFrames : kind === 'layerName' ? entity.name : kind === 'layer' ? entity.layer[key] : entity.properties[key];
   setField(s, input.dataset.field, input.type === 'checkbox' ? input.checked : input.value, saved);
  };
  container.querySelector('[data-properties]').onsubmit = event => { event.preventDefault(); try { transact(s, operationsForFields(s), 'Update shot and inspector', () => { s.fields = {}; }); } catch (error) { s.error = error.message; update(); } };
  container.querySelector('[data-discard]').onclick = () => { s.fields = {}; s.extraDrafts={}; s.cueDrafts={}; s.error = ''; render(s); };
  container.querySelector('[data-jump-shot]').onclick = () => jump(start);
  container.querySelector('[data-current-shot]').onclick = () => {
   let start = 0;
   for (const shot of project.shots) {
    if (getFrame() >= start && getFrame() < start + shot.durationFrames) { s.shotId = shot.id; s.entityId = ''; s.selection = []; s.keyDirty = false; render(s); preview(s); break; }
    start += shot.durationFrames;
   }
  };
  for (const [selector, offset] of [['[data-prev-shot]', -1], ['[data-next-shot]', 1]]) container.querySelector(selector).onclick = () => transact(s, [{type: 'moveShot', shotId: shot.id, index: project.shots.indexOf(shot) + offset}], 'Move shot');
  container.querySelector('[data-undo]').onclick = () => transact(s, [], 'Undo', null, 'undo');
  container.querySelector('[data-redo]').onclick = () => transact(s, [], 'Redo', null, 'redo');
  container.querySelector('[data-review]').onclick = () => refresh(s, {review: true});
  container.querySelector('[data-key-property]').onchange = event => { s.keyProperty = event.target.value; s.keyDirty = false; update(); };
  const captureFrame = () => { if (isExporting()) return; pause?.(); update(); };
  container.querySelector('[data-key-value]').onfocus = captureFrame;
  container.querySelector('[data-key-value]').oninput = event => { s.keyValue = event.target.value; s.keyDirty = true; update(); };
  container.querySelector('[data-easing]').value = s.easing;
  container.querySelector('[data-easing]').onchange = event => { s.easing = event.target.value; s.keyValue = container.querySelector('[data-key-value]').value; s.keyDirty = true; update(); };
  container.querySelector('[data-set-key]').onclick = () => {
   const input = container.querySelector('[data-key-value]'); if (!input.reportValidity()) return;
   const {local} = selected(s);
   transact(s, [{type: 'setKeyframe', targetId: entity.id, property: s.keyProperty, frame: local, value: Number(input.value), easing: s.easing}], 'Set keyframe', () => { s.keyDirty = false; });
  };
  container.querySelector('[data-delete-key]').onclick = () => transact(s, [{type: 'deleteKeyframe', targetId: entity.id, property: s.keyProperty, frame: selected(s).local}], 'Delete keyframe', () => { s.keyDirty = false; });
  container.querySelector('[data-note]').oninput = event => { s.note = event.target.value; update(); };
  container.querySelector('[data-note]').onfocus = captureFrame;
  container.querySelector('[data-note-target]').onchange = event => { s.attachTarget = event.target.checked; };
  container.querySelector('[data-region]').onclick=()=>{captureFrame();const frame=getFrame();markRegion?.(region=>{s.noteRegion=region;s.regionFrame=frame;render(s);});};
  container.querySelector('[data-clear-region]').onclick=()=>{s.noteRegion=null;render(s);};
  container.querySelector('[data-add-note]').onclick = () => transact(s, [{type: 'addAnnotation', id: 'note-' + requestId(), shotId: shot.id, frame: selected(s).local, text: s.note.trim(), ...(s.noteRegion?{region:s.noteRegion}:{}), ...(s.attachTarget !== false && entity ? {targetId: entity.id} : {})}], 'Add frame annotation', () => { s.note = '';s.noteRegion=null; });
  container.querySelector('[data-copy-context]').onclick = async () => {
   try {
    const context = await api(`api/context?work=${encodeURIComponent(s.work.id)}&frame=${getFrame()}`);
    const renderedFrame=await getImageContext?.(context);
    await navigator.clipboard.writeText(JSON.stringify({...context,...(renderedFrame?{renderedFrame}:{}),humanSelection: {shotId: s.shotId, targetId: s.entityId}}, null, 2));
    s.message = 'Current project context copied.'; s.error = '';
   } catch (error) { s.error = 'Context could not be copied: ' + error.message; }
   update();
  };
  mountSelectionTools({container,s,shot,windowOf,getFrame,commit:(ops,name)=>{if(!dirty(s))return transact(s,ops,name);}});
  mountSceneTools({container,s,shot,commit:(ops,name,done)=>{if(!dirty(s))return transact(s,ops,name,done);}});
  mountEditorTools({container,s,shot,entity,api,update,getFrame,commit:(ops,name,done,actor,revision)=>transact(s,ops,name,done,null,actor,revision??s.data.revision)});
  renderLists(s); update();
 }
 function operationsForFields(s) {
  const operations = [], patches = new Map();
  for (const [draftKey, value] of Object.entries(s.fields)) {
   const [kind, id, property] = draftKey.split('|');
   if (kind === 'name') { if (!String(value).trim()) throw new Error('Shot name is required.'); operations.push({type: 'renameShot', shotId: id, name: value}); }
   else if (kind === 'duration') {
    const number = Number(value); if (!String(value).trim() || !Number.isInteger(number) || number < 1 || number > 36000) throw new Error('Shot duration must be a whole number from 1 to 36000.');
    operations.push({type: s.timingMode==='trim'&&s.data.capabilities.operations.includes('trimScene')?'trimScene':'stretchShot', shotId: id, durationFrames: number});
   } else if (kind === 'layerName') {
    if (!String(value).trim()) throw new Error('Layer name is required.');
    operations.push({type: 'renameLayer', targetId: id, name: value});
   } else if (kind === 'layer') {
    const patch = patches.get(id) || {};
    if (property === 'space') patch[property] = value;
    else {
     const number = Number(value);
     if (!String(value).trim() || !Number.isSafeInteger(number)) throw new Error('Layer in and out frames must be whole numbers.');
     patch[property] = number;
    }
    patches.set(id, patch);
   } else {
    const entity = s.data.project.shots.flatMap(shot => shot.entities).find(e => e.id === id), def = entitySchema(s.data.project,entity)[property];
    const number = def.type === 'number' ? Number(value) : value;
    if(def.type==='number'&&!String(value).trim())throw new Error('A number is required.');
    validatePropertyValue(def,number);
    operations.push({type: 'setProperty', targetId: id, property, value: number});
   }
  }
  for (const [targetId, patch] of patches) operations.push({type: 'setLayer', targetId, patch});
  if (!operations.length) throw new Error('No field changes to apply.');
  return operations;
 }
 async function transact(s, operations, name, committed, action, actor='human', baseRevision=s.data.revision) {
  if (s.busy || s.conflict || isExporting()) return;
  s.busy = true; s.error = ''; s.message = 'Saving…'; update();
  try {
   const data = await api(action ? 'api/history' : 'api/operations', {work: s.work.id, baseRevision, requestId: requestId(), actor, label: name, ...(action ? {action} : {operations})});
   s.data = data; committed?.(); s.incoming = null; s.conflict = false; s.message = 'Saved · ' + name;
   normalize(s); if (active === s) { render(s); preview(s); } onSaved?.(s.work.id, name); return data;
  } catch (error) {
   s.error = error.message; s.message = '';
   if (error.status === 409) { s.conflict = true; await refresh(s); }
  } finally { s.busy = false; if (active === s) update(); }
 }
 function renderLists(s) {
  const notes = container.querySelector('[data-note-list]');
  notes.innerHTML = s.data.project.annotations.map(note => {
   const shot = s.data.project.shots.find(x => x.id === note.shotId);
   return `<article class="editor-note${note.status === 'resolved' ? ' resolved' : ''}"><div class="editor-actions"><button class="linkish" data-note-jump="${esc(note.id)}">${esc(shot.name)} · frame ${note.frame}</button><span class="small mut">${esc(note.status)}</span></div><p>${esc(note.text)}</p><button class="btn" data-requires-op="resolveAnnotation" data-note-resolve="${esc(note.id)}">${note.status === 'open' ? 'Resolve' : 'Reopen'}</button></article>`;
  }).join('') || '<p class="small mut">No frame annotations yet.</p>';
  notes.onclick = event => {
   const button = event.target.closest('button'); if (!button) return;
   const note = s.data.project.annotations.find(n => n.id === (button.dataset.noteJump || button.dataset.noteResolve));
   if (button.dataset.noteJump) { let start = 0; for (const shot of s.data.project.shots) { if (shot.id === note.shotId) break; start += shot.durationFrames; } s.shotId = note.shotId; if (note.targetId) s.entityId = note.targetId; jump(start + note.frame); render(s); }
   else transact(s, [{type: 'resolveAnnotation', id: note.id, resolved: note.status !== 'resolved'}], 'Update annotation');
  };
  container.querySelector('[data-history-count]').textContent = `(${s.data.history.entries.length})`;
  container.querySelector('[data-history]').innerHTML = [...s.data.history.entries].reverse().slice(0, 20).map(entry => `<li><strong>${esc(entry.label || 'Change')}</strong><small>${esc(entry.actor?.kind || entry.actor || 'unknown')} · ${esc(new Date(entry.at).toLocaleString())}</small></li>`).join('') || '<li>No saved changes yet.</li>';
 }
 function preview(s) {
  if (active !== s || isExporting()) return;
  const {entity} = selected(s);
  setPreview?.({soloId: s.soloId, selectedId: entity?.layer ? entity.id : null}, entity?.layer ? entity.name : '');
  onSelectionChange?.();
 }
 function layerSelection(s, id, multiple = false) {
  if (isExporting() || dirty(s)) return;
  const {shot} = selected(s);
  if (!shot?.layerOrder?.includes(id)) return;
  pause?.();
  s.entityId = id; s.keyDirty = false;
  s.selection = multiple ? (s.selection.includes(id) ? s.selection.filter(value => value !== id) : [...s.selection, id]) : [id];
  showInspector?.(); render(s); preview(s); container.scrollTop = 0;
 }
 function layerFacts(s) {
  const {shot, entity, local} = selected(s);
  const records = shot?.layerOrder ? evaluatedLayers(shot, Math.max(0, Math.min(shot.durationFrames - 1, local))) : [];
  const byId = new Map(records.map(record => [record.id, record]));
  const siblings = id => { const target = byId.get(id); return records.filter(record => record.layer.parentId === target?.layer.parentId).map(record => record.id); };
  const subtreeLocked = id => records.some(record => (record.id === id || record.parentIds.includes(id)) && record.effectiveLocked);
  const ids = s.selection.filter(id => byId.has(id));
  const selectedEntity = ids.length === 1 ? byId.get(ids[0]) : null;
  const selectedSiblings = ids.length ? siblings(ids[0]) : [];
  const indices = ids.map(id => selectedSiblings.indexOf(id)).sort((a, b) => a - b);
  const canGroup = ids.length >= 2 && indices.every((value, i) => value >= 0 && (!i || value === indices[i - 1] + 1)) && !ids.some(subtreeLocked);
  return {shot, entity, records, byId, siblings, subtreeLocked, ids, selectedEntity, canGroup, inside: local >= 0 && local < shot.durationFrames};
 }
 function renderLayers(s) {
  if (!layerContainer || active !== s) return;
  if (!s.data) { layerContainer.innerHTML = `<p class="small mut" role="status">${esc(s.error || 'Loading layers…')}</p>`; return; }
  normalize(s);
  const {shot} = selected(s);
  const rows = (nodes, depth = 0) => [...nodes].reverse().map(({entity, children}) => {
   const collapsed = s.collapsed.has(entity.id), group = entity.type === 'group';
   return `<div class="layer-node" data-layer-id="${esc(entity.id)}" role="treeitem" aria-level="${depth + 1}" aria-selected="${s.selection.includes(entity.id)}" ${group ? `aria-expanded="${!collapsed}"` : ''} style="--layer-depth:${depth}">
    <div class="layer-title"><input type="checkbox" data-layer-check="${esc(entity.id)}" aria-label="Select ${esc(entity.name)} for grouping" ${s.selection.includes(entity.id) ? 'checked' : ''}>
     ${group ? `<button class="layer-disclosure" data-layer-collapse="${esc(entity.id)}" aria-label="${collapsed ? 'Expand' : 'Collapse'} ${esc(entity.name)}">${collapsed ? '▸' : '▾'}</button>` : '<span class="layer-kind" aria-hidden="true">▱</span>'}
     <button class="layer-name" data-layer-select="${esc(entity.id)}" title="${esc(entity.name)}">${esc(entity.name)}</button></div>
    <div class="layer-tools"><button class="btn" data-layer-visible="${esc(entity.id)}" aria-label="${entity.layer.visible ? 'Hide' : 'Show'} ${esc(entity.name)}" aria-pressed="${entity.layer.visible}">${entity.layer.visible ? 'Visible' : 'Hidden'}</button><button class="btn" data-layer-lock="${esc(entity.id)}" aria-label="${entity.layer.locked ? 'Unlock' : 'Lock'} ${esc(entity.name)}" aria-pressed="${entity.layer.locked}">${entity.layer.locked ? 'Locked' : 'Lock'}</button><button class="btn" data-layer-solo="${esc(entity.id)}" aria-label="Solo preview ${esc(entity.name)}" aria-pressed="${s.soloId === entity.id}">Solo</button></div>
    <small class="layer-state" data-layer-state="${esc(entity.id)}"></small>
   </div>${group && !collapsed ? rows(children, depth + 1) : ''}`;
  }).join('');
  layerContainer.innerHTML = `<div class="layers-header"><label class="editor-check"><input type="checkbox" data-follow-playhead ${s.followPlayhead ? 'checked' : ''}> Follow playhead</label><label>Shot<select data-layer-shot>${s.data.project.shots.map(shot => `<option value="${esc(shot.id)}" ${shot.id === s.shotId ? 'selected' : ''}>${esc(shot.name)}</option>`).join('')}</select></label><button class="btn" data-layer-playhead>Select shot at playhead</button></div>
   <div class="editor-actions"><button class="btn" data-quick-text>Add text</button><button class="btn" data-quick-media>Import media</button></div>
   <p class="small mut">Top layers draw in front. Click the canvas to select a subject; Alt-click selects the top painted layer. Use checkboxes to group layers.</p>
   <p class="layers-status small" role="status" aria-live="polite" data-layers-status></p>
   <div class="layer-preview-notice" data-solo-notice hidden><strong>Solo preview</strong><p>Export uses all authored visible layers.</p><button class="btn" data-clear-solo>Show composition</button></div>
   <div class="layers-toolbar" role="group" aria-label="Layer actions"><button class="btn" data-layer-up>Move up</button><button class="btn" data-layer-down>Move down</button><button class="btn" data-layer-group>Group selected</button><button class="btn" data-layer-ungroup>Ungroup</button></div>
   <div class="layer-tree" role="tree" aria-label="Visual layers, front to back" aria-multiselectable="true">${shot.layerOrder?.length ? rows(layerTree(shot)) : '<p class="small mut">This shot has no editable visual layers. Cameras and audio remain in the Inspector.</p>'}</div>
   <button class="btn" data-layer-inspector>Open Inspector</button>`;
  for(const [from,to] of [['[data-quick-text]','[data-new-text]'],['[data-quick-media]','[data-import]']])layerContainer.querySelector(from).onclick=()=>{showInspector?.();render(s);container.querySelector(to)?.click();};
  layerContainer.querySelector('[data-follow-playhead]').onchange = event => { s.followPlayhead = event.target.checked; s.lastFrame = null; update(); };
  layerContainer.querySelector('[data-layer-shot]').onchange = event => { s.shotId = event.target.value; s.entityId = ''; s.selection = []; s.keyDirty = false; s.followPlayhead = false; render(s); preview(s); };
  layerContainer.querySelector('[data-layer-playhead]').onclick = () => {
   let start = 0;
   for (const shot of s.data.project.shots) { if (getFrame() >= start && getFrame() < start + shot.durationFrames) { s.shotId = shot.id; s.entityId = ''; s.selection = []; s.keyDirty = false; render(s); preview(s); break; } start += shot.durationFrames; }
  };
  layerContainer.querySelector('[data-layer-inspector]').onclick = () => { showInspector?.(); render(s); };
  layerContainer.querySelector('[data-clear-solo]').onclick = () => { s.soloId = null; preview(s); update(); };
  layerContainer.querySelector('[data-layer-group]').onclick = () => {
   const facts = layerFacts(s); if (!facts.canGroup) return;
   const groupId = 'group-' + requestId();
   transact(s, [{type: 'groupLayers', shotId: facts.shot.id, targetIds: facts.ids, groupId, name: 'Group'}], 'Group layers', () => { s.selection = [groupId]; s.entityId = groupId; });
  };
  layerContainer.querySelector('[data-layer-ungroup]').onclick = () => {
   const facts = layerFacts(s), group = facts.selectedEntity; if (group?.type !== 'group') return;
   const children = facts.records.filter(record => record.layer.parentId === group.id).map(record => record.id);
   transact(s, [{type: 'ungroupLayer', targetId: group.id}], 'Ungroup layers', () => { s.selection = children; s.entityId = children[0] || ''; });
  };
  for (const [selector, delta] of [['[data-layer-up]', 1], ['[data-layer-down]', -1]]) layerContainer.querySelector(selector).onclick = () => {
   const facts = layerFacts(s), entity = facts.selectedEntity; if (!entity) return;
   transact(s, [{type: 'moveLayer', targetId: entity.id, index: facts.siblings(entity.id).indexOf(entity.id) + delta}], 'Reorder layer');
  };
  layerContainer.querySelector('.layer-tree').onclick = event => {
   const target = event.target;
   if (target.dataset.layerSelect) layerSelection(s, target.dataset.layerSelect, event.ctrlKey || event.metaKey || event.shiftKey);
   if (target.dataset.layerCheck) layerSelection(s, target.dataset.layerCheck, true);
   if (target.dataset.layerCollapse) { const id = target.dataset.layerCollapse; if (s.collapsed.has(id)) s.collapsed.delete(id); else s.collapsed.add(id); renderLayers(s); updateLayerStates(s); }
   for (const [attribute, property] of [['layerVisible', 'visible'], ['layerLock', 'locked']]) if (target.dataset[attribute]) {
    const entity = shot.entities.find(entity => entity.id === target.dataset[attribute]);
    transact(s, [{type: 'setLayer', targetId: entity.id, patch: {[property]: !entity.layer[property]}}], property === 'visible' ? 'Change layer visibility' : 'Change layer lock');
   }
   if (target.dataset.layerSolo && !isExporting()) { s.soloId = s.soloId === target.dataset.layerSolo ? null : target.dataset.layerSolo; preview(s); update(); }
  };
  let dragging = null;
  layerContainer.querySelector('.layer-tree').ondragstart = event => {
   const row = event.target.closest('[data-layer-id]'); if (!row || !row.draggable) { event.preventDefault(); return; }
   dragging = row.dataset.layerId; event.dataTransfer.setData('text/plain', dragging); event.dataTransfer.effectAllowed = 'move';
  };
  layerContainer.querySelector('.layer-tree').ondragover = event => {
   const row = event.target.closest('[data-layer-id]'), facts = layerFacts(s);
   if (dragging && row && facts.siblings(dragging).includes(row.dataset.layerId)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }
  };
  layerContainer.querySelector('.layer-tree').ondrop = event => {
   const row = event.target.closest('[data-layer-id]'), facts = layerFacts(s), id = dragging; dragging = null;
   if (!id || !row || id === row.dataset.layerId || isExporting() || dirty(s) || facts.subtreeLocked(id)) return;
   const index = facts.siblings(id).indexOf(row.dataset.layerId); if (index < 0) return;
   event.preventDefault(); transact(s, [{type: 'moveLayer', targetId: id, index}], 'Reorder layer');
  };
  layerContainer.querySelector('.layer-tree').ondragend = () => { dragging = null; };
  layerContainer.querySelector('.layer-tree').onkeydown = event => {
   if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || event.target.matches('input')) return;
   const names = [...layerContainer.querySelectorAll('[data-layer-select]')], index = names.indexOf(event.target); if (index < 0) return;
   const next = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1 : Math.max(0, Math.min(names.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)));
   names[next].focus(); event.preventDefault(); event.stopPropagation();
  };
  updateLayerStates(s);
 }
 function updateLayerStates(s) {
  if (!layerContainer?.querySelector('[data-layers-status]') || active !== s || !s.data) return;
  const facts = layerFacts(s), exporting = isExporting(), blocked = s.busy || s.conflict || exporting || dirty(s);
  const allowed = type => s.data.capabilities.operations.includes(type);
  for(const el of layerContainer.querySelectorAll('[data-quick-text],[data-quick-media]')){el.hidden=!allowed('addLayer');el.disabled=blocked;}
  layerContainer.querySelector('[data-layers-status]').textContent = exporting ? 'Exporting · layers are read-only.' : s.error || (s.conflict ? 'Review the latest version in the Inspector.' : dirty(s) ? 'Save or discard your draft before changing layers.' : `${facts.ids.length} selected · ${facts.records.filter(record => record.type !== 'group').length} visual layers`);
  layerContainer.querySelector('[data-solo-notice]').hidden = !s.soloId;
  layerContainer.querySelector('[data-clear-solo]').disabled = exporting;
  for (const control of layerContainer.querySelectorAll('[data-layer-shot],[data-layer-playhead],[data-layer-select],[data-layer-check],[data-layer-collapse]')) control.disabled = exporting;
  for (const row of layerContainer.querySelectorAll('[data-layer-id]')) {
   const id = row.dataset.layerId, entity = facts.byId.get(id); if (!entity) continue;
   row.classList.toggle('selected', s.selection.includes(id)); row.classList.toggle('inactive', !facts.inside || !entity.effectiveVisible);
   row.setAttribute('aria-selected', String(s.selection.includes(id)));
   row.draggable = !blocked && allowed('moveLayer') && !facts.subtreeLocked(id);
   row.querySelector('[data-layer-visible]').disabled = blocked || entity.effectiveLocked || !allowed('setLayer');
   row.querySelector('[data-layer-lock]').disabled = s.busy || s.conflict || exporting || (!entity.layer.locked && dirty(s)) || !allowed('setLayer') || entity.parentIds.some(parent => facts.byId.get(parent)?.layer.locked);
   const solo = row.querySelector('[data-layer-solo]'); solo.disabled = exporting; solo.setAttribute('aria-pressed', String(s.soloId === id));
   const states = [entity.type === 'group' ? 'Group' : `${entity.layer.startFrame}–${entity.layer.endFrame}f`, !facts.inside ? 'playhead outside this shot' : !entity.active ? 'outside range' : !entity.effectiveVisible ? 'hidden' : '', entity.effectiveLocked ? 'locked' : ''];
   row.querySelector('[data-layer-state]').textContent = states.filter(Boolean).join(' · ');
  }
  const selected = facts.selectedEntity, siblings = selected ? facts.siblings(selected.id) : [], locked = selected && facts.subtreeLocked(selected.id);
  layerContainer.querySelector('[data-layer-up]').disabled = blocked || !allowed('moveLayer') || !selected || locked || siblings.indexOf(selected.id) === siblings.length - 1;
  layerContainer.querySelector('[data-layer-down]').disabled = blocked || !allowed('moveLayer') || !selected || locked || siblings.indexOf(selected.id) === 0;
  layerContainer.querySelector('[data-layer-group]').disabled = blocked || !allowed('groupLayers') || !facts.canGroup;
  layerContainer.querySelector('[data-layer-ungroup]').disabled = blocked || !allowed('ungroupLayer') || selected?.type !== 'group' || locked;
 }
 function update() {
  const s = active;
  if (s?.data) {
   const frame = getFrame(), ready = canFollow?.() !== false, changed = ready && s.lastFrame !== frame; if(ready)s.lastFrame = frame;
   if (changed && s.followPlayhead && !dirty(s) && !s.busy && !s.conflict && !isExporting()) {
    let start = 0; const previous = selected(s).entity;
    for (const shot of s.data.project.shots) {
     if (frame >= start && frame < start + shot.durationFrames) {
      if (shot.id !== s.shotId) {
       const next = shot.entities.find(e => previous?.layer ? e.layer?.binding === previous.layer.binding : e.type === previous?.type);
       s.shotId = shot.id; s.entityId = next?.id || shot.entities[0]?.id || ''; s.selection = next?.layer ? [next.id] : []; s.keyDirty = false;
       render(s); preview(s); return;
      }
      break;
     }
     start += shot.durationFrames;
    }
   }
   updateLayerStates(s);
  }
  if (!s?.data || !shown(s) || !container.querySelector('[data-version]')) return;
  const {shot, entity, local, start} = selected(s), inside = Number.isInteger(local) && local >= 0 && local < shot.durationFrames;
  const blocked = s.busy || s.conflict || isExporting();
  for(const b of container.querySelectorAll('[data-arrange]'))b.disabled=blocked||dirty(s);
  for(const button of container.querySelectorAll('[data-scene-add],[data-scene-copy],[data-scene-delete]'))button.disabled=blocked||dirty(s)||(button.hasAttribute('data-scene-delete')&&s.data.project.shots.length===1);
  const readOnly = entity?.legacy?.readOnly || (entity?.layer && isLayerLocked(shot, entity.id));
  for(const el of container.querySelectorAll('[data-content] input,[data-content] textarea,[data-content] select,[data-content-save],[data-duplicate],[data-remove]'))el.disabled=blocked||readOnly||(['duplicate','remove'].some(k=>Object.hasOwn(el.dataset,k))&&!entity?.layer)||(Object.hasOwn(el.dataset,'duplicate')&&entity?.type==='group');
  for(const el of container.querySelectorAll('[data-new-text],[data-import],[data-cue-save],[data-cue-copy],[data-cue-delete],[data-proposal-apply]'))el.disabled=blocked;
  for(const el of container.querySelectorAll('[data-cue-fields] input,[data-cue-fields] select'))el.disabled=blocked;
  for(const el of container.querySelectorAll('[data-av-tools] button,.audio-mix button,.audio-mix select'))el.disabled=blocked||dirty(s);
  const linked=!!entity?.cue?.linkedVideoId;
  for(const el of container.querySelectorAll('[data-cue-fields] input,[data-cue-save],[data-audio-trim],[data-audio-split]'))el.disabled=blocked||linked||(el.hasAttribute('data-audio-split')&&(!inside||local<=entity.cue.frame||local>=entity.cue.frame+entity.cue.durationFrames))||(el.hasAttribute('data-audio-trim')&&(Object.keys(s.fields).length>0||Object.keys(s.extraDrafts||{}).length>0));
  const detach=container.querySelector('[data-audio-detach]');if(detach)detach.disabled ||= !linked;
  for (const control of container.querySelectorAll('[data-requires-op]')) control.hidden = !s.data.capabilities.operations.includes(control.dataset.requiresOp);
  container.querySelector('[data-selection-context]').textContent = `${shot.name} · ${entity?.name || 'Shot'}`;
  container.querySelector('[data-version]').textContent = `Version ${s.data.revision.slice(0, 8)}`;
  container.querySelector('[data-status]').textContent = isExporting() ? 'Export in progress · editing is paused.' : s.busy ? 'Saving…' : Object.keys(s.fields).length ? `${Object.keys(s.fields).length} field change(s) not saved` : Object.keys(s.extraDrafts||{}).length ? 'Content draft not saved · Apply content or discard field changes' : Object.keys(s.cueDrafts||{}).length ? 'Sound draft not saved · Apply sound cue or discard field changes' : s.keyDirty ? 'Keyframe value not saved' : s.note.trim() ? 'Annotation draft not saved' : s.message || 'All field changes saved';
  container.querySelector('[data-conflict]').hidden = !s.error;
  container.querySelector('[data-error]').textContent = s.error;
  container.querySelector('[data-review]').hidden = !s.conflict;
  container.querySelector('[data-review]').disabled = s.loading || isExporting() || s.busy;
  for (const fieldset of container.querySelectorAll('[data-edit-fields]')) fieldset.disabled = blocked;
  for (const control of container.querySelectorAll('.editor-properties input,.editor-properties select,[data-layer-settings] input,[data-layer-settings] select,[data-key-value],[data-easing]')) control.disabled = blocked || !!readOnly;
  container.querySelector('[data-apply]').disabled = blocked || !Object.keys(s.fields).length;
  container.querySelector('[data-discard]').disabled = s.busy || isExporting() || (!Object.keys(s.fields).length&&!Object.keys(s.extraDrafts||{}).length&&!Object.keys(s.cueDrafts||{}).length);
  container.querySelector('[data-undo]').disabled = blocked || dirty(s) || !s.data.history.canUndo;
  container.querySelector('[data-redo]').disabled = blocked || dirty(s) || !s.data.history.canRedo;
  container.querySelector('[data-prev-shot]').disabled = blocked || s.data.project.shots[0] === shot;
  container.querySelector('[data-next-shot]').disabled = blocked || s.data.project.shots.at(-1) === shot;
  container.querySelector('[data-frame]').textContent = inside ? `Sequence frame ${getFrame()} · shot frame ${local}` : 'Move the playhead into this shot to add a keyframe or annotation.';
  container.querySelector('[data-current-shot]').hidden = inside;
  container.querySelector('[data-add-note]').disabled = blocked || !inside || !s.note.trim() || (s.noteRegion&&s.regionFrame!==getFrame());
  container.querySelector('[data-region]').disabled=blocked||!inside||!markRegion;
  container.querySelector('[data-clear-region]').disabled=blocked;
  for (const button of container.querySelectorAll('[data-note-resolve]')) button.disabled = blocked;
  const def = (s.data.capabilities.entitySchemas?.[entity?.id]||s.data.capabilities.entityTypes[entity?.type])?.[s.keyProperty];
  const values = entity ? evaluateEntity(entity, Math.max(0, Math.min(shot.durationFrames - 1, local))) : {};
  for (const text of container.querySelectorAll('[data-evaluated]')) text.textContent = inside ? `At frame ${local}: ${Number(values[text.dataset.evaluated].toFixed(4))}` : 'Playhead outside this shot';
  const input = container.querySelector('[data-key-value]');
  if (def) {
   input.min = def.min; input.max = def.max;
   if (!s.keyDirty) { input.value = values[s.keyProperty]; s.keyValue = input.value; }
   else if (document.activeElement !== input) input.value = s.keyValue;
  }
  const keys = entity?.keyframes[s.keyProperty] || [], current = keys.find(k => k.frame === local);
  container.querySelector('[data-set-key]').disabled = blocked || readOnly || !inside || !def;
  container.querySelector('[data-set-key]').textContent = current ? 'Update current keyframe' : 'Set at current frame';
  container.querySelector('[data-delete-key]').disabled = blocked || readOnly || !inside || !current;
  const list = container.querySelector('[data-key-list]'), signature = JSON.stringify([s.entityId, s.keyProperty, keys]);
  if (list.dataset.signature !== signature) {
   list.dataset.signature = signature;
   list.innerHTML = keys.map(key => key.frame<0||key.frame>=shot.durationFrames?`<span class="small mut">f${key.frame} · retained outside scene</span>`:`<button class="editor-key btn" data-key-jump="${key.frame}">f${key.frame} · ${key.value} · ${esc(key.easing)}</button>`).join('') || '<span class="small mut">No keyframes. The base value applies throughout the shot.</span>';
   list.onclick = event => { const button = event.target.closest('[data-key-jump]'); if (button) jump(start + Number(button.dataset.keyJump)); };
  }
 }
 return {
  snapshot(){if(!active?.data)return null;return{...selected(active),selection:[...active.selection],generation:active.data.generation,revision:active.data.revision,capabilities:active.data.capabilities,project:active.data.project,work:active.work,blocked:active.busy||active.conflict||dirty(active)||isExporting()};},
  commit(operations,name,{baseRevision}={}){if(!active?.data||dirty(active)||!operations.length)return;return transact(active,operations,name,null,null,'human',baseRevision??active.data.revision);},
  history(action){if(active?.data&&!dirty(active))return transact(active,[],action,null,action);},
  async attach(work) { active = stateFor(work); render(active); await refresh(active); preview(active); },
  async open(work) { active = stateFor(work); const s = active; mounted = null; render(s); await refresh(s); },
  select(targetId) {
   if (!active?.data || isExporting()) return;
   if(dirty(active)){active.message='Save or discard your draft before changing the selection.';update();return;}
   for (const shot of active.data.project.shots) {
    const entity = shot.entities.find(value => value.id === targetId);
    if (shot.id === targetId || entity) { active.shotId = shot.id; active.entityId = entity?.id || ''; active.selection = entity?.layer ? [entity.id] : []; active.keyDirty = false; showInspector?.(); render(active); preview(active); container.scrollTop = 0; break; }
   }
  },
  refresh(workId) { const s = states.get(workId); if (s) return refresh(s); },
  pick(targetId, multiple=false) {
   if (!active?.data || isExporting()) return;
   for (const shot of active.data.project.shots) if (shot.layerOrder?.includes(targetId)) { active.shotId = shot.id; layerSelection(active, targetId, multiple); break; }
  },
  restorePreview(workId) { const s = states.get(workId); if (s === active && s?.data) { normalize(s); preview(s); } },
  update,
 };
}
