/* STYLE: anime (night) -- cel shading (2 steps), rim light, inverted-hull contour,
   "satsuei" composite: glow, lower gradient, grain, vignette.
   Tones are chosen close to values MEASURED from the sample (personaj/ pass 12, 320x180 L):
   hood outer surface ~19..22, lining band 43..48, inside 7..9, face 59 (in shadow 44..47),
   lit hair ~100, sky 2..6. This is TECHNIQUE (tone values), not the picture. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VERT, vertInner, vertHair, BAND, FACE_GLSL, faceUniform, contourMaterial, skyMaterial, snowMaterial, EYE, HOOD_U, HOOD_SHADOW_GLSL, TEAR_U, TEAR_GLSL, AO_U, AO_GLSL} from './common.js';

const P = {   // role: [lit, shadow] (sRGB hex; L -- 601 luma)
  skin:      ['#39374e', '#2c2944'],   // L ~58 / ~45 (audit 2: measured 65, sample ~59)
  neck:     ['#2c2944', '#1e1b33'],   // the neck is under the jaw -- mostly in shadow
  hair:      ['#62648f', '#43446f'],   // L ~104 / ~73
  hairInner:   ['#46477a', '#1c1d3d'],   // inner layer (cap shell) -- always in shadow; pass 6: L ~32 (was #32335c, L ~55 -- close to
                                       // the skin's 58, the forehead looked "bald"); in the sample the dark lines between strands are L 20..50
  hoodOuter: ['#0f102b', '#08091c'],   // L ~19 / ~11 (audit 2: measured 22, sample 19)
  hoodInner:   ['#26285a', '#060617'],   // L ~45 / ~8  (lining band 45 -- sample 43..48; inside measured 12, sample 7..9)
  cloak:     ['#111230', '#090a1d'],
  cloakInner: ['#0b0c22', '#07071a'],
};
const RIM = '#8f8fd0', LINE = '#07061a', FACE_RIM = '#8a8ac4';
/* for tuning: ?pal={"role":["#lit","#shadow"]} and ?bloom=strength -- only for checks (default values above) */
const _q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
if (_q.get('pal')) Object.assign(P, JSON.parse(_q.get('pal')));
const BLOOM = _q.get('bloom') !== null ? +_q.get('bloom') : 0.55;
const HAIR_THRESHOLD = _q.get('hairThreshold') !== null ? +_q.get('hairThreshold') : 0.05;   // hair lighting threshold (N.L)
/* pass 12: dark inside the hood (common.js AO): sky visibility V < AO_D -- inside tone (hoodInner shadow, sample 6..14),
   AO_D <= V < AO_S -- material shadow, otherwise plain cel. ?aoD= / ?aoS= -- check */
/* AO thresholds -- AO_U.uAoThreshold (common.js; ?aoD= / ?aoS=) */
/* pass 12: hood SHADOW (from the key light, shadow map) -- in the sample the hair/head under the hood has the inside tone
   (L 6..14, NOT the hair shadow 33..48): the dark triangle between the brim and the lit hair -- the shadow of the hood top/brim */
const SHADOW_BLACK = _q.get('shadowBlack') !== '0';

