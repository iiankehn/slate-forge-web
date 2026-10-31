import test from 'node:test';
import assert from 'node:assert/strict';
import {groupWrappedBlocks,planPageBreaks,wrappedGroupFits,PAGE_GAP} from '../src/live-pagination.mjs';
const geometry={height:1000,margin:100};
const image=(pos,top,bottom)=>({type:'block',pos,top,bottom,flowBottom:bottom+10,wrapped:true});
const text=(pos,top,bottom)=>({type:'text',pos,top,bottom,textblock:true,from:pos+1,to:pos+20});

test('a float keeps the entire overlapping paragraph together without consuming later text',()=>{
 const blocks=[text(0,100,200),image(21,230,430),text(22,224,500),text(44,520,600)];
 const source=structuredClone(blocks),groups=groupWrappedBlocks(blocks);
 assert.equal(groups.length,3);assert.equal(groups[1].type,'wrapGroup');assert.equal(groups[1].pos,21);
 assert.equal(groups[1].top,224);assert.equal(groups[1].bottom,500);
 assert.deepEqual(groups[1].members,[blocks[1],blocks[2]]);assert.deepEqual(blocks,source);
});
test('multiple overlapping floats and their bottom margins form one connected flow',()=>{
 const blocks=[image(0,100,400),text(1,100,200),image(23,220,550),text(24,210,300),text(46,540,600),text(68,620,700)];
 const groups=groupWrappedBlocks(blocks);assert.equal(groups.length,2);assert.equal(groups[0].members.length,5);assert.equal(groups[0].bottom,600);
});
test('wrapped text moves as a whole and oversized groups retain a clear fallback',()=>{
 const blocks=[{type:'block',pos:0,top:100,bottom:650},image(1,690,850),text(2,684,1000)];
 const plan=planPageBreaks(groupWrappedBlocks(blocks),geometry,()=>{throw Error('A grouped paragraph must not be split')});
 assert.equal(plan.pages,2);assert.equal(plan.breaks[0].pos,1);assert.equal(plan.breaks[0].height,1000+PAGE_GAP+100-684);
 assert.throws(()=>planPageBreaks(groupWrappedBlocks([image(0,100,300),text(1,100,1100)]),geometry,()=>{}),/surrounding text are taller/);
});
test('an explicit break cannot be inserted through a wrapped flow',()=>{
 assert.throws(()=>groupWrappedBlocks([image(0,100,400),{type:'pageBreak',pos:1,top:250,bottom:250}]),/crosses an explicit page break/);
 assert.equal(groupWrappedBlocks([image(0,100,400),{type:'pageBreak',pos:1,top:450,bottom:450}]).length,2);
});
test('rendered group validation rejects page margins and gutters on any page',()=>{
 assert.equal(wrappedGroupFits(100,900,geometry),true);
 assert.equal(wrappedGroupFits(1128,1800,geometry),true);
 assert.equal(wrappedGroupFits(95,300,geometry),false);
 assert.equal(wrappedGroupFits(800,1200,geometry),false);
 assert.equal(wrappedGroupFits(1000,1050,geometry),false);
 assert.equal(wrappedGroupFits(NaN,300,geometry),false);
});

test('adjacent blocks after a float ends remain independently pageable',()=>{
 const blocks=[image(0,100,300),text(1,100,500),text(23,500,900)];
 const groups=groupWrappedBlocks(blocks);assert.equal(groups.length,2);assert.equal(groups[0].members.length,2);assert.equal(groups[1],blocks[2]);
 assert.throws(()=>groupWrappedBlocks([image(0,100,300),{type:'row',pos:1,top:150,bottom:200}]),/beside tables/);
});
