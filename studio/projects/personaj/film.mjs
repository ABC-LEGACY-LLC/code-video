import {kadrSVG, VARAQ, QORA, MS, CHEGARA, USLUB, GRAD, W, H, FON} from './tasvirlar.mjs';
import {writeFileSync} from 'fs';
/* QOR tugmalari: soni, o'lchami, shaffofligi, rangi -- test/qor.py bilan sozlanadi */
/* test/qor-sozla.py bilan topilgan: xato 0.745 -> 0.140 */
const QOR={n:+(process.env.QOR_N||2.15), r:+(process.env.QOR_R||1.3), a:+(process.env.QOR_A||1),
 rang:process.env.QOR_RANG||'214,208,250'};
/* kadr SVG lari tasvirlar.mjs da (soch moslash serveri bilan bir xil kod) */
const kadrlar=VARAQ.map((P,i)=>kadrSVG(i));
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#000;display:grid;place-items:center}
#w{position:relative;width:${W}px;height:${H}px;overflow:hidden;
 /* misoldan o'lchangan: o'ng 28% ustunlarda, median filtr bilan zarrasiz, 6 band */
 background:${FON}}
#w>*{position:absolute;inset:0}
svg{display:none} svg.ko{display:block}
#qora{background:#000;opacity:0;pointer-events:none}
</style></head><body><div id="w">
<svg width="0" height="0"><defs>${GRAD}</defs></svg>
<canvas id="uzoq" width="${W}" height="${H}"></canvas>
<canvas id="yaqin" width="${W}" height="${H}"></canvas>
${kadrlar.map((k,i)=>`<svg data-i="${i}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><style>${USLUB}</style>${k}</svg>`).join('\n')}
<div id="qora"></div>
</div><script>
const W=${W},H=${H},N=${VARAQ.length},QORA=${JSON.stringify(QORA.map(v=>+v.toFixed(4)))};
function rng(s){return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;}}
const QT=${JSON.stringify(QOR)};
/* zichlik profili misoldan: o'ng 28% ustunlarda, tepadan pastga 6 band */
const ZP=[3.39,6.41,9.18,10.99,12.49,12.10], ZM=Math.max(...ZP);
function zich(y){const t=Math.min(5,Math.max(0,y/H*6-0.5)),i=Math.floor(t),f=t-i;
 return (ZP[i]+(ZP[Math.min(5,i+1)]-ZP[i])*f)/ZM;}
const Q=[{c:'uzoq',n:Math.round(1700*QT.n),v:[1,-1],r:[0.5,1.5],a:[0.35,0.90],yum:0},
 {c:'yaqin',n:Math.round(520*QT.n),v:[5,-2],r:[0.9,1.8],a:[0.35,0.85],yum:1},
 {c:'yaqin',n:Math.round(40*QT.n),v:[5,-2],r:[1.8,2.8],a:[0.20,0.50],yum:2}];
const P=Q.map((q,qi)=>{const R=rng(1013+qi*7919),a=[];
 for(let i=0;i<q.n;i++)a.push({x:R()*W,y:R()*H,u:R(),r:(q.r[0]+R()*(q.r[1]-q.r[0]))*QT.r,al:Math.min(1,(q.a[0]+R()*(q.a[1]-q.a[0]))*QT.a)});return a;});
const G={uzoq:document.getElementById('uzoq').getContext('2d'),yaqin:document.getElementById('yaqin').getContext('2d')};
/* data-i SHART: aks holda selektor GRAD ni saqlaydigan yashirin <defs> svg ni
   ham ushlaydi va hamma tasvir bittaga suriladi -- 0-tasvir bo'sh chiqadi,
   oxirgisi esa umuman chizilmaydi. */
const SV=[...document.querySelectorAll('#w>svg[data-i]')];
if(SV.length!==N) throw new Error('tasvir soni mos emas: '+SV.length+' != '+N);
const QD=document.getElementById('qora');
function kadr(n){
 const i=((n%N)+N)%N;
 SV.forEach((s,k)=>s.classList.toggle('ko',k===i));
 QD.style.opacity = window.__qorasiz ? 0 : QORA[i];
 for(const k in G){G[k].setTransform(1,0,0,1,0,0);G[k].clearRect(0,0,W,H);G[k].globalCompositeOperation='lighter';}
 if(!window.__zarrasiz) Q.forEach((q,qi)=>{const g=G[q.c];
  for(const p of P[qi]){
   const x=((p.x+q.v[0]*n)%W+W)%W,y=((p.y+q.v[1]*n)%H+H)%H;
   /* zichlik EKRANDAGI joyga bog'liq, zarraning o'ziga emas: aks holda 22
      tasvirda zarralar 44 px yuqoriga surilib, profil buzilardi. Zarra
      zichlik chegarasini kesib o'tganda sekin paydo bo'ladi / so'nadi. */
   const k=Math.min(1,Math.max(0,(zich(y)-p.u)*6)); if(k<=0) continue;
   const al=p.al*k;
   if(q.yum===0){g.fillStyle='rgba('+QT.rang+','+al+')';const s=Math.max(1,Math.round(p.r));g.fillRect(Math.round(x),Math.round(y),s,s);}
   else{ /* o'tkir yadro + kichik yorug'lik -- yumshoq disk emas */
    const gr=g.createRadialGradient(x,y,0,x,y,p.r*1.6);
    gr.addColorStop(0,'rgba('+QT.rang+','+al+')');gr.addColorStop(0.35,'rgba('+QT.rang+','+(al*0.55)+')');gr.addColorStop(1,'rgba('+QT.rang+',0)');
    g.fillStyle=gr;g.beginPath();g.arc(x,y,p.r*1.6,0,6.2832);g.fill();}}});
 for(const k in G)G[k].globalCompositeOperation='source-over';
 return i;
}
window.__frameTo=kadr; window.__N=N; window.__CHEGARA=${JSON.stringify(CHEGARA)}; kadr(0);
/* Tasdiq: qaysi tasvir KO'RINIB turganini DOM dan o'qiydi -- men qo'ygan
   o'zgaruvchidan emas. Suratga olishdan oldin shu bilan tekshiriladi. */
window.__qaysi=()=>{const k=SV.filter(e=>e.classList.contains('ko'));
 return {i:k.length?+k[0].dataset.i:-1, qora:+(QD.style.opacity||0),
   korinadi:k.length, bolak:k.length?k[0].childElementCount:0};};
/* O'ynatish halqasi suratga olishni buzadi: u har 60 ms da kadrni almashtirib,
   __frameTo(i) dan keyin boshqa tasvirni chizib qo'yardi. Endi to'xtatsa
   bo'ladi va suratga olish har safar to'xtatadi. */
let raf=null,t=0,o=0;
function yur(ts){if(ts-o>=${MS}){o=ts;kadr(t++);}raf=requestAnimationFrame(yur);}
window.__toxta=()=>{if(raf!==null){cancelAnimationFrame(raf);raf=null;}return true;};
window.__yur=()=>{if(raf===null){o=0;raf=requestAnimationFrame(yur);}};
window.__yur();
</script></body></html>`;
writeFileSync('/home/claude/work/personaj/film.html',html);
console.log('film.html:', VARAQ.length, 'tasvir,', (html.length/1024|0), 'KB, kesish', CHEGARA.join(','));
