/* ===== POZA VARAQASI -- TO'LIQ 1.32 SONIYA, UCHALA KADR =====

   Hamma raqam MAQSAD KLIPIDAN o'lchangan. Kesish nuqtalari kadrlararo
   farqning cho'qqisidan topildi (18.9 va 18.3, mediana 9.27) va detektor
   kesishsiz ketma-ketlikda hech narsa topmasligi bilan kalibrlandi.

     1-kadr  11 tasvir  0.66 s   TEZLANADI    farq 0.336 -> 0.384 (+14%)
     2-kadr   2 tasvir  0.12 s   ENG TINCH    farq 0.257 (klipdagi eng kichik)
     3-kadr   9 tasvir  0.54 s   SEKINLASHADI farq 0.348 -> 0.286 (-18%)
                                 va QORAYADI  yorqinlik 29.9 -> 27.4 (-8%)

   Tezlanish ko'z pilpillashidan EMAS: eng ko'p o'zgargan 10% piksel
   tashlansa tendensiya +14% dan +31% ga kuchayadi, ya'ni mahalliy portlash
   uni yashirayotgan edi. Sekinlashish ham qorayishdan emas -- kontrastga
   normallangandan keyin ham qoladi.

   Pastdagi TUGMA lar -- tanlanadigan qiymatlar. Ular o'ylab topilgan emas,
   bizning klipimizni MISOLGA QO'LLANGAN AYNAN O'SHA kod bilan o'lchab
   sozlanadi (test/ritm.mjs). */
import {ANDOZA} from './bosh.mjs';
import {readFileSync, existsSync} from 'fs';
/* IZ JADVALI (5-o'tish): har tasvir uchun bosh joyiga qo'shimcha [dx,dy] (px,
   540x304). test/iz-sozla.py topadi: chizadi, bosh (yorug' soha) izini misolga
   qo'llangan o'sha kod bilan o'lchaydi, qolgan farqni qo'shadi, takrorlaydi.
   Bu misolning CHIZMASI emas, VAQT va QADAMI (timing/spacing) -- texnika. */
/* 12-o'tish: 12..22 y -- soyabon sochga tegishi bo'yicha (test/kontakt-iz.py; yorug' soha markazi
   halqasi yangi kapyushon bilan boshni 19->20 da 27 px sakratdi), 18 dan keyin bosh ushlanadi;
   13-tasvir x -- misolda yorug' soha 12->13 da +0.6 px (bizda +2 edi). */
const IZ_F='/home/claude/work/personaj/izlar.json';
const IZ=existsSync(IZ_F)?JSON.parse(readFileSync(IZ_F,'utf8')):null;
const QR_F='/home/claude/work/personaj/qirra.json';
const QIRRA=existsSync(QR_F)?JSON.parse(readFileSync(QR_F,'utf8')):null;   // 3-kadr, 9 qiymat
/* 11-o'tish: 1-kadr sochi -- soch3 massasi har tasvirda test/soch3-fit.py misolning
   yorug' soch niqobiga moslagan (qutb qobig'i, 12 gradus); tishlar va siyoh bizniki. */
const S3_F='/home/claude/work/personaj/soch3-fit.json';
const SOCH3=existsSync(S3_F)?JSON.parse(readFileSync(S3_F,'utf8')):null;
/* 12-o'tish: 2- va 3-kadr kapyushoni -- yondan-pastdan (portret2 kap3Geo). Qirra, astar tasma,
   pona va o'ng-tepa burchak misoldan EKRANDA o'lchangan (test/kap3-olch.py -> kap3-ekran.json,
   kadr ichida [1,2,1]/4 silliqlangan). */
const KE_F='/home/claude/work/personaj/kap3-ekran.json';
const KEKR=existsSync(KE_F)?JSON.parse(readFileSync(KE_F,'utf8')):null;
const kap3=k=>(KEKR&&KEKR[String(k)])?{ekran:KEKR[String(k)]}:undefined;
/* uzoq yonoq ortidagi tasmada osmon tirqishi -- test/tasma-fit.py (tasma zondi soni) */
const TQ_F='/home/claude/work/personaj/tasma-fit.json';
const TASMA=existsSync(TQ_F)?JSON.parse(readFileSync(TQ_F,'utf8')):null;

