# Usul: misolga o'lchov bilan yetish

Bu hujjat — kod bilan chizilgan animatsiyani namuna klipga (misolga) yaqinlashtirish
paytida **nima ishlatilgani, qanday o'lchangani va nimaga ahamiyat berilgani**.
Har qoida ortida shu ishda topilgan aniq holat va raqam bor; raqamsiz qoida
yozilmagan. Asboblarning o'zi va buyruqlar — [`README.md`](README.md).

Manba ish: bitta anime klipning 1-kadri (11 tasvir, 320×180), 8..10-o'tishlar.

---

## 0. Nima o'lchanadi, nima olinmaydi

Misoldan **texnika** o'lchanadi: vaqt (ushlash, ritm, kesish), joylashuv, harakat,
ton, shakl massasi. Misolning personaji va rasmi takrorlanmaydi. Shakl **bizning
modelimizdan** chiziladi va o'lchovga *moslanadi* — misol kuzatib chizilmaydi
(9-qoida).

Har tafsilot **o'lchangan yoki sanalgan** bo'ladi, o'ylab topilmaydi. 9-o'tishda
ikkita "tepaga qarash" qoidasi — pastki yuzni 8% qisqartirish va iyakni ko'tarish —
o'ylab topilgan va misolga TESKARI chiqdi: misolda og'iz ko'zdan 38 px, iyak 60 px
pastda; bizda 24 va 47 edi. Ikkalasi olib tashlandi, o'rniga o'lchangan kalitlar
keldi.

## 1. Ikki tomonda bir xil kod

Ikkala tomon bir o'lchamga (320×180, LANCZOS, keyin L), bir funksiya, bir chegara,
bir filtrdan o'tadi. Farq faqat kiruvchi tasvirda bo'lishi kerak.

**Bu model moslashga ham tegishli.** 10-o'tishda qo'l siluetini moslashda misol
niqobi median 5 dan o'tgan edi, bizning modelimiz esa o'tmagan. Median ingichka
uchni qisqartiradi — moslash uchni misolning *allaqachon qisqargan* uchiga qo'ydi,
va chizilgan qo'l uchi 3..13 px kalta chiqdi (zond buzilmagan tasvirlarda). Model
niqobini ham median 5 dan o'tkazib qayta moslangach — −1..−4 px.

**O'lchovni titroqsiz renderda qiling**, keyin oddiy renderda tekshiring.
9-o'tishda ko'z izi halqasi bizning titrog'imizni (qaynash, chayqalish) o'lchab,
uni izga qaytarib qo'shdi: qaynash 1.96 dan 2.34 px gacha ko'tarildi, halqa
titroqsiz renderni o'lchaydigan bo'lguncha.

## 2. Avval kalibrlash

Har asbob javobi ma'lum sintetik tasvirda sinaladi: yaxshi holat va ataylab
buzilgan holat. Ajrata olmasa — `UNPROVEN`, va undan chiqqan son o'lchov emas
(`python3 -m taqqos kalibr`).

Sinovning o'zi ham noto'g'ri bo'lishi mumkin. 9-o'tishda ikkita sinov yiqildi,
lekin xato o'lchovda emas edi: (a) yoyish sinovidagi kichik to'rtburchakda chet
kataklarining ulushi IoU ni 0.90 da ushlab qolardi; (b) ustma-ust sinovida
sintetik tasvirda mumkin bo'lgan eng katta rang farqi 50 edi, sinov esa undan
ko'pini kutgan. Sinov adolatli qilindi, o'lchovga tegilmadi.

## 3. Har tasvir, har belgi — namuna emas

5 ta namunaviy tasvir yetmaydi. 10-o'tishda faqat hamma 11 tasvirning jadvali
ko'rsatgan narsalar:

- 2..6-tasvirda plash soyalari kesilmasdan chizilgan (1-tasvirda yo'q — namuna
  sifatida 1-tasvir olinsa, hech qachon topilmasdi; 10-qoida);
- 1..4 da qo'l ostidagi tirqish, 8..11 da bilak ostidagi alohida o'roq;
- 1..6 ushlangan rasm, 7..11 harakatli.

Tartib: jadval (`zond`, `siluet`) → eng katta farqlar → shu joyning varaqasi.

## 4. Langar: shakli o'zgarmaydigan nishon

9-o'tishda bosh izi yaqin ko'zning qorong'i komponentasiga bog'langan edi.
Misolda 1..6-tasvirda ko'z komponentasi 97.6 → 95.4 ga suriladi (soch tutami
ko'zdan sirg'anadi, yosh yig'iladi), qattiq nishonlar esa — uzoq chet 130.3,
iyak oldi 129.6, jag' osti 109.7 — **0.1 px gacha bir xil**. Ko'zga bog'langan iz
boshni shu shakl o'zgarishiga ergashtirib, pastki yuzni 2..4 px surgan.

Endi iz: dx = uzoq chet va iyak oldi farqlari medianasi, dy = jag' osti farqlari
medianasi; titroqsiz render; ushlangan tasvirlar bitta joyda. Natija: qattiq
nishonlar 1..6 da 0.0 px.

## 5. Ushlangan tasvirlar

**Aniqlash:** qattiq nishonlar 0.1 px gacha bir xil va yuz sohasida juft blok
siljishining medianasi 0.00 (`harakat`).

**Ushlangan rasm titramaydi.** Bizda har tasvir o'z titroq urug'i bilan chizilardi:
topshirilgan 9-o'tishda ushlangan juftlarda (yuz qutisi 72,22,140,112) harakat
0.00..1.12, qaynash 1.12..1.80 (misolda harakat 0.00). Birinchi
urinish — bitta urug' — yetmadi: bitta urug'ning siljish maydoni oltita tasvirni
BIR XIL suradi: qattiq nishonlar 0.7..1.1 px chetga (titroqsiz 0.0), og'iz 1.2 px
tepaga — oltitasida bir xil (iz titroqsiz sozlangan). Ushlangan tasvirlar
titroqsiz qilindi.

**Lekin ushlangan rasmda ham narsa qimirlashi mumkin.** Farq xaritasi (`xarita`)
ko'rsatdi: misolning o'sha ushlangan juftlarida soch tutamlarining chetlari har
tasvirda o'zgaradi — kadrning chap 40% i (soch, yuz, tana; xaritada o'zgarish
sochda) energiyasi 0.067..0.095, bizda 0.009..0.017. Blok
siljishining MEDIANASI buni ko'rmaydi: soch — bloklarning ozchiligi. Median 0.00
"qattiq qismlar turibdi" degani, "hech narsa qimirlamaydi" emas.

## 6. Raqamdan keyin varaq (Goodhart)

Raqam to'g'ri, sababi noto'g'ri bo'lishi mumkin.

- 9-o'tish: soch kechikishi tasvirlararo farq o'lchovini oshirdi (0.347 → 0.351),
  lekin misolning bosh bloklari 10→11 da bosh BILAN (+2,+2) suriladi — kechikish
  harakat farqini 1.1 dan 2.2 px ga oshirdi. Olib tashlandi.
- 10-o'tish: 1-kadr tezlanishi (tendensiya) topshirilgan 9-o'tishda +14.6% edi,
  misol +14.3% — deyarli aniq. Yuz titrog'i olib tashlangach +39.4% bo'ldi. Sabab: ushlangan juftlardagi
  yuz titrog'i misoldagi soch qimirlashining o'rnini bosib turgan edi. Raqam
  yomonlashdi, haqiqat ochildi; tuzatish sochda.
- Ikki nuqtali tendensiya (birinchi va oxirgi juft) mo'rt: har juftning farqini
  va juftlar MAE ni ham chiqaring. 9-o'tishda MAE 0.043 → 0.029 yaxshilanganda
  tendensiya +17.7% → +7.7% ga "yomonlashgan".

