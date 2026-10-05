/* ===== PORTRET =====
   Hamma narsa bosh qurilmasining nuqtalaridan chiqadi: peshona, old chekka,
   iyak, quloq, tepa, orqa. Shuning uchun "egilish" ni o'zgartirsang, kapyushon
   ham, soch ham, ko'z ham birga ergashadi -- hech narsa qo'lda joylashmaydi. */
import {ANDOZA, qur} from './bosh.mjs';
import {writeFileSync} from 'fs';

export function portret(P, cx, cy, S=1){
 const b=qur(P,cx,cy), K=b.K, R=P.R;
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const L=[];
 const q=(cls,d)=>L.push(`<path class="${cls}" d="${d}"/>`);

 /* KAPYUSHON ORQASI: bosh suyagidan 1.42 barobar kengroq yoy, yelkaga tushadi */
 const H=(a,k)=>K(R*k*Math.cos(a*Math.PI/180), -R*k*Math.sin(a*Math.PI/180));
 const kap=[]; for(let i=0;i<=30;i++) kap.push(H(-26+(232)*i/30, 1.44));
 q('kapT', `M ${XY(kap[0])}` + kap.slice(1).map(v=>` L ${XY(v)}`).join('')
   + ` L ${XY(K(-2.0*R, 2.7*R))} L ${XY(K(1.5*R, 3.0*R))} Z`);
 /* kapyushon ichi: yuz atrofidagi qorong'i halqa */
 const ich=[]; for(let i=0;i<=24;i++) ich.push(H(30+(170)*i/24, 1.30));
 const ich2=[]; for(let i=0;i<=24;i++) ich2.push(H(200-(170)*i/24, 1.02));
 q('kapI', `M ${XY(ich[0])}` + ich.slice(1).map(v=>` L ${XY(v)}`).join('')
   + ich2.map(v=>` L ${XY(v)}`).join('') + ' Z');

 /* YUZ */
 q('teri', b.siluet);
 /* SOYA: qattiq qadam. Chegara peshonadan iyakka tushadi, yuzni ikkiga bo'ladi */
 q('teriQ', `M ${XY(b.orqa)} L ${XY(K(-0.10*R,-0.95*R))} Q ${XY(K(-0.34*R,0.30*R))} ${XY(K(-0.30*R,1.02*R))}`
   + ` Q ${XY(K(-0.62*R,0.92*R))} ${XY(b.jag)} Q ${XY(K(-0.90*R,0.52*R))} ${XY(b.orqa)} Z`);

 /* SOCH: peshonani kesib o'tgan tutamlar, hammasi bosh koordinatasida */
 const soch=[]; for(let i=0;i<=22;i++) soch.push(H(8+(184)*i/22, 1.08));
 q('soch', `M ${XY(soch[0])}` + soch.slice(1).map(v=>` L ${XY(v)}`).join('')
   + ` Q ${XY(K(-0.70*R,-0.30*R))} ${XY(K(-0.18*R,-0.52*R))}`
   + ` Q ${XY(K(0.42*R,-0.46*R))} ${XY(K(0.76*R,-0.16*R))} Z`);
 q('sochQ', `M ${XY(soch[13])} L ${XY(soch[22])} Q ${XY(K(-0.70*R,-0.30*R))} ${XY(K(-0.30*R,-0.50*R))} Z`);
 [[0.10,-0.60,0.02,-0.16],[0.40,-0.56,0.30,-0.10],[0.66,-0.36,0.58,0.00]].forEach(([x0,y0,x1,y1])=>{
  q('soch', `M ${XY(K(x0*R,y0*R))} L ${XY(K(x1*R,y1*R))} L ${XY(K((x1+0.14)*R,(y1-0.10)*R))} L ${XY(K((x0+0.12)*R,(y0+0.02)*R))} Z`);
 });

 /* KO'Z, QOSH, BURUN, OG'IZ -- bosh koordinatasida, ya'ni birga qiyalashadi */
 /* KO'Z OCHIQLIGI: 1 = to'liq ochiq, 0 = yumuq. Yumilganda ellips emas,
    egri chiziq chiziladi -- yumuq ko'z siqilgan ellips emas, chiziq. */
 const OCH = P.kozOchiq===undefined ? 1 : P.kozOchiq;
 const E=(u,r)=>{ const c=K(u*R,P.kozChiz*R);
   if(OCH<0.22){
    const a=K((u-0.13)*R,P.kozChiz*R), b=K((u+0.13)*R,P.kozChiz*R),
          m=K(u*R,(P.kozChiz+0.06)*R);
    L.push(`<path class="ing" d="M ${XY(a)} Q ${XY(m)} ${XY(b)}"/>`);
    return;
   }
   L.push(`<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r*S)}" ry="${f(r*1.18*OCH*S)}" class="koz"/>`);
   const h=K((u+0.05)*R,(P.kozChiz-0.10*OCH)*R);
   L.push(`<circle cx="${f(h[0])}" cy="${f(h[1])}" r="${f(0.30*r*S)}" fill="#f4f6fa"/>`); };
 // yuqori qovoq chiziqlari
 L.push(`<path class="ing" d="M ${XY(K(0.02*R,(P.kozChiz-0.13)*R))} Q ${XY(K(0.20*R,(P.kozChiz-0.26)*R))} ${XY(K(0.40*R,(P.kozChiz-0.14)*R))}"/>`);
 L.push(`<path class="ing" d="M ${XY(K(0.58*R,(P.kozChiz-0.14)*R))} Q ${XY(K(0.72*R,(P.kozChiz-0.25)*R))} ${XY(K(0.86*R,(P.kozChiz-0.15)*R))}"/>`);
 E(0.20,7); E(0.72,5.2);
 // qosh
 L.push(`<path class="ingQ" d="M ${XY(K(0.00*R,(P.kozChiz-0.36)*R))} Q ${XY(K(0.20*R,(P.kozChiz-0.48)*R))} ${XY(K(0.42*R,(P.kozChiz-0.34)*R))}"/>`);
 L.push(`<path class="ingQ" d="M ${XY(K(0.58*R,(P.kozChiz-0.36)*R))} Q ${XY(K(0.74*R,(P.kozChiz-0.47)*R))} ${XY(K(0.90*R,(P.kozChiz-0.33)*R))}"/>`);
 // burun (yuqoriga qaraganda pastdan ko'rinadi) va og'iz
 L.push(`<path class="ing" d="M ${XY(K(0.86*R,(P.burun-0.10)*R))} L ${XY(K(0.94*R,P.burun*R))} L ${XY(K(0.80*R,(P.burun+0.06)*R))}"/>`);
 L.push(`<path class="ing" d="M ${XY(K(0.50*R,P.ogiz*R))} Q ${XY(K(0.60*R,(P.ogiz+0.05)*R))} ${XY(K(0.70*R,P.ogiz*R))}"/>`);
 // quloq
 L.push(`<path class="ingQ" d="M ${XY(K((P.quloq[0]+0.06)*R,(P.quloq[1]-0.12)*R))} Q ${XY(K((P.quloq[0]-0.06)*R,P.quloq[1]*R))} ${XY(K((P.quloq[0]+0.06)*R,(P.quloq[1]+0.14)*R))}"/>`);
 // siyoh: siluet
 L.push(`<path class="ing" d="${b.siluet}"/>`);

 /* KAPYUSHONNING OLDINGI CHEKKASI: yuz ustidan tushadi */
 const old1=[]; for(let i=0;i<=14;i++) old1.push(H(-26+86*i/14, 1.44));
 const old2=[]; for(let i=0;i<=14;i++) old2.push(H(60-86*i/14, 1.16));
 q('kapS', `M ${XY(old1[0])}` + old1.slice(1).map(v=>` L ${XY(v)}`).join('')
   + old2.map(v=>` L ${XY(v)}`).join('') + ' Z');
 L.push(`<path class="ing" d="M ${XY(old1[0])}` + old1.slice(1).map(v=>` L ${XY(v)}`).join('') + '"/>');

 return L.join('\n');
}

/* ===== O'LCHANGAN PALITRA =====
   Maqsad klipidan namuna olingan, o'ylab topilmagan (k01.png, 320x180):
     soch      mediana #13142e   eng yorug' #656b97
     yuz       mediana #38385a   eng yorug' #636993
     kapyushon mediana #101128
     osmon     mediana #04051c   zarra #d5d6ed .. #f3eeff
   Birinchi variantda yuz #e2dad3 edi -- L 218, maqsadda esa 59. Ya'ni yuz
   ikki yarim barobar yorug' edi, va bu chizish xatosi emas, ton xatosi. */
export const USLUB = `
.kapT{fill:#101128}.kapI{fill:#07081a}.kapS{fill:#191835}
.soch{fill:#13142e}.sochQ{fill:#0b0c1e}
.teri{fill:#38385a}.teriQ{fill:#23243f}
.koz{fill:#0a0b1c}
.ing{fill:none;stroke:#000210;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ingQ{fill:none;stroke:#000210;stroke-width:1.2;stroke-linecap:round}
`;
