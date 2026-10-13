#!/usr/bin/env node
/* A small local AI/human client. Revision and request IDs are explicit on every write. */
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const [command,work,...rest]=process.argv.slice(2),options={};
for(let i=0;i<rest.length;i+=2){if(!rest[i].startsWith('--')||rest[i+1]==null)throw new Error('options need a value');options[rest[i].slice(2)]=rest[i+1];}
const help=`Studio project tools
  node studio/cli.mjs show <work>
  node studio/cli.mjs context <work> --frame <sequence-frame>
  node studio/cli.mjs apply <work> --file <operations.json> --revision <revision> --request-id <unique-id>
  node studio/cli.mjs preview <work> --file <operations.json> --revision <revision>
  node studio/cli.mjs undo|redo <work> --revision <revision> --request-id <unique-id>
The apply file is an operation array or {operations, baseRevision, requestId, label}.
Use STUDIO_URL for a different local server (default http://127.0.0.1:4321/).
Edits use actor=ai by default; pass --actor human when acting manually.
Keep a request ID when retrying a failed connection. No provider credentials are needed.`;
if(!command||command==='help'||command==='--help'){console.log(help);process.exit(0);}
try{
 if(!work)throw new Error('a work ID is required');
 let path,body;
 if(command==='show'||command==='context'){
  path=`api/${command==='show'?'project':'context'}?work=${encodeURIComponent(work)}`;
  if(command==='context')path+='&frame='+encodeURIComponent(options.frame||'0');
 }else if(['apply','preview','undo','redo'].includes(command)){
  const file=options.file?JSON.parse(readFileSync(options.file,'utf8')):{};
  const request=Array.isArray(file)?{operations:file}:file;
  const baseRevision=options.revision||request.baseRevision;
  if(!baseRevision)throw new Error('read the project/context first, then supply its revision explicitly');
  const requestId=options['request-id']||request.requestId||randomUUID();
  body={work,baseRevision,requestId,actor:options.actor||'ai',label:options.label||request.label||command,
   ...(['apply','preview'].includes(command)?{operations:request.operations}:{action:command})};
  path=command==='preview'?'api/proposal':command==='apply'?'api/operations':'api/history';
  process.stderr.write(`requestId: ${requestId}\n`);
 }else throw new Error('unknown command: '+command);
 const base=(process.env.STUDIO_URL||'http://127.0.0.1:4321/').replace(/\/?$/,'/');
 const response=await fetch(new URL(path,base),body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});
 const result=await response.json();
 if(!response.ok)throw new Error(`${response.status}: ${result.error||'request failed'}`);
 console.log(JSON.stringify(result,null,2));
}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