## 7. Zond xatosi — chizma xatosi emas

Har katta farqni varaqda tekshiring: **zond nimaga tegdi?** Ko'pincha u boshqa
narsaga tegadi, va jadvaldagi farq chizmaning emas, zondning xatosi bo'ladi.

| zond | nimaga tegdi | tuzatish |
|---|---|---|
| og'iz (9b) | lab soyasini qo'shib olardi | lab soyasi alohida quti |
| uzoq ko'z (9b) | L<30 da tepadagi chakka yo'li bilan qo'shilib markazni 3 px yuqoriga tortardi | kamalak o'zagi, chegara 22 |
| qo'l uchi (10) | L<26 da niqob misolning 2,3,8-tasvirida L 17..30 li osmonga oqdi — "uch" quti chetida (198,118) | chegara 20, bog' tananing eng qorong'i joyida |
| yonoqdagi yosh (10) | "eng yorug'" — ko'z osti qovog'i va yaqin soch tutamining yorug' cheti (7×36) | quti tutam va ko'zdan chetga |
| jag'dagi yosh (10) | fondagi qor zarrasi (L 150) halqa yaltirog'idan yorug' | tor quti |
| og'iz (10) | titroq olib tashlangach 1..6 da tizimli −1.7..−2.0 px "og'iz chapda" — aslida chiziqning chap uchi 3 px uzun, o'ng uchi to'g'ri | faqat chap uch kaliti |

Oxirgisi muhim: markaz farqi SHAKL farqidan ham chiqadi. Komponentani ro'yxat
qiling (chekkalari, markazi) va qaysi uchi farq qilayotganini ko'ring.

Zond tuzatilsa, sababi sozlamada qoladi (`"izoh"`), aks holda keyingi kishi uni
qaytarib buzadi.

## 8. Noto'g'ri o'qish — raqam bilan tekshiring

Kattalashtirilgan qorong'i tasvirda ko'z tez aldanadi:

