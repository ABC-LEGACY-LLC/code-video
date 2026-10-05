"""SAM 2 HAIR MASK -> TARGET BITS (pass 13, item 6; PRIVATE -- from the sample). Adds two bits to part_target_12.json:
  16 -- hair: the SAM 2 'hair' object (= 'head' minus 'face', Code-Video/tools/sam2_video.py, run 5: in the face prompt,
        positive points inside the jaw marks -- the cheek in shadow is face too). The part outside our head (bit1, L >= 40)
        stays as well: 0-2 px on the 5 marked frames, 60-390 px on the rest -- mostly side strands in shadow (k06, k14: bit1
        had lost them; checked with leak.png), at k18 a small spill at the top onto the hood cloth.
  32 -- SAM 2 face: the "not counted" region of the hair IoU. Reason (measured): in shot 3 (head tilted) the forehead
        strands fall over the face and the SAM face takes them too -- Alonur's hair points are R14 54 %, R17 52 %, R20 31 %
        inside the SAM face; in shots 1-2, 0-22 %. Our bit8 (lit skin, by brightness) had also taken those strands as skin
        (R14: of 39 hair points, 22 in bit8). They cannot be told apart -- this region is left out of the hair comparison
        (the head IoU catches it anyway).
Why SAM (not brightness): hair in shadow (shot 3, L p50 ~47) and skin in shadow (L ~43) do not separate by brightness; in
shots 1-2 Alonur's hair points are 78-100 % inside the SAM hair, while our bit8 had called most of them skin.
Input: private/test/parts/human/sam2_masks_B.npz (a copy of run 5; original: Documents\\Code-Video\\Projects\\personaj3d-sam2\\output).
python3 test/parts/human/sam2_hair.py   (part_target.py first -- it does not write bits 16/32, this script adds them on top)"""
import os, json, base64
import numpy as np
H = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'private', 'test', 'parts', 'human'))   # the private marks, targets and SAM 2 masks
J = os.path.join(H, 'part_target_12.json')
Q = json.load(open(J)); R = np.load(os.path.join(H, 'sam2_masks_B.npz'))
n16 = []; n32 = []
for k in range(22):
    m = np.frombuffer(base64.b64decode(Q['m'][str(k)]), np.uint8).reshape(180, 320).copy()
    m &= 15                                             # drop the old 16/32
    m[R['hair'][k]] |= 16; m[R['face'][k]] |= 32
    n16.append(int((m & 16 > 0).sum())); n32.append(int((m & 32 > 0).sum()))
    Q['m'][str(k)] = base64.b64encode(m.tobytes()).decode()
Q['note'] = ("PRIVATE: from the sample. bit1 visible head, bit2 hood inner, bit4 figure, bit8 lit skin; "
             "bit16 hair (SAM 2 hair = head minus face, run 5), bit32 SAM 2 face (not counted in the hair IoU) -- test/parts/human/sam2_hair.py")
json.dump(Q, open(J, 'w'))
print('bit16 hair px:', n16); print('bit32 face  px:', n32)
