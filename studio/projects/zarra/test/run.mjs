/* ===== THE CHECKS =====
   This page claims one thing: two particle layers, at measured speeds. So the check
   does one thing too -- it measures the speed AGAIN from the screen and compares it
   with the source number. Every check carries its own deliberately broken case. */
import {check,report} from './lib.mjs';
import {frames,velocity,close} from './measure.mjs';

/* MEASURED FROM THE SAMPLE GIF -- not written by hand, counted */
const SOURCE={ near:[5,-2], far:[1,-1] };

const F=await frames(6);
const one=(low)=>velocity(F.r,F.W,F.H,{low});

await check({name:'zarra/near-layer', unit:'px/frame (dx,dy)',
 measure:()=>{ const t=one(true);  return `${t.dx},${t.dy}`; },
 pass:v=>v===SOURCE.near.join(','),
 /* THE BROKEN CASE: the near layer is set to the far layer's speed. If the check
    still passes, it reads from its own expectation, not from the screen. */
 calibrate:async()=>{ const G=await frames(6,{v1:SOURCE.far,v2:SOURCE.far,v3:SOURCE.far});
                      const t=velocity(G.r,G.W,G.H,{low:true}); return `${t.dx},${t.dy}`; },
 note:`${SOURCE.near.join(',')} in the sample GIF -- large, soft particles, match 0.79`});

await check({name:'zarra/far-layer', unit:'px/frame (dx,dy)',
 measure:()=>{ const t=one(false); return `${t.dx},${t.dy}`; },
 pass:v=>v===SOURCE.far.join(','),
 calibrate:async()=>{ const G=await frames(6,{v0:SOURCE.near});
                      const t=velocity(G.r,G.W,G.H,{low:false}); return `${t.dx},${t.dy}`; },
 note:`${SOURCE.far.join(',')} in the sample GIF -- small, sharp particles`});

/* THE PARALLAX ITSELF. If the two layers do not move at DIFFERENT speeds, it is just
   one layer: the sense of depth comes from that difference, not from the mean speed. */
await check({name:'zarra/parallax', unit:'near/far speed ratio',
 measure:()=>{ const a=one(true), b=one(false);
               return +(Math.hypot(a.dx,a.dy)/Math.max(Math.hypot(b.dx,b.dy),1e-9)).toFixed(2); },
 pass:v=>v>2.0,
 calibrate:async()=>{ const G=await frames(6,{v0:SOURCE.near});   // everything equally fast
                      const a=velocity(G.r,G.W,G.H,{low:true}), b=velocity(G.r,G.W,G.H,{low:false});
                      return +(Math.hypot(a.dx,a.dy)/Math.max(Math.hypot(b.dx,b.dy),1e-9)).toFixed(2); },
 note:'5.39 / 1.41 = 3.8 in the sample'});

/* DETERMINISM: if the same frame does not come out the same twice, none of the
   numbers above is a measurement. */
await check({name:'zarra/determinism', unit:'pixels that differed',
 measure:async()=>{ const a=await frames(1), b=await frames(1);
                    let n=0; for(let i=0;i<a.r[0].length;i++) if(a.r[0][i]!==b.r[0][i]) n++;
                    return n; },
 pass:v=>v===0,
 calibrate:async()=>{ const a=await frames(2);
                      let n=0; for(let i=0;i<a.r[0].length;i++) if(a.r[0][i]!==a.r[1][i]) n++;
                      return n; },
 note:'the next frame has to differ, or the comparison sees nothing'});

const ok=report();
await close();
process.exit(ok?0:1);
