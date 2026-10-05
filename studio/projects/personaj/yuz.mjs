/* ===== YUZ BELGILARI =====
   Anime yuzining tuzilishi aniq, va u bir nechta qoidaga tayanadi:

   KO'Z. Eng muhim belgi, va u ellips emas. Ustki qovoq -- QALIN egri chiziq,
   tashqi burchakda qalinroq. Kamalak (iris) baland ellips, ustki qovoq uni
   yuqoridan KESADI -- shuning uchun u har doim qisman yashiringan. Yorug'lik
   nuqtasi chap-yuqorida. Pilpillashda ellipsni siqish emas, KESISH pastga
   tushadi: qovoq kamalak ustidan yopiladi.

   SOCH. Yaxlit qalpoq emas -- uchli tutamlar. Har tutam pastga qarab
   ingichkalashadi, va ular bir-birini qisman yopadi.

   Hamma narsa bosh koordinatasida -- ya'ni egilishga o'zi ergashadi. */

export function koz(K,R,u,kozChiz,och,katta,id,sx=1,ko=1,yon=1){
 /* ===== KO'Z, 9-o'tish (misol 12x, L jadvali katak-katak) =====
    8-o'tishdagi ko'z 5x da noto'g'ri chiqdi: 3 px baland joyda, 3 px baland
    bo'yli, qanoti ICHKI burchakda, ichi och halqa. Keyingi urinish (bodom
    teshik) kamalakni 5 px ga qisib qo'ydi. Misol (5-tasvir, yaqin ko'z,
    qorong'i markazga nisbatan px):
      - TESHIK yumaloq to'rtburchak, ~15x9 px: ustki qovoq (-8,-1.5)->(7,-3.5),
        ichki tomoni deyarli TIK (7,-3.5)->(6.5,5.5), pasti tekis;
      - qovoq ~2.5 px qalin tasma, tashqi uchi pastga egiladi;
      - kamalak 8x7 px, markazi (0.5,2.5), juda qorong'i (L 4-15), PASTKI 3
        qatori ochroq (L 21-25); ikki yonida KO'Z OQI (#52567e, L 74-104):
        tashqida ~4.5 px, ichkida ~2 px;
      - yaltiroq 1 px, xira (L 78); pastki qovoq chizilmaydi;
      - yumuq: langardan ~1 px yuqorida 10-16 px uzun qalin chiziq.
    UZOQ KO'Z (yon -1): qisqargan -- qorong'i tik oval ~5x8 px (misol 1-tasvir
    118..122 x 45..52), ko'z oqi ko'rinmaydi, ustida qisqa qovoq.
    Hammasi bosh birligida: o'lchov 12 gradus rol bilan qaytarib aylantirilgan,
    s*R ga bo'lingan. */
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const s=katta, o=Math.min(1,Math.max(0,och));
 const P=(du,dv)=>K((u+yon*du*s*sx)*R, (kozChiz+dv*s)*R);
 const m=(a,b)=>[a[0]+(b[0]-a[0])*o, a[1]+(b[1]-a[1])*o];
 const L=[];
 if(yon>0){
  const O=m([-0.28,-0.03],[-0.211,-0.014]), I=m([0.30,-0.05],[0.299,-0.196]);
  const RB=m([0.30,-0.04],[0.349,0.123]),   LB=m([-0.28,-0.02],[-0.163,0.214]);
  const cT=m([0.01,-0.05],[0.044,-0.125]),  cR=m([0.30,-0.045],[0.34,-0.04]);
  const cB=m([0.01,-0.03],[0.09,0.24]),     cL=m([-0.28,-0.025],[-0.24,0.10]);
  const Od=m([-0.33,0.02],[-0.247,0.078]);
  const teshik=`M ${XY(P(...O))} Q ${XY(P(...cT))} ${XY(P(...I))} Q ${XY(P(...cR))} ${XY(P(...RB))}`
   + ` Q ${XY(P(...cB))} ${XY(P(...LB))} Q ${XY(P(...cL))} ${XY(P(...O))} Z`;
  if(o>0.08){
   L.push(`<clipPath id="k${id}"><path d="${teshik}"/></clipPath>`);
   L.push(`<g clip-path="url(#k${id})">`);
   L.push(`<path fill="#52567e" d="${teshik}"/>`);
   /* kamalak QOVOQ OSTIDAN boshlanadi (misolda qovoq tasmasi va kamalak bir
      qorong'i massa; 8x da bizda orada ko'z oqi yo'li qolib, qovoq alohida
      "qosh" bo'lib ko'rindi). Teshikning butun bo'yini to'ldiradi, tepasini
      teshik klipi kesadi. */
   const km=P(0.116,0.02);
   L.push(`<ellipse cx="${f(km[0])}" cy="${f(km[1])}" rx="${f(0.143*s*sx*R)}" ry="${f(0.205*s*R)}" fill="#080b26"/>`);
   const kp=P(0.116,0.170);
   L.push(`<ellipse cx="${f(kp[0])}" cy="${f(kp[1])}" rx="${f(0.105*s*sx*R)}" ry="${f(0.045*s*R)}" fill="#15173c"/>`);
   const h=P(0.076,-0.030);
   L.push(`<ellipse cx="${f(h[0])}" cy="${f(h[1])}" rx="${f(0.028*s*sx*R)}" ry="${f(0.030*s*R)}" fill="#4d5180"/>`);
   L.push(`</g>`);
  }
  L.push(`<path fill="none" stroke="#07081a" stroke-width="${f((0.090+0.020*(1-o))*s*R)}" stroke-linecap="round" stroke-linejoin="round"`
       + ` d="M ${XY(P(...Od))} Q ${XY(P(O[0]+0.004,O[1]-0.012))} ${XY(P(...O))} Q ${XY(P(...cT))} ${XY(P(...I))}"/>`);
 } else {
  /* 10-o'tish (taqqos, har tasvir): uzoq ko'zning qorong'i o'zagi (L<22) misolda
     x 118..122, y 47..53, bizda 117..121, 44..52 -- 1..6-tasvirda tizimli
     (-1.4, -1.4) px. Butun uzoq ko'z (oval, yaltiroq, qovoq) ko'z birligida
     (-0.125, +0.046) ga surildi (yon -1: +du chapga). Yaltiroq misolda o'zakning
     PASTKI-chap chetida (119,52 L 92), bizda tepa-chapda edi. */
  const D=[-0.125,0.046], c=[0.056+D[0],-0.134+D[1]];
  if(o>0.08){
   const e=P(c[0],c[1]+0.02*(1-o));
   L.push(`<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${f(0.19*s*sx*R)}" ry="${f(0.167*o*s*R)}" fill="#080b26"/>`);
   const h=P(c[0]+0.057,c[1]+0.113*o);
   L.push(`<circle cx="${f(h[0])}" cy="${f(h[1])}" r="${f(0.022*s*R)}" fill="#4d5180" opacity="${o.toFixed(2)}"/>`);
  }
  /* 12x ustma-ust: qovoq chap uchi ovaldan chiqib turardi (misolda u yerda yuz toni) */
  const yA=m([-0.10+D[0],c[1]],[-0.10+D[0],c[1]-0.15]), yB=m([0.24+D[0],c[1]-0.01],[0.25+D[0],c[1]-0.17]);
  L.push(`<path fill="none" stroke="#07081a" stroke-width="${f(0.085*s*R)}" stroke-linecap="round" d="M ${XY(P(...yA))} L ${XY(P(...yB))}"/>`);
 }
 /* qosh: ingichka va xira -- misolda qoshlar asosan peshona tutamlari ostida */
 L.push(`<path fill="none" stroke="#2b2d44" stroke-width="${f(0.032*s*R)}" stroke-linecap="round" opacity="0.6"`
      + ` d="M ${XY(P(-0.20,-0.40))} Q ${XY(P(0.00,-0.50))} ${XY(P(0.22,-0.48))}"/>`);
 return ko<0.999 ? `<g opacity="${ko.toFixed(2)}">${L.join('\n')}</g>` : L.join('\n');
}

