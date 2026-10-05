// Tong · kaptar — rooftop props: the coop and its birds, the keeper's flag on its pole,
// the parapet, feathers shaken loose by the first wingbeats, dust in the low sun.
'use strict';

// A simple side-on projection for things sitting on the coop. The coop stands on this roof in
// front of the parapet, so it rises with the crane exactly as the parapet does (no sliding).
const COOP_D = 3.1;
function perchProj(sx, sy, t) {
  const k = CAM.f / COOP_D;
  const oy = craneAtZ(t, COOP_D);
  return (p) => ({ x: sx + p.x * k, y: sy - p.y * k + oy, z: COOP_D + p.z });
}
const FAR_CAM = V3(0, 0, -1000);
// feet on the roof: a little in front of its back edge (which runs from (14,586) to (334,578))
const coopRoofY = (x) => 586 - (8 * (x - 14)) / 320 + 5;
// Each bird looks round on its own beat: a head turn every 0.3..0.85 s, at moments of its own.
// (One beat for all three snapped their heads on the same frame every 10 frames: clockwork toys.
// The seeds are picked so that no two of them turn on the same frame in either shot.)
function lookBeats(seed) {
  const R = rng(seed), out = [];
  for (let t = -R() * 0.6; t < FILM_T; t += 0.3 + R() * 0.55) out.push(t);
  return out;
}
const PERCHED = [
  { x: 62, y: coopRoofY(62), yaw: -Math.PI / 2 - 0.35, look: [0, 0.5, -0.3, 0.2, 0.6], react: 0.9, sz: 0.95, beats: lookBeats(80) },
  // (this one sits facing away from the flock, which it could only see by turning round: it goes
  // on looking round; aimed at the flock, its head turned level-left, at nothing)
  { x: 176, y: coopRoofY(176), yaw: Math.PI * 0.86, look: [0.3, -0.4, 0.1, 0.5, -0.2], preen: true, react: 0.7, hop: true, sz: 1, beats: lookBeats(112), watch: false },
  { x: 292, y: coopRoofY(292), yaw: -Math.PI / 2 + 0.55, look: [-0.2, 0.3, 0.6, -0.1, 0.2], react: 0.5, sz: 0.9, beats: lookBeats(135) },
];
// (birds: draw the pigeons perched on it too; a lens other than shot 1's draws them itself, in the
// round, with drawPerched)
function drawCoop(t, tc, birds = true) {
  const oy = craneAtZ(t, COOP_D);
  ctx.save();
  ctx.translate(0, oy);
  const wood = '#34284a', woodRim = '#e6a57c';
  const boxPts = [V(24, 604), V(318, 596), V(326, 740), V(18, 740)];
  const box = polyPath(boxPts);
  // the dark inside: deeper toward the back, a perch bar, straw on the floor
  const gi = ctx.createLinearGradient(0, 600, 0, 740);
  gi.addColorStop(0, 'rgba(30,22,48,0.92)');
  gi.addColorStop(1, 'rgba(44,33,64,0.9)');
  ctx.fillStyle = gi;
  ctx.fill(box);
  ctx.save();
  ctx.clip(box);
  ctx.fillStyle = 'rgba(12,8,22,0.85)';
  ctx.fillRect(28, 662, 290, 3);
  ctx.strokeStyle = 'rgba(150,120,110,0.35)';
  ctx.lineWidth = 1;
  const Rs = rng(71);
  for (let i = 0; i < 26; i++) {
    const x = 30 + Rs() * 286, y = 716 + Rs() * 20, a = (Rs() - 0.5) * 1.2, l = 5 + Rs() * 7;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.4); ctx.stroke();
  }
  // chicken wire: hexagonal mesh, hand-stretched (never ruled), sagging a little between posts
  ctx.strokeStyle = 'rgba(165,145,195,0.3)';
  ctx.lineWidth = 0.85;
  const cw = 13, ch = 11;
  const jit = (i, j, k) => noise1(i * 1.7 + j * 3.1 + k, 41) * 1.1;
  const mesh = new Path2D();
  for (let j = 0; j < 14; j++) {
    const y0 = 598 + j * ch;
    for (let i = -1; i < 26; i++) {
      const x0 = 20 + i * cw + (j % 2) * cw / 2;
      const sag = Math.sin(((x0 - 20) / 150) * Math.PI) * 2.2;
      const P = (dx, dy, k) => V(x0 + dx + jit(i, j, k), y0 + dy + sag + jit(j, i, k + 5));
      const a = P(0, 0, 0), b = P(cw / 2, -ch * 0.3, 1), c = P(cw, 0, 2), d = P(0, ch * 0.7, 3);
      mesh.moveTo(a.x, a.y); mesh.lineTo(b.x, b.y); mesh.lineTo(c.x, c.y);
      mesh.moveTo(a.x, a.y); mesh.lineTo(d.x, d.y);
    }
  }
  ctx.stroke(mesh);
  ctx.restore();
  for (const [x, w] of [[22, 18], [168, 14], [312, 16]]) {
    const pts = [V(x, 600), V(x + w, 599), V(x + w + 3, 740), V(x + 3, 740)];
    fillRim(polyPath(pts), wood, woodRim, 2.5, LIGHT, bboxOf(pts, 6));
    ink(polyPath(pts), 1.2, 'rgba(20,14,34,0.8)');
  }
  const roofPts = [V(4, 606), V(14, 586), V(334, 578), V(344, 598)];
  const roof = polyPath(roofPts);
  fillRim(roof, '#2b2140', woodRim, 3, LIGHT, bboxOf(roofPts, 6));
  ink(roof, 2, PAL.line);
  ctx.restore();
  if (birds) drawPerched(t, tc);
}
// The pigeons on the coop's roof: folded wings, heads that snap round (on twos), one preening.
// Drawn side-on for shot 1's lens (perchProj); `lens` draws them in the round for another one:
// lens(b) -> { proj, camPos } for the bird's own space (metres from its feet, world axes). (Warped
// from shot 1's side view like a painted card, a head turned to follow the flock still showed
// shot 1's view of it: from shot 2 the turns showed as a 2 px eye mark, nothing else.)
function drawPerched(t, tc, lens = null) {
  for (const b of PERCHED) {
    // A pigeon holds its head still between turns. Before the throw these look round; once the
    // thrown one has joined them, at each turn a bird looks to where its flock is, a little off
    // its own way (they looked round at nothing, always the same way, while the flock wheeled right
    // over them). Aim: the flock's direction from the coop in the bird's own yaw (a yaw turns +z
    // toward +x, so a direction's yaw is atan2(x, z)).
    let k = 0;
    while (k < b.beats.length && b.beats[k] <= tc) k++;
    const tb = k > 0 ? b.beats[k - 1] : 0;
    const L = lens ? lens(b) : null;
    const yaw = b.yaw + (L && L.yawOff ? L.yawOff : 0);
    let hy = b.look[k % b.look.length], hp = 0.05;
    if (tb > RELEASE_T + 1.6 && b.watch !== false) {
      const d = s3(flockCentre(tb), unprojW(b.x, b.y, COOP_D, tb));
      const aim = Math.atan2(d.x, d.z) - yaw;
      hy = clamp(Math.atan2(Math.sin(aim), Math.cos(aim)) + b.look[k % b.look.length] * 0.3, -1.9, 1.9);
      hp = clamp(0.1 + 0.7 * Math.atan2(d.y, Math.hypot(d.x, d.z)), 0.05, 0.6);
    }
    if (b.preen && Math.floor(tc * 12) % 10 < 4 && tc < RELEASE_T) { hy = 2.3; hp = -0.4; }
    // the launch: heads snap up toward the thrown pigeon, one bird flicks its wings
    const since = tc - RELEASE_T;
    if (since > 0.04 && since < 1.6) { hy = b.react * (yaw < 0 ? -1 : 1) * 0.9; hp = 0.45; }
    // the middle one is startled into a little hop when the pigeon goes up past it
    const hop = b.hop && since > 0.04 && since < 0.42 ? Math.sin(((since - 0.04) / 0.38) * Math.PI) : 0;
    // alive between head turns: it breathes (on twos, like its head), and each turn of the head
    // goes through the body, a small dip and lift that settles in a few frames (they were pixel-
    // identical for all of shot 2 but for a mark in the head: statues)
    const br = Math.sin(TAU * 1.3 * tc + b.x * 0.05);
    const settle = k > 0 ? Math.exp(-(tc - tb) / 0.1) : 0;
    let F = yprFrame(frameAt(V3(0, 0.07 * b.sz + 0.03 * hop - 0.004 * settle, 0), V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)), yaw, 0.5 + 0.15 * hop + 0.06 * settle, 0);
    F = frameAt(F.o, m3(F.x, b.sz * (1 + 0.012 * br)), m3(F.y, b.sz * (1 + 0.02 * br)), m3(F.z, b.sz));
    const pp = L ? L.proj : perchProj(b.x, b.y, t);
    // feet first (the body sits on them): short, pinkish, gripping the roof edge
    ctx.fillStyle = '#b8636c';
    if (!L) {
      const kp = CAM.f / COOP_D;
      const f0 = pp(V3(0, 0, 0));
      const lift = 0.03 * hop * kp;
      for (const dx of [-0.012, 0.012]) ctx.fillRect(f0.x + dx * kp - 1.2, f0.y - 0.022 * kp - lift, 2.4, 0.022 * kp + 1);
    } else {
      for (const dx of [-0.012, 0.012]) {
        const a = pp(V3(dx, 0.022 + 0.03 * hop, 0)), c = pp(V3(dx, 0.03 * hop, 0));
        ctx.fillRect(a.x - 1.2, a.y, 2.4, c.y - a.y + 1);
      }
    }
    drawPigeon(F, pp, L ? L.camPos : FAR_CAM, { pose: GLIDE, open: 0, tail: 0.12 + 0.2 * hop, tailPitch: -0.12, headYaw: hy, headPitch: hp, fill: '#6a5c8a', fillUnder: '#5d4f7c', rim: '#ffd7ae' }, 'hero');
  }
}

