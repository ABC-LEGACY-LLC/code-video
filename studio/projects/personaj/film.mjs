import {frameSVG, SHEET, BLACK, MS, BOUNDARIES, STYLE_CSS, GRAD, W, H, BACKGROUND} from './images.mjs';
import {writeFileSync} from 'fs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
/* SNOW knobs: count, size, opacity, colour -- tuned with test/snow.py */
/* found with test/snow-tune.py: error 0.745 -> 0.140 */
const SNOW={n:+(process.env.SNOW_N||2.15), r:+(process.env.SNOW_R||1.3), a:+(process.env.SNOW_A||1),
 colour:process.env.SNOW_COLOUR||'214,208,250'};
/* the frame SVGs are in images.mjs (the same code as the hair fitting server) */
const frames=SHEET.map((P,i)=>frameSVG(i));
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#000;display:grid;place-items:center}
#w{position:relative;width:${W}px;height:${H}px;overflow:hidden;
 /* measured from the sample: in the right 28% of columns, particle-free via a median filter, 6 bands */
 background:${BACKGROUND}}
#w>*{position:absolute;inset:0}
svg{display:none} svg.ko{display:block}
#black{background:#000;opacity:0;pointer-events:none}
</style></head><body><div id="w">
<svg width="0" height="0"><defs>${GRAD}</defs></svg>
<canvas id="far" width="${W}" height="${H}"></canvas>
<canvas id="near" width="${W}" height="${H}"></canvas>
${frames.map((k,i)=>`<svg data-i="${i}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><style>${STYLE_CSS}</style>${k}</svg>`).join('\n')}
<div id="black"></div>
</div><script>
const W=${W},H=${H},N=${SHEET.length},BLACK=${JSON.stringify(BLACK.map(v=>+v.toFixed(4)))};
function rng(s){return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;}}
const QT=${JSON.stringify(SNOW)};
/* density profile from the sample: in the right 28% of columns, 6 bands from top to bottom */
const ZP=[3.39,6.41,9.18,10.99,12.49,12.10], ZM=Math.max(...ZP);
function density(y){const t=Math.min(5,Math.max(0,y/H*6-0.5)),i=Math.floor(t),f=t-i;
 return (ZP[i]+(ZP[Math.min(5,i+1)]-ZP[i])*f)/ZM;}
const Q=[{c:'far',n:Math.round(1700*QT.n),v:[1,-1],r:[0.5,1.5],a:[0.35,0.90],blur:0},
 {c:'near',n:Math.round(520*QT.n),v:[5,-2],r:[0.9,1.8],a:[0.35,0.85],blur:1},
 {c:'near',n:Math.round(40*QT.n),v:[5,-2],r:[1.8,2.8],a:[0.20,0.50],blur:2}];
const P=Q.map((q,qi)=>{const R=rng(1013+qi*7919),a=[];
 for(let i=0;i<q.n;i++)a.push({x:R()*W,y:R()*H,u:R(),r:(q.r[0]+R()*(q.r[1]-q.r[0]))*QT.r,al:Math.min(1,(q.a[0]+R()*(q.a[1]-q.a[0]))*QT.a)});return a;});
const G={far:document.getElementById('far').getContext('2d'),near:document.getElementById('near').getContext('2d')};
/* data-i is REQUIRED: otherwise the selector also catches the hidden <defs> svg that
   holds GRAD, and every frame shifts by one -- frame 0 comes out empty,
   and the last one is never drawn at all. */
const SV=[...document.querySelectorAll('#w>svg[data-i]')];
if(SV.length!==N) throw new Error('frame count does not match: '+SV.length+' != '+N);
const QD=document.getElementById('black');
function frame(n){
 const i=((n%N)+N)%N;
 SV.forEach((s,k)=>s.classList.toggle('ko',k===i));
 QD.style.opacity = window.__noBlack ? 0 : BLACK[i];
 for(const k in G){G[k].setTransform(1,0,0,1,0,0);G[k].clearRect(0,0,W,H);G[k].globalCompositeOperation='lighter';}
 if(!window.__noParticles) Q.forEach((q,qi)=>{const g=G[q.c];
  for(const p of P[qi]){
   const x=((p.x+q.v[0]*n)%W+W)%W,y=((p.y+q.v[1]*n)%H+H)%H;
   /* density depends on the place ON SCREEN, not on the particle itself: otherwise over 22
      frames the particles would drift 44 px up and break the profile. A particle
      fades in / out slowly when it crosses the density border. */
   const k=Math.min(1,Math.max(0,(density(y)-p.u)*6)); if(k<=0) continue;
   const al=p.al*k;
   if(q.blur===0){g.fillStyle='rgba('+QT.colour+','+al+')';const s=Math.max(1,Math.round(p.r));g.fillRect(Math.round(x),Math.round(y),s,s);}
   else{ /* a sharp core + a small glow -- not a soft disc */
    const gr=g.createRadialGradient(x,y,0,x,y,p.r*1.6);
    gr.addColorStop(0,'rgba('+QT.colour+','+al+')');gr.addColorStop(0.35,'rgba('+QT.colour+','+(al*0.55)+')');gr.addColorStop(1,'rgba('+QT.colour+',0)');
    g.fillStyle=gr;g.beginPath();g.arc(x,y,p.r*1.6,0,6.2832);g.fill();}}});
 for(const k in G)G[k].globalCompositeOperation='source-over';
 return i;
}
window.__frameTo=frame; window.__N=N; window.__BOUNDARIES=${JSON.stringify(BOUNDARIES)}; frame(0);
/* Confirmation: reads from the DOM which frame is actually VISIBLE -- not from a
   variable I set. Checked with this before capturing. */
window.__which=()=>{const k=SV.filter(e=>e.classList.contains('ko'));
 return {i:k.length?+k[0].dataset.i:-1, black:+(QD.style.opacity||0),
   visible:k.length, pieces:k.length?k[0].childElementCount:0};};
/* The playback loop spoils capturing: switching the frame every 60 ms, it would
   draw another frame after __frameTo(i). Now it can be stopped,
   and capturing stops it every time. */
let raf=null,t=0,o=0;
function run(ts){if(ts-o>=${MS}){o=ts;frame(t++);}raf=requestAnimationFrame(run);}
window.__stop=()=>{if(raf!==null){cancelAnimationFrame(raf);raf=null;}return true;};
window.__run=()=>{if(raf===null){o=0;raf=requestAnimationFrame(run);}};
window.__run();
</script></body></html>`;
writeFileSync((PERSONAJ_DIR + '/film.html'),html);
console.log('film.html:', SHEET.length, 'frames,', (html.length/1024|0), 'KB, cuts', BOUNDARIES.join(','));
