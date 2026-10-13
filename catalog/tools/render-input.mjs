/* Opt-in authored document projection. Every undeclared input stays byte-exact. */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateProject} from '../../studio/core/project.mjs';

export const RENDER_INPUT_VERSION=2;
export const hash=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical)
 :value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;

export function authoredDocument(bytes){
 const state=JSON.parse(bytes.toString('utf8'));
 if(!state||![1,2].includes(state.schemaVersion)
   ||Object.keys(state).some(key=>!['schemaVersion','project','generation','history','receipts','migrations'].includes(key)))
  throw new Error('unsupported authored document envelope; review its render projection');
 validateProject(state.project,{requireLayers:state.schemaVersion===2});
 // Keep all project fields, including annotations and names, conservatively.
 // Only the explicitly non-rendering storage envelope is excluded.
 return canonical({schemaVersion:state.schemaVersion,project:state.project});
}

export function renderInput(file,{project}={}){
 const bytes=readFileSync(file),sha256=hash(bytes);
 if(project&&resolve(file)===resolve(project))
  return {sha256,renderHash:hash(JSON.stringify(authoredDocument(bytes))),projection:'studio-project-v1'};
 return {sha256,renderHash:sha256,projection:'bytes-v1'};
}
