// Frame numbers, not elapsed wall time, determine authored time and randomness.
export function frameClock(project,frame){
 if(!project.fps||!Number.isSafeInteger(project.fps.num)||!Number.isSafeInteger(project.fps.den)||project.fps.den<1||project.fps.num/project.fps.den<1||project.fps.num/project.fps.den>120||!Array.isArray(project.shots)||!project.shots.length||project.shots.some(s=>!Number.isSafeInteger(s.durationFrames)||s.durationFrames<1))throw new Error('invalid frame clock');
 const total=project.shots.reduce((n,s)=>n+s.durationFrames,0);
 if(!Number.isSafeInteger(frame)||frame<0||frame>=total)throw new Error('frame outside sequence');
 let start=0;
 for(const shot of project.shots){
  if(frame<start+shot.durationFrames)return Object.freeze({frame,localFrame:frame-start,shotId:shot.id,shotStart:start,totalFrames:total,
   time:frame*project.fps.den/project.fps.num,localTime:(frame-start)*project.fps.den/project.fps.num,fps:Object.freeze({...project.fps}),seed:project.seed??0});
  start+=shot.durationFrames;
 }
}
// Stateless samples: seeking, visibility and render order cannot advance a PRNG.
export function randomAt(seed,frame,stream=0,sample=0){
 let h=2166136261;for(const ch of `${seed}:${frame}:${stream}:${sample}`)h=Math.imul(h^ch.charCodeAt(0),16777619);
 h=Math.imul(h^(h>>>16),0x21f0aaad);h=Math.imul(h^(h>>>15),0x735a2d97);
 return ((h^(h>>>15))>>>0)/4294967296;
}
