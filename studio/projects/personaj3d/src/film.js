/* FILMS -- shot lists (a film = data). Each shot: number of frames, camera, held
   frames, pose(i). A long film is written in the same form: a list of shots, not thousands of frames.

   sample22 -- the sample's TIMING and STAGING (technique; the character and the drawing are ours). The values
   were measured from the sample in the 2D project (personaj/sheet.mjs):
     3 shots: 11 + 2 + 9 frames, 60 ms each; cuts at 11|12 and 13|14
     shot 1: frames 1..6 are one drawing (rigid targets identical to within 0.1 px); turn fraction
             [0,0,0,0,0,0,.03,.08,.15,.55,1] (a fast two-frame turn at 10-11); looks up;
             roll -12 -> +4 degrees; the eyes close at 10-11
     shot 2: profile, eyes closed, the calmest pair
     shot 3: side (az 80, el -5); the head tilts down, slowing (u^0.55); eyes half open (0.45)
   The camera is on the character's RIGHT side (it looks right on screen). `screen` and the distance are fitted to FACE points
   (test/fit_camera.mjs -> test/camera_fit.json): shot 1 near eye + chin (8.7 px), shots 2 and 3 near eye;
   for the face measurement (pass 3) shot 1 was shifted exactly onto the near eye (x -8.6 px): the probes are tied to the sample's eye,
   the chin difference is a face-proportion difference (not the camera);
   the scale comes from the vertical eye-chin distance. Before, it was fitted to the bright mass (hair) -- the face came out 45 px
   to the right in shot 1 and 1.6 times larger in shot 2 (audit 2).
   At shot 3 el -12 the snow thinned toward the top of the frame (the top bands half of the sample's) -- -5.
   PASS 5 -- STAGING AUDIT (where the sample looks, where the camera is; a single view gives only the RELATIVE
   orientation between head and camera -- the absolute value is chosen by the principle "without turning/rolling the head"):
     shot 1: camera right-front (az 55), slightly low; head ~17 deg up, eyes open, looking forward-right (unchanged;
             with el -30 the head is level, but it would need a 21 deg sideways roll -- test/stage_fit.mjs --az 54,56).
     shot 2: profile (az 84), head LEVEL (tilt -0.08), eyes closed; before, -0.10 + the lower-face shift had turned the face
             ~20 deg up (test/stage2_fit.mjs: front contour 21 rows + under the chin, RMS 1.33 px).
     shot 3: camera LOW (el -30), right-front (az 55, the same side as shot 1), close; head TILTED 39 deg, not turned,
             no sideways roll; eyes half open, looking down (test/stage3_fit.mjs: eye + front edge of the chin 7 rows + under the jaw,
             RMS 0.88 px). Before: camera at the side (az 80, el -5), head only 9..17 deg -- "looks sideways". */
/* camera: {az, el, d, fov, screen:[sx, sy], centre} -- an orbit around centre (the head centre, world):
     az -- degrees from the character's front (+x) toward its RIGHT side (+z) (0 -- straight front, 90 -- right profile);
     el -- degrees, positive -- from above, negative -- from below; d -- distance; screen -- where in the frame the centre
     sits (fraction, from top-left) -- a lens shift (setViewOffset), the field of view does not change.
   pose: tilt (+ -- the head tilts down, - -- looks up), turn (+ -- the face turns away from the camera, toward profile;
     - -- toward the camera), sideways (roll), closed (0 open, 0.5 half, 1 closed), sink (head down, units). */
/* TEARS (shot 1) -- per frame: A (vertical trail below the eye), B (trail along the cheek) -- a segment a -> b in head space,
   w -- half width, k -- strength; C -- a drop hanging at the jaw edge (ring, 7..9; at the jaw edge -- the surface boundary, approximate
   position); droplet -- a falling drop (10, 11; in world space, at the depth of the chin). Values from test/tear_measure.mjs
   (the sample's L>70 components and the tear_jaw probe carried into head/world space). Pass 9: carried over again with a single head shape
   and the new poses (C -- at the jaw edge, by hand: the back-projection is uncertain at the surface boundary, 2.4..3.8 px).
   Pass 10: after the jaw was refitted, A and B were carried over again (test/tear_measure.mjs; the previous one test/tear_fit_world9b.json). */
