/* Bitta to'liq kadr: osmon -> uzoq zarra -> personaj -> yaqin zarra.
   Zarra tezliklari misol GIF dan o'lchangan (yaqin 5,-2 / uzoq 1,-1). */
import {ANDOZA, qur} from './bosh.mjs';
import {portret, USLUB} from './portret.mjs';
import {writeFileSync} from 'fs';
const W=540,H=304;
const P={...ANDOZA, egilish:24, R:58};
const svg=portret(P,196,150);
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#000;display:grid;place-items:center}
#w{position:relative;width:${W}px;height:${H}px;background:#04051c}
#w>*{position:absolute;inset:0}
</style></head><body><div id="w">
<canvas id="uzoq" width="${W}" height="${H}"></canvas>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<style>${USLUB}</style>${svg}</svg>
<canvas id="yaqin" width="${W}" height="${H}"></canvas>
</div><script>
const W=${W},H=${H};
function rng(s){return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;}}
/* o'lchangan: uzoq 1127 mayda zarra (1,-1), yaqin 358 kattaroq (5,-2) */
const Q=[
 {c:'uzoq', n:1127, v:[1,-1], r:[0.5,1.6], a:[0.30,0.85], yum:0},
 {c:'yaqin',n: 309, v:[5,-2], r:[1.4,2.6], a:[0.25,0.70], yum:1},
 {c:'yaqin',n:  41, v:[5,-2], r:[2.6,4.0], a:[0.16,0.45], yum:2},
 {c:'yaqin',n:   8, v:[5,-2], r:[4.5,8.0], a:[0.06,0.18], yum:3},
];
const P=Q.map((q,qi)=>{const R=rng(1013+qi*7919),a=[];
 for(let i=0;i<q.n;i++)a.push({x:R()*W,y:R()*H,r:q.r[0]+R()*(q.r[1]-q.r[0]),al:q.a[0]+R()*(q.a[1]-q.a[0])});
 return a;});
const G={uzoq:document.getElementById('uzoq').getContext('2d'),
         yaqin:document.getElementById('yaqin').getContext('2d')};
function kadr(n){
 for(const k in G){ G[k].setTransform(1,0,0,1,0,0); G[k].clearRect(0,0,W,H); G[k].globalCompositeOperation='lighter'; }
 Q.forEach((q,qi)=>{ const g=G[q.c];
  for(const p of P[qi]){
   const x=((p.x+q.v[0]*n)%W+W)%W, y=((p.y+q.v[1]*n)%H+H)%H;
   if(q.yum===0){ g.fillStyle='rgba(213,214,237,'+p.al+')'; g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(p.r)),Math.max(1,Math.round(p.r))); }
   else{ const gr=g.createRadialGradient(x,y,0,x,y,p.r*2.2);
    gr.addColorStop(0,'rgba(243,238,255,'+p.al+')'); gr.addColorStop(1,'rgba(243,238,255,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,p.r*2.2,0,6.2832); g.fill(); }
  }});
 for(const k in G) G[k].globalCompositeOperation='source-over';
 return n;
}
window.__frameTo=kadr; kadr(0);
let t=0,o=0; (function yur(ts){ if(ts-o>=60){o=ts;kadr(t++);} requestAnimationFrame(yur); })(0);
</script></body></html>`;
writeFileSync('/home/claude/work/personaj/kadr.html',html);
console.log('kadr.html yozildi');