export const TUGMA = {
 /* Bu qiymatlar TANLANGAN emas, O'LCHAB topilgan: test/sozla.mjs har birini
    o'zgartirib, kadrni chizib, misolga qo'llangan aynan o'sha kod bilan
    o'lchaydi va eng yaqinini saqlaydi. Xato 0.901 dan 0.109 ga tushdi. */
 p1: 3.20,   // 1-kadr tezlanish darajasi (>1 tezlanadi)
 a1: 1.90,   // 1-kadr harakat kattaligi
 p3: 0.55,   // 3-kadr sekinlashish darajasi (<1 sekinlashadi)
 a3: 1.00,   // 3-kadr harakat kattaligi (qayta sozlanadi)
 k12: 0.20,  // 1->2 kesish kattaligi
 k23: 0.20,  // 2->3 kesish kattaligi
 /* KESISH JOYLASHUVI. O'lchov aytdi: misolda kesish kadrlararo farqning
    1.97x i, bizda esa detektor uni umuman KO'RMADI. Sababi -- bizning
    "kesish" imiz kesish emas, kameraning turtkisi edi: R 10% va burchak 5
    gradus. Haqiqiy kesish KOMPOZITSIYANI almashtiradi, shuning uchun har
    kadrning o'z joylashuvi va masshtabi bor. */
 /* 5-o'tish: bosh plashsiz kadrni to'ldirish uchun KATTALASHTIRILGAN edi
    (R 58 -> 108). Endi qamrovni plash beradi, bosh o'z o'lchamiga qaytadi.
    Maqsad (yorug' soha): 1-kadr markaz (0.32,0.22), maydon 3.0%;
    2-kadr (0.45,0.31) 4.3%; 3-kadr (0.58,0.54) 1.7%. */
 j1:[176, 80,0.66],   // 6-o'tish: yuz nishonlari bo'yicha 10% kattaroq   // 1-kadr: cx, cy (540x304), masshtab
 J2:[240,122,0.72],   // 2-kadr: to'g'ridan-to'g'ri (aralashtirish emas)
 J3:[128, 84,0.86],   // (eski, endi ishlatilmaydi)
 /* 11-tasvir o'lchangan: misolda to'liq profil EMAS -- yumuq ko'z (113,54),
    silliq chet x~140 dan 28 px orqada, uzoq ko'z soch ostida. Soch massasiga
    nisbatan yaqin ko'z burilishda +11 px siljigan -> bizda du ~0.26R ->
    burilish ~0.28. Ko'z chizig'i oxirida deyarli gorizontal -> roll ~+4. */
 b1:[0.55,0.28],      // 1-kadr burilishi: 3/4 -> chuqur 3/4
 e1:[-12,4],          // 1-kadr roll: -12 (ko'z chizig'i qiya) -> +4
 e3:[-24,-40],        // 3-kadr egilishi: boshlanish -> oxir (gradus, - = pastga)
 j3y:[272,150,30,0.76],   // masshtab 0.92 edi: bosh misoldagidan katta, kapyushon cho'qqisi kadrdan chiqib ketardi// 3-kadr joyi: cx, cy boshi, cy o'sishi (px, 540x304 da), masshtab
 /* k12/k23 shu to'liq kattalikning qancha ulushi olinishini belgilaydi.
    1.00 da kesish o'lchovda 3.53x chiqdi, misolda esa 1.97x -- ya'ni
    kompozitsiya sakrashi kuchli edi. Qiymat o'lchab tanlangan. */
 qay: 2.0,   // titroq amplitudasi, px (540x304) -- test/qaynash-sozla.py bilan topilgan
 chayq: 0.14,// soch chayqalishi, R ulushida -- o'sha halqa
 yuzSoya: 0.03, // 3-kadrda yuzdagi kapyushon soyasi. 12-o'tish (yangi kapyushon) qayta o'lchandi: misol yuz sinfi (52..70) median L 59 har tasvirda (14..22); bizda 0.22 da L 49 (astar sinfiga tushardi), 0.08 da 56, 0 da 60 -> 0.03. Yuz sinfi IoU 0.19 -> 0.26 (0..0.14 da bir xil)
 qora0: 0.00,// 3-kadr boshidagi qorayish
 qora1: 0.00,// 3-kadr oxiridagi qorayish
};

