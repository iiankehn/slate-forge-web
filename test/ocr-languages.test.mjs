import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';import {IDBFactory} from 'fake-indexeddb';
import {OCR_LANGUAGES,ocrLanguage,recognitionLanguages,OCR_ENGINE_CONFIG} from '../src/ocr-languages.mjs';import {createOCRWorkspace} from '../src/ocr-workspace.mjs';import {ocrDraftStore} from '../src/ocr-drafts.mjs';import {collectOCRBackup,restoreOCRBackup} from '../src/ocr-backup.mjs';
import {createWorker} from 'tesseract.js';import path from 'node:path';
test('local WASM OCR recognizes French and Russian printed-text fixtures',async()=>{
 for(const [language,fixture,expected]of [['fra','ocr-french.png','Bonjour café'],['rus','ocr-russian.png','Привет мир']]){const worker=await createWorker(language,1,{langPath:path.resolve('node_modules/@tesseract.js-data/'+language+'/4.0.0_best_int'),cacheMethod:'none'},OCR_ENGINE_CONFIG);try{assert.ok((await worker.recognize('test/fixtures/'+fixture)).data.text.includes(expected))}finally{await worker.terminate()}}
});
test('OCR language selection is allowlisted and all ten packaged models are local gzip assets',()=>{
 assert.equal(ocrLanguage('https://external/model'),'eng');assert.deepEqual(recognitionLanguages('fra',true),['fra','eng']);assert.deepEqual(recognitionLanguages('eng',true),['eng']);
 assert.equal(OCR_LANGUAGES.length,10);for(const {code}of OCR_LANGUAGES){const bytes=fs.readFileSync('node_modules/@tesseract.js-data/'+code+'/4.0.0_best_int/'+code+'.traineddata.gz');assert.equal(bytes[0],31);assert.equal(bytes[1],139)}
});
test('OCR languages and page range survive backup restore with legacy defaults intact',async()=>{
 const store=ocrDraftStore(new IDBFactory());await store.putScan('source',{blob:new Blob(['%PDF-1.7'],{type:'application/pdf'}),name:'scan.pdf',controls:{ocrLanguage:'fra',ocrEnglish:'true',ocrBatch:'true',ocrLastPage:'5'}});
 await restoreOCRBackup(store,'restored',await collectOCRBackup(store,'source'));assert.deepEqual((await store.getScan('restored')).controls,{ocrLanguage:'fra',ocrEnglish:'true',ocrBatch:'true',ocrLastPage:'5'});assert.equal(ocrLanguage(undefined),'eng');
});
test('OCR UI selects local languages, saves controls, and discards an obsolete recognition result',async()=>{
 const dom=new JSDOM('<main></main>',{url:'https://editor.example/'}),w=dom.window,originals=Object.fromEntries(['document','indexedDB','createImageBitmap'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.assign(globalThis,{document:w.document,indexedDB:new IDBFactory(),createImageBitmap:async()=>({width:200,height:100,close(){}})});w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},translate(){},rotate(){},drawImage(){}});
 const root=w.document.querySelector('main'),$=id=>root.querySelector('#'+id),calls=[];let dispose,resolveText,terminated=0;
 try{dispose=await createOCRWorkspace(root,{workspace:'w',onText(){},workerFactory:async(languages,mode,options,config)=>{calls.push({languages,options,config});return {recognize:async()=>new Promise(resolve=>{resolveText=resolve}),terminate:async()=>{terminated++}}}});
  await $('ocrFile').onchange({target:{files:[new File(['\x89PNG\r\n\x1a\n'],'scan.png',{type:'image/png'})]}});$('ocrLanguage').value='fra';$('ocrEnglish').checked=true;$('ocrEnglish').onchange();
  const running=$('ocrRun').onclick();await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls[0].languages,['fra','eng']);assert.deepEqual(calls[0].config,OCR_ENGINE_CONFIG);assert.equal(calls[0].options.langPath,'https://editor.example/vendor/ocr/lang/');
  $('ocrLanguage').value='rus';$('ocrLanguage').onchange();resolveText({data:{text:'Obsolete French result'}});await running;assert.equal($('ocrResult').value,'');assert.ok(terminated>0);
  const scan=await ocrDraftStore().getScan('w');assert.equal(scan.controls.ocrLanguage,'rus');assert.equal(scan.controls.ocrEnglish,'true');
  dispose();dispose=null;
  const reopened=await createOCRWorkspace(root,{workspace:'w',onText(){}});dispose=reopened;assert.equal($('ocrLanguage').value,'rus');assert.equal($('ocrEnglish').checked,true);
 }finally{dispose?.();w.close();for(const [key,descriptor]of Object.entries(originals))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}
});
