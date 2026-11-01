import test from 'node:test';import assert from 'node:assert/strict';import {createHash,verify} from 'node:crypto';import forge from 'node-forge';
import {signPDF,signPDFIncremental} from '../src/pdf-signing.mjs';import {PDFName,PDFDocument} from 'pdf-lib';
import {newFormPDF,loadPDF,buildPDF,hasPDFSignature} from '../src/pdf-model.mjs';
const now=new Date('2026-10-31T12:00:00Z'),keys=forge.pki.rsa.generateKeyPair(2048),cert=forge.pki.createCertificate();cert.publicKey=keys.publicKey;cert.serialNumber='01';cert.validity.notBefore=new Date('2026-01-01');cert.validity.notAfter=new Date('2030-01-01');cert.setSubject([{name:'commonName',value:'Ephemeral test signer'}]);cert.setIssuer(cert.subject.attributes);cert.sign(keys.privateKey,forge.md.sha256.create());
const p12=Uint8Array.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(keys.privateKey,[cert],'fixture',{algorithm:'3des'})).getBytes(),c=>c.charCodeAt(0));
function verifySignature(bytes,index=0,expectedLength=bytes.length){
 const text=Buffer.from(bytes).toString('latin1'),range=[...text.matchAll(/\/ByteRange \[(\d+) (\d+) (\d+) (\d+)\]/g)][index].slice(1).map(Number),content=Buffer.concat([bytes.subarray(0,range[1]),bytes.subarray(range[2],range[2]+range[3])]),hex=text.slice(range[1]+1,range[2]-1),cms=forge.asn1.fromDer(forge.util.createBuffer(forge.util.hexToBytes(hex)),{strict:false,parseAllBytes:false}),signedData=cms.value[1].value[0],signer=signedData.value.at(-1).value[0],attributes=signer.value[3],digest=attributes.value.find(a=>a.value[0].value===forge.asn1.oidToDer(forge.pki.oids.messageDigest).getBytes()).value[1].value[0].value;
 assert.equal(Buffer.from(digest,'latin1').toString('hex'),createHash('sha256').update(content).digest('hex'));
 const canonical=forge.asn1.create(forge.asn1.Class.UNIVERSAL,forge.asn1.Type.SET,true,attributes.value),data=Buffer.from(forge.asn1.toDer(canonical).getBytes(),'latin1');assert.equal(verify('sha256',data,forge.pki.publicKeyToPem(keys.publicKey),Buffer.from(signer.value[5].value,'latin1')),true);
 assert.equal(range[2]+range[3],expectedLength);return range;
}
test('PKCS#12 signing produces a valid detached SHA-256/RSA signature over the complete PDF',async()=>{
 const original=await newFormPDF(),before=original.slice(),signed=await signPDF(original,p12,'fixture',{now,reason:'Reviewed'});verifySignature(signed);assert.deepEqual(original,before);assert.ok(hasPDFSignature(await loadPDF(signed)));
 const altered=signed.slice();altered[20]^=1;assert.throws(()=>verifySignature(altered));await assert.rejects(buildPDF(signed,{}),/invalidate the signature/);await assert.rejects(signPDF(signed,p12,'fixture',{now}),/already has a signature/);
});
test('wrong passwords, expired certificates and malformed certificate files cannot sign',async()=>{
 const bytes=await newFormPDF();await assert.rejects(signPDF(bytes,p12,'wrong',{now}),/could not be unlocked/);await assert.rejects(signPDF(bytes,p12,'fixture',{now:new Date('2040-01-01')}),/not valid/);await assert.rejects(signPDF(bytes,new Uint8Array([1,2,3]),'x',{now}),/could not be unlocked/);await assert.rejects(signPDF(bytes,new Uint8Array(2000001),'x',{now}),/under 2 MB/);assert.equal(hasPDFSignature(await loadPDF(bytes)),false);
});

test('incremental signatures preserve original signed bytes and validate every detached digest and RSA signature',async()=>{
 const original=await newFormPDF(),first=await signPDF(original,p12,'fixture',{now}),second=await signPDFIncremental(first,p12,'fixture',{now,reason:'Second approval'}),third=await signPDFIncremental(second,p12,'fixture',{now,reason:'Third approval'});assert.deepEqual(second.subarray(0,first.length),first);assert.deepEqual(third.subarray(0,second.length),second);verifySignature(third,0,first.length);verifySignature(third,1,second.length);verifySignature(third,2,third.length);const pdf=await loadPDF(third);assert.equal(pdf.getForm().getFields().filter(field=>field.acroField.getInheritableAttribute?.((PDFName.of('FT')))?.toString()==='/Sig').length,3);await assert.rejects(buildPDF(third,{}),/invalidate/);
});

test('incremental signing refuses certified policies, excessive signature fields and wrong certificate passwords',async()=>{
 const original=await newFormPDF(),pdf=await PDFDocument.load(original);pdf.catalog.set(PDFName.of('Perms'),pdf.context.obj({DocMDP:pdf.context.obj({Type:'Sig'})}));await assert.rejects(signPDFIncremental(await pdf.save(),p12,'fixture',{now}),/permission policies/);const crowded=await PDFDocument.load(original);for(let index=0;index<20;index++)crowded.getForm().createTextField('Signature'+index).acroField.dict.set(PDFName.of('FT'),PDFName.of('Sig'));await assert.rejects(signPDFIncremental(await crowded.save({updateFieldAppearances:false}),p12,'fixture',{now}),/20 signatures/);await assert.rejects(signPDFIncremental(original,p12,'wrong',{now}),/could not be unlocked/);assert.equal(hasPDFSignature(await loadPDF(original)),false);
});
