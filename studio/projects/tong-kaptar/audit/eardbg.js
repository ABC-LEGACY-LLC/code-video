window.__eardbg = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const { Hd, HS, proj } = HP;
  const sk = bboxOf(HP.skull.pts), oc = bboxOf(HP.occ.pts), fa = bboxOf(HP.face);
  const ears = HP.ears.map((e) => { const b = bboxOf(e.outline); return { sg: e.sg, x0: +b.x0.toFixed(1), x1: +b.x1.toFixed(1), y0: +b.y0.toFixed(1), y1: +b.y1.toFixed(1), lateral: e.lateral }; });
  // head axes on screen
  const o = proj(Hd.o), X = proj(toP(Hd, V3(0.1, 0, 0))), Y = proj(toP(Hd, V3(0, 0.1, 0))), Z = proj(toP(Hd, V3(0, 0, 0.1)));
  const r = (p) => [+(p.x - o.x).toFixed(1), +(p.y - o.y).toFixed(1)];
  return { skull: [sk.x0, sk.x1].map((v) => +v.toFixed(1)), occ: [oc.x0, oc.x1].map((v) => +v.toFixed(1)), face: [fa.x0, fa.x1].map((v) => +v.toFixed(1)), ears, axX: r(X), axY: r(Y), axZ: r(Z) };
};
