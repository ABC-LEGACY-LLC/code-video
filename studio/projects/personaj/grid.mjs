import {ANDOZA, qur} from './bosh.mjs';
import {writeFileSync} from 'fs';
const EG=[0,12,24,36];
let s=`<svg width="1080" height="300" viewBox="0 0 1080 300" xmlns="http://www.w3.org/2000/svg">
<rect width="1080" height="300" fill="#15132a"/><style>
.teri{fill:#e2dad3}.ing{fill:none;stroke:#0b0c11;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.koz{fill:#1d2137}.txt{fill:#8a8f99;font:12px sans-serif}</style>`;
EG.forEach((e,i)=>{
 const P={...ANDOZA, egilish:e};
 const b=qur(P, 140+i*260, 150);
 s+=`<path class="teri" d="${b.siluet}"/><path class="ing" d="${b.siluet}"/>`;
 s+=`<ellipse cx="${b.kozYaqin[0].toFixed(1)}" cy="${b.kozYaqin[1].toFixed(1)}" rx="7" ry="8" class="koz"/>`;
 s+=`<ellipse cx="${b.kozUzoq[0].toFixed(1)}" cy="${b.kozUzoq[1].toFixed(1)}" rx="5" ry="6.5" class="koz"/>`;
 s+=`<circle cx="${b.burun[0].toFixed(1)}" cy="${b.burun[1].toFixed(1)}" r="2.5" fill="#0b0c11"/>`;
 s+=`<circle cx="${b.ogiz[0].toFixed(1)}" cy="${b.ogiz[1].toFixed(1)}" r="2" fill="#0b0c11"/>`;
 s+=`<circle cx="${b.quloq[0].toFixed(1)}" cy="${b.quloq[1].toFixed(1)}" r="3" fill="none" stroke="#0b0c11"/>`;
 s+=`<text class="txt" x="${100+i*260}" y="285">egilish ${e}°</text>`;
});
s+='</svg>';
writeFileSync('/home/claude/work/personaj/grid.html',
 `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111;display:grid;place-items:center;height:100%}</style></head><body>${s}</body></html>`);
console.log('grid yozildi');
