window.__handdir = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const out = {};
  for (const A of [R.L, R.R]) {
    const P = (p) => projB(p, t);
    const w = P(A.W), e = P(A.E), s = P(A.S);
    const hs = handShapes(A, P, R.S.waist);
    const k = P(hs.knuckle);
    const tipT = P(a3(A.W, m3(n3(A.tdir), 0.08)));
    const ang = (a, b) => Math.round(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI);
    const wl = toL(R.S.waist, A.W), cam = toL(R.S.waist, BOY_CAM);
    out[A.side] = { forearm: ang(e, w), hand: ang(w, k), thumbDir: ang(w, tipT), wristLocal: [wl.x.toFixed(3), wl.z.toFixed(3)], cam: [cam.x.toFixed(2), cam.z.toFixed(2)], handLenPx: Math.round(len(sub(k, w))) };
  }
  return out;
};
