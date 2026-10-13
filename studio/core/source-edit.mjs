/* Legacy source adapters. Parse code; never guess a numeric token with a regexp. */
import {parse} from 'acorn';
import {readFileSync, realpathSync, statSync, writeFileSync, renameSync, rmSync, openSync, fsyncSync, closeSync} from 'node:fs';
import {resolve, relative, sep, extname, dirname, basename} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';

export const digest = text => createHash('sha256').update(text).digest('hex');
/* Cooperating writers use this lock for their entire read/modify/write operation.
   A crashed writer leaves a visible lock file for deliberate recovery; an elapsed
   timeout cannot prove its owner stopped, so we never steal locks automatically. */
export function withSourceLock(file,run){
 const lock=resolve(dirname(file),'.'+basename(file)+'.lock');let fd;
 try{fd=openSync(lock,'wx',0o600);}catch(error){
  if(error.code==='EEXIST')throw Object.assign(new Error('another writer holds '+basename(lock)+'; retry after it finishes (inspect the lock before recovering a crashed writer)'),{status:409});
  throw error;
 }
 try{writeFileSync(fd,JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()})+'\n');return run();}
 finally{closeSync(fd);rmSync(lock,{force:true});}
}
export function atomicWrite(file, text, {beforeCommit}={}) {
 const tmp = file + '.' + randomUUID() + '.tmp';
 try {
  const fd=openSync(tmp,'wx',0o600);
  try {writeFileSync(fd,text);fsyncSync(fd);} finally {closeSync(fd);}
  // This check follows the potentially slow durable temp write. It is not a kernel
  // compare-and-swap: an editor ignoring the cooperative lock can still race the
  // final check and rename. Such writers must use the operation API or this lock.
  if(beforeCommit)beforeCommit();
  renameSync(tmp,file);
  const dir=openSync(dirname(file),'r');try{fsyncSync(dir);}finally{closeSync(dir);}
 }
 finally { rmSync(tmp, {force:true}); }
}
export function sourcePath(root, work, file) {
 if(typeof file !== 'string' || !file || file.split(/[\\/]/).some(p=>!p || p.startsWith('.') || ['node_modules','build','private'].includes(p))) throw new Error('no such editable source file');
 const base = realpathSync(resolve(root, work.dir)), path = realpathSync(resolve(base, file));
 if(!path.startsWith(base+sep) || !statSync(path).isFile() || !['.html','.js','.mjs','.json'].includes(extname(path))) throw new Error('source is outside this work');
 return {path, relative:relative(root,path)};
}
function scripts(text, file) {
 if(!file.endsWith('.html')) return [{text, offset:0}];
 const out=[];
 for(const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
  if(/\bsrc\s*=/i.test(m[1])) continue;
  const type=m[1].match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1];
  if(type && !['module','text/javascript','application/javascript'].includes(type)) continue;
  out.push({text:m[2],offset:m.index+m[0].indexOf('>')+1});
 }
 return out;
}
function walk(node, fn) {
 if(!node || typeof node!=='object') return;
 if(node.type) fn(node);
 for(const value of Object.values(node)) {
  if(Array.isArray(value)) for(const n of value) walk(n,fn);
  else if(value && typeof value==='object') walk(value,fn);
 }
}
const keyOf = p => p.type==='Property' && !p.computed && p.kind==='init' ? (p.key.type==='Identifier'?p.key.name:p.key.value) : null;
const numeric = n => n?.type==='Literal' && typeof n.value==='number' ? n.value
 : n?.type==='UnaryExpression' && ['-','+'].includes(n.operator) && n.argument.type==='Literal' && typeof n.argument.value==='number' ? (n.operator==='-'?-1:1)*n.argument.value : NaN;
