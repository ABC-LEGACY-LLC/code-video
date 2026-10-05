/* PERSONAJ -- kodda noldan qurilgan (3D uslub). Dizayn (shakl, ranglar, yuz chizmasi) shu
   yerda; qanday SOYALANISHI (style) alohida -- src/style/*.js. Har mesh userData.rol bilan:
   style shu rolga material va kontur beradi.
   Ramka: bosh mahalliy fazoda +z -- yuz, +y -- tepa, +x -- personajning CHAP qo'li tomoni
   (qarab turganga o'ng). Butun personaj ildizda y atrofida +90 gradus buriladi: dunyoda
   +x ga (ekranda o'ngga) qaraydi, o'ng tomoni +z da (kamera shu tomonda). Birlik: bosh
   radiusi 1. */
import * as THREE from 'three';
import {ParametricGeometry} from 'three/addons/geometries/ParametricGeometry.js';

export const RANG = {                 // dizayn ranglari (yoritilgan holatdagi asos)
  teri: '#f1e3e1', soch: '#eceeff', kapTashqi: '#2a2c58', kapIchi: '#6a6ca6',
  plash: '#232550', boyin: '#e6d4d6',
};

/* seed li tasodif -- har render bir xil */
export function rng(s) { return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- BOSH (v3) ---------- */
/* Bosh -- aylanma jism (har balandlikda gorizontal kesim), old tomoni LOYIHALANGAN profil (o'z dizaynimiz).
   Audit 3 (yuz, 4-o'tish): v2 (sfera deformatsiyasi) pastki yuzni oldinga chiqara olmasdi: misolda burun, og'iz,
   iyak ko'zdan 0.1..0.4 birlik OLDINDA (ikki ko'rinishdan uchburchaklash, test/uchburchak.mjs), 3/4 da old kontur
   tik (x 130) va jag' osti gorizontal (y 108.5); bizda iyak old cheti 18 px, jag' osti 14..15 px orqada/yuqorida
   (taqqos zond, 1-shot). Faqat O'RIN va MASSA o'lchanadi, chizma bizniki.
   Kesim (balandlik y): old yarmi superellips -- o'rta chiziq chuqurligi zF, yarim en W, daraja p (p < 2 -- oldga
   uchliroq); orqa yarmi ellips -- orqa chegara zB. Kesim markazi (zF+zB)/2: jag'da oldinga siljiydi.
   Kalla (y >= 0.3) -- v2 sferasi (kalla, en, ensa). Iyak ostida (y < iyakY) kesim ellips yoy bilan yopiladi (tekis
   jag' osti). Ikki qatlam (v2 dagidek): katta shakl -- soyalash normallari; mayda -- burun va lablar (silueta). */
/* 9-O'TISH (bitta bosh, uch shotga birgalikda -- test/fit_bosh9.mjs): ko'z kartasi va pastki yuz surishi endi ko'rinishga/kadrga
   bog'liq emas (w 0, s 0). Pastki yuz kesimi (kozP, ogizZ/W/P, jagP, iyakZ/W) BARCHA kadrlarning yuz nishonlariga birgalikda
   moslandi (har kadr pozasi ichkarida): jami RMS 2.25 -> 1.77 px (22 kadr og'irligi bilan). Oldingi qiymatlar: kozP 2.646,
   ogizZ 1.005, ogizW 0.603, iyakZ 0.915, iyakW 0.173, ogizP 1.85, jagP 1.95. */
/* 10-O'TISH (qismlar alohida -- test/qism/, test/fit_bosh10.mjs): 9-o'tish moslashida iyak va jag' deyarli yo'q edi (1-shotda
   iyak old chetining bitta qatori; jag' ostining quloqqa tomon qismi hech qayerda) -- 1-shotda jag' osti quloqqa tomon misoldan
   17 px gacha past (tekis va uzun jag' tagi). Endi nishonlar: ko'zlar, qosh, og'iz, lab soyasi, burun uchi, iyak uchi, jag'
   osti izi (har ustun) va kontur (har qator), har kadr. Maqsad -- 1-shot (3/4, 11 kadr), 2- va 3-shot yomonlashmasligi
   jarimasi bilan: teng og'irlikda iyak 1-shotda 5-6 px tepaga ketardi (2-shotda misol profil yuzini boshiga nisbatan ~20 %
   kichik chizadi; 3-shotda yuz uzunligi pozaga bog'liq -- alohida). Natija: 1-shot RMS 4.03 -> 2.58 px (jag' izi 5.5 -> 1.6,
   eng katta 14.9 -> 5.0; iyak -2.2/-0.4 -> -1.6/-0.4); 1-shot pozalari ham ((x / 0.04 rad)^2 jarimasi bilan). 2- va
   3-shot pozasi oldingidek qoldirildi (film.js izohi) -- shu pozalarda pastki yuz 4.78 -> 4.89 va 8.49 -> 9.04 px. Oldingi qiymatlar: iyakY -1.18, iyakZ 0.974, iyakW 0.196, jagOrqa 0.692, jagOrqa2 -0.3,
   jagOrqa1 -0.40, ogizW 0.508, ogizZ 1.051, ogizP 1.666, jagP 1.682, yopish 0.07. */
export const BOSH = {
  kalla: 1.06,      // kalla balandligi (y > 0)
  en: 0.90,         // kalla eni
  ensa: 1.10,       // ensa bo'rtig'i
  kozZ: 0.924,       // ko'z chizig'ida (y -0.15) o'rta chiziq chuqurligi (burun ko'prigi)
  kozP: 2.847,        // ko'z chizig'ida kesim darajasi (ko'z qancha orqada: 2 -- ellips)
  ogizZ: 1.06,       // og'iz balandligida o'rta chiziq chuqurligi (katta shakl)
  ogizW: 0.554,      // og'iz balandligida yarim en (jag')
  iyakY: -1.173,    // iyak burchagi balandligi (yuz uzunligi)
  iyakZ: 1.032,      // iyak burchagi chuqurligi
  iyakW: 0.221,      // iyak burchagida yarim en
  jagOrqa: 0.685,    // iyak burchagi kesimining orqa chegarasi (z): jag' osti shu yerdan orqaga KO'TARILADI --
                    // 1-shotda (pastdan 25 gr) misolning jag' chizig'i gorizontal (y 108.5): tekis jag' osti pastdan
                    // ko'rinib, silueta 5..12 px pastga tushardi (fit_yuz3 1-urinish)
  jagOrqa2: 0.325,  // iyakdan yuqoriroq (tugun 0.84) kesimning orqa chegarasi (10-o'tish: -0.3 -> 0.325 -- jag' quloqqa ko'tariladi)
  jagOrqa1: -0.18,  // og'iz balandligida (tugun 0.66) kesimning orqa chegarasi (10-o'tish: parametr -- oldin qat'iy -0.40)
  ogizP: 1.812,     // og'iz balandligida kesim darajasi
  jagP: 1.302,      // iyakdan yuqoriroq (tugun 0.84) kesim darajasi
  yopish: 0.075,    // iyak ostida yopilish balandligi
  burun: 0.249,      // burun uchi chiqishi (mayda qatlam)
  burunY: -0.534,   // burun uchi balandligi
  burunOst: 0.134,   // burun ostining yumshoqligi (uchdan pastga tushish uzunligi): misol 3/4 da old kontur burun uchidan
                    // tik tushadi (kemtik yo'q) -- keskin tushishda burun ostida 5 px kemtik chiqardi
  lab: 0.022,       // lablar chiqishi
  surishZ: 0.40,    // PASTKI YUZ SURISHI (anime "chet ko'zdan oldin keladi"): ko'z ostidan pastki yuz shuncha OLDINGA, vazni
                    // surish (0..1). 4-o'tishda profil vazniga bog'langan edi (profilda to'liq). 5-o'tish sahna auditi:
                    // misol 2-shot old konturi (21 qator) qattiq profilga surishsiz tushadi -- RMS 1.29 px, bosh tekis
                    // (egilish -0.08); surish bilan kontur faqat bosh 15 gr EGILGANDA tushardi, biz esa -0.10 (tepaga) qo'ygan
                    // edik -> yuz ~20 gr tepaga qaragan chiqdi ("bizniki yonga/tepaga qaraydi, misol pastga"). Profilda
                    // misolning farqi pastki yuzda emas, KO'ZDA (KOZ_PROFIL). Surish faqat tez burilishda (1-shot 10-11).
  surish: 0.0,
  profilW: 0.0,     // profil vazni (0 -- 3/4, 1 -- profil): yaqin ko'z chizmasi sirt bo'ylab yon tomonga ko'chadi (kozKarta)
};

/* Fritsch-Carlson monoton kubik: tugunlar y bo'yicha (o'suvchi), qiymatlar */
function monoton(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
/* sfera kesimi (kalla, v2): y balandlikda [zF, W, zB] */
function sferaKesim(y) {
  const B = BOSH, y0 = Math.min(1, y / B.kalla), c = Math.sqrt(Math.max(0, 1 - y0 * y0));
  return [c * (0.94 + 0.06 * (1 - y0)), B.en * c, -B.ensa * c];
}
/* profil: BOSH dan tugunlar -> y -> {zF, W, zB, p}. Pastki tugunlar y_k = -0.15 + (iyakY + 0.15) * f */
let _profil = null, _profilKalit = '';
function profil() {
  const B = BOSH, kalit = JSON.stringify(B);
  if (_profil && kalit === _profilKalit) return _profil;
  const yk = f => -0.15 + (B.iyakY + 0.15) * f, pz = B.surishZ * B.surish;
  const s45 = sferaKesim(0.45), s30 = sferaKesim(0.30);
  const T = [   // [y, zF, W, zB, p] -- yuqoridan pastga
    [0.45, ...s45, 2.0],
    [0.30, ...s30, 2.0],
    [0.10, 0.5 * (s30[0] + B.kozZ) + 0.005, 0.90, -1.095, 0.5 * (2.0 + B.kozP)],
    [-0.15, B.kozZ, 0.90, -1.08, B.kozP],
    [yk(0.25), 0.5 * (B.kozZ + B.ogizZ) + 0.6 * pz, 0.86, -0.96, B.kozP],
    [yk(0.66), B.ogizZ + pz, B.ogizW, B.jagOrqa1, B.ogizP],
    [yk(0.84), 0.5 * (B.ogizZ + B.iyakZ) + 0.01 + pz, 0.5 * (B.ogizW + B.iyakW) + 0.02, B.jagOrqa2, B.jagP],
    [B.iyakY, B.iyakZ + pz, B.iyakW, B.jagOrqa + pz, 2.1],
  ].reverse();
  const ys = T.map(t => t[0]), f = [1, 2, 3, 4].map(j => monoton(ys, T.map(t => t[j])));
  _profil = y => y >= 0.30 ? {zF: sferaKesim(y)[0], W: sferaKesim(y)[1], zB: sferaKesim(y)[2], p: 2}
                           : {zF: f[0](y), W: f[1](y), zB: f[2](y), p: f[3](y)};
  _profilKalit = kalit;
  return _profil;
}
/* kesim nuqtasi: markaz atrofida qutb burchagi ph (old +z dan) -> [x, z] */
function kesimNuqta(K, ph, k = 1) {
  const cz = 0.5 * (K.zF + K.zB), s = Math.sin(ph), c = Math.cos(ph);
  if (K.W < 1e-6 || K.zF - cz < 1e-6) return [0, cz];              // qutb (kesim nuqtaga aylangan)
  let r;
  if (c >= 0) { const a = K.zF - cz; r = Math.pow(Math.pow(Math.abs(s) / K.W, K.p) + Math.pow(c / a, K.p), -1 / K.p); }
  else { const b = cz - K.zB; r = 1 / Math.sqrt(s * s / (K.W * K.W) + c * c / (b * b)); }
  return [r * s * k, cz + r * c * k];
}
/* mayda qatlam: burun (o'rta chiziqda qirra, uchi yumaloq, osti keskin) va lablar -- faqat z ga */
export function maydaZ(x, y) {
  const B = BOSH, yb = -0.18, yt = B.burunY;
  const ko = sm(yb, yt, y), rid = Math.pow(ko, 1.4) * sm(yt - B.burunOst, yt - 0.005, y);
  const en = 0.045 + 0.05 * ko;
  let dz = B.burun * rid * Math.exp(-Math.pow(x / en, 2));
  const oy = YUZ.ogizY;
  dz += B.lab * (Math.exp(-Math.pow((y - oy - 0.045) / 0.035, 2)) + 0.8 * Math.exp(-Math.pow((y - oy + 0.065) / 0.04, 2))) * Math.exp(-Math.pow(x / 0.16, 2));
  return dz;
}
/* bosh sirti: birlik sferadagi yo'nalish (x, y, z) -> sirt nuqtasi (radius r bo'lsa r ga ko'paytiriladi) */
export function boshShakli(x, y, z, mayda = false) {
  const B = BOSH, rho = Math.hypot(x, y, z) || 1, al = Math.asin(Math.max(-1, Math.min(1, y / rho))), ph = Math.atan2(x, z);
  const P = profil();
  let yy, k = 1, K;
  if (al >= 0) { yy = B.kalla * Math.sin(al); K = P(yy); }
  else {
    const t = -al / (Math.PI / 2), tK = 0.86;
    if (t <= tK) { yy = B.iyakY * t / tK; K = P(yy); }
    else { const s = (t - tK) / (1 - tK); yy = B.iyakY - B.yopish * Math.sin(s * Math.PI / 2); k = Math.cos(s * Math.PI / 2); K = P(B.iyakY); }
  }
  const [xx, zz] = kesimNuqta(K, ph, k);
  let zo = zz;
  if (mayda && Math.cos(ph) > 0) zo += maydaZ(xx, yy) * k;
  return [xx * rho, yy * rho, zo * rho];
}

/* yuzNuqta: tekis proyeksiyadagi (x, y) -- old sirtning shu nuqtasi (kesimda x bo'yicha bisection, mayda bilan).
   iyakNuqta: o'rta chiziqda oldinga-pastga (45 gr) eng chetki nuqta (iyak burchagi). burunNuqta: burun uchi. */
export function yuzNuqta(x, y) {
  const K = profil()(y);
  let a = 0, b = Math.PI / 2; const sx = Math.sign(x) || 1, ax = Math.abs(x);
  for (let i = 0; i < 50; i++) { const m = 0.5 * (a + b); if (kesimNuqta(K, m)[0] < ax) a = m; else b = m; }
  const z = kesimNuqta(K, 0.5 * (a + b))[1];
  return [x, y, z + maydaZ(x, y)];
}
function ortaChiziq(n = 800) {                       // o'rta chiziq (x = 0, old) nuqtalari, mayda bilan
  const L = [];
  for (let i = 0; i <= n; i++) { const al = -Math.PI / 2 + Math.PI * i / n; L.push(boshShakli(0, Math.sin(al), Math.cos(al) + 1e-9, true)); }
  return L;
}
export function iyakNuqta() {
  let eng = null;
  for (const p of ortaChiziq()) if (p[2] > 0.2 && (!eng || p[2] - p[1] > eng[2] - eng[1])) eng = p;
  return eng;
}
export function burunNuqta() {
  let eng = null;
  for (const p of ortaChiziq()) if (Math.abs(p[1] - BOSH.burunY) < 0.2 && (!eng || p[2] > eng[2])) eng = p;
  return eng;
}
/* 10-o'tish: QISMLAR -- har qismning NOMLI nuqtalari bosh fazosida (o'lchash uchun: test/qism/). Foydalanuvchi: "qaysi biri
   soch, qaysi biri burun, ko'z, qosh, og'iz, daha -- ajratib ol; boshni og'izgacha o'lchab dahani qoldirma". Ko'z va qosh --
   yuz chizmasidagi shaklning o'z sonlari (yuzKanvas: ochiq ko'z teshigi, yumuq kiprik chizig'i, qosh egri chizig'i), yaqin
   ko'z va qoshi -- sirtdagi karta orqali (kozNuqta, chizmadagidek), uzoq ko'z -- tekis proyeksiya. Og'iz, lab soyasi --
   chizma; burun uchi, iyak uchi -- sirt (mayda qatlam bilan); iyak osti -- o'rta chiziqning eng past nuqtasi; jag' burchagi
   -- iyakdan yuqoridagi tugun (y = yk(0.84)) kesimining eng keng yon nuqtasi. Har nuqta bilan tashqi normal (ko'rinish uchun). */
export function qismNuqtalari(yumuq = false) {
  const Y = YUZ, W = Y.kozW, H = Y.kozH, w = BOSH.profilW, e = 1e-3;
  const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(t => t / l); };
  const yuzN = (x, y) => {                                     // old sirt nuqtasi va normali (tekis proyeksiya parametri)
    const p = yuzNuqta(x, y), a = yuzNuqta(x + e, y), b = yuzNuqta(x - e, y), c = yuzNuqta(x, y + e), d = yuzNuqta(x, y - e);
    const tx = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], ty = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    return [p, nrm([tx[1] * ty[2] - tx[2] * ty[1], tx[2] * ty[0] - tx[0] * ty[2], tx[0] * ty[1] - tx[1] * ty[0]])];
  };
  const kk = kozKarta(w);
  const yaqin = (lx, ly) => [kozNuqta(w, -lx, ly), kk.N];        // +lx -- tashqi tomon (chizmadagidek)
  const uzoq = (lx, ly) => yuzN(Y.kozX + lx, Y.kozY + ly);
  const n = {};
  for (const [nom, f] of [['yaqin', yaqin], ['uzoq', uzoq]]) {
    if (yumuq) {                                                // kiprik chizig'i: (-1.15W, -0.10H) -> (0.05W, -0.22H) -> (1.30W, 0)
      n['koz_' + nom] = f(0.06 * W, -0.135 * H); n['koz_' + nom + '_ichki'] = f(-1.15 * W, -0.10 * H); n['koz_' + nom + '_tashqi'] = f(1.30 * W, 0);
    } else {
      n['koz_' + nom] = f(0.08 * W, -0.12 * H); n['koz_' + nom + '_ichki'] = f(-0.95 * W, 0.20 * H); n['koz_' + nom + '_tashqi'] = f(1.05 * W, 0.55 * H);
      n['koz_' + nom + '_tepa'] = f(0.20 * W, 0.93 * H); n['koz_' + nom + '_past'] = f(-0.10 * W, -1.0 * H);
    }
    n['qosh_' + nom + '_ichki'] = f(-0.95 * W, Y.qoshY); n['qosh_' + nom + '_orta'] = f(0.075 * W, Y.qoshY + 0.105 * H); n['qosh_' + nom + '_tashqi'] = f(1.15 * W, Y.qoshY - 0.18 * H);
  }
  const bu = burunNuqta(), iu = iyakNuqta();
  n.burun_kopri = yuzN(0, -0.18); n.burun_uchi = [bu, yuzN(0, bu[1])[1]]; n.burun_osti = yuzN(0, BOSH.burunY - BOSH.burunOst);
  n.ogiz_yaqin = yuzN(-Y.ogizEn, Y.ogizY + 0.004); n.ogiz = yuzN(0, Y.ogizY - 0.003); n.ogiz_uzoq = yuzN(Y.ogizEn, Y.ogizY + 0.004);
  n.lab_soyasi = yuzN(0, Y.ogizY + Y.labSoyaY);
  n.iyak_uchi = [iu, nrm([0, -1, 1])]; n.iyak_osti = [boshShakli(0, -1, 1e-6, true), [0, -1, 0]];
  const yj = -0.15 + (BOSH.iyakY + 0.15) * 0.84, K = profil()(yj), cz = 0.5 * (K.zF + K.zB);
  n.jag_yaqin = [[-K.W, yj, cz], [-1, 0, 0]]; n.jag_uzoq = [[K.W, yj, cz], [1, 0, 0]];
  n.kalla_tepa = [boshShakli(0, 1, 1e-6), [0, 1, 0]];
  return n;
}

