// Tong · kaptar — shot 2: what he is watching.
// The same lens, turned to the left and tipped up, so it looks where he looks: the flock wheels
// over the mahalla, his flag stands in the near foreground, the coop's roof is at the bottom of
// the frame, the minaret on the right, the sun just out of frame to the right. The cut comes on
// the next frame of the same clock (film time runs on from the end of shot 1), so the flock, the
// clouds and the flag carry on across it.
'use strict';

// Shot 1's lens is pitched up, but its painted layers (roofs, poles, blocks, the minaret) are drawn
// with their verticals vertical, the way a painter draws them: a lens with a rising front. Read
// as a pitched lens and turned 25°, every one of those verticals leaned 1.7°..7.5° in this shot
// (measured). So the layers are read as what they are, a level lens with its horizon raised to
// y 560, and this shot's lens is level too, with its horizon at y 652 (the 5° it looks up by):
// a pure turn about the vertical, which keeps every vertical vertical.
const CAM1S = makeCam({ pitch: 0, cy: CAM.cy + CAM.f * Math.tan(CAM.pitch) });
const S2 = { t0: DUR, dur: 4, yaw: (-25 * Math.PI) / 180, horizon: CAM.cy + CAM.f * Math.tan(CAM.pitch + (5 * Math.PI) / 180), f: CAM.f };
const cam2At = (t) => makeCam({ pos: V3(0, craneH(t), 0), yaw: S2.yaw, pitch: 0, cy: S2.horizon, f: S2.f });
const map2 = (cam, d, t) => layerMap(cam, d, t, CAM1S);

// ------------------------------------------------------------------ sky by elevation
// Shot 1 lays its sky gradient between y = -80 and y = 575 of its own frame, a vertical gradient
// by height above its horizon; this lens lays the same gradient by height above its own.
const SKY_STOPS = [[0, '#161d4a'], [0.26, '#343c7c'], [0.5, '#735f9f'], [0.7, '#c2819f'], [0.85, '#f0a98b'], [1, '#ffd89c']];
const yFrom1 = (cam, y) => cam.cy - (cam.f / CAM1S.f) * (CAM1S.cy - y);
function drawSkyCam(cam) {
  const g = ctx.createLinearGradient(0, yFrom1(cam, -80), 0, yFrom1(cam, 575));
  for (const [u, c] of SKY_STOPS) g.addColorStop(u, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
// the haze low over the far roofs, as shot 1 lays it (y 500..580 of its frame), across the frame
function drawHazeCam(cam) {
  const hz = ctx.createLinearGradient(0, yFrom1(cam, 500), 0, yFrom1(cam, 580));
  hz.addColorStop(0, 'rgba(255,200,165,0)');
  hz.addColorStop(1, 'rgba(255,196,160,0.5)');
  ctx.fillStyle = hz;
  const top = yFrom1(cam, 480);
  ctx.fillRect(0, top, W, H - top);
}
// where the sun is in this camera (it is at infinity: the crane does not move it)
const sunIn = (cam, t) => { const s = sunAt(t); const q = cam.projectDir(CAM1S.dirOf(s.x, s.y)); return V(q.x, q.y); };
// a cloud of shot 1 as this camera sees it: its anchor carried across, its size by the local scale
function cloudIn(cl, t, M) {
  const ox = cl.x - cl.speed * t, oy = cl.y;
  const a = M(ox, oy), b = M(ox + 10, oy), c = M(ox, oy + 10);
  const k = Math.sqrt(Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))) / 10;
  return { ...cl, x: a.x + cl.speed * t, y: a.y, s: cl.s * k };
}

// the prebuilt paths of shot 1's far skyline, recorded so they can be drawn through a map
let FAR_REC = null, LANDMARK_REC = null;
// a vertical gradient laid by height above the horizon, like shot 1's between its y0 and y1
function vgrad(cam, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, yFrom1(cam, y0), 0, yFrom1(cam, y1));
  for (const [u, c] of stops) g.addColorStop(u, c);
  return g;
}

