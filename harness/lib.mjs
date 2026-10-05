/* ===== THE HARNESS =====
   Every check carries the case that proves it works. A threshold that has never
   been shown to fail on a known-bad input is not a measurement, it is a number --
   this session produced four of those before it stopped producing them, and each
   one passed happily while the thing it watched was broken. So `calibrate` is part
   of the check, not an extra: if the deliberately broken input also passes, the
   check itself is reported as broken. */
import {appendFileSync,readFileSync,writeFileSync,mkdirSync} from 'fs';
import {basename} from 'path';
/* A suite is named after the folder that calls it: every suite's test/lib.mjs
   re-exports this file, and the name comes from where that copy sits. */
export const suiteName=url=>basename(new URL('../',url).pathname.replace(/\/$/,''));
let SUITE='audit';
export const setSuite=n=>{ SUITE=n; };
const R = [];
export const results = R;

export async function check({name, unit='', measure, pass, calibrate, note}){
 let value, cal, err=null, calErr=null;
 try{ value = await measure(); }catch(e){ err = e; }
 if(err){ R.push({name,status:'ERROR',err:String(err.message||err),note}); return; }
 const ok = pass(value);
 let sep = null;
 if(calibrate){
  /* A swallowed error is the thing this project stands against: if the
     calibration throws, the check is UNPROVEN and nobody is told why. Now it is. */
  try{ cal = await calibrate(); sep = !pass(cal); }
  catch(e){ cal = null; sep = false; calErr = String(e.message||e); }
 }
 R.push({name,unit,value,ok,cal,sep,note,calErr,
  status: !ok ? 'FAIL' : (calibrate ? (sep?'PASS':'UNPROVEN') : 'UNCALIBRATED')});
}
const f=(v)=> typeof v==='number' ? (Math.abs(v)>=1000||(v!==0&&Math.abs(v)<0.001)? v.toExponential(2): v.toFixed(3)) : String(v);
const reasonOf=r=> r.err ? String(r.err).split('\n')[0]
 : r.calErr ? 'the calibration itself failed: '+String(r.calErr).split('\n')[0]
 : r.status==='UNPROVEN' ? 'the broken case passed too -- this check cannot see the failure it watches'
 : null;
/* ===== A FAILURE HAS TO BE VISIBLE =====
   On GitHub the TEXT of a log is shown only to someone signed in: even on a public
   repository the run page says "Sign in to view logs". So which check failed in CI
   stays in the log, and someone looking from outside has to guess.

   The result is therefore written to TWO places, and they are not the same:

     summary() -> the job summary. A tidy table, but it NEEDS A SIGN-IN.
        This comment once said "visible on the public page" -- when tried, it was
        not: runs #7 and #8 wrote a summary, and the public run page did not show
        it. The claim had not been checked, so it came out wrong.
     annotate() -> annotations. Not tidy, but PUBLIC: the same page shows
        "2 warnings, 2 notices" for a Node 20 deprecation without a sign-in. The
        name and the reason of a failing check now leave by that route. */
const esc=s=>String(s).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A').replace(/:/g,'%3A').replace(/,/g,'%2C');
function annotate(suite,bad){
 if(!process.env.GITHUB_ACTIONS) return;
 for(const r of bad.slice(0,10)){
  const reason = reasonOf(r)
   || `measured ${f(r.value)}, known-bad ${r.cal==null?'—':f(r.cal)}${r.note?' ('+r.note+')':''}`;
  console.log(`::error title=${esc(suite+' / '+r.name)}::${esc(reason)}`);
 }
 if(bad.length>10) console.log(`::error title=${esc(suite)}::${esc(`${bad.length-10} more problem(s)`)}`);
 if(!bad.length) console.log(`::notice title=${esc(suite)}::${esc(`${R.length} checks, 0 problems -- each one separated from its own broken case`)}`);
}
function summary(suite,lines,bad){
 const file=process.env.GITHUB_STEP_SUMMARY; if(!file) return;
 const L=[`## ${suite} — ${R.length} checks, ${bad.length} problem(s)`,''];
 if(bad.length){
  L.push('| check | status | measured | known-bad | why |','|---|---|---|---|---|');
  for(const r of bad){
   const reason = reasonOf(r) || (r.note||'');
   L.push(`| \`${r.name}\` | **${r.status}** | ${r.value===undefined?'':f(r.value)} | ${r.cal==null?'—':f(r.cal)} | ${String(reason).replace(/\|/g,'\\|').slice(0,200)} |`);
  }
  L.push('');
 } else L.push('All passed, and each one separated from its own broken case.','');
 L.push('<details><summary>full table</summary>','','```',...lines,'```','</details>','');
 try{ appendFileSync(file, L.join('\n')+'\n'); }catch(e){ console.log('  (job summary not written: '+e.message+')'); }
}
/* ===== THE RESULT ALSO GOES TO THE STUDIO =====
   The table on screen is gone when the run ends, and a person should be able to read
   it in the studio. So each check's latest result is written to
   build/audit/<suite>.json and MERGED: a partial run (--no-browser, say) updates only
   its own checks, and the rest keep their own time, so a stale one shows as stale. */
function save(suite){
 try{
  const dir=new URL('../build/audit/',import.meta.url).pathname;
  mkdirSync(dir,{recursive:true});
  const file=dir+suite+'.json';
  let old={}; try{ old=JSON.parse(readFileSync(file,'utf8')); }catch(e){}
  const time=new Date().toISOString();
  const checks={...(old.checks||{})};
  for(const r of R) checks[r.name]={status:r.status,value:r.value,cal:r.cal,unit:r.unit,
   note:r.note,error:r.err||r.calErr||null,time};
  writeFileSync(file, JSON.stringify({suite,
   last:{time,count:R.length,argv:process.argv.slice(2)}, checks},null,1)+'\n');
 }catch(e){ console.log('  (studio result not written: '+e.message+')'); }
}
export function report(){
 const S=[];                            // the same lines on screen and in the job summary
 const say=t=>{ console.log(t); S.push(t.replace(/^\n/,'')); };
 const w = Math.max(...R.map(r=>r.name.length), 18);
 say('\n  ' + 'CHECK'.padEnd(w) + '  RESULT        MEASURED        KNOWN-BAD');
 say('  ' + '-'.repeat(w+46));
 for(const r of R){
  const kbad = r.cal==null ? '—' : f(r.cal);
  say('  ' + r.name.padEnd(w) + '  ' + r.status.padEnd(12)
    + ' ' + (r.value===undefined?'':f(r.value)).padStart(12)
    + ' ' + kbad.padStart(15) + (r.unit?' '+r.unit:''));
  if(r.status==='ERROR') say('      '+String(r.err).split('\n')[0].slice(0,120));
  if(r.status==='UNPROVEN') say(r.calErr
   ? '      the calibration itself threw, so nothing was proved: '+r.calErr
   : '      the broken case passed too — this check cannot see the failure it watches');
  if(r.note) say('      '+r.note);
 }
 const bad = R.filter(r=>r.status==='FAIL'||r.status==='ERROR'||r.status==='UNPROVEN');
 say('\n  ' + R.length + ' checks, ' + bad.length + ' problem(s)\n');
 summary(SUITE, S, bad);
 annotate(SUITE, bad);
 save(SUITE);
 return bad.length===0;
}
