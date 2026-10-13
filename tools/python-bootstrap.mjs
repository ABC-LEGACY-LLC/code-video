import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
// Debian's minimal Python may omit ensurepip. Bootstrap only this isolated venv,
// using a fixed official wheel and its SHA-256; never modify system Python.
export async function bootstrapPip(python,venv){
 const name='pip-25.2-py3-none-any.whl',sha='6d67a2b4e7f14d8b31b8b52648866fa717f45a1eb70e83002f4331d07e953717';
 const url='https://files.pythonhosted.org/packages/b7/3f/945ef7ab14dc4f9d7f40288d2df998d1837ee0888ec3659c813487572faa/'+name;
 const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error('pip bootstrap download failed: '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==sha)throw new Error('pip bootstrap checksum mismatch');
 const file=path.join(venv,name);fs.writeFileSync(file,bytes,{mode:0o600});
 try{const r=spawnSync(python,['-m','pip','install','--no-index',file],{stdio:'inherit',env:{...process.env,PYTHONPATH:file}});if(r.status!==0)throw new Error('isolated pip bootstrap failed');}finally{fs.rmSync(file,{force:true});}
}