export function numericLocation(text, file, row, key) {
 if(!row || typeof row.key!=='string' || typeof row.is!=='string' || !/^[A-Za-z_$][\w$]*$/.test(key)) throw new Error('invalid row or property');
 const rows=[];
 for(const s of scripts(text,file)) {
  const ast=parse(s.text,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});
  walk(ast,n=>{
   if(n.type==='ObjectExpression' && n.properties.some(p=>keyOf(p)===row.key && p.value?.type==='Literal' && p.value.value===row.is)) rows.push({node:n,offset:s.offset});
  });
 }
 if(rows.length!==1) throw new Error(`expected one row ${row.key}=${JSON.stringify(row.is)}, found ${rows.length}`);
 if(rows[0].node.properties.filter(p=>keyOf(p)===row.key).length!==1)throw new Error('the editable row has duplicate identity properties');
 const found=[];
 // Nested object data is supported; functions, computed keys and spread values are not.
 function properties(n) {
  const names=new Set();
  for(const p of n.properties) {
   if(p.type!=='Property'||p.computed||p.kind!=='init'||p.method)throw new Error('editable rows cannot contain spreads, computed properties or methods');
   const name=keyOf(p);
   if(names.has(name))throw new Error('the editable row has duplicate properties');names.add(name);
   if(keyOf(p)===key) found.push(p.value);
   if(p.type==='Property' && p.value?.type==='ObjectExpression') properties(p.value);
  }
 }
 properties(rows[0].node);
 if(found.length!==1 || !Number.isFinite(numeric(found[0]))) throw new Error(`expected one literal number for ${key}`);
 const n=found[0], start=n.start+rows[0].offset, end=n.end+rows[0].offset;
 return {start,end,value:numeric(n),raw:text.slice(start,end)};
}

const LEGACY = {
 'oq-kocha':[
  {file:'src/shots.mjs',rowKey:'k',key:'df',min:1,max:480,integer:true},
  ...['wind','city','mute'].map(key=>({file:'src/shots.mjs',rowKey:'k',key,min:0,max:1}))
 ],
 whiteout:[{file:'whiteout.html',rowKey:'k',key:'d',min:0.04,max:20}],
 'bir-tomchi':[
  {file:'bir-tomchi.html',rowKey:'name',key:'dur',min:3,max:60},
  {file:'bir-tomchi.html',rowKey:'name',key:'trim',min:0,max:4}
 ]
};
export function ruleFor(work, edit) {
 if(work.project) throw new Error('use project operations for this managed work');
 const rules=work.editor?.sources || LEGACY[work.id] || [];
 const rule=rules.find(r=>r.file===edit.file && r.rowKey===edit.row?.key && r.key===edit.key);
 if(!rule) throw new Error('this property is not registered for editing');
 return rule;
}
export function validateNumber(value, rule) {
 if(typeof value!=='number' || !Number.isFinite(value)) throw new Error('the value must be a finite number');
 if(rule.integer && !Number.isSafeInteger(value)) throw new Error('the value must be a whole number of frames');
 if(value<rule.min || value>rule.max) throw new Error(`the value must be between ${rule.min} and ${rule.max}`);
 if(rule.step && Math.abs((value-(rule.origin||0))/rule.step-Math.round((value-(rule.origin||0))/rule.step))>1e-7) throw new Error(`the value must use steps of ${rule.step}`);
}
export function prepareNumber(root, work, edit, {rule=ruleFor(work,edit), text}={}) {
 validateNumber(edit.value,rule);
 const src=sourcePath(root,work,edit.file), before=text??readFileSync(src.path,'utf8');
 const at=numericLocation(before,edit.file,edit.row,edit.key);
 let replacement=String(edit.value);
 if(edit.as!=null) {
  if(typeof edit.as!=='string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(edit.as) || Number(edit.as)!==edit.value) throw new Error('invalid original number');
  replacement=edit.as;
 }
 const after=before.slice(0,at.start)+replacement+before.slice(at.end);
 return {...src,before,after,from:at.value,fromText:at.raw,to:edit.value,line:before.slice(0,at.start).split('\n').length};
}
