/* STYLE: role (check) -- each role is one clean colour, no post, no contour, the snow is not visible.
   The advantage of 3D: on every frame we know EXACTLY which pixel is which part (in the sample we
   estimate this with tone classes). The audit measures our tones with these masks.
   The hood is split into three parts: the outer surface, the lining band on the edge of the inner surface, the deep inside. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {vertInner, BAND} from './common.js';

export const ROLE_COLOUR = {          // sRGB: clean colours, far from each other
  skin: '#ff0000', neck: '#800000', hair: '#00ff00', hairInner: '#008000',
  hoodOuter: '#0000ff', hoodLining: '#00ffff', hoodInner: '#000080',
  cloak: '#ff00ff', cloakInner: '#800080',
};

function flat(colour) {
  return new THREE.ShaderMaterial({
    uniforms: {uR: {value: new THREE.Color(colour)}},
    vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uR; void main(){ gl_FragColor = vec4(uR, 1.0); }`,
  });
}

export default {
  name: 'role',
  stride: 1,
  note: 'role masks (check)',
  material(role) {
    if (role === 'hood') return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {uT: {value: new THREE.Color(ROLE_COLOUR.hoodOuter)}, uA: {value: new THREE.Color(ROLE_COLOUR.hoodLining)}, uI: {value: new THREE.Color(ROLE_COLOUR.hoodInner)}},
      vertexShader: vertInner(),
      fragmentShader: `uniform vec3 uT, uA, uI; varying float vEdge; varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
        void main(){ gl_FragColor = vec4(gl_FrontFacing ? uT : (vEdge < ${BAND.toFixed(3)} ? uA : uI), 1.0); }`,
    });
    if (role === 'cloak') return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {uT: {value: new THREE.Color(ROLE_COLOUR.cloak)}, uI: {value: new THREE.Color(ROLE_COLOUR.cloakInner)}},
      vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uT, uI; void main(){ gl_FragColor = vec4(gl_FrontFacing ? uT : uI, 1.0); }`,
    });
    return flat(ROLE_COLOUR[role] || '#ffffff');
  },
  contour() { return null; },
  sky: () => new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide}),
  snow: () => new THREE.PointsMaterial({size: 0, transparent: true, opacity: 0}),
  background: '#000000',
  post(renderer, scene, camera) {
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;      // keep the colours unchanged (mask)
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    return c;
  },
};
