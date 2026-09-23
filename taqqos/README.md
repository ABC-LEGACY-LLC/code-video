# taqqos — misolga kadrma-kadr taqqoslash to'plami

Kod bilan chizilgan kadrlarni (biz) namuna klipga (misol) **bir xil kod bilan, har
kadrda** solishtiradi va farqlarni raqam bilan, eng kattasidan boshlab beradi.
Usul, nima uchun aynan shunday qilingani va qaysi xatolar qayerdan topilgani —
[`METOD.md`](METOD.md) da.

> Misol — o'lchov manbai, asar emas. Undan **texnika** o'lchanadi (vaqt, joylashuv,
> harakat, ton); personaji va rasmi takrorlanmaydi. Shakllar bizning modelimizdan
> chiziladi va o'lchovga *moslanadi*, misoldan kuzatib chizilmaydi.

## O'rnatish

Python 3.10+, `numpy`, `scipy`, `Pillow`. Tarmoq kerak emas.

```bash
pip install numpy scipy pillow
cd taqqos
python3 -m taqqos kalibr          # birinchi ish: har o'lchov isbotlanganmi
```

`kalibr` har o'lchovni javobi oldindan ma'lum sintetik tasvirda sinaydi: yaxshi
holat va ataylab buzilgan holat. Ajrata olmagan o'lchov `UNPROVEN` — uning
raqamlariga ishonilmaydi va buyruq 1 bilan tugaydi. Hozir 10/10 `PROVEN`.

## Sozlama (loyiha JSON)

Kodda yo'l, o'lcham yoki kadr soni yo'q — hammasi loyiha faylida. Nisbiy yo'llar
sozlama joylashgan papkaga nisbatan. To'liq namuna: [`sozlama-namuna.json`](sozlama-namuna.json).

| kalit | ma'nosi |
|---|---|
| `misol`, `biz` | kadr yo'li naqshi (`k%02d.png`), `*_boshi` — 1-kadr qaysi raqamda |
| `eski` | ixtiyoriy: oldingi holat (oldin/keyin varaqalari uchun) |
| `olcham` | IKKALA tomon shu o'lchamga keltiriladi (LANCZOS, keyin L) |
| `kadrlar`, `guruhlar` | kadr soni; kadr (shot) guruhlari `{"1-kadr":[1,11]}` |
| `langar` | har kadrda MISOLDA o'lchanadigan tayanch nuqta (qattiq nishon) |
| `zondlar` | nomlangan o'lchovlar (quyida) |
| `siluetlar` | figura niqobining qatorma-qator profili |
| `transform` | ixtiyoriy: sub'ekt fazosiga yoyish uchun har kadr markazi/rol/masshtab |

Har zond va siluetda `"izoh"` yozing: zond nega shu joyda, oldin nima bo'lgani.
Zond tuzatilganda sababi shu yerda qoladi (qarang: METOD.md, «Zond xatosi»).

### Zond turlari (`zond.py`)

| tur | nima o'lchaydi | asosiy qiymat |
|---|---|---|
| `komponent` | qorong'i/yorug' bog'langan soha (urug'dan yoki qutidagi eng qorong'i/yorug' nuqtadan) | markaz `x y`, `w h n` |
| `chet` | chiziq bo'ylab birinchi o'tish (subpiksel) | masofa `t` |
| `soha` | qutidagi median L (va rang) | `v` |
| `hisob` | qutida L oralig'idagi piksellar soni | `n` (farq — foiz) |
| `uch` | qorong'i niqobning bog' nuqtasiga ulangan qismining chekka nuqtasi | `x y` |

`"nisbiy": true` — geometriya langardan hisoblanadi va ikkala tomonga AYNAN
o'sha joyda qo'llanadi: bosh qimirlasa ham zond o'sha yuz nuqtasini o'lchaydi,
farq esa shakl xatosini ko'rsatadi. `"quti"` lug'at bo'lishi mumkin — har kadrga
o'z qutisi. `"kadrlar": "6-11"`, `"tol"` — bayroq chegarasi (px; `hisob` da %).

## Buyruqlar

```bash
python3 -m taqqos <buyruq> LOYIHA.json [...]
```

| buyruq | nima beradi |
|---|---|
| `kalibr` | har o'lchovning buzilgan-holat sinovi |
| `zond --kadrlar 1-kadr [--json F]` | har kadrda har zond farqi (biz − misol), `*` bayroq, oxirida **eng katta farqlar** ro'yxati |
| `varaq --kadrlar 1-11 --quti=x0,y0,x1,y1 [--zoom 4] [--qatorlar misol,eski,biz,ustma] [--langarli] [--chozish 0,70]` | kadrma-kadr ko'rish varaqasi; `ustma`: magenta = faqat misolda yorug', yashil = faqat bizda yorug', kulrang = mos |
| `setka --kadr 5 --quti=... [--zoom 8]` | to'rli kattalashtirish, piksel koordinatalari bilan |
| `jadval --kadr 5 --quti=x0,x1,y0,y1 [--tomon biz]` | L qiymatlari jadvali (raqam bilan o'qish) |
| `siluet --nom tana_ong` yoki `--quti=... --bog x,y [--shart "<20"] [--yon ong] [--chiq F] [--qator 5]` | figura cheti har qatorda: IoU, maydon %, qaysi qatorlarda qancha farq |
| `harakat --kadrlar 1-11 --quti=...` | juftma-juft blok siljishi: harakat (median) va qaynash (tarqoqlik) |
| `ritm --kadrlar 1-kadr` | kesishlar, tendensiya, har juft farqi va juftlar MAE |
| `xarita --juftlar 1-2,6-7 --chiq F` | tasvirlararo farq xaritalari, chap/o'ng energiya ulushi bilan |
| `yopilish --kadrlar 1-kadr` | zarralar (qor) yopgan joydan figura xaritasi va IoU |
| `yoyish --kadr 1 [--chiq F] [--jadval ...]` | sub'ekt fazosiga yoyilgan varaq/jadval |
| `gif --chiq F` | yonma-yon GIF |

Manfiy son bilan boshlanadigan qiymatni `=` bilan bering: `--quti=-40,-34,52,66`.

## Bir o'tish (tartib)

1. `kalibr` — hammasi `PROVEN`.
2. `zond` — **hamma** kadrlar, ranglangan jadval; eng katta farqlardan boshlang.
3. Har katta farq uchun `varaq`/`setka`/`jadval` — raqam nimaga tegdi, ko'z bilan.
   Zond boshqa narsaga tegsa — bu chizma xatosi emas, **zond xatosi**: zondni
   tuzating, `izoh` ga sababini yozing.
4. Tuzatish modelning o'z parametrlarida (kalit, jadval), o'lchangan son bilan.
5. Qayta o'lchash: o'sha zond + qo'shnilari + `siluet`/`harakat`/`ritm`.
6. `varaq --qatorlar misol,eski,biz` — oldin/keyin.
7. Topilmalarni loyiha kartasiga yozing: nima o'lchandi, oldin/keyin raqami.

## Fayllar

```
taqqos/
  loyiha.py    sozlama                 zond.py     zondlar va farq jadvali
  tasvir.py    yuklash, bir o'lcham    varaq.py    ko'rish varaqalari
  harakat.py   harakat/qaynash         farq.py     ritm, farq xaritalari
  yopilish.py  zarra -> figura         yoyish.py   sub'ekt fazosi
  siluet.py    siluet profili          kalibr.py   buzilgan-holat sinovlari
```
