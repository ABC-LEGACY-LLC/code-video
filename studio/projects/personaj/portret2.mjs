/* ===== PORTRET (ikkinchi tuzilish) =====
   Belgilar yuz.mjs dan keladi. Bu fayl faqat QATLAM TARTIBINI va
   kapyushonni biladi.  Palitra maqsad klipidan namuna olingan:
     soch #13142e / yorug' #656b97, yuz #38385a / yorug' #636993,
     kapyushon #101128, osmon #04051c */
import {qur} from './bosh.mjs';
import {koz, soch, soch2, soch3} from './yuz.mjs';

export const GRAD = `
<filter id="yumPlash" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="yumYuz" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
<filter id="yumChiz" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="0.7"/></filter>
<linearGradient id="gYuz" x1="0" y1="0" x2="0" y2="1">
  <!-- 8-o'tish: misolda soch ostidagi peshona QORONG'I, yuz o'rtasi yassi, jag'
       chekka yorug'lik bilan. Avval teskari edi: tepasi yorug', pasti qorong'i. -->
  <stop offset="0.34" stop-color="#14152a" stop-opacity="0.50"/>
  <stop offset="0.47" stop-color="#14152a" stop-opacity="0"/>
  <stop offset="1"    stop-color="#14152a" stop-opacity="0"/>
</linearGradient>
<linearGradient id="gSoch" x1="0.15" y1="0" x2="0.6" y2="1">
  <stop offset="0%"   stop-color="#a7abd8" stop-opacity="0.34"/>
  <stop offset="40%"  stop-color="#6d72a4" stop-opacity="0.12"/>
  <stop offset="100%" stop-color="#101128" stop-opacity="0.40"/>
</linearGradient>`;

export const USLUB = `
.kapT{fill:#101128}.kapI{fill:#070818}.kapS{fill:#1a1b36}.kapB{fill:none;stroke:#080917;stroke-width:2}
/* 3-o'tishda QAYTA O'LCHANDI (maqsad/k01..k11, bosh qutisi, fazoviy):
   soch mediana #5b608e L110, soch yorug'i #77789c L132, yuz #383857 L66,
   soch/yuz kontrasti 1.65. Eski qiymatlarda soch (L81) yuzga (L72) juda yaqin
   edi -- shuning uchun soch ajralib turmasdi. teriY (L107) yuzga soch darajasidagi
   ton berib, ierarxiyani buzardi; misolda yuzda bunday ton yo'q. */
.soch{fill:#5b608e}.sochM{fill:#494c76}.sochY{fill:#77789c}
.teri{fill:#383857}.teriM{fill:#343552}.teriQ{fill:#262740}.teriY{fill:#4b4b70}
.ing{fill:none;stroke:#191b33;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
`;

/* ===== 12-O'TISH: KAPYUSHON YONDAN-PASTDAN (P.__kap3 = {ekran}, 2- va 3-kadr) =====
   Kamera personajning O'NG tomonida va pastda (ekranda o'ngga qaragan yuzning o'ng tomoni
   ko'rinadi; avval "chap" deb yozilgan edi -- xato): qirra OSTI yorug' astar tasma (L 43..48),
   kapyushon ICHI (L 7..9), tashqi sirt (L 19) -- bular faqat yondan-pastdan ko'rinadi.
   Kapyushon -- yelkaga tayangan mato; uning qirrasi (peshona ustidagi soyabon) sochga TAYANADI,
   bosh egilganda soyabon peshona ustiga tushib, sochni ko'proq yopadi (misolda yorug' soch
   -67%, tasma pastki cheti 14->18 da 53 px pastga, soch uchlari atigi 18 px).
   Kalitlar EKRANDA (540 px), misoldan O'LCHANGAN: test/kap3-olch.py -> kap3-ekran.json:
     tepa, past  -- astar tasmaning tepa va past cheti, 7 ustun kaliti (chapdan o'ngga)
     A R1 R2 B   -- pona (kapyushon ichi): uch, o'ng tomon (tik chet yoki o'tkir uch), past uch
     yon         -- pona ostidan yuz yonidagi qirra (2 nuqta)
     burchak     -- kapyushonning o'ng-tepa burchagi; tepa_ong -- chizig'i kadr tepasini kesgan joy
   Qirra = tepa_ong -> burchak -> tasma tepa cheti (o'ngdan chapga) -> R1 -> A -> B -> yon -> pastga
   tik. Tashqi sirt qirradan CHAPDAGI hammasini yopadi; pona va tasma BOSHNING USTIDA chiziladi
   (misolda boshning orqasi kapyushon ichida yashirin, bo'shliqda ichi ko'rinadi; bizning bosh
   kattaroq -- orqasi pona joyida -- tashqi sirt uni qanday yopsa, pona ham shunday yopadi).
   Tarix: 12-o'tishning 1-qadami bosh birligidagi modelni (qirra cho'qqidan chakkaga TO'G'RI
   chiziq, gumbaz CMA bilan moslangan) sinadi -- u chiziq misolda tasmaning USTIDAN o'tadi,
   tasma bizda osmonda 'shox' bo'lib qoldi; 17 parametrli CMA esa o'tkir uch va kesishgan
   qirra hosil qildi. Endi faqat o'lchangan kalitlar. */
export function kap3Geo(P){
 const E=P.__kap3&&P.__kap3.ekran; if(!E) return null;
 const tep=E.tepa, pas=E.past;
 const rim=[E.burchak, ...tep.slice().reverse(), E.R1, E.A, E.B, ...E.yon];
 const yo=E.yon[E.yon.length-1]||E.B, top=E.tepa_ong||[E.burchak[0],0];
 const tashqi=[[-40,-40],[top[0],-40],[top[0],top[1]], ...rim, [yo[0],344], [-40,344]];
 return {tashqi, pona:[E.A,E.R1,E.R2,E.B], tasma:[...tep, ...pas.slice().reverse()],
  dbg:[[...E.burchak,'burchak'],[...tep[0],'C'],[...tep[tep.length-1],'E'],[...E.A,'A'],[...E.R1,'R1'],[...E.R2,'R2'],[...E.B,'B'],...E.yon.map((p,j)=>[...p,'yon'+j])]};
}
const _d=v=>'M '+v.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')+' Z';

