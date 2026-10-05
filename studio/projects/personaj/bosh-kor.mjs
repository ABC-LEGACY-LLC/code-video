import {ANDOZA} from './bosh.mjs';
import {portret, USLUB, GRAD} from './portret2.mjs';
import {writeFileSync} from 'fs';
const W=460,H=560;
const P={...ANDOZA, egilish:-9, R:150, kozOchiq:1};
writeFileSync('/home/claude/work/personaj/bosh.html',
`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111;display:grid;place-items:center;height:100%}</style></head><body>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>${GRAD}</defs><rect width="${W}" height="${H}" fill="#04051c"/><style>${USLUB}</style>${portret(P,215,230)}</svg></body></html>`);
console.log('bosh.html');