// ------------------------------------------------------------------ the town left of shot 1's frame
// The left third of this frame is ground shot 1 never saw. Each layer's new part is painted by the
// same generator, at the same depth and on the same horizon, in the pixels of shot 1's lens
// mirrored in that layer's left edge (turned left by twice the edge's angle): at the edge both
// lenses see the layer at the same distance and the same scale, so the old painting and the new
// one meet without a step. The new painting runs on a little past the edge and is drawn first,
// and shot 1's layer covers the overlap (two paintings cut at one line leave a hairline of sky
// between them: measured, a 1 px light seam and a 2 px slit).
const mirrorCam = (x1) => makeCam({ yaw: 2 * Math.atan((x1 - CAM1S.cx) / CAM1S.f), pitch: 0, cy: CAM1S.cy, f: CAM1S.f });
let TOWN_B = null;
function townB() {
  if (TOWN_B) return TOWN_B;
  const cam = cam2At(S2.t0);
  // a layer whose shot-1 painting starts at x1: its mirror lens, the pixels from beyond this
  // frame's left edge up to the seam, and a sun placed as far from the seam as shot 1's is (the
  // warm light on roof edges fades with that distance, so it carries across the seam)
  const lay = (x1, sunX = 1100) => {
    const c = mirrorCam(x1), seam = 2 * CAM1S.cx - x1;
    return { cam: c, from: c.projectDir(cam.dirOf(0, cam.cy)).x - 120, to: seam, sunX: seam + (sunX - x1) };
  };
  const F = lay(-40), B = lay(-30), M0 = lay(MAHALLA[0][0].x), M1 = lay(MAHALLA[1][0].x);
  TOWN_B = {
    F, B, M0, M1,
    far: recorded(() => makeSkyline(105, 540, 14, 44, 26, 70, 0.35, F.from, F.to, false)),
    blocks: makeBlocks(113, B.from, B.to),
    rows: [makeMahallaRow(131, 588, 604, 30, M0.from, M0.to), makeMahallaRow(157, 606, 640, 16, M1.from, M1.to)],
  };
  return TOWN_B;
}

// ------------------------------------------------------------------ the wires, in the round
// Shot 1 draws its three wires as curves between two poles 12 m out (the left one just past its
// frame), hung from a crossarm drawn along the street: a painter's T, fine from the side. This
// lens looks down the street, so here they are what they are: a crossarm across the street on
// each pole, and three wires, one from each end and one from the middle, sagging in space from the
// right pole to the left one and on along the same street to the next pole (one span further, out
// of this frame), each as thick as its distance makes it. (Through the map, the arm ran along the
// street and the wires hung one behind another: they merged into one line toward the right pole;
// and one stroke has one width: the near end of a wire running away from the lens came out 45%
// too thick.)
function drawWiresCam(t, cam) {
  const d = 12, PH = 282, f1 = CAM1S.f, half = 0.36;
  const step = s3(CAM1S.unproject(POLES[1].x, 0, d), CAM1S.unproject(POLES[0].x, 0, d));
  const across = (k) => V3(0, 0, (k - 1) * half);          // wire k's place on the arm
  const at = (p, dy, k) => a3(CAM1S.unproject(p.x, p.y - PH + dy, d), across(k));
  const wire = (P0, P1, sagPx) => {
    const sag = (sagPx * d) / f1, n = 48, q = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = l3(P0, P1, u);
      q.push(cam.project(V3(p.x, p.y - 4 * sag * u * (1 - u), p.z)));
    }
    // a ribbon, not a stroke: its width follows the depth along it
    const L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const a = q[Math.max(0, i - 1)], b = q[Math.min(n, i + 1)];
      const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      const w = (1.7 * d) / q[i].z / 2;
      L.push(V(q[i].x - (ty / l) * w, q[i].y + (tx / l) * w));
      R.push(V(q[i].x + (ty / l) * w, q[i].y - (tx / l) * w));
    }
    ctx.fill(polyPath(L.concat(R.reverse())));
  };
  ctx.save();
  // the crossarms (the one on the right pole is out of frame; drawn all the same)
  ctx.fillStyle = '#2c2442';
  for (const p of POLES) {
    const q = [at(p, 12, -0.25), at(p, 12, 2.25), at(p, 17, 2.25), at(p, 17, -0.25)].map((P) => cam.project(P));
    ctx.fill(polyPath(q));
  }
  ctx.fillStyle = 'rgba(38,30,58,0.92)';
  for (let k = 0; k < 3; k++) {
    const A = at(POLES[0], 14 + k * 1.5, k), Bp = at(POLES[1], 14 + k * 1.5, k);
    wire(A, Bp, 34 + k * 3 + Math.sin(t * 1.3 + k) * 1.2);
    wire(s3(A, step), A, 34 + k * 3 + Math.sin(t * 1.3 + k + 2.1) * 1.2);   // the span on to the left
  }
  ctx.restore();
}

