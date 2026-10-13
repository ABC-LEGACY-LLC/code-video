import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {digest, atomicWrite, sourcePath, withSourceLock} from './source-edit.mjs';
import {SCHEMA_VERSION, validateProject, applyOperations, frameContext, entitySchema, ENTITY_TYPES, isPlainRecord, LAYER_OPERATIONS} from './project.mjs';

export class ProjectError extends Error {
 constructor(message,status=400){super(message);this.status=status;}
}
const hashProject=project=>digest(JSON.stringify(project));
const stamp=()=>new Date().toISOString();
const validRequestId=value=>typeof value==='string'&&/^[\w:-]{8,120}$/.test(value);
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function validateProjectState(state,work){
 const check=(ok,message)=>{if(!ok)throw new ProjectError(message,422);};
 check(isPlainRecord(state),'invalid project document');
 check([1,SCHEMA_VERSION].includes(state.schemaVersion),'unsupported project schema');
 const projectCheck=project=>{
  validateProject(project,{requireLayers:state.schemaVersion>=2});
  if(state.schemaVersion===1)check(project.shots.every(s=>s.layerOrder===undefined&&s.entities.every(e=>e.layer===undefined)),'schema 1 project contains unmigrated layer data');
 };
 projectCheck(state.project);check(state.project.id===work.id,'project identity does not match work');
 check(Number.isSafeInteger(state.generation)&&state.generation>=0,'invalid project generation');
 check(isPlainRecord(state.history)&&['past','future'].every(k=>Array.isArray(state.history[k])&&state.history[k].length<=100),'invalid project history');
 for(const entry of [...state.history.past,...state.history.future]){
  check(isPlainRecord(entry),'invalid history entry');projectCheck(entry.project);
  check(entry.project.id===work.id,'history project identity does not match work');
  check(typeof entry.at==='string'&&entry.at.length<=80&&Number.isFinite(Date.parse(entry.at)),'invalid history time');
  check(isPlainRecord(entry.actor)&&['human','ai'].includes(entry.actor.kind)&&typeof entry.actor.identity==='string'&&entry.actor.identity.length<=200,'invalid history actor');
  check(typeof entry.label==='string'&&entry.label.length<=300&&validRequestId(entry.transactionId),'invalid history transaction');
  check(validHash(entry.sourceHash)&&validHash(entry.expectedHash),'invalid history revision');
 }
 check(Array.isArray(state.receipts)&&state.receipts.length<=256,'invalid transaction receipts');const ids=new Set();
 for(const receipt of state.receipts){
  check(isPlainRecord(receipt)&&validRequestId(receipt.id)&&validHash(receipt.signature)&&validHash(receipt.revision)&&!ids.has(receipt.id),'invalid transaction receipt');ids.add(receipt.id);
 }
}
export function sourceRevision(root,work){
 const files=[];
 function scan(dir,rel=''){
  for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   if(entry.name.startsWith('.')||['node_modules','build','out','private','history'].includes(entry.name))continue;
   const key=rel+entry.name;if(key===work.project)continue;
   if(entry.isDirectory())scan(join(dir,entry.name),key+'/');
   else if(entry.isFile()&&/\.(?:html|m?js|json|css|frag|glsl|svg|png|jpe?g|wav|mp3|ogg|woff2?)$/.test(entry.name))files.push([key,digest(readFileSync(join(dir,entry.name)))]);
  }
 }
 scan(resolve(root,work.dir));
 // The adapter imports this evaluator; changing interpolation also changes rendered output.
 for(const [name,key] of [['project.mjs','@studio/evaluator'],['layers.mjs','@studio/layers'],['layer-migration.mjs','@studio/layer-migration'],['editor-upgrade.mjs','@studio/editor-upgrade'],['../media.mjs','@studio/media'],['../composition.mjs','@studio/composition']]){
  const evaluator=join(root,'studio','core',name);if(existsSync(evaluator))files.push([key,digest(readFileSync(evaluator))]);
 }
 for(const dir of ['sdk','renderers','components']){const base=join(root,'studio',dir);if(existsSync(base))for(const name of readdirSync(base).sort())if(/\.mjs$/.test(name))files.push(['@studio/'+dir+'/'+name,digest(readFileSync(join(base,name)))]);}
 const componentSchema=join(root,'studio/core/component-schema.mjs');if(existsSync(componentSchema))files.push(['@studio/component-schema',digest(readFileSync(componentSchema))]);
 return digest(JSON.stringify(files));
}
export function createProjectStore(root){
 const defaultOperations=['addComponent','setProperty','setKeyframe','deleteKeyframe','renameShot','trimShot','moveShot','addAnnotation','resolveAnnotation','setCue','addAudio','deleteAudio','duplicateAudio',...LAYER_OPERATIONS];
 const operations=r=>(r.work.editor?.operations||defaultOperations).filter(op=>(r.state.schemaVersion>=2||!LAYER_OPERATIONS.includes(op))&&(op!=='addComponent'||r.state.schemaVersion>=2&&Object.keys(r.state.project.components||{}).length>0));
 function read(work){
  if(!work.project)throw new ProjectError('this work has no managed editor yet',404);
  const {path}=sourcePath(root,work,work.project);
  const text=readFileSync(path,'utf8'),state=JSON.parse(text);validateProjectState(state,work);
  const sourceHash=sourceRevision(root,work),revision=digest(JSON.stringify([state.generation,state.project,sourceHash]));
  return{path,state,sourceHash,revision,work,documentHash:digest(text)};
 }
 const overview=r=>({schemaVersion:r.state.schemaVersion,migrationRequired:r.state.schemaVersion<SCHEMA_VERSION&&r.work.id==='whiteout',generation:r.state.generation,project:r.state.project,revision:r.revision,sourceRevision:r.sourceHash,
  capabilities:{operations:operations(r),entityTypes:ENTITY_TYPES,components:r.state.project.components||{},entitySchemas:Object.fromEntries(r.state.project.shots.flatMap(s=>s.entities.map(e=>[e.id,entitySchema(r.state.project,e)]))),renderer:r.state.project.renderer||'legacy-canvas2d'},
  history:{canUndo:r.state.history.past.length>0,canRedo:r.state.history.future.length>0,
   entries:r.state.history.past.map(({at,actor,label,transactionId})=>({at,actor,label,transactionId}))}});
 function get(work){return overview(read(work));}
 function context(work,frame){const r=read(work);return{...overview(r),selection:frameContext(r.state.project,frame)};}
 function transact(work,request,identity='local'){
  if(!isPlainRecord(request)||!validRequestId(request.requestId))throw new ProjectError('requestId must be a unique 8–120 character identifier');
  if(!work.project)throw new ProjectError('this work has no managed editor yet',404);
  const {path}=sourcePath(root,work,work.project);
  return withSourceLock(path,()=>transactLocked(work,request,identity,path));
 }
 function transactLocked(work,request,identity,lockedPath){
  const r=read(work),{state}=r;
  if(r.path!==lockedPath)throw new ProjectError('project path changed while acquiring its lock',409);
  const signature=digest(JSON.stringify({baseRevision:request.baseRevision,action:request.action||'apply',operations:request.operations||[],actor:request.actor||'human',label:request.label||''}));
  const previous=state.receipts.find(x=>x.id===request.requestId);
  if(previous){if(previous.signature!==signature)throw new ProjectError('requestId already belongs to another operation',409);
   return{...overview(r),replayed:true,transactionId:request.requestId,appliedRevision:previous.revision};}
  if(request.baseRevision!==r.revision)throw new ProjectError('project changed; refresh and review your edit before retrying',409);
  const kind=request.actor||'human';if(!['human','ai'].includes(kind))throw new ProjectError('actor must be human or ai');
  const action=request.action||'apply',label=typeof request.label==='string'?request.label.slice(0,300):action;
  const entry={project:structuredClone(state.project),at:stamp(),actor:{kind,identity:String(identity)},label,transactionId:request.requestId,sourceHash:r.sourceHash};
  if(action==='undo'||action==='redo'){
   const from=action==='undo'?state.history.past:state.history.future,to=action==='undo'?state.history.future:state.history.past;
   const target=from.at(-1);if(!target)throw new ProjectError('nothing to '+action,409);
   if(target.sourceHash!==r.sourceHash||target.expectedHash!==hashProject(state.project))throw new ProjectError('source changed outside this history; review the current project before restoring an older edit',409);
   validateProject(target.project);if(target.project.id!==work.id)throw new ProjectError('history project identity does not match work',422);
   state.project=structuredClone(target.project);from.pop();entry.expectedHash=hashProject(state.project);to.push(entry);
  }else if(action==='apply'){
   const allowed=operations(r);
   if(!Array.isArray(request.operations)||request.operations.some(op=>!allowed.includes(op?.type)))throw new ProjectError('an operation is not supported by this work yet');
   state.project=applyOperations(state.project,request.operations);
   if(hashProject(entry.project)===hashProject(state.project))throw new ProjectError('the operation does not change the project');
   entry.expectedHash=hashProject(state.project);state.history.past.push(entry);state.history.future=[];
  }else throw new ProjectError('unknown transaction action');
  state.history.past=state.history.past.slice(-100);state.history.future=state.history.future.slice(-100);state.generation++;
  const revision=digest(JSON.stringify([state.generation,state.project,r.sourceHash]));
  state.receipts.push({id:request.requestId,signature,revision});state.receipts=state.receipts.slice(-256);
  validateProjectState(state,work);
  // One document holds authored state, receipts and history: a batch has one atomic commit.
  atomicWrite(r.path,JSON.stringify(state,null,2)+'\n',{beforeCommit(){
   const current=read(work);
   if(current.path!==r.path||current.documentHash!==r.documentHash||current.revision!==r.revision)
    throw new ProjectError('source changed while applying this transaction; refresh before retrying',409);
  }});
  return{...overview({...r,revision}),transactionId:request.requestId,appliedRevision:revision,replayed:false};
 }
 function preview(work,request){
  const r=read(work);if(request.baseRevision!==r.revision)throw new ProjectError('project changed; refresh the proposal',409);
  if(!Array.isArray(request.operations)||request.operations.some(op=>!operations(r).includes(op?.type)))throw new ProjectError('unsupported proposal operation');
  return{baseRevision:r.revision,before:r.state.project,after:applyOperations(r.state.project,request.operations),operations:request.operations};
 }
 return{get,context,transact,preview};
}
