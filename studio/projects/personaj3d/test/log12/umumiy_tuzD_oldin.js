/* Style modullari uchun umumiy bo'laklar: toon shader tanasi, teskari qobiq kontur, qor,
   osmon. Har style shu bo'laklardan o'z materiallarini yig'adi; sahna va personaj kodi
   style ni bilmaydi -- faqat rol (userData.rol) beradi. */
import * as THREE from 'three';
import {YUZ_UV, YUZ} from '../personaj.js';

/* kalit yorug'lik: old-o'ng tomondan, past (~20 gr) -- misolda yuz va kapyushon ichidagi soch yoritilgan (1-shot),
   bosh egilganda kapyushon soyasiga kiradi (3-shot). Oldingi (0.55, 0.62, 0.56) ~38 gr tepadan edi: kapyushon
   tojni yopganda soch va yuz soyada qolardi (audit 2, yorug' massa 3.0 -> 0.6 %). */
export const KOZ = { nur: new THREE.Vector3(0.70, 0.35, 0.62).normalize(),      // oy/kalit yorug'lik (dunyo)
                     orqa: new THREE.Vector3(-0.8, 0.35, -0.3).normalize(),    // orqa (rim) yorug'lik
                     yuzRim: new THREE.Vector3(1.0, -0.35, -0.45).normalize(),    // yuz rimi: personaj oldidan-pastdan, kameradan narida
                     nurSoch: new THREE.Vector3(0.70, 0.35, 0.62).normalize() };  // soch uchun kalit yorug'lik (6-o'tish; tekshiruv: ?sochNur=x,y,z)
if (typeof location !== 'undefined') { const sn = new URLSearchParams(location.search).get('sochNur'); if (sn) KOZ.nurSoch.set(...sn.split(',').map(Number)).normalize(); }
/* tekshiruv (12-o'tish): ?nur=az,el -- kalit yorug'lik (soch ham) personaj oldidan (+x) o'ng tomoniga (+z) az gradus, el gradus tepadan */
if (typeof location !== 'undefined') { const nr = new URLSearchParams(location.search).get('nur'); if (nr) { const [a, e] = nr.split(',').map(v => +v * Math.PI / 180);
  KOZ.nur.set(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)); KOZ.nurSoch.copy(KOZ.nur); } }

/* umumiy vertex: dunyo normali, dunyo pozitsiyasi, mahalliy pozitsiya va normal (yuz proyeksiyasi uchun) */
/* KAPYUSHON SOYASI (soya xaritasi) -- kalit yorug'lik tomondan faqat kapyushon chuqurligi chiziladi (main.js,
   ortografik kamera, 1-qatlam); bosh, soch, bo'yin shu xaritadan kapyushon ortida qolganini biladi. Misolning
   3-shotida bosh kapyushon ichiga cho'kkanda yorug' massa 3.3 -> 1.1 % ga kamayadi; bizda 3.5 -> 4.8 % o'sardi.
   (Sfera bilan taxminlash urinildi: teshik tepada juda tez kengaygani uchun nur doim "teshikdan" chiqardi -- soya
   deyarli yo'q edi, 174 piksel.) Barcha materiallar bir xil uniform obyektlarini bo'lishadi -- main.js yangilaydi. */
export const KAP_U = {
  uSoyaMap: {value: null}, uSoyaM: {value: new THREE.Matrix4()}, uKapBor: {value: 0},
};
export const KAP_SOYA_GLSL = `
uniform sampler2D uSoyaMap; uniform mat4 uSoyaM; uniform float uKapBor;
float kapSoya(vec3 pW, vec3 Lw){
  if (uKapBor < 0.5) return 1.0;
  vec4 c = uSoyaM * vec4(pW, 1.0); vec3 s = c.xyz / c.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0) return 1.0;
  float d = texture2D(uSoyaMap, s.xy).r;
  return s.z - 0.004 <= d ? 1.0 : 0.0;
}`;

/* 12-o'tish (tuzilish): KAPYUSHON ICHI QORONG'I -- OSMON KO'RINISHI (ambient okklyuziya, faqat kapyushon va plash to'sadi).
   Misolda kapyushon ichidagi hamma narsa (ichki mato ham, boshning kapyushon ichidagi qismi ham) bitta qorong'i ton (L 6..14):
   uch shotdagi qorong'i joy bosh fazosida bir joyda (az -48..-72, y -0.45..+0.45 -- 9 kadrda). Bu yorug'lik: kapyushon ichiga
   osmon nuri kirmaydi. Dunyo yo'nalishlari (Fibonachchi sfera, AO_N ta) bo'yicha kapyushon+plash chuqurlik xaritalari (main.js,
   atlas AO_G x AO_G); nuqta uchun ko'rinish V = sum(vis * max(0, N.d)) / sum(max(0, N.d)). Kameraga bog'liq emas. */
