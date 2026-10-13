import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateProject,applyOperations,frameContext} from '../core/project.mjs';
import {createProjectStore} from '../core/store.mjs';
import {frameClock,randomAt} from '../sdk/clock.mjs';
import {createRendererRegistry} from '../sdk/registry.mjs';
import {adaptLegacyPage} from '../sdk/legacy.mjs';
import {rebaseRuntimeState,rebaseRuntimeFile} from '../core/runtime-migration.mjs';
import {digest} from '../core/source-edit.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../projects/sdk-motion/project.studio.json',import.meta.url)));
test('component schema is shared by context and atomic human/AI edits',t=>{
 const root=mkdtempSync(join(tmpdir(),'sdk-core-'));t.after(()=>rmSync(root,{recursive:true,force:true}));mkdirSync(join(root,'work'));
 const file=join(root,'work','project.studio.json');writeFileSync(file,JSON.stringify(fixture()));
 const work={id:'sdk-motion',dir:'work',project:'project.studio.json'},store=createProjectStore(root);
 let state=store.get(work);assert.equal(state.capabilities.entitySchemas['shot-1-title'].color.type,'color');
 assert.equal(store.context(work,24).selection.entities[1].schema.style.type,'enum');
 const start=state.revision;
 const req=(base,ops,actor='human')=>({baseRevision:base,requestId:randomUUID(),operations:ops,actor});
 state=store.transact(work,req(start,[{type:'setProperty',targetId:'shot-1-title',property:'color',value:'#ffffff'}]));
 assert.throws(()=>store.transact(work,req(start,[{type:'setProperty',targetId:'shot-1-title',property:'color',value:'#000000'}],'ai')),e=>e.status===409);
 const bytes=readFileSync(file,'utf8');assert.throws(()=>store.transact(work,req(state.revision,[{type:'setProperty',targetId:'shot-1-title',property:'text',value:'valid'},{type:'setProperty',targetId:'shot-1-title',property:'style',value:'unsupported'}],'ai')));assert.equal(readFileSync(file,'utf8'),bytes);
 const request=req(state.revision,[{type:'addComponent',shotId:'shot-1',component:'badge',id:'new-title'}],'ai');state=store.transact(work,request);assert.equal(state.project.shots[0].entities.at(-1).component,'badge');assert.equal(store.transact(work,request).replayed,true);
 state=store.transact(work,{...req(state.revision,[]),action:'undo'});assert.ok(!state.project.shots[0].entities.some(e=>e.id==='new-title'));
});
test('untrusted schemas cannot override transforms, prototype keys, bounds or keyframe types',()=>{
 const variants=[p=>p.components.badge.properties.x=p.components.badge.properties.radius,
  p=>p.components.badge.properties.text.animatable=true,p=>p.components.badge.properties.radius.min=-Infinity,
  p=>p.components.badge.properties.color.default='url(javascript:alert(1))',p=>p.components.badge.version='latest',
  p=>p.components=JSON.parse('{"constructor":{"version":"1.0.0","label":"bad","properties":{}}}'),
  p=>p.shots[0].entities[1].component='missing',p=>p.shots[0].entities[1].properties.style='other',p=>p.seed=-1];
 for(const mutate of variants){const p=fixture().project;mutate(p);assert.throws(()=>validateProject(p));}
 assert.throws(()=>applyOperations(fixture().project,[{type:'setKeyframe',targetId:'shot-1-title',property:'text',value:'animate?',frame:3}]));
 const p=applyOperations(fixture().project,[{type:'setKeyframe',targetId:'shot-1-title',property:'radius',frame:0,value:0},{type:'setKeyframe',targetId:'shot-1-title',property:'radius',frame:24,value:48}]);
 assert.equal(frameContext(p,12).entities[1].values.radius,24);
});
test('rational time and seeded samples are independent of seek and layer ordering',()=>{
 const p=fixture().project;p.fps={num:30000,den:1001};
 assert.equal(frameClock(p,96).localFrame,0);assert.equal(frameClock(p,96).time,96*1001/30000);
 for(const f of [-1,.5,288,NaN])assert.throws(()=>frameClock(p,f));
 const reference=randomAt(4,32,'title',1);for(const f of [32,0,287,32]){randomAt(4,f,'other',100);assert.equal(randomAt(4,32,'title',1),reference);}
 assert.notEqual(randomAt(5,32,'title',1),reference);
});
test('registration rejects duplicates and inaccurate capability declarations',async()=>{
 const r=createRendererRegistry(),d={id:'fixture',version:'1.0.0',sdkVersion:1,capabilities:{renderFrame:true,audio:false,selection:false,inspect:false,cancel:false,dispose:true},auditChannels:['color']};
 r.register(d,async()=>({renderFrame(){},dispose(){}}));assert.throws(()=>r.register(d,()=>{}));
 d.capabilities.audio=true;assert.equal(r.describe('fixture').capabilities.audio,false);
 const stages=[];await r.open('fixture',{onProgress:p=>stages.push(p.stage)});assert.deepEqual(stages,['loading','ready']);
 r.register({...d,id:'incomplete'},async()=>({renderFrame(){},dispose(){}}));await assert.rejects(r.open('incomplete',{}),/audio/);
 await assert.rejects(r.open('unknown',{}));
});
test('legacy frame adapter waits for decoded media and surfaces readiness failure',async()=>{
 const calls=[],page={__frameTo:n=>{calls.push(n);return{frame:n};},__prepareFrame:async()=>calls.push('prepared')};
 const r=adaptLegacyPage(page,{totalFrames:24});assert.deepEqual(await r.renderFrame({frame:3}),{frame:3});assert.deepEqual(calls,[3,'prepared']);
 await assert.rejects(r.renderFrame({frame:24}));await assert.rejects(r.audio({duration:1}),/unsupported/);
 page.__failed='shader failed';await assert.rejects(r.renderFrame({frame:1}),/shader failed/);r.dispose();
});

