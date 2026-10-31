import test from 'node:test';
import assert from 'node:assert/strict';
import {planPageBreaks} from '../src/live-pagination.mjs';
import {buildDocx} from '../src/docx-export.mjs';
import {Packer} from 'docx';
import JSZip from 'jszip';
import {JSDOM} from 'jsdom';
const geometry={height:1000,margin:100};
const heading=(from,top,bottom)=>({type:'text',heading:true,textblock:true,pos:from-1,from,to:from+3,top,bottom});
const paragraph=(from,top,bottom)=>({type:'text',textblock:true,pos:from-1,from,to:from+4,top,bottom});

test('a heading moves when its following paragraph cannot contribute a line',()=>{
 const blocks=[heading(10,820,880),paragraph(20,890,1190)],coords=pos=>pos<20?{top:820,bottom:880}:{top:890,bottom:930};
 const plan=planPageBreaks(blocks,geometry,coords);assert.equal(plan.pages,2);assert.equal(plan.breaks.length,1);assert.equal(plan.breaks[0].pos,10);assert.equal(plan.breaks[0].height,308);
});
test('consecutive headings stay together without keeping a whole long paragraph',()=>{
 const blocks=[heading(1,760,810),heading(10,820,870),paragraph(20,880,1100)],coords=pos=>pos<10?{top:760,bottom:810}:pos<20?{top:820,bottom:870}:{top:880,bottom:920};
 const plan=planPageBreaks(blocks,geometry,coords);assert.equal(plan.breaks.length,1);assert.equal(plan.breaks[0].pos,1);
 const fit=planPageBreaks([heading(1,700,750),paragraph(20,760,880)],geometry,()=>({top:760,bottom:790}));assert.equal(fit.breaks.length,0);
});
test('explicit breaks override heading keep and impossible heading groups fall back',()=>{
 const plan=planPageBreaks([heading(1,800,860),{type:'pageBreak',pos:10,top:890,bottom:890},paragraph(20,900,1000)],geometry,()=>({top:800,bottom:860}));assert.equal(plan.breaks.length,1);assert.equal(plan.breaks[0].pos,10);
 assert.throws(()=>planPageBreaks([heading(1,100,800),paragraph(20,900,1000)],geometry,()=>({top:100,bottom:950})),/heading group is too tall/);
 assert.equal(planPageBreaks([heading(1,800,860)],geometry,()=>({top:800,bottom:860})).breaks.length,0);
});
test('DOCX retains native keep-with-next for headings and widow control for body text',async()=>{
 const content={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Heading'}]},{type:'paragraph',content:[{type:'text',text:'Following paragraph'}]}]};
 const zip=await JSZip.loadAsync(await Packer.toBuffer(buildDocx(content,{},'Heading check'))),xml=await zip.file('word/document.xml').async('string'),dom=new JSDOM(xml,{contentType:'text/xml'}),paras=[...dom.window.document.getElementsByTagName('w:p')];
 assert.equal(paras[0].getElementsByTagName('w:keepNext').length,1);assert.equal(paras[1].getElementsByTagName('w:widowControl').length,1);dom.window.close();
});