const TEAR1 = [
  {A: {a: [-0.45, -0.449], b: [-0.471, -0.549], w: 0.014, k: 0.9}},   // 1
  {A: {a: [-0.43, -0.415], b: [-0.461, -0.534], w: 0.014, k: 0.9}},   // 2
  {A: {a: [-0.395, -0.339], b: [-0.459, -0.518], w: 0.014, k: 0.9}},   // 3
  {A: {a: [-0.463, -0.465], b: [-0.474, -0.515], w: 0.014, k: 0.85}},   // 4
  {A: {a: [-0.472, -0.565], b: [-0.472, -0.611], w: 0.014, k: 0.7}, B: {a: [-0.346, -0.42], b: [-0.345, -0.513], w: 0.016, k: 0.9}},   // 5
  {A: {a: [-0.485, -0.623], b: [-0.481, -0.652], w: 0.014, k: 0.55}, B: {a: [-0.355, -0.439], b: [-0.356, -0.547], w: 0.016, k: 0.9}},   // 6
  {B: {a: [-0.367, -0.547], b: [-0.35, -0.681], w: 0.016, k: 0.9}, C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}},   // 7
  {B: {a: [-0.381, -0.607], b: [-0.352, -0.721], w: 0.016, k: 0.9}, C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}},   // 8
  {B: {a: [-0.404, -0.61], b: [-0.368, -0.738], w: 0.016, k: 0.9}, C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}},   // 9
  {B: {a: [-0.521, -0.619], b: [-0.43, -0.8], w: 0.016, k: 0.9}, droplet: [0.814, -1.338, -0.082]},   // 10
  {B: {a: [-0.497, -0.709], b: [-0.386, -0.884], w: 0.016, k: 0.9}, droplet: [0.721, -1.815, -0.182]},   // 11
];
export const FILMS = {
  sample22: {
    ms: 60,
    shotList: [
      /* PASS 7 -- HOOD PER SHOT (hood: on top of CLOTHES.hood; main.js setShotHood -- when the shot changes the surface is
         rebuilt, constant within a shot, follows the head by the KF/KT fraction). In the sample the hood lies differently in each shot
         (audit 7: the visible head in the sample over the 3 shots 6300-7400/6600/4100-5700 px, ours 11800-12900/4000/13500-14100). Fit
         (test/fit_hood7.mjs): the sample's visible head (test/audit_sample/head_mask.py, L>=40 -- face, hair, lining
         band) <-> the role render, IoU; with the condition that in shots 1 and 3 the figure (occlusion map) does not drop below the delivered level.
         Result (test/audit_sample/hood_measure.py, 960 -> 320): head IoU 0.41/0.49/0.23 -> 0.81/0.62/0.69, ours/sample area
         1.75/0.61/3.03 -> 1.05/0.65/1.09, figure 0.900/0.864 -> 0.928/0.884. Lining band (bandA, bandV): in the sample
         in shot 1 ~14 px to the right of the face at L 43-45 (rows 40-95), under the jaw L 7-10 -- the band ends at the jaw (v ~0.6). */
      {name: 'shot-1', n: 11,
       /* pass 13 (item 5): the camera and a pose offset for the whole shot (tilt +0.0767, turn -0.1135, sideways -0.0015), fitted to Alonur's
          marks (R03, R10: eyes, nose, mouth, chin -- test/face13_s1.mjs) together with the whole-frame classes + figure
          (test/fit_camera_structure.mjs --shot 1): face RMS 4.18 -> 2.94 px. Before: az 55, el -8, d 7.03, screen [0.261, 0.310]. */
       camera: {az: 55.654, el: -9.09, d: 6.9767, fov: 27, screen: [0.2615, 0.2953], centre: [0, 0, 0]},
       hold: [0, 1, 2, 3, 4, 5],
       pose(i) {
         /* pass 4: the pose was fitted ON EVERY FRAME to the sample's face points (test/fit_pose1.mjs; head v3, camera fixed):
            near eye (anchor), far eye, mouth, lip shadow; at 10-11 the closed-eye line and the mouth. The previous g table
            (0.23 .. 1.0, turn amplitude 0.47) had been taken from figure pair differences -- on the face at frame 9 the near eye
            went 9.5 px and the mouth 7.6 px to the right: in the sample the face barely turns at 7-9 (anchor +0.8..+3.3 px), at 10-11
            the eyes close, the head turns and rolls sideways. Pose and profile together (test/fit_pose1b.mjs; sideways fixed, near eye
            weight 3): point RMS at 7-11: 2.2 2.7 2.7 2.1 1.4 px, front contour <= 3.5 px (at frame 10 the front of the chin 5 px).
            tear -- the tear trails (in head space, test/tear_measure.mjs): the TEAR1 table. */
         /* pass 5: 7..11 refitted (test/fit_pose1c.mjs) -- the lower-face shift no longer depends on the profile weight (shift),
            the profile weight controls only the near-eye map. The shift comes from the sample's 7..11 drawings, where the front contour
            is drawn farther from the eye (the edge comes before the eye): 0.15 at 7-9 (contour -2.8/-3.6/-1.9 -> -0.9/-1.8/-1.0 px), 0.3 at 10-11
            (front of the chin -9.2 -> -4.8, -7.0 -> -1.6 px); eye map 0.10 at 11. Point RMS 2.0 2.5 2.5 2.1 1.9 px. */
         /* pass 9: the eye map (profile) and the lower-face shift (shift) were removed -- a single head (personaj.js HEAD);
            the pose was refitted on every frame to this head (test/fit_head9.mjs; points + front contour rows together). */
         /* pass 10: after the head was refitted with all parts (test/fit_head10.mjs), so were the poses; they were 1-6 [-0.300, -0.158],
            7 [-0.306, -0.129], 8 [-0.316, -0.101], 9 [-0.318, -0.055], 10 [-0.277, 0.137], 11 [-0.232, 0.214] */
         /* the fit gave each frame its own offset (1-6 +0.018, 7-9 +0.012..+0.016, 10 +0.043, 11 +0.031 tilt), but with the ones for 10
            and 11 the 9 -> 10 scale jump came back (1.005 -> 1.029: the hood rig follows the pose). One offset for the whole
            of shot 1 (+0.0184, -0.0078) -- the motion stays as in pass 9. */
         const T = [[-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0],
                    [-0.2876, -0.1368, -0.03], [-0.2976, -0.1088, -0.03], [-0.2996, -0.0628, -0.03], [-0.2586, 0.1292, 0.15], [-0.2136, 0.2062, 0.15]][i];
         return {tilt: T[0] + 0.0767, turn: T[1] - 0.1135, sideways: T[2] - 0.0015, closed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1][i], tear: TEAR1[i]};
       }},
      {name: 'shot-2', n: 2,
       /* pass 8: camera SCALE from the figure and the visible head (test/fit_camera8.mjs): d 12.88 -> 10.32, screen
          [0.411, 0.447] -> [0.422, 0.474]. In pass 5, d had been fitted to the lower-face contour (nose..chin, 21 rows) -- the whole
          head and hood came out smaller than in the sample: figure area 0.407 (sample 0.509), visible head 4 300 px (sample
          6 620) -- at the cut from shot 1 to shot 2 "the camera pulls back" (in the sample the figure grows 0.431 -> 0.509). Now figure
          IoU 0.738 -> 0.887, head IoU 0.62 -> 0.75, head area 1.04. At this scale the face is ~1.25 times larger than the sample's
          (in the sample the profile face is drawn small relative to the head) -- for the face pass. */
       /* pass 9: fitted together with the hood (test/fit_hoodPose9.mjs): distance and screen -- figure mass and visible
          head + face contour (a penalty if RMS exceeds 1.5 px): d 10.32 -> 10.7994, screen [0.3865, 0.4228] (face contour RMS 2.17 px) */
       /* PASS 11 (Alonur's marks, test/fit_pose11.mjs + test/fit_pose11b.mjs): the distance of passes 8/9 (12.88 -> 10.32 ->
          10.80) had been pulled toward a wrong "chin" -- the detector took the mouth line for the chin (24 px): in the sample eye -> chin is 57 px,
          ours 36. Face (human marks: eyes, nose, mouth, chin, jaw, front contour), visible head and figure TOGETHER,
          with the hood key: d 10.80 -> 7.39 (close to the 7.03 of shot 1 -- in the sample the scale barely changes at the cut),
          face RMS 15.2 -> 2.5 px, head IoU 0.661 -> 0.750 (area ratio 0.71 -> 1.01), figure 0.914 -> 0.923. */
       camera: {az: 83.983, el: -3.052, d: 7.3931, fov: 27, screen: [0.3315, 0.3924], centre: [0, 0, 0]},
       /* pass 5 (staging audit): camera and pose fitted to the sample's FRONT CONTOUR (21 rows, y 70..110) and under the chin,
          without the lower-face shift, head not turned/rolled (test/stage2_fit.mjs --el -5 --sideS 0.01 --yawS 0.02: RMS 1.33 px).
          Head LEVEL (-0.08, ~5 deg up). The eye is not in the fit: in profile the sample's eye is 17.5 px behind our 3/4
          position -- the near-eye drawing moves sideways with the map (profile 1, EYE_PROFILE). Previous (pass 4):
          d 11.0, tilt -0.10 + full shift -- the contour was fitted to that, the face looked ~20 deg up. */
       /* pass 9: refitted to a single head (test/fit_head9.mjs, contour + under the chin): tilt -0.081 -> -0.014; the eye
          map (profile 1) removed -- the profile eye is 17.4 px ahead of the sample's (at d 12.7): the sample's 2D trick, a residual */
       /* pass 10: the head fit wanted to move the shot 2 pose from -0.014 to -0.0896 (turn 0.008) (lower face 4.78 ->
          3.26 px), but when moved together with the hood rig key the scale jump at shot 1 10 -> 11 came back (1.008 ->
          1.057: the shot 2 key came closer to the shot 1 poses and gave weight to the open hood at 10-11). Pose, rig and the shot 2
          camera are fitted TOGETHER (next step) -- for now the previous pose. */
       /* pass 11: the head is turned 33 deg toward the camera and rolled 14 deg -- not a pure profile: in the sample the lash tip of the
          far eye shows on the front contour (157, 82), the near eye is 24 px behind the contour; ours had the eye on the contour (17 px ahead) */
       pose(i) { return {tilt: -0.0646 + 0.004 * i, turn: -0.5838, sideways: -0.2404, closed: 1}; }},
      /* pass 5 (staging audit): camera LOW and right-front, head tilted DEEP -- in the sample the face is seen 3/4 (the eye in the
         top-middle of the face region, the chin below the eye), the UNDERSIDE of the hood brim (a bright band) is visible. Still frames
         20-22: eye (eyelid line) + front edge of the chin (7 rows) + under the jaw; head not turned and not rolled (test/stage3_fit.mjs
         --el -30 --az 55, dense silhouette: RMS 0.88 px, tilt 0.68 = 39 deg; at el -25..-35, az 55..60 39..43 deg). Previous:
         az 80, el -5, d 8.10, tilt 0.15..0.30 -- the head almost upright in profile, "looks sideways". */
      /* hood (pass 7): the head tilted 39 deg, the hood frame only 14 deg at the KF fraction -- the top of the head came out forward
         through the opening; in the sample the head is INSIDE the hood (only the lower face and the front strands show). The upper part
         leans forward (pitch), the opening turns to the far side (yaw), the lining band is wide on the far brim (in the sample L 43-45 to the right of the face) */
      {name: 'shot-3', n: 9,
       /* pass 11 (Alonur's marks): nose, mouth, far eye measured for the first time -- they were 9-14 px low-left; pose,
          camera and hood key TOGETHER (test/fit_pose11b.mjs): face RMS 14.0 -> 4.5 px. The head IoU of that time (0.656 -> 0.658)
          counted the lining as "head" -- the lining filled in the missing hair, and the hood covered 28 % of the sample's face; after the key
          was refitted (the personaj.js hoodPose comment): head IoU without lining 0.551 -> 0.458, figure 0.885 -> 0.885, hood
          on the sample's face 0.05 -> 0.14, our skin in the sample's dark 0.35 -> 0.11 (README pass 11 item 2) */
       camera: {az: 54.729, el: -30.209, d: 8.1442, fov: 29, screen: [0.3709, 0.4876], centre: [0, 0, 0]},
       pose(i) {
         /* motion (test/stage3_motion.mjs): the sample's eye goes only 5.5 px down from 15 -> 18, then stays in place -- the head is
            already tilted at frame 15 (the face region almost the same over 15..22); 14 is an in-between drawing of the motion. The tilt
            overshoots at 18 (0.70) and settles to 0.68; sink/backward -- a small shift solved from the eye track (eye residual <= 0.2 px).
            The bright hair mass dropping 32 px (2.8 -> 1.0 %) comes mainly from the top of the head entering the hood's shadow. */
         /* pass 9: the still pose refitted to a single head 0.68 -> 0.66 (test/fit_head9.mjs); the whole table by the same amount */
         /* pass 10: the head fit wanted to move the whole table's tilt by -0.104 (the chin and jaw track improve; in the sample
            eye -> chin 45 px, ours 61 -- the face length is sensitive to tilt), but the eye (stage_measure: the same rule) went
            1 -> 6 px. The shot 3 pose and camera (el) are solved again TOGETHER, with all parts and the mass -- for now the previous pose. */
         /* pass 11: frame 14 (the in-between of the motion) separately -- the shift of the whole table (+0.0425) was fitted to 15-22, at 14
            the face RMS was 6.9 px (mouth (4,-5.4), chin (4.8,-5.9), jaw -8.0): the head there is already tilted more. Only the tilt
            0.41 -> 0.53 (human marks R14 + jaw track, test/face11.mjs): RMS 3.2 px (mouth 1.5, chin 2.8, jaw -1.7). */
         const E = [[0.53, 0.005, -0.07], [0.60, 0.005, -0.07], [0.64, 0.015, -0.06], [0.66, 0.0, -0.05], [0.68, -0.01, -0.065],
                    [0.67, -0.005, -0.02], [0.66, -0.02, -0.02], [0.66, -0.02, -0.025], [0.66, -0.02, -0.02]][i];
         /* pass 11: for the whole table tilt +0.0425, turn 0.03 -> 0.1589, sideways -0.05 -> 0.1436 (after the shot 2 key was updated, shot 3 once more, with the hood key) */
         return {tilt: E[0] + 0.0425, turn: 0.1589, sideways: 0.1436, closed: 0.5, sink: E[1], backward: E[2]};
       }},
    ],
  },
  /* check: a grid of head turn x tilt in the shot 1 camera (to compare the face direction with the sample) */
  faceGrid: {
    ms: 60,
    shotList: [[-0.15, -0.30], [0.10, -0.30], [0.35, -0.30], [-0.15, -0.55], [0.10, -0.55], [0.35, -0.55]].map(([b, e]) => ({
      name: 'b' + b + 'e' + e, n: 1, camera: {az: 55, el: -8, d: 7.03, fov: 27, screen: [0.261, 0.310], centre: [0, 0, 0]},
      pose() { return {tilt: e, turn: b, sideways: 0, closed: 0}; }})),
  },
  /* check (pass 12, structure): MOCK-UP -- the whole head + hood + shoulders, from farther away, one pose (?mockupPose=0|1|2 --
     still / shot 2 / shot 3 pose, still by default); front, 3/4, profile, back-side, back, from below, from above */
  mockup: {
    ms: 60,
    shotList: [[0, 0], [45, 0], [90, 0], [135, 0], [180, 0], [45, -40], [60, 55]].map(([az, el]) => ({
      name: 'az' + az + 'el' + el, n: 1, camera: {az, el, d: 11, fov: 27, screen: [0.5, 0.5], centre: [0, -0.6, 0]},
      pose() { return {tilt: 0, turn: 0, sideways: 0, closed: 0}; }})),
  },
  /* check (pass 12, structure): NEAR MOCK-UP -- head, hair and hood close up, 8 azimuths + from above + from below
     (head space: az 0 -- front of the face, 90 -- right side (the camera side in the sample), 180 -- back) */
  nearMockup: {
    ms: 60,
    shotList: [[0, 0], [45, 0], [90, 0], [135, 0], [180, 0], [225, 0], [270, 0], [315, 0], [45, 60], [45, -40]].map(([az, el]) => ({
      name: 'az' + az + 'el' + el, n: 1, camera: {az, el, d: 6.2, fov: 27, screen: [0.5, 0.5], centre: [0, -0.15, 0]},
      pose() { return {tilt: 0, turn: 0, sideways: 0, closed: 0}; }})),
  },
  /* check: a circling view (1 frame per shot) -- to see the geometry from every side */
  circle: {
    ms: 60,
    shotList: [0, 35, 55, 84, 150].map(az => ({name: 'az' + az, n: 1, camera: {az, el: 0, d: 5.2, fov: 27, screen: [0.5, 0.5], centre: [0, -0.2, 0]},
      pose() { return {tilt: 0, turn: 0, sideways: 0, closed: 0}; }})),
  },
};

