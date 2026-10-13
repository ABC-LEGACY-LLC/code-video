// Compatibility catalogue owned by the existing renderers, not the editor.
// New components declare their schema in project.components and need no entry here.
export const legacyBindings=Object.freeze([
 'background','ground','hero','opponent','haze','snow','speed','impact','drop','title',
 'text','image','video','particles0','particles1','particles2','particles3'
]);
export function validateLegacyVoice(c){
 const assert=(ok,message)=>{if(!ok)throw new Error(message);};
 assert(['wind','drone','breathS','nz','steel'].includes(c.voice),'unknown sound voice');
 assert(Array.isArray(c.args)&&c.args.length<=8&&c.args.every(v=>typeof v==='string'?['bandpass','lowpass','highpass'].includes(v):Number.isFinite(v)&&Math.abs(v)<=30000),'invalid sound parameters');
 const n=(i,min,max)=>typeof c.args[i]==='number'&&c.args[i]>=min&&c.args[i]<=max;
 assert(c.voice==='nz'?c.args.length===6&&n(0,0.0001,4)&&['bandpass','lowpass','highpass'].includes(c.args[1])&&n(2,1,20000)&&n(3,.01,100)&&n(4,-1,1)&&n(5,0,20000):true,'invalid noise parameters');
 if(c.voice==='drone')assert(c.args.length===3&&n(0,1,20000)&&n(1,1,20000)&&n(2,.0001,4),'invalid drone parameters');
 if(['wind','steel','breathS'].includes(c.voice))assert(c.args.length===1&&n(0,.0001,4),'invalid voice level');
}
