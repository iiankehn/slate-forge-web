import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {crc32} from 'node:zlib';
import {JSDOM} from 'jsdom';
import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {nativePictureInfo,odtPictureAssets} from '../src/odt-pictures.mjs';
import {exportODT,importODTDocument} from '../src/odt.mjs';
import {prepareOdtNativePictures} from '../src/odt-picture-preparation.mjs';
import {normalizeScene,decodeScene} from '../src/design-model.mjs';
const Parser=new JSDOM('').window.DOMParser;
const load=name=>new Uint8Array(readFileSync(new URL('./fixtures/odt-static-pictures/'+name,import.meta.url)));
const source=JSON.parse(new TextDecoder().decode(load('source.json')));
const prepared=new Map(source.objects.filter(o=>o.src.startsWith('data:image/webp')).map((o,i)=>[o.src,{data:load(['lossy','lossless','alpha','alpha-lossless'][i]+'-prepared.png')}]));
const make=scene=>exportODT({type:'doc',content:[{type:'designCanvas',attrs:{scene}}]}, {},'',prepared,{nativeDesigns:true});
const read=bytes=>{const result=importODTDocument(bytes,Parser),dom=new Parser().parseFromString(result.html,'text/html');return decodeScene(dom.querySelector('[data-forge-design]').getAttribute('data-forge-design'))};
const near=(a,b)=>assert.ok(Math.abs(a-b)<.3,`${a} ~= ${b}`);
function compare(scene){assert.equal(scene.objects.length,6);for(let i=0;i<6;i++){const a=source.objects[i],b=scene.objects[i];assert.equal(b.type,'image');for(const k of ['x','y','width','height','rotation','zoom','cropX','cropY','opacity'])near(a[k],b[k]);assert.equal(a.flipX,b.flipX);assert.equal(!!a.group,!!b.group)}assert.equal(scene.objects[0].group,scene.objects[1].group)}
const rejects=bytes=>assert.throws(()=>nativePictureInfo(bytes),/native ODT picture/);
const edit=(data,fn)=>{const b=data.slice();fn(b,new DataView(b.buffer));return b};
const chunk=(kind,payload)=>{const b=new Uint8Array(8+payload.length+(payload.length&1));b.set(new TextEncoder().encode(kind));new DataView(b.buffer).setUint32(4,payload.length,true);b.set(payload,8);return b};
const riff=chunks=>{const size=chunks.reduce((sum,c)=>sum+c.length,12),b=new Uint8Array(size);b.set(new TextEncoder().encode('RIFF'));new DataView(b.buffer).setUint32(4,size-8,true);b.set(new TextEncoder().encode('WEBP'),8);let at=12;for(const c of chunks){b.set(c,at);at+=c.length}return b};

test('static GIF and lossy/lossless/alpha WebP retain dimensions, pixels, MIME and native editable placement',()=>{
 const files={},assets=odtPictureAssets(files,prepared);for(const o of source.objects){const data=Uint8Array.from(Buffer.from(o.src.split(',')[1],'base64')),original=nativePictureInfo(data),info=assets.add(o.src);assert.equal(info.width,300);assert.equal(info.height,200);assert.equal(info.preferredWidth,225);assert.equal(info.preferredHeight,150);assert.equal(info.mime,original.type==='webp'?'image/png':'image/gif');assert.deepEqual(files[info.path],original.type==='webp'?prepared.get(o.src).data:data)}assert.equal(assets.entries.length,6);
 const result=make(source),parts=unzipSync(result),manifest=strFromU8(parts['META-INF/manifest.xml']);assert.match(manifest,/image\/png/);assert.match(manifest,/image\/gif/);assert.ok(!Object.keys(parts).some(p=>p.endsWith('.webp')||p.startsWith('SlateForge/')));assert.equal(Object.keys(parts).filter(p=>p.startsWith('Pictures/')).length,6);compare(read(result));compare(read(make(read(result))));
});

