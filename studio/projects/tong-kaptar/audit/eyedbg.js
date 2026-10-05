window.__eyedbg = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const { Hd, HS, proj } = HP;
  const parts = [{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }, HP.throat].concat(HP.neck);
  const outline = traceUnion(parts, 2.2);
  const skullP = unionPath([{ pts: HP.skull.pts }, { pts: HP.occ.pts }]);
  const headP = polyPath(outline);
  const res = [];
  for (const sg of [-1, 1]) {
    const e = proj(toP(Hd, m3(V3(sg * EYE_CORNER.x, EYE_CORNER.y, EYE_CORNER.z), HS)));
    let bd = Infinity; for (const q of outline) bd = Math.min(bd, len(sub(q, e)));
    res.push({ sg, x: +e.x.toFixed(1), y: +e.y.toFixed(1), inSkull: ctx.isPointInPath(skullP, e.x, e.y), inHead: ctx.isPointInPath(headP, e.x, e.y), bd: +bd.toFixed(1) });
  }
  return res;
};