/* ===== SOCH =====
   Ikki guruh, va ularning vazifasi boshqa:

   PESHONA TUTAMLARI -- soch chizig'idan pastga osiladi va QOSH USTIDA
   to'xtaydi. Birinchi variant ularni butun bosh bo'ylab chizgan va ular
   ko'zni ham, burunni ham yopib ketgan edi.

   YON TUTAMLAR -- yuz siluetidan TASHQARIDA, quloq oldida pastga tushadi.
   Yuzni ramkaga oladi, va aynan ular boshni "sochli" qiladi. */
/* ===== SOCH, 11-o'tish: KATTA TUTAMLAR (soch2) =====
   O'lchov (taqqos, 1..11 har tasvir, yorug' soch niqobi L>85, median 3):
   misolda soch KAM va KATTA tutamlardan -- keng, uzun, o'tkir, shamol bilan
   o'ngga-pastga supurilgan; yorug' ton bir tekis (median ~100, p90 103..104);
   yaqin ko'z ustidagi soha qorong'i soch (L 20..55). Bizniki ko'p ingichka tik
   tutam edi, yorug' chiziqlar L 124, tepadagi hajm misolning ~60% i, tutamlar
   o'ngga 10..22 px qisqa. Niqob IoU 0.30..0.44.
   Bu yerda tutamlar BIZNING qoidamiz bilan yasaladi (urug'li tasodif, tig'
   shakli, siyoh chizig'i); misoldan faqat MASSALAR o'lchanadi: har guruhning
   (supurma, peshona, yaqin yon) uzunligi, yo'nalishi, eni, egilishi har tasvirda
   test/soch-fit.py bilan misolning soha niqoblariga moslanadi. Tutamma-tutam
   ko'chirish yo'q.
   S -- parametrlar (varaq.mjs SOCH_P[i]); yo'q maydonlar -- quyidagi asliy. */
