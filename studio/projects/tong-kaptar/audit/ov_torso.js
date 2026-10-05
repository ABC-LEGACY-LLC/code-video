window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const T = torsoShape(R, t, tc);
  const line = (pts, col, closed = true) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); if (closed) ctx.closePath(); ctx.stroke(); pts.forEach((p) => { ctx.fillStyle = col; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }); ctx.restore(); };
  line(T.pts, '#ff3030');
  if (!armForward(R.L)) line(sleeveShape(R.L, t), '#30ff30');
  if (!armForward(R.R)) line(sleeveShape(R.R, t), '#30c0ff');
  for (const A of [R.L, R.R]) { const s = projB(A.S, t), e = projB(A.E, t), w = projB(A.W, t); line([s, e, w], '#ffff00', false); }
};
