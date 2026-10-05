"""Loyiha sozlamasi. Kodda qattiq yozilgan yo'l, o'lcham yoki kadr soni yo'q --
hammasi shu JSON dan. Nisbiy yo'llar sozlama fayli joylashgan papkaga nisbatan.

Minimal sozlama:
{
  "nom": "...",
  "misol": "/yo'l/k%02d.png",  "misol_boshi": 1,      # 1-kadr qaysi indeksda
  "biz":   "/yo'l/ff/%02d.png", "biz_boshi": 0,
  "olcham": [320, 180],                                  # IKKALA tomon shu o'lchamda o'lchanadi
  "kadrlar": 22,
  "guruhlar": {"1-kadr": [1, 11]},                        # 1 dan boshlab, ikkala chet ichida
  "eski": "/yo'l/ff-eski/%02d.png",                       # ixtiyoriy: oldingi holat (oldin/keyin)
  "transform": "transform.json",                          # ixtiyoriy: yoyish uchun
  "langar": {...}, "zondlar": [...],                      # zond.py ga qarang
  "siluetlar": [...]                                      # siluet.py ga qarang
}
"""
import json, os


class Loyiha:
    def __init__(self, yol):
        self.yol = os.path.abspath(yol)
        self.papka = os.path.dirname(self.yol)
        with open(yol, encoding='utf-8') as f:
            self.d = json.load(f)
        d = self.d
        for k in ('misol', 'biz', 'kadrlar'):
            if k not in d:
                raise ValueError(f"sozlamada '{k}' yo'q: {yol}")
        self.nom = d.get('nom', os.path.basename(yol))
        self.olcham = tuple(d.get('olcham', [320, 180]))
        self.n = int(d['kadrlar'])
        self.guruhlar = {k: tuple(v) for k, v in d.get('guruhlar', {}).items()}
        self.langar = d.get('langar')
        self.zondlar = d.get('zondlar', [])
        self.siluetlar = d.get('siluetlar', [])
        self.sozlama = d.get('sozlama', {})

    def _y(self, p):
        return p if (p is None or os.path.isabs(p)) else os.path.join(self.papka, p)

    def fayl(self, tomon, k):
        """k -- 1 dan boshlanadigan kadr raqami. tomon: misol | biz | eski"""
        naqsh = self._y(self.d[tomon])
        bosh = self.d.get(tomon + '_boshi', 1 if tomon == 'misol' else 0)
        return naqsh % (k - 1 + bosh)

    def bor(self, tomon):
        return tomon in self.d

    def transform_yol(self):
        return self._y(self.d.get('transform'))

    def guruh(self, nom_yoki_oraliq):
        """'1-kadr' yoki '1-11' yoki '3' -> [kadr raqamlari]"""
        s = str(nom_yoki_oraliq)
        if s in self.guruhlar:
            a, b = self.guruhlar[s]
            return list(range(a, b + 1))
        return oraliq(s)


def oraliq(s):
    """'1-11' -> [1..11]; '1,3,5-7' -> [1,3,5,6,7]"""
    out = []
    for q in str(s).split(','):
        q = q.strip()
        if not q:
            continue
        if '-' in q:
            a, b = q.split('-')
            out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(q))
    return out
