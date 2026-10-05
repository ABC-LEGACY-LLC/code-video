import {chromium} from 'playwright';
import {existsSync,readdirSync,mkdirSync} from 'fs';
import {chrome} from './chrome.mjs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const exe = chrome() || null;   // chrome.mjs: $PERSONAJ_CHROME, else the newest installed Chromium
const a=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const out=process.env.OUT||(PERSONAJ_DIR + '/ff');
mkdirSync(out,{recursive:true});
const br=await chromium.launch(exe?{args:a,executablePath:exe}:{args:a});
const pg=await br.newPage({viewport:{width:600,height:360}});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message)));
await pg.goto(('file://' + PERSONAJ_DIR + '/film.html'));
await pg.waitForTimeout(600);
await pg.evaluate(()=>window.__stop());          // stop the loop -- otherwise a race
await pg.evaluate(([z,q])=>{window.__noParticles=z;window.__noBlack=q;},
  [!!process.env.NO_PARTICLES, !!process.env.NO_BLACK]);
if(errs.length) console.log('PAGE ERROR:', errs.join(' | '));
const N=await pg.evaluate(()=>window.__N);
for(let i=0;i<N;i++){
 await pg.evaluate(k=>{window.__stop();window.__frameTo(k);},i);
 const g=await pg.evaluate(()=>window.__which());   // confirmation from the DOM
 if(g.i!==i || g.visible!==1 || g.pieces<6)
  throw new Error(`capture is broken: asked for ${i}, the DOM shows ${g.i} (visible ${g.visible}, pieces ${g.pieces})`);
 await pg.locator('#w').screenshot({path:`${out}/${String(i).padStart(2,'0')}.png`}); }
await br.close(); console.log(N,'frames ->',out,'(each one confirmed from the DOM)');
