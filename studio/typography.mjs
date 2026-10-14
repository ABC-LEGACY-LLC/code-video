import {fetchInput} from './input-asset.mjs';
// Font bytes belong to the project; no external font service or system substitution.
export async function loadFonts(project){
 const loaded=[];try{for(const font of project.fonts||[]){const family='studio_'+font.src.split('/').at(-1).split('.')[0],face=new FontFace(family,await fetchInput(font.src));let timer;try{await Promise.race([face.load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Font timed out: '+font.name)),10000);})]);}finally{clearTimeout(timer);}document.fonts.add(face);loaded.push({id:font.id,family,face});}await document.fonts.ready;}catch(error){loaded.forEach(f=>document.fonts.delete(f.face));throw new Error('Project font could not load: '+error.message);}
 return{family:id=>loaded.find(f=>f.id===id)?.family||id,dispose:()=>loaded.forEach(f=>document.fonts.delete(f.face))};
}
export function textLayout(g,content,family=content.fontFamily){
 g.font=`${content.fontSize}px ${family}`;const padding=content.caption?.padding||0,max=content.width-padding*2,lines=[];
 for(const paragraph of content.text.split('\n')){if(!content.caption){lines.push(paragraph);continue;}let line='';for(const word of paragraph.split(/(\s+)/)){if(g.measureText(line+word).width<=max){line+=word;continue;}if(line.trim()){lines.push(line.trimEnd());line='';}for(const char of word){if(line&&g.measureText(line+char).width>max){lines.push(line);line='';}line+=char;}}lines.push(line.trimEnd());}
 const lineHeight=content.fontSize*(content.caption?.lineHeight||1.2),height=lines.length*lineHeight+padding*2,width=Math.max(0,...lines.map(line=>g.measureText(line).width))+padding*2;
 return{lines,lineHeight,height,width,padding,overflow:height>content.height||width>content.width,family};
}
