/* ===== THE STUDIO'S CHECKS =====
   The studio gives a person what the AI cannot do, so it has to prove itself too: it
   must not serve a foreign file, it must open every work, it must carry the AI's
   change to the person, and it must carry the person's note to the AI. From outside
   it must let in the owner, through the bot, and nobody else. Every check carries its
   own deliberately broken case, like all the others. */
import {check,report} from './lib.mjs';
import {mkdtempSync,writeFileSync,rmSync,existsSync,readFileSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';
import http from 'http';
import {execFileSync} from 'child_process';
const N1=mkdtempSync(join(tmpdir(),'studio-notes-')), N2=mkdtempSync(join(tmpdir(),'studio-notes-'));
process.env.STUDIO_NOTES_DIR=N1;
const {server,watchWorks,safePath,works,build,editNumber,ROOT}=await import('../server.mjs');
const {createAuth}=await import('../auth.mjs');
const t0=Date.now();

/* A FAKE TELEGRAM. A test never touches the real bot: a bot token has one poller,
   and a test that polled it would take the owner's own /login away. */
const TG={queue:[], sent:[], next:1};
const fakeTg=http.createServer((req,res)=>{ let b=''; req.on('data',c=>b+=c); req.on('end',()=>{
 const m=req.url.match(/^\/botTEST:TOKEN\/(\w+)$/), body=b?JSON.parse(b):{};
 const ok=r=>{ res.writeHead(200,{'content-type':'application/json'}); res.end(JSON.stringify({ok:true,result:r})); };
 if(!m){ res.writeHead(404,{'content-type':'application/json'}); return res.end('{"ok":false,"description":"no such bot"}'); }
 if(m[1]==='getMe') return ok({username:'test_studio_bot'});
 if(m[1]==='setMyCommands') return ok(true);
 if(m[1]==='sendMessage'){ TG.sent.push(body); return ok({message_id:TG.sent.length}); }
 if(m[1]==='getUpdates'){ TG.queue=TG.queue.filter(u=>u.update_id>=(body.offset||0));
  if(TG.queue.length) return ok(TG.queue); setTimeout(()=>ok([]),100); return; }
 ok(true);
}); });
await new Promise(r=>fakeTg.listen(0,'127.0.0.1',r));
const STATE=mkdtempSync(join(tmpdir(),'studio-auth-'));
let SHIFT=0;                                             // moves the auth's clock, for the expiry check
const auth=createAuth({botToken:'TEST:TOKEN', owners:'111, 222', publicUrl:'https://studio.test', stateDir:STATE,
 api:`http://127.0.0.1:${fakeTg.address().port}`, now:()=>Date.now()+SHIFT, log:()=>{}});
await auth.startBot();
/* the owner (or a stranger) writes to the bot; returns what the bot answered */
async function botSays(from, text){
 const before=TG.sent.length;
 TG.queue.push({update_id:TG.next++, message:{message_id:1, date:Math.floor(Date.now()/1000),
  chat:{id:from, type:'private'}, from:{id:from}, text}});
 for(let i=0;i<60&&TG.sent.length===before;i++) await new Promise(r=>setTimeout(r,50));
 return TG.sent.slice(before);
}

const S=server({auth}); const stop=watchWorks();
await new Promise(r=>S.listen(0,'127.0.0.1',r));
const BASE=`http://127.0.0.1:${S.address().port}`;
const status=async p=>(await fetch(BASE+p)).status;
const send=(p,b)=>fetch(BASE+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});
const cleanup=[];
try{

/* NO FOREIGN FILE IS SERVED. The repository root holds .env (the Labs token) and .git. */
const BAD=['.env','../.env','%2e%2e/.env','harness/../.env','.git/config','%2e%2e%2f%2e%2e%2fetc%2fpasswd',
 'studio/projects/oq-kocha/node_modules/playwright/package.json','studio/projects/zarra/zarra.html%00.png'];
const naive=rel=>{ const p=join(ROOT,decodeURIComponent(rel)); return existsSync(p)?p:null; };
await check({name:'studio/no-foreign-files', unit:'hidden or outside files served',
 measure:async()=>BAD.filter(p=>safePath(p)).length
   + (await Promise.all(['/w/.env','/w/%2e%2e/.env','/w/.git/config'].map(status))).filter(s=>s===200).length,
 pass:v=>v===0,
 calibrate:()=>BAD.filter(p=>naive(p)).length,              // a join with no checks serves .env
 note:BAD.length+' bad paths, three of them over HTTP as well'});

/* EVERY WORK OPENS. Build what is built, then every page on the list must answer 200. */
const W=works();
for(const w of W) if(w.build){ const r=await build(w); if(!r.ok) throw new Error(w.id+' did not build: '+r.output.slice(-300)); }
const missing=async L=>(await Promise.all(L.map(w=>status('/w/'+w.page)))).filter(s=>s!==200).length;
await check({name:'studio/every-work-opens', unit:'work pages that did not open',
 measure:()=>missing(W),
 pass:v=>v===0,
 calibrate:()=>missing(W.map((w,i)=>i===0?{...w,page:w.page.replace(/\.html$/,'x.html')}:w)),
 note:W.length+' works: '+W.map(w=>w.id).join(', ')});

/* THE AI'S CHANGE REACHES THE PERSON. When a file in a work's folder changes, the
   studio sends an event. The broken case writes to a folder that is not watched -- no
   event may arrive, or the check would be reading any event as "arrived". */
function waitForEvent(write, work, ms=3000){
 return new Promise((res,rej)=>{
  const req=http.get(BASE+'/api/events',r=>{ let buf='';
   const t=setTimeout(()=>{ req.destroy(); res(1); },ms);       // did not arrive: 1
   r.on('data',c=>{ buf+=c; for(const m of buf.matchAll(/^data: (.*)$/gm)){
     try{ if(JSON.parse(m[1]).work===work){ clearTimeout(t); req.destroy(); res(0); return; } }catch(e){} } });
   setTimeout(write,150);
  }); req.on('error',e=>{ if(e.code!=='ECONNRESET') rej(e); });
 });
}
const PROBE=join(ROOT,W.find(w=>w.id==='zarra').dir,'__studio_probe__.txt'), FOREIGN=join(ROOT,'harness','__studio_probe__.txt');
cleanup.push(PROBE,FOREIGN);
await check({name:'studio/change-arrives', unit:'changes that did not arrive',
 measure:()=>waitForEvent(()=>writeFileSync(PROBE,String(Date.now())),'zarra'),
 pass:v=>v===0,
 calibrate:async()=>{ rmSync(PROBE,{force:true}); await new Promise(r=>setTimeout(r,600));
  return waitForEvent(()=>writeFileSync(FOREIGN,String(Date.now())),'zarra',1500); },
 note:'a file in a work folder was written and the event came over SSE'});

/* THE PERSON'S NOTE REACHES THE AI. A note written through the studio lands in the
   file and reads back; an empty note is refused. The broken case reads another folder. */
const noteThere=async()=>{ const L=await (await fetch(BASE+'/api/notes?work=zarra')).json();
 return L.some(n=>n.frame===5&&n.text==='a test note')?0:1; };
await check({name:'studio/note-round-trip', unit:'notes lost',
 measure:async()=>{ await send('/api/note',{work:'zarra',frame:5,text:'a test note'});
  const empty=(await send('/api/note',{work:'zarra',text:'  '})).status;
  return (await noteThere()) + (empty===400?0:1); },
 pass:v=>v===0,
 calibrate:async()=>{ process.env.STUDIO_NOTES_DIR=N2; const v=await noteThere(); process.env.STUDIO_NOTES_DIR=N1; return v; },
 note:'a note goes to studio/notes/<work>.md; here, to a temporary folder'});

/* THE AI'S ANSWER STAYS WITH ITS NOTE. The AI answers under a note with an indented
   quote; the studio shows the answer under that note, reads the frame the note was
   left on, and ticking a note done keeps its answers. The broken case cuts the answers
   off from their note with a blank line: then they are nobody's, and must not count. */
const NOTES_MUSHUK=(gap)=>`# Notes: Mushuk\n\n- [ ] 2026-10-04 10:12 +0500 · frame 7 · the tail is lost here\n${gap?'\n':''}`+
 `  > 2026-10-04 10:30 · AI · tail drawn after the body, mushuk.html:88\n  > and its shadow too\n- [ ] 2026-10-04 11:00 +0500 · another note\n`;
const repliesWrong=async()=>{ const L=await (await fetch(BASE+'/api/notes?work=mushuk')).json();
 const a=L[0]||{}, b=L[1]||{};
 return (a.frame===7?0:1)+(a.text==='the tail is lost here'?0:1)+(a.replies?.length===2?0:1)
  +(a.replies?.[0]?.who==='AI'&&a.replies?.[1]?.text==='and its shadow too'?0:1)+(b.replies?.length===0?0:1); };
await check({name:'studio/note-replies', unit:'notes read wrong',
 measure:async()=>{ writeFileSync(join(N1,'mushuk.md'),NOTES_MUSHUK(false));
  const before=await repliesWrong();
  await send('/api/note/state',{work:'mushuk',line:2,done:true});          // tick the note: its answers stay
  const after=await repliesWrong();
  const ticked=(await (await fetch(BASE+'/api/notes?work=mushuk')).json())[0]?.done?0:1;
  return before+after+ticked; },
 pass:v=>v===0,
 calibrate:async()=>{ writeFileSync(join(N1,'mushuk.md'),NOTES_MUSHUK(true)); return repliesWrong(); },
 note:'"- [ ] time · frame N · text", then "  > time · AI · what was done" lines under it'});

/* CHANGES ARE SAID IN WORDS. A file the AI has just made shows as "new", with its path
   inside the work and how many lines it has; no raw git code (??, AM) reaches the
   panel. The broken case is git's own porcelain, which is what the panel showed. */
const CHANGE_PROBE=join(ROOT,W.find(w=>w.id==='zarra').dir,'__studio_changes_probe__.txt');
cleanup.push(CHANGE_PROBE);
const RAW=/^[ MADRCUT?!]{1,2}$/;
const judge=files=>{ const f=files.find(x=>x.path==='__studio_changes_probe__.txt');
 return (f?0:1)+(f&&f.words.includes('new, not yet added')?0:1)+(f&&f.add===3?0:1)+files.filter(x=>x.words.some(w=>RAW.test(w))).length; };
await check({name:'studio/changes-in-words', unit:'things not said in words',
 measure:async()=>{ writeFileSync(CHANGE_PROBE,'one\ntwo\nthree\n');
  return judge((await (await fetch(BASE+'/api/changes?work=zarra')).json()).files); },
 pass:v=>v===0,
 calibrate:()=>judge(execFileSync('git',['status','--porcelain','--',CHANGE_PROBE],{cwd:ROOT}).toString().trim().split('\n')
  .map(l=>({path:l.slice(3).split('/').pop(),words:[l.slice(0,2)],add:null}))),
 note:'status words, the path inside the work, +N −M against the last commit'});

/* THE TIMELINE CHANGES ONE NUMBER, IN THE ROW IT NAMES. An edit says "the row whose k is
   c, its df" -- and only that number may change: not the same key in the row above, not
   a nested one, and nothing at all when the row is missing, named twice, the value is
   not a number or the file is outside the work. The broken case is the obvious way to do
   it, replacing the first "df:" in the file, which rewrites the wrong row. */
const ZW=W.find(w=>w.id==='zarra'), EDIT_PROBE=join(ROOT,ZW.dir,'__studio_edit_probe__.mjs'); cleanup.push(EDIT_PROBE);
const TABLE=`export const SHOTS=[\n {k:"a'b", snd:{wind:0.5,city:0.2}, df:10, far:7},\n {k:'c', snd:{wind:0.7,city:0.1}, df:20},\n {k:'twin', df:1},{k:'twin', df:2}\n];\n`;
const WANT=TABLE.replace('df:20','df:25').replace('wind:0.5','wind:0.3');
const editFaults=async(apply)=>{ writeFileSync(EDIT_PROBE,TABLE);
 const f='__studio_edit_probe__.mjs'; let faults=0;
 try{ apply({file:f,row:{key:'k',is:'c'},key:'df',value:25}); apply({file:f,row:{key:'k',is:"a'b"},key:'wind',value:0.3}); }catch(e){ faults++; }
 if(readFileSync(EDIT_PROBE,'utf8')!==WANT) faults++;
 for(const bad of [{file:f,row:{key:'k',is:'twin'},key:'df',value:9},{file:f,row:{key:'k',is:'nobody'},key:'df',value:9},
   {file:f,row:{key:'k',is:'c'},key:'far',value:9},{file:f,row:{key:'k',is:'c'},key:'df',value:'9; rm'},
   {file:'../../../harness/lib.mjs',row:{key:'k',is:'c'},key:'df',value:9},{file:f,row:{key:'k',is:'c'},key:'df); x(',value:9}]){
  let refused=false; try{ apply(bad); }catch(e){ refused=true; } if(!refused) faults++; }
 if(readFileSync(EDIT_PROBE,'utf8')!==WANT) faults++;
 /* and an undo puts back the very text: 0.50 stays 0.50, not 0.5 */
 writeFileSync(EDIT_PROBE,"const S=[{k:'z', d:0.50}];\n");
 try{ const r=apply({file:f,row:{key:'k',is:'z'},key:'d',value:0.625}); apply({file:f,row:{key:'k',is:'z'},key:'d',value:r.from,as:r.fromText}); }catch(e){ faults++; }
 if(readFileSync(EDIT_PROBE,'utf8')!=="const S=[{k:'z', d:0.50}];\n") faults++;
 rmSync(EDIT_PROBE,{force:true}); return faults; };
await check({name:'studio/edit-one-number', unit:'wrong writes, or bad edits not refused',
 measure:()=>editFaults(e=>editNumber(ZW,e)), pass:v=>v===0,
 calibrate:()=>editFaults(e=>{ const t=readFileSync(EDIT_PROBE,'utf8'); writeFileSync(EDIT_PROBE,t.replace(new RegExp(e.key+':[\\d.]+'),e.key+':'+e.value)); }),
 note:'two edits land on their own rows; six bad ones (twin row, no row, no key, not a number, outside the work, a key that is code) write nothing'});

/* A FOREIGN PAGE CANNOT CHANGE ANYTHING. Behind a password the browser sends the
   saved password with any request to the host, a foreign page's included. Three
   forged requests: a foreign Origin, a form-style body with no Origin, and both. The
   broken case is the studio page's own request, which has to be accepted -- or the
   check would read every refusal, including of a request nobody could make, as a pass. */
function rawPost(path, headers){
 return new Promise((res,rej)=>{
  const r=http.request(BASE+path,{method:'POST',headers},x=>{ x.resume(); x.on('end',()=>res(x.statusCode)); });
  r.on('error',rej); r.end(JSON.stringify({work:'zarra',text:'forged'}));
 });
}
const accepted=async L=>{ let n=0; for(const h of L){ const st=await rawPost('/api/note',h); if(st>=200&&st<300) n++; } return n; };
await check({name:'studio/foreign-page-refused', unit:'forged changes accepted',
 measure:()=>accepted([{'content-type':'application/json',origin:'https://evil.example'},
                       {'content-type':'text/plain'},
                       {'content-type':'text/plain',origin:'https://evil.example'},
                       {'content-type':'application/json',origin:'null','sec-fetch-site':'cross-site'},
                       {'content-type':'application/json',origin:'null'}]),
 pass:v=>v===0,
 /* the studio page's own POST, as Chrome sends it under no-referrer: Origin null,
    Sec-Fetch-Site same-origin. The first version refused exactly this. */
 calibrate:()=>accepted([{'content-type':'application/json',origin:'null','sec-fetch-site':'same-origin'}]),
 note:'a POST must be JSON and come from this host\'s page: Sec-Fetch-Site, then Origin'});

/* ===== FROM OUTSIDE ===== a request that came through the proxy carries
   X-Forwarded-For; one that names the public host is outside too. */
function call(method, path, headers={}, body){
 return new Promise((res,rej)=>{
  const r=http.request(BASE+path,{method,headers},x=>{ let t=''; x.on('data',c=>t+=c);
   x.on('end',()=>res({status:x.statusCode, headers:x.headers, text:t})); });
  r.on('error',rej); r.end(body);
 });
}
const OUT={'x-forwarded-for':'203.0.113.9'};
const PAGE='/w/'+W.find(w=>w.id==='zarra').page;
const ok2xx=async L=>{ let n=0; for(const [m,p,h,b] of L){ const r=await call(m,p,h,b); if(r.status>=200&&r.status<300) n++; } return n; };
const asked=h=>[['GET','/',h],['GET','/api/works',h],['GET',PAGE,h],
 ['POST','/api/note',{...h,'content-type':'application/json'},JSON.stringify({work:'zarra',text:'from outside'})]];
const S2=server();                                        // a studio started with no login at all
await new Promise(r=>S2.listen(0,'127.0.0.1',r));
await check({name:'studio/outside-needs-login', unit:'outside requests answered without a session',
 measure:async()=>await ok2xx(asked(OUT))
   + await ok2xx([['GET','/api/works',{host:'code-video.abclegacyllc.com'}]])
   + await (async()=>{ const r=await fetch(`http://127.0.0.1:${S2.address().port}/api/works`,{headers:OUT}); return r.ok?1:0; })(),
 pass:v=>v===0,
 calibrate:()=>ok2xx(asked({})),                          // the same requests from this machine are answered
 note:'through the proxy, and by the public host name; a studio with no login refuses them all'});

/* THE OWNER GETS IN THROUGH THE BOT, A STRANGER DOES NOT. The whole way: /login to
   the bot, the link it sends, the page that link opens (which must not spend it -- a
   preview bot opens links too), the POST that makes the session, and the studio. */
async function loginThroughBot(id){
 const said=await botSays(id,'/login');
 const url=said.map(m=>m.reply_markup?.inline_keyboard?.[0]?.[0]?.url).find(Boolean);
 if(!url) return {access:0};
 const path=new URL(url).pathname;
 const peek=await call('GET',path,OUT);                    // what a link preview would do
 if(peek.status!==200) return {access:0};
 const post=await call('POST',path,{...OUT,origin:'null','sec-fetch-site':'same-origin'});  // as Chrome sends the form
 const cookie=String(post.headers['set-cookie']||'').split(';')[0];
 if(post.status!==303||!cookie) return {access:0};
 const r=await call('GET','/api/works',{...OUT,cookie});
 return {access:r.status===200?1:0, cookie};
}
let OWNER_COOKIE='';
await check({name:'studio/bot-login', unit:'got into the studio',
 measure:async()=>{ const r=await loginThroughBot(111); OWNER_COOKIE=r.cookie||''; return r.access; },
 pass:v=>v===1,
 calibrate:async()=>(await loginThroughBot(333)).access,     // not an owner: no link, no way in
 note:'/login → a one-time link → GET shows a page (a preview spends nothing) → POST makes the session'});

/* A LINK WORKS ONCE, AND NOT AFTER FIVE MINUTES. */
const spend=async link=>{ const r=await call('POST',new URL(link).pathname,OUT); return r.status===303?1:0; };
await check({name:'studio/login-link-once', unit:'sessions made by a spent or expired link',
 measure:async()=>{ const a=auth.issueLink(111); await spend(a); const again=await spend(a);
  const b=auth.issueLink(111); SHIFT=6*60*1000; const late=await spend(b); SHIFT=0;
  return again+late; },
 pass:v=>v===0,
 calibrate:()=>spend(auth.issueLink(111)),                 // a fresh link does make one
 note:'the second use of a link, and a use after 5 minutes, are refused'});

/* A SESSION NOBODY WAS GIVEN, OR ONE THAT WAS ENDED, OPENS NOTHING. */
const withCookie=async c=>(await call('GET','/api/works',{...OUT,cookie:c})).status===200?1:0;
await check({name:'studio/forged-session-refused', unit:'forged or ended sessions let in',
 measure:async()=>{
  const forged=await withCookie('cv_studio=Zm9yZ2VkLXNlc3Npb24tdmFsdWUtdGhhdC1ub2JvZHktZ2F2ZQ');
  const a=(await loginThroughBot(222)).cookie;              // log out from the page
  await call('POST','/logout',{...OUT,cookie:a}); const afterLogout=await withCookie(a);
  const b=(await loginThroughBot(222)).cookie;              // log out from the bot: every session ends
  await botSays(222,'/logout'); const afterBot=await withCookie(b);
  return forged+afterLogout+afterBot; },
 pass:v=>v===0,
 calibrate:()=>withCookie(OWNER_COOKIE),                   // the owner's live session does let in
 note:'a made-up cookie, a session after /logout on the page, and after /logout to the bot'});

/* THE BROWSER'S ICON REQUEST IS ANSWERED QUIETLY. Every page asks for /favicon.ico; a
   404 is a red line in the console on every load, and from outside it was a redirect
   to /login. Both pages also say they have no icon, so most browsers do not ask. The
   broken case asks for a path that is not the icon: refused from outside, as it should. */
const iconMisses=async icon=>{ const r=await call('GET',icon,OUT);
 const studio=(await call('GET','/',{})).text, login=(await call('GET','/login',OUT)).text;
 return (r.status===204?0:1)+(/<link rel="icon"/.test(studio)?0:1)+(/<link rel="icon"/.test(login)?0:1); };
await check({name:'studio/favicon-quiet', unit:'icon requests not answered quietly',
 measure:()=>iconMisses('/favicon.ico'), pass:v=>v===0,
 calibrate:()=>iconMisses('/favicon.png'),
 note:'/favicon.ico → 204 before the login gate; the studio and the login page link an empty icon'});

/* EVERY TEXT COLOUR READS. tokens.css is the one place colours are set, so its pairs are
   measured here (WCAG 2 contrast): text 4.5:1 on both surfaces in both themes, the
   primary button's text on the accent, control edges 3:1, the stage's text on the
   stage. The accent and the failure colour must be different hues, and the two copies
   of the dark theme (by preference, and by choice) must be the same. The broken case
   is the studio's palette before the audit: its PASS green 4.30:1, its warning 3.86:1,
   its accent the same red as its failures. */
function lum(hex){ const c=hex.replace('#',''), v=[0,2,4].map(i=>parseInt(c.length===3?c[i/2]+c[i/2]:c.slice(i,i+2),16)/255)
 .map(x=>x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)); return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]; }
