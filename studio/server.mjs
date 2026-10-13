/* ===== STUDIO =====
   Where a person and an AI work on the same piece. The AI changes the code; the person
   watches and listens to the work live, scrubs to any frame, reads its card and its
   checks, and leaves a note on a frame. The note is written to a file inside the
   repository, so the AI can read it -- a person's eyes and ears are what the AI does
   not have, and the studio joins the two into one piece of work.

   Human and AI share validated operations, revision checks and persistent history.
   Legacy works keep their source adapters; managed projects have one authored document.

   Node with Acorn for source parsing. It listens on 127.0.0.1 only, because it can run build
   commands -- but only the ones written in the cards. From outside (through Caddy,
   on a public name) it asks for a login through a Telegram bot: see auth.mjs. */
import http from 'node:http';
import {readFileSync, existsSync, readdirSync, mkdirSync, appendFileSync, writeFileSync, statSync, realpathSync} from 'node:fs';
import {join, sep, extname, dirname, resolve, relative} from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createAuth, readEnv, fromOwnPage} from './auth.mjs';
import {prepareNumber, atomicWrite, digest, sourcePath, withSourceLock} from './core/source-edit.mjs';
import {createProjectStore, ProjectError} from './core/store.mjs';
import {watchTree} from './core/watch-tree.mjs';
import {serveFile} from './core/http-file.mjs';
import {importAsset} from './core/assets.mjs';
import {measurementStatus} from '../catalog/tools/fingerprint.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO = join(ROOT, 'studio');

const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
 '.css':'text/css; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
 '.wav':'audio/wav', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.frag':'text/plain; charset=utf-8', '.glsl':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8'};

/* ===== A SAFE PATH =====
   The repository root holds .env (the Labs token) and .git holds the whole history.
   The studio has to serve pages, not those. Any segment that starts with a dot (.env,
   .git, ..) and node_modules is refused, the result cannot leave the root, and only a
   file of a listed type is served. */
export function safePath(rel, root=ROOT){
 let s; try{ s=decodeURIComponent(rel); }catch(e){ return null; }
 if(s.includes('\0')) return null;
 const parts=s.split(/[\\/]+/).filter(Boolean);
 if(!parts.length || parts.some(p=>p.startsWith('.') || p==='node_modules')) return null;
 const p=join(root, ...parts);
 if(!p.startsWith(root+sep)) return null;
 if(!TYPES[extname(p)]) return null;
 if(existsSync(p)){
  const actual=realpathSync(p),base=realpathSync(root);
  if(!actual.startsWith(base+sep)||!statSync(actual).isFile()) return null;
  const parts=relative(base,actual).split(sep);
  if(parts.some(x=>x.startsWith('.')||x==='node_modules')||!TYPES[extname(actual)]) return null;
 }
 return p;
}

/* ===== WORKS =====
   A work with a card takes its name, page and build from the card -- no second copy is
   kept. Works without a card (zarra, masofa-maydoni) are in studio/works.json. */
const cardPath = f => join(ROOT, 'catalog', 'cards', f);
const worksFile = () => process.env.STUDIO_WORKS || join(STUDIO, 'works.json');   // a test brings its own list
export function works(){
 const reg = JSON.parse(readFileSync(worksFile(), 'utf8'));
 return reg.works.map(w=>{
  const o = {...w, card:null, build:null};
  if(w.card){
   const cf = cardPath(w.card), cdir = dirname(cf);
   try{
    const c = JSON.parse(readFileSync(cf, 'utf8'));
    o.card = {...c,measurementStatus:measurementStatus({...c,_f:cf})}; o.cardFile = w.card; o.name = c.name;
    o.page = resolve(cdir, c.frame.file).slice(ROOT.length+1);
    if(c.frame.build) o.build = {dir: resolve(cdir, c.frame.build.dir), command: c.frame.build.command};
   }catch(e){ o.cardError = String(e.message); }
  }
  return o;
 });
}
const findWork = id => works().find(w=>w.id===id) || null;

