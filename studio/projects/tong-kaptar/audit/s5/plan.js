window.planProbe = () => {
  const out = [];
  for (const e of LAND5) {
    const p = landPlan(e);
    const pr = (q) => { const s = projW(q, 30); return [Math.round(s.x), Math.round(s.y)]; };
    let vmin = 1e9, vmax = 0, amax = 0;
    let prev = null, pv = null;
    for (let s = -0.45; s < e.td; s += 1 / 48) {
      const q = landPos(e, s).pos;
      if (prev) { const v = len3(s3(q, prev)) * 48; vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); if (pv !== null) amax = Math.max(amax, Math.abs(v - pv) * 48); pv = v; }
      prev = q;
    }
    out.push({ b: e.b, on: e.on, td: e.td, tg: +p.tg.toFixed(2), Tb: +p.Tb.toFixed(3), rho: +p.rho.toFixed(2), P0: [p.P0.x, p.P0.y, p.P0.z].map((v) => +v.toFixed(1)), P0s: pr(p.P0), Gs: pr(p.G), Ls: pr(p.L), feet: [p.feet.x, p.feet.y, p.feet.z].map((v) => +v.toFixed(2)), v: [+vmin.toFixed(1), +vmax.toFixed(1)], amax: Math.round(amax) });
  }
  return out;
};
