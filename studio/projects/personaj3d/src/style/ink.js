/* STYLE: ink (manga/comic) -- white paper, black ink, shadow -- a screen raster (dotted
   screentone), dark cloth -- solid black, with a white light line on its edge. Thick contour, paper grain.
   Scene, character, motion -- all the same; only this file changes. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VERT, FACE_GLSL, faceUniform, contourMaterial, snowMaterial, EYE} from './common.js';

const PAPER = '#efece3', INK = '#0e0d12';
/* role: [lit tone 0..1 (1 = paper), shadow tone] -- the raster density comes from this tone */
const T = {
  skin: [1.0, 0.72], neck: [0.72, 0.55], hair: [1.0, 0.78], hairInner: [0.80, 0.60],
  hoodOuter: [0.0, 0.0], hoodInner: [0.55, 0.20], cloak: [0.0, 0.0], cloakInner: [0.15, 0.05],
};

const RASTER = `
float raster(float tone, float size){            // 45-degree dot raster: tone 1 -- paper, 0 -- black
  vec2 p = gl_FragCoord.xy / size; p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p;
  vec2 f = fract(p) - 0.5; float r = length(f) * 1.41;
  float k = 1.0 - tone;                             // share of black
  return (k <= 0.001) ? 1.0 : (k >= 0.999 ? 0.0 : step(sqrt(k) * 0.98, r));
}`;

function mat(role, ud, two, innerRole) {
  const [y, s] = T[role], [y2, s2] = T[innerRole || role];
  const isSkin = role === 'skin', black = y < 0.05;
  return new THREE.ShaderMaterial({
    side: two ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {uY: {value: y}, uS: {value: s}, uY2: {value: y2}, uS2: {value: s2}, uLight: {value: EYE.light}, uBack: {value: EYE.back},
               uQ: {value: new THREE.Color(PAPER)}, uK: {value: new THREE.Color(INK)}, ...faceUniform(ud)},
    vertexShader: VERT,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
      uniform float uY, uS, uY2, uS2; uniform vec3 uLight, uBack, uQ, uK;
      ${FACE_GLSL}
      ${RASTER}
      void main(){
        vec3 N = normalize(vN); bool front = gl_FrontFacing; if(!front) N = -N;
        float t = step(0.08, dot(N, uLight));
        ${isSkin ? `t *= 1.0 - step(0.36 + 0.05 * abs(sin(vL.x * 9.0)), vL.y) * step(0.0, vL.z);` : ''}
        float tone = front ? mix(uS, uY, t) : mix(uS2, uY2, t);
        float q = raster(tone, 5.0);
        ${black ? `vec3 V = normalize(cameraPosition - vW); float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * max(dot(N, uBack), 0.0);
                  q = max(q, step(0.28, rim));      // a white light line on black cloth` : ''}
        vec3 c = mix(uK, uQ, q);
        ${isSkin ? `vec4 f = faceColour(); float l = dot(f.rgb, vec3(0.299, 0.587, 0.114));
                   float fq = (l > 0.85) ? 1.0 : (l < 0.30 ? 0.0 : raster(l, 3.0));   // eye: black line, the pupil -- raster
                   c = mix(c, mix(uK, uQ, fq), f.a);` : ''}
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

export default {
  name: 'ink', stride: 2,
  note: "ink (manga): paper, black ink, dot raster, thick contour",
  material(role, ud) {
    if (role === 'hood') return mat('hoodOuter', ud, true, 'hoodInner');
    if (role === 'cloak') return mat('cloak', ud, true, 'cloakInner');
    return mat(role, ud, false);
  },
  contour(role, W, H) {
    if (role === 'hairInner') return null;
    const px = (role === 'hood' || role === 'cloak' ? 2.6 : 2.0) * H / 540;
    return contourMaterial(INK, px, W, H);
  },
  sky: () => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {uQ: {value: new THREE.Color(PAPER)}, uK: {value: new THREE.Color(INK)}},
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uQ, uK; varying vec3 vD; ${RASTER}
      void main(){ float tone = mix(0.30, 0.02, smoothstep(-0.3, 0.5, vD.y)); gl_FragColor = vec4(mix(uK, uQ, raster(tone, 6.0)), 1.0); }`,
  }),
  snow: (H) => snowMaterial('#f6f4ee', {rigid: 0.78, size: 62, op: 1.0, H}),
  background: INK,
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
          float fibre = 0.6 * n(p * vec2(0.05, 0.9)) + 0.4 * n(p * 0.35);          // paper fibre (constant -- the paper does not move)
          c *= 0.955 + 0.045 * fibre;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    c.addPass(q); c.addPass(new OutputPass());
    return c;
  },
};
