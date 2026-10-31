import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PDFDocument,PDFName} from 'pdf-lib';import {IDBFactory} from 'fake-indexeddb';
import {encodePDFFont,normalizePDFFont} from '../src/pdf-fonts.mjs';import {newFormPDF,buildPDF,loadPDF,normalizePDFState} from '../src/pdf-model.mjs';
import {toolStore} from '../src/tool-storage.mjs';import {createWorkspaceBackup,readWorkspaceBackup} from '../src/workspace-backup.mjs';
import {encodeRecoveryPDFs,decodeRecoveryPDFs} from '../src/pdf-recovery.mjs';
const font=encodePDFFont(new Uint8Array(fs.readFileSync(new URL('./fixtures/DejaVuSans-subset.ttf',import.meta.url))),'DejaVu subset');
test('international annotation, new field and existing field appearances embed a subset font',async()=>{
 const pdf=await PDFDocument.create(),page=pdf.addPage();pdf.getForm().createTextField('Existing').addToPage(page,{x:20,y:600,width:250,height:30});
 const output=await loadPDF(await buildPDF(await pdf.save(),{font,values:{Existing:'Привет Καλημέρα café',Choice:'Αλφα'},annotations:[{page:0,kind:'text',text:'Привет Καλημέρα café',x:20,y:700},{page:0,kind:'field-text',name:'New',text:'Привет',x:20,y:500},{page:0,kind:'field-dropdown',name:'Choice',options:'Αλφα, Beta',x:20,y:450}]}));
 assert.equal(output.getForm().getTextField('Existing').getText(),'Привет Καλημέρα café');assert.equal(output.getForm().getTextField('New').getText(),'Привет');assert.deepEqual(output.getForm().getDropdown('Choice').getSelected(),['Αλφα']);
 assert.ok(output.getForm().getTextField('Existing').acroField.getWidgets()[0].dict.has(PDFName.of('AP')));
 assert.ok([...output.context.enumerateIndirectObjects()].some(([,object])=>object?.get?.(PDFName.of('Subtype'))?.toString()==='/Type0'));
});
test('font selection survives device reopen, complete ZIP and recovery PDF encoding',async()=>{
 const store=toolStore(new IDBFactory()),bytes=await newFormPDF(),state={font,annotations:[{page:0,kind:'text',text:'Привет',x:10,y:20}]};await store.put({id:'font',workspace:'w',name:'International.pdf',bytes,state});
 const [saved]=await store.list('w'),zip=readWorkspaceBackup(createWorkspaceBackup({docs:[],trash:[]},[saved]));assert.deepEqual(normalizePDFState(zip.pdfs[0].state,1).font,font);
 const [recovered]=decodeRecoveryPDFs(encodeRecoveryPDFs([saved]));assert.deepEqual(recovered.state.font,font);assert.ok((await buildPDF(recovered.bytes,recovered.state)).length>bytes.length);
});
test('missing glyphs, malformed fonts and oversized font payloads fail before export',async()=>{
 const bytes=await newFormPDF();await assert.rejects(buildPDF(bytes,{font,annotations:[{page:0,kind:'text',text:'漢字'}]}),/does not contain/);
 await assert.rejects(buildPDF(bytes,{font:{data:btoa('\x00\x01\x00\x00'+'x'.repeat(30))}}),/could not be embedded/);
 assert.throws(()=>normalizePDFFont({data:'%%%'}),/encoding/);assert.throws(()=>normalizePDFFont({data:btoa('not a font file')}),/TrueType/);assert.throws(()=>normalizePDFFont({data:'a'.repeat(13333337)}),/exceeds/);
 assert.equal(normalizePDFState({},1).font,null);
});