/* PROFIL KO'ZI (5-o'tish, anime profil usuli) -- misolning profil ko'rinishida (2-shot) ko'z bizning 3/4 o'rnidan
   17.5 px (0.6 birlik) ORQADA va 5 px YUQORIDA: bosh yon tomonida, chakka oldida. Bitta qattiq bosh ikkala
   ko'rinishni bera olmaydi (anime chizmasi ko'rinishga qarab ko'zni ko'chiradi). Oldingi yechim (pastki yuzni oldinga
   surish) yuzni tepaga og'dirardi. Endi yaqin ko'z CHIZMASI sirt bo'ylab ko'chadi: mahalliy karta (O -- ko'z markazi,
   T -- chizmaning gorizontal o'qi (burun tomonga), U -- tik o'qi, k -- chizma birligi / sirt birligi). w = 0 -- tekis
   proyeksiyaning o'zi (3/4, 1-shot o'lchovlari o'zgarmaydi), w = 1 -- misoldan o'lchangan profil o'rni.
   O'lchov (test/sahna2_fit.mjs, el -5, bosh tekis, egilish -0.08): misol yumuq ko'z kiprik chizig'i (133, 77.5) ->
   (144, 80) bosh sirtiga teskari proyeksiya: orqa uch (-0.881, 0.003, 0.226), markaz (-0.855, -0.040, 0.362),
   old uch (-0.791, -0.097, 0.544) -> sirt bo'ylab uzunligi 0.345 (bizning yumuq chiziq 0.233 -> kx 0.675), oldinga
   16.9 gr pastga og'gan (bizniki 3 gr -> og'ish 13.9 gr), silindrik burchak -67.1 gr, markaz y -0.040 (yumuq chiziq
   ko'z markazidan 0.018 past -> ko'z markazi y -0.022). ky -- chiziq qalinligi (misol 2..3 px, bizniki 1.6 px). */
export const KOZ_PROFIL = {y: -0.022, phi: -67.1, kx: 0.675, ky: 0.85, ogish: 13.9};
function kesimYon(y, phi) {                    // y balandlikdagi kesimda silindrik burchagi phi (rad, +z dan +x ga) bo'lgan nuqta
  const K = profil()(y), ang = ph => { const [x, z] = kesimNuqta(K, ph); return Math.atan2(x, z); };
  let a = 0, b = (phi < 0 ? -1 : 1) * Math.PI * 0.95;
  for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b); if (Math.abs(ang(m)) < Math.abs(phi)) a = m; else b = m; }
  const ph = 0.5 * (a + b), [x, z] = kesimNuqta(K, ph);
  return {x, z, ph, K};
}
const _nrm = v => { const l = Math.hypot(...v) || 1; return v.map(t => t / l); };
const _crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function kozKarta(w) {
  const KP = KOZ_PROFIL, O0 = yuzNuqta(-YUZ.kozX, YUZ.kozY);
  const phi0 = Math.atan2(O0[0], O0[2]), phi = phi0 + w * (KP.phi * Math.PI / 180 - phi0), y = YUZ.kozY + w * (KP.y - YUZ.kozY);
  const s = kesimYon(y, phi), O = [s.x, y, s.z + maydaZ(s.x, y)];
  const e = 1e-3, [x2, z2] = kesimNuqta(s.K, s.ph + (s.ph < 0 ? e : -e));            // oldga (burun tomonga)
  let T = _nrm([x2 - s.x, 0, z2 - s.z]);
  const s2 = kesimYon(y + e, phi); let U = _nrm([s2.x - s.x, e, s2.z - s.z]);
  const N = _nrm(_crs(T, U)); U = _nrm(_crs(N, T));
  const a = w * KP.ogish * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const T2 = T.map((t, i) => ca * t - sa * U[i]), U2 = T.map((t, i) => sa * t + ca * U[i]);
  return {O, T: T2, U: U2, N, k: [1 + w * (KP.kx - 1), 1 + w * (KP.ky - 1)]};
}
/* moslash uchun: yaqin ko'z chizmasidagi nuqta (markazdan chizma birligida dx, dy) bosh fazosida -- karta bo'yicha */
export function kozNuqta(w, dx = 0, dy = 0) {
  const c = kozKarta(w);
  return c.O.map((o, i) => o + c.T[i] * dx / c.k[0] + c.U[i] * dy / c.k[1]);
}

