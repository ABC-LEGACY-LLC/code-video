/* KADR SVG -- film.mjs va soch moslash serveri (test/soch-server.mjs) BIR XIL
   koddan kadr yasaydi. 11-o'tish: soch moslashi har tasvirni tez chizishi kerak
   edi; film.mjs dagi funksiyalar shu faylga ko'chirildi (xatti-harakat o'zgarmagan:
   film.html bayt-baayt bir xil chiqishi tekshiriladi). */
import {VARAQ, QORA, MS, CHEGARA, PLASH, PLASH_TON, PLASH_PAST, QOL, YOSH2, KOZ_YOSHLARI, USHLANGAN} from './varaq.mjs';
import {portret, USLUB, GRAD, kap3Geo} from './portret2.mjs';
import {qur} from './bosh.mjs';
import {sochPoly3} from './yuz.mjs';
export {VARAQ, QORA, MS, CHEGARA, USLUB, GRAD};
export const W=540,H=304;
/* misoldan o'lchangan osmon: o'ng 28% ustunlarda, median filtr bilan zarrasiz, 6 band */
export const FON='linear-gradient(to bottom,#020318 8.3%,#06071e 25%,#11112c 41.7%,#201d3c 58.3%,#2b2748 75%,#38325d 91.7%)';
/* PLASH: kadrga bog'langan qorong'i massa, portretning ORTIDA. O'ng chegarasi
   o'lchangan (varaq.mjs PLASH); bosh qatorlarida bosh markazidan oshmaydi. */