export const AO_N = 16, AO_G = 4;
const _qa = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
export const AO_U = {
  uAoMap: {value: null}, uAoBor: {value: 0},
  /* chegaralar (uniform -- moslashda o'zgaradi): V < x -- ich toni (qorong'i), x <= V < y -- material soyasi */
  uAoEsik: {value: new THREE.Vector2(_qa.get('aoD') !== null ? +_qa.get('aoD') : 0.45, _qa.get('aoS') !== null ? +_qa.get('aoS') : 0.70)},
  uAoM: {value: Array.from({length: AO_N}, () => new THREE.Matrix4())},
  uAoD: {value: Array.from({length: AO_N}, () => new THREE.Vector3(0, 1, 0))},
};
export const AO_GLSL = `
uniform sampler2D uAoMap; uniform float uAoBor; uniform mat4 uAoM[${AO_N}]; uniform vec3 uAoD[${AO_N}]; uniform vec2 uAoEsik;
float kapAO(vec3 pW, vec3 N){
  if (uAoBor < 0.5) return 1.0;
  float s = 0.0, w = 0.0;
  for (int i = 0; i < ${AO_N}; i++) {
    float c = dot(N, uAoD[i]);
    if (c <= 0.0) continue;
    vec4 q = uAoM[i] * vec4(pW, 1.0); vec3 t = q.xyz / q.w * 0.5 + 0.5;
    float vis = 1.0;
    if (t.x > 0.002 && t.x < 0.998 && t.y > 0.002 && t.y < 0.998 && t.z < 1.0) {
      vec2 g = vec2(mod(float(i), ${AO_G}.0), floor(float(i) / ${AO_G}.0));
      float d = texture2D(uAoMap, (g + t.xy) / ${AO_G}.0).r;
      vis = t.z - 0.002 <= d ? 1.0 : 0.0;
    }
    s += c * vis; w += c;
  }
  return w > 0.0 ? s / w : 1.0;
}`;
/* kapyushon uchun: aChet (teshik chetigacha masofa) -> vChet */
/* soch tutamlari uchun: soyalash massa normalidan (aSochN, personaj.tutamGeometriya) */
export const vertSoch = () => VERT.replace('varying vec3 vN;', 'attribute vec3 aSochN; varying vec3 vN;').replace('vN = normalize(mat3(modelMatrix) * normal);', 'vN = normalize(mat3(modelMatrix) * aSochN);');
export const vertIch = () => VERT.replace('varying vec3 vN;', 'attribute float aChet; varying float vChet; varying vec3 vN;').replace('vL = position;', 'vL = position; vChet = aChet;');
export const TASMA = 0.18;   // astar tasmasi eni (birlik): 2D o'lchovida tasma ~7 px, bosh eni ~75 px (320 da) -> bosh eni ~1.9 birlik

