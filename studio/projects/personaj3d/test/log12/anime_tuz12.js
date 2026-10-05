/* STYLE: anime (tungi) -- cel soyalash (2 pog'ona), rim yorug'lik, teskari qobiq kontur,
   "satsuei" kompozit: glow, pastki gradient, don, vinyetka.
   Tonlar misoldan O'LCHANGAN qiymatlarga yaqin tanlangan (personaj/ 12-o'tish, 320x180 L):
   kapyushon tashqi sirti ~19..22, astar tasma 43..48, ich 7..9, yuz 59 (soyada 44..47),
   yorug' soch ~100, osmon 2..6. Bu TEXNIKA (ton qiymatlari), rasm emas. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VERT, vertIch, vertSoch, TASMA, YUZ_GLSL, yuzUniform, konturMaterial, osmonMaterial, qorMaterial, KOZ, KAP_U, KAP_SOYA_GLSL, YOSH_U, YOSH_GLSL, AO_U, AO_GLSL} from './umumiy.js';

const P = {   // rol: [yorug', soya] (sRGB hex; L -- 601 luma)
  teri:      ['#39374e', '#2c2944'],   // L ~58 / ~45 (audit 2: 65 o'lchandi, misol ~59)
  boyin:     ['#2c2944', '#1e1b33'],   // bo'yin jag' ostida -- asosan soyada
  soch:      ['#62648f', '#43446f'],   // L ~104 / ~73
  sochIch:   ['#46477a', '#1c1d3d'],   // ichki qatlam (qopqoq) -- doim soyada; 6-o'tish: L ~32 (edi #32335c, L ~55 -- teri 58 ga
                                       // yaqin, peshona "kal" ko'rinardi); misolda tutamlar orasidagi qorong'i chiziqlar L 20..50
  kapTashqi: ['#0f102b', '#08091c'],   // L ~19 / ~11 (audit 2: 22 o'lchandi, misol 19)
  kapIchi:   ['#26285a', '#060617'],   // L ~45 / ~8  (astar tasmasi 45 -- misol 43..48; ich 12 o'lchandi, misol 7..9)
  plash:     ['#111230', '#090a1d'],
  plashIchi: ['#0b0c22', '#07071a'],
};
const RIM = '#8f8fd0', CHIZIQ = '#07061a', YUZ_RIM = '#8a8ac4';
/* sozlash uchun: ?pal={"rol":["#yorug'","#soya"]} va ?bloom=kuch -- faqat tekshiruvda (standart qiymatlar yuqorida) */
const _q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
if (_q.get('pal')) Object.assign(P, JSON.parse(_q.get('pal')));
const BLOOM = _q.get('bloom') !== null ? +_q.get('bloom') : 0.55;
const SOCH_ESIK = _q.get('sochEsik') !== null ? +_q.get('sochEsik') : 0.05;   // soch yoritilish chegarasi (N.L)
/* 12-o'tish: kapyushon ichi qorong'i (umumiy.js AO): osmon ko'rinishi V < AO_D -- ich toni (kapIchi soyasi, misol 6..14),
   AO_D <= V < AO_S -- material soyasi, aks holda oddiy cel. ?aoD= / ?aoS= -- tekshiruv */
/* AO chegaralari -- AO_U.uAoEsik (umumiy.js; ?aoD= / ?aoS=) */
/* 12-o'tish: kapyushon SOYASI (kalit yorug'likdan, soya xaritasi) -- misolda kapyushon ostidagi soch/bosh ich toni bilan
   (L 6..14, soch soyasi 33..48 EMAS): qirra va yorug' soch orasidagi qorong'i uchburchak -- kapyushon tepasi/qirrasi soyasi */
const SOYA_QORA = _q.get('soyaQora') !== '0';

