"""Kadrni ishchi o'lchamga keltirib yuklash.

IKKALA tomon bir xil o'lchamga (LANCZOS) keltiriladi: ton, chet va farq o'lchovlari
o'lchamga bog'liq -- 540 da chizilgan kadrni 320 dagi misol bilan to'g'ridan-to'g'ri
solishtirish chiziq qalinligini, yorug' chiziq cho'qqisini, zarra o'lchamini buzadi.
L = PIL 'L' (0.299R+0.587G+0.114B), RGB dan o'lchamga keltirilgandan KEYIN olinadi."""
import numpy as np
from PIL import Image

_kesh = {}


def ol(yol, olcham, rejim='L'):
    k = (yol, tuple(olcham), rejim)
    if k in _kesh:
        return _kesh[k]
    im = Image.open(yol).convert('RGB')
    if im.size != tuple(olcham):
        im = im.resize(tuple(olcham), Image.LANCZOS)
    a = np.asarray(im.convert('L') if rejim == 'L' else im).astype(np.float64)
    _kesh[k] = a
    return a


def rasm(yol, olcham):
    im = Image.open(yol).convert('RGB')
    return im if im.size == tuple(olcham) else im.resize(tuple(olcham), Image.LANCZOS)


def kesh_tozala():
    _kesh.clear()
