window.__wp = () => {
  const cam = cam2At(5);
  const phi = ORBIT.phi0 + OMEGA * FLOCK_SPLIT;
  const p0 = orbitPos(phi, 0, 0), v0 = orbitVel(phi, 0);
  const q0 = cam.project(p0);
  const WP = [[5.5, 330, 250, 15], [6.3, 170, 170, 11], [7.0, 330, 90, 8], [7.8, 700, 110, 8.5], [8.8, 1150, 170, 12], [10, 1500, 250, 18]];
  const pts = [{ tau: FLOCK_SPLIT, p: p0 }].concat(WP.map(([tau, x, y, z]) => ({ tau, p: cam.unproject(x, y, z) })));
  const out = [{ tau: FLOCK_SPLIT, screen: [q0.x.toFixed(0), q0.y.toFixed(0), q0.z.toFixed(1)], p: [p0.x, p0.y, p0.z].map((v) => +v.toFixed(2)), v0: [v0.x, v0.y, v0.z].map((v) => +v.toFixed(2)) }];
  for (let i = 1; i < pts.length; i++) {
    const d = len3(s3(pts[i].p, pts[i - 1].p)), dt = pts[i].tau - pts[i - 1].tau;
    out.push({ tau: pts[i].tau, p: [pts[i].p.x, pts[i].p.y, pts[i].p.z].map((v) => +v.toFixed(2)), speed: +(d / dt).toFixed(2) });
  }
  return out;
};
