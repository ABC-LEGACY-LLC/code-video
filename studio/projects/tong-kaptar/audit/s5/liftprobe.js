// does drawHead5's jaw line (the head tipped back, face part-turned) ever draw in shot 5?
window.liftProbe = (i) => {
  const t = S5.t0 + i / FPS, s = i / FPS;
  Z5 = zoom5At(s); setBoyView(Z5.k > 1.0005 ? view5(t) : null); BOY_POSE = boyPose5;
  try {
    const R = rig(t, t), HP = headParts(R, t), Hd = HP.Hd;
    const faceTurn = Math.acos(clamp(dot3(dirP(Hd, V3(0, 0, 1)), n3(s3(R.H.pivot, BOY_CAM))), -1, 1));
    const lift = clamp((R.H.pitch - 0.1) / 0.3, 0, 1) * sstep(0.6, 0.95, faceTurn);
    return { pitch: +R.H.pitch.toFixed(3), faceTurn: +faceTurn.toFixed(3), lift: +lift.toFixed(3) };
  } finally { setBoyView(null); BOY_POSE = null; }
};
