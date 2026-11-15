import fs from 'node:fs';import {JSDOM} from 'jsdom';import {importODTDocument} from '../src/odt.mjs';
const [input,caseId]=process.argv.slice(2),manifest=JSON.parse(fs.readFileSync(new URL('../test/fixtures/office-probes/manifest.json',import.meta.url),'utf8')),spec=manifest[caseId];
if(!spec)throw Error('Unknown Office probe.');
const Parser=new JSDOM('').window.DOMParser,result=importODTDocument(new Uint8Array(fs.readFileSync(input)),Parser),doc=new Parser().parseFromString(result.html,'text/html'),orientations=[...doc.querySelectorAll('section[data-forge-section]')].map(n=>JSON.parse(decodeURIComponent(n.getAttribute('data-forge-section'))).orientation);
if(result.warnings.length)throw Error('Unexpected native import warnings: '+result.warnings.join('; '));
if(JSON.stringify(orientations)!==JSON.stringify(spec.sections))throw Error('Native section orientations differ.');
const sections=[...doc.querySelectorAll('section[data-forge-section]')].map(n=>JSON.parse(decodeURIComponent(n.getAttribute('data-forge-section'))));if(spec.columns&&JSON.stringify(sections.map(a=>a.columns))!==JSON.stringify(spec.columns))throw Error('Native column counts differ.');if(spec.flows&&JSON.stringify(sections.map(a=>a.columnFlow||'balance'))!==JSON.stringify(spec.flows))throw Error('Native column flow differs.');
for(const marker of spec.markers)if(!doc.body.textContent.includes(marker))throw Error('Missing native content: '+marker);
console.log(JSON.stringify({sections:orientations,warnings:result.warnings,markers:spec.markers.length}));
