import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {webcrypto} from 'node:crypto';
import {capacityPDF as largePDF} from './fixtures/pdf-capacity.mjs';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {build} from 'esbuild';
import {loadPDF,buildPDF,PDF_PAGE_LIMIT} from '../src/pdf-model.mjs';
import {createWorkspaceBackup,readWorkspaceBackup} from '../src/workspace-backup.mjs';
import {encodeRecoveryPDFs,decodeRecoveryPDFs} from '../src/pdf-recovery.mjs';
import {toolStore} from '../src/tool-storage.mjs';


const wait=async check=>{for(let i=0;i<1000;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.fail('PDF operation did not finish')};

test('250-page PDFs retain last-page edits, page order, ZIP and recovery within the bounded page limit',async()=>{
 const began=performance.now(),source=await largePDF(PDF_PAGE_LIMIT),loaded=await loadPDF(source);assert.equal(loaded.getPageCount(),250);const state={order:[249,...Array.from({length:249},(_,i)=>i)],values:{'Final page':'Still saved'},annotations:[{kind:'text',page:249,x:40,y:500,text:'Last-page annotation',size:12}]},bytes=await buildPDF(source,state),output=await loadPDF(bytes);assert.equal(output.getPageCount(),250);assert.equal(output.getForm().getTextField('Final page').getText(),'Still saved');const record={id:'large',name:'250 pages.pdf',workspace:'capacity',bytes:source,state},factory=new IDBFactory(),store=toolStore(factory);await store.put(record);assert.equal((await store.list('capacity')).length,1);const backup=readWorkspaceBackup(createWorkspaceBackup({docs:[],trash:[]},await store.list('capacity'))),recovered=decodeRecoveryPDFs(encodeRecoveryPDFs(backup.pdfs));assert.deepEqual(recovered[0].bytes,source);assert.deepEqual(recovered[0].state,state);assert.equal((await loadPDF(await buildPDF(recovered[0].bytes,recovered[0].state))).getPageCount(),250);await assert.rejects(loadPDF(await largePDF(251)),/250 pages/);console.log(JSON.stringify({case:'250-page storage/export/recovery',sourceBytes:source.length,elapsedMs:Math.round(performance.now()-began)}));
});

test('direct PDF navigation reuses its prepared document and edits invalidate the preview',async()=>{
 const bundled=await build({stdin:{contents:"import {createPDFWorkspace} from './src/pdf-workspace.mjs';window.createPDFWorkspace=createPDFWorkspace;",resolveDir:process.cwd()},bundle:true,format:'iife',platform:'browser',target:'es2022',write:false,logLevel:'silent'}),dom=new JSDOM('<main></main>',{url:'https://editor.example/',runScripts:'outside-only'}),w=dom.window;
 Object.defineProperty(w,'crypto',{value:webcrypto});Object.assign(w,{indexedDB:new IDBFactory(),structuredClone,TextEncoder,TextDecoder,File,Blob,DOMMatrix:class{}});w.eval(bundled.outputFiles[0].text);const root=w.document.querySelector('main'),$=id=>root.querySelector('#'+id),calls=[],exports=[];let dispose;
 try{dispose=await w.createPDFWorkspace(root,{workspace:'capacity-nav',onExport:(name,bytes)=>exports.push(bytes),onText(){},renderPage:async(bytes,index)=>{calls.push({bytes,index});const canvas=w.document.createElement('canvas');canvas.width=500;canvas.height=700;return {canvas,viewport:{width:500,height:700},count:250}}});assert.equal($('pdfPageNumber').disabled,true);await $('pdfFile').onchange({target:{files:[new File([await largePDF()],'250 pages.pdf',{type:'application/pdf'})]}});assert.equal($('pdfPageLabel').textContent,'1 / 250');$('pdfPageNumber').value='250';await $('pdfPageNumber').onchange();assert.equal($('pdfPageLabel').textContent,'250 / 250');assert.equal(calls.at(-1).index,249);await $('pdfPrev').onclick();assert.equal(calls.at(-1).index,248);assert.equal(calls[0].bytes,calls[1].bytes);assert.equal(calls[1].bytes,calls[2].bytes);$('pdfPageNumber').value='251';await $('pdfPageNumber').onchange();assert.equal(calls.length,3);assert.match($('pdfStatus').textContent,/1 to 250/);assert.equal($('pdfPageNumber').value,'249');$('pdfPageNumber').value='1.5';await $('pdfPageNumber').onchange();assert.equal(calls.length,3);
  root.querySelector('[data-pdf-field="Final page"]').value='Edited at scale';$('pdfApplyFields').onclick();await wait(()=>root.getAttribute('aria-busy')==='false');assert.notEqual(calls.at(-1).bytes,calls[0].bytes);await $('pdfNext').onclick();assert.equal(calls.at(-1).index,249);assert.equal(calls.at(-1).bytes,calls.at(-2).bytes);await $('pdfSave').onclick();assert.equal((await loadPDF(new Uint8Array(exports[0]))).getForm().getTextField('Final page').getText(),'Edited at scale');assert.equal((await loadPDF(new Uint8Array(exports[0]))).getPageCount(),250);
 }finally{dispose?.();w.close()}
});
