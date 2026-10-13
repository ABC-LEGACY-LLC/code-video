import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,renameSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {watchTree} from '../core/watch-tree.mjs';
import {atomicWrite} from '../core/source-edit.mjs';

test('watcher sees repeated atomic replacements and newly added directories',async t=>{
 const root=mkdtempSync(join(tmpdir(),'studio-watch-'));writeFileSync(join(root,'project.json'),'0');
 const waiters=new Set();const close=watchTree(root,name=>{for(const resolve of waiters)resolve(name);},{ignore:rel=>rel.endsWith('.tmp')||rel.startsWith('.')});
 t.after(()=>{close();rmSync(root,{recursive:true,force:true});});
 const event=(wanted,action)=>new Promise((resolve,reject)=>{
  const check=name=>{if(name!==wanted)return;clearTimeout(timer);waiters.delete(check);resolve(name);};waiters.add(check);
  const timer=setTimeout(()=>{waiters.delete(check);reject(new Error('no event for '+wanted));},2000);action();
 });
 for(let i=1;i<=3;i++){
  await event('project.json',()=>atomicWrite(join(root,'project.json'),String(i)));
  assert.equal(readFileSync(join(root,'project.json'),'utf8'),String(i));
 }
 await event('nested',()=>mkdirSync(join(root,'nested')));
 await event('nested/frame.json',()=>writeFileSync(join(root,'nested','frame.json'),'1'));
 await event('renamed',()=>renameSync(join(root,'nested'),join(root,'renamed')));
 await event('renamed/frame.json',()=>atomicWrite(join(root,'renamed','frame.json'),'2'));
 for(let replacement=0;replacement<8;replacement++){
  await event('renamed',()=>{
   rmSync(join(root,'renamed'),{recursive:true});
   mkdirSync(join(root,'renamed'));
   writeFileSync(join(root,'renamed','first.json'),'1');
  });
  // Write immediately on the first parent event: old watcher callbacks can still
  // be queued, and the filesystem may already have reused the deleted inode.
  await event('renamed/second.json',()=>writeFileSync(join(root,'renamed','second.json'),String(replacement)));
 }
});

test('new directory symlinks never subscribe to an outside tree',async t=>{
 const root=mkdtempSync(join(tmpdir(),'studio-watch-links-')),outside=mkdtempSync(join(tmpdir(),'studio-watch-outside-'));
 symlinkSync(outside,join(root,'existing'));const events=[];
 const close=watchTree(root,name=>events.push(name));
 t.after(()=>{close();rmSync(root,{recursive:true,force:true});rmSync(outside,{recursive:true,force:true});});
 symlinkSync(outside,join(root,'new-link'));
 await new Promise(r=>setTimeout(r,80));events.length=0;
 writeFileSync(join(outside,'external.json'),'private');
 await new Promise(r=>setTimeout(r,100));assert.deepEqual(events,[]);
 writeFileSync(join(root,'local.json'),'local');
 await new Promise(r=>setTimeout(r,80));assert.ok(events.includes('local.json'));
});