- 9-o'tish: jag' yonidagi halqa "to'g'nog'ich" deb o'qildi — aslida ikkinchi ko'z
  yoshi (6-tasvirda jag' ostida tomchi, 7..9 da osilgan halqa, 10..11 da tushadi).
- 10-o'tish: qo'l ostidagi yorug' chiziq 9-o'tishda "yorug' manjet" deb o'qilgan
  edi. L jadvali: 40..60, qor foni ham 46..60 — bu qo'l bilan pastki tana orasidagi
  TIRQISHdan ko'ringan fon.
- 10-o'tish: uzoq yonoq ortidagi "tasma" — osilgan soch tutamlari; 7..9 da orasidan
  osmon ko'rinadi (tasma zondi +10..28%).

Qoida: yorug'likni fon bilan raqamda solishtiring. Fon bilan bir xil bo'lsa — bu
teshik yoki tirqish, detal emas.

## 9. Kuzatma — modelni moslang

Misol konturini nuqtama-nuqta ko'chirish — kuzatib chizish. Buning o'rniga bizning
parametrli modelimiz o'lchovga moslanadi (`test/qol-fit.py` usuli):

- **Tana cheti:** har qatorda chapdan boshlangan qorong'i yugurishning oxiri
  (≤6 px ichki yorug' tasma ko'prik bilan o'tiladi), 3 qatorlik median, har 3 px
  da kalit. Chizmada kalitlar orasi chiziqli — moslashda ham xuddi shunday.
- **Qo'l:** "til" modeli — asos B, yarim eni hB, uch T, tepa chet boshqaruvi U,
  past chet boshqaruvi D (ikki kvadratik egri). 1..7-tasvirda bitta, 8..11 da
  ikkita (bilak + o'roq).
- **Moslash:** yumshoq niqob (4× supersampling, maydon ulushi), IoU, Nelder–Mead,
  bir necha boshlanish + tasodifiy siljitib qayta; jarimalar: chetlar kesishmaydi
  (tepa boshqaruvi past boshqaruvidan normal bo'yicha yuqorida — aks holda SVG
  nonzero bilan PIL boshqacha to'ldiradi), uch kadr ichida, asos tanada.
- **Moslangandan keyin haqiqiy render o'lchanadi**, model emas (model moslash
  qutisida IoU 0.84..0.95; render, siluet qutisida, titroqsiz 0.84..0.91).

Natija (topshirilgan 9-o'tishga nisbatan, ikkala tomon bir xil GIF yo'lidan):
figura siluet IoU 0.71 → 0.87, figura xaritasi IoU 0.89 → 0.95 (10-o'tish PNG da
0.871, titroqsiz 0.881).

## 10. Kod tuzilishi xatolari o'lchovda chiqadi

10-o'tishda siluet o'lchovi 2..6-tasvirda iyak ostida yumaloq "D" bo'rtiq
ko'rsatdi. Sabab: 22 tasvir bitta HTML hujjatda, har biri o'z `<svg>` ida; plash
klip id si bosh markazidan (`pl`+cx+cy) yasalgan, 1..6 da markaz bir xil → oltita
bir xil id. `url(#id)` hujjatdagi BIRINCHI elementga bog'lanadi; u yashirin
(`display:none`) svg ichida bo'lgani uchun ko'rinadigan tasvirda klip tashlab
yuboriladi va soyalar plashdan tashqariga chiqadi. id markazning butun qismidan
yasalgani uchun yaqin turgan ikki tasvirda ham to'qnashardi (9-o'tishning oldingi
izida 3- va 4-tasvir: ikkalasi `pl156_76`); ushlangan tasvirlar bitta joyga
qo'yilgach, oltitasi bir xil bo'ldi. Ko'zga tashlanmagan: eski diagonal chet
soyalarni o'z ichiga olib turgan.

Tekshiruv: qurilgan hujjatda takrorlangan id soni 0 bo'lishi kerak.

```bash
grep -o ' id="[^"]*"' film.html | sort | uniq -d
```

## 11. "Oldin" — topshirilgan faylning o'zi

Eski manbalarni qayta render qilish "oldin"ni bermaydi: render keyin o'zgargan
fayllarni ham o'qiydi (masalan bosh izi `izlar.json` mutlaq yo'l bilan o'qiladi).
10-o'tishdagi `ff-9` papkasi shunday qayta render edi va 10-o'tishning bosh
joylashuvini olib yurgan: yaqin ko'z langari x farqi ff-9 da 2.11, hozir 2.18,
topshirilgan 9-o'tish GIF ida 1.01. 12..22-tasvirlar topshirilgan fayl bilan GIF
shovqini darajasida bir xil (o'rtacha farq 0.02..0.15), 1..11 da 1.4..2.7 farq
qiladi; tendensiya ff-9 da +19.9%, topshirilganda +14.6%. Natijada oldin/keyin
jadvali bosh joylashuvi o'zgarishini yashirgan va ikki xil "oldin"ni aralashtirgan.

Qoida: "oldin" — foydalanuvchiga topshirilgan faylning o'zi (bu yerda `ff-9t/` —
`kadr-toliq.gif` tasvirlari). U GIF bo'lsa, "keyin"ni ham xuddi shu yo'ldan
o'tkazing (`ff-10t/`): bu yo'l siluet IoU ni 0.001, tendensiyani 0.2 punkt, og'iz
zondini 0.4 px gacha suradi.

## 12. Soch: yuz ushlangan, soch tirik

**Asbob.** Yorug' massa uchun siluet (`"shart":">85"`, `"median":3`, `"toldir":false`,
`"min_maydon":60`, `"qiymat":true`) va `--ketma` (bir tomonda k va k+1). Kalibr:
`siluet/yorug'` (tutam 6 px qisqa → "past" −6.0; 2 px surilgan → "chap" +2.0; katta
zarra niqobga kirmaydi; teshik ochiq qoladi), `siluet/ketma` (bir xil juft 0.00, 2 px →
2.00), `siluet/qiymat` (median/p90 aniq).

**Topilma.** Misolning 1..6-tasviri ushlangan (yuz 0.00 px), lekin sochi har tasvirda
o'zgaradi: ketma-ket niqob IoU 0.61..0.72 (bizda 0.96..0.98), 1 va 6 orasida IoU 0.40,
maydon −30% — asosan o'rta tasmadagi ton o'zgarishi (yorug' tutamlar soyaga o'tadi).
Ikki qatlam, ikki vaqt: yuz — ushlangan rasm, soch — o'z harakati.

**Ton.** Misolda yorug' soch bir tekis: median ~100, p90 103..104. Bizda yorug'
chiziqlar L 124 edi (p90 122..124); endi bitta tekis ton — p90 101..102.

**Massa va uch.** Piksel IoU tutam UCHLARINI ham solishtiradi — bu dizayn. Massani
solishtirish uchun ikkala niqob sigma 2 px Gauss bilan yoyilib 0.5 da kesiladi
("massa IoU"). Moslash massaga qilinadi; uchlarning o'lchami esa TEXNIKA sifatida
o'lchanadi (niqob chetining silliq qobiqdan qoldig'i, nurlar 1 gradus): o'ngdagi
tutamlar davri ~14 px, chuqurligi ~7.7; yaqin yon pasti ~8 / 3.4; peshona ~8 / 3.2.
Bizning tishlar shu o'lchamda, joylari esa bizning urug'imizdan, burchakka bog'langan
(yoy uzunligiga bog'langanda massa o'zgarishi bilan tishlar chet bo'ylab "o'rmalardi").

**Model.** Birinchi urinish — guruh tutamlari (supurma, peshona, yaqin yon; har
guruhga uzunlik, yo'nalish, en) — 1-tasvirda IoU ni 0.33 dan 0.42 ga olib chiqdi xolos:
guruh parametrlari massaning qayerda turishini bera olmadi. Ikkinchisi — bosh markazi
atrofida qutb qobig'i (har 12 gradusda tashqi va ichki radius) — massa IoU 0.67..0.80.
Moslash modeli = shu tasvirning sochsiz toza renderi + geometriya (serverdan, bitta
kod) 4x da chizilib kichraytirilgan → taqqos quvuri; haqiqiy render bilan niqob IoU
0.977..0.987. Bosh markazi yaqin ko'zning o'zida (0.02..0.08 R) — markazga qaragan har
narsa ko'zga tushadi (13-qoida).

**Qimirlash.** Tish uchi titrog'i (har tish o'z fazasi bilan oqim bo'ylab) yetmadi:
0.08 R da ham ushlangan juftlar IoU 0.85 → 0.82, misol 0.67 — uchlar massaning kichik
qismi. Butun soch geometriyasiga silliq siljish maydoni (to'lqin ~1.06 R, har tasvirga
o'z fazasi; yuz qaynamaydi), amplitudasi juftlar IoU si misolnikiga teng bo'lguncha
tanlangan (0.06 R) — juftlar 0.64..0.72. Lekin bu moslashdan KEYIN qo'shilgan edi
(13-qoida); moslash uni modelga olib qayta qilinganda uzun to'lqinni massa darajasida
qoplab yubordi — juftlar 0.73..0.83 ga qaytdi. Ikkinchi, mayda tasodifiy maydon
(to'lqin 0.3 R — o'lchangan tish davrlari 0.21..0.37 R oralig'ida) modelga kiritilib
qayta moslanganda juftlar 0.68..0.73 (misol 0.61..0.72) — raqam to'g'ri. Varaqda esa
soch chetlari eriyotganday to'lqinlandi; misolda chetlar o'tkir qoladi, o'zgarish
tutamlarning yorug'dan soyaga o'tishi. Raqam to'g'ri, sabab noto'g'ri (6-qoida) —
olib tashlandi. Qoldi: uzun to'lqin moslash ichida, juftlar 0.73..0.83; tutam
soyalari (ichki tuzilish) — keyingi soch qadami.

## 13. Optimizator ko'rmagan joyni buzadi

- Peshona soyasi (qorong'i soch tasmasi) qalinligi `soyaH` 1.0 R gacha o'sdi va butun
  yuzni L 60 dan 30 ga tushirdi: maqsad funksiyasi faqat yorug' sochni va ko'z ustidagi
  ikki zonani ko'rardi. Buni moslashga kirmagan zond topdi — yaqin ko'z langari
  (x farqi 2.2 → 7.5 px). Tuzatish: chegara 0.30 R, yonoq zonasi (qorong'i ulush misolnikiga).
- Keyin soya ko'z oqini qopladi (sochdan keyin, ko'zlar ustida chizilgan) — qorachiq
  bilan bitta qorong'i komponenta (langar 8.4 px). Tuzatish: soya ko'zlardan OLDIN;
  moslash modeli ham shu tartibda. Birinchi model buni TAXMINAN qilardi: soya chizilgach
  "ko'z piksellari" (ko'zli va ko'zsiz fon farqi > 0) fondan qaytarilardi — bu niqobga ko'z
  ustidagi xira qovoq chizig'i ham kirgan va soya ichida teri rangli chiziq qolgan. Qosh
  zonasi modelda 0.62, haqiqiy renderda 0.78 (1-tasvir; misol 0.66): moslash qoshni
  ortiqcha qoraytirgan, jurnal esa "aniq" degan. Tuzatish: soya o'rnida soya rangli
  to'liq qatlam bilan bir render (`__soyaTest`, xuddi shu klip ichida) — model soya
  ko'pburchagi ichida shu renderni oladi; model va render qosh zonalarida 0.00..0.02
  farq qiladi (8-tasvir B zonasi 0.05).
- Keyin soya ikki ko'z ustini qoplab, ularni bitta komponentaga uladi (langar 10.4 px).
  Tuzatish: soya faqat yaqin ko'z ustida (qosh qutisining burchagi ±30).
- Mustaqil (har tasvir alohida) moslashda ushlangan tasvirlarda soch BO'LAK-BO'LAK
  almashdi: farq xaritasida katta dog'lar (misolda ingichka chetlar), yopilish xaritasi
  0.95 → 0.88 (qimirlagan yorug' uchlarni zarra deb o'qidi). Tuzatish: oldingi tasvirga
  bog'lash (radiuslar farqi jarimasi) — yopilish 0.93..0.94; ingichka qimirlash esa
  12-qoidadagi qaynash bilan.
- Hamma raqam yaxshilangach varaqda INGICHKA YOYLAR chiqdi: uzoq ko'z ostida ko'zoynak
  gardishiday yorug' yoy, pastda radial chiziqlar, tashlangan massa ostidan yuzni kesib
  o'tgan siyoh chiziqlari. Qobiq bitta halqa — soch yo'q burchakda moslash ro=ri qilgan,
  ichki chet esa ro−0.01 bilan qisilgan. Asbob ularni ko'rmaydi: 320 da yoy 1..2 px,
  L ~75 — L>85 dan past, median 3 dan ham o'tmaydi; qosh zonalariga ham ta'sir qilmaydi
  (olib tashlanganda 1, 4, 7-tasvirda qosh ulushi 0.01 dan kam o'zgaradi) — moslash
  ularni ko'rmagan va joyini tanlamagan. Tuzatish: qalinligi `minQal` dan kichik joy
  tashlanadi, siyoh soch ichiga kliplanadi. `minQal` niqob IoU platosidan: 0 da 0.594,
  0.10..0.18 da 0.595..0.598 — tanlangani 0.15.
- Soch qaynashi (12-qoida) moslashdan KEYIN qo'shilgan edi — qosh zonalari endi faqat
  moslash jurnalida "aniq" edi. Haqiqiy renderda 4-tasvir qaynashsiz 0.82/0.38, qaynash
  bilan 0.46/0.17 (misol 0.60/0.38); 7-tasvir 0.83/0.28 → 0.57/0.14 (0.66/0.29). A dagi
  0.82 ning o'zi yuqoridagi model xatosi. Moslashdan keyingi har o'zgarishdan so'ng hamma
  zond qayta o'lchanadi; moslash qaynash va `minQal` modelga kirgan holda qayta qilindi.

Qoida: har moslashdan keyin HAMMA zondni ishga tushiring va varaqni ko'ring, faqat
moslanganini emas; har erkin parametrga uning butun ta'sir sohasini ko'radigan o'lchov
kerak; asbob ko'rmaydigan narsa (filtrdan ingichka, chegaradan xira) model
cheklovi bilan yopiladi; model render qatlamlari tartibini takrorlashi shart.

- "Oldin" yana bir ko'rinishda: tasma tirqishi moslashi "tirqishsiz" holatni o'lchayotib
  varaq.mjs dagi oldingi natijani ham yuklab olgan — hamma tasvirga "kerak emas" yozdi.
  Qayta o'lchashda o'zgartirilayotgan parametr ANIQ beriladi (null ham).

## 14. Kamera va fizika: kapyushon

**Kamera qayerda.** Avval o'qing, keyin chizing: personaj uch kadrda ham ekranda o'ngga
qaraydi, kamera uning O'NG tomonida (o'ngga qaragan yuzning ko'rinadigan yuzi — o'ng yuz;
12-o'tishda "chap" deb yozilgan edi — xato); 3-kadrda PASTDA — buni faqat pastdan ko'rinadigan
narsalar aytadi: soyabon (qirra) OSTINING yorug' astari L 43..48, kapyushon ICHI L 7..9,
tashqi sirt L 19. Chet yoyilishi (sigma ~1.0 px, soch 0.6..0.7) — "xira" ko'rinish defokus
emas. Zarralar uch kadrda bir xil (+2.9,−1.1) — shamol orqadan oldinga.

**Fizika o'lchovda.** Kapyushon yelkaga tayangan mato, qirrasi sochga TAYANADI; bosh
egilganda soyabon peshona ustiga tushadi: 14→18 da astar tasmaning pastki cheti 53 px
pastga, soch uchlari atigi 18 px, yorug' soch maydoni −67%. Soyabon sochni YOPADI —
boshning orqasi kapyushon ichida yashirin, bo'shliqda ichi (pona) ko'rinadi.

- **Ikki o'lchangan nuqta orasidagi to'g'ri chiziq — taxmin.** Qirra cho'qqidan chakkaga
  to'g'ri chiziq qilib olingan edi (ikkala uchi o'lchangan): misolda u chiziq astar
  tasmaning USTIDAN o'tadi, tasma bizda osmonda "shox" bo'lib qoldi. Qirra — tasmaning
  o'lchangan tepa cheti (7 ustun kaliti), tasma — tepa va past chet.
- **Median o'tkir uchni yeydi.** Pona (median 5) uchi sintetikda 5 px pastga, past uchi
  3 px yuqoriga tushdi; to'g'ri chetlar saqlanadi. Uchlar niqobdan olinmaydi: har qatorda
  chap/o'ng chekka, chetlarga `x = a·y + b`, uchlar — kesishmalar (kalibr: ≤0.8 px;
  o'ng cheti tik bo'lsa ikki uch R1, R2). Moslash bilan (IoU, Nelder-Mead) uch 2 px
  qoldi — maqsad funksiyasi yeyilgan uchni ko'rmaydi.
- **Erkin moslash kapyushonni buzdi.** 17 parametrli CMA o'tkir tikan va kesishgan qirra
  chiqardi (13-qoida: ko'rmagan joyni buzadi). O'rniga — o'lchangan kalitlar, kadr ichida
  [1,2,1]/4 silliqlangan.
- **Bizning bosh boshqa.** Misolning boshi pastdan, egilgan holda; bizniki 3/4, kattaroq —
  orqasi aynan pona joyida. Tashqi sirt boshning orqasini qanday yopsa, pona ham boshning
  USTIDA chiziladi (orqasida chizilganda sochimiz uni butunlay yopardi, pona 0..129 px).
- **Langar boshqa narsaga tushdi.** Tasma/pona asboblari eng katta yorug' soch qismiga
  bog'langan; bizda u yuz chapidagi uzun tutamlar (x 130..170) — quti 15..18-tasvirda
  tasmani ko'rmadi (11..35 px, misol 378..881). Qo'shimcha o'lchov: misol qismining 4 px
  kengaytirilgan sohasi ichida, ikkala tomonda bir xil sinf chegarasi (joyida IoU).
- **Qisman yopilgan massaning markazi — joy emas.** Bosh izini yorug' soha markazi
  bo'yicha qayta sozlash (5-o'tish halqasi) yangi kapyushon bilan boshni 19→20 da 27 px
  sakratdi: soyabon/pona yopgan qism har siljishda o'zgaradi. O'rniga fizik shart —
  soyabon sochga tegadi: tasma pastki cheti bilan soch tepasi orasidagi bo'shliq
  (misolda ta'rifan 0), silliq iz, 18-tasvirdan keyin bosh USHLANADI (misolda tasma cheti
  87..88 da turadi). Yorug' soha markazi farqi shunda ham 18.7 → 7.7 px.
- **Raqam to'g'ri, sabab noto'g'ri (yana).** 11-o'tishda 3-kadr juftlar MAE 0.0448 edi —
  bosh 19..22 da 15 px YUQORIGA qaytgani (misolda yo'q) farq berardi. Bosh ushlanganda
  MAE 0.0501: 18..22 juftlari misolda 0.29..0.30, bizda 0.22..0.26. Yetishmayotgani farq
  xaritasida: misolda chap 40% energiya 0.06..0.08, bizda 0.00..0.01. U yerda misolda
  plash USTIDA qor zarralari bor (chap-pastda, x 0..110, y 100..180: 46..65 ta, maydonning
  ~2%; bizda 0) — bizning qor figuraning ORTIDA chiziladi. Juft farqi = 0.4·chap + 0.6·o'ng:
  18-19 da farq 0.303 vs 0.223 — chapdan 0.026, qolgan 0.053 o'ng 60% da (qor, soch uchlari).
  Qoida: qo'shimcha qimirlash qo'shib raqamni tiklamang — yetishmayotgan qatlamni toping.
- **Kapyushon o'zgarsa, unga bog'liq ton ham qayta o'lchanadi.** Yuzdagi kapyushon soyasi
  0.22 da yuz L 49 (astar sinfiga tushardi); misol yuz sinfi median L 59 har tasvirda →
  0.03 (yuz sinfi IoU 0.19 → 0.26).
- **Qo'pol profil o'lchangan chiziqdan oshmasin.** Plash 18 qatorli profil — 3-kadr tepasida
  misoldagi kapyushon chizig'idan 30 px o'ngga chiqqan edi (osmon L 2..8 o'rnida L 19);
  o'lchangan chiziqqa (kadr tepasini kesgan joy → o'ng-tepa burchak) kesildi — cho'qqi
  zondi (205..207, 0) dan (220..233, 23..30) ga (misol 225..238, 29..35).

## 15. Sahna avval: qayerga qaraydi, kamera qayerda (3D, 5-o'tish)

Foydalanuvchi: "bizniki yonga qaraydi, misol pastga". Yuz detallari sahna tushunilmasdan moslangan edi.
- **Bitta ko'rinish faqat NISBIY yo'nalishni beradi.** 1-shot yuz nuqtalari el -8/-20/-30 da bir xil
  tushadi (RMS 0.6 px): bosh +17/+8/0 gr tepaga, lekin yonga 3/13/21 gr og'ishi kerak. Mutlaq qiymat --
  "bosh burilmagan/og'magan" tamoyili, kesishlar orasidagi voqea va 3D belgilar bilan tanlanadi; oila
  (hamma variant) hisobotda yoziladi.
- **Nuqtalar emas, kontur.** 2-shot profil 4 nuqtaga (RMS 2.0 px) va profil vazniga bog'langan pastki yuz
  surishiga moslangan edi -- butun old kontur 19.5 px gacha qochgan (RMS 9.9), yuz ~20 gr tepaga og'gan.
  21 kontur qatori + iyak osti bilan: bosh tekis, RMS 1.33 px. Silueta zich olinadi (110x70 to'rda bir
  qator +3.3 px xato).
- **Anime ko'rinish usuli -- belgi joylashuvi, shakl emas.** Profilda misol ko'zi qattiq bosh qo'yadigan
  joydan 17.5 px (0.6 birlik) orqada: ko'z chizmasi sirt bo'ylab karta bilan ko'chadi (w=0 da o'zi,
  0.0014 birlik); pastki yuzni surish yuzni og'dirardi. Vazn -- BOSH fazosidagi burchak.
- **Sahna renderda tekshiriladi.** Eski 3-shotda model "ko'z 2.5 px" dedi; renderda ko'z qutisida qorong'i
  chiziq yo'q (L 38), iyak plash ortida -- model okklyuziyani bilmaydi.
- **2D fon qatlami kamera haqida gapirmaydi.** Misolda qor zichligi gradienti va harakati uch shotda bir xil;
  3-shotda kamera 30 gr pastdan qaraganda fon "tepasi" kameraga bog'lanadi.
Skill: `media-staging-audit`. Hisob: `personaj3d/README.md` (5-o'tish).

## 16. Soch massasi: misolning yorug'i bizda NIMAGA tushadi (3D, 6-o'tish)

"Yonga qaraydi" taassurotining qolgani sochda edi: yaqin ko'z ortida 28-33 px ochiq teri (misol 1-9), peshona ochiq.
- **Farq emas -- tushish joyi.** Yangi asbob (`personaj3d/test/audit_misol/soch_qoplash.py`): misolning yorug' soch
  pikseli bizda qaysi SINFGA tushadi -- rol renderidan aniq (teri / soch soyada / ichki qopqoq / kapyushon / fon).
  1-shotda misol yorug'ining atigi 1 % i bizning yorug' sochga tushardi; 52 % teriga, 30 % kapyushonga -- bir son
  "soch yo'q" va "kapyushon to'sadi" ni ajratdi (kapyushon keyingi o'tishga qoldi, soch -- hozir). Kalibr: o'zi 100 %,
  5 px surilgan 56 %.
- **Misol o'lchovini modelning fazosiga o'tkazing.** 2-shot yorug' massasining har qatori shot kamerasi bilan bosh
  fazosiga o'girildi (28.7 px/birlik): soch tojdan ~1 birlik yuqorida, peshonadan ~1 birlik OLDINDA. Bitta 3D shakl
  uchala shotni tushuntirdi: 3/4 da pastdan qaralganda oldingi soch peshonani ko'zgacha "yopadi", bosh egilganda yuz
  oldida osiladi. Qor harakati (o'ngga-tepaga) shamol yo'nalishini berdi -- sochning taralishi shu bilan izohlanadi.
- **Qayerda turgani yetmaydi -- qayerda osilgani.** Dam shakli bosh fazosida qotib qolsa, bosh 17 gr tepaga qaraganda
  "tik" tutam ekranda yonoqni diagonal kesadi (panja). Misolda soch dunyoda osiladi: dam shakli og'irlik va shamol
  tomon egiladi. 3/4 da yaqin soch ko'z ortidan jag' ORTIGA tushadi; yonoq ustida qolsa bosh profilga burilganda yuz
  ustiga chiqadi (misol 9-11 da soch yonoq ortida).
- **Ko'rinishga bog'liq joy o'z vazni bilan.** Soch vazni ko'z kartasi vaznidan alohida (kamera burchagidan, 70 gr
  dan): ko'z kartasi 1-shot 10-11 da 0..0.1 da moslangan, bir vaznda soch yonoqqa "panja" bo'lib tushardi.
- **Niqob tuzilma o'lchamini ham o'lchaydi.** Uzoq tomondagi ingichka tutamlar 480 px da yorug' (L 102..131), lekin
  320 px da kontur chiziqlari bilan aralashib niqob ochishidan o'tmaydi -- yorug'lik yo'nalishini 4 marta o'zgartirish
  hech narsa bermadi. Avval to'liq o'lchamda piksel qiymatiga qarang, keyin sabab tanlang.
- **Zond sochga tegadi.** Uzoq ko'z zondi 0.97 -> 2.25 px yomonlashdi: ko'z ustidan endi tutamlar o'tadi va qimirlaydi
  (misolda ham shunday), bosh geometriyasi tegilmagan. Ritm detektori ushlangan tasvirlarimizning medianasi past
  (0.229 vs 0.337) bo'lgani uchun bosh harakati juftlarini (misolnikiga yaqinlashgan) "kesish" deb belgiladi.
- **Moslash maqsadini tekshiring.** Kapyushon moslashi (figura IoU + "misol sochi kapyushon ostida" + "sochimiz misol
  qorong'isida") figura IoU ni sochni ochish uchun berib yubordi -- 1-shotda uzoq yon ichki yuzi ochildi. Qabul
  qilinmadi; minimal qo'lda variant (bir xil o'lchov bilan tekshirilgan) olindi.
Hisob: `personaj3d/README.md` (6-o'tish), `chiqish/soch-audit-6.png`.

## 17. Kapyushon: ko'rinadigan bosh har shotda -- o'lcham va sakrash (3D, 7-o'tish)

Foydalanuvchi: "tasvirdan tasvirga sakraydi, katta-kichik bo'ladi". Oldingi zondlar faqat JOYNI o'lchardi (ko'z markazi,
kontur qatori) -- o'lcham va sakrashni hech biri ko'rmasdi.
- **O'lcham -- alohida o'lchov.** Ko'rinadigan bosh maydoni va IoU (misolda L>=40 niqob, bizda rol renderi): misolda uch
  shotda 6300-7400 / 6600 / 4100-5700 px, bizda 11 800-12 900 / 4 000 / 13 500-14 100 (1.75 / 0.61 / 3.03 barobar).
  Sakrash -- qo'shni tasvirlar farq energiyasi (chap 40 %): 9->10 0.490 (misol 0.201); xarita -- misolda faqat soch va
  yuz belgilari o'zgaradi, bizda ochiq bosh orqasi, qopqoq, bo'yin butun siljiydi.
- **Anime kiyimi shot bo'yicha.** Misolda kapyushon har shotda boshqacha yotadi; bizda kesishda qayta quriladi, shot ichida
  boshga KF/KT ulushida ergashadi. Bosh IoU 0.41 / 0.49 / 0.23 -> 0.81 / 0.62 / 0.69, sakrash 0.490 -> 0.307.
- **Ikkinchi maqsad -- og'irlik emas, SHART.** Figura 0.5 og'irlikda edi: 3-shotda bosh IoU +0.33 uchun figura 0.857 ->
  0.784 (kapyushon tepasi oldinga, chap-tepa burchak osmon). "Topshirilgan darajadan past emas" sharti bilan xuddi shu
  shot 0.69 / 0.884 berdi. (16-qoidadagi "maqsadni tekshiring" ning davomi: tekshirish yetmaydi -- shart qo'ying.)
- **"Artefakt"ni o'chirishdan oldin misolni o'sha piksellarda o'lchang.** 1-shotda yuz o'ngidagi ingichka yorug' chiziq
  (uzoq qirra astari) xatoga o'xshardi; misolda o'sha piksellarda L median 43 -- misolning o'z astar tasmasi, yuz chetidan
  qirragacha ~14 px L 43-45, jag' ostida esa L 7-10. To'g'risi -- tasmani yuz balandligida kengaytirish va jag'da tugatish
  (2D loyihaning tasma zondi -86 % -> 11.6 %), o'chirish emas.
- **Chegaradagi parametr -- erkinlik yetishmaydi; yangi erkinlik -- ko'rilgan xato uchun.** Parametrlar chegarada qoldi
  (teshik 1.0, siljish -0.6); har qo'shilgan erkinlik varaqda ko'rilgan bitta aniq xatoga javob edi: ikki qirra alohida
  (uzoq qirra chizig'i), tasma eni (misol astari), tasma tugashi (jag' osti). Ko'r-ko'rona parametr qo'shish emas.
- **Bir qism boshqasining o'lchovini yorug'lik orqali siljitadi.** Kapyushon boshni yopgach, uning soyasi 3-shot sochiga
  tushdi: misol yorug' sochining biznikiga tushishi 43 % -> 4 % (soyasiz render 39 %). Qo'shni o'lchovlar qayta
  o'lchandi va hisobotda OCHIQ deb yozildi: misolda old tutamlar soyabon ostidan yorug'likka osiladi -- soch ishi.
- **Yopish harakatni ham yopadi.** Sochning ko'rinmay qolgan qismi ushlangan juftlar energiyasini ham olib ketdi:
  3-shot 0.037-0.067 -> 0.009-0.039 (misol 0.059-0.083). "Tinchroq" -- misolga yaqinroq degani emas.
Hisob: `personaj3d/README.md` (7-o'tish), `chiqish/kapyushon-audit-7.png`.

## 18. "Kamera zoom" -- masshtab zondi, katta massa, fon qatlami (3D, 8-o'tish)

Foydalanuvchi: "10 dan keyin kamera zoom ga o'xshab katta-kichik bo'ladi". Zondlar yuzni yaqin ko'z langariga nisbatan
o'lchardi -- kadrning o'zi kattalashib-kichrayishini hech biri ko'rmasdi.
- **Masshtab -- alohida zond.** Qo'shni tasvirlar orasida figura mintaqasining affin moslashi (ECC; kalibr: 1.02 zoom ->
  1.0203): misolda shot ichida 0.985..1.008, bizda 9->10 0.924. Sabab joyda emas, mato ERGASHISHIDA edi: bosh burilganda
  kapyushon qirrasi bosh orqasini yopib borardi. Shot ichidagi aylanishga ergashish ulushi alohida parametr bo'ldi (skan:
  1-shotda 0.2, 3-shotda eski 0.35 eng yaxshisi) -> 1.007.
- **Kamera masshtabi katta massadan.** 2-shot masofasi pastki yuz konturiga (21 qator) moslangan edi -- RMS 1.3 px, lekin
  butun bosh va kapyushon 20 % kichik chiqdi (figura 0.407, misol 0.509; misolda figura shotdan shotga O'SADI, bizda
  kichrayardi). Anime profil yuzi boshiga nisbatan kichik chiziladi: kichik belgi kamerani emas, yuzni o'zgartiradi. Tartib:
  kamera -- figura va ko'rinadigan bosh siluetiga, yuz -- keyin, shu masshtab ichida.
- **Fon qatlami texnika sifatida.** Misolda qor bitta 2D qatlam: kesishda davom etadi (fazaviy korrelyatsiya r 0.71 / 0.69),
  zichligi uch shotda bir xil (271 / 273 / 272 zarra/10k px). 3D qor har shot kamerasidan qayta chizilganda kesishda uzilardi
  (r 0.12 / 0.03) va 2-shotda +51 % zichlashardi -- ko'zga "kamera uzoqlashdi". Qatlam kamera fazosida, shotga o'xshashlik
  bilan ko'chiriladi (chuqurlik d_shot/d_1 ga cho'ziladi -- yopilish saqlanadi).
- **Statistika qutisi personajdan toza bo'lsin.** Birinchi qor o'lchovi (o'ng 55 %) 2- va 3-shotda sochimizni "katta zarra"
  deb sanadi (p99 15 / 32) -- har shot uchun ikkala tomonda personajdan o'ngdagi quti. Qutidan qutiga zichlik o'zgarsa
  (bizning qor o'ngda siyrak: 195 -> 160), avval bitta shotning o'zida qutilarni solishtiring.
Hisob: `personaj3d/README.md` (8-o'tish), `chiqish/kamera-audit-8.png`.

## 19. 3D ichida 2D fikrlash -- faqat kamera yuradigan sinov (3D, 9-o'tish)

Foydalanuvchi: "fully 3D model qilishing kerak ki kamera o'sha example positionga kelganda 1:1 bo'lishi kerak ... 2D deb
ishlov bersang kamera siljisa noto'g'ri joyi bo'lib qolish ehtimoli katta". Sakkiz o'tishda shotga, ko'rinish burchagiga
yoki kadrga bog'langan oltita shakl/fon qiymati yig'ilgan edi (ko'z kartasi, pastki yuz surishi, soch dam aralashmasi,
shot bo'yicha kapyushon va ergashish ulushi, kameraga yopishgan qor, fon "tepasi") -- har biri o'z shotida raqamni
yaxshilagan, hech biri bitta shotda ko'rinmaydi.
- **Bitta dunyo: shotga faqat kamera tegishli.** Qolgan hamma narsa -- doimiy, vaqt (animatsiya, fizika) yoki poza
  funksiyasi. Test: "hech kim qaramasa ham obyekt shunday qilarmidi?" Ko'rish yo'nalishiga bog'liq soyalash (rim) -- joiz.
- **Sinov: poza va vaqt ushlanadi, faqat kamera yuradi** -- misol kameralari orasida uzluksiz (~1.2 gr qadam) va bosh
  atrofida (10 gr). Rasm emas, DUNYO o'qiladi: har qismning namuna nuqtalari sahna grafidan; har tasvirda joriy va
  0-tasvir nuqtalari JORIY kamera bilan proyeksiyalanadi -- qism qattiq bo'lganda turishi kerak bo'lgan joydan farq (px);
  oldingi tasvirga nisbatan -- qadam (sakrash -- bitta katta qadam, sirg'anish -- ketma-ket qadamlar).
- **Kalibr.** Ma'lum yamoqlar 0-tasvirda muzlatilganda hamma qism 0.0000 px (49 + 37 tasvir) -- ro'yxat to'liqligining
  ham tekshiruvi. Sun'iy +0.1 birlik siljish -- mustaqil teshik-kamera modelining o'zi (0.000 %). Birinchi urinishda asbob
  2.27 px, model 3.77 px dedi: siljish personajning mahalliy o'qida berilgan edi (ildiz 90 gr burilgan) -- xato sinovda.
- **Natija** (320x180): kapyushon kalit almashganda 114 / 159 px sakraydi; yaqin ko'z 33 / 36 px sakraydi, orbitada yuz
  bo'ylab 38 px gacha suriladi; pastki yuz 5.3 px; soch kamera boshga nisbatan 70..84 gr da qadamiga 18 px gacha
  sirg'anadi (orbitada 98 px); qor kamera bilan yuradi (yo'l oxirida 138 px, orbitada 398 px -- paralaks yo'q); fon
  tepasi 3-shot kamerasida 22 gr og'gan. Bo'yin, plash, ichki soch -- 0.00.
- **Ishonarli sabab ham taxmin.** 2-shot qori zichroq (+21 %, 235 / 195): qor qutisi z <= 7 da tugaydi, 2-shot kamerasi
  z 10.2 da -- tashqarida. Quti hamma kamerani o'rab olganda (zichlik o'sha) o'zgarmadi: 245 / 195 / 186. Sabab ochiq.
- **Kesishlar orasidagi qarama-qarshilik -- o'lchov:** 2-shot yuzga d 12.88, siluetga 10.32 -- modelning yuz/bosh nisbati
  misolnikidan boshqa; bitta shotda bitta kamera, farq modelda tuzatiladi yoki qoldiq sifatida aytiladi.
- **Natija (9-o'tish oxiri):** yamoqlar olib tashlangach kamera sinovi hamma qismda 0.00 px (yo'l va orbita). Kapyushon
  shot bo'yicha emas -- POZAGA bog'liq rig (kalit pozalar, kechikkan poza bo'yicha Gauss og'irliklar): bu ham bitta dunyo
  (kameraga bog'liq emas); poza yo'li sinovi (kamera ushlangan, poza uzluksiz) -- sakrash yo'q. Qoldiqlar misolning 2D
  ishlab chiqarishidan: profil ko'zi, qor qatlamining kesishdan o'tishi, uch shotda bitta osmon plitasi.
Hisob: `personaj3d/README.md` (9-o'tish), `chiqish/kamera-sinov-9.{png,gif}`; skill `media-3d-consistency-audit`.

## 20. Qismlar alohida -- yalang'och model avval, keyin qatlamlar (3D, 10-o'tish)

Foydalanuvchi: "qaysi biri soch, burun, ko'z, qosh, og'iz, daha -- ajratib olmayapsan; boshni og'izgacha o'lchab dahani
qoldirma; o'z modelimizda soch va kapyushonni olib turib birma-bir o'lcha, keyin qo'yib o'lcha".
- **Qismlar ro'yxati -- o'lchovdan oldin.** Har shotda har qism uchun: qaysi o'lchov uni ko'radi? Bu loyihada qosh va burun
  uchi hech qayerda, iyak uchi va jag'ning quloqqa tomon qismi hech qayerda o'lchanmagan edi; bosh moslashida 1-shot iyagi
  bitta kontur qatori edi. Yuz "og'izgacha" moslangan -- jag' 17 px noto'g'ri, hech bir raqam buni ko'rsatmagan.
- **Bizda haqiqat ma'lum -- asbobni o'zimizda kalibrlang.** Modeldan har qismning nomli nuqtalari (3D -> ekran, sahifa
  bilan 0.005 px); misolga qo'llanadigan qoida bizning renderda shu nuqtalarga qarshi: doimiy siljish (bo'lak markazi
  aniq nuqtadan -1.6, -3.7 px) ikkala tomonda bir xil -- qisqaradi; o'zgaruvchan katta farq -- asbob boshqa narsani topgan.
- **Yalang'och avval.** Soch, kapyushon, plash yashirilgan render -- boshning o'z siluetasi (jag' osti izi, kontur, iyak);
  keyin qatlamma-qatlam: misolning KO'RINADIGAN yuzi ustida bizda nima -- teri / soch / kapyushon (bu loyihada soch 16 / 18 /
  10 %). Kiyingan renderda qism yashirilsa -- u yo'q deb o'lchanadi, yalang'ochda -- qayerdaligi.
- **Model izi render bilan bir xil bo'lsin.** Sirt nuqtalari siluetasi faqat old tomondan olinganda render skanidan 1.5-2.7
  px yuqori chiqdi (1-shotda jag' izi boshning o'rtasidagi jag' tagidan keladi) -- to'liq azimut; qator skani o'rtacha
  floor(y - 0.5) = y - 1.0.
- **Poza shakl farqini yutadi.** Faqat pastki yuz nishonlari bilan poza erkin bo'lsa 2- va 3-shot burilishi chegaraga (17 gr)
  yetdi -- poza boshqa (soch, kapyushon, massa) bilan moslangan edi; jarima (x / 0.04 rad)^2.
- **Teng shot og'irligi asosiy shotni qurbon qilishi mumkin.** Misol ko'rinishlari 2D da bir-biriga to'liq mos emas (profil
  yuzi boshiga nisbatan ~20 % kichik): teng og'irlikda 1-shot iyagi 5-6 px ketdi. Asosiy shot + "boshqasi yomonlashmasin"
  jarimasi; qarama-qarshilik qoldiq sifatida yoziladi.
- **Poza -- rig kaliti -- masshtab zanjiri.** Shot pozasi surilsa pozaga bog'liq kiyim rigi boshqa shotlarda ham o'zgaradi
  (2-shot kaliti 1-shot pozalariga yaqinlashib 10 -> 11 masshtab sakrashini qaytardi) -- poza, rig va kamera birga.
- **Metrika ko'rinishga to'g'ri kelmasa -- ustma-ust niqob.** Soch qoplashi 14 -> 2 % ga tushdi, lekin ustma-ust niqob 1-9 kadrda
  eski tutam misolnikiga aniq tushganini ko'rsatdi: bitta tutam 3/4 va profilni birga bermaydi -- sinov qabul qilinmadi.
Hisob: `personaj3d/README.md` (10-o'tish), `chiqish/qismlar-audit-10*.png`, `chiqish/soch-tutam-10.png`.

---

## Bir o'tish tartibi

0. Sahna (15-qoida): har shotda nima qiladi, qayerga qaraydi, kamera qayerda -- 3D da tiklanadi,
   renderda bir xil kod bilan tekshiriladi. Detallar undan keyin. Massa (soch, kiyim) -- misolning
   yorug'i/qorong'isi bizda qaysi qismga tushishi bilan (16-qoida). Joy bilan birga O'LCHAM va
   tasvirdan tasvirga SAKRASH ham o'lchanadi (17-qoida). Kamera masshtabi -- katta massadan, fon qatlami
   kesishda uzluksiz; figura masshtabi har juftda (18-qoida). 3D modelda shotga faqat kamera tegishli: har o'tishdan keyin faqat kamera
   yuradigan sinov -- har qism 0 px (19-qoida).
1. `kalibr` — hammasi PROVEN.
2. Titroqsiz render → `zond` (hamma tasvir) va `siluet`: eng katta farqlar.
3. Har biri uchun varaq/setka/L jadvali: zond nimaga tegdi (7-qoida), nima o'qildi
   (8-qoida).
4. Tuzatish modelning o'z parametrlarida, o'lchangan son bilan; shakl — moslash
   bilan (9-qoida). Moslash modeli render qatlamlari tartibini aynan takrorlaydi;
   moslashdan keyin qo'shilgan har narsa modelga kiradi va moslash qayta qilinadi
   (13-qoida).
5. Qayta o'lchash: o'sha zond, qo'shnilari, `harakat`, `ritm`, `xarita`, `yopilish`.
6. Oddiy (titroqli) render bilan tekshirish; oldin/keyin varaqasi (`eski` qatori —
   topshirilgan fayl, 11-qoida).
7. Kartaga yozish: nima o'lchandi, oldin/keyin raqami, nima ochiq qoldi.

## 10-o'tish hisobi (1-kadr, 11 tasvir)

Oldin — 9-o'tishda topshirilgan fayl (11-qoida); ikkala tomon bir xil yo'ldan:
480×270 GIF → 320×180.

| o'lchov | oldin | keyin | misol |
|---|---|---|---|
| figura siluet IoU (o'rtacha; eng yomoni) | 0.714; 0.63 | 0.872; 0.82 | — |
| figura xaritasi IoU | 0.89 | 0.95 | — |
| ushlangan juftlar harakati (yuz qutisi 72,22,140,112) | 0.00..1.12 | 0.00 | 0.00 |
| 1-kadr tendensiyasi | +14.6% | +39.6% | +14.3% (sabab: soch — ochiq) |

Zondlar 10-o'tish ichida PNG da o'lchangan; ularning "oldin"i — `ff-9`: 9-o'tish
chizmasi, 10-o'tishning bosh joylashuvi bilan (11-qoida). Bosh joylashuvi
o'zgarishi bu ustunda yo'q.

| o'lchov | ff-9 | keyin | misol |
|---|---|---|---|
| qo'l uchi x (tuzatilgan zond bilan) | −8..+5, o'rtacha \|farq\| 3.00 | −1..−4, o'rtacha 2.36 | — |
| qattiq nishonlar (uzoq chet, iyak oldi; 1..6) | −1.2..+1.1 px | 0.0 px | — |
| og'iz zondi x, o'rtacha \|farq\| (1..11) | 1.66 | 0.71 | — |
| uzoq ko'z o'rtacha \|farq\| x / y | 1.11 / 0.98 | 0.50 / 0.58 | — |
| iyak osti ustuni L | 19 | 8 | 7..9 |
| figura siluet IoU / xaritasi | 0.697 / 0.92 | 0.871 (titroqsiz 0.881) / 0.95 | — |
| 1-kadr tendensiyasi | +19.9% | +39.4% | +14.3% |

Ochiq (keyingi — soch o'tishi): yaqin tutamning yuz ustidagi "(" massasi (6..9),
uzoq yondagi tutamlar orasidagi osmon, ushlangan tasvirlardagi soch qimirlashi,
yaqin ko'zdan tutamning sirg'anishi (langar x +1.2..+3.5).

## 11-o'tish hisobi (1-kadr, 11 tasvir — soch)

Oldin — 10-o'tishda topshirilgan fayl (`oldin-hozir-10.gif` ning HOZIR paneli = `ff-10`
renderi, film.html bayt-bayt tekshirilgan); ikkala tomon bir xil yo'ldan: 480×270 GIF →
320×180 (`ff-10t`, `ff-11t`).

| o'lchov | oldin | keyin | misol |
|---|---|---|---|
| soch niqobi IoU (L>85, median 3; o'rtacha; eng yomoni) | 0.399; 0.30 | 0.639; 0.58 | — |
| soch_osti / soch_ong / soch_yaqin_ichki IoU | 0.405 / 0.379 / 0.452 | 0.688 / 0.698 / 0.553 | — |
| figura siluet IoU (tana_ong) | 0.872 | 0.872 | — |
| ushlangan juftlar soch niqobi IoU (1..6) | 0.96..0.98 | 0.73..0.83 | 0.61..0.72 |
| yorug' soch toni median / p90 | 100 / 122..124 | 100 / 101..102 | 99..102 / 103..104 |
| qosh zonalari \|farq\| A / B / yonoq (o'rtacha) | 0.566 / 0.248 / 0.019 | 0.046 / 0.021 / 0.004 | — |
| 1-kadr tendensiyasi (qirqilgan) | +39.6% (+91.0%) | +14.8% (+37.8%) | +14.3% (+31.2%) |
| juftlar MAE | 0.0503 | 0.0424 | — |
| yopilish xaritasi IoU | 0.95 | 0.94 | — |
| tasma n% (uzoq yon tutamlari orasidagi osmon) | 11.80 | 5.41 | — |
| langar x / y, uzoq ko'z x / y, og'iz x (o'rtacha \|farq\|, px) | 2.19 / 1.27, 0.53 / 0.59, 1.15 | 2.15 / 1.59, 0.57 / 0.53, 1.03 | — |
| ingichka yorug' (yonoq, soch massasidan tashqarida; test/ingichka.py) | 417 | 743 (ingichka yoylar bilan 1167 edi) | 803 |

12..22-tasvirlar 10-o'tish bilan bir xil (chizma o'zgarmagan; Chromium fonida ±1 shovqin).

Ochiq: yaqin yon sochi yassi parda — ichki tutam soyalari yo'q (misolda ushlangan
tasvirlardagi o'zgarish aynan shu soyalarning o'tishi — juftlar 0.73..0.83 → 0.61..0.72
shu yerdan); peshonadagi o'rta tonli tutamlar (L 70..85) — bizda teri; yaqin ko'z
ustidagi soya shakli (ikki bo'lakli), 4..6-tasvirda langar y −1.8..−4.3 px (soya ko'z
komponentasiga yopishadi); 2- va 3-kadr sochi eski; yuz shakli o'tishi (ko'z eni 13 vs 9,
qovoq, burun, og'iz).

## 12-o'tish hisobi (2- va 3-kadr — kapyushon)

Oldin — 11-o'tishda topshirilgan fayl (`oldin-hozir-11.gif` HOZIR paneli = `ff-11` renderi);
ikkala tomon bir xil yo'ldan: 480×270 GIF → 320×180 (`ff-11t`, `ff-12t`).

| o'lchov (2-kadr \| 3-kadr) | oldin | keyin | misol |
|---|---|---|---|
| astar tasma joyida IoU | 0.00 \| 0.04 | 0.67 \| 0.67 | — |
| pona joyida IoU | 0.52 \| 0.36 | 0.91 \| 0.86 | — |
| pona maydoni (kapyushon asbobi) | 2418..2556 \| 1275..1617 | 727..738 \| 356..735 | 745 \| 663..838 |
| tasma qalinligi 19..22 (px) | 2.4..5.8 | 19.3..21.6 | 19.8..21.2 |
| o'ng-tepa burchak (cho'qqi zondi) 17..22 | (205..225, 0..14) | (220..233, 23..30) | (225..238, 29..35) |
| ton sinflari massa IoU: tashqi / astar / ichi / yuz / soch (3-kadr) | 0.70 / 0.21 / 0.15 / 0.10 / 0.20 | 0.81 / 0.28 / 0.23 / 0.26 / 0.27 | — |
| ton sinflari massa IoU (2-kadr) | 0.66 / 0.06 / 0.18 / 0.22 / 0.33 | 0.70 / 0.15 / 0.18 / 0.21 / 0.33 | — |
| yorug' soha markazi farqi, 12..22 o'rtacha (px) | 18.7 | 7.7 | — |
| blok harakati vektori farqi, 3-kadr (px/juft) | 1.58 | 0.68 | — |
| yopilish xaritasi IoU 12-13 / 14-22 | 0.90 / 0.90 | 0.91 / 0.92 | — |
| 3-kadr tendensiyasi; juftlar MAE | −14.3%; 0.0448 | −21.0%; 0.0501 | −17.7% |
| butun klip tendensiyasi; MAE | −14.6%; 0.0425 | −17.6%; 0.0458 | −14.7% |

1-kadr chizmasi o'zgarmagan: xom render ±1 (Chromium), zondlar xom renderda aynan bir xil
(langar 2.08/1.52, og'iz 0.71/0.68). GIF yo'lida og'iz x 1.03 → 1.18: palitra butun klip uchun
bitta — 2-3-kadr o'zgarganda 1-kadr dither'i siljiydi.

Ochiq: bosh 3-kadrda misolnikidan katta va boshqa pozada (misolda pastdan, egilgan; yuz
pastki-chapda, ostida qorong'i yoqa) — iyak kadrdan chiqadi, yuz chap cheti qirraning tik
chizig'i; plash ustidan o'tgan yaqin qor (bizda qor figuraning ortida); plash burmalari
ingichka diagonal chiziqlar (bizda 1-kadrda ovallar); 1-kadr kapyushoni (pona uchi 6..10
tasvirda ~8 px pastroq).