test('actual Writer resave retains GIF and decoded WebP pictures with current crop, alpha, mirror, rotation and groups',()=>{
 const bytes=load('writer-resaved.odt'),files=unzipSync(bytes),scene=read(bytes);compare(scene);const pictures=Object.keys(files).filter(p=>p.startsWith('Pictures/'));assert.equal(pictures.length,5); // Writer deduplicates the two identical decoded alpha pictures.
 for(let i=0;i<6;i++){const o=scene.objects[i],mime=i<4?'image/png':'image/gif';assert.ok(o.src.startsWith('data:'+mime+';base64,'));const b=Uint8Array.from(Buffer.from(o.src.split(',')[1],'base64'));assert.ok(pictures.some(p=>Buffer.from(files[p]).equals(Buffer.from(b))));if(i>=4)assert.equal(o.src,source.objects[i].src)}compare(read(make(scene)));
});

test('WebP refuses animation, metadata, malformed RIFF/chunks, inconsistent canvas, alpha and oversized dimensions',()=>{
 rejects(load('animated.webp'));const lossy=load('lossy.webp'),alpha=load('alpha.webp'),lossless=load('lossless.webp');
 for(const b of [lossy.slice(0,-1),edit(lossy,(b,v)=>v.setUint32(4,0,true)),edit(lossy,b=>b[15]=255),edit(lossy,b=>b[23]=0),edit(lossless,b=>b[24]|=0xe0),riff([lossy.subarray(12),lossy.subarray(12)]),riff([lossy.subarray(12),chunk('EXIF',new Uint8Array([1,2]))]),riff([chunk('ICCP',new Uint8Array([1,2])),lossy.subarray(12)]),edit(alpha,b=>b[20]|=2),edit(alpha,b=>b[21]=1),edit(alpha,b=>b[24]^=1),edit(alpha,b=>b[20]=0),edit(alpha,b=>b[38]=0xff),edit(lossless,(b,v)=>v.setUint32(21,0x0fffffff,true))])rejects(b);
 const odd=riff([chunk('JUNK',new Uint8Array([1]))]);odd[odd.length-1]=1;rejects(odd);rejects(new Uint8Array(1500001));
});

test('GIF refuses animation, partial frames, nonsquare pixels, invalid palettes/controls, truncation and excessive dimensions',()=>{
 rejects(load('animated.gif'));const gif=load('static.gif'),transparent=load('transparent.gif');const descriptor=b=>{let at=13+(b[10]&128?3*2**((b[10]&7)+1):0);while(b[at]===0x21){const label=b[at+1];at+=2;if(label===0xf9)at+=6;else{while(b[at])at+=1+b[at];at++}}assert.equal(b[at],0x2c);return at};
 for(const b of [gif.slice(0,-1),edit(gif,b=>b[12]=1),edit(gif,(b,v)=>v.setUint16(6,24001,true)),edit(gif,b=>b[10]&=127),edit(gif,b=>b[descriptor(b)+1]=1),edit(gif,b=>b[descriptor(b)+9]|=0x18),edit(gif,b=>b[descriptor(b)]=0),edit(transparent,b=>{const at=13+(b[10]&128?3*2**((b[10]&7)+1):0);b[at+3]|=0xe0}),new Uint8Array([...gif,0])])rejects(b);
});

test('current GIF/WebP replacements use native bytes and ambiguous cropped WebP or mismatched MIME refuses',()=>{
 const files=unzipSync(make(source));files['Pictures/native-picture-4.gif']=load('transparent.gif');assert.equal(read(zipSync(files)).objects[4].src,'data:image/gif;base64,'+Buffer.from(load('transparent.gif')).toString('base64'));
 files['Pictures/native-picture-0.png']=load('lossy.webp');assert.throws(()=>read(zipSync(files)),/native ODT picture/);
 delete files['Pictures/native-picture-0.png'];files['Pictures/native-picture-0.webp']=load('lossy.webp');files['content.xml']=strToU8(strFromU8(files['content.xml']).replaceAll('native-picture-0.png','native-picture-0.webp'));assert.throws(()=>read(zipSync(files)),/Cropped native WebP/);
 files['content.xml']=strToU8(strFromU8(files['content.xml']).replace(/fo:clip="rect\([^"]+\)"/g,'fo:clip="rect(0mm,0mm,0mm,0mm)"'));assert.equal(read(zipSync(files)).objects[0].src,source.objects[0].src);
 assert.throws(()=>odtPictureAssets({}).add(source.objects[0].src),/PNG preparation/);const o={...source.objects[0],src:'data:image/webp;base64,'+Buffer.from(load('static.gif')).toString('base64')};assert.throws(()=>make(normalizeScene({objects:[o]})),/native ODT picture/);
});

