/* ===== THE STUDIO, IN A BROWSER =====
   The UI audit of 2026-10-04 found the studio frozen on "loading…", a note half-written
   lost when another note arrived, a readout that said "live 0" while the film played,
   cut marks nobody could click, a scrub that started the film over every frame, two
   transports for one film, and a list that turned into a 70vh box on a phone. Each of
   those is held here, in Chromium, by a check with its own known-bad case.

   Needs Playwright in studio/ (npm i). Fake works for the stuck and failing cases are
   written to build/studio-test/ and listed through STUDIO_WORKS; notes and the Labs
   questions go to temporary folders. Nothing here touches studio/notes or the bot. */
import {check,report} from './lib.mjs';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync,readFileSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';
let chromium;
try{ ({chromium}=await import('playwright')); }
catch(e){ console.log('\n  the browser checks need Playwright: cd studio && npm i && npx playwright install chromium\n'); process.exit(1); }

const ROOT=new URL('../../',import.meta.url).pathname.replace(/\/$/,'');
const t0=Date.now();
const NOTES=mkdtempSync(join(tmpdir(),'studio-ui-notes-')), CONF=mkdtempSync(join(tmpdir(),'studio-ui-conf-'));
process.env.STUDIO_NOTES_DIR=NOTES;

/* fake works: one that never says it is ready, one that fails, one that is fine, one
   that holds the thread the way a synchronous shader compile did */
const FAKE='build/studio-test';
mkdirSync(join(ROOT,FAKE),{recursive:true});
const page=body=>`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><script>${body}</script>`;
writeFileSync(join(ROOT,FAKE,'never.html'),page(`window.__ready=false;`));
writeFileSync(join(ROOT,FAKE,'failed.html'),page(`window.__ready=false;window.__failed='Shader: the test made this fail';`));
writeFileSync(join(ROOT,FAKE,'good.html'),page(`window.__ready=false;let f=0;window.__totalFrames=48;
 window.__frameTo=n=>{f=n;return{frame:n}};window.__frame=()=>({frame:f});window.__pause=()=>{};window.__play=()=>{};
 setTimeout(()=>{window.__ready=true},100);`));
writeFileSync(join(ROOT,FAKE,'block.html'),page(`window.__ready=false;let k=0;
 (function hold(){const t=performance.now();while(performance.now()-t<1200){} if(++k<6)setTimeout(hold,5);else window.__ready=true;})();`));
/* a film with a table of its own, for the editing check: the file is its own source */
const EDIT_PAGE=join(ROOT,FAKE,'edit.html');
const editPage=()=>writeFileSync(EDIT_PAGE,page(`window.__ready=false;
const SHOTS=[
 {k:'a', df:10},
 {k:'b', df:20}
];
let f=0;const N=SHOTS.reduce((n,s)=>n+s.df,0);window.__totalFrames=N;
window.__frameTo=n=>{f=n;return{frame:n}};window.__frame=()=>({frame:f});window.__pause=()=>{};window.__play=()=>{};
window.__tracks=()=>{let a=0;return[{id:'shots',name:'Shots',kind:'clips',src:{file:'edit.html',find:'const SHOTS=['},items:SHOTS.map(s=>{const o={f:a,n:s.df,label:s.k,
 edit:[{name:'length',unit:'frames',file:'edit.html',row:{key:'k',is:s.k},key:'df',value:s.df,min:1,max:99,step:1,per:1,drag:true}]};a+=s.df;return o;})}]};
window.__ready=true;`));
editPage();
const real=JSON.parse(readFileSync(join(ROOT,'studio','works.json'),'utf8')).works;
const fake=(id,name)=>({id,dir:FAKE,name,page:`${FAKE}/${id.slice(2)}.html`,control:'frameTo',suites:[]});
writeFileSync(join(CONF,'works.json'),JSON.stringify({works:[...real,
 fake('t-never','Never ready'),fake('t-edit','Edit'),fake('t-failed','Fails'),fake('t-good','Good'),fake('t-block','Blocks')]}));
