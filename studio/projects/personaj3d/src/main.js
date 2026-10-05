/* ENTRY: ?style=anime|ink|watercolour &camera=below|front|side &w=960&h=540&fps=24
   window.frame(n) -- draws frame n exactly (deterministically): the physics runs in order from 0.
   When the style changes, the stage, character, motion and camera code DO NOT CHANGE -- only src/style/<name>.js. */
import * as THREE from 'three';
import {personaj, CLOTHES, HEAD, FACE, HAIR, facePoint, chinPoint, nosePoint, eyeMap, partPoints, shellDepth} from './personaj.js';
import {HOOD_U, EYE, EYE_U, BG_U, AO_U, AO_N, AO_G} from './style/common.js';
import {stage, table, wind} from './stage.js';
import {FILMS, shotTop} from './film.js';

const q = new URLSearchParams(location.search);
const STYLE = q.get('style') || 'anime', CAM = q.get('camera') || 'below';
const W = +q.get('w') || 960, H = +q.get('h') || 540, FPS = +q.get('fps') || 24;
const S = (await import(`./style/${STYLE}.js`)).default;
const STRIDE = S.stride || 1;                // every how many frames the character pose is updated (anime: 2)
const FILM = q.get('film') ? FILMS[q.get('film')] : null;   // shot list (timing and holds come from the shot)
const TFPS = FILM ? 1000 / FILM.ms : FPS;

const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene(); scene.background = new THREE.Color(S.background || '#000');
/* check/fit: ?hair={"short":{...},"near":{...}} -- hair design parameters (before the character is built) */
if (q.get('hair')) { const o = JSON.parse(q.get('hair')); for (const k in o) Object.assign(HAIR[k] || (HAIR[k] = {}), o[k]); }
const P = personaj(); scene.add(P.root); P.strands.forEach(t => scene.add(t.m));
const {camera, snow} = stage(scene, S, W, H, CAM);

for (const m of P.meshes()) {                          // style: role -> material + contour
  m.material = S.material(m.userData.role, m.userData);
  const km = S.contour && S.contour(m.userData.role, W, H);
  if (km) { const o = new THREE.Mesh(m.geometry, km); o.frustumCulled = false; o.renderOrder = -1; m.add(o); }
  m.frustumCulled = false;
}
const composer = S.post(renderer, scene, camera, W, H);
setEyeMap(0);                                              // eye map: 3/4 (the flat projection itself)
/* the falling tear drop (pass 4; sample 10-11: a bright point under the chin, the tear_jaw probe) -- at the world point
   tear.droplet of the film pose; without a depth test (a small shiny point, so it does not vanish behind the hood/cloak) */
const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), new THREE.MeshBasicMaterial({color: '#c3c5f6', depthTest: false}));
droplet.renderOrder = 10; droplet.visible = false; droplet.frustumCulled = false;
if (S.name !== 'role') scene.add(droplet);
if (q.get('clothes')) P.buildClothes(JSON.parse(q.get('clothes')));      // check: clothes parameters from the URL
/* pass 12 (fit/check): rebuild the hair in the page -- material and contour for the new strands (as above) */
window.buildHair = (o) => {
  const old = P.buildHair(o || {});
  for (const t of old) { scene.remove(t.m); t.g.dispose(); }
  for (const t of P.strands) {
    scene.add(t.m); t.m.material = S.material(t.m.userData.role, t.m.userData);
    const km = S.contour && S.contour(t.m.userData.role, W, H);
    if (km) { const ko = new THREE.Mesh(t.m.geometry, km); ko.frustumCulled = false; ko.renderOrder = -1; t.m.add(ko); }
    if ((q.get('hide') || '').split(',').includes('hair')) t.m.visible = false;
  }
  last = -1; return P.strands.length;
};
/* check: ?hide=hood,cloak -- hide roles; ?strand=5 -- only this strand red */
const HIDE = (q.get('hide') || '').split(',').filter(Boolean);
for (const m of P.meshes()) if (HIDE.includes(m.userData.role)) m.visible = false;
if (q.get('strand')) { const ti = +q.get('strand'); P.strands.forEach((t, i) => { if (i === ti) t.m.material = new THREE.MeshBasicMaterial({color: 0xff2020}); }); }
/* check: ?strands=1 -- each strand in its own colour (strand i: hue = i/N; which strand is where on screen) */
const GR = {fan: [0.08, 0.62], short: [0.33, 0.95], near: [0.75, 0.9], far: [0.55, 0.95], back: [0.0, 0.2]};   // group: [hue, lightness]
if (q.get('strands')) P.strands.forEach((t, i) => { const g = GR[t.gr];
  t.m.material = new THREE.MeshBasicMaterial({color: q.get('strands') === 'group' && g ? new THREE.Color().setHSL(g[0], 1, 0.35 + 0.3 * ((i * 7) % 5) / 4) : new THREE.Color().setHSL(i / P.strands.length, 1, 0.5)}); });

