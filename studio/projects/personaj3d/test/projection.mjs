/* PROJECTION (node, no render) -- the same maths as the head chain in personaj.js (root -> headPivot -> head) and
   setCamera in main.js: a point in head space -> screen (px). Checked against window.headPoint on the page
   (at the start of test/triangle.mjs). For fitting/measuring only. */
import * as THREE from 'three';

export function headMatrix(h) {
  const root = new THREE.Object3D(); root.rotation.y = Math.PI / 2;
  const body = new THREE.Object3D(); root.add(body);
  const bp = new THREE.Object3D(); body.add(bp);
  bp.position.set(0, -0.85 + (h.sink || 0), -(h.backward || 0));
  bp.rotation.set(h.tilt || 0, h.turn || 0, h.sideways || 0);
  const b = new THREE.Object3D(); b.position.set(0, 0.85, 0); bp.add(b);
  root.updateMatrixWorld(true);
  return b.matrixWorld.clone();
}

export function getCamera(k, W = 320, H = 180) {
  const c = new THREE.PerspectiveCamera(k.fov, W / H, 0.1, 200);
  const m = new THREE.Vector3(...(k.centre || [0, 0, 0])), az = k.az * Math.PI / 180, el = k.el * Math.PI / 180;
  c.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(k.d).add(m);
  c.lookAt(m);
  const [sx, sy] = k.screen || [0.5, 0.5];
  c.setViewOffset(W, H, -(sx - 0.5) * W, -(sy - 0.5) * H, W, H);
  c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  return c;
}

/* a projector built once: p (head space) -> [x, y] px */
export function projector(cam, pose, W = 320, H = 180) {
  const M = headMatrix(pose), c = getCamera(cam, W, H), v = new THREE.Vector3();
  return p => { v.set(p[0], p[1], p[2]).applyMatrix4(M).project(c); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
}