// The keeper's flag: the cloth hangs from rings along the leaning pole, is pushed by the wind,
// and shades by its ripples (folds follow the wave, not screen columns).
function drawPoleFlag(t) {
  const oy = craneAtZ(t, 3.4);
  const base = V(292, 760 + oy), tip = V(150, 232 + oy);
  const up = norm(sub(tip, base)), n = perp(up);
  const pole = [add(base, mul(n, 4)), add(tip, mul(n, 2)), add(tip, mul(n, -2)), add(base, mul(n, -4))];
  fillRim(polyPath(pole), '#3a2d4f', '#f0b485', 2, LIGHT, bboxOf(pole, 4));
  const wd = windAt(t);
  const Lc = 126 * (0.92 + 0.08 * wd), Hh = 60;
  const hoist = (v) => add(tip, mul(up, -(6 + v * Hh)));
  const om = 10;   // ripple speed is constant; the gusts change how hard it ripples, not its phase
  const wave = (u, v) => (Math.sin(u * 6.2 - t * om) * 13 * Math.pow(u, 1.15) * (0.8 + 0.2 * wd) + Math.sin(u * 2.6 - t * 5.6) * 6 * u) * (1 + 0.25 * v)
    + Math.sin(u * 11 - t * 17) * 4.5 * Math.pow(u, 3) * wd * (0.4 + v);   // the snap at the free end
  const P = (u, v) => {
    const h = hoist(v);
    const droop = u * u * (18 - 6 * wd) * (0.6 + 0.4 * v);
    const curl = v * Math.pow(u, 4) * (7 + 5 * Math.sin(t * 7.3)) * wd;     // lower corner folds up
    return V(h.x + WIND_DIR * u * Lc * (1 - 0.06 * v), h.y + wave(u, v) + droop - curl);
  };
  const N = 16;
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) { top.push(P(i / N, 0)); bot.push(P(i / N, 1)); }
  // an old rag: its free end is frayed, not cut straight
  const fray = [];
  for (let k = 1; k < 10; k++) fray.push(P(1 - 0.045 * (0.5 + 0.5 * Math.sin(k * 2.7 + 1.3)) * (k % 2 ? 1 : 0.35), k / 10));
  const outline = top.concat(fray, bot.slice().reverse());
  const cloth = curvePath(outline);
  const bb = bboxOf(outline, 6);
  // folds: shade by how each strip of cloth is turned (the ripple's slope out of the picture)
  const g0 = hoist(0.5), g1 = add(g0, V(WIND_DIR * Lc, 0));
  const g = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const sl = Math.cos(u * 6.2 - t * om + 0.9) * clamp(u * 3, 0, 1);
    // light where a ripple turns to the sun, shade where it turns away (laid over the weave)
    g.addColorStop(u, sl > 0 ? `rgba(255,226,200,${(0.3 * sl).toFixed(3)})` : `rgba(28,16,44,${(0.42 * -sl).toFixed(3)})`);
  }
  ctx.save();
  ctx.lineWidth = 3.6; ctx.strokeStyle = PAL.line; ctx.lineJoin = 'round';
  ctx.stroke(cloth);
  ctx.restore();
  fillRim(cloth, '#6d4f7d', '#f3a384', 3.2, LIGHT, bb);
  // khan-atlas, faded and backlit: a wine ground with the ikat's vertical cloud motifs, each a
  // lozenge in one colour with another nested inside, their edges combed into short horizontal
  // teeth where the dyed threads bled (the thing that makes it read as atlas, not polka dots)
  ctx.save();
  ctx.clip(cloth);
  ctx.fillStyle = '#6e2a4e';
  ctx.fill(cloth);
  const lozenge = (uc, vc, du, dv, col, seed) => {
    const pts = [], N = 9;
    for (let k = 0; k <= N; k++) {                        // right edge, top to bottom
      const v = -1 + (2 * k) / N, w = 1 - Math.abs(v);
      const tooth = (k % 2 ? 1 : -0.4) * 0.35 * w + 0.12 * Math.sin(seed + k * 1.7) * w;
      pts.push(P(uc + du * (w + tooth * 0.5), vc + dv * v));
    }
    for (let k = N; k >= 0; k--) {                        // left edge, bottom to top
      const v = -1 + (2 * k) / N, w = 1 - Math.abs(v);
      const tooth = (k % 2 ? -0.4 : 1) * 0.35 * w + 0.12 * Math.sin(seed * 2 + k * 1.3) * w;
      pts.push(P(uc - du * (w + tooth * 0.5), vc + dv * v));
    }
    ctx.fillStyle = col;
    ctx.fill(polyPath(pts));
  };
  const COLS = [['#b8914e', '#3e4d85'], ['#d3c6cf', '#4c7a66'], ['#3e4d85', '#b8914e']];
  [0.16, 0.46, 0.76].forEach((uc, ci) => {
    [[0.25, 0.3], [0.78, 0.3]].forEach(([vc, dv], ri) => {
      const [c1, c2] = COLS[(ci + ri) % 3];
      lozenge(uc, vc, 0.1, dv, c1, ci * 3 + ri);
      lozenge(uc, vc, 0.045, dv * 0.55, c2, ci * 5 + ri + 2);
    });
  });
  ctx.fillStyle = g;
  ctx.fill(cloth);
  ctx.restore();
  // the sun rim again, on top of the weave
  rimOnly(cloth, '#f3a384', 3.2, LIGHT, bb);
  // rings holding the cloth to the pole
  for (const v of [0, 1]) {
    const r = hoist(v);
    ctx.strokeStyle = '#2a2038'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, 4.5, 2.2, Math.atan2(up.y, up.x) + Math.PI / 2, 0, TAU); ctx.stroke();
  }
}

