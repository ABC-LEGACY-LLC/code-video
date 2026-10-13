import test from 'node:test';
import assert from 'node:assert/strict';
import fs, {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync,symlinkSync,readdirSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFile,execFileSync} from 'node:child_process';
import {promisify} from 'node:util';
import {prepareNumber,numericLocation,atomicWrite,withSourceLock} from '../core/source-edit.mjs';
import {validateProject,applyOperations,evaluateEntity,frameContext} from '../core/project.mjs';
import {createProjectStore} from '../core/store.mjs';

const entity=id=>({id,type:'camera2d',name:'Camera',properties:{x:0,y:0,zoom:1},keyframes:{}});
const project=()=>({id:'test',name:'Test film',fps:{num:24,den:1},width:320,height:180,shots:[
 {id:'shot-a',name:'A',durationFrames:24,entities:[entity('camera-a')]},
 {id:'shot-b',name:'B',durationFrames:12,entities:[entity('camera-b')]}],annotations:[]});
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'studio-core-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 mkdirSync(join(root,'work'));const file=join(root,'work','project.studio.json');
 writeFileSync(file,JSON.stringify({schemaVersion:1,project:project(),generation:0,history:{past:[],future:[]},receipts:[]}));
 writeFileSync(join(root,'work','film.js'),'export const ready=true;');
 const work={id:'test',dir:'work',project:'project.studio.json'},store=createProjectStore(root);
 return{root,file,work,store};
}
const request=(revision,operations,extra={})=>({baseRevision:revision,requestId:randomUUID(),actor:'human',operations,...extra});
const zoom=value=>({type:'setProperty',targetId:'camera-a',property:'zoom',value});

