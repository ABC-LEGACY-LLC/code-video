window.offExit = () => {
  const out = [];
  for (const e of LAND5) {
    if (e.on !== 'off') continue;
    let prev = null, exit = null, flagHits = 0;
    for (let f = -12; f < 120; f++) {
      const s = f / FPS; Z5 = zoom5At(Math.max(0, s));
      const q = proj5(landPos(e, Math.min(s, e.td)).pos, S5.t0 + s);
      // the flag's cloth and pole region (shot 1's pixels): cloth x 20..160, y 225..320; pole
      if (q.x > 10 && q.x < 170 && q.y > 215 && q.y < 330) flagHits++;
      if (prev && prev.x >= 0 && q.x < 0 && !exit) exit = { f, y: Math.round(q.y) };
      prev = q;
    }
    out.push({ b: e.b, td: e.td, exit, flagFrames: flagHits });
  }
  return out;
};
