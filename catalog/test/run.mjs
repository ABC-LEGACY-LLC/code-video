/* ===== THE CHECKS =====
   Every check carries its own deliberately broken case. If the broken case passes
   too, the check is UNPROVEN and the build fails: a check that passes and holds
   nothing is the worst check, because it gives confidence and returns nothing. */
import {check,report} from './lib.mjs';
import {load,verify,confirm,prepare,missing,FIELDS} from '../tools/card.mjs';
import {grab,metrics} from '../tools/measure.mjs';
import {rmSync} from 'fs';
const K=load();
const at=(k,p)=>new URL(p,'file://'+k._f).pathname;
const t0=Date.now();

/* EVERY CARD ANSWERS EVERY QUESTION. A card with a field missing is not a card but a
   patch, and a patch cannot be compared with another project. */
await check({name:'card/all-fields', unit:'fields missing on the poorest card',
 measure:()=>Math.max(...K.map(k=>FIELDS.filter(m=>k[m]==null).length
                               + (k.count?0:1) + (k.measure?0:1))),
 pass:v=>v===0,
 calibrate:()=>{ const n={...K[0]}; delete n.look;
                 return FIELDS.filter(m=>n[m]==null).length; },
 note:`${K.length} cards, each with ${FIELDS.length} fields + count + measure`});

/* DOES THE CARD STILL AGREE WITH ITS SOURCE. This is the main check: method lines
   are written by hand, the count is taken from the source, and each line is bound to
   the count. When the source changes -- the number of poses goes from 4 to 6 -- the
   line goes stale and fails here. */
await check({name:'card/matches-count', unit:'stale method lines',
 measure:()=>K.reduce((a,k)=>a+verify(k).stale.length,0),
 pass:v=>v===0,
 calibrate:()=>{                       // a card with one number in one line changed
  const u=K[0].method[1];
  return confirm(u.text.replace(/\d+/,'999'), K[0].count.tables.SHOTS).ok? 0 : 1; },
 note:'every method line is bound to one value in the count, and that value has to stand in the line'});

/* ===== THE BUILD CHAIN =====
   A card's page may not sit in the source: Oq Ko'cha's page is built, and build/ is
   in .gitignore. This check records the error that happened in CI -- that job tried
   to measure the film's built page without building it, so it could never pass.

   The calibration is the state without a build: the page is deleted and NOT built.
   If that still reads "all fine", the check does not see the failure it watches.
   Both branches build the page again at the end, since the next checks take frames
   from that file. */
const BUILT=K.filter(k=>k.frame?.build);
await check({name:'frame/build-chain', unit:'pages missing after the build',
 measure:()=>{ BUILT.forEach(k=>rmSync(at(k,k.frame.file),{force:true}));
               prepare(BUILT);
               return missing(BUILT).length; },
 pass:v=>v===0,
 calibrate:()=>{ BUILT.forEach(k=>rmSync(at(k,k.frame.file),{force:true}));
                 const n=missing(BUILT).length;
                 prepare(BUILT);                       // put back for the next checks
                 return n; },
 note:`${BUILT.length} card(s) build their own page: `+BUILT.map(k=>`${k.name} (${k.frame.build.command})`).join(', ')});

/* ===== THE MEASURING TOOL IS CALIBRATED TOO =====
   Both checks are computed from ONE grab. The earlier version called the tool five
   times, and every call opened the browser again: the run went past ten minutes, one
   of the calls failed, and the calibration came out "—" -- the check was UNPROVEN,
   and no reason was given. Now the harness prints a calibration's error as well: a
   swallowed error is what this project stands against. */
const OQ=K.find(k=>k.name==="Oq Ko'cha");
const FRAMES=await grab({...OQ.frame, file:at(OQ,OQ.frame.file), size:[420,302]});
const BLURRED=await grab({...OQ.frame, file:at(OQ,OQ.frame.file), size:[420,302], blur:3});

/* INDEPENDENT OF ORDER. The old code took edges from the FIRST frame only -- the
   answer depended on the order the frames came in, and Not A Measurement gave 28.4
   on one frame and 45.9 on another. That broke two conclusions: "Oq Ko'cha and Not A
   Measurement are drawn by the same hand" was that artefact.

   The first two versions of the check were invalid themselves. "An average of three
   frames is steadier than one" turned out to depend on the scene: Oq Ko'cha's frames
   are alike (27.0 / 29.1 / 29.0), so even the old method was nearly right there and
   the calibration showed nothing. On a project sampled by time, the calibration was
   unstable itself -- 19.6 and 5.4.

   The order test does not depend on the scene: the same frames in reverse order must
   give the same answer, and the old method cannot do that. */
const reversed=[...FRAMES].reverse();
await check({name:'measure/order-independent', unit:'difference in hardEdgeShare, points',
 measure:()=>+Math.abs(metrics(FRAMES).hardEdgeShare-metrics(reversed).hardEdgeShare).toFixed(2),
 pass:v=>v===0,
 calibrate:()=>+Math.abs(metrics([FRAMES[0]]).hardEdgeShare-metrics([reversed[0]]).hardEdgeShare).toFixed(2),
 note:'each frame is measured on its own and averaged, so order cannot matter'});

/* AND IT HAS TO NOTICE THE BROKEN. In a blurred frame both edges and texture go; a
   measurement that does not notice does not know what it measures. */
await check({name:'measure/sees-the-broken', unit:'how many times texture drops when blurred',
 measure:()=>+(metrics(FRAMES).texture/Math.max(metrics(BLURRED).texture,1e-6)).toFixed(2),
 pass:v=>v>2.5,
 calibrate:()=>1.0,                    // without the blur the ratio is exactly one
 note:'the tool is calibrated too, like the projects'});

/* A CLAIM AND A GOAL ARE TWO DIFFERENT THINGS, and mixing them gave three false
   "failures" on the first try. A CLAIM is a promise about what a project is now:
   Whiteout is WHITE, Mushuk is COLOURFUL. If it breaks, that is a regression. A GOAL
   is where a project is going: Whiteout's value range should reach 90, it is 50 now.
   An unmet goal is not a fault but a work plan -- it is not hidden, it just does not
   fail the build. */
const read=(o,key)=>key==='value.range'? o.value[1]-o.value[0]
                  : key==='value.low'? o.value[0] : o[key];
for(const k of K) for(const [key,[op,lim,what]] of Object.entries(k.claims)){
 await check({name:`claim/${k.name}/${key}`, unit:what,
  measure:()=>read(k.measure,key),
  pass:v=>op==='>'? v>lim : v<lim,
  calibrate:()=>lim,                   // the limit itself must not pass
  note:`${op} ${lim}`});
}
const ok=report();
console.log('  GOALS — an unmet goal is a work plan, not a fault');
for(const k of K) for(const [key,[op,lim,what]] of Object.entries(k.goals||{})){
 const v=read(k.measure,key), met=op==='>'? v>lim : v<lim;
 console.log(`   ${met?'met ':'open'}  ${(k.name+' / '+key).padEnd(42)} ${String(v).padStart(7)} ${op} ${lim}   ${what}`);
}
console.log();
console.log(`  ${((Date.now()-t0)/1000).toFixed(1)}s\n`);
process.exit(ok?0:1);
