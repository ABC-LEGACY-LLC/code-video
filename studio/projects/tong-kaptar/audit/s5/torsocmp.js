// widths of the old (back-plane) and new (sections) shirt outlines at rows, for shot 1's last pose
window.torsoCmp = () => {
  const t = 27;
  BOY_POSE = (tc, tt) => { const P = boyPose(95 / FPS, tt); P.aim = 0; return P; };
  try {
    const R = rig(t, t);
    const fwd = armForward;
    R.fwdL = fwd(R.L); R.fwdR = fwd(R.R);
    const A = torsoShape(R, t, t).pts, B = torsoShape5(R, t, t).pts;
    const span = (pts, y) => { let lo = Infinity, hi = -Infinity; const n = pts.length; for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; if ((p.y - y) * (q.y - y) <= 0 && p.y !== q.y) { const x = p.x + (q.x - p.x) * (y - p.y) / (q.y - p.y); lo = Math.min(lo, x); hi = Math.max(hi, x); } } return [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10]; };
    const ys = [];
    let top = Infinity, bot = -Infinity;
    for (const p of A) { top = Math.min(top, p.y); bot = Math.max(bot, p.y); }
    let top5 = Infinity, bot5 = -Infinity;
    for (const p of B) { top5 = Math.min(top5, p.y); bot5 = Math.max(bot5, p.y); }
    for (let y = Math.ceil(top) + 2; y < bot; y += 12) ys.push({ y, old: span(A, y), neu: span(B, y) });
    return { top, bot, top5, bot5, ys };
  } finally { BOY_POSE = null; }
};
