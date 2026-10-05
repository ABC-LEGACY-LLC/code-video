// shot 2: the flock's flown path (tau 4..9.5) through cam2, dots every 0.5 s, labels in seconds
window.__overlay = (i) => {
  const t = S2.t0 + i / FPS, cam = cam2At(t);
  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,120,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath();
  let first = true;
  for (let tau = 3.5; tau <= 9.5; tau += 1 / 48) {
    const p = tau > FLOCK_SPLIT ? trackAt(tau).p : orbitPos(ORBIT.phi0 + OMEGA * tau, 0, 0);
    const q = cam.project(p);
    if (first) { ctx.moveTo(q.x, q.y); first = false; } else ctx.lineTo(q.x, q.y);
  }
  ctx.stroke();
  ctx.font = '11px sans-serif';
  for (let tau = 4; tau <= 9.5; tau += 0.5) {
    const p = tau > FLOCK_SPLIT ? trackAt(tau).p : orbitPos(ORBIT.phi0 + OMEGA * tau, 0, 0);
    const q = cam.project(p);
    ctx.fillStyle = '#ffff00'; ctx.fillRect(q.x - 2, q.y - 2, 4, 4);
    ctx.fillText(`${tau.toFixed(1)} (${q.z.toFixed(0)}m)`, q.x + 4, q.y - 4);
  }
  // current time marker
  const tauNow = t;
  const pn = tauNow > FLOCK_SPLIT ? trackAt(tauNow).p : orbitPos(ORBIT.phi0 + OMEGA * tauNow, 0, 0);
  const qn = cam.project(pn);
  ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(qn.x, qn.y, 8, 0, TAU); ctx.stroke();
  ctx.restore();
};
