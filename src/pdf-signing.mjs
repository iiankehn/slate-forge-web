import {inspectPDFSignaturePolicy,normalizeFieldLock,signatureSlotLock,fieldIsLocked} from './pdf-signature-policy.mjs';
export {inspectPDFSignaturePolicy} from './pdf-signature-policy.mjs';
import forge from 'node-forge';
import {PDFDocument,PDFName,PDFString,PDFHexString,PDFArray,PDFNumber,PDFDict} from 'pdf-lib';
const SIGNATURE_BYTES=16384;
function binary(bytes){let value='';for(let i=0;i<bytes.length;i+=16384)value+=String.fromCharCode(...bytes.subarray(i,i+16384));return value}
function signingIdentity(bytes,password,now){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>2000000)throw Error('Choose a PKCS#12 certificate file under 2 MB.');
 let archive;try{archive=forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binary(bytes)),false,password)}catch{throw Error('Certificate could not be unlocked. Check the certificate file and password.')}
 const bags=oid=>archive.getBags({bagType:oid})[oid]||[],keys=[...bags(forge.pki.oids.pkcs8ShroudedKeyBag),...bags(forge.pki.oids.keyBag)].map(b=>b.key).filter(Boolean),certs=bags(forge.pki.oids.certBag).map(b=>b.cert).filter(Boolean);
 const matches=[];for(const key of keys)for(const cert of certs)if(key.n&&cert.publicKey.n&&key.n.compareTo(cert.publicKey.n)===0&&key.e.compareTo(cert.publicKey.e)===0)matches.push({key,cert});
 if(matches.length!==1)throw Error('Choose a certificate containing one matching RSA private key and certificate.');
 const identity=matches[0];if(now<identity.cert.validity.notBefore||now>identity.cert.validity.notAfter)throw Error('This signing certificate is not valid on the current date.');return {...identity,certs};
}
export async function signPDF(bytes,certificate,password,options={}){return appendSignature(bytes,certificate,password,{...options,firstOnly:true})}

function completeSignature(output,{key,cert,certs},now){const text=binary(output),rangePattern=/\/ByteRange\s*\[\s*0\s*\/\*{10}\s*\/\*{10}\s*\/\*{10}\s*\]/g,matches=[...text.matchAll(rangePattern)];
 if(matches.length!==1)throw Error('Signature placeholder is ambiguous.');
 const match=matches[0],contents=/\/Contents\s*<([0-9A-Fa-f]+)>/g;contents.lastIndex=match.index;const content=contents.exec(text);
 if(!content||content[1].length!==SIGNATURE_BYTES*2)throw Error('Signature placeholder could not be located.');
 const start=content.index+content[0].indexOf('<'),end=start+content[1].length+2,range=[0,start,end,output.length-end],replacement='/ByteRange ['+range.join(' ')+']';
 if(replacement.length>match[0].length)throw Error('PDF byte range exceeds the signing limit.');output.set(new TextEncoder().encode(replacement.padEnd(match[0].length,' ')),match.index);
 const signed=forge.pkcs7.createSignedData();signed.content=forge.util.createBuffer(binary(output.subarray(0,start))+binary(output.subarray(end)));for(const item of certs)signed.addCertificate(item);
 signed.addSigner({key,certificate:cert,digestAlgorithm:forge.pki.oids.sha256,authenticatedAttributes:[{type:forge.pki.oids.contentType,value:forge.pki.oids.data},{type:forge.pki.oids.messageDigest},{type:forge.pki.oids.signingTime,value:now}]});signed.sign({detached:true});
 const der=forge.asn1.toDer(signed.toAsn1()).getBytes();if(der.length>SIGNATURE_BYTES)throw Error('Certificate chain is too large for this PDF signature.');
 const hex=forge.util.bytesToHex(der).padEnd(SIGNATURE_BYTES*2,'0');output.set(new TextEncoder().encode(hex),start+1);return output;
}

