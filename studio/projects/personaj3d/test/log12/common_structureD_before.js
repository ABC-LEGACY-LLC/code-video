/* Shared pieces for the style modules: toon shader body, inverted-hull contour, snow,
   sky. Each style assembles its own materials from these pieces; the scene and character code
   do not know the style -- they only give a role (userData.role). */
import * as THREE from 'three';
import {FACE_UV, FACE} from '../personaj.js';

/* key light: from the front-right, low (~20 deg) -- in the sample the face and the hair inside the hood are lit (shot 1),
   when the head tilts it enters the hood's shadow (shot 3). The previous (0.55, 0.62, 0.56) was ~38 deg from above: when the
   hood covered the crown, the hair and face stayed in shadow (audit 2, lit mass 3.0 -> 0.6 %). */
export const EYE = { light: new THREE.Vector3(0.70, 0.35, 0.62).normalize(),      // moon/key light (world)
                     back: new THREE.Vector3(-0.8, 0.35, -0.3).normalize(),    // back (rim) light
                     faceRim: new THREE.Vector3(1.0, -0.35, -0.45).normalize(),    // face rim: from in front of and below the character, beyond the camera
                     lightHair: new THREE.Vector3(0.70, 0.35, 0.62).normalize() };  // key light for the hair (pass 6; check: ?hairLight=x,y,z)
if (typeof location !== 'undefined') { const sn = new URLSearchParams(location.search).get('hairLight'); if (sn) EYE.lightHair.set(...sn.split(',').map(Number)).normalize(); }
/* check (pass 12): ?light=az,el -- key light (the hair's too) az degrees from the character's front (+x) towards its right (+z), el degrees from above */
if (typeof location !== 'undefined') { const nr = new URLSearchParams(location.search).get('light'); if (nr) { const [a, e] = nr.split(',').map(v => +v * Math.PI / 180);
  EYE.light.set(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)); EYE.lightHair.copy(EYE.light); } }

/* shared vertex: world normal, world position, local position and normal (for the face projection) */
/* HOOD SHADOW (shadow map) -- from the key light's side only the hood's depth is drawn (main.js,
   orthographic camera, layer 1); the head, hair and neck learn from this map what lies behind the hood. In the
   sample's shot 3, when the head sinks into the hood, the lit mass drops 3.3 -> 1.1 %; ours grew 3.5 -> 4.8 %.
   (Approximating with a sphere was tried: the opening widens so fast at the top that the ray always left "through the opening" --
   there was almost no shadow, 174 pixels.) All materials share the same uniform objects -- main.js updates them. */
export const HOOD_U = {
  uShadowMap: {value: null}, uShadowM: {value: new THREE.Matrix4()}, uHasHood: {value: 0},
};
export const HOOD_SHADOW_GLSL = `
uniform sampler2D uShadowMap; uniform mat4 uShadowM; uniform float uHasHood;
float hoodShadow(vec3 pW, vec3 Lw){
  if (uHasHood < 0.5) return 1.0;
  vec4 c = uShadowM * vec4(pW, 1.0); vec3 s = c.xyz / c.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0) return 1.0;
  float d = texture2D(uShadowMap, s.xy).r;
  return s.z - 0.004 <= d ? 1.0 : 0.0;
}`;

/* pass 12 (structure): DARK INSIDE THE HOOD -- SKY VISIBILITY (ambient occlusion, only the hood and cloak block it).
   In the sample everything inside the hood (the inner cloth too, and the part of the head inside the hood) is one dark tone (L 6..14):
   the dark area in the three shots is in one place in head space (az -48..-72, y -0.45..+0.45 -- in 9 frames). This is lighting: no
   sky light gets into the hood. Hood+cloak depth maps along world directions (Fibonacci sphere, AO_N of them) (main.js,
   atlas AO_G x AO_G); visibility for a point V = sum(vis * max(0, N.d)) / sum(max(0, N.d)). It does not depend on the camera. */