/* When a work's sources last changed: the newest file in its folder, output (build/),
   node_modules and dot folders left out. A check that ran before this did not see
   the work as it is now, and the studio says so. */
export function sourcesChangedAt(dir){
 let t = 0;
 const walk = d => { let L; try{ L = readdirSync(d, {withFileTypes:true}); }catch(e){ return; }
  for(const e of L){
   if(e.name.startsWith('.') || e.name==='node_modules' || e.name==='build') continue;
   const f = join(d, e.name);
   if(e.isDirectory()) walk(f);
   else if(e.isFile()){ try{ t = Math.max(t, statSync(f).mtimeMs); }catch(err){} }
  }
 };
 walk(join(ROOT, dir));
 return Math.round(t);
}

/* ===== BUILD ===== one build at a time per work; if another change arrives while it
   runs, it builds once more when it is done. */
const building = new Map(), again = new Set();
export function build(w){
 if(!w.build) return Promise.resolve({ok:true, ms:0, output:''});
 if(building.has(w.id)){ again.add(w.id); return building.get(w.id); }
 const t0 = Date.now();
 const [cmd, ...args] = w.build.command.split(/\s+/);
 const p = new Promise(res=>execFile(cmd, args, {cwd:w.build.dir, timeout:180000, maxBuffer:4<<20},
  (err, out, errOut)=>res({ok:!err, ms:Date.now()-t0, output:String(out)+String(errOut)})))
  .finally(()=>{ building.delete(w.id);
   if(again.delete(w.id)) build(w).then(r=>send({type:'updated', work:w.id, files:[], built:r})); });
 building.set(w.id, p);
 return p;
}

/* ===== NOTES =====
   A person writes, the AI reads: studio/notes/<work>.md, one note per line.
   "- [ ]" open, "- [x]" done. The file is plain markdown, so the AI can read it
   without the studio and add its answer to the line. */
const notesDir = () => process.env.STUDIO_NOTES_DIR || join(STUDIO, 'notes');
const notesFile = id => join(notesDir(), id+'.md');
const NOTE_LINE = /^- \[( |x)\] (.*)$/;
/* A reply is an indented quote under its note -- the AI says there what it did:
     - [x] 2026-10-04 10:12 +0500 · frame 140 · the snow is too bright here
       > 2026-10-04 10:30 · AI · snow alpha 0.70 -> 0.55, whiteout.html:120 */
const REPLY_LINE = /^\s+>\s?(.*)$/;
const STAMP = /^(\d{4}-\d\d-\d\d(?: \d\d:\d\d)?(?: [+-]\d{4})?)(?: · frame (\d+))? · ([\s\S]*)$/;
const REPLY_STAMP = /^(\d{4}-\d\d-\d\d(?: \d\d:\d\d)?(?: [+-]\d{4})?) · ([^·]{1,40}?) · ([\s\S]*)$/;
export function notes(id){
 const f = notesFile(id); if(!existsSync(f)) return [];
 const out = [];
 readFileSync(f, 'utf8').split('\n').forEach((q, i)=>{
  const m = q.match(NOTE_LINE);
  if(m){
   const s = m[2].match(STAMP);
   out.push({line:i, done:m[1]==='x', time:s?s[1]:null, frame:s&&s[2]!==undefined?+s[2]:null,
    text:s?s[3]:m[2], replies:[]});
   return;
  }
  const r = q.match(REPLY_LINE), last = out[out.length-1];
  if(r && last && last.line + 1 + last.replies.length === i){
   const s = r[1].match(REPLY_STAMP);
   last.replies.push(s ? {time:s[1], who:s[2].trim(), text:s[3]} : {time:null, who:null, text:r[1]});
  }
 });
 return out;
}
export function addNote(w, frame, text){
 mkdirSync(notesDir(), {recursive:true});
 const f = notesFile(w.id);
 if(!existsSync(f)) writeFileSync(f, `# Notes: ${w.name}\n\nA person writes from the studio; the AI reads. [ ] open, [x] done.\n\n`);
 /* local time with its zone: the person sees their own clock, the AI reads the zone */
 const d = new Date(), z = -d.getTimezoneOffset(), p2 = n=>String(n).padStart(2,'0');
 const time = `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())} ${z>=0?'+':'-'}${p2(Math.abs(z)/60|0)}${p2(Math.abs(z)%60)}`;
 const at = Number.isInteger(frame) && frame>=0 ? ` · frame ${frame}` : '';
 appendFileSync(f, `- [ ] ${time}${at} · ${String(text).replace(/\s*\n\s*/g,' / ').trim()}\n`);
}
function markNote(id, line, done){
 const f = notesFile(id); const L = readFileSync(f, 'utf8').split('\n');
 if(!NOTE_LINE.test(L[line]||'')) throw new Error('no such note line');
 L[line] = L[line].replace(/^- \[( |x)\]/, done ? '- [x]' : '- [ ]');
 writeFileSync(f, L.join('\n'));
}

