/* SAHNA: tungi qor. Osmon, qor zarralari (chuqurlikda -- figuraning oldidan ham o'tadi),
   kameralar, harakat jadvali. Style bu yerda faqat material beradi (osmon, qor). */
import * as THREE from 'three';
import {rng} from './personaj.js';

/* kameralar (personaj +x ga qaraydi, o'ng tomoni +z da):
   pastdan -- o'ng tomonda, pastda (misolning 3-kadri kabi burchak -- texnika)
   old     -- o'ng-oldda 3/4 (1-kadr kabi) */
export const KAMERALAR = {
  pastdan: {poz: [4.0, -3.0, 4.6], nishon: [0.40, 0.00, 0], fov: 29},
  old:     {poz: [5.6, 0.10, 3.1], nishon: [0.30, -0.30, 0], fov: 27},
  yon:     {poz: [0.3, -0.2, 6.8], nishon: [0.2, -0.3, 0], fov: 28},
};

const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

/* harakat jadvali (soniya): 0..1.4 -- sal tepaga qaraydi; 1.4..3.0 -- egiladi (bosh cho'kadi);
   3.0..5.0 -- ushlanadi, nafas. Ko'z 0.9 va 3.7 da yumiladi. */
export function jadval(t) {
  const eg = -0.14 + 0.62 * ease((t - 1.4) / 1.6) + 0.012 * Math.sin(t * 2.4);
  const bur = 0.10 * ease((t - 1.6) / 1.4);
  const yonga = -0.05 + 0.04 * ease((t - 1.4) / 1.6);
  const yum = (c) => Math.abs(t - c) < 0.07 ? 1 : 0;      // ko'z qisish: aralash emas, almashadi (yarim shaffof ko'z chiqmasin)
  return {egilish: eg, burilish: bur, yonga, yumuq: Math.max(yum(0.9), yum(3.7))};
}

/* shamol (soch uchun): o'ngga, sal tepaga -- misolda qor o'ngga va tepaga suriladi ((+1.0, -1.0) px/tasvir),
   soch o'ngga oqadi, lekin osilib turadi (og'irlik ustun). Oldingi (+x, -0.2) tik yo'nalish qorga zid edi. */
const SHAMOL_Y = typeof location !== 'undefined' && new URLSearchParams(location.search).get('shamolY') !== null ? +new URLSearchParams(location.search).get('shamolY') : 0.2;
export function shamol(t) {
  /* shamol shiddati: sekin to'lqin + tez po'rtana (8.3 va 13.7 rad/s). Misolda ushlangan 1..6 da soch har tasvirda
     qimirlaydi (chap 40 % energiya 0.061..0.104); faqat sekin to'lqin bilan bizda 0.023..0.035 edi (audit 2) */
  const g = 1.7 + 0.8 * Math.sin(t * 1.7) + 1.3 * Math.sin(t * 8.3 + 1.0) + 0.8 * Math.sin(t * 13.7 + 2.0);
  return [g, SHAMOL_Y * g, 0.35 * Math.sin(t * 0.9)];      // tik tashkil etuvchi kichik: 0.75 da soch og'irliksiz bo'lib tepaga "alanga" bo'lardi (?shamolY= -- tekshiruv)
}