const aral=(a,b,t)=>a+(b-a)*t;
const joy=(A,B,t)=>A.map((v,i)=>v+(B[i]-v)*t);
for(const k of ['p1','a1','p3','a3','k12','k23','qora0','qora1','qay','chayq','yuzSoya'])
 if(process.env[k.toUpperCase()]!==undefined) TUGMA[k]=+process.env[k.toUpperCase()];

/* --- 1-KADR: 11 tasvir. Holat u^p bo'yicha yuradi, ya'ni tezlik u^(p-1) --
   qadam qadamdan katta bo'ladi. Ko'z 9..11 da yumiladi (o'lchangan). --- */
function kadr1(T){
 /* 1-KADR, 6-o'tish: misolning voqeasi.
    1..6 tasvir: 3/4, tepaga qaraydi (ko'z chizig'i ~12 gradus soat yo'nalishida
    qiya -- roll -12). 6-tasvirda yaqin ko'z ostida ko'z yoshi paydo bo'lib,
    11-tasvirgacha yonoq bo'ylab oqadi. 7..11: bosh PROFILGA buriladi (misol
    bosh izida x 7-tasvirdan keyin tezlashadi), 9..11 da ko'z yumiladi.
    Profilda tepaga qarash tekislikdagi aylanishga aylanadi: roll +12.
    Eski 1-kadr (a1/p1 bilan egilish va R ning tezlanishi) burilishsiz edi --
    shuning uchun misoldagi +14% tezlanish bizda chiqmadi. */
 const N=11, o=[];
 for(let i=0;i<N;i++){
  const u=i/(N-1);
  /* burilish o'lchangan: misolda yaqin ko'z 1..9 tasvirda deyarli joyida
     ((95,46) (94,46) (97,45)), keyin 10 va 11 da SAKRAYDI ((105,51) (111,54)) --
     ikki tasvirlik tez burilish, oldidan ozgina tayyorgarlik. */
  const g_=[0,0,0,0,0,0,0.03,0.08,0.15,0.55,1.0], g=g_[i];
  o.push({...ANDOZA,
   burilish: T.b1[0] + (T.b1[1]-T.b1[0])*g,
   egilish: T.e1[0] + (T.e1[1]-T.e1[0])*g,
   qarash: 1,
   R: 108,
   kozOchiq: [1,1,1,1,1,1,1,1,0.9,0.08,0.04][i],     // misol: 9 da ochiq, 10-11 da yumuq
   __yosh: null,   // 9-o'tish: ko'z yoshlari endi O'LCHANGAN kadr jadvalidan (KOZ_YOSHLARI, film.mjs chizadi)
   __lab: [0,0,0,0,0,0,0,0,0,0.5,1][i],          // misol 11-tasvirda lablar ochiq
   /* (9-o'tish: soch kechikishi -- burilish tezligi bilan uchlarni orqaga surish --
      SINALDI va OLIB TASHLANDI: misolning bosh sohasi bloklari 10->11 da bosh
      BILAN (+2,+2) suriladi; kechikish bizda farqni 1.1 dan 2.2 px ga oshirdi.) */
   /* 9-o'tish: misolda 1..5-tasvir USHLAB TURILGAN rasm -- figura bloklarining
      median siljishi har juftda 0.00 px (6..11 da 1.4..3.2). Bizda soch
      doimiy chayqalgani uchun ushlangan tasvirlarda 1.0..2.6 px suzardi.
      Chayqalish faollik bilan: ushlanganda deyarli yo'q, burilish bilan to'liq. */
   __chayqK: [0.08,0.08,0.08,0.08,0.08,0.45,1,1,1,1,1][i],
   __soch3: (SOCH3&&SOCH3[String(i+1)])||null,
   __tasma: (TASMA&&TASMA[String(i+1)])||null,
   /* 10-o'tish: iyak ostidagi QORONG'I USTUN. Misolda x 112..124, y 118..177 da
      L 7..9 (1..8-tasvir), chap chegarasi x~109; bizda kapyushon tanasi (kapT,
      L 19) old cheti cx+0.63R ~ 120 gacha borib ustunni yopardi (+11 L). */
   __kapTOld: -0.29,
   __nom:'1-kadr', __joy:T.j1});
 }
 return o;
}

