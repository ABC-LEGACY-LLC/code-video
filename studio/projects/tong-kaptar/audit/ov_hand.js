// hand axes at the wrist: hd red, pn green, ts blue, thumb segment yellow; finger tips cyan
window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const proj = (p) => projB(p, t);
  for (const A of [R.L, R.R]) {
    const hs = handShapes(A, proj, R.S.waist);
    const w = proj(A.W);
    const ar = (v, col, L = 0.06) => { const q = proj(a3(A.W, m3(v, L))); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
    ar(A.hd, '#ff3030'); ar(hs.pn, '#30ff30'); ar(hs.ts, '#3080ff');
    for (const sh of hs.far) { ctx.strokeStyle = 'rgba(255,0,255,0.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); sh.pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); }
    for (const sh of hs.near) { ctx.strokeStyle = 'rgba(255,255,0,0.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); sh.pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); }
  }
};
