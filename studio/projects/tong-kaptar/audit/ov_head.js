window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const line = (pts, col, w = 1) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.restore(); };
  line(HP.skull.pts, '#ff3030');
  line(HP.occ.pts, '#ff9900');
  line(hull(HP.face.pts.concat(HP.jaw.pts, HP.nose.pts)), '#30ff30');
  line(hairRegion(HP.Hd, HP.HS, HP.proj), '#30c0ff', 1.5);
  const hl = hairlinePts(HP.Hd, HP.HS, HP.proj);
  ctx.fillStyle = '#ffff00'; for (const p of hl) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  // the head's axes
  const o = HP.proj(HP.Hd.o);
  for (const [v, c] of [[HP.Hd.x, '#f00'], [HP.Hd.y, '#0f0'], [HP.Hd.z, '#00f']]) { const q = HP.proj(a3(HP.Hd.o, m3(v, 0.12))); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
};
