// rag vs flock on screen, one frame of s4: birds within 70 px of the rag's cloth (any grid point)
window.ragFlock = (i) => {
  const t = S4.t0 + i / FPS, cam = cam4At(t);
  setBoyView(cam); BOY_POSE = boyPose4;
  try {
    const { scr } = ragAt(i, t);
    const birds = FLOCK.map((b) => cam.project(flockFrame(b, t).o)).concat([cam.project(heroPos(t))]);
    let near = 0, minD = 1e9;
    for (const q of birds) {
      if (q.z <= 0) continue;
      let d = 1e9;
      for (const p of scr) d = Math.min(d, Math.hypot(p.x - q.x, p.y - q.y));
      minD = Math.min(minD, d);
      if (d < 70) near++;
    }
    const cx = scr.reduce((s, p) => s + p.x, 0) / scr.length, cy = scr.reduce((s, p) => s + p.y, 0) / scr.length;
    return { near, minD: Math.round(minD), rag: [Math.round(cx), Math.round(cy)] };
  } finally { setBoyView(null); BOY_POSE = null; }
};