const ratio=(a,b)=>{ const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
function hue(hex){ const c=hex.replace('#',''), [r,g,b]=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255);
 const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; if(!d) return 0;
 const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; return (h*60+360)%360; }
const vars=block=>Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map(m=>[m[1],m[2]]));
function contrastFailures(css){
 const light=vars(css.match(/:root\{([\s\S]*?)\}/)[1]);
 const pref=(css.match(/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\}\}/)||[])[1]||'';
 const chosen=(css.match(/:root\[data-theme="dark"\]\{([\s\S]*?)\}/)||[])[1]||'';
 let bad=JSON.stringify(vars(pref))===JSON.stringify(vars(chosen))?0:1;
 for(const T of [light,{...light,...vars(chosen)}]){
  const need=(fg,bg,min)=>{ if(!T[fg]||!T[bg]||ratio(T[fg],T[bg])<min) bad++; };
  for(const fg of ['ink','mut','ok','warn','bad','acc']) for(const bg of ['pa','panel']) need(fg,bg,4.5);
  need('acc-ink','acc',4.5);
  for(const bg of ['pa','panel']) need('edge',bg,3);
  need('stage-ink','stage',4.5); need('stage-mut','stage',4.5);
  const dh=Math.abs(hue(T.acc||'#000000')-hue(T.bad||'#000000')); if(Math.min(dh,360-dh)<60) bad++;
 }
 return bad;
}
const BEFORE=`:root{--pa:#ecedf0;--panel:#f6f7f9;--ink:#15171d;--mut:#646c7c;--rule:#c9ccd4;--edge:#c9ccd4;--stage:#0b0c10;--stage-ink:#e6e8ee;--stage-mut:#8790a0;
 --acc:#b0432a;--acc-ink:#ffffff;--ok:#2f7d4f;--bad:#b0432a;--warn:#a26b12}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--pa:#0b0c10;--panel:#12141a;--ink:#e6e8ee;--mut:#8790a0;--rule:#282c36;--edge:#282c36;--acc:#d9613f;--acc-ink:#ffffff;--ok:#5fb37f;--bad:#e0704f;--warn:#d9a441}}
:root[data-theme="dark"]{--pa:#0b0c10;--panel:#12141a;--ink:#e6e8ee;--mut:#8790a0;--rule:#282c36;--edge:#282c36;--acc:#d9613f;--acc-ink:#ffffff;--ok:#5fb37f;--bad:#e0704f;--warn:#d9a441}`;
await check({name:'studio/tokens-contrast', unit:'colour pairs under their minimum',
 measure:()=>contrastFailures(readFileSync(join(ROOT,'studio','tokens.css'),'utf8')),
 pass:v=>v===0,
 calibrate:()=>contrastFailures(BEFORE),
 note:'text 4.5:1 and edges 3:1 on --pa and --panel, light and dark; accent and failure hues 60° apart'});