export const VERT = `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
void main(){
  vL = position; vLN = normal;
  vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

/* yuz chizmasi (bosh fazosida tekis proyeksiya) -- personaj dizayni, style faqat qanday qo'shishni tanlaydi.
   5-o'tish: YAQIN KO'Z (va qoshi) tekis proyeksiyadan olinmaydi -- sirtdagi ko'z kartasi (personaj.js kozKarta) orqali:
   c = (ko'z markazi) + (dot(P-O, T) kx, dot(P-O, U) ky). w = 0 da karta tekis proyeksiyaning o'zi; profilda ko'z
   chizmasi bosh yon tomoniga ko'chadi (anime profil usuli, misol 2-shotidan o'lchangan). Uzoq ko'z -- tekis. */
const KX = (-YUZ.kozX).toFixed(4), KY = YUZ.kozY.toFixed(4);
export const KOZ_U = {
  uKozO: {value: new THREE.Vector3(-YUZ.kozX, YUZ.kozY, 0.9)}, uKozT: {value: new THREE.Vector3(1, 0, 0)},
  uKozU: {value: new THREE.Vector3(0, 1, 0)}, uKozN: {value: new THREE.Vector3(0, 0, 1)}, uKozK: {value: new THREE.Vector2(1, 1)},
};
export const YUZ_GLSL = `
uniform sampler2D uYuz; uniform sampler2D uYuzH; uniform sampler2D uYuzY; uniform float uYumuq; uniform float uYuzBor;
uniform vec3 uKozO; uniform vec3 uKozT; uniform vec3 uKozU; uniform vec3 uKozN; uniform vec2 uKozK;
vec4 yuzTex(vec2 p){
  vec2 fuv = vec2(0.5 + p.x/${YUZ_UV.sx.toFixed(3)}, (p.y - (${YUZ_UV.y0.toFixed(3)}))/${YUZ_UV.sy.toFixed(3)});
  vec4 a = texture2D(uYuz, fuv), hh = texture2D(uYuzH, fuv), b = texture2D(uYuzY, fuv);
  return uYumuq < 0.25 ? a : (uYumuq < 0.75 ? hh : b);     // ochiq / yarim / yumuq -- almashadi, aralashmaydi
}
// yaqin ko'z chizmasi qutisi (ko'z, qovoq uchi, qosh, yosh ko'lmagi): ko'z markazidan |dx| < 0.16, -0.18 < dy < 0.27
float kozQuti(vec2 p){ vec2 d = p - vec2(${KX}, ${KY}); return step(abs(d.x), 0.16) * step(-0.18, d.y) * step(d.y, 0.27); }
vec4 yuzRang(){
  vec4 f = yuzTex(vL.xy);
  f.a *= smoothstep(0.10, 0.40, normalize(vLN).z) * step(0.0, vL.z) * (1.0 - kozQuti(vL.xy));
  vec3 d = vL - uKozO;
  vec2 c = vec2(${KX}, ${KY}) + vec2(dot(d, uKozT) * uKozK.x, dot(d, uKozU) * uKozK.y);
  vec4 g = yuzTex(c);
  g.a *= kozQuti(c) * step(length(d), 0.45) * smoothstep(0.25, 0.50, dot(normalize(vLN), uKozN));
  return vec4(mix(f.rgb, g.rgb, g.a), max(f.a, g.a) * uYuzBor);
}`;

export function yuzUniform(ud) {
  const y = ud && ud.yuz;
  return { uYuz: {value: y ? y.ochiq : null}, uYuzH: {value: y ? y.yarim : null}, uYuzY: {value: y ? y.yumuq : null}, uYumuq: {value: 0}, uYuzBor: {value: y ? 1 : 0}, ...KOZ_U };
}

/* teskari qobiq kontur: ekranda piksel qalinligida (masofaga bog'liq emas) */
export function konturMaterial(rang, px, W, H, opacity = 1) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: opacity < 1, depthWrite: opacity >= 1,
    uniforms: {uRang: {value: new THREE.Color(rang)}, uPx: {value: px}, uRes: {value: new THREE.Vector2(W, H)}, uOp: {value: opacity}},
    vertexShader: `uniform float uPx; uniform vec2 uRes;
      void main(){
        vec4 c = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        vec3 n = normalize(normalMatrix * normal);
        vec2 d = normalize((projectionMatrix * vec4(n,0.0)).xy + 1e-6);
        c.xy += d * uPx * 2.0 / uRes * c.w;
        gl_Position = c;
      }`,
    fragmentShader: `uniform vec3 uRang; uniform float uOp; void main(){ gl_FragColor = vec4(uRang, uOp); }`,
  });
}

/* FON "TEPASI" -- 9-o'tishdan beri doimo dunyo tepasi (0, 1, 0): osmon gradienti va qor zichligi balandlik bo'yicha
   (5-o'tishdagi kameraga qarab og'dirish olib tashlandi -- main.js izohi). Kamera sinovi (test/kamera_sinov9.mjs) uni o'qiydi. */
export const BG_U = {uBgUp: {value: new THREE.Vector3(0, 1, 0)}};
/* osmon: vertikal gradient (katta ichki sfera) */
export function osmonMaterial(tepa, past, qoshimcha = '', a = -0.35, b = 0.55) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {uT: {value: new THREE.Color(tepa)}, uP: {value: new THREE.Color(past)}, ...BG_U},
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uT; uniform vec3 uP; uniform vec3 uBgUp; varying vec3 vD;
      void main(){ float t = smoothstep(${a.toFixed(3)}, ${b.toFixed(3)}, dot(normalize(vD), uBgUp)); vec3 c = mix(uP, uT, t); ${qoshimcha} gl_FragColor = vec4(c,1.0); }`,
  });
}

/* qor zarralari: o'lcham masofaga bog'liq, yumshoq yoki qattiq disk.
   maks -- eng katta zarra (px, H=540 da): misolda eng katta zarra 320x180 da ~60 px maydon (diametr ~8.7 px) ->
   540 da ~26 px; uYaqin -- kameradan shu masofagacha zarra yo'q, keyingi 2 birlikda paydo bo'ladi (sahna beradi;
   audit 1: misolda figura oldidagi zarra osmondagining 7..9 %, bizda 14..22 %, yaqin katta yumshoq disklar);
   min -- eng kichigi: misolda zarra maydoni mediani 2 px (diametr ~1.6 px 320 da, ~4.8 px 540 da),
   1 px lik uzoq zarra 320 ga kichraytirilganda yo'qolardi; kameraga juda yaqin zarra (0.8..2.0 birlik) so'nadi -- misolda katta xira disk yo'q.
   uYer/uQalin -- sahna beradi (yer ustidagi zich qor qatlami: balandlikka qarab zichlik eksponent kamayadi;
   aH -- har zarraning tasodifiy chegarasi, zarra yo qoladi yo yo'qoladi). */
