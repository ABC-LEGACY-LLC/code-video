"""SAM 2 SOCH NIQOBI -> NISHON BITLARI (13-o'tish, 6-ish; MAXFIY -- misoldan). qism_nishon_12.json ga ikki bit qo'shadi:
  16 -- soch: SAM 2 'hair' obyekti (= 'head' minus 'face', Code-Video/tools/sam2_video.py, 5-yurish: yuz promptida jag'
        belgilaridan ichkaridagi musbat nuqtalar -- soyadagi yonoq ham yuz). Boshimiz (bit1, L >= 40) tashqarisidagi qismi ham
        qoladi: 5 belgilangan kadrda 0-2 px, qolganlarida 60-390 px -- ko'pi soyadagi yon tutamlar (k06, k14: bit1 ularni
        yo'qotgan; leak.png bilan tekshirilgan), k18 da tepada kapyushon matosiga kichik oqish.
  32 -- SAM 2 yuz: soch IoU da "hisobga olinmaydi" hududi. Sabab (o'lchangan): 3-shotda (egilgan bosh) peshona tutamlari yuz
        ustiga tushadi va SAM yuzi ularni ham oladi -- Alonurning soch nuqtalari R14 54 %, R17 52 %, R20 31 % SAM yuzi ichida;
        1-2-shotda 0-22 %. Bizning bit8 (yorug' teri, yorug'lik bo'yicha) ham o'sha tutamlarni teri deb olgan edi (R14: 39 soch
        nuqtasidan 22 tasi bit8 da). Ajratib bo'lmaydi -- shu hudud soch taqqosidan chiqariladi (bosh IoU uni baribir ushlaydi).
Nega SAM (yorug'lik emas): soyadagi soch (3-shotda, L p50 ~47) va soyadagi teri (L ~43) yorug'likda ajralmaydi; 1-2-shotda
Alonurning soch nuqtalari SAM sochida 78-100 %, bizning bit8 ularning ko'pini teri degan edi.
Kirish: test/qism/inson/sam2_masks_B.npz (yurish-5 nusxasi; asl: Documents\\Code-Video\\Projects\\personaj3d-sam2\\output).
python3 test/qism/inson/sam2_soch.py   (avval qism_nishon.py -- u 16/32 bitlarni yozmaydi, bu skript ularni ustiga qo'shadi)"""
import os, json, base64
import numpy as np
H = os.path.dirname(os.path.abspath(__file__)); J = os.path.join(H, 'qism_nishon_12.json')
Q = json.load(open(J)); R = np.load(os.path.join(H, 'sam2_masks_B.npz'))
n16 = []; n32 = []
for k in range(22):
    m = np.frombuffer(base64.b64decode(Q['m'][str(k)]), np.uint8).reshape(180, 320).copy()
    m &= 15                                             # eski 16/32 ni tashla
    m[R['hair'][k]] |= 16; m[R['face'][k]] |= 32
    n16.append(int((m & 16 > 0).sum())); n32.append(int((m & 32 > 0).sum()))
    Q['m'][str(k)] = base64.b64encode(m.tobytes()).decode()
Q['izoh'] = ("MAXFIY: misoldan. bit1 ko'rinadigan bosh, bit2 kapyushon ichi, bit4 figura, bit8 yorug' teri; "
             "bit16 soch (SAM 2 hair = head minus face, 5-yurish), bit32 SAM 2 yuz (soch IoU da hisobga olinmaydi) -- test/qism/inson/sam2_soch.py")
json.dump(Q, open(J, 'w'))
print('bit16 soch px:', n16); print('bit32 yuz  px:', n32)
