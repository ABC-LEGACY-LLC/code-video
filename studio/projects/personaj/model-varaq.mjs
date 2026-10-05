/* MODEL VARAQASI: bosh yolg'iz, katta, kalitlar va oraliqlar. */
import {ANDOZA} from './bosh.mjs';
import {portret, USLUB, GRAD} from './portret2.mjs';
import {chromium} from 'playwright';
import {existsSync,readdirSync,writeFileSync} from 'fs';
const B=[0.10,0.25,0.40,0.55], Q=[0,1], CW=300, CH=330;
const kat=[];
for(const q of Q) for(const b of B){
 const P={...ANDOZA, R:96, burilish:b, qarash:q, egilish:0, kozOchiq:1, sochUrug:2749};
 kat.push(`<svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><style>${USLUB}</style><rect width="${CW}" height="${CH}" fill="#0a0b1e"/>`
  + portret(P, CW*0.46, CH*0.40, `m${b}_${q}_`)
  + `<text x="8" y="${CH-8}" fill="#8a8cb0" font-size="13" font-family="monospace">burilish ${b} qarash ${q}</text></svg>`);
}
const html=`<!doctype html><html><head><style>body{margin:0;background:#000;display:grid;grid-template-columns:repeat(${B.length},${CW}px);gap:4px}</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs>${GRAD}</defs></svg>${kat.join('')}</body></html>`;
writeFileSync('/home/claude/work/personaj/model-varaq.html',html);
let exe=null; const r='/opt/pw-browsers';
if(existsSync(r)) for(const d of readdirSync(r).filter(x=>x.startsWith('chromium')&&!x.includes('headless')).sort().reverse()){
 const p=`${r}/${d}/chrome-linux/chrome`; if(existsSync(p)){exe=p;break;} }
const br=await chromium.launch(exe?{executablePath:exe}:{});
const pg=await br.newPage({viewport:{width:B.length*(CW+4),height:Q.length*(CH+4)}});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message)));
await pg.goto('file:///home/claude/work/personaj/model-varaq.html'); await pg.waitForTimeout(300);
await pg.screenshot({path:'/home/claude/work/personaj/model-varaq.png'});
await br.close(); console.log('model-varaq.png', errs.length?('XATO: '+errs.join('|')):'');
