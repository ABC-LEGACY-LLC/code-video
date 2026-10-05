/* SOZLASH HALQASI -- tugmani o'zgartiradi, chizadi, o'lchaydi, eng yaqinini saqlaydi.
   Bu "chizmani o'zi tuzatadigan mehanizm" ning eng kichik ko'rinishi. */
import {execSync} from 'child_process';
const olch=(env)=>{
 execSync('node film.mjs && rm -rf ff && node kor3.mjs',{cwd:'/home/claude/work/personaj',env:{...process.env,...env},stdio:'pipe'});
 const o=execSync(`python3 -c "
import sys; sys.path.insert(0,'test')
from ritm import yukla,tendensiya,kesishlar
F=yukla('/home/claude/work/personaj/ff/??.png'); sp,d,m=kesishlar(F)
print(m, sp==[11,13], (max(d[i-1] for i in sp)/m if sp else 0), tendensiya(F,range(0,10))[2], tendensiya(F,range(13,21))[2])
"`,{cwd:'/home/claude/work/personaj'}).toString().trim().split(' ');
 return {mediana:+o[0], togri:o[1]==='True', kesish:+o[2], k1:+o[3], k3:+o[4]};
};
const MAQSAD={mediana:0.337, kesish:1.97, k1:14.3, k3:-17.7};
const xato=r=>!r.togri?1e9:
 Math.abs(r.kesish-MAQSAD.kesish)/MAQSAD.kesish
 +Math.abs(r.mediana-MAQSAD.mediana)/MAQSAD.mediana
 +Math.abs(r.k1-MAQSAD.k1)/20 +Math.abs(r.k3-MAQSAD.k3)/20;
let eng=null;
const TUGMA=process.argv[2]||'K', QIY=(process.argv[3]||'0.35,0.5,0.65').split(',');
const QOTGAN={}; for(const kv of (process.argv[4]||'').split(',').filter(Boolean)){const [a,b]=kv.split('=');QOTGAN[a]=b;}
for(const v of QIY){
 const env={...QOTGAN, ...(TUGMA==='K'?{K12:v,K23:v}:{[TUGMA]:v})}; const r=olch(env);
 const e=xato(r);
 console.log(`${TUGMA}=${v}  mediana ${r.mediana.toFixed(3)} kesish ${r.kesish.toFixed(2)}x ${r.togri?'[11,13]':'NOTO\'G\'RI'} 1-kadr ${r.k1.toFixed(1)}% 3-kadr ${r.k3.toFixed(1)}%  xato ${e.toFixed(3)}`);
 if(!eng||e<eng.e) eng={v,e,r};
}
console.log('\nENG YAQIN:',TUGMA,'=',eng.v,' xato',eng.e.toFixed(3));
