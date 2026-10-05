import {chromium} from 'playwright';
import {existsSync,readdirSync} from 'fs';
import {chrome} from './chrome.mjs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const exe = chrome() || null;   // chrome.mjs: $PERSONAJ_CHROME, else the newest installed Chromium
const a=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const br=await chromium.launch(exe?{args:a,executablePath:exe}:{args:a});
const pg=await br.newPage({viewport:{width:600,height:360}});
const f=process.argv[2];
await pg.goto(('file://' + PERSONAJ_DIR + '/')+f);
await pg.waitForTimeout(400);
await pg.locator('svg').screenshot({path:(PERSONAJ_DIR + '/')+f.replace('.html','.png')});
await br.close(); console.log('ok');