export function sahna(scene, S, W, H, kamNom) {
  const k = KAMERALAR[kamNom] || KAMERALAR.pastdan;
  const kamera = new THREE.PerspectiveCamera(k.fov, W / H, 0.1, 200);
  kamera.position.set(...k.poz); kamera.lookAt(new THREE.Vector3(...k.nishon));

  const osmon = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), S.osmon()); osmon.userData = {rol: 'osmon'};
  scene.add(osmon);

  /* qor: quti ichida, dunyo tezligi (misol: yaqin zarralar +2.9,-1.1 px/tasvir -- shamol ekranda o'ngga).
     Misolda (o'ng 55%, 320x180, top-hat>28) kadrda ~750 zarra, pastga qarab zichlashadi: choraklar 96/171/224/258,
     fon L 6 -> 51. 3D da buni yer ustidagi uchirma qor qatlami beradi: zichlik balandlikka qarab eksponent
     kamayadi (uYer, uQalin; zarra yo bor yo yo'q -- aH). Kamera sal pastdan qaraydi: yerga yaqin qatlam kadr pastida. */
  /* 9-o'tish: quti BARCHA kameralarni o'rab oladi (z 7 -> 20; 2-shot kamerasi z 10.2 da quti tashqarisida edi), zichlik
     o'sha (N 27000 -> 37029, hajm 35 -> 48 birlik z bo'yicha) */
  const N = +(new URLSearchParams(location.search).get('qorN')) || 44244, R = rng(777);
  const pos = new Float32Array(N * 3), dam = new Float32Array(N * 3), aR = new Float32Array(N), aA = new Float32Array(N), aH = new Float32Array(N), tez = new Float32Array(N * 3);
  const Q = {x: [-30, 30], y: [-12, 16], z: [+(new URLSearchParams(location.search).get('qorZ') || -28), +(new URLSearchParams(location.search).get('qorZ1') || 20)]};
  for (let i = 0; i < N; i++) {
    dam[i * 3] = Q.x[0] + R() * (Q.x[1] - Q.x[0]); dam[i * 3 + 1] = Q.y[0] + R() * (Q.y[1] - Q.y[0]); dam[i * 3 + 2] = Q.z[0] + R() * (Q.z[1] - Q.z[0]);
    aR[i] = 0.5 + Math.pow(R(), 2.5) * 1.6; aA[i] = 0.35 + R() * 0.6; aH[i] = R();
    /* tezlik misoldan: o'ng qism (faqat qor) bloklari har juftda (+1.0, -1.0) px (320x180, 60 ms; rasm y i
       pastga musbat) -- qor o'ngga va TEPAGA suriladi (shamol ko'taradi; qattiq qismlar ushlangan tasvirlarda
       ham shunday -- kamera harakati emas). Oldingi yozuvdagi -0.17 (pastga) ishora xatosi edi: 3D da
       (+0.5, 0.0) o'lchandi. 0.9 birlik/s da 3D (+0.5,-0.5) o'lchandi -> 1.7; audit 2 da (yaqin zarralar olib tashlangach) 1.7 da (+1.5,-1.5) -> 1.13 birlik/s. */
    const s = 0.7 + R() * 0.6; tez[i * 3] = 1.13 * s; tez[i * 3 + 1] = 1.13 * s; tez[i * 3 + 2] = (R() - 0.5) * 0.08;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 1)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 1)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
  const qor = new THREE.Points(g, S.qor(H)); qor.frustumCulled = false; qor.userData = {rol: 'qor'}; scene.add(qor);
  const qu = qor.material.uniforms, qp = new URLSearchParams(location.search);
  /* 9-o'tish: dunyo qori zichligining balandlik bo'yicha so'nishi va zarra soni uch shotga birga moslandi (test/fit_fon9.mjs):
     Yer -3 -> -1.59, Qalin 7 -> 15.8, N 37029 -> 44244 -- zichlik 268 / 371 / 215 (misol 270 / 273 / 273) */
  if (qu && qu.uYer) { qu.uYer.value = +(qp.get('qorYer') || -1.585); qu.uQalin.value = +(qp.get('qorQalin') || 15.81); }
  if (qu && qu.uYaqin) qu.uYaqin.value = +(qp.get('qorYaqin') || 3.0);
  const wrap = (v, a, b) => a + ((((v - a) % (b - a)) + (b - a)) % (b - a));
  qor.qadam = (t) => {
    for (let i = 0; i < N; i++) {
      const ph = i * 0.37;
      pos[i * 3] = wrap(dam[i * 3] + tez[i * 3] * t + 0.04 * Math.sin(t * 1.3 + ph), Q.x[0], Q.x[1]);
      pos[i * 3 + 1] = wrap(dam[i * 3 + 1] + tez[i * 3 + 1] * t, Q.y[0], Q.y[1]);
      pos[i * 3 + 2] = wrap(dam[i * 3 + 2] + tez[i * 3 + 2] * t + 0.03 * Math.cos(t * 0.9 + ph), Q.z[0], Q.z[1]);
    }
    g.attributes.position.needsUpdate = true;
  };
  return {kamera, osmon, qor};
}
