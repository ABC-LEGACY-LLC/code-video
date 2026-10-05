/* bosh sirti nuqtalari (bosh fazosi) -> JSON (kesim chizmasi uchun) */
import {boshNuqtalari} from '../../src/personaj.js';
import {writeFileSync} from 'fs';
const p = boshNuqtalari(90, 90, true);
writeFileSync(process.argv[2], JSON.stringify(p.map(q => q.map(a => +a.toFixed(3)))));
console.log(p.length);