let last = -1;
function setCamera(k) {
  camera.fov = k.fov;
  if (k.az !== undefined) {                                           // orbit + lens shift (film.js comment)
    const m = new THREE.Vector3(...(k.centre || [0, 0, 0])), az = k.az * Math.PI / 180, el = k.el * Math.PI / 180;
    camera.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(k.d).add(m);
    camera.lookAt(m);
    const [sx, sy] = k.screen || [0.5, 0.5];
    camera.setViewOffset(W, H, -(sx - 0.5) * W, -(sy - 0.5) * H, W, H);
  } else { camera.position.set(...k.pos); camera.lookAt(...k.target); camera.clearViewOffset(); }
  camera.updateProjectionMatrix();
}
/* hood shadow map: an orthographic camera from the key light direction, only the hood on layer 1 */
const shadowRT = new THREE.WebGLRenderTarget(1024, 1024);
shadowRT.depthTexture = new THREE.DepthTexture(1024, 1024);
const shadowCam = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 30); shadowCam.layers.set(1);
P.hood.layers.enable(1);
HOOD_U.uShadowMap.value = shadowRT.depthTexture;
const _m = new THREE.Vector3(), _hasShadow = q.get('hoodShadow') !== '0';
/* pass 12: the hood SHADOW direction is IN THE HOOD FRAME (CLOTHES.hood.shadow = [side, up] degrees: from the hood front toward the near
   (-x) side and up) -- light enters the hood only through the opening: the part of the head/hair BEHIND the opening's brim is
   dark (sample: the dark triangle between the brim and the bright hair, in three shots). It turns together with the hood (pose)
   and does not depend on the camera. If shadow is not given -- the world key light (previous). */
const _sd = new THREE.Vector3(), _q4 = new THREE.Quaternion();
function hoodShadowOr() {
  const sy = CLOTHES.hood.shadow; if (!sy) return EYE.light;
  const a = sy[0] * Math.PI / 180, e = sy[1] * Math.PI / 180;
  _sd.set(-Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));          // in the hood frame (+z front, -x near)
  P.kHead.updateMatrixWorld(true); P.kHead.getWorldQuaternion(_q4);
  return _sd.applyQuaternion(_q4).normalize();
}
function setHoodShadow() {
  HOOD_U.uHasHood.value = _hasShadow ? 1 : 0;
  if (!_hasShadow) return;
  P.head.getWorldPosition(_m);
  shadowCam.position.copy(_m).addScaledVector(hoodShadowOr(), 12); shadowCam.lookAt(_m); shadowCam.updateMatrixWorld(true);
  HOOD_U.uShadowM.value.multiplyMatrices(shadowCam.projectionMatrix, shadowCam.matrixWorldInverse);
  const oldBg = scene.background; scene.background = null;
  renderer.setRenderTarget(shadowRT); renderer.clear(); renderer.render(scene, shadowCam); renderer.setRenderTarget(null);
  scene.background = oldBg;
}
/* pass 12: DARK INSIDE THE HOOD (the common.js AO comment) -- orthographic depth maps from AO_N world directions, in one
   atlas (AO_G x AO_G tiles); only layer 2 (hood, cloak). ?ao=0 -- off (check). */
const AO_S = 512, aoRT = new THREE.WebGLRenderTarget(AO_S * AO_G, AO_S * AO_G);
aoRT.depthTexture = new THREE.DepthTexture(AO_S * AO_G, AO_S * AO_G);
const aoCam = new THREE.OrthographicCamera(-4.5, 4.5, 4.5, -4.5, 0.1, 30); aoCam.layers.set(2);
P.hood.layers.enable(2); P.cloak.layers.enable(2);
AO_U.uAoMap.value = aoRT.depthTexture;
for (let i = 0; i < AO_N; i++) {                        // Fibonacci sphere -- world directions (the sky too, the snow/ground too)
  const y = 1 - 2 * (i + 0.5) / AO_N, r = Math.sqrt(1 - y * y), ph = i * Math.PI * (3 - Math.sqrt(5));
  AO_U.uAoD.value[i].set(r * Math.cos(ph), y, r * Math.sin(ph));
}
const _hasAo = q.get('ao') !== '0';
function setAo() {
  AO_U.uAoExists.value = _hasAo ? 1 : 0;
  if (!_hasAo) return;
  P.head.getWorldPosition(_m);
  const oldBg = scene.background; scene.background = null;
  for (let i = 0; i < AO_N; i++) {
    const d = AO_U.uAoD.value[i], gx = i % AO_G, gy = Math.floor(i / AO_G);
    aoCam.up.set(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0);
    aoCam.position.copy(_m).addScaledVector(d, 12); aoCam.lookAt(_m); aoCam.updateMatrixWorld(true);
    AO_U.uAoM.value[i].multiplyMatrices(aoCam.projectionMatrix, aoCam.matrixWorldInverse);
    aoRT.viewport.set(gx * AO_S, gy * AO_S, AO_S, AO_S); aoRT.scissor.set(gx * AO_S, gy * AO_S, AO_S, AO_S); aoRT.scissorTest = true;
    renderer.setRenderTarget(aoRT); renderer.clear(); renderer.render(scene, aoCam);
  }
  renderer.setRenderTarget(null);
  scene.background = oldBg;
}
/* tear trails (from the film pose): {A: {a:[x,y], b:[x,y], w, k}, B: {...}, C: {p:[x,y], r, k}} -- in head space */
function setTear(u, y) {
  if (!u || !u.uTearA) return;
  const A = y && y.A, B = y && y.B, C = y && y.C;
  u.uTearK.value.set(A ? A.k : 0, B ? B.k : 0, C ? C.k : 0);
  if (C) u.uTearC.value.set(C.p[0], C.p[1], C.r);
  if (A) { u.uTearA.value.set(A.a[0], A.a[1], A.b[0], A.b[1]); u.uTearW.value.x = A.w; }
  if (B) { u.uTearB.value.set(B.a[0], B.a[1], B.b[0], B.b[1]); u.uTearW.value.y = B.w; }
}
function setEyeMap(w) {                                              // the map of the near-eye drawing on the surface (the uniforms are shared)
  const c = eyeMap(w);
  EYE_U.uEyeO.value.set(...c.O); EYE_U.uEyeT.value.set(...c.T); EYE_U.uEyeU.value.set(...c.U);
  EYE_U.uEyeN.value.set(...c.N); EYE_U.uEyeK.value.set(...c.k);
}
/* pass 9: BACKGROUND AND SNOW -- IN THE WORLD. The background "top" of pass 5 (the sky gradient and the snow density direction
   tilted with the camera tilt, 22 deg in shot 3) and the snow layer of pass 8 (the snow in the shot 1 camera space, carried over
   to every shot: in the camera test 138 px at the end of the path, 398 px on the orbit -- no parallax) were removed. The sky is a world
   gradient (uBgUp is always the world up), the snow a volume that surrounds all cameras (stage.js). The sample's background plate is
   the same in all three shots (2D) -- with the world sky a difference remains in shot 3 (a residual, README pass 9). */