export function qorMaterial(rang, {qattiq = 0.6, olcham = 60, op = 0.9, H = 540, maks = 26, min = 5} = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {uRang: {value: new THREE.Color(rang)}, uS: {value: olcham * H / 540}, uQ: {value: qattiq}, uOp: {value: op},
               uMaks: {value: maks * H / 540}, uMin: {value: min * H / 540}, uYaqin: {value: 0.8}, uYer: {value: -1e4}, uQalin: {value: 1e9}, ...BG_U},
    vertexShader: `attribute float aR; attribute float aA; attribute float aH; uniform float uS; uniform float uMaks; uniform float uMin; uniform float uYaqin; uniform float uYer; uniform float uQalin; uniform vec3 uBgUp; varying float vA;
      void main(){ vec4 w = modelMatrix*vec4(position,1.0); vec4 mv = viewMatrix*w;
        gl_PointSize = clamp(uS * aR / -mv.z, uMin, uMaks);
        vA = aA * smoothstep(uYaqin, uYaqin + 2.0, -mv.z);
        // zichlik balandlik bilan so'nadi: zarra yo'q bo'ladi (xiralashmaydi) -- misolda tepadagi zarralar ham yorug', faqat siyrak
        float bal = dot(w.xyz, uBgUp);
        bool bor = exp(-max(0.0, bal - uYer) / uQalin) > aH;     // balandlik fon "tepasi" bo'yicha (BG_U)
        gl_Position = bor ? projectionMatrix*mv : vec4(2.0, 2.0, 2.0, 1.0); }`,
    fragmentShader: `uniform vec3 uRang; uniform float uQ; uniform float uOp; varying float vA;
      void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = 1.0 - smoothstep(uQ, 1.0, r); if(a <= 0.01) discard; gl_FragColor = vec4(uRang, a * vA * uOp); }`,
  });
}

/* KO'Z YOSHI (4-o'tish) -- misolda 1-shotda ikki yosh izi yuzdan pastga siljiydi (L>70 komponentlar, har tasvir):
   A -- ko'z ostidan tik (1..6-tasvir, pastga siljib so'nadi), B -- 5-tasvirdan yonoq bo'ylab (11-tasvirgacha),
   C -- jag' chetida osilgan tomchi (halqa, 7..9).
   Har iz -- bosh fazosidagi kesma (a.xy -> b.xy), eni va kuchi; qiymatlar film.js da (poza.yosh), main.js qo'yadi.
   Shakl chizmasi bizniki (yorug' ingichka chiziq); o'rni va vaqti misoldan o'lchangan. */
export const YOSH_U = {
  uYoshA: {value: new THREE.Vector4()}, uYoshB: {value: new THREE.Vector4()}, uYoshC: {value: new THREE.Vector3()},
  uYoshW: {value: new THREE.Vector2(0.02, 0.02)}, uYoshK: {value: new THREE.Vector3(0, 0, 0)},
  uYoshRang: {value: new THREE.Color('#9092cc')},     // misol izi L 100..131 (320 da, 1.5..2 px)
};
export const YOSH_GLSL = `
uniform vec4 uYoshA; uniform vec4 uYoshB; uniform vec3 uYoshC; uniform vec2 uYoshW; uniform vec3 uYoshK; uniform vec3 uYoshRang;
float yoshKesma(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0); return length(pa - ba * h); }
vec3 yoshQosh(vec3 c){
  if (vL.z <= 0.0) return c;
  float old = smoothstep(0.15, 0.35, normalize(vLN).z);    // faqat oldga qaragan sirtda (jag' ostida cho'zilmasin)
  float a = (1.0 - smoothstep(uYoshW.x * 0.55, uYoshW.x, yoshKesma(vL.xy, uYoshA.xy, uYoshA.zw))) * uYoshK.x;
  float b = (1.0 - smoothstep(uYoshW.y * 0.55, uYoshW.y, yoshKesma(vL.xy, uYoshB.xy, uYoshB.zw))) * uYoshK.y;
  // C -- jag' chetida osilgan tomchi: halqa (misol 7-tasvir: ~5 px yorug' halqa)
  float dc = length(vL.xy - uYoshC.xy), rc = max(uYoshC.z, 1e-4);
  float h = (1.0 - smoothstep(0.22 * rc, 0.38 * rc, abs(dc - 0.72 * rc))) * uYoshK.z;
  return mix(c, uYoshRang, max(max(a, b), h) * old);
}`;
