import {chromium} from 'playwright';
import {existsSync,readdirSync} from 'fs';
let exe=null; const r='/opt/pw-browsers';
if(existsSync(r)) for(const d of readdirSync(r).filter(x=>x.startsWith('chromium')&&!x.includes('headless')).sort().reverse()){
 const p=`${r}/${d}/chrome-linux/chrome`; if(existsSync(p)){exe=p;break;} }
const a=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const br=await chromium.launch(exe?{args:a,executablePath:exe}:{args:a});
const pg=await br.newPage({viewport:{width:600,height:360}});
const f=process.argv[2];
await pg.goto('file:///home/claude/work/personaj/'+f);
await pg.waitForTimeout(400);
await pg.locator('svg').screenshot({path:'/home/claude/work/personaj/'+f.replace('.html','.png')});
await br.close(); console.log('ok');
