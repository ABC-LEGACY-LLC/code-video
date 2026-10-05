/* ===== MEASURE — exactly the method that was applied to the sample GIF =====
   The particle layers are separated by spatial frequency (large particle = low
   frequency), then the previous image is shifted by a candidate speed and how well it
   matches the next one is measured. The best shift is that layer's speed. A direct
   shift, not an FFT, so the sign cannot get mixed up: in the GIF exactly that mix-up
   showed the direction reversed. */
import {chromium} from 'playwright';
import {existsSync,readdirSync} from 'fs';
function findChrome(){
 const root='/opt/pw-browsers'; if(!existsSync(root)) return null;
 for(const d of readdirSync(root).filter(x=>x.startsWith('chromium')&&!x.includes('headless')).sort().reverse()){
  const p=`${root}/${d}/chrome-linux/chrome`; if(existsSync(p)) return p;
 } return null;
}
export const PAGE='file://'+new URL('../zarra.html',import.meta.url).pathname;
let br=null,pg=null;
export async function open(){
 if(pg) return pg;
 const args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
 const exe=findChrome();
 br=await chromium.launch(exe?{args,executablePath:exe}:{args});
 pg=await br.newPage({viewport:{width:700,height:420}});
 const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message)));
 await pg.goto(PAGE);
 /* READINESS IS ASKED FOR: this used to sleep 300 ms, and on a slow runner a sleep
    becomes a race. The page says so itself at the end of its script. */
 await pg.waitForFunction(()=>window.__ready===true,null,{timeout:60000})
  .catch(()=>{ throw new Error('the page never said it was ready (window.__ready)'+(errs.length?': '+errs.join(' | '):'')); });
 if(errs.length) throw new Error('page error: '+errs.join(' | '));
 return pg;
}
export async function close(){ if(br) await br.close(); br=pg=null; }
process.on('exit',()=>{ try{ br&&br.close(); }catch(e){} });

/* EVERY FRAME IS CARRIED OUT ON ITS OWN. The earlier version returned them all in one
   evaluate -- five frames were 820 thousand numbers, CDP serialisation hung there, and
   the measurement did not finish in five minutes. One frame takes a second. */
export async function frames(n,opt=null){
 const p=await open();
 const r=[];
 const W=await p.evaluate(()=>document.querySelector('canvas').width);
 const H=await p.evaluate(()=>document.querySelector('canvas').height);
 for(let i=0;i<n;i++){
  r.push(await p.evaluate(([i,opt])=>{
   window.__resetOpt(); if(opt) window.__opt(opt);
   const c=document.querySelector('canvas'), g=c.getContext('2d');
   window.__frameTo(i);
   const d=g.getImageData(0,0,c.width,c.height).data;
   const a=new Array(c.width*c.height);
   for(let k=0;k<a.length;k++) a[k]=(d[k*4]+d[k*4+1]+d[k*4+2])/3;
   window.__resetOpt();
   return a;
  },[i,opt]));
 }
 return {W,H,r};
}

/* a box blur: the one thing that separates the layers is particle size */
function blur(a,W,H,k){
 const t=new Float32Array(W*H), o=new Float32Array(W*H);
 for(let y=0;y<H;y++){ let s=0;
  for(let x=-k;x<=k;x++) s+=a[y*W+((x%W)+W)%W];
  for(let x=0;x<W;x++){ t[y*W+x]=s/(2*k+1);
   s+=a[y*W+((x+k+1)%W)]-a[y*W+((x-k)%W+W)%W]; } }
 for(let x=0;x<W;x++){ let s=0;
  for(let y=-k;y<=k;y++) s+=t[(((y%H)+H)%H)*W+x];
  for(let y=0;y<H;y++){ o[y*W+x]=s/(2*k+1);
   s+=t[((y+k+1)%H)*W+x]-t[(((y-k)%H+H)%H)*W+x]; } }
 return o;
}
const aboveMean=(a)=>{ let m=0; for(const v of a) m+=v; m/=a.length;
                 const o=new Float32Array(a.length);
                 for(let i=0;i<a.length;i++) o[i]=Math.max(0,a[i]-m); return o; };

const CACHE=new Map();
export function velocity(F,W,H,{low}){
 /* THE KEY COMES FROM THE WHOLE IMAGE. It used to take the first pixel, which was the
    same background in both cases: even when the calibration was called with another
    speed, the cache returned the old answer, and three checks came out UNPROVEN. The
    calibration exists to catch exactly that. */
 let h=low?1:0; for(const a of F){ for(let i=0;i<a.length;i+=97) h=(h*31+a[i])|0; }
 const key=low+':'+F.length+':'+h;
 if(CACHE.has(key)) return CACHE.get(key);
 // low=true -> large particles (blurred), false -> small ones (the blur subtracted)
 const L=F.map(a=>{ const b=aboveMean(a), s=blur(b,W,H,2);
                    if(low) return s;
                    /* DENORMAL NUMBERS. b and s are very close, the difference comes out
                       as a denormal like 1e-40, and denormal arithmetic is tens of times
                       slower: the near layer's correlation finished in 0.5 s, the far
                       layer's dragged on for minutes. That was the whole difference. */
                    const o=new Float32Array(b.length);
                    for(let i=0;i<b.length;i++){ const d=b[i]-s[i]; o[i]=Math.abs(d)<1e-6?0:d; }
                    return o; });
 /* A CIRCULAR SHIFT DOES NOT CHANGE THE NORM, so it is computed outside the shift
    loop: the earlier version counted it again for every shift, tripled the work and
    did not fit in ten minutes. */
 const N=L.map(a=>{ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*a[i]; return Math.sqrt(s)+1e-9; });
 const buf=new Float32Array(W*H);
 const shift=(a,dx,dy)=>{                     // a circular shift, no modulo in the inner loop
  for(let y=0;y<H;y++){ const ys=((y-dy)%H+H)%H, o=y*W, so=ys*W;
   const k=((-dx)%W+W)%W;
   for(let x=0;x<W-k;x++) buf[o+x]=a[so+x+k];
   for(let x=W-k;x<W;x++) buf[o+x]=a[so+x+k-W];
  } return buf; };
 const match=(dx,dy)=>{ let s=0;
  for(let i=1;i<L.length;i++){
   const a=shift(L[i-1],dx,dy), b=L[i]; let ab=0;
   for(let k=0;k<W*H;k++) ab+=a[k]*b[k];
   s+=ab/(N[i-1]*N[i]); }
  return s/(L.length-1); };
 let best=[-1,0,0];
 for(let dy=-4;dy<=4;dy++) for(let dx=-8;dx<=8;dx++){ const v=match(dx,dy);
  if(v>best[0]) best=[v,dx,dy]; }
 const r={match:best[0], dx:best[1], dy:best[2]};
 CACHE.set(key,r); return r;
}
