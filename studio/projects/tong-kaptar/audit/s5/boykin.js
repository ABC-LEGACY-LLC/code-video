window.boyKin = () => {
  const rows = [];
  let prev = null;
  for (let f = 0; f < 120; f++) {
    const s = f / FPS, t = S5.t0 + s;
    BOY_POSE = boyPose5;
    try {
      const R = rig(t, t), Hd = R.H.head;
      const fwd = n3(Hd.z), yaw = Math.atan2(fwd.x, fwd.z), pitch = Math.asin(fwd.y);
      const chest = n3(R.S.chest.z), cyaw = Math.atan2(chest.x, chest.z);
      const q = perf5(s);
      const row = { f, yaw: yaw * 180 / Math.PI, pitch: pitch * 180 / Math.PI, chest: cyaw * 180 / Math.PI, neck: (yaw - cyaw) * 180 / Math.PI, gy: q.face.gy * 180 / Math.PI, gp: q.face.gp * 180 / Math.PI, smile: q.face.smile, open: q.face.open };
      if (prev) { let dy = row.yaw - prev.yaw; if (dy > 180) dy -= 360; if (dy < -180) dy += 360; row.w = dy * FPS; row.wc = (row.chest - prev.chest) * FPS; }
      rows.push(row); prev = row;
    } finally { BOY_POSE = null; }
  }
  return rows;
};
