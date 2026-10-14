export const TYPOGRAPHY_OPERATIONS=['addFont','removeFont','addCaption'];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
export const FONT_ASSET=/^\/w\/studio\/assets\/[a-zA-Z0-9_-]+\/[a-f0-9]{64}\.(woff2?|ttf|otf)$/;
export function validateTypography(project){
 const fonts=project.fonts===undefined?[]:project.fonts;assert(Array.isArray(fonts)&&fonts.length<=32,'Use at most 32 project fonts');const ids=new Set();
 for(const f of fonts){assert(project.renderer==='canvas2d'&&f&&Object.keys(f).every(k=>['id','name','src','license'].includes(k))&&/^font-[a-zA-Z0-9_-]{1,80}$/.test(f.id)&&typeof f.name==='string'&&f.name.trim()&&f.name.length<=200&&FONT_ASSET.test(f.src)&&!ids.has(f.id),'Invalid project font');if(f.license!==undefined)assert(typeof f.license==='string'&&f.license.length<=20000,'Invalid font license');ids.add(f.id);}
 for(const e of project.shots.flatMap(s=>s.entities))if(e.layer?.binding==='text'){
  assert(['sans-serif','serif','monospace'].includes(e.content.fontFamily)||ids.has(e.content.fontFamily),'Text references a missing project font');
  if(e.content.caption!==undefined){assert(project.renderer==='canvas2d','Captions require Canvas2D');const c=e.content.caption;assert(c&&Object.keys(c).every(k=>['safeArea','background','padding','lineHeight'].includes(k))&&Number.isFinite(c.safeArea)&&c.safeArea>=0&&c.safeArea<=.3&&/^#[a-f0-9]{6}$/i.test(c.background)&&Number.isFinite(c.padding)&&c.padding>=0&&c.padding<=100&&Number.isFinite(c.lineHeight)&&c.lineHeight>=1&&c.lineHeight<=2,'Invalid caption style');}
 }
}
export function applyTypographyOperation(p,op){
 assert(p.renderer==='canvas2d','Typography tools require Canvas2D');
 if(op.type==='addFont'){p.fonts||=[];p.fonts.push({id:op.id,name:op.name,src:op.src,...(op.license!==undefined?{license:op.license}:{})});return;}
 if(op.type==='removeFont'){assert(!p.shots.some(s=>s.entities.some(e=>e.content?.fontFamily===op.id)),'This font is still used by text');assert(p.fonts?.some(f=>f.id===op.id),'Unknown project font');p.fonts=p.fonts.filter(f=>f.id!==op.id);return;}
 const s=p.shots.find(s=>s.id===op.shotId);assert(s,'Choose a scene');const width=Math.round(p.width*.8),height=Math.min(Math.round(p.height*.2),180),fontSize=Math.max(12,Math.round(p.height*.045));
 const e={id:op.id,name:'Caption',type:'layer2d',properties:{x:0,y:Math.round(p.height*.4-height/2),scale:1,rotation:0,opacity:1},keyframes:{},layer:{binding:'text',parentId:null,space:'screen',visible:true,locked:false,startFrame:op.startFrame??0,endFrame:op.endFrame??s.durationFrames},content:{text:op.text??'Your caption',fontSize,fontFamily:op.fontFamily??p.fonts?.[0]?.id??'sans-serif',color:'#ffffff',align:'center',width,height,caption:{safeArea:.1,background:'#15171d',padding:12,lineHeight:1.2}}};s.entities.push(e);s.layerOrder.push(e.id);
}