test('reviewed runtime rebase preserves data, receipts, both history stacks and unrelated source guards',()=>{
 const original=fixture(),before='a'.repeat(64),after='b'.repeat(64),other='c'.repeat(64);
 const entry=hash=>({project:structuredClone(original.project),at:'2026-10-13T00:00:00Z',actor:{kind:'human',identity:'local'},label:'edit',transactionId:crypto.randomUUID(),sourceHash:hash,expectedHash:'d'.repeat(64)});
 original.generation=4;original.history={past:[entry(before),entry(other)],future:[entry(before)]};
 original.receipts=[{id:crypto.randomUUID(),signature:'e'.repeat(64),revision:'f'.repeat(64)}];
 const result=rebaseRuntimeState(original,{id:'sdk-motion'},{beforeSourceHash:before,afterSourceHash:after});
 assert.equal(result.rebased,2);assert.equal(result.retained,1);assert.deepEqual(result.state.project,original.project);assert.deepEqual(result.state.receipts,original.receipts);assert.equal(result.state.generation,4);
 assert.equal(result.state.history.past[1].sourceHash,other);assert.equal(result.state.history.future[0].sourceHash,after);assert.equal(original.history.past[0].sourceHash,before);
});

test('runtime release refuses concurrent data edits and only restores reviewed undo chains',t=>{
 const root=mkdtempSync(join(tmpdir(),'sdk-migrate-'));t.after(()=>rmSync(root,{recursive:true,force:true}));mkdirSync(join(root,'work'));
 const file=join(root,'work/project.studio.json'),code=join(root,'work/paint.mjs');writeFileSync(file,JSON.stringify(fixture()));writeFileSync(code,'// before');
 const work={id:'sdk-motion',dir:'work',project:'project.studio.json'},store=createProjectStore(root);
 let head=store.get(work);head=store.transact(work,{baseRevision:head.revision,requestId:randomUUID(),operations:[{type:'setProperty',targetId:'shot-1-title',property:'radius',value:36}]});
 const bytes=readFileSync(file,'utf8'),manifest={documentHash:digest(bytes),sourceHash:head.sourceRevision,generation:head.generation,projectHash:digest(JSON.stringify(head.project))};
 writeFileSync(code,'// reviewed equivalent runtime');head=store.get(work);
 const undo=()=>store.transact(work,{baseRevision:store.get(work).revision,requestId:randomUUID(),action:'undo'});
 assert.throws(undo,/source changed/);assert.equal(rebaseRuntimeFile(root,work,{manifest}).dryRun,true);assert.equal(readFileSync(file,'utf8'),bytes);
 const concurrent=JSON.parse(bytes);concurrent.project.name='changed elsewhere';writeFileSync(file,JSON.stringify(concurrent));assert.throws(()=>rebaseRuntimeFile(root,work,{manifest,dryRun:false}),/project changed/);
 writeFileSync(file,bytes);const receipt=rebaseRuntimeFile(root,work,{manifest,dryRun:false});assert.equal(receipt.rebased,1);assert.equal(readFileSync(receipt.backup,'utf8'),bytes);
 assert.equal(undo().project.shots[0].entities[1].properties.radius,28);
});

test('readiness timeout and abort dispose late resources and remain cancellable after ready',async()=>{
 const r=createRendererRegistry(),d={id:'slow',version:'1.0.0',sdkVersion:1,capabilities:{renderFrame:true,audio:false,selection:false,inspect:false,cancel:false,dispose:true},auditChannels:['color']};
 let finish,disposed=0;r.register(d,()=>new Promise(resolve=>finish=()=>resolve({renderFrame(){},dispose(){disposed++;}})));
 await assert.rejects(r.open('slow',{readyTimeoutMs:50}),/timed out/);finish();await new Promise(r=>setTimeout(r,0));assert.equal(disposed,1);
 const controller=new AbortController(),opening=r.open('slow',{signal:controller.signal});await new Promise(r=>setTimeout(r,0));finish();const runtime=await opening;controller.abort();assert.equal(disposed,2);runtime.dispose();assert.equal(disposed,2);
});
