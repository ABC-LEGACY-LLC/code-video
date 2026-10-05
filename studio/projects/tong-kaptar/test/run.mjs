/* ===== TONG · KAPTAR'S CHECKS =====
   The film is edit B: five shots cut together, a whip pan from the first to the second, a fade in
   and a fade out. The master is assembled by audit/assemble.py from audit/film/filmB_frames.json;
   the page draws the same edit from src/edit.js, so the studio can scrub it and export it. These
   checks hold the two together, and hold the page's film frames to the shots they come from.
   Every check carries its own deliberately broken case. */
import {check,report} from './lib.mjs';
import {readFileSync} from 'fs';
import {chromium} from 'playwright';
const HERE=new URL('../',import.meta.url).pathname, t0=Date.now();

/* THE PAGE'S EDIT IS THE MASTER'S EDIT. Read EDIT_B out of src/edit.js as written, and the spec
   assemble.py builds the master from; every shot range, join and fade has to agree. The broken
   case moves one shot's last frame by one. */
const pageEdit=()=>{ const s=readFileSync(HERE+'src/edit.js','utf8'), a=s.indexOf('const EDIT_B = {')+'const EDIT_B = '.length;
 let d=0,b=a; for(;b<s.length;b++){ if(s[b]==='{') d++; else if(s[b]==='}'&&--d===0) break; }
 return Function('return '+s.slice(a,b+1))(); };
const master=JSON.parse(readFileSync(HERE+'audit/film/filmB_frames.json','utf8'));
function disagreements(page,spec){
 let n=0;
 if(page.shots.length!==spec.shots.length) n++;
 page.shots.forEach((s,k)=>{ const m=spec.shots[k]||{}; if(m.dir!=='frames/'+s.shot||m.from!==s.from||m.to!==s.to) n++; });
 if(JSON.stringify(page.joins)!==JSON.stringify(spec.joins)) n++;
 if(page.fadeIn!==spec.fadeIn||page.fadeOut!==spec.fadeOut) n++;
 return n;
}
await check({name:'tong-kaptar/edit-is-the-master', unit:'shots, joins or fades that differ',
 measure:()=>disagreements(pageEdit(),master), pass:v=>v===0,
 calibrate:()=>{ const p=pageEdit(); p.shots[2].to+=1; return disagreements(p,master); },
 note:'src/edit.js EDIT_B against audit/film/filmB_frames.json'});

const browser=await chromium.launch({args:['--disable-accelerated-2d-canvas']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto('file://'+HERE+'scene.html');
await page.waitForFunction(()=>window.__ready===true,null,{timeout:120000});
try{

/* A FILM FRAME IS ITS SHOT'S FRAME. Outside the pan and the fades, frame n of the film has to be
   exactly the frame of the shot the edit puts there, drawn by that shot's own renderer: one frame
   from each of four shots (the slow-motion shot takes twenty seconds a frame here, and is left
   out). The broken case compares each with the shot frame after it. */
const SAMPLE=[[40,'s1',40],[120,'s2',24],[250,'s4',22],[400,'s5',76]];
const slipped=shift=>page.evaluate(([L,shift])=>{
 const px=()=>ctx.getImageData(0,0,W,H).data, same=(a,b)=>{ for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; };
 let n=0;
 for(const [f,shot,i] of L){ __frameTo(f); const a=px(); setShot(shot); renderFrame(i+shift); if(!same(a,px())) n++; }
 return n; },[SAMPLE,shift]);
await check({name:'tong-kaptar/film-frames-are-shot-frames', unit:'film frames not their shot frame',
 measure:()=>slipped(0), pass:v=>v===0, calibrate:()=>slipped(1),
 note:SAMPLE.map(([f,s,i])=>`film ${f} = ${s} ${i}`).join(', ')});

/* THE FILM COMES OUT OF BLACK AND GOES BACK INTO IT. Frame 0 is the first of a twelve-frame fade
   in, the last frame the end of a twenty-four-frame fade out: both have to be near black against
   the picture they fade from. The broken case switches the fades off. */
const fadeShare=off=>page.evaluate(off=>{
 if(off){ EDIT_B.fadeIn=0; EDIT_B.fadeOut=0; }
 const mean=()=>{ const d=ctx.getImageData(0,0,W,H).data; let s=0; for(let i=0;i<d.length;i+=16) s+=d[i]+d[i+1]+d[i+2]; return s/(d.length/16); };
 __frameTo(0); const a=mean(); __frameTo(12); const b=mean(); __frameTo(__totalFrames-1); const c=mean(); __frameTo(__totalFrames-25); const d=mean();
 if(off){ EDIT_B.fadeIn=12; EDIT_B.fadeOut=24; }
 return Math.max(a/b,c/d); },off);
await check({name:'tong-kaptar/fades-from-black', unit:'brightness of the first and last frame, against the frame after the fade',
 measure:()=>fadeShare(false), pass:v=>v<0.08, calibrate:()=>fadeShare(true),
 note:'fade in 12 frames, fade out 24, in linear light like assemble.py'});

}finally{ await browser.close(); }
if(errors.length) console.log('  page errors: '+errors.slice(0,3).join(' | '));
const ok=report();
console.log(`  ${((Date.now()-t0)/1000).toFixed(1)}s\n`);
process.exit(ok&&!errors.length?0:1);
