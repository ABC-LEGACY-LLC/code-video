import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {digest,atomicWrite,sourcePath,withSourceLock} from './source-edit.mjs';
import {sourceRevision,validateProjectState,ProjectError} from './store.mjs';
import {upgradeEditorProject} from './editor-upgrade.mjs';
const hash=p=>digest(JSON.stringify(p));
export function upgradeEditorState(original,{beforeSourceHash,afterSourceHash}){
 if(![beforeSourceHash,afterSourceHash].every(h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h)))throw new Error('explicit old and new runtime hashes are required');
 validateProjectState(original,{id:'whiteout'});if(original.schemaVersion!==2)throw new Error('migrate layers to schema 2 first');
 const state=structuredClone(original),mapping=new Map(),upgrade=p=>{const next=upgradeEditorProject(p);mapping.set(hash(p),hash(next));return next;};
 state.project=upgrade(state.project);const entries=[...state.history.past,...state.history.future];for(const e of entries)e.project=upgrade(e.project);
 let rebased=0;for(const e of entries){if(e.sourceHash===beforeSourceHash&&mapping.has(e.expectedHash)){e.sourceHash=afterSourceHash;e.expectedHash=mapping.get(e.expectedHash);rebased++;}}
 state.migrations=[...(state.migrations||[]),{editorVersion:1,at:new Date().toISOString(),beforeSourceHash,afterSourceHash}];validateProjectState(state,{id:'whiteout'});
 return{state,rebased,retained:entries.length-rebased};
}
export function upgradeEditorFile(root,work,{manifest,dryRun=true}){
 const {path}=sourcePath(root,work,work.project);return withSourceLock(path,()=>{
  const before=readFileSync(path,'utf8'),original=JSON.parse(before);
  if(!manifest||digest(before)!==manifest.documentHash||original.generation!==manifest.generation)throw new ProjectError('project changed after the old-runtime snapshot; refusing migration',409);
  const afterSourceHash=sourceRevision(root,work),{state,...summary}=upgradeEditorState(original,{beforeSourceHash:manifest.sourceHash,afterSourceHash});
  const after=JSON.stringify(state,null,2)+'\n',backup=join(root,'build','.migration-backups','editor-completion',manifest.documentHash+'.json');
  const result={...summary,generation:state.generation,beforeDocumentHash:manifest.documentHash,afterDocumentHash:digest(after),beforeSourceHash:manifest.sourceHash,afterSourceHash,backup,dryRun};
  if(dryRun)return result;
  mkdirSync(join(root,'build','.migration-backups','editor-completion'),{recursive:true,mode:0o700});
  if(existsSync(backup)){if(readFileSync(backup,'utf8')!==before)throw new Error('backup bytes differ');}else atomicWrite(backup,before);
  atomicWrite(backup+'.receipt.json',JSON.stringify(result,null,2)+'\n');
  atomicWrite(path,after,{beforeCommit(){if(digest(readFileSync(path,'utf8'))!==manifest.documentHash||sourceRevision(root,work)!==afterSourceHash)throw new ProjectError('project or runtime changed during migration',409);}});
  return result;
 });
}