function kadr2(T){
 const b={...ANDOZA,
  egilish: -9 + 3.2 + T.k12*4.6,
  /* misolning 2-kadri: yuz deyarli profil, BITTA ko'z, u YUMUQ. Avval
     burilish 0.46 edi (>0.34 -> ikkinchi ko'z ham chiziladi) va ko'zlar ochiq. */
  burilish: 0.30,
  R: 108*(1 + T.k12*0.10),
  kozOchiq: 0.12, __nom:'2-kadr', __joy:T.J2,
  /* 7-o'tish: misolning 2-kadrida kapyushon boshni USTIDAN o'raydi (xaritada
     boshning tepasida kapyushon), teshik keng -- yon soch iyakkacha ko'rinadi.
     3-kadrdagi o'sha kapyushon modeli, teshigi keng. */
  kapOld:true, __ochiq:1, __qirra:-0.35, __yuzSoya:0, __kapOnX:-0.45, __kapPast:-0.80, __kapTOld:-0.70};
 return [{...b, __kap3:kap3(12)}, {...b, egilish:b.egilish+0.22, R:b.R*1.003, kozOchiq:0.12, __kap3:kap3(13)}];
}

/* --- 3-KADR: 9 tasvir. Yana kesish, yaqinroq plan. Harakat u^p (p<1) --
   birinchi qadam katta, oxirgisi kichik: polga tushib tinchiydi. --- */
function kadr3(T){
 /* 3-kadr, 3-o'tish: HAQIQIY boshqa burchak. Misoldan o'lchangan:
    yorug' personaj markazi (0.58, 0.54) -- 1-kadrda (0.32, 0.22);
    kadr ichida pastga cho'kadi: y 0.43 -> 0.55, sekinlashib.
    Bosh egilgan (pastga qaraydi), katta kapyushon oldinda (kapOld).
    Eski 3-kadr 1-kadrning deyarli o'zi edi -- kesish o'lchovi uni o'tkazib
    yuborgan, yonma-yon qarash ushlagan. */
 const N=9, o=[];
 for(let i=0;i<N;i++){
  const u=i/(N-1), s=Math.pow(u,T.p3);
  o.push({...ANDOZA,
   egilish: T.e3[0] + (T.e3[1]-T.e3[0])*s*T.a3,
   burilish: 0.26,
   R: 108,
   kozOchiq: 0.45,
   kapOld: true,
   __kapY: T.j3y[1] + T.j3y[2]*s*T.a3*0.33,        // gumbaz boshning cho'kishining 1/3 i bilan
   /* IKKILAMCHI HARAKAT (6-o'tish): soch boshga BIR TASVIR KECHIKIB javob beradi
      va tinchiydi. Misolning 3-kadrida bosh tezligi (px/tasvir, 320 da):
      7.2 9.3 10.0 6.7 5.5 1.1 2.3 1.7 -- juftlik farqi shu bilan silliq kamayadi
      (0.348 -> 0.286). Bizda chayqalish doimiy edi, farq tekis va shovqinli. */
   __chayqK: [0.72,0.72,0.93,1.0,0.67,0.55,0.11,0.23,0.17].map(v=>0.35+1.3*v)[i],
   __qirra: (QIRRA&&QIRRA[i]!==undefined)?QIRRA[i]:0,
   __yuzSoya: T.yuzSoya,
   __kap3: kap3(14+i),
   __nom:'3-kadr', __joy:[T.j3y[0], T.j3y[1] + T.j3y[2]*s*T.a3, T.j3y[3]]});
 }
 return o;
}

export function yig(T=TUGMA){
 const V=[...kadr1(T), ...kadr2(T), ...kadr3(T)].map((p,i)=>{
  const o=(IZ&&IZ[i])?IZ[i]:[0,0];
  const q={...p, __t:i, __chayq:T.chayq*(p.__chayqK??1), __qay:T.qay, __joy:[p.__joy[0]+o[0], p.__joy[1]+o[1], p.__joy[2]]};
  if(q.__kapY!==undefined) q.__kapY+=o[1]*0.33;      // kapyushon boshning 1/3 i bilan (misolda kam siljiydi)
  return q;});
 /* qorayish: 1- va 2-kadrda yo'q, 3-kadrda o'lchangan egri bo'yicha o'sadi */
 const Q=V.map((v,i)=>{
  if(i<13) return 0;
  const u=(i-13)/8;
  return aral(T.qora0, T.qora1, u);
 });
 return {V, Q};
}