/* pass 9: the hood is not PER SHOT -- a single hood (CLOTHES.hood), fitted to the three shots together
   (test/fit_hood9.mjs). The shot.hood and window.__hoodShot of passes 7-8 were removed (in the camera test, a jump of
   114 / 159 px when the key changed). */
/* check/fit (pass 8): window.__camShot[shot number] = {d, screen, ...} -- on top of the shot camera; ?camShot={"1":{...}} */
if (q.get('camShot')) window.__camShot = JSON.parse(q.get('camShot'));
/* check/fit (pass 11): window.__poseShot[shot number] = {dPitch, dYaw, dSide} -- an offset on top of the shot pose
   (test/fit_pose11b.mjs; the hood rig and the hair follow this pose -- just as if film.js had changed) */
function shotPose(s, h) {
  const idx = FILM.shotList.indexOf(s), o = window.__poseShot && window.__poseShot[idx];
  return o ? {...h, tilt: h.tilt + (o.dPitch || 0), turn: h.turn + (o.dYaw || 0), sideways: (h.sideways || 0) + (o.dSide || 0)} : h;
}
function shotCamera(s) {
  const idx = FILM.shotList.indexOf(s), o = window.__camShot && window.__camShot[idx];
  return o ? {...s.camera, ...o} : s.camera;
}
/* pass 9 check (test/camera_test9.mjs): ?time=T -- time is held (wind, snow); ?patch=0 -- calibration: EVERY value tied to the
   camera or the shot (background top, snow layer, shot hood, profile, hair weight, shift) is computed at frame 0
   and frozen -- the tool must read 0 in every part (if it does not -- there is a patch we do not know of); ?synthetic=N -- calibration:
   from frame N the hood moves +0.1 in x in the world (a known distortion, the tool must see it at that value). */
