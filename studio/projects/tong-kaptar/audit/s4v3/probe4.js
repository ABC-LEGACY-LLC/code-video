// Shot 4 geometry probe, one frame: reach, elbows, hands, pole against head and body, screen paths.
// node audit/probe_js.mjs audit/s4v3/probe4.js probe4 all   (SHOT=s4)
window.probe4 = (i) => {
  const t = S4.t0 + i / FPS;
  const cam = cam4At(t);
  setBoyView(cam); BOY_POSE = boyPose4;
  try {
    const R = rig(t, t), P = R.P, pl = P.pole;
    const reachMax = (BODY.upper + BODY.fore) * 0.998;
    const arm = (A, side) => {
      const h = P.hold(side, R.S, R.H);
      const d = len3(s3(h.w, A.S));
      return { gap: Math.max(0, d - reachMax), d, E: A.E, W: A.W, S: A.S };
    };
    const L = arm(R.L, 'L'), Rr = arm(R.R, 'R');
    // wrist inside the body: the torso as an elliptic cylinder in the chest/waist frames
    const inBody = (p) => {
      let worst = 0;
      for (const [F, ea, eb, y0, y1] of [[R.S.chest, 0.16, 0.1, -0.16, 0.16], [R.S.waist, 0.14, 0.095, -0.12, 0.16]]) {
        const q = toL(F, p);
        if (q.y < y0 || q.y > y1) continue;
        const r = (q.x / ea) ** 2 + ((q.z + 0.0) / eb) ** 2;
        worst = Math.max(worst, 1 - r);
      }
      return worst;                               // > 0: inside
    };
    // the pole against the head: nearest distance (3-D) from the pole's segment to the skull's middle
    const hc = toP(R.H.head, V3(0, 0.07, -0.012));
    const segDist = (a, b, p) => { const ab = s3(b, a), tt = clamp(dot3(s3(p, a), ab) / dot3(ab, ab), 0, 1); return len3(s3(a3(a, m3(ab, tt)), p)); };
    const poleHead = segDist(pl.butt, pl.tip, hc);
    // and through the torso: nearest approach of the segment butt..left hand to the chest's middle
    const cc = toP(R.S.chest, V3(0, 0.0, 0)), wc = toP(R.S.waist, V3(0, 0.05, 0));
    const poleChest = Math.min(segDist(pl.butt, pl.handL, cc), segDist(pl.butt, pl.handL, wc));
    // how far into the torso the pole goes: samples from the butt to above the left hand, the pole's
    // radius counted (inBody > 0: inside)
    let poleIn = 0, poleInS = 0;
    for (let s = 0; s <= POLE.gripR + P.span + 0.3; s += 0.02) { const v = inBody(pl.at(s)); if (v > poleIn) { poleIn = v; poleInS = s; } }
    // on screen: the pole's line against the head's middle (px), and the tip, hands, head
    const pr = (p) => projB(p, t);
    const hs = pr(hc), tip = pr(pl.tip), bt = pr(pl.butt);
    const d2 = (a, b, p) => { const ab = sub(b, a), tt = clamp(((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / (ab.x * ab.x + ab.y * ab.y), 0, 1); return len(sub(add(a, mul(ab, tt)), p)); };
    const poleHeadPx = d2(bt, tip, hs);
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const pt = (p) => { const q = pr(p); return [Math.round(q.x), Math.round(q.y)]; };
    return {
      gapL: r3(L.gap), gapR: r3(Rr.gap), dL: r3(L.d), dR: r3(Rr.d),
      EL: [r3(R.L.E.x), r3(R.L.E.y), r3(R.L.E.z)], ER: [r3(R.R.E.x), r3(R.R.E.y), r3(R.R.E.z)],
      WL: [r3(R.L.W.x), r3(R.L.W.y), r3(R.L.W.z)], WR: [r3(R.R.W.x), r3(R.R.W.y), r3(R.R.W.z)],
      inWL: r3(inBody(R.L.W)), inWR: r3(inBody(R.R.W)), inEL: r3(inBody(R.L.E)), inER: r3(inBody(R.R.E)),
      poleHead: r3(poleHead), poleChest: r3(poleChest), poleIn: r3(poleIn), poleInS: r3(poleInS), poleHeadPx: Math.round(poleHeadPx),
      tip: pt(pl.tip), butt: pt(pl.butt), hL: pt(pl.handL), hR: pt(pl.handR), head: [Math.round(hs.x), Math.round(hs.y)],
      wlS: pt(R.L.W), wrS: pt(R.R.W), elS: pt(R.L.E), erS: pt(R.R.E),
      theta: r3(P.theta), alpha: r3(P.alpha), yaw: r3(P.hYaw), pitch: r3(P.hPitch), twist: r3(P.twist), rootX: r3(P.root.x), rootY: r3(P.root.y),
    };
  } finally { setBoyView(null); BOY_POSE = null; }
};