process.env.STUDIO_WORKS=join(CONF,'works.json');
/* the Labs questions, as the lines write them: a numbered list, bold, code */
mkdirSync(join(CONF,'lines','3d'),{recursive:true});
writeFileSync(join(CONF,'lines','3d','line.json'),JSON.stringify({line:'3d',title:'3D'}));
writeFileSync(join(CONF,'lines','3d','for.md'),`# for\n\n## Open questions for the owner\n\n1. **What is the line for?** Its profile is\n   still \`empty\`. Unblocks item 3.\n2. **Fonts: record or vendor?** Unblocks item 2.\n\n---\n`);
process.env.STUDIO_LABS_LINES=join(CONF,'lines');

const {server,watchWorks,works,build}=await import('../server.mjs');
for(const w of works()) if(w.build){ const r=await build(w); if(!r.ok) throw new Error(w.id+' did not build: '+r.output.slice(-300)); }
const S=server(); const stopWatch=watchWorks();
await new Promise(r=>S.listen(0,'127.0.0.1',r));
const BASE=`http://127.0.0.1:${S.address().port}`;
/* WebGL through SwiftShader for oq-kocha; 2D canvas on the CPU rasterizer, which draws
   the same picture every time (the GPU path may switch mid-run and shift a few levels) */
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-accelerated-2d-canvas']});
const ZARRA_PROBE=join(ROOT,'studio','projects','zarra','__studio_ui_probe__.txt');

async function studio(hash,{width=1440,height=900,init}={}){
 const ctx=await browser.newContext({viewport:{width,height}});
 if(init) await ctx.addInitScript(init);
 const p=await ctx.newPage(); p.setDefaultTimeout(120000);
 await p.goto(BASE+'/'+hash);
 return p;
}
/* ready: the work asked for (after a click the old one is still "ready" for a moment), on
   the stage, and the live link up */
const ready=(p,id=null)=>p.waitForFunction(id=>(!id||(current&&current.id===id))&&document.getElementById('veil').hidden&&S.ready
 &&document.getElementById('linkText').textContent==='connected',id,{timeout:120000,polling:100});
const done=p=>p.context().close();
const frameOf=async(p,name)=>{ for(let i=0;i<600;i++){ const f=p.frames().find(f=>f.url().includes(name)); if(f) return f; await p.waitForTimeout(50); } throw new Error('no frame '+name); };
const stageDoc=p=>p.evaluate(()=>{ const d=document.getElementById('stage').contentWindow.document; return d.__mark?1:0; });