function drawParapet(t) {
  const oy = craneAtZ(t, 3.4) * 1.1;
  ctx.save();
  ctx.translate(0, oy);
  const top = 676;
  const wallPts = [V(-10, top + 9), V(1290, top - 4), V(1290, 760), V(-10, 760)];
  const wall = polyPath(wallPts);
  const g = ctx.createLinearGradient(0, top, 0, 740);
  g.addColorStop(0, '#46395f');
  g.addColorStop(1, '#2f2645');
  ctx.fillStyle = g;
  ctx.fill(wall);
  ctx.save();
  ctx.clip(wall);
  ctx.strokeStyle = 'rgba(30,22,48,0.45)';
  ctx.lineWidth = 1;
  for (let r = 0; r < 4; r++) {
    const y = top + 14 + r * 15;
    ctx.beginPath(); ctx.moveTo(-10, y + 3.6); ctx.lineTo(1290, y - 9.5); ctx.stroke();
    for (let x = -10 + (r % 2) * 18; x < 1290; x += 36) {
      const yy = y + 3.6 - (x + 10) / 99;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 15); ctx.stroke();
    }
  }
  // weathering: a few darker patches where rain has run
  ctx.filter = 'blur(3px)';
  ctx.fillStyle = 'rgba(28,20,44,0.25)';
  for (const x of [380, 610, 860, 1180]) { ctx.fillRect(x, top + 8, 14 + (x % 11), 40); }
  ctx.filter = 'none';
  ctx.restore();
  const capPts = [V(-10, top + 3), V(1290, top - 10), V(1290, top - 2), V(-10, top + 12)];
  fillRim(polyPath(capPts), '#5a4b77', '#ffc690', 2.2, norm(V(0.3, -1)), bboxOf(capPts, 6));
  ctx.restore();
}

