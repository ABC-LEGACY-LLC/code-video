#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {migrateLayerFile,rollbackLayerFile} from './core/layer-migration-store.mjs';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const [workId,...args]=process.argv.slice(2),options={};
try{
 for(let i=0;i<args.length;i++){
  if(args[i]==='--apply')options.apply=true;
  else if(args[i]==='--dry-run')options.apply=false;
  else if(['--manifest','--rollback'].includes(args[i])&&args[i+1])options[args[i].slice(2)]=args[++i];
  else throw new Error('unknown or incomplete option: '+args[i]);
 }
 if(!workId||workId==='--help'){console.log('node studio/migrate-layers.mjs whiteout --manifest <old-runtime-manifest.json> [--apply]\nDefault is dry-run. Rollback: node studio/migrate-layers.mjs whiteout --rollback <private-receipt.json>');}
 else{
  const works=JSON.parse(readFileSync(resolve(root,'studio/works.json'),'utf8')).works,work=works.find(w=>w.id===workId);
  if(!work?.project)throw new Error('unknown managed work: '+workId);
  if(!options.rollback&&!options.manifest)throw new Error('--manifest must name the validated old-runtime baseline');
  const result=options.rollback?rollbackLayerFile(root,work,resolve(options.rollback)):
   migrateLayerFile(root,work,{manifest:JSON.parse(readFileSync(resolve(options.manifest||''),'utf8')),dryRun:!options.apply});
  console.log(JSON.stringify(result,null,2));
 }
}catch(error){console.error(error.message);process.exitCode=1;}
