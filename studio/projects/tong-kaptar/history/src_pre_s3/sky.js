// Tong · kaptar — sky: gradient, last stars, sun, light shafts, cirrus, cumulus.
'use strict';

function drawSky(t) {
  const g = ctx.createLinearGradient(0, -80, 0, 575);
  g.addColorStop(0.0, '#161d4a');
  g.addColorStop(0.26, '#343c7c');
  g.addColorStop(0.5, '#735f9f');
  g.addColorStop(0.7, '#c2819f');
  g.addColorStop(0.85, '#f0a98b');
  g.addColorStop(1.0, '#ffd89c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// The last stars of the night, only in the dark top band, fading as the sky brightens.
const STARS = (() => {
  const R = rng(404);
  return Array.from({ length: 26 }, () => ({ x: R() * W, y: 8 + Math.pow(R(), 1.6) * 190, s: 0.5 + R() * 0.9, ph: R() * TAU, b: 0.35 + R() * 0.65 }));
})();
function drawStars(t) {
  ctx.save();
  for (const st of STARS) {
    // the sun is up: only the brightest few still show, high in the dark blue, and they fade out
    if (st.b < 0.75) continue;
    const fade = clamp((150 - st.y) / 110, 0, 1) * (1 - sstep(0, DUR * 0.8, t)) * 0.6;
    const a = st.b * fade * (0.75 + 0.25 * Math.sin(t * 4.5 + st.ph));
    if (a < 0.03) continue;
    ctx.fillStyle = `rgba(236,232,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.s, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// the sun has just cleared the far roofs: the upper part of its disk shows above the skyline
const sunAt = (t) => V(1112, 497 - t * 1.6);
const offS2 = mk(W / 2, H / 2);
// M (optional): a map from shot 1's pixels into another lens. The glow and the shafts are laid
// out in shot 1's frame, where the sun is, and every point is carried across, so another lens
// sees the same light coming from the same sun, even with the sun out of its frame.
function drawSunGlow(t, s = sunAt(t), M = null) {
  const P = M || ((x, y) => V(x, y));
  const c = P(s.x, s.y);
  const r = M ? len(sub(P(s.x - 640, s.y), c)) : 640;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const rg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
  rg.addColorStop(0, 'rgba(255,242,210,0.95)');
  rg.addColorStop(0.07, 'rgba(255,224,168,0.7)');
  rg.addColorStop(0.24, 'rgba(255,186,150,0.3)');
  rg.addColorStop(0.55, 'rgba(226,138,166,0.1)');
  rg.addColorStop(1, 'rgba(200,120,160,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // light shafts fanning up-left from the sun: drawn sharp at half size, blurred once
  const A = offS.getContext('2d');
  A.setTransform(0.5, 0, 0, 0.5, 0, 0);
  A.clearRect(0, 0, W, H);
  const R = rng(11);
  for (let i = 0; i < 17; i++) {
    const a0 = Math.PI * (0.95 + R() * 0.62) + Math.sin(t * 0.3 + i * 1.7) * 0.006;
    const w = 0.01 + R() * 0.028;
    // strongest where they leave the sun, fading with distance: they must read as coming from it
    const al = 0.05 + R() * 0.07;
    const e = P(s.x + Math.cos(a0) * 1100, s.y + Math.sin(a0) * 1100);
    const g = A.createLinearGradient(c.x, c.y, e.x, e.y);
    g.addColorStop(0, `rgba(255,228,188,${(al * 1.5).toFixed(3)})`);
    g.addColorStop(0.35, `rgba(255,228,188,${(al * 0.8).toFixed(3)})`);
    g.addColorStop(1, `rgba(255,228,188,${(al * 0.15).toFixed(3)})`);
    A.fillStyle = g;
    const p0 = P(s.x + Math.cos(a0 - w) * 1100, s.y + Math.sin(a0 - w) * 1100);
    const p1 = P(s.x + Math.cos(a0 + w) * 1100, s.y + Math.sin(a0 + w) * 1100);
    A.beginPath();
    A.moveTo(c.x, c.y);
    A.lineTo(p0.x, p0.y);
    A.lineTo(p1.x, p1.y);
    A.closePath();
    A.fill();
  }
  const B = offS2.getContext('2d');
  B.clearRect(0, 0, W / 2, H / 2);
  B.filter = 'blur(4px)';
  B.drawImage(offS, 0, 0);
  B.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(offS2, 0, 0, W, H);
  ctx.restore();
}
function drawSunDisk(t) {
  const s = sunAt(t);
  // a corona, then the disk itself: the one white-hot thing in the frame
  const c = ctx.createRadialGradient(s.x, s.y, 14, s.x, s.y, 70);
  c.addColorStop(0, 'rgba(255,236,190,0.95)');
  c.addColorStop(0.4, 'rgba(255,208,150,0.5)');
  c.addColorStop(1, 'rgba(255,190,150,0)');
  ctx.fillStyle = c;
  ctx.fillRect(s.x - 70, s.y - 70, 140, 140);
  const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 25);
  g.addColorStop(0, '#fffef8');
  g.addColorStop(0.8, '#fff8e4');
  g.addColorStop(1, 'rgba(255,240,206,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 25, 0, TAU);
  ctx.fill();
}
// The sun's light wraps round the roofs and trees standing in front of it (drawn over them).
function drawSunBloom(t) {
  const s = sunAt(t);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 170);
  g.addColorStop(0, 'rgba(255,232,196,0.62)');
  g.addColorStop(0.18, 'rgba(255,214,170,0.34)');
  g.addColorStop(0.5, 'rgba(250,180,150,0.1)');
  g.addColorStop(1, 'rgba(240,160,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(s.x - 170, s.y - 170, 340, 340);
  ctx.restore();
}

// (seed, count and span for more of the same sky elsewhere; the defaults are shot 1's)
function drawCirrus(t, seed = 3, n = 9, span = null) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = span ? span[0] + R() * (span[1] - span[0]) - t * 3 : R() * W * 1.1 - 60 - t * 3;
    const y = 40 + R() * 110;
    const w = 160 + R() * 260, h = 3 + R() * 6;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, 'rgba(210,170,210,0)');
    g.addColorStop(0.5, `rgba(235,185,205,${0.1 + R() * 0.12})`);
    g.addColorStop(1, 'rgba(210,170,210,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h, -0.05, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ cumulus
// A cloud is one union of puffs: one body gradient over the whole union (no per-puff seams),
// a base that is flat but not ruled, and an underside lit by the low sun as a soft falloff,
// never brighter than the sun itself.
function makeCloud(seed, width, height, n) {
  const R = rng(seed);
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const bump = Math.sin(u * Math.PI);
    const r = height * lerp(0.27, 0.47, bump) * (0.88 + R() * 0.24);
    puffs.push({ x: lerp(0.07, 0.93, u) * width, y: -r * 0.52 + (R() - 0.5) * 4, r, low: true, ph: R() * TAU });
  }
  const m = Math.round(n * 0.8);
  const upper = [];
  for (let i = 0; i < m; i++) {
    const u = 0.16 + R() * 0.68;
    const bump = Math.sin(u * Math.PI);
    const r = height * (0.2 + R() * 0.26) * (0.75 + bump * 0.45);
    upper.push({ x: u * width, y: -height * 0.5 * bump - r * 0.3 - R() * height * 0.14, r, low: false, ph: R() * TAU });
  }
  for (const p of upper) {
    puffs.push(p);
    for (const a of [-0.62, -0.38 - R() * 0.1]) {
      if (R() < 0.35) continue;
      const rr = p.r * (0.3 + R() * 0.12);
      puffs.push({ x: p.x + Math.cos(a * Math.PI) * p.r * 0.84, y: p.y + Math.sin(a * Math.PI) * p.r * 0.84, r: rr, low: false, ph: 0 });
    }
  }
  return puffs;
}
const CLOUDS = [
  { seed: 7, x: 600, y: 150, s: 0.55, speed: 5, puffs: makeCloud(7, 320, 70, 9), glowH: 46,
    top: '#3e4482', mid: '#5f5492', low: '#a57aa0', glow: [236, 150, 160], glow2: [246, 186, 160] },
  { seed: 21, x: 40, y: 336, s: 1, speed: 8, puffs: makeCloud(21, 480, 120, 13), glowH: 60,
    top: '#474987', mid: '#6d5e9b', low: '#c1809f', glow: [236, 150, 165], glow2: [247, 190, 162] },
  { seed: 33, x: 690, y: 296, s: 1, speed: 7, puffs: makeCloud(33, 540, 112, 14), glowH: 60,
    top: '#51508d', mid: '#7866a1', low: '#d38d9f', glow: [240, 156, 165], glow2: [248, 194, 164] },
  { seed: 45, x: 360, y: 420, s: 0.8, speed: 11, puffs: makeCloud(45, 340, 66, 10), glowH: 40,
    top: '#7663a0', mid: '#a47aa6', low: '#e89c9c', glow: [250, 170, 160], glow2: [250, 200, 170] },
];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function drawCloud(cl, t, sunP = sunAt(t)) {
  const ox = cl.x - cl.speed * t, oy = cl.y, s = cl.s;
  const P = cl.puffs.map((p) => ({ x: ox + p.x * s, y: oy + p.y * s, r: p.r * s, low: p.low, ph: p.ph }));
  let top = Infinity, x0 = Infinity, x1 = -Infinity;
  for (const p of P) { top = Math.min(top, p.y - p.r); x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); }
  const base = oy;
  const bb = clampBox({ x0: x0 - 10, y0: top - 10, x1: x1 + 10, y1: base + 10 });
  if (!bb.w || !bb.h) return;
  const A = offA.getContext('2d');
  A.setTransform(1, 0, 0, 1, 0, 0);
  A.globalCompositeOperation = 'source-over';
  A.globalAlpha = 1;
  A.clearRect(bb.x0, bb.y0, bb.w, bb.h);
  // lobes are not circles: each is a soft, slightly irregular blob (a little flatter below)
  const lump = (p, k = 1) => {
    const pts = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      const w = 1 + 0.07 * noise1(a * 1.9 + p.ph * 3, cl.seed) + 0.035 * noise1(a * 4.3 + p.ph, cl.seed + 1);
      const rr = p.r * k * w;
      pts.push(V(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * (Math.sin(a) > 0 ? 0.9 : 1)));
    }
    return curvePath(pts);
  };
  const u = new Path2D();
  for (const p of P) u.addPath(lump(p));
  const g = A.createLinearGradient(0, top, 0, base);
  g.addColorStop(0, cl.top);
  g.addColorStop(0.55, cl.mid);
  g.addColorStop(1, cl.low);
  // lobes: puffs painted back (upper) to front (lower), each darker on its upper left and
  // lighter toward the low sun at its lower right. Where a front lobe overlaps one behind,
  // its shaded top meets the other's lit underside: that edge is the cauliflower line.
  A.fillStyle = g;
  A.fill(u);
  // volume: each upper lobe is painted over the ones behind it, darker on its upper left and
  // warmer toward the low sun at its lower right. Painted soft (blurred, unclipped, kept inside
  // the cloud by source-atop), so lobes read as rounded volumes, never as drawn circles.
  // (painted sharp on a small layer the size of the cloud, then softened by ONE blur: a blur
  // per lobe cost 4.8 s a frame)
  const order = P.filter((p) => !p.low).sort((p, q) => p.y - q.y);
  const Lc = scratch('lobes', bb.w, bb.h);
  const L = Lc.getContext('2d');
  L.translate(-bb.x0, -bb.y0);
  const gL = L.createLinearGradient(0, top, 0, base);
  gL.addColorStop(0, cl.top);
  gL.addColorStop(0.55, cl.mid);
  gL.addColorStop(1, cl.low);
  for (const p of order) {
    // the lobe's shadow on the cloud just below it: the cauliflower seam, painted, not drawn
    L.fillStyle = 'rgba(30,26,78,0.12)';
    L.fill(lump({ ...p, x: p.x - p.r * 0.1, y: p.y + p.r * 0.16 }, 1));
    const lp = lump(p, 0.96);
    L.fillStyle = gL;
    L.fill(lp);
    const d = L.createLinearGradient(p.x - p.r * 0.7, p.y - p.r * 0.75, p.x + p.r * 0.55, p.y + p.r * 0.8);
    d.addColorStop(0, 'rgba(34,30,84,0.16)');
    d.addColorStop(0.45, 'rgba(34,30,84,0)');
    d.addColorStop(0.72, rgba(cl.glow, 0));
    d.addColorStop(1, rgba(cl.glow2, 0.24));
    L.fillStyle = d;
    L.fill(lp);
  }
  A.save();
  A.globalCompositeOperation = 'source-atop';
  A.filter = `blur(${(3.4 * s).toFixed(1)}px)`;
  A.drawImage(Lc, 0, 0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
  A.restore();
  // the base: flat like real cumulus, but not ruled
  A.globalCompositeOperation = 'destination-out';
  const cut = new Path2D();
  cut.moveTo(x0 - 12, base + 60);
  for (let x = x0 - 12; x <= x1 + 12; x += 5) cut.lineTo(x, base + noise1(x * 0.018, cl.seed) * 4.2 * s + noise1(x * 0.06, cl.seed + 3) * 1.6 * s + noise1(x * 0.15, cl.seed + 5) * 0.6 * s);
  cut.lineTo(x1 + 12, base + 60);
  cut.closePath();
  A.fill(cut);
  // underside lit by the sun below the horizon: strongest at the base, a falloff upward,
  // a little stronger on the side toward the sun
  A.globalCompositeOperation = 'source-atop';
  const lg = A.createLinearGradient(0, base - cl.glowH * s, 0, base + 2);
  lg.addColorStop(0, rgba(cl.glow, 0));
  lg.addColorStop(0.5, rgba(cl.glow, 0.22));
  lg.addColorStop(0.86, rgba(cl.glow2, 0.55));
  lg.addColorStop(1, rgba(cl.glow2, 0.72));
  A.fillStyle = lg;
  A.fillRect(bb.x0, bb.y0, bb.w, bb.h);
  // a little brighter on the side toward the sun: a radial falloff (no rectangle, so no edge)
  const sp = sunP;
  const rg = A.createRadialGradient(sp.x, sp.y + 60, 0, sp.x, sp.y + 60, 1100);
  rg.addColorStop(0, rgba(cl.glow2, 0.2));
  rg.addColorStop(1, rgba(cl.glow2, 0));
  A.fillStyle = rg;
  A.fillRect(bb.x0, bb.y0, bb.w, bb.h);
  // silver lining on the edges that face the sun (on the union's outside only)
  const r = offR.getContext('2d');
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.clearRect(bb.x0, bb.y0, bb.w, bb.h);
  r.drawImage(offA, bb.x0, bb.y0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
  r.globalCompositeOperation = 'source-in';
  r.fillStyle = rgba(cl.glow2, 0.55);
  r.fillRect(bb.x0, bb.y0, bb.w, bb.h);
  r.globalCompositeOperation = 'destination-out';
  r.drawImage(offA, bb.x0, bb.y0, bb.w, bb.h, bb.x0 - 2.4 * s, bb.y0, bb.w, bb.h);   // right-facing edges only
  // a cloud running on past the frame's right side has no edge there (its buffer ends at the
  // frame): no lining at the frame (it made a bright 4 px column down the cloud, measured)
  if (x1 + 10 > W) r.clearRect(W - Math.ceil(2.4 * s) - 2, bb.y0, Math.ceil(2.4 * s) + 2, bb.h);
  r.globalCompositeOperation = 'source-over';
  A.globalCompositeOperation = 'source-atop';
  A.filter = 'blur(1px)';
  A.drawImage(offR, bb.x0, bb.y0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
  A.filter = 'none';
  A.globalCompositeOperation = 'source-over';
  // composite: a soft pass under the sharp one gives the edge a painted falloff
  ctx.save();
  ctx.filter = 'blur(1.6px)';
  ctx.globalAlpha = 0.5;
  ctx.drawImage(offA, bb.x0, bb.y0, bb.w, bb.h, bb.x0, bb.y0 - 1, bb.w, bb.h);
  ctx.restore();
  ctx.drawImage(offA, bb.x0, bb.y0, bb.w, bb.h, bb.x0, bb.y0, bb.w, bb.h);
}