export function portret(P,cx,cy,idp=''){
 const b=qur(P,cx,cy), K=b.K, R=P.R;
 /* BOSH SUYAGI VA SOCH YUMALOQ. qur() dagi K 3/4 ko'rinish uchun x ni
    (0.52+0.48*burilish) ga siqadi -- yuz belgilari uchun to'g'ri, lekin shar
    har tomondan doira bo'lib ko'rinadi. Siqish sochga ham qo'llangani uchun
    soch tor ellipsga aylanib qolgan edi (misolda keng va hajmli).
    Ks: soch va kapyushon uchun yumshoqroq siqish (0.80+0.20*burilish). */
 const sq=b.sq, sqs=0.80+0.20*(P.burilish??0.26);   // sq endi qur() dan (kalitlar aralashmasi)
 const Ks=(x,y)=>K(x*sqs/sq, y);
 const f=v=>v.toFixed(1), XY=([x,y])=>`${f(x)} ${f(y)}`;
 const H=(a,k)=>Ks(R*k*Math.cos(a*Math.PI/180), -R*k*Math.sin(a*Math.PI/180));   // kapyushon yoylari -- yumaloq
 const yoy=(a0,a1,k,n=26)=>{const o=[];for(let i=0;i<=n;i++)o.push(H(a0+(a1-a0)*i/n,k));return o;};
 const yo=v=>v.map(p=>` L ${XY(p)}`).join('');
 const L=[];

 /* 1. KAPYUSHON ORQASI -- boshdan 1.5 barobar keng, pastga yelkaga tushadi */
 /* 3-o'tish: kapyushon endi faqat ORQANI yopadi (62..214 gradus). Avval -30
    dan boshlanib boshning old-tepasini ham o'rab olardi -- yonma-yon qarashda
    bu dubulg'a gardishi bo'lib ko'rindi. Misolda boshning old-tepasi ochiq
    osmon, u yerda sochning uchlari turadi. Qaytish yo'li iyak ostidan va yuz
    orqasidan o'tadi -- yuz uni yopadi. */
 const kapYoq=!!P.__kapYoq;   // 12-o'tish: moslash modeli uchun -- kapyushonsiz bosh
 const kapEkr=!!(P.kapOld&&P.__kap3&&P.__kap3.ekran);   // 12-o'tish: orqa yoy va burmalarni tashqi sirt yopadi (chizilmaydi)
 const d1=yoy(96,214,1.26);   // 62 da old-tepada qorong'i 'shox' chiqardi
 /* 6-o'tish: kapyushonning pastki (tana) nuqtalari bosh bilan BIRGA AYLANMAYDI.
    Avval ular K orqali 3.8R gacha tushib, bosh roll qilganda (1-kadr -12..+12)
    butun tanani o'ngga supurib, pastda qorong'i uchburchak chizardi. Tanani
    kadrga bog'langan plash beradi; bu yerda faqat bo'yin ostigacha. */
 const Kt=(x,y)=>[cx+x*R*0.9, cy+y*R];       // aylanmaydigan ramka
 if(!kapYoq&&!kapEkr) L.push(`<path class="kapT" d="M ${XY(d1[0])}${yo(d1.slice(1))}`
      + ` L ${XY(Kt(-2.2,2.6))} L ${XY(Kt(0.7+(P.__kapTOld??0),2.6))}`
      + ` L ${XY(Kt(0.75+(P.__kapTOld??0),1.3))} L ${XY(K(0.15*R,0.15*R))} Z"/>`);   // __kapTOld: tana old chetini surish (2-kadr xaritasi)
 /* burmalar: yig'ilgan joydan tarqaladi */
 [[112,1.20,0.80],[162,1.24,0.60]].forEach(([a,k,t])=>{
  if(!kapYoq&&!kapEkr) L.push(`<path class="kapB" opacity="0.5" d="M ${XY(H(a,k))} Q ${XY(H(a-10,k*0.75))} ${XY(K((Math.cos(a*Math.PI/180)*0.5-0.2)*R,(t*2.6)*R))}"/>`);
 });
 /* 2. KAPYUSHON ICHI -- yuz atrofidagi qorong'ilik, tepada keng, pastda tor */
 /* ichki soya kengligi o'lchangan: misolda yuz ortida ~0.5R lik qorong'i
    tasma (L<16). Avval 0.08R edi. */
 /* ...va faqat YUZ ORTIDA (quloq ustidan jag'gacha, 140..225 gradus). 74 dan
    boshlanganda u sochning ustida qora yarim oy chizdi -- misolda boshning
    tepasida kapyushon (L~20), qora emas. */
 const i1=yoy(140,225,1.40), i2=yoy(225,140,1.00);
 const G3=P.kapOld&&P.__kap3 ? kap3Geo(P) : null;
 if(G3) {}                     // 12-o'tish: kapyushon ichi (pona) boshning USTIDA, 8-bo'limda
 else if(P.kapOld) L.push(`<path class="kapI" d="M ${XY(i1[0])}${yo(i1.slice(1))}${yo(i2)} Z"/>`);
 else {
  /* 9-o'tish: KAPYUSHON TESHIGI (1-kadr). Misolda kapyushon boshning orqasini
     YOPADI: soch ko'z balandligida x~76..78 dan boshlanadi (bizda 54 dan edi,
     ~20 px orqaga chiqib turardi). O'lchov BOSH FAZOSIDA (sinov/unwarp: har
     tasvir rol va markazi qaytarilib, bosh birligidagi to'rga yoyildi):
       1-tasvir: soch chap cheti x -0.40 (y -0.1..1.1); undan chapda QORONG'I
         o'roq (L 9-13) y -0.1..0.5, x -1.1..-0.45; pastroqda YORUG' astar
         (L 36-47, uzoq tasma bilan bir xil rang) x -0.62..-0.42, y 0.5..1.1;
       11-tasvir: chet -0.35 (y 0) .. -0.60 (y 0.8); o'roq y -0.3..0.3;
         astar x -0.8..-0.55, y 0.4..1.1, tepada ham (y -0.6..-0.3).
     Bosh kapyushon ichida buriladi -- shakllar ikki kalit (1 va 11-tasvir)
     orasida tbo bilan aralashadi, yuzdagi kabi. */
  const U=(x,y)=>XY(K(x*R,y*R)), mx=(A1,A2)=>A1.map((p,i)=>[A2[i][0]+(p[0]-A2[i][0])*b.tbo, A2[i][1]+(p[1]-A2[i][1])*b.tbo]);
  /* silliq yopiq egri (qirra o'rtalaridan o'tadigan kvadratiklar): to'g'ri
     qirrali ko'pburchak film o'lchamida burchakli "yamoq" bo'lib ko'rindi */
  const poly=v=>{const n=v.length, m=i=>[(v[i][0]+v[(i+1)%n][0])/2,(v[i][1]+v[(i+1)%n][1])/2];
   let d=`M ${U(...m(n-1))}`; for(let i=0;i<n;i++) d+=` Q ${U(...v[i])} ${U(...m(i))}`; return d+' Z';};
  const orq=mx([[-0.32,-0.12],[-1.12,-0.08],[-1.12,0.15],[-0.80,0.45],[-0.60,0.56],[-0.32,0.52]],
               [[-0.28,-0.34],[-1.12,-0.34],[-1.12,0.14],[-0.82,0.28],[-0.66,0.34],[-0.36,0.32]]);
  L.push(`<path class="kapI" d="${poly(orq)}"/>`);
  /* astar -- soch cheti bo'ylab TASMA (5 nuqtali silliq shakl film o'lchamida
     yumaloq "quloq" bo'lib ko'rindi; misolda tashqi cheti soch chetiga parallel) */
  const ast=mx([[-0.36,0.46],[-0.52,0.47],[-0.62,0.52],[-0.645,0.66],[-0.65,0.80],[-0.64,0.95],[-0.60,1.10],[-0.50,1.15],[-0.36,1.16],[-0.36,0.80]],
               [[-0.40,0.34],[-0.60,0.36],[-0.74,0.44],[-0.80,0.58],[-0.82,0.75],[-0.80,0.92],[-0.70,1.08],[-0.55,1.12],[-0.40,1.12],[-0.40,0.72]]);
  L.push(`<path fill="#242851" filter="url(#yumChiz)" d="${poly(ast)}"/>`);   // yumshoq chet: misolda astar soch bilan qo'shilib ketadi
  const tO=Math.min(1,Math.max(0,(1-b.tbo)/0.81));
  if(tO>0.02) L.push(`<path fill="#242851" filter="url(#yumChiz)" opacity="${tO.toFixed(2)}" d="${poly([[-0.12,-0.70],[-0.30,-0.69],[-0.46,-0.64],[-0.52,-0.52],[-0.50,-0.38],[-0.40,-0.30],[-0.26,-0.28],[-0.22,-0.50]])}"/>`);
  P.__teshik=mx([[0.45,-1.12],[0.18,-1.05],[-0.06,-0.79],[-0.21,-0.61],[-0.30,-0.44],[-0.37,-0.26],[-0.40,-0.10],[-0.39,0.30],[-0.40,0.50],[-0.40,0.80],[-0.40,1.10],[-0.30,1.25],[-0.20,1.45],[-0.20,2.80]],
                [[0.45,-1.12],[0.18,-1.05],[-0.02,-0.85],[-0.12,-0.66],[-0.21,-0.50],[-0.28,-0.30],[-0.34,-0.10],[-0.45,0.30],[-0.52,0.50],[-0.60,0.80],[-0.54,1.00],[-0.42,1.12],[-0.30,1.30],[-0.20,2.80]]);
 }
 /* 2b. KAPYUSHONNING UZOQ YONI (9-o'tish). Misolning 1..9-tasvirida yuzning
    uzoq cheti ortida ~15 px keng tasma bor: #242851 (L 44) -- yuzdan
    (#383756) va plashdan (#101128) farqli, ko'kroq. Uzoq chakka ham shu
    tasma ostida qoladi: yuz cheti uzoq ko'z ortidan yonoqqa DIAGONAL kesiladi
    (chiziq bo'ylab yorug' chet). Bosh profilga burilgach tasma pastdan
    yo'qoladi: 10-tasvirda ~40%, 11-da faqat chakka ustida (o'lchov: tasma
    qutisidagi piksel soni 354 -> 139 -> 64). Bizda bu element umuman yo'q
    edi -- yuzning o'ng tomoni to'g'ridan-to'g'ri qorong'i osmonga chiqardi. */
 if(!P.kapOld){
  const ch=b.chet, Rp=R;                                    // PESHONA ILDIZ BURUN_T BURUN_O OGIZ_ IYAK_O IY
  const gP=Math.min(1,Math.max(0,(b.tbo-0.33)/0.55));       // pastki qism: 3/4 da to'liq, 11-tasvirda 0 (10-tasvir: misol 139 px, bizda 204 edi)
  const en=[0.33,0.47,0.36*gP,0.33*gP,0.38*gP,0.09*gP,0.06*gP];
  const tash=ch.map((p,i)=>[p[0]+en[i]*Rp, p[1]]);
  const ich=ch.slice().reverse().map(p=>[p[0]-0.25*Rp, p[1]]);
  const tp=[ch[0][0]+0.10*Rp, ch[0][1]-0.30*Rp];            // tepada soch ostiga
  /* 11-o'tish: tasma -- osilgan soch tutamlari; misolning 7..11-tasvirida ular
     orasidan OSMON ko'rinadi (tasma zondi: bizda L 30..55 piksel +12..35% ko'p edi).
     P.__tasma=[g0,g1] -- tasma enining g0..g1 ulushida tirqish (yuz tomonidan 0),
     ko'z chizig'idan pastda to'liq, tepaga qarab yopiladi. Tirqish kengligi har
     tasvirda tasma zondiga moslanadi (test/tasma-fit.py). */
  const tq=P.__tasma;
  if(tq && tq[1]>tq[0]+0.005){
   const w=[0,0.3,1,1,1,1,1], ga=en.map((e,i)=>e*(tq[0]*w[i]+(1-w[i]))), gb=en.map((e,i)=>e*(tq[1]*w[i]+(1-w[i])));
   const A=ch.map((p,i)=>[p[0]+ga[i]*Rp, p[1]]), B=ch.map((p,i)=>[p[0]+gb[i]*Rp, p[1]]);
   L.push(`<path fill="#242851" d="M ${XY(tp)} L ${A.map(XY).join(' L ')} L ${ich.map(XY).join(' L ')} Z"/>`);
   L.push(`<path fill="#242851" d="M ${B.map(XY).join(' L ')} L ${tash.slice().reverse().map(XY).join(' L ')} Z"/>`);
  } else
  L.push(`<path fill="#242851" d="M ${XY(tp)} L ${tash.map(XY).join(' L ')} L ${ich.map(XY).join(' L ')} Z"/>`);
 }

 /* 3. YUZ -- 1-kadrda kapyushon teshigi ichida (klip, 9-o'tish) */
 const teshikKlip=!P.kapOld;
 if(teshikKlip){ const U=(x,y)=>XY(K(x*R,y*R));
  const T=P.__teshik; let d=`M ${U(1.2,-1.55)} L ${U(...T[0])}`;
  for(let i=1;i<T.length-1;i++) d+=` Q ${U(...T[i])} ${U((T[i][0]+T[i+1][0])/2,(T[i][1]+T[i+1][1])/2)}`;
  L.push(`<clipPath id="${idp}tk"><path d="${d} L ${U(...T[T.length-1])} L ${U(3.2,2.8)} L ${U(3.2,-1.55)} Z"/></clipPath>`);
  L.push(`<g clip-path="url(#${idp}tk)">`); }
 L.push(`<path class="teri" d="${b.siluet}"/>`);
 /* soya: shakl bo'yicha -- peshonadan yonoqqa, keyin jag' ostiga */
 /* soya faqat ORQA uchdan birda: avval u yuzning uchdan ikkisini qoplab,
    yuzni loyqa qilgan edi */
 /* 8-o'tish: MASKA OLIB TASHLANDI. Bu yerda profil uchun chizilgan ikki soya
    shakli (orqa soya, oraliq tasma) bor edi. Yuz 3/4 ga o'tganda orqa soya
    yaqin jag'ni qoplab, yuz bo'ylab diagonal chegara -- MASKA CHETI -- hosil
    qildi; 6-o'tishdagi yumshatish uni film o'lchamida yo'qotmadi (5x da ko'rindi).
    Misolda yuz o'rtasi YASSI (L 60..75), shaklni chekka YORUG'LIK chizig'i
    beradi (pastda). */
 /* YUMSHOQ O'TISH. Yassi sel ustiga airbrush qatlami -- anime aynan shunday
    qilinadi. O'lchov aytdi: maqsad boshi 39/64 ton chelagini ishlatadi, bizniki
    (bir xil o'lchamda) 24/64. Yassi bandlar qoladi, ular ustida ton suriladi. */
 L.push(`<clipPath id="${idp}cy"><path d="${b.siluet}"/></clipPath>`);
 /* (uzoq yonoq soyasi olib tashlandi: misolda uzoq chet QORONG'I emas -- unda
    YORUG' chiziq bor, orqadagi yorug' qordan) */
 /* ORQA YORUG'LIK CHIZIG'I (8-o'tish, 8x o'lchov): misolda yuzning uzoq cheti
    va jag' osti bo'ylab ~1 px (320 da) yorug' chiziq -- yorug' qor fonidan.
    Yonoq suyagi yonida asos toni (L 66), yonoq/iyakda L 95..113; jag' bo'ylab
    iyakda eng yorug' (L 106..114), jag' burchagiga qarab asosgacha so'nadi. */
 { const Ai=b.nuqtalar.ILDIZ, Bi=b.nuqtalar.IY, Ci=b.nuqtalar.JAG;
  /* 9-o'tish: chiziq kesikdan (uzoq ko'z ortidan) boshlanadi. Misol 1-tasvirda
     chet bo'ylab L: kesik 97..115, yonoq (y 61..71) YO'Q (54..56), burun uchi
     63..89, lablar 81..92, iyak oldi yuqori 92..109, pasti 64..79, iyak
     burchagi va jag' osti 86..114, jag' bo'ylab x~104 gacha so'nadi. */
  const st=(a)=>a.map(([o,op,c])=>`<stop offset="${o}" stop-color="${c||'#7a7eb0'}" stop-opacity="${op}"/>`).join('');
  L.push(`<linearGradient id="${idp}rc" gradientUnits="userSpaceOnUse" x1="${f(Ai[0])}" y1="${f(Ai[1])}" x2="${f(Bi[0])}" y2="${f(Bi[1])}">`
   + st([[0,0.9,'#8a8ec2'],[0.13,0.9,'#8a8ec2'],[0.17,0],[0.33,0],[0.40,0.6],[0.52,0.6],[0.60,0.7],[0.66,0.95,'#8a8ec2'],[0.77,0.95,'#8a8ec2'],[0.84,0.5],[0.95,0.5],[1,1,'#8a8ec2']]) + `</linearGradient>`);
  L.push(`<linearGradient id="${idp}rj" gradientUnits="userSpaceOnUse" x1="${f(Bi[0])}" y1="${f(Bi[1])}" x2="${f(Ci[0])}" y2="${f(Ci[1])}">`
   + st([[0,1,'#8a8ec2'],[0.35,0.7],[0.55,0]]) + `</linearGradient>`);
  /* chiziq YUZ ICHIDA: chetga markazlangan bo'lsa yarmi fon ustiga tushib,
     xira ko'rinardi (5x). Yuz klipi bilan, ikki barobar qalin -> ichki yarmi. */
  L.push(`<g clip-path="url(#${idp}cy)">`
   + `<path fill="none" stroke="url(#${idp}rc)" stroke-width="${f(0.070*R)}" stroke-linecap="round" d="${b.chetYol}"/>`
   + `<path fill="none" stroke="url(#${idp}rj)" stroke-width="${f(0.070*R)}" stroke-linecap="round" d="${b.jagYol}"/></g>`);
 }
 /* UZOQ CHAKKA CHIZIG'I (9-o'tish). Misolning 1..8-tasvirida uzoq ko'z ustida,
    yuz va kapyushon tasmasi chegarasida ~5 px keng tik qorong'i yo'l (L 20-35,
    x 115..121, y 33..45) -- pastda uzoq ko'zga qo'shiladi. 11-tasvirda ham bor
    (x 133..134, y 48..58, L 14..37). Yuz ichida, chet bo'ylab. */
 if(!P.kapOld){ const [pA,pB]=[b.chet[0],b.chet[1]];
  L.push(`<g clip-path="url(#${idp}cy)"><path fill="none" stroke="#15162e" stroke-width="${f(0.13*R)}" stroke-linecap="round" filter="url(#yumChiz)" d="M ${XY([pA[0],pA[1]-0.30*R])} L ${XY(pA)} L ${XY([pB[0],pB[1]+0.01*R])}"/></g>`); }   // 12x: misolda yo'l ko'zga ulanadi (L<30 bitta tik massa, 19..22 px)
 /* KAPYUSHON SOYASI YUZDA (faqat 3-kadr). O'lchov: misolning 3-kadrida yuz
    tonidagi (L 55..90) maydon ~4.3%, bizda 10.5% -- bizning yuz kapyushon
    ichida bo'la turib to'liq yoritilgan edi. */
 if(P.kapOld && P.__yuzSoya) L.push(`<rect x="${f(cx-2.4*R)}" y="${f(cy-2.4*R)}" width="${f(4.8*R)}" height="${f(4.8*R)}"`
      + ` fill="#0a0b1c" opacity="${P.__yuzSoya.toFixed(2)}" clip-path="url(#${idp}cy)"/>`);

 /* 4. BURUN va OG'IZ -- ikki kalit: profilda burun chiziq chetda, 3/4 da
    yuz ICHIDA kichik ilmoq; og'iz profilda old chetga yaqin, 3/4 da o'rtada. */
 { /* 9-o'tish: BURUN ichida chizilmaydi. Misolning 3/4 yuzida burun uchi
     CHETDA 1.5 px do'mboq (siluetda BURUN_O) va chekka yorug'lik; yuz ichida
     L 58..60 yassi. 11-tasvirda chet tik, do'mboq ham yo'q. Avvalgi "("
     ilmog'i va 3/4 dagi kichik chiziq olib tashlandi.
     OG'IZ: misol 1-tasvirda ingichka (1 px), xira (L 37..47) deyarli to'g'ri
     chiziq, 10 px, o'ngga salgina ko'tariladi va chetga tegadi; ostida o'ng
     uchida kichik qorong'i diagonal (L 23) -- pastki lab soyasi. 11-tasvirda
     13 px, o'ng yarmi OCHIQ (qorong'i bo'shliq ~6x3 px). */
  const [oL,oM,oR]=b.ogiz, [s1,s2]=b.labSoya;
  const qc=[2*oM[0]-(oL[0]+oR[0])/2, 2*oM[1]-(oL[1]+oR[1])/2];
  L.push(`<path fill="none" stroke="#24253f" stroke-width="${f(0.022*R)}" stroke-linecap="round" d="M ${XY(oL)} Q ${XY(qc)} ${XY(oR)}"/>`);
  L.push(`<path fill="none" stroke="#141528" stroke-width="${f(0.034*R)}" stroke-linecap="round" opacity="0.9" d="M ${XY(s1)} L ${XY(s2)}"/>`);
  const lab=P.__lab||0;
  if(lab>0.02){ /* ochiq lablar: o'ng uchidan chapga og'iz uzunligining ~45% i */
   const t0=0.55, pA=[oL[0]+(oR[0]-oL[0])*t0, oL[1]+(oR[1]-oL[1])*t0], hh=0.075*R*lab;
   L.push(`<path fill="#0f1029" d="M ${XY(pA)} Q ${XY([(pA[0]+oR[0])/2, (pA[1]+oR[1])/2+hh*1.3])} ${XY([oR[0],oR[1]+hh*0.5])} L ${XY(oR)} Q ${XY([(pA[0]+oR[0])/2,(pA[1]+oR[1])/2-hh*0.2])} ${XY(pA)} Z"/>`);
  }
 }

 /* 5. KO'ZLAR -- uzoq ko'z kichikroq va yuz chekkasiga yaqin */
 const och=P.kozOchiq===undefined?1:P.kozOchiq;
 /* KO'ZLAR KATTA va AJRALGAN. Avval 0.20 va 0.72 da edi, va burilish x ni
    0.78 ga siqqani uchun ekranda bir-biriga yopishib qolgan edi. Anime'da
    ko'z yuz enining chorak qismi, va ular orasida bitta ko'z eni bor. */
 /* PROFILDA UZOQ KO'Z KO'RINMAYDI. Maqsadda bitta ko'z bor, ikkita emas --
    bu burilishning tabiiy natijasi, va ikkitasini chizish yuzni oldinga
    qaragan qilib ko'rsatadi. */
 /* 6-o'tish: ko'zlar qur() dagi kalitlar aralashmasidan -- 3/4 da ikkala ko'z,
    profilda bitta; uzoq ko'z qisqaradi (sx) va asta paydo bo'ladi (ko). */
 const H3=(P.__soch3 && !P.__soch3.yoq) ? soch3(Ks,R,P.__soch3,idp) : null;
 if(H3) L.push(H3.soya);                 // 11-o'tish: peshona soyasi ko'zlar OSTIDA
 /* moslash modeli uchun: soya rangidagi to'liq qatlam AYNAN soya o'rnida -- "ko'zlar soya
    ustida" ko'rinishi (test/soch3-fit.py). Ko'z piksellarini fondan qaytarish noaniq edi:
    ko'z ustidagi xira qovoq chizig'i ham qaytib, qosh zonasida soya ichida yorug' chiziq
    qolardi -- model 0.62, render 0.78 (1-tasvir). */
 if(P.__soyaTest) L.push(`<rect x="-4000" y="-4000" width="9000" height="9000" fill="${P.__soyaTest}"/>`);
 if(!P.__kozsiz) for(const k of b.kozlar) L.push(koz(b.Kf,R,k.u,b.kz,och,k.s,idp+k.id,k.sx,k.ko,k.id==='u'?-1:1));
 /* KO'Z YOSHI (P.__yosh = 0..1, yo'q bo'lsa chizilmaydi). Misol 1-kadri:
    6-tasvirda yaqin ko'z ostida paydo bo'ladi, yonoq bo'ylab oqib, 11-tasvirda
    lab/iyak darajasiga yetadi. Yuz koordinatasida -- burilish bilan birga
    yuradi. Tomchi + orqasida ingichka nam iz. */
 if(P.__yosh!==undefined && P.__yosh!==null){
  /* misolda ko'z yoshi ko'zdan 11, 28, 30, 35 px pastda (6, 9, 10, 11-tasvir):
     avval tez, jag'ga yaqinlashib sekinlashadi -- 1-(1-t)^1.7 */
  const k0=b.kozlar[0], g=1-Math.pow(1-Math.min(1,Math.max(0,P.__yosh)),1.7);
  const yol=t=>[k0.u+0.02+0.10*t, b.kz+0.26+0.57*t];          // 9-o'tish: 6-tasvirda misolda ko'zdan 11 px past (bizda 7 edi); oxiri ~0.83R
  const [tx,ty]=yol(g), [sx0,sy0]=yol(0);
  const T=b.Kf(tx*R,ty*R), S0=b.Kf(sx0*R,sy0*R), rr=0.040*R;
  /* iz: faqat tomchi ortida QISQA va xira (misolda qisqa yorug' chiziq; butun
     yo'l bo'ylab uzun chiziq tirnalgan izday ko'rindi) */
  /* 9-o'tish: misolda nam iz KO'ZDAN tomchigacha ko'rinadi (6, 9-tasvir: L 90..120
     yassi yuzda L 58) -- avvalgi qisqa xira iz 5x da ko'rinmadi. */
  /* ...lekin ko'zdan tomchigacha to'liq chiziq 4x da tirnalgandek ko'rindi:
     misolda iz tomchi ustida ~15 px (0.36R), tepaga qarab so'nadi. */
  { const tt=Math.max(0,g-0.36/0.57), [ax,ay]=yol(tt), gid=`${idp}yz`;
   const A0=b.Kf(ax*R,ay*R), A1=b.Kf((tx-0.004)*R,(ty-0.05)*R);
   L.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(A0[0])}" y1="${f(A0[1])}" x2="${f(A1[0])}" y2="${f(A1[1])}"><stop offset="0" stop-color="#9ea2d2" stop-opacity="0"/><stop offset="1" stop-color="#9ea2d2" stop-opacity="0.55"/></linearGradient>`);
   L.push(`<path fill="none" stroke="url(#${gid})" stroke-width="${f(0.020*R)}" stroke-linecap="round" d="M ${XY(A0)} L ${XY(A1)}"/>`); }
  /* 9-o'tish: tomchi misolda cho'zinchoq va xiraroq: 6-tasvirda L 100..124,
     11-tasvirda eng yorug' L ~165 (bizniki ~190 va yumaloq edi) */
  L.push(`<path fill="#9a9ed2" d="M ${f(T[0])} ${f(T[1]-rr*2.4)} Q ${f(T[0]+rr*0.95)} ${f(T[1]-rr*0.1)} ${f(T[0])} ${f(T[1]+rr)} Q ${f(T[0]-rr*0.95)} ${f(T[1]-rr*0.1)} ${f(T[0])} ${f(T[1]-rr*2.4)} Z"/>`);
  L.push(`<ellipse cx="${f(T[0]-rr*0.25)}" cy="${f(T[1]-rr*0.1)}" rx="${f(rr*0.26)}" ry="${f(rr*0.45)}" fill="#c9cdf0"/>`);
 }
 /* KO'Z BURUN ILDIZINING ORQASIDA turishi kerak. 0.02 da u bosh markazida
    edi -- profilda bu quloqqa yaqin joy. Profil chegarasi 0.86..1.045 da,
    ya'ni ko'z 0.50 atrofida. */


 /* 6. SILUET SIYOHI -- SOCHDAN OLDIN. 3-o'tishgacha u sochdan keyin
    chizilardi, va siluet bosh suyagi yoyini ham o'z ichiga olgani uchun
    sochning ustidan qorong'i halqa tortardi (dubulg'a gardishi). Endi soch
    bosh qismini yopadi, profil (burun, lab, iyak) esa chiziqli qoladi. */
 L.push(`<path class="ing" stroke-width="${f(0.016*R)}" d="${b.siluet}"/>`);

 /* 7. SOCH -- tutamlar, peshonani kesib o'tadi */
 let S2=null;
 { /* ko'z zonalari soch birligida: yuz x -> soch x = x*sq/sqs. Uzoq ko'z zonasi
      chetgacha (9-o'tish: misolda uzoq ko'z ustida yorug' tutam yo'q). */
  const zona=b.kozlar.map(k=>{const w=0.24*k.s*(k.id==='u'?0.80:k.sx); return [(k.u-w)*sq/sqs,(k.u+w*(k.id==='u'?1.6:1))*sq/sqs];});
  /* 11-o'tish: P.__sochP bo'lsa (1-kadr) -- katta tutamli soch2, parametrlari
     varaq.mjs SOCH_P dan (test/soch-fit.py misol niqoblariga moslaydi) */
  if(P.__soch3){ /* soch3: teshik klipidan TASHQARIDA chiziladi (pastda) */ }
  else if(P.__sochP){ S2=soch2(Ks,R,b.kz,P.__sochP,idp,zona); L.push(S2.ichki); }
  else L.push(soch(Ks,R,b.kz,P.sochUrug||2749,idp,P.__t||0,P.__chayq||0,zona,P.__sochLag||0)); }
 if(teshikKlip) L.push(`</g>`);
 if(S2) L.push(S2.tashqi);                 // yaqin yon massasi teshik klipidan tashqarida
 if(H3) L.push(H3.ustki);                // 11-o'tish: massa + tutamlar (ko'zlar ustida)

 /* 8. OLDINGI KATTA KAPYUSHON (faqat 3-kadr, P.kapOld). Misolning 3-kadrida
    kamera kapyushonga yondan qaraydi: katta qorong'i massa kadrning o'rta-
    chapini tepadan pastgacha to'ldiradi, bosh uning ichida egilgan, yuz
    teshikdan pastga-o'ngga chiqib turadi, soch kapyushon qirrasi ostidan.
    Misoldagi 3-kadr qorayishi (-7%) shu massaning o'sishidan keladi --
    butun kadrni xiralashtirishdan emas (o'lchov shuni ko'rsatdi).
    evenodd: tashqi shakl minus yuz teshigi. Hammasi bosh bilan birga buriladi. */
 if(G3){
  L.push(`<clipPath id="${idp}kapOld"><path id="${idp}kapOldP" d="${kapYoq?'M 0 0 Z':_d(G3.tashqi)}"/></clipPath>`);
  if(!kapYoq){
   L.push(`<path class="kapI" d="${_d(G3.pona)}"/>`);                      // pona (kapyushon ichi) boshning USTIDA
   if(G3.tasma) L.push(`<path fill="#242851" d="${_d(G3.tasma)}"/>`);     // qirra OSTI (astar), soch USTIDA
   L.push(`<path class="kapT" d="${_d(G3.tashqi)}"/>`); }
  if(P.__kapDbg) G3.dbg.forEach(([x,y,n])=>{P.__dbgL=(P.__dbgL||'')+`<circle cx="${f(x)}" cy="${f(y)}" r="2.5" fill="#ff3b3b"/><text x="${f(x+4)}" y="${f(y-3)}" font-size="9" fill="#ffd166">${n}</text>`;});
 }
 else if(P.kapOld){
  /* 1-urinish evenodd teshik edi -- yuz har tomondan, OLDIDAN HAM kapyushon
     bilan o'ralib, illyuminatordagidek ko'rindi. Misolda old tomon ochiq:
     kapyushon faqat tepa va orqani yopadi, yuz va soch oldinga, osmonga
     chiqib turadi. Shuning uchun teshik yo'q: oldingi cheti peshona ustidagi
     qirra uchidan boshlanib, ko'z ORTIDAN, yonoq va jag' ORTIDAN pastga tushadi. */
  const U=(x,y)=>XY(K(x*R,y*R));
  /* Gumbaz bosh bilan QATTIQ burilmaydi: kapyushon yelkadan osilib turadi.
     1-urinishda u egilish bilan to'liq burilib, kadrning o'ng-tepasiga
     yotib qoldi; misolda cho'qqi yuzning ustida va chaproqda. Shuning uchun
     gumbaz nuqtalari egilishning faqat 25% i bilan buriladi, oldingi chet
     esa boshga yopishib turishi uchun bosh ramkasida qoladi. */
  const th=(-P.egilish*0.25)*Math.PI/180, ch=Math.cos(th), sh=Math.sin(th);
  /* gumbazning o'z langari: qaynash o'lchovi ko'rsatdi -- misolning 3-kadrida
     bloklar 0.90 px/tasvir suriladi, bizda 2.3-2.7: bizning kapyushon bosh
     bilan birga qattiq cho'kardi. Misolda katta kapyushon deyarli turadi, bosh
     uning ICHIDA cho'kadi. P.__kapY -- gumbaz markazining y si (sekinroq). */
  const hy=P.__kapY??cy;
  const Uh=(x,y)=>{const X=x*0.85*R, Y=y*R; return XY([cx+X*ch-Y*sh, hy+X*sh+Y*ch]);};
  /* QIRRA CHO'ZILISHI (P.__qirra). O'lchov: misolda cho'kish paytida yorug'
     soch maydoni 3.32% dan 1.1% gacha kamayadi -- bosh kapyushonga kirib,
     qirra sochni yutadi; bizda doim ~1.5% edi. 0 = oldingi holat, 1 = qirra
     ko'zgacha tushgan, manfiy = orqaga tortilgan (ko'proq soch ko'rinadi).
     Har tasvir uchun qiymat test/qirra-sozla.py bilan o'lchab topiladi. */
  const qb=P.__qirra??0, Lp=(a,b)=>[a[0]+(b[0]-a[0])*qb, a[1]+(b[1]-a[1])*qb];
  /* TESHIK KENGLIGI (P.__ochiq, 7-o'tish): 0 = teshik ko'z ortida (3-kadr),
     1 = quloq ortida -- yon soch ko'rinadi (misolning 2-kadri: bosh chap yon
     sochi bilan iyakkacha ko'rinadi). */
  const oc=P.__ochiq??0;
  /* old tomonni surish (7-o'tish, figura xaritasi farqidan): 2-kadrda
     qirra boshning tepasida misolnikidan 1-4 blok o'ngga chiqqan, pastda esa
     old chet iyak ostidan oldinga og'ib ketgan (misolda bosh ostidan to'g'ri
     tushadi). onx -- gumbaz old tomoni va qirrani orqaga; px -- pastki
     old chetni bosh ostiga. */
  const onx=P.__kapOnX??0, px=P.__kapPast??0;
  const q1=(v=>[v[0]+onx,v[1]])(Lp([1.75,-1.45],[1.85,-0.75])), q2=(v=>[v[0]+onx*0.7,v[1]])(Lp([1.05,-0.95],[1.20,-0.25])),
        q3=Lp([0.45,-0.75],[0.60,-0.05]), q4=Lp([0.05,-0.55],[0.15,0.05]), q5=Lp([-0.55,-0.25],[-0.50,0.10]);
  const chet=` Q ${U(...q1)} ${U(...q2)}`                     // qirra uchi, peshona ustida
   + ` Q ${U(...q3)} ${U(q4[0]-0.30*oc,q4[1]-0.10*oc)}`       // qirra toj ustidan orqaga
   + ` Q ${U(q5[0]-0.45*oc,q5[1])} ${U(-0.45-0.42*oc,0.35)}`  // ko'z (yoki quloq) ortidan
   + ` Q ${U(-0.35-0.38*oc,0.95)} ${U(-0.10-0.30*oc,1.35)}`   // jag' ortidan
   + ` Q ${U(0.25+px,1.90)} ${U(0.90+px,4.6)}`;
  /* gumbaz pastroq: cho'qqi -3.45R da kadrdan ancha tepada edi va kapyushon
     konturi ko'rinmasdi. Misolda cho'qqi kadrning yuqori chetiga tegadi va
     uning yumaloq chizig'i chap-tepada qor fonida ko'rinadi. */
  const kapD=`M ${Uh(-2.9,4.6)} L ${Uh(-2.8,0.7)} Q ${Uh(-2.7,-1.4)} ${Uh(-1.5,-1.95)}`
   + ` Q ${Uh(0.0+onx*0.5,-2.45)} ${Uh(1.2+onx,-1.75)}${chet} Z`;
  L.push(`<clipPath id="${idp}kapOld"><path id="${idp}kapOldP" d="${kapD}"/></clipPath>`);
  L.push(`<path class="kapT" d="${kapD}"/>`);
  /* 7-o'tish: KAPYUSHON ANATOMIYASI (misolning cho'zilgan qorong'i xaritalaridan):
     qatorda chapdan o'ngga -- qobiq -> QORONG'I ICHKI tasma -> GARDISH (och) ->
     bosh. Ichki tasma: teshik cheti bo'ylab kapyushon ICHIDA qalin qorong'i
     chiziq (klip bilan faqat ichki yarmi ko'rinadi). Gardish: shu chet bo'ylab
     och tasma. Misol tonlari: ichki #010114..#05061d (L 8..13), gardish L ~31..37. */
  /* 1-urinish: bir xil qalin chiziq -- yuz atrofida og'ir KONTUR bo'lib ko'rindi.
     Misolda ichki soya PONA: qirrada tor, quloq/yuz balandligida keng, jag'da
     yana toraygan. Teshik cheti qirra uchidan jag'gacha nuqtalarga bo'linadi va
     yuz markazidan TASHQARIGA, o'zgaruvchan kenglikda suriladi. Gardish ham
     faqat shu qismda (jag'dan pastga plash bo'ylab tushmaydi). */
  const qS=(a,c,b,n)=>{const o=[];for(let k=0;k<=n;k++){const t=k/n,m=1-t;o.push([m*m*a[0]+2*m*t*c[0]+t*t*b[0], m*m*a[1]+2*m*t*c[1]+t*t*b[1]]);}return o;};
  const p4=[q4[0]-0.30*oc,q4[1]-0.10*oc], p5c=[q5[0]-0.45*oc,q5[1]], p6=[-0.45-0.42*oc,0.35], p7c=[-0.35-0.38*oc,0.95], p8=[-0.10-0.30*oc,1.35];
  const yol=[...qS(q2,q3,p4,8), ...qS(p4,p5c,p6,8).slice(1), ...qS(p6,p7c,p8,8).slice(1)];
  const fc=[0.35,0.35], N=yol.length-1;
  /* eng keng joyi YUZ balandligida (quloqdan jag'gacha, t~0.65) -- misol xaritasi:
     2-kadrda ichki soya y 45..80 (yuz), tepada kapyushon o'rta tonda. */
  const ichki=yol.map(([x,y],k)=>{const t=k/N, w=0.04+0.58*Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(t,1.6))),1.5);
    const dx=x-fc[0], dy=y-fc[1], l=Math.hypot(dx,dy)||1; return [x+w*dx/l, y+w*dy/l];});
  const ichD=`M ${yol.map(v=>U(...v)).join(' L ')} L ${ichki.slice().reverse().map(v=>U(...v)).join(' L ')} Z`;
  if(P.__kapDbg){ const nm=['q1','q2','q3','p4','p5c','p6','p7c','p8'];
   [q1,q2,q3,p4,p5c,p6,p7c,p8].forEach((v,i)=>{const [x,y]=K(v[0]*R,v[1]*R); P.__dbgL=(P.__dbgL||'')+`<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="#ff3b3b"/><text x="${f(x+4)}" y="${f(y-3)}" font-size="9" fill="#ffd166">${nm[i]}</text>`;}); }
  L.push(`<g clip-path="url(#${idp}kapOld)">`
   + `<path fill="#04051a" opacity="0.92" d="${ichD}"/>`
   + `<path fill="none" stroke="#1c1d3b" stroke-width="${f(0.16*R)}" stroke-linecap="round" stroke-linejoin="round" d="M ${yol.map(v=>U(...v)).join(' L ')}"/>`
   + `</g>`);
 }
 /* (Eski 8-qadam "kapyushonning oldingi chekkasi" olib tashlandi: -30..52
    gradusda boshning old-tepasini qoplardi, uning siyoh yoyi esa soch
    uchlarini toj qilib ko'rsatardi. Misolda old-tepa ochiq osmon.) */
 if(P.__dbgL) L.push(P.__dbgL);
 return L.join('\n');
}
