import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createStaticServer} from '../scripts/serve-dist.mjs';

async function fixture(run,readStream){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'slate-server-'));fs.writeFileSync(path.join(root,'index.html'),'Healthy shell');fs.writeFileSync(path.join(root,'sw.js'),'Fixture worker');
 const server=createStaticServer({root,readStream});server.listen(0,'127.0.0.1');await once(server,'listening');
 try{await run('http://127.0.0.1:'+server.address().port+'/slate-forge-web/',root)}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true})}
}
test('a fixture removed between stat and stream open returns 404 without crashing subsequent requests',async()=>{
 await fixture(async url=>{const missing=await fetch(url+'sw.js',{signal:AbortSignal.timeout(3000)});assert.equal(missing.status,404);const healthy=await fetch(url);assert.equal(healthy.status,200);assert.equal(await healthy.text(),'Healthy shell')},file=>{if(file.endsWith('sw.js'))fs.unlinkSync(file);return fs.createReadStream(file)});
});
test('static server retains HEAD, missing-file and path/method restrictions',async()=>{
 await fixture(async url=>{const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.match(head.headers.get('content-type'),/text\/html/);for(const target of ['absent.js','../outside','%2e%2e%2foutside'])assert.equal((await fetch(url+target)).status,404);assert.equal((await fetch(url,{method:'POST'})).status,404);assert.equal(await (await fetch(url)).text(),'Healthy shell')});
});
