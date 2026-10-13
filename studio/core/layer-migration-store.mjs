/* Explicit on-disk migration. The manifest must be captured from the old runtime
   before deploying new sources: never infer its source hash from history entries. */
import {readFileSync,mkdirSync,openSync,writeFileSync,fsyncSync,closeSync,existsSync,realpathSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {digest,sourcePath,withSourceLock,atomicWrite} from './source-edit.mjs';
import {sourceRevision,validateProjectState,ProjectError} from './store.mjs';
import {migrateWhiteoutProject} from './layer-migration.mjs';
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const hashProject=project=>digest(JSON.stringify(project));
export function migrateLayerState(original,{beforeSourceHash,afterSourceHash,at=new Date().toISOString()}={}){
 if(!validHash(beforeSourceHash)||!validHash(afterSourceHash))throw new Error('explicit before/after source hashes are required');
 const work={id:original.project?.id};validateProjectState(original,work);
 if(original.schemaVersion!==1)throw new Error('layer migration needs a schema 1 document');
 const state=structuredClone(original),mapping=new Map();
 const migrate=project=>{const next=migrateWhiteoutProject(project);mapping.set(hashProject(project),hashProject(next));return next;};
 state.project=migrate(state.project);
 const entries=[...state.history.past,...state.history.future];
 for(const entry of entries)entry.project=migrate(entry.project);
 let rebased=0,retained=0,expectedMapped=0,expectedRetained=0;
 for(const entry of entries){
  if(entry.sourceHash===beforeSourceHash){entry.sourceHash=afterSourceHash;rebased++;}else retained++;
  if(mapping.has(entry.expectedHash)){entry.expectedHash=mapping.get(entry.expectedHash);expectedMapped++;}else expectedRetained++;
 }
 state.schemaVersion=2;
 state.migrations=[...(Array.isArray(state.migrations)?state.migrations:[]),{from:1,to:2,at,beforeSourceHash,afterSourceHash}];
 validateProjectState(state,work);
 return{state,summary:{generation:state.generation,shots:state.project.shots.length,layers:state.project.shots.reduce((n,s)=>n+s.layerOrder.length,0),
  past:state.history.past.length,future:state.history.future.length,receipts:state.receipts.length,rebased,retained,expectedMapped,expectedRetained}};
}
function writeBackup(file,text){
 mkdirSync(dirname(file),{recursive:true,mode:0o700});
 if(existsSync(file)){if(readFileSync(file,'utf8')!==text)throw new Error('backup path already contains different bytes');return;}
 const fd=openSync(file,'wx',0o600);try{writeFileSync(fd,text);fsyncSync(fd);}finally{closeSync(fd);}
 const dir=openSync(dirname(file),'r');try{fsyncSync(dir);}finally{closeSync(dir);}
}
export function migrateLayerFile(root,work,{manifest,dryRun=true}={}){
 if(!manifest||!validHash(manifest.documentHash)||!validHash(manifest.sourceHash))throw new Error('a validated pre-deployment manifest with documentHash/sourceHash is required');
 const {path}=sourcePath(root,work,work.project);
 return withSourceLock(path,()=>{
  const before=readFileSync(path,'utf8'),original=JSON.parse(before);validateProjectState(original,work);
  if(original.schemaVersion===2)return{changed:false,dryRun,schemaVersion:2,generation:original.generation,documentHash:digest(before)};
  if(digest(before)!==manifest.documentHash||original.generation!==manifest.generation)
   throw new ProjectError('project changed after the baseline manifest; capture and validate the latest old-runtime state before migration',409);
  const afterSourceHash=sourceRevision(root,work);
  const {state,summary}=migrateLayerState(original,{beforeSourceHash:manifest.sourceHash,afterSourceHash});
  const after=JSON.stringify(state,null,2)+'\n',afterDocumentHash=digest(after);
  const backupPath=join(root,'build','.migration-backups',work.id,manifest.documentHash+'.schema1.json');
  const receiptPath=backupPath+'.'+afterDocumentHash+'.receipt.json';
  const result={changed:true,dryRun,...summary,backupPath,receiptPath,beforeDocumentHash:manifest.documentHash,afterDocumentHash,
   beforeSourceHash:manifest.sourceHash,afterSourceHash};
  if(dryRun)return result;
  // Backups are durable before the commit; a refused migration never restores over
  // a concurrent writer. Residual non-cooperating check/rename races match the store.
  writeBackup(backupPath,before);
  writeBackup(receiptPath,JSON.stringify({schemaVersion:1,work:work.id,backupPath,beforeDocumentHash:manifest.documentHash,
   afterDocumentHash,beforeSourceHash:manifest.sourceHash,afterSourceHash},null,2)+'\n');
  atomicWrite(path,after,{beforeCommit(){
   if(sourcePath(root,work,work.project).path!==path||digest(readFileSync(path,'utf8'))!==manifest.documentHash||sourceRevision(root,work)!==afterSourceHash)
    throw new ProjectError('project or runtime changed during migration; current bytes were preserved',409);
  }});
  return result;
 });
}
export function rollbackLayerFile(root,work,receiptFile){
 const privateRoot=resolve(root,'build','.migration-backups')+sep,receiptPath=realpathSync(receiptFile);
 if(!receiptPath.startsWith(privateRoot))throw new Error('rollback receipt must be in the private migration backup directory');
 const receipt=JSON.parse(readFileSync(receiptPath,'utf8'));
 if(receipt.work!==work.id||![receipt.beforeDocumentHash,receipt.afterDocumentHash,receipt.afterSourceHash].every(validHash))throw new Error('invalid migration receipt');
 const backupPath=realpathSync(receipt.backupPath);if(!backupPath.startsWith(privateRoot))throw new Error('backup is outside the private migration directory');
 const before=readFileSync(backupPath,'utf8');if(digest(before)!==receipt.beforeDocumentHash)throw new Error('migration backup hash mismatch');
 validateProjectState(JSON.parse(before),work);
 const {path}=sourcePath(root,work,work.project);
 return withSourceLock(path,()=>{
  const guard=()=>{if(sourcePath(root,work,work.project).path!==path||digest(readFileSync(path,'utf8'))!==receipt.afterDocumentHash||sourceRevision(root,work)!==receipt.afterSourceHash)
   throw new ProjectError('project or runtime changed after migration; refusing rollback over newer edits',409);};
  guard();atomicWrite(path,before,{beforeCommit:guard});
  return{rolledBack:true,documentHash:receipt.beforeDocumentHash,backupPath,notice:'Project bytes restored. Restore matching pre-migration runtime sources separately.'};
 });
}