function boshGeo(surish = 0) {
  const eskiS = BOSH.surish; BOSH.surish = surish;
  const g = new THREE.SphereGeometry(1, 200, 200);
  const p = g.attributes.position, katta = g.clone(), pk = katta.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x0 = p.getX(i), y0 = p.getY(i), z0 = p.getZ(i);
    pk.setXYZ(i, ...boshShakli(x0, y0, z0, false));
    p.setXYZ(i, ...boshShakli(x0, y0, z0, true));
  }
  katta.computeVertexNormals();
  g.setAttribute('normal', katta.attributes.normal);     // soyalash -- katta shakldan (burun/lab cel chegarasini buzmaydi)
  BOSH.surish = eskiS;
  return g;
}
/* moslash/o'lchash uchun: bosh sirtining nuqtalari (render yo'q) -- silueta (test/fit_yuz3.mjs) */
export function boshNuqtalari(nU = 120, nV = 120, mayda = true) {
  const out = [];
  for (let j = 0; j <= nV; j++) {
    const al = -Math.PI / 2 + Math.PI * j / nV;
    for (let i = 0; i < nU; i++) { const ph = -Math.PI + 2 * Math.PI * i / nU; out.push(boshShakli(Math.cos(al) * Math.sin(ph), Math.sin(al), Math.cos(al) * Math.cos(ph), mayda)); }
  }
  return out;
}

/* ---------- YUZ CHIZMASI (kanvas; bosh fazosida tekis proyeksiya: u = .5 + x/2.2, v = (y + 1.45)/2.2) ---------- */
/* v3: iyak y -1.33 gacha tushadi -- proyeksiya pastga kengaytirildi (v2: v = .5 + (y+.2)/2, y > -1.2) */
export const YUZ_UV = {sx: 2.2, y0: -1.45, sy: 2.2};
const YS = 1024;
/* YUZ -- yuz chizmasi o'rinlari va o'lchamlari (bosh fazosida, tekis proyeksiya koordinatalari). Chizma bizniki;
   o'rin/o'lcham misoldan o'lchanadi (test/uchburchak.mjs, test/fit_yuz3.mjs). */
export const YUZ = {kozX: 0.313, kozY: -0.205, kozW: 0.095, kozH: 0.13, qoshY: 0.20, qoshQalin: 0.045,
  ogizY: -0.876, ogizEn: 0.11, ogizQalin: 0.022, labSoyaY: -0.13,
  rang: {qosh: '#2a283f', qovoq: '#0a0918', burma: 'rgba(28,26,48,0.8)', sklera: '#4a4964', kamalak: ['#08081c', '#15163a', '#30356a'],
         qorachiq: '#06061a', nur: '#9ea2de', nur2: '#6d72b8', yosh: '#a9abe6', teri: '#39374e', ogiz: '#17152a', labSoya: '#1d1b31', burunYoy: '#8a8ac4'}};

function yuzKanvas(holat) {                           // holat: 'ochiq' | 'yarim' | 'yumuq'
  /* 4-o'tish: chizma qayta loyihalandi -- o'lcham, ton va joylashuv misoldan (3-tasvir, 320 px, L jadvali):
     yaqin ko'z qorong'i massasi 11 px (qovoq chizig'i, eng keng) x 10 px, pastga torayadi (6..7 px) -> ~0.21 x 0.20
     birlik; oq qism deyarli ko'rinmaydi (tungi sahna: ko'z soyada, L 3..16 yuqorida, 22..43 pastda); qovoq chizig'i
     qalin (2..3 px); ko'z ustida qorong'i qosh tasmasi (3 px, ko'zdan ~10 px yuqorida, 14 px eni); og'iz -- qorong'i
     chiziq (L 37..49, 10 px), ostida lab soyasi (L 23..38, 3 px). Oldingi ko'z ~2 barobar katta, oq sklera bilan edi.
     Ranglar -- yakuniy (sRGB), style ularni yorug'lik bilan 0.8..1.0 ga ko'paytiradi. */
  const yumuq = holat === 'yumuq', yarim = holat === 'yarim';
  const c = document.createElement('canvas'); c.width = c.height = YS;
  const g = c.getContext('2d');
  const K = YS / YUZ_UV.sx;                                  // kanvas px / birlik
  const P = (x, y) => [(0.5 + x / YUZ_UV.sx) * YS, (1 - (y - YUZ_UV.y0) / YUZ_UV.sy) * YS];
  const R = YUZ.rang;
  const koz = (s) => {                                       // s = +1 personajning chap ko'zi (x > 0), -1 o'ng
    const [cx, cy] = P(YUZ.kozX * s, YUZ.kozY);
    const W = YUZ.kozW, H = YUZ.kozH;
    g.save(); g.translate(cx, cy); g.scale(s * K, -K);       // mahalliy: birlik, +x -- tashqi tomon, +y -- yuqoriga
    g.lineCap = 'round'; g.lineJoin = 'round';
    // qosh: qorong'i tasma, ko'zdan yuqorida, tashqi uchi pastroq
    g.lineWidth = YUZ.qoshQalin; g.strokeStyle = R.qosh;
    g.beginPath(); g.moveTo(-0.95 * W, YUZ.qoshY); g.quadraticCurveTo(0.05 * W, YUZ.qoshY + 0.30 * H, 1.15 * W, YUZ.qoshY - 0.18 * H); g.stroke();
    const teshik = () => {                                   // ko'z teshigi: tepasi keng va tekis, pasti torayadi
      g.beginPath(); g.moveTo(-0.95 * W, 0.20 * H);
      g.bezierCurveTo(-0.75 * W, 0.80 * H, 0.35 * W, 1.02 * H, 1.05 * W, 0.55 * H);
      g.bezierCurveTo(0.95 * W, -0.35 * H, 0.45 * W, -1.02 * H, -0.10 * W, -1.0 * H);
      g.bezierCurveTo(-0.60 * W, -0.98 * H, -0.92 * W, -0.40 * H, -0.95 * W, 0.20 * H);
      g.closePath();
    };
    if (yumuq) {
      // yumuq: qalin kiprik chizig'i (pastga egilgan), tashqi uchida kichik uch; ustida ingichka burma
      // misol 10-11: yumuq ko'z -- qalin qorong'i chiziq (3 px, L 5..20), ochiq ko'zdan kengroq (15 px), ustida och burma
      g.lineWidth = 0.42 * H; g.strokeStyle = R.qovoq;
      g.beginPath(); g.moveTo(-1.15 * W, -0.10 * H); g.quadraticCurveTo(0.05 * W, -0.22 * H, 1.30 * W, 0.0); g.stroke();
      g.lineWidth = 0.16 * H; g.beginPath(); g.moveTo(1.20 * W, 0.0); g.lineTo(1.50 * W, -0.12 * H); g.stroke();
      g.lineWidth = 0.08 * H; g.strokeStyle = R.burma;
      g.beginPath(); g.moveTo(-0.80 * W, 0.45 * H); g.quadraticCurveTo(0.10 * W, 0.28 * H, 1.05 * W, 0.50 * H); g.stroke();
    } else {
      g.save(); teshik(); g.clip();
      g.fillStyle = R.sklera; g.fillRect(-2 * W, -2 * H, 4 * W, 4 * H);
      const gr = g.createLinearGradient(0, H, 0, -H);        // kamalak: tepasi deyarli qora, pasti ko'kish
      gr.addColorStop(0, R.kamalak[0]); gr.addColorStop(0.55, R.kamalak[1]); gr.addColorStop(1, R.kamalak[2]);
      g.beginPath(); g.ellipse(0.08 * W, -0.12 * H, 0.80 * W, 1.05 * H, 0, 0, 7); g.fillStyle = gr; g.fill();
      g.beginPath(); g.ellipse(0.08 * W, -0.02 * H, 0.34 * W, 0.55 * H, 0, 0, 7); g.fillStyle = R.qorachiq; g.fill();
      const qs = g.createLinearGradient(0, H, 0, 0.1 * H);   // qovoq soyasi ko'z olmasi ustida
      qs.addColorStop(0, 'rgba(6,6,20,0.85)'); qs.addColorStop(1, 'rgba(6,6,20,0)');
      g.fillStyle = qs; g.fillRect(-2 * W, 0.1 * H, 4 * W, 2 * H);
      if (!yarim) { g.beginPath(); g.ellipse(0.30 * W, 0.42 * H, 0.13 * W, 0.10 * H, 0, 0, 7); g.fillStyle = R.nur; g.fill(); }
      g.beginPath(); g.ellipse(-0.30 * W, -0.55 * H, 0.07 * W, 0.05 * H, 0, 0, 7); g.fillStyle = R.nur2; g.fill();
      if (yarim) { g.fillStyle = R.teri; g.fillRect(-2 * W, 0.08 * H, 4 * W, 2 * H); }   // qovoq yarmigacha tushgan
      g.restore();
      if (!yarim) {                                          // yosh ko'lmagi: ichki-pastki qirrada yorug' o'roq (misol 1..9: L 100..124)
        g.lineWidth = 0.13 * H; g.strokeStyle = R.yosh;
        g.beginPath(); g.moveTo(-0.30 * W, -0.97 * H); g.bezierCurveTo(-0.70 * W, -0.92 * H, -0.95 * W, -0.45 * H, -1.02 * W, 0.05 * H); g.stroke();
        g.beginPath(); g.ellipse(-1.02 * W, -0.40 * H, 0.16 * W, 0.20 * H, 0, 0, 7); g.fillStyle = R.yosh; g.fill();
      }
      // yuqori qovoq chizig'i: qalin, tashqi uchida pastga-tashqariga uch
      g.lineWidth = 0.30 * H; g.strokeStyle = R.qovoq;
      g.beginPath();
      if (yarim) { g.moveTo(-0.95 * W, 0.10 * H); g.quadraticCurveTo(0.05 * W, -0.05 * H, 1.05 * W, 0.12 * H); }
      else { g.moveTo(-0.95 * W, 0.20 * H); g.bezierCurveTo(-0.75 * W, 0.80 * H, 0.35 * W, 1.02 * H, 1.05 * W, 0.55 * H); }
      g.stroke();
      g.lineWidth = 0.14 * H; g.beginPath();
      if (yarim) { g.moveTo(0.95 * W, 0.12 * H); g.lineTo(1.30 * W, -0.05 * H); } else { g.moveTo(0.95 * W, 0.60 * H); g.lineTo(1.30 * W, 0.30 * H); }
      g.stroke();
    }
    g.restore();
  };
  koz(1); koz(-1);
  // og'iz -- qorong'i chiziq; ostida lab soyasi (o'rta chiziqda qisqa)
  const oy = YUZ.ogizY;
  g.lineCap = 'round'; g.strokeStyle = R.ogiz; g.lineWidth = YUZ.ogizQalin * K;
  const [ax, ay] = P(-YUZ.ogizEn, oy + 0.004), [bx, by] = P(0, oy - 0.010), [ex, ey] = P(YUZ.ogizEn, oy + 0.004);
  g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(bx, by, ex, ey); g.stroke();
  /* burun qirrasi: misolda uzoq ko'z ostidan burun uchiga tushadigan yorug' egri chiziq (L 82..113, 1-shotda hamma
     tasvirda; profilda ham burun qirrasi yorug') -- 1-shot kamerasida bu BURUN QIRRASI: o'rta chiziq y -0.34..-0.52
     ekranda (117.6, 54.5) -> (129.3, 59.9), misol (120, 56) -> (130.5, 60). Silueta rimi 3D da juda ingichka (yuza
     pikseldan kam) -- chizma: qirra ustida ingichka yorug' chiziq (uchiga tomon yo'g'onroq) */
  g.strokeStyle = R.burunYoy; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const t0 = i / 8, t1 = (i + 1) / 8, y0 = -0.34 - 0.18 * t0, y1 = -0.34 - 0.18 * t1;
    const [ax, ay] = P(-0.006, y0), [bx, by] = P(-0.006, y1);           // qirra ustida (uzoq tomonida -- 3/4 da qirra ortida qoladi)
    g.lineWidth = (0.026 + 0.018 * t1) * K; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  }
  g.strokeStyle = R.labSoya; g.lineWidth = 0.045 * K;
  const [lx, ly] = P(-0.045, oy + YUZ.labSoyaY), [rx, ry] = P(0.045, oy + YUZ.labSoyaY);
  g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/* ---------- SOCH: tutamlar (tasma-naycha), prujina-suyak fizikasi ---------- */