function toon(role, ud, two, innerRole = 'hoodInner') {
  const [y, s] = P[role];
  const isSkin = role === 'skin', isHair = role === 'hair' || role === 'hairInner', isHood = role === 'hoodOuter';
  const u = {
    uY: {value: new THREE.Color(y)}, uS: {value: new THREE.Color(s)},
    uY2: {value: new THREE.Color(two ? P[innerRole][0] : y)}, uS2: {value: new THREE.Color(two ? P[innerRole][1] : s)},
    uLight: {value: role === 'hair' ? EYE.lightHair : EYE.light}, uBack: {value: EYE.back}, uRim: {value: new THREE.Color(RIM)},
    uFaceStrength: {value: 1.0},        // pass 4: the face drawing's colours are final (before, they were multiplied by 0.42)
    uFaceRim: {value: EYE.faceRim}, uFaceRimColour: {value: new THREE.Color(FACE_RIM)},
    ...faceUniform(ud), ...HOOD_U, ...AO_U, ...(isSkin ? TEAR_U : {}), uInner: {value: new THREE.Color(P.hoodInner[1])},
  };
  const shaded = isSkin || isHair || role === 'neck';           // parts the hood shadow falls on
  return new THREE.ShaderMaterial({
    uniforms: u, side: two ? THREE.DoubleSide : THREE.FrontSide,
    vertexShader: isHood ? vertInner() : role === 'hair' ? vertHair() : VERT,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN; ${isHood ? 'varying float vEdge;' : ''}
      uniform vec3 uY, uS, uY2, uS2, uLight, uBack, uRim; uniform float uFaceStrength; uniform vec3 uFaceRim, uFaceRimColour;
      ${FACE_GLSL}
      ${isSkin ? TEAR_GLSL : ''}
      ${HOOD_SHADOW_GLSL}
      ${shaded ? AO_GLSL : ''}
      uniform vec3 uInner;
      void main(){
        vec3 N = normalize(vN); bool front = gl_FrontFacing; if(!front) N = -N;
        vec3 Y = front ? uY : uY2, S = front ? uS : uS2;
        float d = dot(N, uLight);
        float t = step(${role === 'hair' ? HAIR_THRESHOLD.toFixed(3) : '0.05'}, d);
        ${shaded ? 'float ks = hoodShadow(vW, uLight); t *= ks; float ao = hoodAO(vW, N); t *= step(uAoThreshold.y, ao);' : ''}
        ${role === 'hairInner' ? `t = 0.0;      // inner hair layer: behind the upper strands and the hood -- always in shadow (so no flat lit "panel" in the side view)` : ''}
        ${isHood ? `if(!front) t = 0.0;       // pass 12: the inner cloth is fully dark (sample 6..14). The lit lining band on the front edge (43..48)
                                 // was HAIR in the sample (it moves on held frames: pair IoU 0.28..0.80, cloth 0.98..0.99)` : ''}
        ${isSkin ? `t *= 1.0 - step(0.36 + 0.05 * abs(sin(vL.x * 9.0)), vL.y) * step(0.0, vL.z);   // hair shadow on the forehead -- jagged (an anime mark)` : ''}
        vec3 c = mix(S, Y, t);
        ${shaded ? 'bool deepShade = ao < ' + (isSkin || role === 'neck' ? 'uAoSkin' : 'uAoThreshold.x') + (SHADOW_BLACK ? ' || ks < 0.5' : '') + ';' : 'bool deepShade = false;'}
        vec3 V = normalize(cameraPosition - vW);
        ${isHair ? `float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * max(dot(N, uBack), 0.0);
        c = mix(c, uRim * 0.55, step(0.32, rim) * 0.6);` : `// rim only on the hair: in the sample the hood/cloak are flat, not lit (L 17..21), the face's left edge is in shadow;
        // inside the hood the rim had no shadow, so it lit the inner surface up to 44 (audit 1)`}
        ${isHair ? `vec3 Hh = normalize(uLight + V); float sp = dot(N, Hh); c = mix(c, c * 1.55 + 0.02, step(0.93, sp) * t);` : ''}
        ${isSkin ? `vec4 f = faceColour(); c = mix(c, f.rgb * uFaceStrength * mix(0.8, 1.0, t), f.a);
        // face rim (pass 4): in the sample a 1..2 px lit line over the front contour (nose -> mouth -> chin) and the under-jaw line
        // (L 64..111, face 59) -- a rim falling from the front-below (in front of the character); in 3/4 and profile the front contour is lit
        // thin: only next to the silhouette (N.V < ~0.15) -- if wider, the turned nose surface would be fully lit
        // geometric normal (with the nose and lips; the shading normal comes from the large shape) -- in profile, when the face's front
        // plane is seen side-on, the large shape's normal lit the whole nose; in the sample only the nose ridge line is lit
        vec3 Ng = normalize(cross(dFdx(vW), dFdy(vW))); if (dot(Ng, V) < 0.0) Ng = -Ng;
        // almost independent of direction (in the sample the front contour, the UPPER arc of the nose and UNDER the jaw -- all lit):
        // the previous rim, aimed only front-low, did not light the nose arc
        float rimY = pow(1.0 - max(dot(Ng, V), 0.0), 4.0) * (0.55 + 0.45 * max(dot(Ng, uFaceRim), 0.0));
        c = mix(c, uFaceRimColour, smoothstep(0.32, 0.38, rimY));
        c = tearBrow(c);` : ''}
        if (deepShade) c = uInner;                 // inside the hood: face drawing, rim, tear -- all in the dark
        ${shaded && _q.get('viewAo') ? 'c = vec3(ao * ao);  // check: sky visibility (grey, gamma ~2)' : ''}
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

export default {
  name: 'anime',
  stride: 2,                      // the character updates on twos (anime timing), the snow on every frame
  note: "anime (night): 2-step cel, rim, contour, glow + gradient + grain",
  material(role, ud) {
    if (role === 'hood') return toon('hoodOuter', ud, true);
    if (role === 'cloak') return toon('cloak', ud, true, 'cloakInner');
    return toon(role, ud, false);
  },
  contour(role, W, H) {
    if (role === 'hairInner') return null;       // we do not draw the edge of the inner hair layer (it would make a "headband" line on the forehead)
    if (role === 'skin' && _q.get('skinContour') !== '1') return null;   // pass 4: in the sample the face has no dark contour -- the front contour,
                                              // the nose arc and under the jaw are a LIT rim line (L 64..113); a dark contour drew
                                              // the nose arc as a dark line (lit in the sample)
    const px = (role === 'hair' || role === 'hairInner' ? 1.3 : role === 'skin' || role === 'neck' ? 1.2 : 1.6) * H / 540;
    return contourMaterial(LINE, px, W, H);
  },
  sky: () => skyMaterial(_q.get('osT') || '#010107', _q.get('osP') || '#32326a', '', +(_q.get('osA') || -0.305), +(_q.get('osB') || 0.218)),   // pass 9: the world sky, one for all three shots (test/fit_background9.mjs); was -0.22 / 0.16   // background bands: sample 6/17/34/51, ours 2/14/40/52 (audit 2)     // sample background L (right 55%, quarters): 6 / 17 / 34 / 51
  snow: (H) => snowMaterial('#d8d2fb', {rigid: 0.35, size: +(_q.get('snowSize') || 76.5), op: 0.85, H, min: +(_q.get('snowMin') || 5.19), max: 21}),     // pass 9: the world snow, one for all three shots (test/fit_background9.mjs; particle p90 7.0/7.5/7.3, sample 7.3/7.5/7.3); was 70 / 4     // sample: particle peak L ~94, median area 2 px (at 320)
  background: '#050512',
  post(renderer, scene, camera, W, H) {
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), BLOOM, 0.5, 0.55));
    const sat = new ShaderPass({
      uniforms: {tDiffuse: {value: null}, uFrame: {value: 0}, uRes: {value: new THREE.Vector2(W, H)}},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame; uniform vec2 uRes; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uFrame*7.13) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          // the lower light is now in the sky (the background layer): added over the whole frame it also fell on the figure -- on frame 12
          // the figure's bottom went 23 -> 50, in the sample a flat 19..21 (audit 1). Grain removed: fresh grain on every frame
          // made held frames boil, and clipped at 0 it raised the darks (the sample's darks are spread 0.2..0.8).
          c *= mix(0.82, 1.0, smoothstep(1.1, 0.35, length(vUv - vec2(0.5, 0.45)) * 1.3));   // vignette
          gl_FragColor = vec4(max(c, 0.0), 1.0);
        }`,
    });
    c.addPass(sat); c.addPass(new OutputPass());
    c.frameUniform = sat.uniforms.uFrame;
    return c;
  },
};
