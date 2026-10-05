// screen box of one lander over its last second (for crops)
window.landerBox = (bi) => {
  const e = LAND5.find((q) => q.b === bi), out = [];
  for (let f = 0; f < 120; f++) {
    const s = f / FPS; Z5 = zoom5At(s);
    const st = landState(e, s), q = proj5(st.F.o, S5.t0 + s);
    out.push([f, Math.round(q.x), Math.round(q.y)]);
  }
  return { td: e.td, out };
};