/* har tutam: ildiz bosh sirtida (bosh fazosida), dam holatidagi zanjir nuqtalari (bosh fazosida).
   Fizika dunyo fazosida: ildiz boshga bog'langan, qolganlar -- dam holatiga tortiluvchi prujina,
   og'irlik, shamol, qarshilik, uzunlik cheklovi, bosh sferasi bilan to'qnashuv (VRM SpringBone kabi). */
/* SOCH (6-o'tish) -- dizayn bizniki (uchli tutamlar); misoldan o'lchanadigani MASSA va QOPLASH, ikkala tomonda bir
   xil kod (test/audit_misol/soch_qoplash.py -- misolning yorug' sochi bizda NIMAGA tushadi; soch_olch.py -- M1..M4).
   Oldingi soch boshga yopishgan yupqa qalpoq edi: 1-shotda misol yorug' massasining atigi 9 % i biznikiga to'g'ri
   kelardi (qolgani bizda teri 33.5 %, kapyushon 27.6 %, ichki qopqoq 14 %). Misolning massasi bosh fazosida (shot
   kameralari, node proyeksiya): 2-shotda (profil, bosh tekis) keng massa tojdan ~1 birlik yuqorida (y ~2.0, alohida
   uchlar 2.6 gacha), peshona balandligida (y 0.5..0.7) peshonadan ~1 birlik OLDINDA (z 1.9), qosh balandligida z 1.3,
   ko'z qatorida yuz oldi ochiq; yaqin yon massa ko'z ortida, iyak ostigacha. Shamol orqadan (qor o'ngga-tepaga) --
   soch oldinga-tepaga taralgan yelpig'ich. 1-shotda (3/4, pastdan) peshona ko'zdan 8..11 px yuqorigacha sochda, yaqin
   ko'z ortida 1..9 px teri, uzoq konturdan tashqarida oldinga taralgan uchlar; 3-shotda (bosh 39 gr egilgan) yorug'
   massa yuz OLDIDA. Guruhlar: YELPIG'ICH (toj va uzun peshona -- ko'tarilib oldinga-pastga egiladi), QISQA peshona
   (qoshgacha yotadi), YAQIN yon (ko'rinishga bog'liq), UZOQ yon (oldinga taralgan), ORQA (kapyushon ichida).
   Fizika: dam shakli og'irlik va shamol tomon egiladi (personaj.egilganDam); soyalash massa normali bilan
   (tutamGeometriya, aSochN). 9-o'tish: yaqin tutamlar va qisqa peshona -- bitta dam shakli (ko'rinish vazni olib tashlandi). */
export const SOCH = {
  /* YELPIG'ICH (toj + uzun peshona): k = 0 (toj orqasi) .. 1 (soch chizig'i); har k da lat ta tutam (yon -phLat..phLat).
     Uchlari misolning 2-shot old/tepa chegarasi bo'ylab (bosh fazosi, [y, z]) -- qatorlardan o'lchangan; egilish
     nuqtasi ildizdan H yuqorida (tutam avval ko'tariladi, keyin oldinga-pastga tushadi: hajm) */
  yel: {kn: 7, lat: 4, thOrqa: -0.30, thOld: 0.55, phLat: 1.0, H0: 0.70, H1: 0.35, en0: 0.80, en1: 0.65, yoyX: 0.20,
        osil0: 0.12, osil1: 0.45,       // oldingilari og'irroq osiladi: 3-shotda (bosh egilgan) peshona sochi yuz OLDIDA
        uch: [[2.00, 1.05], [1.80, 1.40], [1.50, 1.65], [1.25, 1.80], [1.05, 1.85], [0.90, 1.75], [0.72, 1.50]]},
  /* QISQA peshona: 1-shotda misol peshona sochi yaqin ko'zdan 8..11 px yuqorida tugaydi (y ~ -0.03; yorug' qismi
     26..37 qatorgacha, pastrog'i soyada); profilda (w=1) yaqin tomondagilari yuqorida (yUchP + yUchPYon * a) */
  qisqa: {n: 7, phMax: 0.85, th: 0.60, yUch: -0.30, yUchYon: 0.05, yUchP: 0.25, yUchPYon: 0.45, off: 0.08, en: 0.60},
  /* YAQIN yon massa -- ko'rinishga bog'liq (anime usuli, 5-o'tishdagi ko'z kartasi kabi): 3/4 da (w=0) yuz yonida
     TIK osiladi (x0 + j dx, z -- yuz sirti + off): misol 1-shotda yorug' massa ko'zdan chapda x 70..90 (bosh x
     -0.45..-0.7), 94-qatorgacha; profilda (w=1) bosh yonida, profil ko'zidan orqada (misol 2-shot: ko'z qatorida old
     cheti z -0.14, jag'da +0.33, orqasi -0.6, pastki uchi y -1.2) */
  /* 10-o'tish SINOVI (qabul qilinmadi): yaqin tutam kesim bo'ylab (yon(), phU/pk) + qoplash bilan moslash (test/fit_soch9b.mjs,
     test/soch10_fit.json): qoplash 1/2/3-shot ~14 / 18 / 13 % -> 2 / 3 / 0.2 %, 2-shot IoU 0.29 -> 0.46, lekin 1-shotda (11
     kadr) tutam yonoq chetidan yo'qoldi (IoU 0.26 -> 0.19; ustma-ust niqobda 1-9 kadrda 9-o'tish tutami misolnikiga to'g'ri
     tushadi, 10-11 da -- bosh burilganda -- yuzga o'tadi, misolniki yuz chetida qoladi). Tutam 9-o'tishdagidek (tik()). */
  yaqin: {n: 3, x0: -0.45, dx: -0.06, dxU: -0.29, dzU: 0.30, yIldiz: 0.50, yUch0: -1.00, off: 0.08, en0: 0.30, osil: 0.50, shK: 0.0,
          ph0: -1.75, ph1: -2.45, th: 1.00, yUch: -1.15, zOld: -0.20, zOrqa: -0.65, xUch: -1.00, en: 0.42},
  /* UZOQ yon: uzoq chakkadan OLDINGA taralgan (misol 1-shotda yuzning uzoq konturidan 15..25 px tashqarida yorug' soch,
     26..56-qatorlarda pastga-o'ngga; bosh fazosida x ~1.0, y 0..0.4, z 0.8..1.2 -- node proyeksiyasi) */
  uzoq:  {n: 3, ph0: 1.20, ph1: 1.75, th: 0.95, yUch: 0.20, dyUch: 0.12, zOld: 1.20, zOrqa: 0.85, xUch: 1.02, en: 0.70},
  /* ichki qopqoq (qorong'i -- tutamlar orasidagi soya): soch chizig'i o'rtada past (peshona qoshgacha soch ostida),
     chakkada baland: chiz = c0 + c1 |x|^1.5 (yo'nalish y) */
  qopqoq: {c0: 0.10, c1: 0.50},
  fizika: {osil: 0.12, shK: 0.12},     // og'irlik/shamol egilishi (personaj.egilganDam); guruh o'zinikini berishi mumkin
  massaN: {k: 0.50, dy: 0.4},          // massa normali: radial ulush, markaz balandligi (bosh fazosida)
};
const MN = SOCH.massaN;
export function tutamlarDizayni() {
  const R = rng(20260924), T = [], B = BOSH;
  const qosh = (ildiz, yol, en, n = 7) => {           // yol: [dx,dy,dz] qadamlar (bosh fazosida)
    const pts = [ildiz]; let p = ildiz;
    for (const d of yol) { p = [p[0] + d[0], p[1] + d[1], p[2] + d[2]]; pts.push(p); }
    T.push({dam: pts, dam0: pts, dam1: pts, en, gr: 'orqa'});
  };
  const sfera = (th, ph, r = 1.02) => [r * Math.sin(th) * Math.sin(ph), r * Math.cos(th), r * Math.sin(th) * Math.cos(ph)];
  // bosh sirtidagi nuqta: tepadan th, old (+z) dan ph; sirtdan off tashqarida
  const sirt = (th, ph, off = 0) => {
    const s = boshShakli(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph), false), r = Math.hypot(...s) || 1;
    return s.map(v => v * (r + off) / r);
  };
  // nuqta bosh ichida bo'lsa (shu balandlikdagi kesim + min) -- kesim markazidan tashqariga suriladi
  const tashqari = (pts, min = 0.05) => pts.map((p, i) => {
    if (i === 0 || p[1] > B.kalla || p[1] < B.iyakY) return p;
    const K = profil()(p[1]), cz = 0.5 * (K.zF + K.zB), ph = Math.atan2(p[0], p[2] - cz);
    const [bx, bz] = kesimNuqta(K, ph), rb = Math.hypot(bx, bz - cz), rp = Math.hypot(p[0], p[2] - cz);
    return rp >= rb + min ? p : [p[0] * (rb + min) / (rp || 1), p[1], cz + (p[2] - cz) * (rb + min) / (rp || 1)];
  });
  const bez = (p0, p1, p2, n = 6) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; pts.push([0, 1, 2].map(k => a * p0[k] + b * p1[k] + c * p2[k])); }
    return pts;
  };
  let G = '';                                          // guruh nomi (tekshiruv: ?tutamlar=guruh)
  const bir = (d, en) => T.push({dam: d, dam0: d, dam1: d, en, gr: G});
  // sirt bo'ylab yo'l (QISQA peshona): kenglik (tepadan th) y0 dan y1 gacha, azimut ph, sirtdan off tashqarida
  const thY = y => Math.PI / 2 - (y >= 0 ? Math.asin(Math.min(1, y / B.kalla)) : -Math.min(0.86, y / B.iyakY * 0.86) * Math.PI / 2);
  const yol = (ph, y0, y1, off, n = 6) => {
    const a = thY(y0), b = thY(y1), pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push(sirt(a + (b - a) * t, ph, off * (0.4 + 0.6 * t))); }
    return pts;
  };
  // YELPIG'ICH: toj orqasidan (k=0) soch chizig'igacha (k=1); tutam ko'tarilib oldinga-pastga egiladi
  G = 'yel';
  const Y = SOCH.yel, uchK = k => {                  // uch chegarasi bo'ylab chiziqli (k -> [y, z])
    const f = k * (Y.uch.length - 1), i = Math.min(Y.uch.length - 2, Math.floor(f)), t = f - i;
    return [Y.uch[i][0] + (Y.uch[i + 1][0] - Y.uch[i][0]) * t, Y.uch[i][1] + (Y.uch[i + 1][1] - Y.uch[i][1]) * t];
  };
  for (let a = 0; a < Y.kn; a++) for (let b = 0; b < Y.lat; b++) {
    const k = Math.min(1, Math.max(0, (a + (R() - 0.5) * 0.5) / (Y.kn - 1))), lu = Y.lat > 1 ? b / (Y.lat - 1) : 0.5;
    const phL = (-Y.phLat + 2 * Y.phLat * lu) * (0.55 + 0.45 * k) + (R() - 0.5) * 0.15;
    const ths = Y.thOrqa + (Y.thOld - Y.thOrqa) * k, r0 = sirt(Math.abs(ths) + 0.02, ths < 0 ? Math.PI - phL : phL, 0.0);
    const [yt, zt] = uchK(k), yl = 1 - 0.25 * Math.abs(2 * lu - 1);     // chetdagilari biroz qisqaroq
    const uch = [r0[0] * (1.15 + Y.yoyX) + Math.sign(r0[0]) * 0.05, r0[1] + (yt - r0[1]) * yl + (R() - 0.5) * 0.2, r0[2] + (zt - r0[2]) * yl + (R() - 0.5) * 0.15];
    const H = Y.H0 + (Y.H1 - Y.H0) * k, c = [r0[0] * 1.15, Math.max(r0[1], uch[1]) + H, 0.5 * (r0[2] + uch[2]) - 0.1];
    bir(tashqari(bez(r0, c, uch)), (Y.en0 + (Y.en1 - Y.en0) * k) * (0.85 + 0.3 * R()));
    T[T.length - 1].osil = Y.osil0 + (Y.osil1 - Y.osil0) * k;
  }
  // QISQA peshona: peshonada yotadi, qoshgacha
  const Q = SOCH.qisqa; G = 'qisqa';
  for (let i = 0; i < Q.n; i++) {
    const u = i / (Q.n - 1), ph = -Q.phMax + 2 * Q.phMax * u + (R() - 0.5) * 0.06, a = Math.abs(ph) / Q.phMax;
    const y0 = B.kalla * Math.cos(Q.th + R() * 0.05), j = (R() - 0.5) * 0.08 + (i % 2 ? 0.04 : -0.03), y1 = Q.yUch + Q.yUchYon * a + j;
    const en = Q.en * (0.85 + 0.3 * R()) * (ph > 0 ? 1 + 0.5 * a : 1);   // uzoq tomonda (3/4 da qiya ko'rinadi) kengroq
    bir(yol(ph, y0, y1, Q.off), en);
  }
  // YAQIN (o'ng, -x) va UZOQ (chap, +x) yon massa: chakkadan jag'gacha osiladi, sirtdan bo'rtib
  /* yuz yon tomoni bo'ylab yo'l: x x0 dan x0+dxU gacha, z = old sirt + off - dzU t^2 (pastga tomon jag' ORTIGA: 3/4 da
     yonoq ustiga tushmaydi -- bosh profilga burilganda ham yonoq ortida, misol 9..11) */
  const tik = (x0, y0, y1, off, dxU = 0, dzU = 0, n = 6) => {
    const pts = []; let zOx = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = y0 + (y1 - y0) * t, K = profil()(y), x = x0 + dxU * t;
      let z = zOx, zYuz = null;
      if (Math.abs(x) < K.W * 0.98) { zYuz = yuzNuqta(x, y)[2] + off; z = zYuz; }
      if (z === null) z = 0.5 * (K.zF + K.zB);
      zOx = z;
      const zo = z - dzU * t * t;
      pts.push([x, y, zYuz === null ? zo : Math.max(zYuz, zo)]);   // yuz bor joyda sirtdan ichkariga kirmaydi
    }
    return pts;
  };
  /* 9-o'tish (2b qayta): yon tutam KESIM BO'YLAB -- ildiz yuz sirtida (x0, y0), pastga tushgan sari bosh kesimi atrofida
     azimut ildiznikidan phU ga (t^pk bilan) buriladi, sirtdan off tashqarida. tik() da tutam yuz eni ichida doim yuz sirtida
     edi (yonoq ustida) -- profil ko'rinishida (2-shot) yuzni yopardi; bu yerda uchi yonoqdan jag' ortiga o'tishi mumkin. */
  const yon = (x0, y0, y1, off, phU, pk, n = 6) => {
    const K0 = profil()(y0), cz0 = 0.5 * (K0.zF + K0.zB);
    const z0 = Math.abs(x0) < K0.W * 0.98 ? yuzNuqta(x0, y0)[2] : cz0, ph0 = Math.atan2(x0, z0 - cz0), pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = y0 + (y1 - y0) * t, K = profil()(Math.max(y, B.iyakY)), cz = 0.5 * (K.zF + K.zB);
      const [bx, bz] = kesimNuqta(K, ph0 + (phU - ph0) * Math.pow(t, pk)), r = Math.hypot(bx, bz - cz) || 1, k = (r + off) / r;
      pts.push([bx * k, y, cz + (bz - cz) * k]);
    }
    return pts;
  };
  for (const [YY, s] of [[SOCH.yaqin, -1], [SOCH.uzoq, 1]]) {
    G = s < 0 ? 'yaqin' : 'uzoq';
    for (let i = 0; i < YY.n; i++) {
      const u = YY.n > 1 ? i / (YY.n - 1) : 0, ph = YY.ph0 + (YY.ph1 - YY.ph0) * u, r0 = sirt(YY.th + (R() - 0.5) * 0.10, ph, 0.0);
      const uch = [YY.xUch * (0.95 + 0.1 * R()), YY.yUch + (R() - 0.5) * 0.25 + (YY.dyUch !== undefined ? YY.dyUch : 0.12) * u, YY.zOld + (YY.zOrqa - YY.zOld) * u];
      const c = [r0[0] + s * 0.28, 0.5 * (r0[1] + uch[1]) + 0.15, 0.5 * (r0[2] + uch[2])];
      const d1 = tashqari(bez(r0, c, uch)), en = YY.en * (0.85 + 0.3 * R());
      /* 9-o'tish: yaqin tutamlar -- faqat 3/4 dam shakli (profil shakli va ko'rinish vazni olib tashlandi; bitta shakl
         uch shotda: 2-shot qoplash 54 -> 52 %, yorug' massa 3.13 -> 3.60 % (misol 4.29), profil ko'zi ustida soch 0) */
      if (s < 0) {                                     // tasodifiy sonlar tartibi oldingidek (avval yo'l, keyin en)
        const y1 = YY.yUch0 - 0.06 * i + (R() - 0.5) * 0.1;
        const d0 = YY.phU !== undefined ? yon(YY.x0 + YY.dx * i, YY.yIldiz - 0.05 * i, y1, YY.off, YY.phU + (YY.phD || 0) * i, YY.pk || 1)
                                        : tik(YY.x0 + YY.dx * i, YY.yIldiz - 0.05 * i, y1, YY.off, YY.dxU, YY.dzU + 0.08 * i);
        bir(d0, YY.en0 * (0.9 + 0.2 * R())); T[T.length - 1].osil = YY.osil; T[T.length - 1].shK = YY.shK; if (YY.shF !== undefined) T[T.length - 1].shF = YY.shF;
      }
      else bir(d1, en);
    }
  }
  // ORQA (kapyushon ichida qoladi -- qisqa)
  for (let i = 0; i < 6; i++) {
    const ph = Math.PI * 0.62 + (i / 5) * Math.PI * 0.76, th = 0.60 + R() * 0.35;
    const r = sfera(th, ph, 1.03), o = [r[0] * 0.10, 0, r[2] * 0.10];
    qosh(r, [[o[0], 0.02, o[2]], [o[0], -0.22, o[2]], [o[0] * 0.5, -0.26, o[2] * 0.5], [0, -0.22, 0]], 0.30);
  }
  return T;
}

