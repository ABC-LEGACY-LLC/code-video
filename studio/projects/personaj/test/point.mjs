import {chromium} from 'playwright';
import {existsSync,readdirSync} from 'fs';
import {chrome} from '../chrome.mjs';
const PERSONAJ_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const exe = chrome() || null;   // chrome.mjs: $PERSONAJ_CHROME, else the newest installed Chromium
const br=await chromium.launch(exe?{executablePath:exe}:{});
const pg=await br.newPage({viewport:{width:600,height:360}});
await pg.goto(('file://' + PERSONAJ_DIR + '/film.html')); await pg.waitForTimeout(500);
await pg.evaluate(()=>window.__stop());
const k=+(process.argv[2]||0); await pg.evaluate(k=>{window.__stop();window.__frameTo(k);},k);
const pts=JSON.parse(process.argv[3]||'[[115,130]]');
const out=await pg.evaluate(([pts])=>{
 const w=document.querySelector('#w').getBoundingClientRect(); const S=540/320;
 return pts.map(([x,y])=>{ const els=document.elementsFromPoint(w.left+x*S,w.top+y*S);
  return [x,y, els.slice(0,6).map(e=>e.tagName+(e.id?'#'+e.id:'')+'['+(e.getAttribute('fill')||'')+(e.getAttribute('opacity')?' o'+e.getAttribute('opacity'):'')+(e.getAttribute('class')?' .'+e.getAttribute('class'):'')+(e.parentNode&&e.parentNode.getAttribute&&e.parentNode.getAttribute('clip-path')?' clip':'')+']').join(' < ')]; });
},[pts]);
for(const o of out) console.log(JSON.stringify(o));
await br.close();
