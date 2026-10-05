// Tong · kaptar — sound probe: every cause of a sound in the film, read from the film's own state
// on edit B's clock (audit/film/filmB.json), so no sound can drift from the picture that makes it.
// Injected into scene.html after the shots (classic script: it reads their top-level consts).
// Nothing here changes a shot: it only calls the functions the shots draw with.
'use strict';
(() => {
  const FB = 24;
  // Edit B: s1 f0..90, the whip B f91..100 (s1 f91..95 panning into s2 f0..4), s2 f5..71,
  // s3 f30..95 (slow motion), s4 f6..95, s5 f0..179. Film time runs on unbroken through s1, the
  // whip and s2 (B second = film second there); s3, s4 and s5 are ellipses with their own clocks.
  function segAt(fb) {
    if (fb < 91) return { shot: 's1', f: fb, tw: fb / FB };
    if (fb < 101) {
      const x = (fb - 91 + 0.5) / 10, p = clamp(x, 0, 1) ** 2 * (3 - 2 * clamp(x, 0, 1));
      return { shot: 'whip', f: fb, tw: fb / FB, p };
    }
    if (fb < 168) return { shot: 's2', f: fb - 96, tw: fb / FB };
    if (fb < 234) { const f = fb - 138; return { shot: 's3', f, tw: S3.t0 + (f / FB) * S3.rate }; }
    if (fb < 324) { const f = fb - 228; return { shot: 's4', f, tw: S4.t0 + f / FB }; }
    const f = fb - 324;
    return { shot: 's5', f, tw: S5.t0 + f / FB };
  }
  // the listener: the shot's own lens (its place and heading), and a projection for "on screen"
  function lens(sg) {
    const t = sg.tw;
    if (sg.shot === 's1') return { cam: makeCam({ pos: V3(0, craneH(t), 0), pitch: CAM.pitch }), proj: (p) => projW(p, t), f: CAM.f };
    if (sg.shot === 'whip') {
      // the pan turns shot 1's lens into shot 2's
      const cam = makeCam({ pos: V3(0, craneH(t), 0), yaw: sg.p * S2.yaw, pitch: lerp(CAM.pitch, 0, sg.p) });
      return { cam, proj: cam.project, f: CAM.f };
    }
    if (sg.shot === 's2') { const cam = cam2At(t); return { cam, proj: cam.project, f: cam.f }; }
    if (sg.shot === 's3') { const cam = cam3At(sg.f); return { cam, proj: cam.project, f: cam.f }; }
    if (sg.shot === 's4') { const cam = cam4At(t); return { cam, proj: cam.project, f: cam.f }; }
    const s = t - S5.t0;
    Z5 = zoom5At(s);
    const cam = cam5At(t);
    return { cam, proj: (p) => proj5(p, t), f: CAM.f * Z5.k, zoom: Z5.k };
  }
  const r3 = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;
  function where(L, p) {
    const c = L.cam.toCam(p), q = L.proj(p);
    const on = q.z > 0.3 && q.x > -20 && q.x < W + 20 && q.y > -20 && q.y < H + 20;
    return { cx: r3(c.x), cy: r3(c.y), cz: r3(c.z), r: r3(len3(c)), sx: r3(q.z > 0 ? q.x : NaN, 1), sy: r3(q.z > 0 ? q.y : NaN, 1), on: on ? 1 : 0 };
  }
  const flockPos = (b, t) => flockFrame(b, t).o;
  const speedOf = (fn, t, e = 1 / 96) => len3(m3(s3(fn(t + e), fn(t - e)), 1 / (2 * e)));

  // one sample of the whole film at B frame fb (fractional)
  function sample(fb) {
    const sg = segAt(fb), L = lens(sg), t = sg.tw, out = { fb: r3(fb, 4), shot: sg.shot, f: r3(sg.f, 4), tw: r3(t, 5), lf: r3(L.f, 1), src: [] };
    if (L.zoom) out.zoom = r3(L.zoom, 4);
    const add = (o) => out.src.push(o);
    if (sg.shot === 's3') {
      // the long lens in the flock: the birds as this shot draws them (its own beats)
      PHASE_SMOOTH = true;
      try {
        for (const who of FLOCK.map((b, k) => k).concat(['H'])) {
          const s = stateAt3(who, t);
          const b = who === 'H' ? null : FLOCK[who];
          const v = speedOf((tt) => stateAt3(who, tt).F.o, t);
          add({ id: who === 'H' ? 'H' : 'f' + who, kind: 'bird', ...where(L, s.F.o), ph: r3(s.phase, 4), a: r3(s.a ?? 1), amp: r3(who === 'H' ? 0.82 : b.amp), v: r3(v, 2), mode: 'fly' });
        }
      } finally { PHASE_SMOOTH = false; }
      return out;
    }
    if (sg.shot !== 's5') {
      PHASE_SMOOTH = true;
      try {
        for (const [k, b] of FLOCK.entries()) {
          const tau = birdTau(b, t);
          const a = Math.max(activity(b.sched, t), flockEffort(tau, t));
          const ph = flapPhaseE(b.sched, t, b.ph0, b.rate, (tt) => birdTau(b, tt));
          const p = flockPos(b, t), v = speedOf((tt) => flockPos(b, tt), t);
          add({ id: 'f' + k, kind: 'bird', ...where(L, p), ph: r3(ph, 4), a: r3(a), amp: r3(b.amp), v: r3(v, 2), mode: 'fly' });
        }
        if (t >= RELEASE_T) {
          const h = heroState(t, true), tr = t - RELEASE_T;
          const v = speedOf((tt) => heroPos(tt), t);
          add({ id: 'H', kind: 'bird', ...where(L, h.F.o), ph: r3(h.phase, 4), a: r3(h.a), amp: r3(lerp(1.18, 0.82, sstep(0, 1.0, tr))), v: r3(v, 2), mode: tr < 1.6 ? 'takeoff' : 'fly', tr: r3(tr) });
        }
      } finally { PHASE_SMOOTH = false; }
    } else {
      const s = t - S5.t0;
      for (const [k, e] of LAND5.entries()) {
        const st = landState(e, s), lp = landPhase(e, s), at = landPos(e, s), bird = birdOf(e);
        const v = s < e.td ? speedOf((ss) => landPos(e, ss).pos, s) : 0;
        const f0 = e.td + 0.02, fk = sstep(f0, f0 + 0.13, s);
        add({ id: 'L' + k, kind: 'lander', b: e.b, on_: e.on, td: e.td, crowd: e.crowd ? 1 : 0, ...where(L, st.F.o), ph: r3(lp.ph, 4), a: r3(lp.act), amp: r3(bird.amp), v: r3(v, 2), mode: at.phase, u: r3(at.u), fold: r3(fk), feetY: r3(landPlan(e).feet.y) });
      }
      for (let j = 0; j < AROUND5.length; j++) {
        const i = AROUND5[j], b = FLOCK[i], pos = aroundPos(j, s);
        const e1 = 1 / 96, vv = m3(s3(aroundPos(j, s + e1), aroundPos(j, s - e1)), 48);
        const a = Math.max(activity(b.sched, t), sstep(0.2, 0.8, vv.y));
        // (drawAround's own phase: its integral in 1/48 s steps, here taken in part between steps)
        let ph = b.ph0;
        const nq = (s + 1) * 48, n = Math.floor(nq);
        for (let q = 0; q < n; q++) ph += (SHEET.flap * b.rate * Math.max(activity(b.sched, S5.t0 - 1 + q / 48), 0.5)) / 48;
        ph += ((SHEET.flap * b.rate * Math.max(activity(b.sched, S5.t0 - 1 + n / 48), 0.5)) / 48) * (nq - n);
        add({ id: 'A' + j, kind: 'bird', ...where(L, pos), ph: r3(ph, 4), a: r3(a), amp: r3(b.amp), v: r3(len3(vv), 2), mode: 'fly' });
      }
    }
    // the coop's own three (their place, and the startled hop in shot 1)
    for (const [k, b] of PERCHED.entries()) {
      const W0 = unprojW(b.x, b.y, COOP_D, 0);
      const since = t - RELEASE_T;
      const hop = sg.shot === 's1' && b.hop && since > 0.04 && since < 0.42 ? Math.sin(((since - 0.04) / 0.38) * Math.PI) : 0;
      add({ id: 'P' + k, kind: 'perched', ...where(L, a3(W0, V3(0, 0.08, 0))), hop: r3(hop) });
    }
    // the keeper's flag (shots 1, 2 and 5: the rag on the pole against the coop): the middle of the
    // cloth; its free end snaps at 17 rad/s, as hard as the wind blows (drawPoleFlag)
    if (sg.shot !== 's4') add({ id: 'flag', kind: 'flag', ...where(L, CAM1S.unproject(87, 262, 3.4)), wd: r3(windAt(t)) });
    // the coop (its middle) and the far town, for the sources that live in them
    add({ id: 'coop', kind: 'coop', ...where(L, CAM1S.unproject(174, 540, COOP_D)) });
    // the boy: his head and his wrists (their speed moves his shirt)
    if (sg.shot === 's1' || sg.shot === 's4' || sg.shot === 's5') {
      const prevPose = BOY_POSE;
      BOY_POSE = sg.shot === 's4' ? boyPose4 : sg.shot === 's5' ? boyPose5 : null;
      try {
        const wr = (tt) => { const R = rig(tt, tt); return { L: a3(BOY_ROOT, R.L.W), R: a3(BOY_ROOT, R.R.W), head: a3(BOY_ROOT, R.H.head.o) }; };
        const e = 1 / 96, A = wr(t - e), Bq = wr(t + e), C = wr(t);
        const o = { id: 'boy', kind: 'boy', ...where(L, C.head), vL: r3(len3(s3(Bq.L, A.L)) / (2 * e), 2), vR: r3(len3(s3(Bq.R, A.R)) / (2 * e), 2) };
        if (sg.shot === 's4') {
          const f = sg.f;
          let hit = 0, inh = 0;
          for (const bl of BOY4_BLASTS) { hit += blastHit(f - bl.f, bl.len); inh += blastIn(f - bl.f); }
          o.hit = r3(hit); o.inh = r3(inh); o.mouth = r3(keyAt(BOY4_KEYS, f).mouth);
          const P = boyPose4(t, t), P0 = boyPose4(t - e, t - e), P1 = boyPose4(t + e, t + e);
          const tip = a3(BOY_ROOT, P.pole.tip);
          const vt = len3(s3(P1.pole.tip, P0.pole.tip)) / (2 * e);
          const c4 = circle4(f);
          add({ id: 'pole', kind: 'pole', ...where(L, tip), v: r3(vt, 3), k: r3(c4.k), alpha: r3(c4.alpha, 4) });
        }
        if (sg.shot === 's5') {
          const s = t - S5.t0, q = perf5(s), q0 = perf5(s - e), q1 = perf5(s + e);
          o.twistV = r3((q1.twist - q0.twist) / (2 * e)); o.headV = r3((q1.headYaw - q0.headYaw) / (2 * e));
          o.sigh = r3(Math.exp(-(((s - 4.9) / 0.45) ** 2)), 4);
          o.smile = r3(q.face.smile); o.mouthOpen = r3(q.face.mouthOpen);
        }
        add(o);
      } finally { BOY_POSE = prevPose; }
    }
    return out;
  }
  // The rag's cloth in shot 4, as ragSim runs it but read at every substep (8 a frame): the air it
  // meets and how hard its free edge is thrown about (its snaps). Same code, same steps as ragSim.
  function ragScan() {
    const { nu, nv, w, h, sub, pre } = RAG, dt = 1 / (FPS * sub), n1 = nv + 1, N = (nu + 1) * n1;
    const id = (i, j) => i * n1 + j;
    const pin = (pl, j) => pl.at(POLE.len - 0.015 - (j / nv) * h);
    const t0 = S4.t0 - pre;
    let pl = poleAtT(t0);
    const pos = [], prev = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = a3(pin(pl, j), V3(-(i / nu) * w, -0.02 * (i / nu), 0)); pos.push(p); prev.push(p); }
    const links = [];
    const link = (a, b, k) => links.push([a, b, len3(s3(pos[a], pos[b])), k]);
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
      if (i < nu) link(id(i, j), id(i + 1, j), 1);
      if (j < nv) link(id(i, j), id(i, j + 1), 1);
      if (i < nu && j < nv) { link(id(i, j), id(i + 1, j + 1), 0.7); link(id(i + 1, j), id(i, j + 1), 0.7); }
      if (i + 2 <= nu) link(id(i, j), id(i + 2, j), RAG.bend);
      if (j + 2 <= nv) link(id(i, j), id(i, j + 2), RAG.bend);
    }
    const mP = RAG.mass * w * h / N, triA = (w * h) / (2 * nu * nv);
    const tris = [];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) tris.push([id(i, j), id(i + 1, j), id(i, j + 1)], [id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)]);
    const steps = Math.round((pre + S4.dur) * FPS * sub), first = Math.round(pre * FPS * sub);
    const acc = pos.map(() => V3(0, 0, 0));
    const rows = [];
    const edge = [...Array(n1).keys()].map((j) => id(nu, j));
    let vEdgePrev = null;
    for (let k = 0; k <= steps; k++) {
      const t = t0 + k * dt;
      pl = poleAtT(t);
      const air = V3(-RAG.wind * windAt(t), 0.15, 0);
      for (let q = 0; q < N; q++) acc[q] = V3(0, -9.8, 0);
      let pw = 0, fsum = 0;
      for (const [a, b, c] of tris) {
        const nrm = cross3(s3(pos[b], pos[a]), s3(pos[c], pos[a])), nl = len3(nrm);
        if (nl < 1e-9) continue;
        const n = m3(nrm, 1 / nl);
        const v = m3(s3(a3(a3(s3(pos[a], prev[a]), s3(pos[b], prev[b])), s3(pos[c], prev[c])), V3(0, 0, 0)), 1 / (3 * dt));
        const rel = s3(air, v), vn = dot3(rel, n);
        const F = a3(m3(n, 0.72 * triA * vn * Math.abs(vn)), m3(s3(rel, m3(n, vn)), 0.02 * triA * len3(rel)));
        pw += len3(rel) ** 2 * triA; fsum += len3(F);
        const aF = m3(F, 1 / (3 * mP));
        for (const q of [a, b, c]) acc[q] = a3(acc[q], aF);
      }
      // the free edge's velocity (before this step moves it) and its change: the snap
      const vEdge = edge.map((q) => m3(s3(pos[q], prev[q]), 1 / dt));
      let aEdge = 0;
      if (vEdgePrev) for (let j = 0; j < n1; j++) aEdge += len3(s3(vEdge[j], vEdgePrev[j])) / dt / n1;
      vEdgePrev = vEdge;
      if (k >= first) {
        const f = (k - first) / sub;
        const mid = pos[id(nu >> 1, nv >> 1)];
        rows.push({ f: r3(f, 4), uRms: r3(Math.sqrt(pw / (w * h)), 3), F: r3(fsum, 4), aEdge: r3(aEdge, 1), vEdge: r3(vEdge.reduce((s, v) => s + len3(v), 0) / n1, 3), mid: [r3(mid.x), r3(mid.y), r3(mid.z)] });
      }
      for (let q = 0; q < N; q++) {
        if (q < n1) continue;
        const p = pos[q], vel = s3(p, prev[q]);
        prev[q] = p;
        pos[q] = a3(a3(p, m3(vel, 0.985)), m3(acc[q], dt * dt));
      }
      for (let j = 0; j <= nv; j++) { const p = pin(pl, j); prev[id(0, j)] = pos[id(0, j)]; pos[id(0, j)] = p; }
      for (let it = 0; it < 6; it++) {
        for (const [a, b, rest, kk] of links) {
          const d = s3(pos[b], pos[a]), l = len3(d) || 1e-9, e = ((l - rest) / l) * 0.5 * kk;
          const pa = a < n1, pb = b < n1;
          if (!pa) pos[a] = a3(pos[a], m3(d, pb ? 2 * e : e));
          if (!pb) pos[b] = s3(pos[b], m3(d, pa ? 2 * e : e));
        }
      }
    }
    // (check: the frames this records are ragSim's own)
    const sim = ragSim();
    return { rows, check: sim.length };
  }
  window.soundScan = (from, to, sub = 4) => {
    const rows = [];
    for (let k = Math.round(from * sub); k < Math.round(to * sub); k++) rows.push(sample(k / sub));
    return rows;
  };
  window.ragScan = ragScan;
  window.soundSeg = (fb) => segAt(fb);
})();
