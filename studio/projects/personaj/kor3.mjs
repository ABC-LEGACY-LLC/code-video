import {chromium} from 'playwright';
import {existsSync,readdirSync,mkdirSync} from 'fs';
let exe=null; const r='/opt/pw-browsers';
if(existsSync(r)) for(const d of readdirSync(r).filter(x=>x.startsWith('chromium')&&!x.includes('headless')).sort().reverse()){
 const p=`${r}/${d}/chrome-linux/chrome`; if(existsSync(p)){exe=p;break;} }
const a=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const out=process.env.CHIQ||'/home/claude/work/personaj/ff';
mkdirSync(out,{recursive:true});
const br=await chromium.launch(exe?{args:a,executablePath:exe}:{args:a});
const pg=await br.newPage({viewport:{width:600,height:360}});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message)));
await pg.goto('file:///home/claude/work/personaj/film.html');
await pg.waitForTimeout(600);
await pg.evaluate(()=>window.__toxta());          // halqani to'xtatish -- yo'qsa poyga
await pg.evaluate(([z,q])=>{window.__zarrasiz=z;window.__qorasiz=q;},
  [!!process.env.ZARRASIZ, !!process.env.QORASIZ]);
if(errs.length) console.log('SAHIFA XATOSI:', errs.join(' | '));
const N=await pg.evaluate(()=>window.__N);
for(let i=0;i<N;i++){
 await pg.evaluate(k=>{window.__toxta();window.__frameTo(k);},i);
 const g=await pg.evaluate(()=>window.__qaysi());   // DOM dan tasdiq
 if(g.i!==i || g.korinadi!==1 || g.bolak<6)
  throw new Error(`suratga olish nosoz: ${i} so'raldi, DOM da ${g.i} (ko'rinadigan ${g.korinadi}, bo'lak ${g.bolak})`);
 await pg.locator('#w').screenshot({path:`${out}/${String(i).padStart(2,'0')}.png`}); }
await br.close(); console.log(N,'tasvir ->',out,'(har biri DOM dan tasdiqlangan)');