function tasmaGeo(nSeg, nRad) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((nSeg + 1) * nRad * 3), idx = [];
  for (let i = 0; i < nSeg; i++) for (let j = 0; j < nRad; j++) {
    const a = i * nRad + j, b = i * nRad + (j + 1) % nRad, c = (i + 1) * nRad + j, d = (i + 1) * nRad + (j + 1) % nRad;
    idx.push(a, c, b, b, c, d);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('aSochN', new THREE.BufferAttribute(new Float32Array((nSeg + 1) * nRad * 3), 3));   // massa normali (soyalash)
  return g;
}

/* ---------- KAPYUSHON: qobiq, yuz teshigi, qalin qirra, ich (astar) ---------- */
/* KIYIM -- kapyushon, plash va gavda (tana massasi) parametrlari. Qiymatlar test/fit_kiyim.mjs bilan misolning
   figura massasiga (yopilish xaritasi, 1- va 3-shot BIRGA) moslanadi; natija shu yerga yoziladi. */
/* ochV0/ochV1: teshik y = yTepa - v*uzun da boshlanadi -- 0.20 da y ~1.05 (bosh tojida), 0.36 da to'liq ochiq (qosh).
   Moslashda (0.04..0.24) teshik bosh tepasidan 0.7 birlik YUQORIDA boshlanardi: 3-shotda bosh teshikdan pastga
   chiqib, soyaga kirmasdi (audit 2). */
