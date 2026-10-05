window.__eyedbg2 = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const parts = [{ pts: HP.face }, { pts: HP.skull.pts }, { pts: HP.occ.pts }, HP.throat].concat(HP.neck);
  const eyes = eyeMarks(HP, traceUnion(parts, 2.2));
  const headP = polyPath(eyes.outline);
  return eyes.lashes.map((l) => {
    let bd = Infinity; for (const q of eyes.outline) bd = Math.min(bd, len(sub(q, l.tip)));
    return { b: [+l.b.x.toFixed(1), +l.b.y.toFixed(1)], tip: [+l.tip.x.toFixed(1), +l.tip.y.toFixed(1)], L: +len(sub(l.tip, l.b)).toFixed(1), tipOut: !ctx.isPointInPath(headP, l.tip.x, l.tip.y), tipDist: +bd.toFixed(1) };
  });
};
