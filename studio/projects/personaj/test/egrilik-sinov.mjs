/* Egrilik o'lchovi uchun sinov shakllari.
   Asl siluet KATTA chiziladi (chegara piksellari yetarli bo'lsin), tuxum va
   doira esa u bilan taqqoslanadigan o'lchamda -- aks holda sinov shaklni
   emas, o'lchamni sinagan bo'lardi. */
import {qur, ANDOZA} from '../bosh.mjs';
import {chromium} from 'playwright';
import {existsSync,readdirSync,mkdirSync} from 'fs';
const b=qur({...ANDOZA, egilish:0, R:118}, 200, 190);
const W=400,H=400;
const tuxum=`M 200 42 A 76 148 0 1 1 199.9 42 Z`;
const doira=`M 200 83 A 107 107 0 1 1 199.9 83 Z`;
const S=[['asl',b.siluet,''],
         ['aylantirilgan',b.siluet,'rotate(25 200 200)'],
         ['kichraytirilgan',b.siluet,'translate(200 200) scale(0.55) translate(-200 -200)'],
         ['aylantirilgan+kichik',b.siluet,'rotate(-40 200 200) translate(200 200) scale(0.7) translate(-200 -200)'],
         ['TUXUM',tuxum,''],
         ['DOIRA',doira,'']];
let exe=null; const r='/opt/pw-browsers';
if(existsSync(r)) for(const d of readdirSync(r).filter(x=>x.startsWith('chromium')&&!x.includes('headless')).sort().reverse()){
 const p=`${r}/${d}/chrome-linux/chrome`; if(existsSync(p)){exe=p;break;} }
const br=await chromium.launch(exe?{executablePath:exe}:{});
const pg=await br.newPage({viewport:{width:W,height:H}});
mkdirSync('/home/claude/work/personaj/sinov',{recursive:true});
for(const [nom,d,tr] of S){
 await pg.setContent(`<style>html,body{margin:0;background:#000}</style>`
  +`<svg width="${W}" height="${H}"><path d="${d}" fill="#fff" transform="${tr}"/></svg>`);
 await pg.screenshot({path:`/home/claude/work/personaj/sinov/${nom}.png`});
}
await br.close();
console.log(S.length,'sinov shakli chizildi (asl R=118)');
