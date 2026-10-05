/* ===== WHO MAY OPEN THE STUDIO FROM OUTSIDE =====
   On this machine (127.0.0.1) the studio is open: the person at the terminal and the
   AI already have the repository. From outside -- through Caddy, on a public name --
   it asks for a login, and the login is a Telegram bot:

     1. the owner sends /login to the bot, in a private chat;
     2. the bot answers with a link that works ONCE and for FIVE MINUTES;
     3. the link sets a session cookie for thirty days. /logout to the bot ends every
        session of that person, wherever it is.

   Only the Telegram ids in TELEGRAM_OWNER_IDS get a link; the id comes from Telegram's
   own update, which only the bot's token can read, so it cannot be claimed.

   Three things a careless version gets wrong, and this one does not:
   - Telegram (and many mail and chat scanners) OPEN a link to draw a preview. A link
     that logged in on GET would be spent by the preview before the owner tapped it.
     So GET only shows a page; the session is made by the POST that page sends.
   - Nothing is stored that could be used if read: links and sessions are kept as
     SHA-256 hashes, so build/run/sessions.json is no key to the studio.
   - With no bot token configured, an outside request is refused, not let through. */
import {randomBytes, createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync, existsSync, renameSync} from 'node:fs';
import {join} from 'node:path';

const LINK_MS = 5*60*1000, SESSION_MS = 30*24*3600*1000, STALE_S = 120;
const COOKIE = 'cv_studio';
const sha = s => createHash('sha256').update(s).digest('hex');
const token = () => randomBytes(32).toString('base64url');

