// Audit-only state probe (never loaded by the scene itself).
window.__probe = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const pr = (p) => projB(p, t);
  const hp = i >= SHEET.release ? projW(heroPos(t), t) : pr(R.P.bird);
  const out = { i, t, tc, crane: craneAt(t), P: { root: R.P.root, lean: R.P.lean, twist: R.P.twist, grip: R.P.grip, visor: R.P.visor, aim: R.P.aim, curlL: R.P.curlL, spreadL: R.P.spreadL },
    LS: pr(R.L.S), LE: pr(R.L.E), LW: pr(R.L.W), RS: pr(R.R.S), RE: pr(R.R.E), RW: pr(R.R.W), head: pr(R.H.head.o), neck: pr(R.H.nb),
    fwdL: armForward(R.L), fwdR: armForward(R.R), hero: hp, heroZ: hp.z, wind: windAt(t) };
  if (i >= SHEET.release) { const st = heroState(t); out.heroFlapElev = st.pose.elev; out.heroSpeed = len3(s3(heroPos(t + 0.01), heroPos(t - 0.01))) / 0.02; }
  out.flock = FLOCK.map((b) => { const s = flockBird(b, t); const p = projW(s.F.o, t); return [Math.round(p.x), Math.round(p.y), +(1000 * 0.66 / p.z).toFixed(1)]; });
  out.feathers = FEATHERS.filter((f) => t >= f.t0).map((f) => { const s = featherAt(f, t); return [Math.round(s.x), Math.round(s.y)]; });
  return out;
};
