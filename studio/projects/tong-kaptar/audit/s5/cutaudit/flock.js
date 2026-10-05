// the flock on the picture: centroid, spread and mean size of a bird (px per metre), in shot 1's
// lens at a frame of shot 1, or shot 2's lens at a frame of shot 2
window.flockPic = (i) => {
  const shot = window.SHOT_ID;
  let t, proj;
  if (shot === 's1') { t = i / FPS; proj = (p) => projW(p, t); }
  else if (shot === 's2') { t = S2.t0 + i / FPS; const cam = cam2At(t); proj = (p) => cam.project(p); }
  const P = [];
  for (const b of FLOCK) {
    const F = flockBird(b, t).F, q = proj(F.o);
    if (q.z <= 0) continue;
    P.push({ x: q.x, y: q.y, k: 1000 / q.z });
  }
  const inF = P.filter((q) => q.x > 0 && q.x < W && q.y > 0 && q.y < H);
  const m = (a, f) => a.reduce((s, q) => s + f(q), 0) / a.length;
  return { n: P.length, inFrame: inF.length, cx: Math.round(m(inF, (q) => q.x)), cy: Math.round(m(inF, (q) => q.y)), k: +m(inF, (q) => q.k).toFixed(1) };
};
