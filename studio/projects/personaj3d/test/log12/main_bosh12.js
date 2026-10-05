/* KIRISH: ?style=anime|siyoh|akvarel &kamera=pastdan|old|yon &w=960&h=540&fps=24
   window.kadr(n) -- n-tasvirni aniq (deterministik) chizadi: fizika 0 dan ketma-ket yuradi.
   Style almashganda sahna, personaj, harakat, kamera kodi O'ZGARMAYDI -- faqat src/style/<nom>.js. */
import * as THREE from 'three';
import {personaj, KIYIM, BOSH, YUZ, SOCH, yuzNuqta, iyakNuqta, burunNuqta, kozKarta, qismNuqtalari} from './personaj.js';
import {KAP_U, KOZ, KOZ_U, BG_U} from './style/umumiy.js';
import {sahna, jadval, shamol} from './sahna.js';
import {FILMLAR, shotTop} from './film.js';

const q = new URLSearchParams(location.search);
const STYLE = q.get('style') || 'anime', KAM = q.get('kamera') || 'pastdan';
const W = +q.get('w') || 960, H = +q.get('h') || 540, FPS = +q.get('fps') || 24;
const S = (await import(`./style/${STYLE}.js`)).default;
const ADIM = S.adim || 1;                // personaj pozasi necha tasvirda bir yangilanadi (anime: 2)
const FILM = q.get('film') ? FILMLAR[q.get('film')] : null;   // shotlar ro'yxati (vaqt va ushlash shotdan)
const TFPS = FILM ? 1000 / FILM.ms : FPS;

const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene(); scene.background = new THREE.Color(S.fon || '#000');
/* tekshiruv/moslash: ?soch={"pesh":{...},"yaqin":{...}} -- soch dizayni parametrlari (personaj qurilishidan oldin) */
if (q.get('soch')) { const o = JSON.parse(q.get('soch')); for (const k in o) Object.assign(SOCH[k] || (SOCH[k] = {}), o[k]); }
const P = personaj(); scene.add(P.ildiz); P.tutamlar.forEach(t => scene.add(t.m));
const {kamera, qor} = sahna(scene, S, W, H, KAM);

for (const m of P.meshlar()) {                          // style: rol -> material + kontur
  m.material = S.material(m.userData.rol, m.userData);
  const km = S.kontur && S.kontur(m.userData.rol, W, H);
  if (km) { const o = new THREE.Mesh(m.geometry, km); o.frustumCulled = false; o.renderOrder = -1; m.add(o); }
  m.frustumCulled = false;
}
const composer = S.post(renderer, scene, kamera, W, H);
kozKartaQoy(0);                                              // ko'z kartasi: 3/4 (tekis proyeksiyaning o'zi)
/* tushayotgan ko'z yoshi tomchisi (4-o'tish; misol 10-11: iyak ostida yorug' nuqta, yosh_jag zondi) -- film pozasidagi
   yosh.tomchi dunyo nuqtasida; chuqurlik sinovisiz (kichik yaltiroq nuqta, kapyushon/plash ortida yo'qolmasin) */
const tomchi = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), new THREE.MeshBasicMaterial({color: '#c3c5f6', depthTest: false}));
tomchi.renderOrder = 10; tomchi.visible = false; tomchi.frustumCulled = false;
if (S.nom !== 'rol') scene.add(tomchi);
if (q.get('kiyim')) P.kiyimQur(JSON.parse(q.get('kiyim')));      // tekshiruv: kiyim parametrlarini URL dan
/* 12-o'tish (moslash/tekshiruv): sochni sahifada qayta qurish -- yangi tutamlarga material va kontur (yuqoridagidek) */
window.sochQur = (o) => {
  const eski = P.sochQur(o || {});
  for (const t of eski) { scene.remove(t.m); t.g.dispose(); }
  for (const t of P.tutamlar) {
    scene.add(t.m); t.m.material = S.material(t.m.userData.rol, t.m.userData);
    const km = S.kontur && S.kontur(t.m.userData.rol, W, H);
    if (km) { const ko = new THREE.Mesh(t.m.geometry, km); ko.frustumCulled = false; ko.renderOrder = -1; t.m.add(ko); }
    if ((q.get('gizla') || '').split(',').includes('soch')) t.m.visible = false;
  }
  oxirgi = -1; return P.tutamlar.length;
};
/* tekshiruv: ?gizla=kapyushon,plash -- rollarni yashirish; ?tutam=5 -- faqat shu tutam qizil */
const GIZ = (q.get('gizla') || '').split(',').filter(Boolean);
for (const m of P.meshlar()) if (GIZ.includes(m.userData.rol)) m.visible = false;
if (q.get('tutam')) { const ti = +q.get('tutam'); P.tutamlar.forEach((t, i) => { if (i === ti) t.m.material = new THREE.MeshBasicMaterial({color: 0xff2020}); }); }
/* tekshiruv: ?tutamlar=1 -- har tutam o'z rangida (i-tutam: hue = i/N; qaysi tutam ekranda qayerda) */
const GR = {yel: [0.08, 0.62], qisqa: [0.33, 0.95], yaqin: [0.75, 0.9], uzoq: [0.55, 0.95], orqa: [0.0, 0.2]};   // guruh: [hue, yorug'lik]
if (q.get('tutamlar')) P.tutamlar.forEach((t, i) => { const g = GR[t.gr];
  t.m.material = new THREE.MeshBasicMaterial({color: q.get('tutamlar') === 'guruh' && g ? new THREE.Color().setHSL(g[0], 1, 0.35 + 0.3 * ((i * 7) % 5) / 4) : new THREE.Color().setHSL(i / P.tutamlar.length, 1, 0.5)}); });

