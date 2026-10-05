"""taqqos -- misol (maqsad klip) va biz (kod bilan chizilgan kadrlar) ni BIR XIL
kod bilan, har kadrda, har belgi bo'yicha solishtirish.

Asosiy qoida: har o'lchov o'zining ataylab buzilgan holatini olib yuradi
(taqqos/kalibr.py). Buzilgan holatni ajrata olmaydigan o'lchov -- UNPROVEN.

Modullar:
  loyiha    -- JSON sozlama: yo'llar, o'lcham, guruhlar, langar, zondlar
  tasvir    -- kadrni ishchi o'lchamga keltirib yuklash (L yoki RGB)
  zond      -- har kadrda nomlangan o'lchovlar (komponent, chet, soha, hisob, uch)
  varaq     -- ko'z bilan tekshirish varaqalari (kadrma-kadr, langarga bog'langan,
               magenta/yashil ustma-ust, to'rli kattalashtirish)
  harakat   -- juftma-juft blok siljishi: harakat (median) va qaynash (tarqoqlik)
  farq      -- tasvirlararo farq xaritalari, ritm (kesish, tendensiya)
  yopilish  -- zarralar (qor, yomg'ir) yopilgan joy -> figura xaritasi
  yoyish    -- sub'ekt fazosiga yoyish (markaz, rol, masshtab qaytariladi)
  siluet    -- figura niqobining qatorma-qator chekkasi: IoU, maydon, farqli qatorlar
  kalibr    -- har o'lchovning buzilgan-holat sinovi

Qo'llanma: README.md (buyruqlar, sozlama); usul va o'rganilganlar: METOD.md.
"""
__version__ = "1.1.0"