/* PASS 9 CHECK -- 3D CONSISTENCY (test/camera_test9.mjs). The user: "when the camera comes to that sample position
   it must be 1:1 ... if you treat it as 2D, when the camera moves it ends up in the wrong place". Pose and time
   are held (?time=), only the camera moves: in a 3D-consistent world nothing changes in object space -- only the projection.
   camPath: the camera moves continuously between the shot 1 -> 2 -> 3 cameras of sample22 (24 steps per interval). The shot-dependent
   values (hood, kfIn, profile, shift) are defined only at the sample cameras -- in between, from the nearest key (key -- the frame
   next to the cut: shot 1 11, shot 2 12, shot 3 14). orbit: 360 deg around the head (10 deg step), the same pose, the shot 1 hood;
   profile is not given -- the code takes it from the camera angle (main.js profileWeight). camRef -- the camera from which the
   snow layer and the background "top" are computed (in sample22 the shot 1 camera). */
{
  const M22 = FILMS.sample22.shotList, h11 = M22[0].pose(10);
  const HOLD = {tilt: h11.tilt, turn: h11.turn, sideways: h11.sideways, closed: h11.closed, tear: h11.tear};
  const KEY = [[M22[0], h11], [M22[1], M22[1].pose(0)], [M22[2], M22[2].pose(0)]].map(([s, h]) =>
    ({camera: s.camera}));
  const L = (a, b, t) => a + (b - a) * t;
  const span = (a, b, t) => ({az: L(a.az, b.az, t), el: L(a.el, b.el, t), d: L(a.d, b.d, t), fov: L(a.fov, b.fov, t),
    screen: [0, 1].map(i => L(a.screen[i], b.screen[i], t)), centre: [0, 1, 2].map(i => L(a.centre[i], b.centre[i], t))});
  const test = (name, camera) => ({name, n: 1, camera, pose() { return {...HOLD}; }});
  const fpath = [];
  for (let seg = 0; seg < 2; seg++) for (let j = seg ? 1 : 0; j <= 24; j++) {
    const t = j / 24;
    fpath.push(test(`fpath${seg + 1}${seg + 2}_${j}`, span(KEY[seg].camera, KEY[seg + 1].camera, t)));
  }
  FILMS.camPath = {ms: 60, camRef: M22[0].camera, shotList: fpath};
  /* posePath (pass 9): CAMERA HELD (the shot 1 camera), time held, the head pose continuous between the three shot poses
     (shot 1 still -> shot 2 -> shot 3 still, 24 steps per interval) -- does the pose-dependent hood change smoothly (without jumps) */
  const PZ = [M22[0].pose(0), M22[1].pose(0), M22[2].pose(6)].map(h => ({tilt: h.tilt, turn: h.turn, sideways: h.sideways || 0, sink: h.sink || 0, backward: h.backward || 0}));
  const posePathShots = [];
  for (let seg = 0; seg < 2; seg++) for (let j = seg ? 1 : 0; j <= 24; j++) {
    const t = j / 24, a = PZ[seg], b = PZ[seg + 1], h = Object.fromEntries(Object.keys(a).map(k => [k, L(a[k], b[k], t)]));
    posePathShots.push({name: `pose${seg + 1}${seg + 2}_${j}`, n: 1, camera: M22[0].camera, pose() { return {...h, closed: 1}; }});
  }
  FILMS.posePath = {ms: 60, camRef: M22[0].camera, shotList: posePathShots};
  FILMS.orbit = {ms: 60, camRef: M22[0].camera, shotList: Array.from({length: 37}, (_, j) =>
    test('orb' + j * 10, {az: j * 10, el: -8, d: 7.03, fov: 27, screen: [0.5, 0.5], centre: [0, -0.1, 0]}))};
}

export function shotTop(film, f) {
  let a = 0;
  for (const s of film.shotList) { if (f < a + s.n) return {s, i: f - a}; a += s.n; }
  const s = film.shotList[film.shotList.length - 1]; return {s, i: s.n - 1};
}
export const imageCount = film => film.shotList.reduce((a, s) => a + s.n, 0);