let oxirgi = -1;
function kameraQoy(k) {
  kamera.fov = k.fov;
  if (k.az !== undefined) {                                           // orbita + linza siljishi (film.js izohi)
    const m = new THREE.Vector3(...(k.markaz || [0, 0, 0])), az = k.az * Math.PI / 180, el = k.el * Math.PI / 180;
    kamera.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(k.d).add(m);
    kamera.lookAt(m);
    const [sx, sy] = k.ekran || [0.5, 0.5];
    kamera.setViewOffset(W, H, -(sx - 0.5) * W, -(sy - 0.5) * H, W, H);
  } else { kamera.position.set(...k.poz); kamera.lookAt(...k.nishon); kamera.clearViewOffset(); }
  kamera.updateProjectionMatrix();
}
/* kapyushon soya xaritasi: kalit yorug'lik yo'nalishidan ortografik kamera, faqat 1-qatlamdagi kapyushon */
const soyaRT = new THREE.WebGLRenderTarget(1024, 1024);
soyaRT.depthTexture = new THREE.DepthTexture(1024, 1024);
const soyaKam = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 30); soyaKam.layers.set(1);
P.kap.layers.enable(1);
KAP_U.uSoyaMap.value = soyaRT.depthTexture;
const _m = new THREE.Vector3(), _soyaBor = q.get('kapsoya') !== '0';
function kapSoyaQoy() {
  KAP_U.uKapBor.value = _soyaBor ? 1 : 0;
  if (!_soyaBor) return;
  P.bosh.getWorldPosition(_m);
  soyaKam.position.copy(_m).addScaledVector(KOZ.nur, 12); soyaKam.lookAt(_m); soyaKam.updateMatrixWorld(true);
  KAP_U.uSoyaM.value.multiplyMatrices(soyaKam.projectionMatrix, soyaKam.matrixWorldInverse);
  const eskiBg = scene.background; scene.background = null;
  renderer.setRenderTarget(soyaRT); renderer.clear(); renderer.render(scene, soyaKam); renderer.setRenderTarget(null);
  scene.background = eskiBg;
}
/* ko'z yoshi izlari (film pozasidan): {A: {a:[x,y], b:[x,y], w, k}, B: {...}, C: {p:[x,y], r, k}} -- bosh fazosida */
function yoshQoy(u, y) {
  if (!u || !u.uYoshA) return;
  const A = y && y.A, B = y && y.B, C = y && y.C;
  u.uYoshK.value.set(A ? A.k : 0, B ? B.k : 0, C ? C.k : 0);
  if (C) u.uYoshC.value.set(C.p[0], C.p[1], C.r);
  if (A) { u.uYoshA.value.set(A.a[0], A.a[1], A.b[0], A.b[1]); u.uYoshW.value.x = A.w; }
  if (B) { u.uYoshB.value.set(B.a[0], B.a[1], B.b[0], B.b[1]); u.uYoshW.value.y = B.w; }
}
function kozKartaQoy(w) {                                              // yaqin ko'z chizmasining sirtdagi kartasi (uniformlar umumiy)
  const c = kozKarta(w);
  KOZ_U.uKozO.value.set(...c.O); KOZ_U.uKozT.value.set(...c.T); KOZ_U.uKozU.value.set(...c.U);
  KOZ_U.uKozN.value.set(...c.N); KOZ_U.uKozK.value.set(...c.k);
}
/* 9-o'tish: FON VA QOR -- DUNYODA. 5-o'tishdagi fon "tepasi" (osmon gradienti va qor zichligi yo'nalishi kamera
   egilishiga qarab og'ardi, 3-shotda 22 gr) va 8-o'tishdagi qor qatlami (qor 1-shot kamerasi fazosida, har shotga
   ko'chirilardi: kamera sinovida yo'l oxirida 138 px, orbitada 398 px -- paralaks yo'q) olib tashlandi. Osmon -- dunyo
   gradienti (uBgUp doimo dunyo tepasi), qor -- barcha kameralarni o'rab olgan hajm (sahna.js). Misolning fon plitasi uch
   shotda bir xil (2D) -- dunyo osmoni bilan 3-shotda farq qoladi (qoldiq, README 9-o'tish). */
