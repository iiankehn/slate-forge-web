import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {exportODT,importODTDocument} from '../src/odt.mjs';
import {normalizeScene,decodeScene} from '../src/design-model.mjs';
import {objectLinear,odtPoint,readOdtTransform} from '../src/odt-transforms.mjs';
const Parser=new JSDOM('').window.DOMParser,load=name=>new Uint8Array(readFileSync(new URL('./fixtures/odt-affine-pictures/'+name,import.meta.url))),raw=()=>new Uint8Array(readFileSync(new URL('../docs/fixtures/odt-affine-pictures/raw-input.odt',import.meta.url))),source=JSON.parse(new TextDecoder().decode(load('source.json')));
const NS={draw:'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',svg:'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',text:'urn:oasis:names:tc:opendocument:xmlns:text:1.0'};
const make=scenes=>exportODT({type:'doc',content:scenes.map(scene=>({type:'designCanvas',attrs:{scene}}))},{},'Affine pictures',new Map(),{nativeDesigns:true});
const read=bytes=>{const result=importODTDocument(bytes,Parser),dom=new Parser().parseFromString(result.html,'text/html');return {...result,scenes:[...dom.querySelectorAll('[data-forge-design]')].map(n=>decodeScene(n.getAttribute('data-forge-design')))}};
function point(o,u,v){const base=o.fit==='contain'?Math.min(o.width,o.height*o.aspectRatio):Math.max(o.width,o.height*o.aspectRatio),w=base*o.zoom/100,h=w/o.aspectRatio;let x=(o.width-w)*o.cropX/100+u*w,y=(o.height-h)*o.cropY/100+v*h;if(o.flipX)x=o.width-x;if(o.flipY)y=o.height-y;const p=odtPoint(objectLinear(o),x-o.width/2,y-o.height/2);return[o.x+o.width/2+p[0],o.y+o.height/2+p[1]]}
function compare(scenes){assert.equal(scenes.length,2);for(let s=0;s<2;s++){assert.equal(scenes[s].objects.length,8);for(let i=0;i<8;i++){const a=source[s].objects[i],b=scenes[s].objects[i];assert.equal(b.type,'image');assert.equal(b.src,a.src);assert.equal(b.opacity,a.opacity);for(const u of [0,.25,.5,.75,1])for(const v of [0,.25,.5,.75,1]){const p=point(a,u,v),q=point(b,u,v);assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<.3,`picture ${s}:${i} source (${u},${v}) moved`)}}assert.ok(scenes[s].objects[0].group);assert.equal(scenes[s].objects[0].group,scenes[s].objects[1].group)}}
function edit(bytes,fn){const files=unzipSync(bytes),xml=new Parser().parseFromString(strFromU8(files['content.xml']),'application/xml');fn(xml,[...xml.getElementsByTagNameNS(NS.draw,'frame')]);files['content.xml']=strToU8(xml.documentElement.outerHTML);return zipSync(files)}

test('affine matrix parsing is explicitly picture-only and retains measured units, signs and finite scale bounds',()=>{
 const text='matrix(1.3 0 .2 .75 1in 2.54cm)';assert.throws(()=>readOdtTransform(text),/native ODT transform/);assert.deepEqual(readOdtTransform(text,{pictureAffine:true}),[1.3,0,.2,.75,72,72]);assert.deepEqual(readOdtTransform('matrix(-1.3 0 .2 .75 0 -0.0)',{pictureAffine:true}),[-1.3,0,.2,.75,0,0]);
 for(const m of ['matrix(0 0 0 1 0 0)','matrix(1 2 2 4 0 0)','matrix(.001 0 0 1 0 0)','matrix(1000 0 0 1 0 0)','matrix(1 0 0 .001 0 0)','matrix(NaN 0 0 1 0 0)','matrix(1e100 0 0 1 0 0)','matrix(1.3 0 .2 .75 1 0)','matrix(1.3 0 .2 .75 1px 0)','matrix(1.3 0 .2 .75 1mm 2mm) rotate(0)','matrix(1.3 0 .2 .75 1mm 2mm) trailing'])assert.throws(()=>readOdtTransform(m,{pictureAffine:true}),/native ODT transform/);
 assert.throws(()=>readOdtTransform('scale(2 1)',{pictureAffine:true}),/native ODT transform/);
});

test('raw affine pictures preserve 400 known source points, payloads and grouping through normalized native exports',()=>{
 const bytes=raw(),files=unzipSync(bytes),header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);assert.equal(header.getUint16(8,true),0);assert.equal(new TextDecoder().decode(bytes.subarray(30,30+header.getUint16(26,true))),'mimetype');assert.equal((strFromU8(files['content.xml']).match(/matrix\(/g)||[]).length,16);let scenes=read(bytes).scenes;compare(scenes);
 for(let i=0;i<3;i++){const next=make(scenes),parts=unzipSync(next);assert.ok(!strFromU8(parts['content.xml']).includes('matrix('));assert.ok(!Object.keys(parts).some(n=>n.startsWith('SlateForge/')));assert.equal(Object.keys(parts).filter(n=>n.startsWith('Pictures/')).length,3);scenes=read(next).scenes;compare(scenes)}
});

