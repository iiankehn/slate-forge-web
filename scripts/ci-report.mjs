import fs from 'node:fs';
const [kind,file]=process.argv.slice(2);let text;
if(!['node','browser'].includes(kind)||!file)throw Error('Expected report kind and file.');
if(!fs.existsSync(file))text='No complete '+kind+' report was produced; inspect the failed step.';
else if(kind==='node'){const log=fs.readFileSync(file,'utf8');text='## Node regressions\n\n'+['tests','pass','fail','skipped'].map(key=>'- '+key+': '+([...log.matchAll(new RegExp('ℹ '+key+' (\\d+)','g'))].at(-1)?.[1]||'unavailable')).join('\n')}
else{const {stats}=JSON.parse(fs.readFileSync(file,'utf8'));text='## Browser profile: '+(process.env.BROWSER_PROJECT||'unknown')+'\n\n'+['expected','unexpected','flaky','skipped'].map(key=>'- '+key+': '+stats[key]).join('\n')}
console.log(text);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text+'\n');
