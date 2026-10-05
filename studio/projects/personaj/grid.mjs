import {TEMPLATE, build} from './head.mjs';
import {writeFileSync} from 'fs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const EG=[0,12,24,36];
let s=`<svg width="1080" height="300" viewBox="0 0 1080 300" xmlns="http://www.w3.org/2000/svg">
<rect width="1080" height="300" fill="#15132a"/><style>
.skin{fill:#e2dad3}.ing{fill:none;stroke:#0b0c11;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.eye{fill:#1d2137}.txt{fill:#8a8f99;font:12px sans-serif}</style>`;
EG.forEach((e,i)=>{
 const P={...TEMPLATE, tilt:e};
 const b=build(P, 140+i*260, 150);
 s+=`<path class="skin" d="${b.silhouette}"/><path class="ing" d="${b.silhouette}"/>`;
 s+=`<ellipse cx="${b.eyeNear[0].toFixed(1)}" cy="${b.eyeNear[1].toFixed(1)}" rx="7" ry="8" class="eye"/>`;
 s+=`<ellipse cx="${b.eyeFar[0].toFixed(1)}" cy="${b.eyeFar[1].toFixed(1)}" rx="5" ry="6.5" class="eye"/>`;
 s+=`<circle cx="${b.nose[0].toFixed(1)}" cy="${b.nose[1].toFixed(1)}" r="2.5" fill="#0b0c11"/>`;
 s+=`<circle cx="${b.mouth[0].toFixed(1)}" cy="${b.mouth[1].toFixed(1)}" r="2" fill="#0b0c11"/>`;
 s+=`<circle cx="${b.ear[0].toFixed(1)}" cy="${b.ear[1].toFixed(1)}" r="3" fill="none" stroke="#0b0c11"/>`;
 s+=`<text class="txt" x="${100+i*260}" y="285">tilt ${e}°</text>`;
});
s+='</svg>';
writeFileSync((PERSONAJ_DIR + '/grid.html'),
 `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111;display:grid;place-items:center;height:100%}</style></head><body>${s}</body></html>`);
console.log('grid written');
