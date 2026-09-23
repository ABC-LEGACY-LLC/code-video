# Skill'lar — faqat shu loyiha (code-video) doirasida

Bu repodagi ishlar qaysi ko'rsatmalar ostida qilingan bo'lsa, o'sha skill'lar shu
repoda turadi: **`.claude/skills/`** (Claude Code uni loyiha skill'i sifatida faqat
shu repo ichida o'qiydi). Asl nusxa (manba) — shu fayllar.

| skill | versiya | nima qiladi |
|---|---|---|
| [`media-audit-reality`](../.claude/skills/media-audit-reality/SKILL.md) | 1.3.0 | chiqarilgan film, rasm yoki ovozni ko'z va quloq bilan emas, o'lchov bilan haqiqatga solishtirish. Oq Ko'chadagi 41 tekshiruv va `loyihalar/` dagi 14 tasi shu yondashuvdan o'sib chiqqan: har tekshiruv o'zining ataylab buzilgan holatini olib yuradi, isbotlay olmasa `UNPROVEN` |
| [`code-audit-structure-scale`](../.claude/skills/code-audit-structure-scale/SKILL.md) | 1.0.1 | kattalashgan manbani qayta tuzish kerakmi: ta'sir radiusi, sintetik masshtab sinovi, mashina va muallif narxi |
| [`media-match-reference`](../.claude/skills/media-match-reference/SKILL.md) | 1.0.0 | kod bilan chizilgan animatsiyani namuna klipga kadrma-kadr, o'lchov bilan yaqinlashtirish; asbobi — [`taqqos/`](../taqqos/), usul va topilmalar — [`taqqos/METOD.md`](../taqqos/METOD.md) |

## Chegara

Bu uchala skill **abc UX-audit oilasiga kirmaydi** (`github.com/AlonurKomilov/skills` —
veb va dashboard loyihalari uchun `ux-audit-*` skill'lari). U yerga qo'shilmaydi,
u yerdagi README yoki taksonomiyaga yozilmaydi, u yerdagi skill'lar bu yerdan
o'zgartirilmaydi. Har SKILL.md boshida shu chegara yozilgan.

Sabab: bir oilaning fayllariga boshqa loyihaning ma'lumoti yozilsa, o'sha oila
bilan ishlaydigan kishi uni to'g'ri deb o'qib, o'z to'g'ri ma'lumotini noto'g'riga
o'zgartirib qo'yishi mumkin.

## Versiyalar

- `media-audit-reality` 1.3.0 — 10-o'tishdan uchta qo'shimcha: bir hujjatdagi ko'p
  kadrda id lar kadrga xos bo'lishi (takrorlangan klip id); har zond nimaga
  tegganini ko'rish; ushlangan rasm titramaydi (bitta urug' bilan ham), ushlangan
  joydagi haqiqiy ikkilamchi harakatni median emas, farq xaritasi ko'radi.
  Sarlavhasi endi shu loyihaga bog'langan (oldin abc oilasiga yozilgan edi).
- `code-audit-structure-scale` 1.0.1 — mazmuni o'zgarmagan; faqat doirasi
  (shu loyiha) va manba ko'rsatkichi tuzatildi.
- `media-match-reference` 1.0.0 — yangi.

Claude akkauntidagi nusxalar shu fayllardan yuklanadi; farq qilsa — shu yerdagisi to'g'ri.