/* 9-o'tish: kapyushon SHOT bo'yicha emas -- bitta kapyushon (KIYIM.kap), uch shotga birgalikda moslangan
   (test/fit_kap9.mjs). 7-8-o'tishdagi shot.kap va window.__kapShot olib tashlandi (kamera sinovida kalit almashganda
   114 / 159 px sakrash). */
/* tekshiruv/moslash (8-o'tish): window.__kamShot[shot raqami] = {d, ekran, ...} -- shot kamerasi ustiga; ?kamShot={"1":{...}} */
if (q.get('kamShot')) window.__kamShot = JSON.parse(q.get('kamShot'));
/* tekshiruv/moslash (11-o'tish): window.__pozaShot[shot raqami] = {dEg, dBur, dYon} -- shot pozasi ustiga qo'shimcha
   (test/fit_poza11b.mjs; kapyushon rigi va soch shu pozaga ergashadi -- xuddi film.js o'zgargandek) */
function shotPoza(s, h) {
  const idx = FILM.shotlar.indexOf(s), o = window.__pozaShot && window.__pozaShot[idx];
  return o ? {...h, egilish: h.egilish + (o.dEg || 0), burilish: h.burilish + (o.dBur || 0), yonga: (h.yonga || 0) + (o.dYon || 0)} : h;
}
function shotKamera(s) {
  const idx = FILM.shotlar.indexOf(s), o = window.__kamShot && window.__kamShot[idx];
  return o ? {...s.kamera, ...o} : s.kamera;
}
/* 9-o'tish tekshiruvi (test/kamera_sinov9.mjs): ?vaqt=T -- vaqt ushlanadi (shamol, qor); ?yamoq=0 -- kalibr: kameraga
   yoki shotga bog'liq HAR qiymat (fon tepasi, qor qatlami, shot kapyushoni, profil, soch vazni, surish) 0-tasvirda
   hisoblanib muzlatiladi -- asbob hamma qismda 0 o'qishi kerak (o'qimasa -- biz bilmagan yamoq bor); ?suniy=N -- kalibr:
   N-tasvirdan kapyushon dunyoda +0.1 x ga (ma'lum buzilish, asbob uni o'sha qiymatda ko'rishi kerak). */
