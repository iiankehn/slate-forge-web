import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {balanceLineBreak,firstBalancedLinesBottom,textCoordinates} from '../src/line-pagination.mjs';
import {planPageBreaks} from '../src/live-pagination.mjs';import {paginateDocument} from '../src/pagination.mjs';
const geometry={height:1000,margin:100};
const coordinates=(from,top,step=100,chars=5)=>pos=>({top:top+Math.floor((pos-from)/chars)*step,bottom:top+Math.floor((pos-from)/chars)*step+80});
const paragraph=(from,lines,top,step=100)=>({type:'text',textblock:true,from,to:from+lines*5-1,pos:from-1,top,bottom:top+(lines-1)*step+80});
test('balanced splits keep two lines on each side and move short paragraphs intact',()=>{
 const coords=coordinates(1,100);
 assert.equal(balanceLineBreak(1,25,21,coords),16); // five lines: 3+2 rather than 4+1
 assert.equal(balanceLineBreak(1,20,11,coords),11); // four lines: 2+2
 assert.equal(balanceLineBreak(1,20,6,coords),1); // only one line fits
 assert.equal(balanceLineBreak(1,15,11,coords),1); // three lines must stay whole
 assert.equal(balanceLineBreak(1,10,6,coords),1);
 assert.equal(balanceLineBreak(1,5,3,pos=>{assert.ok(pos>=1);return {top:100,bottom:180}}),1);
});
test('live pagination backs up a line for a widow and moves an orphaned paragraph',()=>{
 const widow=paragraph(1,9,100),plan=planPageBreaks([widow],geometry,coordinates(1,100));assert.equal(plan.pages,2);assert.equal(plan.breaks[0].pos,36); // 7+2, not 8+1
 const orphan=paragraph(1,4,800),moved=planPageBreaks([orphan],geometry,coordinates(1,800));assert.equal(moved.pages,2);assert.equal(moved.breaks[0].pos,1);
 const short=planPageBreaks([paragraph(1,3,700)],geometry,coordinates(1,700));assert.equal(short.breaks[0].pos,1);
});
test('headings stay with a balanced start of following text, including three-line paragraphs',()=>{
 const heading={...paragraph(1,1,600),heading:true},body=paragraph(10,3,700),coords=p=>p<10?{top:600,bottom:680}:coordinates(10,700)(p);
 const plan=planPageBreaks([heading,body],geometry,coords);assert.equal(plan.breaks.length,1);assert.equal(plan.breaks[0].pos,1);
 assert.equal(firstBalancedLinesBottom(10,24,coords),980);
 const longCoords=coordinates(1,100);assert.equal(firstBalancedLinesBottom(1,25,longCoords),280);
});
test('continuations preserve the minimum and impossible page geometry falls back without looping',()=>{
 const block=paragraph(1,17,100),plan=planPageBreaks([block],geometry,coordinates(1,100));assert.deepEqual(plan.breaks.map(b=>b.pos),[41,76]); // 8+7+2
 assert.throws(()=>planPageBreaks([paragraph(1,3,100,400)],geometry,coordinates(1,100,400)),/two lines/);
 let calls=0;const measure=coordinates(1,100,20,100),bounded=p=>{calls++;return measure(p)};balanceLineBreak(1,100000,99901,bounded);assert.ok(calls<100);
});
async function preview(html,run){
 const dom=new JSDOM('<div id="pages"></div>'),saved={document:globalThis.document,DOMParser:globalThis.DOMParser};Object.assign(globalThis,{document:dom.window.document,DOMParser:dom.window.DOMParser});
 const height=el=>Math.ceil(el.textContent.length/10)*10;
 Object.defineProperties(dom.window.HTMLElement.prototype,{clientHeight:{configurable:true,get(){return 50}},scrollHeight:{configurable:true,get(){return this.classList.contains('preview-body')?[...this.children].reduce((n,e)=>n+height(e),0):0}},clientWidth:{configurable:true,get(){return 1000}},scrollWidth:{configurable:true,get(){return 0}}});
 dom.window.Range.prototype.getBoundingClientRect=function(){const parent=this.startContainer.parentElement,block=parent.closest('p,h1,h2,h3,h4,h5,h6'),walker=document.createTreeWalker(block,4);let offset=0,node;while((node=walker.nextNode())&&node!==this.startContainer)offset+=node.length;offset+=this.startOffset;const before=[...block.parentElement.children].slice(0,[...block.parentElement.children].indexOf(block)).reduce((n,e)=>n+height(e),0),top=before+Math.floor(offset/10)*10;return {top,bottom:top+10}};
 try{const root=document.getElementById('pages'),result=await paginateDocument(root,html,{});await run(root,result)}finally{Object.assign(globalThis,saved);dom.window.close()}
}
test('measured preview moves a short paragraph intact and retains Unicode/marks across balanced splits',async()=>{
 await preview('<p>'+'A'.repeat(30)+'</p><p>'+'B'.repeat(30)+'</p>',(root,r)=>{assert.equal(r.pages,2);assert.deepEqual([...root.querySelectorAll('.preview-body')].map(e=>e.textContent),['A'.repeat(30),'B'.repeat(30)]);assert.deepEqual(r.warnings,[])});
 const text='😀'.repeat(30);await preview('<p><strong>'+text+'</strong></p>',(root,r)=>{assert.equal(r.pages,2);assert.deepEqual([...root.querySelectorAll('.preview-body')].map(e=>e.textContent.length),[40,20]);assert.equal([...root.querySelectorAll('.preview-body')].map(e=>e.textContent).join(''),text);assert.equal(root.querySelectorAll('strong').length,2);assert.deepEqual(r.warnings,[])});
});
test('preview carries headings with a moved paragraph and suppresses orphaned one-line starts',async()=>{
 await preview('<p>'+'A'.repeat(30)+'</p><h2>Heading</h2><p>'+'B'.repeat(30)+'</p>',(root,r)=>{assert.equal(r.pages,2);assert.equal(root.querySelectorAll('.preview-body')[0].textContent,'A'.repeat(30));assert.equal(root.querySelectorAll('.preview-body')[1].textContent,'Heading'+'B'.repeat(30));assert.deepEqual(r.warnings,[])});
 await preview('<p>'+'A'.repeat(40)+'</p><p>'+'B'.repeat(40)+'</p>',(root,r)=>{assert.equal(r.pages,2);assert.deepEqual([...root.querySelectorAll('.preview-body')].map(e=>e.textContent),['A'.repeat(40),'B'.repeat(40)])});
});
test('DOM coordinate lookup handles nested marks and surrogate pairs without changing content',()=>{
 const dom=new JSDOM('<p>A<strong>😀B</strong>C</p>'),p=dom.window.document.querySelector('p'),seen=[];dom.window.Range.prototype.getBoundingClientRect=function(){seen.push(this.toString());return {top:0,bottom:10}};
 const measure=textCoordinates(p);assert.equal(measure.length,5);measure.coords(2);measure.coords(4);assert.deepEqual(seen,['😀','C']);assert.equal(p.textContent,'A😀BC');dom.window.close();
});
test('paragraph opt-out retains direct line splitting in live editing and preview',async()=>{
 const block={...paragraph(1,9,100),widowControl:false},plan=planPageBreaks([block],geometry,coordinates(1,100));assert.equal(plan.breaks[0].pos,41);
 await preview('<p data-widow-control="false">'+'B'.repeat(60)+'</p>',(root,r)=>{assert.equal(r.pages,2);assert.deepEqual([...root.querySelectorAll('.preview-body')].map(e=>e.textContent.length),[50,10]);assert.deepEqual(r.warnings,[])});
});
test('paragraph opt-out persists through sanitized HTML and native DOCX round trips',async()=>{
 const {getSchema}=await import('@tiptap/core'),{default:StarterKit}=await import('@tiptap/starter-kit'),{ParagraphDesign}=await import('../src/editor-extensions.mjs'),{DOMParser,DOMSerializer}=await import('@tiptap/pm/model'),{createSanitizer}=await import('../src/file-safety.mjs'),{default:createDOMPurify}=await import('dompurify'),{buildDocx}=await import('../src/docx-export.mjs'),{importDOCX}=await import('../src/docx-import.mjs'),{Packer}=await import('docx'),{unzipSync,strFromU8}=await import('fflate');
 const dom=new JSDOM(''),owner=dom.window.document,schema=getSchema([StarterKit,ParagraphDesign]),node=schema.node('doc',null,[schema.node('paragraph',{widowControl:false},schema.text('Allow isolated lines'))]),host=owner.createElement('div');host.append(DOMSerializer.fromSchema(schema).serializeFragment(node.content,{document:owner}));const sanitize=createSanitizer(createDOMPurify(dom.window));host.innerHTML=sanitize(host.innerHTML);assert.equal(DOMParser.fromSchema(schema).parse(host).firstChild.attrs.widowControl,false);
 const bytes=await Packer.toBuffer(buildDocx(node.toJSON(),{},'Pagination')),xml=strFromU8(unzipSync(bytes)['word/document.xml']);assert.match(xml,/<w:widowControl w:val="false"\/>/);const imported=await importDOCX(bytes,dom.window.DOMParser);host.innerHTML=sanitize(imported.html);const result=DOMParser.fromSchema(schema).parse(host);assert.equal(result.firstChild.attrs.widowControl,false);assert.equal(result.textContent,node.textContent);dom.window.close();
});