function plash(P,cx,cy,R,i){
 const ch=PLASH[P.__nom]; if(!ch) return '';
 /* faqat YUZ qatorlari cheklanadi (peshona .. iyak). Avval toj ustida ham
    cheklangan edi va sochning tepasida osmonda vertikal chiziq chiqdi --
    misolda u yerda kapyushon bor. */
 const y0=cy-0.95*R, y1=cy+1.55*R;
 const pts=ch.map((x,r)=>{const y=(r+0.5)/18*H; let X=x*W;
  if(y>y0&&y<y1) X=Math.min(X,cx); return [X,y];});
 let sm=pts.map((p,i)=>[(pts[Math.max(0,i-1)][0]+2*p[0]+pts[Math.min(pts.length-1,i+1)][0])/4,p[1]]);
 /* 10-o'tish: iyak ostidan pastda kadrga xos o'lchangan chet (varaq.mjs
    PLASH_PAST, 320 px, har 3 px) -- 10 px li qatorlar o'rniga */
 const pp=PLASH_PAST[i];
 if(pp){ const yk=pp[0][0]*S5; sm=sm.filter(p=>p[1]<yk-6).concat(pp.map(([y,x])=>[x*S5,y*S5])); }
 /* 12-o'tish: kapyushon ekran rejimida (2- va 3-kadr) plashning tepa-o'ng qismi o'lchangan
    kapyushon chizig'idan (kadr tepasini kesgan joy -> o'ng-tepa burchak) oshmaydi. Plash
    18 qatorli qo'pol profil: 3-kadr tepasida x 0.66 (320 da ~211) -- misolda kapyushon
    kadr tepasini x 179 da kesadi, o'ngida osmon (L 2..8). */
 const KE=P.__kap3&&P.__kap3.ekran;
 if(KE&&KE.tepa_ong){ const [tx]=KE.tepa_ong, [bx,by]=KE.burchak;
  sm=[[tx,0],[bx,by],...sm.filter(p=>p[1]>by+4)]; }
 const d=`M -12 -12 L ${sm[0][0].toFixed(1)} -12 `
  + sm.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  + ` L ${sm[sm.length-1][0].toFixed(1)} ${H+12} L -12 ${H+12} Z`;
 const T=PLASH_TON[P.__nom];
 if(!T) return `<path class="kapT" d="${d}"/>`;
 if(T.ustda) return `<path class="kapT" d="${d}"/>`;            // tonlari portretdan keyin (ustki)
 /* silliq yopiq egri: har qirraning o'rtasidan o'tadigan kvadratiklar */
 const egri=pp=>{const q=pp.map(([x,y])=>[x*W,y*H]), n=q.length, m=i=>[(q[i][0]+q[(i+1)%n][0])/2,(q[i][1]+q[(i+1)%n][1])/2];
  let s=`M ${m(n-1)[0].toFixed(1)} ${m(n-1)[1].toFixed(1)}`;
  for(let i=0;i<n;i++) s+=` Q ${q[i][0].toFixed(1)} ${q[i][1].toFixed(1)} ${m(i)[0].toFixed(1)} ${m(i)[1].toFixed(1)}`;
  return s+' Z';};
 /* id kadrga xos bo'lishi SHART: 1..6-tasvirda cx,cy bir xil edi -> 6 ta bir xil
    id, url(#..) birinchisiga (yashirin svg ichida) bog'lanib, 2..6 da soyalar
    KESILMASDAN chizilgan (10-o'tishda siluet o'lchovi topdi) */
 const id='pl'+i+'_'+Math.round(cx)+'_'+Math.round(cy);
 const gardish=sm.filter(p=>p[1]<T.gardish*H+12);
 return `<clipPath id="${id}"><path d="${d}"/></clipPath>`
  + `<path fill="${T.asos}" d="${d}"/>`
  + `<g clip-path="url(#${id})">`
  /* yorug' yon: qattiq chetli shakl disk bo'lib ko'rindi (ichki qora tasma
     yonida kontrast kuchli). Misolda yumshoq o'tish -- radial gradient. */
  + T.yorug.map((p,k)=>{const xs=p.map(v=>v[0]*W), ys=p.map(v=>v[1]*H);
     const gx=(Math.min(...xs)+Math.max(...xs))/2, gy=(Math.min(...ys)+Math.max(...ys))/2,
           rr=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*0.62;
     return `<radialGradient id="${id}y${k}" cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${rr.toFixed(1)}" gradientUnits="userSpaceOnUse">`
      + `<stop offset="0" stop-color="#15162f" stop-opacity="1"/><stop offset="1" stop-color="#15162f" stop-opacity="0"/></radialGradient>`
      + `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr*1.3).toFixed(1)}" fill="url(#${id}y${k})"/>`;}).join('')
  /* 10-o'tish: misolning iyak osti ustunida L 7..9 (median 7-8); #07081a 0.92 -> L 10.5 edi */
  + T.soya.map(p=>`<path fill="#04051a" opacity="0.95" d="${egri(p)}"/>`).join('')
  + `</g>`
  + (gardish.length>1?`<path fill="none" stroke="#1c1d3a" stroke-width="3" stroke-linecap="round" d="M ${gardish[0][0].toFixed(1)} -4 `+gardish.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')+`"/>`:'');
}
/* TITROQ: har tasvir qayta chizilgandek. Har tasvirga yangi, SILLIQ tasodifiy
   siljish maydoni (to'lqin uzunligi ~68 px) -- qo'shni nuqtalar birga suriladi,
   chiziq toza qoladi, lekin har qism o'zicha titraydi. Umumiy chegaraga ega
   shakllar bir xil suriladi. Faqat absolyut M/L/Q/Z ishlatiladi (tekshirilgan),
   ya'ni d dagi har son jufti -- koordinata. */
function titrat(svg,i,A){
 if(!A) return svg;
 let h=(i+1)*2654435761>>>0; const r=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};
 const f=[r(),r(),r(),r()].map(v=>v*6.2832), w=6.2832/(+process.env.TITRAT_TL||68);
 const D=(x,y)=>[A*(Math.sin(w*(0.8*x+0.6*y)+f[0])+Math.sin(w*(-0.5*x+0.9*y)+f[1]))/1.414,
                 A*(Math.sin(w*(0.7*x-0.7*y)+f[2])+Math.sin(w*(0.3*x+1.0*y)+f[3]))/1.414];
 svg=svg.replace(/ d="([^"]*)"/g,(m,d)=>{
  const t=d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g); const o=[]; let buf=[];
  for(const k of t){ if(/[A-Za-z]/.test(k)){o.push(k);} else { buf.push(+k); if(buf.length===2){const [dx,dy]=D(buf[0],buf[1]); o.push((buf[0]+dx).toFixed(1),(buf[1]+dy).toFixed(1)); buf=[];} } }
  return ` d="${o.join(' ')}"`;});
 svg=svg.replace(/<(circle|ellipse)([^>]*?) cx="([-\d.]+)" cy="([-\d.]+)"/g,(m,tag,pre,x,y)=>{const [dx,dy]=D(+x,+y); return `<${tag}${pre} cx="${(+x+dx).toFixed(1)}" cy="${(+y+dy).toFixed(1)}"`;});
 return svg;
}
/* USTKI TONLAR: kapyushon plashni yopadigan kadrlarda soyalar portretdan keyin,
   (plash U kapyushon) klipi ichida -- clipPath bolalari birlashma beradi. */
