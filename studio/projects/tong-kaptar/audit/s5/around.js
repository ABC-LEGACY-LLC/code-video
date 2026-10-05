window.aroundCheck = () => {
  let worst = { d: Infinity };
  const rows = [];
  for (let f = 0; f < 120; f++) {
    const s = f / FPS, P = [];
    for (let j = 0; j < AROUND5.length; j++) P.push({ id: 'A' + AROUND5[j], o: aroundPos(j, s) });
    for (const e of LAND5) P.push({ id: 'L' + e.b, o: landPos(e, Math.min(s, e.td)).pos });
    for (let i = 0; i < P.length; i++) for (let k = i + 1; k < P.length; k++) { if (P[i].id[0] !== 'A' && P[k].id[0] !== 'A') continue; const d = len3(s3(P[i].o, P[k].o)); if (d < worst.d) worst = { d: +d.toFixed(3), f, a: P[i].id, b: P[k].id }; }
    if (f % 20 === 0) rows.push([f, ...P.filter((p) => p.id[0] === 'A').map((p) => { Z5 = zoom5At(s); const q = proj5(p.o, S5.t0 + s); return [Math.round(q.x), Math.round(q.y)]; })]);
  }
  return { worst, rows };
};
