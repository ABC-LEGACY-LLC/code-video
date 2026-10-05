import {TEMPLATE} from './head.mjs';
import {portrait, STYLE_CSS, GRAD} from './portrait2.mjs';
import {writeFileSync} from 'fs';
const PERSONAJ_DIR = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/$/, '');   // the personaj folder
const W=460,H=560;
const P={...TEMPLATE, tilt:-9, R:150, eyeOpenness:1};
writeFileSync((PERSONAJ_DIR + '/head.html'),
`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111;display:grid;place-items:center;height:100%}</style></head><body>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>${GRAD}</defs><rect width="${W}" height="${H}" fill="#04051c"/><style>${STYLE_CSS}</style>${portrait(P,215,230)}</svg></body></html>`);
console.log('head.html');
