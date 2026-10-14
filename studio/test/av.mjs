import test from 'node:test';
import assert from 'node:assert/strict';
import {createTemplate} from '../core/templates.mjs';
import {applyOperations,validateProject} from '../core/project.mjs';
import {mixAudio,analyzeAudio,waveform} from '../audio.mjs';
const src='/w/studio/assets/example/'+'a'.repeat(64)+'.wav',video=src.replace('.wav','.mp4'),font=src.replace('.wav','.ttf');
const base=()=>createTemplate('example',{name:'AV test',format:'16:9',fps:24,durationSeconds:4,template:'blank'});
const audio=(p=base())=>applyOperations(p,[{type:'addAudio',shotId:p.shots[0].id,id:'sound',src,durationFrames:72}]);
const apply=(p,...operations)=>applyOperations(p,operations),entity=(p,id='sound')=>p.shots.flatMap(s=>s.entities).find(e=>e.id===id);
function linked(){let p=audio();return apply(p,{type:'addLayer',shotId:p.shots[0].id,id:'video',kind:'video',content:{src:video,offsetSeconds:.25,playbackRate:1,width:320,height:180}},{type:'trimClip',targetId:'video',startFrame:12,endFrame:84},{type:'linkAudio',targetId:'sound',videoId:'video'});}
test('file audio trim retains source time, move shifts automation and split keeps offset',()=>{
 let p=audio();p=apply(p,{type:'setKeyframe',targetId:'sound',property:'gain',frame:24,value:.5},{type:'trimAudio',targetId:'sound',startFrame:12,endFrame:60});assert.equal(entity(p).cue.offsetSeconds,.5);assert.equal(entity(p).keyframes.gain[0].frame,24);
 p=apply(p,{type:'moveAudio',targetId:'sound',startFrame:24},{type:'splitAudio',targetId:'sound',frame:48,id:'right'});assert.equal(entity(p).keyframes.gain[0].frame,36);assert.equal(entity(p,'right').cue.offsetSeconds,1.5);assert.equal(entity(p).cue.durationFrames,24);assert.equal(entity(p,'right').cue.durationFrames,24);
 assert.throws(()=>apply(p,{type:'trimAudio',targetId:'right',startFrame:0,endFrame:60}));
});
test('linked video/audio move, trim, stretch, split, duplicate and delete remain atomic',()=>{
 let p=linked();assert.equal(entity(p).cue.offsetSeconds,.75);assert.throws(()=>apply(p,{type:'setCue',targetId:'sound',patch:{frame:0}}),/Detach/);
 p=apply(p,{type:'moveClip',targetId:'video',startFrame:0},{type:'stretchClip',targetId:'video',durationFrames:36});assert.equal(entity(p).cue.playbackRate,2);assert.equal(entity(p).cue.durationFrames,36);
 p=apply(p,{type:'splitClip',targetId:'video',frame:12,id:'v2'});assert.equal(entity(p,'v2:audio').cue.offsetSeconds,1.75);assert.equal(entity(p,'v2:audio').cue.linkedVideoId,'v2');
 p=apply(p,{type:'duplicateLayer',targetId:'v2',id:'v3'});assert.equal(entity(p,'v3:audio').cue.linkedVideoId,'v3');
 p=apply(p,{type:'deleteLayer',targetId:'v2'});assert.equal(entity(p,'v2:audio'),undefined);validateProject(p);
 const before=JSON.stringify(p);assert.throws(()=>apply(p,{type:'moveClip',targetId:'video',startFrame:2},{type:'setAudioMix',targetId:'sound',patch:{solo:'yes'}}));assert.equal(JSON.stringify(p),before);
});
test('detach permits independent edits; scene duplication remaps links and scene stretch keeps rate',()=>{
 let p=linked(),shot=p.shots[0].id;p=apply(p,{type:'duplicateShot',shotId:shot,id:'copy'});const s=p.shots[1],a=s.entities.find(e=>e.cue);assert.ok(s.entities.some(e=>e.id===a.cue.linkedVideoId));
 p=apply(p,{type:'stretchShot',shotId:shot,durationFrames:192});assert.equal(entity(p).cue.playbackRate,.5);
 p=apply(p,{type:'detachAudio',targetId:'sound'},{type:'setCue',targetId:'sound',patch:{offsetSeconds:0}},{type:'moveClip',targetId:'video',startFrame:0});assert.equal(entity(p).cue.frame,24);assert.equal(entity(p).cue.offsetSeconds,0);
});
test('project fonts and timed caption styles validate and cannot lose referenced fonts',()=>{
 let p=base();p=apply(p,{type:'addFont',id:'font-local',name:'My font',src:font},{type:'addCaption',shotId:p.shots[0].id,id:'caption',startFrame:12,endFrame:48,text:'Caption'});assert.equal(entity(p,'caption').content.fontFamily,'font-local');assert.throws(()=>apply(p,{type:'removeFont',id:'font-local'}),/still used/);
 const broken=structuredClone(p);broken.fonts=[];assert.throws(()=>validateProject(broken),/missing project font/);const c=structuredClone(entity(p,'caption').content);c.caption.safeArea=.5;assert.throws(()=>apply(p,{type:'setContent',targetId:'caption',content:c}),/caption/);
 assert.throws(()=>apply(base(),{type:'addFont',id:'font-bad',name:'No',src:'https://tracker/font.ttf'}),/font/);
});
const sr=12000,source=(data)=>new Map([[src,{sampleRate:sr,channels:[data]}]]),render=(p,s,options={})=>mixAudio(p,s,{duration:p.shots.reduce((n,s)=>n+s.durationFrames,0)/24,sampleRate:sr,yieldTask:()=>Promise.resolve(),...options});
test('rendered PCM lands on the frame and respects source offset, stereo, mute and solo',async()=>{
 const data=new Float32Array(sr*4);data.fill(.5,sr/2,sr*.6);let p=apply(audio(),{type:'setCue',targetId:'sound',patch:{frame:24,offsetSeconds:.25}},{type:'duplicateAudio',targetId:'sound',id:'other'},{type:'setCue',targetId:'other',patch:{frame:0,offsetSeconds:0}},{type:'setAudioMix',targetId:'sound',patch:{role:'voice',solo:true}});
 const mixed=await render(p,source(data)),first=mixed.channels[0].findIndex(n=>n!==0);assert.equal(first,sr*1.25);assert.deepEqual(mixed.channels[0],mixed.channels[1]);assert.equal(mixed.channels[0][first],.5);assert.equal(mixed.events.length,1);
 p=apply(p,{type:'setProperty',targetId:'sound',property:'muted',value:true});const silent=await render(p,source(data));assert.ok(silent.channels[0].every(n=>n===0));
});
test('fades, gain animation, fractional FPS, source exhaustion and calibrated audio checks',async()=>{
 const data=new Float32Array(sr*4).fill(.5);let p=apply(audio(),{type:'setProperty',targetId:'sound',property:'fadeIn',value:1},{type:'setProperty',targetId:'sound',property:'fadeOut',value:1});let a=await render(p,source(data));assert.equal(a.channels[0][0],0);assert.ok(Math.abs(a.channels[0][sr/2]-.25)<1e-6);assert.ok(Math.abs(a.channels[0][sr*2.5]-.25)<1e-6);
 p=apply(audio(),{type:'setProperty',targetId:'sound',property:'gain',value:4});a=await render(p,source(data));assert.ok(analyzeAudio(a).clippingSamples>0);assert.equal(analyzeAudio(await render(audio(),source(data))).clippingSamples,0);
 const quiet=data.slice();quiet.fill(0,sr,sr*2);assert.equal(analyzeAudio(await render(audio(),source(quiet))).silenceCandidates.length,1);assert.equal(analyzeAudio(await render(audio(),source(data.subarray(0,sr)))) .sourceEndsEarly.length,1);
 p=audio();p.fps={num:30000,den:1001};a=await mixAudio(p,source(data),{sampleRate:sr,yieldTask:()=>Promise.resolve()});assert.equal(a.channels[0].length,Math.round(96*1001/30000*sr));assert.equal(waveform(a.channels,20).length,20);
});
test('render cancels and refuses oversized allocation; no cache hides project edits',async()=>{
 const data=new Float32Array(sr*4).fill(.25),controller=new AbortController();controller.abort();await assert.rejects(render(audio(),source(data),{signal:controller.signal}),/abort/i);
 let p=audio();const a=await render(p,source(data));p=apply(p,{type:'setProperty',targetId:'sound',property:'gain',value:2});const b=await render(p,source(data));assert.equal(b.channels[0][10],a.channels[0][10]*2);
 p.shots[0].durationFrames=36000;await assert.rejects(mixAudio(p,source(data),{duration:1500,sampleRate:48000}),/budget/);
});