// ------------------------------------------------------------------ feathers and down
// Shaken loose by the first wingbeats: two contour feathers and a little down leave the
// pigeon's body with some of its speed, then the breeze takes them (the same wind that
// streams the flag): drag pulls each toward the wind's velocity, gravity to a slow
// terminal fall, and the feathers swing and tumble like falling leaves. Integrated in
// 1/48 s steps from their birth, so every frame is reproducible.
const FEATHERS = (() => {
  const R = rng(515);
  const out = [];
  // Two contour feathers and a wisp of down knocked loose as the wings first open over his
  // hands; each has its own drag, weight and share of the gusts, so they separate and rock
  // down near the boy instead of drifting up with the pigeon as one group.
  const born = [0.03, 0.1, 0.06];
  for (let i = 0; i < 3; i++) {
    const down = i === 2;
    out.push({ down, t0: RELEASE_T + born[i], kick: V((R() - 0.5) * 70, 10 + R() * 40),
      // terminal speeds at the pigeon's depth (~3 m, ~370 px/m): a contour feather ~0.35 m/s,
      // down ~0.12 m/s, so the feathers sink past him while the down drifts with the breeze
      tau: (down ? 0.16 : 0.3) * (0.8 + R() * 0.4), wind: (down ? 110 : 70) * (0.8 + R() * 0.4), fall: (down ? 45 : 125) * (0.85 + R() * 0.3),
      turb: 18 + R() * 22, tph: R() * 100,
      sw: down ? 4 : 11 + R() * 5, per: 0.8 + R() * 0.4, ph: R() * TAU, size: down ? 2.6 : 12 + R() * 3, spin: (R() - 0.5) * 1.5 });
  }
  return out;
})();
function featherAt(f, t) {
  const p0 = projW(heroPos(f.t0), f.t0), p1 = projW(heroPos(f.t0 + 1 / 48), f.t0 + 1 / 48);
  let x = p0.x, y = p0.y, vx = (p1.x - p0.x) * 48 * 0.3 + f.kick.x, vy = (p1.y - p0.y) * 48 * 0.3 + f.kick.y;
  const n = Math.round((t - f.t0) * 48);
  for (let k = 0; k < n; k++) {
    const tt = f.t0 + k / 48;
    // the wind plus this piece's own eddies (smooth noise, different for every piece)
    const wx = WIND_DIR * f.wind * windAt(tt) + f.turb * noise1(tt * 1.7 + f.tph, 3);
    const wy = f.fall + (f.down ? 14 * Math.sin(tt * 4.1 + f.ph) : 0) + f.turb * 0.6 * noise1(tt * 2.1 + f.tph, 5);
    const a = 1 - Math.exp(-1 / 48 / f.tau);
    vx += (wx - vx) * a; vy += (wy - vy) * a;
    x += vx / 48; y += vy / 48;
  }
  const age = t - f.t0;
  const sway = Math.sin(age * TAU / f.per + f.ph);
  return { x: x + sway * f.sw, y: y + Math.abs(sway) * 3, ang: sway * 1.1 + f.spin * age, age, flip: Math.cos(age * TAU / f.per + f.ph) };
}
function drawFeathers(t) {
  for (const f of FEATHERS) {
    if (t < f.t0) continue;
    const s = featherAt(f, t);
    if (s.x < -30 || s.y > H + 30) continue;
    const alpha = clamp(s.age * 10, 0, 1) * (f.down ? 0.8 : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(s.x, s.y + craneAt(t) * 0.9);
    ctx.rotate(s.ang);
    if (f.down) {
      // a wisp of down: three soft tufts (radial falloff, no filter)
      for (let k = 0; k < 3; k++) {
        const cx = Math.cos(k * 2.1) * f.size * 0.45, cy = Math.sin(k * 2.1) * f.size * 0.45, r = f.size * 0.85;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(236,228,244,0.85)');
        g.addColorStop(0.55, 'rgba(230,222,240,0.5)');
        g.addColorStop(1, 'rgba(230,222,240,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      }
    } else {
      // a contour feather turning over as it falls: its width follows the flip
      const L = f.size, wv = 0.35 + 0.65 * Math.abs(s.flip);
      ctx.scale(wv, 1);
      const p = new Path2D();
      p.moveTo(0, -L); p.quadraticCurveTo(L * 0.55, -L * 0.2, L * 0.1, L); p.quadraticCurveTo(-L * 0.45, 0, 0, -L);
      ctx.fillStyle = s.flip > 0 ? '#e2d9ec' : '#c9bfdb';
      ctx.fill(p);
      ctx.strokeStyle = 'rgba(150,135,185,0.9)';
      ctx.lineWidth = 0.9 / wv;
      ctx.beginPath(); ctx.moveTo(0, -L * 0.95); ctx.quadraticCurveTo(L * 0.14, 0, L * 0.06, L * 1.15); ctx.stroke();
    }
    ctx.restore();
  }
}

const MOTES = (() => { const R = rng(99); return Array.from({ length: 26 }, () => ({ x: 880 + R() * 420, y: 380 + R() * 230, s: 0.6 + R() * 1.0, ph: R() * TAU, v: 4 + R() * 10 })); })();
function drawMotes(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const m of MOTES) {
    // drift = integral of the wind (steady part plus the gusts' integral), so it never runs backwards
    const drift = t + 0.3 * (1 - Math.cos(t * 1.9 + 0.4)) / 1.9 - 0.3 * (1 - Math.cos(0.4)) / 1.9;
    const x = m.x + WIND_DIR * m.v * 1.3 * drift, y = m.y - m.v * t * 0.4 + Math.sin(t * 1.4 + m.ph) * 4;
    const a = (0.12 + 0.22 * (0.5 + 0.5 * Math.sin(t * 3 + m.ph))) * clamp(1 - Math.hypot(x - 1112, y - 500) / 420, 0, 1);
    ctx.fillStyle = `rgba(255,232,190,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, m.s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