export const KIYIM = {    // moslash natijasi (test/fit_kiyim.mjs -> test/kiyim_fit.json; kameralar yuzga moslangandan keyin): yumshoq IoU 1-shot 0.873, 3-shot 0.836
  /* 6-o'tish (soch bilan minimal): teshik tojdan boshlanadi (ochV0 0.2 -> -0.05), toj gumbazi orqaga (surZ 0.45) va
     balandroq (gumbaz 0.378 -> 0.5) -- yangi soch cho'qqisi 2-shotda kapyushonni teshib chiqardi / ostida qolardi:
     misolning yorug' sochi bizda kapyushon ostida 0.101 / 0.410 / 0.002 -> 0.004 / 0.138 / 0.000 (1/2/3-shot),
     figura IoU 0.902 / 0.868 -> 0.903 / 0.866 (test/fit_kapyushon6.mjs --faqat-baho). To'liq kapyushon o'tishi keyin. */
  /* 9-o'tish: kapyushon SHOT bo'yicha emas. Mato o'lchami BITTA (r0, soyabon, gumbaz, uchY, rYelka, orqa; tau -- boshga
     ergashish inersiyasi), joylashuvi (teshik, toj va yuqori qism, astar tasmasi) boshning pozasidan -- kapPoza kalitlari
     (personaj.kapDeform). Uch shotga birgalikda moslangan: test/fit_kapPoza9.mjs (test/kapPoza9_natija.json); ergashish
     inersiyasi tau 0.1 s, joylashuv kechikishi tauD 0.4 s (1-shot 10->11 masshtab sakrashi 1.075 -> 1.014, bosh IoU 0.794 ->
     0.810; 3-shot 0.694 -> 0.676 -- skan: test natijalari README 9-o'tish). Bu yerdagi
     joylashuv qiymatlari (ochiq, surZ, ...) faqat kalitlar bo'lmasa ishlatiladi. Bitta qattiq kapyushon (fit_kap9) 2-shotda
     yuzni yopgan edi (ko'rinadigan bosh 0.13). */
  kap: {r0: 1.1542, rOrta: 0.08, rYelka: 0.3397, soyabon: 0.4752, yTepa: 1.989, uzun: 4.183, gumbaz: 0.6295, uchY: 1.2685, uchZ: 1.389, uchV: 0.12, ochiq: 0.7968, ochV0: -0.1679, ochV1: 0.5787, yopiq: 0.8, kengX: 1.21, orqa: 2.7679, surZ: 0.5102, surY: 0.2724, butunZ: -0.0693, butunY: -0.3844, bur: 0.0134, eg: 0.323, ochA: 1.1625, ochB: 1.263, tasmaA: 6.8722, tasmaB: 2.0777, tasmaAlt: 0.1104, tasmaBlt: 0.5799, tasmaV: 0.5639, tau: 0.1, tauD: 0.4},
  /* kalit pozalar (egilish, burilish) va shu pozadagi mato joylashuvi (test/fit_kapPoza9.mjs; kalitlar -- 1-shot tinch,
     2-shot, 3-shot tinch pozalari; aralash asosan egilishdan: sigmaE 0.2, sigmaB 1.0). 10-o'tish: shot pozalari bosh bilan
     qayta moslandi (test/fit_bosh10.mjs) -- 1-shot kaliti ham o'sha pozaga: [-0.3, -0.158] -> [-0.2816, -0.1658] (1-shotda
     joylashuv o'sha qoladi); 2- va 3-shot pozasi va kaliti -- oldingidek (film.js izohi). 11-o'tish: 2- va 3-shot pozasi,
     kamerasi va kaliti inson belgilariga BIRGA moslandi (test/fit_poza11b.mjs; 1-shot 10-11 qo'riqchisi bilan) -- kalit
     pozalari yangi shot pozalariga ergashadi; oldingi: [-0.014, 0] va [0.66, -0.02] (test/log11/personaj_oldin11.js).
     3-shot kaliti ikkinchi marta (faqat kalit, test/fit_poza11b.mjs --faqatKalit --iou2 --yuzkor 6 --qor1): birinchi
     moslash bosh IoU da astarni "bosh" deb sanagan -- astar misolning soch massasi o'rnini to'ldirib (misol boshining 18% ->
     30%), kapyushon misolning ko'rinadigan yuzining 28% ini yopdi (oldin 5%). Endi astarsiz IoU + ko'rinadigan yuz: kapF
     0.276 -> 0.139, teriQ 0.148 -> 0.114, soch+teri IoU 0.452 -> 0.470, figura 0.893 -> 0.887; 1-shot qo'riqchisi o'zgarmadi.
     Qolgan kapF -- yoqa (iyak ostida, global yopiq/rYelka): ochilsa bizning teri misolning astar/soyasida chiqadi. */
  kapPoza: {sigmaE: 0.2, sigmaB: 1, kalit: [
    {p: [-0.2816, -0.1658], d: {ochiq: 0.5, ochV0: -0.1678, ochV1: 0.4631, surZ: 0.2869, surY: -0.2602, butunZ: -0.3212, butunY: -0.324, bur: 0.0079, eg: 0.1487, ochA: 1.2063, ochB: 1.3609, tasmaA: 5.6943, tasmaB: 2.1521, tasmaAlt: 0.4419, tasmaBlt: 0.7798, tasmaV: 0.5397}},
    {p: [-0.0646, -0.5838], d: {ochiq: 1.2099, ochV0: -0.1152, ochV1: 0.47, surZ: 0.4711, surY: 0.6274, butunZ: 0.3729, butunY: -0.9, bur: 0.0286, eg: 0.0684, ochA: 0.7975, ochB: 1.1903, tasmaA: 6.6959, tasmaB: 5.3081, tasmaAlt: 0.7792, tasmaBlt: 0.9529, tasmaV: 0.6607}},
    {p: [0.7025, 0.1089], d: {ochiq: 1.2428, ochV0: 0.127, ochV1: 0.3378, surZ: 0.576, surY: 0.757, butunZ: -0.6089, butunY: -0.2721, bur: 0.4243, eg: 0.348, ochA: 1.419, ochB: 1.0541, tasmaA: 6.8902, tasmaB: 0.8479, tasmaAlt: 0.735, tasmaBlt: 0.9263, tasmaV: 0.6357}},
  ]},
  plash: {r0: 1.92, rKeng: 1.504, zNisbat: 0.772, yBosh: -1.95, uzun: 7.5, orqa: 0.209},
  gavda: {dy: -0.284, dz: 0.622, bur: 0.402},
};

function kapGeo(P = KIYIM.kap) {
  /* u: 0..1 -- teshikning bir chetidan orqa orqali ikkinchi chetigacha; v: 0 (tepa) .. 1 (yelka).
     Teshik yarim burchagi (yuz oldidan) v ga bog'liq: tojda 0 dan boshlanib, yonoqda ~106 gr (qirra quloq
     ORTIDA), yoqada torayadi. Misolning 2- va 3-kadrida (yon ko'rinish) kapyushon qirrasi bosh ortida: yuz,
     peshona sochi va yon tutamlar qirradan OLDINDA -- shu MASSA joylashuvi o'lchandi, chizma emas. */
  const eh = v => { const a = sm(P.ochV0, P.ochV1, v) * P.ochiq * (1 - P.yopiq * sm(0.50, 0.90, v)); return Math.max(0.0001, a); };
  /* 7-o'tish: teshikning ikki qirrasi alohida -- ochA (u=0, +x tomoni: 1-shotda uzoq) va ochB (u=1, -x: yaqin) eh ga
     ko'paytiriladi, bosh balandligida to'liq, iyak ostida (v 0.55..0.85) 1 ga qaytadi: 1-shotda yaqin qirra bosh orqasini
     yopadi, uzoq qirra yuz profili ORTIDA qolishi kerak (tor simmetrik teshikda uzoq panel ichi yuz o'ngida qorong'i ramka +
     astar chizig'i bo'lib ko'rinardi, misolda u yerda osmon), lekin iyak ostidagi yoqa joyida qoladi (figura) */
  const yoq = v => 1 - sm(0.55, 0.85, v);
  const ehA = v => eh(v) * (1 + ((P.ochA || 1) - 1) * yoq(v)), ehB = v => eh(v) * (1 + ((P.ochB || 1) - 1) * yoq(v));
  const f = (u, v, t) => {
    const eA = ehA(v), eB = ehB(v), ph = eA + u * (2 * Math.PI - eA - eB);        // ph: old (+z) dan
    // radius profili: tepada boshga yaqin, pastda yelkaga yoyiladi
    const r = P.r0 + P.rOrta * Math.sin(v * Math.PI) + P.rYelka * Math.pow(sm(0.55, 1.0, v), 1.2)
            + P.soyabon * (1 - sm(0.05, 0.40, v)) * Math.max(0, Math.cos(ph))       // old-tepada soyabon sochdan tashqarida
            + P.orqa * Math.max(0, -Math.cos(ph)) * sm(0.05, 0.45, v);                 // orqa tomoni kengroq (bo'sh osilgan mato)
    /* 6-o'tish: toj (gumbaz) qismi orqaga surZ ga siljiydi -- soch cho'qqisi (2-shot, misolda kapyushondan OLDINDA)
       gumbazni teshib chiqmasin; yon panellar joyida (1-shotda uzoq yon ichki yuzi yuz yonida ko'rinmasin) */
    const toj = 1 - sm(0.10, 0.35, v), yuq = 1 - sm(0.45, 0.80, v);   // toj (gumbaz) va butun yuqori (bosh ramkasidagi) qism
    let y = P.yTepa - v * P.uzun + (P.surY || 0) * toj + (P.butunY || 0) * yuq;
    let x = r * Math.sin(ph) * P.kengX, z = r * Math.cos(ph) - (P.surZ || 0) * toj - (P.butunZ || 0) * yuq;
    // tepa: gumbaz (v kichik -- tojga yig'iladi)
    const top = sm(0.0, 0.22, v);
    x *= 0.25 + 0.75 * top; z *= 0.25 + 0.75 * top; y += (1 - top) * P.gumbaz;
    // orqa-tepada kapyushon uchi
    const orqa = Math.max(0, -Math.cos(ph));
    y += P.uchY * orqa * Math.exp(-Math.pow((v - P.uchV) / 0.10, 2));
    z -= P.uchZ * orqa * Math.exp(-Math.pow((v - P.uchV - 0.03) / 0.12, 2));
    /* 7-o'tish: yuqori qism (bosh ramkasidagi) vertikal o'q atrofida bur ga buriladi -- teshik boshga nisbatan bir
       tomonga suriladi (mato boshda aylangan). Simmetrik tor teshik 1-shotda yaqin tomonda bosh orqasini yopganda uzoq
       tomon qirrasi yuz profilidan ingichka chiziq bo'lib chiqardi (misolda u yuz ortida) -- ikki qirra alohida. */
    const b = (P.bur || 0) * yuq;
    if (b) { const c = Math.cos(b), s = Math.sin(b), x0 = x; x = x0 * c + z * s; z = -x0 * s + z * c; }
    /* eg: yuqori qism bosh markazi atrofida oldinga egiladi (3-shot: bosh 39 gr egilgan, kapyushon ramkasi KF ulushida
       atigi 14 gr -- bosh tepasi teshikdan oldinga chiqib qolardi; misolda bosh kapyushon ICHIDA) */
    const eg = (P.eg || 0) * yuq;
    if (eg) { const c = Math.cos(eg), s = Math.sin(eg), y0 = y; y = y0 * c - z * s; z = y0 * s + z * c; }
    t.set(x, y, z);
  };
  const g = new ParametricGeometry(f, 96, 64);
  aylantir(g);                          // tashqi sirt old yuz (gl_FrontFacing) bo'lsin
  const uv = g.attributes.uv, n = uv.count, w = new Float32Array(n), chet = new Float32Array(n), pa = g.attributes.position;
  for (let i = 0; i < n; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    w[i] = sm(0.45, 0.80, v);           // bosh (kapyushon ramkasi) / gavda aralash og'irligi
    /* aChet: sirt bo'ylab teshik chetigacha masofa (birlik). Ichki sirtning chetdan uzoq qismi bosh va
       kapyushonning o'zi ortida qoladi -- yorug' tushmaydi (misolda: chet bo'ylab astar tasmasi, ichi pona) */
    /* 7-o'tish: tasma eni har qirra uchun (tasmaA, tasmaB -- TASMA ga ko'paytma; shot bo'yicha) bosh balandligida,
       iyak ostida tasmaAlt, tasmaBlt (yoq(v) bilan aralash): misol 1-shotda uzoq qirra astari yuz chetidan qirragacha
       ~14 px L 43-45 (320 da, 40-95 qatorlar), bizda 3 px tasma + qorong'i ich edi; iyak ostida misolda plash qorong'i
       (L 9-30) -- u yerda tasma yo'q */
    const tv = P.tasmaV ?? 0.7, yv = 1 - sm(tv - 0.04, tv + 0.04, v);   // tasmaV: bosh balandligi tasmasi shu v da tugaydi (1-shotda jag' osti v ~0.64)
    const tk = u < 0.5 ? (P.tasmaA ?? 1) * yv + (P.tasmaAlt ?? 1) * (1 - yv) : (P.tasmaB ?? 1) * yv + (P.tasmaBlt ?? 1) * (1 - yv);
    chet[i] = Math.min(u, 1 - u) * (2 * Math.PI - ehA(v) - ehB(v)) * Math.hypot(pa.getX(i), pa.getZ(i)) / Math.max(1e-3, tk);
  }
  g.setAttribute('tanaW', new THREE.BufferAttribute(w, 1));
  g.setAttribute('aChet', new THREE.BufferAttribute(chet, 1));
  g.computeVertexNormals();
  return {g, f, eh};
}

function aylantir(g) {                   // uchburchaklar aylanish yo'nalishini teskari qilish
  const ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  g.index.needsUpdate = true;
}

function plashGeo(P = KIYIM.plash) {
  const f = (u, v, t) => {
    const ph = u * 2 * Math.PI, y = P.yBosh - v * P.uzun;
    let r = P.r0 + P.rKeng * Math.pow(v, 0.8) + (P.orqa || 0) * Math.max(0, -Math.cos(ph)) * Math.pow(v, 0.5);   // orqa etagi
    r += (0.10 + 0.22 * v) * Math.sin(ph * 7 + v * 2.0) + 0.06 * Math.sin(ph * 13 + 1.3);
    t.set(r * Math.sin(ph), y, r * Math.cos(ph) * P.zNisbat);
  };
  const g = new ParametricGeometry(f, 128, 48); aylantir(g); g.computeVertexNormals();
  return g;
}