const _=yig();
export const VARAQ=_.V;
export const QORA=_.Q;
export const MS=60;
/* PLASH -- figura xaritasidan (test/figura.py, aniq niqobga nisbatan IoU 0.82).
   Misolda figura HAR kadrda kadrning CHAP chetidan boshlanadi; bu o'ng
   chegara, 18 qator, kadr eni ulushida. Bosh qatorlarida film.mjs uni bosh
   markazidan o'tkazmaydi -- aks holda yuz oldida qorong'i dog' chiqadi. */
/* PLASH ICHKI TONLARI -- 1-kadrning o'rtacha tasviridan, 5x5 px xarita.
   Misol plashi deyarli yassi (L 23..27, 25-95 foizil) -- shaklni YORUG'
   burmalar emas, QORONG'I soyalar beradi (plashning 30% i L<18).
   Koordinatalar kadr ulushida. */
export const PLASH_TON = {
 '1-kadr':{asos:'#101128',                       // misol plashining medianasi (L 24)
  yorug:[[[0.03,0.17],[0.20,0.17],[0.22,0.33],[0.19,0.50],[0.08,0.55],[0.02,0.45]]],   // kapyushon yoni
  /* 6-o'tish: chapdagi ikki soya linza shaklida edi va plash ustida "suzib
     yurgan buyum" bo'lib ko'rindi. Burma -- yelkadan pastga cho'zilgan
     diagonal. (Joylari o'sha xaritadan: x 0..0.23, y 0.62..0.83.) */
  soya:[[[-0.03,0.70],[0.15,0.58],[0.21,0.60],[0.05,0.98],[-0.03,1.03]],
        [[0.19,0.62],[0.25,0.63],[0.17,0.93],[0.12,0.90]],
        [[0.30,0.63],[0.46,0.63],[0.47,1.02],[0.33,1.02],[0.29,0.80]]],               // old-past: katta soya
  gardish:0.20}};                                                                       // shu y gacha chetda och chiziq
/* 2- va 3-kadr tonlari (7-o'tish) -- misolning cho'zilgan xaritalaridan (o'rtacha
   tasvir, 5 px bloklar). Bu kadrlarda kapyushon plashni yopadi, shuning uchun
   ular portretdan KEYIN, (plash + kapyushon) klipi ichida chiziladi (ustda). */
PLASH_TON['2-kadr']={asos:'#101128', ustda:true, yorug:[],
  soya:[[[-0.02,-0.02],[0.12,-0.02],[0.07,0.30],[0.03,0.60],[-0.02,0.62]],   // chap orqa chet
        [[0.30,0.60],[0.37,0.62],[0.12,0.99],[0.03,0.99]],                   // diagonal burma
        [[0.30,0.74],[0.44,0.72],[0.46,0.99],[0.33,0.99]]], gardish:0};      // iyak osti
PLASH_TON['3-kadr']={asos:'#101128', ustda:true, yorug:[],
  soya:[[[-0.02,-0.02],[0.24,-0.02],[0.18,0.30],[0.09,0.55],[-0.02,0.58]],   // kapyushon orqasi, chuqur soya
        [[0.15,0.55],[0.20,0.56],[0.22,0.88],[0.17,0.90]],                   // vertikal burma
        [[0.30,0.90],[0.52,0.88],[0.54,1.02],[0.30,1.02]]], gardish:0};      // pastki
export const PLASH = {
 '1-kadr':[0.41,0.44,0.41,0.41,0.34,0.47,0.47,0.50,0.47,0.44,0.41,0.41,0.44,0.41,0.50,0.50,0.44,0.44],
 '2-kadr':[0.53,0.53,0.53,0.56,0.56,0.56,0.59,0.56,0.56,0.53,0.53,0.50,0.47,0.47,0.50,0.44,0.44,0.47],
 '3-kadr':[0.66,0.59,0.62,0.66,0.66,0.66,0.66,0.66,0.66,0.62,0.62,0.53,0.62,0.56,0.56,0.53,0.50,0.47]};
