// (measuring tool only: the v1 page has no traceUnion; a copy of today's is used to trace
// the silhouette v1 drew, at sigma 0.3, i.e. unsmoothed)
function traceUnion(shapes, sigma = 2.5) {
  const bb = bboxOf(allPts(shapes), 6);
  const x0 = Math.floor(bb.x0), y0 = Math.floor(bb.y0);
  const w = Math.ceil(bb.x1) - x0 + 1, h = Math.ceil(bb.y1) - y0 + 1;
  const c = scratch('trace', w, h);
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, -x0, -y0);
  g.fillStyle = '#fff';
  g.fill(unionPath(shapes));
  const img = g.getImageData(0, 0, w, h).data;
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[(y * w + x) * 4 + 3]);
  const ISO = 127.5;
  // edge crossings, keyed by edge; each key is shared by the two cells on either side of it
  const pts = new Map(), adj = new Map();
  const cross = (key, ax, ay, bx, by, va, vb) => {
    if (!pts.has(key)) { const t = (ISO - va) / (vb - va); pts.set(key, [ax + (bx - ax) * t + 0.5 + x0, ay + (by - ay) * t + 0.5 + y0]); }
    return key;
  };
  const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
  for (let y = -1; y < h; y++) {
    for (let x = -1; x < w; x++) {
      const tl = A(x, y), tr = A(x + 1, y), br = A(x + 1, y + 1), bl = A(x, y + 1);
      const code = (tl > ISO ? 8 : 0) | (tr > ISO ? 4 : 0) | (br > ISO ? 2 : 0) | (bl > ISO ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const T = () => cross(`h${x},${y}`, x, y, x + 1, y, tl, tr);
      const Rr = () => cross(`v${x + 1},${y}`, x + 1, y, x + 1, y + 1, tr, br);
      const B = () => cross(`h${x},${y + 1}`, x, y + 1, x + 1, y + 1, bl, br);
      const L = () => cross(`v${x},${y}`, x, y, x, y + 1, tl, bl);
      const mid = (tl + tr + br + bl) / 4 > ISO;
      switch (code) {
        case 1: link(L(), B()); break;        case 2: link(B(), Rr()); break;
        case 3: link(L(), Rr()); break;       case 4: link(T(), Rr()); break;
        case 5: if (mid) { link(T(), L()); link(B(), Rr()); } else { link(T(), Rr()); link(L(), B()); } break;
        case 6: link(T(), B()); break;        case 7: link(T(), L()); break;
        case 8: link(T(), L()); break;        case 9: link(T(), B()); break;
        case 10: if (mid) { link(T(), Rr()); link(L(), B()); } else { link(T(), L()); link(B(), Rr()); } break;
        case 11: link(T(), Rr()); break;      case 12: link(L(), Rr()); break;
        case 13: link(B(), Rr()); break;      case 14: link(L(), B()); break;
      }
    }
  }
  // walk the loops; keep the one enclosing the most area (the outside of the union)
  const seen = new Set();
  let best = null, bestA = 0;
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop = [];
    let prev = null, cur = start;
    while (cur && !seen.has(cur)) {
      seen.add(cur); loop.push(pts.get(cur));
      const nb = adj.get(cur);
      const nxt = nb[0] !== prev ? nb[0] : nb[1];
      prev = cur; cur = nxt;
    }
    if (loop.length < 3) continue;
    let a = 0;
    for (let i = 0; i < loop.length; i++) { const p = loop[i], q = loop[(i + 1) % loop.length]; a += p[0] * q[1] - q[0] * p[1]; }
    if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = loop; }
  }
  if (!best) return allPts(shapes);
  // resample at 1 px of arc, smooth, keep every 2nd point
  const L = [0];
  for (let i = 1; i <= best.length; i++) { const p = best[i - 1], q = best[i % best.length]; L.push(L[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
  const total = L[best.length], n = Math.max(8, Math.round(total));
  const xs = new Float64Array(n), ys = new Float64Array(n);
  for (let k = 0, j = 0; k < n; k++) {
    const d = (k / n) * total;
    while (L[j + 1] < d) j++;
    const u = (d - L[j]) / Math.max(1e-9, L[j + 1] - L[j]), p = best[j], q = best[(j + 1) % best.length];
    xs[k] = p[0] + (q[0] - p[0]) * u; ys[k] = p[1] + (q[1] - p[1]) * u;
  }
  const r = Math.ceil(3 * sigma), ker = [];
  let ks = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-0.5 * (i / sigma) ** 2); ker.push(v); ks += v; }
  const out = [];
  for (let k = 0; k < n; k += 2) {
    let sx = 0, sy = 0;
    for (let i = -r; i <= r; i++) { const m = (k + i + n) % n, wk = ker[i + r] / ks; sx += xs[m] * wk; sy += ys[m] * wk; }
    out.push(V(sx, sy));
  }
  return out;
}

// Audit-only (geometry of src_prev_v1): flat masks of the head and neck for one frame.
// grab A: R = head union (face hull + skull + occiput), G = neck, B = hair region inside the head.
// grab B: R = face hull alone, G = skull + occiput.
window.__headMask = (i, which) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const P2 = (p) => projB(p, t);
  const Hf = R.H, k = pxPerM(P2(Hf.nb).z);
  const neck = taperQuad(P2(Hf.nb), P2(toP(Hf.neck, V3(0, BODY.neckLen + 0.03, -0.005))), 0.1 * k, 0.092 * k, 0.5, 0.5);
  const face = smoothLoop(hull(HP.face.pts.concat(HP.jaw.pts)), 36, 3);
  const headU = unionPath([{ pts: face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  const skullU = unionPath([{ pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  if (which === 'A') {
    ctx.fillStyle = '#ff0000'; ctx.fill(headU);
    ctx.fillStyle = '#00ff00'; ctx.fill(curvePath(neck));
    ctx.save(); ctx.clip(headU); ctx.fillStyle = '#0000ff'; ctx.fill(curvePath(hairRegion(HP.Hd, HP.HS, HP.proj))); ctx.restore();
  } else {
    ctx.fillStyle = '#ff0000'; ctx.fill(curvePath(face));
    ctx.fillStyle = '#00ff00'; ctx.fill(skullU);
  }
  ctx.globalCompositeOperation = 'source-over';
};
// v1 outline as drawn: the head union's outline and the neck quad's outline were separate, so the
// visible silhouette is their pixel union (no smoothing); returned as the traced union at sigma 0.3
window.__headOutline = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const P2 = (p) => projB(p, t);
  const Hf = R.H, k = pxPerM(P2(Hf.nb).z);
  const neck = taperQuad(P2(Hf.nb), P2(toP(Hf.neck, V3(0, BODY.neckLen + 0.03, -0.005))), 0.1 * k, 0.092 * k, 0.5, 0.5);
  const face = smoothLoop(hull(HP.face.pts.concat(HP.jaw.pts)), 36, 3);
  return traceUnion([{ pts: face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }, { pts: neck }], 0.3).map((p) => [p.x, p.y]);
};
