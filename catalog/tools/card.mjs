/* ===== CARD — every project carries the same block of data =====
   Four parts, with different rights:
     count   — counted from the source, never touched by hand
     method  — written by a person, BUT every line must be bound to one value in count
     look    — written by a person: how the work looks (the one free field)
     measure — measured from frames, never touched by hand

   Every `method` line points at a value in count with its `evidence` field, and the
   check requires that value to stand in the line's text. When the source changes --
   say the number of poses goes from 4 to 6 -- the count changes, the line goes stale
   and the check fails. So a card cannot quietly become a lie. */
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'fs';
import {execFileSync} from 'child_process';
import {count} from './count.mjs';
import {measure} from './measure.mjs';
export const DIR=new URL('../cards/',import.meta.url).pathname;
export const FIELDS=['name','sources','frame','method','look','claims','goals'];

export const load=()=>readdirSync(DIR).filter(f=>f.endsWith('.json')).sort()
 .map(f=>({...JSON.parse(readFileSync(DIR+f,'utf8')), _f:DIR+f}));

/* ===== A PAGE THAT IS BUILT =====
   Some cards' frames do not sit in the source -- they are BUILT. Oq Ko'cha's page is
   in its build/ folder, and build/ is in .gitignore; on a clean checkout that file is
   not there. So the measurement could never run in CI, and the error came out not as
   "no such file" but as an obscure error inside the browser.

   Now a card also says HOW to build its page, and that command runs before measuring.
   It is built every time, even when it exists: a stale build is an error caught twice
   in one session (src/geo.frag changed, the measurement measured the old page), and
   removing it by always building is more reliable than catching it with a check. */
export function prepare(K=load()){
 const done=[];
 for(const k of K){
  const b=k.frame?.build; if(!b) continue;
  const dir=new URL(b.dir+'/','file://'+k._f).pathname;
  const [cmd,...args]=b.command.split(/\s+/);
  execFileSync(cmd,args,{cwd:dir,stdio:['ignore','ignore','inherit']});
  done.push(k.name);
 }
 return done;
}
/* Which cards' pages are missing right now -- the check measures this list */
export const missing=(K=load())=>K.filter(k=>
 !existsSync(new URL(k.frame.file,'file://'+k._f).pathname));

const dig=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const nums=t=>[...String(t).matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>+m[0].replace(',','.'));

/* Whether one evidence line holds. A number must stand in the text; a string must be
   inside the text; for a list, one of its members. */
export function confirm(text,val){
 if(val==null) return {ok:false, reason:'evidence not found'};
 if(typeof val==='number')
  return {ok:nums(text).includes(val), reason:`count has ${val}, the line has ${JSON.stringify(nums(text))}`};
 if(typeof val==='string')
  return {ok:text.toLowerCase().includes(val.toLowerCase()), reason:`count has "${val}"`};
 if(Array.isArray(val)){
  const hit=val.some(v=>typeof v==='number'? nums(text).includes(v)
                       : text.toLowerCase().includes(String(v).toLowerCase()));
  return {ok:hit || nums(text).includes(val.length), reason:`list: ${JSON.stringify(val)}`};
 }
 return {ok:false, reason:'evidence type not supported'};
}
/* Whether a card still agrees with its source */
export function verify(k){
 const c=count(k.sources.map(p=>new URL(p,'file://'+k._f).pathname));
 const stale=[];
 for(const u of k.method){
  const t=confirm(u.text, dig(c,u.evidence));
  if(!t.ok) stale.push(`${k.name}: "${u.text.slice(0,44)}…" ↮ ${u.evidence} (${t.reason})`);
 }
 return {count:c, stale};
}
export async function refresh(k,{withMeasure=true}={}){
 const {count:c}=verify(k);
 const y={...k}; delete y._f;
 y.count=c;
 if(withMeasure) y.measure=await measure({...k.frame, file:new URL(k.frame.file,'file://'+k._f).pathname});
 else if(k.measure) y.measure=k.measure;
 writeFileSync(k._f, JSON.stringify(y,null,1)+'\n');
 return y;
}
if(process.argv[1]?.endsWith('card.mjs')){
 const only=process.argv[3], fast=process.argv.includes('--fast');
 /* pages that are built get built first, then the count is taken */
 prepare().forEach(n=>console.log('built:',n));
 for(const k of load()){
  if(only&&!fast&&k.name!==only&&only!=='--fast') continue;
  const {stale}=verify(k);
  if(process.argv[2]==='refresh'){ await refresh(k,{withMeasure:!fast}); console.log('refreshed:',k.name); }
  else console.log(`${k.name.padEnd(28)} ${stale.length? '✗ '+stale.length+' stale line(s)':'✓'}`);
  stale.forEach(y=>console.log('   ',y));
 }
}
