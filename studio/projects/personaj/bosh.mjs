/* ===== BOSH QURILMASI =====
   Bosh qo'lda chizilmaydi -- parametrlardan QURILADI. Sababi amaliy: uchta
   urinishda "yuqoriga qarasin" degan talab har safar butun chizmani qaytadan
   chizishni talab qildi, va har safar boshqa xato kirdi. Endi egilish bitta
   son: parametrni o'zgartirasan, shakl o'zi ergashadi.

   Qurilish klassik: bosh suyagi = doira, jag' = undan osilgan xanjar, va
   BUTUN tuzilma birga buriladi. Yuz belgilari bosh koordinatasida
   joylashadi, shuning uchun ular ham birga buriladi -- ko'z chizig'ini
   alohida qiyalashtirish shart emas, u o'zi qiyalashadi. */
export const ANDOZA = {
 R: 46,          // bosh suyagi radiusi
 iyak: 1.48,        // profil shu bilan masshtablanadi     // iyak masofasi, R ulushida
 jagKeng: 0.66,  // jag' kengligi
 egilish: 0,     // gradus, + = yuqoriga
 burilish: 0.26, // 0 = to'liq profil, 1 = to'liq old
 kozChiz: 0.10,  // ko'z chizig'i, R ulushida (0 = doira markazi)
 burun: 0.45,
 ogiz: 0.70,
 quloq: [-0.86, 0.10],
};
const rad=d=>d*Math.PI/180;
export function qur(P, cx, cy){
 const {R,iyak,jagKeng,egilish,burilish,kozChiz,burun,ogiz,quloq}=P;
 const t=rad(-egilish);                       // SVG da y pastga o'sadi
 const co=Math.cos(t), si=Math.sin(t);
 /* ===== IKKI KALIT RASM VA ORALIQ (6-o'tish) =====
    Avval yuz PROFIL siluet sifatida qurilgan edi, burilish esa faqat x ni
    siqardi (0.52+0.48*b). Siqilgan profil hech qachon 3/4 yuzga aylanmaydi:
    burun baribir chetda turadi, uzoq ko'z chiqmaydi. Misolning 1-kadri 3/4
    dan boshlanib profilga buriladi -- ya'ni ikkala ko'rinish kerak.
    Animatsiyaning o'z usuli: ikki KALIT rasm (profil va 3/4) va ORALIQ
    rasmlar. Har nazorat nuqtasining ikkala kalitdagi qiymati bor; tb ularni
    aralashtiradi. Siqish endi yumshoq (0.84..1.0): burilishni geometriya
    tashiydi, bosh suyagi esa har tomondan doira. */
 const tb=Math.min(1,Math.max(0,(burilish-0.10)/0.45));   // 0 = profil, 1 = 3/4
 const sq=0.84+0.16*tb;
 const K=(x,y)=>{ const X=x*sq, Y=y; return [cx+X*co-Y*si, cy+X*si+Y*co]; };
 const f=(v)=>v.toFixed(1);
 const XY=([x,y])=>`${f(x)} ${f(y)}`;
 /* TEPAGA QARASH (P.qarash, 0..1): yuz belgilari yuqoriga suriladi, yuzning
    pastki qismi qisqaradi -- misolning 1-kadrida jag' osti ko'rinadi. */
 const q=P.qarash||0;
 const kz=kozChiz-0.06*q;
 /* Tepaga qarash 3/4 da -- bu ROLL emas, PITCH: jag' osti ko'rinadi, iyak
    oldinga chiqadi. Ko'z chizig'idan pastdagi nuqtalar chuqurligiga
    mutanosib OLDINGA suriladi (siljish). Ko'z chizig'i o'zi siljimaydi --
    pitch uning atrofida aylanadi. Profilda pitch tekislikdagi aylanishga
    aylanadi, uni egilish beradi. */
 /* siljish kuchi o'lchangan: 1-tasvirda misolning iyagi uzoq ko'z OSTIDA
    (x 125, 320 da); 0.14 da bizniki 107 da edi -- roll -12 uni orqaga
    tortadi. 3/4 da kuchli, profilda kuchsiz: profilda tepaga qarashni roll
    beradi, siljish uni ikki marta hisoblamasin. */
 const shear=q*(0.10+0.35*tb);
 const Kf=(x,y)=>K(x + shear*tbq(y), y);
 function tbq(y){ return Math.max(0, y/R - kz)/1.2*R; }
 const nuqta=(a)=>K(R*Math.cos(a*Math.PI/180), -R*Math.sin(a*Math.PI/180));
 const A_OLD=24, A_ORQA=198;
 const yoy=[];
 for(let k=0;k<=36;k++) yoy.push(nuqta(A_OLD + (A_ORQA-A_OLD)*k/36));
 /* 9-o'tish: pastki yuz O'LCHANGAN kalitlardan. 5x tekshiruv ko'rsatdi: bizning
    og'iz ko'zdan ~24 px, iyak ~47 px pastda edi; misolda 38 va 60 px (1, 6 va
    11-tasvirda bir xil). Ikki "tepaga qarash" qoidasi -- pastki yuzni 8% ga
    qisqartirish va iyakni ko'tarish (kot) -- O'YLAB TOPILGAN edi va misolga
    teskari: misolda tepaga qaragan yuzning pastki qismi UZUN, iyak oldi deyarli
    tik, jag' osti deyarli gorizontal. Ikkalasi olib tashlandi. */
 const sc=iyak/1.14;
 /* CHET KO'ZDAN OLDIN KELADI (overlapping action). Misolning 11-tasvirida
    chet allaqachon PROFIL (burun, ochiq lablar), yumuq ko'z esa hali yuz
    ichida chuqur (chetdan 29 px). Bitta tb buni bera olmaydi: chet uchun
    tbo = tb^1.8 (tezroq profilga), ko'zlar tb da qoladi. */
 const tbo=Math.pow(tb,1.8);
 const A=(pr,tq)=>[pr[0]+(tq[0]-pr[0])*tbo, pr[1]+(tq[1]-pr[1])*tbo];
 /* KALITLAR (9-o'tish): har nuqta [profil, 3/4], bosh birligida (y sc bilan
    ko'paytiriladi). Qiymatlar QO'LDA TANLANMAGAN: misolning 1-tasviri (3/4,
    tbo=1) va 11-tasviri (tbo=0.19) dagi nishonlar (L jadvalidan o'qilgan, 320
    px) qur() ning teskari o'girishi bilan bosh birligiga o'tkazildi
    (sinov/kalit-fit.mjs; qaytish xatosi 1e-13 px). Profil kaliti 11-tasvirdan
    ekstrapolyatsiya -- tb=0 hech qayerda chizilmaydi.
    Misoldagi shakl: uzoq ko'z chetda turadi, uning ortida chakka KESIK
    (kapyushon tasmasi ko'rinadi); yonoqdan pastga chet deyarli tik, burun
    uchi chetda 1.5 px do'mboq; og'iz burchagi chetga tegadi; iyak oldi tik,
    pastki burchak o'tkir; jag' osti gorizontal, keyin quloqqa ko'tariladi. */
 const KAL={
  c_OLD   :[[0.955,-0.21],[0.717,-0.322]],
  PESHONA :[[0.931,-0.082],[0.628,-0.205]],
  c_PI    :[[0.917,0.044],[0.647,-0.068]],
  ILDIZ   :[[0.867,0.166],[0.672,0.042]],
  c_IB    :[[0.918,0.239],[0.748,0.138]],
  BURUN_T :[[1.077,0.285],[0.864,0.165]],
  BURUN_O :[[1.022,0.477],[0.837,0.454]],
  c_OU    :[[0.996,0.558],[0.815,0.511]],
  LAB_U   :[[0.973,0.633],[0.767,0.553]],
  c_UO    :[[0.952,0.687],[0.756,0.573]],
  OGIZ_   :[[0.924,0.747],[0.749,0.595]],
  c_OP    :[[0.895,0.785],[0.748,0.619]],
  LAB_P   :[[0.856,0.823],[0.731,0.655]],
  c_PI2   :[[0.798,0.882],[0.718,0.74]],
  IYAK_O  :[[0.75,0.973],[0.697,0.829]],
  c_II    :[[0.707,1.089],[0.675,0.946]],
  IY      :[[0.672,1.157],[0.642,1.008]],
  c_IJ    :[[-0.22,1.13],[-0.133,1.197]],
  JAG     :[[-0.733,0.781],[-0.423,0.964]],
  /* 10-o'tish (taqqos, har tasvir): og'izning ustki chizig'i misolda x 122..128,
     bizda 119..128 -- o'ng uchi to'g'ri, CHAP uchi 3 px uzun (og'iz zondi -1.7 px
     shu sababdan). 3/4 kalitda chap uch ekranda +3 px: bosh birligida +0.091, -0.015
     (+0.070 da 2 px surildi -- chiziq uchi yumshoq) */
  OG_L    :[[0.564,0.686],[0.555,0.606]],
  OG_M    :[[0.745,0.700],[0.583,0.585]],
  OG_R    :[[0.914,0.709],[0.706,0.549]],
  LS_1    :[[0.721,0.779],[0.674,0.658]],
  /* 9-o'tish (taqqos, 10x ustma-ust, 1..11-tasvir): og'iz va pastki lab soyasi
     misolda ~2.2 px YUQORIDA edi -- ikkala kalitda y -0.040 */
  LS_2    :[[0.65,0.774],[0.597,0.701]],
 };
 const p_=(n)=>{const [x,y]=A(...KAL[n]); return Kf(x*R, y*sc*R);};
 const N={}; for(const n in KAL) N[n]=p_(n);
 const QU=K(quloq[0]*R, quloq[1]*R);
 const OLD=nuqta(A_OLD), ORQA=nuqta(A_ORQA);
 const PESH=nuqta(52), TEPA=nuqta(96);
 const orqaC=(()=>{const [x,y]=A([-0.90,0.52],[-0.62,0.28]); return K(x*R,y*R);})();
 const Qs=(c,e)=>` Q ${XY(N[c])} ${XY(N[e])}`;
 const siluet = `M ${XY(OLD)}` + Qs('c_OLD','PESHONA') + Qs('c_PI','ILDIZ') + Qs('c_IB','BURUN_T')
   + ` L ${XY(N.BURUN_O)}` + Qs('c_OU','LAB_U') + Qs('c_UO','OGIZ_') + Qs('c_OP','LAB_P')
   + Qs('c_PI2','IYAK_O') + Qs('c_II','IY') + Qs('c_IJ','JAG')
   + ` Q ${XY(orqaC)} ${XY(ORQA)}`
   + yoy.slice(1).reverse().map(v=>` L ${XY(v)}`).join('') + ' Z';
 /* belgilar: ikkala kalitdagi joyi (bosh birligida) */
 const L_=(a,b)=>a+(b-a)*tb;
 /* ko'z o'lchami O'LCHANGAN: misolda yaqin ko'z eni / yuz eni (ko'z chizig'ida)
    = 8/52 = 0.15; bizda 0.30 edi -- ikki barobar katta, "multfilm" ko'z. */
 /* 3/4 kalitda joylashuv misoldan: ko'z qatori bo'ylab
      yaqin tutam -> yaqin ko'z : ko'z -> ko'z : uzoq ko'z -> chet = 0.29 : 0.44 : 0.27
    (15 / 23 / 14 px). Bizda 0.35 : 0.38 : 0.26 edi -- ko'zlar bir-biriga
    yaqin, yaqin ko'z tutamdan uzoq. Ko'z eni = shu qatorning 0.15 i -> KS 0.55. */
 const KS=0.66;   // 8-o'tish: misol yaqin ko'zi ~9.5 px eni (qanotsiz), bizniki 8.4 edi
 const kozlar=[{u:L_(0.46,0.04), s:KS*L_(0.92,1.00), sx:1, id:'y', ko:1}];
 /* 9-o'tish: uzoq ko'z misolda ~6-7 px eni (x 116..122, 1-tasvir); sx 0.80 da
    bizniki ~11 px edi. */
 if(tb>0.2) kozlar.push({u:L_(0.97,0.60), s:KS*0.86, sx:L_(0.25,0.55), id:'u', ko:Math.min(1,(tb-0.2)/0.35)});
 return {
  siluet, tb, tbo, sq, sc, kz,
  iyak:N.IY, jag:N.JAG, quloq:QU, old:OLD, peshona:PESH, tepa:TEPA, orqa:ORQA,
  kozlar,
  /* og'iz va pastki lab soyasi -- EKRAN nuqtalari (kalitdan) */
  ogiz:[N.OG_L, N.OG_M, N.OG_R], labSoya:[N.LS_1, N.LS_2],
  /* ORQA YORUG'LIK CHIZIG'I: kesikdan (uzoq ko'z ortidan) iyakkacha va jag' */
  chetYol: `M ${XY(N.ILDIZ)}` + Qs('c_IB','BURUN_T') + ` L ${XY(N.BURUN_O)}` + Qs('c_OU','LAB_U')
    + Qs('c_UO','OGIZ_') + Qs('c_OP','LAB_P') + Qs('c_PI2','IYAK_O') + Qs('c_II','IY'),
  jagYol: `M ${XY(N.IY)}` + Qs('c_IJ','JAG'),
  /* kapyushon tasmasi uchun: chetning yuqoridan pastga nuqtalari */
  chet:[N.PESHONA, N.ILDIZ, N.BURUN_T, N.BURUN_O, N.OGIZ_, N.IYAK_O, N.IY],
  nuqtalar:{BURUN_T:N.BURUN_T, ILDIZ:N.ILDIZ, IY:N.IY, JAG:N.JAG},
  K, Kf,
 };
}
