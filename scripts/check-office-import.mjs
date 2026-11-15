import {importDOCX} from '../src/docx-import.mjs';
import fs from 'node:fs';import {JSDOM} from 'jsdom';import {importODTDocument} from '../src/odt.mjs';
const [input,caseId]=process.argv.slice(2),manifest=JSON.parse(fs.readFileSync(new URL('../test/fixtures/office-probes/manifest.json',import.meta.url),'utf8')),spec=manifest[caseId];
if(!spec)throw Error('Unknown Office probe.');
const Parser=new JSDOM('').window.DOMParser,result=await (input.endsWith('.docx')?importDOCX(new Uint8Array(fs.readFileSync(input)),Parser):importODTDocument(new Uint8Array(fs.readFileSync(input)),Parser)),doc=new Parser().parseFromString(result.html,'text/html'),orientations=[...doc.querySelectorAll('section[data-forge-section]')].map(n=>JSON.parse(decodeURIComponent(n.getAttribute('data-forge-section'))).orientation);
if(result.warnings.length)throw Error('Unexpected native import warnings: '+result.warnings.join('; '));
if(JSON.stringify(orientations)!==JSON.stringify(spec.sections))throw Error('Native section orientations differ.');
const sections=[...doc.querySelectorAll('section[data-forge-section]')].map(n=>JSON.parse(decodeURIComponent(n.getAttribute('data-forge-section'))));if(spec.columns&&JSON.stringify(sections.map(a=>a.columns))!==JSON.stringify(spec.columns))throw Error('Native column counts differ.');if(spec.flows&&JSON.stringify(sections.map(a=>a.columnFlow||'balance'))!==JSON.stringify(spec.flows))throw Error('Native column flow differs.');
for(const key of ['header','footer'])if(spec[key+'s']&&JSON.stringify(sections.map(a=>a[key]))!==JSON.stringify(spec[key+'s']))throw Error('Native '+key+' text differs.');if(spec.blanks&&JSON.stringify(sections.map(a=>[a.blankHeader===true,a.blankFooter===true]))!==JSON.stringify(spec.blanks))throw Error('Native blank furniture differs.');
if(spec.sizes&&JSON.stringify(sections.map(a=>a.size||result.layout.size))!==JSON.stringify(spec.sizes))throw Error('Native section paper differs.');if(spec.margins&&JSON.stringify(sections.map(a=>a.margin??result.layout.margin))!==JSON.stringify(spec.margins))throw Error('Native section margins differ.');
for(const marker of spec.markers)if(!doc.body.textContent.includes(marker))throw Error('Missing native content: '+marker);
console.log(JSON.stringify({sections:orientations,warnings:result.warnings,markers:spec.markers.length}));

if(spec.numbering&&JSON.stringify(sections.map(a=>typeof a.pageNumbers==='boolean'?a.pageNumbers:result.layout.pageNumbers))!==JSON.stringify(spec.numbering))throw Error('Native page-number visibility differs.');
