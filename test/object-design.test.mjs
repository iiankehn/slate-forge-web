import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import createDOMPurify from 'dompurify';
import {generateHTML,generateJSON,getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TableKit} from '@tiptap/extension-table';
import {DesignedImage,TableDesign,normalizeImageDesign,normalizeTableDesign} from '../src/object-design.mjs';
import {createSanitizer} from '../src/file-safety.mjs';
import {buildDocx} from '../src/docx-export.mjs';
import {Packer} from 'docx';
import JSZip from 'jszip';
const window=new JSDOM('').window;
// Tiptap's HTML serializers use the platform DOM in their documented browser API.
globalThis.window=window;globalThis.document=window.document;
const extensions=[StarterKit,DesignedImage.configure({allowBase64:true}),TableKit,TableDesign];
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=';
const p=text=>({type:'paragraph',content:[{type:'text',text}]});
const fixture={type:'doc',content:[{type:'image',attrs:{src:pixel,alt:'Test pixel',imageWidth:50,imageAlign:'right',imageWrap:'left'}},{type:'table',attrs:{tableStyle:'striped',tablePalette:'warm',tableDensity:'spacious'},content:[{type:'tableRow',content:[{type:'tableHeader',content:[p('Heading')]}]},{type:'tableRow',content:[{type:'tableCell',content:[p('Data')]}]}]}]};
test('object design settings normalize unsupported or hostile values',()=>{
 assert.deepEqual(normalizeImageDesign({imageWidth:900,imageAlign:'url(evil)'}),{imageShape:'rectangle',imageGap:18,imageWidth:100,imageAlign:'left',imageWrap:'none'});
 assert.deepEqual(normalizeTableDesign({tableStyle:'evil',tablePalette:'__proto__',tableDensity:'999'}),{tableStyle:'grid',tablePalette:'sage',tableDensity:'comfortable'});
});
test('image and table settings survive sanitized HTML round trips',()=>{
 let html=generateHTML(fixture,extensions);let clean=createSanitizer(createDOMPurify(window))(html);let restored=generateJSON(clean,extensions);
 let image=restored.content.find(n=>n.type==='image'),table=restored.content.find(n=>n.type==='table');
 assert.equal(image.attrs.imageWidth,50);assert.equal(image.attrs.imageAlign,'right');assert.equal(image.attrs.imageWrap,'left');assert.equal(image.attrs.alt,'Test pixel');
 assert.equal(table.attrs.tableStyle,'striped');assert.equal(table.attrs.tablePalette,'warm');assert.equal(table.attrs.tableDensity,'spacious');
 getSchema(extensions).nodeFromJSON(restored).check();
});
test('DOCX exports image alignment, page-relative size, table colors, stripes and spacing',async()=>{
 const map=new Map([[pixel,{type:'png',data:Buffer.from(pixel.split(',')[1],'base64'),width:200,height:100}]]);
 const archive=await JSZip.loadAsync(await Packer.toBuffer(buildDocx(fixture,{size:'A4',margin:22},'Design',map)));
 const xml=await archive.file('word/document.xml').async('string');
 assert.match(xml,/w:jc w:val="right"/);assert.match(xml,/cx="2988000" cy="1494000"/); // 166 mm usable width, half width at 2:1 aspect ratio.
 assert.match(xml,/w:fill="FBF2DF"/);assert.match(xml,/w:fill="FCF8EE"/);assert.match(xml,/w:color w:val="956B32"/);assert.match(xml,/w:top w:type="dxa" w:w="180"/);assert.match(xml,/<w:tblHeader/);
});

test('image text-flow gap is bounded and survives sanitized HTML and DOCX anchors',async()=>{assert.equal(normalizeImageDesign({imageGap:999}).imageGap,48);assert.equal(normalizeImageDesign({imageGap:-4}).imageGap,0);const json={type:'doc',content:[{type:'image',attrs:{src:pixel,alt:'Gap check',imageWidth:40,imageWrap:'left',imageGap:32}}]},html=generateHTML(json,extensions),clean=createSanitizer(createDOMPurify(window))(html),restored=generateJSON(clean,extensions);assert.equal(restored.content[0].attrs.imageGap,32);const images=new Map([[pixel,{type:'png',data:new Uint8Array([1,2,3]),width:100,height:80}]]),zip=await JSZip.loadAsync(await Packer.toBuffer(buildDocx(json,{},'Gap',images))),xml=await zip.file('word/document.xml').async('string');assert.match(xml,/distL="304800"/);assert.match(xml,/distR="304800"/)});

test('image shape and contour preferences survive sanitized HTML round trips',()=>{for(const imageShape of ['ellipse','diamond']){const content={type:'doc',content:[{type:'image',attrs:{src:pixel,imageShape,imageWrap:'left',imageWidth:40,imageGap:24}}]},clean=createSanitizer(createDOMPurify(window))(generateHTML(content,extensions)),restored=generateJSON(clean,extensions).content[0];assert.equal(restored.attrs.imageShape,imageShape);assert.equal(restored.attrs.imageGap,24);assert.equal(restored.attrs.imageWrap,'left')}assert.equal(normalizeImageDesign({imageShape:'url(evil)'}).imageShape,'rectangle')});
