import json,re,os
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
def mod(p):
    t=open(os.path.join(ROOT,'src',p),encoding='utf-8').read()
    # an import names a module the page already holds inline (shots.mjs asks sheet.mjs for FPS)
    t=re.sub(r'^import .*\n','',t,flags=re.M)
    return re.sub(r'^export (const|function) ',r'\1 ',t,flags=re.M)
G=open(os.path.join(ROOT,'build','film.frag'),encoding='utf-8').read()
C=open(os.path.join(ROOT,'src','comp.frag'),encoding='utf-8').read()
SDECL=open(os.path.join(ROOT,'build','style.glsl'),encoding='utf-8').read()
SJS=open(os.path.join(ROOT,'build','style.js'),encoding='utf-8').read()
G=G.replace('__STYLEDECL__',SDECL); C=C.replace('__STYLEDECL__',SDECL)
R=json.load(open(os.path.join(ROOT,'build','film.ramp.json')))
P=json.load(open(os.path.join(ROOT,'src','poses.json')))
flat=[v for c in R for v in c]
HEAD=r'''<title>Oq Ko'cha</title>
<script>if(/[?&]embed\b/.test(location.search))document.documentElement.classList.add('embed')</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" media="print" onload="this.media='all'">
<style>
 /* The font stylesheet is loaded with media="print" and switched on when it arrives:
    as a plain stylesheet it blocked this page's script, so a font host that never
    answered left the film blank and the studio waiting for ever. Until the fonts
    come, the page draws in the fallback face. */
 :root{--pa:#ecedf0;--ink:#15171d;--mut:#646c7c;--rule:#c9ccd4;--stage:#0b0c10;--acc:#b0432a;
  --disp:"Archivo",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
 @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --pa:#0b0c10;--ink:#e6e8ee;--mut:#8790a0;--rule:#282c36;--acc:#d9613f}}
 :root[data-theme="dark"]{--pa:#0b0c10;--ink:#e6e8ee;--mut:#8790a0;--rule:#282c36;--acc:#d9613f}
 *{box-sizing:border-box}
 body{background:var(--pa);color:var(--ink);font:400 14px/1.6 var(--mono);margin:0}
 .wrap{max-width:700px;margin:0 auto;padding-block:24px 44px;padding-left:16px;padding-right:16px}
 h1{font:700 19px/1.15 var(--disp);letter-spacing:.015em;margin:0 0 4px}
 .sub{color:var(--mut);font-size:12.5px;margin:0 0 18px;max-width:54ch}
 .stage{position:relative;background:var(--stage);border:1px solid var(--rule);overflow:hidden}
 canvas{display:block;width:100%;height:auto;max-width:100%}
 .hud{position:absolute;left:0;top:0;font-size:10px;letter-spacing:.10em;text-transform:uppercase;
  color:#e9ecf2;background:rgba(10,12,16,.55);padding:3px 8px}
 .tl{display:flex;gap:2px;margin-top:8px;height:5px}
 .tl i{flex:1 1 auto;background:var(--rule);transition:background .12s}
 .tl i.on{background:var(--acc)}
 .bar{display:flex;flex-wrap:wrap;gap:7px;align-items:baseline;margin-top:10px}
 .bar span{color:var(--mut);font-size:11px;letter-spacing:.09em;text-transform:uppercase}
 button{font:500 11.5px/1 var(--mono);letter-spacing:.06em;background:transparent;color:var(--ink);
  cursor:pointer;border:1px solid var(--rule);padding:7px 11px}
 button:hover{border-color:var(--ink)}
 button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
 button[aria-pressed="true"]{background:var(--ink);color:var(--pa);border-color:var(--ink)}
 dl{display:grid;grid-template-columns:max-content 1fr;gap:5px 18px;margin:20px 0 0;
  padding-top:14px;border-top:1px solid var(--rule);font-size:12.5px}
 dt{color:var(--mut);letter-spacing:.05em} dd{margin:0;font-variant-numeric:tabular-nums}
 .note{color:var(--mut);font-size:12.5px;margin:16px 0 0;max-width:58ch}
 .note em{color:var(--ink);font-style:normal;border-bottom:1px solid var(--acc)}
 code{font:inherit;color:var(--mut)}
 /* EMBED (?embed): inside the studio the page shows the picture and the work's own
    options -- sound, quality, style. The title, the notes, this page's own transport,
    clock and shot bar are the studio's job there, and two of each read as one. */
 html.embed body{height:100vh;overflow:hidden}
 html.embed .wrap{max-width:none;height:100vh;padding:8px 12px;display:flex;flex-direction:column;justify-content:center;gap:8px}
 html.embed h1,html.embed .sub,html.embed .tl,html.embed dl,html.embed .note,html.embed .hud,
 html.embed #play,html.embed #rew,html.embed #q{display:none}
 html.embed .stage{border:0;background:transparent;display:flex;justify-content:center}
 html.embed canvas{width:min(100%,calc((100vh - 72px)/0.72));height:auto}
 html.embed .bar{margin-top:0;justify-content:center}
</style>
<div class="wrap">
 <h1>Oq ko'cha</h1>
 <p class="sub"><span id="length"></span>, 24 fps, personajlar 12 da. Nol bayt asset —
  na rasm, na mesh, na video.</p>
 <div class="stage"><canvas id="c"></canvas><span class="hud" id="hud">—</span></div>
 <div class="tl" id="tl"></div>
 <div class="bar">
  <button id="play" aria-pressed="true">Pauza</button>
  <button id="rew">Boshidan</button>
  <button id="snd" aria-pressed="false">Ovoz</button>
  <span>sifat</span>
  <button id="qa" aria-pressed="true">avto</button><button id="q0">past</button><button id="q1">o'rta</button><button id="q2">to'liq</button>
  <span id="q">—</span>
  <span>uslub</span>
  <span id="styles"></span>
 </div>
 <dl>
  <dt>Kadr</dt><dd id="s1">—</dd>
  <dt>Oraliq</dt><dd id="s2">—</dd>
  <dt>Ruxsat</dt><dd id="s3">—</dd>
  <dt>Grafika</dt><dd id="s4">—</dd>
  <dt>Ovoz</dt><dd id="s5">o'chiq — sintez, 0 bayt namuna</dd>
 </dl>
 <p class="note">Ruxsat <em>o'zini boshqaradi</em>: kadr oralig'i 22 ms dan oshsa
  tushadi, 12 ms dan tushsa ko'tariladi. Shuning uchun bu sahifa telefonda ham,
  ish stolida ham 60 ga yaqin turadi — bittasi uchun sozlanmagan.</p>
 <p class="note">Ikkala figura bitta shaderda. Ikkinchisi <em>oynalangan</em>
  fazoda so'raladi — bitta ishora, ikkinchi personaj emas.</p>
</div>
<script id="fs-geo" type="x-shader/x-fragment">__G__</script>
<script id="fs-comp" type="x-shader/x-fragment">__C__</script>
<script>
window.__ready=false;   // the studio's contract: true once the film can be asked for a frame
__SOUND__
const POSES=__POSES__, RAMP=new Float32Array(__RAMP__);
__SHEET__
const NZ=-0.048,FZ=0.048;
function joints(K,out){
 const X=v=>v/100,Y=v=>-v/100;
 const toe=(a,g)=>[X(a[0]+Math.cos(g*0.6)*10.5),Y(a[1]-Math.sin(g*0.6)*10.5)];
 const nt=toe(K.na,K.nf),ft=toe(K.fa,K.ff); let i=0;
 const put=(x,y,z)=>{out[i++]=x;out[i++]=y;out[i++]=z;};
 put(0,-K.hip/100,0); put(X(K.sh[0]),Y(K.sh[1]),0);
 put(X(K.sh[0]+K.hd[0]+1.0),Y(K.sh[1]-11.0+K.hd[1]),0); put(X(K.sh[0]+0.6),Y(K.sh[1]-5.0),0);
 put(X(K.nk[0]),Y(K.nk[1]),NZ); put(X(K.na[0]),Y(K.na[1]),NZ); put(nt[0],nt[1],NZ);
 put(X(K.neb[0]),Y(K.neb[1]),NZ*1.5); put(X(K.nh[0]),Y(K.nh[1]),NZ*1.5);
 put(X(K.fk[0]),Y(K.fk[1]),FZ); put(X(K.fa[0]),Y(K.fa[1]),FZ); put(ft[0],ft[1],FZ);
 put(X(K.feb[0]),Y(K.feb[1]),FZ*1.5); put(X(K.fh[0]),Y(K.fh[1]),FZ*1.5);
 put(X(K.cl[1][0]),Y(K.cl[1][1]),0); put(X(K.cl[3][0]-3),Y(K.cl[3][1]+10),0);
 return out;
}
/* THE SHOT LIST. Every camera lives here and nowhere else, so the cut audit can
   read the authored subject scale instead of guessing it from pixels. */
__SHOTS__
const S=STARTS;
/* the length is read from the shot list, never typed: the typed one said 14.6 s for a
   14.583 s film, and 15.6 in the card before that */
document.getElementById('length').textContent=TOTAL_F+' kadr ('+TOTAL.toFixed(2).replace('.',',')+' soniya), '+SHOTS.length+' sahna';
const DT=1/FPS;

const c=document.getElementById('c'),hud=document.getElementById('hud');
const s1=document.getElementById('s1'),s2=document.getElementById('s2'),s3=document.getElementById('s3'),
      qEl=document.getElementById('q'),tl=document.getElementById('tl');
SHOTS.forEach(()=>{const i=document.createElement('i');tl.appendChild(i);});
const gl=c.getContext('webgl2',{antialias:false,powerPreference:'high-performance'});
const fail=m=>{window.__failed=m;document.querySelector('.stage').innerHTML=
 '<p style="padding:24px;font:400 13px/1.6 var(--mono);color:#e6e8ee">'+m+'</p>';};
if(!gl) fail("Bu brauzerda WebGL2 yo'q.");
else if(!gl.getExtension('EXT_color_buffer_float')) fail("Float bufer qo'llab-quvvatlanmaydi.");
else{
const VS=`#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}`;
/* COMPILING DOES NOT HOLD THE PAGE. Asking a shader for its COMPILE_STATUS waits until
   the GPU process has compiled it, and on some machines (ANGLE on Direct3D) these two
   programs take seconds -- seconds in which this page, and the studio that shows it in
   a frame on the same main thread, cannot answer a click. So nothing is asked until the
   driver says the work is done (KHR_parallel_shader_compile); a browser without the
   extension carries on at once, exactly as before. */
const mk=(t,src)=>{const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);return o;};
const link=id=>{const p=gl.createProgram();
 const v=mk(gl.VERTEX_SHADER,VS), f=mk(gl.FRAGMENT_SHADER,document.getElementById(id).textContent.trim());
 gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
 p.check=()=>{ if(!gl.getProgramParameter(p,gl.LINK_STATUS))
  throw new Error([gl.getShaderInfoLog(v),gl.getShaderInfoLog(f),gl.getProgramInfoLog(p)].filter(Boolean).join('\n')); };
 return p;};
const gp=link('fs-geo'), cp=link('fs-comp');
const PAR=gl.getExtension('KHR_parallel_shader_compile');
const linked=()=>!PAR||(gl.getProgramParameter(gp,PAR.COMPLETION_STATUS_KHR)&&gl.getProgramParameter(cp,PAR.COMPLETION_STATUS_KHR));
hud.textContent='shaderlar tayyorlanmoqda…';
(function wait(){
 if(!linked()) return setTimeout(wait,30);
 try{ gp.check(); cp.check(); }catch(e){ fail('Shader: '+e.message); throw e; }
 begin();
})();
function begin(){
const U=(p,n)=>gl.getUniformLocation(p,n);
const G={p:gp,res:U(gp,'iRes'),t:U(gp,'iTime'),d:U(gp,'iDist'),sc:U(gp,'uScene'),
 JA:U(gp,'JA'),JB:U(gp,'JB'),pA:U(gp,'uPosA'),pB:U(gp,'uPosB'),two:U(gp,'uTwo'),
 ro:U(gp,'uRo'),ta:U(gp,'uTa'),foc:U(gp,'uFoc'),far:U(gp,'uFar'),
 cell:U(gp,'uCell'),nbr:U(gp,'uNbr'),probe:U(gp,'uProbe'),rimg:U(gp,'uRimGate'),wdir:U(gp,'uWalkDir'),bound:U(gp,'uBound')};
const K={p:cp,res:U(cp,'iRes'),t:U(cp,'iTime'),sc:U(cp,'uScene'),ramp:U(cp,'RAMP'),
 gA:U(cp,'gA'),gB:U(cp,'gB'),lines:U(cp,'uLines'),dbg:U(cp,'uDebug'),
 ro:U(cp,'uRo'),ta:U(cp,'uTa'),foc:U(cp,'uFoc'),fog:U(cp,'uFog'),snow:U(cp,'uSnow'),rimo:U(cp,'uRimOld'),wmax:U(cp,'uWorkMax'),lfar:U(cp,'uLineFar')};
let fbo=null,texA,texB,fw=0,fh=0;
function fb(w,h){
 if(fw===w&&fh===h)return;
 if(fbo){gl.deleteFramebuffer(fbo);gl.deleteTexture(texA);gl.deleteTexture(texB);}
 fw=w;fh=h;
 const tex=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);
  for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);
  for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
  return t;};
 texA=tex();texB=tex();
 fbo=gl.createFramebuffer();
 gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
 gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texA,0);
 gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,texB,0);
 gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
/* R6. The page does not know what it is running on, so it finds out. It starts LOW
   and climbs, because the opposite order means the first thing a slow machine does
   is render a frame it cannot afford -- and at half a second a frame it then takes
   ten seconds to notice. Down is multiplicative and immediate; up is a slow creep
   that needs a run of cheap frames to earn. */
let SCALE=0.34, AUTO=true, settle=0, warm=0;
function size(){
 const w=c.clientWidth||560;
 const dpr=Math.min(window.devicePixelRatio||1,1.75)*SCALE;
 c.width=Math.max(180,Math.round(w*dpr)); c.height=Math.round(c.width*0.72);
}
function adapt(ms){
 if(!AUTO) return;
 if(warm<18){warm++; return;}          // the first frames pay for shader compilation
 let s=SCALE;
 if(ms>30) s=SCALE*0.78;
 else if(ms>21) s=SCALE*0.92;
 else if(ms<13){ settle++; if(settle>26){ s=SCALE+0.05; settle=0; } }
 else settle=0;
 s=Math.max(0.20,Math.min(1.0,s));
 if(Math.abs(s-SCALE)>0.012){ SCALE=s; size(); }
}
const JA=new Float32Array(48), JB=new Float32Array(48);
let T=0,phA=0,phB=0.37,dist=0,frameNo=0,playing=true,last=performance.now(),ft=16,DBG=0;
/* AUDIO. Off until asked, because a page that makes noise on its own is rude and
   because the browser will not allow it anyway. When it IS on, the film's clock is
   taken FROM the audio context -- otherwise the picture drifts off the footsteps
   over fourteen seconds and the one thing worth getting right is lost. */
let AC=null,BUS=null,BEDS=null,V=null,NOISE=null,CRUNCH=null,audioOn=false,loopBase=0,lastShot=-1;
function startAudio(){
 if(AC) return;
 AC=new (window.AudioContext||window.webkitAudioContext)();
 NOISE=noiseBuffer(AC,3);
 CRUNCH=[0,1,2,3,4,5,6,7].map(i=>crunchBuffer(AC,i+1,0.14+i*0.012,i/7));
 BUS=buildBus(AC); BEDS=buildBeds(AC,BUS.master,NOISE); V=makeVoices(AC,BUS.master,NOISE,CRUNCH);
 loopBase=AC.currentTime+0.12; scheduleLoop(loopBase); lastShot=-1;
 audioOn=true;
 document.getElementById('s5').textContent="yoqilgan — sintez, 0 bayt namuna";
}
function scheduleLoop(base){
 for(const e of TIMELINE){
  const t=base+e.t;
  if(e.type==='step') V.step(t,e.g,e.x,e.sz);
  else if(e.type==='cloth') V.cloth(t,e.g,e.x);
  else if(e.type==='breath') V.breath(t,e.g);
  else if(e.type==='metal') V.metal(t,e.g,e.x);
 }
}
/* every knob the audit needs to break the picture on purpose, in one place */
__STYLEJS__
const GS=styleLocs(gl,gp), KS=styleLocs(gl,cp);
const OPT={lines:1,nbr:1,cell:0,cam:null,bound:1,fog:1,snow:1,lfar:1,rimg:1,wmax:4096,wdir:1,style:'oq-qalam'};
/* THE FRAME DECIDES THE SHOT, not a sum of 1/24s. T is built by adding DT, and 72 of
   them come to 2.999999999999998: compared with a cut at 3 s, frame 72 stayed in the
   first shot. A frame number is an integer; a cut is one too. */
function shotAt(t){const f=Math.round(t*FPS);let i=0;for(let j=0;j<SHOTS.length;j++)if(f>=STARTS_F[j])i=j;return i;}

/* ===== THE SOUND TIMELINE =====
   Built once, by simulating the film exactly as it plays. A footfall is emitted on
   the frame the drawing changes TO a contact -- the same event the snow spray comes
   from -- so the sound cannot drift from the picture: they are the same decision. */
function buildTimeline(){
 const ev=[]; let t=0,a=0,b=0.37,ia=-1,ib=-1,breath=0.9;
 const n=TOTAL_F;
 for(let f=0;f<n;f++){
  const i=shotAt(t), sh=SHOTS[i], m=1-(sh.snd.mute||0);
  /* the phase is advanced BEFORE the index is read, so the drawing that has just
     come up belongs to the NEXT frame -- emitting at t puts the sound one frame,
     forty-two milliseconds, ahead of the foot that made it. */
  const te=t+DT;
  if(sh.aw){ a+=DT/CYCLE; const k=idxAt(a);
   if(k!==ia){ if(k===0||k===4) ev.push({t:te,type:'step',who:'a',g:0.52*m,x:-0.12,sz:1.0}); ia=k; } }
  if(sh.bw){ b+=DT/CYCLE; const k=idxAt(b);
   if(k!==ib){ if(k===0||k===4) ev.push({t:te,type:'step',who:'b',g:0.40*m,x:0.30,sz:0.86}); ib=k; }
   if(f%17===0) ev.push({t:te,type:'metal',g:0.045*m,x:0.32}); }
  breath-=DT;
  if(breath<=0){ breath=1.9+((f*0.37)%0.8);
   ev.push({t,type:'breath',g:(0.085+0.10*(sh.snd.mute||0))*m}); }
  if(f%29===0 && (sh.aw||sh.bw)) ev.push({t,type:'cloth',g:0.075*m,x:-0.08});
  t+=DT;
 }
 return ev;
}
const TIMELINE=buildTimeline();
function render(){
 const i=shotAt(T), sh=SHOTS[i], lt=T-S[i], u=Math.min(lt/sh.d,1);
 fb(c.width,c.height);
 const poseA = sh.aw? WALK[idxAt(phA)] : POSES.STAND;
 const poseB = sh.bw? WALK[idxAt(phB)] : POSES.STAND;
 joints(poseA,JA); joints(poseB,JB);
 /* in the passing shot they close the gap; everywhere else they hold station */
 const bx = sh.pass ? sh.B[0]-u*0.95 : (sh.B? sh.B[0] : 0);
 const ax = sh.pass ? u*0.55 : 0;
 gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
 gl.viewport(0,0,c.width,c.height);
 gl.useProgram(G.p);
 /* THE STYLE IS SET ON BOTH PROGRAMS EVERY FRAME. It is forty numbers; the picture
    is two million pixels. */
 styleApply(gl,GS,STYLES[OPT.style]);
 gl.uniform2f(G.res,c.width,c.height);
 gl.uniform1f(G.t,T); gl.uniform1f(G.d,dist); gl.uniform1f(G.sc,sh.sc);
 gl.uniform1f(G.two,sh.two); gl.uniform1f(G.cell,OPT.cell); gl.uniform1f(G.nbr,OPT.nbr);
 gl.uniform1f(G.probe,DBG===4?1:DBG===5?2:0); gl.uniform1f(G.bound,OPT.bound); gl.uniform1f(G.rimg,OPT.rimg); gl.uniform1f(G.wdir,OPT.wdir);
 gl.uniform3f(G.pA,(sh.A?sh.A[0]:0)+ax,0,sh.A?sh.A[2]:0);
 gl.uniform3f(G.pB,bx,0,sh.B?sh.B[2]:0);
 gl.uniform3fv(G.JA,JA); gl.uniform3fv(G.JB,JB);
 const ro=OPT.cam?OPT.cam.ro:sh.ro, ta=OPT.cam?OPT.cam.ta:sh.ta;
 gl.uniform3f(G.ro,ro[0],ro[1],ro[2]); gl.uniform3f(G.ta,ta[0],ta[1],ta[2]);
 gl.uniform1f(G.foc,OPT.cam?OPT.cam.foc:sh.foc); gl.uniform1f(G.far,sh.far);
 gl.drawArrays(gl.TRIANGLES,0,3);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 gl.viewport(0,0,c.width,c.height);
 gl.useProgram(K.p);
 styleApply(gl,KS,STYLES[OPT.style]);
 gl.uniform2f(K.res,c.width,c.height); gl.uniform1f(K.t,T); gl.uniform1f(K.sc,sh.sc);
 gl.uniform1f(K.lines,OPT.lines); gl.uniform1f(K.dbg,DBG); gl.uniform1f(K.fog,OPT.fog); gl.uniform1f(K.snow,OPT.snow); gl.uniform1f(K.lfar,OPT.lfar); gl.uniform1f(K.rimo,OPT.rimg); gl.uniform1f(K.wmax,OPT.wmax);
 gl.uniform3fv(K.ramp,RAMP);
 gl.uniform3f(K.ro,ro[0],ro[1],ro[2]); gl.uniform3f(K.ta,ta[0],ta[1],ta[2]);
 gl.uniform1f(K.foc,OPT.cam?OPT.cam.foc:sh.foc);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texA);gl.uniform1i(K.gA,0);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texB);gl.uniform1i(K.gB,1);
 gl.drawArrays(gl.TRIANGLES,0,3);
 return i;
}
function step(dt){
 const i=shotAt(T), sh=SHOTS[i];
 T+=dt; frameNo++;
 if(sh.aw){const p0=phA; phA+=dt/CYCLE; dist+=travel(phA)-travel(p0);}
 if(sh.bw) phB+=dt/CYCLE;
 if(Math.round(T*FPS)>=TOTAL_F){T=0;phA=0;phB=0.37;dist=0;frameNo=0;}   // the loop is counted in frames too
}
let acc=0;
function frame(now){
 const raw=Math.min(0.1,Math.max(0,(now-last)/1000)); last=now;
 ft=ft*0.88+raw*1000*0.12;
 if(playing){
  if(audioOn&&AC){
   /* the picture follows the sound, not the other way round */
   let at=AC.currentTime-loopBase;
   if(at>=TOTAL){ loopBase+=TOTAL; scheduleLoop(loopBase); at-=TOTAL; }
   if(at<0) at=0;
   const want=Math.floor(at*FPS);
   let guard=0;
   while(frameNo<want && guard++<240) step(DT);
   if(frameNo>want+2){ T=0;phA=0;phB=0.37;dist=0;frameNo=0; }
  } else { acc+=raw; while(acc>=DT){step(DT);acc-=DT;} }
 }
 const i=render();
 adapt(ft);
 const sh=SHOTS[i];
 if(audioOn&&AC&&i!==lastShot){ BEDS.set(sh.snd.wind, sh.snd.city, AC.currentTime, 0.18); lastShot=i; }
 hud.textContent=(i+1)+'/'+SHOTS.length+'  '+sh.k;
 s1.textContent=(i+1)+' — '+sh.k+'  ·  '+sh.d.toFixed(1)+' s  ·  o‘lcham '+sh.sz.toFixed(1)+'x';
 s2.textContent=ft.toFixed(1)+' ms  ·  '+(1000/Math.max(ft,0.001)).toFixed(0)+' fps';
 s3.textContent=c.width+'x'+c.height+'  ·  '+(SCALE*100).toFixed(0)+'%'+(AUTO?' (avto)':'');
 qEl.textContent=T.toFixed(1)+' / '+TOTAL.toFixed(1)+' s';
 [...tl.children].forEach((e,k)=>e.classList.toggle('on',k===i));
 requestAnimationFrame(frame);
}
/* WHAT IS ACTUALLY DRAWING THIS. A browser that has fallen back to software says so
   here, and that is a different problem from the page being too heavy. */
{const d=gl.getExtension('WEBGL_debug_renderer_info');
 const r=d? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : '(brauzer aytmaydi)';
 const soft=/swiftshader|llvmpipe|software|basic render/i.test(r);
 const el=document.getElementById('s4');
 el.textContent = r.length>62? r.slice(0,62)+'…' : r;
 if(soft){ el.textContent += '  — GPU ishlamayapti, protsessorda';
  el.style.color='var(--acc)'; SCALE=0.22; }
}
addEventListener('resize',size); size(); requestAnimationFrame(frame);
const setQ=(v)=>{AUTO=(v<0); if(!AUTO){SCALE=[0.26,0.45,0.85][v];size();}
 ['qa','q0','q1','q2'].forEach((id,k)=>document.getElementById(id)
   .setAttribute('aria-pressed', (k-1)===v || (v<0&&k===0)));};
document.getElementById('qa').onclick=()=>{setQ(-1);settle=0;};
[0,1,2].forEach(v=>{document.getElementById('q'+v).onclick=()=>setQ(v);});
const pl=document.getElementById('play');
pl.onclick=()=>{playing=!playing;pl.textContent=playing?'Pauza':'Davom';pl.setAttribute('aria-pressed',playing);};
document.getElementById('rew').onclick=()=>{T=0;phA=0;phB=0.37;dist=0;acc=0;frameNo=0;
 if(AC){loopBase=AC.currentTime+0.1;scheduleLoop(loopBase);lastShot=-1;}};
const sb=document.getElementById('snd');
sb.onclick=()=>{
 if(!AC){ startAudio(); sb.setAttribute('aria-pressed','true'); return; }
 if(AC.state==='running'){ AC.suspend(); audioOn=false; sb.setAttribute('aria-pressed','false');
  document.getElementById('s5').textContent="o'chiq — sintez, 0 bayt namuna"; }
 else { AC.resume(); audioOn=true; loopBase=AC.currentTime-T; sb.setAttribute('aria-pressed','true');
  document.getElementById('s5').textContent="yoqilgan — sintez, 0 bayt namuna"; }
};
/* THE STUDIO'S CONTRACT (studio/README.md): where the film is now, stop, go on */
window.__frame=()=>({frame:Math.round(T*FPS)%TOTAL_F, shot:SHOTS[shotAt(T)].k});
window.__pause=()=>{ playing=false; pl.textContent='Davom'; pl.setAttribute('aria-pressed','false'); };
window.__play=(f)=>{ if(Number.isInteger(f)) window.__frameTo(f);
 playing=true; acc=0; last=performance.now(); pl.textContent='Pauza'; pl.setAttribute('aria-pressed','true');
 if(audioOn&&AC) loopBase=AC.currentTime-T; };
/* deterministic access, for the audit */
window.__total=TOTAL; window.__totalFrames=TOTAL_F; window.__fps=FPS; window.__shots=SHOTS.map(s=>({k:s.k,d:s.d,df:s.df,sz:s.sz}));
window.__shotsRaw=SHOTS;   // the audit needs to perturb a camera to price it
window.__styles=()=>Object.keys(STYLES).map(k=>({name:k,title:STYLES[k].t}));
/* THE SAME FILM, THE OTHER WAY OF DRAWING IT. Nothing below the marks changes: same
   drawings on the same exposure sheet through the same cameras. */
{const box=document.getElementById('styles');
 for(const k of Object.keys(STYLES)){
  const b=document.createElement('button');
  b.textContent=STYLES[k].t; b.dataset.k=k;
  b.setAttribute('aria-pressed', k===OPT.style?'true':'false');
  b.onclick=()=>{ OPT.style=k;
   for(const o of box.children) o.setAttribute('aria-pressed', o.dataset.k===k?'true':'false');
   if(!playing) render(); };
  box.appendChild(b);
 }}
window.__timeline=()=>TIMELINE;
/* THE FILM AS TRACKS, for the studio's timeline (studio/README.md). Nothing is declared
   a second time: every track is read from the table the film itself runs on, or found by
   stepping the film the way step() does. `derived` marks what nobody placed by hand --
   a footfall sits where the drawing changes to a contact, so it has no handle to drag. */
window.__tracks=()=>{
 const runs=(at)=>{ const o=[]; let cur=null;
  for(let f=0;f<TOTAL_F;f++){ const v=at(f); if(cur&&cur.label===v) cur.n++; else { cur=v==null?null:{f,n:1,label:v}; if(cur)o.push(cur); } }
  return o; };
 /* the drawing on screen at frame f is the one after f steps: the phase runs on across
    every shot that walks, so it is stepped here, not worked out from the cut */
 const A=[],B=[]; { let a=0,b=0.37;
  for(let f=0;f<TOTAL_F;f++){ const sh=SHOTS[shotAt(f/FPS)];
   A.push(sh.aw?String(idxAt(a)+1):'stand'); B.push(!sh.two?null:sh.bw?String(idxAt(b)+1):'stand');
   if(sh.aw)a+=DT/CYCLE; if(sh.bw)b+=DT/CYCLE; } }
 const ev=(type,who)=>TIMELINE.filter(e=>e.type===type&&(!who||e.who===who)).map(e=>({f:Math.min(TOTAL_F-1,Math.round(e.t*FPS))}));
 const shots={file:'src/shots.mjs',find:'export const SHOTS'}, sheet={file:'src/sheet.mjs',find:'export const HOLDS'},
       snd={file:'tools/mkfilm.py',find:'function buildTimeline'};
 const row=s=>({file:'src/shots.mjs',row:{key:'k',is:s.k}});
 const per=(label)=>SHOTS.map((s,i)=>({f:STARTS_F[i],n:s.df,label:label(s)}));
 return [
  {id:'shots',name:'Shots',kind:'clips',src:shots,items:SHOTS.map((s,i)=>({f:STARTS_F[i],n:s.df,label:s.k,
    edit:[{name:'length',unit:'frames',...row(s),key:'df',value:s.df,min:1,max:480,step:1,per:1,drag:true}]}))},
  {id:'camera',name:'Camera',kind:'clips',src:shots,items:per(s=>'size '+s.sz+' · focal '+s.foc)},
  {id:'drawA',name:'Drawings · walker',kind:'clips',derived:true,src:sheet,
   why:'The exposure sheet (HOLDS 3·2·1·2…) read by the walk phase, which runs on across cuts.',items:runs(f=>A[f])},
  {id:'drawB',name:'Drawings · second',kind:'clips',derived:true,src:sheet,
   why:'The same sheet, 0.37 of a cycle behind.',items:runs(f=>B[f])},
  {id:'beds',name:'Sound · wind, city',kind:'clips',src:shots,items:SHOTS.map((s,i)=>({f:STARTS_F[i],n:s.df,
    label:'wind '+s.snd.wind+' · city '+s.snd.city+(s.snd.mute?' · muted '+s.snd.mute:''),
    edit:['wind','city','mute'].map(k=>({name:k,unit:'0–1',...row(s),key:k,value:s.snd[k],min:0,max:1,step:0.01}))}))},
  {id:'stepA',name:'Sound · steps, walker',kind:'events',derived:true,src:snd,
   why:'A footfall is emitted on the frame the drawing changes to a contact: the sound and the picture are one decision.',items:ev('step','a')},
  {id:'stepB',name:'Sound · steps, second',kind:'events',derived:true,src:snd,why:'As above, for the second figure.',items:ev('step','b')},
  {id:'breath',name:'Sound · breath',kind:'events',derived:true,src:snd,why:'Every 1.9–2.7 s, by a rule on the frame count.',items:ev('breath')},
  {id:'cloth',name:'Sound · cloth',kind:'events',derived:true,src:snd,why:'Every 29th frame while someone walks.',items:ev('cloth')},
  {id:'metal',name:'Sound · metal',kind:'events',derived:true,src:snd,why:'Every 17th frame while the second figure walks.',items:ev('metal')}
 ];
};
/* LAYERS AND VIEWS, for the studio: parts of the picture switched off, and the buffers
   the picture is made from. They change what is shown, never the film. */
const LAYERS=[['lines','Ink lines'],['snow','Snow'],['fog','Fog']];
window.__layers=()=>LAYERS.map(([id,name])=>({id,name,on:!!OPT[id]}));
window.__layer=(id,on)=>{ if(LAYERS.some(l=>l[0]===id)){ OPT[id]=on?1:0; if(!playing){render();gl.finish();} } };
window.__views=()=>[{id:0,name:'Picture'},{id:1,name:'Material'},{id:2,name:'Lines'},{id:6,name:'Depth'}];
window.__view=(d)=>{ DBG=d; if(!playing){render();gl.finish();} };
/* the same graph, rendered offline, so the sound can be MEASURED rather than liked */
window.__renderAudio=async(seconds,sr)=>{
 const oc=new OfflineAudioContext(2, Math.floor((sr||32000)*seconds), sr||32000);
 const nz=noiseBuffer(oc,3);
 const cr=[0,1,2,3,4,5,6,7].map(i=>crunchBuffer(oc,i+1,0.14+i*0.012,i/7));
 const bus=buildBus(oc), beds=buildBeds(oc,bus.master,nz), v=makeVoices(oc,bus.master,nz,cr);
 let last=-1;
 for(let f=0;f<Math.round(seconds*FPS);f++){
  const t=f/FPS, i=shotAt(t%TOTAL);
  if(i!==last){ beds.set(SHOTS[i].snd.wind,SHOTS[i].snd.city,t,0.18); last=i; }
 }
 for(const e of TIMELINE){ if(e.t>=seconds) continue;
  if(e.type==='step') v.step(e.t,e.g,e.x,e.sz);
  else if(e.type==='cloth') v.cloth(e.t,e.g,e.x);
  else if(e.type==='breath') v.breath(e.t,e.g);
  else if(e.type==='metal') v.metal(e.t,e.g,e.x); }
 const b=await oc.startRendering();
 const L=b.getChannelData(0), Rc=b.getChannelData(1), out=new Float32Array(L.length);
 for(let i=0;i<L.length;i++) out[i]=(L[i]+Rc[i])*0.5;
 return {sr:b.sampleRate, pcm:Array.from(out)};
};
/* OCCUPANCY HAS TO BE MEASURED ON THE CHARACTER, NOT ON DARKNESS. The first version
   of this counted dark pixels, and a shot that had lost both men to a dark building
   wall scored HIGHER than the shot that framed them. The material buffer knows the
   difference; brightness never did. */
window.__matFrame=(n,w,h)=>{DBG=1;const r=window.__frameTo(n,w,h);DBG=0;return r;};
window.__lineFrame=(n,w,h)=>{DBG=2;const r=window.__frameTo(n,w,h);DBG=0;return r;};
/* WORK, not wall-clock: map() evaluations per pixel, exact and repeatable */
window.__workFrame=(n,w,h)=>{DBG=4;const r=window.__frameTo(n,w,h);DBG=0;return r;};
window.__primFrame=(n,w,h)=>{DBG=5;const r=window.__frameTo(n,w,h);DBG=0;return r;};
window.__depthFrame=(n,w,h)=>{DBG=6;const r=window.__frameTo(n,w,h);DBG=0;return r;};
window.__dbgFrame=(d,n,w,h)=>{DBG=d;const r=window.__frameTo(n,w,h);DBG=0;return r;};
window.__opt=(o)=>{Object.assign(OPT,o);};
window.__resetOpt=()=>{OPT.lines=1;OPT.nbr=1;OPT.cell=0;OPT.cam=null;OPT.bound=1;OPT.fog=1;OPT.snow=1;OPT.lfar=1;OPT.rimg=1;OPT.wmax=4096;OPT.wdir=1;OPT.style='oq-qalam';};
window.__frameTo=(n,w,h)=>{
 playing=false; T=0;phA=0;phB=0.37;dist=0;acc=0;
 if(w){c.width=w;c.height=h;}
 for(let i=0;i<n;i++)step(DT);
 const s=render(); gl.finish();
 /* THE FILM SAYS WHICH DRAWING IS UP. The first version of the ground check worked
    the exposure index out again, from the shot start, and got a different answer,
    because the walk phase accumulates across every shot that walks and not from the
    cut. A check that recomputes what it is checking is checking its own arithmetic. */
 const sh=SHOTS[s];
 return {frame:n,t:+T.toFixed(4),shot:sh.k,size:sh.sz,
         idx: sh.aw? idxAt(phA) : -1, di:+dist.toFixed(5)};
};
/* READY IS SAID, NOT WAITED FOR. Everything above ran in one go: the programs are
   linked, the buffers built, the timeline simulated. The harness used to sleep 600 ms
   after load and hope; on a runner 1.7x slower a sleep is a race. Without WebGL2 this
   line is never reached, and a harness asking for it stops with that sentence. */
window.__ready=true;
}  // begin
}
</script>'''
# the sheet block also carried the WALK declaration away with it; put it back
HEAD=HEAD.replace('__SHEET__', mod('sheet.mjs') + '\nconst WALK=walkFrom(POSES.PW);')
HEAD=HEAD.replace('__SHOTS__', mod('shots.mjs'))
HEAD=HEAD.replace('__SOUND__', mod('sound.mjs'))
HEAD=HEAD.replace('__STYLEJS__',SJS)
out=(HEAD.replace('__G__',G).replace('__C__',C)
   .replace('__POSES__',json.dumps(P)).replace('__RAMP__',json.dumps(flat)))
os.makedirs(os.path.join(ROOT,'build'),exist_ok=True)
open(os.path.join(ROOT,'build','oq-kocha.html'),'w',encoding='utf-8').write(out)
print('film page',len(out),'bytes')
