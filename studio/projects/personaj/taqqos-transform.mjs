/* taqqos uchun: har tasvirning bosh transformi, ISHCHI o'lchamda (320x180).
   cx cy R -- bosh markazi va radiusi; rol -- egilish (gradus, SVG dagi kabi);
   sx -- 3/4 siqish (sq). taqqos/yoyish.py shu bilan ikkala tomonni bosh
   fazosiga yoyadi. */
import {writeFileSync} from 'fs';
const {VARAQ}=await import('./varaq.mjs?'+Date.now());
const s=320/540, out={};
VARAQ.forEach((P,i)=>{const [cx,cy,k]=P.__joy; const tb=Math.min(1,Math.max(0,(P.burilish-0.10)/0.45));
 out[i+1]={cx:+(cx*s).toFixed(3), cy:+(cy*s).toFixed(3), R:+(P.R*k*s).toFixed(3), rol:+P.egilish.toFixed(3), sx:+(0.84+0.16*tb).toFixed(4)};});
writeFileSync('taqqos-transform.json',JSON.stringify(out,null,1));
console.log('taqqos-transform.json', Object.keys(out).length, 'tasvir; 1:', JSON.stringify(out[1]));
