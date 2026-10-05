// per frame of s4: the flock's centre and the boy's head, seen from him and on screen
window.flockView = (i) => {
  const t = S4.t0 + i / FPS;
  const cam = cam4At(t);
  setBoyView(cam); BOY_POSE = boyPose4;
  try {
    const R = rig(t, t);
    const hp = R.H.pivot;                                  // boy space
    const fc = s3(flockCentre(t), BOY_ROOT);               // boy space
    const d = s3(fc, hp);
    const az = Math.atan2(d.x, d.z), el = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const fs = projB(fc, t), hs = projB(hp, t), tip = projB(R.P.pole.tip, t);
    const r2 = (v) => Math.round(v * 100) / 100;
    return { az: r2(az * 180 / Math.PI), el: r2(el * 180 / Math.PI), dist: r2(len3(d)), fx: Math.round(fs.x), fy: Math.round(fs.y), hx: Math.round(hs.x), hy: Math.round(hs.y), tx: Math.round(tip.x), ty: Math.round(tip.y) };
  } finally { setBoyView(null); BOY_POSE = null; }
};
