window.perfProbe = () => {
  const out = [];
  for (let f = 0; f < 120; f += 4) {
    const s = f / FPS, q = perf5(s), P = boyPose5(S5.t0 + s, S5.t0 + s);
    const d = (v) => Math.round(v * 180 / Math.PI);
    out.push([f, d(q.headYaw), d(q.headPitch), d(q.twist), d(P.hYaw), d(q.face.gy), d(q.face.gp), +q.face.smile.toFixed(2), +q.face.open.toFixed(2)].join(' '));
  }
  return out;
};
