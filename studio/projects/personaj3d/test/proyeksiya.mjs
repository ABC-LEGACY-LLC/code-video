/* PROYEKSIYA (node, render yo'q) -- personaj.js dagi bosh zanjiri (ildiz -> boshPivot -> bosh) va main.js dagi
   kameraQoy bilan bir xil matematika: bosh fazosidagi nuqta -> ekran (px). Sahifadagi window.boshNuqta bilan
   tekshiriladi (test/uchburchak.mjs boshida). Faqat moslash/o'lchash uchun. */
import * as THREE from 'three';

export function boshMatritsa(h) {
  const ildiz = new THREE.Object3D(); ildiz.rotation.y = Math.PI / 2;
  const tana = new THREE.Object3D(); ildiz.add(tana);
  const bp = new THREE.Object3D(); tana.add(bp);
  bp.position.set(0, -0.85 + (h.chokish || 0), -(h.orqaga || 0));
  bp.rotation.set(h.egilish || 0, h.burilish || 0, h.yonga || 0);
  const b = new THREE.Object3D(); b.position.set(0, 0.85, 0); bp.add(b);
  ildiz.updateMatrixWorld(true);
  return b.matrixWorld.clone();
}

export function kameraOl(k, W = 320, H = 180) {
  const c = new THREE.PerspectiveCamera(k.fov, W / H, 0.1, 200);
  const m = new THREE.Vector3(...(k.markaz || [0, 0, 0])), az = k.az * Math.PI / 180, el = k.el * Math.PI / 180;
  c.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(k.d).add(m);
  c.lookAt(m);
  const [sx, sy] = k.ekran || [0.5, 0.5];
  c.setViewOffset(W, H, -(sx - 0.5) * W, -(sy - 0.5) * H, W, H);
  c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  return c;
}

/* bir marta quriladigan proyektor: p (bosh fazosi) -> [x, y] px */
export function proyektor(kam, poza, W = 320, H = 180) {
  const M = boshMatritsa(poza), c = kameraOl(kam, W, H), v = new THREE.Vector3();
  return p => { v.set(p[0], p[1], p[2]).applyMatrix4(M).project(c); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
}