test('static picture export keeps original sources intact and refuses animation without attaching partial native data',()=>{
 const before=JSON.stringify(source);make(source);assert.equal(JSON.stringify(source),before);
 for(const name of ['animated.gif','animated.webp']){const src='data:image/'+name.split('.').at(-1)+';base64,'+Buffer.from(load(name)).toString('base64'),scene=normalizeScene({objects:[{...source.objects[0],group:undefined,src}]});assert.throws(()=>make(scene),/native ODT picture/);assert.equal(scene.objects[0].src,src)}
 const parts=unzipSync(make(source));parts['content.xml']=strToU8(strFromU8(parts['content.xml']).replace('draw:image-opacity="70%"','draw:image-opacity="5%"'));assert.throws(()=>read(zipSync(parts)),/native ODT picture/);
});

test('WebP preparation deduplicates visible sources, keeps full pixels and leaves original/review data unchanged',async()=>{
 const doc={type:'doc',content:[{type:'designCanvas',attrs:{scene:normalizeScene({...source,objects:[...source.objects,source.objects[0],{...source.objects[0],hidden:true,src:'data:image/webp;base64,'+Buffer.from(load('animated.webp')).toString('base64')}]})}}]},before=JSON.stringify(doc),calls=[];
 const map=await prepareOdtNativePictures(doc,new Map(),{encode:async src=>{calls.push(src);return prepared.get(src).data}});assert.equal(calls.length,4);assert.equal(map.size,4);assert.equal(JSON.stringify(doc),before);for(const [src,png]of map){assert.equal(png.type,'png');assert.equal(png.width,300);assert.equal(png.height,200);assert.deepEqual(png.data,prepared.get(src).data)}
});

test('WebP preparation failures are atomic and enforce static input, PNG dimensions and decoded-pixel budgets',async()=>{
 const doc={type:'doc',content:[{type:'designCanvas',attrs:{scene:source}}]},sentinel={type:'png',data:new Uint8Array([1])},images=new Map([['existing',sentinel]]);let calls=0;
 await assert.rejects(prepareOdtNativePictures(doc,images,{encode:async src=>{if(++calls===2)throw Error('decode failed');return prepared.get(src).data}}),/decode failed/);assert.deepEqual([...images],[['existing',sentinel]]);
 await assert.rejects(prepareOdtNativePictures(doc,images,{encode:async()=>load('static.gif')}),/could not be prepared/);
 const large=edit(load('lossless.webp'),(b,v)=>v.setUint32(21,(5999|(4999<<14))>>>0,true));const one=bytes=>({type:'doc',content:[{type:'designCanvas',attrs:{scene:normalizeScene({objects:[{...source.objects[0],src:'data:image/webp;base64,'+Buffer.from(bytes).toString('base64')}]})}}]});
 for(const bytes of [load('animated.webp'),large])await assert.rejects(prepareOdtNativePictures(one(bytes),images,{encode:async()=>{throw Error('must not decode')}}),/native ODT picture|could not be prepared/);
 assert.deepEqual([...images],[['existing',sentinel]]);
});

test('normalized PNG bytes count toward native canvas and aggregate reopening limits before download',()=>{
 const png=Buffer.from(prepared.get(source.objects[0].src).data),data=Buffer.from('Note\0'+'A'.repeat(1000000)),chunk=Buffer.alloc(data.length+12);chunk.writeUInt32BE(data.length);chunk.write('tEXt',4);data.copy(chunk,8);chunk.writeUInt32BE(crc32(chunk.subarray(4,-4)),chunk.length-4);const large=Buffer.concat([png.subarray(0,-12),chunk,png.subarray(-12)]),images=new Map([[source.objects[0].src,{data:large}]]),scene=count=>normalizeScene({objects:Array(count).fill(source.objects[0])});
 assert.throws(()=>exportODT({type:'doc',content:[{type:'designCanvas',attrs:{scene:scene(12)}}]}, {},'',images,{nativeDesigns:true}),/15 MB per-canvas/);
 assert.throws(()=>exportODT({type:'doc',content:Array(2).fill({type:'designCanvas',attrs:{scene:scene(8)}})}, {},'',images,{nativeDesigns:true}),/oversized native ODT picture/);
});
