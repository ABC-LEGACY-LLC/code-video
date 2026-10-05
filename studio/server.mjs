/* ===== STUDIO =====
   Where a person and an AI work on the same piece. The AI changes the code; the person
   watches and listens to the work live, scrubs to any frame, reads its card and its
   checks, and leaves a note on a frame. The note is written to a file inside the
   repository, so the AI can read it -- a person's eyes and ears are what the AI does
   not have, and the studio joins the two into one piece of work.

   Taken from Open Edit: one folder per piece; one contract between the page and the
   renderer (a frame hook, readiness); after a change only what changed is rebuilt;
   and the idea of its deleted `preview` command -- "read-only: watch and scrub, and
   swap in the new render when it lands". Not taken: editing a timeline in the
   browser, recipes, the hand-off to VEED. A work is code; code changes it.

   No library: Node alone. It listens on 127.0.0.1 only, because it can run build
   commands -- but only the ones written in the cards. From outside (through Caddy,
   on a public name) it asks for a login through a Telegram bot: see auth.mjs. */
import http from 'node:http';
import {readFileSync, existsSync, readdirSync, mkdirSync, appendFileSync, writeFileSync, statSync, watch} from 'node:fs';
import {join, sep, extname, dirname, resolve, relative} from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createAuth, readEnv, fromOwnPage} from './auth.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO = join(ROOT, 'studio');