test('actual isolated Writer resaves of raw matrices and native controls retain source geometry, alpha, crop and image bytes',()=>{
 for(const name of ['raw-writer-resaved.odt','control-writer-resaved.odt']){const bytes=load(name),scenes=read(bytes).scenes;compare(scenes);compare(read(make(scenes)).scenes);const parts=unzipSync(bytes),pictures=Object.keys(parts).filter(n=>n.startsWith('Pictures/'));assert.equal(pictures.length,3);for(const src of new Set(source.flatMap(s=>s.objects.map(o=>o.src))))assert.ok(pictures.some(n=>Buffer.from(parts[n]).equals(Buffer.from(src.split(',')[1],'base64'))))}
});

test('nonuniform matrix support cannot bypass text, shape, stroke, group or mixed-content picture restrictions',()=>{
 for(const type of ['rect','text','line']){const scene=normalizeScene({objects:[{type,x:200,y:200,width:140,height:100,text:'Editable text',fontSize:22,fill:'#337755',stroke:'#112233',strokeWidth:2}]}),bytes=make([scene]);assert.throws(()=>read(edit(bytes,xml=>{const group=xml.getElementsByTagNameNS(NS.draw,'g')[0],node=[...group.children].filter(n=>n.namespaceURI===NS.draw)[1];node.removeAttributeNS(NS.svg,'x');node.removeAttributeNS(NS.svg,'y');node.setAttributeNS(NS.draw,'draw:transform','matrix(1.3 0 .2 .75 30mm 40mm)')})),/native ODT transform/)}
 assert.throws(()=>read(edit(raw(),xml=>xml.getElementsByTagNameNS(NS.draw,'g')[1].setAttributeNS(NS.draw,'draw:transform','matrix(1.3 0 .2 .75 0 0)'))),/native ODT canvas/);
 assert.throws(()=>read(edit(raw(),(xml,frames)=>{const box=xml.createElementNS(NS.draw,'draw:text-box'),p=xml.createElementNS(NS.text,'text:p');p.textContent='Visible mixed content';box.append(p);frames[0].append(box)})),/native ODT picture/);
});

test('current affine translations replace source positions while malformed, excessive, degenerate and out-of-canvas edits refuse',()=>{
 const changed=edit(raw(),(xml,frames)=>{const m=readOdtTransform(frames[0].getAttributeNS(NS.draw,'transform'),{pictureAffine:true});m[4]+=72/25.4;frames[0].setAttributeNS(NS.draw,'draw:transform','matrix('+m.slice(0,4).join(' ')+' '+m[4]+'pt '+m[5]+'pt)')}),scenes=read(changed).scenes;
 for(const[u,v]of [[0,0],[.5,.5],[1,1]]){const a=point(source[0].objects[0],u,v),b=point(scenes[0].objects[0],u,v);assert.ok(Math.abs(b[0]-a[0]-5.625)<.3);assert.ok(Math.abs(b[1]-a[1])<.3)}const again=read(make(scenes)).scenes;assert.ok(Math.hypot(...point(again[0].objects[0],.5,.5).map((v,i)=>v-point(scenes[0].objects[0],.5,.5)[i]))<.3);
 for(const matrix of ['matrix(1 0 100 1 30mm 30mm)','matrix(1 0 0 1 1000000mm 0mm)','matrix(0 0 0 0 0 0)','matrix(1 0 0 1 -100mm -100mm)','matrix(1 0 0 1 1 2)','matrix(1 0 0 1 0 0)'.repeat(100)])assert.throws(()=>read(edit(raw(),(xml,frames)=>frames[0].setAttributeNS(NS.draw,'draw:transform',matrix))),/native ODT transform|native ODT picture|native ODT canvas/);
});

test('vertical mirror imports warn and normalize before Writer exchange; invalid batched controls stay rejected',()=>{
 const input=new Uint8Array(readFileSync(new URL('../docs/fixtures/odt-affine-pictures/vertical-mirror-input.odt',import.meta.url))),result=read(input);compare(result.scenes);assert.ok(result.warnings.some(w=>w.includes('vertical mirror')));const normalized=make(result.scenes),xml=strFromU8(unzipSync(normalized)['content.xml']);assert.ok(!xml.includes('matrix('));assert.ok(!/style:mirror="[^"]*vertical/.test(xml));const reopened=read(normalized);compare(reopened.scenes);assert.ok(!reopened.warnings.some(w=>w.includes('vertical mirror')));compare(read(load('normalized-mirror-writer-resaved.odt')).scenes);
 const changed=read(load('vertical-mirror-writer-resaved.odt')).scenes;assert.ok(Math.hypot(...point(changed[1].objects[4],1,1).map((v,i)=>v-point(source[1].objects[4],1,1)[i]))>100,'the retained Writer mirror-loss control must remain a failure');
 assert.throws(()=>read(load('failed-batch-control-resaved.odt')),/native ODT transform|native ODT picture|native ODT canvas/);
});
