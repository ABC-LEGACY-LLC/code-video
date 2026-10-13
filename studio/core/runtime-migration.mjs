// A reviewed compatibility release may rebind history to the new runtime.
// No authored project, expected project hash, generation or receipt is rewritten.
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {digest,atomicWrite,sourcePath,withSourceLock} from './source-edit.mjs';
import {sourceRevision,validateProjectState,ProjectError} from './store.mjs';
export function rebaseRuntimeState(original,work,{beforeSourceHash,afterSourceHash}){
 if(![beforeSourceHash,afterSourceHash].every(h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h)))throw new Error('explicit old and new source hashes required');
 validateProjectState(original,work);const state=structuredClone(original);let rebased=0,retained=0;
 for(const entry of [...state.history.past,...state.history.future]){
  if(entry.sourceHash===beforeSourceHash){entry.sourceHash=afterSourceHash;rebased++;}else retained++;
 }
 state.migrations=[...(state.migrations||[]),{runtimeVersion:'sdk-1',at:new Date().toISOString(),beforeSourceHash,afterSourceHash}];
 validateProjectState(state,work);return{state,rebased,retained};
}
export function rebaseRuntimeFile(root,work,{manifest,dryRun=true}){
 const {path}=sourcePath(root,work,work.project);return withSourceLock(path,()=>{
  const before=readFileSync(path,'utf8'),original=JSON.parse(before);
  if(!manifest||digest(before)!==manifest.documentHash||original.generation!==manifest.generation||digest(JSON.stringify(original.project))!==manifest.projectHash)throw new ProjectError('project changed after the release baseline; refusing history rebase',409);
  const afterSourceHash=sourceRevision(root,work),{state,...counts}=rebaseRuntimeState(original,work,{beforeSourceHash:manifest.sourceHash,afterSourceHash});
  const after=JSON.stringify(state,null,2)+'\n',backup=join(root,'build','.migration-backups','sdk-1',manifest.documentHash+'.json');
  const result={...counts,work:work.id,generation:state.generation,beforeDocumentHash:manifest.documentHash,afterDocumentHash:digest(after),beforeSourceHash:manifest.sourceHash,afterSourceHash,backup,dryRun};
  if(dryRun)return result;
  mkdirSync(dirname(backup),{recursive:true,mode:0o700});
  if(existsSync(backup)){if(readFileSync(backup,'utf8')!==before)throw new Error('backup bytes differ');}else atomicWrite(backup,before);
  atomicWrite(backup+'.receipt.json',JSON.stringify(result,null,2)+'\n');
  atomicWrite(path,after,{beforeCommit(){if(digest(readFileSync(path,'utf8'))!==manifest.documentHash||sourceRevision(root,work)!==afterSourceHash)throw new ProjectError('project or runtime changed during migration',409);}});
  return result;
 });
}
