// the far eye in the hold: visibility, the nose-bridge clip side, the lid polygon's area on screen
window.farEye = (i) => {
  const t = S5.t0 + i / FPS, s = i / FPS;
  Z5 = zoom5At(s); setBoyView(Z5.k > 1.0005 ? view5(t) : null); BOY_POSE = boyPose5;
  try {
    const R = rig(t, t), Hd = R.H.head, HS = BODY.HS, proj = (p) => projB(p, t);
    const P = (v) => proj(toP(Hd, m3(v, HS)));
    const F = perf5(s).face;
    const farSg = dot3(dirP(Hd, V3(1, 0, 0)), n3(s3(BOY_CAM, Hd.o))) < 0 ? 1 : -1;
    const n0 = P(V3(0, 0.076, 0.084)), n1 = P(V3(0, 0.05, 0.094)), nd = norm(sub(n1, n0)), nn = perp(nd);
    const refP = P(V3(farSg * 0.068, 0.068, 0.0));
    const side = dot(sub(refP, n0), nn);
    const c3 = V3(farSg * EYE5.c.x, EYE5.c.y, EYE5.c.z);
    const toCam = n3(s3(BOY_CAM, toP(Hd, m3(c3, HS))));
    const vdot = dot3(dirP(Hd, n3(V3(farSg * 0.35, 0.05, 0.94))), toCam);
    const up = [], lo = [];
    for (let k = 0; k <= 10; k++) { up.push(P(eyelid5(farSg, k / 10, F.open, F.smile, true))); lo.push(P(eyelid5(farSg, k / 10, F.open, F.smile, false))); }
    const poly = up.concat(lo.slice(1, -1).reverse());
    const area = area2(poly);
    // how much of the eye polygon is on the far side of the bridge line
    let beyond = 0; for (const q of poly) if (Math.sign(dot(sub(q, n0), nn)) === Math.sign(side)) beyond++;
    return { i, farSg, side: +side.toFixed(2), vdot: +vdot.toFixed(3), area: +area.toFixed(1), beyond, open: +F.open.toFixed(2) };
  } finally { setBoyView(null); BOY_POSE = null; }
};
