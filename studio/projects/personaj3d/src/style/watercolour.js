/* STYLE: watercolour -- soft 3-step shading (smooth transitions), cool violet shadows,
   a thin semi-transparent contour; composite: Kuwahara (paint blots), pigment pooling
   at the edges, paper fibre and granulation. Smooth motion (on every frame). */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VERT, FACE_GLSL, faceUniform, contourMaterial, skyMaterial, snowMaterial, EYE} from './common.js';

const P = {   // role: [lit, mid, shadow]
  skin:      ['#f4e1dc', '#d9c3cf', '#a79bc0'],
  neck:     ['#d6c0cb', '#b3a6c3', '#8f86ad'],
  hair:      ['#f3f1fb', '#cfd0ee', '#9c9fd0'],
  hairInner:   ['#c9cae8', '#a9aad6', '#8487bb'],
  hoodOuter: ['#4b4f8c', '#363a73', '#262856'],
  hoodInner:   ['#9d97c9', '#77719f', '#4d4878'],
  cloak:     ['#434783', '#30336a', '#22244f'],
  cloakInner: ['#2e3063', '#25274f', '#1b1c3c'],
};

function mat(role, ud, two, innerRole) {
  const [a, b, c] = P[role], [a2, b2, c2] = P[innerRole || role];
  const isSkin = role === 'skin';
  const C = h => ({value: new THREE.Color(h)});
  return new THREE.ShaderMaterial({
    side: two ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {uA: C(a), uB: C(b), uC: C(c), uA2: C(a2), uB2: C(b2), uC2: C(c2), uLight: {value: EYE.light}, uBack: {value: EYE.back}, ...faceUniform(ud)},
    vertexShader: VERT,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
      uniform vec3 uA, uB, uC, uA2, uB2, uC2, uLight, uBack;
      ${FACE_GLSL}
      void main(){
        vec3 N = normalize(vN); bool front = gl_FrontFacing; if(!front) N = -N;
        float d = dot(N, uLight);
        ${isSkin ? `d -= 0.5 * smoothstep(0.30, 0.46, vL.y + 0.04 * sin(vL.x * 9.0)) * step(0.0, vL.z);` : ''}
        float t1 = smoothstep(-0.25, -0.05, d), t2 = smoothstep(0.15, 0.40, d);   // smooth transition
        vec3 A = front ? uA : uA2, B = front ? uB : uB2, Cc = front ? uC : uC2;
        vec3 col = mix(mix(Cc, B, t1), A, t2);
        vec3 V = normalize(cameraPosition - vW);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * max(dot(N, uBack), 0.0);
        col = mix(col, vec3(0.93, 0.92, 1.0), smoothstep(0.2, 0.5, rim) * 0.35);
        ${isSkin ? `vec4 f = faceColour(); col = mix(col, f.rgb * mix(0.85, 1.0, t2), f.a * 0.92);` : ''}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

const V_POST = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

export default {
  name: 'watercolour', stride: 1,
  note: "watercolour: smooth 3 steps, cool shadows, Kuwahara paint blots, pigment edge, paper",
  material(role, ud) {
    if (role === 'hood') return mat('hoodOuter', ud, true, 'hoodInner');
    if (role === 'cloak') return mat('cloak', ud, true, 'cloakInner');
    return mat(role, ud, false);
  },
  contour(role, W, H) {
    if (role === 'hairInner') return null;
    return contourMaterial('#2a2550', 0.9 * H / 540, W, H, 0.55);
  },
  sky: () => skyMaterial('#26295c', '#8f8fc4'),
  snow: (H) => snowMaterial('#fbfaff', {rigid: 0.10, size: 80, op: 0.75, H}),
  background: '#26295c',
  post(renderer, scene, camera, W, H) {
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    // 1) Kuwahara: 4 sectors, radius 3 -- flat paint blots, edges are kept
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
    // 2) pigment edge, paper fibre, granulation (more in dark areas)
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
          float edge = clamp(length(c - bl) * 4.0, 0.0, 1.0);
          c *= 1.0 - 0.22 * edge;                                       // pigment pools at the edges
          vec2 p = vUv * uRes;
          float fibre = 0.55 * n(p * 0.08) + 0.30 * n(p * 0.35) + 0.15 * n(p * 1.3);
          float snow = 1.0 - dot(c, vec3(0.3, 0.59, 0.11));
          c *= 1.0 - (0.10 + 0.14 * snow) * (fibre - 0.5);                  // paper and granulation
          c = mix(c, c * vec3(1.03, 1.0, 0.97), 0.5);                     // warm paper
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    c.addPass(new OutputPass());
    return c;
  },
};
