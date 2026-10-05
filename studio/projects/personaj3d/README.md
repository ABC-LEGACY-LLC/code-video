# personaj3d

Uslub sinovi: xuddi o'sha "qalpoqli personaj, tungi qor" g'oyasi, lekin kadrma-kadr chizish
o'rniga **3D sahna + almashtiriladigan style qatlami** (three.js). Maqsad — uzun film (≈30 daqiqa)
uchun ish tezligi: fizika (kamera, yopilish, soyabonning sochga tushishi, chuqurlikdagi qor)
sahnadan o'zi chiqadi, ko'rinish esa bitta fayl bilan almashadi.

## Uslub — qanday qurilgan (manbadan sanalgan)

- `src/` da 9 manba fayli, 2 098 satr, 149 204 bayt, 57 funksiya (`loyihalar/tools/sanoq.mjs` `count()`; 10-o'tishdan keyin).
  Diqqat: o'sha asbob renderer'ni `canvas2d` deb o'qiydi — u faqat `webgl2` satri yoki 2D
  kontekstni taniydi; bu yerda WebGL2 ni three.js `WebGLRenderer` ochadi, 2D kontekst esa faqat
  yuz chizmasi teksturasi uchun. Loyiha repoga kartasi bilan kirishidan oldin asbobga three.js
  qoidasi qo'shilishi kerak.
- Personaj kodda noldan: bosh — aylanma jism (har balandlikda kesim: old yarmi superellips, orqasi ellips;
  old profil misol nuqtalariga moslangan, 4-o'tish; pastki yuz va jag' kesimlari barcha kadrlarga birga, 9-10-o'tish);
  yuz (ko'z, qosh, og'iz) — kanvasda chizilgan tekstura, bosh fazosida tekis proyeksiya (yaqin ko'z -- sirtdagi karta,
  ko'rinishga bog'liq emas, 9-o'tish); soch — 47 tutam (6-o'tish: 28 yelpig'ich -- tojdan ko'tarilib oldinga-pastga
  egiladi, 7 qisqa peshona, 3 yaqin yon, 3 uzoq yon, 6 orqa; 9-o'tishdan bitta dam shakli), har biri elliptik kesimli naycha,
  prujina-suyak fizikasi (dam holati og'irlik va shamol tomon egiladi, bosh sferasi bilan to'qnashuv), soyalash
  "massa normali" bilan (soch bitta hajm kabi yoritiladi); kapyushon — parametrik qobiq,
  yuz teshigi balandlikka bog'liq, tepasi bosh bilan, pasti tana bilan chiziqli aralash; joylashuvi bosh POZASIDAN
  (9-o'tish: 3 kalit poza orasida Gauss og'irliklari, kechikish bilan -- shotdan emas);
  plash — burmali qobiq.
- Sahna: dunyo osmon gradienti; 44 244 qor zarrasi -- barcha kameralarni o'rab olgan dunyo hajmi (9-o'tish), figuraning
  oldida ham, orqasida ham; zichlik yerdan balandlikka qarab eksponent kamayadi (uchirma qor qatlami, zarra yo bor yo yo'q);
  3 kamera (`old`, `pastdan`, `yon`), harakat jadvali 5 s.
- Film = shotlar ro'yxati (`src/film.js`): har shot -- tasvir soni, kamera (orbita: az, el, masofa, fov +
  linza siljishi `ekran` -- kompozitsiya ko'rish burchagidan alohida), ushlangan tasvirlar, `poza(i)`.
  30 daqiqalik film ham shu shaklda yoziladi.
- Style qatlami: `src/style/<nom>.js` — rol → material, kontur, osmon, qor, kompozit, timing
  (`adim`). Sahna, personaj, harakat kodi style ni bilmaydi.

| style | nima | timing | render (960×540, GPU siz) |
|---|---|---|---|
| `anime` | 2 pog'onali cel, rim, teskari qobiq kontur, glow + pastki nur + don; palitra misol tonlariga qarab tanlangan (40-tasvirda, 320×180 L median: kapyushon 32 — misol 19, astar 43 — misol 43..48, yuz 68 — misol 59, osmon 19 — misol 2..6, yorug' soch 109 — misol ~100: glow, qor va pastki nur qorong'ini 10..13 ga ko'taradi) | 2-tasvirda ushlab turish | 0.55 s/tasvir |
| `siyoh` | qog'oz, qora siyoh, 45° nuqtali rastr, qora matoda oq nur chizig'i, qog'oz tolasi | 2-tasvirda | 0.37 s/tasvir |
| `akvarel` | silliq 3 pog'ona, sovuq soyalar, Kuwahara (r 3), pigment cheti, qog'oz donadorligi | har tasvirda | 1.19 s/tasvir |

## Ishlatish

```
npm install
node render.mjs --style anime --kamera old --kadrlar 0-59 --chiq kadrlar/anime
node render.mjs --style anime --kamera pastdan --kadrlar 60-119 --chiq kadrlar/anime
python3 test/topshiriq3d.py        # GIF (tez ochiladi); MP4 kerak emas
```

Sahifa: `index.html?style=anime&kamera=old` (`&jonli=1` — brauzerda aylanadi, `&gizla=kapyushon`
— tekshiruv uchun rolni yashirish). `window.kadr(n)` — n-tasvirni aniq chizadi (fizika 0 dan
ketma-ket).

## misol22 -- misolning vaqti va sahnalashtirishi (o'lchangan)

`node render.mjs --film misol22 --style anime --kadrlar 0-21 --chiq kadrlar-misol/anime`, keyin
`python3 test/topshiriq3d.py` -> `chiqish/oldin-hozir-3d.gif` (MISOL | OLDIN 2D 12-o'tish | HOZIR 3D).
Ikkala tomon bir xil kod bilan, 320×180 LANCZOS, L:

| o'lchov (asbob) | misol | 3D |
|---|---|---|
| yorug' massa markazi, 1-shot (`test/kompoz.py`) | (0.32, 0.22), 3.0 % | (0.33, 0.21), 3.3 % |
| 2-shot | (0.45, 0.31), 4.3 % | (0.46, 0.31), 4.2 % |
| 3-shot | (0.58, 0.54), 1.7 % | (0.58, 0.58), 3.2 % |
| kesish juft farqi 11→12 / 13→14 | 18.9 / 18.3 | 17.9 / 18.7 |
| shot ichidagi juft farq (median) | 9.3 | 10.6 |
| qor: zarra soni, o'ng 55 % (`test/qor_olch.py`) | 750 | 788 |
| qor: 4 balandlik tasmasi (tepadan) | 96 / 171 / 224 / 258 | 91 / 152 / 249 / 296 |
| qor: maydon mediani / cho'qqi L | 2.0 px / 94 | 2.0 px / 106 |
| qor harakati, o'ng qism (taqqos `harakat`) | (+1.0, −1.0) px/tasvir | (+1.0, −1.0) |
| fon L, 4 tasma | 6 / 17 / 34 / 51 | 13 / 19 / 38 / 51 |

Shu o'tishda tuzatilgan (o'lchovdan): 1-shot kamerasi yuzni kameraga burib qo'ygan edi (misolda 3/4,
o'ngga qaraydi) -- orbita kamerasi va burilish ishorasi; kapyushon teshigi yon ko'rinishda yuzni yopardi --
teshik qirrasi quloq ortiga (106°), ichi chetdagi astar tasmasidan (0.18 birlik) tashqari soyada; qor 5
barobar siyrak edi va yaqin zarralar katta xira disk bo'lardi -- zichlik, o'lcham chegaralari; qor
harakati ishorasi xato yozilgan edi (misolda qor TEPAGA suriladi).

## Audit 1 (misol22, 3D vs misol vs 2D 12-o'tish) -- `test/audit3d.py`, `chiqish/audit-3d.png`

Asboblar: taqqos `kalibr` -- hammasi PROVEN; `ton_sinf.py --kalibr` PROVEN. Determinizm: bir tasvir ikki
marta render -- 518 400 pikseldan 0 tasi farq; to'g'ridan-to'g'ri `kadr(14)` va 0..21 ketma-ket -- 0.
3D da aniq rol niqoblari (`?style=rol`, `kadrlar-misol/rol`) -- har pikselning qaysi qism ekani ma'lum.

| o'lchov | misol | 2D (oldin) | 3D (hozir) |
|---|---|---|---|
| figura massasi IoU, 1-shot / 3-shot (yopilish xaritasi; 3D -- aniq niqob) | -- | 0.94 / 0.92 | 0.53 / 0.42 |
| figura maydoni, 3-shot (kadr ulushi) | 0.58 | 0.61 | 0.33 |
| ton sinf massasi IoU: tashqi / astar / ichi / yuz / soch | -- | .76 / .29 / .31 / .48 / .49 | .46 / .03 / .01 / .20 / .22 |
| kapyushon tashqi L (rol niqobi, median) | 19 | -- | 40 (26..49) |
| kapyushon ichi L | 7..9 | -- | 44 (orqa rim yorug'ligi ichga tushadi) |
| astar tasmasi L | 43..48 | -- | 35 |
| yuz L / soch L / osmon tepasi L | 59 / 100 / 2..6 | -- | 65 / 105 / 13 |
| figura ustuni, 12-tasvir x=230, tepadan pastga L | 19..21 tekis | -- | 23 -> 50 (pastki nur figuraga ham) |
| ushlangan 1..6: figura ichida o'zgarish | faqat soch | faqat soch | butun figura (har tasvir yangi don) |
| 6->7 juft (ushlash tugashi), figura ichi | 4.18 | 2.68 | 1.06 |
| 1-shot yorug' massa y, 1 -> 11 | 0.23 -> 0.21 (ko'tariladi) | -- | 0.20 -> 0.20 |
| 3-shot juft o'zgarish, birinchi / oxirgi | 3.6 / 0.7 | 3.6 / 1.1 | 8.1 / 1.7 (kapyushon bosh bilan aylanadi) |
| 3-shot yorug' massa maydoni | 3.0 -> 1.1 % (bosh soyaga kiradi) | -- | 3.2..3.7 % |
| qor: 3-shot tepa / past chorak | 77 / 246 | -- | 61 / 365 |
| qor: figura ustidagi zarra (osmonga nisbatan) | 7..9 % | -- | 14..22 % |
| eng katta zarra maydoni (320 da) | 60 | -- | 98 |
| soch uchlari, ushlangan juftlarda (960 px) | shamolda doim | -- | 18.9 -> 3.0 (dam holatidan tushib o'tirish, shamol emas) |

Yangi ko'z (kod ko'rmagan agent, faqat tasvirlar) topgani va tekshirilgani: yon ko'rinishda bosh "quti" --
yassi to'rtburchak = ichki soch qopqog'i (rol niqobi: `sochIch`, astar emas); profilda burun/lab/iyak yo'q;
uzoq ko'z oq qismi yonoq chetida "o'roq" (yuz teksturasi tekis proyeksiya -- sochsiz renderda tasdiqlandi);
1-shotda kapyushon bosh tepasini yopmaydi (bosh va kapyushon orasida osmon); bo'yin/yoqa hech tasvirda yo'q;
qorong'i joylar "qumqog'oz" (don); soch tutamlari "muzli dubulg'a"; yuz konturi qiya joyda uziladi.
Rad etilgani: "soch umuman qimirlamaydi" -- qimirlaydi (yuqoridagi jadval), lekin bu shamol emas, tushib
o'tirish; "pastdan to'ldiruvchi yorug'lik" -- yo'q, ikkita yorug'lik (old-o'ng-tepa kalit, orqa-chap rim).

## 2-o'tish (audit 1 bo'yicha ish) -- `chiqish/oldin-hozir-3d-2.gif` (MISOL | OLDIN 3D topshirilgan | HOZIR)

Nima qilindi (har biri o'lchov bilan):
- **Style (anime):** pastki nur post-dan osmonga ko'chdi (figuraga tushmaydi); don olib tashlandi; rim faqat sochda;
  astar tasmasi doim yorug'; palitra rol niqoblari bilan sozlandi.
- **Kapyushon:** boshning aylanishiga 35 %, siljishiga 80 % ergashadi (bosh uning ichida egiladi, u bilan cho'kadi);
  teshik bosh tojidan boshlanadi (tepani yopadi); soya xaritasi -- kapyushon boshga, sochga soya tashlaydi.
- **Kiyim massasi:** kapyushon/plash/gavda parametrlari misolning figura massasiga moslandi (`test/fit_kiyim.mjs`,
  Nelder-Mead, rol niqoblari, 1- va 3-shot birga; chegaralar anatomik -- 1-urinish gavdani 2.8 birlik orqaga surgan).
- **Bosh:** V jag', iyak, yuz tekisligi, burun, lablar; soyalash normallari katta shakldan (cel chegarasi toza).
- **Kameralar:** yuz nuqtalariga moslandi (`test/fit_kamera.mjs`: 1-shot yaqin ko'z -- langar zondi, iyak; 2-3-shot
  yaqin ko'z, masshtab ko'z-iyak masofasidan); 3-shot pozasi -- bosh orqaga va pastga cho'kadi (misol ko'z izi).
- **Kalit yorug'lik** past (~20 gr): kapyushon ichidagi yuz va soch yoritiladi (tepadan bo'lsa, kapyushon yopardi).
- **Fizika:** soch 1/120 s ichki qadamlarda (film 60 ms ham, 24 fps ham bir xil), har shot boshida oldindan aylantiriladi;
  shamol po'rtanali (ushlangan tasvirda soch qimirlaydi).
- **Qor:** 27 000 zarra, chuqurlik -28 gacha, kameradan 3 birlikkacha zarra yo'q, qatlam qalinligi 7; drift 1.13 birlik/s.
- **Harakat:** 1-shot poza ulushi misolning juft farqlaridan (6->7 da rasm o'zgaradi).

| o'lchov | misol | 3D 1-o'tish | 3D 2-o'tish |
|---|---|---|---|
| figura massasi IoU 1 / 3-shot (aniq niqob) | -- | 0.53 / 0.42 | **0.89 / 0.84** (2D: 0.94 / 0.92) |
| kapyushon tashqi / ichi / astar L | 19 / 7..9 / 43..48 | 40 / 44 / 35 | **19 / 8 / 46** |
| yuz / soch / osmon tepasi L | 59 / 100 / 2..6 | 65 / 105 / 13 | **58 / 100 / 2** |
| figura L, 12-tasvir, tepadan pastga 4 tasma | 19..21 | 23 -> 50 (x=230 ustun) | **18 / 19 / 19 / 19** (rol niqobi) |
| qor soni / tasmalar | 750 / 96-171-224-258 | 788 / 91-152-249-296 | **745 / 108-163-216-258** |
| fon tasmalari | 6 / 17 / 34 / 51 | 13 / 19 / 38 / 51 | 2 / 14 / 40 / 52 |
| qor drifti | (+1.0, -1.0) | (+1.0, -1.0) | (+1.0, -1.0) |
| ushlangan 1..6, chap 40 % energiya | 0.061..0.104 | 0.19..0.25 (don + osmon) | **0.040..0.104** |
| 6->7 figura ichi farqi | 4.18 | 1.06 | **4.09** |
| yaqin ko'z, 320 px: 1-shot / 2-shot / 3-shot 14 / 22 | (97.6, 46.3) / (138, 77) / (172, 83) / (158, 113) | (142, 61) / (197, 88) / (202, 113) / (209, 169) | (106, 46) / (138, 77) / (172, 83) / (158, 113) |

Render: 960x540 da 0.71 s/tasvir (22 tasvir ~16 s).

## 4-o'tish: yuz (og'iz, ko'z, qosh, detallar) -- `chiqish/oldin-hozir-3d-yuz.gif`, `chiqish/yuz-varaq-4.png`

Kapyushon keyinga qoldirildi (foydalanuvchi). Faqat texnika o'lchandi -- o'rin, o'lcham, ton, vaqt; chizma bizniki.
- **Bosh v3** (`src/personaj.js` `boshShakli`): v2 sfera deformatsiyasi pastki yuzni oldinga chiqara olmasdi. Ikki
  ko'rinishdan uchburchaklash (`test/uchburchak.mjs`, render yo'q): misolda burun, og'iz, iyak ko'zdan 0.1..0.4 birlik
  oldinda; 3/4 da old kontur tik (x 130), jag' osti gorizontal (y 108.5). Yangi bosh -- aylanma jism, old profil 13
  parametr bilan (`test/fit_yuz3.mjs`, Nelder-Mead, node da -- sahifa proyeksiyasi bilan 0.00 px): 1-shot nuqtalar va
  silueta chetlari RMS 0.46 px. Jag' osti orqaga ko'tariladi (pastdan ko'rinishda gorizontal chiziq).
- **Ko'z:** oldingisi ~2 barobar katta, oq sklerali edi (qorong'i yadro 4x10 px). Endi qorong'i massa 12x11 px, n 69
  (misol 10x11, n 69..75): sklera deyarli ko'rinmaydi, qovoq qalin, kamalak tepasi qora, 2 xira nur; ichki-pastki
  qirrada yosh ko'lmagi. Yumuq ko'z -- qalin to'g'ri chiziq (13x3 vs misol 11x3). Chizma markazi va qorong'i massa
  markazi farqi (-1.75, -2.4 px) o'lchandi va hisobga olindi.
- **Og'iz / lab soyasi:** mayda qizil belgi o'rniga qorong'i chiziq (8x2 px) va ostida lab soyasi.
- **Burun qirrasi** yorug' chiziq (misolda uzoq ko'z ostidan burun uchiga yoy: bu 1-shot kamerasida burun qirrasi).
- **Yuz rimi:** old kontur, jag' osti -- yorug' ingichka chiziq (geometrik normal, dFdx); yuzdan qora kontur olindi
  (misolda yuz qorong'i kontursiz).
- **Ko'z yoshi:** A (1-6, ko'z ostidan tik, pastga siljiydi), B (5-11, yonoq bo'ylab), C (7-9, jag'dagi halqa), tushayotgan
  tomchi (10-11) -- misolning L>70 komponentlari bosh/dunyo fazosiga o'tkazilgan (`test/yosh_olch.mjs`).
