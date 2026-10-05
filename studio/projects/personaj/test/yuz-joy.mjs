/* 1-KADRNI YUZ IZI bo'yicha joylash. Misolning yaqin ko'zi 5x to'rdan o'qilgan
   (320x180): 1:(95,46) 6:(94,46) 9:(97,45) 10:(105,51) 11:(111,54); orasi chiziqli.
   Har tasvirda bizning yaqin ko'zni o'shanga olib boradigan siljish iz
   jadvaliga yoziladi (soch markazi bo'yicha emas: soch yuzdan boshqacha
   harakatlanadi -- shamol). */
import {readFileSync, writeFileSync} from 'fs';
const F='/home/claude/work/personaj/izlar.json';
const A={0:[95,46],5:[94,46],8:[97,45],9:[105,51],10:[111,54]};
const k=Object.keys(A).map(Number).sort((a,b)=>a-b);
const nishon=i=>{ if(A[i]) return A[i]; let a=k.filter(x=>x<i).pop(), b=k.find(x=>x>i); const t=(i-a)/(b-a); return [A[a][0]+(A[b][0]-A[a][0])*t, A[a][1]+(A[b][1]-A[a][1])*t]; };
for(let it=0;it<3;it++){
 const {VARAQ}=await import('/home/claude/work/personaj/varaq.mjs?'+Date.now()+it);
 const {qur}=await import('/home/claude/work/personaj/bosh.mjs');
 const IZ=JSON.parse(readFileSync(F,'utf8')); let maxd=0;
 for(let i=0;i<11;i++){
  const P0=VARAQ[i]; const [cx,cy,kk]=P0.__joy; const P={...P0,R:P0.R*kk};
  const b=qur(P,cx,cy); const [x,y]=b.Kf(b.kozlar[0].u*P.R, b.kz*P.R);
  const [tx,ty]=nishon(i).map(v=>v*540/320);
  IZ[i][0]=+(IZ[i][0]+(tx-x)).toFixed(2); IZ[i][1]=+(IZ[i][1]+(ty-y)).toFixed(2);
  maxd=Math.max(maxd,Math.hypot(tx-x,ty-y)*320/540);
 }
 writeFileSync(F,JSON.stringify(IZ)); console.log('aylana',it,'eng katta farq (320 da)',maxd.toFixed(2),'px');
}
