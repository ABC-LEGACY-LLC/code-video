window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const T = torsoShape(R, t, tc);
  const line = (pts, col, w = 1) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(T.pts, '#00ff00');
  T.pts.forEach((p, k) => { ctx.fillStyle = '#ffff00'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); ctx.font = '8px sans-serif'; ctx.fillText(String(k), p.x + 2, p.y - 2); });
  for (const A of [R.L, R.R]) if (!armForward(A)) line(sleeveShape(A, t), '#ff00ff');
  line(collarPts(R, t), '#00ffff');
  const s = projB(R.L.S, t), s2 = projB(R.R.S, t);
  ctx.fillStyle = '#fff'; ctx.fillRect(s.x - 2, s.y - 2, 4, 4); ctx.fillRect(s2.x - 2, s2.y - 2, 4, 4);
};
