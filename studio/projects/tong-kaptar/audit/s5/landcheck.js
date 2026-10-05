// landing physics per lander: speeds, pitch, legs, beats, tail clearance, feet drift; closest birds
window.landCheck = () => {
  const out = [];
  for (const e of LAND5) {
    if (e.on === 'off') continue;
    const p = landPlan(e), ph = landPhase(e, e.td - 0.001);
    const pos = (s) => landPos(e, s).pos;
    const vAt = (s) => len3(s3(pos(s + 0.005), pos(s - 0.005))) / 0.01;
    const hv = (s) => { const d = s3(pos(s + 0.005), pos(s - 0.005)); return Math.hypot(d.x, d.z) / 0.01; };
    // per-frame screen steps in the last frames before touchdown
    const fTd = e.td * FPS, steps = [];
    for (let f = Math.floor(fTd) - 4; f <= Math.floor(fTd) + 1; f++) { Z5 = zoom5At(f / FPS); const a = proj5(landState(e, (f - 1) / FPS).F.o, S5.t0 + f / FPS), b = proj5(landState(e, f / FPS).F.o, S5.t0 + f / FPS); steps.push(Math.round(len(sub(b, a)))); }
    // pitch of the body at the touchdown (degrees above horizontal)
    const F = landState(e, e.td - 0.002).F, z = n3(F.z);
    const pitch = Math.asin(z.y) * 180 / Math.PI;
    // tail clearance over the last 0.3 s and the settle
    let clr = Infinity;
    for (let s = e.td - 0.3; s < e.td + 0.6; s += 1 / 96) { const st = landState(e, s); for (const q of tailPts(st.tail, st.tailPitch, 0.5)) clr = Math.min(clr, toP(st.F, q).y - p.feet.y); }
    // beats in the braking
    const beats = p.ph.N - p.ph.phG, fb = p.ph.fb;
    // feet: where the drawn feet are over the standing time (they turn on the spot)
    let fx0 = null, drift = 0;
    for (let s = e.td + 0.2; s < 5; s += 1 / 24) { const st = landState(e, s); const c = st.F.o; const foot = V3(p.feet.x, p.feet.y, p.feet.z); if (!fx0) fx0 = foot; drift = Math.max(drift, len3(s3(foot, fx0))); }
    out.push({ b: e.b, on: e.on, td: e.td, tdFrame: +(fTd).toFixed(1), brakeT: +p.Tb.toFixed(3), v_gate: +vAt(p.tg + 0.01).toFixed(2), vh_lastFrame: +hv(e.td - 1 / FPS).toFixed(2), steps, pitch: Math.round(pitch), beats: +beats.toFixed(2), beatHz: +fb.toFixed(2), legsFrom_ms: 190, tailClear_mm: Math.round(clr * 1000), feetDrift_mm: Math.round(drift * 1000) });
  }
  // closest pair of birds (3-D, body centres) per frame, landers + the coop's three
  let worst = { d: Infinity };
  for (let f = 0; f < 120; f++) {
    const s = f / FPS, P = [];
    for (const e of LAND5) P.push({ id: 'L' + e.b, o: landState(e, s).F.o, e });
    for (const b of PERCHED) P.push({ id: 'P' + b.x, o: a3(unprojW(b.x, b.y, COOP_D, 0), V3(0, 0.07, 0)) });
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = len3(s3(P[i].o, P[j].o)); if (d < worst.d) worst = { d: +d.toFixed(3), f, a: P[i].id, b: P[j].id }; }
  }
  return { out, worst };
};