const TIME = q.get('time') !== null ? +q.get('time') : null, PATCH0 = q.get('patch') === '0', SYNTHETIC = q.get('synthetic') !== null ? +q.get('synthetic') : null;
let ice = null, currentClosed = 0;
function stepFilm(f) {
  if (f === 0) ice = null;
  const {s, i} = shotTop(FILM, f);
  const ii = s.hold && s.hold.includes(i) ? s.hold[0] : i;          // held frame -- a single pose
  /* pass 11: the pose is complete -- fields missing from the shot pose are 0 (shots 1 and 2 have no sink/backward; P.pose does
     Object.assign): in out-of-order evaluation (fitting: frame 0 again after shot 3) the shot 1 head stayed at shot 3's sink/backward
     values (-0.02, ~1 px; hoodF 0.030 -> 0.019). In a sequential render (render.mjs) nothing changes. */
  const h = shotPose(s, {sideways: 0, sink: 0, backward: 0, ...s.pose(ii)});
  const cam = shotCamera(s);
  setCamera(cam);
  P.pose(h);
  P.hoodStep(1 / TFPS, i === 0);       // pass 9: a single hood, it follows the head over time (still at the start of a shot)
  /* pass 9: the eye map (profile weight), the lower-face shift and the hair view weight were removed -- a single head,
     a single hair rest shape (wherever the camera is) */
  if (PATCH0 && !ice) ice = {};
  if (SYNTHETIC !== null) P.hood.position.set(f >= SYNTHETIC ? 0.1 : 0, 0, 0).applyQuaternion(P.root.quaternion.clone().invert());   // +x in the world (the root is turned 90 deg)
  const u = P.headMesh.material.uniforms; if (u && u.uClosed) u.uClosed.value = h.closed;
  currentClosed = h.closed || 0;                                          // for the part points (the role style has no uClosed)
  const hy = (ii === i ? h : s.pose(i)).tear;        // the tear moves even on a held drawing (in the sample it flows down over 1..6)
  setTear(u, hy);
  droplet.visible = !!(hy && hy.droplet); if (droplet.visible) droplet.position.set(...hy.droplet);
  /* at the start of every shot the hair is pre-run in that shot's pose: at a cut the pose jumps (the camera is different) and
     the strands whipped upward like a "flame" (shot 2, frame 12) */
  const tt = TIME !== null ? TIME : f / TFPS;
  P.physics(1 / TFPS, wind(tt), i === 0);
  P.strandGeometry();                                                // the hair moves even when held (measured in the sample)
  snow.step(tt);
}
function step(f) {
  if (FILM) return stepFilm(f);
  const ts = Math.floor(f / STRIDE) * STRIDE / FPS;
  const h = table(ts);
  P.pose(h);
  const u = P.headMesh.material.uniforms; if (u && u.uClosed) u.uClosed.value = h.closed;
  P.physics(1 / FPS, wind(f / FPS), f === 0);
  if (f % STRIDE === 0 || f === 0) P.strandGeometry();
  snow.step(f / FPS);
}
window.frame = (n) => {
  if (n <= last) last = -1;
  for (let f = last + 1; f <= n; f++) step(f);
  last = n;
  if (composer.frameUniform) composer.frameUniform.value = n;
  setHoodShadow(); setAo();
  composer.render();
  return true;
};
window.image = () => renderer.domElement.toDataURL('image/png');
window.info = {STYLE, CAM, W, H, FPS: TFPS, STRIDE, note: S.note, film: q.get('film') || null};
/* check: for measuring the mechanism (where the hair tips are on screen) -- the last point of each strand, pixels */
/* for fitting: rebuild the clothes and read the frame mask (not background = 1) */
window.clothes = (p) => { P.buildClothes(p); last = -1; return true; };
window.__clothesCurrent = () => CLOTHES;
/* fit score inside the page: per shot the 10x10 block coverage (mean) and the head (skin+hair) pixels */
window.fitScore = (o, SHOT) => {
  if (o) window.clothes(o);
  const gl = renderer.getContext(), b = new Uint8Array(W * H * 4), BY = Math.floor(H / 10), BX = Math.floor(W / 10);
  const out = {B: {}, face: [], neck: []};
  for (const [name, fr] of Object.entries(SHOT)) {
    const acc = new Float32Array(BY * BX);
    for (const f of fr) {
      window.frame(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
      let yz = 0, by = 0;
      for (let y = 0; y < BY * 10; y++) for (let x = 0; x < BX * 10; x++) {
        const i = ((H - 1 - y) * W + x) * 4;
        if (b[i] + b[i + 1] + b[i + 2] > 30) acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
        if ((b[i] > 200 && b[i + 1] < 60 && b[i + 2] < 60) || (b[i + 1] > 200 && b[i] < 60 && b[i + 2] < 60)) yz++;
        if (b[i] > 35 && b[i] < 80 && b[i + 1] < 20 && b[i + 2] < 20) by++;                  // neck (role: 55,0,0)
      }
      out.face.push(yz); out.neck.push(by);
    }
    out.B[name] = Array.from(acc, v => v / (100 * fr.length));
  }
  return out;
};
/* pass 6 (hood fit): the sample masks are loaded once (window.__ref = {lit: [base64...], black: [...]}),
   per frame in the role render: the sample's bright hair that stays under the hood in ours (A), our visible hair
   where the sample is dark (L<30) (B), figure blocks (like fitScore), face (skin) pixels */
window.hoodScore = (o, SHOT) => {
  if (o) window.clothes(o);
  const R = window.__ref, gl = renderer.getContext(), b = new Uint8Array(W * H * 4), BY = Math.floor(H / 10), BX = Math.floor(W / 10);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  const out = {B: {}, A: {}, Bs: {}, face: [], hair: []};
  for (const [name, fr] of Object.entries(SHOT)) {
    const acc = new Float32Array(BY * BX); let lit = 0, litHood = 0, hair = 0, hairBlack = 0;
    for (const f of fr) {
      window.frame(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
      const m = R.dec[f]; let yz = 0, sc = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
        const backgroundNot = r + g + bl > 30;
        if (backgroundNot && y < BY * 10 && x < BX * 10) acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
        const hood = bl > 30 && r < 30 && (g < 30 || g > 200);                 // (0,0,255) (0,255,255) (0,0,55)
        const hairP = g > 30 && r < 30 && bl < 30;                             // (0,255,0) (0,55,0)
        const skin = r > 200 && g < 60 && bl < 60;
        if (skin) yz++;
        if (m[j] & 1) { lit++; if (hood) litHood++; }
        if (hairP) { sc++; hair++; if (m[j] & 2) hairBlack++; }
      }
      out.face.push(yz); out.hair.push(sc);
    }
    out.B[name] = Array.from(acc, v => v / (100 * fr.length));
    out.A[name] = litHood / Math.max(1, lit); out.Bs[name] = hairBlack / Math.max(1, hair);
  }
  return out;
};
/* pass 9 (single hood fit): window.__ref7 = {m: {frame: base64 mask}} -- the sample's visible head
   (test/audit_sample/head_mask.py). o -- CLOTHES.hood values (one for ALL shots), cam -- window.__camShot (shot
   camera: distance and screen). Our visible head in the role render: skin, hair, cap shell, neck, lining; in shot 3 the allowed
   box. Returns: IoU per frame, figure blocks per shot. */
window.hoodScore9 = (o, cam, fr) => {
  if (o) P.buildClothes(o.hood || o.hoodPose ? o : {hood: o});      // {hood: {...}, hoodPose: {...}} or only the hood values
  window.__camShot = cam || null; last = -1;
  const R = window.__ref7, gl = renderer.getContext(), b = new Uint8Array(W * H * 4), BY = Math.floor(H / 10), BX = Math.floor(W / 10);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  /* pass 11: if window.__viewFace = {m: {frame: base64}} is given (bit 1 -- the sample's visible skin, bit 2 -- inside the face box
     neither skin nor hair) -- per frame: hood/cloak over the sample's skin (hoodF) and our skin where the sample is
     dark (skinQ), relative to the sample's skin area */
  const YK = window.__viewFace;
  if (YK && !YK.dec) { YK.dec = {}; for (const k of Object.keys(YK.m)) { const s = atob(YK.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); YK.dec[k] = a; } }
  /* iou2 (pass 11): without the lining -- only skin/neck and hair. In shot 3 the sample shows no lining (a hair mass to the right of the face):
     when the lining was counted as "head", the fit filled the missing hair with lining (head IoU unchanged, hair+skin 73% -> 54%) */
  const out = {iou: {}, iou2: {}, ours: {}, sample: {}, B: {}, hoodF: {}, skinQ: {}};
  for (const f of fr) {
    window.frame(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const sh = f <= 10 ? 0 : f <= 12 ? 1 : 2; if (!out.B[sh]) out.B[sh] = {acc: new Float32Array(BY * BX), n: 0};
    const m = R.dec[f], yk = YK && YK.dec[f]; let I = 0, U = 0, nb = 0, nm = 0, nF = 0, kF = 0, tQ = 0, I2 = 0, U2 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
      if (r + g + bl > 30 && y < BY * 10 && x < BX * 10) out.B[sh].acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
      let head2 = (r > 30 && g < 30 && bl < 30) || (g > 30 && r < 30 && bl < 30), head = head2 || (g > 200 && bl > 200 && r < 30);   // skin/neck, hair/cap shell, lining
      if (f >= 13 && !((x <= 218) && (y <= 162) && !((x > 185) && (y > 135)))) head = head2 = false;
      const mm = m[j] & 1;
      if (head) nb++; if (mm) nm++; if (head && mm) I++; if (head || mm) U++;
      if (head2 && mm) I2++; if (head2 || mm) U2++;
      if (yk) {
        const hood = bl > 30 && g < 30 || (bl > 200 && g > 200 && r < 30);   // hood (outer, inner), cloak (outer, inner), lining
        if (yk[j] & 1) { nF++; if (hood) kF++; }
        else if ((yk[j] & 2) && r > 200 && g < 60 && bl < 60) tQ++;
      }
    }
    out.iou[f] = I / Math.max(1, U); out.iou2[f] = I2 / Math.max(1, U2); out.ours[f] = nb; out.sample[f] = nm; out.B[sh].n++;
    if (yk) { out.hoodF[f] = kF / Math.max(1, nF); out.skinQ[f] = tQ / Math.max(1, nF); }
  }
  for (const sh in out.B) out.B[sh] = Array.from(out.B[sh].acc, v => v / (100 * out.B[sh].n));
  return out;
};
/* pass 12 (structure): score BY CLASS -- window.__part = {m: {frame: base64}} (PRIVATE, test/parts/human/part_target.py):
   bit 1 -- the sample's visible head (face + hair, lit and in shadow), bit 2 -- inside the hood (in the sample the dark inside
   of the wide hood between hair and cloth), bit 4 -- figure. Ours (role): head = skin, neck, hair, cap shell (NOT the lining -- in pass 11
   the lining had filled in the missing hair); inner = the inner face of the hood/cloak; figure = not background. Returns: per frame three
   IoUs and the lining pixels. o -- buildClothes values ({hood, hoodPose, ...}), cam -- window.__camShot. */
window.hoodScore12 = (o, cam, fr) => {
  if (o) P.buildClothes(o);
  window.__camShot = cam || null; last = -1;
  const R = window.__part, gl = renderer.getContext(), b = new Uint8Array(W * H * 4);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  const out = {B: {}}, BY = Math.floor(H / 10), BX = Math.floor(W / 10);                 // B -- figure blocks (per shot, the pass 8 method)
  for (const f of fr) {
    window.frame(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const sh = f <= 10 ? 0 : f <= 12 ? 1 : 2; if (!out.B[sh]) out.B[sh] = {acc: new Float32Array(BY * BX), n: 0};
    const m = R.dec[f]; const c = {hI: 0, hU: 0, iI: 0, iU: 0, fI: 0, fU: 0, lining: 0, hOurs: 0, hSample: 0, iOurs: 0, iSample: 0};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
      let head = (r > 30 && g < 30 && bl < 30) || (g > 30 && r < 30 && bl < 30);                 // skin/neck, hair/cap shell
      if (f >= 13 && !((x <= 218) && (y <= 162) && !((x > 185) && (y > 135)))) head = false;    // the shot 3 allowed box (as in the sample mask)
      const inner = (bl > 30 && bl < 90 && r < 30 && g < 30) || (bl > 30 && bl < 90 && r > 30 && r < 90 && g < 30);   // hoodInner (0,0,55), cloakInner (55,0,55)
      const fig = r + g + bl > 30, lining = g > 200 && bl > 200 && r < 30;
      const mb = m[j] & 1, mi = m[j] & 2, mf = m[j] & 4;
      if (head && mb) c.hI++; if (head || mb) c.hU++; if (head) c.hOurs++; if (mb) c.hSample++;
      if (inner && mi) c.iI++; if (inner || mi) c.iU++; if (inner) c.iOurs++; if (mi) c.iSample++;
      if (fig && mf) c.fI++; if (fig || mf) c.fU++;
      if (fig && y < BY * 10 && x < BX * 10) out.B[sh].acc[Math.floor(y / 10) * BX + Math.floor(x / 10)] += 1;
      if (lining) c.lining++;
    }
    out.B[sh].n++;
    out[f] = {head: c.hI / Math.max(1, c.hU), inner: c.iI / Math.max(1, c.iU), figure: c.fI / Math.max(1, c.fU), lining: c.lining,
              headRatio: c.hOurs / Math.max(1, c.hSample), innerOurs: c.iOurs, innerSample: c.iSample};
  }
  for (const sh in out.B) out.B[sh] = Array.from(out.B[sh].acc, v => v / (100 * out.B[sh].n));
  return out;
};
/* pass 12 (hair): hood and cloak HIDDEN (the hair volume itself) -- is the sample's hair (window.__part bit 1 and not 8) covered
   by hair in ours (recovery), our hair on the sample's bright skin (bit 8) (covering the face). o -- for window.buildHair
   (if empty the hair does not change). The hood closes over it later -- here only the hair itself. */
window.hairScore12 = (o, fr) => {
  if (o) window.buildHair(o);
  last = -1;
  const R = window.__part, gl = renderer.getContext(), b = new Uint8Array(W * H * 4);
  if (!R.dec) { R.dec = {}; for (const k of Object.keys(R.m)) { const s = atob(R.m[k]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); R.dec[k] = a; } }
  const hide = [P.hood, P.cloak], old = hide.map(m => m.visible); hide.forEach(m => { m.visible = false; });
  const out = {};
  for (const f of fr) {
    window.frame(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const m = R.dec[f]; let nH = 0, hS = 0, hT = 0, nF = 0, fS = 0, sF = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, r = b[i], g = b[i + 1], bl = b[i + 2], j = y * W + x;
      const hair = g > 30 && r < 30 && bl < 30, skin = r > 30 && g < 30 && bl < 30;
      const mh = (m[j] & 1) && !(m[j] & 8), mf = m[j] & 8;
      if (mh) { nH++; if (hair) hS++; else if (skin) hT++; }
      if (mf) { nF++; if (hair) fS++; }
      if (hair && !(m[j] & 4)) sF++;                        // our hair on the sample's BACKGROUND (sky, snow) -- the hood does not cover it either
    }
    out[f] = {recovery: hS / Math.max(1, nH), skinInHair: hT / Math.max(1, nH), faceCover: fS / Math.max(1, nF), inBackground: sF / Math.max(1, nH), nH, nF};
  }
  hide.forEach((m, i) => { m.visible = old[i]; });
  return out;
};
/* pass 12 (structure): HOOD STRUCTURE SCORE -- which part of the sample the head shell grid (test/surface_projection.mjs, at hair
   thickness) lands on in every frame (GR[f] = {px: pixel indices, c: sample class 0 head, 1 inside, 2 outside, 3 background -- from the PRIVATE
   target, test/fit_hood_structure.mjs) and what is at that pixel in our role render (the same 4 classes; AO/hood shadow
   dark -- inside). Returns: per frame a confusion matrix (4x4, sample x ours), figure blocks (32x18) and the hood
   cloth entering the hair layer (in head space, shellDepth; upper part v < 0.7). o = {clothes, light: [az, el]} */
window.hoodStructureScore = (o, fr, GR) => {
  GR = GR || window.__GR;                             // the large grid is loaded once (test/fit_camera_structure.mjs)
  if (o.clothes) P.buildClothes(o.clothes);
  if (o.poseShot !== undefined) window.__poseShot = o.poseShot;
  if (o.camShot !== undefined) window.__camShot = o.camShot;
  if (o.light) { const a = o.light[0] * Math.PI / 180, e = o.light[1] * Math.PI / 180; EYE.light.set(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)); EYE.lightHair.copy(EYE.light); }
  if (o.ao) AO_U.uAoThreshold.value.set(o.ao[0], o.ao[1] ?? AO_U.uAoThreshold.value.y);
  if (o.aoSky !== undefined) AO_U.uAoSky.value = o.aoSky;
  if (o.aoSkin !== undefined) AO_U.uAoSkin.value = o.aoSkin;
  if (o.hair) window.buildHair(o.hair);
  last = -1;
  const gl = renderer.getContext(), b = new Uint8Array(W * H * 4), out = {};
  const classify = (r, g, bl) => {
    if ((r > 30 && g < 30 && bl < 30) || (g > 30 && r < 30 && bl < 30)) return 0;
    if (bl > 30 && bl < 90 && g < 30 && (r < 30 || r < 90)) return 1;
    return r + g + bl > 30 ? 2 : 3;
  };
  const uv = P.hood.geometry.attributes.uv, pa = P.hood.geometry.attributes.position, v3 = new THREE.Vector3(), inv = new THREE.Matrix4();
  for (const f of fr) {
    window.frame(f); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const conf = new Array(16).fill(0), g = GR[f];
    if (g) for (let i = 0; i < g.px.length; i++) { const j = g.px[i], x = j % W, y = (j / W) | 0, k = ((H - 1 - y) * W + x) * 4; conf[g.c[i] * 4 + classify(b[k], b[k + 1], b[k + 2])]++; }
    const BL = new Float32Array(32 * 18), bw = W / 32, bh = H / 18;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = ((H - 1 - y) * W + x) * 4; if (b[k] + b[k + 1] + b[k + 2] > 30) BL[Math.floor(y / bh) * 32 + Math.floor(x / bw)] += 1 / (bw * bh); }
    /* over the whole frame (window.__part -- the sample bits, PRIVATE; if present): 4x4 confusion, and the top of the frame (rows 0..topQ)
       separately -- the top part of the hair (the head shell grid does not see the strands above the head) */
    let confF = null, confT = null, hairI = 0, hairU = 0, faceS = 0, faceN = 0;
    const QM = window.__part;
    if (QM) {
      if (!QM.dec) { QM.dec = {}; for (const kk of Object.keys(QM.m)) { const s = atob(QM.m[kk]), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); QM.dec[kk] = a; } }
      const m = QM.dec[f], tq = window.__topQ || 60;
      if (m) { confF = new Array(16).fill(0); confT = new Array(16).fill(0);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = ((H - 1 - y) * W + x) * 4, bt = m[y * W + x], cm = bt & 1 ? 0 : bt & 2 ? 1 : bt & 4 ? 2 : 3, cb = classify(b[k], b[k + 1], b[k + 2]);
          confF[cm * 4 + cb]++; if (y < tq) confT[cm * 4 + cb]++;
          /* pass 13 (item 6): HAIR separately -- sample bit16 (SAM 2 hair = head minus face, run 5), ours: the role green (hair, hairInner;
             not the AO dark). bit32 (SAM 2 face) is not counted: in shot 3 the forehead strands lie over the face, and the SAM face takes them too
             (test/parts/human/sam2_hair.py) */
          const hb = b[k + 1] > 30 && b[k] < 30 && b[k + 2] < 30;
          if (!(bt & 32)) { const hm = (bt & 16) > 0; if (hm && hb) hairI++; if (hm || hb) hairU++; }
          /* the hair must not cover the face: inside the SAM face (bit32), where there is no SAM hair, our hair -- the face fraction (a penalty
             in shots 1-2; in shot 3 the sample itself has forehead strands over the face -- fit_hood_structure.mjs adds it only for s < 3) */
          else { faceN++; if (hb && !(bt & 16)) faceS++; } } }
    }
    P.hood.updateMatrixWorld(true); P.head.updateMatrixWorld(true); inv.copy(P.head.matrixWorld).invert();
    let pen = 0, nPen = 0;
    for (let i = 0; i < pa.count; i += 3) {
      if (uv.getY(i) > 0.7) continue;
      v3.fromBufferAttribute(pa, i).applyMatrix4(P.hood.matrixWorld).applyMatrix4(inv);
      const d = shellDepth([v3.x, v3.y, v3.z], 0.16);
      if (d > 0) { pen += d * d; nPen++; }
    }
    out[f] = {conf, confF, confT, hair: [hairI, hairU], face: [faceS, faceN], B: Array.from(BL, v => +v.toFixed(3)), pen, nPen};
  }
  return out;
};
/* pass 12 (check): at frame f the hair chains (with group) and the hood brim / midline IN HEAD SPACE -- for a side
   section drawing (test/parts/section.py) */
