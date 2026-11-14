import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {exportODT,importODTDocument} from '../src/odt.mjs';
import {decodeScene,normalizeScene} from '../src/design-model.mjs';
import {objectLinear,odtPoint,validateNativeBox} from '../src/odt-transforms.mjs';
const Parser=new JSDOM('').window.DOMParser,load=name=>new Uint8Array(readFileSync(new URL('./fixtures/odt-thin-pictures/'+name,import.meta.url))),source=JSON.parse(new TextDecoder().decode(load('source.json')));
const make=scenes=>exportODT({type:'doc',content:scenes.map(scene=>({type:'designCanvas',attrs:{scene}}))},{},'Thin pictures',new Map(),{nativeDesigns:true});
const read=bytes=>{const result=importODTDocument(bytes,Parser),dom=new Parser().parseFromString(result.html,'text/html');return [...dom.querySelectorAll('[data-forge-design]')].map(n=>decodeScene(n.getAttribute('data-forge-design')))};
function point(o,u,v){const base=o.fit==='contain'?Math.min(o.width,o.height*o.aspectRatio):Math.max(o.width,o.height*o.aspectRatio),w=base*o.zoom/100,h=w/o.aspectRatio;let x=(o.width-w)*o.cropX/100+u*w,y=(o.height-h)*o.cropY/100+v*h;if(o.flipX)x=o.width-x;if(o.flipY)y=o.height-y;const p=odtPoint(objectLinear(o),x-o.width/2,y-o.height/2);return [o.x+o.width/2+p[0],o.y+o.height/2+p[1]]}
function compare(scenes){assert.equal(scenes.length,2);for(let s=0;s<2;s++){assert.equal(scenes[s].objects.length,8);for(let i=0;i<8;i++){const a=source[s].objects[i],b=scenes[s].objects[i];assert.equal(b.type,'image');assert.equal(b.src,a.src);assert.equal(b.opacity,a.opacity);assert.ok(b.width>=20&&b.height>=20);for(const u of [0,.25,.5,.75,1])for(const v of [0,.25,.5,.75,1]){const p=point(a,u,v),q=point(b,u,v);assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<.3,`picture ${s}:${i} source (${u},${v}) moved`)}}}assert.ok(scenes[0].objects[0].group);assert.equal(scenes[0].objects[0].group,scenes[0].objects[1].group)}
const NS={draw:'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',svg:'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',style:'urn:oasis:names:tc:opendocument:xmlns:style:1.0'};
function edit(fn){const files=unzipSync(make(source)),xml=new Parser().parseFromString(strFromU8(files['content.xml']),'application/xml');fn(xml);files['content.xml']=strToU8(xml.documentElement.outerHTML);return zipSync(files)}

test('thin rotated/skewed/reflected pictures retain 400 source points, opacity and opaque groups across native reopenings',()=>{
 const before=JSON.stringify(source),bytes=make(source),files=unzipSync(bytes);assert.equal(Object.keys(files).filter(n=>n.startsWith('Pictures/')).length,2);assert.ok(!Object.keys(files).some(n=>n.startsWith('SlateForge/')));
 let scenes=read(bytes);for(let i=0;i<3;i++){compare(scenes);scenes=read(make(scenes))}compare(scenes);assert.equal(JSON.stringify(source),before);
});

test('actual Writer resave preserves all thin-picture source points and original PNG bytes through another export',()=>{
 const bytes=load('writer-resaved.odt'),scenes=read(bytes);compare(scenes);compare(read(make(scenes)));const files=unzipSync(bytes),images=Object.keys(files).filter(n=>n.startsWith('Pictures/'));assert.equal(images.length,2);for(const src of new Set(source.flatMap(s=>s.objects.map(o=>o.src))))assert.ok(images.some(n=>Buffer.from(files[n]).equals(Buffer.from(src.split(',')[1],'base64'))));
});

test('one-unit transformed frames remain refused after actual rendering loss; model and canvas bounds stay enforced',()=>{
 assert.throws(()=>read(load('failed-one-unit-resaved.odt')),/at least 2 canvas units/);
 const tiny={...source[0].objects[2],width:20,height:20,group:undefined};assert.throws(()=>make([normalizeScene({objects:[tiny]})]),/native ODT transform/);
 const plain={...tiny,rotation:0,skewX:0,flipX:false,flipY:false};assert.equal(read(make([normalizeScene({objects:[plain]})]))[0].objects.length,1);
 assert.throws(()=>make([normalizeScene({objects:[{...source[0].objects[2],group:undefined,x:0,rotation:45,skewX:0,cropY:100,flipY:false}]})]),/native ODT transform/);
 assert.throws(()=>validateNativeBox({x:100,y:100,width:2,height:100},1000),/native ODT transform/);
 assert.throws(()=>read(edit(xml=>xml.getElementsByTagNameNS(NS.draw,'frame')[1].setAttributeNS(NS.svg,'svg:width','0.1mm'))),/at least 2 canvas units/);
});

test('external current thin-picture geometry, mirroring and opacity replace exported state without private originals',()=>{
 const bytes=edit(xml=>{const frame=xml.getElementsByTagNameNS(NS.draw,'frame')[2],name=frame.getAttributeNS(NS.draw,'style-name'),style=[...xml.getElementsByTagNameNS(NS.style,'style')].find(n=>n.getAttributeNS(NS.style,'name')===name).firstElementChild;frame.removeAttributeNS(NS.svg,'x');frame.removeAttributeNS(NS.svg,'y');frame.setAttributeNS(NS.draw,'draw:transform','rotate(0) translate(40mm 40mm)');style.setAttributeNS(NS.style,'style:mirror','none');style.setAttributeNS(NS.draw,'draw:image-opacity','35%')});
 const scenes=read(bytes),o=scenes[0].objects[2];assert.equal(o.opacity,35);assert.equal(o.flipX,false);assert.equal(o.flipY,false);const p=point(o,0,0);assert.ok(Math.abs(p[0]-225)<.1&&Math.abs(p[1]-225)<.1);const again=read(make(scenes))[0].objects[2],q=point(again,0,0);assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<.3);assert.equal(again.opacity,35);
});