export const CHEGARA=[11,13];   // kesish nuqtalari (0 dan boshlab: 10|11, 12|13)
/* USHLASH (10-o'tish, taqqos harakat): misolda 1..6-tasvir BITTA rasm -- qattiq
   nishonlar 0.1 px gacha bir xil, yuz qutisida juft harakati 0.00 (1-2..4-5).
   Bizda har tasvir o'z titroq urug'i bilan chizilardi: harakat 0.25..0.50,
   qaynash 1.25..1.50. Ushlangan rasmda chiziq titramaydi. Urug'ni bitta qilish
   (0) yetmadi: 0-urug' maydoni 6 tasvirni BIR XIL suradi -- qattiq nishonlar
   0.7..1.1 px chetga, og'iz 1.2 px tepaga (bosh izi titroqsiz o'lchab sozlangan).
   Shuning uchun ushlangan tasvirlar titroqsiz -- izi sozlangan geometriyaning o'zi. */
export const USHLANGAN=[1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

/* ===== QO'L VA JAG'DAGI KO'Z YOSHI (9-o'tish, 1-kadr) =====
   Misolning figura xaritasidan (qor yopilishi, median5 L<26, tanaga bog'langan
   komponenta) har tasvirda o'lchangan, 320x180 px:
     1..6-tasvir: qo'l KO'TARILGAN -- yeng tanadan (134,151) bilakkacha
       (158,146), kaft/barmoqlar yuqori-o'ngga, uchi (173..175, 132..134);
     7: gorizontal, uchi (173,151); 9..11: bilak gorizontal (y ~157), kaft
       pastga OSILGAN, barmoqlar (158..172, 164..175).
   Ko'z yumilishi bilan qo'l tushadi -- misoldagi ikkilamchi harakat.
   Oldingi o'tishda "to'g'nog'ich" deb yozilgan halqa aslida IKKINCHI KO'Z
   YOSHI: 6-tasvirda jag' ostida yorug' tomchi (106,108), 7..9 da jag' bo'ylab
   osilib turgan halqa (112..117.5, 109..112.5), 10-11 da tushadi (123.5,133)
   (125.5,157). Halqa chizig'i L 50..80, ichi L 26..40, fon L ~8. */
/* 10-o'TISH: TANA CHETI + QO'L -- taqqos/siluet kadrma-kadr (L<20, median 5,
   tanaga ulangan niqob, ikkala tomonda bir xil kod). Topilgan (IoU 0.70):
     - iyak ostidan qo'lgacha misolda tana cheti TIK: x~131 (1..6), 134..146
       (7..11); bizniki PLASH ning 10 px qatorlaridan diagonal (113 -> 140);
     - qo'l ostida qo'ltiq botig'i (x~125), 1..4 da qo'l ostida osmon ko'rinadigan
       tirqish (y 158..166) -- oldin "yorug' manjet" deb o'qilgan, aslida fon;
     - qo'l: qalin bilak + yuqori-o'ngga panja (1..6), 7 da gorizontal, 8..11 da
       osilgan o'roq; ichi L 8 (bizniki 16), yorug' chet YO'Q (fon bilan L 40..60).
   test/qol-fit.py: PLASH_PAST -- har 3 px qatorda tananing o'ng cheti (chapdan
   qorong'i yugurish oxiri, <=6 px ichki tasma ko'prik); QOL -- bizning "til"
   modelimiz (asos B, yarim eni hB, uch T, tepa chet boshqaruvi U, past chet D),
   qoldiqqa moslangan. Model IoU (qutida): 1:0.89->0.92 2:0.89->0.94 3:0.88->0.95 4:0.86->0.95 5:0.77->0.92 6:0.75->0.94 7:0.85->0.91 8:0.80->0.88 9:0.77->0.89 10:0.75->0.84 11:0.78->0.86 */
export const PLASH_PAST=[
 [[112,122],[115,122],[118,131],[121,130],[124,130],[127,130],[130,132],[133,131],[136,129],[139,127],[142,126],[145,125],[148,160],[151,159],[154,157],[157,154],[160,133],[163,142],[166,151],[169,149],[172,145],[175,141],[178,140],[179,139]],
 [[112,123],[115,124],[118,129],[121,130],[124,131],[127,132],[130,133],[133,132],[136,130],[139,129],[142,127],[145,126],[148,161],[151,159],[154,158],[157,156],[160,150],[163,137],[166,145],[169,145],[172,142],[175,138],[178,139],[179,139]],
 [[112,125],[115,126],[118,132],[121,131],[124,131],[127,132],[130,133],[133,133],[136,132],[139,130],[142,128],[145,125],[148,159],[151,159],[154,158],[157,157],[160,153],[163,146],[166,141],[169,141],[172,140],[175,139],[178,139],[179,139]],
 [[112,122],[115,125],[118,126],[121,129],[124,131],[127,132],[130,133],[133,133],[136,132],[139,129],[142,128],[145,126],[148,132],[151,158],[154,159],[157,158],[160,155],[163,152],[166,138],[169,137],[172,138],[175,138],[178,139],[179,140]],
 [[118,127],[121,130],[124,132],[127,134],[130,134],[133,133],[136,132],[139,130],[142,128],[145,126],[148,125],[151,134],[154,139],[157,159],[160,158],[163,155],[166,151],[169,145],[172,138],[175,139],[178,140],[179,140]],
 [[118,123],[121,132],[124,133],[127,133],[130,133],[133,133],[136,131],[139,130],[142,128],[145,127],[148,126],[151,131],[154,134],[157,138],[160,159],[163,158],[166,155],[169,152],[172,142],[175,139],[178,139],[179,139]],
 [[112,129],[115,131],[118,134],[121,135],[124,135],[127,135],[130,135],[133,134],[136,132],[139,130],[142,128],[145,126],[148,128],[151,152],[154,154],[157,169],[160,167],[163,165],[166,159],[169,139],[172,139],[175,139],[178,140],[179,140]],
 [[112,130],[115,132],[118,134],[121,136],[124,136],[127,136],[130,136],[133,134],[136,132],[139,130],[142,128],[145,127],[148,148],[151,152],[154,153],[157,135],[160,138],[163,141],[166,164],[169,161],[172,140],[175,140],[178,140],[179,140]],
 [[112,133],[115,134],[118,137],[121,138],[124,139],[127,138],[130,137],[133,135],[136,133],[139,130],[142,128],[145,128],[148,154],[151,154],[154,132],[157,134],[160,137],[163,140],[166,142],[169,147],[172,166],[175,140],[178,140],[179,140]],
 [[112,138],[115,139],[118,140],[121,142],[124,141],[127,141],[130,140],[133,138],[136,135],[139,133],[142,131],[145,129],[148,130],[151,145],[154,148],[157,152],[160,134],[163,136],[166,139],[169,142],[172,164],[175,161],[178,136],[179,136]],
 [[115,144],[118,145],[121,146],[124,146],[127,145],[130,144],[133,142],[136,141],[139,138],[142,135],[145,131],[148,130],[151,131],[154,137],[157,142],[160,143],[163,147],[166,149],[169,139],[172,141],[175,159],[178,157],[179,156]]];
/* har kadrda tillar ro'yxati: 1..7 -- bitta (bilak+panja), 8..11 -- ikkinchisi
   bilak ostidagi O'ROQ (misolda tanadan pastda chiqib o'ngga-yuqoriga egilgan,
   bilak bilan orasida fon ko'rinadi) */
export const QOL=[
 [{B:[141,152.5],hB:7,T:[176,134.5],U:[163.5,131],D:[158,144.5]}],
 [{B:[150.5,152.5],hB:9,T:[176,131.5],U:[147,136.5],D:[148.5,141.5]}],
 [{B:[149,154.5],hB:9,T:[166,135.5],U:[154,130],D:[145.5,144]}],
 [{B:[150,159.5],hB:4.5,T:[171.5,135],U:[152.5,129],D:[157,135.5]}],
 [{B:[149,161.5],hB:6.5,T:[170.5,127],U:[147.5,157.5],D:[161.5,151.5]}],
 [{B:[134,169],hB:6.5,T:[170,130.5],U:[132,187],D:[162.5,164.5]}],
 [{B:[143.5,162],hB:5.5,T:[176,148],U:[156,160.5],D:[161.5,168.5]}],
 [{B:[140.5,153],hB:2.5,T:[149.5,162],U:[169.5,161.5],D:[157,165]},{B:[139.5,165.5],hB:2.5,T:[169,156],U:[162,176.5],D:[168.5,177.5]}],
 [{B:[134,150],hB:3.5,T:[157,152],U:[151.5,139],D:[181.5,165.5]},{B:[147,171.5],hB:5,T:[179,159],U:[135,185.5],D:[162.5,180.5]}],
 [{B:[142.5,157.5],hB:3.5,T:[153,158],U:[178.5,166.5],D:[159.5,169.5]},{B:[144.5,175],hB:5.5,T:[177.5,158.5],U:[158,176.5],D:[160,182]}],
 [{B:[142.5,178],hB:4,T:[153.5,175.5],U:[151.5,176],D:[140,208.5]},{B:[141.5,176.5],hB:2.5,T:[163,172],U:[145,177],D:[156.5,181.5]}]];
export const YOSH2=[null,null,null,null,null,
 null,   // 6-tasvir: endi 1-yoshning jag'ga yetgan uchi (KOZ_YOSHLARI)
 {c:[112,109.5],r:[3.8,4.5],t:'halqa'},
 {c:[116,110.5],r:[4.5,4.2],t:'halqa'},
 {c:[117.5,112.5],r:[3.5,3.5],t:'halqa'},
 {c:[123.5,133],r:[3.5,5.0],t:'halqa'},
 {c:[125.5,157],r:[3.5,4.0],t:'halqa'}];

/* ===== KO'Z YOSHLARI (9-o'tish, taqqos kadrma-kadr tekshiruvi) =====
   5 kadrlik namunada ko'rinmagan: misolda IKKITA ko'z yoshi va bitta qoldiq
   tomchi bor. Yuz ustidagi mayda yorug' dog'lar (L>82, 3..80 px, atrofi yuz)
   har kadrda topildi (320 px, markaz, eni x bo'yi):
     1-yosh: 3 (91.8,75) 2x3 -> 4 (96.6,85.4) 7x11 -> 5 (100.6,94.9) 7x11 ->
             6 (103.4,102) 10x21 jag'ga yetadi -> 7..9 jag'da osilgan halqa ->
             10..11 tushadi. Shakli: KATTA shaffof tomchi -- yorug' chet, ichi yuz
             tonidan salgina och, tepasi uchli, diagonal (yuqori-chapdan).
     qoldiq tomchi: 7 (100.8,89.2) 3x7 -> 8 (105.4,98.2) 2x3 -> 9 (108.5,100) 2x3
     2-yosh: 5 (103.9,62.7) 2x6 -> 6 (104.5,64.5) 2x4 -> 7 (107.3,70) 3x7 ->
             8 (108.2,73.2) 3x6 -> 9 (109.5,73.8) 3x8 -> 10 (112.9,84.5) 3x7 ->
             11 (116.7,90.3) 4x9. Shakli: ingichka yorug' IZ (tomchi-chiziq).
   Avvalgi bizning ko'z yoshi 6-tasvirda boshlanib ~7 px baland edi; 1-yosh
   umuman yo'q edi -- jag'dagi tomchi qayerdandir paydo bo'lardi. */
export const KOZ_YOSHLARI=[[],[],
 [{c:[91.8,75.0],w:2.5,h:4,t:'katta'}],
 [{c:[96.6,85.6],w:5.5,h:9.5,t:'katta'}],
 [{c:[100.4,94.6],w:5.8,h:10,t:'katta'},{c:[103.9,62.7],w:2,h:6,t:'iz'}],
 [{c:[103.4,101.5],w:5,h:10,t:'katta',iz:[97.5,88]},{c:[104.5,64.5],w:2,h:4.5,t:'iz'}],
 [{c:[100.8,89.2],w:2.5,h:6,t:'iz'},{c:[107.3,70.0],w:2.8,h:7,t:'iz'}],
 [{c:[105.4,98.2],w:2,h:3,t:'iz'},{c:[108.2,73.2],w:2.8,h:6,t:'iz'}],
 [{c:[108.5,100.0],w:2,h:3,t:'iz'},{c:[109.5,73.8],w:3,h:8,t:'iz'}],
 [{c:[112.9,84.5],w:3,h:7,t:'iz'}],
 [{c:[116.7,90.3],w:3.6,h:9,t:'iz'}]];

