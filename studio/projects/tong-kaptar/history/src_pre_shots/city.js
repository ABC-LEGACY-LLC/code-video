// Tong · kaptar — the city: far skyline, panel blocks, the mahalla's flat roofs, wires.
'use strict';

// ------------------------------------------------------------------ trees
// A poplar (terak): a tall leafy flame with a ragged edge, never a smooth capsule.
function poplarShape(x, yBase, h, w, seed, lean = 0) {
  const L = [], R = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // full in the lower third, then a rounded crown (not a spire)
    const prof = u < 0.3 ? lerp(0.55, 1, Math.sin((u / 0.3) * Math.PI / 2)) : Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.3) / 0.7, 2.2)));
    const half = (w / 2) * prof;
    const cx = x + lean * u * u;
    const y = yBase - u * h;
    L.push(V(cx - half * (1 + 0.22 * noise1(u * 11, seed)), y + noise1(u * 7, seed + 9) * 2));
    R.push(V(cx + half * (1 + 0.22 * noise1(u * 11, seed + 4)), y + noise1(u * 7, seed + 13) * 2));
  }
  const pts = L.concat(R.reverse());
  return { pts, smooth: true };
}
// A round-crowned tree (tut, chinor): a clump of lobes on a short trunk.
function roundTreeShapes(x, yBase, r, seed, lean = 0) {
  const Rr = rng(seed);
  const cy = yBase - r * 1.25;
  const shapes = [{ pts: [V(x - r * 0.1, yBase), V(x - r * 0.08, cy), V(x + r * 0.08, cy), V(x + r * 0.12, yBase)], smooth: false }];
  shapes.push({ pts: ellipsePts(V(x + lean * 0.5, cy), V(r * 0.8, 0), V(0, r * 0.72), 16) });
  const k = 7 + Math.floor(Rr() * 3);
  for (let i = 0; i < k; i++) {
    const a = -Math.PI * 0.95 + (i / (k - 1)) * Math.PI * 1.9 + (Rr() - 0.5) * 0.3;
    const d = r * (0.5 + Rr() * 0.2);
    const rr = r * (0.36 + Rr() * 0.2);
    shapes.push({ pts: ellipsePts(V(x + lean + Math.cos(a - Math.PI / 2) * d, cy + Math.sin(a - Math.PI / 2) * d * 0.85), V(rr, 0), V(0, rr * 0.9), 12) });
  }
  return shapes;
}

// ------------------------------------------------------------------ far skyline (hazy)
function makeSkyline(seed, yBase, hMin, hMax, wMin, wMax, trees) {
  const R = rng(seed);
  const rects = [];
  const shapes = [];
  let x = -40;
  while (x < W + 40) {
    const w = lerp(wMin, wMax, R());
    const h = lerp(hMin, hMax, Math.pow(R(), 1.3));
    rects.push([x, yBase - h, w + 1, H - (yBase - h)]);
    if (R() < 0.35) { const tw = 8 + R() * 14, th = 6 + R() * 10; rects.push([x + R() * (w - tw), yBase - h - th, tw, th + 1]); }
    // (no mast pinned to the sun, nor one standing beside his neck like a stray hair)
    if (R() < 0.3) { const mx = x + 4 + R() * (w - 8), mh = 18 + R() * 16; if (Math.abs(mx - 1112) > 40 && (mx < 915 || mx > 980)) rects.push([mx, yBase - h - mh, 1.6, 34]); }
    if (R() < trees) {
      const tx = x + w + R() * 6;
      // (the same random draws either way, so the rest of the skyline does not change; but no
      // spire right behind the boy's head)
      const clear = (tx < 925 || tx > 1010) && Math.abs(tx - 1112) > 45;
      if (R() < 0.6) { const sh = poplarShape(tx, yBase + 2, 50 + R() * 70, 14 + R() * 8, Math.floor(R() * 1000)); if (clear) shapes.push(sh); }
      else { const sh = roundTreeShapes(tx, yBase + 2, 16 + R() * 14, Math.floor(R() * 1000)); if (clear) shapes.push(...sh); }
    }
    x += w + (R() < 0.25 ? 6 + R() * 18 : 0);
  }
  const path = unionPath(shapes);
  for (const r of rects) path.rect(...r);
  return path;
}
const FAR = makeSkyline(5, 540, 14, 44, 26, 70, 0.35);
const LANDMARK = (() => {
  const p = new Path2D();
  const cx = 470, base = 532;
  p.rect(cx - 30, base - 22, 60, 24);
  p.moveTo(cx + 34, base - 22);
  p.arc(cx, base - 22, 34, 0, Math.PI, true);
  p.rect(cx - 2, base - 66, 4, 10);
  // the minaret the Tashkent way: a round shaft, a gallery, a lantern and a small dome with a
  // finial (not an Ottoman pencil point)
  p.rect(cx + 58, base - 104, 11, 106);
  p.rect(cx + 55.5, base - 109, 16, 5);
  p.rect(cx + 59.5, base - 124, 8, 16);
  p.moveTo(cx + 69, base - 124);
  p.arc(cx + 63.5, base - 124, 5.5, 0, Math.PI, true);
  p.closePath();
  p.rect(cx + 63, base - 136, 1.2, 8);
  return p;
})();

