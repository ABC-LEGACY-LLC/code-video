/* head surface points (head space) -> JSON (for the section drawing) */
import {headPoints} from '../../src/personaj.js';
import {writeFileSync} from 'fs';
const p = headPoints(90, 90, true);
writeFileSync(process.argv[2], JSON.stringify(p.map(q => q.map(a => +a.toFixed(3)))));
console.log(p.length);
