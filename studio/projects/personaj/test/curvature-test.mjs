/* Test shapes for the curvature measurement.
   The original silhouette is drawn LARGE (so there are enough boundary pixels), while the
   egg and the disc are at a size comparable to it -- otherwise the test would test the
   size, not the shape. */
import {build, TEMPLATE} from '../head.mjs';
import {chromium} from 'playwright';
import {existsSync,readdirSync,mkdirSync} from 'fs';
import {chrome} from '../chrome.mjs';
const PERSONAJ_DIR = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const b=build({...TEMPLATE, tilt:0, R:118}, 200, 190);
const W=400,H=400;
const egg=`M 200 42 A 76 148 0 1 1 199.9 42 Z`;
const disc=`M 200 83 A 107 107 0 1 1 199.9 83 Z`;
const S=[['orig',b.silhouette,''],
         ['rotated',b.silhouette,'rotate(25 200 200)'],
         ['shrunk',b.silhouette,'translate(200 200) scale(0.55) translate(-200 -200)'],
         ['rotated+small',b.silhouette,'rotate(-40 200 200) translate(200 200) scale(0.7) translate(-200 -200)'],
         ['EGG',egg,''],
         ['DISC',disc,'']];
const exe = chrome() || null;   // chrome.mjs: $PERSONAJ_CHROME, else the newest installed Chromium
const br=await chromium.launch(exe?{executablePath:exe}:{});
const pg=await br.newPage({viewport:{width:W,height:H}});
mkdirSync((PERSONAJ_DIR + '/test'),{recursive:true});
for(const [name,d,tr] of S){
 await pg.setContent(`<style>html,body{margin:0;background:#000}</style>`
  +`<svg width="${W}" height="${H}"><path d="${d}" fill="#fff" transform="${tr}"/></svg>`);
 await pg.screenshot({path:`${PERSONAJ_DIR}/test/${name}.png`});
}
await br.close();
console.log(S.length,'test shapes drawn (orig R=118)');