// ------------------------------------------------------------------ panel blocks (mid distance)
const BLOCKS = (() => {
  const R = rng(13);
  const out = [];
  let x = -30;
  while (x < W + 30) {
    const w = 60 + R() * 90;
    const h = 22 + Math.pow(R(), 1.2) * 52;
    const b = { x, w, top: 586 - h, seed: Math.floor(R() * 1e9), win: V(6 + Math.floor(R() * 3), 7 + Math.floor(R() * 3)), pitch: V(14 + Math.floor(R() * 5), 13 + Math.floor(R() * 3)), balc: R() < 0.4, tree: R() < 0.5 ? (R() < 0.55 ? 'poplar' : 'round') : null, tseed: Math.floor(R() * 1000) };
    out.push(b);
    x += w + (R() < 0.3 ? 8 + R() * 22 : 1);
  }
  return out;
})();

function drawFar(t) {
  const g = ctx.createLinearGradient(0, 470, 0, 560);
  g.addColorStop(0, '#9a78a5');
  g.addColorStop(1, '#c690a1');
  ctx.fillStyle = g;
  ctx.fill(LANDMARK);
  ctx.fill(FAR);
  const hz = ctx.createLinearGradient(0, 500, 0, 580);
  hz.addColorStop(0, 'rgba(255,200,165,0)');
  hz.addColorStop(1, 'rgba(255,196,160,0.5)');
  ctx.fillStyle = hz;
  ctx.fillRect(0, 480, W, 140);
}

