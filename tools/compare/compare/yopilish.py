"""YOPILISH XARITASI -- zarralar (qor, yomg'ir, chang) ORTIDA turgan figura.

Qorong'i plashni qorong'i osmondan yorqinlik bilan ajratib bo'lmaydi (ikkalasi
L~20), lekin zarra bilan ajratsa bo'ladi: zarra hech qachon ko'rinmagan blokning
oldida nimadir bor. To'rt urinish tarixi (hammasi yozilgan, chunki har biri
boshqa loyihada ham takrorlanadi):
  1) har yorug' nuqta = zarra -> IoU 0.65: soch tolalari, ko'z yaltirog'i ham
     nuqta. Zarra HARAKAT qiladi: tasvirlarning yarmidan ko'pida yonib turgan
     piksel turg'un -- figuraning o'zi.
  2) qat'iy "zarra yo'q" -> 0.71: chetdagi blok qisman ochiq. Endi QOPLANGAN
     ULUSH: blokdagi zarra / shu qatordagi ochiq osmon zarrasi (75-foizil).
  3) -> 0.72: siyrak qatorlarda osmonda yakka "figura" bloklari. Figura BITTA
     bog'langan massa: eng katta qism, teshiklari to'ldirilgan.
  4) -> 0.82..0.87 (aniq niqobga nisbatan).
Parametrlar sozlamada: blok (px), chegara (top-hat), median (px)."""
import numpy as np
from scipy import ndimage
from . import tasvir


def zarra(L, chegara=28, median=9):
    return (L - ndimage.median_filter(L, size=median)) > chegara


def xarita(F, blok=10, chegara=28, median=9):
    H, W = F[0].shape
    gy, gx = H // blok, W // blok
    bl = lambda M: M[:gy * blok, :gx * blok].reshape(gy, blok, gx, blok).mean(axis=(1, 3))
    Z = np.array([zarra(L, chegara, median) for L in F])
    turgun = Z.mean(0) > 0.5
    z = np.mean([bl((m & ~turgun).astype(float)) for m in Z], 0)
    ref = np.maximum(np.percentile(z, 75, axis=1, keepdims=True), 1e-4)
    m = np.clip(1 - z / ref, 0, 1) > 0.5
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n:
        sz = ndimage.sum(m, lab, range(1, n + 1))
        m = ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sz))))
    return m


def iou(a, b):
    return float((a & b).sum() / max(1, (a | b).sum()))


def taqqos(loy, kadrlar, **kw):
    Fm = [tasvir.ol(loy.fayl('misol', k), loy.olcham) for k in kadrlar]
    Fb = [tasvir.ol(loy.fayl('biz', k), loy.olcham) for k in kadrlar]
    xm, xb = xarita(Fm, **kw), xarita(Fb, **kw)
    return xm, xb, iou(xm, xb)


def chiz(m):
    return '\n'.join('   ' + ''.join('#' if v else '.' for v in r) for r in m)