const VAQT = q.get('vaqt') !== null ? +q.get('vaqt') : null, YAMOQ0 = q.get('yamoq') === '0', SUNIY = q.get('suniy') !== null ? +q.get('suniy') : null;
let muz = null, joriyYumuq = 0;
function qadamFilm(f) {
  if (f === 0) muz = null;
  const {s, i} = shotTop(FILM, f);
  const ii = s.ushla && s.ushla.includes(i) ? s.ushla[0] : i;          // ushlangan tasvir -- bitta poza
  /* 11-o'tish: poza to'liq -- shot pozasida yo'q maydonlar 0 (1- va 2-shotda chokish/orqaga yo'q; P.poza Object.assign
     qiladi): tartibsiz baholashda (moslash: 3-shotdan keyin 0-tasvirdan qayta) 1-shot boshi 3-shotning chokish/orqaga
     qiymatlarida qolardi (-0.02, ~1 px; kapF 0.030 -> 0.019). Ketma-ket renderda (render.mjs) hech narsa o'zgarmaydi. */
  const h = shotPoza(s, {yonga: 0, chokish: 0, orqaga: 0, ...s.poza(ii)});
  const kam = shotKamera(s);
  kameraQoy(kam);
  P.poza(h);
  P.kapQadam(1 / TFPS, i === 0);       // 9-o'tish: bitta kapyushon, boshga vaqt bo'yicha ergashadi (shot boshida tinch)
  /* 9-o'tish: ko'z kartasi (profil vazni), pastki yuz surishi va soch ko'rinish vazni olib tashlandi -- bitta bosh,
     bitta soch dam shakli (kamera qayerda bo'lmasin) */
  if (YAMOQ0 && !muz) muz = {};
  if (SUNIY !== null) P.kap.position.set(f >= SUNIY ? 0.1 : 0, 0, 0).applyQuaternion(P.ildiz.quaternion.clone().invert());   // dunyoda +x (ildiz 90 gr burilgan)
  const u = P.boshMesh.material.uniforms; if (u && u.uYumuq) u.uYumuq.value = h.yumuq;
  joriyYumuq = h.yumuq || 0;                                          // qism nuqtalari uchun (rol style da uYumuq yo'q)
  const hy = (ii === i ? h : s.poza(i)).yosh;        // ushlangan rasmda ham yosh siljiydi (misolda 1..6 da pastga oqadi)
  yoshQoy(u, hy);
  tomchi.visible = !!(hy && hy.tomchi); if (tomchi.visible) tomchi.position.set(...hy.tomchi);
  /* har shot boshida soch shu shot pozasida oldindan aylantiriladi: kesishda poza sakraydi (kamera boshqa) va
     tutamlar "alanga" bo'lib tepaga qamchilanardi (2-shot, 12-tasvir) */
  const tt = VAQT !== null ? VAQT : f / TFPS;
  P.fizika(1 / TFPS, shamol(tt), i === 0);
  P.tutamGeometriya();                                                // soch ushlanganda ham qimirlaydi (misolda o'lchangan)
  qor.qadam(tt);
}
function qadam(f) {
  if (FILM) return qadamFilm(f);
  const ts = Math.floor(f / ADIM) * ADIM / FPS;
  const h = jadval(ts);
  P.poza(h);
  const u = P.boshMesh.material.uniforms; if (u && u.uYumuq) u.uYumuq.value = h.yumuq;
  P.fizika(1 / FPS, shamol(f / FPS), f === 0);
  if (f % ADIM === 0 || f === 0) P.tutamGeometriya();
  qor.qadam(f / FPS);
}
window.kadr = (n) => {
  if (n <= oxirgi) oxirgi = -1;
  for (let f = oxirgi + 1; f <= n; f++) qadam(f);
  oxirgi = n;
  if (composer.kadrUniform) composer.kadrUniform.value = n;
  kapSoyaQoy();
  composer.render();
  return true;
};
window.tasvir = () => renderer.domElement.toDataURL('image/png');
window.malumot = {STYLE, KAM, W, H, FPS: TFPS, ADIM, izoh: S.izoh, film: q.get('film') || null};
/* tekshiruv: mexanizmni o'lchash uchun (soch uchlari ekranda qayerda) -- har tutam oxirgi nuqtasi, piksel */
/* moslash uchun: kiyimni qayta qurish va kadr niqobini (fon emas = 1) o'qish */
window.kiyim = (p) => { P.kiyimQur(p); oxirgi = -1; return true; };
window.__kiyimJoriy = () => KIYIM;
/* moslash bahosi sahifa ichida: har shot uchun 10x10 blok qoplanishi (o'rtacha) va bosh (teri+soch) piksellari */
window.fitBaho = (o, SHOT) => {
  if (o) window.kiyim(o);
  const gl = renderer.getContext(), b = new Uint8Array(W * H * 4), BY = Math.floor(H / 10), BX = Math.floor(W / 10);
  const out = {B: {}, yuz: [], boyin: []};
  for (const [nom, fr] of Object.entries(SHOT)) {
    const acc = new Float32Array(BY * BX);
    for (const f of fr) {
      window.kadr(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
      let yz = 0, by = 0;
      for (let y = 0; y < BY * 10; y++) for (let x = 0; x < BX * 10; x++) {
        const i = ((H - 1 - y) * W + x) * 4;
        if (b[i] + b[i + 1] + b[i + 2] > 30) acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
        if ((b[i] > 200 && b[i + 1] < 60 && b[i + 2] < 60) || (b[i + 1] > 200 && b[i] < 60 && b[i + 2] < 60)) yz++;
        if (b[i] > 35 && b[i] < 80 && b[i + 1] < 20 && b[i + 2] < 20) by++;                  // bo'yin (rol: 55,0,0)
      }
      out.yuz.push(yz); out.boyin.push(by);
    }
    out.B[nom] = Array.from(acc, v => v / (100 * fr.length));
  }
  return out;
};
/* 6-o'tish (kapyushon moslash): misol niqoblari bir marta yuklanadi (window.__ref = {lit: [base64...], qora: [...]}),
   har kadr rol renderida: misolning yorug' sochi bizda kapyushon ostida qolgani (A), bizning ko'rinadigan sochimiz
   misol qorong'i (L<30) joyda (B), figura bloklari (fitBaho kabi), yuz (teri) piksellari */
window.kapBaho = (o, SHOT) => {
  if (o) window.kiyim(o);
  const R = window.__ref, gl = renderer.getContext(), b = new Uint8Array(W * H * 4), BY = Math.floor(H / 10), BX = Math.floor(W / 10);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  const out = {B: {}, A: {}, Bs: {}, yuz: [], soch: []};
  for (const [nom, fr] of Object.entries(SHOT)) {
    const acc = new Float32Array(BY * BX); let lit = 0, litKap = 0, soch = 0, sochQora = 0;
    for (const f of fr) {
      window.kadr(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
      const m = R.dec[f]; let yz = 0, sc = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
        const fonEmas = r + g + bl > 30;
        if (fonEmas && y < BY * 10 && x < BX * 10) acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
        const kap = bl > 30 && r < 30 && (g < 30 || g > 200);                 // (0,0,255) (0,255,255) (0,0,55)
        const sochP = g > 30 && r < 30 && bl < 30;                             // (0,255,0) (0,55,0)
        const teri = r > 200 && g < 60 && bl < 60;
        if (teri) yz++;
        if (m[j] & 1) { lit++; if (kap) litKap++; }
        if (sochP) { sc++; soch++; if (m[j] & 2) sochQora++; }
      }
      out.yuz.push(yz); out.soch.push(sc);
    }
    out.B[nom] = Array.from(acc, v => v / (100 * fr.length));
    out.A[nom] = litKap / Math.max(1, lit); out.Bs[nom] = sochQora / Math.max(1, soch);
  }
  return out;
};
/* 9-o'tish (bitta kapyushon moslash): window.__ref7 = {m: {tasvir: base64 niqob}} -- misolning ko'rinadigan boshi
   (test/audit_misol/bosh_niqob.py). o -- KIYIM.kap qiymatlari (HAMMA shot uchun bitta), kam -- window.__kamShot (shot
   kamerasi: masofa va ekran). Rol renderida ko'rinadigan boshimiz: teri, soch, qopqoq, bo'yin, astar; 3-shotda ruxsat
   qutisi. Qaytaradi: har tasvir IoU, shot bo'yicha figura bloklari. */
window.kapBaho9 = (o, kam, fr) => {
  if (o) P.kiyimQur(o.kap || o.kapPoza ? o : {kap: o});      // {kap: {...}, kapPoza: {...}} yoki faqat kap qiymatlari
  window.__kamShot = kam || null; oxirgi = -1;
  const R = window.__ref7, gl = renderer.getContext(), b = new Uint8Array(W * H * 4), BY = Math.floor(H / 10), BX = Math.floor(W / 10);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  /* 11-o'tish: window.__yuzKor = {m: {tasvir: base64}} bo'lsa (bit 1 -- misolning ko'rinadigan terisi, bit 2 -- yuz qutisida
     teri ham soch ham emas) -- har tasvir: kapyushon/plash misol terisi ustida (kapF) va bizning teri misolning qorong'i
     joyida (teriQ), misol terisi maydoniga nisbatan */
  const YK = window.__yuzKor;
  if (YK && !YK.dec) { YK.dec = {}; for (const k of Object.keys(YK.m)) { const s = atob(YK.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); YK.dec[k] = a; } }
  /* iou2 (11-o'tish): astarsiz -- faqat teri/bo'yin va soch. 3-shotda misolda astar ko'rinmaydi (yuz o'ngida soch massasi):
     astar "bosh" deb sanalganda moslash yetishmagan sochni astar bilan to'ldirdi (bosh IoU o'zgarmadi, soch+teri 73% -> 54%) */
  const out = {iou: {}, iou2: {}, biz: {}, misol: {}, B: {}, kapF: {}, teriQ: {}};
  for (const f of fr) {
    window.kadr(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const sh = f <= 10 ? 0 : f <= 12 ? 1 : 2; if (!out.B[sh]) out.B[sh] = {acc: new Float32Array(BY * BX), n: 0};
    const m = R.dec[f], yk = YK && YK.dec[f]; let I = 0, U = 0, nb = 0, nm = 0, nF = 0, kF = 0, tQ = 0, I2 = 0, U2 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
      if (r + g + bl > 30 && y < BY * 10 && x < BX * 10) out.B[sh].acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
      let bosh2 = (r > 30 && g < 30 && bl < 30) || (g > 30 && r < 30 && bl < 30), bosh = bosh2 || (g > 200 && bl > 200 && r < 30);   // teri/bo'yin, soch/qopqoq, astar
      if (f >= 13 && !((x <= 218) && (y <= 162) && !((x > 185) && (y > 135)))) bosh = bosh2 = false;
      const mm = m[j] & 1;
      if (bosh) nb++; if (mm) nm++; if (bosh && mm) I++; if (bosh || mm) U++;
      if (bosh2 && mm) I2++; if (bosh2 || mm) U2++;
      if (yk) {
        const kap = bl > 30 && g < 30 || (bl > 200 && g > 200 && r < 30);   // kapyushon (tashqi, ichi), plash (tashqi, ichi), astar
        if (yk[j] & 1) { nF++; if (kap) kF++; }
        else if ((yk[j] & 2) && r > 200 && g < 60 && bl < 60) tQ++;
      }
    }
    out.iou[f] = I / Math.max(1, U); out.iou2[f] = I2 / Math.max(1, U2); out.biz[f] = nb; out.misol[f] = nm; out.B[sh].n++;
    if (yk) { out.kapF[f] = kF / Math.max(1, nF); out.teriQ[f] = tQ / Math.max(1, nF); }
  }
  for (const sh in out.B) out.B[sh] = Array.from(out.B[sh].acc, v => v / (100 * out.B[sh].n));
  return out;
};
/* 12-o'tish (tuzilish): SINF BO'YICHA baho -- window.__qism = {m: {tasvir: base64}} (MAXFIY, test/qism/inson/qism_nishon.py):
   bit 1 -- misolning ko'rinadigan boshi (yuz + soch, yorug' va soyada), bit 2 -- kapyushon ichi (misolda keng kapyushonning
   qorong'i ichi soch va mato orasida), bit 4 -- figura. Bizda (rol): bosh = teri, bo'yin, soch, qopqoq (astar EMAS -- 11-o'tishda
   astar yetishmagan sochni to'ldirgan edi); ich = kapyushon/plash ichki yuzi; figura = fon emas. Qaytaradi: har tasvir uch
   IoU va astar piksellari. o -- kiyimQur qiymatlari ({kap, kapPoza, ...}), kam -- window.__kamShot. */
window.kapBaho12 = (o, kam, fr) => {
  if (o) P.kiyimQur(o);
  window.__kamShot = kam || null; oxirgi = -1;
  const R = window.__qism, gl = renderer.getContext(), b = new Uint8Array(W * H * 4);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  const out = {B: {}}, BY = Math.floor(H / 10), BX = Math.floor(W / 10);                 // B -- figura bloklari (shot bo'yicha, 8-o'tish usuli)
  for (const f of fr) {
    window.kadr(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const sh = f <= 10 ? 0 : f <= 12 ? 1 : 2; if (!out.B[sh]) out.B[sh] = {acc: new Float32Array(BY * BX), n: 0};
    const m = R.dec[f]; const c = {hI: 0, hU: 0, iI: 0, iU: 0, fI: 0, fU: 0, astar: 0, hBiz: 0, hMis: 0, iBiz: 0, iMis: 0};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
      let bosh = (r > 30 && g < 30 && bl < 30) || (g > 30 && r < 30 && bl < 30);                 // teri/bo'yin, soch/qopqoq
      if (f >= 13 && !((x <= 218) && (y <= 162) && !((x > 185) && (y > 135)))) bosh = false;    // 3-shot ruxsat qutisi (misol niqobidagidek)
      const ich = (bl > 30 && bl < 90 && r < 30 && g < 30) || (bl > 30 && bl < 90 && r > 30 && r < 90 && g < 30);   // kapIch (0,0,55), plashIch (55,0,55)
      const fig = r + g + bl > 30, astar = g > 200 && bl > 200 && r < 30;
      const mb = m[j] & 1, mi = m[j] & 2, mf = m[j] & 4;
      if (bosh && mb) c.hI++; if (bosh || mb) c.hU++; if (bosh) c.hBiz++; if (mb) c.hMis++;
      if (ich && mi) c.iI++; if (ich || mi) c.iU++; if (ich) c.iBiz++; if (mi) c.iMis++;
      if (fig && mf) c.fI++; if (fig || mf) c.fU++;
      if (fig && y < BY * 10 && x < BX * 10) out.B[sh].acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
      if (astar) c.astar++;
    }
    out.B[sh].n++;
    out[f] = {bosh: c.hI / Math.max(1, c.hU), ich: c.iI / Math.max(1, c.iU), figura: c.fI / Math.max(1, c.fU), astar: c.astar,
              boshNisbat: c.hBiz / Math.max(1, c.hMis), ichBiz: c.iBiz, ichMisol: c.iMis};
  }
  for (const sh in out.B) out.B[sh] = Array.from(out.B[sh].acc, v => v / (100 * out.B[sh].n));
  return out;
};
/* 12-o'tish (soch): kapyushon va plash YASHIRIN (soch hajmi o'zi) -- misolning sochi (window.__qism bit 1 va 8 emas) bizda
   soch bilan qoplanganmi (tiklash), misolning yorug' terisida (bit 8) bizning soch (yuzni yopish). o -- window.sochQur uchun
   (bo'sh bo'lsa soch o'zgarmaydi). Kapyushon keyin ustidan yopadi -- bu yerda faqat sochning o'zi. */
window.sochBaho12 = (o, fr) => {
  if (o) window.sochQur(o);
  oxirgi = -1;
  const R = window.__qism, gl = renderer.getContext(), b = new Uint8Array(W * H * 4);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  const yashir = [P.kap, P.plash], eski = yashir.map(m => m.visible); yashir.forEach(m => { m.visible = false; });
  const out = {};
  for (const f of fr) {
    window.kadr(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const m = R.dec[f]; let nH = 0, hS = 0, hT = 0, nF = 0, fS = 0, sF = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
      const soch = g > 30 && r < 30 && bl < 30, teri = r > 30 && g < 30 && bl < 30;
      const mh = (m[j] & 1) && !(m[j] & 8), mf = m[j] & 8;
      if (mh) { nH++; if (soch) hS++; else if (teri) hT++; }
      if (mf) { nF++; if (soch) fS++; }
      if (soch && !(m[j] & 4)) sF++;                        // bizning soch misolning FONIDA (osmon, qor) -- kapyushon ham yopmaydi
    }
    out[f] = {tiklash: hS / Math.max(1, nH), teriSochda: hT / Math.max(1, nH), yuzniYopish: fS / Math.max(1, nF), fonda: sF / Math.max(1, nH), nH, nF};
  }
  yashir.forEach((m, i) => { m.visible = eski[i]; });
  return out;
};
window.niqobOl = () => {
  const gl = renderer.getContext(), b = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
  const m = new Uint8Array(W * H), yuz = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = ((H - 1 - y) * W + x) * 4, j = y * W + x;
    m[j] = (b[i] + b[i + 1] + b[i + 2]) > 30 ? 1 : 0;
    yuz[j] = (b[i] > 200 && b[i + 1] < 60 && b[i + 2] < 60) || (b[i + 1] > 200 && b[i] < 60 && b[i + 2] < 60) ? 1 : 0;   // teri yoki soch
  }
  return {m: Array.from(m), yuz: Array.from(yuz)};
};
/* kamera va pozani qo'yib, bosh fazosidagi nuqtalarning ekran o'rnini qaytaradi (render yo'q -- moslash uchun) */
window.nuqtalar = (kam, poza, pts) => { kameraQoy(kam); kamera.updateMatrixWorld(); P.poza(poza); P.bosh.updateMatrixWorld(true); return pts.map(p => window.boshNuqta(p)); };
/* yuz nuqtalari (moslash uchun): bosh/yuz parametrlari (vaqtincha), poza va kamera berilib -- ekran o'rinlari.
   Bosh geometriyasi qayta qurilmaydi: nuqtalar boshShakli dan hisoblanadi (render yo'q). */
