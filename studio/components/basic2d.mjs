// Portable built-ins. Descriptors are also the Human/AI property contract.
const color=(label,value)=>({type:'color',label,default:value,animatable:false});
const number=(label,value,min,max)=>({type:'number',label,default:value,min,max,unit:'px',animatable:true});
export const background={description:{version:'1.0.0',label:'Background',properties:{color:color('Color','#101827')}},
 paint({context:g,width:w,height:h,properties:p}){g.fillStyle=p.color;g.fillRect(0,0,w,h);}};
export const shape={description:{version:'1.0.0',label:'Shape',properties:{
  shape:{type:'enum',label:'Shape',options:['rectangle','ellipse'],default:'rectangle',animatable:false},
  color:color('Fill','#8cb0ff'),width:number('Width',320,1,7680),height:number('Height',180,1,7680),radius:number('Corner radius',24,0,1000)
 }},
 paint({context:g,width:w,height:h,properties:p}){g.fillStyle=p.color;g.beginPath();if(p.shape==='ellipse')g.ellipse(w/2,h/2,p.width/2,p.height/2,0,0,Math.PI*2);else g.roundRect((w-p.width)/2,(h-p.height)/2,p.width,p.height,Math.min(p.radius,p.width/2,p.height/2));g.fill();},
 bounds({properties:p}){return{width:p.width,height:p.height};}};
export const basicComponents={background,shape};
export const basicDescriptors=Object.fromEntries(Object.entries(basicComponents).map(([id,c])=>[id,c.description]));