export const SOCH_ASL={
 hajm:1.06,                       // qalpoq tepasi radiusi (R)
 sN:7, sA0:40, sA1:150, sTheta:-32, sSpread:-4, sL:1.05, sW:0.34, sB:0.10, sS:0.06, sK:0.93,   // supurma
 pN:4, pA0:52, pA1:112, pDrop:-0.05, pDx:0.30, pW:0.22, pB:0.08, pKoz:0.10, pSoyaL:0.0,        // peshona
 yN:3, yA0:128, yA1:156, yX:-0.36, yDx:0.07, yY:1.30, yDy:0.10, yW:0.26, yBulge:0.10,          // yaqin yon
 fl:0, flT:0,                     // tutam uchlari titrog'i: amplituda (R) va tasvir fazasi
 ton:'#5b608e', tonY:'#5f6494', siyoh:'#2a2c52', soya:'#1a1b36',
 urug:4127
};
export function soch2(K,R,kozChiz,S0,idp='',kozZona=[]){
 const S={...SOCH_ASL,...S0};
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const DB=S.dbg?{q:'#888888',y:'#3050ff',s:'#ff3030',p:'#30c030',t:'#ffff00'}:null;   // faqat tekshirish uchun
 let s=S.urug; const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
 const P=([x,y])=>K(x*R,y*R);
 const U=(a,k)=>[k*Math.cos(a*Math.PI/180), -k*Math.sin(a*Math.PI/180)];
 const D=(t)=>[Math.cos(t*Math.PI/180), -Math.sin(t*Math.PI/180)];
 /* tutam uchi titrog'i: har tutamga o'z fazasi (hash), tasvir fazasi S.flT --
    ushlangan tasvirlarda yuz turadi, soch qimirlaydi (misolda juftlar IoU 0.61..0.72) */
 const hs=i=>{let h=((i+1)*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return (h>>>0)/4294967296;};
 let tN=0;
 const tit=(t)=>{const k=tN++; if(!S.fl) return t; const a=hs(k*7+1)*6.2832, b=hs(k*7+3)*6.2832;
  return [t[0]+S.fl*Math.sin(S.flT*2.1+a), t[1]+S.fl*0.7*Math.sin(S.flT*1.7+b)];};
 const geo=(r,t,w,b,b2,sS)=>{
  const dx=t[0]-r[0], dy=t[1]-r[1], l=Math.hypot(dx,dy)||1e-6, nx=-dy/l, ny=dx/l, B2=(b2??b), SS=sS||0;
  return {a:[r[0]+nx*w/2, r[1]+ny*w/2], c:[r[0]-nx*w/2, r[1]-ny*w/2], t,
   a1:[r[0]+dx*0.30+nx*(w*0.42+b*l*1.1), r[1]+dy*0.30+ny*(w*0.42+b*l*1.1)],
   a2:[r[0]+dx*0.72+nx*(w*0.18+b*l*0.6-SS*l), r[1]+dy*0.72+ny*(w*0.18+b*l*0.6-SS*l)],
   c2:[r[0]+dx*0.70-nx*(w*0.14-B2*l*0.6+SS*l), r[1]+dy*0.70-ny*(w*0.14-B2*l*0.6+SS*l)],
   c1:[r[0]+dx*0.30-nx*(w*0.36-B2*l*1.1), r[1]+dy*0.30-ny*(w*0.36-B2*l*1.1)]};
 };
 const tig=(g)=>`M ${XY(P(g.a))} C ${XY(P(g.a1))} ${XY(P(g.a2))} ${XY(P(g.t))} C ${XY(P(g.c2))} ${XY(P(g.c1))} ${XY(P(g.c))} Z`;
 const ink=(g)=>`M ${XY(P(g.c))} C ${XY(P(g.c1))} ${XY(P(g.c2))} ${XY(P(g.t))}`;
 const L=[];
 const inkW=(0.012*R).toFixed(2);
 /* 1. QALPOQ -- bosh suyagi ustidagi massa; tepasi S.hajm */
 const qal=[]; for(let i=0;i<=30;i++){const a=22+186*i/30, k=1.0+(S.hajm-1.0)*Math.max(0,Math.sin(a*Math.PI/180)); qal.push(U(a,k));}
 const qalpoqD=`M ${XY(P(qal[0]))}`+qal.slice(1).map(v=>` L ${XY(P(v))}`).join('')
  + ` Q ${XY(P([-0.96,0.40]))} ${XY(P([-0.80,0.58]))}`
  + ` Q ${XY(P([-0.42,-0.02]))} ${XY(P([-0.05,-0.40]))}`
  + ` Q ${XY(P([0.45,-0.52]))} ${XY(P(qal[0]))} Z`;
 L.push(`<path fill="${DB?DB.q:S.ton}" d="${qalpoqD}"/>`);
 /* 2. YAQIN YON -- chakkadan jag'gacha "(" massa. Kapyushon teshigi klipidan
    TASHQARIDA chiziladi (portret2): misolda 5..11-tasvirda bu massa teshik
    chetidan chapga, kapyushon astari USTIGA chiqadi; klip ichida u kesilardi. */
 const Ly=[];
 for(let j=0;j<S.yN;j++){
  const a=S.yA0+(S.yA1-S.yA0)*(S.yN>1?j/(S.yN-1):0.5)+(rnd()-0.5)*4, r=U(a,S.hajm*0.93);
  const t=tit([S.yX+S.yDx*j+(rnd()-0.5)*0.05, S.yY+S.yDy*j+(rnd()-0.5)*0.08]);
  const w=S.yW*(0.85+rnd()*0.3), g=geo(r,t,w,-S.yBulge,-S.yBulge*0.6,0.02);
  Ly.push(`<path fill="${DB?DB.y:(j===1?S.tonY:S.ton)}" d="${tig(g)}"/>`);
  Ly.push(`<path fill="none" stroke="${S.siyoh}" stroke-width="${inkW}" stroke-linecap="round" opacity="0.8" d="${ink(g)}"/>`);
 }
 /* 3. SUPURMA -- tojdan o'ngga-pastga uzun keng tutamlar */
 const sup=[];
 for(let j=0;j<S.sN;j++){
  const u=S.sN>1?j/(S.sN-1):0.5;
  const a=S.sA0+(S.sA1-S.sA0)*u+(rnd()-0.5)*6, r=U(a,S.hajm*S.sK);
  const th=S.sTheta+S.sSpread*j+(rnd()-0.5)*8, l=S.sL*(0.70+0.55*rnd());
  const d=D(th), t=tit([r[0]+d[0]*l, r[1]+d[1]*l]);
  const w=S.sW*(0.75+0.5*rnd()), b=S.sB*(0.6+0.8*rnd()), ss=S.sS*(0.5+rnd());
  sup.push({g:geo(r,t,w,b,b*0.3,ss), z:rnd(), y:rnd()<0.3});
 }
 sup.sort((p,q)=>p.z-q.z);
 for(const o of sup){
  L.push(`<path fill="${DB?DB.s:(o.y?S.tonY:S.ton)}" d="${tig(o.g)}"/>`);
  L.push(`<path fill="none" stroke="${S.siyoh}" stroke-width="${inkW}" stroke-linecap="round" opacity="0.8" d="${ink(o.g)}"/>`);
 }
 /* 4. PESHONA -- soch chizig'idan pastga-o'ngga; ko'z oldidagilar ko'zdan S.pKoz
    yuqorida to'xtaydi. Ostida SOYA davomi (S.pSoyaL): misolda ko'z ustidagi soha
    qorong'i soch (L<45 ulushi 55..72%, bizda 0%) */
 for(let j=0;j<S.pN;j++){
  const u=S.pN>1?j/(S.pN-1):0.5;
  const a=S.pA0+(S.pA1-S.pA0)*u+(rnd()-0.5)*6, r=U(a,0.97);
  let tx=r[0]+S.pDx*(0.7+0.6*rnd()), ty=kozChiz+S.pDrop+(rnd()-0.5)*0.12;
  const oldida=kozZona.some(([p,q])=>tx>p-0.05&&tx<q+0.05);
  if(oldida) ty=Math.min(ty,kozChiz-S.pKoz);
  const t=tit([tx,ty]), w=S.pW*(0.8+0.4*rnd()), b=S.pB*(0.6+0.8*rnd());
  if(S.pSoyaL>0){ const dx=t[0]-r[0], dy=t[1]-r[1], l=Math.hypot(dx,dy)||1;
   const t2=[t[0]+dx/l*S.pSoyaL, t[1]+dy/l*S.pSoyaL];
   L.push(`<path fill="${S.soya}" d="${tig(geo(r,t2,w*1.05,b,b*0.3,0.03))}"/>`); }
  const g=geo(r,t,w,b,b*0.3,0.04);
  L.push(`<path fill="${DB?DB.p:S.ton}" d="${tig(g)}"/>`);
  L.push(`<path fill="none" stroke="${S.siyoh}" stroke-width="${inkW}" stroke-linecap="round" opacity="0.75" d="${ink(g)}"/>`);
 }
 /* yumshoq o'tish (airbrush) -- faqat qalpoq ustida, oldingidek */
 L.push(`<clipPath id="${idp}cs"><path d="${qalpoqD}"/></clipPath>`);
 const c=K(0,0);
 L.push(`<rect x="${(c[0]-2.4*R).toFixed(1)}" y="${(c[1]-2.4*R).toFixed(1)}"`
      + ` width="${(4.8*R).toFixed(1)}" height="${(4.8*R).toFixed(1)}"`
      + ` fill="url(#gSoch)" clip-path="url(#${idp}cs)"/>`);
 return {ichki:L.join('\n'), tashqi:Ly.join('\n')};
}

/* ===== SOCH, 11-o'tish, 2-urinish: MASSA + BIZNING TUTAMLAR (soch3) =====
   soch2 (guruh tutamlari) 1-tasvirda IoU ni 0.33 dan faqat 0.42 ga olib chiqdi:
   guruh parametrlari misolning massa taqsimotini bera olmadi (yaqin yon ildizlari
   bosh ustida chiqib qoldi, peshona tik tishlarga aylandi). Endi ikki qatlam:
   1) MASSA -- bosh markazi atrofida qutb qobig'i: har burchakda (th0 + j*dth)
      tashqi ro[j] va ichki ri[j] radius (R birligida). Bu o'lchangan MASSA: har
      tasvirda misolning yorug' soch niqobiga moslanadi (test/soch-fit.py), 20
      gradus qadam -- bosh chetida ~22 px, ya'ni tutam emas, massa.
   2) TUTAMLAR -- bizning qoidamiz: massa chetida uchli tishlar (davr p, chuqurlik
      d, urug'li tasodif), tishlar orasidan ichkariga siyoh chiziqlari, peshona
      ostida qorong'i soch tasmasi (misolda yaqin ko'z ustida L<45 ulushi 55..72%).
   sochPoly3 -- geometriya (bosh birligida); soch3 -- SVG. Moslash serveri ham
   aynan sochPoly3 ni ishlatadi: bitta geometriya kodi. */
export const SOCH3_ASL={th0:-70, dth:20,
 ro:[0.6,0.9,1.1,1.2,1.25,1.25,1.2,1.15,1.1,1.05,1.0,1.0,1.0,1.0,1.0,0.9,0.8,0.6],
 ri:[0.6,0.8,0.7,0.5,0.35,0.2,0.1,0.1,0.15,0.3,0.6,0.8,0.85,0.85,0.85,0.8,0.75,0.6],
 tO:[-70,70,0.16,0.10], tO2:[160,270,0.16,0.08], tI:[10,160,0.14,0.08],   // tishlar: [burchak0, burchak1, davr, chuqurlik]
 soyaA:[-10,80], soyaH:0.0,          // peshona osti qorong'i soch: burchak oralig'i va qalinlik (R)
 siyohK:0.45, ton:'#5b608e', soyaTon:'#1a1b36', siyoh:'#2a2c52', urug:9151};
function _catmull(v,M){ const n=v.length, o=[];
 for(let i=0;i<n-1;i++){ const p0=v[Math.max(0,i-1)], p1=v[i], p2=v[i+1], p3=v[Math.min(n-1,i+2)];
  for(let k=0;k<M;k++){ const t=k/M, t2=t*t, t3=t2*t;
   o.push(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)); } }
 o.push(v[n-1]); return o; }
