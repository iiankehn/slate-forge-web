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

function longWrapped({imageTop=100,imageBottom=300,lineTop=100,lines=100,attrs={}}={}){
 const from=2,to=from+lines*10-1,paragraph={type:'text',pos:1,from,to,textblock:true,top:lineTop,bottom:lineTop+lines*20,...attrs};
 const coords=pos=>{const top=lineTop+Math.floor((pos-from)/10)*20;return {top,bottom:top+20}};
 return {blocks:[image(0,imageTop,imageBottom),paragraph],coords};
}
test('a long wrapped paragraph paginates after its float ends without altering source positions',()=>{
 const {blocks,coords}=longWrapped(),snapshot=structuredClone(blocks),groups=groupWrappedBlocks(blocks,coords);
 assert.equal(groups.length,2);const prefix=groups[0].members[1],tail=groups[1];assert.ok(prefix.measuredText);assert.equal(tail.from,prefix.to+1);assert.equal(prefix.from,blocks[1].from);assert.equal(tail.to,blocks[1].to);assert.ok(tail.top>=blocks[0].flowBottom);
 const plan=planPageBreaks(groups,geometry,coords);assert.equal(plan.pages,3);assert.ok(plan.breaks.every(item=>item.pos>=tail.from));assert.deepEqual(blocks,snapshot);
});
test('a wrapped prefix moves intact before the full-width tail paginates',()=>{
 const {blocks,coords}=longWrapped({imageTop:700,imageBottom:950,lineTop:700}),groups=groupWrappedBlocks([{type:'block',pos:0,top:100,bottom:680},...blocks],coords),plan=planPageBreaks(groups,geometry,coords);
 assert.equal(plan.breaks[0].kind,'block');assert.equal(plan.breaks[0].pos,0);assert.ok(plan.breaks.slice(1).every(item=>item.pos>=groups[2].from));
});
test('wrapped paragraph split honors keep rules and does not strand a single trailing line',()=>{
 for(const attrs of [{keepTogether:true},{keepWithNext:true},{pageBreakBefore:true},{heading:true}]){const {blocks,coords}=longWrapped({attrs});assert.equal(groupWrappedBlocks(blocks,coords).length,1)}
 const {blocks,coords}=longWrapped({lines:12});assert.equal(groupWrappedBlocks(blocks,coords).length,1);
 const optedOut=longWrapped({lines:12,attrs:{widowControl:false}});assert.equal(groupWrappedBlocks(optedOut.blocks,optedOut.coords).length,2);
 const shortFloat=longWrapped({imageBottom:110});assert.ok(groupWrappedBlocks(shortFloat.blocks,shortFloat.coords)[0].members[1].to>=shortFloat.blocks[1].from+19);
});