export const AO_N = 16, AO_G = 4;
const _qs = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
export const AO_U = {
  uAoMap: {value: null}, uAoExists: {value: 0},
  /* thresholds (uniform -- changed during fitting): V < x -- inside tone (dark), x <= V < y -- material shadow */
  uAoThreshold: {value: new THREE.Vector2(_qs.get('aoD') !== null ? +_qs.get('aoD') : 0.45, _qs.get('aoS') !== null ? +_qs.get('aoS') : 0.70)},
  uAoM: {value: Array.from({length: AO_N}, () => new THREE.Matrix4())},
  uAoD: {value: Array.from({length: AO_N}, () => new THREE.Vector3(0, 1, 0))},
};
export const AO_GLSL = `
uniform sampler2D uAoMap; uniform float uAoExists; uniform mat4 uAoM[${AO_N}]; uniform vec3 uAoD[${AO_N}]; uniform vec2 uAoThreshold;
float hoodAO(vec3 pW, vec3 N){
  if (uAoExists < 0.5) return 1.0;
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
/* for the hood: aEdge (distance to the opening's edge) -> vEdge */
/* for the hair strands: shading from the mass normal (aHairN, personaj.strandGeometry) */
export const vertHair = () => VERT.replace('varying vec3 vN;', 'attribute vec3 aHairN; varying vec3 vN;').replace('vN = normalize(mat3(modelMatrix) * normal);', 'vN = normalize(mat3(modelMatrix) * aHairN);');
export const vertInner = () => VERT.replace('varying vec3 vN;', 'attribute float aEdge; varying float vEdge; varying vec3 vN;').replace('vL = position;', 'vL = position; vEdge = aEdge;');
export const BAND = 0.18;   // lining band width (units): in the 2D measurement the band is ~7 px, the head ~75 px wide (at 320) -> head width ~1.9 units

export const VERT = `
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
void main(){
  vL = position; vLN = normal;
  vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

/* face drawing (flat projection in head space) -- the character's design, the style only chooses how to blend it.
   pass 5: the NEAR EYE (and its brow) is not taken from the flat projection -- it goes through an eye map on the surface (personaj.js eyeMap):
   c = (eye centre) + (dot(P-O, T) kx, dot(P-O, U) ky). At w = 0 the map is the flat projection itself; in profile the eye
   drawing moves to the side of the head (the anime profile method, measured from the sample's shot 2). The far eye -- flat. */
const KX = (-FACE.eyeX).toFixed(4), KY = FACE.eyeY.toFixed(4);
export const EYE_U = {
  uEyeO: {value: new THREE.Vector3(-FACE.eyeX, FACE.eyeY, 0.9)}, uEyeT: {value: new THREE.Vector3(1, 0, 0)},
  uEyeU: {value: new THREE.Vector3(0, 1, 0)}, uEyeN: {value: new THREE.Vector3(0, 0, 1)}, uEyeK: {value: new THREE.Vector2(1, 1)},
};
export const FACE_GLSL = `
uniform sampler2D uFace; uniform sampler2D uFaceH; uniform sampler2D uFaceY; uniform float uClosed; uniform float uHasFace;
uniform vec3 uEyeO; uniform vec3 uEyeT; uniform vec3 uEyeU; uniform vec3 uEyeN; uniform vec2 uEyeK;
vec4 faceTex(vec2 p){
  vec2 fuv = vec2(0.5 + p.x/${FACE_UV.sx.toFixed(3)}, (p.y - (${FACE_UV.y0.toFixed(3)}))/${FACE_UV.sy.toFixed(3)});
  vec4 a = texture2D(uFace, fuv), hh = texture2D(uFaceH, fuv), b = texture2D(uFaceY, fuv);
  return uClosed < 0.25 ? a : (uClosed < 0.75 ? hh : b);     // open / half / closed -- switched, not blended
}
// box of the near eye drawing (eye, lid tip, brow, tear pool): from the eye centre |dx| < 0.16, -0.18 < dy < 0.27
float eyeBox(vec2 p){ vec2 d = p - vec2(${KX}, ${KY}); return step(abs(d.x), 0.16) * step(-0.18, d.y) * step(d.y, 0.27); }
vec4 faceColour(){
  vec4 f = faceTex(vL.xy);
  f.a *= smoothstep(0.10, 0.40, normalize(vLN).z) * step(0.0, vL.z) * (1.0 - eyeBox(vL.xy));
  vec3 d = vL - uEyeO;
  vec2 c = vec2(${KX}, ${KY}) + vec2(dot(d, uEyeT) * uEyeK.x, dot(d, uEyeU) * uEyeK.y);
  vec4 g = faceTex(c);
  g.a *= eyeBox(c) * step(length(d), 0.45) * smoothstep(0.25, 0.50, dot(normalize(vLN), uEyeN));
  return vec4(mix(f.rgb, g.rgb, g.a), max(f.a, g.a) * uHasFace);
}`;

export function faceUniform(ud) {
  const y = ud && ud.face;
  return { uFace: {value: y ? y.openness : null}, uFaceH: {value: y ? y.half : null}, uFaceY: {value: y ? y.closed : null}, uClosed: {value: 0}, uHasFace: {value: y ? 1 : 0}, ...EYE_U };
}

/* inverted-hull contour: a thickness in screen pixels (independent of distance) */
export function contourMaterial(colour, px, W, H, opacity = 1) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: opacity < 1, depthWrite: opacity >= 1,
    uniforms: {uColour: {value: new THREE.Color(colour)}, uPx: {value: px}, uRes: {value: new THREE.Vector2(W, H)}, uOp: {value: opacity}},
    vertexShader: `uniform float uPx; uniform vec2 uRes;
      void main(){
        vec4 c = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        vec3 n = normalize(normalMatrix * normal);
        vec2 d = normalize((projectionMatrix * vec4(n,0.0)).xy + 1e-6);
        c.xy += d * uPx * 2.0 / uRes * c.w;
        gl_Position = c;
      }`,
    fragmentShader: `uniform vec3 uColour; uniform float uOp; void main(){ gl_FragColor = vec4(uColour, uOp); }`,
  });
}