/* KEY=VALUE lines; quotes stripped; nothing else is interpreted */
export function readEnv(file){
 const o = {}; if(!existsSync(file)) return o;
 for(const line of readFileSync(file,'utf8').split(/\r?\n/)){
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if(!m) continue;
  o[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
 }
 return o;
}

/* ===== DID THIS REQUEST COME FROM THE STUDIO'S OWN PAGE? =====
   Sec-Fetch-Site first: every current browser sets it on every request, and no page
   script can set it. The Origin header is not enough alone, and it was the first
   version's mistake: under `Referrer-Policy: no-referrer` (which Caddy sends) a
   browser serialises the Origin of a form POST -- and of a same-origin fetch POST --
   as "null", so the owner's own login was refused as foreign. Origin stays as the
   fallback for a browser that sends no Sec-Fetch-Site. No header at all: not a
   browser page (curl, a script, the AI on this machine). */
export function fromOwnPage(req){
 const site = req.headers['sec-fetch-site'];
 if(site !== undefined) return site === 'same-origin';
 const origin = req.headers.origin;
 if(origin === undefined) return true;
 try{ return new URL(origin).host === req.headers.host; }catch(e){ return false; }
}

/* A request is from outside when it came through the proxy (Caddy always adds
   X-Forwarded-For, and a client cannot remove it) or names a host other than this
   machine's loopback. */
export function isOutside(req){
 if(req.headers['x-forwarded-for'] !== undefined) return true;
 return !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(String(req.headers.host||''));
}

/* The login pages draw from the studio's own values (tokens.css, read on every page so
   the two never drift) and its one button; only their layout is their own. */
const TOKENS = new URL('./tokens.css', import.meta.url);
const tokens = () => { try{ return readFileSync(TOKENS, 'utf8'); }catch(e){ return ''; } };
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · code-video studio</title>
<link rel="icon" href="data:,">
<style>${tokens()}
 body{min-height:100vh;display:grid;place-items:center;padding:var(--s-4);font-size:var(--fs-4)}
 main{max-width:420px;width:100%;background:var(--panel);border:1px solid var(--rule);border-radius:var(--r-3);padding:var(--s-5)}
 h1{font-size:var(--fs-5);margin:0 0 var(--s-3)} p{margin:0 0 var(--s-4);color:var(--mut)} b{color:var(--ink)}
 .btn{font-size:var(--fs-3);padding:var(--s-3) var(--s-4)}
</style></head><body><main>${body}</main></body></html>`;

export function createAuth({botToken='', owners='', publicUrl='', stateDir, api='https://api.telegram.org',
                            now=()=>Date.now(), log=(...a)=>console.log(...a)}={}){
 const OWNERS = new Set(String(owners).split(/[\s,;]+/).filter(x=>/^\d+$/.test(x)));
 const enabled = !!botToken && OWNERS.size>0;
 const base = String(publicUrl||'').replace(/\/+$/,'');
 const links = new Map();                       // sha(link) -> {user, exp, used}
 let sessions = {};                             // sha(cookie) -> {user, exp}
 let botName = '';
 const file = stateDir && join(stateDir, 'sessions.json');
 const offsetFile = stateDir && join(stateDir, 'telegram-offset');

 function load(){ try{ sessions = JSON.parse(readFileSync(file,'utf8')); }catch(e){ sessions = {}; } prune(); }
 function prune(){ const t=now(); for(const k of Object.keys(sessions)) if(sessions[k].exp<=t || !OWNERS.has(sessions[k].user)) delete sessions[k]; }
 function save(){
  if(!file) return; prune(); mkdirSync(stateDir, {recursive:true});
  const tmp = file+'.tmp'; writeFileSync(tmp, JSON.stringify(sessions), {mode:0o600}); renameSync(tmp, file);
 }
 if(file) load();

 /* ---- links and sessions ---- */
 function issueLink(user){
  const t = token(); links.set(sha(t), {user:String(user), exp:now()+LINK_MS, used:false});
  for(const [k,v] of links) if(v.exp<=now()) links.delete(k);
  return `${base}/auth/${t}`;
 }
 const linkOf = t => { const l = links.get(sha(t)); return l && !l.used && l.exp>now() && OWNERS.has(l.user) ? l : null; };
 function cookieOf(req){
  const m = String(req.headers.cookie||'').split(/;\s*/).find(c=>c.startsWith(COOKIE+'='));
  return m ? m.slice(COOKIE.length+1) : null;
 }
 function userOf(req){
  const c = cookieOf(req); if(!c) return null;
  const s = sessions[sha(c)];
  return s && s.exp>now() && OWNERS.has(s.user) ? s.user : null;
 }
 function endSessionsOf(user){ let n=0; for(const k of Object.keys(sessions)) if(sessions[k].user===String(user)){ delete sessions[k]; n++; } save(); return n; }

 /* ---- pages: /login, /auth/<link>, /logout ---- */
 const html = (res, code, body, headers={}) => { res.writeHead(code, {'content-type':'text/html; charset=utf-8',
  'cache-control':'no-store', 'x-frame-options':'DENY', 'referrer-policy':'no-referrer', ...headers}); res.end(body); };
 async function route(req, res, p){
  if(req.method==='GET' && p==='/login'){
   if(!enabled){ html(res, 503, page('Login', `<h1>Login is not set up</h1><p>This server has no bot token or no owner ids in .env.</p>`)); return true; }
   const handle = botName ? `@${botName}` : 'the studio bot';
   const open = botName ? `<a class="btn primary" href="https://t.me/${botName}?start=login">Open ${handle}</a>` : '';
   html(res, 200, page('Login', `<h1>code-video studio</h1>
    <p>Send <b>/login</b> to <b>${handle}</b> in Telegram. It answers with a link that opens the studio here; the link works once, for five minutes.</p>
    ${open}`));
   return true;
  }
  const m = p.match(/^\/auth\/([A-Za-z0-9_-]{20,})$/);
  if(m && req.method==='GET'){
   /* GET never spends the link: a preview bot may be the one asking */
   if(!linkOf(m[1])){ html(res, 410, page('Link used', `<h1>This link is used or expired</h1><p>Send <b>/login</b> to the bot again for a new one.</p><a class="btn" href="/login">Back</a>`)); return true; }
   html(res, 200, page('Log in', `<h1>Open the studio</h1><p>One tap to finish logging in on this device.</p>
    <form method="post"><button class="btn primary" type="submit">Open the studio</button></form>
    <script>document.forms[0].submit()</script>`));
   return true;
  }
  if(m && req.method==='POST'){
   if(!fromOwnPage(req)){ html(res, 403, page('Refused', '<h1>Refused</h1><p>This request did not come from the login page.</p>')); return true; }
   const l = linkOf(m[1]);
   if(!l){ html(res, 410, page('Link used', `<h1>This link is used or expired</h1><p>Send <b>/login</b> to the bot again.</p>`)); return true; }
   l.used = true;
   const c = token(); sessions[sha(c)] = {user:l.user, exp:now()+SESSION_MS}; save();
   const secure = String(req.headers['x-forwarded-proto']||'') === 'https' ? '; Secure' : '';
   log(`studio: login by telegram user ${l.user}`);
   res.writeHead(303, {location:'/', 'cache-control':'no-store',
    'set-cookie':`${COOKIE}=${c}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS/1000}${secure}`});
   res.end(); return true;
  }
  if(p==='/logout' && req.method==='POST'){
   if(!fromOwnPage(req)){ html(res, 403, page('Refused', '<h1>Refused</h1>')); return true; }
   const c = cookieOf(req); if(c){ delete sessions[sha(c)]; save(); }
   res.writeHead(303, {location:'/login', 'cache-control':'no-store', 'set-cookie':`${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`});
   res.end(); return true;
  }
  return false;
 }
 function refuse(req, res, p){
  if(p.startsWith('/api/')){ res.writeHead(enabled?401:503, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
   return res.end(JSON.stringify({error: enabled ? 'log in first: /login' : 'login is not set up on this server'})); }
  res.writeHead(302, {location:'/login', 'cache-control':'no-store'}); res.end();
 }

 /* ---- the bot: long polling, no webhook, no library ---- */
 let running = false, polling = null, offset = 0;
 try{ offset = +readFileSync(offsetFile,'utf8') || 0; }catch(e){}
 /* the token is in the URL, so the URL is never logged */
 async function call(method, body={}, ms=15000){
  const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), ms);
  if(method==='getUpdates') polling = ctrl;               // the one stopBot() has to cut
  try{
   const r = await fetch(`${api}/bot${botToken}/${method}`, {method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify(body), signal:ctrl.signal});
   const j = await r.json(); if(!j.ok) throw new Error(`${method}: ${j.description||r.status}`); return j.result;
  } finally { clearTimeout(t); }
 }
 const reply = (chat, text, extra={}) => call('sendMessage', {chat_id:chat, text, link_preview_options:{is_disabled:true}, ...extra});
 async function onUpdate(u){
  const m = u.message; if(!m || typeof m.text!=='string' || !m.from) return;
  if(now()/1000 - m.date > STALE_S) return;                 // sent while the studio was down: not acted on
  const [head, arg=''] = m.text.trim().split(/\s+/);
  const cmd = head.split('@')[0].toLowerCase();
  const id = String(m.from.id), owner = OWNERS.has(id);
  if(m.chat.type !== 'private'){ if(cmd==='/login') await reply(m.chat.id, 'Ask me in a private chat.'); return; }
  if(cmd==='/login' || (cmd==='/start' && arg==='login')){
   if(!owner){ log(`studio: login refused for telegram user ${id}`);
    return reply(m.chat.id, `This bot opens a private studio. Your Telegram id ${id} is not on its list.`); }
   const link = issueLink(id);
   try{ await reply(m.chat.id, 'Open the studio. The link works once, for 5 minutes.',
    {reply_markup:{inline_keyboard:[[{text:'Open the studio', url:link}]]}}); }
   catch(e){ await reply(m.chat.id, `Open the studio (once, for 5 minutes): ${link}`); }
   return;
  }
  if(cmd==='/logout'){
   if(!owner) return;
   const n = endSessionsOf(id); log(`studio: telegram user ${id} ended ${n} session(s)`);
   return reply(m.chat.id, `Logged out: ${n} session(s) ended.`);
  }
  if(cmd==='/start') return reply(m.chat.id, owner ? 'Send /login for a link to the studio, /logout to end every session.'
                                                   : `This bot opens a private studio. Your Telegram id is ${id}.`);
 }
 async function startBot(){
  if(!enabled || running) return;
  running = true;
  try{ botName = (await call('getMe')).username || '';
   await call('setMyCommands', {commands:[{command:'login', description:'a link to the studio'},{command:'logout', description:'end every session'}]});
   log(`studio: login bot @${botName}, ${OWNERS.size} owner(s)`); }
  catch(e){ log('studio: the bot did not answer: '+e.message); }
  (async()=>{
   while(running){
    try{
     const ups = await call('getUpdates', {offset, timeout:25, allowed_updates:['message']}, 35000);
     for(const u of ups){ offset = u.update_id+1; try{ await onUpdate(u); }catch(e){ log('studio: bot update failed: '+e.message); } }
     if(ups.length && offsetFile){ mkdirSync(stateDir, {recursive:true}); writeFileSync(offsetFile, String(offset)); }
    }catch(e){
     if(!running) break;
     /* a long poll that outlived its own timeout is a network pause, not an error:
        ask again at once, quietly. Anything else is logged and retried after 5 s. */
     if(e.name==='AbortError' || e.name==='TimeoutError') continue;
     log('studio: bot polling: '+e.message); await new Promise(r=>setTimeout(r,5000));
    }
   }
  })();
 }
 function stopBot(){ running = false; polling?.abort(); }

 return {enabled, isOutside, route, refuse, userOf, startBot, stopBot, issueLink,
  get botName(){ return botName; }, get sessionCount(){ prune(); return Object.keys(sessions).length; }};
}
