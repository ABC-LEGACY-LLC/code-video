import {validateProject,evaluateEntity} from './project.mjs';
const clamp=v=>Math.max(0,Math.min(1,v)),ease=x=>1-(1-x)**3;
const SCORE=[
 [0,'wind',464/24,.085],[0,'drone',9.5,34,46,.1],[2.1,'breathS',.055],[4.3,'breathS',.075],[6,'breathS',.1],
 [6.85,'nz',.9,.1,'bandpass',300,1.4,0,120],[6.8,'drone',3.1,44,70,.2],[9,'nz',.42,.18,'bandpass',700,1.1,0,2400],
 [9.59,'steel',.42],[9.59,'drone',2.4,96,30,.42],[9.59,'nz',.7,.24,'lowpass',2000,.9,0,200],
 [9.84,'nz',1.5,.07,'bandpass',1800,2.2,0,600],[10.6,'breathS',.11],[11.4,'breathS',.09],[12.9,'drone',4,40,32,.14],[13.6,'breathS',.07],[15.3,'wind',4,.05]
];
// Bake previously hidden scene fades into the same editable keyframes as all user changes.
// This pure upgrade is also run on history snapshots by the release migration.
export function upgradeEditorProject(original){
 const p=structuredClone(original);if(p.editorVersion===1)return validateProject(p);
 if(p.id!=='whiteout')return p;
 for(const shot of p.shots){
  for(const e of shot.entities){
   const kind=e.layer?.binding;if(!['hero','opponent','haze','title'].includes(kind))continue;
   const factor=f=>{
    const lt=f/24+shot.sourceTiming.startFrame/24-shot.sourceTiming.startSeconds,u=clamp(lt/shot.sourceTiming.durationSeconds);
    if(kind==='hero'&&shot.id==='far')return .2+.74*ease(clamp((u-.1)/.6));
    if(kind==='opponent'&&shot.id==='meet')return .28+.68*ease(clamp(lt/.9));
    if(['hero','opponent'].includes(kind)&&shot.id==='drop')return .74;
    if(kind==='opponent'&&shot.id==='alone')return 1-ease(clamp((lt-.7)/2));
    if(kind==='title')return lt>2.2?ease(clamp((lt-2.2)/1))*.82:0;
    if(kind==='haze')return shot.id==='far'?.58-.4*ease(u):shot.id==='alone'?.13+.23*ease(clamp((lt-.7)/2)):({walk:.10,boot:.04,meet:.14,other:.05,charge:.08,after:.08,drop:.05,backs:.13}[shot.id]??1);
    return 1;
   };
   const values=Array.from({length:shot.durationFrames},(_,f)=>evaluateEntity(e,f).opacity*factor(f));
   if(values.every(v=>v===values[0])&&!e.keyframes.opacity?.length)e.properties.opacity=values[0];
   else e.keyframes.opacity=values.map((value,frame)=>({frame,value,easing:'linear'}));
  }
  const strength={impactA:1,after:.5}[shot.id]||0;
  shot.entities.push({id:'shake:'+shot.id,name:'Camera shake',type:'effect',properties:{strength,frequency:12},keyframes:{}});
 }
 for(let i=0;i<SCORE.length;i++){
  const [seconds,voice,...args]=SCORE[i],frame=Math.round(seconds*24);
  const shot=[...p.shots].reverse().find(s=>s.sourceTiming.startFrame<=frame)||p.shots[0];
  const durationFrames=Math.max(1,Math.round((['wind','drone','nz'].includes(voice)?args.shift():voice==='steel'?1.6:.48)*24));
  shot.entities.push({id:'cue:'+i,name:voice+' '+(i+1),type:'audioCue',properties:{gain:1,muted:false,fadeIn:0,fadeOut:0},keyframes:{},cue:{voice,frame:Math.min(shot.durationFrames-1,frame-shot.sourceTiming.startFrame),durationFrames,args}});
 }
 p.editorVersion=1;return validateProject(p,{requireLayers:true});
}
