window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const T = torsoShape(R, t, tc);
  const line = (pts, col, w = 1) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(T.pts, '#00ff00');
  line(collarPts(R, t), '#00ffff');
  for (const n of HP.neck) line(n.pts, '#ff00ff', 0.7);
  line(hairRegion(HP.Hd, HP.HS, HP.proj), '#3070ff', 1);
  for (const A of [R.L, R.R]) if (!armForward(A)) line(sleeveShape(A, t), '#ffff00', 0.8);
};