window.yuzNuqtalar = (o) => {
  const eB = {...BOSH}, eY = {...YUZ};
  Object.assign(BOSH, o.bosh || {}); Object.assign(YUZ, o.yuz || {});
  kameraQoy(o.kam); kamera.updateMatrixWorld(); P.poza(o.poza); P.bosh.updateMatrixWorld(true);
  const L = {yaqin: yuzNuqta(-YUZ.kozX, YUZ.kozY), uzoq: yuzNuqta(YUZ.kozX, YUZ.kozY), ogiz: yuzNuqta(0, YUZ.ogizY), iyak: iyakNuqta(), burun: burunNuqta()};
  const out = {}; for (const [k, p] of Object.entries(L)) out[k] = window.boshNuqta(p);
  Object.assign(BOSH, eB); Object.assign(YUZ, eY);
  return out;
};
window.boshNuqta = (p) => { const v = new THREE.Vector3(...p).applyMatrix4(P.bosh.matrixWorld).project(kamera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
/* tekshiruv (7-o'tish): ekrandagi (X, Y) atrofida r px ichiga tushgan kapyushon uchlari -- [u, v, chuqurlik] */
window.kapVnuqta = (X, Y, r = 3) => {
  const g = P.kap.geometry, pa = g.attributes.position, uv = g.attributes.uv, v3 = new THREE.Vector3(), out = [];
  P.kap.updateMatrixWorld(true);
  for (let i = 0; i < pa.count; i++) {
    v3.fromBufferAttribute(pa, i).applyMatrix4(P.kap.matrixWorld).project(kamera);
    const x = (v3.x + 1) / 2 * W, y = (1 - v3.y) / 2 * H;
    if (Math.abs(x - X) < r && Math.abs(y - Y) < r) out.push([+uv.getX(i).toFixed(3), +uv.getY(i).toFixed(3), +v3.z.toFixed(4)]);
  }
  return out;
};
/* tekshiruv (8-o'tish): joriy tasvirda yaqin ko'z va iyak nuqtalarining ekrandagi o'rni (kamera moslashi uchun) */
window.yuzEkran = () => ({koz: window.boshNuqta(yuzNuqta(-YUZ.kozX, YUZ.kozY)), iyak: window.boshNuqta(iyakNuqta()), burun: window.boshNuqta(burunNuqta())});
window.tutamUchlari = () => P.tutamlar.map(t => { const v = t.p[t.p.length - 1].clone().project(kamera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
/* 9-o'tish tekshiruvi (test/kamera_sinov9.mjs): obyekt holati -- har qismning namuna nuqtalari DUNYODA (bosh sirti, yaqin
   ko'z chizmasi, soch, bo'yin, kapyushon, plash, qor) va fon "tepasi". Poza va vaqt ushlanganda 3D izchil dunyoda kamera
   yurganda bular o'zgarmaydi; window.proj -- joriy kamera (linza siljishi bilan) proyeksiyasi, px. */
const _v = new THREE.Vector3();
function namuna(mesh, nmax, out = []) {
  mesh.updateMatrixWorld(true);
  const p = mesh.geometry.attributes.position, qd = Math.max(1, Math.floor(p.count / nmax));
  for (let i = 0; i < p.count; i += qd) { _v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld); out.push(_v.x, _v.y, _v.z); }
  return out;
}
window.obyekt = () => {
  const o = {teri: [], sochIch: [], soch: [], boyin: [], kapyushon: [], plash: [], koz: [], qor: []};
  for (const m of P.meshlar()) { const r = m.userData.rol; if (o[r]) namuna(m, r === 'soch' ? 19 : 400, o[r]); }   // soch: har tutamdan 19
  const c = kozKarta(BOSH.profilW); P.boshMesh.updateMatrixWorld(true);
  for (const [dx, dy] of [[0, 0], [0.12, 0], [-0.12, 0], [0, 0.06], [0, -0.06]]) {
    _v.set(...c.O.map((a, i) => a + c.T[i] * dx / c.k[0] + c.U[i] * dy / c.k[1])).applyMatrix4(P.boshMesh.matrixWorld); o.koz.push(_v.x, _v.y, _v.z);
  }
  qor.updateMatrixWorld(true); namuna(qor, 280, o.qor);
  o.tepa = BG_U.uBgUp.value.toArray();
  return o;
};
window.proj = (a) => {
  kamera.updateMatrixWorld(true); const out = [];
  for (let i = 0; i < a.length; i += 3) { _v.set(a[i], a[i + 1], a[i + 2]).project(kamera); out.push((_v.x + 1) / 2 * W, (1 - _v.y) / 2 * H, _v.z); }
  return out;
};
/* 10-o'tish (test/qism/): joriy tasvirda har qismning nomli nuqtalari ekranda -- [x, y (px, W x H), chuqurlik, ko'rinadimi
   (tashqi normal kameraga qaraganmi; soch/kapyushon yopishi -- rol renderidan)]. Ko'z holati (ochiq/yumuq) -- joriy poza
   (oldin material uYumuq dan o'qilardi -- rol style da u yo'q, yumuq kadrlarda ochiq ko'z nuqtalari chiqardi: node bilan 3.8 px). */
window.qismNuqtalar = () => {
  P.boshMesh.updateMatrixWorld(true); kamera.updateMatrixWorld(true);
  const yum = joriyYumuq > 0.5;                                        // ko'z holati -- poza (film), style ga bog'liq emas
  const M = P.boshMesh.matrixWorld, N3 = new THREE.Matrix3().getNormalMatrix(M), out = {};
  for (const [k, [p, n]] of Object.entries(qismNuqtalari(yum))) {
    const v = new THREE.Vector3(...p).applyMatrix4(M), nw = new THREE.Vector3(...n).applyMatrix3(N3).normalize();
    const kor = nw.dot(kamera.position.clone().sub(v)) > 0, s = v.clone().project(kamera);
    out[k] = [(s.x + 1) / 2 * W, (1 - s.y) / 2 * H, s.z, kor];
  }
  return out;
};
window.tayyor = true;
if (q.get('jonli')) { let f = 0; const loop = () => { window.kadr(f++ % (5 * FPS)); setTimeout(loop, 1000 / FPS); }; loop(); }
