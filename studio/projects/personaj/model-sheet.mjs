/* MODEL SHEET: the head alone, large, keys and inbetweens. */
import {TEMPLATE} from './head.mjs';
import {portrait, STYLE_CSS, GRAD} from './portrait2.mjs';
import {chromium} from 'playwright';
import {existsSync,readdirSync,writeFileSync} from 'fs';
import {chrome} from './chrome.mjs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const B=[0.10,0.25,0.40,0.55], Q=[0,1], CW=300, CH=330;
const cells=[];
for(const q of Q) for(const b of B){
 const P={...TEMPLATE, R:96, turn:b, gaze:q, tilt:0, eyeOpenness:1, hairSeed:2749};
 cells.push(`<svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><style>${STYLE_CSS}</style><rect width="${CW}" height="${CH}" fill="#0a0b1e"/>`
  + portrait(P, CW*0.46, CH*0.40, `m${b}_${q}_`)
  + `<text x="8" y="${CH-8}" fill="#8a8cb0" font-size="13" font-family="monospace">turn ${b} gaze ${q}</text></svg>`);
}
const html=`<!doctype html><html><head><style>body{margin:0;background:#000;display:grid;grid-template-columns:repeat(${B.length},${CW}px);gap:4px}</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs>${GRAD}</defs></svg>${cells.join('')}</body></html>`;
writeFileSync((PERSONAJ_DIR + '/model-sheet.html'),html);
const exe = chrome() || null;   // chrome.mjs: $PERSONAJ_CHROME, else the newest installed Chromium
const br=await chromium.launch(exe?{executablePath:exe}:{});
const pg=await br.newPage({viewport:{width:B.length*(CW+4),height:Q.length*(CH+4)}});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message)));
await pg.goto(('file://' + PERSONAJ_DIR + '/model-sheet.html')); await pg.waitForTimeout(300);
await pg.screenshot({path:(PERSONAJ_DIR + '/model-sheet.png')});
await br.close(); console.log('model-sheet.png', errs.length?('ERROR: '+errs.join('|')):'');