function ustki(P,cx,cy,R,i){
 const T=PLASH_TON[P.__nom]; if(!T||!T.ustda) return '';
 /* 12-o'tish: yangi kapyushonda (P.__kap3) bu soyalar YO'Q -- misolda kapyushon ustida qora
    oval yo'q, burmalar ingichka diagonal chiziqlar (alohida o'lchanadi) */
 if(P.__kap3) return '';
 const ch=PLASH[P.__nom], y0=cy-0.95*R, y1=cy+1.55*R;
 const pts=ch.map((x,r)=>{const y=(r+0.5)/18*H; let X=x*W; if(y>y0&&y<y1) X=Math.min(X,cx); return [X,y];});
 const d=`M -12 -12 L ${pts[0][0].toFixed(1)} -12 `+pts.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')+` L ${pts[pts.length-1][0].toFixed(1)} ${H+12} L -12 ${H+12} Z`;
 const egri=pp=>{const q=pp.map(([x,y])=>[x*W,y*H]), n=q.length, m=j=>[(q[j][0]+q[(j+1)%n][0])/2,(q[j][1]+q[(j+1)%n][1])/2];
  let s=`M ${m(n-1)[0].toFixed(1)} ${m(n-1)[1].toFixed(1)}`;
  for(let j=0;j<n;j++) s+=` Q ${q[j][0].toFixed(1)} ${q[j][1].toFixed(1)} ${m(j)[0].toFixed(1)} ${m(j)[1].toFixed(1)}`;
  return s+' Z';};
 const id='us'+i;
 return `<clipPath id="${id}"><path d="${d}"/><use href="#f${i}_kapOldP"/></clipPath>`
  /* burmalar yumshoq chetli: qattiq chetda ular teshik/tuynuk bo'lib ko'rindi */
  + `<g clip-path="url(#${id})"><g filter="url(#yumPlash)">` + T.soya.map(p=>`<path fill="#05061d" opacity="0.85" d="${egri(p)}"/>`).join('') + `</g></g>`;
}
/* QO'L (1-kadr, 10-o'tish): "til" modeli -- asos B (yarim eni hB, B->T ga
   normal bo'yicha), uch T, tepa chet P0->T boshqaruvi U, past chet T->P1
   boshqaruvi D; orqasi tana ichida. Nuqtalar varaq.mjs QOL (320 px),
   test/qol-fit.py misol niqobiga moslagan. Rang: misolda qo'l ichi L 8 (tana
   bilan bir xil), yorug' chet yo'q (9-o'tishdagi chet -- aslida qo'l ostidagi
   fon tirqishi edi). */
const S5=540/320, F=v=>(v*S5).toFixed(1);
function qol(i){
 const q=QOL[i]; if(!q) return '';
 return q.map(til).join('');
}
function til({B,T,U,D,hB}){
 const dx=T[0]-B[0], dy=T[1]-B[1], l=Math.hypot(dx,dy)||1, n=[-dy/l,dx/l];
 const P0=[B[0]-n[0]*hB,B[1]-n[1]*hB], P1=[B[0]+n[0]*hB,B[1]+n[1]*hB];
 const p=a=>`${F(a[0])} ${F(a[1])}`;
 const d=`M ${p(P0)} Q ${p(U)} ${p(T)} Q ${p(D)} ${p(P1)} Q ${p([B[0]-8,B[1]])} ${p(P0)} Z`;
 return `<path fill="#05061c" d="${d}"/>`;   // L 8.2
}
/* JAG'DAGI KO'Z YOSHI (ikkinchi): osilgan va tushayotgan halqa */
function yosh2(i){
 const y=YOSH2[i]; if(!y) return '';
 const [x,z]=y.c, [rx,ry]=y.r;
 if(y.t==='tomchi') return `<ellipse cx="${F(x)}" cy="${F(z)}" rx="${F(rx)}" ry="${F(ry)}" fill="#9a9ed2"/><circle cx="${F(x-0.6)}" cy="${F(z-0.7)}" r="${F(0.8)}" fill="#d4d7f4"/>`;
 return `<ellipse cx="${F(x)}" cy="${F(z)}" rx="${F(rx)}" ry="${F(ry)}" fill="#1a1b33" fill-opacity="0.55" stroke="#6e72a4" stroke-width="1.1"/>`
  + `<circle cx="${F(x+rx*0.3)}" cy="${F(z-ry*0.75)}" r="${F(0.6)}" fill="#9ea2d2"/>`;
}
/* KO'Z YOSHLARI (9-o'tish): kadr jadvalidan, 320 px -> 540. 'iz' -- ingichka
   tomchi-chiziq (tepasi uchli, pasti yumaloq, yorug'); 'katta' -- shaffof tomchi:
   yorug' chet, ichi yuz tonidan och, pastida yaltiroq; iz: [x,y] -- orqasidagi
   nam yo'l boshi. Yo'nalish: tepadan pastga, ozgina o'ngga (misolda). */
