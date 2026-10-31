import test from 'node:test';import assert from 'node:assert/strict';import {PDFDocument,PDFName,PDFNumber} from 'pdf-lib';
import {newFormPDF,buildPDF,loadPDF,describeFields} from '../src/pdf-model.mjs';import {protectPDF,unlockPDF} from '../src/pdf-security.mjs';
test('AES-256 PDF protection requires a password and preserves form values after unlock',async()=>{
 const bytes=await buildPDF(await newFormPDF(),{annotations:[{page:0,kind:'field-text',name:'Name',text:'Retained',x:20,y:500}]}),before=bytes.slice(),password='Long-PDF-password-123',encrypted=await protectPDF(bytes,password),second=await protectPDF(bytes,password);
 assert.notDeepEqual(encrypted,second);assert.deepEqual(bytes,before);assert.ok(!Buffer.from(encrypted).includes(Buffer.from('FEFF00520065007400610069006E00650064')));assert.ok(!Buffer.from(encrypted).includes(Buffer.from('FEFF004E0061006D0065')));await assert.rejects(loadPDF(encrypted),error=>error.code==='pdf-password-required');await assert.rejects(unlockPDF(encrypted,'wrong'),/could not be unlocked/);
 const encryptedDoc=await PDFDocument.load(encrypted,{ignoreEncryption:true}),dict=encryptedDoc.context.lookup(encryptedDoc.context.trailerInfo.Encrypt);assert.equal(dict.get(PDFName.of('V')).asNumber(),5);assert.equal(dict.get(PDFName.of('R')).asNumber(),6);assert.equal(dict.get(PDFName.of('Length')).asNumber(),256);
 const plain=await unlockPDF(encrypted,password),pdf=await loadPDF(plain);assert.equal(pdf.isEncrypted,false);assert.equal(describeFields(pdf)[0].value,'Retained');assert.equal((await loadPDF(await buildPDF(plain,{values:{Name:'Edited'}}))).getForm().getTextField('Name').getText(),'Edited');
});
test('password bounds and signed PDFs prevent unsafe or misleading security output',async()=>{
 const bytes=await newFormPDF();await assert.rejects(protectPDF(bytes,'short'),/at least 12/);await assert.rejects(protectPDF(bytes,'é'.repeat(64)),/127 UTF-8/);await assert.rejects(unlockPDF(bytes,'a'.repeat(128)),/127 UTF-8/);
 const pdf=await PDFDocument.load(bytes),field=pdf.context.register(pdf.context.obj({FT:'Sig',T:'Signature',V:pdf.context.obj({Type:'Sig'})}));pdf.getForm().acroForm.addField(field);await assert.rejects(protectPDF(await pdf.save(),'long-test-password'),/invalidate/);
});
test('XFA is refused before a library can silently delete its data',async()=>{
 const pdf=await PDFDocument.create();pdf.addPage();pdf.getForm().acroForm.dict.set(PDFName.of('XFA'),pdf.context.obj([]));const bytes=await pdf.save({updateFieldAppearances:false});await assert.rejects(loadPDF(bytes),/XFA/);await assert.rejects(protectPDF(bytes,'long-test-password'),/XFA/);
});