export function sochPoly3(S0){
 const S={...SOCH3_ASL,...S0}, N=S.ro.length, M=8;
 let sd=S.urug; const rnd=()=>{sd^=sd<<13;sd^=sd>>>17;sd^=sd<<5;return (sd>>>0)/4294967296;};
 const th=_catmull(S.ro.map((_,j)=>S.th0+j*S.dth),M), ro=_catmull(S.ro,M), ri0=_catmull(S.ri,M);
 const ri=ri0.map((v,k)=>Math.max(0,Math.min(v,ro[k])));
 const pt=(r,a)=>[r*Math.cos(a*Math.PI/180), -r*Math.sin(a*Math.PI/180)];
 /* OQIM: soch tojdan (S.toj, bosh birligida) tarqaladi -- tish uchlari tojdan
    UZOQLASHADI, siyoh chiziqlari tishlar orasidan TOJGA qarab ketadi. (1-urinishda
    ular bosh markaziga radial edi -- bosh tepasida yelpig'ich bo'lib ko'rindi.) */
 const toj=S.toj||[-0.35,-0.85];
 const oqim=p=>{const dx=p[0]-toj[0], dy=p[1]-toj[1], l=Math.hypot(dx,dy)||1; return [dx/l,dy/l];};
 /* tish chuqurligi massa qalinligining 45% idan oshmaydi: soch yo'q (ro=ri) joyda
    tishlar yuz ustida ingichka arra bo'lib chiqardi (1-tasvir, yonoq) */
 const qal=ro.map((v,k)=>Math.max(0,v-ri[k]));
 /* tish FAZASI burchakdan (qat'iy radius rref dagi yoy): massa tasvirdan tasvirga
    o'zgarganda tutamlar o'z joyida qoladi -- yoy uzunligidan hisoblansa, radius
    o'zgarishi bilan tishlar chet bo'ylab "o'rmalardi" */
 const tish=(rr,sp,rref)=>{ const [a0,a1,p,d]=sp, dl=rr.map(()=>0), notch=[];
  let s=0, t0=0, t1=p*(0.7+0.6*rnd()), dd=d*(0.7+0.6*rnd()), ti=0;
  /* TITROQ (S.fl, S.flT): har tish uchi tasvirdan tasvirga o'z fazasi bilan oqim bo'ylab
     +-fl suriladi -- misolning ushlangan tasvirlaridagi ingichka chet qimirlashi. Faza
     tish raqamidan (hash), rnd() ketma-ketligiga tegmaydi (fl=0 da geometriya o'zgarmaydi). */
  const fz=i=>{let h=((i+1)*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return (h>>>0)/4294967296*6.2832;};
  for(let k=0;k<rr.length;k++){
   s=Math.max(0,(th[k]-th[0]))*Math.PI/180*rref;
   while(s>=t1){ t0=t1; t1=t0+p*(0.7+0.6*rnd()); dd=d*(0.7+0.6*rnd()); ti++; if(th[k]>=a0&&th[k]<=a1) notch.push(k); }
   if(th[k]<a0||th[k]>a1) continue;
   const w=Math.min(1,(th[k]-a0)/8,(a1-th[k])/8), u=(s-t0)/(t1-t0), uch=Math.pow(1-Math.abs(2*u-1),1.6);
   dl[k]=w*Math.min(dd,0.45*qal[k])*(-0.4+1.4*uch) + (S.fl? w*uch*S.fl*Math.sin(2.1*(S.flT||0)+fz(ti+a0*7)) : 0); }
  return {dl, notch}; };
 const o1=tish(ro,S.tO,1.2), o2=tish(ro,S.tO2,1.0), i1=tish(ri,S.tI,0.4);
 const suril=(r,a,dlt)=>{const p=pt(r,a); if(!dlt) return p; const u=oqim(p); return [p[0]+u[0]*dlt, p[1]+u[1]*dlt];};
 const PO=ro.map((r,k)=>suril(r,th[k],o1.dl[k]+o2.dl[k]));
 const PI=ri.map((r,k)=>suril(Math.min(r,ro[k]-0.01),th[k],i1.dl[k]));
 /* QAYNASH (S.qay, S.flT): ushlangan tasvirlarda YUZ turadi, soch esa qaynaydi -- misolning
    farq xaritasida har tutam cheti ingichka o'zgaradi. Butun soch geometriyasiga silliq
    siljish maydoni (titrat bilan bir xil shakl, to'lqin ~1.06 R ~ 68 px/540), har tasvirga
    o'z fazasi. Tish uchi titrog'i (fl) yetmadi: 0.08 R da ham juftlar IoU 0.85 -> 0.82
    (misol 0.67) -- uchlar massaning kichik qismi. */
 /* Bu maydon MOSLASH ICHIDA (test/soch3-fit.py modeli ham shu geometriyani oladi): moslash
    uni massa darajasida qoplaydi, shuning uchun ushlangan juftlar IoU 0.73..0.83 (misol
    0.61..0.72; moslashdan keyin qo'shilganda 0.64..0.72 edi, lekin qosh zonalarini buzgan).
    Mayda tasodifiy maydon (to'lqin 0.3 R, 0.05 R) juftlarni 0.68..0.73 ga tushirdi, lekin
    chetlar eriyotganday to'lqinlandi -- olib tashlandi (METOD 12). Misolda o'zgarish --
    tutamlarning yorug'dan soyaga o'tishi: keyingi qadam, tutam soyalari. */
 const qz=(()=>{ if(!S.qay) return p=>p; let h=((S.flT||0)+1)*2654435761>>>0;
  const r=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};
  const f=[r(),r(),r(),r()].map(v=>v*6.2832), w=6.2832/1.06, A=S.qay;
  return p=>[p[0]+A*(Math.sin(w*(0.8*p[0]+0.6*p[1])+f[0])+Math.sin(w*(-0.5*p[0]+0.9*p[1])+f[1]))/1.414,
             p[1]+A*(Math.sin(w*(0.7*p[0]-0.7*p[1])+f[2])+Math.sin(w*(0.3*p[0]+1.0*p[1])+f[3]))/1.414]; })();
 PO.forEach((p,k)=>{PO[k]=qz(p);}); PI.forEach((p,k)=>{PI[k]=qz(p);});
 /* INGICHKA JOYLAR (S.minQal). Qobiq bitta yopiq halqa: soch yo'q burchakda moslash ro=ri
    qiladi, lekin ichki chet ro-0.01 bilan qisilgani uchun u yerda ingichka yorug' yoy
    qolardi -- 1-tasvirda uzoq ko'z ostida ko'zoynak gardishiday yoy, pastda radial
    chiziqlar. Ular 320 da 1..2 px: niqobning median 3 i ularni o'chiradi, ya'ni moslash
    ularni KO'RMAGAN va joyini tanlamagan. Qalinligi minQal dan kichik joylar tashlanadi;
    har yugurish alohida ko'pburchak, uchi o'tkir (qo'shni ingichka nuqtaning o'rtasi).
    minQal=0 da geometriya avvalgisi bilan bir xil (bitta ko'pburchak). */
 const lit=[], nP=PO.length, mq=S.minQal||0;
 const orta=k=>[(PO[k][0]+PI[k][0])/2, (PO[k][1]+PI[k][1])/2];
 for(let k=0, s=-1; k<=nP; k++){ const bor=k<nP && qal[k]>=mq;
  if(bor && s<0) s=k;
  if(!bor && s>=0){ const e=k-1;
   if(e-s>=3) lit.push([...(s>0?[orta(s-1)]:[]), ...PO.slice(s,e+1), ...(e<nP-1?[orta(e+1)]:[]), ...PI.slice(s,e+1).reverse()]);
   s=-1; } }
 /* peshona osti soyasi: ichki chegaradan markazga soyaH qalinlikda (uchlari silliq) */
 let soya=null;
 if(S.soyaH>0.005){ const [a0,a1]=S.soyaA, ks=[];
  for(let k=0;k<th.length;k++) if(th[k]>=a0&&th[k]<=a1) ks.push(k);
  if(ks.length>2){ const w=k=>Math.min(1,(th[k]-a0)/12,(a1-th[k])/12);
   /* soya PASTGA (bosh y bo'yicha) suriladi, markazga emas: bosh markazi yaqin ko'zning
      o'zida, radial soya ko'zga tushib, u bilan qo'shilib ketdi (langar zondi 2.2 -> 5.6 px) */
   soya=[...ks.map(k=>qz(suril(ri[k]+0.02,th[k],i1.dl[k]))), ...ks.slice().reverse().map(k=>{const p=qz(suril(ri[k],th[k],i1.dl[k])); return [p[0],p[1]+S.soyaH*w(k)];})]; } }
 /* siyoh chiziqlari: tishlar orasidan (notch) tojga qarab, uzunligi tojgacha masofaning siyohK ulushi */
 const ink=[];
 const chiz=(P,f)=>{const q=[P[0]+(toj[0]-P[0])*f, P[1]+(toj[1]-P[1])*f]; ink.push([P,q]);};
 /* faqat qolgan (tashlanmagan) massada: tashlangan ingichka yoy ostidan chiqqan chiziqlar
    yuzni kesib o'tardi (6-tasvir, ko'zlar orasida) */
 const qm=Math.max(0.08,mq);
 for(const k of [...o1.notch,...o2.notch]) if(qal[k]>qm) chiz(PO[k],S.siyohK*(0.6+0.6*rnd()));
 for(const k of i1.notch) if(qal[k]>qm) chiz(PI[k],S.siyohK*0.7*(0.6+0.6*rnd()));
 return {lit, soya, ink, S};
}
/* soya -- peshonadagi soya, KO'ZLARDAN OLDIN chiziladi (portret2): ko'zlar uning ustida.
   Ko'zdan keyin chizilganda u ko'z oqini qoplab, qorachiq bilan bitta qorong'i
   komponenta bo'ldi (langar zondi 2.2 -> 8.4 px); misolda ko'z oqi ochiq. */
