/* ===== COUNT — counted from the source, nothing guessed =====
   "Method" means how a project is built. It cannot be written from a feeling: it is
   in the source and has to be counted. This file does one thing -- it reads code and
   returns numbers. It does not know what they mean; that is the card's job. */
import {readFileSync} from 'fs';
import {resolve} from 'node:path';
import {authoredDocument} from './render-input.mjs';

const DRAW=['beginPath','moveTo','lineTo','arc','arcTo','bezierCurveTo','quadraticCurveTo',
            'ellipse','rect','fillRect','strokeRect','fillText','strokeText','drawImage',
            'createLinearGradient','createRadialGradient','clip','putImageData'];

/* How many entries a table has is found by counting brackets: a regexp cannot count
   nested brackets, so the text is walked by hand. */
function tableSize(s,name){
 /* Nested braces have to be counted as well: every shot in SHOTS carries its own
    snd:{...} object, and the first version, which counted only '{', took eight shots
    for sixteen. An entry is a '{' inside the '[' and outside any other '{'. */
 const m=new RegExp('\\b'+name+'\\s*[:=]\\s*\\[').exec(s);
 if(m){
  let br=0,cu=0,i=m.index+m[0].length-1,objs=0,commas=0;
  for(;i<s.length;i++){
   const c=s[i];
   if(c==='[') br++;
   else if(c===']'){ br--; if(br===0) break; }
   else if(c==='{'){ if(br===1&&cu===0) objs++; cu++; }
   else if(c==='}') cu--;
   else if(c===',' && br===1 && cu===0) commas++;
  }
  if(objs||commas) return objs || commas+1;
 }
 /* some tables start as SC=[] and are filled with SC.push(...) */
 const pushes=(s.match(new RegExp('\\b'+name+'\\.push\\s*\\(','g'))||[]).length;
 return pushes || null;
}

export function count(paths,{project}={}){
 const src=paths.map(p=>project&&resolve(p)===resolve(project)
  ?JSON.stringify(authoredDocument(readFileSync(p)),null,2)+'\n':readFileSync(p,'utf8'));
 const s=src.join('\n');
 const o={
  files:paths.length,
  bytes:src.reduce((a,text)=>a+Buffer.byteLength(text),0),
  lines:src.reduce((a,t)=>a+t.split('\n').length,0),
  renderer: (/webgl2/.test(s)||/#version\s+300\s+es/.test(s)) ? 'webgl2'
          : (/getContext\(\s*['"]2d/.test(s)? 'canvas2d' : 'unknown'),
  functions:(s.match(/\bfunction\s+[A-Za-z_$][\w$]*\s*\(/g)||[]).length,
  audio:/AudioContext/.test(s),
  events:[...new Set(s.match(/addEventListener\(\s*['"]([a-z]+)['"]/g)||[]
             .map(x=>x))].map(x=>/['"]([a-z]+)['"]/.exec(x)[1]).sort(),
  fonts:[...new Set((s.match(/family=([A-Za-z+0-9]+)/g)||[]).map(x=>x.slice(7).replace(/\+/g,' ')))],
 };
 const d={};
 for(const k of DRAW){
  const n=(s.match(new RegExp('[A-Za-z_$][\\w$]*\\.'+k+'\\s*\\(','g'))||[]).length;
  if(n) d[k]=n;
 }
 o.drawCalls=d;
 o.drawCallsTotal=Object.values(d).reduce((a,b)=>a+b,0);
 const t={};
 for(const k of ['PW','POSES','WALK','SHOTS','CUTS','SC','SCENES','HOLDS','STARTS','RAMP'])
  { const n=tableSize(s,k); if(n) t[k]=n; }
 o.tables=t;
 const dur=[...s.matchAll(/\b(?:dur|d)\s*:\s*([0-9]*\.?[0-9]+)/g)].map(m=>+m[1]);
 if(dur.length) o.durations=dur;
 /* When shots are written in frames (df), the frames are counted, and so is their
    TOTAL. The total has to be in the count: a card can hold a number in its text only
    against a value counted here. Oq Ko'cha's card once said "15,6 s in total" while
    the film was 14.6 s, and card/matches-count did not see it: that line was bound
    to the NUMBER of shots, not to their sum. */
 const df=[...s.matchAll(/\bdf\s*:\s*([0-9]+)\b/g)].map(m=>+m[1]);
 if(df.length){ o.shotFrames=df; o.totalFrames=df.reduce((a,b)=>a+b,0); }
 /* Migrated works keep authored shots in the Studio document. Count that data,
    rather than treating SHOTS = project.shots.map(...) as an empty source table. */
 const projects=paths.flatMap((p,i)=>p.endsWith('/project.studio.json')?[JSON.parse(src[i])]:[]);
 if(projects.length>1) throw new Error('a card must identify one authored Studio project');
 if(projects.length){
  const doc=projects[0],project=doc.project;
  if(![1,2].includes(doc.schemaVersion)||!Array.isArray(project?.shots)||!project.shots.length
    ||project.shots.some(shot=>!Number.isSafeInteger(shot.durationFrames)||shot.durationFrames<=0)
    ||!Number.isSafeInteger(project.fps?.num)||project.fps.num<=0
    ||!Number.isSafeInteger(project.fps?.den)||project.fps.den<=0)
   throw new Error('invalid authored Studio shot timing');
  o.tables.SHOTS=project.shots.length;
  o.shotFrames=project.shots.map(shot=>shot.durationFrames);
  o.totalFrames=o.shotFrames.reduce((a,b)=>a+b,0);
  o.shortestShotFrames=Math.min(...o.shotFrames);
  o.fps=project.fps.num/project.fps.den;
  o.durations=o.shotFrames.map(n=>n/o.fps);
  if(doc.schemaVersion===2){
   const layers=project.shots.flatMap(shot=>(shot.entities||[]).filter(entity=>entity.layer&&entity.layer.binding!=='group'));
   o.visualLayers=layers.length;
   o.layerBindings=[...new Set(layers.map(entity=>entity.layer.binding))].sort();
  }
 }
 return o;
}
if(process.argv[1]?.endsWith('count.mjs'))
 console.log(JSON.stringify(count(process.argv.slice(2)),null,1));