/* ===== CHECKS, CHANGES, DECISIONS ===== */
function audits(){
 const dir = join(ROOT, 'build', 'audit'); if(!existsSync(dir)) return {};
 const o = {};
 for(const f of readdirSync(dir).filter(f=>f.endsWith('.json'))){
  try{ o[f.slice(0,-5)] = JSON.parse(readFileSync(join(dir,f), 'utf8')); }catch(e){}
 }
 if(o.catalog?.checks){const cards=works().filter(w=>w.card),cache=new Map();
  for(const [name,result] of Object.entries(o.catalog.checks)){
   const w=cards.find(w=>name.startsWith('claim/'+w.card.name+'/'));if(!w)continue;
   const key=name.slice(('claim/'+w.card.name+'/').length),rule=w.card.claims?.[key],claim=result.evidence?.claim;
   if(!rule||!claim||claim.key!==key||claim.op!==rule[0]||claim.limit!==rule[1]){result.freshness={status:'unverified',reason:'claim rule has not been verified by this audit'};continue;}
   const signature=w.id+':'+result.evidence.sourceHash;if(!cache.has(signature))cache.set(signature,measurementStatus({...w.card,_f:cardPath(w.cardFile),measureEvidence:result.evidence}));result.freshness=cache.get(signature);
  }
 }
 return o;
}
const git = args => new Promise(res=>execFile('git', args, {cwd:ROOT, maxBuffer:4<<20},
 (err, out)=>res(err ? '' : String(out))));
/* What changed in a work, in words: each file not yet committed with what happened to
   it, its path inside the work, and how many lines came and went against the last
   commit. Status and numstat run over the whole tree and are filtered here, because a
   path filter hides the other half of a rename and git then calls a moved file new. */
