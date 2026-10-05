window.handProbe = (i) => {
  const t = S5.t0 + i / FPS, s = i / FPS;
  Z5 = zoom5At(s); setBoyView(Z5.k > 1.0005 ? view5(t) : null); BOY_POSE = boyPose5;
  try {
    const R = rig(t, t);
    const A = R.L;
    const fwd = armForward(A), up = armUp(A);
    const w = projB(A.W, t), e = projB(A.E, t);
    // thumb tip on screen
    const hs = handShapes({ ...A, farFix: [true, true, true, true, true] }, (p) => projB(p, t), R.S.waist);
    return { i, fwd, Ez: +A.E.z.toFixed(3), up: +up.toFixed(2), W: [Math.round(w.x), Math.round(w.y)], near: hs.near.length, far: hs.far.length };
  } finally { setBoyView(null); BOY_POSE = null; }
};
