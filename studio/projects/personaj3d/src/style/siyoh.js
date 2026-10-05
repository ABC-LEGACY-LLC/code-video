/* STYLE: siyoh (manga/komiks) -- oq qog'oz, qora siyoh, soya -- ekran rastri (nuqtali
   screentone), qorong'i mato -- to'la qora, chetida oq nur chizig'i. Qalin kontur, qog'oz doni.
   Sahna, personaj, harakat -- o'sha-o'sha; faqat bu fayl almashadi. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VERT, YUZ_GLSL, yuzUniform, konturMaterial, qorMaterial, KOZ} from './umumiy.js';

const QOGOZ = '#efece3', SIYOH = '#0e0d12';
/* rol: [yorug' ton 0..1 (1 = qog'oz), soya ton] -- rastr zichligi shu tondan */
const T = {
  teri: [1.0, 0.72], boyin: [0.72, 0.55], soch: [1.0, 0.78], sochIch: [0.80, 0.60],
  kapTashqi: [0.0, 0.0], kapIchi: [0.55, 0.20], plash: [0.0, 0.0], plashIchi: [0.15, 0.05],
};

const RASTR = `
float rastr(float ton, float olcham){            // 45 gradus nuqtali rastr: ton 1 -- qog'oz, 0 -- qora
  vec2 p = gl_FragCoord.xy / olcham; p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p;
  vec2 f = fract(p) - 0.5; float r = length(f) * 1.41;
  float k = 1.0 - ton;                             // qoralik ulushi
  return (k <= 0.001) ? 1.0 : (k >= 0.999 ? 0.0 : step(sqrt(k) * 0.98, r));
}`;

function mat(rol, ud, ikki, ichRol) {
  const [y, s] = T[rol], [y2, s2] = T[ichRol || rol];
  const isTeri = rol === 'teri', qora = y < 0.05;
  return new THREE.ShaderMaterial({
    side: ikki ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {uY: {value: y}, uS: {value: s}, uY2: {value: y2}, uS2: {value: s2}, uNur: {value: KOZ.nur}, uOrqa: {value: KOZ.orqa},
               uQ: {value: new THREE.Color(QOGOZ)}, uK: {value: new THREE.Color(SIYOH)}, ...yuzUniform(ud)},
    vertexShader: VERT,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
      uniform float uY, uS, uY2, uS2; uniform vec3 uNur, uOrqa, uQ, uK;
      ${YUZ_GLSL}
      ${RASTR}
      void main(){
        vec3 N = normalize(vN); bool old = gl_FrontFacing; if(!old) N = -N;
        float t = step(0.08, dot(N, uNur));
        ${isTeri ? `t *= 1.0 - step(0.36 + 0.05 * abs(sin(vL.x * 9.0)), vL.y) * step(0.0, vL.z);` : ''}
        float ton = old ? mix(uS, uY, t) : mix(uS2, uY2, t);
        float q = rastr(ton, 5.0);
        ${qora ? `vec3 V = normalize(cameraPosition - vW); float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * max(dot(N, uOrqa), 0.0);
                  q = max(q, step(0.28, rim));      // qora matoda oq nur chizig'i` : ''}
        vec3 c = mix(uK, uQ, q);
        ${isTeri ? `vec4 f = yuzRang(); float l = dot(f.rgb, vec3(0.299, 0.587, 0.114));
                   float fq = (l > 0.85) ? 1.0 : (l < 0.30 ? 0.0 : rastr(l, 3.0));   // ko'z: qora chiziq, gavhar -- rastr
                   c = mix(c, mix(uK, uQ, fq), f.a);` : ''}
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

export default {
  nom: 'siyoh', adim: 2,
  izoh: "siyoh (manga): qog'oz, qora siyoh, nuqtali rastr, qalin kontur",
  material(rol, ud) {
    if (rol === 'kapyushon') return mat('kapTashqi', ud, true, 'kapIchi');
    if (rol === 'plash') return mat('plash', ud, true, 'plashIchi');
    return mat(rol, ud, false);
  },
  kontur(rol, W, H) {
    if (rol === 'sochIch') return null;
    const px = (rol === 'kapyushon' || rol === 'plash' ? 2.6 : 2.0) * H / 540;
    return konturMaterial(SIYOH, px, W, H);
  },
  osmon: () => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {uQ: {value: new THREE.Color(QOGOZ)}, uK: {value: new THREE.Color(SIYOH)}},
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uQ, uK; varying vec3 vD; ${RASTR}
      void main(){ float ton = mix(0.30, 0.02, smoothstep(-0.3, 0.5, vD.y)); gl_FragColor = vec4(mix(uK, uQ, rastr(ton, 6.0)), 1.0); }`,
  }),
  qor: (H) => qorMaterial('#f6f4ee', {qattiq: 0.78, olcham: 62, op: 1.0, H}),
  fon: SIYOH,
  post(renderer, scene, camera, W, H) {
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    const q = new ShaderPass({
      uniforms: {tDiffuse: {value: null}, uRes: {value: new THREE.Vector2(W, H)}},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          vec2 p = vUv * uRes;
          float tola = 0.6 * n(p * vec2(0.05, 0.9)) + 0.4 * n(p * 0.35);          // qog'oz tolasi (doimiy -- qog'oz qimirlamaydi)
          c *= 0.955 + 0.045 * tola;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    c.addPass(q); c.addPass(new OutputPass());
    return c;
  },
};
