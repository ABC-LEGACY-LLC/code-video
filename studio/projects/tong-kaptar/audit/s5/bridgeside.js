// Signed screen distance (px) from the nose's bridge line of: the near eye's middle, the far eye's
// middle, its outer and inner corners, the far temple. Same side as the near eye = hidden side.
window.bridgeSide = (i) => {
  const t = S5.t0 + i / FPS, s = i / FPS;
  Z5 = zoom5At(s); setBoyView(Z5.k > 1.0005 ? view5(t) : null); BOY_POSE = boyPose5;
  try {
    const R = rig(t, t), HP = headParts(R, t), { Hd, HS, proj } = HP;
    const P = (v) => proj(toP(Hd, m3(fv5(v), HS)));
    const farSg = dot3(dirP(Hd, V3(1, 0, 0)), n3(s3(BOY_CAM, Hd.o))) < 0 ? 1 : -1;
    const n0 = P(V3(0, 0.076, 0.082)), n1 = P(V3(0, 0.05, 0.094));
    const nd = norm(sub(n1, n0)), nn = perp(nd);
    const sd = (v) => Math.round(dot(sub(P(v), n0), nn) * 10) / 10;
    const E = EYE5;
    return { nearEye: sd(V3(-farSg * E.c.x, E.c.y, E.c.z)), farEye: sd(V3(farSg * E.c.x, E.c.y, E.c.z)),
      farOut: sd(V3(farSg * E.ex.x, E.ex.y, E.ex.z)), farIn: sd(V3(farSg * E.en.x, E.en.y, E.en.z)), temple: sd(V3(farSg * 0.068, 0.068, 0.0)) };
  } finally { setBoyView(null); BOY_POSE = null; }
};
