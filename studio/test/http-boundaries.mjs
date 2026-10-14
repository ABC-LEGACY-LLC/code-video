import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,rmSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {server,ROOT} from '../server.mjs';
import {createAuth} from '../auth.mjs';

test('legacy source edits reject missing or stale values without overwriting changes',async t=>{
 mkdirSync(join(ROOT,'build'),{recursive:true});
 const dir=mkdtempSync(join(ROOT,'build','http-edit-')),old=process.env.STUDIO_WORKS;
 const source=join(dir,'shots.mjs'),registry=join(dir,'works.json');
 const original="const SHOTS=[{k:'a',df:20}];\n";
 writeFileSync(source,original);
 writeFileSync(registry,JSON.stringify({works:[{id:'http-edit',dir:relative(ROOT,dir),editor:{sources:[{file:'shots.mjs',rowKey:'k',key:'df',min:1,max:99,integer:true}]}}]}));
 process.env.STUDIO_WORKS=registry;
 const app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(async()=>{app.closeAllConnections();await new Promise(r=>app.close(r));if(old===undefined)delete process.env.STUDIO_WORKS;else process.env.STUDIO_WORKS=old;rmSync(dir,{recursive:true,force:true});});
 const endpoint=`http://127.0.0.1:${app.address().port}/api/edit`;
 const edit=extra=>fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({work:'http-edit',file:'shots.mjs',row:{key:'k',is:'a'},key:'df',value:25,...extra})});
 assert.equal((await edit({})).status,400);
 assert.equal((await edit({expectedValue:19})).status,409);
 assert.equal(readFileSync(source,'utf8'),original);
 assert.equal((await edit({expectedValue:20})).status,200);
 assert.match(readFileSync(source,'utf8'),/df:25/);
 assert.equal((await edit({expectedValue:20,value:30})).status,409);
 assert.match(readFileSync(source,'utf8'),/df:25/);
 assert.equal((await edit({expectedValue:25,value:20})).status,200);
 assert.equal(readFileSync(source,'utf8'),original);
});

test('static source serving rejects symlinks to outside and hidden files',async t=>{
 mkdirSync(join(ROOT,'build'),{recursive:true});const dir=mkdtempSync(join(ROOT,'build','http-path-')),outside=mkdtempSync(join(tmpdir(),'http-outside-'));
 writeFileSync(join(outside,'secret.json'),'{"private":true}');writeFileSync(join(dir,'.private.json'),'{"private":true}');writeFileSync(join(dir,'public.json'),'{"public":true}');
 symlinkSync(join(outside,'secret.json'),join(dir,'outside.json'));symlinkSync(join(dir,'.private.json'),join(dir,'hidden.json'));
 const app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(async()=>{app.closeAllConnections();await new Promise(r=>app.close(r));rmSync(dir,{recursive:true,force:true});rmSync(outside,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${app.address().port}/w/`+relative(ROOT,dir)+'/';
 assert.equal((await fetch(base+'public.json')).status,200);
 for(const path of ['outside.json','hidden.json'])assert.equal((await fetch(base+path)).status,404);
});

test('logout and expiry while a POST body arrives cannot authorize a later write',async t=>{
 const temp=mkdtempSync(join(tmpdir(),'studio-late-body-')),old=process.env.STUDIO_NOTES_DIR;process.env.STUDIO_NOTES_DIR=join(temp,'notes');
 let shift=0;
 const auth=createAuth({botToken:'TEST:TOKEN',owners:'111',publicUrl:'https://studio.test',stateDir:join(temp,'auth'),now:()=>Date.now()+shift,log:()=>{}});
 let signal;
 const userOf=auth.userOf;auth.userOf=req=>{const user=userOf(req);if(signal&&req.method==='POST'&&req.url==='/api/note'){signal();signal=null;}return user;};
 const app=server({auth});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.address().port}`;
 t.after(async()=>{app.closeAllConnections();await new Promise(r=>app.close(r));if(old===undefined)delete process.env.STUDIO_NOTES_DIR;else process.env.STUDIO_NOTES_DIR=old;rmSync(temp,{recursive:true,force:true});});
 const outside={'x-forwarded-for':'203.0.113.1'};
 for(const mode of ['logout','expire']){
  shift=0;const login=await fetch(base+new URL(auth.issueLink(111)).pathname,{method:'POST',headers:outside,redirect:'manual'});
  assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0],headers={...outside,cookie,'content-type':'application/json'};
  const authorized=new Promise(r=>signal=r);let request;
  const result=new Promise((resolve,reject)=>{
   request=http.request(base+'/api/note',{method:'POST',headers},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});request.on('error',reject);
  });
  request.write('{"work":"zarra",');await authorized;
  if(mode==='logout')assert.equal((await fetch(base+'/logout',{method:'POST',headers,redirect:'manual'})).status,303);
  else shift=31*24*60*60*1000;
  request.end('"text":"must not be written"}');assert.equal(await result,401);
  assert.equal(existsSync(join(temp,'notes','zarra.md')),false);
 }
 // An uninterrupted authenticated request must still work.
 shift=0;const login=await fetch(base+new URL(auth.issueLink(111)).pathname,{method:'POST',headers:outside,redirect:'manual'});
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const ok=await fetch(base+'/api/note',{method:'POST',headers:{...outside,cookie,'content-type':'application/json'},body:JSON.stringify({work:'zarra',text:'authorized control'})});
 assert.equal(ok.status,200);assert.match(readFileSync(join(temp,'notes','zarra.md'),'utf8'),/authorized control/);
});

test('snapshot metadata, source bytes and creation all require outside authentication',async t=>{
 const temp=mkdtempSync(join(tmpdir(),'snapshot-auth-'));t.after(()=>rmSync(temp,{recursive:true,force:true}));const app=server({auth:createAuth({botToken:'TEST:TOKEN',owners:'111',publicUrl:'https://studio.test',stateDir:temp,log:()=>{}})});await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(async()=>{app.closeAllConnections();await new Promise(r=>app.close(r));});const base=`http://127.0.0.1:${app.address().port}`,headers={'x-forwarded-for':'203.0.113.12','content-type':'application/json'};
 for(const path of ['/api/snapshot?id='+('a'.repeat(64)),'/api/snapshot/freshness?work=zarra&id='+('a'.repeat(64)),'/snapshots/'+('a'.repeat(64))+'/w/studio/project-player.mjs'])assert.equal((await fetch(base+path,{headers,redirect:'manual'})).status,path.startsWith('/api/')?401:302);
 assert.equal((await fetch(base+'/api/snapshots',{method:'POST',headers,body:JSON.stringify({work:'zarra'}),redirect:'manual'})).status,401);
});
