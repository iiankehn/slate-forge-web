import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const types={'.svg':'image/svg+xml','.ico':'image/x-icon','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.wasm':'application/wasm','.gz':'application/gzip','.png':'image/png','.txt':'text/plain; charset=utf-8'};
export function createStaticServer({root=path.resolve('dist'),prefix='/slate-forge-web/',readStream=fs.createReadStream}={}){
 root=path.resolve(root);
 return http.createServer((request,response)=>{
  const missing=()=>{if(response.destroyed)return;if(response.headersSent)response.destroy();else{response.writeHead(404);response.end()}};
  try{
   const url=new URL(request.url,'http://127.0.0.1');
   if(!['GET','HEAD'].includes(request.method)||!url.pathname.startsWith(prefix)){missing();return}
   const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html',file=path.resolve(root,relative.endsWith('/')?relative+'index.html':relative);
   if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){missing();return}
   const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'};
   if(request.method==='HEAD'){response.writeHead(200,headers);response.end();return}
   const stream=readStream(file);
   stream.once('error',missing);
   response.once('close',()=>stream.destroy());
   stream.once('open',()=>{if(response.destroyed){stream.destroy();return}response.writeHead(200,headers);stream.pipe(response)});
  }catch{missing()}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const server=createStaticServer(),port=4173;
 server.listen(port,'127.0.0.1',()=>console.log('Static browser-test site: http://127.0.0.1:'+port+'/slate-forge-web/'));
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
