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
ushlangan juftlarda harakat 0.25..0.50, qaynash 1.25..1.50 (misol 0.00). Birinchi
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
- 10-o'tish: 1-kadr tezlanishi (tendensiya) +14.6% edi, misol +14.3% — deyarli
  aniq. Yuz titrog'i olib tashlangach +39.4% bo'ldi. Sabab: ushlangan juftlardagi
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

Natija: figura siluet IoU 0.70 → 0.87 (titroqsiz 0.88), figura xaritasi IoU
0.92 → 0.95.

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

---

## Bir o'tish tartibi

1. `kalibr` — hammasi PROVEN.
2. Titroqsiz render → `zond` (hamma tasvir) va `siluet`: eng katta farqlar.
3. Har biri uchun varaq/setka/L jadvali: zond nimaga tegdi (7-qoida), nima o'qildi
   (8-qoida).
4. Tuzatish modelning o'z parametrlarida, o'lchangan son bilan; shakl — moslash
   bilan (9-qoida).
5. Qayta o'lchash: o'sha zond, qo'shnilari, `harakat`, `ritm`, `xarita`, `yopilish`.
6. Oddiy (titroqli) render bilan tekshirish; oldin/keyin varaqasi (`eski` qatori).
7. Kartaga yozish: nima o'lchandi, oldin/keyin raqami, nima ochiq qoldi.

## 10-o'tish hisobi (1-kadr, 11 tasvir)

| o'lchov | oldin | keyin | misol |
|---|---|---|---|
| figura siluet IoU (o'rtacha) | 0.697 | 0.871 (titroqsiz 0.881) | — |
| figura xaritasi IoU | 0.92 | 0.95 | — |
| qo'l uchi x (tuzatilgan zond bilan) | −8..+5, o'rtacha \|farq\| 3.00 | −1..−4, o'rtacha 2.36 | — |
| ushlangan juftlar harakati | 0.25..0.50 | 0.00 | 0.00 |
| qattiq nishonlar (1..6) | −1.1..+1.1 px | 0.0 px | — |
| og'iz zondi x, o'rtacha \|farq\| (1..11) | 1.66 | 0.71 | — |
| uzoq ko'z o'rtacha \|farq\| x / y | 1.11 / 0.98 | 0.50 / 0.58 | — |
| iyak osti ustuni L | 19 | 8 | 7..9 |
| 1-kadr tendensiyasi | +14.6% | +39.4% | +14.3% (sabab: soch — ochiq) |

Ochiq (keyingi — soch o'tishi): yaqin tutamning yuz ustidagi "(" massasi (6..9),
uzoq yondagi tutamlar orasidagi osmon, ushlangan tasvirlardagi soch qimirlashi,
yaqin ko'zdan tutamning sirg'anishi (langar x +1.2..+3.5).
