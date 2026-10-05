/* FILMLAR -- shotlar ro'yxati (film = ma'lumot). Har shot: tasvir soni, kamera, ushlangan
   tasvirlar, poza(i). Uzun film ham shu shaklda yoziladi: minglab tasvir emas, shotlar ro'yxati.

   misol22 -- misolning VAQTI va SAHNALASHTIRISHI (texnika; personaj, rasm -- bizniki). Qiymatlar
   2D loyihada (personaj/varaq.mjs) misoldan o'lchanganlar:
     3 shot: 11 + 2 + 9 tasvir, har biri 60 ms; kesishlar 11|12 va 13|14
     1-shot: 1..6-tasvir bitta rasm (qattiq nishonlar 0.1 px gacha bir xil); burilish ulushi
             [0,0,0,0,0,0,.03,.08,.15,.55,1] (10-11 da ikki tasvirlik tez burilish); tepaga qaraydi;
             roll -12 -> +4 gradus; ko'z 10-11 da yumiladi
     2-shot: profil, ko'z yumuq, eng tinch juftlik
     3-shot: yon (az 80, el -5); bosh egiladi, sekinlashib (u^0.55); ko'z yarim ochiq (0.45)
   Kamera personajning O'NG tomonida (ekranda o'ngga qaraydi). `ekran` va masofa YUZ nuqtalariga moslangan
   (test/fit_kamera.mjs -> test/kamera_fit.json): 1-shot yaqin ko'z + iyak (8.7 px), 2- va 3-shot yaqin ko'z;
   yuz o'lchovi (3-o'tish) uchun 1-shot yaqin ko'zga aniq surildi (x -8.6 px): zondlar misol ko'ziga bog'langan,
   iyak farqi -- yuz nisbati farqi (kamera emas);
   masshtab ko'z-iyak tik masofasidan. Avval yorug' massa (soch) bo'yicha moslangan edi -- yuz 1-shotda 45 px
   o'ngda, 2-shotda 1.6 barobar katta chiqqan (audit 2).
   3-shot el -12 da kadr tepaga qarab qor siyraklashardi (tepa tasmalar misolning yarmi) -- -5.
   5-O'TISH -- SAHNA AUDITI (misol qayerga qaraydi, kamera qayerda; bitta ko'rinish faqat bosh va kamera orasidagi NISBIY
   yo'nalishni beradi -- mutlaq qiymat "boshni burmasdan/yonga og'dirmasdan" tamoyili bilan tanlanadi):
     1-shot: kamera o'ng-oldda (az 55), sal pastda; bosh ~17 gr tepaga, ko'z ochiq, oldinga-o'ngga qaraydi (o'zgarmadi;
             el -30 bo'lsa bosh tekis, lekin 21 gr yonga og'ishi kerak -- test/sahna_fit.mjs --az 54,56).
     2-shot: profil (az 84), bosh TEKIS (egilish -0.08), ko'z yumuq; oldin -0.10 + pastki yuz surishi yuzni ~20 gr tepaga
             qaratgan edi (test/sahna2_fit.mjs: old kontur 21 qator + iyak osti, RMS 1.33 px).
     3-shot: kamera PASTDA (el -30), o'ng-oldda (az 55, 1-shot bilan bir tomon), yaqin; bosh 39 gr EGILGAN, burilmagan,
             yon og'maydi; ko'z yarim ochiq, pastga qaraydi (test/sahna3_fit.mjs: ko'z + iyak old cheti 7 qator + jag' osti,
             RMS 0.88 px). Oldin: kamera yonda (az 80, el -5), bosh atigi 9..17 gr -- "yonga qaraydi". */
/* kamera: {az, el, d, fov, ekran:[sx, sy], markaz} -- markaz (bosh markazi, dunyo) atrofida orbita:
     az -- personaj oldidan (+x) uning O'NG tomoniga (+z) qarab gradus (0 -- to'g'ri old, 90 -- o'ng profil);
     el -- gradus, musbat -- tepadan, manfiy -- pastdan; d -- masofa; ekran -- markaz kadrning qayerida
     turadi (ulush, chap-tepadan) -- linza siljishi (setViewOffset), ko'rish burchagi o'zgarmaydi.
   poza: egilish (+ -- bosh egiladi, - -- tepaga qaraydi), burilish (+ -- yuz kameradan uzoqlashadi, profilga;
     - -- kameraga), yonga (roll), yumuq (0 ochiq, 0.5 yarim, 1 yumuq), chokish (bosh pastga, birlik). */