window.structureSection = (f) => {
  window.frame(f); P.head.updateMatrixWorld(true); P.hood.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(P.head.matrixWorld).invert(), v = new THREE.Vector3();
  const hair = P.strands.map(t => ({gr: t.gr, en: t.en, p: t.p.map(q => v.copy(q).applyMatrix4(inv).toArray().map(a => +a.toFixed(3)))}));
  const pa = P.hood.geometry.attributes.position, uv = P.hood.geometry.attributes.uv, brim = [], mid = [], side = [];
  for (let i = 0; i < pa.count; i++) {
    const u = uv.getX(i), w = uv.getY(i); if (w > 0.8) continue;
    v.fromBufferAttribute(pa, i).applyMatrix4(P.hood.matrixWorld).applyMatrix4(inv);
    const t = [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3), +w.toFixed(3)];
    if (u < 1e-6 || u > 1 - 1e-6) brim.push([...t, u < 0.5 ? 0 : 1]);
    if (Math.abs(u - 0.5) < 0.006) mid.push(t);
    if (Math.abs(u - 0.25) < 0.006 || Math.abs(u - 0.75) < 0.006) side.push([...t, u < 0.5 ? 0 : 1]);
  }
  return {hair, brim, mid, side};
};
/* pass 13 (check): at frame f the hair chains in WORLD space (y -- up) and the head's up/front directions in the world */
window.hairWorld = (f) => {
  window.frame(f); P.head.updateMatrixWorld(true);
  const e = P.head.matrixWorld.elements, up = [e[4], e[5], e[6]], front = [e[8], e[9], e[10]];
  return {up, front, hair: P.strands.map(t => ({gr: t.gr, p: t.p.map(v => v.toArray().map(a => +a.toFixed(3)))}))};
};
window.getMask = () => {
  const gl = renderer.getContext(), b = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
  const m = new Uint8Array(W * H), face = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = ((H - 1 - y) * W + x) * 4, j = y * W + x;
    m[j] = (b[i] + b[i + 1] + b[i + 2]) > 30 ? 1 : 0;
    face[j] = (b[i] > 200 && b[i + 1] < 60 && b[i + 2] < 60) || (b[i + 1] > 200 && b[i] < 60 && b[i + 2] < 60) ? 1 : 0;   // skin or hair
  }
  return {m: Array.from(m), face: Array.from(face)};
};
/* sets the camera and pose, returns the screen positions of points in head space (no render -- for fitting) */
window.points = (cam, pose, pts) => { setCamera(cam); camera.updateMatrixWorld(); P.pose(pose); P.head.updateMatrixWorld(true); return pts.map(p => window.headPoint(p)); };
/* face points (for fitting): given head/face parameters (temporary), pose and camera -- the screen positions.
   The head geometry is not rebuilt: the points are computed from headShape (no render). */
