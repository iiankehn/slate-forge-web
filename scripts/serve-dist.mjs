import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist'),prefix='/slate-forge-web/',port=4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.wasm':'application/wasm','.gz':'application/gzip','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server=http.createServer((request,response)=>{try{const url=new URL(request.url,'http://127.0.0.1:'+port);if(!['GET','HEAD'].includes(request.method)||!url.pathname.startsWith(prefix)){response.writeHead(404);response.end();return}const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html',file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return}response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});if(request.method==='HEAD')response.end();else fs.createReadStream(file).pipe(response)}catch{response.writeHead(404);response.end()}});
server.listen(port,'127.0.0.1',()=>console.log('Static browser-test site: http://127.0.0.1:'+port+prefix));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
