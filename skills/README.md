# Skill'lar — faqat shu loyiha (code-video) doirasida

Bu repodagi ishlar qaysi ko'rsatmalar ostida qilingan bo'lsa, o'sha skill'lar shu
repoda turadi: **`.claude/skills/`** (Claude Code uni loyiha skill'i sifatida faqat
shu repo ichida o'qiydi). Asl nusxa (manba) — shu fayllar.

| skill | versiya | nima qiladi |
|---|---|---|
| [`media-audit-reality`](../.claude/skills/media-audit-reality/SKILL.md) | 1.3.0 | chiqarilgan film, rasm yoki ovozni ko'z va quloq bilan emas, o'lchov bilan haqiqatga solishtirish. Oq Ko'chadagi 41 tekshiruv va `loyihalar/` dagi 14 tasi shu yondashuvdan o'sib chiqqan: har tekshiruv o'zining ataylab buzilgan holatini olib yuradi, isbotlay olmasa `UNPROVEN` |
| [`code-audit-structure-scale`](../.claude/skills/code-audit-structure-scale/SKILL.md) | 1.0.1 | kattalashgan manbani qayta tuzish kerakmi: ta'sir radiusi, sintetik masshtab sinovi, mashina va muallif narxi |
| [`media-match-reference`](../.claude/skills/media-match-reference/SKILL.md) | 1.4.0 | kod bilan chizilgan animatsiyani namuna klipga kadrma-kadr, o'lchov bilan yaqinlashtirish; asbobi — [`taqqos/`](../taqqos/), usul va topilmalar — [`taqqos/METOD.md`](../taqqos/METOD.md) |
| [`media-staging-audit`](../.claude/skills/media-staging-audit/SKILL.md) | 1.1.0 | detallardan oldin sahna: har shotda nima qiladi, qayerga qaraydi, kamera qayerda (3D da; bitta ko'rinish faqat nisbiy yo'nalishni beradi), kontur qatorlari, renderda tekshirish |
| [`media-3d-consistency-audit`](../.claude/skills/media-3d-consistency-audit/SKILL.md) | 1.0.0 | 3D modelni chizilgan misolga moslashda "3D ichida 2D fikrlash"ni topish: shot, ko'rinish burchagi yoki kadrga bog'langan shakl/joy/fon; faqat kamera yuradigan kalibrlangan sinov; har yamoq o'rniga barcha shotlarga birgalikda moslangan bitta dunyo |

## Chegara

Bu skill'lar **abc UX-audit oilasiga kirmaydi** (`github.com/AlonurKomilov/skills` —
veb va dashboard loyihalari uchun `ux-audit-*` skill'lari). U yerga qo'shilmaydi,
u yerdagi README yoki taksonomiyaga yozilmaydi, u yerdagi skill'lar bu yerdan
o'zgartirilmaydi. Har SKILL.md boshida shu chegara yozilgan.

Sabab: bir oilaning fayllariga boshqa loyihaning ma'lumoti yozilsa, o'sha oila
bilan ishlaydigan kishi uni to'g'ri deb o'qib, o'z to'g'ri ma'lumotini noto'g'riga
o'zgartirib qo'yishi mumkin.

## Versiyalar

- `media-3d-consistency-audit` 1.0.0 — yangi (personaj3d 9-o'tish, 1-qadam). Sakkiz
  o'tishda yig'ilgan oltita yamoq (ko'z kartasi, pastki yuz surishi, soch aralashmasi,
  shot bo'yicha kapyushon, kameraga yopishgan qor, fon "tepasi"); faqat kamera yuradigan
  sinov (poza va vaqt ushlangan; kalibr: yamoqlar muzlatilganda 0.0000 px, sun'iy siljish
  mustaqil kamera modelining o'zi) — kapyushon 114 / 159 px, ko'z 33 / 36 px sakraydi, qor
  138 px kamera bilan yuradi; qor qutisi haqidagi "sabab" sinab ko'rilib tasdiqlanmadi.
- `media-staging-audit` 1.1.0 — 4- va 6-bo'lim: ko'rinishga bog'liq chizma usuli va 2D
  fon qatlami endi O'LCHANADI, 3D modelga qurilmaydi (1.0.0 dagi ko'z kartasi va fon
  "tepasi" kamera sinovida sirg'anib-sakradi); `media-3d-consistency-audit` ga havola.
- `media-staging-audit` 1.0.0 — yangi (5-o'tish: sahna avval).
- `media-match-reference` 1.4.0 — "qismlar alohida: yalang'och model avval, keyin qatlamlar" (ro'yxat, o'zimizda
  kalibr, model izi = render, poza shaklni yutadi, asosiy shot + yomonlashmasin jarimasi, ustma-ust niqob) (10-o'tish).
- `media-match-reference` 1.3.0 — "3D model shotlar bo'yicha emas, birgalikda moslanadi"
  bo'limi va `media-3d-consistency-audit` ga havola.
- `media-match-reference` 1.2.0 — kamera va fizika: avval kamera o'qiladi, keyin
  tegish/og'irlik modelni cheklaydi; qisman yopilgan massaning markazi joy emas.
- `media-match-reference` 1.1.0 — optimizator ko'rmagan joyni buzadi (soch o'tishi).
- `media-audit-reality` 1.3.0 — 10-o'tishdan uchta qo'shimcha: bir hujjatdagi ko'p
  kadrda id lar kadrga xos bo'lishi (takrorlangan klip id); har zond nimaga
  tegganini ko'rish; ushlangan rasm titramaydi (bitta urug' bilan ham), ushlangan
  joydagi haqiqiy ikkilamchi harakatni median emas, farq xaritasi ko'radi.
  Sarlavhasi endi shu loyihaga bog'langan (oldin abc oilasiga yozilgan edi).
- `code-audit-structure-scale` 1.0.1 — mazmuni o'zgarmagan; faqat doirasi
  (shu loyiha) va manba ko'rsatkichi tuzatildi.
- `media-match-reference` 1.0.1 — "oldin" topshirilgan faylning o'zi bo'lishi kerak:
  10-o'tishning "oldin" papkasi qayta render bo'lib, yangi bosh joylashuvini olib
  yurgan edi. Natija raqamlari topshirilgan 9-o'tishga nisbatan qayta o'lchandi
  (siluet 0.71 → 0.87, figura xaritasi 0.89 → 0.95); 1.0.0 dagi "0.86" xatosi
  tuzatildi.
- `media-match-reference` 1.0.0 — yangi.

Claude akkauntidagi nusxalar shu fayllardan yuklanadi; farq qilsa — shu yerdagisi to'g'ri.
