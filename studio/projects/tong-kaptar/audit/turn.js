window.__turn = (i) => { const t = i / FPS, tc = charFrame(i) / FPS; const R = rig(tc, t); const Hd = R.H.head;
  const ft = Math.acos(clamp(dot3(dirP(Hd, V3(0, 0, 1)), n3(s3(R.H.pivot, BOY_CAM))), -1, 1));
  return { turnDeg: Math.round(ft * 180 / Math.PI), pitch: +R.H.pitch.toFixed(2), lift: +(clamp((R.H.pitch - 0.1) / 0.3, 0, 1) * sstep(0.6, 0.95, ft)).toFixed(2) }; };
