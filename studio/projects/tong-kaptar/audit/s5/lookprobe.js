window.lookProbe = (i) => {
  const s = i / FPS, q = perf5(s), a = lookAngles5(s);
  return { yaw: +q.headYaw.toFixed(3), pitch: +q.headPitch.toFixed(3), lyaw: +a.yaw.toFixed(3), lp: +a.pitch.toFixed(3), gy: +q.face.gy.toFixed(3) };
};