export function soch3(K,R,S0,idp=''){
 const {lit,soya,ink,S}=sochPoly3(S0);
 const f=v=>v.toFixed(1), P=([x,y])=>K(x*R,y*R), XY=p=>{const q=P(p); return `${f(q[0])} ${f(q[1])}`;};
 const poly=v=>'M '+v.map(XY).join(' L ')+' Z';
 const L=[];
 if(lit.length){ const d=lit.map(poly).join(' ');
  L.push(`<path fill="${S.ton}" d="${d}"/>`);
  /* siyoh faqat soch ICHIDA (klip): tojga qaragan chiziq ingichka massadan oshib yuzga
     yoki fonga chiqardi. Klip id si tasvir prefiksi bilan -- takror id bo'lsa ko'rinmas
     tasvirdagi klip ishlatiladi (8-o'tish saboq). */
  if(S.minQal && ink.length){ L.push(`<clipPath id="${idp}sk"><path d="${d}"/></clipPath><g clip-path="url(#${idp}sk)">`); } }
 for(const [a,b] of ink) L.push(`<path fill="none" stroke="${S.siyoh}" stroke-width="${(0.012*R).toFixed(2)}" stroke-linecap="round" opacity="0.8" d="M ${XY(a)} L ${XY(b)}"/>`);
 if(S.minQal && lit.length && ink.length) L.push('</g>');
 return {soya: soya?`<path fill="${S.soyaTon}" d="${poly(soya)}"/>`:'', ustki: L.join('\n')};
}

