window.__overlay = (i) => {
  const t = i / FPS, tc = charFrame(i) / FPS;
  const R = rig(tc, t);
  const HP = headParts(R, t);
  const hl = hairlinePts(HP.Hd, HP.HS, HP.proj);
  const upv = sub(HP.proj(toP(HP.Hd, V3(0, 0.4, 0))), HP.proj(HP.Hd.o));
  ctx.save();
  hl.forEach((p, k) => { ctx.fillStyle = k === 0 ? '#ff0' : k === hl.length - 1 ? '#0ff' : '#f00'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); });
  ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(HP.proj(HP.Hd.o).x, HP.proj(HP.Hd.o).y); ctx.lineTo(HP.proj(HP.Hd.o).x + upv.x, HP.proj(HP.Hd.o).y + upv.y); ctx.stroke();
  ctx.restore();
  console.log(JSON.stringify({ upv, first: hl[0], last: hl[hl.length - 1], mid: hl[9] }));
};
