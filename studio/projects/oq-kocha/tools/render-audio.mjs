/* THE SOUNDTRACK, RENDERED OFFLINE, to build/film.pcm (mono float32) and build/film.sr.
   This script was written on the machine the film was made on and carried that machine
   with it: a Chrome at one path, the page at another, 14.6 s typed in, the output outside
   the repository. Anywhere else it stopped at its second line. The page, the Chrome and
   the readiness are now the audit's own (test/browser.mjs), and the length is the film's:
   a whole number of frames, so the sound ends on the frame the picture does. */
import {writeFileSync,mkdirSync} from 'fs';
import {open,close} from '../test/browser.mjs';
import {TOTAL,TOTAL_F} from '../src/shots.mjs';
import {FPS} from '../src/sheet.mjs';
const SR=44100, OUT=new URL('../build/',import.meta.url).pathname;
const pg=await open();
const tl=await pg.evaluate(()=>window.__timeline());
const by={}; for(const e of tl) by[e.type]=(by[e.type]||0)+1;
console.log('timeline events:',JSON.stringify(by),' total',tl.length);
const t0=Date.now();
const a=await pg.evaluate(([s,sr])=>window.__renderAudio(s,sr),[TOTAL,SR]);
const x=Float32Array.from(a.pcm);
/* the refusal: a soundtrack that is not exactly the film's length is not written */
const want=Math.round(TOTAL_F*a.sr/FPS);
if(x.length!==want){ console.error(`film.pcm NOT written: ${x.length} samples, the film is ${want} (${TOTAL_F} frames)`);
 await close(); process.exit(1); }
console.log(`offline render: ${x.length} samples @ ${a.sr} Hz = ${TOTAL_F} frames, in ${Date.now()-t0} ms`);
let pk=0,rms=0; for(const v of x){const q=Math.abs(v); if(q>pk)pk=q; rms+=v*v;}
rms=Math.sqrt(rms/x.length);
console.log(`peak ${pk.toFixed(3)}  rms ${rms.toFixed(4)}  (${(20*Math.log10(rms)).toFixed(1)} dBFS)`+(pk>0.999?'  CLIPPING':'  no clipping'));
mkdirSync(OUT,{recursive:true});
writeFileSync(OUT+'film.pcm', Buffer.from(x.buffer));
writeFileSync(OUT+'film.sr', String(a.sr));
console.log('wrote build/film.pcm and build/film.sr');
await close();