const WORDS = {M:'modified', A:'added', D:'deleted', R:'renamed', C:'copied', U:'in conflict', T:'type changed'};
export async function changes(w){
 const paths = [w.dir]; if(w.cardFile) paths.push('catalog/cards/'+w.cardFile);
 const mine = f => paths.some(p=>f===p || f.startsWith(p+'/'));
 const [status, numstat] = await Promise.all([
  git(['status', '--porcelain=v1', '-z', '--untracked-files=all']),
  git(['diff', 'HEAD', '--numstat', '-M', '-z'])]);
 const lines = new Map();                        // path -> [added, deleted]
 { const t = numstat.split('\0'); for(let i=0; i<t.length; i++){
    const m = t[i].match(/^(-|\d+)\t(-|\d+)\t(.*)$/s); if(!m) continue;
    let file = m[3]; if(file===''){ i+=2; file = t[i]; }   // a rename: "" then old, new
    lines.set(file, [m[1]==='-'?null:+m[1], m[2]==='-'?null:+m[2]]); } }
 const files = [];
 { const t = status.split('\0'); for(let i=0; i<t.length; i++){
    const e = t[i]; if(e.length<4) continue;
    const X = e[0], Y = e[1], file = e.slice(3);
    let from = null; if(X==='R' || X==='C'){ from = t[++i]; }
    if(!mine(file)) continue;
    const words = X==='?' ? ['new, not yet added'] :
     [...new Set([X, Y].filter(c=>c!==' ').map(c=>WORDS[c]||c))];
    let [add, del] = lines.get(file) || [null, null];
    if(X==='?' && add===null){ try{ add = readFileSync(join(ROOT, file), 'utf8').split('\n').length - 1; }catch(e){} del = 0; }
    files.push({path:file.startsWith(w.dir+'/') ? relative(w.dir, file) : file, full:file, words, from,
     staged:X!==' ' && X!=='?', add, del});
 } }
 /* a work that was moved keeps its history under the old path: ask git about both */
 const before = [...new Set(files.filter(f=>f.from).map(f=>dirname(f.from)).filter(d=>d!=='.'))];
 const log = await git(['log', '-6', '--format=%h%x1f%ad%x1f%s', '--date=format:%Y-%m-%d %H:%M', '--', ...paths, ...before]);
 const commits = log.trim() ? log.trim().split('\n').map(l=>{ const [hash, time, subject] = l.split('\x1f'); return {hash, time, subject}; }) : [];
 return {dir:w.dir, files, commits};
}
/* Where in a work's source a thing is declared: the page names a file and a piece of
   text (a line number written into the page would go stale with the next edit), and the
   line is found here, now. Only inside the work's own folder. */
function sourceFile(w, file){
 const parts = String(file||'').split(/[\\/]+/).filter(Boolean);
 if(!parts.length || parts.some(p=>p.startsWith('.') || p==='node_modules' || p==='build')) return null;
 const base = join(ROOT, w.dir), f = join(base, ...parts);
 if(!f.startsWith(base+sep) || !existsSync(f)) return null;
 return {f, rel:w.dir+'/'+parts.join('/')};
}
export function where(w, file, find){
 const s = sourceFile(w, file); if(!s || !find) return null;
 const i = readFileSync(s.f, 'utf8').split('\n').findIndex(l=>l.includes(find));
 return i<0 ? null : {file:s.rel, line:i+1};
}
/* ===== ONE NUMBER, CHANGED IN THE SOURCE =====
   The timeline changes a film the only way a film here can change: by editing its code.
   An edit names a row of a table by one of its own fields (k: "yurish") and a key in that
   row (df), and exactly that number is rewritten -- nothing is searched for by position,
   so the wrong row cannot be hit. If the row is not there exactly once, or the key is
   not in it, nothing is written. Git is the undo of last resort; the studio keeps its own. */
