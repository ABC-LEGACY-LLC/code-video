window.__jawdbg = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const { Hd, HS, proj } = HP;
  const side = sub(proj(toP(Hd, V3(0, 0, 0.1))), proj(Hd.o)).x < 0 ? -1 : 1;
  const bl = (b) => proj(toP(Hd, m3(V3(side * b[0], b[1], b[2]), HS)));
  const chin = bl(FACE_BLOBS[9]), angle = bl(FACE_BLOBS[6]);
  // sample the face hull outline points inside the throat region and on the chin side of the angle
  const thr = unionPath([HP.throat]);
  const u = norm(sub(angle, chin)), L = len(sub(angle, chin));
  const ts = [];
  for (const p of HP.face) {
    if (!ctx.isPointInPath(thr, p.x, p.y)) continue;
    const tt = dot(sub(p, chin), u) / L;
    if (tt <= 1) ts.push(+tt.toFixed(2));
  }
  ts.sort((a, b) => a - b);
  return { chin: [Math.round(chin.x), Math.round(chin.y)], angle: [Math.round(angle.x), Math.round(angle.y)], L: +L.toFixed(1), tRange: ts.length ? [ts[0], ts[ts.length - 1]] : null };
};
window.__jawdbg2 = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const { Hd, HS, proj } = HP;
  const side = sub(proj(toP(Hd, V3(0, 0, 0.1))), proj(Hd.o)).x < 0 ? -1 : 1;
  const bl = (b) => proj(toP(Hd, m3(V3(side * b[0], b[1], b[2]), HS)));
  const chin = bl(FACE_BLOBS[9]), angle = bl(FACE_BLOBS[6]);
  const thr = unionPath([HP.throat]);
  const neckAll = polyPath(traceUnion(HP.neck, 1.6));
  const neckLow = polyPath(traceUnion(HP.neck.slice(0, 2), 1.6));
  const neckMid = polyPath(traceUnion(HP.neck.slice(0, 3), 1.6));
  const u = norm(sub(angle, chin)), L = len(sub(angle, chin));
  const res = { all: [], low: [], mid: [] };
  for (const p of HP.face) {
    if (!ctx.isPointInPath(thr, p.x, p.y)) continue;
    const tt = +(dot(sub(p, chin), u) / L).toFixed(2);
    if (tt > 1) continue;
    if (!ctx.isPointInPath(neckAll, p.x, p.y)) res.all.push(tt);
    if (!ctx.isPointInPath(neckLow, p.x, p.y)) res.low.push(tt);
    if (!ctx.isPointInPath(neckMid, p.x, p.y)) res.mid.push(tt);
  }
  const rng = (a) => a.length ? [Math.min(...a), Math.max(...a)] : null;
  return { outsideAll: rng(res.all), outsideLow: rng(res.low), outsideMid: rng(res.mid) };
};