// Append a new PDF revision. Earlier bytes (including every previous signature)
// are copied unchanged, rather than rewritten by a full document save.
export async function signPDFIncremental(bytes,certificate,password,options={}){return appendSignature(bytes,certificate,password,options)}
function lockOptions(lock,type='SigFieldLock'){
 return {Type:type,Action:lock.action,...(lock.action!=='All'?{Fields:lock.fields.map(value=>PDFHexString.fromText(value))}:{}),...(type==='SigFieldLock'&&lock.permission?{P:lock.permission}:{})};
}
async function appendSignature(bytes,certificate,password,{now=new Date(),reason='',name='',fieldName='',certification=0,lock=null,firstOnly=false,onProgress=()=>{}}={}){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>40000000)throw Error('PDF signing is limited to 40 MB.');if(!Number.isFinite(now.getTime()))throw Error('Invalid signing date.');if(![0,1,2,3].includes(certification))throw Error('Choose supported certification permissions.');
 const pdf=await PDFDocument.load(bytes,{updateMetadata:false});if(pdf.isEncrypted)throw Error('Unlock the PDF before signing.');if(!pdf.getPageCount())throw Error('Choose a PDF with at least one page.');
 const policy=await inspectPDFSignaturePolicy(bytes,{pdf,onProgress});if(firstOnly&&policy.history.length)throw Error('This PDF is already signed. Use Add another signature.');if(certification&&policy.history.length)throw Error('Certification must be the first signature.');if(policy.permission===1)throw Error('The document certification or lock policy permits no changes.');if(policy.history.length>=20)throw Error('Incremental signing is limited to 20 signatures.');
 const context=pdf.context,metadata=policy.metadata,available=policy.slots.filter(slot=>slot.available);let target=null;
 if(fieldName){const slot=policy.slots.find(slot=>slot.name===fieldName);if(!slot?.available)throw Error(slot?.reason||'Choose an existing empty signature field.');target=metadata.fields.find(field=>field.name===fieldName)}else if(available.length)target=metadata.fields.find(field=>field.name===available[0].name);
 if(!target&&policy.permission!==null)throw Error('This document requires an existing unlocked signature field.');
 const names=new Set(metadata.fields.map(field=>field.name));let label=target?.name||'SlateForgeSignature';if(!target)for(let index=2;names.has(label);index++)label='SlateForgeSignature'+index;
 if(fieldIsLocked(label,policy.locks))throw Error('An earlier signature locks the selected or new signature field.');
 const requested=normalizeFieldLock(lock,metadata.names),preset=target?signatureSlotLock(target,metadata.names):null;if(preset&&requested&&JSON.stringify(preset)!==JSON.stringify(requested))throw Error('This signature field defines its own lock settings. Keep its existing field-lock policy.');const effective=preset||requested;
 const identity=signingIdentity(certificate,password,now),tail=binary(bytes.subarray(Math.max(0,bytes.length-20000))),match=/startxref\s+(\d+)\s+%%EOF\s*$/.exec(tail),previous=Number(match?.[1]);if(!match||!Number.isSafeInteger(previous)||previous<0||previous>=bytes.length)throw Error('The PDF has no supported final cross-reference pointer.');
 const range=PDFArray.withContext(context);range.push(PDFNumber.of(0));for(let i=0;i<3;i++)range.push(PDFName.of('**********'));
 const references=[];if(certification)references.push({Type:'SigRef',TransformMethod:'DocMDP',Data:context.trailerInfo.Root,TransformParams:{Type:'TransformParams',P:certification,V:'1.2'}});if(effective)references.push({Type:'SigRef',TransformMethod:'FieldMDP',Data:context.trailerInfo.Root,TransformParams:{...lockOptions(effective,'TransformParams'),V:'1.2'}});
 const signature=context.obj({Type:'Sig',Filter:'Adobe.PPKLite',SubFilter:'adbe.pkcs7.detached',ByteRange:range,Contents:PDFHexString.of('0'.repeat(SIGNATURE_BYTES*2)),M:PDFString.fromDate(now),Reason:PDFHexString.fromText(String(reason).slice(0,200)),Name:PDFHexString.fromText(String(name||identity.cert.subject.getField('CN')?.value||'Signer').slice(0,100)),...(references.length?{Reference:references}:{})}),signatureRef=context.register(signature),objects=[[signatureRef,signature]];
 const sourceForm=metadata.form||context.obj({Fields:[]}),form=sourceForm.clone(context),oldFields=metadata.roots,newFields=context.obj(oldFields?Array.from({length:oldFields.size()},(_,index)=>oldFields.get(index)):[]);
 if(target){const field=target.dict.clone(context);field.set(PDFName.of('V'),signatureRef);if(effective&&!preset)field.set(PDFName.of('Lock'),context.obj(lockOptions(effective)));objects.push([target.ref,field])}
 else{const field=context.obj({FT:'Sig',T:PDFHexString.fromText(label),V:signatureRef,...(effective?{Lock:lockOptions(effective)}:{})}),ref=context.register(field);newFields.push(ref);objects.push([ref,field])}
 form.set(PDFName.of('Fields'),newFields);form.set(PDFName.of('SigFlags'),PDFNumber.of(3));const formRef=context.register(form),catalog=pdf.catalog.clone(context);catalog.set(PDFName.of('AcroForm'),formRef);
 if(certification){const old=context.lookup(pdf.catalog.get(PDFName.of('Perms'))),perms=old instanceof PDFDict?old.clone(context):context.obj({});if(perms.has(PDFName.of('DocMDP')))throw Error('This PDF already has document certification.');perms.set(PDFName.of('DocMDP'),signatureRef);catalog.set(PDFName.of('Perms'),perms)}
 if(certification||effective){const header=/^%PDF-([0-9]+\.[0-9]+)/.exec(binary(bytes.subarray(0,32))),declared=pdf.catalog.lookupMaybe(PDFName.of('Version'),PDFName)?.decodeText(),version=Math.max(Number(header?.[1])||0,Number(declared)||0);if(version<1.5){if(policy.history.length)throw Error('This older signed PDF needs a version upgrade before adding permission transforms.');catalog.set(PDFName.of('Version'),PDFName.of('1.5'))}}
 const root=context.trailerInfo.Root;if(!root)throw Error('The PDF root reference is missing.');objects.push([formRef,form],[root,catalog]);
 const encode=value=>Uint8Array.from(value,char=>char.charCodeAt(0)),parts=[bytes,encode(String.fromCharCode(10))],offsets=[];let offset=bytes.length+1;
 for(const [ref,object]of objects){const header=encode(ref.objectNumber+' '+ref.generationNumber+' obj'+String.fromCharCode(10)),body=new Uint8Array(object.sizeInBytes());object.copyBytesInto(body,0);const end=encode(String.fromCharCode(10)+'endobj'+String.fromCharCode(10));offsets.push({ref,offset});parts.push(header,body,end);offset+=header.length+body.length+end.length}
 const crossref=offset;let xref='xref'+String.fromCharCode(10);for(const entry of offsets.sort((a,b)=>a.ref.objectNumber-b.ref.objectNumber))xref+=entry.ref.objectNumber+' 1'+String.fromCharCode(10)+String(entry.offset).padStart(10,'0')+' '+String(entry.ref.generationNumber).padStart(5,'0')+' n '+String.fromCharCode(10);
 const trailer=context.obj({Size:context.largestObjectNumber+1,Root:root,Prev:previous,...(context.trailerInfo.Info?{Info:context.trailerInfo.Info}:{}),...(context.trailerInfo.ID?{ID:context.trailerInfo.ID}:{})});parts.push(encode(xref+'trailer'+String.fromCharCode(10)+trailer.toString()+String.fromCharCode(10)+'startxref'+String.fromCharCode(10)+crossref+String.fromCharCode(10)+'%%EOF'+String.fromCharCode(10)));
 const total=parts.reduce((sum,part)=>sum+part.length,0);if(total>42000000)throw Error('Signed PDF exceeds the output size limit.');const output=new Uint8Array(total);let position=0;for(const part of parts){output.set(part,position);position+=part.length}return completeSignature(output,identity,now);
}
