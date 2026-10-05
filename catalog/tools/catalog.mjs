/* The catalog page is made FROM THE CARDS. A page written by hand drifts away from
   the cards -- and once it did: the published page carried the conclusion "Oq Ko'cha
   and Not A Measurement are drawn by the same hand", which was an artefact of
   measuring a single frame. With a generator, the page cannot go stale against them. */
import {writeFileSync,readFileSync,mkdirSync} from 'fs';
import {dirname} from 'path';
import {load,prepare} from './card.mjs';
import {chromium} from 'playwright';
import {existsSync,readdirSync} from 'fs';
const K=load();
prepare(K);                 // a built page is built every time: no stale frame gets into the catalog
const at=(k,p)=>new URL(p,'file://'+k._f).pathname;
function chrome(){const r='/opt/pw-browsers';if(!existsSync(r))return undefined;
 for(const d of readdirSync(r).filter(x=>x.startsWith('chromium')&&!x.includes('headless')).sort().reverse()){
  const p=`${r}/${d}/chrome-linux/chrome`; if(existsSync(p))return p;} return undefined;}

const b=await chromium.launch({executablePath:chrome(),
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const still={};
for(const k of K){
 const pg=await b.newPage({viewport:{width:1100,height:760}});
 await pg.goto('file://'+at(k,k.frame.file));
 const t=k.frame.frames[0];
 /* a page with a hook says when it is ready; on a page without one, 1400 ms and t
    seconds are the sampling schedule (see the comment in measure.mjs), untouched
    until item 10 */
 if(k.frame.hook) await pg.waitForFunction(h=>window.__ready===true&&typeof window[h]==='function',k.frame.hook,{timeout:120000});
 else await pg.waitForTimeout(1400+t*1000);
 still[k.name]=await pg.evaluate(([t,hook])=>{
  if(hook) window[hook](t,720,518);
  const c=[...document.querySelectorAll('canvas')].sort((a,b)=>b.width*b.height-a.width*a.height)[0];
  const s=document.createElement('canvas'); s.width=520; s.height=Math.round(520*c.height/c.width);
  s.getContext('2d').drawImage(c,0,0,s.width,s.height);
  return s.toDataURL('image/jpeg',0.78);},[t,k.frame.hook||null]);
 await pg.close();
}
await b.close();

const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const bar=(lab,val,mx,unit='%',thin=false)=>`<div class="bar"><div class="lab"><span>${lab}</span><b>${val}${unit}</b></div>
   <div class="track"><div class="fill${thin?' thin':''}" style="width:${Math.min(100,val/mx*100).toFixed(1)}%"></div></div></div>`;
const cards=K.map(k=>{
 const o=k.measure, [lo,hi]=o.value;
 const sw=o.palette.map(p=>`<i style="width:${p.share}%;background:${p.hex}"></i>`).join('');
 const us=k.method.map(u=>`<li>${e(u.text)} <span class="evidence">${e(u.evidence)}</span></li>`).join('');
 const gl=Object.entries(k.goals||{}).map(([key,[op,lim,what]])=>`${e(what)}`).join(' · ');
 return `<article class="spec">
 <div class="plate"><img src="${still[k.name]}" alt="${e(k.name)}">
  <div><div class="eyebrow" style="margin-bottom:5px">measured palette</div><div class="swatches">${sw}</div></div></div>
 <div class="body">
  <h2>${e(k.name)}</h2>
  <div class="src">${e(k.count.renderer)} · ${k.count.lines} lines · ${k.count.drawCallsTotal} draw calls</div>
  <div class="pair"><div class="eyebrow">method · how it is built — counted from the source</div><ul class="method">${us}</ul></div>
  <div class="pair"><div class="eyebrow">look · how the work looks</div><p>${e(k.look)}</p></div>
 </div>
 <div class="meas"><span class="eyebrow">measured</span>
  <div class="bar"><div class="lab"><span>value range</span><b>${lo}–${hi}</b></div>
   <div class="range"><i style="left:${(lo/255*100).toFixed(1)}%;width:${((hi-lo)/255*100).toFixed(1)}%"></i></div></div>
  ${bar("saturation",o.saturation,70,'%',o.saturation<5)}
  ${bar("hard-edge share",o.hardEdgeShare,50,'%',o.hardEdgeShare<8)}
  ${bar("texture",o.texture,7,'',o.texture<2)}
  ${bar("ink",o.ink,22,'%',o.ink<1)}
 </div>
 <div class="needs"><b>goal</b><span>${gl||'—'}</span></div>
</article>`;}).join('\n');

/* scatter chart */
const P=K.map(k=>({name:k.name,x:k.measure.hardEdgeShare,y:k.measure.saturation}));
const X=d=>56+d/50*484, Y=s=>340-s/72*316;
const g=[];
for(const t of [0,10,20,30,40,50]){g.push(`<line x1="${X(t).toFixed(1)}" y1="24" x2="${X(t).toFixed(1)}" y2="340" stroke="var(--rule)"/>`);
 g.push(`<text x="${X(t).toFixed(1)}" y="358" text-anchor="middle" class="ax">${t}%</text>`);}
for(const t of [0,20,40,60]){g.push(`<line x1="56" y1="${Y(t).toFixed(1)}" x2="540" y2="${Y(t).toFixed(1)}" stroke="var(--rule)"/>`);
 g.push(`<text x="48" y="${(Y(t)+4).toFixed(1)}" text-anchor="end" class="ax">${t}%</text>`);}
const anchor={"Oq Ko'cha":['end',-13,-9],"Whiteout":['start',13,4],"Bir tomchi sayohati":['start',13,-6],
            "Yomg'irli derazadagi mushuk":['start',13,5],"Not A Measurement":['end',-13,-9]};
const dots=P.map(p=>{const [a,dx,dy]=anchor[p.name]||['start',12,4];
 return `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="5.5" fill="var(--accent)"/>`
 +`<text x="${(X(p.x)+dx).toFixed(1)}" y="${(Y(p.y)+dy).toFixed(1)}" text-anchor="${a}" class="pt">${e(p.name)}</text>`;}).join('');
const wo=P.find(p=>p.name==='Whiteout'), nm=P.find(p=>p.name==='Not A Measurement');
const svg=`<svg viewBox="0 0 600 392" role="img" aria-label="Five projects: hard-edge share against saturation">
 <style>.ax{font-family:"JetBrains Mono",monospace;font-size:11px;fill:var(--muted)}
 .pt{font-family:"Bricolage Grotesque",sans-serif;font-size:13.5px;font-weight:700;fill:var(--ink)}
 .axt{font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.1em;fill:var(--muted)}</style>
 ${g.join('')}
 <line x1="${X(wo.x).toFixed(1)}" y1="${Y(wo.y).toFixed(1)}" x2="${X(nm.x).toFixed(1)}" y2="${Y(nm.y).toFixed(1)}"
  stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="4 4"/>
 <text x="${((X(wo.x)+X(nm.x))/2).toFixed(1)}" y="${(Y(wo.y)-14).toFixed(1)}" text-anchor="middle" class="ax" fill="var(--warn)">both Canvas 2D</text>
 <line x1="56" y1="340" x2="540" y2="340" stroke="var(--ink)" stroke-width="1.5"/>
 <line x1="56" y1="24" x2="56" y2="340" stroke="var(--ink)" stroke-width="1.5"/>
 ${dots}
 <text x="540" y="378" text-anchor="end" class="axt">HARD-EDGE SHARE →</text>
 <text x="20" y="24" class="axt" transform="rotate(-90 20 24)" text-anchor="end">SATURATION →</text>
</svg>`;

const head=readFileSync(new URL('./catalog-head.html',import.meta.url).pathname,'utf8');
const date=new Date().toISOString().slice(0,10);
/* The output path used to be left over from the machine this page was written on
   (/mnt/user-data/outputs/); it is now inside build/, which is in .gitignore. */
const OUT=process.argv[2]||new URL('../build/style-catalog.html',import.meta.url).pathname;
mkdirSync(dirname(OUT),{recursive:true});
const lowWhite=K.find(k=>k.name==='Whiteout')?.measure.value[0], mushukSat=K.find(k=>k.name==="Yomg'irli derazadagi mushuk")?.measure.saturation;
writeFileSync(OUT, head+`<div class="wrap">
<span class="eyebrow">ABC Legacy · the catalog of works · ${date}</span>
<h1>Style catalog</h1>
<p class="lede">Five projects, one block of data. Each block has three parts with different rights: <b>method</b> — how it is built, <em>counted</em> from the source; <b>look</b> — how the work looks, the one free field; <b>measure</b> — <em>measured</em> from frames. This page is generated from the cards, so it cannot go stale against them.</p>

<div class="axes">
 <div class="axis"><h3>Method <span class="k">counted</span></h3><p>Every line is bound to one value in the <span class="mono">count</span>, and that value has to stand in the line's text. When the source changes — the number of poses goes from 4 to 6 — the line goes stale and the build fails.</p></div>
 <div class="axis"><h3>Look <span class="k">written</span></h3><p>How the work looks: a field, a street, a window, a sheet. The one free field.</p></div>
 <div class="axis mut"><h3>Numbers <span class="k">unnamed</span></h3><p>The character of a mark is measured, not named. A name is invented; a number is measured.</p></div>
</div>

<div class="correction">
 <b>A corrected conclusion.</b> An earlier version of this page carried the conclusion "Oq Ko'cha and Not A Measurement are drawn by the same hand (27.9 and 28.4)". It was <b>wrong</b>: the measurement took edges from the <em>first</em> frame only, and the same three frames measured one by one differed by 5.6 points. After the fix: <b>26.8</b> and <b>45.9</b> — they are not alike. The conclusion was withdrawn, and the check that withdrew it is called <span class="mono">measure/order-independent</span>.
</div>

<hr class="rule">
<div class="cards">
${cards}
</div>

<hr class="rule">
<div class="chartbox">
 <h2>The method cannot predict the look</h2>
 <p><b>Whiteout</b> and <b>Not A Measurement</b> — both Canvas 2D, both colourless, both on white paper. Their hard-edge share is <b>${wo.x}%</b> and <b>${nm.x}%</b>: the two ends of the five. How they are built is the same, how they look is entirely different — which is why a third column is needed, and why it stays unnamed.</p>
 <div class="chartscroll">${svg}</div>
</div>

<hr class="rule">
<p class="note"><b>Claim and goal.</b> <span class="mono">claims</span> — a promise about what a project is now: Whiteout is WHITE (even its darkest pixel is ${lowWhite}), Mushuk is COLOURFUL (${mushukSat}%). If one breaks, that is a regression. <span class="mono">goals</span> — where it is going: Whiteout's value range should reach 90, it is 50 now. An unmet goal is not a fault but a work plan — it is not hidden, it just does not fail the build.</p>

<footer>
 COUNT — <span class="mono">tools/count.mjs</span>: lines, draw calls, table sizes, cut durations<br>
 MEASURE — <span class="mono">tools/measure.mjs</span>: 3 frames from each project, brought to 320 px wide, RGB → luma (Rec.709)<br>
 PALETTE — median-cut, 6 colours; not k-means, which gave a different answer every time<br>
 HARD-EDGE SHARE — the share of hard edges (Δluma &gt; 0.16); each frame on its own, then averaged<br>
 TEXTURE — the mean energy left after a 3×3 blur, on a 0–255 scale<br>
 CHECKS — <span class="mono">test/run.mjs</span>: each one with its deliberately broken case
</footer>
</div>`);
console.log('catalog written:', OUT);
