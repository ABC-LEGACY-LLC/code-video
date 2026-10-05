// the boy's scale (px per metre at his head) and his head's screen position, at a frame of shot 4 or 5
window.boyScale = (i) => {
  const shot = window.SHOT_ID;
  if (shot === 's4') {
    const t = S4.t0 + i / FPS; const cam = cam4At(t); setBoyView(cam); BOY_POSE = boyPose4;
    try { const R = rig(t, t), p = projB(R.H.pivot, t); return { shot, k: +pxPerM(p.z).toFixed(1), head: [Math.round(p.x), Math.round(p.y)] }; } finally { setBoyView(null); BOY_POSE = null; }
  }
  if (shot === 's5') {
    const t = S5.t0 + i / FPS, s = i / FPS; Z5 = zoom5At(s); setBoyView(Z5.k > 1.0005 ? view5(t) : null); BOY_POSE = boyPose5;
    try { const R = rig(t, t), p = projB(R.H.pivot, t); return { shot, k: +pxPerM(p.z).toFixed(1), head: [Math.round(p.x), Math.round(p.y)] }; } finally { setBoyView(null); BOY_POSE = null; }
  }
  if (shot === 's1') {
    const t = i / FPS; BOY_POSE = null;
    const R = rig(t, t), p = projB(R.H.pivot, t); return { shot, k: +pxPerM(p.z).toFixed(1), head: [Math.round(p.x), Math.round(p.y)] };
  }
};