function renderShot2(i, only) {
  const t = S2.t0 + i / FPS;
  const tc = S2.t0 + (i - (i % 2)) / FPS;          // drawings on twos, like the end of shot 1
  const want = (k) => !only || only === k;
  const cam = cam2At(t);
  if (!FAR_REC) { FAR_REC = recorded(() => makeSkyline(5, 540, 14, 44, 26, 70, 0.35)); LANDMARK_REC = recorded(() => makeLandmark()); }
  const TB = townB();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (only) ctx.clearRect(0, 0, W, H);
  const sun = sunIn(cam, t);
  const Minf = map2(cam, 1e7, t);
  const mapB = (L, d) => layerMap(cam, d, t, L.cam);
  if (want('sky')) {
    drawSkyCam(cam);
    drawSunGlow(t, sunAt(t), Minf);
    withMap(Minf, () => drawCirrus(t));
    withMap(mapB(TB.F, 1e7), () => drawCirrus(t, 17, 4, [TB.F.from + 100, TB.F.to + 60]));
    for (const cl of CLOUDS) drawCloud(cloudIn(cl, t, Minf), t, sun);
    // the far skyline, both paintings under one gradient (two gradients meet as a seam)
    const farFill = vgrad(cam, 470, 560, FAR_STOPS);
    withMap(mapB(TB.F, 1e7), () => drawFar(t, TB.far, null, false, farFill));
    withMap(Minf, () => drawFar(t, FAR_REC, LANDMARK_REC, false, farFill));
    drawHazeCam(cam);
    const blockFill = vgrad(cam, 510, 600, BLOCK_STOPS);
    // (their walls run on down: between two houses of each near row there was sky below them)
    withMap(mapB(TB.B, 60), () => drawBlocks(t, TB.blocks, TB.B.sunX, false, blockFill, 720));
    withMap(map2(cam, 60, t), () => drawBlocks(t, BLOCKS, 1100, true, blockFill, 720));
  }
  // (its white birds' flash kept below the thrown pigeon's, which is the one to follow)
  if (want('flock')) drawFlock(t, cam, { tailCup: 0.6, whiteFlash: 0.4, whiteTone: 0.2, sun, smear: true });
  if (want('sky')) {
    // the poles (reaching on down behind the roofs), then the wires in the round
    withMap(map2(cam, 12, t), () => drawWires(t, false, false, 320, false));
    drawWiresCam(t, cam);
    withMap(mapB(TB.M0, 30), () => drawMahalla(t, 0, TB.rows, TB.M0.sunX, false));
    withMap(map2(cam, 30, t), () => drawMahalla(t, 0));
    withMap(mapB(TB.M1, 16), () => drawMahalla(t, 1, TB.rows, TB.M1.sunX, false));
    withMap(map2(cam, 16, t), () => drawMahalla(t, 1));
  }
  if (want('flag')) withMap(map2(cam, 3.4, t), () => drawPoleFlag(t));
  if (want('sky')) withMap(map2(cam, 3.4, t), () => drawParapet(t));
  if (want('coop')) {
    withMap(map2(cam, COOP_D, t), () => drawCoop(t, tc, false));
    // the pigeons on it in the round, seen from here: their feet where the coop's roof is. (The
    // middle one faced shot 1's lens three-quarters on; this lens, turned 25°, saw it dead on, a
    // view the pigeon's drawing does not hold: an upright egg with flippers, an owl. It is turned
    // 25° with the lens, a cheat the cut hides.)
    drawPerched(t, tc, (b) => {
      const W0 = CAM1S.unproject(b.x, b.y, COOP_D);
      return { proj: (p) => cam.project(a3(W0, p)), camPos: s3(cam.pos, W0), yawOff: b === PERCHED[1] ? S2.yaw : 0 };
    });
  }
  if (want('hero')) drawHeroFlying(t, cam, 12, { tailCup: 0.6, sun });
  // (the sun is 50° to the right of this lens's axis: centred on the frame, the vignette darkened
  // the sun side of the horizon by 28% and left the brightest sky in the middle, behind the flag)
  // (centred on the sun's side and wider than shot 1's: at W*0.8 with shot 1's radii it took 40%
  // off the upper left, where the flock turns, and the thrown pigeon went grey there)
  if (!only) finish(t, sun, V(W * 0.7, H * 0.55), [H * 0.5, H * 1.5]);
}

defineShot('s2', { dur: S2.dur, t0: S2.t0, render: renderShot2 });
