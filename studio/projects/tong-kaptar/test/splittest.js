window.__split = () => {
  const out = [];
  for (const b of FLOCK.slice(0, 4)) {
    const tSplit = (FLOCK_SPLIT - b.dphi / OMEGA) / b.sp;
    const A = flockBird(b, tSplit - 1e-6), B = flockBird(b, tSplit + 1e-6);
    const d = (u, v) => +len3(s3(u, v)).toExponential(2);
    out.push({ tSplit: +tSplit.toFixed(3), dPos: d(A.F.o, B.F.o), dX: d(A.F.x, B.F.x), dY: d(A.F.y, B.F.y), dZ: d(A.F.z, B.F.z) });
  }
  // hero
  const tH = FLOCK_SPLIT - HERO_SLOT.dphi / OMEGA;
  const hA = heroState(tH - 1e-4), hB = heroState(tH + 1e-4);
  out.push({ hero: +tH.toFixed(3), dPos: +len3(s3(hA.F.o, hB.F.o)).toExponential(2), dY: +len3(s3(hA.F.y, hB.F.y)).toExponential(2) });
  return out;
};
