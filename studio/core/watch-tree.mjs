/* Watch directory entries, not file inodes. Atomic replacement must keep working
   on the second and subsequent save too. Node's Linux recursive file watchers may
   otherwise remain attached to the inode that rename replaced. */
import {watch,readdirSync,lstatSync} from 'node:fs';
import {join,relative,sep} from 'node:path';

export function watchTree(root,changed,{ignore=()=>false,onError=()=>{}}={}){
 const watchers=new Map();let closed=false;
 const rel=path=>relative(root,path).split(sep).join('/');
 const remove=path=>{for(const [key,entry] of watchers)if(key===path||key.startsWith(path+sep)){entry.watcher.close();watchers.delete(key);}};
 function add(dir,refresh=false){
  if(closed||ignore(rel(dir)))return;
  let stat;try{stat=lstatSync(dir,{bigint:true});}catch{return;}
  if(!stat.isDirectory())return;
  const existing=watchers.get(dir);
  // A deleted directory's inode can be reused before its queued rename events run.
  // Birth time distinguishes that replacement from another event for the new tree.
  if(existing){if(!refresh&&existing.dev===stat.dev&&existing.ino===stat.ino&&existing.birthtimeNs===stat.birthtimeNs)return;remove(dir);}
  let watcher;
  try{watcher=watch(dir,(event,name)=>{
   // Closing a watcher does not cancel callbacks already queued for its old path.
   if(closed||watchers.get(dir)?.watcher!==watcher||!name)return;const path=join(dir,String(name)),key=rel(path);if(ignore(key))return;
   if(event==='rename'){
    let directory=false;try{directory=lstatSync(path).isDirectory();}catch{}
    if(directory)add(path,true);else if(watchers.has(path))remove(path);
   }
   changed(key);
  });}catch(error){onError(error);return;}
  watchers.set(dir,{watcher,dev:stat.dev,ino:stat.ino,birthtimeNs:stat.birthtimeNs});watcher.on('error',onError);
  // A parent rename may replace a directory within the filesystem timestamp tick.
  // Rebind even when inode/birth time match, and report entries discovered during
  // that handover: a queued callback on the closed watcher may otherwise be lost.
  try{for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())add(path,refresh);else if(refresh&&entry.isFile()&&!ignore(rel(path)))changed(rel(path));}}catch(error){onError(error);}
 }
 add(root);
 return()=>{closed=true;for(const entry of watchers.values())entry.watcher.close();watchers.clear();};
}
