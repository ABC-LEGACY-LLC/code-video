// JSON-only component descriptions are shared by the browser, HTTP and AI CLI.
// Executable component code is never evaluated by the server or this validator.
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const safeKey=k=>/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(k)&&!['constructor','prototype','__proto__'].includes(k);
const transformKeys=['x','y','scale','rotation','opacity'];
export function validatePropertyValue(def,value){
 assert(def,'unknown property');
 if(def.type==='number')assert(typeof value==='number'&&Number.isFinite(value)&&value>=def.min&&value<=def.max,`property must be between ${def.min} and ${def.max} ${def.unit||''}`);
 else if(def.type==='boolean')assert(typeof value==='boolean','property must be boolean');
 else if(def.type==='color')assert(typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value),'use a six digit color');
 else if(def.type==='string')assert(typeof value==='string'&&value.length<=def.maxLength,'text exceeds component limit');
 else if(def.type==='enum')assert(def.options.includes(value),'unknown component option');
 else throw new Error('unknown property type');
}
export function validateComponents(components={}){
 assert(record(components)&&Object.keys(components).length<=64,'invalid component catalogue');
 for(const [id,c] of Object.entries(components)){
  assert(safeKey(id)&&record(c),'invalid component ID');
  assert(Object.keys(c).every(k=>['version','label','properties'].includes(k)),'unknown component field');
  assert(typeof c.version==='string'&&/^\d+\.\d+\.\d+$/.test(c.version),'component needs an exact version');
  assert(typeof c.label==='string'&&c.label.length>0&&c.label.length<=120,'invalid component label');
  assert(record(c.properties)&&Object.keys(c.properties).length<=32,'invalid component properties');
  for(const [key,d] of Object.entries(c.properties)){
   assert(safeKey(key)&&!transformKeys.includes(key)&&record(d),'invalid or reserved component property');
   assert(Object.keys(d).every(k=>['type','label','min','max','unit','default','animatable','maxLength','options'].includes(k)),'unknown property schema field');
   assert(['number','boolean','color','string','enum'].includes(d.type),'unknown property type');
   assert(typeof d.animatable==='boolean'&&(!d.animatable||d.type==='number'),'only numeric component properties can animate');
   if(d.label!==undefined)assert(typeof d.label==='string'&&d.label.length<=120,'invalid property label');
   if(d.unit!==undefined)assert(typeof d.unit==='string'&&d.unit.length<=20,'invalid unit');
   if(d.type==='number')assert(Number.isFinite(d.min)&&Number.isFinite(d.max)&&d.min<=d.max&&Math.abs(d.min)<=1e9&&Math.abs(d.max)<=1e9,'invalid number bounds');
   if(d.type==='string')assert(Number.isSafeInteger(d.maxLength)&&d.maxLength>=1&&d.maxLength<=4000,'invalid string bound');
   if(d.type==='enum')assert(Array.isArray(d.options)&&d.options.length>0&&d.options.length<=32&&new Set(d.options).size===d.options.length&&d.options.every(x=>typeof x==='string'&&x.length>0&&x.length<=120),'invalid enum options');
   validatePropertyValue(d,d.default);
  }
 }
 return components;
}
export function componentFor(project,entity){
 if(entity.component===undefined)return null;
 assert(entity.type==='layer2d'&&typeof entity.component==='string'&&Object.hasOwn(project.components||{},entity.component),'unknown component');
 assert(entity.layer?.binding===entity.component,'component and layer binding must agree');
 return project.components[entity.component];
}
