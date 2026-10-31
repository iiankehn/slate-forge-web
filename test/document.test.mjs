import test from 'node:test';
import {JSDOM} from 'jsdom';
import assert from 'node:assert/strict';
import {getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {findMatches,normalizeLayout} from '../src/document-model.mjs';
import {buildDocx} from '../src/docx-export.mjs';
import {Packer} from 'docx';
import JSZip from 'jszip';
import mammoth from 'mammoth';
const schema=getSchema([StarterKit]);
function doc(content){return schema.nodeFromJSON({type:'doc',content})}
const t=(text,marks)=>({type:'text',text,...(marks?{marks}:{})});
const p=(...content)=>({type:'paragraph',content});
test('find spans formatting marks and preserves document offsets',()=>{
 let document=doc([p(t('A br'),t('ave',[{type:'bold'}]),t(' idea. Brave again.'))]);
 let ranges=findMatches(document,'brave');assert.equal(ranges.length,2);
 for(let range of ranges)assert.match(document.textBetween(range.from,range.to),/^brave$/i);
 assert.equal(findMatches(document,'Brave',true).length,1);
});
test('literal search treats regex punctuation as text',()=>{
 let document=doc([p(t('Price $5.00; a+b and aab.'))]);
 assert.equal(findMatches(document,'$5.00').length,1);
 assert.equal(findMatches(document,'a+b').length,1);
 assert.equal(findMatches(document,'').length,0);
});
test('search does not cross paragraphs or inline breaks',()=>{
 let document=doc([p(t('one')),p(t('two'),{type:'hardBreak'},t('three'))]);
 assert.equal(findMatches(document,'onetwo').length,0);
 assert.equal(findMatches(document,'twothree').length,0);
});
test('reverse replacement handles different lengths and literal dollar strings',()=>{
 let document=doc([p(t('cat cat cat'))]);
 // Use real ProseMirror transactions to verify position mapping across replacements.
 return import('@tiptap/pm/state').then(({EditorState})=>{let state=EditorState.create({doc:document});let transaction=state.tr;
 for(let range of findMatches(document,'cat').reverse())transaction.insertText('$& kitten',range.from,range.to);
 assert.equal(transaction.doc.textContent,'$& kitten $& kitten $& kitten');});
});
test('Unicode case-insensitive matches retain original indices',()=>{
 let document=doc([p(t('İ TEST test 😀'))]);let ranges=findMatches(document,'test');
 assert.equal(ranges.length,2);for(let r of ranges)assert.match(document.textBetween(r.from,r.to),/^test$/i);
});
test('layout normalizes old backups and invalid values',()=>{
 assert.deepEqual(normalizeLayout({size:'evil',margin:500,font:'url(evil)',orientation:'invalid'}),normalizeLayout());
 let layout=normalizeLayout({orientation:'landscape',size:'Letter',margin:'30',header:'x'.repeat(200),pageNumbers:true});
 assert.equal(layout.margin,30);assert.equal(layout.header.length,120);assert.equal(layout.pageNumbers,true);
});
const fixture={type:'doc',content:[{type:'heading',attrs:{level:1},content:[t('Project outline')]},{type:'paragraph',attrs:{textAlign:'center',paragraphSpacing:'18pt',paragraphLine:'2',indent:1},content:[t('Important',[{type:'bold'},{type:'textStyle',attrs:{fontFamily:'Arial',fontSize:'18pt',color:'#123456'}}]),t(' details.')]},{type:'orderedList',attrs:{start:3},content:[{type:'listItem',content:[p(t('First item'))]}]},{type:'table',content:[{type:'tableRow',content:[{type:'tableHeader',content:[p(t('Column'))]},{type:'tableCell',content:[p(t('Cell value'))]}]}]},{type:'pageBreak'},p(t('Second page'))]};
test('DOCX contains formatting, table, landscape margins, header, footer and page field',async()=>{
 const buffer=await Packer.toBuffer(buildDocx(fixture,{orientation:'landscape',size:'Letter',margin:15,header:'Internal draft',footer:'Project team',pageNumbers:true},'Outline'));
 const zip=await JSZip.loadAsync(buffer),xml=await zip.file('word/document.xml').async('string');
 for(let fragment of ['Project outline','<w:tbl>','w:orient="landscape"','w:sz w:val="36"','w:color w:val="123456"','w:after="360"','w:line="480"','<w:pageBreakBefore','w:left="850"'])assert.ok(xml.includes(fragment),fragment);
 const headers=await Promise.all(Object.keys(zip.files).filter(n=>/word\/(header|footer)\d+\.xml$/.test(n)).map(n=>zip.file(n).async('string')));
 assert.match(headers.join(''),/Internal draft/);assert.match(headers.join(''),/Project team/);assert.match(headers.join(''),/PAGE/);
 const result=await mammoth.convertToHtml({buffer});assert.equal(new JSDOM(result.value).window.document.querySelector('h1').textContent,'Project outline');assert.match(result.value,/<strong>Important/);assert.match(result.value,/<table>/);assert.match(result.value,/Second page/);
});
test('DOCX embedded PNG is present in the archive',async()=>{
 const src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=';
 const images=new Map([[src,{type:'png',width:1,height:1,data:Buffer.from(src.split(',')[1],'base64')}]]);
 const buffer=await Packer.toBuffer(buildDocx({type:'doc',content:[{type:'image',attrs:{src,alt:'Test pixel'}}]}, {},'Image',images));
 const zip=await JSZip.loadAsync(buffer);assert.ok(Object.keys(zip.files).some(n=>n.startsWith('word/media/')&&n.endsWith('.png')));
});

const {textStatistics,documentOutline,documentStatistics,normalizeWordGoal}=await import('../src/document-model.mjs');
test('statistics count words without punctuation and treat emoji as one character',()=>{
 const metrics=textStatistics('Hello, world! 😀');assert.equal(metrics.words,2);assert.equal(metrics.characters,15);assert.equal(metrics.charactersWithoutSpaces,13);assert.equal(metrics.readingMinutes,1);
 assert.equal(textStatistics('').readingMinutes,0);assert.equal(textStatistics('... -- 😀').words,0);
});
test('outline follows heading hierarchy and preserves navigable document positions',()=>{
 const document=doc([{type:'heading',attrs:{level:1},content:[t('Overview')]},p(t('Body text.')),{type:'heading',attrs:{level:3},content:[t('Details')]},{type:'heading',attrs:{level:2}}]);
 const outline=documentOutline(document);assert.deepEqual(outline.map(h=>[h.level,h.title]),[[1,'Overview'],[3,'Details'],[2,'Untitled heading']]);for(let h of outline)assert.equal(document.nodeAt(h.pos).type.name,'heading');
 const metrics=documentStatistics(document);assert.equal(metrics.headings,3);assert.equal(metrics.paragraphs,1);assert.equal(metrics.words,4);
});
test('word goals reject invalid, negative and excessive values',()=>{
 for(let value of [-1,1.5,100001,'bad',Infinity])assert.equal(normalizeWordGoal(value),0);assert.equal(normalizeWordGoal('500'),500);assert.equal(normalizeWordGoal(0),0);assert.equal(normalizeWordGoal(100000),100000);
});
