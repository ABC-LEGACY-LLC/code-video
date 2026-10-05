/* TUNING LOOP -- changes a knob, draws, measures, keeps the closest.
   This is the smallest form of "a mechanism that fixes the drawing by itself". */
import {execSync} from 'child_process';
const PERSONAJ_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const measure=(env)=>{
 execSync('node film.mjs && rm -rf ff && node view3.mjs',{cwd:(PERSONAJ_DIR),env:{...process.env,...env},stdio:'pipe'});
 const o=execSync(`python3 -c "
import sys; sys.path.insert(0,'test')
from rhythm import load_result,trend,cuts
F=load_result('${PERSONAJ_DIR}/ff/??.png'); sp,d,m=cuts(F)
print(m, sp==[11,13], (max(d[i-1] for i in sp)/m if sp else 0), trend(F,range(0,10))[2], trend(F,range(13,21))[2])
"`,{cwd:(PERSONAJ_DIR)}).toString().trim().split(' ');
 return {median:+o[0], correct:o[1]==='True', cut:+o[2], k1:+o[3], k3:+o[4]};
};
const GOAL={median:0.337, cut:1.97, k1:14.3, k3:-17.7};
const error=r=>!r.correct?1e9:
 Math.abs(r.cut-GOAL.cut)/GOAL.cut
 +Math.abs(r.median-GOAL.median)/GOAL.median
 +Math.abs(r.k1-GOAL.k1)/20 +Math.abs(r.k3-GOAL.k3)/20;
let optimum=null;
const BUTTON=process.argv[2]||'K', OBLIQUE=(process.argv[3]||'0.35,0.5,0.65').split(',');
const FROZEN={}; for(const kv of (process.argv[4]||'').split(',').filter(Boolean)){const [a,b]=kv.split('=');FROZEN[a]=b;}
for(const v of OBLIQUE){
 const env={...FROZEN, ...(BUTTON==='K'?{K12:v,K23:v}:{[BUTTON]:v})}; const r=measure(env);
 const e=error(r);
 console.log(`${BUTTON}=${v}  median ${r.median.toFixed(3)} cut ${r.cut.toFixed(2)}x ${r.correct?'[11,13]':'WRONG'} shot 1 ${r.k1.toFixed(1)}% shot 3 ${r.k3.toFixed(1)}%  error ${e.toFixed(3)}`);
 if(!optimum||e<optimum.e) optimum={v,e,r};
}
console.log('\nCLOSEST:',BUTTON,'=',optimum.v,' error',optimum.e.toFixed(3));