try{

/* A STUCK WORK SAYS WHY. The studio waited for the iframe's load event with no limit, so
   a page that never finished showed "loading…" for ever. Now it asks the page whether it
   is ready, says when it has failed, and after 10 s says it is not ready and why that
   may be. The broken case: two pages that are fine, where no reason may appear. */
async function noReason(ids){
 let missing=0;
 for(const [id,want] of ids){
  const p=await studio('#'+id);
  const said=await p.waitForFunction(()=>{ const v=document.getElementById('veil'); if(v.hidden) return 'ready';
   const t=document.getElementById('veilText').textContent+' '+document.getElementById('veilWhy').textContent;
   return /could not start|not ready after/.test(t)?t:false; },null,{timeout:16000,polling:200}).then(h=>h.jsonValue()).catch(()=>'nothing');
  if(!want.test(said)) missing++;
  await done(p);
 }
 return missing;
}
await check({name:'studio/ready-or-says-why', unit:'stuck pages with no reason on the stage',
 measure:()=>noReason([['t-never',/not ready after 10 s/],['t-failed',/could not start.*the test made this fail/]]),
 pass:v=>v===0,
 calibrate:()=>noReason([['t-good',/not ready after|could not start/],['t-good',/not ready after|could not start/]]),
 note:'a page that never sets __ready, and one that sets __failed'});

/* THE STUDIO ANSWERS WHILE A WORK LOADS. The work shares the studio's main thread, and
   oq-kocha and the sandbox compiled their shaders synchronously: a click on the studio
   waited 3.4 s. With KHR_parallel_shader_compile they ask "done yet?" between turns of
   the event loop. Here the extension is supplied and holds "not yet" for 4 s while the
   studio is clicked; a real browser compiles in that time. The broken case is a work
   that holds the thread in 1.2 s pieces, as the compile did. Budget: 200 ms (INP). */
const HOLD=`(()=>{ if(!/(oq-kocha|masofa-maydoni)\\.html$/.test(location.pathname)) return;
 const EXT={COMPLETION_STATUS_KHR:0x91B1}; let first=null, over=false;
 window.__holding=false; window.__blocking=0;
 for(const P of [window.WebGL2RenderingContext,window.WebGLRenderingContext].filter(Boolean).map(C=>C.prototype)){
  const ge=P.getExtension, gp=P.getProgramParameter, gs=P.getShaderParameter;
  P.getExtension=function(n){ return n==='KHR_parallel_shader_compile'?EXT:ge.call(this,n); };
  P.getProgramParameter=function(p,n){
   if(n===0x91B1){ if(first===null) first=performance.now(); over=performance.now()-first>4000; window.__holding=!over; return over; }
   if(!over&&n===this.LINK_STATUS) window.__blocking++;
   return gp.call(this,p,n); };
  P.getShaderParameter=function(s,n){ if(!over&&n===this.COMPILE_STATUS) window.__blocking++; return gs.call(this,s,n); };
 }})()`;
async function worstDelay(hash,init,when){
 const p=await studio(hash,{init});
 await p.evaluate(()=>{ window.__delays=[]; addEventListener('pointerdown',e=>__delays.push(performance.now()-e.timeStamp),true); });
 const f=await when(p);
 for(let i=0;i<5;i++){ await p.mouse.click(700,20); await p.waitForTimeout(200); }
 const worst=await p.evaluate(()=>Math.round(Math.max(0,...__delays)));
 const blocking=f?await f.evaluate(()=>window.__blocking||0).catch(()=>0):0;
 await done(p);
 return worst+(blocking?100000:0);                  // a blocking query while "not yet" is a failure on its own
}
const compiling=name=>async p=>{ const f=await frameOf(p,name+'.html');
 await f.waitForFunction(()=>window.__holding===true,null,{timeout:90000,polling:50}); return f; };
await check({name:'studio/stays-responsive', unit:'ms, the worst wait of a click while a work loads',
 measure:async()=>Math.max(await worstDelay('#oq-kocha',HOLD,compiling('oq-kocha')),
                           await worstDelay('#masofa-maydoni',HOLD,compiling('masofa-maydoni'))),
 pass:v=>v<200,
 calibrate:()=>worstDelay('#t-block',null,async p=>{ await frameOf(p,'block.html'); return null; }),
 note:'oq-kocha and the sandbox with the parallel-compile extension, each clicked five times while it compiles'});

/* A HALF-WRITTEN NOTE SURVIVES. Every event used to redraw the Notes panel, textarea and
   all: a note arriving from the AI erased the person's draft. Three things happen while
   a draft is open -- the AI answers a note, the AI saves the work, the person looks at
   another work and comes back -- and the draft must still be there. The broken case
   forgets drafts, which is what the page did. */
async function draftLost(forget){
 writeFileSync(join(NOTES,'zarra.md'),'# Notes: Zarra\n\n');
 const p=await studio('#zarra/notes'); await ready(p);
 if(forget) await p.evaluate(()=>{ drafts.set=()=>drafts; });
 await p.fill('#noteText','half a thought');
 let lost=0; const kept=async()=>{ if((await p.inputValue('#noteText').catch(()=>''))!=='half a thought') lost++; };
 writeFileSync(join(NOTES,'zarra.md'),'# Notes: Zarra\n\n- [ ] 2026-10-04 10:00 +0000 · frame 3 · an older note\n  > 2026-10-04 10:05 · AI · answered\n');
 await p.waitForFunction(()=>/answered/.test(document.getElementById('noteList')?.textContent||''),null,{timeout:10000}).catch(()=>{});
 await kept();
 writeFileSync(ZARRA_PROBE,String(Date.now()));
 await p.waitForFunction(()=>!document.getElementById('pending').hidden,null,{timeout:10000}).catch(()=>{});
 await kept();
 await p.click('#list a.open[href="#mushuk"]'); await ready(p,'mushuk');
 await p.click('#list a.open[href="#zarra"]'); await ready(p,'zarra');
 await kept();
 await done(p); rmSync(ZARRA_PROBE,{force:true}); rmSync(join(NOTES,'zarra.md'),{force:true});
 return lost;
}
await check({name:'studio/draft-survives', unit:'times the draft was lost',
 measure:()=>draftLost(false), pass:v=>v===0, calibrate:()=>draftLost(true),
 note:'an answer from the AI, a save by the AI, a visit to another work'});

/* AN UPDATE WAITS WHILE THE PERSON WRITES. A save by the AI reloads the work at once --
   unless the person is writing a note or scrubbing: then the stage stays, says that an
   update is waiting, and takes it when they stop. The broken case is the same save with
   nobody writing: it must reload at once, and say nothing. */
async function interrupted(writing){
 const p=await studio('#zarra/notes'); await ready(p);
 await p.evaluate(()=>{ document.getElementById('stage').contentWindow.document.__mark=1; });
 if(writing) await p.focus('#noteText'); else await p.focus('#reloadBtn');
 await p.waitForTimeout(300);
 writeFileSync(ZARRA_PROBE,String(Date.now()));
 await p.waitForFunction(()=>!document.getElementById('pending').hidden||!document.getElementById('stage').contentWindow.document.__mark,null,{timeout:10000}).catch(()=>{});
 await p.waitForTimeout(300);
 const reloaded=!(await stageDoc(p)), told=await p.evaluate(()=>!document.getElementById('pending').hidden);
 let bad=(reloaded?1:0)+(told?0:1);
 if(writing){                                         // and when the person stops, it is taken
  await p.focus('#reloadBtn');
  await p.waitForFunction(()=>!document.getElementById('stage').contentWindow.document.__mark,null,{timeout:10000}).catch(()=>{});
  if(await stageDoc(p)) bad++;
 }
 await done(p); rmSync(ZARRA_PROBE,{force:true});
 return bad;
}
await check({name:'studio/update-waits-while-writing', unit:'interruptions or silent waits',
 measure:()=>interrupted(true), pass:v=>v===0, calibrate:()=>interrupted(false),
 note:'the stage keeps its document while the note field has focus, shows "Updated", reloads on blur'});

/* FOCUS STAYS WHERE IT IS. The list of works was rebuilt with innerHTML on every event,
   and keyboard focus fell to <body>. Now it is updated in place. The broken case
   rebuilds it whole, as before. */
async function focusLost(rebuild){
 rmSync(join(NOTES,'mushuk.md'),{force:true});
 const p=await studio('#zarra'); await ready(p);
 await p.focus('#list li:nth-child(3) a.open');
 if(rebuild) await p.evaluate(()=>{ const l=document.getElementById('list'), r=renderList; renderList=()=>{ delete l.dataset.ids; r(); }; });
 writeFileSync(join(NOTES,'mushuk.md'),'# Notes: Mushuk\n\n- [ ] 2026-10-04 10:00 +0000 · a note\n');
 /* wait for THIS update: the note count on mushuk's own row (another row's count would
    already be there, and the check would read focus before anything was redrawn) */
 const came=await p.waitForFunction(()=>!!document.querySelector('#list li[data-id="mushuk"] a.notes:not([hidden])'),null,{timeout:10000}).then(()=>1,()=>0);
 const lost=came?await p.evaluate(()=>document.activeElement&&document.activeElement.matches('#list li:nth-child(3) a.open')?0:1):1;
 await done(p); rmSync(join(NOTES,'mushuk.md'),{force:true});
 return lost;
}
await check({name:'studio/focus-survives', unit:'focus lost on a list update',
 measure:()=>focusLost(false), pass:v=>v===0, calibrate:()=>focusLost(true),
 note:'a note arrives for another work while a work link has keyboard focus'});

/* THE READOUT TELLS THE TRUTH. It said "live 0 / 120 · 0.00 s" while the film played,
   and Notes offered "attach to frame 0". Now, playing, it follows the frame the page
   reports; paused, it is the frame on screen; and starting a note stops the film on the
   frame the note is about. The broken case reads the readout 1.5 s late. */
async function readoutOff(late){
 const p=await studio('#zarra/notes'); await ready(p);
 await p.waitForTimeout(800);
 const read=()=>p.evaluate(()=>({text:document.getElementById('info').textContent,
  page:document.getElementById('stage').contentWindow.__frame().frame}));
 let off=0, a=await read();
 if(late){ await p.waitForTimeout(1500); a={...a,page:(await read()).page}; }
 const n=+((a.text.match(/frame (\d+)/)||[])[1]);
 if(!/^Playing/.test(a.text)||!(Math.abs(n-a.page)<=8)) off++;
 await p.click('#playBtn');
 const b=await read(), m=+((b.text.match(/frame (\d+)/)||[])[1]);
 if(!/^Paused at/.test(b.text)||m!==b.page) off++;
 await p.click('#playBtn'); await p.waitForTimeout(600);
 await p.focus('#noteText');
 const c=await p.evaluate(()=>({label:document.getElementById('noteFrameText').textContent,
  checked:document.getElementById('noteFrame').checked, page:document.getElementById('stage').contentWindow.__frame().frame}));
 const k=+((c.label.match(/frame (\d+)/)||[])[1]);
 if(k!==c.page||!c.checked) off++;
 await done(p);
 return off;
}
await check({name:'studio/readout-honest', unit:'readouts that did not match the page',
 measure:()=>readoutOff(false), pass:v=>v===0, calibrate:()=>readoutOff(true),
 note:'zarra: playing (within 8 frames), paused (exact), and the frame a note attaches to (exact)'});

/* A SHOT IS ONE CLICK AWAY. The cut marks had pointer-events:none, so their names never
   showed and they could not be clicked. The strip under the scrubber is buttons: each
   goes to the first frame of its shot, and the shot on screen is marked. The broken case
   expects every shot one frame late. */
async function jumpsOff(shift){
 const p=await studio('#oq-kocha'); await ready(p);
 const starts=await p.$$eval('.shot',B=>B.map(b=>+b.dataset.f));
 let off=starts.length?0:1;
 for(let i=0;i<starts.length;i++){
  await p.click(`.shot:nth-child(${i+1})`);
  await p.waitForFunction(f=>S.mode==='frame'&&S.frame===f&&!raf,starts[i],{timeout:60000}).catch(()=>{});
  const r=await p.evaluate(()=>({page:document.getElementById('stage').contentWindow.__frame().frame,
   on:[...document.querySelectorAll('.shot')].findIndex(b=>b.getAttribute('aria-current')==='true'),
   text:document.getElementById('info').textContent}));
  const want=starts[i]+shift;
  if(r.page!==want||r.on!==i||!r.text.includes(`frame ${want} `)) off++;
 }
 await done(p);
 return off;
}
await check({name:'studio/shot-strip-jumps', unit:'shots that did not land on their first frame',
 measure:()=>jumpsOff(0), pass:v=>v===0, calibrate:()=>jumpsOff(1),
 note:'oq-kocha: every shot button, the page\'s own frame, the readout, the marked shot'});

/* A SCRUB IN WHITEOUT IS EXACT, AND CHEAP. __frameTo restarted the simulation from frame 0
   on every call (23–83 ms a step at the end of the piece). Now it goes on from where it
   is, or from the nearest checkpoint behind it, and must draw the very same picture as a
   run from the start -- pixel for pixel, the clash's frozen snow included (it used to
   depend on which frame was drawn before it). One step forward is one simulation step.
   The broken case compares each frame with the next one, which must differ. */
async function scrubOff(next){
 const ctx=await browser.newContext({viewport:{width:1000,height:700}}), p=await ctx.newPage();
 await p.goto(BASE+'/w/studio/projects/whiteout/whiteout.html?embed=1');
 await p.waitForFunction(()=>window.__ready===true,null,{timeout:90000});
 const off=await p.evaluate(next=>{
  const g=document.getElementById('cv').getContext('2d'), flush=()=>g.getImageData(0,0,1,1);
  const px=()=>g.getImageData(0,0,1920,1080).data;
  const same=(a,b)=>{ for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; };
  let off=0;
  for(const n of [100,227,300,450]){                // 227: the first frame of the clash
   const to=next?n+1:n;
   window.__rewind(); flush(); window.__frameTo(n); const fresh=px();
   window.__rewind(); flush(); window.__frameTo(Math.round(n*0.6)); flush(); window.__frameTo(to); const fwd=px();
   flush(); window.__frameTo(n+40); flush(); window.__frameTo(to); const back=px();
   if(!same(fresh,fwd)) off++; if(!same(fresh,back)) off++;
  }
  window.__frameTo(400); const s0=window.__simSteps(); window.__frameTo(401); if(window.__simSteps()-s0!==1) off++;
  window.__frameTo(460); const s1=window.__simSteps(); window.__frameTo(300); if(window.__simSteps()-s1>48) off++;
  return off;
 },next);
 await ctx.close();
 return off;
}
await check({name:'studio/whiteout-scrub-exact', unit:'pictures or step counts off',
 measure:()=>scrubOff(false), pass:v=>v===0, calibrate:()=>scrubOff(true),
 note:'frames 100, 227, 300, 450: from the start, forward from earlier, back through a checkpoint'});

/* ONE TRANSPORT, ONE CLOCK. Inside the studio each page showed its own title, play
   buttons, clock and shot bar above the studio's transport: three clocks for one film.
   Under ?embed they step aside. The broken case is the same pages without ?embed. */
const OWN={'oq-kocha/build/oq-kocha.html':'h1,.sub,.tl,dl,.note,.hud,#play,#rew,#q','whiteout/whiteout.html':'.shots,#play,.meta',
 'bir-tomchi/bir-tomchi.html':'#tc,.track,p','not-a-measurement/not-a-measurement.html':'#play,.meta','mushuk/mushuk.html':'p',
 'masofa-maydoni/masofa-maydoni.html':'h1,.sub,dl,.note'};
async function ownShown(query){
 const ctx=await browser.newContext({viewport:{width:1000,height:700}}); let n=0;
 for(const [pg,sel] of Object.entries(OWN)){ const p=await ctx.newPage();
  await p.goto(`${BASE}/w/studio/projects/${pg}${query}`,{waitUntil:'domcontentloaded'});
  n+=await p.$$eval(sel,L=>L.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').length);
  await p.close(); }
 await ctx.close(); return n;
}
await check({name:'studio/embed-one-transport', unit:'own titles, transports and clocks on the stage',
 measure:()=>ownShown('?embed=1'), pass:v=>v===0, calibrate:()=>ownShown(''),
 note:Object.keys(OWN).length+' pages; a sandbox keeps its own controls, they are the work'});

/* THE QUESTIONS READ AS TEXT. The Decisions dialog showed the Labs markdown raw, under
   "line: 3d", with no word on how to answer. The broken case is the raw text itself. */
async function rawLeft(raw){
 const L=await (await fetch(BASE+'/api/decisions')).json();
 let text=L.map(x=>x.text).join('\n'), answers=0;
 if(!raw){ const p=await studio('#zarra'); await p.click('#decisionsBtn');
  text=await p.innerText('#decisionsInner'); answers=(await p.$$('#decisionsInner .answer')).length; await done(p); }
 return (text.match(/\*\*|`/g)||[]).length+Math.abs(L.length-answers)+(L.length?0:1);
}
await check({name:'studio/decisions-rendered', unit:'raw markdown marks, or lines with no way to answer',
 measure:()=>rawLeft(false), pass:v=>v===0, calibrate:()=>rawLeft(true),
 note:'bold, code and lists rendered; a "rooms ask <line>" command under every line'});

/* THE TRACKS ARE THE FILM. The timeline shows what the page's __tracks() says, so that has
   to be what the film does: at the first frame of every drawing on the walker's track the
   film itself reports that drawing, and every shot clip starts on the frame the film cuts.
   The broken case asks the film one frame earlier, where the clip before it still runs. */
async function tracksOff(shift){
 const ctx=await browser.newContext({viewport:{width:600,height:500}}); let off=0;
 for(const [pg,sizes] of [['oq-kocha/build/oq-kocha.html',[64,46]],['whiteout/whiteout.html',[]]]){
  const p=await ctx.newPage(); await p.goto(`${BASE}/w/studio/projects/${pg}?embed=1`);
  await p.waitForFunction(()=>window.__ready===true,null,{timeout:120000});
  off+=await p.evaluate(([shift,sizes])=>{
   const T=window.__tracks(), by=id=>T.find(t=>t.id===id), pick=(L,n)=>L.filter(it=>it.f>0).filter((_,i,A)=>i%Math.ceil(A.length/n)===0);
   let off=0;
   for(const it of pick(by('shots').items,13)) if(window.__frameTo(it.f-shift,...sizes).shot!==it.label) off++;
   const d=by('drawA');
   if(d) for(const it of pick(d.items,14)){ const r=window.__frameTo(it.f-shift,...sizes); if((r.idx<0?'stand':String(r.idx+1))!==it.label) off++; }
   for(const t of T) for(const it of t.items) if(!(Number.isInteger(it.f)&&it.f>=0&&it.f<window.__totalFrames)) off++;
   return off; },[shift,sizes]);
  await p.close(); }
 await ctx.close(); return off;
}
await check({name:'studio/tracks-match-film', unit:'clips that do not start where the film changes',
 measure:()=>tracksOff(0), pass:v=>v===0, calibrate:()=>tracksOff(1),
 note:'oq-kocha: shots and the walker\'s drawings; whiteout: its 13 shots; every item inside the film'});

/* A CLIP GOES TO ITS FRAME AND NAMES ITS LINE. In the studio a click on a clip puts the
   film on the clip's first frame and shows where the clip is declared -- a file and a
   line that really holds that declaration. The broken case expects the frame after. */
async function clipOff(shift){
 const p=await studio('#whiteout'); await ready(p,'whiteout');
 const t=await p.evaluate(()=>{ const ti=S.tracks.findIndex(t=>t.id==='steel'); return {ti,f:S.tracks[ti].items[0].f,n:S.tracks.length}; });
 await p.click(`.tl-item[data-t="${t.ti}"][data-i="0"]`);
 await p.waitForFunction(()=>S.mode==='frame'&&!raf&&/whiteout\.html:\d+/.test(document.getElementById('tlInfo').textContent),null,{timeout:30000}).catch(()=>{});
 const r=await p.evaluate(()=>({page:document.getElementById('stage').contentWindow.__frame().frame,
  info:document.getElementById('tlInfo').textContent, lanes:document.querySelectorAll('.tl-lane').length}));
 const line=+((r.info.match(/whiteout\.html:(\d+)/)||[])[1]);
 const src=readFileSync(join(ROOT,'studio/projects/whiteout/whiteout.html'),'utf8').split('\n')[line-1]||'';
 await done(p);
 return (r.page===t.f+shift?0:1)+(src.includes('const SCORE=[')?0:1)+(r.lanes===t.n?0:1);
}
await check({name:'studio/clip-goes-to-frame', unit:'faults: frame, source line, lanes drawn',
 measure:()=>clipOff(0), pass:v=>v===0, calibrate:()=>clipOff(1),
 note:'whiteout: the steel hit on the sound track, declared in the SCORE table'});

/* A LAYER SWITCH CHANGES THE PICTURE, AND ONLY THAT LAYER'S. Snow off must change the
   frame; the broken case switches a layer the film does not have, which must change nothing. */
async function layerChange(id){
 const ctx=await browser.newContext({viewport:{width:600,height:500}}), p=await ctx.newPage();
 await p.goto(`${BASE}/w/studio/projects/oq-kocha/build/oq-kocha.html?embed=1`);
 await p.waitForFunction(()=>window.__ready===true,null,{timeout:120000});
 const n=await p.evaluate(id=>{ const c=document.getElementById('c'), gl=c.getContext('webgl2');
  const px=()=>{ const b=new Uint8Array(120*86*4); gl.readPixels(0,0,120,86,gl.RGBA,gl.UNSIGNED_BYTE,b); return b; };
  window.__frameTo(40,120,86); const a=px(); window.__layer(id,false); const b=px();
  let n=0; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) n++; return n; },id);
 await ctx.close(); return n;
}
await check({name:'studio/layer-switches', unit:'pixel values changed by switching snow off',
 measure:()=>layerChange('snow'), pass:v=>v>0, calibrate:()=>layerChange('no-such-layer'),
 note:'oq-kocha frame 40; the layers are ink lines, snow and fog'});

/* A CHANGE ON THE TIMELINE IS A CHANGE IN THE CODE. Selecting a clip, typing a new length
   and pressing Apply rewrites that row's number in the film's source; the film reloads
   with the new length on its track; Undo puts the old number back. The broken case asks
   for a length under the clip's own minimum, which must change nothing. */
async function editOff(value){
 editPage();
 const p=await studio('#t-edit'); await ready(p,'t-edit');
 const src=()=>readFileSync(EDIT_PAGE,'utf8'), has=(k,n)=>src().includes(`{k:'${k}', df:${n}}`);
 await p.click('.tl-item[data-t="0"][data-i="1"]');
 await p.fill('#tlEdit input',String(value)); await p.click('#tlApply');
 await p.waitForFunction(()=>S.ready&&S.tracks[0]&&S.tracks[0].items[1].n===25&&!S.pending,null,{timeout:12000}).catch(()=>{});
 let off=(has('b',25)?0:1)+(has('a',10)?0:1)+(await p.evaluate(()=>S.tracks[0].items[1].n===25&&S.total===35)?0:1);
 if(!off){ await p.click('#tlUndo');
  await p.waitForFunction(()=>S.ready&&S.tracks[0]&&S.tracks[0].items[1].n===20,null,{timeout:12000}).catch(()=>{});
  off+=(has('b',20)?0:1); }
 if(!off){                                          // and by hand: the clip's right edge, five frames to the right
  const g=await p.locator('.tl-item[data-t="0"][data-i="1"] .tl-grip').boundingBox(), lane=await p.locator('.tl-lane').first().boundingBox();
  await p.mouse.move(g.x+g.width/2,g.y+g.height/2); await p.mouse.down();
  await p.mouse.move(g.x+g.width/2+lane.width*5/30,g.y+g.height/2,{steps:6}); await p.mouse.up();
  await p.waitForFunction(()=>S.ready&&S.tracks[0]&&S.tracks[0].items[1].n===25,null,{timeout:12000}).catch(()=>{});
  off+=(has('b',25)?0:1); }
 await done(p); editPage();
 return off;
}
await check({name:'studio/edit-in-timeline', unit:'faults: the row written, the other row kept, the film reloaded, undo',
 measure:()=>editOff(25), pass:v=>v===0, calibrate:()=>editOff(0),
 note:'a fake film whose table is in its own page; clip b 20 → 25 typed, undone, then dragged to 25'});

/* THE LAYOUT HOLDS AT EVERY WIDTH. Under 700 px the list sat in a 70vh row of its own and
   the header broke in two; on a phone the shot names pushed the page sideways; on a
   desktop a long work name widened the list past its own edge instead of ending in "…".
   The broken case puts the old rules back. */
async function layoutOff(oldRules){
 let off=0;
 for(const [w,h] of [[1440,900],[700,900],[390,844]]){
  const p=await studio('#whiteout/notes',{width:w,height:h}); await ready(p);   // 13 shots: the widest strip
  if(oldRules) await p.addStyleTag({content:'main{grid-template-rows:none!important;grid-auto-rows:minmax(70vh,auto)!important} nav ul{grid-template-columns:none!important} .scrub{contain:none!important;grid-template-columns:none!important}'});
  const r=await p.evaluate(()=>{ const nav=document.querySelector('nav').getBoundingClientRect();
   return {header:document.querySelector('header').getBoundingClientRect().height, sw:document.documentElement.scrollWidth, iw:innerWidth,
    nav:nav.height, wide:[...document.querySelectorAll('#list .work')].filter(li=>li.getBoundingClientRect().right>nav.right+1).length}; });
  if(r.header>52) off++; if(r.sw>r.iw) off++;
  if(w<=700&&r.nav>160) off++;                    // a phone: the list is a row, not a box
  if(w>700&&r.wide) off++;                        // a desk: no row wider than the list
  await done(p);
 }
 return off;
}
await check({name:'studio/layout', unit:'layout faults at 1440, 700 and 390 px',
 measure:()=>layoutOff(false), pass:v=>v===0, calibrate:()=>layoutOff(true),
 note:'the header on one line, no sideways scroll; the list a row on a phone, and its names inside it on a desk'});

}finally{
 await browser.close().catch(()=>{});
 stopWatch(); S.close(); S.closeAllConnections?.();
 rmSync(ZARRA_PROBE,{force:true}); rmSync(join(ROOT,FAKE),{recursive:true,force:true});
 rmSync(NOTES,{recursive:true,force:true}); rmSync(CONF,{recursive:true,force:true});
}
const ok=report();
console.log(`  ${((Date.now()-t0)/1000).toFixed(1)}s\n`);
process.exit(ok?0:1);
