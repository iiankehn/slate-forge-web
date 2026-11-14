import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import createDOMPurify from 'dompurify';
import {zipSync,unzipSync,strToU8} from 'fflate';
import {createXFAScriptRuntime} from '../src/pdf-xfa-scripts.mjs';
import {normalizeXFAValues,assertXFAFieldOnly} from '../src/pdf-xfa-state.mjs';
import {attachReviewTree,restoreReviewTree} from '../src/docx-review-tree.mjs';

const field=(name,scripts=[])=>({id:'data-'+name,fieldId:'field-'+name,path:[{name:'form',index:0},{name,index:0}],scripts});
const script=(source,activity='calculate')=>({source,activity,language:'application/x-javascript'});
const schemaFor=fields=>new Map(fields.map(f=>[f.id,{kind:'text',editable:true}]));

test('XFA calculations follow dependencies and protect calculated fields',()=>{
 const fields=[field('total',[script('this.rawValue = Number(subtotal.rawValue) * 2;')]),field('subtotal',[script('this.rawValue = Number(price.rawValue) + 1;')]),field('price')],schema=schemaFor(fields),runtime=createXFAScriptRuntime(fields,schema);
 assert.deepEqual(runtime.warnings,[]);assert.equal(schema.get('data-total').editable,false);
 assert.deepEqual(runtime.run({'data-price':'4'}),{'data-price':'4','data-total':'10','data-subtotal':'5'});
 assert.equal(runtime.run({'data-price':'8'})['data-total'],'18');
});
test('XFA rejects unsafe scripts, protected assignments and non-converging calculations',()=>{
 const unsafe=[field('price',[script('fetch("https://example.com")','initialize')])],runtime=createXFAScriptRuntime(unsafe,schemaFor(unsafe));
 assert.ok(runtime.warnings.length);assert.equal(runtime.canSubmit(),false);assert.equal(runtime.supportsEvent('field-price','initialize'),false);
 const cycle=[field('a',[script('this.rawValue = Number(this.rawValue) + 1;')])];assert.throws(()=>createXFAScriptRuntime(cycle,schemaFor(cycle)).run({'data-a':'0'}),/did not settle/);
 const fields=[field('a',[script('b.rawValue = "changed";','change')]),field('b')],schema=schemaFor(fields);schema.get('data-b').editable=false;
 assert.throws(()=>createXFAScriptRuntime(fields,schema).run({'data-b':'original'},{activity:'change',fieldId:'field-a'}),/protected field/);
});
test('XFA multi-selection values survive normalization without permitting other PDF mutations',()=>{
 const original={'choice':['café','😀'],'check':true},normalized=normalizeXFAValues(original);original.choice.push('later');assert.deepEqual(normalized.choice,['café','😀']);
 assert.throws(()=>normalizeXFAValues({'bad':'\ud800'}),/Invalid/);assert.throws(()=>normalizeXFAValues({'bad':Array(101).fill('x')}),/Invalid/);
 assert.doesNotThrow(()=>assertXFAFieldOnly({order:[0,1],xfaValues:normalized}));assert.throws(()=>assertXFAFieldOnly({order:[1,0]}),/own field editor/);
});
test('nested DOCX review snapshot is sanitized and ignored after external package edits',async()=>{
 const dom=new JSDOM(''),Parser=dom.window.DOMParser,purifier=createDOMPurify(dom.window);
 try{
  const files={'[Content_Types].xml':strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),'word/document.xml':strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>')};
  const bytes=await attachReviewTree(zipSync(files),'<div data-forge-block-change="pending"><p onclick="alert(1)">Kept<script>alert(1)</script></p><table><tr><td colwidth="120"><p>Width kept</p></td><td colwidth="0;position:fixed"><p>Unsafe width removed</p></td></tr></table></div>',{}, {Parser}),archive=unzipSync(bytes),warnings=[];
  const restored=await restoreReviewTree(archive,Parser,warnings,{purifier});assert.ok(restored);assert.match(restored.html,/Kept/);assert.doesNotMatch(restored.html,/onclick|<script|position:fixed/);assert.match(restored.html,/colwidth="120"/);assert.match(warnings.join(' '),/Nested Slate Forge review was restored/);
  archive['word/document.xml']=strToU8('<changed/>');assert.equal(await restoreReviewTree(archive,Parser,warnings,{purifier}),null);assert.match(warnings.join(' '),/changed outside/);
 }finally{dom.window.close()}
});

test('XFA submission prepares an independent attachment and sends only with explicit invocation',async()=>{
 const {prepareXFASubmission,describeXFASubmission,sendXFASubmission,xfaEmailDraft}=await import('../src/pdf-xfa-submit.mjs');
 assert.throws(()=>describeXFASubmission({format:'pdf',target:'http://example.com'}),/HTTPS/);assert.throws(()=>describeXFASubmission({format:'pdf',target:'https://user:secret@example.com'}),/passwords/);
 const original=new Uint8Array([1,2,3]),payload=await prepareXFASubmission(original,{format:'pdf',target:'https://example.com/submit'});original[0]=9;assert.equal(payload.body[0],1);
 const previous=globalThis.fetch;let calls=0;globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://example.com/submit');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.method,'POST');return {ok:true,status:200}};
 try{assert.equal(calls,0);assert.equal(await sendXFASubmission(payload),200);assert.equal(calls,1)}finally{globalThis.fetch=previous}
 assert.equal(xfaEmailDraft(new URL('mailto:reader@example.com?subject=Hello%0D%0AInjected&body=private')),'mailto:reader@example.com?subject=HelloInjected');
});

test('image node views can mount before Tiptap exposes editor.view',async()=>{
 const {pageImageNodeView}=await import('../src/image-placement.mjs'),dom=new JSDOM('<main></main>');
 try{const editor={options:{element:dom.window.document.querySelector('main')},get view(){throw Error('Editor view is not mounted yet')}},node={attrs:{imagePlacement:'flow'}},view=pageImageNodeView({HTMLAttributes:{}})({node,editor,HTMLAttributes:{src:'data:image/png;base64,aA=='}});assert.equal(view.dom.tagName,'IMG');assert.equal(view.dom.ownerDocument,dom.window.document)}finally{dom.window.close()}
});