function toon(rol, ud, ikki, ichRol = 'kapIchi') {
  const [y, s] = P[rol];
  const isTeri = rol === 'teri', isSoch = rol === 'soch' || rol === 'sochIch', isKap = rol === 'kapTashqi';
  const u = {
    uY: {value: new THREE.Color(y)}, uS: {value: new THREE.Color(s)},
    uY2: {value: new THREE.Color(ikki ? P[ichRol][0] : y)}, uS2: {value: new THREE.Color(ikki ? P[ichRol][1] : s)},
    uNur: {value: rol === 'soch' ? KOZ.nurSoch : KOZ.nur}, uOrqa: {value: KOZ.orqa}, uRim: {value: new THREE.Color(RIM)},
    uYuzKuch: {value: 1.0},        // 4-o'tish: yuz chizmasi ranglari yakuniy (oldin 0.42 ga ko'paytirilardi)
    uYuzRim: {value: KOZ.yuzRim}, uYuzRimRang: {value: new THREE.Color(YUZ_RIM)},
    ...yuzUniform(ud), ...KAP_U, ...AO_U, ...(isTeri ? YOSH_U : {}), uIch: {value: new THREE.Color(P.kapIchi[1])},
  };
  const soyali = isTeri || isSoch || rol === 'boyin';           // kapyushon soyasi tushadigan qismlar
  return new THREE.ShaderMaterial({
    uniforms: u, side: ikki ? THREE.DoubleSide : THREE.FrontSide,
    vertexShader: isKap ? vertIch() : rol === 'soch' ? vertSoch() : VERT,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN; ${isKap ? 'varying float vChet;' : ''}
      uniform vec3 uY, uS, uY2, uS2, uNur, uOrqa, uRim; uniform float uYuzKuch; uniform vec3 uYuzRim, uYuzRimRang;
      ${YUZ_GLSL}
      ${isTeri ? YOSH_GLSL : ''}
      ${KAP_SOYA_GLSL}
      ${soyali ? AO_GLSL : ''}
      uniform vec3 uIch;
      void main(){
        vec3 N = normalize(vN); bool old = gl_FrontFacing; if(!old) N = -N;
        vec3 Y = old ? uY : uY2, S = old ? uS : uS2;
        float d = dot(N, uNur);
        float t = step(${rol === 'soch' ? SOCH_ESIK.toFixed(3) : '0.05'}, d);
        ${soyali ? 'float ks = kapSoya(vW, uNur); t *= ks; float ao = kapAO(vW, N); t *= step(uAoEsik.y, ao);' : ''}
        ${rol === 'sochIch' ? `t = 0.0;      // ichki soch qatlami: ustki tutamlar va kapyushon ortida -- doim soyada (yon ko'rinishda yassi yorug' "panel" bo'lmasin)` : ''}
        ${isKap ? `if(!old) t = 0.0;       // 12-o'tish: ichki mato butunlay qorong'i (misol 6..14). Oldingi chetdagi yorug' astar tasmasi (43..48)
                                 // misolda SOCH edi (ushlangan kadrlarda qimirlaydi: juft IoU 0.28..0.80, mato 0.98..0.99)` : ''}
        ${isTeri ? `t *= 1.0 - step(0.36 + 0.05 * abs(sin(vL.x * 9.0)), vL.y) * step(0.0, vL.z);   // peshonada soch soyasi -- tishli (anime belgisi)` : ''}
        vec3 c = mix(S, Y, t);
        ${soyali ? 'bool chuqur = ao < ' + (isTeri || rol === 'boyin' ? 'uAoTeri' : 'uAoEsik.x') + (SOYA_QORA ? ' || ks < 0.5' : '') + ';' : 'bool chuqur = false;'}
        vec3 V = normalize(cameraPosition - vW);
        ${isSoch ? `float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * max(dot(N, uOrqa), 0.0);
        c = mix(c, uRim * 0.55, step(0.32, rim) * 0.6);` : `// rim faqat sochda: misolda kapyushon/plash tekis yoritilmagan (L 17..21), yuzning chap cheti soyada;
        // kapyushon ichida rim soya yo'qligi uchun ichki sirtni 44 gacha yoritardi (audit 1)`}
        ${isSoch ? `vec3 Hh = normalize(uNur + V); float sp = dot(N, Hh); c = mix(c, c * 1.55 + 0.02, step(0.93, sp) * t);` : ''}
        ${isTeri ? `vec4 f = yuzRang(); c = mix(c, f.rgb * uYuzKuch * mix(0.8, 1.0, t), f.a);
        // yuz rimi (4-o'tish): misolda old kontur (burun -> og'iz -> iyak) va jag' osti chizig'i ustida 1..2 px yorug' chiziq
        // (L 64..111, yuz 59) -- old-pastdan (personaj oldi) tushgan rim; 3/4 va profilda old kontur yoritilgan
        // ingichka: faqat silueta yonida (N.V < ~0.15) -- kengroq bo'lsa burilgan burun yuzasi butunlay yorug' bo'lardi
        // geometrik normal (burun va lablar bilan; soyalash normali katta shakldan) -- profilda yuz old tekisligi yonma-yon
        // ko'ringanda katta shakl normali butun burunni yoritardi; misolda faqat burun qirrasi chizig'i yorug'
        vec3 Ng = normalize(cross(dFdx(vW), dFdy(vW))); if (dot(Ng, V) < 0.0) Ng = -Ng;
        // yo'nalishdan deyarli mustaqil (misolda old kontur, burunning YUQORI yoyi va jag' OSTI -- hammasi yorug'):
        // oldingi faqat old-past yo'nalishli rim burun yoyini yoritmasdi
        float rimY = pow(1.0 - max(dot(Ng, V), 0.0), 4.0) * (0.55 + 0.45 * max(dot(Ng, uYuzRim), 0.0));
        c = mix(c, uYuzRimRang, smoothstep(0.32, 0.38, rimY));
        c = yoshQosh(c);` : ''}
        if (chuqur) c = uIch;                 // kapyushon ichi: yuz chizmasi, rim, yosh -- hammasi qorong'ida
        ${soyali && _q.get('aoKor') ? 'c = vec3(ao * ao);  // tekshiruv: osmon ko\'rinishi (kulrang, gamma ~2)' : ''}
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

export default {
  nom: 'anime',
  adim: 2,                      // personaj 2-tasvirda bir yangilanadi (anime timing), qor har tasvirda
  izoh: "anime (tungi): 2 pog'onali cel, rim, kontur, glow + gradient + don",
  material(rol, ud) {
    if (rol === 'kapyushon') return toon('kapTashqi', ud, true);
    if (rol === 'plash') return toon('plash', ud, true, 'plashIchi');
    return toon(rol, ud, false);
  },
  kontur(rol, W, H) {
    if (rol === 'sochIch') return null;       // ichki soch qatlami chetini chizmaymiz (peshonada "chambar" chizig'i bo'lardi)
    if (rol === 'teri' && _q.get('teriKontur') !== '1') return null;   // 4-o'tish: misolda yuz qorong'i kontursiz -- old kontur,
                                              // burun yoyi va jag' osti YORUG' rim chiziq (L 64..113); qora kontur burun yoyini
                                              // qora chiziq qilib chizardi (misolda yorug')
    const px = (rol === 'soch' || rol === 'sochIch' ? 1.3 : rol === 'teri' || rol === 'boyin' ? 1.2 : 1.6) * H / 540;
    return konturMaterial(CHIZIQ, px, W, H);
  },
  osmon: () => osmonMaterial(_q.get('osT') || '#010107', _q.get('osP') || '#32326a', '', +(_q.get('osA') || -0.305), +(_q.get('osB') || 0.218)),   // 9-o'tish: dunyo osmoni, uch shotga birga (test/fit_fon9.mjs); edi -0.22 / 0.16   // fon tasmalari: misol 6/17/34/51, biz 2/14/40/52 (audit 2)     // misol fon L (o'ng 55%, choraklar): 6 / 17 / 34 / 51
  qor: (H) => qorMaterial('#d8d2fb', {qattiq: 0.35, olcham: +(_q.get('qorOlcham') || 76.5), op: 0.85, H, min: +(_q.get('qorMin') || 5.19), maks: 21}),     // 9-o'tish: dunyo qori, uch shotga birga (test/fit_fon9.mjs; zarra p90 7.0/7.5/7.3, misol 7.3/7.5/7.3); edi 70 / 4     // misol: zarra cho'qqisi L ~94, maydon mediani 2 px (320 da)
  fon: '#050512',
  post(renderer, scene, camera, W, H) {
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), BLOOM, 0.5, 0.55));
    const sat = new ShaderPass({
      uniforms: {tDiffuse: {value: null}, uKadr: {value: 0}, uRes: {value: new THREE.Vector2(W, H)}},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uKadr; uniform vec2 uRes; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uKadr*7.13) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          // pastki nur endi osmonda (fon qatlami): kadr bo'ylab qo'shilganda figuraga ham tushardi -- 12-tasvirda
          // figura pastga 23 -> 50, misolda 19..21 tekis (audit 1). Don olib tashlandi: har tasvir yangi don
          // ushlangan tasvirlarni qaynatardi va 0 da kesilib qorong'ini ko'tarardi (misol qorong'isi 0.2..0.8 tarqoq).
          c *= mix(0.82, 1.0, smoothstep(1.1, 0.35, length(vUv - vec2(0.5, 0.45)) * 1.3));   // vinyetka
          gl_FragColor = vec4(max(c, 0.0), 1.0);
        }`,
    });
    c.addPass(sat); c.addPass(new OutputPass());
    c.kadrUniform = sat.uniforms.uKadr;
    return c;
  },
};