- **1-shot pozasi** har tasvirda yuz nuqtalariga (`test/fit_poza1b.mjs`); 7-11 da misol pastki yuzni oldinroq chizadi --
  `profil` vazni (0.2..0.3). **2-shot** kamerasi profil nuqtalariga (d 11.0; RMS 2.0 px, profil vazni 1).

| zond (1-shot, o'rtacha abs farq, px) | 2-o'tish | 4-o'tish |
|---|---|---|
| iyak oldi (y+52) | 18.41 | **1.28** |
| jag' osti x+8 / x+20 / x+28 | 7.34 / 14.26 / 14.54 | **1.60 / 0.85 / 0.98** |
| old kontur y+20 / y+30 | 6.09 / 12.53 | **1.32 / 1.42** |
| og'iz x / y | 3.54 / 0.94 | **1.58** / 1.09 |
| lab soyasi x / y | 2.65 / 0.59 | **0.41** / 0.70 |
| uzoq ko'z x / y | 2.17 / 3.77 | **1.16 / 2.16** |
| yosh (yonoq) x / y | 7.71 / 7.25 (6-7 da yo'q) | **0.64 / 1.02** (hammasida bor) |
| yosh (jag') x / y | 3.73 / 3.60 (11 da yo'q) | **0.73 / 0.85** |
| yaqin ko'z (langar), 1-11 | 3.2 (x) | **<= 1.3** |

Regressiya tekshiruvi (`test/audit3d_yuz4.json`): tonlar o'zgarmadi (yuz 58, soch 99, kapyushon 19 / 46 / 8); figura
IoU 0.888 -> 0.902 (1-shot), 0.839 -> 0.850 (3-shot). Yomonlashgani: 6->7 figura farqi 4.09 -> 1.61 (misol 4.18) -- yuz
nuqtalari 6->7 da deyarli qimirlamaydi, 2-o'tishdagi katta burilish ko'zni 9.5 px surardi; misoldagi energiya soch va
yosh o'zgarishidan (soch -- kelishilishi kerak). Kesishda yorug' massa 11->12: 0.64 -> 0.38 (misol 1.05) -- 2-shot
kamerasi yuzga moslanib figura kichraydi; misolda 2-shot sochi katta (soch).

## 5-o'tish: sahna -- misol qayerga qaraydi, kamera qayerda -- `chiqish/oldin-hozir-3d-sahna.gif`, `chiqish/sahna-audit-5.png`

Sabab (foydalanuvchi): "bizniki yonga qaraydi, misol pastga" -- yuz detallari sahna (bosh yo'nalishi, kamera) tushunilmay
moslangan edi. Tartib endi: avval har shotda misol NIMA QILADI, QAYERGA QARAYDI, KAMERA QAYERDA (3D da tiklanadi), keyin
detallar. Bitta ko'rinish faqat bosh va kamera orasidagi NISBIY yo'nalishni beradi: kamera balandligi <-> bosh egilishi va
yonga og'ishi, azimut <-> burilish almashinadi. Mutlaq qiymat "bosh burilmagan/og'magan" tamoyili, kesishlar orasidagi
voqea va boshqa belgilar (fon, soch osilishi, tomchi) bilan tanlandi. Hamma moslash render siz (node, `test/proyeksiya.mjs`;
sahifa bilan 0.0 px -- `test/sahifa_tekshir.mjs`), natija renderda BIR XIL KOD bilan qayta o'lchandi (`test/audit_misol/sahna_olch.py`).

| shot | misol nima qiladi | qayerga qaraydi | kamera | dalil |
|---|---|---|---|---|
| 1 (1-11) | qorda yig'laydi; 1-6 bitta rasm (faqat soch, yosh); 10-11 ko'z yumiladi, bosh profilga | oldinga-o'ngga, bosh ~17 gr tepaga, ko'z ochiq | o'ng-oldda (az 55), sal pastda (el -8), 7 | 5 nuqta + kontur + jag', RMS 0.6 px (`test/sahna_fit.mjs`) |
| 2 (12-13) | eng tinch juftlik, ko'z yumuq | oldinga, bosh TEKIS (~5 gr tepaga); yumuq ko'z chizig'i oldinga 17 gr pastga og'gan | o'ng yonda (az 84), el -5, 12.9 | old kontur 21 qator + iyak osti, RMS 1.33 px (`test/sahna2_fit.mjs`) |
| 3 (14-22) | boshini kapyushon ichiga egadi; 14 oraliq rasm, 15-18 ko'z 5.5 px tushadi, keyin joyida | PASTGA: bosh ~39 gr egilgan, ko'z yarim ochiq, pastga | o'ng-oldda (az 55), PASTDA (el -30), 7.1 | ko'z + iyak 7 qator + jag' osti, RMS 0.88 px (`test/sahna3_fit.mjs`, `test/sahna3_harakat.mjs`) |

Topilgan xatolar va tuzatish:
- **2-shot:** poza profil yuz NUQTALARIGA (ko'z, burun, og'iz, iyak) moslangan edi va profil vazniga bog'langan pastki yuz
  surishi (0.4) bilan -- 4 nuqta RMS 2.0 px, lekin butun old kontur RMS 9.9 px (maks 19.5): yuz ~20 gr TEPAGA og'gan edi.
  2D egri moslash: surish bilan kontur faqat bosh 15 gr EGILGANDA tushadi, surishsiz bosh tekis bo'lganda (RMS 1.35).
  Misolning profildagi farqi pastki yuzda emas, KO'ZDA: ko'z bizning 3/4 o'rnimizdan 17.5 px (0.6 birlik) orqada, 5 px
  yuqorida (anime profil ko'zi, bosh yon tomonida). Endi: surish yo'q, yaqin ko'z chizmasi sirt bo'ylab KARTA bilan
  ko'chadi (`kozKarta`, `KOZ_PROFIL` -- teskari proyeksiya bilan o'lchangan; w=0 da tekis proyeksiyaning o'zi, 0.0014 birlik).
  Renderda: kontur 21 qatorda -2..+1 px (RMS 1.1; oldin -10..0), ko'z -0.9/-0.1 px.
- **3-shot:** kamera yonda (az 80, el -5), bosh 9..17 gr -- profilda tik, "yonga qaraydi"; renderda ko'z va iyak misol
  joyida yo'q edi (ko'z qutisida qorong'i chiziq yo'q -- L 38; iyak qatorlari plash ortida). Model nuqtalari "2.5 px" degan
  -- okklyuziyani bilmaydi: sahna renderda tekshirilishi SHART. Endi: ko'z izi 15-22 da +-1-2 px, iyak cheti +-1-3 px.
- **1-shot 7-11:** surish endi alohida (`poza.surish`): 7-9 da 0.15, 10-11 da 0.3 -- misol shu rasmlarda old konturni
  ko'zdan oldinroq chizadi (chet ko'zdan oldin keladi); qayta moslash `test/fit_poza1c.mjs` (nuqtalar RMS 2.0-2.5 px,
  kontur <= 4.8 px). 1-11 yuz zondlari o'zgarmadi (+-1-2 px, `test/zond_sahna5.json`).
- **Profil vazni** endi BOSH fazosida (`profilVazn`): egilgan boshda dunyo gorizontal burchagi 60 gr, bosh ko'radigani 49.
- **Fon:** misolning foni 2D qatlam (qor zichligi gradienti 11.7->35.4 / 12.5->37.6 / 10.4->34.0, zarra harakati uch
  shotda bir xil). 3-shotda kamera 30 gr pastdan qaraganda bizning dunyo gradienti qora osmon berardi -- endi gradient
  va qor zichligi `uBgUp` bo'yicha (kameraning 1-shotdan ortiq tepaga qarashi qadar og'adi; 1-shotda o'zgarmaydi).

Ritm (`taqqos ritm`, oddiy render): kesishlar 12 va 14 da (misol ham); 3-shot juftlari 0.335 -> 0.178 (misol 0.348 -> 0.286).

## 6-o'tish: soch -- massa va qoplash -- `chiqish/oldin-hozir-3d-soch.gif`, `chiqish/soch-audit-6.png`

Sabab (5-o'tish auditi): 1-shotdagi "yonga qaraydi" taassuroti sahnadan emas, SOCHDAN edi -- yaqin ko'z ortida ochiq teri
28-33 px (misol 1-9), peshona ochiq (ko'z ustida 15-23.5 px teri, misol 1-4.5), soch boshga yopishgan yupqa qalpoq.
Rasm -- misolniki faqat texnika uchun: soch chizmasi va tutam shakli bizniki, misolning MASSASIGA moslangan.

Asboblar (ikkala tomonda bir xil kod, 320x180 LANCZOS, kompozitsiya niqobi L>=90 top-hat bilan):
- `test/audit_misol/soch_qoplash.py` (yangi) -- misolning yorug' sochi bizda NIMAGA tushadi (rol renderidan aniq: teri,
  soch, ichki qopqoq, kapyushon, fon) va aksincha; 1-shot mintaqalari (yaqin yon / peshona / uzoq yon). Kalibrlangan:
  misol o'zi bilan -- 100 %, 5 px surilgan -- 56 %; rol sinflari sintetik niqobda aniq.
- `test/audit_misol/soch_olch.py` -- M1 yorug' massa, M2 ko'z ortidagi teri, M3 peshona terisi, M4 profil ko'zi ustida soch.
- `test/olcham.mjs`, `test/soch_dam.mjs` -- misolning ekrandagi o'lchovini bosh fazosiga o'tkazish (shot kamerasi,
  node proyeksiya); `?tutamlar=guruh` -- tutam guruhlari rangda (qaysi tutam qayerda).

Misolda o'lchangani (bosh fazosida): 2-shotda (profil, bosh tekis) keng yorug' massa tojdan ~1 birlik yuqorida (alohida
uchlar 1.5 gacha), peshona balandligida peshonadan ~1 birlik OLDINDA, qosh balandligida 0.4 oldinda, ko'z qatorida yuz oldi
ochiq; yaqin yon massa ko'z ortida iyak ostigacha. Misolda qor o'ngga-tepaga siljiydi -- shamol orqadan: soch oldinga-tepaga
taralgan. 3-shotda (bosh 39 gr egilgan) yorug' massa yuz OLDIDA (y ~0, z ~1.3). Bitta 3D shakl uchala shotni tushuntiradi.

Qilingani (`src/personaj.js` SOCH, `tutamlarDizayni`, fizika; `src/main.js`; `src/style/anime.js`, `umumiy.js`):
- Yangi soch dizayni: yelpig'ich (uchlari 2-shot chegarasi bo'ylab), qisqa peshona (3/4 da ko'zgacha, profilda qosh
  ustida), yaqin yon (3/4 da ko'z ortidan jag' ORTIGA; profilda bosh yonida -- anime usuli, 5-o'tishdagi ko'z kartasi
  kabi), uzoq yon (oldinga taralgan).
- Fizika: dam shakli og'irlik (osil) va shamol (shK) tomon egiladi (`egilganDam`) -- bosh egilganda soch dunyoda osiladi.
- Soyalash: massa normali (`aSochN`, bosh markazidan yuqoridagi nuqtadan radial + tutam normali) -- har tutam "yarmi
  yorug', yarmi soya" tirnoq bo'lib ko'rinmaydi, soch bitta yorug' massa.
- Yaqin tutamlarning ko'rinish vazni kamera burchagidan (`sochProfil(profilVazn(70))`, ko'z kartasidan alohida):
  1-shot 1-11 -- 3/4 o'rni (misol 9-11 da ham soch yonoq ortida), 2-shot -- profil o'rni.
- Pastki yuz surishi (1-shot 7-11) yaqin tutamlarni ham suradi -- aks holda yonoq ularni kesardi (ko'z ortida 19-21 px).
- Kapyushon (minimal, soch uchun): teshik tojdan (ochV0 -0.05), toj gumbazi orqaga (surZ 0.45) -- soch cho'qqisi
  2-shotda kapyushonni teshib chiqardi; 3-shotda gumbaz oldinga sirg'anadi (`kapSirg` 0.65, shot ichida o'zgarmas).
  Figura IoU 0.902 / 0.868 -> 0.901 / 0.863. To'liq kapyushon moslashi (`test/fit_kapyushon6.mjs`) sinaldi va
  QABUL QILINMADI: maqsad funksiyasi figura IoU ni sochni ochish uchun berib yuborardi (1-shotda uzoq yon ichki yuzi).

| o'lchov (toza render, bir xil kod) | misol | 5-o'tish | 6-o'tish |
|---|---|---|---|
| 1-shot: misol yorug' sochi biznikiga tushadi | 100 % | 1 % | 49 % |
| 1-shot: yaqin ko'z ortida teri (1-9 tasvir) | 1.3-9.3 px | 28-33 | 6.3-9.3 |
| 1-shot: peshona terisi (ko'z ustida) | 1-4.5 px | 15-23.5 | 2.5-5.5 |
| 1-shot: yorug' massa | 3.01 % (104, 40) | 1.51 % (58, 35) | 5.48 % (84, 28) |
| 2-shot: ustma-ust / profil ko'zi ustida soch | 100 % / 0 | 0 % / 0.44 | 28 % / 0.00 |
| 2-shot: yorug' massa / misol sochi bizda kapyushon ostida | 4.29 % | 0.15 % / 49 % | 1.88 % / 14 % |
| 3-shot: ustma-ust / yorug' massa | 100 % / 1.74 % | 0 % / 3.13 % | 43 % / 9.60 % |
| ushlangan 1-6: chap 40 % farq energiyasi (soch qimirlashi) | 0.061-0.104 | 0.051-0.112 | 0.064-0.130 |

Regressiya (bosh geometriyasi tegilmagan): og'iz, lab soyasi, jag' osti zondlari bir xil; iyak oldi, uzoq chet, yosh
0.1-0.25 px farq (soch yaqinida); yaqin ko'z langari 3.49/1.90 -> 1.22/0.75 px; soch cheti zondlari 13-22 -> 2-12 px. Uzoq ko'z zondi 0.97 -> 2.25 px -- ZOND CHALKASHI:
uzoq ko'z ustidan endi tutamlar o'tadi va shamolda qimirlaydi (misolda ham tutam o'tadi; varaqda ko'rilgan), yuz joyida.
2-shot old kontur RMS 1.07 -> 1.50 px -- faqat 70-74 qatorlarda (peshonadagi soch konturga tushadi), 76-110 bir xil;
3-shot kontur RMS 2.68/1.77/2.00 -> 2.35/1.46/1.53, ko'z +-1 px. Ritm (GIF yo'lidan): kesish detektori endi 10 va 15 ni
ham belgilaydi -- ushlangan tasvirlarimiz misoldan kam o'zgaradi (mediana 0.229 vs 0.337, oldindan bor), bosh harakati
juftlari esa katta soch bilan oshdi: 9->10 0.340 -> 0.386 (misol 0.394), 14->15 0.338 -> 0.382 (misol 0.348).

## 7-o'tish: kapyushon -- ko'rinadigan bosh har shotda -- `chiqish/oldin-hozir-3d-kapyushon.gif`, `chiqish/kapyushon-audit-7.png`

Sabab (7-audit, `chiqish/audit-7-kadrlar.png`; foydalanuvchi: "tasvirdan tasvirga sakrash, katta-kichik bo'lish"): oldingi
zondlar faqat JOYNI o'lchardi (ko'z markazi, kontur qatori) -- o'lcham va tasvirlararo sakrash o'lchanmagan edi.
Ko'rinadigan bosh (yuz + soch, `kap_olch.py`) misolda uch shotda 6 300-7 400 / 6 600 / 4 100-5 700 px, bizda
11 800-12 900 / 4 000 / 13 500-14 100:
1-shotda boshning orqasi, qopqoq va bo'yin ochiq (misolda kapyushon ostida), 2-shotda kapyushon boshni yopadi (misolda
soch massasi kapyushon oldida), 3-shotda bosh kapyushondan tashqarida (misolda ichiga egiladi). 9->10->11 da bosh
10 gr yonga og'ib 8 gr buriladi -- ochiq bosh orqasi, qopqoq va bo'yin bilan butun siluet siljirdi (chap 40 % farq
energiyasi 0.490 / 0.427, misol 0.201 / 0.189).

