// A new component is only a description + painter + optional local bounds.
// No Studio-core work ID or component-specific inspector is needed.
export const badge={description:{version:'1.0.0',label:'Title card',properties:{
  text:{type:'string',label:'Title',maxLength:120,default:'MAKE SOMETHING MOVE',animatable:false},
  color:{type:'color',label:'Accent',default:'#b4f272',animatable:false},
  radius:{type:'number',label:'Corner radius',min:0,max:64,unit:'px',default:28,animatable:true},
  style:{type:'enum',label:'Shape',options:['filled','outline'],default:'filled',animatable:false},
  dots:{type:'boolean',label:'Show particles',default:true,animatable:false}
 }},
 bounds:({width})=>({width:width*.78,height:200}),
 paint({context:g,width:W,height:H,properties:p,clock,random}){
  const x=W*.11,y=H/2-100,w=W*.78;
  if(p.dots){g.fillStyle=p.color;for(let i=0;i<24;i++){g.globalAlpha=.12+random(i*3)*.35;g.beginPath();g.arc(random(i*3+1)*W,random(i*3+2)*H,2+random(i)*4,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
  g.beginPath();g.roundRect(x,y,w,200,p.radius);g.fillStyle=p.color;g.strokeStyle=p.color;g.lineWidth=3;
  if(p.style==='filled')g.fill();else g.stroke();
  g.fillStyle=p.style==='filled'?'#172318':p.color;g.font='bold 36px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(p.text,W/2,H/2,w-48);
  g.font='14px monospace';g.fillText('CODE → LAYERS → FRAMES',W/2,H/2+48,w-48);
 }
};