/* KO'Z YOSHI (1-shot) -- har tasvir: A (ko'z ostidan tik iz), B (yonoq bo'ylab iz) -- bosh fazosida kesma a -> b,
   w -- yarim eni, k -- kuchi; C -- jag' chetida osilgan tomchi (halqa, 7..9; jag' chetida -- sirt chegarasi, taxminiy
   o'rin); tomchi -- tushayotgan tomchi (10, 11; dunyo fazosida, iyak chuqurligida). Qiymatlar test/yosh_olch.mjs
   (misolning L>70 komponentlari va yosh_jag zondi bosh/dunyo fazosiga o'tkazilgan). 9-o'tish: bitta bosh shakli va yangi
   pozalar bilan qayta o'tkazildi (C -- jag' chetida, qo'lda: teskari proyeksiya sirt chegarasida noaniq, 2.4..3.8 px).
   10-o'tish: jag' qayta moslangach A va B yana o'tkazildi (test/yosh_olch.mjs; oldingisi test/yosh_fit_dunyo9b.json). */
const YOSH1 = [
  {A: {a: [-0.45, -0.449], b: [-0.471, -0.549], w: 0.014, k: 0.9}},   // 1
  {A: {a: [-0.43, -0.415], b: [-0.461, -0.534], w: 0.014, k: 0.9}},   // 2
  {A: {a: [-0.395, -0.339], b: [-0.459, -0.518], w: 0.014, k: 0.9}},   // 3
  {A: {a: [-0.463, -0.465], b: [-0.474, -0.515], w: 0.014, k: 0.85}},   // 4
  {A: {a: [-0.472, -0.565], b: [-0.472, -0.611], w: 0.014, k: 0.7}, B: {a: [-0.346, -0.42], b: [-0.345, -0.513], w: 0.016, k: 0.9}},   // 5
  {A: {a: [-0.485, -0.623], b: [-0.481, -0.652], w: 0.014, k: 0.55}, B: {a: [-0.355, -0.439], b: [-0.356, -0.547], w: 0.016, k: 0.9}},   // 6
  {B: {a: [-0.367, -0.547], b: [-0.35, -0.681], w: 0.016, k: 0.9}, C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}},   // 7
  {B: {a: [-0.381, -0.607], b: [-0.352, -0.721], w: 0.016, k: 0.9}, C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}},   // 8
  {B: {a: [-0.404, -0.61], b: [-0.368, -0.738], w: 0.016, k: 0.9}, C: {p: [-0.23, -1.10], r: 0.028, k: 0.85}},   // 9
  {B: {a: [-0.521, -0.619], b: [-0.43, -0.8], w: 0.016, k: 0.9}, tomchi: [0.814, -1.338, -0.082]},   // 10
  {B: {a: [-0.497, -0.709], b: [-0.386, -0.884], w: 0.016, k: 0.9}, tomchi: [0.721, -1.815, -0.182]},   // 11
];
export const FILMLAR = {
  misol22: {
    ms: 60,
    shotlar: [
      /* 7-O'TISH -- KAPYUSHON SHOT BO'YICHA (kap: KIYIM.kap ustiga; main.js kapShotQoy -- shot almashganda sirt qayta
         quriladi, shot ichida o'zgarmas, boshga KF/KT ulushida ergashadi). Misolda kapyushon har shotda boshqacha yotadi
         (audit 7: ko'rinadigan bosh misolda 3 shotda 6300-7400/6600/4100-5700 px, bizda 11800-12900/4000/13500-14100). Moslash
         (test/fit_kapyushon7.mjs): misolning ko'rinadigan boshi (test/audit_misol/bosh_niqob.py, L>=40 -- yuz, soch, astar
         tasmasi) <-> rol renderi, IoU; 1- va 3-shotda figura (yopilish xaritasi) topshirilgan darajadan tushmasligi sharti.
         Natija (test/audit_misol/kap_olch.py, 960 -> 320): bosh IoU 0.41/0.49/0.23 -> 0.81/0.62/0.69, biz/misol maydoni
         1.75/0.61/3.03 -> 1.05/0.65/1.09, figura 0.900/0.864 -> 0.928/0.884. Astar tasmasi (tasmaA, tasmaV): misolda
         1-shotda yuz o'ngida ~14 px L 43-45 (40-95 qatorlar), jag' ostida L 7-10 -- tasma jag'da (v ~0.6) tugaydi. */
      {nom: '1-kadr', n: 11,
       /* 13-o'tish (5-ish): kamera va butun shot pozasi qo'shimchasi (egilish +0.0767, burilish -0.1135, yonga -0.0015) Alonurning
          belgilari (R03, R10: ko'zlar, burun, og'iz, iyak -- test/yuz13_s1.mjs) + butun kadr sinflari + figura bilan birga
          (test/fit_kamera_tuz.mjs --shot 1): yuz RMS 4.18 -> 2.94 px. Oldin: az 55, el -8, d 7.03, ekran [0.261, 0.310]. */
       kamera: {az: 55.654, el: -9.09, d: 6.9767, fov: 27, ekran: [0.2615, 0.2953], markaz: [0, 0, 0]},
       ushla: [0, 1, 2, 3, 4, 5],
       poza(i) {
         /* 4-o'tish: poza HAR TASVIRDA misolning yuz nuqtalariga moslandi (test/fit_poza1.mjs; bosh v3, kamera qat'iy):
            yaqin ko'z (langar), uzoq ko'z, og'iz, lab soyasi; 10-11 da yumuq ko'z chizig'i va og'iz. Oldingi g jadvali
            (0.23 .. 1.0, burilish amplitudasi 0.47) figura juft farqlaridan olingan edi -- yuzda 9-tasvirda yaqin ko'z
            9.5 px, og'iz 7.6 px o'ngga ketardi: misolda yuz 7-9 da deyarli burilmaydi (langar +0.8..+3.3 px), 10-11 da
            ko'z yumilib bosh burilib, yonga og'adi. Poza va profil birga (test/fit_poza1b.mjs; yonga qat'iy, yaqin ko'z
            vazni 3): nuqtalar RMS 7-11: 2.2 2.7 2.7 2.1 1.4 px, old kontur <= 3.5 px (10-tasvirda iyak oldi 5 px).
            yosh -- ko'z yoshi izlari (bosh fazosida, test/yosh_olch.mjs): YOSH jadvali. */
         /* 5-o'tish: 7..11 qayta moslandi (test/fit_poza1c.mjs) -- pastki yuz surishi endi profil vazniga bog'liq emas (surish),
            profil vazni faqat yaqin ko'z kartasini boshqaradi. Surish misol 7..11 rasmlarida old kontur ko'zdan uzoqroq
            chizilganidan (chet ko'zdan oldin keladi): 7-9 da 0.15 (kontur -2.8/-3.6/-1.9 -> -0.9/-1.8/-1.0 px), 10-11 da 0.3
            (iyak oldi -9.2 -> -4.8, -7.0 -> -1.6 px); ko'z kartasi 11 da 0.10. Nuqtalar RMS 2.0 2.5 2.5 2.1 1.9 px. */
         /* 9-o'tish: ko'z kartasi (profil) va pastki yuz surishi (surish) olib tashlandi -- bitta bosh (personaj.js BOSH);
            poza har kadrda shu boshga qayta moslandi (test/fit_bosh9.mjs; nuqtalar + old kontur qatorlari birga). */
         /* 10-o'tish: bosh barcha qismlar bilan qayta moslangach (test/fit_bosh10.mjs) pozalar ham: 1-6 [-0.300, -0.158],
            7 [-0.306, -0.129], 8 [-0.316, -0.101], 9 [-0.318, -0.055], 10 [-0.277, 0.137], 11 [-0.232, 0.214] edi */
         /* moslash har kadrga alohida qo'shimcha berdi (1-6 +0.018, 7-9 +0.012..+0.016, 10 +0.043, 11 +0.031 egilish), lekin 10
            va 11 niki bilan 9 -> 10 masshtab sakrashi qaytdi (1.005 -> 1.029: kapyushon rigi pozaga ergashadi). Butun 1-shotga
            bitta qo'shimcha (+0.0184, -0.0078) -- harakat 9-o'tishdagidek qoladi. */
         const T = [[-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0], [-0.2816, -0.1658, 0],
                    [-0.2876, -0.1368, -0.03], [-0.2976, -0.1088, -0.03], [-0.2996, -0.0628, -0.03], [-0.2586, 0.1292, 0.15], [-0.2136, 0.2062, 0.15]][i];
         return {egilish: T[0] + 0.0767, burilish: T[1] - 0.1135, yonga: T[2] - 0.0015, yumuq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1][i], yosh: YOSH1[i]};
       }},
      {nom: '2-kadr', n: 2,
       /* 8-o'tish: kamera MASSHTABI figura va ko'rinadigan boshdan (test/fit_kamera8.mjs): d 12.88 -> 10.32, ekran
          [0.411, 0.447] -> [0.422, 0.474]. 5-o'tishda d pastki yuz konturiga (burun..iyak, 21 qator) moslangan edi -- butun
          bosh va kapyushon misoldan kichik chiqdi: figura maydoni 0.407 (misol 0.509), ko'rinadigan bosh 4 300 px (misol
          6 620) -- 1-shotdan 2-shotga kesishda "kamera uzoqlashadi" (misolda figura 0.431 -> 0.509 o'sadi). Endi figura
          IoU 0.738 -> 0.887, bosh IoU 0.62 -> 0.75, bosh maydoni 1.04. Yuz shu masshtabda misolnikidan ~1.25 barobar katta
          (misolda profil yuzi boshiga nisbatan kichik chizilgan) -- yuz o'tishida. */
       /* 9-o'tish: kapyushon bilan birga moslangan (test/fit_kapPoza9.mjs): masofa va ekran -- figura massasi va ko'rinadigan
          bosh + yuz konturi (RMS 1.5 px dan oshsa jarima): d 10.32 -> 10.7994, ekran [0.3865, 0.4228] (yuz konturi RMS 2.17 px) */
       /* 11-O'TISH (Alonur belgilari, test/fit_poza11.mjs + test/fit_poza11b.mjs): 8/9-o'tishdagi masofa (12.88 -> 10.32 ->
          10.80) noto'g'ri "iyak"ka tortilgan edi -- detektor og'iz chizig'ini iyak deb olgan (24 px): misolda ko'z -> iyak 57 px,
          bizda 36. Yuz (inson belgilari: ko'zlar, burun, og'iz, iyak, jag', old kontur), ko'rinadigan bosh va figura BIRGA,
          kapyushon kaliti bilan: d 10.80 -> 7.39 (1-shotdagi 7.03 ga yaqin -- misolda kesishda masshtab deyarli o'zgarmaydi),
          yuz RMS 15.2 -> 2.5 px, bosh IoU 0.661 -> 0.750 (maydon nisbati 0.71 -> 1.01), figura 0.914 -> 0.923. */
       kamera: {az: 83.983, el: -3.052, d: 7.3931, fov: 27, ekran: [0.3315, 0.3924], markaz: [0, 0, 0]},
       /* 5-o'tish (sahna auditi): kamera va poza misolning OLD KONTURIGA (21 qator, y 70..110) va iyak ostiga moslandi,
          pastki yuz surishisiz, bosh burilmagan/og'magan (test/sahna2_fit.mjs --el -5 --yonS 0.01 --burS 0.02: RMS 1.33 px).
          Bosh TEKIS (-0.08, ~5 gr tepaga). Ko'z moslashga kirmaydi: profilda misol ko'zi bizning 3/4 o'rnimizdan 17.5 px
          orqada -- yaqin ko'z chizmasi karta bilan yon tomonga ko'chadi (profil 1, KOZ_PROFIL). Oldingi (4-o'tish):
          d 11.0, egilish -0.10 + to'liq surish -- kontur shunga moslangan, yuz ~20 gr tepaga qaragan edi. */
       /* 9-o'tish: bitta boshga qayta moslangan (test/fit_bosh9.mjs, kontur + iyak osti): egilish -0.081 -> -0.014; ko'z
          kartasi (profil 1) olib tashlandi -- profil ko'zi misoldan 17.4 px oldinda (d 12.7 da): misolning 2D usuli, qoldiq */
       /* 10-o'tish: bosh moslashi 2-shot pozasini -0.014 -> -0.0896 ga (burilish 0.008) surmoqchi edi (pastki yuz 4.78 ->
          3.26 px), lekin kapyushon rigi kaliti bilan birga surilganda 1-shot 10 -> 11 da masshtab sakrashi qaytdi (1.008 ->
          1.057: 2-shot kaliti 1-shot pozalariga yaqinlashib, 10-11 da ochiq kapyushonga og'irlik berdi). Poza, rig va 2-shot
          kamerasi BIRGA moslanadi (keyingi qadam) -- hozircha oldingi poza. */
       /* 11-o'tish: bosh kameraga 33 gr burilgan va 14 gr og'gan -- sof profil emas: misolda uzoq ko'zning kiprik uchi
          old konturda ko'rinadi (157, 82), yaqin ko'z konturdan 24 px orqada; bizda ko'z konturda edi (17 px oldinda) */
       poza(i) { return {egilish: -0.0646 + 0.004 * i, burilish: -0.5838, yonga: -0.2404, yumuq: 1}; }},
      /* 5-o'tish (sahna auditi): kamera PASTDA va o'ng-oldda, bosh CHUQUR egilgan -- misolda yuz 3/4 ko'rinadi (ko'z yuz
         sohasining tepa-o'rtasida, iyak ko'z ostida), kapyushon qirrasining OSTI (yorug' tasma) ko'rinadi. Tinch tasvirlar
         20-22: ko'z (qovoq chizig'i) + iyak old cheti (7 qator) + jag' osti; bosh burilmagan va og'magan (test/sahna3_fit.mjs
         --el -30 --az 55, zich silueta: RMS 0.88 px, egilish 0.68 = 39 gr; el -25..-35, az 55..60 da 39..43 gr). Oldingi:
         az 80, el -5, d 8.10, egilish 0.15..0.30 -- bosh profilda deyarli tik, "yonga qaraydi". */
      /* kap (7-o'tish): bosh 39 gr egilgan, kapyushon ramkasi KF ulushida atigi 14 gr -- bosh tepasi teshikdan oldinga
         chiqardi; misolda bosh kapyushon ICHIDA (faqat pastki yuz va old tutamlar ko'rinadi). Yuqori qism oldinga egiladi
         (eg), teshik uzoq tomonga buriladi (bur), astar tasmasi uzoq qirrada keng (misolda yuz o'ngida L 43-45) */
      {nom: '3-kadr', n: 9,
       /* 11-o'tish (Alonur belgilari): burun, og'iz, uzoq ko'z birinchi marta o'lchandi -- 9-14 px pastda-chapda edi; poza,
          kamera va kapyushon kaliti BIRGA (test/fit_poza11b.mjs): yuz RMS 14.0 -> 4.5 px. O'shandagi bosh IoU (0.656 -> 0.658)
          astarni "bosh" sanagan -- astar yetishmagan sochni to'ldirib, kapyushon misol yuzining 28 % ini yopgan edi; kalit
          qayta moslangach (personaj.js kapPoza izohi): astarsiz bosh IoU 0.551 -> 0.458, figura 0.885 -> 0.885, kapyushon
          misol yuzida 0.05 -> 0.14, bizning teri misolning qorong'isida 0.35 -> 0.11 (README 11-o'tish 2-ish) */
       kamera: {az: 54.729, el: -30.209, d: 8.1442, fov: 29, ekran: [0.3709, 0.4876], markaz: [0, 0, 0]},
       poza(i) {
         /* harakat (test/sahna3_harakat.mjs): misol ko'zi 15 -> 18 da atigi 5.5 px pastga, keyin joyida -- bosh 15-tasvirda
            allaqachon egilgan (yuz sohasi 15..22 deyarli bir xil); 14 -- harakatdagi oraliq rasm. Egilish 18 da oshib ketadi
            (0.70) va 0.68 ga tinchiydi; chokish/orqaga -- ko'z izidan yechilgan kichik siljish (ko'z qoldig'i <= 0.2 px).
            Yorug' soch massasining 32 px pastga tushishi (2.8 -> 1.0 %) asosan boshning tepasi kapyushon soyasiga kirishidan. */
         /* 9-o'tish: bitta boshga qayta moslangan tinch poza 0.68 -> 0.66 (test/fit_bosh9.mjs); butun jadval shuncha */
         /* 10-o'tish: bosh moslashi butun jadval egilishini -0.104 ga surmoqchi edi (iyak va jag' izi yaxshilanadi; misolda
            ko'z -> iyak 45 px, bizda 61 -- yuz uzunligi egilishga sezgir), lekin ko'z (sahna_olch: bir xil qoida) 1 -> 6 px
            ketdi. 3-shot pozasi va kamerasi (el) BIRGA, barcha qismlar va massa bilan qayta yechiladi -- hozircha oldingi poza. */
         /* 11-o'tish: 14-tasvir (harakat oralig'i) alohida -- butun jadval siljishi (+0.0425) 15-22 ga moslandi, 14 da yuz
            RMS 6.9 px (og'iz (4,-5.4), iyak (4.8,-5.9), jag' -8.0): bosh u yerda allaqachon ko'proq egilgan. Faqat egilish
            0.41 -> 0.53 (inson belgilari R14 + jag' izi, test/yuz11.mjs): RMS 3.2 px (og'iz 1.5, iyak 2.8, jag' -1.7). */
         const E = [[0.53, 0.005, -0.07], [0.60, 0.005, -0.07], [0.64, 0.015, -0.06], [0.66, 0.0, -0.05], [0.68, -0.01, -0.065],
                    [0.67, -0.005, -0.02], [0.66, -0.02, -0.02], [0.66, -0.02, -0.025], [0.66, -0.02, -0.02]][i];
         /* 11-o'tish: butun jadvalga egilish +0.0425, burilish 0.03 -> 0.1589, yonga -0.05 -> 0.1436 (2-shot kaliti yangilangach 3-shot yana bir bor, kapyushon kaliti bilan) */
         return {egilish: E[0] + 0.0425, burilish: 0.1589, yonga: 0.1436, yumuq: 0.5, chokish: E[1], orqaga: E[2]};
       }},
    ],
  },
  /* tekshiruv: 1-shot kamerasida bosh burilishi x egilishi to'ri (yuz yo'nalishini misol bilan solishtirish) */
  yuzTori: {
    ms: 60,
    shotlar: [[-0.15, -0.30], [0.10, -0.30], [0.35, -0.30], [-0.15, -0.55], [0.10, -0.55], [0.35, -0.55]].map(([b, e]) => ({
      nom: 'b' + b + 'e' + e, n: 1, kamera: {az: 55, el: -8, d: 7.03, fov: 27, ekran: [0.261, 0.310], markaz: [0, 0, 0]},
      poza() { return {egilish: e, burilish: b, yonga: 0, yumuq: 0}; }})),
  },
  /* tekshiruv (12-o'tish, tuzilish): MAKET -- butun bosh + kapyushon + yelka, uzoqroqdan, bir poza (?maketPoza=0|1|2 --
     tinch / 2-shot / 3-shot pozasi, standart tinch); oldi, 3/4, profil, orqa-yon, orqa, pastdan, tepadan */
  maket: {
    ms: 60,
    shotlar: [[0, 0], [45, 0], [90, 0], [135, 0], [180, 0], [45, -40], [60, 55]].map(([az, el]) => ({
      nom: 'az' + az + 'el' + el, n: 1, kamera: {az, el, d: 11, fov: 27, ekran: [0.5, 0.5], markaz: [0, -0.6, 0]},
      poza() { return {egilish: 0, burilish: 0, yonga: 0, yumuq: 0}; }})),
  },
  /* tekshiruv (12-o'tish, tuzilish): YAQIN MAKET -- bosh, soch va kapyushon yaqindan, 8 azimut + tepadan + pastdan
     (bosh fazosi: az 0 -- yuz oldi, 90 -- o'ng yon (kamera tomoni misolda), 180 -- orqa) */
  yaqinMaket: {
    ms: 60,
    shotlar: [[0, 0], [45, 0], [90, 0], [135, 0], [180, 0], [225, 0], [270, 0], [315, 0], [45, 60], [45, -40]].map(([az, el]) => ({
      nom: 'az' + az + 'el' + el, n: 1, kamera: {az, el, d: 6.2, fov: 27, ekran: [0.5, 0.5], markaz: [0, -0.15, 0]},
      poza() { return {egilish: 0, burilish: 0, yonga: 0, yumuq: 0}; }})),
  },
  /* tekshiruv: aylanma ko'rinish (har shot 1 tasvir) -- geometriyani har tomondan ko'rish uchun */
  aylana: {
    ms: 60,
    shotlar: [0, 35, 55, 84, 150].map(az => ({nom: 'az' + az, n: 1, kamera: {az, el: 0, d: 5.2, fov: 27, ekran: [0.5, 0.5], markaz: [0, -0.2, 0]},
      poza() { return {egilish: 0, burilish: 0, yonga: 0, yumuq: 0}; }})),
  },
};

