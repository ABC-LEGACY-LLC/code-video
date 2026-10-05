window.hairDbg = () => {
  const t = 27;
  setBoyView(zoomCam5(3, V(905, 440), t));
  BOY_POSE = (tc, tt) => { const P = boyPose(95 / FPS, tt); P.aim = 0; P.hYaw = -1.3; P.hPitch = 0; P.twist = -0.8; return P; };
  const R = rig(t, t), Hd = R.H.head, HS = BODY.HS, proj = (p) => projB(p, t);
  const out = { vis: 0, hid: 0, side: [] };
  const top = SKULL.c.y + SKULL.r.y;
  for (let i = 0; i < 56; i++) {
    const th = (i / 56) * TAU, y0 = hairlineY(th) + 0.005;
    for (let j = 0; j <= 10; j++) {
      const q = headSurf(th, lerp(y0, top - 0.004, j / 10));
      if (!q) continue;
      const W3 = toP(Hd, m3(q, HS));
      const nrm = dirP(Hd, n3(s3(q, V3(0, 0.055, -0.02))));
      const v = s3(W3, BOY_CAM);
      const c = dot3(nrm, v) / len3(v);
      if (c > 0.18) out.hid++; else out.vis++;
      if (Math.abs(th - Math.PI) < 0.2 && j < 4) out.side.push([+th.toFixed(2), +lerp(y0, top - 0.004, j / 10).toFixed(3), +c.toFixed(2)]);
    }
  }
  setBoyView(null); BOY_POSE = null;
  return out;
};