const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
 '.css':'text/css; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
 '.frag':'text/plain; charset=utf-8', '.glsl':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8'};

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
    o.card = c; o.cardFile = w.card; o.name = c.name;
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
const IDENT = /^[A-Za-z_$][\w$]*$/;
const reEsc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function editNumber(w, {file, row, key, value, as}){
 const s = sourceFile(w, file); if(!s) throw new Error('no such source file in this work');
 if(!row || !IDENT.test(row.key||'') || !IDENT.test(key||'')) throw new Error('the edit does not name a row and a key');
 const v = typeof value==='number' ? value : NaN;
 if(!Number.isFinite(v)) throw new Error('the value is not a number');
 const text = readFileSync(s.f, 'utf8');
 const hits = [...text.matchAll(new RegExp(`\\b${row.key}\\s*:\\s*(['"])${reEsc(row.is)}\\1`, 'g'))];
 if(hits.length!==1) throw new Error(`the row ${row.key}: ${JSON.stringify(row.is)} is in the file ${hits.length} times, not once`);
 let a = hits[0].index, b = a, d = 0;
 for(; a>=0; a--){ const c = text[a]; if(c==='}') d++; else if(c==='{'){ if(d===0) break; d--; } }
 for(d=0; b<text.length; b++){ const c = text[b]; if(c==='{') d++; else if(c==='}'){ if(d===0) break; d--; } }
 if(a<0 || b>=text.length) throw new Error('the row is not inside { }');
 const obj = text.slice(a, b+1);
 const m = obj.match(new RegExp(`(^|[{,\\s])(${key}\\s*:\\s*)(-?\\d+(?:\\.\\d+)?)`));
 if(!m) throw new Error(`the row has no number at ${key}`);
 /* written the way the row writes its numbers: 3.00 stays two decimals when it can */
 const dec = (m[3].split('.')[1]||'').length, short = String(+v.toFixed(4));
 /* an undo gives the number back as it was written (`as`), digit for digit */
 const verbatim = typeof as==='string' && /^-?\d+(\.\d+)?$/.test(as) && +as===v;
 const at = a + m.index + m[1].length + m[2].length,
  to = verbatim ? as : (short.split('.')[1]||'').length<dec ? v.toFixed(dec) : short;
 writeFileSync(s.f, text.slice(0, at) + to + text.slice(at + m[3].length));
 return {file:s.rel, line:text.slice(0, at).split('\n').length, from:+m[3], fromText:m[3], to:+to};
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
function send(ev){ const s = `data: ${JSON.stringify({...ev, time:Date.now()})}\n\n`; for(const r of listeners) r.write(s); }
const pending = new Map();
function changed(key, file, job){
 const k = pending.get(key) || {files:new Set()}; k.files.add(file);
 clearTimeout(k.t); k.t = setTimeout(async()=>{ pending.delete(key); await job([...k.files]); }, 250);
 pending.set(key, k);
}
const ignored = rel => !rel || rel.split(/[\\/]/).some(p=>p.startsWith('.') || p==='node_modules' || p==='build');
export function watchWorks(){
 const watchers = [];
 const add = (dir, fn) => { if(!existsSync(dir)) mkdirSync(dir, {recursive:true});
  watchers.push(watch(dir, {recursive:true}, (e, rel)=>fn(String(rel||'')))); };
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
 return ()=>watchers.forEach(w=>w.close());
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
const body = req => new Promise((res, rej)=>{ let s=''; req.on('data', c=>{ s+=c; if(s.length>65536){ rej(new Error('too large')); req.destroy(); } });
 req.on('end', ()=>{ try{ res(s ? JSON.parse(s) : {}); }catch(e){ rej(e); } }); });

/* `auth` decides who may come in from outside. Without one, every outside request is
   refused: a studio started without its login is a local studio, never an open one. */
export function server({auth=createAuth({})}={}){
 return http.createServer(async (req, res)=>{
  const url = new URL(req.url, 'http://studio');
  const p = url.pathname;
  try{
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
   if(req.method==='GET' && p.startsWith('/w/')){
    const f = safePath(p.slice(3));
    if(!f || !existsSync(f)){ res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {'content-type':TYPES[extname(f)], 'cache-control':'no-store'});
    return res.end(readFileSync(f));
   }
   if(req.method==='GET' && p==='/api/works')
    return json(res, 200, works().map(w=>({...w, build:!!w.build, sourcesChangedAt:sourcesChangedAt(w.dir),
     openNotes:notes(w.id).filter(n=>!n.done).length})));
   if(req.method==='GET' && p==='/api/audits') return json(res, 200, audits());
   if(req.method==='GET' && p==='/api/decisions') return json(res, 200, decisions());
   const w = url.searchParams.get('work') ? findWork(url.searchParams.get('work')) : null;
   if(req.method==='GET' && p==='/api/changes'){ if(!w) return json(res, 404, {error:'no such work'}); return json(res, 200, await changes(w)); }
   if(req.method==='GET' && p==='/api/where'){ if(!w) return json(res, 404, {error:'no such work'});
    const r = where(w, url.searchParams.get('file'), url.searchParams.get('find'));
    return r ? json(res, 200, r) : json(res, 404, {error:'not found in the work\'s source'}); }
   if(req.method==='GET' && p==='/api/notes'){ if(!w) return json(res, 404, {error:'no such work'}); return json(res, 200, notes(w.id)); }
   if(req.method==='GET' && p==='/api/events'){
    res.writeHead(200, {'content-type':'text/event-stream', 'cache-control':'no-store', connection:'keep-alive'});
    res.write(': studio\n\n'); listeners.add(res);
    const t = setInterval(()=>res.write(': alive\n\n'), 25000);
    return req.on('close', ()=>{ clearInterval(t); listeners.delete(res); });
   }
   if(req.method==='POST'){
    if(!sameOrigin(req)) return json(res, 403, {error:'refused: a change has to come from the studio page'});
    const b = await body(req);
    const bw = b.work ? findWork(b.work) : null;
    if(!bw) return json(res, 404, {error:'no such work'});
    if(p==='/api/note'){
     if(!String(b.text||'').trim()) return json(res, 400, {error:'the note is empty'});
     addNote(bw, b.frame, b.text); return json(res, 200, notes(bw.id));
    }
    if(p==='/api/note/state'){ markNote(bw.id, +b.line, !!b.done); return json(res, 200, notes(bw.id)); }
    if(p==='/api/edit'){ try{ return json(res, 200, editNumber(bw, b)); }catch(e){ return json(res, 400, {error:String(e.message)}); } }
    if(p==='/api/build'){ send({type:'building', work:bw.id, files:[]}); const r = await build(bw);
     send({type:'updated', work:bw.id, files:[], built:r}); return json(res, 200, r); }
   }
   json(res, 404, {error:'not found: '+p});
  }catch(e){ json(res, 500, {error:String(e.message||e)}); }
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
