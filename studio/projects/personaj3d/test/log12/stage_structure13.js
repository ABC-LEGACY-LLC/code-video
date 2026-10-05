/* STAGE: night snow. Sky, snow particles (in depth -- they also pass in front of the figure),
   cameras, motion table. Here the style gives only materials (sky, snow). */
import * as THREE from 'three';
import {rng} from './personaj.js';

/* cameras (personaj looks toward +x, its right side is at +z):
   below -- on the right side, low (an angle like the sample's shot 3 -- technique)
   front -- right-front 3/4 (like shot 1) */
export const CAMERAS = {
  below: {pos: [4.0, -3.0, 4.6], target: [0.40, 0.00, 0], fov: 29},
  front:     {pos: [5.6, 0.10, 3.1], target: [0.30, -0.30, 0], fov: 27},
  side:     {pos: [0.3, -0.2, 6.8], target: [0.2, -0.3, 0], fov: 28},
};

const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

/* motion table (seconds): 0..1.4 -- looks slightly up; 1.4..3.0 -- tilts down (the head sinks);
   3.0..5.0 -- held, breathing. The eyes close at 0.9 and 3.7. */
export function table(t) {
  const eg = -0.14 + 0.62 * ease((t - 1.4) / 1.6) + 0.012 * Math.sin(t * 2.4);
  const yaw = 0.10 * ease((t - 1.6) / 1.4);
  const sideways = -0.05 + 0.04 * ease((t - 1.4) / 1.6);
  const isClosed = (c) => Math.abs(t - c) < 0.07 ? 1 : 0;      // blink: not blended, it switches (so no half-transparent eye appears)
  return {tilt: eg, turn: yaw, sideways, closed: Math.max(isClosed(0.9), isClosed(3.7))};
}

/* wind (for the hair): to the right, slightly up -- in the sample the snow drifts right and up ((+1.0, -1.0) px/frame),
   the hair flows right but still hangs (weight dominates). The previous (+x, -0.2) vertical direction contradicted the snow. */
const WIND_Y = typeof location !== 'undefined' && new URLSearchParams(location.search).get('windY') !== null ? +new URLSearchParams(location.search).get('windY') : 0.2;
export function wind(t) {
  /* wind strength: a slow wave + fast gusts (8.3 and 13.7 rad/s). In the sample, during the held 1..6 the hair moves on every
     frame (left 40 % energy 0.061..0.104); with the slow wave alone ours was 0.023..0.035 (audit 2) */
  const g = 1.7 + 0.8 * Math.sin(t * 1.7) + 1.3 * Math.sin(t * 8.3 + 1.0) + 0.8 * Math.sin(t * 13.7 + 2.0);
  return [g, WIND_Y * g, 0.35 * Math.sin(t * 0.9)];      // the vertical component is small: at 0.75 the hair became weightless and "flamed" upward (?windY= -- check)
}

export function stage(scene, S, W, H, camName) {
  const k = CAMERAS[camName] || CAMERAS.below;
  const camera = new THREE.PerspectiveCamera(k.fov, W / H, 0.1, 200);
  camera.position.set(...k.pos); camera.lookAt(new THREE.Vector3(...k.target));

  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), S.sky()); sky.userData = {role: 'sky'};
  scene.add(sky);

  /* snow: inside a box, world velocity (sample: near particles +2.9,-1.1 px/frame -- the wind goes right on screen).
     In the sample (right 55%, 320x180, top-hat>28) there are ~750 particles in the frame, denser toward the bottom: quarters 96/171/224/258,
     background L 6 -> 51. In 3D this comes from a layer of drifting snow above the ground: the density falls off exponentially
     with height (uGround, uThick; a particle is either there or not -- aH). The camera looks slightly from below: the layer near the ground is at the bottom of the frame. */
  /* pass 9: the box surrounds ALL cameras (z 7 -> 20; the shot 2 camera at z 10.2 was outside the box), the density
     is the same (N 27000 -> 37029, volume 35 -> 48 units along z) */
  const N = +(new URLSearchParams(location.search).get('snowN')) || 44244, R = rng(777);
  const pos = new Float32Array(N * 3), rest = new Float32Array(N * 3), aR = new Float32Array(N), aA = new Float32Array(N), aH = new Float32Array(N), fast = new Float32Array(N * 3);
  const Q = {x: [-30, 30], y: [-12, 16], z: [+(new URLSearchParams(location.search).get('snowZ') || -28), +(new URLSearchParams(location.search).get('snowZ1') || 20)]};
  for (let i = 0; i < N; i++) {
    rest[i * 3] = Q.x[0] + R() * (Q.x[1] - Q.x[0]); rest[i * 3 + 1] = Q.y[0] + R() * (Q.y[1] - Q.y[0]); rest[i * 3 + 2] = Q.z[0] + R() * (Q.z[1] - Q.z[0]);
    aR[i] = 0.5 + Math.pow(R(), 2.5) * 1.6; aA[i] = 0.35 + R() * 0.6; aH[i] = R();
    /* velocity from the sample: the blocks of the right part (snow only) move (+1.0, -1.0) px per pair (320x180, 60 ms; image y is
       positive downward) -- the snow drifts right and UP (the wind lifts it; the same in the frames where the rigid parts are
       held -- so not camera motion). The -0.17 (down) in the previous note was a sign error: in 3D
       (+0.5, 0.0) was measured. At 0.9 units/s 3D measured (+0.5,-0.5) -> 1.7; in audit 2 (after the near particles were removed) at 1.7 (+1.5,-1.5) -> 1.13 units/s. */
    const s = 0.7 + R() * 0.6; fast[i * 3] = 1.13 * s; fast[i * 3 + 1] = 1.13 * s; fast[i * 3 + 2] = (R() - 0.5) * 0.08;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 1)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 1)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
  const snow = new THREE.Points(g, S.snow(H)); snow.frustumCulled = false; snow.userData = {role: 'snow'}; scene.add(snow);
  const qu = snow.material.uniforms, qp = new URLSearchParams(location.search);
  /* pass 9: the falloff of the world snow density with height and the particle count were fitted to the three shots together (test/fit_background9.mjs):
     Ground -3 -> -1.59, Thick 7 -> 15.8, N 37029 -> 44244 -- density 268 / 371 / 215 (sample 270 / 273 / 273) */
  if (qu && qu.uGround) { qu.uGround.value = +(qp.get('snowGround') || -1.585); qu.uThick.value = +(qp.get('snowThick') || 15.81); }
  if (qu && qu.uNear) qu.uNear.value = +(qp.get('snowNear') || 3.0);
  const wrap = (v, a, b) => a + ((((v - a) % (b - a)) + (b - a)) % (b - a));
  snow.step = (t) => {
    for (let i = 0; i < N; i++) {
      const ph = i * 0.37;
      pos[i * 3] = wrap(rest[i * 3] + fast[i * 3] * t + 0.04 * Math.sin(t * 1.3 + ph), Q.x[0], Q.x[1]);
      pos[i * 3 + 1] = wrap(rest[i * 3 + 1] + fast[i * 3 + 1] * t, Q.y[0], Q.y[1]);
      pos[i * 3 + 2] = wrap(rest[i * 3 + 2] + fast[i * 3 + 2] * t + 0.03 * Math.cos(t * 0.9 + ph), Q.z[0], Q.z[1]);
    }
    g.attributes.position.needsUpdate = true;
  };
  return {camera, sky, snow};
}
