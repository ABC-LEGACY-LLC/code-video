/* Placing SHOT 1 by the FACE TRACE. The sample's near eye was read off a 5x grid
   (320x180): 1:(95,46) 6:(94,46) 9:(97,45) 10:(105,51) 11:(111,54); linear in between.
   For every drawing, the shift that brings our near eye there is written into the
   trace table (not by the hair centre: the hair moves differently from the face
   -- the wind). */
import {readFileSync, writeFileSync} from 'fs';
const PERSONAJ_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const F=(PERSONAJ_DIR + '/traces.json');
const A={0:[95,46],5:[94,46],8:[97,45],9:[105,51],10:[111,54]};
const k=Object.keys(A).map(Number).sort((a,b)=>a-b);
const target=i=>{ if(A[i]) return A[i]; let a=k.filter(x=>x<i).pop(), b=k.find(x=>x>i); const t=(i-a)/(b-a); return [A[a][0]+(A[b][0]-A[a][0])*t, A[a][1]+(A[b][1]-A[a][1])*t]; };
for(let it=0;it<3;it++){
 const {SHEET}=await import((PERSONAJ_DIR + '/sheet.mjs?')+Date.now()+it);
 const {build}=await import((PERSONAJ_DIR + '/head.mjs'));
 const IZ=JSON.parse(readFileSync(F,'utf8')); let maxd=0;
 for(let i=0;i<11;i++){
  const P0=SHEET[i]; const [cx,cy,kk]=P0.__place; const P={...P0,R:P0.R*kk};
  const b=build(P,cx,cy); const [x,y]=b.Kf(b.eyes[0].u*P.R, b.kz*P.R);
  const [tx,ty]=target(i).map(v=>v*540/320);
  IZ[i][0]=+(IZ[i][0]+(tx-x)).toFixed(2); IZ[i][1]=+(IZ[i][1]+(ty-y)).toFixed(2);
  maxd=Math.max(maxd,Math.hypot(tx-x,ty-y)*320/540);
 }
 writeFileSync(F,JSON.stringify(IZ)); console.log('round',it,'largest diff (at 320)',maxd.toFixed(2),'px');
}