Asboblar (ikkala tomonda bir xil kod, 320x180):
- `test/audit_misol/bosh_niqob.py` -- misolning ko'rinadigan boshi: median 5, L >= 40 (yuz 58-60, soya soch 45+, astar
  tasmasi 43-48; kapyushon 19-21 va osmon 4-18 tashqarida), r=3 ochish, yuz urug'iga ulangan komponent, 4 qadam geodezik
  tiklash, teshiklar to'ldirilgan; 3-shotda iyak ostidagi zich qor uchun ruxsat qutisi (varaqda tekshirilgan) ->
  `test/misol_bosh7.json`. Misoldan olingan niqob: faqat ish joyida, ommaviy repoga KIRMAYDI (`misol_figura.json`,
  `misol_niqob6.json` kabi).
- `test/audit_misol/kap_olch.py` -- bosh IoU va maydon (bizniki rol renderidan ANIQ: teri, bo'yin, soch, qopqoq, astar),
  1- va 3-shotda figura (yopilish xaritasi bloklari, yumshoq IoU).
- `test/audit_misol/sakrash.py` -- qo'shni tasvirlar farq energiyasi (`taqqos.farq`, chap 40 %). Kalibr: o'zi bilan 0;
  chapdagi 20x20 blok -> chap 0.050 / o'ng 0.023; o'ngdagi -> chap 0.014 (normallash orqali sizadi, ikkala tomonda bir xil).
- `test/fit_kapyushon7.mjs` -- shot bo'yicha moslash (`--par` -- tanlangan parametrlar); `test/kap_v.mjs` va
  `window.kapVnuqta` -- ekran nuqtasida kapyushonning (u, v) si (tasma qayerda tugashini tanlash uchun).

Qilingani (`src/main.js`, `src/personaj.js` kapGeo, `src/film.js`):
- Kapyushon SHOT bo'yicha: `shot.kap` (KIYIM.kap ustiga) -- kesishda sirt qayta quriladi, shot ichida o'zgarmas, boshga
  KF/KT ulushida ergashadi (misolda bosh kapyushon ichida harakatlanadi); tekshiruv: `?kapShot={"1":{...}}`.
- Yangi parametrlar (hammasi shot bo'yicha): yuqori qism siljishi (butunZ, butunY), toj (surZ, surY), yuqori qismning
  vertikal o'q atrofida burilishi (bur) va bosh markazi atrofida oldinga egilishi (eg -- 3-shotda bosh 39 gr, ramka
  KF ulushida atigi 14 gr: bosh tepasi teshikdan chiqardi), teshikning ikki qirrasi alohida (ochA, ochB -- bosh
  balandligida, iyak ostida 1 ga qaytadi), astar tasmasi eni har qirrada (tasmaA/B), iyak ostida (tasmaAlt/Blt) va qayerda
  tugashi (tasmaV).
- Xato: `kiyimQur` konturning bola meshini eski (dispose qilingan) geometriyada qoldirardi -- 1-shotda bo'yin o'ngida
  katta qorong'i "parda" (6-o'tishdagi `?kiyim=` sinovlaridagi "uzoq yon ichki yuzi" ham shu edi).
