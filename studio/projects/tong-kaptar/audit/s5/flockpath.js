// where the flock's birds are in shot 1's lens between 17 and 23 s
window.flockpath = () => {
  const out = [];
  for (let t = 17; t <= 23.01; t += 0.25) {
    const c = flockCentre(t), q = projW(c, 0);
    const bs = FLOCK.map((b) => { const F = flockFrame(b, t); const p = projW(F.o, 0); return [Math.round(p.x), Math.round(p.y), +F.o.x.toFixed(2), +F.o.y.toFixed(2), +F.o.z.toFixed(2)]; });
    const xs = bs.map((b) => b[0]), ys = bs.map((b) => b[1]), zs = bs.map((b) => b[4]), yw = bs.map((b) => b[3]);
    const h = heroPos(t), hq = projW(h, 0);
    out.push({ t: +t.toFixed(2), c: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)], cs: [Math.round(q.x), Math.round(q.y)], x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], z: [Math.min(...zs).toFixed(1), Math.max(...zs).toFixed(1)], yw: [Math.min(...yw).toFixed(1), Math.max(...yw).toFixed(1)], hero: [Math.round(hq.x), Math.round(hq.y), +h.y.toFixed(2), +h.z.toFixed(2)] });
  }
  return out;
};
