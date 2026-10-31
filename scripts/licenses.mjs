import fs from 'node:fs';
import path from 'node:path';
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
let output='THIRD-PARTY SOFTWARE NOTICES\n\nSlate Forge includes the following open-source packages.\n\n';
for(let [dir,info] of Object.entries(lock.packages).sort()){
 if(!dir||!fs.existsSync(dir+'/package.json'))continue;
 const pkg=JSON.parse(fs.readFileSync(dir+'/package.json','utf8'));
 output+=`\n${'='.repeat(72)}\n${pkg.name} ${pkg.version}\nDeclared license: ${pkg.license||info.license||'See included license'}\n`;
 const names=fs.readdirSync(dir).filter(n=>/^(licen[cs]e|copying|notice)([.-]|$)/i.test(n));
 for(let name of names){const file=path.join(dir,name);if(fs.statSync(file).isFile())output+='\n'+name+'\n'+fs.readFileSync(file,'utf8')+'\n'}
}
fs.writeFileSync('dist/THIRD-PARTY-NOTICES.txt',output);