export function soch(K,R,kozChiz,seed,idp='',vaqt=0,chayq=0,kozZona=[],lag=0){
 /* CHAYQALISH (5-o'tish). Misolda qaynash o'lchovi oraliq narvonida o'sadi
    (1.32 -> 2.31 px): o'zgarishning bir qismi har tasvirda yangi (titroq),
    bir qismi OQIB boradi -- soch shamolda chayqaladi. Tutam uchlari sekin
    to'lqinda suriladi; fazalar ALOHIDA generatordan (hash), shuning uchun
    sochning joylashuvi o'zgarmaydi -- joylashuvni har tasvirda o'zgartirish
    kalibrlangan "miltillash" buzilgan holatining o'zi. */
 const faza=i=>{let h=(i*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return (h>>>0)/4294967296*6.2832;};
 let tutN=0;
 const chay=(t)=>{const k=tutN++, f=faza(k+seed), w=6.2832/14;
  /* lag (9-o'tish): bosh burilishidan KEYIN soch uchlari orqada qoladi --
     burilish tezligi bir tasvir kechikib uchlarni teskari suradi (ildiz
     joyida, shuning uchun uzun tutam ko'proq egiladi) */
  return [t[0]+chayq*Math.sin(w*vaqt+f)+lag, t[1]+chayq*0.35*Math.sin(w*vaqt*0.8+f*1.7)];};
 /* ===== SOCH, 3-o'tish =====
    Yonma-yon qarash ko'rsatdi: eski soch DUBULG'A edi -- silliq gumbaz,
    peshonada tekis "qalpoq chizig'i", orqada bitta to'g'ri tasma. Sabab kodda
    edi: qalpoqning pastki cheti -0.12R da, tutamlar ham taxminan shu yerda
    tugardi -- ko'rinadigan chet qalpoqniki bo'lib qolardi.
    Endi har ko'rinadigan chetni TUTAM yasaydi:
      1) qalpoq tepaga ko'tarilgan (-0.42R), tutamlar uni yopadi
      2) peshona tutamlari ko'z chizig'igacha, uchlari turli balandlikda va
         o'tkir, oldinga (o'ngga) supurilgan -- misoldagi shamol
      3) old-tepadan osmonga chiqqan tikanlar -- gumbaz siluetini buzadi
      4) orqa: bir tasma emas, oraliqli alohida tutamlar
    Rang: soch/sochM/sochY misoldan o'lchangan (kontrast 1.65). */
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 let s=seed; const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
 const P=([x,y])=>K(x*R,y*R);                       // boshning mahalliy birligi -> ekran
 const U=(a,k)=>[k*Math.cos(a*Math.PI/180), -k*Math.sin(a*Math.PI/180)];
 /* tutam: ildiz -> uch, ildizda eni w, egilishi b (normal bo'ylab).
    6-o'tish: KUBIK -- s bilan S-egri (tutam shamolda to'lqinlanadi). Yaqindan
    solishtirishda bizning tutamlar to'g'ri tig'dek qattiq edi; misolda ular
    egilib, shamol yo'nalishida oqadi. */
 const geo=(r,t,w,b,b2,sS)=>{
  const dx=t[0]-r[0], dy=t[1]-r[1], l=Math.hypot(dx,dy), nx=-dy/l, ny=dx/l, B2=(b2??b), S=sS||0;
  const a=[r[0]+nx*w/2, r[1]+ny*w/2], c=[r[0]-nx*w/2, r[1]-ny*w/2];
  const a1=[r[0]+dx*0.30+nx*(w*0.42+b*l*1.1), r[1]+dy*0.30+ny*(w*0.42+b*l*1.1)];
  const a2=[r[0]+dx*0.72+nx*(w*0.18+b*l*0.6-S*l), r[1]+dy*0.72+ny*(w*0.18+b*l*0.6-S*l)];
  const c2=[r[0]+dx*0.70-nx*(w*0.14-B2*l*0.6+S*l), r[1]+dy*0.70-ny*(w*0.14-B2*l*0.6+S*l)];
  const c1=[r[0]+dx*0.30-nx*(w*0.36-B2*l*1.1), r[1]+dy*0.30-ny*(w*0.36-B2*l*1.1)];
  return {a,a1,a2,t,c2,c1,c};
 };
 const tig=(r,t,w,b,b2,sS)=>{ const g=geo(r,t,w,b,b2,sS);
  return `M ${XY(P(g.a))} C ${XY(P(g.a1))} ${XY(P(g.a2))} ${XY(P(g.t))} C ${XY(P(g.c2))} ${XY(P(g.c1))} ${XY(P(g.c))} Z`; };
 /* siyoh chizig'i: tutamning soya tomonidagi cheti (misolda tutamlar orasida
    ingichka qorong'i chiziqlar) */
 const tigSiyoh=(r,t,w,b,b2,sS)=>{ const g=geo(r,t,w,b,b2,sS);
  return `M ${XY(P(g.c))} C ${XY(P(g.c1))} ${XY(P(g.c2))} ${XY(P(g.t))}`; };
 const L=[];
 /* 1. ORQA TUTAMLAR -- QALPOQDAN OLDIN chiziladi, shuning uchun faqat erkin
    uchlari qalpoq ostidan chiqadi. Avval ular qalpoq ustida, qat'iy 11 gradus
    oraliqda va i%2 bilan navbatlashgan rangda edi -- yaqindan qaralganda
    narvon/taroq bo'lib ko'rindi (kartadagi ogohlantirishning o'zi). Endi
    oraliq, eni, uzunligi va rangi tasodifiy. */
 /* 5-o'tish: misolda yorug' soha y 0.03..0.51 -- yuz yonidagi uzun, YORUG'
    tutamlar jag'gacha tushadi. Bizniki 0.11..0.35 edi: yon tutamlar qisqa va
    40% i qorong'i (sochM, L 89 -- yorug' chegarasidan past). */
 {let a=142;
  for(let i=0;i<6;i++){
   a+=5+rnd()*12; const r=U(a,0.90);
   const t=[r[0]-0.02-rnd()*0.14, 0.85+rnd()*0.75];
   const c=rnd(); const cls=c<0.18?'sochM':(c<0.40?'sochY':'soch');
   L.push(`<path class="${cls}" d="${tig(r,chay(t),0.15+rnd()*0.12,-0.04-rnd()*0.06,0.02)}"/>`);
  }}
 /* 2. QALPOQ -- asosiy massa, old pastki cheti ko'tarilgan */
 const k=1.015, qal=[]; for(let i=0;i<=30;i++) qal.push(U(22+186*i/30,k));
 const qalpoqD=`M ${XY(P(qal[0]))}`+qal.slice(1).map(v=>` L ${XY(P(v))}`).join('')
  + ` Q ${XY(P([-0.96,0.40]))} ${XY(P([-0.80,0.58]))}`
  + ` Q ${XY(P([-0.42,-0.02]))} ${XY(P([-0.05,-0.40]))}`
  + ` Q ${XY(P([0.45,-0.52]))} ${XY(P(qal[0]))} Z`;
 L.push(`<path class="soch" d="${qalpoqD}"/>`);
 /* 2b. YUZNI RAMKAGA OLUVCHI TUTAMLAR (6-o'tish). Misolda yaqin tomonda
    tutam ko'zdan ~15 px chapda, yonoq bo'ylab jag'gacha tushadi -- yuzni
    toraytiradi. Bizda yaqin yonoq quloqqacha ochiq edi va 3/4 yuz keng
    ko'rinardi. Chakkadan (128..150 gradus) pastga. */
 /* 8-o'tish (5x): misolda yaqin tomonda KENG yorug' soch massasi chakkadan
    jag'dan pastgacha yuzni ramkaga oladi; bizda qisqa va tor edi -- yuz bilan
    soch orasida kapyushonning qorong'i ichi diagonal bo'lib ko'rinardi. */
 for(let i=0;i<4;i++){
  /* 9-o'tish (bosh fazosida o'lchandi): misolda yaqin soch massasi y 0..1.1 da
     x -0.40..-0.15 (1-tasvir; 11-da -0.55..-0.10), y 1.2..1.45 da -0.3..-0.05,
     ya'ni deyarli TIK tushadi va ko'z tashqi burchagini yopadi. Avval ildizlar
     chakkada (126..153 gradus) edi va tutamlar diagonal ketib, kapyushon
     teshigi ichida faqat ingichka uchlari qolardi. Endi ildiz tojga yaqin. */
  const a=102+i*8+rnd()*4, r=U(a,0.93);
  const t=[-0.10-0.09*i-rnd()*0.05, 1.45+0.08*i+rnd()*0.15];   // misolda soch y 100..110 gacha (1-tasvir), bizda ~95 da tugardi
  const tc=chay(t), w=0.22+rnd()*0.06;
  L.push(`<path class="${i===1?'sochY':'soch'}" d="${tig(r,tc,w,0.04,-0.03)}"/>`);
  /* tutamlar orasidagi ingichka qorong'i chiziq -- misolda yaqin soch massasi
     ichida bir nechta ajratuvchi chiziq bor; bizniki yassi "parda" edi (4x) */
  L.push(`<path fill="none" stroke="#2a2c52" stroke-width="${(0.013*R).toFixed(2)}" stroke-linecap="round" opacity="0.8" d="${tigSiyoh(r,tc,w,0.04,-0.03)}"/>`);
 }
 /* 3. OSMONGA CHIQQAN TIKANLAR -- old-tepa va toj */
 for(let i=0;i<4;i++){
  const a=14+i*14+rnd()*6, r=U(a,0.90);
  /* 6-o'tish: tikanlar radial (tashqariga) emas -- SHAMOL bilan o'ngga va
     pastga oqadi. Misolda yuqoriga qaragan uch yo'q; tutamlar tojdan o'ng-
     pastga diagonal. */
  const t=[r[0]+0.40+rnd()*0.30, r[1]+0.20+rnd()*0.22];
  L.push(`<path class="${rnd()<0.35?'sochY':'soch'}" d="${tig(r,chay(t),0.13+rnd()*0.06,0.05,0.10)}"/>`);
 }
 for(let i=0;i<5;i++){
  const a=72+i*17+rnd()*8, r=U(a,0.96), t0=U(a-6-rnd()*8,1.10+rnd()*0.14);
  const t=[r[0]+0.28+(t0[0]-r[0])*0.3, r[1]+0.02];     // toj tutamlari ham o'ngga yotadi
  L.push(`<path class="soch" d="${tig(r,chay(t),0.12,0.04)}"/>`);
 }
 /* 4. PESHONA TUTAMLARI -- ko'z chizig'igacha, uchlari turli balandlikda */
 const tut=[];
 const NT=16;                                           // ko'proq, ingichkaroq (misolda tutamlar mayda)
 for(let i=0;i<NT;i++){
  const a=34+i*(112/(NT-1))+(rnd()-0.5)*6;
  const r=U(a,0.99);
  let ty=kozChiz-0.30+rnd()*0.42;                   // -0.20 .. +0.22 (ko'z 0.10 da)
  if(i%4===1) ty=kozChiz+0.30+rnd()*0.30;           // har to'rtinchisi yonoqqacha
  const tx=r[0]*0.70+0.16+rnd()*0.30;               // oldinga supurilgan -- misolda diagonal, kuchliroq
  /* 6-o'tish: ko'z oldidagi tutamlar ko'zdan YUQORIDA tugaydi. 5-o'tishda
     peshona tutamlarini ko'z/yonoqqacha uzaytirgan edim va ular ko'zni
     yopib qo'ydi; misolda tutamlar ko'zlar ORASIDAN va YONIDAN o'tadi,
     ko'zlar ochiq qoladi. (rnd() chaqirilmaydi -- joylashuv o'zgarmasin.) */
  /* ...va tutam ko'zni UCHI bilan emas, YO'LI bilan ham yopishi mumkin: diagonal
     tutam ko'z yonida tugab, ko'z ustidan o'tadi. Shuning uchun tutamning KO'Z
     BALANDLIGIDAGI x i tekshiriladi (uchi ko'zdan past bo'lsa). */
  const yT=ty, xKoz= yT>kozChiz ? r[0]+(tx-r[0])*(kozChiz-r[1])/(yT-r[1]) : tx;
  const kozOldida=kozZona.some(([a,b])=>(tx>a&&tx<b)||(yT>kozChiz-0.2&&xKoz>a-0.05&&xKoz<b+0.05));
  const cls=rnd()<0.30?'sochM':'soch';
  if(kozOldida) ty=Math.min(ty, kozChiz-0.24-0.05*((i*7)%3));
  const tc=chay([tx,ty]);
  /* XATO TUZATILDI: eni rnd() si ilgari d() ICHIDA edi -- d() ikki marta
     chaqiriladi (halo, keyin to'liq), ya'ni halo va tanaga BOSHQA-BOSHQA eni
     tushardi va chiziqlar keyingi tutamlarning tasodifiy sonlarini o'g'irlardi. */
  const w=0.09+rnd()*0.07, bb=0.09+rnd()*0.09, sS=0.04+rnd()*0.06;   // ko'proq egilish va S
  tut.push({d:(kk)=>tig(r,[tc[0],tc[1]+kk*0.03],w+kk*0.05,bb,0.02,sS), ink:tigSiyoh(r,tc,w,bb,0.02,sS), cls, z:rnd(), yor:rnd()<0.28, siyoh:(i%3===0), r, t:[tx,ty]});
 }
 tut.sort((p,q)=>(p.cls==='sochM'?0:1)-(q.cls==='sochM'?0:1) || p.z-q.z);   // qorong'ilar orqada
 for(const u of tut){
  L.push(`<path class="${u.cls}" opacity="0.38" d="${u.d(1)}"/>`);          // yumshoq halo
  L.push(`<path class="${u.cls}" d="${u.d(0)}"/>`);
  if(u.siyoh) L.push(`<path fill="none" stroke="#2a2c52" stroke-width="${(0.013*R).toFixed(2)}" stroke-linecap="round" opacity="0.75" d="${u.ink}"/>`);
  if(u.yor){                                                                 // yorug' tola
   const r2=[u.r[0]-0.02,u.r[1]+0.02], t2=[u.r[0]+(u.t[0]-u.r[0])*0.72, u.r[1]+(u.t[1]-u.r[1])*0.72];
   L.push(`<path class="sochY" d="${tig(r2,t2,0.035,0.05)}"/>`);
  }
 }
 /* sochga yumshoq o'tish (airbrush) -- faqat qalpoq ustida */
 L.push(`<clipPath id="${idp}cs"><path d="${qalpoqD}"/></clipPath>`);
 const c=K(0,0);
 L.push(`<rect x="${(c[0]-2.4*R).toFixed(1)}" y="${(c[1]-2.4*R).toFixed(1)}"`
      + ` width="${(4.8*R).toFixed(1)}" height="${(4.8*R).toFixed(1)}"`
      + ` fill="url(#gSoch)" clip-path="url(#${idp}cs)"/>`);
 return L.join('\n');
}