/* 9-O'TISH TEKSHIRUVI -- 3D IZCHILLIK (test/kamera_sinov9.mjs). Foydalanuvchi: "kamera o'sha misol pozitsiyasiga
   kelganda 1:1 bo'lishi kerak ... 2D deb ishlov bersang kamera siljisa noto'g'ri joyi bo'lib qoladi". Poza va vaqt
   ushlangan (?vaqt=), faqat kamera yuradi: 3D izchil dunyoda obyekt fazosida hech narsa o'zgarmaydi -- faqat proyeksiya.
   kamYol: kamera misol22 ning 1 -> 2 -> 3 shot kameralari orasida uzluksiz (har oraliq 24 qadam). Shotga bog'liq qiymatlar
   (kap, kfIch, profil, surish) faqat misol kameralarida aniqlangan -- oraliqda eng yaqin kalitdan (kalit -- kesish yonidagi
   tasvir: 1-shot 11, 2-shot 12, 3-shot 14). orbita: bosh atrofida 360 gr (10 gr qadam), shu poza, 1-shot kapyushoni;
   profil berilmagan -- kod uni kamera burchagidan oladi (main.js profilVazn). kamRef -- qor qatlami va fon "tepasi"
   hisoblanadigan kamera (misol22 da 1-shot kamerasi). */
{
  const M22 = FILMLAR.misol22.shotlar, h11 = M22[0].poza(10);
  const USHLA = {egilish: h11.egilish, burilish: h11.burilish, yonga: h11.yonga, yumuq: h11.yumuq, yosh: h11.yosh};
  const KALIT = [[M22[0], h11], [M22[1], M22[1].poza(0)], [M22[2], M22[2].poza(0)]].map(([s, h]) =>
    ({kamera: s.kamera}));
  const L = (a, b, t) => a + (b - a) * t;
  const oraliq = (a, b, t) => ({az: L(a.az, b.az, t), el: L(a.el, b.el, t), d: L(a.d, b.d, t), fov: L(a.fov, b.fov, t),
    ekran: [0, 1].map(i => L(a.ekran[i], b.ekran[i], t)), markaz: [0, 1, 2].map(i => L(a.markaz[i], b.markaz[i], t))});
  const sinov = (nom, kamera) => ({nom, n: 1, kamera, poza() { return {...USHLA}; }});
  const yol = [];
  for (let seg = 0; seg < 2; seg++) for (let j = seg ? 1 : 0; j <= 24; j++) {
    const t = j / 24;
    yol.push(sinov(`yol${seg + 1}${seg + 2}_${j}`, oraliq(KALIT[seg].kamera, KALIT[seg + 1].kamera, t)));
  }
  FILMLAR.kamYol = {ms: 60, kamRef: M22[0].kamera, shotlar: yol};
  /* pozaYol (9-o'tish): KAMERA USHLANGAN (1-shot kamerasi), vaqt ushlangan, bosh pozasi uch shot pozasi orasida uzluksiz
     (1-shot tinch -> 2-shot -> 3-shot tinch, har oraliq 24 qadam) -- pozaga bog'liq kapyushon silliq o'zgaradimi (sakrashsiz) */
  const PZ = [M22[0].poza(0), M22[1].poza(0), M22[2].poza(6)].map(h => ({egilish: h.egilish, burilish: h.burilish, yonga: h.yonga || 0, chokish: h.chokish || 0, orqaga: h.orqaga || 0}));
  const pyol = [];
  for (let seg = 0; seg < 2; seg++) for (let j = seg ? 1 : 0; j <= 24; j++) {
    const t = j / 24, a = PZ[seg], b = PZ[seg + 1], h = Object.fromEntries(Object.keys(a).map(k => [k, L(a[k], b[k], t)]));
    pyol.push({nom: `poza${seg + 1}${seg + 2}_${j}`, n: 1, kamera: M22[0].kamera, poza() { return {...h, yumuq: 1}; }});
  }
  FILMLAR.pozaYol = {ms: 60, kamRef: M22[0].kamera, shotlar: pyol};
  FILMLAR.orbita = {ms: 60, kamRef: M22[0].kamera, shotlar: Array.from({length: 37}, (_, j) =>
    sinov('orb' + j * 10, {az: j * 10, el: -8, d: 7.03, fov: 27, ekran: [0.5, 0.5], markaz: [0, -0.1, 0]}))};
}

export function shotTop(film, f) {
  let a = 0;
  for (const s of film.shotlar) { if (f < a + s.n) return {s, i: f - a}; a += s.n; }
  const s = film.shotlar[film.shotlar.length - 1]; return {s, i: s.n - 1};
}
export const tasvirSoni = film => film.shotlar.reduce((a, s) => a + s.n, 0);
