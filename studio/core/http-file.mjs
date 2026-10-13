import {createReadStream,statSync} from 'node:fs';
// Video and audio decoders need byte ranges and a known length to seek reliably.
export function serveFile(req,res,file,type){
 const size=statSync(file).size,headers={'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff','accept-ranges':'bytes'};
 let start=0,end=size-1,code=200;
 if(req.headers.range){
  const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!m||(!m[1]&&!m[2])){res.writeHead(416,{...headers,'content-range':`bytes */${size}`});res.end();return;}
  if(m[1]){start=Number(m[1]);end=m[2]?Math.min(size-1,Number(m[2])):size-1;}
  else{const suffix=Number(m[2]);start=Math.max(0,size-suffix);end=size-1;}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start){res.writeHead(416,{...headers,'content-range':`bytes */${size}`});res.end();return;}
  code=206;headers['content-range']=`bytes ${start}-${end}/${size}`;
 }
 headers['content-length']=Math.max(0,end-start+1);res.writeHead(code,headers);
 if(req.method==='HEAD'||!size){res.end();return;}
 const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