test('typed project rejects invalid frames, duplicate identities and unknown renderer types',()=>{
 for(const mutate of [p=>p.shots[0].durationFrames=-1,p=>p.shots[0].durationFrames=1.5,p=>p.shots[1].id='shot-a',p=>p.shots[0].entities[0].type='toString',p=>p.shots[0].entities[0].properties.zoom=99]){
  const p=project();mutate(p);assert.throws(()=>validateProject(p));
 }
 assert.deepEqual(validateProject(project()),project());
});
test('record fields and entity types cannot lose JSON data or coerce to another type',()=>{
 for(const mutate of [p=>p.shots[0].entities[0].keyframes=[],p=>p.shots[0].entities[0].properties=[],
  p=>p.shots[0].entities[0].type=['camera2d'],p=>p.shots[0].sourceTiming=[],p=>p.fps=[]]){
  const p=project();mutate(p);assert.throws(()=>validateProject(p));
  assert.throws(()=>applyOperations(p,[zoom(2),{type:'setKeyframe',targetId:'camera-a',property:'zoom',frame:0,value:3}]));
 }
 for(const property of ['__proto__','constructor',['zoom']])assert.throws(()=>applyOperations(project(),[{type:'setProperty',targetId:'camera-a',property,value:2}]));
 const p=project();p.shots[0].entities[0].keyframes=JSON.parse('{"__proto__":[]}');assert.throws(()=>validateProject(p));
});
test('a multi-operation batch validates the whole result before writing',t=>{
 const f=fixture(t),before=readFileSync(f.file,'utf8'),rev=f.store.get(f.work).revision;
 assert.throws(()=>f.store.transact(f.work,request(rev,[zoom(2),{type:'trimShot',shotId:'shot-a',durationFrames:-1}])));
 assert.equal(readFileSync(f.file,'utf8'),before);
 const result=f.store.transact(f.work,request(rev,[zoom(2),{type:'renameShot',shotId:'shot-a',name:'Close-up'}]));
 assert.equal(result.project.shots[0].entities[0].properties.zoom,2);assert.equal(result.history.entries.length,1);
});
test('persistent Undo/Redo survives a new store and a new edit clears redo',t=>{
 const f=fixture(t);let r=f.store.get(f.work);
 r=f.store.transact(f.work,request(r.revision,[zoom(2)]));
 const reopened=createProjectStore(f.root);r=reopened.transact(f.work,request(r.revision,[],{action:'undo'}));
 assert.equal(r.project.shots[0].entities[0].properties.zoom,1);assert.equal(r.history.canRedo,true);
 r=reopened.transact(f.work,request(r.revision,[],{action:'redo'}));assert.equal(r.project.shots[0].entities[0].properties.zoom,2);
 r=reopened.transact(f.work,request(r.revision,[],{action:'undo'}));
 r=reopened.transact(f.work,request(r.revision,[zoom(1.5)]));assert.equal(r.history.canRedo,false);
});
test('human and AI share validation and conflict detection',t=>{
 const f=fixture(t),rev=f.store.get(f.work).revision;
 f.store.transact(f.work,request(rev,[zoom(2)]),'human-owner');
 assert.throws(()=>f.store.transact(f.work,request(rev,[zoom(3)],{actor:'ai'}),'agent'),e=>e.status===409);
 assert.equal(f.store.get(f.work).project.shots[0].entities[0].properties.zoom,2);
});
test('retry receipt is durable, idempotent, and cannot be reused for another edit',t=>{
 const f=fixture(t),req=request(f.store.get(f.work).revision,[zoom(2)]);
 const first=f.store.transact(f.work,req);const next=createProjectStore(f.root).transact(f.work,req);
 assert.equal(next.replayed,true);assert.equal(next.appliedRevision,first.revision);assert.equal(next.history.entries.length,1);
 assert.throws(()=>f.store.transact(f.work,{...req,operations:[zoom(3)]}),e=>e.status===409);
});
test('malformed receipts and foreign-identity history cannot be committed or restored',t=>{
 const f=fixture(t);f.store.transact(f.work,request(f.store.get(f.work).revision,[zoom(2)]));
 const good=JSON.parse(readFileSync(f.file,'utf8'));
 for(const mutate of [s=>s.history.past[0].project.id='different',s=>s.history.past[0].actor=[],
  s=>s.history.past[0].expectedHash='invalid',s=>s.history.future.push(null),s=>s.receipts.push(null),s=>s.receipts.push({...s.receipts[0]})]){
  const state=structuredClone(good);mutate(state);const bytes=JSON.stringify(state);writeFileSync(f.file,bytes);
  assert.throws(()=>f.store.get(f.work));
  assert.throws(()=>f.store.transact(f.work,request('irrelevant',[],{action:'undo'})));
  assert.equal(readFileSync(f.file,'utf8'),bytes);
 }
 writeFileSync(f.file,JSON.stringify(good));assert.equal(f.store.get(f.work).project.id,'test');
});
test('separate Studio processes cooperate on a project lock and release it after failure',t=>{
 const f=fixture(t),head=f.store.get(f.work),req=request(head.revision,[zoom(2)]),before=readFileSync(f.file,'utf8');
 withSourceLock(f.file,()=>{
  const source=`import {createProjectStore} from ${JSON.stringify(new URL('../core/store.mjs',import.meta.url).href)};
   try{createProjectStore(${JSON.stringify(f.root)}).transact(${JSON.stringify(f.work)},${JSON.stringify(req)});console.log('unexpected write');}
   catch(error){console.log(error.status);}`;
  assert.equal(execFileSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8'}).trim(),'409');
  assert.equal(readFileSync(f.file,'utf8'),before);
 });
 assert.throws(()=>f.store.transact(f.work,request(head.revision,[zoom(99)])));
 assert.equal(f.store.transact(f.work,req).project.shots[0].entities[0].properties.zoom,2);
 assert.ok(!readdirSync(join(f.root,'work')).some(name=>name.endsWith('.lock')||name.endsWith('.tmp')));
});
test('pre-rename validation preserves external document, history and source edits made during durable temp writes',t=>{
 const f=fixture(t);
 for(const target of ['project','history','source']){
  const head=f.store.get(f.work),req=request(head.revision,[zoom(head.project.shots[0].entities[0].properties.zoom===2?3:2)]);
  const previousFsync=fs.fsyncSync;let injected=false,external;
  try{
   fs.fsyncSync=fd=>{
    if(!injected){injected=true;
     if(target==='source'){writeFileSync(join(f.root,'work','film.js'),'export const changed='+Date.now()+';');external=readFileSync(f.file,'utf8');}
     else{
      const state=JSON.parse(readFileSync(f.file,'utf8'));
      if(target==='project')state.project.name='An external edit';
      else state.receipts.push({id:'external-receipt',signature:'a'.repeat(64),revision:'b'.repeat(64)});
      external=JSON.stringify(state);writeFileSync(f.file,external);
     }
    }
    return previousFsync(fd);
   };syncBuiltinESMExports();
   assert.throws(()=>f.store.transact(f.work,req),error=>error.status===409);
  }finally{fs.fsyncSync=previousFsync;syncBuiltinESMExports();}
  assert.ok(injected);assert.equal(readFileSync(f.file,'utf8'),external);
  assert.ok(!readdirSync(join(f.root,'work')).some(name=>name.endsWith('.lock')||name.endsWith('.tmp')));
 }
});
test('external source and authored file changes invalidate the revision and unsafe undo',t=>{
 const f=fixture(t);let r=f.store.get(f.work);r=f.store.transact(f.work,request(r.revision,[zoom(2)]));
 writeFileSync(join(f.root,'work','film.js'),'export const ready=false;');const current=f.store.get(f.work);
 assert.notEqual(current.revision,r.revision);assert.throws(()=>f.store.transact(f.work,request(r.revision,[zoom(3)])),e=>e.status===409);
 assert.throws(()=>f.store.transact(f.work,request(current.revision,[],{action:'undo'})),e=>e.status===409);
 const state=JSON.parse(readFileSync(f.file,'utf8'));state.project.shots[0].entities[0].properties.zoom=1.8;writeFileSync(f.file,JSON.stringify(state));
 assert.notEqual(f.store.get(f.work).revision,current.revision);
});
test('keyframes evaluate identically in random seek order and stay attached to shot IDs',()=>{
 let p=project();p=applyOperations(p,[{type:'setKeyframe',targetId:'camera-a',property:'zoom',frame:0,value:1},{type:'setKeyframe',targetId:'camera-a',property:'zoom',frame:20,value:3},
  {type:'addAnnotation',id:'note-1',shotId:'shot-a',frame:10,targetId:'camera-a',text:'Keep this framing'}]);
 const e=p.shots[0].entities[0];for(const n of [20,0,10,4,10])assert.equal(evaluateEntity(e,n).zoom,1+n/10);
 p=applyOperations(p,[{type:'moveShot',shotId:'shot-a',index:1}]);const c=frameContext(p,22);
 assert.equal(c.shotId,'shot-a');assert.equal(c.localFrame,10);assert.equal(c.annotations[0].frame,10);
 const trimmed=applyOperations(p,[{type:'trimShot',shotId:'shot-a',durationFrames:5}]);
 assert.deepEqual(trimmed.shots[1].entities[0].keyframes.zoom.map(k=>k.frame),[0,4]);
 assert.equal(trimmed.annotations[0].frame,2);
});
test('source parser handles exponents, comments, string braces and nested data precisely',()=>{
 const text=`// {k:'a',gain:100}\nconst ignored="{k:'a',gain:2}";const row={k:'a',label:'} {',sound:{gain:1e-3}};`;
 const at=numericLocation(text,'test.mjs',{key:'k',is:'a'},'gain');assert.equal(at.value,.001);assert.equal(at.raw,'1e-3');
 assert.throws(()=>numericLocation("const row={k:'a',gain:1+2};",'x.js',{key:'k',is:'a'},'gain'));
 assert.throws(()=>numericLocation("const a={k:'a',gain:1};const b={k:'a',gain:2};",'x.js',{key:'k',is:'a'},'gain'));
 const html='<script type="application/json">{"k":"a","gain":50}</script><script>const a={k:"a",gain:-1e-2};</script>';
 assert.equal(numericLocation(html,'x.html',{key:'k',is:'a'},'gain').value,-.01);
});
test('source parser refuses runtime-overridden row identity or nested values',()=>{
 for(const text of ["const a={k:'a',k:'b',gain:1};","const a={k:'a',gain:1,...override};",
  "const a={k:'a',gain:1,[unknown]:2};","const a={k:'a',sound:{gain:1,...override}};",
  "const a={k:'a',sound:{gain:1},sound:{other:2}};","const a={k:'a',gain:1,get other(){return 2}};"])
  assert.throws(()=>numericLocation(text,'test.mjs',{key:'k',is:'a'},'gain'),/duplicate|spreads|computed|methods/);
});
test('source adapter takes limits from trusted work schema and refuses symlink escapes',t=>{
 const f=fixture(t),work={...f.work,project:undefined,editor:{sources:[{file:'film.js',rowKey:'k',key:'df',min:1,max:99,integer:true}]}};
 writeFileSync(join(f.root,'work','film.js'),"const a={k:'a',df:10};");
 for(const value of [-1,1.5,100,'20'])assert.throws(()=>prepareNumber(f.root,work,{file:'film.js',row:{key:'k',is:'a'},key:'df',value,min:-100,max:999}));
 const r=prepareNumber(f.root,work,{file:'film.js',row:{key:'k',is:'a'},key:'df',value:25});atomicWrite(r.path,r.after);assert.match(readFileSync(r.path,'utf8'),/df:25/);
 writeFileSync(join(f.root,'outside.js'),"const a={k:'a',df:10};");symlinkSync(join(f.root,'outside.js'),join(f.root,'work','escape.js'));
 const malicious={...work,editor:{sources:[{file:'escape.js',rowKey:'k',key:'df',min:1,max:99,integer:true}]}};
 assert.throws(()=>prepareNumber(f.root,malicious,{file:'escape.js',row:{key:'k',is:'a'},key:'df',value:25}),/outside/);
});

test('HTTP and AI CLI use the same revisioned project with protected writes',async t=>{
 const {server,ROOT}=await import('../server.mjs');mkdirSync(join(ROOT,'build'),{recursive:true});
 const dir=mkdtempSync(join(ROOT,'build','core-http-')),id='test';
 const reg=join(dir,'works.json'),old=process.env.STUDIO_WORKS;
 writeFileSync(join(dir,'project.studio.json'),JSON.stringify({schemaVersion:1,project:project(),generation:0,history:{past:[],future:[]},receipts:[]}));
 writeFileSync(join(dir,'film.js'),'export const ready=true;');
 writeFileSync(reg,JSON.stringify({works:[{id,dir:dir.slice(ROOT.length+1),project:'project.studio.json',page:dir.slice(ROOT.length+1)+'/film.js',name:'Test',control:'frameTo'}]}));
 process.env.STUDIO_WORKS=reg;const app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(async()=>{app.closeAllConnections();await new Promise(r=>app.close(r));if(old===undefined)delete process.env.STUDIO_WORKS;else process.env.STUDIO_WORKS=old;rmSync(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${app.address().port}/`,head=await(await fetch(base+'api/project?work=test')).json();
 const payload={work:id,...request(head.revision,[zoom(1.7)],{actor:'ai'})};
 const post=(body,headers={})=>fetch(base+'api/operations',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await post(payload,{origin:'https://elsewhere.invalid'})).status,403);
 assert.equal((await post({...payload,baseRevision:'old'})).status,409);
 assert.equal((await post({...payload,operations:[zoom(99)]})).status,400);
 assert.equal((await post(payload)).status,200);
 assert.equal((await(await post(payload)).json()).replayed,true);
 const file=join(dir,'operations.json');writeFileSync(file,JSON.stringify([zoom(2)]));
 // Read the revision after creating the input file: external file changes are detected too.
 const next=await(await fetch(base+'api/project?work=test')).json();
 const exec=promisify(execFile);
 const {stdout}=await exec(process.execPath,['studio/cli.mjs','apply','test','--file',file,'--revision',next.revision,'--request-id','cli-test-request-1'],{cwd:ROOT,env:{...process.env,STUDIO_URL:base}});
 const result=JSON.parse(stdout);assert.equal(result.project.shots[0].entities[0].properties.zoom,2);assert.equal(result.history.entries.at(-1).actor.kind,'ai');
 const context=await(await fetch(base+'api/context?work=test&frame=10')).json();assert.equal(context.selection.localFrame,10);assert.equal(context.selection.entities[0].values.zoom,2);
 const denied=await fetch(base+'api/project?work=test',{headers:{'x-forwarded-for':'203.0.113.2'}});assert.equal(denied.status,503); // no public login configured: fail closed
});