function tomchi(d){
 const [x,y]=d.c, w=d.w, h=d.h, a=Math.atan2(1,0.42)-Math.PI/2;       // ~23 gradus
 const ux=Math.sin(-a), uy=Math.cos(a);                                 // pastga yo'nalish
 const nx=uy, ny=-ux;
 const T=[x-ux*h*0.55, y-uy*h*0.55], B=[x+ux*h*0.45, y+uy*h*0.45];
 const P=(p)=>`${F(p[0])} ${F(p[1])}`;
 const L1=[B[0]+nx*w*0.5, B[1]+ny*w*0.5], L2=[B[0]-nx*w*0.5, B[1]-ny*w*0.5];
 const path=`M ${P(T)} Q ${P([x+nx*w*0.45,y+ny*w*0.45])} ${P(L1)} Q ${P([B[0]+ux*w*0.55,B[1]+uy*w*0.55])} ${P(L2)} Q ${P([x-nx*w*0.45,y-ny*w*0.45])} ${P(T)} Z`;
 let o='';
 if(d.iz) o+=`<path fill="none" stroke="#9ea2d2" stroke-width="${F(1.0)}" stroke-linecap="round" opacity="0.45" d="M ${P(d.iz)} L ${P(T)}"/>`;
 /* yorqinlik o'lchangan: misolda iz L 100..131 (11-tasvirda 170), tomchi 127..164;
    bizniki 197..224 edi */
 if(d.t==='iz') return o+`<path fill="#686c9b" d="${path}"/><ellipse cx="${F(B[0]-nx*w*0.12)}" cy="${F(B[1]-uy*h*0.12)}" rx="${F(w*0.22)}" ry="${F(h*0.14)}" fill="#8589bb"/>`;
 /* yuz USTIDA shaffof tomchi yorug' ko'rinadi (misol: 7x11 qutining ~yarmi L>82,
    eng yorug'i 127..164) -- ichi qorong'i halqa faqat qorong'i plash ustida (tushayotgan) */
 return o+`<path fill="#686c9b" fill-opacity="0.85" stroke="#7e82b3" stroke-width="${F(0.7)}" d="${path}"/>`
  + `<ellipse cx="${F(B[0]-nx*w*0.15)}" cy="${F(B[1]-uy*h*0.18)}" rx="${F(w*0.18)}" ry="${F(h*0.12)}" fill="#9296c6"/>`;
}
function yoshlar(i){ const t=KOZ_YOSHLARI[i]; return t? t.map(tomchi).join('') : ''; }
/* ust -- kadr parametrlarining ustiga yoziladigan qiymatlar (moslash uchun);
   qaynash=false -- titroqsiz (o'lchov uchun toza render) */
export function kadrSVG(i, ust={}, qaynash=true){
 const P={...VARAQ[i], ...ust}; const [cx,cy,k]=P.__joy; const R=P.R*k;
 return titrat(plash(P,cx,cy,R,i)+portret({...P,R},cx,cy,'f'+i+'_')+yoshlar(i)+qol(i)+yosh2(i)+ustki(P,cx,cy,R,i), i, (qaynash&&!USHLANGAN[i])?(P.__qay||0):0);
}

/* SOCH GEOMETRIYASI EKRANDA (moslash uchun): portret() dagi bilan bir xil Ks --
   qur() ning K si, soch uchun yumshoq siqish sqs. Qaytaradi: yorug' massa, soya
   va siyoh chiziqlari 540x304 ekran nuqtalarida. */
export function sochGeo(i, prm){
 const P0=VARAQ[i]; const [cx,cy,k]=P0.__joy; const R=P0.R*k; const P={...P0,R};
 const b=qur(P,cx,cy), sqs=0.80+0.20*(P.burilish??0.26);
 const Ks=(x,y)=>b.K(x*sqs/b.sq, y), m=p=>Ks(p[0]*R,p[1]*R);
 const {lit,soya,ink}=sochPoly3(prm);
 return {lit:lit.map(pl=>pl.map(m)), soya:soya?soya.map(m):null, ink:ink.map(([a,c])=>[m(a),m(c)]), inkW:0.012*R, R, o:Ks(0,0), ex:Ks(R,0), ey:Ks(0,R)};
}

/* KAPYUSHON GEOMETRIYASI EKRANDA (12-o'tish): kadrSVG dagi bilan bir xil P va kap3Geo --
   tashqi sirt, pona, astar nuqtalari 540x304 da (soch-server 'kapgeo'). */
export function kapGeo(i, ust={}){
 const P={...VARAQ[i], ...ust}; const [cx,cy,k]=P.__joy; const R=P.R*k; const Q={...P,R};
 const g=kap3Geo(Q); if(!g) return null;
 return {tashqi:g.tashqi, pona:g.pona, tasma:g.tasma};
}
