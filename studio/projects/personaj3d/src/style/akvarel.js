/* STYLE: akvarel -- yumshoq 3 pog'onali soya (o'tishlari silliq), sovuq-binafsha soyalar,
   ingichka yarim shaffof kontur; kompozit: Kuwahara (bo'yoq dog'lari), chetda pigment
   to'planishi, qog'oz tolasi va donadorlik. Harakat silliq (har tasvirda). */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VERT, YUZ_GLSL, yuzUniform, konturMaterial, osmonMaterial, qorMaterial, KOZ} from './umumiy.js';

const P = {   // rol: [yorug', o'rta, soya]
  teri:      ['#f4e1dc', '#d9c3cf', '#a79bc0'],
  boyin:     ['#d6c0cb', '#b3a6c3', '#8f86ad'],
  soch:      ['#f3f1fb', '#cfd0ee', '#9c9fd0'],
  sochIch:   ['#c9cae8', '#a9aad6', '#8487bb'],
  kapTashqi: ['#4b4f8c', '#363a73', '#262856'],
  kapIchi:   ['#9d97c9', '#77719f', '#4d4878'],
  plash:     ['#434783', '#30336a', '#22244f'],
  plashIchi: ['#2e3063', '#25274f', '#1b1c3c'],
};

function mat(rol, ud, ikki, ichRol) {
  const [a, b, c] = P[rol], [a2, b2, c2] = P[ichRol || rol];
  const isTeri = rol === 'teri';
  const C = h => ({value: new THREE.Color(h)});
  return new THREE.ShaderMaterial({
    side: ikki ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {uA: C(a), uB: C(b), uC: C(c), uA2: C(a2), uB2: C(b2), uC2: C(c2), uNur: {value: KOZ.nur}, uOrqa: {value: KOZ.orqa}, ...yuzUniform(ud)},
    vertexShader: VERT,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
      uniform vec3 uA, uB, uC, uA2, uB2, uC2, uNur, uOrqa;
      ${YUZ_GLSL}
      void main(){
        vec3 N = normalize(vN); bool old = gl_FrontFacing; if(!old) N = -N;
        float d = dot(N, uNur);
        ${isTeri ? `d -= 0.5 * smoothstep(0.30, 0.46, vL.y + 0.04 * sin(vL.x * 9.0)) * step(0.0, vL.z);` : ''}
        float t1 = smoothstep(-0.25, -0.05, d), t2 = smoothstep(0.15, 0.40, d);   // silliq o'tish
        vec3 A = old ? uA : uA2, B = old ? uB : uB2, Cc = old ? uC : uC2;
        vec3 col = mix(mix(Cc, B, t1), A, t2);
        vec3 V = normalize(cameraPosition - vW);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * max(dot(N, uOrqa), 0.0);
        col = mix(col, vec3(0.93, 0.92, 1.0), smoothstep(0.2, 0.5, rim) * 0.35);
        ${isTeri ? `vec4 f = yuzRang(); col = mix(col, f.rgb * mix(0.85, 1.0, t2), f.a * 0.92);` : ''}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

const V_POST = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

export default {
  nom: 'akvarel', adim: 1,
  izoh: "akvarel: silliq 3 pog'ona, sovuq soyalar, Kuwahara bo'yoq dog'lari, pigment cheti, qog'oz",
  material(rol, ud) {
    if (rol === 'kapyushon') return mat('kapTashqi', ud, true, 'kapIchi');
    if (rol === 'plash') return mat('plash', ud, true, 'plashIchi');
    return mat(rol, ud, false);
  },
  kontur(rol, W, H) {
    if (rol === 'sochIch') return null;
    return konturMaterial('#2a2550', 0.9 * H / 540, W, H, 0.55);
  },
  osmon: () => osmonMaterial('#26295c', '#8f8fc4'),
  qor: (H) => qorMaterial('#fbfaff', {qattiq: 0.10, olcham: 80, op: 0.75, H}),
  fon: '#26295c',
  post(renderer, scene, camera, W, H) {
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    // 1) Kuwahara: 4 sektor, radius 3 -- tekis bo'yoq dog'lari, chetlar saqlanadi
    c.addPass(new ShaderPass({
      uniforms: {tDiffuse: {value: null}, uRes: {value: new THREE.Vector2(W, H)}},
      vertexShader: V_POST,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
        void main(){
          vec2 px = 1.0 / uRes; const int R = 3;
          vec3 m[4]; vec3 s[4];
          for(int k=0;k<4;k++){ m[k]=vec3(0.0); s[k]=vec3(0.0); }
          for(int j=-R;j<=0;j++) for(int i=-R;i<=0;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)*px).rgb; m[0]+=c; s[0]+=c*c; }
          for(int j=-R;j<=0;j++) for(int i=0;i<=R;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)*px).rgb; m[1]+=c; s[1]+=c*c; }
          for(int j=0;j<=R;j++) for(int i=0;i<=R;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)*px).rgb; m[2]+=c; s[2]+=c*c; }
          for(int j=0;j<=R;j++) for(int i=-R;i<=0;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)*px).rgb; m[3]+=c; s[3]+=c*c; }
          float n = float((R+1)*(R+1)); float best = 1e9; vec3 o = vec3(0.0);
          for(int k=0;k<4;k++){ vec3 mu = m[k]/n; vec3 v = abs(s[k]/n - mu*mu); float sg = v.r+v.g+v.b; if(sg < best){ best = sg; o = mu; } }
          gl_FragColor = vec4(o, 1.0);
        }`,
    }));
    // 2) pigment cheti, qog'oz tolasi, donadorlik (qorong'i joyda ko'proq)
    c.addPass(new ShaderPass({
      uniforms: {tDiffuse: {value: null}, uRes: {value: new THREE.Vector2(W, H)}},
      vertexShader: V_POST,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec2 px = 1.0 / uRes;
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          vec3 bl = (texture2D(tDiffuse, vUv+vec2(3,0)*px).rgb + texture2D(tDiffuse, vUv-vec2(3,0)*px).rgb
                   + texture2D(tDiffuse, vUv+vec2(0,3)*px).rgb + texture2D(tDiffuse, vUv-vec2(0,3)*px).rgb) * 0.25;
          float chet = clamp(length(c - bl) * 4.0, 0.0, 1.0);
          c *= 1.0 - 0.22 * chet;                                       // pigment chetda to'planadi
          vec2 p = vUv * uRes;
          float tola = 0.55 * n(p * 0.08) + 0.30 * n(p * 0.35) + 0.15 * n(p * 1.3);
          float qor = 1.0 - dot(c, vec3(0.3, 0.59, 0.11));
          c *= 1.0 - (0.10 + 0.14 * qor) * (tola - 0.5);                  // qog'oz va donadorlik
          c = mix(c, c * vec3(1.03, 1.0, 0.97), 0.5);                     // iliq qog'oz
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    c.addPass(new OutputPass());
    return c;
  },
};