test('audio gain uses exact hold and ease curves at sample time',async()=>{
 const data=new Float32Array(sr*4).fill(.5);let p=apply(audio(),{type:'setKeyframe',targetId:'sound',property:'gain',frame:0,value:0,easing:'hold'},{type:'setKeyframe',targetId:'sound',property:'gain',frame:24,value:1,easing:'linear'});let a=await render(p,source(data));assert.equal(a.channels[0][sr-1],0);assert.equal(a.channels[0][sr],.5);
 p=apply(p,{type:'setKeyframe',targetId:'sound',property:'gain',frame:0,value:0,easing:'ease'});a=await render(p,source(data));assert.ok(Math.abs(a.channels[0][sr/4]-.078125)<1e-7);
});
test('splitting a faded clip preserves the rendered signal; fitting fades is an explicit edit',async()=>{
 const data=new Float32Array(sr*4).fill(.5),p=apply(audio(),{type:'setProperty',targetId:'sound',property:'fadeIn',value:2},{type:'setProperty',targetId:'sound',property:'fadeOut',value:2}),before=await render(p,source(data));let split=apply(p,{type:'splitAudio',targetId:'sound',frame:24,id:'right'});const after=await render(split,source(data));assert.deepEqual(after.channels,before.channels);split=apply(split,{type:'resetAudioFades',targetId:'right'});const reset=await render(split,source(data));assert.equal(reset.channels[0][sr],0);assert.ok(before.channels[0][sr]>0);
});