/* ---------- YIG'ISH ---------- */
export function personaj() {
  const ildiz = new THREE.Group(); ildiz.rotation.y = Math.PI / 2;      // dunyoda +x ga qaraydi
  const tana = new THREE.Group(); ildiz.add(tana);
  const boshPivot = new THREE.Group(); boshPivot.position.set(0, -0.85, 0); tana.add(boshPivot);   // bo'yin tepasi
  const bosh = new THREE.Group(); bosh.position.set(0, 0.85, 0); boshPivot.add(bosh);
  /* kapyushon ramkasi: boshning aylanishiga faqat KF ulushida ergashadi. Misolning 3-shotida bosh kapyushon
     ICHIDA egiladi, kapyushon joyida qoladi; qattiq bog'langanda figura o'zgarishi misoldan 2.3 barobar ko'p edi
     (juft farq 8.1 vs 3.6, audit 1). */
  const kPivot = new THREE.Group(); kPivot.position.set(0, -0.85, 0); tana.add(kPivot);
  const kBosh = new THREE.Group(); kBosh.position.set(0, 0.85, 0); kPivot.add(kBosh);

  const yuz = {ochiq: yuzKanvas('ochiq'), yarim: yuzKanvas('yarim'), yumuq: yuzKanvas('yumuq')};
  const boshG = boshGeo(0), boshG1 = boshGeo(1);
  const boshM = new THREE.Mesh(boshG, new THREE.MeshBasicMaterial()); boshM.userData = {rol: 'teri', yuz};
  bosh.add(boshM);
  /* profil vazni (0..1) -- yaqin ko'z kartasi (kozKarta; main.js uniformlarga qo'yadi), geometriya o'zgarmaydi.
     surish (0..1) -- bosh geometriyasi ikki shakl orasida aralashadi (BOSH.surishZ; faqat tez burilishda) */
  const pos0 = Float32Array.from(boshG.attributes.position.array), pos1 = boshG1.attributes.position.array;
  const nor0 = Float32Array.from(boshG.attributes.normal.array), nor1 = boshG1.attributes.normal.array;
  function profil(w) { BOSH.profilW = w; }  // yaqin ko'z kartasi vazni (main.js kozKartaQoy)
  let surishJoriy = 0;
  function surishQoy(w) {
    if (Math.abs(w - surishJoriy) < 1e-4) return;
    surishJoriy = w; BOSH.surish = w;
    const pa = boshG.attributes.position.array, na = boshG.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) { pa[i] = pos0[i] + w * (pos1[i] - pos0[i]); na[i] = nor0[i] + w * (nor1[i] - nor0[i]); }
    boshG.attributes.position.needsUpdate = true; boshG.attributes.normal.needsUpdate = true;
  }
  // soch qopqog'i: boshdan sal katta, peshonada soch chizig'i
  const qg = new THREE.SphereGeometry(1.06, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const qp = qg.attributes.position;
  for (let i = 0; i < qp.count; i++) {        // old tomonda soch chizig'i: qopqoq peshona ostiga (bosh ichiga) botadi -- burma/lab qolmaydi
    let x = qp.getX(i) / 1.06, y = qp.getY(i) / 1.06, z = qp.getZ(i) / 1.06;
    const chiz = SOCH.qopqoq.c0 + SOCH.qopqoq.c1 * Math.pow(Math.abs(x), 1.5);   // soch chizig'i: o'rtada past, chakkada baland (6-o'tish; edi 0.50 + 0.10|x|)
    const ich = sm(0.15, 0.45, z) * sm(chiz + 0.12, chiz - 0.02, y);   // 1 -- yuz tomonda, chiziqdan past
    const r = 1.06 - 0.16 * ich;
    [x, y, z] = boshShakli(x * r, y * r, z * r);
    qp.setXYZ(i, x * 1.03, y * 1.02, z * 1.03);
  }
  qg.computeVertexNormals();
  const qopqoq = new THREE.Mesh(qg, new THREE.MeshBasicMaterial()); qopqoq.userData = {rol: 'sochIch'}; bosh.add(qopqoq);   // ichki soch qatlami -- to'qroq

  /* gavda: tana massasi (plash, bo'yin asosi, kapyushonning pastki qismi). Bosh joyida qoladi (kamera kompozitsiyasi
     boshga bog'langan), gavda orqaga/pastga surilishi va burilishi mumkin -- bo'yin ikkalasini ulaydi. */
  const gavda = new THREE.Group(); tana.add(gavda);
  const boyin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 1.4, 32, 1, true), new THREE.MeshBasicMaterial());
  boyin.userData = {rol: 'boyin'}; tana.add(boyin);
  const bA = new THREE.Vector3(), bB = new THREE.Vector3(), bY = new THREE.Vector3(0, 1, 0);
  function boyinQoy() {                     // bo'yin: bosh ostidan (bosh pivoti) gavdaning bo'yin asosigacha
    bA.set(0, boshPivot.position.y - 0.05, -0.12);
    bB.set(0, -2.15, -0.12); gavda.updateMatrix(); bB.applyMatrix4(gavda.matrix);
    const d = bA.clone().sub(bB), L = d.length();
    boyin.position.copy(bA).add(bB).multiplyScalar(0.5);
    boyin.quaternion.setFromUnitVectors(bY, d.normalize());
    boyin.scale.set(1, L / 1.4, 1);
  }

  let K = kapGeo();
  const kap = new THREE.Mesh(K.g, new THREE.MeshBasicMaterial({side: THREE.DoubleSide})); kap.userData = {rol: 'kapyushon', ikkiTomon: true};
  ildiz.add(kap);                                                   // vertexlar har kadr aralash (kapyushon ramkasi / gavda)
  let kapDam = Float32Array.from(K.g.attributes.position.array);

  const plash = new THREE.Mesh(plashGeo(), new THREE.MeshBasicMaterial({side: THREE.DoubleSide})); plash.userData = {rol: 'plash'};
  gavda.add(plash);

  function gavdaQoy(G = KIYIM.gavda) { gavda.position.set(0, G.dy, -G.dz); gavda.rotation.set(0, G.bur, 0); }
  gavdaQoy();
  /* moslash uchun: kiyimni yangi parametrlar bilan qayta qurish (faqat tekshiruv/moslashda; material o'zgarmaydi) */
  function kiyimQur(yangi) {
    for (const k of ['kap', 'plash', 'gavda', 'kapPoza']) if (yangi[k]) Object.assign(KIYIM[k], yangi[k]);
    const eski = K.g; K = kapGeo(); kap.geometry = K.g; kapDam = Float32Array.from(K.g.attributes.position.array); eski.dispose(); kapKalit = null;
    const ep = plash.geometry; plash.geometry = plashGeo(); ep.dispose();
    /* bola meshlar (style konturi -- teskari qobiq, main.js) ham yangi geometriyani oladi: aks holda eski (dispose
       qilingan) geometriya muzlagan pozada qoladi -- 7-o'tishda 1-shotda bo'yin o'ngida katta qora "parda" bo'lib chiqdi
       (6-o'tishdagi ?kiyim= sinovlaridagi "uzoq yon ichki yuzi" ham shu edi) */
    for (const c of kap.children) c.geometry = kap.geometry;
    for (const c of plash.children) c.geometry = plash.geometry;
    gavdaQoy(); poza(holat);
  }

  // soch tutamlari -- dunyo fazosida (fizika), sahnaga alohida qo'shiladi
  const NS = 18, NR = 7;
  const tutamlar = tutamlarDizayni().map(t => {
    const g = tasmaGeo(NS, NR); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial()); m.userData = {rol: 'soch'};
    m.frustumCulled = false;
    return {...t, m, g, p: null, q: null};
  });

  const holat = {egilish: 0, burilish: 0, yonga: 0, yumuq: 0, chokish: 0};
  /* 12-o'tish: ergashish ulushlari kiyim parametri (KIYIM.kap.kf, kt -- mato boshga qancha tayanadi; bitta qiymat, uch shotga
     birga moslanadi); URL ?kf= / ?kt= -- tekshiruv uchun ustiga yoziladi */
  const _u = new URLSearchParams(location.search), KFu = _u.get('kf'), KTu = _u.get('kt');
  const KFf = () => KFu !== null ? +KFu : (KIYIM.kap.kf ?? 0.35), KTf = () => KTu !== null ? +KTu : (KIYIM.kap.kt ?? 0.8);
  const _c = new THREE.Vector3(), _r = new THREE.Vector3();
  const tmp = new THREE.Vector3(), M = new THREE.Matrix4(), Mt = new THREE.Matrix4();

  /* 9-o'tish: KAPYUSHON ERGASHISHI VAQT BO'YICHA (mato inersiyasi). 7-8-o'tishda shot bo'yicha edi: shot boshidagi poza
     (kap0) va shot ichidagi ulush (kfIch, 1-shotda 0.2) -- shotga bog'liq qiymat (kamera sinovi: kalit almashganda
     sakrash). Endi ramka maqsadi KF x bosh aylanishi, ramka unga tau vaqt doimiysi bilan yaqinlashadi: tez burilishda
     (1-shot 10-11) orqada qoladi, tinch pozada yetib oladi; shot boshida tinch holat (soch oldindan aylantirilgani kabi).
     Yuqori qism egilishi pozadan: eg + egK x egilish (kamera emas). */
  /* 9-o'tish (2c): KAPYUSHON -- POZA FAZOSIDAGI TUZATUVCHI SHAKLLAR (3D rig usuli: shakl bo'g'in burchagidan, kameradan
     emas). Bitta qattiq kapyushon uch shotga birga moslanganda massa mos (figura 0.93/0.87/0.88), lekin teshik 2-shotda
     yuzni yopdi (ko'rinadigan bosh IoU 0.13, maydon 0.16) -- misolda mato har pozada boshqacha yotadi. Mato o'lchami
     (r0, uzun, gumbaz, uch...) BITTA; joylashuvi (teshik, toj va yuqori qism siljishi/burilishi, astar tasmasi) boshning
     pozasiga (egilish, burilish) bog'liq: kalit pozalar orasida Gauss og'irliklari bilan silliq aralashadi (KIYIM.kapPoza).
     Kamera sinovida (poza ushlangan) o'zgarmaydi; bosh harakatlansa kapyushon bilan birga silliq o'zgaradi. */
  const kapR = {egilish: 0, burilish: 0, yonga: 0}, kapP = {egilish: 0, burilish: 0};
  let kapRbor = false, kapKalit = null;
  /* mato joylashuvi ham bir zumda emas: aralashma KECHIKKAN pozadan (tauD, s) -- 1-shot 10->11 dagi tez burilishda (60 ms)
     teshik keskin kengayib, figura masshtabi 1.08 ga sakradi (misol 0.985) */
  function kapDeform() {
    const KP = KIYIM.kapPoza; if (!KP || !KP.kalit || !KP.kalit.length) return {};
    const se = KP.sigmaE || 0.25, sb = KP.sigmaB || 0.25;
    const w = KP.kalit.map(k => Math.exp(-0.5 * ((kapP.egilish - k.p[0]) / se) ** 2 - 0.5 * ((kapP.burilish - k.p[1]) / sb) ** 2));
    const S = w.reduce((a, b) => a + b, 0) || 1, out = {};
    for (const nm of Object.keys(KP.kalit[0].d)) out[nm] = KP.kalit.reduce((a, k, i) => a + w[i] / S * (k.d[nm] ?? KIYIM.kap[nm] ?? 0), 0);
    return out;
  }
  function kapQayta(D) {
    const eski = K.g; K = kapGeo({...KIYIM.kap, ...D}); kap.geometry = K.g; kapDam = Float32Array.from(K.g.attributes.position.array); eski.dispose();
    for (const c of kap.children) c.geometry = kap.geometry;
  }
  function kapQadam(dt, boshla) {
    const tau = KIYIM.kap.tau || 0, a = boshla || !kapRbor || tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
    const KF = KFf(); for (const k of ['egilish', 'burilish', 'yonga']) kapR[k] += (KF * (holat[k] || 0) - kapR[k]) * a;
    const tauD = KIYIM.kap.tauD || 0, aD = boshla || !kapRbor || tauD <= 0 ? 1 : 1 - Math.exp(-dt / tauD);
    for (const k of ['egilish', 'burilish']) kapP[k] += ((holat[k] || 0) - kapP[k]) * aD;
    kapRbor = true;
    const D = kapDeform(), kalit = JSON.stringify(D, (k, v) => typeof v === 'number' ? +v.toFixed(4) : v);
    if (kalit !== kapKalit) { kapKalit = kalit; kapQayta(D); }
    poza(holat);
  }
  function poza(h) {
    Object.assign(holat, h);
    boshPivot.rotation.set(holat.egilish, holat.burilish, holat.yonga);
    boshPivot.position.y = -0.85 + (holat.chokish || 0);
    boshPivot.position.z = -(holat.orqaga || 0);                 // bosh orqaga (kapyushon ichiga) siljishi
    /* kapyushon ramkasi: aylanishning KF ulushi, bosh markazi siljishining KT ulushi -- kapyushon tojga tayanib
       bosh bilan cho'kadi, lekin bosh uning ichida egiladi (misol 3-shot). KT siz bosh teshikdan pastga chiqib
       ketardi (egilish + chokish, audit 2). */
    /* 9-o'tish: ramka aylanishi -- kapQadam dagi (vaqt bo'yicha) holat; qadam hali bo'lmagan bo'lsa KF x poza */
    const KF = KFf(), KT = KTf(), kf = k => kapRbor ? kapR[k] : KF * (holat[k] || 0);
    kPivot.rotation.set(kf('egilish'), kf('burilish'), kf('yonga'));
    boshPivot.updateMatrix(); _c.set(0, 0.85, 0).applyMatrix4(boshPivot.matrix);          // bosh markazi (tana fazosida)
    kPivot.updateMatrix(); _r.set(0, 0.85, 0).applyEuler(kPivot.rotation);
    kPivot.position.copy(_c).multiplyScalar(KT).sub(_r);                                   // kBosh = KT * bosh markazi
    ildiz.updateMatrixWorld(true);
    // kapyushon: tepasi kapyushon ramkasi bilan (boshga qisman ergashadi), pasti tana bilan (chiziqli aralash)
    boyinQoy();
    M.copy(kBosh.matrixWorld); Mt.copy(gavda.matrixWorld);
    const inv = new THREE.Matrix4().copy(ildiz.matrixWorld).invert();
    const Mb = new THREE.Matrix4().multiplyMatrices(inv, M).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0));
    const Mtl = new THREE.Matrix4().multiplyMatrices(inv, Mt);
    const pa = K.g.attributes.position, w = K.g.attributes.tanaW;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) {
      a.set(kapDam[i * 3], kapDam[i * 3 + 1], kapDam[i * 3 + 2]); b.copy(a);
      a.applyMatrix4(Mb); b.applyMatrix4(Mtl);
      const t = w.getX(i); pa.setXYZ(i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    }
    pa.needsUpdate = true; K.g.computeVertexNormals();
  }

  /* soch fizikasi: dt -- film tasviri davomiyligi; ichida qat'iy DT_ICH qadamlar (film 60 ms ham, 24 fps ham bir
     xil fizika). Konstantalar 1/24 s qadamda sozlangan (DT_REF): har qadam uchun qayta hisoblanadi -- dam holatiga
     tortilish tezligi va muvozanatdagi osilish (og'irlik/shamol) saqlanadi. boshla -- 0-tasvir: soch oldindan
     PRE soniya shu pozada aylantiriladi (audit 1: ushlangan tasvirlarda uchlar 18.9 -> 3.0 px "tushib o'tirardi"). */
  const DT_REF = 1 / 24, DT_ICH = 1 / 120, PRE = 2.0;
  const markaz = new THREE.Vector3(), _og = new THREE.Vector3(0, -1, 0), _sh = new THREE.Vector3(), _sg = new THREE.Vector3();
  /* dam zanjiri OG'IRLIK va SHAMOL tomon egiladi (6-o'tish): segment yo'nalishi = dam yo'nalishi (bosh bilan) +
     osil * f * pastga (dunyo) + shK * f * shamol/1.7 (dunyo; misolda qor o'ngga-tepaga +1,-1 px/tasvir -- shamol
     personaj oldiga), f -- tutam bo'ylab 0..1. Uzunlik saqlanadi. Prujina endi shu egilgan shaklga tortadi: bosh
     egilganda soch dunyoda osiladi (bosh fazosida qotib qolmaydi), shamolda oldinga uchadi va ushlangan
     tasvirlarda ham qimirlaydi. */
  /* surish (pastki yuz oldinga, 1-shot 7..11): yaqin tutamlar yuz bilan birga siljiydi -- aks holda surilgan yonoq
     ularning pastki qismini yopib, soch "kesilgan" ko'rinardi (ko'z ortida teri 19..21 px, misol 5..7) */
  const surishZ = y => BOSH.surishZ * BOSH.surish * sm(-0.15, -0.83, y);
  function egilganDam(t, M2, shamol) {
    const dam = t.dam.map(p => new THREE.Vector3(p[0], p[1], p[2] + (t.surishli ? surishZ(p[1]) : 0)).applyMatrix4(M2));
    const os = t.osil !== undefined ? t.osil : SOCH.fizika.osil, sk = t.shK !== undefined ? t.shK : SOCH.fizika.shK;
    if (!os && !sk) return dam;
    _sh.set(shamol[0], shamol[1], shamol[2]).multiplyScalar(1 / 1.7);
    const n = dam.length - 1, out = [dam[0]];
    for (let i = 1; i <= n; i++) {
      _sg.copy(dam[i]).sub(dam[i - 1]); const l = _sg.length(); _sg.multiplyScalar(1 / (l || 1));
      const f = i / n;
      _sg.addScaledVector(_og, os * f).addScaledVector(_sh, sk * f).normalize();
      out.push(out[i - 1].clone().addScaledVector(_sg, l));
    }
    return out;
  }
  function qadamIch(shamol) {
    const r = DT_ICH / DT_REF, di = Math.pow(0.86, r);
    const M2 = bosh.matrixWorld, sk = new THREE.Vector3().setFromMatrixScale(M2).x;
    markaz.set(0, 0, 0).applyMatrix4(M2);
    for (const t of tutamlar) {
      const dam = egilganDam(t, M2, shamol);
      const L = []; for (let i = 1; i < t.dam.length; i++) L.push(new THREE.Vector3(...t.dam[i]).distanceTo(new THREE.Vector3(...t.dam[i - 1])) * sk);
      t.p[0].copy(dam[0]); t.q[0].copy(dam[0]);
      for (let i = 1; i < t.p.length; i++) {
        const p = t.p[i], q = t.q[i], v = tmp.copy(p).sub(q).multiplyScalar(di);    // qarshilik
        q.copy(p);
        const k = 0.30 * (1 - 0.45 * i / t.p.length), ki = 1 - Math.pow(1 - k, r);  // uchiga yaqin -- yumshoqroq
        const s = (DT_REF * DT_REF / k) * ki;                                        // muvozanat osilishi saqlansin
        p.add(v).addScaledVector(dam[i].clone().sub(p), ki);
        const sf = t.shF ?? 1;                                                        // 9-o'tish: guruhning shamolga sezgirligi (fizika)
        p.x += shamol[0] * s * i * sf; p.y += (shamol[1] * sf - 2.0) * s * i; p.z += shamol[2] * s * i * sf;
      }
      for (let it = 0; it < 3; it++) for (let i = 1; i < t.p.length; i++) {
        const a = t.p[i - 1], b = t.p[i], d = tmp.copy(b).sub(a), l = d.length() || 1e-6;
        b.copy(a).addScaledVector(d, L[i - 1] / l);
        const c = tmp.copy(b).sub(markaz), cl = c.length();
        if (cl < 1.04 * sk) b.copy(markaz).addScaledVector(c, 1.04 * sk / cl);
      }
    }
  }
  function fizika(dt, shamol, boshla = false) {
    bosh.updateMatrixWorld(true);
    if (boshla || !tutamlar[0].p) {
      const M2 = bosh.matrixWorld;
      for (const t of tutamlar) { const dam = egilganDam(t, M2, shamol); t.p = dam.map(v => v.clone()); t.q = dam.map(v => v.clone()); }
      for (let k = 0; k < Math.round(PRE / DT_ICH); k++) qadamIch(shamol);
    }
    const n = Math.max(1, Math.round(dt / DT_ICH));
    for (let k = 0; k < n; k++) qadamIch(shamol);
  }

  const _mn = new THREE.Vector3(), _mt = new THREE.Vector3(), _mc = new THREE.Vector3();
  function tutamGeometriya() {
    const radial = new THREE.Vector3(), T = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
    _mc.set(0, MN.dy, 0).applyMatrix4(bosh.matrixWorld);          // massa markazi: bosh markazidan MN.dy yuqorida
    for (const t of tutamlar) {
      const cur = new THREE.CatmullRomCurve3(t.p, false, 'centripetal');
      const pos = t.g.attributes.position;
      for (let i = 0; i <= NS; i++) {
        const u = i / NS, c = cur.getPointAt(u); cur.getTangentAt(u, T);
        radial.copy(c).sub(markaz).normalize();
        B.crossVectors(T, radial).normalize(); N.crossVectors(B, T).normalize();
        const en = (t.enW || t.en) * Math.pow(1 - u, 1.15) * (0.70 + 0.55 * Math.sin(Math.min(1, u * 2.5) * Math.PI / 2));
        const ql = en * 0.45;
        for (let j = 0; j < NR; j++) {
          const a = (j / NR) * Math.PI * 2;
          const x = Math.cos(a) * en * 0.5, y = Math.sin(a) * ql * 0.5 + ql * 0.25;   // tashqi tomonga qalinroq
          pos.setXYZ(i * NR + j, c.x + B.x * x + N.x * y, c.y + B.y * x + N.y * y, c.z + B.z * x + N.z * y);
        }
      }
      pos.needsUpdate = true; t.g.computeVertexNormals(); t.g.computeBoundingSphere();
      /* MASSA NORMALI (6-o'tish): soch bitta hajm kabi yoritiladi -- normal boshning yuqorirog'idagi markazdan radial
         (MN.k ulushi) + tutamning o'z normali. Faqat soyalashda (aSochN); kontur tutamning o'z normali bilan.
         Misolda soch keng yorug' massa, orasida ingichka qorong'i chiziqlar; naychaning o'z normali har tutamni
         yarmi yorug', yarmi soyada "tirnoq" qilib ko'rsatardi. */
      const nr = t.g.attributes.normal, sn = t.g.attributes.aSochN;
      for (let v = 0; v < pos.count; v++) {
        _mn.set(pos.getX(v), pos.getY(v), pos.getZ(v)).sub(_mc).normalize().multiplyScalar(MN.k)
          .add(_mt.set(nr.getX(v), nr.getY(v), nr.getZ(v)).multiplyScalar(1 - MN.k)).normalize();
        sn.setXYZ(v, _mn.x, _mn.y, _mn.z);
      }
      sn.needsUpdate = true;
    }
  }

  return {ildiz, tana, bosh, boshPivot, tutamlar, holat, poza, kapQadam, fizika, tutamGeometriya, kiyimQur, kap, plash, kBosh, profil, surishQoy,
          boshMesh: boshM, meshlar: () => [boshM, qopqoq, boyin, kap, plash, ...tutamlar.map(t => t.m)]};
}
