/* for compare: each frame's head transform, at the WORKING size (320x180).
   cx cy R -- head centre and radius; roll -- the tilt (degrees, as in the SVG);
   sx -- the 3/4 squeeze (sq). compare/unwarp.py uses this to unwarp both sides
   into head space. */
import {writeFileSync} from 'fs';
const {SHEET}=await import('./sheet.mjs?'+Date.now());
const s=320/540, out={};
SHEET.forEach((P,i)=>{const [cx,cy,k]=P.__place; const tb=Math.min(1,Math.max(0,(P.turn-0.10)/0.45));
 out[i+1]={cx:+(cx*s).toFixed(3), cy:+(cy*s).toFixed(3), R:+(P.R*k*s).toFixed(3), roll:+P.tilt.toFixed(3), sx:+(0.84+0.16*tb).toFixed(4)};});
writeFileSync('compare-transform.json',JSON.stringify(out,null,1));
console.log('compare-transform.json', Object.keys(out).length, 'frames; 1:', JSON.stringify(out[1]));