- Moslash: misolning ko'rinadigan boshi <-> rol renderi IoU; figura topshirilgan darajadan pastga tushmasligi SHARTI.
  Birinchi yurishda figura 0.5 og'irlikda edi -- 3-shotda bosh IoU 0.24 -> 0.56 uchun figura 0.857 -> 0.784 (kapyushon
  tepasi oldinga surilib chap-tepa burchak osmon bo'ldi): qabul qilinmadi. Chegarada qolgan parametr erkinlik
  yetishmasligini ko'rsatdi, lekin har yangi parametr varaqda ko'rilgan aniq xato uchun qo'shildi: uzoq qirra yuz
  profilidan chiziq bo'lib chiqdi (ikki qirra); misolda yuz o'ngida ~14 px L 43-45 tasma (astar -- bizda 3 px tasma +
  qorong'i ich); tasma jag' ostida davom etdi, misolda u yerda L 7-10 (tasma jag'da tugaydi, v ~0.6).
- Chiziqni o'chirishdan OLDIN misol o'lchandi: bizning uzoq qirra tasmasi tushgan piksellarda misol L median 43
  (40-95 qatorlar) -- u misolning o'z astari; olib tashlash emas, kengaytirish kerak edi.

| o'lchov (bir xil kod) | misol | 6-o'tish | 7-o'tish |
|---|---|---|---|
| ko'rinadigan bosh IoU, shot 1 / 2 / 3 | 1 | 0.41 / 0.49 / 0.23 | 0.81 / 0.62 / 0.69 |
| biz / misol maydoni, shot 1 / 2 / 3 | 1 | 1.75 / 0.61 / 3.03 | 1.05 / 0.65 / 1.09 |
| figura (silueta, yumshoq IoU), shot 1 / 3 | 1 | 0.900 / 0.864 | 0.928 / 0.884 |
| sakrash 9->10 / 10->11 (chap 40 %, GIF yo'lidan) | 0.201 / 0.189 | 0.490 / 0.427 | 0.307 / 0.267 |
| kesish 11->12 / 13->14 | 0.571 / 0.320 | 0.893 / 0.512 | 0.658 / 0.308 |
| ushlangan 12->13 | 0.025 | 0.116 | 0.128 |
| ushlangan 3-shot 15->22 | 0.059-0.083 | 0.037-0.067 | 0.009-0.039 |
| astar tasmasi zondi (yuz o'ngida, 1-shot) | 0 | -86 % | 11.6 % (o'rt. farq) |
| misol yorug' sochi biznikiga tushadi, shot 1 / 2 / 3 | 100 % | 49 / 28 / 43 % | 48 / 28 / 4 % |

Regressiya (yuz zondlari, toza render): ko'zlar, og'iz, lab soyasi, yuz toni, ko'z yoshi -- aynan bir xil; yaqin ko'z
langari 1.22/0.75 -> 0.39/0.17 px, iyak oldi 1.46 -> 1.15, uzoq chet 1.33/1.81 -> 0.99/1.44, soch chap cheti (y -6)
11.9 -> 4.5 px; jag' osti x20/x28 0.66/0.92 -> 1.15/1.33 px (tasma jag' ostida davom etgan variantda bitta tasvirda
14.5 px edi -- zond sharti "<45" tasmaning L 45 iga tegardi). Qo'l uchi zondi: oldin "topilmadi", endi kapyushon/plash
qorong'isiga ulanadi -- bizda qo'l yo'q (oldin ham), zond chalkashi.

OCHIQ qolgani (halol):
- 3-shot yorug' sochi: kapyushon endi boshni yopadi va uning SOYASI sochga tushadi -- ustma-ust 43 % -> 4 %, yorug' massa
  9.6 % -> 0.4 % (misol 1.7 %); soyasiz render 39 %. Misolda old tutamlar soyabon ostidan yorug'likka osilib tushadi
  ("parda"), bizning yelpig'ich kapyushon ichida tepaga-o'ngga qaraydi. Ko'rinadigan bosh o'rtacha toni 78.0 -> 60.9
  (misol 64.7). Soch o'tishida.
- Ushlangan tasvirlar: 12->13 0.128 (misol 0.025) -- endi yuz ortidagi yon tutamlar ko'rinadi va qimirlaydi; 3-shot
  ushlangan juftlari endi JUDA tinch (soch yopildi; misolda tutamlar va soyabon qirrasi qimirlaydi).
- 9->11 sakrash misoldan hali 1.5 barobar: qolgani yuz (pastki yuz surishi 0.15 -> 0.30) va soch (yaqin tutamlar
  almashadi) -- 10-tasvirdagi 10 gr og'ish.
- 2-shot IoU 0.62 yuz/bo'yin uzunligi (misolda yuz rangi y ~132 gacha, bizda 112; old kontur 88-112 qatorlarda bir
  xil) va tepadagi soch hajmi bilan cheklangan; 2-shotda figura xaritasi yo'q (2 tasvir) -- silueta ko'z bilan tekshirildi.
- 3-shot kapyushonida yuqori qism burilishidan (bur 0.48) burma -- cel soyada yuzdan chapda alohida qorong'i dog'
  (bur 0 da yo'q, lekin bosh ochiladi; o'tish oralig'ini kengaytirish yo'qotmadi). Misolda ham yuz yonida qorong'i pona
  bor, lekin yuzga TUTASH -- soya shakli o'lchanmagan. 1-shotda iyak o'ngida (x 128-150, y 95-125) bizda kapyushon
  paneli, misolda osmon (figura 0.928 shuni ham o'z ichiga oladi).

## 8-o'tish: kamera masshtabi va qor qatlami -- "zoom" yo'q -- `chiqish/oldin-hozir-3d-kamera.gif`, `chiqish/kamera-audit-8.png`

Foydalanuvchi: "10 dan keyin katta va kichik qilib qo'yayotgan kamera zoom ga o'xshagan siljish bor -- tuzatmasang barcha
ishingga ta'sir qiladi". Zondlar yuzni YAQIN KO'Z langariga nisbatan o'lchardi -- atrofdagi masshtab o'zgarishini hech biri
ko'rmasdi. Yangi asboblar (ikkala tomonda bir xil kod, kalibrlangan):
- `test/audit_misol/masshtab.py` -- qo'shni tasvirlar orasida chap 45 % (kapyushon, bosh, soch) ning affin moslashi (ECC)
  -> masshtab. Kalibr: o'zi 1.0000, 1.02 zoom -> 1.0203, 0.98 -> 0.9799. 3-shotda chap qism bir tekis kapyushon -- beqaror.
- `test/audit_misol/qor_zoom.py` -- qor: zichlik (zarra / 10k px, personajdan o'ngdagi fon qutisida), o'lcham (p90/p99),
  siljish va divergensiya (3x3 katak, affin; kalibr 1.02 -> +0.038), kesishda uzluksizlik (fazaviy korrelyatsiya r).
- `test/audit_misol/kap_olch.py` -- endi 2-shot figurasi ham (`test/misol_figura8.json`: k12-13 yopilish xaritasi).

Topilgani -- uchta alohida sabab:
1. **1-shot 9 -> 10 -> 11:** figura mintaqasi masshtabi 0.924 / 0.970 (misol 0.995 / 0.985) -- kadr kichrayadi. Bosh
   burilganda kapyushon unga 0.35 ulushda ergashib, qirrasi bosh orqasini yopib borardi (ko'rinadigan bosh 7093 -> 6658 ->
   6094 px; misol 7400 -> 6813 -> 7031). Endi kapyushon shot ICHIDAGI aylanishga alohida ulushda ergashadi (`kap.kfIch`;
   shot boshidagi pozaga -- KF): 1-shotda 0.2 (skan 0..1: bosh IoU eng yaxshi, 0.802 -> 0.809), 3-shotda 0.35 qoldi (skanda
   eng yaxshisi). Natija: 1.007 / 0.999, ko'rinadigan bosh 7253 -> 7151 -> 6862 px.
2. **2-shot kamerasi 20 % uzoq edi.** 5-o'tishda masofa pastki yuz konturiga (burun..iyak, 21 qator) moslangan -- butun
   bosh va kapyushon kichik chiqdi: figura maydoni 0.407 (misol 0.509; misolda 1 -> 2 -> 3 shotda figura O'SADI 0.431 ->
   0.509 -> 0.578, bizda 2-shotda kichrayardi), ko'rinadigan bosh 4 300 px (misol 6 620). Kamera figura va bosh
   siluetiga qayta moslandi (`test/fit_kamera8.mjs`; burchaklar va poza qat'iy): d 12.88 -> 10.32, ekran [0.422, 0.474];
   1- va 3-shot shu moslashda o'zgarmadi (d 7.03 -> 7.034, 7.10 -> 7.17 -- qoldirildi). 2-shot kapyushoni yangi kamerada
   qayta moslandi (endi 2-shot figura xaritasi bilan).
3. **Qor har shot kamerasida qayta chizilardi.** Misolda qor BITTA 2D qatlam: kesishda davom etadi (11->12 r 0.71, 13->14
   r 0.69), zichligi uch shotda 271 / 273 / 272. Bizda 195 / 294 / 193 (2-shotda kamera qor qutisidan tashqarida -- zarra
   maydalashib zichlashadi: "uzoqlashdi"), kesishda r 0.12 / 0.03. Endi qor 1-shot kamerasi fazosida hisoblanadi va har shotga
   o'xshashlik bilan ko'chiriladi (`main.js` `qorQatlam`: fov, ekran siljishi qoplanadi, chuqurlik d_shot/d_1 ga cho'ziladi --
   zarra bosh oldida/ortida qolishi saqlanadi, o'lcham va yaqin so'nish shunga bo'linadi).

| o'lchov (GIF yo'lidan / rol renderi, bir xil kod) | misol | 7-o'tish | 8-o'tish |
|---|---|---|---|
| figura mintaqasi masshtabi 9->10 / 10->11 | 0.995 / 0.985 | 0.924 / 0.970 | 1.007 / 0.999 |
| ko'rinadigan bosh 9 / 10 / 11 / 12 (px) | 7400 / 6813 / 7031 / 6608 | 7093 / 6658 / 6094 / 4286 | 7253 / 7151 / 6862 / 6670 |
| figura maydoni shot 1 / 2 / 3 | 0.431 / 0.509 / 0.578 | 0.441 / 0.407 / 0.646 | 0.442 / 0.531 / 0.646 |
| 2-shot: bosh IoU / biz:misol / figura IoU | 1 | 0.616 / 0.65 / 0.734 | 0.787 / 1.01 / 0.893 |
| qor zichligi shot 1 / 2 / 3 (/10k px) | 271 / 273 / 272 | 195 / 294 / 193 | 195 / 186 / 168 |
| qor kesishda uzluksiz (r) 11->12 / 13->14 | 0.71 / 0.69 | 0.12 / 0.03 | 0.88 / 0.83 |
| sakrash 9->10 / 10->11 / 12->13 (chap 40 %) | 0.201 / 0.189 / 0.025 | 0.307 / 0.267 / 0.128 | 0.291 / 0.257 / 0.043 |

3-shot qor zichligi 168 -- qatlam o'sha: bizning 1-shot qorimiz ham o'ng chetda siyrakroq (x >= 245 da 160; misol hamma
joyda 271). Regressiya (yuz zondlari, toza render): 1-shotning hammasi bir xil (+-0.2 px), astar tasmasi zondi 11.6 -> 9.9 %;
2-shotda yaqin ko'z langari +1.3 -> +1.6 px.

OCHIQ (halol):
- **2-shot yuzi endi misolnikidan ~1.25 barobar katta** (old kontur 96-112 qatorlarda 10-16 px o'ngda): misolda profil
  yuzi boshi va kapyushoniga nisbatan kichik chizilgan (1-shotda yuz ham, figura ham bir kamerada mos). Kamera katta
  massaga qo'yildi -- yuz o'tishida profil yuzi shu masshtab ichida moslanadi.
- 3-shotda qo'shni tasvirlar masshtabi 0.965..1.088 -- soch yelpig'ichining qimirlashi (varaqda ko'rilgan), kamera emas.
- Qor ko'rinishi misoldan farq qiladi: zichlik 195 vs 271, zarra p90 4.0 vs 7.3 px, tezlik 1.5 vs 2.6 px/kadr, o'ng tomonda
  siyraklashadi (misol bir tekis).

## 9-o'tish: bitta 3D dunyo -- shotga faqat kamera tegishli -- `chiqish/oldin-hozir-3d-dunyo.gif`, `chiqish/kamera-sinov-9-hozir.{png,gif}`

Foydalanuvchi: "sen 3D da qilmoqdasan ... fully 3D model qilishing kerak ki kamera o'sha example positionga kelganda 1:1
bo'lishi kerak ... 2D deb ishlov bersang kamera siljisa noto'g'ri joyi bo'lib qolish ehtimoli katta". Sakkiz o'tishda
shotga, ko'rinish burchagiga yoki kadrga bog'langan oltita qiymat yig'ilgan edi: ko'z kartasi (profil vazni), pastki yuz
surishi, soch dam aralashmasi (`sochProfil`), shot bo'yicha kapyushon va ergashish ulushi (`kap`, `kfIch`), kameraga
yopishgan qor qatlami, fon "tepasi". Har biri o'z shotida raqamni yaxshilagan, hech biri bitta shotda ko'rinmaydi.

1. **Asbob -- kamera sinovi** (`test/kamera_sinov9.mjs`, skill `media-3d-consistency-audit`): poza va vaqt ushlanadi, faqat
   kamera yuradi -- misol kameralari orasida (49 qadam) va bosh atrofida (37 qadam). Rasm emas, dunyo o'qiladi: har qismning
   sahna grafidagi nuqtalari joriy kamerada 0-tasvir nuqtalari bilan solishtiriladi (px). Kalibr: yamoqlar muzlatilganda
   hamma qism 0.0000 px; sun'iy +0.1 birlik siljish -- mustaqil kamera modelining o'zi (0.000 %).
2. **Yamoqlar birma-bir olib tashlandi**, o'rniga 3D:
   - yuz: ko'z kartasi va surish -> bitta bosh (pastki yuz kesimi barcha kadrlarning nishonlariga birga, `test/fit_bosh9.mjs`,
     RMS 2.25 -> 1.77 px), har kadr pozasi qayta moslandi, ko'z yoshi nuqtalari qayta o'tkazildi;
   - soch: `sochProfil` -> bitta dam shakli (yaqin tutam, qisqa peshona);
   - kapyushon: shot bo'yicha `kap`/`kfIch` -> bitta kapyushon (o'lchami uch shotga birga, `test/fit_kap9.mjs`) va POZAGA
     bog'liq rig (`KIYIM.kapPoza`: 3 kalit poza, kechikkan bosh pozasi bo'yicha Gauss og'irliklar, ramka kechikishi 0.1 s,
     joylashuv kechikishi 0.4 s; `test/fit_kapPoza9.mjs`, 2-shot kamerasi bilan birga: d 10.32 -> 10.80). Bitta qattiq
     kapyushon 2-shotda yuzni yopardi (ko'rinadigan bosh IoU 0.13), rig bilan 0.69. Poza yo'li sinovi (kamera ushlangan,
     poza 1 -> 2 -> 3 shot): qadamda eng katta siljish kapyushon 25 px, soch 5.3, bosh 3.0 -- sakrash yo'q. 10 -> 11
     masshtab sakrashi (1.075) joylashuv kechikishi bilan 1.008;
   - qor va osmon: kamera qatlami va fon tepasi -> barcha kameralarni o'rab olgan dunyo qor hajmi va dunyo osmon gradienti,
     uch shotga birga moslangan (`test/fit_fon9.mjs`).

| o'lchov (bir xil kod) | misol | 8-o'tish | 9-o'tish |
|---|---|---|---|
| kamera sinovi, yo'l: kapyushon / ko'z / soch / bosh sirti / qor (px, eng katta) | 0 | 114 / 33 / 73 / 6.7 / 158 | 0.00 hammasi |
| kalit almashganda bitta qadamdagi sakrash: kapyushon / ko'z | 0 | 159 / 36 | 0 / 0 |
| orbita: soch / ko'z / qor; fon tepasi (3-shot) | 0; 0 gr | 98 / 44 / 452; 22 gr | 0 / 0 / 0; 0 gr |
| ko'rinadigan bosh IoU, shot 1 / 2 / 3 | 1 | 0.81 / 0.79 / 0.69 | 0.81 / 0.69 / 0.68 |
| figura IoU, shot 1 / 2 / 3 | 1 | 0.93 / 0.89 / 0.88 | 0.92 / 0.91 / 0.89 |
| 2-shot old kontur, o'rtacha abs | 0 | 9.8 px | 2.1 px |
| masshtab 9->10 / 10->11 | 0.995 / 0.985 | 1.007 / 0.999 | 1.005 / 1.008 |
| qor zichligi shot 1 / 2 / 3 (/10k px) | 271 / 273 / 272 | 195 / 186 / 168 | 267 / 371 / 210 |
| qor uzluksizligi r: kesishda / shot ichida | 0.71, 0.69 / 0.51..0.78 | 0.88, 0.83 / 0.56..0.93 | 0.11, 0.09 / 0.57..0.76 |

Qoldiqlar (o'lchangan, yashirilmagan): 2-shot profil ko'zi misoldan 15..17 px oldinda (misol profilda ko'zni orqaroq
chizadi); misolda qor bitta ekran qatlami -- kesishdan o'tib davom etadi, dunyo qorida kesish yangi ko'rinish (shot ichida
mos); 3-shot osmoni dunyo gradientida qorong'iroq (fon profili |farq| 25 L; misol uch shotda bitta plitani ishlatadi); qor
zichligi 2- va 3-shotda 371 / 210 -- sababi ochiq. VAQTINCHA regressiya: 2-shot ko'rinadigan bosh 0.79 -> 0.69; 2-shotda
sochimiz misol yuz terisining 23..27 % ini yopdi -- kamera kapyushon bilan qayta moslangach yuz misol yuzi ustiga tushdi va
bitta 3/4 dam shaklidagi yaqin tutam yonoqni yopdi (`test/audit_misol/yuz_soch.py`; yorug' massa IoU buni sezmaydi).
Tuzatish: 8-o'tishdagi "2-shotda kamera qor qutisidan tashqarida -- zarra maydalashib zichlashadi" sinaldi va TASDIQLANMADI
(quti hamma kamerani o'rab olganda zichlik o'zgarmadi).

## 10-o'tish: qismlar alohida -- ko'z, qosh, burun, og'iz, iyak (daha), jag', soch, kapyushon -- `chiqish/qismlar-audit-10.png`, `chiqish/qismlar-audit-10-bosh.png`, `chiqish/soch-tutam-10.png`, `chiqish/oldin-hozir-3d-10.gif`

Foydalanuvchi: "qaysi biri soch, qaysi biri burun, ko'z, qosh, og'iz, daha -- ajratib olmayapsan; boshni og'izgacha o'lchab
dahani qoldirib ketayotganing xavotirga soladi ... o'z modelimizda soch va kapyushonni olib turib birma-bir o'lchab ol,
keyin qo'yib o'lchaysan". Tekshiruv: doimiy o'lchovlarda 1-shotda ko'z, og'iz, jag' osti (iyak oldidagi 3 ustun) va iyak
oldi zondlari bor edi; 2- va 3-shotda faqat old kontur va ko'z; qosh va burun uchi hech qayerda; 9-o'tish bosh moslashida
iyak va jag' deyarli yo'q edi (1-shotda iyak old chetining bitta qatori, 2-shotda jag' ostining 3 nuqtasi -- 2 kadr
og'irligida, 3-shotda 2 ustun). Jag'ning quloqqa tomon qismi hech qayerda o'lchanmagan.

Asboblar (`test/qism/`, ikkala tomonda bir xil kod, 320x180):
- `personaj.js qismNuqtalari()` + `nuqtalar.mjs` -- bizning modelda nomli qism nuqtalari (ko'zlar, qoshlar, burun, og'iz,
  lab soyasi, iyak uchi va osti, jag' burchagi, kalla) 3D dan; node proyektori sahifa bilan 0.005 px (yumuq ko'z holati
  rol style da material uniformidan o'qilib noto'g'ri chiqardi -- 3.8 px, pozadan o'qiladigan qilindi).
- `qism_olch.py` -- kontur (har qator), jag' osti (har ustun, lab soyasidan pastdan), iyak uchi (jag' izining shot
  yo'nalishidagi uchi), burun uchi, qorong'i bo'laklar (ko'z, qosh, og'iz, lab soyasi; shakl sharti bilan). `kalibr.py` --
  xuddi shu kod bizning renderda 3D nuqtalarga qarshi (ko'z bo'lagi markazi aniq nuqtadan -1.6, -3.7 px doimiy -- ikkala
  tomonda bir xil); `tekshir_varaq.py` -- 22 kadrning har birida nima topilgani ko'rib chiqildi (qosh faqat k03, k05, k10
  da ko'rinadi; 3-shotda og'iz ishlatilmaydi -- pastki yuzdagi bir nechta kichik belgidan qoida har kadrda boshqasini
  tanlardi). `taqqos.py`, `qatlam.py` (yalang'och -> + soch -> + kapyushon: misolning ko'rinadigan yuzi ustida bizda nima),
  `qism_varaq.py`; hammasi `yugur.sh TEG` bilan.

Topilgani (9-o'tish): 1-shotda ko'z, og'iz, lab, iyak uchi joyida (1-2 px); JAG' OSTI quloqqa tomon 17 px gacha past
(misolda jag' quloqqa ko'tariladi, bizniki tekis va uzun -- jag' tagi boshning o'rtasigacha); 2-shotda iyak 6 px, 3-shotda
10 px past; qosh 7 px tashqarida, 3 px pastda; soch misol teri ko'rsatgan joyning 16 / 18 / 10 % ini yopadi.

Tuzatilgani -- bosh, soch va kapyushonsiz (`test/fit_bosh10.mjs`: pastki yuz va jag' kesimlari -- yangi `jagOrqa1`
parametri bilan -- va 1-shot pozasi; model izlari -- to'liq azimutli sirt nuqtalari siluetasi, render skani bilan 0.7-1.3
px). Teng og'irlikda iyak 1-shotda 5-6 px tepaga ketardi (2-shotda misol profil yuzini boshiga nisbatan ~20 % kichik
chizadi; 3-shotda ko'z -> iyak misolda 45 px, bizda 61 -- bu pozaga sezgir), shuning uchun maqsad -- 1-shot, 2- va 3-shot
"yomonlashmasin" jarimasi bilan; pozalar (x / 0.04 rad)^2 jarimasi bilan (jarimasiz 2- va 3-shot burilishi 17 gr ga yetdi
-- poza shakl farqini yutardi). 2- va 3-shot pozasini ham surish sinaldi, qaytarildi: 3-shotda ko'z 1 -> 6 px ketdi,
2-shot kaliti bilan kapyushon rigi 1-shot 10 -> 11 da masshtab sakrashini qaytardi (1.057). 1-shot pozasiga har kadrga
alohida qo'shimcha 9 -> 10 sakrashini qaytardi (1.029) -- butun shotga bitta qo'shimcha. Ko'z yoshi qayta o'tkazildi.

| qism: biz - misol (x, y px) | 1-shot (3/4) | 2-shot (profil) | 3-shot |
|---|---|---|---|
| iyak uchi (daha) | -2.2, -1.4 -> -1.1, -1.0 | -2.0, +6.3 -> 0.0, +6.2 | -10.7, +9.7 -> -9.5, +10.4 |
| jag' osti, o'rtacha abs (min..max) | 3.9 (-5..+17) -> 1.3 (-7..+7) | 5.1 -> 5.8 | 5.4 -> 6.4 |
| yaqin ko'z / og'iz | +1.1, -0.8 -> +1.6, -0.3 / -2.0, -0.1 -> -1.5, 0.0 | +15.5 (2D, qoldiq) / -- | -1.6, -4.2 -> -1.5, -4.3 / -- |
| yaqin qosh / burun uchi | -6.9, +3.2 -> -6.4, +3.8 / -- | -- / +2.0, +2.0 | -- |
| 1-shot barcha qismlar RMS | 4.03 -> 2.58 px | 3.27 (poza qat'iy: 4.78 -> 4.89) | 8.08 (8.49 -> 9.04) |

Boshqa o'lchovlar (`test/olch9.py`): kamera sinovi hamma qismda 0.00 px; masshtab 9->10 / 10->11 1.005 / 1.008 -> 1.009 /
1.015; 2-shot old kontur 2.10 -> 2.24; 3-shot iyak konturi 1.58 -> 1.57, ko'z o'zgarmadi; astar tasmasi zondi 12.5 -> 8.2 %.
Yomonlashgan zondlar (sababi ko'rilgan): jag' osti x8 1.48 -> 3.97 px -- jag' tagi kamera pastda bo'lgani uchun yupqa
tasma bo'lib ko'rinadi, zond uning ustidagi qorong'i chegarada to'xtaydi (siluet izi 1.3 px); iyak oldi y52 2.03 -> 3.32 --
iyak 99-qatorda 3 px oldinda (iyakZ 0.974 -> 1.032).

Soch sinovi (QABUL QILINMADI, `chiqish/soch-tutam-10.png`): yaqin tutam kesim bo'ylab (`yon()`, yonoqdan jag' ortiga) va
qoplash bilan moslandi (`test/fit_soch9b.mjs`): qoplash 1/2/3-shot ~14 / 18 / 13 % -> 2 / 3 / 0.2 %, 2-shot soch IoU 0.29 ->
0.46, lekin 1-shotda (11 kadr) tutam yonoq chetidan yo'qoldi (IoU 0.26 -> 0.19). Ustma-ust niqob: 1-9 kadrda 9-o'tish tutami
misolnikiga to'g'ri tushadi; 10-11 da bosh burilganda tutam yuzga o'tadi, misolniki yuz chetida qoladi (inersiya?); 2-shotda
misol tutami yonoq orqasida. Bitta tutam ikkala ko'rinishni bermaydi (3/4 da misol tutami ko'zdan 20-25 px chapda, profilda
quloq oldida -- 3D da 30 px dan ortiq farq). Tutam 9-o'tishdagidek qoldi.

## 11-o'tish (boshlanishi): inson belgilari -- misol tomonini mustaqil ko'z bilan tekshirish -- `test/qism/inson/`

Detektorlar bizning renderda aniq 3D javob bilan kalibrlangan, misolda esa faqat o'z varaqlarim bilan tekshirilgan edi (bir xil
ko'z). Alonur 8 ta misol kadrida (R03 R10 R12 R13 R14 R17 R20 R22) qismlarni qo'lda belgiladi: "Ko'z bilan o'lchov" artifact
(`sahifa.html` + `tayyorla.py`; db `belgi`), tahlil `tahlil.py` (sintetik kalibr: qo'yilgan 8 px iyak xatosini topadi, boshqa
hech narsani emas; jag' 3.0 px siljishni aniq o'qiydi). Belgilar `belgilar_alonur_1.json` -- MISOLDAN OLINGAN, MAXFIY
(repoga kirmaydi; varaqlar ham). Bizning kadrlarni belgilash olib tashlandi (Alonur: chala modelda "to'g'ri joy" yo'q, qo'l
aniqligi 3D ta'rifimiz bilan aralashadi); qo'l shovqini -- takror: R12 = R13 (bir xil chizma), nuqtalarda 0.45-1.3 px
(sigma ~0.45).

Detektor xatolari (varaqda tekshirildi, `varaq.py`):
- **2-shot iyak -- 24 px:** detektor og'iz chizig'i balandligidagi yuz chetini olgan (158,111); haqiqiy iyak (149,134), og'iz
  y~114. "2-shotda bizning iyak 6 px past" NOTO'G'RI edi: bizniki ~16 px YUQORIDA. Oldingi 2-shot moslashi shu nishonga tortilgan.
- **R10 burun -- 13 px:** detektor burun ostidagi kontur nuqtasini olgan (140,73.5); burun uchi (138.6,61.8) -- yorug' nuqta.
- **Ko'z kalibri misolga o'tmaydi:** yumuq ko'zda odam nuqtasi xom sentroidga 0.5 px ichida; bizning renderdan olingan
  +3.8 px (sentroid -> 3D markaz) tuzatishi misolda 4 px xato beradi.
- Og'iz (R03) va qosh: detektor faqat qora/ochiq qismni ko'radi; odam chiziqni soch ostidan davom ettiradi (taxminiy).
- 3-shot iyak va 1/3-shot jag': mos (0.2-3 px; R20 4.7 px -- tekis pastki chekka bo'ylab ta'rif farqi; R22 jag'i soch ostida).

Detektor tuzatildi (`test/qism/qism_olch.py`, sababi docstringda; eski nusxa `qism_olch_10.py`), doimiy test
`sinov_detektor.py`: "topgan, lekin odamdan uzoq" 8 -> 0 (R03/R10 og'iz -- ma'lum ta'rif farqi, +2.5 px, `nishon.py` da
tuzatiladi); to'g'ri 20 -> 30; topmagan 20 (2-shot uzoq ko'z/qosh, 3-shot burun/og'iz/ko'zlar -- odam belgilari nishon).
2-shot iyak 24 -> 1.1-1.5 px, jag' 21 -> 0.3-1.7, og'iz topildi (0.8-1.4); R10 burun 11.8 -> 2.3; iyak ta'rifi (1-shot
(0.65,0.76), 3-shot pastga) R10 4.0 -> 2.6, R20 4.7 -> 1.7. Bizning renderdagi kalibr o'zgarmadi (ko'z, og'iz, lab bir xil).
Yangi o'lchov qoidasi (`nishon.py` -> `nishon_TEG.json`): har tomon O'Z haqiqati bilan -- misol: odam belgisi, bo'lmasa
tuzatilgan detektor; biz: 3D nuqta (ko'z, burun, og'iz, qosh), iyak/jag' -- yalang'och siluet. "Bir xil kod ikkala tomonda"
chizmalar har xil bo'lsa siljishni qisqartirmaydi: og'izda misolning qora qismi o'ngda, bizniki chapda -- farq 5 px teskari.
bosh10c, biz - misol (px): 1-shot ko'z (+2.3,+2.9), uzoq ko'z (-0.9,+2.1), burun 0.9, og'iz (+3.9,-0.3), iyak (0,-1.5),
jag' |y| 1.3; 2-shot ko'z (+16.7,+3.8), og'iz (+11.5,-8.5), iyak (+9.2,-16.3), jag' -20.1 (bizniki yuqorida), burun 3.6;
3-shot yaqin ko'z 1.5, uzoq ko'z (-5.2,+7.5), burun (-6.4,+9.9), og'iz (-5.3,+7.0), iyak (-8.8,+10.5) 9 kadr, jag' +12.8.

Bizning model - misol (odam nuqtasi bo'yicha, `farq_varaq.py`): 1-shot yaxshi (qismlar 2.6-4.6 px; ko'z->iyak 0.93-0.95).
2-shot: yaqin ko'z +16.7 px oldinda, og'iz (+11.5,-8.5), iyak (+9.2,-16.3), burun 3.6 -- ko'z->iyak misolda 57, bizda 36 px
(0.63). 3-shot: yaqin ko'z mos (1.6 px), uzoq ko'z / burun / og'iz / iyak 9-14 px pastda-chapda -- ko'z->iyak misolda 46-48,
bizda 62 px (1.27-1.35), burchak 9-11 o'rniga 19 gradus. Ikkalasi ham asosan POZA (egilish): 2-shotda bosh orqaga (iyak yuqori),
3-shotda yuz kam qisqargan.

## 11-o'tish (2-ish): 2- va 3-shot -- poza, kamera va kapyushon kaliti inson belgilariga -- `chiqish/oldin-hozir-3d-11.gif`

OLDIN = topshirilgan 10-o'tish GIF i (`kadrlar-topshirilgan10/`, GIF dan olingan HOZIR paneli), HOZIR = `poza11c`.
Yo'l: (1) yuz node da (`test/yuz11.mjs`, `test/fit_poza11.mjs`: 3D qism nuqtalari + yalang'och siluet izi, render yo'q; renderga
teng: nuqtalar 0.00 px, iyak <= 0.5, jag' <= 0.27); (2) renderda BIRGA (`test/fit_poza11b.mjs`, async Nelder-Mead): poza + kamera
(d, ekran, az, el) + shu shot kapyushon kaliti, maqsad yuz RMS/3 + bosh IoU + figura, 2-shotda 1-shot 10-11 qo'riqchisi;
(3) tekshiruv -- qatlamlar, eski zondlar, varaqlar; (4) topilgan xatolar tuzatildi (pastda); (5) 14-tasvir alohida.

**Tekshiruvda topilgan va tuzatilgan:**
- **To'g'ri raqam, noto'g'ri sabab (3-shot):** birinchi moslash (`poza11`) bosh IoU ni ushlab turdi (0.656 -> 0.657), lekin
  kapyushon misolning ko'rinadigan yuzining 28 % ini yopdi (oldin 5 %). Sabab: bosh IoU da astar "bosh" sanaladi (1-shotda misolda
  astar ko'rinadi), 3-shotda esa misolda astar yo'q -- yuz o'ngida katta yorug' soch massasi. Moslash yetishmagan sochni astar
  bilan to'ldirdi: misol boshi ustida astar 18 % -> 30 %, soch + teri 73 % -> 54 %. Yuz nuqtalari buni ko'rmaydi (3D nuqta
  yopilganini bilmaydi). Yangi o'lchovlar (`src/main.js` kapBaho9, niqob `test/qism/inson/yuz_kor.py` -- MAXFIY): kapF --
  kapyushon/plash misolning yorug' terisi ustida, teriQ -- bizning teri misolning astar/qorong'i joyida, iou2 -- astarsiz bosh IoU.
  3-shot kaliti qayta (faqat kalit, poza/kamera qat'iy: `--faqatKalit --iou2 --yuzkor 6 --qor1`): kapF 0.276 -> 0.139, teriQ
  0.148 -> 0.114, iou2 0.452 -> 0.470, figura 0.893 -> 0.887. Bir o'lchovli skan (`test/tarama_kap11.mjs`): faqat ochA (yaqin
  qirra) yuzni ochadi; qolgan kapF -- iyak ostidagi yoqa (global yopiq/rYelka): ochilsa bizning teri misolning astar tasmasida
  (L 40-45) chiqadi.
- **Baholash tartibi (asbob xatosi):** 1- va 2-shot pozasida chokish/orqaga yo'q, `P.poza` esa Object.assign qiladi -- moslashda
  3-shotdan keyin 0-tasvirdan qayta boshlanganda 1-shot boshi 3-shotning qiymatida qolardi (-0.02, ~1 px; kapF 0.030 -> 0.019).
  Endi har tasvir pozasi to'liq (yo'q maydon = 0). Ketma-ket render (render.mjs) o'zgarmaydi.
- **14-tasvir (harakat oralig'i):** butun jadval siljishi 15-22 ga mos, 14 da yuz RMS 6.9 px (og'iz, iyak ~7 px, jag' -8): faqat
  egilish 0.41 -> 0.53 -- RMS 3.2 px (og'iz 1.5, iyak 2.3, jag' -2.0; burun 2.8 -> 5.3).

**Natija (topshirilgan 10 -> hozir).** Inson belgilariga masofa, px (`farq_varaq.py`): R12 (2-shot) yaqin ko'z 16.6 -> 3.5,
og'iz 14.2 -> 2.3, iyak 19.0 -> 0.9, uzoq ko'z 2.8 -> 1.7, burun 4.0 -> 4.7; ko'z -> iyak misolda 57, bizda 36 -> 60 px.
R17/R20/R22 (3-shot): uzoq ko'z 8.8-11.3 -> 3.4-4.7, og'iz 9.3-13.5 -> 1.4-4.0, iyak 13.6-16.3 -> 2.8-5.0, burun 14.6-15.6 ->
8.7-9.3, yaqin ko'z 1.4-1.8 -> 1.0-2.4; ko'z -> iyak 46-48 / 62 -> 48. R14 uzoq ko'z 7.0 -> 4.5, iyak 3.8 -> 2.3, og'iz 0.5 -> 1.5.
1-shot o'zgarmadi. Nishon jadvali (`nishon.py`, biz - misol): 2-shot iyak (+9.2,-16.3) -> (+0.7,-0.6), jag' -20.1 -> +0.6;
3-shot iyak (-8.8,+10.5) -> (-2.6,-0.6), jag' +12.8 -> +1.1, og'iz (-5.3,+7.0) -> (-0.7,+0.6), burun (-6.4,+9.9) -> (-5.1,+6.2).
Kamera: 2-shot d 10.80 -> 7.39 (1-shot 7.03 ga yaqin), bosh 33 gr kameraga burilgan va 14 gr og'gan; 3-shot d 7.10 -> 8.14.
Massa va qatlamlar (sahifa ichida bir xil asbob, topshirilgan -> hozir):

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| bosh IoU (astar bilan) | 0.797 -> 0.809 | 0.661 -> 0.750 | 0.656 -> 0.471 (astar endi sochni to'ldirmaydi) |
| bosh IoU astarsiz (teri + soch) | 0.702 -> 0.711 | 0.652 -> 0.750 | 0.551 -> 0.458 |
| figura | 0.924 -> 0.922 | 0.914 -> 0.922 | 0.885 -> 0.885 |
| kapF (kapyushon misol terisida) | 0.029 -> 0.030 | 0.239 -> 0.004 | 0.052 -> 0.139 |
| teriQ (teri misolning qorong'isida) | 0.279 -> 0.201 | 0.097 -> 0.112 | 0.354 -> 0.110 |

Sinf IoU (Python, 320): 2-shot soch 0.416 -> 0.501, teri 0.382 -> 0.583; 3-shot soch 0.180 -> 0.214, teri 0.553 -> 0.457.
Qatlam (misol yuzida bizda, kapyushon bilan): 2-shot teri 50 -> 81 %, kapyushon 24 -> 1 %; 3-shot teri 82 -> 54 %, soch 11 -> 16 %,
kapyushon 6 -> 15 %, bizning teri misol yuzidan tashqarida 46 -> 18 %. 1-shot 9->10->11 masshtab [1.009, 1.015] -> [0.999, 1.011];
kamera sinovi (kamYol 49 + orbita 37 tasvir) hamma qismda 0.

3-shot halol: yuz qismlari endi misol nuqtalarida, lekin ko'rinadigan yuz misoldan kichik va teri IoU tushdi (0.553 -> 0.457).
Topshirilganda yuz 9-14 px pastda-chapda va kattaroq edi -- misol yuzining 82 % ini yopar, lekin 46 % i tashqarida edi. Hozir
misol yuzining 15 % i kapyushon yoqasi (iyak osti, chapda), 16 % i soch tutamlari (yaqin ko'z 9 kadrdan 8 tasida tutam ostida --
oldin 6 tasida), ~15 % i yuzimizdan tashqari (old kontur burun tomonda ~5 px ichkarida: burun (-5,+6), uzoq ko'z -4).
Yuz o'ngidagi soch massasi misolda katta, bizda kichik -- oldin astar to'ldirardi.

Eski zondlar (`olch9.py`) tekshirildi: 2-shot old kontur 2.24 -> 5.19 px -- 70-80 qatorlar endi peshona oldidagi soch tutamini
o'lchaydi (bizda x 168-169, misolda yuz konturi 155-158), 82-110 qatorlar -4..+3 (o'rtacha 2.1). 3-shot "ko'z" zondi
[-13,-5] -- qutidagi eng qorong'i oyna bizda burchakdagi kapyushon/soch soyasi (ko'z tutam ostida), ko'z nuqtasi esa 1.7 px.
1-shot tasma zondi k09/k10 +3/+2 % -> +16/+27 % (chegara 25): 2-shot kaliti 1-shotga ham tegadi (Gauss aralashmasida og'irligi
~1/3) -- qo'riqchi faqat 10-11 bosh IoU va figurasini ko'rardi. 1-shot soch zondlari yaxshilandi (soch_chap y-6 7.1 -> 3.2).

## 12-o'tish: tuzilish -- avval to'g'ri 3D model (kapyushon, soch, bosh), keyin kamera -- `chiqish/oldin-hozir-3d-12.gif`, `chiqish/maket-keng-12.png`, `chiqish/uch-shot-12.png`

Alonur: "kapishon, soch va bosh tuzilishini o'zing tushunib to'g'irla ... ishlaring boshni to'g'irlash emas, ularni maskalab
o'z sonlaringga o'xshatish ... birinchi to'g'ri 3D modellarni qilib olishing kerak, keyin kamerani". OLDIN = topshirilgan
11-o'tish (`kadrlar-misol/anime-poza11c`), HOZIR = `kadrlar-misol/anime-tuz12`. Eski model maketi alohida nusxada
(`../personaj3d_eski`, 11-o'tish manbasi).

**Oldingi model nimasi noto'g'ri edi (maketda -- bitta poza, kamera aylanadi):** kapyushon yuzga yopishgan tor, baland uchli
qalpoq, har shot pozasiga alohida kalit bilan (`kapPoza` -- teshik, toj, astar har shotda boshqacha: 3 shotga moslangan yamoq);
sochning orqasi yo'q edi -- orqadan va yondan bosh qorong'i "dubulg'a" (qopqoq), tepadagi tutamlar kapyushonni teshib chiqardi;
qirra bo'ylab yorug' "astar tasmasi" aslida misolning SOCHI edi (ushlangan kadrlarda qimirlaydi: juft IoU 0.28-0.80, mato
0.98-0.99). Moslash misolning qorong'i ichini bizning sochimizni kapyushon bilan YOPISH orqali "tushuntirgan".

**Misoldan tuzilish (bosh fazosida, uch shotdan birga -- `test/qism/kap_xarita.py`):** bosh sirtidan 0.2 tashqaridagi to'r
har kadrda misolning qaysi qismiga tushadi (MAXFIY nishon). Kapyushon boshning orqasi va tepasini yopadi; qirra yuzni ramkalaydi
(bosh o'rtasida ~-60 gr, jag'da ~-85..-110); qirra va yorug' yon tutamlar orasida qorong'i (L 6-14) -- 9 kadrda bosh fazosida
bir joyda (az -60..-70, y -0.3..+0.4). Kapyushon katta va bo'sh (qalin mato boshga yopishmaydi), ichi qorong'i.

**Qurilgan (bitta dunyo, kameraga bog'liq narsa yo'q):**
- **Soch to'liq:** orqa va quloq usti qatlami (ikki qator, ensagacha) -- bosh har tomondan soch (`SOCH.orqa`).
- **Kapyushon -- bitta mato (`kapGeo`):** halqalar, radius va markaz tugunlar orqali (gumbaz, bosh, bo'yin, yelka), orqada
  osilgan xalta, old-tepada soyabon va qirra tepasida tumshuq; teshik qirrasi BOSH AZIMUTI bilan beriladi (fi1..fi4 -- misol
  xaritasidan o'qiladigan kattalik). Poza kalitlari olib tashlandi; boshga ergashish o'q bo'yicha (kfE egilish 0.80, kfB burilish
  0.79, kt 0.88) -- vaqt inersiyasi bilan (tau).
- **Soch kapyushon ichida (fizika):** soch zanjiri mato ichki sirtidan (tutam qalinligi bilan) tashqariga chiqmaydi, teshikdan
  chiqqani erkin -- maketda tepadan soch teshib chiqmaydi.
- **Kapyushon ichi qorong'i -- yorug'lik:** 16 dunyo yo'nalishidan kapyushon+plash chuqurlik xaritalari, har nuqtada osmon
  ko'rinishi V (AO); V < 0.505 -- ich toni (soch), teri uchun 0.22 (yuz ko'rinib qoladi, bo'yin qorong'i); kapyushonning kalit
  yorug'likdan soyasi ham ich toni. Ichki mato butunlay qorong'i (astar tasmasi yo'q). Kalit yorug'lik az 41.7, el 29.7.
- Moslash (`test/fit_kap_tuz.mjs`, 3 shot birga, sahifada): faqat kapyushonning jismoniy o'lchamlari + bitta yorug'lik va AO
  chegarasi; maqsad -- bosh qobig'i xaritasidagi sinf IoU (bosh / ich / tashqi) + figura, jarima -- mato soch qatlamiga kirmasin.
- **Kamera oxirida (`test/fit_kamera_tuz.mjs`):** inson belgilari (yuz RMS) + butun kadr sinflari + figura bilan 2- va 3-shot
  kamerasi/pozasi qayta tekshirildi -- mahalliy optimum joriy kamerada (3-shot: 300 bahoda < 0.5 gr, F 4.907 -> 4.873; 2-shot
  +/-8 gr, +0.5 d -- yomonroq). Kameralar o'zgarmadi (yuz RMS 2-shot 2.50, 3-shot 4.03 px).

**Natija (topshirilgan 11 -> hozir; bir xil asbob, `test/qism/tuz_olch.py`, 9 kadr):**

| bosh qobig'i 0.2 | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| kelishuv (4 sinf) | 0.838 -> 0.800 | 0.880 -> 0.869 | 0.743 -> 0.729 |
| bosh (yuz+soch) IoU | 0.780 -> 0.778 | 0.875 -> 0.782 | 0.537 -> 0.685 |
| ich (qorong'i) IoU | 0.091 -> 0.102 | 0.000 -> 0.298 | 0.000 -> 0.076 |
| kapyushon tashqi IoU | 0.766 -> 0.728 | 0.826 -> 0.812 | 0.761 -> 0.820 |
| figura (yumshoq) | 0.922 -> 0.898 | 0.922 -> 0.918 | 0.884 -> 0.810 |

Soch hajmi qobig'i (0.55): bosh 0.665 -> 0.661 / 0.794 -> 0.682 / 0.366 -> 0.439; tashqi 0.749 -> 0.797 / 0.817 -> 0.779 /
0.804 -> 0.848. Kamera sinovi (`test/kamera_sinov9.mjs`, kalibr PROVEN): kamYol 49 va orbita 37 tasvirda hamma qism 0.00 px.

Halol: raqamlarning bir qismi tushdi -- bu izchillik narxi. 2-shot bosh IoU 0.875 -> 0.782 va 3-shot figura 0.884 -> 0.810:
eski kapyushon HAR SHOTGA o'z kaliti bilan shu raqamlarga moslangan edi (yamoq); bitta mato uchala shotni birdan qondira olmaydi.
Yutuq: 3-shot boshi (0.537 -> 0.685), qorong'i ich birinchi marta (2-shot 0 -> 0.298), 1-shotda yuzning uzoq tomonida kapyushon
yo'q (misoldagidek), maketda kapyushon har tomondan bitta yumaloq mato, soch teshib chiqmaydi.

## 13-o'tish (1-ish): tepadagi soch va kapyushon teshigi -- birga -- `chiqish/oldin-hozir-3d-13-tepa.gif`, `chiqish/maket-13-tepa.png`

OLDIN = topshirilgan 12-o'tish (`kadrlar-misol/anime-tuz12`), HOZIR = `kadrlar-misol/anime-tuz13` (rol: `rol-tuz13`).

**Misolda nima (o'lchangan, `test/qism/soch_tepa.py` -- har ustunda ko'rinadigan bosh (yuz+soch) ning eng yuqori qatori):**
2-shotda misolning sochi bosh ustida kadr tepasigacha ko'tariladi (x 138-158 da y 4-5, bosh fazosida y ~1.35-1.45, z 0.5-0.8 --
peshona ustida, qirra oldida); bizda shu ustunlarda 25-32 qator pastda tugardi (tepa 60 qatorda IoU 0.55). Uchala shotda ham
misolda TOJ kapyushon ostida: ko'rinadigan boshning kapyushon tomondagi chegarasi bosh tepasidan oldinda (2-shotda bosh fazosida
z ~0.2-0.5).

**Qilingan (bitta dunyo; faqat jismoniy o'lchamlar, shot kaliti yo'q):** kapyushon teshigining tepasi va soch yelpig'ichi BIRGA
moslandi (`test/fit_kap_tuz.mjs`: 0.2 va 0.55 qobiqlari + butun kadr bosh sinfi + 1-, 2-shotda kadr tepasi, 3 shot birga ->
`test/kap_tuz_fit_G.json`, `test/tuz_yoz.py` manbaga yozadi):

| | 12 | 13 |
|---|---|---|
| teshik tepasi (ochV0; kapyushon ramkasida y) | 0.157 (~1.16) | 0.053 (~1.53) |
| gumbaz uchi yTepa / gumbaz radiusi Rg | 1.85 / 1.12 | 1.76 / 1.41 |
| qirra tepasidagi tumshuq / soyabon | 0.20 / 0.12 | 0.51 / 0.14 |
| teshik yarim burchagi fi1 (v1 da) | 34.3 gr (0.28) | 40.5 gr (0.27) |
| egilishga ergashish kfE | 0.80 | 0.83 |
| yelpig'ich uzunligi L / ko'tarilish HK | 0.43 / 1.18 | 0.80 / 1.11 |
| yelpig'ich osilishi osil0 / osil1 | 0.19 / 0.94 | 0.23 / 0.97 |

Teshik tepasi bosh ustiga ko'tarildi, soch yelpig'ichi uzunroq -- peshona qatorlari teshikdan qirra oldiga chiqib ko'tariladi;
toj sochi gumbaz ostida (to'qnashuv bosadi). Maketda (`chiqish/maket-13-tepa.png`) soch matoni teshib chiqmaydi.

**Tekshirilib RAD etilgan (o'lchov qo'llamadi):**
- "Orqa qatorlar yassi" (yelpig'ich orqa qatorlarining uchi va ko'tarilishi `1 - yass (1 - k)` ulushda): moslash yass = 0.015
  ni tanladi (~0) -- toj sochi to'qnashuv bilan allaqachon gumbaz ostida; kod olib tashlandi.
- Qattiq soch (osil1 0.18): birinchi moslash (F) boshqa yorug'likda ketgan edi -- `fit_kap_tuz.mjs` ning standart qiymati
  el 20.5, AO 0.45, manbada el 29.7, AO 0.505 (raqamlar boshqa yorug'likka moslangan). Manba yorug'ligida qayta baholanganda
  qattiqlik hech narsa bermadi (osil1 0.94 yaxshiroq); G manba yorug'ligida moslandi. Skript tuzatildi: yorug'lik/AO faqat
  parametr bo'lsa o'rnatiladi, aks holda sahifadagi manba qiymati.

**Natija (12 -> 13; bir xil asboblar):**

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| butun kadr bosh IoU | 0.664 -> 0.657 | 0.655 -> 0.742 | 0.495 -> 0.481 |
| kadr tepasi (60 qator) bosh IoU | 0.593 -> 0.584 | 0.549 -> 0.772 | -- |
| qobiq 0.2: bosh / tashqi / figura | 0.778 -> 0.751 / 0.728 -> 0.717 / 0.898 -> 0.901 | 0.782 -> 0.826 / 0.812 -> 0.821 / 0.918 -> 0.928 | 0.685 -> 0.652 / 0.820 -> 0.821 / 0.810 -> 0.842 |
| qobiq 0.55: bosh / ich / tashqi | 0.661 -> 0.653 / 0.070 -> 0.072 / 0.797 -> 0.789 | 0.682 -> 0.796 / 0.075 -> 0.115 / 0.779 -> 0.789 | 0.439 -> 0.437 / 0.048 -> 0.049 / 0.848 -> 0.866 |

Soch tepasi (tepa 60 qator IoU, kadr bo'yicha): k12 0.546 -> 0.770, k13 0.551 -> 0.770, k03 0.653 -> 0.639, k10 0.543 -> 0.542.
Kamera sinovi (`test/kamera_sinov9.mjs`, kalibr PROVEN): kamYol 49 va orbita 37 tasvirda hamma qism 0.00 px.

Halol: 2-shot aniq yaxshilandi; 1- va 3-shot biroz tushdi. **1-shot:** teshikning yaqin-yuqori tomoni (fi1) -- 1-shot uni tor
xohlaydi, 2- va 3-shot keng (G da fi1 40.5 -> 34.3: butun kadr bosh 1-shot 0.657 -> 0.680, 2-shot 0.741 -> 0.705, 3-shot
0.480 -> 0.444): bitta kapyushon ikkalasini qondirmaydi -- qoldiq, 2-ish (yon qirra, qorong'i uchburchak) bilan qayta ko'riladi. **3-shot:** peshona tutamlari endi soyabon oldida chiqadi
(misolda o'sha joyda yorug' soyabon tasmasi) -- 3-ish (soyabon) bilan. Shamol bu tutamning yo'nalishini bermaydi (yelpig'ich
shamolsiz sinovda 3-shot kadrining 0.6 % piksellari o'zgardi, 480x270, farq > 20).

## 13-o'tish (2-ish): qorong'i ich va kapyushon eni -- `chiqish/oldin-hozir-3d-13-ich.gif`

OLDIN = 1-ish (`anime-tuz13`), HOZIR = `anime-tuz13b`.

**O'lchov (butun kadr, ich -- kapyushon ichi / qorong'i sinf, 320x180 px; bosh sinfiga nisbatan joyi):**

| kadr | misol: chap / o'ng / past | 1-ish (biz): chap / o'ng / past | 2-ish (biz) |
|---|---|---|---|
| k03 | 514 / 7 / 472 | 1222 / 1862 / 1178 | 1352 / 1206 / 1224 |
| k10 | 729 / 0 / 296 | 500 / 1707 / 1417 | 617 / 1061 / 1217 |
| k12 | 691 / 3 / 0 | 487 / 269 / 36 | 507 / 229 / 16 |
| k16 | 664 / 0 / 486 | 2153 / 119 / 155 | 1852 / 162 / 109 |
| k20 | 374 / 0 / 459 | 2570 / 264 / 86 | 2312 / 300 / 66 |

Misolda qorong'i faqat yaqin chakkadagi uchburchak va iyak ostidagi yoqa; o'ngda (1-shotda uzoq tomon, 2-, 3-shotda yuz oldi)
deyarli nol. Bizda uchta manba (1-ish modelida, AO va soya o'chirilgan renderda ajratildi, k03 / k12 / k20): kapyushonning ichki matosi 3235 /
432 / 823 px, AO + soya qorong'isi 1343 / 587 / 2646 px -- 1-shotda mato (uzoq tomon qirrasi yuz konturidan tashqarida va iyak
ostida teshikning pastki qismi), 3-shotda soyabon ostidagi sochning AO qorong'isi.

**Qilingan:** teshikning pastki qismi va bo'yin halqasi, hamda kapyushonning gavdaga osilishi (yangi, jismoniy: kapyushon yoqa
orqali gavdaga osilgan, gavda boshga nisbatan 23 gr burilgan -- tepa qismi shu burilishning `kgB` ulushini oladi) birga moslandi
(`test/fit_kap_tuz.mjs --wiF 2` -- butun kadrdagi ich IoU ham maqsadda -> `test/kap_tuz_fit_H.json`): fi4 47 -> 27 gr (iyak ostida
teshik torroq), fi2 62 -> 64, fi3 56 -> 53, v4 0.76 -> 0.75, Rn 1.25 -> 1.27, zn -0.12 -> -0.07, kgB 0.04 (~1 gr).

**Natija (1-ish -> 2-ish):**

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| butun kadr ich IoU | 0.092 -> 0.131 | 0.205 -> 0.241 | 0.082 -> 0.088 |
| butun kadr bosh IoU | 0.657 -> 0.671 | 0.741 -> 0.724 | 0.480 -> 0.481 |
| qobiq 0.2: bosh / ich / tashqi / figura | 0.751 -> 0.757 / 0.098 -> 0.100 / 0.717 -> 0.727 / 0.901 -> 0.914 | 0.826 -> 0.805 / 0.282 -> 0.300 / 0.821 -> 0.812 / 0.928 -> 0.943 | 0.652 -> 0.659 / 0.070 -> 0.079 / 0.821 -> 0.843 / 0.842 -> 0.845 |
| qobiq 0.55: bosh / ich / tashqi | 0.653 -> 0.665 / 0.072 -> 0.094 / 0.789 -> 0.831 | 0.796 -> 0.777 / 0.115 -> 0.197 / 0.789 -> 0.786 | 0.437 -> 0.442 / 0.049 -> 0.059 / 0.866 -> 0.856 |

Kamera sinovi: kamYol 49 va orbita 37 tasvirda hamma qism 0.0000 px. Maketda soch teshib chiqmaydi.

**Tekshirilib RAD etilgan (maqsad yomonlashdi, 1-ish modelida):** kapyushonni toraytirish (kengX 1.0; R0 1.4), qirrani yuzga
tortish (qanot -0.3 / -0.6 -- "bog'ich"), teshikni kengaytirish (fi2 75 / 85) yoki toraytirish (fi2 50), yon soch massasini
qalinlashtirish (yuzyon off 0.2, en 0.7), AO chegarasi 0.35-0.55 (0.505 dan pastda 2-shot uchburchagi yo'qoladi: u yerda uchburchak
AO qorong'isidagi sochdan), kgB 0.15 / 0.5 (1-shot yaxshilanadi -- 0.5 da butun kadr bosh 0.657 -> 0.697, tepa 0.584 -> 0.682 --
lekin 2- va 3-shot keskin tushadi: 0.741 -> 0.583, 0.480 -> 0.305).

**Qoldiq va sababi:** 1-shotda uzoq tomon qirrasi (yuz konturidan o'ngda qorong'i tasma) -- misolda uzoq tomonda kapyushon umuman
ko'rinmaydi; buni bitta mato bilan faqat kapyushonni ~11 gr uzoq tomonga burish beradi, bu esa 2- va 3-shotni buzadi. 1-shot
kamerasi/pozasi yangi modelga hali qayta tekshirilmagan (12-o'tishda faqat 2- va 3-shot) -- 5-ishda. 3-shotdagi qorong'i -- 3-ish
(soyabon va uning ostidagi yorug'lik).

## 13-o'tish (3-ish): 3-shot -- soyabon va uning ostidagi soch -- `chiqish/oldin-hozir-3d-13-soyabon.gif`

OLDIN = 2-ish (`anime-tuz13b`), HOZIR = `anime-tuz13d`.

**Topilgan yashirish (raqamni ko'targan, modelni emas):** 12-o'tishda kapyushonning kalit yorug'likdan soyasi (`SOYA_QORA`)
soch/teriga ich tonida (eng qorong'i) chizilardi -- "qirra va soch orasidagi uchburchak shu soyadan" deb. O'lchov: bu qoida 1- va
2-shotda sinf xaritasida BIRORTA pikselni o'zgartirmaydi (uchburchak AO dan), faqat 3-shotda ishlaydi -- va u yerda k20 dagi
bizning 3192 ta qorong'i pikselimizning 1089 tasi misolda OSMON, 1040 tasi kapyushon tashqarisi: soyabon soyasi ochiqda turgan
sochimizni ich toniga bo'yab "yashirgan" (3-shot bosh IoU 0.488 -> 0.562). Misolda soyabon ostidagi soch YORUG'. Qoida o'chirildi
(`?soyaQora=1` -- faqat tekshiruv): kapyushon soyasi endi oddiy material soyasi.

**Soch qayerda (dunyo fazosida, `window.sochDunyo`):** 3-shotda yelpig'ich tutamlari osiladi (uchi ildizdan 0.64 past, uch segmenti
-72 gr) -- lekin ildizlari tojda, va pastdan qaragan 3-shot kamerasi teshikdan tojni ko'radi; misolda toj soyabon ostida.

**Sinab ko'rilgan (rad etilgan -- uch shot birga yomonroq yoki shovqin darajasida):**
- 3-shotning O'ZI uchun eng yaxshi statik kapyushon (tekshiruv, model emas, `--shotlar 3`): butun kadr bosh 0.422 -> 0.469 --
  kapyushon shakli bu yerda asosiy cheklov emas.
- Egilganda kapyushon ko'proq ergashadi (kfEo 1.0-1.35) yoki ko'proq siljiydi (kt 1.0-1.25) -- butun teshik yuzga tushadi, 3-shot
  bosh 0.56 -> 0.14-0.53 (2-ish modelida); yashirishsiz moslashda alohida kfEo 0.91 (kfE 0.88) -- farq +0.006, olib tashlandi.
- Kalit yorug'lik pastroq (el 20 / 10 / 0 / -10; 2-ish modelida) -- 3-shot yomonroq; shamolning tepaga tashkil etuvchisi
  qordagidek (0.6, 1.0; qor dunyoda 45 gr tepaga uchadi, soch shamoli 11 gr) -- yomonroq; yelpig'ich osilishi va uzunligi -- ta'sirsiz
  (ikkalasi yashirishsiz).

**Qabul qilingan:** (1) `SOYA_QORA` o'chiq; (2) yelpig'ichning orqa qatorlari yassi (`SOCH.yel.yass` 1.0 -- 1-ishda moslash ~0 ni
tanlagan edi, chunki o'sha paytda yashirish tojdagi sochni ich toniga bo'yardi; yashirishsiz yass 0 -> 1: 2-shot tepa 0.777 ->
0.810, 3-shot butun kadr 0.419 -> 0.433); (3) yashirishsiz qayta moslash (`test/kap_tuz_fit_I.json`): soyabon 0.14 -> 0.01,
tumshuq 0.51 -> 0.56, fi1 40.5 -> 41.4, kfE 0.83 -> 0.88, yelpig'ich L 0.80 -> 0.82.

**Natija (2-ish -> 3-ish):**

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| butun kadr bosh / tepa / ich | 0.671 -> 0.667 / 0.594 -> 0.589 / 0.131 -> 0.142 | 0.724 -> 0.739 / 0.762 -> 0.810 / 0.241 -> 0.255 | 0.481 -> 0.433 / -- / 0.088 -> 0.030 |
| qobiq 0.2: bosh / ich / tashqi | 0.757 -> 0.752 / 0.100 -> 0.110 / 0.727 -> 0.731 | 0.805 -> 0.809 / 0.300 -> 0.311 / 0.812 -> 0.811 | 0.659 -> 0.548 / 0.079 -> 0.034 / 0.843 -> 0.826 |
| qobiq 0.55: bosh / ich / tashqi | 0.665 -> 0.666 / 0.094 -> 0.109 / 0.831 -> 0.835 | 0.777 -> 0.775 / 0.197 -> 0.227 / 0.786 -> 0.788 | 0.442 -> 0.408 / 0.059 -> 0.007 / 0.856 -> 0.849 |

3-shotda qorong'i miqdori endi misolnikiday (yaqin tomon: k16 656 px, misol 664; k20 714, misol 374 -- oldin 1852 va 2312), soch
soyabon ostida yorug'. 3-shot bosh IoU tushdi -- bu HALOL raqam: yashirish olib tashlangach, tojdagi sochimiz misol soyabonni
ko'rsatgan joyda ko'rinadi. Kamera sinovi: kamYol 49 va orbita 37 tasvirda 0.0000 px; maketda soch teshib chiqmaydi.

**Qoldiq:** 3-shotda toj teshikdan ko'rinadi. Bitta mato 2-shotda peshona ustida ko'tarilgan sochni ham, 3-shotda tojni yopgan
soyabonni ham bera olmaydi. Jismoniy nomzod -- egilganda soyabon og'irlik bilan peshonaga tushishi (pozaga bog'liq tuzatuvchi
shakl); lekin 3-shotning o'zi uchun eng yaxshi statik shakl ham atigi +0.05 beradi -- qilinmadi.

## 13-o'tish (4-ish): bo'yin va yoqa -- asbob xatosi topildi

**Misolda (yorqinlik bilan o'lchangan, 320x180, median 3):** iyak ostida uchala shotda juda qorong'i bo'lak (L 0-9; qor foni
kadrning pastki qismida L 20-50): 1-shotda bo'yin va yoqaning "X" burmasi, 2-shotda bo'yin/yoqa iyakdan tik pastga va chapda
plashning qorong'i burmalari, 3-shotda iyak ostidagi yoqa.

**Asbob xatosi (MAXFIY nishon, `test/qism/inson/qism_nishon.py`):** figura biti 2-shotda faqat L 15..33 mato, 1-/3-shotda L >= 6,
ich biti L >= 5 bilan olingan edi -- eng qorong'i mato va bo'yin (L < 15) FON deb belgilangan: har kadrda 126-798 px, 2-shotda
3610-3617 px. 12-13-o'tishdagi moslashlar iyak ostida "fon"ga moslangan (2-shotda kapyushonimizning pastki oldi o'sha joydan
itarilgan). Tuzatildi: kadrning pastki qismida (y >= 110; fon u yerda L 20-50) figuraga yoki boshga tutash L < 15 bo'laklar
(>= 20 px) -- figura, boshdan 28 px gacha -- ich. Eski nishon: `qism_nishon_12_eski.json`. Bu bo'limdan boshlab raqamlar yangi
nishonda.

**Model:** bo'yin o'lchami endi `KIYIM.boyin` da (rT, rB, z; qiymatlar o'zgarmadi). Tuzatilgan nishonda sinovlar: bo'yin kengroq
(r 0.40-0.55) va oldinroq (z 0.1-0.15) -- faqat 1-shotda o'zgaradi va yomonroq (2-, 3-shotda bo'yin kapyushonning pastki old
qismi ortida); teshikning pastki qismini ochish (fi4 60-70) -- yomonroq; teshik pasti + bo'yin halqasi + bo'yin + plash tepasi
birga moslash (`test/kap_tuz_fit_K.json`, 71 baho): F 16.009 -> 15.921 -- shovqin darajasida (sahifalar orasida ~0.04), manbaga
yozilmadi.

**Qoldiq:** 2-shotda misolning qorong'i bo'yin/yoqasi iyak ostida bizning qorong'i chegaramizdan ~15 px oldinda (bizda o'sha joyda
osmon), 3-shotda yoqa misolda L 0-9, bizda plash L 20-29. Sababi yorug'likda bo'lishi mumkin: bizda bosh kapyushon/plash uchun
soya va AO beruvchi emas (AO atlasida faqat kapyushon va plash), shu sababli iyak ostidagi mato bosh soyasida qorong'ilashmaydi.

**Hozirgi holat butun 13-o'tish bo'yicha (tuzatilgan nishonda; OLDIN = topshirilgan 12, o'zining SOYA_QORA yashirishi bilan):**

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| butun kadr bosh / tepa | 0.664 -> 0.667 / 0.593 -> 0.589 | 0.655 -> 0.739 / 0.549 -> 0.810 | 0.495 -> 0.433 / -- |
| butun kadr ich | 0.093 -> 0.150 | 0.101 -> 0.136 | 0.084 -> 0.042 |
| qobiq 0.2: bosh / ich / tashqi / figura | 0.778 -> 0.752 / 0.111 -> 0.136 / 0.728 -> 0.731 / 0.898 -> 0.915 | 0.782 -> 0.809 / 0.232 -> 0.236 / 0.812 -> 0.811 / 0.918 -> 0.942 | 0.685 -> 0.548 / 0.084 -> 0.076 / 0.820 -> 0.826 / 0.810 -> 0.843 |
| qobiq 0.55: bosh / ich / tashqi | 0.661 -> 0.666 / 0.069 -> 0.110 / 0.797 -> 0.835 | 0.682 -> 0.775 / 0.048 -> 0.114 / 0.779 -> 0.788 | 0.439 -> 0.408 / 0.062 -> 0.047 / 0.848 -> 0.849 |

3-shotdagi bosh pasayishi -- yashirish olib tashlanganidan (3-ish): OLDIN ustunidagi 3-shot raqami ochiqda turgan sochni ich toniga
bo'yash hisobiga edi.

## 13-o'tish (5-ish): kamera oxirida -- 1-shot kamerasi va pozasi yangi modelga; yakun -- `chiqish/oldin-hozir-3d-13.gif`, `chiqish/maket-13.png`

1-shot kamerasi 12-o'tishda qayta tekshirilmagan edi (faqat 2- va 3-shot). Yuz nishoni: Alonurning belgilari (R03, R10 --
ko'zlar, burun uchi, og'iz o'rtasi, iyak; `test/yuz13_s1.mjs`, MAXFIY) -- joriy kamera/pozada RMS 4.18 px (10-kadrda uzoq ko'z
6.6 px, og'iz 5.3 px; 3-kadrda iyak 4.7 px yuqorida). `test/fit_kamera_tuz.mjs --shot 1` (yuz + butun kadr sinflari + figura):
kamera deyarli joyida (az +0.65, el -1.09 gr, d -0.05), butun shot pozasi qo'shimchasi -- egilish +0.077 (4.4 gr), burilish -0.114
(6.5 gr): yuz RMS 4.18 -> 2.94 px (iyak -4.7 -> -2.5, uzoq ko'z -6.6 -> -3.9). Kapyushon yangi pozada qayta moslandi
(`test/kap_tuz_fit_L.json`: fi1 41.4 -> 35.1, fi2 63.6 -> 56.8, kfB 0.79 -> 1.02, kgB 0.04 -> 0.13, kfE 0.88 -> 0.81, tumshuq 0.56 ->
0.68), so'ng 1-shot kamerasi yana bir bor -- mahalliy optimum (o'zgarish < 0.02). 2- va 3-shot kameralari: +/-3 gr, +/-0.3 d,
+/-0.05 burilish/egilish -- hammasi yomonroq (mahalliy optimum).

**Yakun (topshirilgan 12 -> 13; tuzatilgan nishonda; 12 o'zining SOYA_QORA yashirishi bilan va eski 1-shot kamerasida):**

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| butun kadr bosh IoU | 0.664 -> 0.717 | 0.655 -> 0.751 | 0.495 -> 0.478 |
| kadr tepasi (60 qator) bosh | 0.593 -> 0.678 | 0.549 -> 0.776 | -- |
| butun kadr ich IoU | 0.093 -> 0.140 | 0.101 -> 0.097 | 0.084 -> 0.053 |
| figura (yumshoq) | 0.898 -> 0.908 | 0.918 -> 0.940 | 0.810 -> 0.852 |
| qobiq 0.2 kelishuv / qobiq 0.55 kelishuv | 0.799 -> 0.811 / 0.778 -> 0.798 | 0.855 -> 0.874 / 0.812 -> 0.837 | 0.721 -> 0.775 / 0.713 -> 0.743 |
| yuz RMS (Alonur belgilari) | 4.18 -> 2.94 px | 2.50 (o'zgarmadi) | 4.03 (o'zgarmadi) |

Kamera sinovi (kalibr qayta PROVEN): kamYol 49 va orbita 37 tasvirda hamma qism 0.0000 px. Maketda soch teshib chiqmaydi.

**Qoldiqlar (sabab bilan):** 1-shotda uzoq tomon qirrasi yuz konturidan o'ngda qorong'i tasma bo'lib qoladi (misolda u yerda
osmon; o'ng tomon qorong'isi 1703 -> 1635 px) -- bitta mato uni faqat 2-, 3-shotni buzib yashira oladi; 3-shotda toj teshikdan
ko'rinadi (misolda soyabon ostida); iyak ostidagi yoqa soyasi (bosh soya/AO beruvchi emas); 2-shotda qorong'i uchburchak kichraydi
(qobiq ich 0.176 -> 0.116 5-ish qayta moslashida; topshirilgan 12 da 0.132).

## 13-o'tish (6-ish): SAM 2 soch niqobi -- misol tomonida yangi ko'z -- `chiqish/oldin-hozir-3d-13-soch.gif`, `chiqish/maket-13-soch.png`, `chiqish/soch-sam2-13-ustma.png`

OLDIN = 13-o'tish (5-ish) yakuni (`kadrlar-misol/anime-tuz13f`, rol `rol-tuz13f`), HOZIR = `kadrlar-misol/anime-tuzN` (rol `rol-tuzN`).

**Mexanizm (Alonurning kompyuterida, RTX 3050 4 GB):** `Documents\Code-Video\` -- texnika ildizda, loyihalar alohida:
`env\` (PyTorch CUDA 12.4 + Meta SAM 2 `sam2.1_hiera_small` + CoTracker3, bir marta, ~3.5 GB; `setup.bat` -> `env\bootstrap.py`),
`tools\sam2_video.py` (umumiy: loyiha papkasidagi `frames\*.png` ni shot-shot video qilib, `prompts.json`/`prompts.npz` dagi
nuqta/niqob promptlarini oldinga VA orqaga tarqatadi; ikki yurish: A -- har shotning faqat birinchi belgilangan kadri prompt
(qolgan belgilangan kadr sinov: ko'rsatilmagan), B -- hammasi (ishlab chiqarish); `output\masks_A.npz, masks_B.npz,
sheet_B_<obyekt>.png, log.txt`), `Projects\personaj3d-sam2\` (MAXFIY ma'lumot: 22 kadr, promptlar, Alonur belgilari, `run.bat`).
Yangi loyiha = `Projects\<nom>\` + kadrlar + promptlar + `run.bat` nusxasi; o'rnatish yo'q. Yurish 22 kadrga GPU da 11 + 13 s.
Obyektlar: `face` (nuqtalar: burun, og'iz, iyak, ko'z qatori, jag' belgilaridan 35 % ichkaridagi nuqtalar musbat; 8 soch nuqtasi
va ich markazi manfiy), `head` / `interior` / `garment` / `dark` (niqob promptlari -- bizning bit1/bit2/figura/bo'yin niqoblaridan),
`hair` = `head` minus `face` (hosila). Bu yerda (workspace) faqat natija nusxasi: `test/qism/inson/sam2_masks_{A,B}.npz`, `sam2_log.txt`
(MAXFIY, repo'ga kirmaydi).

**Kalibr (5-yurish, Alonurning belgilariga va bizning niqoblarga qarshi; A -- ko'rsatilmagan kadrlar):**

| | prompt kadrlar (k03, k12, k20) | ko'rsatilmagan k10 / k13 (A) | 3-shot ko'rsatilmagan k14 / k17 / k22 |
|---|---|---|---|
| yuz: jag'+iyak nuqtalari niqob chetigacha, mediana px (+ ichida) | -1 / 0 / +1 | -1 / -1 | +1 / +1 / -1 |
| bosh niqobi IoU bizning bit1 ga | 0.999 (prompt shu) | 0.951 / 0.981 | 0.928 / 0.880 / 0.878 |
| ich niqobi IoU bizning bit2 ga | 0.99 | 0.78 / 0.95 | 0.64 / 0.69 / 0.80 |
| Alonurning soch nuqtalari SAM sochi ichida | 79 % / 100 % / 31 % | 81 % / 41 % | 36 % / 22 % / 44 % |

Jag' nuqtalarining eng uzog'i (-7 .. -17 px) hammasi YAQIN tomonda, osilgan tutam ostida (Alonur jag'ni soch orqali belgilagan;
SAM u pikselni soch deydi) -- xato emas. 4-yurishda SAM yuzi soyadagi yonoqni tashlab yuborgan edi (jag' nuqtalari -28 px gacha),
hosila soch soyadagi teri va bo'yin bilan ifloslangan; 5-yurish (jag' ichidagi musbat nuqtalar) uni tuzatdi.

**Nega SAM (yorug'lik emas), o'lchangan:** 3-shotda soyadagi soch L ~47 (p50) va soyadagi teri L ~43 -- yorug'likda ajralmaydi;
1-2-shotda Alonurning soch nuqtalari SAM sochida 78-100 %, bizning bit8 (yorug' teri, yorug'lik bo'yicha) o'sha nuqtalarning ko'pini
TERI deb olgan edi (R10: 27 dan 13 tasi). **Chegara (o'lchangan):** 3-shotda (egilgan bosh) peshona tutamlari yuz ustiga tushadi
va SAM yuzi ularni ham oladi -- Alonurning soch nuqtalari R14 54 %, R17 52 %, R20 31 % SAM YUZI ichida (1-2-shotda 0-22 %); bizning
bit8 ham shu tutamlarni teri degan edi (R14: 39 dan 22 tasi). Ajratib bo'lmaydi -> SAM yuzi (bit32) soch taqqosidan chiqariladi.

**Nishon (`test/qism/inson/sam2_soch.py` -> `qism_nishon_12.json`):** bit16 = SAM soch (5-yurish B), bit32 = SAM yuz (soch IoU da
hisobsiz). SAM sochining bizning bosh niqobi (bit1) tashqarisidagi qismi qoldi: prompt kadrlarda 0-2 px, qolganlarida 60-390 px --
ko'pi soyadagi yon tutamlar (k06, k14: bit1 ularni L >= 40 chegarasi bilan yo'qotgan), k18 da tepada kapyushon matosiga kichik oqish.

**Asbob (`src/main.js kapTuzBaho`, `test/fit_kap_tuz.mjs --wsF --wsY`):** soch IoU (misol bit16 vs bizning rol yashili, bit32
hisobsiz) va "soch yuz ustida" (bizning soch SAM yuzining sochsiz qismida, ulush; 1-2-shotda jarima -- 3-shotda misolning o'zida
tutamlar yuz ustida). Bir xil parametrlar bir xil sonni beradi (5 marta 0.000 farq); bitta tutam azimuti +1 gr -> soch IoU 0.007
(tutam 1-2 px keng -- asbobning "shovqin qavati" ~0.01).

**Moslangan (bitta dunyo; `kap_tuz_fit_M` soch jarimasi 3, so'ng `_N` jarima 10, manbaga `_N`):** yelpig'ich (L, HK, osil0/1, yass),
yuz yoni tutamlari (az0, az1, dAz, en, off, y0, y1), M da teshik tepasi (ochV0 0.037 -> 0.030) va tumshuq (0.68 -> 0.70) ham:

| | 13 (5-ish) | 13 (6-ish, N) |
|---|---|---|
| yuz yoni: tepa azimuti az0 / pastdagi qo'shimcha dAz | 26.9 gr / 27.3 gr | 22.6 gr / 37.9 gr |
| yuz yoni: en / sirtdan off / ildiz y0 / uch y1 | 0.49 / 0.084 / 0.53 / -0.76 | 0.62 / 0.110 / 0.28 / -0.80 |
| yelpig'ich L / HK / osil0 / osil1 / yass | 0.82 / 1.11 / 0.23 / 0.97 / 1.00 | 0.99 / 0.91 / 0.39 / 0.94 / 0.96 |

**Natija (bir xil asboblar; moslash sahifasi / render (`tuz_olch`, `kadr_baho`) ):**

| | 1-shot | 2-shot | 3-shot |
|---|---|---|---|
| soch IoU (SAM bit16, yuz hisobsiz), moslash sahifasi | 0.381 -> 0.494 | 0.526 -> 0.586 | 0.358 -> 0.393 |
| soch IoU, render | 0.403 -> 0.498 | 0.526 -> 0.585 | 0.399 -> 0.429 |
| soch yuz ustida (SAM yuzining sochsiz qismi, ulush) | 0.032 -> 0.041 | 0.078 -> 0.101 | 0.074 -> 0.095 (jarimasiz) |
| butun kadr bosh IoU, moslash sahifasi | 0.717 -> 0.738 | 0.751 -> 0.760 | 0.478 -> 0.500 |
| kadr tepasi (60 qator) bosh | 0.678 -> 0.705 | 0.776 -> 0.781 | -- |
| butun kadr ich IoU | 0.140 -> 0.147 | 0.097 -> 0.114 | 0.053 -> 0.052 |
| figura (yumshoq) | 0.908 -> 0.907 | 0.940 -> 0.939 | 0.852 -> 0.850 |
| qobiq 0.2 bosh / qobiq 0.55 bosh (render) | 0.772 -> 0.772 / 0.706 -> 0.734 | 0.832 -> 0.820 / 0.751 -> 0.778 | 0.621 -> 0.621 / 0.432 -> 0.471 |
| Alonurning 182 soch nuqtasi bizning renderda soch ustida | 17 % -> 26 % (R03 0 -> 4 / 24, R10 8 -> 13 / 27) | | |

M (jarima 3) sochni ko'proq oladi (0.535 / 0.607 / 0.404) lekin yuz ustida ko'proq (0.069 / 0.124); N tanlandi (10-o'tishdagi
xato -- yaqin tutam bosh burilganda yuzga o'tadi -- shu yerda boshlanadi). Kamera sinovi (`test/kamera_sinov9.mjs`, kalibr
PROVEN): kamYol 49 va orbita 37 tasvirda hamma qism 0.00 px. Maketda (`chiqish/maket-13-soch.png`) soch matoni teshib chiqmaydi.
Yuz RMS o'zgarmadi (kamera/poza tegilmadi).

**Qoldiq (2D chizma, o'lchangan -- `src/personaj.js` SOCH.yuzyon izohi):** yaqin tutam 1-shotda (3/4) yonoq USTIDA, yaqin ko'zdan
7-15 px gacha (R03: soch x 62-90, ko'z x 97); 2-shotda (profil) o'sha tutam ko'zdan 20-40 px ORQADA (R12: soch x 96-117, ko'z x 138),
yonoq oldi toza. Teshik-kamera hisobi: 3/4 da ko'zdan 7 px ga yetadigan qattiq nuqta (bosh azimuti ~35-45 gr) profilda ko'z
oldiga (off 0) yoki burun oldiga (off 0.5-1) tushadi -- bitta qattiq tutam ikkalasini bera olmaydi; jarima 10 bilan ham moslash
o'rtani oldi (az0 21.6 -> 22.6 gr). Qolgan farq: 1-shotda teshikning yaqin-yuqori tomoni (bizning soch u yerda kapyushondan chiqadi,
misolda kapyushon; 1-ish qoldig'i); 3-shotda SAM sochining 0.43 IoU si -- misolda soyabon ostidagi yorug' toj bizda yo'q (3-ish).

**Alonur belgilaridan (soch, MAXFIY) foydalanish:** R03, R10, R12, R13, R14, R17, R20, R22 -- 182 soch nuqtasi; bu o'tishda faqat
tekshiruvga (SAM va bizning render qanchasini oladi), moslashga kirmadi (nuqta -- chiziq emas, IoU ga to'g'ri kelmaydi).

## Ochiq (12-o'tishdan keyin)

1. ~~**Tepadagi soch va kapyushon**~~ -- 13-o'tish (1-ish) ga qarang; qoldiq: 1-shotda teshikning yaqin-yuqori tomoni, 3-shotda
   peshona tutamlari soyabon oldida.
2. **Qorong'i uchburchak:** 13-o'tish (2-ish) ga qarang -- iyak ostidagi teshik torroq; 3-shotdagi ortiqcha qorong'i 3-ishda hal
   bo'ldi (kapyushon soyasi yashirishi olib tashlandi); qoldiq: 1-shotda uzoq tomon qirrasi -- 5-ishda 1-shot kamerasi/pozasi
   qayta tekshirildi, bu qoldiqni tushuntirmaydi (o'ng tomon qorong'isi 1703 -> 1635 px).
3. **3-shot:** 13-o'tish (3-ish) ga qarang -- soyabon ostidagi soch endi yorug' (yashirish olib tashlandi); qoldiq: toj teshikdan
   ko'rinadi (misolda soyabon ostida).
4. Kapyushon juda keng (yon yarim eni 1.88 bosh birligi) -- misolning uch ko'rinishi (bosh fazosida az 45-64 gr) sof yon tomonni
   cheklamaydi: 90 gr dan yuz qirra ortida qoladi. 13-o'tish (2-ish): toraytirish (kengX 1.0, R0 1.4) uch shotda ham yomonroq --
   o'lchov kenglikni o'zgartirishni talab qilmaydi.
5. Oldingi ro'yxatdan: bo'yin (13-o'tish 4-ish: nishon tuzatildi; qoldiq -- iyak ostidagi yoqa soyasi, bosh soya/AO beruvchi emas), qosh detektori, qor (kesishda uzluksizlik, zichlik), qo'l yo'q, `siyoh`/
   `akvarel` yangi kapyushon bilan tekshirilmagan, ovoz yo'q.
6. **Soch (SAM 2 niqobi, 13-o'tish 6-ish):** soch IoU 0.49 / 0.59 / 0.43 -- qoldiq 2D: yaqin tutam 3/4 da yonoq ustida, profilda
   ko'z ortida (bitta qattiq tutam bera olmaydi); 3-shotda soyabon ostidagi toj. Keyingi: Alonurning soch nuqtalarini chiziq
   (tutam o'qi) sifatida moslashga kiritish; SAM ni CoTracker3 bilan (tutam uchlarining harakati -- fizika osil/shK ga).
