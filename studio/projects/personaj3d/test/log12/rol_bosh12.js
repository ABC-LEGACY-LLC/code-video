/* STYLE: rol (tekshiruv) -- har rol bitta toza rang, post yo'q, kontur yo'q, qor ko'rinmaydi.
   3D ning afzalligi: har tasvirda qaysi piksel qaysi qism ekanini ANIQ bilamiz (misolda buni
   ton sinflari bilan taxminlaymiz). Audit shu niqoblar bilan bizning tonlarni o'lchaydi.
   Kapyushon uch qismga bo'linadi: tashqi sirt, ichki sirtning chetdagi astar tasmasi, chuqur ichi. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {vertIch, TASMA} from './umumiy.js';

export const ROL_RANG = {          // sRGB: toza, bir-biridan uzoq ranglar
  teri: '#ff0000', boyin: '#800000', soch: '#00ff00', sochIch: '#008000',
  kapTashqi: '#0000ff', kapAstar: '#00ffff', kapIch: '#000080',
  plash: '#ff00ff', plashIch: '#800080',
};

function tekis(rang) {
  return new THREE.ShaderMaterial({
    uniforms: {uR: {value: new THREE.Color(rang)}},
    vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uR; void main(){ gl_FragColor = vec4(uR, 1.0); }`,
  });
}

export default {
  nom: 'rol',
  adim: 1,
  izoh: 'rol niqoblari (tekshiruv)',
  material(rol) {
    if (rol === 'kapyushon') return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {uT: {value: new THREE.Color(ROL_RANG.kapTashqi)}, uA: {value: new THREE.Color(ROL_RANG.kapAstar)}, uI: {value: new THREE.Color(ROL_RANG.kapIch)}},
      vertexShader: vertIch(),
      fragmentShader: `uniform vec3 uT, uA, uI; varying float vChet; varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN;
        void main(){ gl_FragColor = vec4(gl_FrontFacing ? uT : (vChet < ${TASMA.toFixed(3)} ? uA : uI), 1.0); }`,
    });
    if (rol === 'plash') return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {uT: {value: new THREE.Color(ROL_RANG.plash)}, uI: {value: new THREE.Color(ROL_RANG.plashIch)}},
      vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uT, uI; void main(){ gl_FragColor = vec4(gl_FrontFacing ? uT : uI, 1.0); }`,
    });
    return tekis(ROL_RANG[rol] || '#ffffff');
  },
  kontur() { return null; },
  osmon: () => new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide}),
  qor: () => new THREE.PointsMaterial({size: 0, transparent: true, opacity: 0}),
  fon: '#000000',
  post(renderer, scene, camera) {
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;      // rang o'zgarmasin (niqob)
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    return c;
  },
};