export function editNumber(w, edit){
 const source=sourcePath(ROOT,w,edit.file);
 return withSourceLock(source.path,()=>{
  const prepared=prepareNumber(ROOT,w,edit);
  if((edit.baseHash && edit.baseHash!==digest(prepared.before)) || (edit.expectedValue!==undefined && edit.expectedValue!==prepared.from)) throw new ProjectError('source changed; refresh before editing',409);
  atomicWrite(prepared.path,prepared.after,{beforeCommit:()=>{
   if(readFileSync(prepared.path,'utf8')!==prepared.before)throw new ProjectError('source changed while saving; refresh before editing',409);
  }});
  return {file:prepared.relative,line:prepared.line,from:prepared.from,fromText:prepared.fromText,to:prepared.to,sourceHash:digest(prepared.after)};
 });
}
/* the "open questions for the owner" on the Labs pages -- where a person decides */
function decisions(){
 const dir = process.env.STUDIO_LABS_LINES || join(ROOT, 'abc-labs', 'lines');   // a test brings its own
 if(!existsSync(dir)) return [];
 const o = [];
 for(const line of readdirSync(dir)){
  const f = join(dir, line, 'for.md'); if(!existsSync(f)) continue;
  const m = readFileSync(f, 'utf8').match(/## Open questions for the owner\n([\s\S]*?)(\n---|\n## |$)/);
  let title = line; try{ title = JSON.parse(readFileSync(join(dir, line, 'line.json'), 'utf8')).title || line; }catch(e){}
  if(m) o.push({line, title, text:m[1].trim()});
 }
 return o;
}

/* ===== LIVE UPDATES =====
   When the AI changes a file, the person has to see it in the studio at once. Every
   work's folder is watched; a work that is built (oq-kocha) is built first, then its
   page reloads. build/ and node_modules are not watched: they are output, not source. */
const listeners = new Set();
function send(ev){ const s = `data: ${JSON.stringify({...ev, time:Date.now()})}\n\n`; for(const client of listeners) client.write(s); }
/* A long-lived response does not keep the permission it had when it opened. The
   session is checked immediately before each write, and logout closes it even when
   no files are changing. Local subscribers keep the same loopback access as HTTP. */
function events(req, res, auth, outside, heartbeatMs){
 let closed=false, timer, unsubscribe=()=>{};
 const close=()=>{
  if(closed) return; closed=true;
  clearInterval(timer); unsubscribe(); listeners.delete(client);
  res.end();
 };
 const revalidate=()=>{
  if(closed) return false;
  try{ if(res.destroyed || res.writableEnded || (outside && !auth.userOf(req))){ close(); return false; } }
  catch(e){ close(); return false; }
  return true;
 };
 const client={write(s){ if(!revalidate()) return;
  try{ res.write(s); }catch(e){ close(); }
 }};
 res.on('close', close); res.on('error', close);
 unsubscribe=auth.onSessionsChanged(revalidate);
 listeners.add(client);
 timer=setInterval(()=>client.write(': alive\n\n'), heartbeatMs); timer.unref();
 client.write(': studio\n\n');
}
const pending = new Map();
function changed(key, file, job){
 const k = pending.get(key) || {files:new Set()}; k.files.add(file);
 clearTimeout(k.t); k.t = setTimeout(async()=>{ pending.delete(key); await job([...k.files]); }, 250);
 pending.set(key, k);
}
const ignored = rel => !rel || rel.endsWith('.tmp') || rel.split(/[\\/]/).some(p=>p.startsWith('.') || p==='node_modules' || p==='build');
export function watchWorks(){
 const watchers = [];
 const add = (dir, fn) => { if(!existsSync(dir)) mkdirSync(dir, {recursive:true});
  watchers.push(watchTree(dir,fn,{ignore:rel=>!!rel&&ignored(rel),onError:error=>send({type:'watch-error',message:error.message})})); };
 for(const w of works()){
  add(join(ROOT, w.dir), rel=>{ if(ignored(rel)) return;
   changed(w.id, w.dir+'/'+rel, async files=>{
    const now = findWork(w.id);
    if(now?.build){ send({type:'building', work:w.id, files});
     const r = await build(now); send({type:'updated', work:w.id, files, built:r}); }
    else send({type:'updated', work:w.id, files});
   }); });
 }
 add(join(ROOT, 'catalog', 'cards'), rel=>{ const w = works().find(x=>x.cardFile===rel);
  if(w) changed('card:'+w.id, rel, ()=>send({type:'card', work:w.id})); });
 add(join(ROOT, 'build', 'audit'), rel=>changed('audit', rel, ()=>send({type:'audit'})));
 add(notesDir(), rel=>changed('note:'+rel, rel, ()=>send({type:'note', work:rel.replace(/\.md$/,'')})));
 return ()=>watchers.forEach(close=>close());
}

/* ===== ONLY THE STUDIO'S OWN PAGE MAY CHANGE THINGS =====
   On a public name behind a password, a browser sends the saved password with every
   request to that host -- including one that a foreign page makes. A foreign page
   could then start a build, or write a note into the file the AI reads. So a POST has
   to say it is JSON (a foreign page cannot send that without a preflight, which this
   server never answers) and it has to come from this host's own page (fromOwnPage in
   auth.mjs: Sec-Fetch-Site, then Origin). A request with neither header is not from a
   browser page (curl, a script, the AI). */
export function sameOrigin(req){
 const type = String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
 return type === 'application/json' && fromOwnPage(req);
}

/* ===== THE PAGE ===== the studio's values live in one file, tokens.css; the login pages
   in auth.mjs read the same file, so the two cannot drift apart */
export const tokens = () => readFileSync(join(STUDIO, 'tokens.css'), 'utf8');
const studioPage = () => readFileSync(join(STUDIO, 'index.html'), 'utf8')
 .replace('<!-- tokens.css -->', ()=>`<style>\n${tokens()}</style>`);

/* ===== HTTP ===== */
const json = (res, code, o) => { res.writeHead(code, {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}); res.end(JSON.stringify(o)); };
const body = (req,limit=65536) => new Promise((res, rej)=>{ let s=''; req.on('data', c=>{ s+=c; if(s.length>limit){ rej(new Error('too large')); req.destroy(); } });
 req.on('end', ()=>{ try{ res(s ? JSON.parse(s) : {}); }catch(e){ rej(e); } }); });

/* `auth` decides who may come in from outside. Without one, every outside request is
   refused: a studio started without its login is a local studio, never an open one. */
export function server({auth=createAuth({}), eventsHeartbeatMs=25000}={}){
 const projects=createProjectStore(ROOT);
 return http.createServer(async (req, res)=>{
  try{
   let url;
   try{ url = new URL(req.url, 'http://studio'); }
   catch(e){ return json(res, 400, {error:'invalid request URL'}); }
   const p = url.pathname;
   /* a browser asks for this on every page; answered before the gate, with nothing */
   if(p==='/favicon.ico'){ res.writeHead(204, {'cache-control':'max-age=86400'}); return res.end(); }
   if(await auth.route(req, res, p)) return;            // /login, /auth/<link>, /logout
   const outside = auth.isOutside(req);
   if(outside && !auth.userOf(req)) return auth.refuse(req, res, p);
   if(req.method==='GET' && p==='/api/me')
    return json(res, 200, {outside, user: outside ? auth.userOf(req) : null});
   if(req.method==='GET' && (p==='/' || p==='/index.html')){
    res.writeHead(200, {'content-type':TYPES['.html'], 'cache-control':'no-store'});
    return res.end(studioPage());
   }
   if(['GET','HEAD'].includes(req.method) && p.startsWith('/w/')){
    const f = safePath(p.slice(3));
    if(!f || !existsSync(f)){ res.writeHead(404); return res.end('not found'); }
    return serveFile(req,res,f,TYPES[extname(f)]);
   }
   if(req.method==='GET' && p==='/api/works')
    return json(res, 200, works().map(w=>({...w, build:!!w.build, sourcesChangedAt:sourcesChangedAt(w.dir),
     openNotes:notes(w.id).filter(n=>!n.done).length})));
   if(req.method==='GET' && p==='/api/audits') return json(res, 200, audits());
   if(req.method==='GET' && p==='/api/decisions') return json(res, 200, decisions());
   const w = url.searchParams.get('work') ? findWork(url.searchParams.get('work')) : null;
   if(req.method==='GET' && (p==='/api/project'||p==='/api/context')){
    if(!w) return json(res,404,{error:'no such work'});
    try { return json(res,200,p==='/api/project'?projects.get(w):projects.context(w,Number(url.searchParams.get('frame')||0))); }
    catch(e){ return json(res,e.status||422,{error:e.message}); }
   }
   if(req.method==='GET' && p==='/api/changes'){ if(!w) return json(res, 404, {error:'no such work'}); return json(res, 200, await changes(w)); }
   if(req.method==='GET' && p==='/api/where'){ if(!w) return json(res, 404, {error:'no such work'});
    const r = where(w, url.searchParams.get('file'), url.searchParams.get('find'));
    return r ? json(res, 200, r) : json(res, 404, {error:'not found in the work\'s source'}); }
   if(req.method==='GET' && p==='/api/notes'){ if(!w) return json(res, 404, {error:'no such work'}); return json(res, 200, notes(w.id)); }
   if(req.method==='GET' && p==='/api/events'){
    res.writeHead(200, {'content-type':'text/event-stream', 'cache-control':'no-store', connection:'keep-alive'});
    return events(req, res, auth, outside, eventsHeartbeatMs);
   }
   if(req.method==='POST'){
    if(!sameOrigin(req)) return json(res, 403, {error:'refused: a change has to come from the studio page'});
    let b; try { b=await body(req,p==='/api/assets'?25*1024*1024:65536); } catch(e) { return json(res,400,{error:'invalid JSON body'}); }
    // A session can be revoked or expire while the request body is still arriving.
    if(outside && !auth.userOf(req)) return auth.refuse(req,res,p);
    if(!b||typeof b!=='object'||Array.isArray(b)) return json(res,400,{error:'expected a JSON object'});
    const bw = b.work ? findWork(b.work) : null;
    if(!bw) return json(res, 404, {error:'no such work'});
    if(p==='/api/assets'){
     try{if(!bw.project)throw new Error('This work has no media editor');return json(res,200,importAsset(ROOT,bw,b));}catch(e){return json(res,400,{error:e.message});}
    }
    if(p==='/api/proposal'){
     try{return json(res,200,projects.preview(bw,b));}catch(e){return json(res,e.status||400,{error:e.message});}
    }
    if(p==='/api/operations'||p==='/api/history'){
     try {
      if(p==='/api/operations' && b.action && b.action!=='apply') throw new ProjectError('use the history endpoint for undo or redo');
      if(p==='/api/history' && !['undo','redo'].includes(b.action)) throw new ProjectError('history action must be undo or redo');
      /* the history is committed to a public repository: it says an owner acted through the
         login, never which Telegram account (the ids stay in .env) */
      return json(res,200,projects.transact(bw,b,outside?'owner':'local'));
     } catch(e){ return json(res,e.status||400,{error:e.message}); }
    }
    if(p==='/api/note'){
     if(!String(b.text||'').trim()) return json(res, 400, {error:'the note is empty'});
     addNote(bw, b.frame, b.text); return json(res, 200, notes(bw.id));
    }
    if(p==='/api/note/state'){ markNote(bw.id, +b.line, !!b.done); return json(res, 200, notes(bw.id)); }
    if(p==='/api/edit'){ try{
     if(typeof b.expectedValue!=='number'||!Number.isFinite(b.expectedValue))throw new ProjectError('expectedValue must name the number currently shown in the editor');
     return json(res, 200, editNumber(bw, b));
    }catch(e){ return json(res, e.status||400, {error:String(e.message)}); } }
    if(p==='/api/build'){ send({type:'building', work:bw.id, files:[]}); const r = await build(bw);
     send({type:'updated', work:bw.id, files:[], built:r}); return json(res, 200, r); }
   }
   json(res, 404, {error:'not found: '+p});
  }catch(e){ if(res.headersSent) return res.destroy(); json(res, 500, {error:String(e.message||e)}); }
 });
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const PORT = +process.env.STUDIO_PORT || 4321;
 /* the bot's token and the owners come from the repository's .env (never committed);
    the environment, when it sets them, wins */
 const env = {...readEnv(join(ROOT, '.env')), ...process.env};
 const auth = createAuth({botToken: env.TELEGRAM_BOT_TOKEN, owners: env.TELEGRAM_OWNER_IDS,
  publicUrl: env.STUDIO_PUBLIC_URL || 'https://code-video.abclegacyllc.com',
  stateDir: join(ROOT, 'build', 'run')});
 auth.startBot();
 if(!auth.enabled) console.log('studio: no TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_IDS -- outside requests are refused');
 const s = server({auth}); watchWorks();
 s.listen(PORT, '127.0.0.1', ()=>console.log(`studio: http://127.0.0.1:${PORT}/`));
}