window.facePoints = (o) => {
  const eB = {...HEAD}, eY = {...FACE};
  Object.assign(HEAD, o.head || {}); Object.assign(FACE, o.face || {});
  setCamera(o.cam); camera.updateMatrixWorld(); P.pose(o.pose); P.head.updateMatrixWorld(true);
  const L = {near: facePoint(-FACE.eyeX, FACE.eyeY), far: facePoint(FACE.eyeX, FACE.eyeY), mouth: facePoint(0, FACE.mouthY), chin: chinPoint(), nose: nosePoint()};
  const out = {}; for (const [k, p] of Object.entries(L)) out[k] = window.headPoint(p);
  Object.assign(HEAD, eB); Object.assign(FACE, eY);
  return out;
};
window.headPoint = (p) => { const v = new THREE.Vector3(...p).applyMatrix4(P.head.matrixWorld).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
/* check (pass 7): the hood vertices that fall within r px around (X, Y) on screen -- [u, v, depth] */
window.hoodVPoint = (X, Y, r = 3) => {
  const g = P.hood.geometry, pa = g.attributes.position, uv = g.attributes.uv, v3 = new THREE.Vector3(), out = [];
  P.hood.updateMatrixWorld(true);
  for (let i = 0; i < pa.count; i++) {
    v3.fromBufferAttribute(pa, i).applyMatrix4(P.hood.matrixWorld).project(camera);
    const x = (v3.x + 1) / 2 * W, y = (1 - v3.y) / 2 * H;
    if (Math.abs(x - X) < r && Math.abs(y - Y) < r) out.push([+uv.getX(i).toFixed(3), +uv.getY(i).toFixed(3), +v3.z.toFixed(4)]);
  }
  return out;
};
/* check (pass 8): the screen positions of the near eye and chin points in the current frame (for the camera fit) */
window.faceScreen = () => ({eye: window.headPoint(facePoint(-FACE.eyeX, FACE.eyeY)), chin: window.headPoint(chinPoint()), nose: window.headPoint(nosePoint())});
window.strandTips = () => P.strands.map(t => { const v = t.p[t.p.length - 1].clone().project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
/* pass 9 check (test/camera_test9.mjs): object state -- sample points of every part IN THE WORLD (head surface, near
   eye drawing, hair, neck, hood, cloak, snow) and the background "top". With pose and time held, in a 3D-consistent world these
   do not change when the camera moves; window.proj -- the projection of the current camera (with the lens shift), px. */
const _v = new THREE.Vector3();
function specimen(mesh, nmax, out = []) {
  mesh.updateMatrixWorld(true);
  const p = mesh.geometry.attributes.position, qd = Math.max(1, Math.floor(p.count / nmax));
  for (let i = 0; i < p.count; i += qd) { _v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld); out.push(_v.x, _v.y, _v.z); }
  return out;
}
window.objects = () => {
  const o = {skin: [], hairInner: [], hair: [], neck: [], hood: [], cloak: [], eye: [], snow: []};
  for (const m of P.meshes()) { const r = m.userData.role; if (o[r]) specimen(m, r === 'hair' ? 19 : 400, o[r]); }   // hair: 19 from each strand
  const c = eyeMap(HEAD.profileW); P.headMesh.updateMatrixWorld(true);
  for (const [dx, dy] of [[0, 0], [0.12, 0], [-0.12, 0], [0, 0.06], [0, -0.06]]) {
    _v.set(...c.O.map((a, i) => a + c.T[i] * dx / c.k[0] + c.U[i] * dy / c.k[1])).applyMatrix4(P.headMesh.matrixWorld); o.eye.push(_v.x, _v.y, _v.z);
  }
  snow.updateMatrixWorld(true); specimen(snow, 280, o.snow);
  o.top = BG_U.uBgUp.value.toArray();
  return o;
};
window.proj = (a) => {
  camera.updateMatrixWorld(true); const out = [];
  for (let i = 0; i < a.length; i += 3) { _v.set(a[i], a[i + 1], a[i + 2]).project(camera); out.push((_v.x + 1) / 2 * W, (1 - _v.y) / 2 * H, _v.z); }
  return out;
};
/* pass 10 (test/parts/): the named points of every part on screen in the current frame -- [x, y (px, W x H), depth, visible
   (does the outer normal face the camera; hair/hood occlusion -- from the role render)]. The eye state (open/closed) -- the current pose
   (before, it was read from the material's uClosed -- the role style has none, and on closed frames open-eye points came out: 3.8 px vs node). */
window.framePartPoints = () => {
  P.headMesh.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  const isClosed = currentClosed > 0.5;                                        // the eye state -- from the pose (film), does not depend on the style
  const M = P.headMesh.matrixWorld, N3 = new THREE.Matrix3().getNormalMatrix(M), out = {};
  for (const [k, [p, n]] of Object.entries(partPoints(isClosed))) {
    const v = new THREE.Vector3(...p).applyMatrix4(M), nw = new THREE.Vector3(...n).applyMatrix3(N3).normalize();
    const view = nw.dot(camera.position.clone().sub(v)) > 0, s = v.clone().project(camera);
    out[k] = [(s.x + 1) / 2 * W, (1 - s.y) / 2 * H, s.z, view];
  }
  return out;
};
window.ready = true;
if (q.get('live')) { let f = 0; const loop = () => { window.frame(f++ % (5 * FPS)); setTimeout(loop, 1000 / FPS); }; loop(); }
