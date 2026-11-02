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
 const original=await newFormPDF(),before=original.slice(),signed=await signPDF(original,p12,'fixture',{now,reason:'Reviewed'});verifySignature(signed);assert.deepEqual(signed.subarray(0,original.length),original);const originalMax=Math.max(...[...Buffer.from(original).toString('latin1').matchAll(/(?:^|[\r\n])(\d+) \d+ obj\b/g)].map(match=>Number(match[1]))),added=[...Buffer.from(signed.subarray(original.length)).toString('latin1').matchAll(/(?:^|[\r\n])(\d+) \d+ obj\b/g)].map(match=>Number(match[1]));const root=(await loadPDF(original)).context.trailerInfo.Root.objectNumber;assert.ok(added.filter(number=>number!==root).every(number=>number>originalMax));assert.deepEqual(original,before);assert.ok(hasPDFSignature(await loadPDF(signed)));
 const altered=signed.slice();altered[20]^=1;assert.throws(()=>verifySignature(altered));await assert.rejects(buildPDF(signed,{}),/invalidate the signature/);await assert.rejects(signPDF(signed,p12,'fixture',{now}),/already has a signature/);
});
test('wrong passwords, expired certificates and malformed certificate files cannot sign',async()=>{
 const bytes=await newFormPDF();await assert.rejects(signPDF(bytes,p12,'wrong',{now}),/could not be unlocked/);await assert.rejects(signPDF(bytes,p12,'fixture',{now:new Date('2040-01-01')}),/not valid/);await assert.rejects(signPDF(bytes,new Uint8Array([1,2,3]),'x',{now}),/could not be unlocked/);await assert.rejects(signPDF(bytes,new Uint8Array(2000001),'x',{now}),/under 2 MB/);assert.equal(hasPDFSignature(await loadPDF(bytes)),false);
});

test('incremental signatures preserve original signed bytes and validate every detached digest and RSA signature',async()=>{
 const original=await newFormPDF(),first=await signPDF(original,p12,'fixture',{now}),second=await signPDFIncremental(first,p12,'fixture',{now,reason:'Second approval'}),third=await signPDFIncremental(second,p12,'fixture',{now,reason:'Third approval'});assert.deepEqual(second.subarray(0,first.length),first);assert.deepEqual(third.subarray(0,second.length),second);verifySignature(third,0,first.length);verifySignature(third,1,second.length);verifySignature(third,2,third.length);const pdf=await loadPDF(third);assert.equal(pdf.getForm().getFields().filter(field=>field.acroField.getInheritableAttribute?.((PDFName.of('FT')))?.toString()==='/Sig').length,3);await assert.rejects(buildPDF(third,{}),/invalidate/);
});

test('incremental signing refuses unreadable policies, reuses blank fields and rejects wrong passwords',async()=>{
 const original=await newFormPDF(),pdf=await PDFDocument.load(original);pdf.catalog.set(PDFName.of('Perms'),pdf.context.obj({DocMDP:pdf.context.obj({Type:'Sig'})}));await assert.rejects(signPDFIncremental(await pdf.save(),p12,'fixture',{now}),/certification signature|permission policies/);const crowded=await PDFDocument.load(original);for(let index=0;index<20;index++)crowded.getForm().createTextField('Signature'+index).acroField.dict.set(PDFName.of('FT'),PDFName.of('Sig'));const reused=await loadPDF(await signPDFIncremental(await crowded.save({updateFieldAppearances:false}),p12,'fixture',{now}));assert.equal(reused.getForm().getFields().length,20);assert.equal(reused.getForm().getFields().filter(field=>field.acroField.dict.has(PDFName.of('V'))).length,1);await assert.rejects(signPDFIncremental(original,p12,'wrong',{now}),/could not be unlocked/);assert.equal(hasPDFSignature(await loadPDF(original)),false);
});

test('certification permissions and field locks govern subsequent signatures without changing earlier bytes',async()=>{
 const doc=await PDFDocument.load(await newFormPDF());for(const name of ['First','Second','Third'])doc.getForm().createTextField(name).acroField.dict.set(PDFName.of('FT'),PDFName.of('Sig'));
 const source=await doc.save({updateFieldAppearances:false}),{inspectPDFSignaturePolicy}=await import('../src/pdf-signature-policy.mjs');
 const sealed=await signPDF(source,p12,'fixture',{now,fieldName:'First',certification:1});assert.equal((await inspectPDFSignaturePolicy(sealed)).permission,1);await assert.rejects(signPDFIncremental(sealed,p12,'fixture',{now}),/permits no changes/);
 const certified=await signPDF(source,p12,'fixture',{now,fieldName:'First',certification:2,lock:{action:'Include',fields:['Third']}}),policy=await inspectPDFSignaturePolicy(certified);
 assert.equal(policy.permission,2);assert.equal(policy.slots.find(slot=>slot.name==='Second').available,true);assert.equal(policy.slots.find(slot=>slot.name==='Third').available,false);
 await assert.rejects(signPDFIncremental(certified,p12,'fixture',{now,fieldName:'Third'}),/lock/i);
 const second=await signPDFIncremental(certified,p12,'fixture',{now,fieldName:'Second'});assert.deepEqual(second.subarray(0,certified.length),certified);verifySignature(second,0,certified.length);verifySignature(second,1);assert.equal((await inspectPDFSignaturePolicy(second)).history.length,2);
 const altered=second.slice();altered[7]=altered[7]===55?54:55;await assert.rejects(inspectPDFSignaturePolicy(altered),/digest|integrity/);
});

test('timestamp requests bind the signature hash and nonce and refuse mismatched or denied responses',async()=>{
 const {createPDFTimestampRequest,parseTimestampRequest,attachPDFTimestamp}=await import('../src/pdf-timestamps.mjs'),source=await newFormPDF(),signed=await signPDF(source,p12,'fixture',{now}),request=await createPDFTimestampRequest(signed,{random:{getRandomValues(value){value.fill(0);return value}}}),parsed=parseTimestampRequest(request.request);
 assert.equal(parsed.nonce,'01');assert.equal(Buffer.from(parsed.digest,'latin1').toString('hex'),request.signatureDigest);assert.equal(parsed.digest.length,32);
 await assert.rejects(createPDFTimestampRequest(source),/Sign the PDF/);assert.throws(()=>parseTimestampRequest(new Uint8Array([1,2,3])));
 const second=await signPDFIncremental(signed,p12,'fixture',{now});await assert.rejects(attachPDFTimestamp(second,request.request,new Uint8Array([1]),[]),/another PDF signature/);
 const A=forge.asn1,denied=A.create(A.Class.UNIVERSAL,A.Type.SEQUENCE,true,[A.create(A.Class.UNIVERSAL,A.Type.SEQUENCE,true,[A.create(A.Class.UNIVERSAL,A.Type.INTEGER,false,'\x02')])]),response=Uint8Array.from(A.toDer(denied).getBytes(),c=>c.charCodeAt(0));
 await assert.rejects(attachPDFTimestamp(signed,request.request,response,[]),/did not grant/);
});
