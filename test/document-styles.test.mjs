import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import createDOMPurify from 'dompurify';
import {generateJSON,getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TableKit} from '@tiptap/extension-table';
import {DOCUMENT_STYLES,TEMPLATES,typographyCSS} from '../src/document-styles.mjs';
import {normalizeLayout} from '../src/document-model.mjs';
import {exportHTMLDocument,readHTMLDocument} from '../src/html-documents.mjs';
import {createSanitizer} from '../src/file-safety.mjs';
import {buildDocx} from '../src/docx-export.mjs';
import {Packer} from 'docx';
import JSZip from 'jszip';
const window=new JSDOM('').window;globalThis.window=window;globalThis.document=window.document;
const extensions=[StarterKit,TableKit],schema=getSchema(extensions),sanitize=createSanitizer(createDOMPurify(window));
test('all templates produce valid documents without changing an existing document',()=>{
 for(let template of TEMPLATES){let json=generateJSON(template.content,extensions);schema.nodeFromJSON(json).check();if(['report','proposal','brief'].includes(template.id))assert.ok(json.content.some(n=>n.type==='heading'));if(template.id==='proposal')assert.ok(json.content.some(n=>n.type==='table'))}
 assert.equal(new Set(TEMPLATES.map(t=>t.id)).size,TEMPLATES.length);
});
test('HTML round trip preserves theme, layout, title, and body without duplicating page furniture',()=>{
 const settings=normalizeLayout({theme:'editorial',font:'Georgia',orientation:'landscape',header:'Header',footer:'Footer'});
 const exported=exportHTMLDocument('<h1>A clear idea</h1><p>Body</p>','Title & details',settings);
 const imported=readHTMLDocument(exported,sanitize,window.DOMParser);assert.deepEqual(imported.layout,settings);assert.equal(imported.title,'Title & details');assert.match(imported.content,/<h1>A clear idea/);assert.doesNotMatch(imported.content,/Header|Footer/);assert.match(exported,/font-size:32pt/);assert.match(exported,/color:#79533A/);
});
test('invalid or malformed HTML metadata falls back to safe document defaults',()=>{
 for(let value of ['{bad','null','[]','123','true','{"theme":"__proto__","font":"url(evil)","margin":999}']){let html='<meta name="document-studio-layout" content=\''+value+'\'><p>Body</p>';let imported=readHTMLDocument(html,sanitize,window.DOMParser);assert.equal(imported.layout.theme,'studio');assert.equal(imported.layout.font,'Georgia');assert.equal(imported.layout.margin,22)}
 assert.doesNotMatch(typographyCSS({theme:'evil'}),/evil/);
});
test('DOCX uses document heading styles and preserves explicit formatting overrides',async()=>{
 const content={type:'doc',content:[{type:'heading',attrs:{level:1},content:[{type:'text',text:'Editorial title'}]},{type:'paragraph',content:[{type:'text',text:'Custom text',marks:[{type:'textStyle',attrs:{fontFamily:'Arial',fontSize:'14pt',color:'#123456'}}]}]}]};
 const zip=await JSZip.loadAsync(await Packer.toBuffer(buildDocx(content,{theme:'editorial'},'Style')));const xml=await zip.file('word/document.xml').async('string');
 for(let fragment of ['w:ascii="Georgia"','w:val="64"','w:color w:val="79533A"','w:ascii="Arial"','w:val="28"','w:color w:val="123456"'])assert.ok(xml.includes(fragment),fragment);
 assert.equal(Object.keys(DOCUMENT_STYLES).length,3);
});