function drawBlocks(t) {
  const oy = craneAtZ(t, 60);
  ctx.save();
  ctx.translate(0, oy);
  const g2 = ctx.createLinearGradient(0, 510, 0, 600);
  g2.addColorStop(0, '#76608f');
  g2.addColorStop(1, '#8a6c93');
  // trees between the blocks first, then the blocks
  const trees = [];
  for (const b of BLOCKS) {
    if (!b.tree) continue;
    if (Math.abs(b.x - 1112) < 45) continue;
    if (b.tree === 'poplar') trees.push(poplarShape(b.x - 4, 590, 44 + (b.tseed % 30), 12 + (b.tseed % 6), b.tseed, WIND_DIR * 1.5));
    else trees.push(...roundTreeShapes(b.x - 6, 590, 14 + (b.tseed % 9), b.tseed, WIND_DIR));
  }
  ctx.fillStyle = '#7d6590';
  ctx.fill(unionPath(trees));
  ctx.fillStyle = g2;
  for (const b of BLOCKS) ctx.fillRect(b.x, b.top, b.w, 620 - b.top);
  // windows: small, not all the same, a few already lit, one blue with a television
  for (const b of BLOCKS) {
    const R = rng(b.seed);
    for (let y = b.top + 6; y < 606; y += b.pitch.y) {
      for (let x = b.x + 5; x < b.x + b.w - b.win.x - 3; x += b.pitch.x) {
        if (R() < 0.12) continue;
        const r = R();
        const lit = r < 0.07, tv = r > 0.985;
        ctx.fillStyle = lit ? `rgba(255,${196 + Math.floor(R() * 34)},140,0.8)` : tv ? 'rgba(150,170,255,0.55)' : `rgba(${104 + Math.floor(R() * 14)},88,130,0.5)`;
        ctx.fillRect(x, y, b.win.x, b.win.y);
      }
      if (b.balc) { ctx.fillStyle = 'rgba(70,56,98,0.45)'; ctx.fillRect(b.x + 3, y + b.win.y + 1, b.w - 6, 2); }
    }
    // warm light on the roof edge, stronger near the sun
    const k = clamp(1 - Math.abs(b.x + b.w / 2 - 1100) / 900, 0, 1);
    if (k > 0.05) {
      ctx.fillStyle = `rgba(255,190,140,${0.2 + k * 0.5})`;
      ctx.fillRect(b.x, b.top, b.w, 1.4);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the mahalla: flat roofs near us
// Two rows of low courtyard houses behind the parapet: flat roofs, a bolaxona here and there,
// TV antennas, dishes, stove pipes, a neighbour's coop, washing on a line, vines, trees.
const MAHALLA = (() => {
  const rows = [];
  for (const [seed, yMin, yMax, depth] of [[31, 588, 604, 30], [57, 606, 640, 16]]) {
    const R = rng(seed);
    const houses = [];
    let x = 240 + R() * 30;
    while (x < W + 40) {
      const w = 70 + R() * 110;
      const roof = lerp(yMin, yMax, R());
      const h = { x, w, roof, props: [], depth, lip: 3 + R() * 3, seed: Math.floor(R() * 1e6), tone: (R() - 0.5) * 0.16, pitched: R() < 0.32, ridge: 6 + R() * 6 };
      const nProps = 1 + Math.floor(R() * 2.2);
      for (let k = 0; k < nProps; k++) {
        const r = R();
        const px = x + 8 + R() * (w - 16);
        if (r < 0.26) h.props.push({ kind: 'antenna', x: px, hgt: 26 + R() * 18, bars: 2 + Math.floor(R() * 3) });
        else if (r < 0.42) h.props.push({ kind: 'dish', x: px, s: 0.8 + R() * 0.4 });
        else if (r < 0.62) h.props.push({ kind: 'pipe', x: px, hgt: 14 + R() * 16, smoke: R() < 0.5 && (px < 700 || px > 1010), ph: R() * 6 });
        else if (r < 0.74) h.props.push({ kind: 'tank', x: px });
        else if (r < 0.92) h.props.push({ kind: 'room', x: x + R() * (w * 0.4), w: 34 + R() * 30, hgt: 22 + R() * 12, lit: R() < 0.4 });
        else h.props.push({ kind: 'vine', x: px - 20, w: 44 + R() * 30 });
      }
      h.tree = R() < 0.5 ? (R() < 0.45 ? { kind: 'poplar', x: x + w * R(), h: 70 + R() * 70, w: 16 + R() * 8 } : { kind: 'round', x: x + w * R(), r: 20 + R() * 16 }) : null;
      h.tseed = Math.floor(R() * 1000);
      houses.push(h);
      x += w + (R() < 0.35 ? 4 + R() * 16 : 0);
    }
    rows.push(houses);
  }
  // one neighbour keeps pigeons too, one has washing out, one has the tandir going
  rows[0][2].props.push({ kind: 'coop', x: rows[0][2].x + 10 });
  const hl = rows[1][3];
  hl.pitched = false;
  hl.props = hl.props.filter((p) => p.kind !== 'room' && p.kind !== 'vine');
  hl.props.push({ kind: 'line', x0: hl.x + 4, x1: hl.x + Math.min(hl.w - 4, 104) });
  // (well left of the boy: its plume must never meet his hands during the toss)
  const hs = rows[0].find((h) => h.x > 360 && h.x < 500) || rows[0][2];
  hs.pitched = false;
  hs.props.push({ kind: 'stack', x: hs.x + hs.w * 0.7, hgt: 22 });
  return rows;
})();

function drawProp(pr, roof, t, col) {
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  if (pr.kind === 'antenna') {
    ctx.fillRect(pr.x - 0.8, roof - pr.hgt, 1.6, pr.hgt);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < pr.bars; i++) {
      const y = roof - pr.hgt + 3 + i * 5, hw = 10 - i * 2;
      ctx.beginPath(); ctx.moveTo(pr.x - hw, y + 1.5); ctx.lineTo(pr.x + hw, y - 1.5); ctx.stroke();
    }
  } else if (pr.kind === 'dish') {
    const s = pr.s;
    ctx.fillRect(pr.x - 0.8, roof - 10 * s, 1.6, 10 * s);
    ctx.beginPath(); ctx.ellipse(pr.x - 2 * s, roof - 16 * s, 5.5 * s, 8 * s, 0.35, 0, TAU); ctx.fill();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pr.x - 2 * s, roof - 16 * s); ctx.lineTo(pr.x - 11 * s, roof - 13 * s); ctx.stroke();
  } else if (pr.kind === 'pipe') {
    ctx.fillRect(pr.x - 1.6, roof - pr.hgt, 3.2, pr.hgt);
    ctx.fillRect(pr.x - 4, roof - pr.hgt - 2, 8, 2.4);
    if (pr.smoke) { drawSmoke(pr.x, roof - pr.hgt - 3, t, 0.45, 0.55, pr.ph); ctx.fillStyle = col; }
  } else if (pr.kind === 'tank') {
    // a water tank: a drum lying on a low stand
    ctx.fillRect(pr.x - 10, roof - 7, 2, 7); ctx.fillRect(pr.x + 8, roof - 7, 2, 7);
    ctx.fillRect(pr.x - 13, roof - 19, 26, 12);
    ctx.beginPath(); ctx.ellipse(pr.x - 13, roof - 13, 3, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(pr.x + 13, roof - 13, 3, 6, 0, 0, TAU); ctx.fill();
  } else if (pr.kind === 'room') {
    ctx.fillRect(pr.x, roof - pr.hgt, pr.w, pr.hgt + 1);
    ctx.fillRect(pr.x - 2, roof - pr.hgt - 2, pr.w + 4, 2.5);
    const wx = pr.x + pr.w * 0.35, wy = roof - pr.hgt + 7;
    ctx.fillStyle = pr.lit ? 'rgba(255,205,140,0.85)' : 'rgba(96,82,126,0.6)';
    ctx.fillRect(wx, wy, 9, 10);
    if (pr.lit) { ctx.fillStyle = 'rgba(255,220,160,0.16)'; ctx.fillRect(wx - 4, wy - 4, 17, 18); }
    ctx.fillStyle = col;
  } else if (pr.kind === 'vine') {
    // a so'ri: posts and a beam carrying a flat, ragged canopy of grapevine, a few tendrils hanging
    ctx.fillRect(pr.x, roof - 17, 1.6, 17); ctx.fillRect(pr.x + pr.w, roof - 17, 1.6, 17);
    ctx.fillRect(pr.x - 2, roof - 18, pr.w + 5, 1.6);
    const sh = [];
    const R = rng(Math.floor(pr.x));
    for (let i = 0; i < 11; i++) {
      const cx = pr.x - 3 + (i / 10) * (pr.w + 6), cy = roof - 21 + (R() - 0.5) * 4;
      sh.push({ pts: ellipsePts(V(cx, cy), V(4 + R() * 3, 0), V(0, 3 + R() * 2.5), 10) });
    }
    for (let i = 0; i < 3; i++) { const cx = pr.x + (0.2 + i * 0.3) * pr.w; sh.push({ pts: ellipsePts(V(cx, roof - 14 + i % 2 * 2), V(2.2, 0), V(0, 4), 8) }); }
    ctx.fill(unionPath(sh));
  } else if (pr.kind === 'coop') {
    ctx.fillRect(pr.x, roof - 18, 30, 18);
    ctx.fillRect(pr.x - 2, roof - 20, 34, 3);
    // the neighbour's pole with a rag, waving in the same wind
    ctx.fillRect(pr.x + 30, roof - 62, 1.4, 44);
    const ph = t * 9, wd = windAt(t);
    const pts = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(V(pr.x + 30 + WIND_DIR * u * 16 * wd, roof - 62 + Math.sin(u * 5 - ph) * 2 * u)); }
    for (let i = 6; i >= 0; i--) { const u = i / 6; pts.push(V(pr.x + 30 + WIND_DIR * u * 15 * wd, roof - 54 + Math.sin(u * 5 - ph) * 2.4 * u + u * 2)); }
    ctx.fillStyle = 'rgba(206,198,214,0.9)';     // a pale rag (the keepers wave whatever cloth they have)
    ctx.fill(curvePath(pts));
    ctx.fillStyle = col;
  } else if (pr.kind === 'line') {
    // washing on a sagging line between two poles: each piece hangs from its pegs and the wind
    // swings its free edge downwind (pieces differ in weight, so they swing differently)
    const y0 = roof - 30;
    ctx.fillRect(pr.x0 - 0.8, y0 - 2, 1.8, 32); ctx.fillRect(pr.x1 - 0.8, y0 - 2, 1.8, 32);
    const sagAt = (x) => y0 + 7 * Math.sin(((x - pr.x0) / (pr.x1 - pr.x0)) * Math.PI);
    ctx.strokeStyle = 'rgba(40,32,58,0.95)';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(pr.x0, y0); ctx.quadraticCurveTo((pr.x0 + pr.x1) / 2, y0 + 14, pr.x1, y0); ctx.stroke();
    const items = [
      { u: 0.11, w: 15, h: 14, kind: 'shirt', col: '#b9a7c4', heavy: 1.1 },
      { u: 0.3, w: 12, h: 17, kind: 'towel', col: '#8f86b6', heavy: 0.9 },
      { u: 0.5, w: 15, h: 18, kind: 'trousers', col: '#5c5680', heavy: 1.5 },
      { u: 0.7, w: 13, h: 12, kind: 'towel', col: '#c7a88c', heavy: 0.8 },
      { u: 0.88, w: 14, h: 15, kind: 'shirt', col: '#a8697c', heavy: 1.2 },
    ];
    items.forEach((it, i) => {
      const cx = lerp(pr.x0, pr.x1, it.u), top = sagAt(cx);
      const sw = WIND_DIR * (0.26 + 0.16 * windAt(t) + 0.09 * Math.sin(t * 5.3 + i * 1.7)) / it.heavy;
      const hx = Math.sin(sw) * it.h, hy = Math.cos(sw) * it.h;
      const a = V(cx - it.w / 2, top), b = V(cx + it.w / 2, top);
      const flutter = Math.sin(t * 9 + i * 2.1) * 1.4 / it.heavy;
      let pts;
      if (it.kind === 'shirt') {
        const sl = it.w * 0.32;
        pts = [a, b, V(b.x + sl * 0.7, top + 4), V(b.x + sl * 0.4 + hx * 0.3, top + 8 + hy * 0.1), V(b.x - 1 + hx * 0.3, top + hy * 0.35),
          V(b.x + hx + flutter, top + hy), V(a.x + hx + flutter * 0.6, top + hy + 1), V(a.x + 1 + hx * 0.3, top + hy * 0.35),
          V(a.x - sl * 0.4 + hx * 0.3, top + 8 + hy * 0.1), V(a.x - sl * 0.7, top + 4)];
      } else if (it.kind === 'trousers') {
        const m = V(cx + hx * 0.45, top + hy * 0.45);
        pts = [a, b, V(b.x + hx + flutter, top + hy), V(m.x + 2 + hx * 0.55, top + hy), m, V(m.x - 2 + hx * 0.55, top + hy - 1), V(a.x + hx + flutter * 0.5, top + hy - 1)];
      } else {
        pts = [a, b, V(b.x + hx + flutter, top + hy + 1), V(a.x + hx + flutter * 0.7, top + hy)];
      }
      const path = polyPath(pts);
      ctx.fillStyle = it.col;
      ctx.fill(path);
      // lit from behind and to the right: a warm edge on the sun side, the fold shaded
      ctx.save();
      ctx.clip(path);
      ctx.fillStyle = 'rgba(40,28,64,0.28)';
      ctx.fillRect(a.x - 20, top, it.w * 0.45 + 20, 60);
      ctx.fillStyle = 'rgba(255,196,150,0.45)';
      ctx.fillRect(Math.max(a.x, b.x + hx) - 2.2, top, 4, 60);
      ctx.restore();
      ctx.fillStyle = 'rgba(40,32,58,0.9)';
      ctx.fillRect(a.x + 1, top - 1.5, 1.4, 3); ctx.fillRect(b.x - 2.4, top - 1.5, 1.4, 3);   // pegs
    });
    ctx.fillStyle = col;
  } else if (pr.kind === 'stack') {
    // a brick flue from the tandir/stove below: the plume is drawn later, over the roofs
    ctx.fillRect(pr.x - 3.5, roof - pr.hgt, 7, pr.hgt);
    ctx.fillRect(pr.x - 5, roof - pr.hgt - 3, 10, 3.5);
  }
}

// Smoke from the flue: soft puffs born at the top of the stack, rising, spreading and carried
// downwind by the same wind as the flag; lit warm on the sun's side, cooler on the other.
function drawSmoke(x, y, t, sc = 1, al = 1, seed = 0) {
  const n = 16;
  for (let k = n - 1; k >= 0; k--) {
    const u = (t * 0.28 + k / n + seed) % 1;      // age fraction of this puff
    const tb = t - u / 0.28;                      // when it was born
    const drift = WIND_DIR * (u * 26 + u * u * 120) * (0.85 + 0.15 * windAt(tb)) * sc;
    const sx = x + drift + Math.sin(u * 6 + k * 1.3) * 5 * u * sc, sy = y - (u * 88 - u * u * 22) * sc;
    const r = (4 + u * 26) * sc;
    const a = 0.66 * al * Math.pow(1 - u, 1.3) * sstep(0, 0.06, u);
    if (a < 0.01) continue;
    const g = ctx.createRadialGradient(sx + r * 0.25, sy + r * 0.1, 0, sx, sy, r);
    g.addColorStop(0, `rgba(236,206,210,${a.toFixed(3)})`);
    g.addColorStop(0.55, `rgba(196,174,206,${(a * 0.7).toFixed(3)})`);
    g.addColorStop(1, 'rgba(170,150,196,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - r, sy - r, 2 * r, 2 * r);
  }
}

// shade a hex colour by k (-1 darker .. +1 lighter)
function shade(hex, k) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const o = c.map((v) => Math.round(k > 0 ? lerp(v, 255, k) : v * (1 + k)));
  return `rgb(${o[0]},${o[1]},${o[2]})`;
}
function drawMahalla(t) {
  MAHALLA.forEach((houses, row) => {
    const oy = craneAtZ(t, houses[0].depth);
    ctx.save();
    ctx.translate(0, oy);
    const col = row === 0 ? '#5b4a76' : '#4b3d66';
    const top0 = row === 0 ? '#5f4d79' : '#4f4169', bot0 = row === 0 ? '#4a3c63' : '#3a2f52';
    // trees stand in the courtyards behind the roofs
    const trees = [];
    for (const h of houses) {
      if (!h.tree) continue;
      if (h.tree.kind === 'poplar' && h.tree.x > 930 && h.tree.x < 1010) continue;   // no spire kissing his head
      if (Math.abs(h.tree.x - 1112) < 45) continue;                                   // nor one pinned to the sun
      const sway = WIND_DIR * (2 + windAt(t) * 1.5 + Math.sin(t * 2.3 + h.tseed) * 0.8);
      if (h.tree.kind === 'poplar') trees.push(poplarShape(h.tree.x, h.roof + 6, h.tree.h, h.tree.w, h.tseed, sway * 1.6));
      else trees.push(...roundTreeShapes(h.tree.x, h.roof + 6, h.tree.r, h.tseed, sway));
    }
    ctx.fillStyle = row === 0 ? '#54456d' : '#433660';
    ctx.fill(unionPath(trees));
    for (const h of houses) {
      // every house its own tone, so the row reads as separate buildings, not one cut-out
      const g = ctx.createLinearGradient(0, h.roof, 0, h.roof + 90);
      g.addColorStop(0, shade(top0, h.tone));
      g.addColorStop(1, shade(bot0, h.tone));
      ctx.fillStyle = g;
      ctx.fillRect(h.x, h.roof, h.w, 720 - h.roof);
      ctx.fillStyle = shade(top0, h.tone + 0.03);
      ctx.fillRect(h.x - 1, h.roof - h.lip, h.w + 2, h.lip);        // the roof's own low parapet
      // the wall in the shadow of the roof's overhang, and the side away from the sun
      ctx.fillStyle = 'rgba(26,18,44,0.28)';
      ctx.fillRect(h.x, h.roof, h.w, 3);
      ctx.fillStyle = 'rgba(26,18,44,0.18)';
      ctx.fillRect(h.x, h.roof, Math.min(8, h.w * 0.1), 720 - h.roof);
      if (h.pitched) {
        // a low tin roof (corrugated), common on the courtyard houses
        const x0 = h.x - 3, x1 = h.x + h.w + 3, y0 = h.roof - h.lip + 1, rg = h.ridge;
        const rp = [V(x0, y0), V(x0 + h.w * 0.22, y0 - rg), V(x1 - h.w * 0.22, y0 - rg), V(x1, y0)];
        ctx.fillStyle = shade(row === 0 ? '#6a5a86' : '#57497a', h.tone);
        ctx.fill(polyPath(rp));
        ctx.save();
        ctx.clip(polyPath(rp));
        ctx.strokeStyle = 'rgba(28,20,46,0.35)';
        ctx.lineWidth = 0.8;
        for (let x = x0 + 2; x < x1; x += 3.2) { ctx.beginPath(); ctx.moveTo(x, y0 - rg - 1); ctx.lineTo(x + (x - (x0 + x1) / 2) * 0.05, y0 + 1); ctx.stroke(); }
        ctx.restore();
        ctx.fillStyle = 'rgba(255,196,150,0.5)';
        ctx.fillRect(rp[1].x, rp[1].y - 0.6, rp[2].x - rp[1].x, 1.2);
      }
      // warm light catches the top edges near the sun
      const k = clamp(1 - Math.abs(h.x + h.w / 2 - 1100) / 950, 0, 1);
      if (k > 0.04) {
        ctx.fillStyle = `rgba(255,190,140,${(0.18 + k * 0.55).toFixed(3)})`;
        ctx.fillRect(h.x - 1, h.roof - h.lip, h.w + 2, 1.5);
        ctx.fillStyle = `rgba(255,190,140,${(0.1 + k * 0.3).toFixed(3)})`;
        ctx.fillRect(h.x + h.w - 1.2, h.roof - h.lip, 1.4, 40);
      }
      // a small window here and there, a couple already lit
      const R = rng(h.seed);
      if (R() < 0.45) {
        const wx = h.x + 10 + R() * (h.w - 30), wy = h.roof + 10 + R() * 8;
        const ww = 8 + Math.floor(R() * 5), wh = 9 + Math.floor(R() * 5);
        const lit = R() < 0.35, curtain = R() < 0.5;
        ctx.fillStyle = lit ? 'rgba(255,205,140,0.8)' : 'rgba(90,76,120,0.55)';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = 'rgba(30,22,48,0.5)';
        ctx.fillRect(wx + ww / 2 - 0.5, wy, 1, wh);            // the frame's mullion
        if (lit) {
          if (curtain) { ctx.fillStyle = 'rgba(150,90,90,0.55)'; ctx.fillRect(wx, wy, ww * 0.45, wh); }
          ctx.fillStyle = 'rgba(255,220,160,0.15)'; ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
        }
      }
      for (const pr of h.props) drawProp(pr, h.roof - h.lip - (h.pitched ? h.ridge * 0.6 : 0), t, col);
    }
    if (row === 1) drawGasPipe(houses, t);
    ctx.restore();
    if (row === 0) {
      // the tandir's smoke rises over the row behind, in the same wind
      for (const h of houses) for (const pr of h.props) if (pr.kind === 'stack') {
        ctx.save(); ctx.translate(0, oy);
        drawSmoke(pr.x, h.roof - h.lip - pr.hgt - 4, t);
        ctx.restore();
      }
    }
  });
}

// The yellow gas pipe that runs along every mahalla street: on short brackets under the roof
// edges, over the gaps between houses, with a tall U-shaped expansion loop over one lane.
function drawGasPipe(houses, t) {
  const hs = houses.filter((h) => h.x > 330 && h.x < 1300);
  if (hs.length < 2) return;
  const y = (h) => h.roof + 9;
  const pts = [];
  hs.forEach((h, i) => {
    pts.push(V(h.x - 2, y(h)), V(h.x + h.w + 2, y(h)));
    const nx = hs[i + 1];
    if (nx && i === 1) {
      // the loop: up, across, down
      const xm = (h.x + h.w + nx.x) / 2, ya = Math.min(y(h), y(nx)) - 30;
      pts.push(V(xm - 6, y(h)), V(xm - 6, ya), V(xm + 6, ya), V(xm + 6, y(nx)));
    }
  });
  const path = new Path2D();
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3e3150';
  ctx.lineWidth = 3.6;
  ctx.stroke(path);
  ctx.strokeStyle = '#9b8052';                  // backlit yellow paint
  ctx.lineWidth = 2.2;
  ctx.stroke(path);
  ctx.translate(0.3, -0.7);
  ctx.strokeStyle = 'rgba(255,206,150,0.55)';   // the top of the pipe catches the sky
  ctx.lineWidth = 0.7;
  ctx.stroke(path);
  ctx.restore();
  // brackets
  ctx.fillStyle = '#3e3150';
  for (const h of hs) for (let x = h.x + 12; x < h.x + h.w - 6; x += 38) ctx.fillRect(x - 0.6, y(h) + 1, 1.2, 4);
}

// ------------------------------------------------------------------ wires and poles
// (the right pole clear of the boy and of the sun; the left one out past the frame
// edge, so its crossbar does not tangle with the flag, the cloud base and the wires)
const POLES = [V(-60, 600), V(1196, 596)];
function drawWires(t) {
  ctx.save();
  ctx.translate(0, craneAtZ(t, 12));
  ctx.strokeStyle = 'rgba(38,30,58,0.92)';
  ctx.lineWidth = 1.7;
  // (tall enough that the wires pass well clear of the boy's cap: a wire along the cap's top read
  // as the cap hanging from it)
  const PH = 282;
  const tops = POLES.map((p) => V(p.x, p.y - PH + 8));
  for (let k = 0; k < 3; k++) {
    const a = V(tops[0].x - 24 + k * 24, tops[0].y + 6 + k * 1.5);
    const b = V(tops[1].x - 22 + k * 22, tops[1].y + 6 + k * 1.5);
    const sag = 34 + k * 3 + Math.sin(t * 1.3 + k) * 1.2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + sag * 2, b.x, b.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x - 70, a.y + 30, -20, a.y + 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + 90, b.y + 24, W + 20, b.y + 16); ctx.stroke();
  }
  for (const p of POLES) {
    ctx.fillStyle = '#2c2442';
    ctx.fillRect(p.x - 3.5, p.y - PH, 7, PH);
    ctx.fillRect(p.x - 34, p.y - PH + 12, 68, 5);
    ctx.fillStyle = 'rgba(255,190,140,0.5)';
    ctx.fillRect(p.x + 2.5, p.y - PH, 1.2, PH);
  }
  ctx.restore();
}