/* NO COLOUR IS WRITTEN OUTSIDE tokens.css. A colour typed into the page or the login
   pages is the next drift between them -- that is how the accent became the error red.
   The broken case is the page with one such colour added. */
const STRAY=/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_$-])|\b(?:rgba?|hsla?)\(|:\s*(?:white|black|red|green|blue|gray|grey|orange)\b/g;
const strays=texts=>texts.reduce((n,t)=>n+(t.match(STRAY)||[]).length,0);
const PAGE_FILES=['index.html','auth.mjs'].map(f=>readFileSync(join(ROOT,'studio',f),'utf8'));
await check({name:'studio/no-stray-colours', unit:'colours written outside tokens.css',
 measure:()=>strays(PAGE_FILES), pass:v=>v===0,
 calibrate:()=>strays([PAGE_FILES[0].replace('</style>','.x{color:#b0432a}</style>'),PAGE_FILES[1]]),
 note:'studio/index.html and studio/auth.mjs; studio/DESIGN.md says which token is for what'});

}finally{
 auth.stopBot(); fakeTg.close(); fakeTg.closeAllConnections?.();
 rmSync(STATE,{recursive:true,force:true});
 for(const f of cleanup) rmSync(f,{force:true});
 rmSync(N1,{recursive:true,force:true}); rmSync(N2,{recursive:true,force:true});
 stop(); S.close(); S.closeAllConnections?.();
 if(typeof S2!=='undefined'){ S2.close(); S2.closeAllConnections?.(); }
}
const ok=report();
console.log(`  ${((Date.now()-t0)/1000).toFixed(1)}s\n`);
process.exit(ok?0:1);
