import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {paginateDocument} from '../src/pagination.mjs';

// Deterministic capacity exercises page flow without pretending JSDOM renders fonts.
async function withCapacity(html,check){
 const dom=new JSDOM('<div id="pages"></div>'),saved={document:globalThis.document,DOMParser:globalThis.DOMParser};
 Object.assign(globalThis,{document:dom.window.document,DOMParser:dom.window.DOMParser});
 Object.defineProperties(dom.window.HTMLElement.prototype,{
  clientHeight:{configurable:true,get(){return 200}},
  scrollHeight:{configurable:true,get(){return this.classList.contains('preview-body')?this.textContent.length:0}},
  clientWidth:{configurable:true,get(){return 1000}},scrollWidth:{configurable:true,get(){return 0}}
 });
 try{const root=document.getElementById('pages'),result=await paginateDocument(root,html,{});await check(root,result)}finally{Object.assign(globalThis,saved);dom.window.close()}
}

test('preview retains one anchor per endnote and continues numbering across fragments',async()=>{
 const notes=Array.from({length:10},(_,i)=>'<li id="sf-note-'+(i+1)+'">'+('Note '+(i+1)+' ').padEnd(80,'x')+'</li>').join('');
 await withCapacity('<section class="forge-footnotes"><h2>Notes</h2><ol>'+notes+'</ol></section>',(root,result)=>{
  assert.equal(result.pages,5);assert.deepEqual(result.warnings,[]);
  assert.deepEqual([...root.querySelectorAll('li')].map(el=>el.dataset.sourceId),Array.from({length:10},(_,i)=>'sf-note-'+(i+1)));
  assert.deepEqual([...root.querySelectorAll('ol')].map(el=>el.start),[1,3,5,7,9]);
 });
});
test('preview keeps a vertically merged group intact instead of scaling the whole table',async()=>{
 const rows=Array.from({length:3},(_,i)=>'<tr><td rowspan="2">Group '+i+'</td><td id="row-'+i+'-a">'+('A'+i).padEnd(70,'x')+'</td></tr><tr><td id="row-'+i+'-b">'+('B'+i).padEnd(70,'x')+'</td></tr>').join('');
 await withCapacity('<table><tr><th>Group</th><th>Value</th></tr>'+rows+'</table>',(root,result)=>{
  assert.equal(result.pages,3);assert.deepEqual(result.warnings,[]);
  assert.equal(root.querySelectorAll('td[rowspan="2"]').length,3);
  assert.equal(root.querySelectorAll('.preview-scaled-block').length,0);
  for(let i=0;i<3;i++){const a=root.querySelector('[data-source-id="row-'+i+'-a"]'),b=root.querySelector('[data-source-id="row-'+i+'-b"]');assert.equal(a.closest('.preview-page'),b.closest('.preview-page'))}
 });
});

test('preview carries consecutive trailing headings when no following text fits',async()=>{
 const filler='F'.repeat(192),html='<p>'+filler+'</p><h2>Title</h2><h3>Topic</h3><p>Following text remains complete.</p>';
 await withCapacity(html,(root,result)=>{
  assert.equal(result.pages,2);assert.deepEqual(result.warnings,[]);
  const bodies=[...root.querySelectorAll('.preview-body')];assert.equal(bodies[0].querySelectorAll('h2,h3').length,0);assert.equal(bodies[1].querySelectorAll('h2,h3').length,2);assert.equal(bodies[1].lastElementChild.textContent,'Following text remains complete.');
 });
});
test('preview carries headings with a table first row and note first item',async()=>{
 for(const following of ['<table><tr><td>'+'R'.repeat(80)+'</td></tr></table>','<section class="forge-footnotes"><h2>Notes</h2><ol><li id="sf-note-1">'+'N'.repeat(80)+'</li></ol></section>'])await withCapacity('<p>'+'F'.repeat(190)+'</p><h2>Title</h2>'+following,(root,result)=>{
  assert.equal(result.pages,2);assert.deepEqual(result.warnings,[]);assert.equal(root.querySelectorAll('.preview-body')[1].firstElementChild.textContent,'Title');
 });
});
test('preview respects an explicit break after a heading',async()=>{
 await withCapacity('<h2>Title</h2><div data-page-break="true"></div><p>Following</p>',(root,result)=>{
  assert.equal(result.pages,2);const bodies=[...root.querySelectorAll('.preview-body')];assert.equal(bodies[0].textContent,'Title');assert.equal(bodies[1].textContent,'Following');
 });
});