/* BACKGROUND "UP" -- since pass 9 always the world's up (0, 1, 0): the sky gradient and the snow density go by height
   (the tilt towards the camera from pass 5 was removed -- see the comment in main.js). The camera test (test/camera_test9.mjs) reads it. */
export const BG_U = {uBgUp: {value: new THREE.Vector3(0, 1, 0)}};
/* sky: vertical gradient (a large inner sphere) */
export function skyMaterial(top, low, extra = '', a = -0.35, b = 0.55) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {uT: {value: new THREE.Color(top)}, uP: {value: new THREE.Color(low)}, ...BG_U},
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uT; uniform vec3 uP; uniform vec3 uBgUp; varying vec3 vD;
      void main(){ float t = smoothstep(${a.toFixed(3)}, ${b.toFixed(3)}, dot(normalize(vD), uBgUp)); vec3 c = mix(uP, uT, t); ${extra} gl_FragColor = vec4(c,1.0); }`,
  });
}

/* snow particles: size depends on distance, a soft or hard disc.
   max -- the largest particle (px, at H=540): in the sample the largest particle covers ~60 px of area at 320x180 (diameter ~8.7 px) ->
   ~26 px at 540; uNear -- no particles from the camera up to this distance, they appear over the next 2 units (the stage sets it;
   audit 1: in the sample the particles in front of the figure are 7..9 % of those in the sky, ours 14..22 %, large soft discs up close);
   min -- the smallest: in the sample the median particle area is 2 px (diameter ~1.6 px at 320, ~4.8 px at 540),
   a 1 px far particle vanished when scaled down to 320; a particle very close to the camera (0.8..2.0 units) fades -- the sample has no large blurry disc.
   uGround/uThick -- the stage sets them (a dense snow layer above the ground: the density falls off exponentially with height;
   aH -- each particle's random threshold, a particle either stays or disappears). */
export function snowMaterial(colour, {rigid = 0.6, size = 60, op = 0.9, H = 540, max = 26, min = 5} = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {uColour: {value: new THREE.Color(colour)}, uS: {value: size * H / 540}, uQ: {value: rigid}, uOp: {value: op},
               uMax: {value: max * H / 540}, uMin: {value: min * H / 540}, uNear: {value: 0.8}, uGround: {value: -1e4}, uThick: {value: 1e9}, ...BG_U},
    vertexShader: `attribute float aR; attribute float aA; attribute float aH; uniform float uS; uniform float uMax; uniform float uMin; uniform float uNear; uniform float uGround; uniform float uThick; uniform vec3 uBgUp; varying float vA;
      void main(){ vec4 w = modelMatrix*vec4(position,1.0); vec4 mv = viewMatrix*w;
        gl_PointSize = clamp(uS * aR / -mv.z, uMin, uMax);
        vA = aA * smoothstep(uNear, uNear + 2.0, -mv.z);
        // the density fades with height: a particle disappears (it does not dim) -- in the sample the particles up high are bright too, only sparse
        float upHeight = dot(w.xyz, uBgUp);
        bool exists = exp(-max(0.0, upHeight - uGround) / uThick) > aH;     // height along the background's "up" (BG_U)
        gl_Position = exists ? projectionMatrix*mv : vec4(2.0, 2.0, 2.0, 1.0); }`,
    fragmentShader: `uniform vec3 uColour; uniform float uQ; uniform float uOp; varying float vA;
      void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = 1.0 - smoothstep(uQ, 1.0, r); if(a <= 0.01) discard; gl_FragColor = vec4(uColour, a * vA * uOp); }`,
  });
}

/* TEARS (pass 4) -- in the sample, in shot 1, two tear trails slide down the face (L>70 components, every frame):
   A -- straight down from under the eye (frames 1..6, fading as it slides down), B -- along the cheek from frame 5 (until frame 11),
   C -- a drop hanging at the jaw's edge (a ring, 7..9).
   Each trail is a segment in head space (a.xy -> b.xy) with a width and a strength; the values are in film.js (pose.tear), main.js sets them.
   The drawing of the shape is ours (a thin lit line); its place and timing are measured from the sample. */
export const TEAR_U = {
  uTearA: {value: new THREE.Vector4()}, uTearB: {value: new THREE.Vector4()}, uTearC: {value: new THREE.Vector3()},
  uTearW: {value: new THREE.Vector2(0.02, 0.02)}, uTearK: {value: new THREE.Vector3(0, 0, 0)},
  uTearColour: {value: new THREE.Color('#9092cc')},     // sample trail L 100..131 (at 320, 1.5..2 px)
};
export const TEAR_GLSL = `
uniform vec4 uTearA; uniform vec4 uTearB; uniform vec3 uTearC; uniform vec2 uTearW; uniform vec3 uTearK; uniform vec3 uTearColour;
float tearStrip(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0); return length(pa - ba * h); }
vec3 tearBrow(vec3 c){
  if (vL.z <= 0.0) return c;
  float front = smoothstep(0.15, 0.35, normalize(vLN).z);    // only on forward-facing surface (so it does not stretch under the jaw)
  float a = (1.0 - smoothstep(uTearW.x * 0.55, uTearW.x, tearStrip(vL.xy, uTearA.xy, uTearA.zw))) * uTearK.x;
  float b = (1.0 - smoothstep(uTearW.y * 0.55, uTearW.y, tearStrip(vL.xy, uTearB.xy, uTearB.zw))) * uTearK.y;
  // C -- a drop hanging at the jaw's edge: a ring (sample frame 7: a ~5 px lit ring)
  float dc = length(vL.xy - uTearC.xy), rc = max(uTearC.z, 1e-4);
  float h = (1.0 - smoothstep(0.22 * rc, 0.38 * rc, abs(dc - 0.72 * rc))) * uTearK.z;
  return mix(c, uTearColour, max(max(a, b), h) * front);
}`;
