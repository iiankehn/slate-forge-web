import test from 'node:test';
import assert from 'node:assert/strict';
import {rowSpanGroups} from '../src/table-pagination.mjs';
import {planPageBreaks,pageDecorations} from '../src/live-pagination.mjs';
import {JSDOM} from 'jsdom';
import {getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

test('table breaks never cross a vertically merged cell, including chained spans',()=>{
 assert.deepEqual(rowSpanGroups([[1,1],[2,1],[1],[1,3],[2],[1],[1,1]]),[{from:0,to:1},{from:1,to:3},{from:3,to:6},{from:6,to:7}]);
 assert.deepEqual(rowSpanGroups([[3],[3],[1],[1],[1]]),[{from:0,to:4},{from:4,to:5}]);
});
test('ordinary and horizontal-only rows remain independently pageable',()=>{
 assert.deepEqual(rowSpanGroups([[1],[1,1],[1]]),[{from:0,to:1},{from:1,to:2},{from:2,to:3}]);
 assert.deepEqual(rowSpanGroups([]),[]);
});
test('out-of-range spans cannot create phantom rows',()=>{
 assert.deepEqual(rowSpanGroups([[1000],[1]]),[{from:0,to:2}]);
 assert.deepEqual(rowSpanGroups([[0,-2,'bad'],[null]]),[{from:0,to:1},{from:1,to:2}]);
});
test('endnote gaps stay outside the document while contributing to the page count',()=>{
 const dom=new JSDOM('<section><ol><li>First note</li><li>Second note</li></ol></section>');
 const items=[...dom.window.document.querySelectorAll('li')];
 const plan=planPageBreaks([{type:'block',pos:0,top:100,bottom:850},{type:'block',pos:0,target:items[0],top:870,bottom:970},{type:'block',pos:0,target:items[1],top:990,bottom:1750}],{height:1000,margin:100},()=>{});
 assert.equal(plan.pages,3);assert.deepEqual(plan.breaks.map(b=>b.target),items);
 const schema=getSchema([StarterKit]),doc=schema.node('doc',null,[schema.node('paragraph')]);
 assert.equal(pageDecorations(doc,plan.breaks,dom.window.document).find().length,0);
 assert.equal(items[0].textContent,'First note');assert.equal(items[1].textContent,'Second note');dom.window.close();
});
