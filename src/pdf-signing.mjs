import forge from 'node-forge';
import {PDFDocument,PDFName,PDFString,PDFHexString,PDFArray,PDFNumber} from 'pdf-lib';
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
export async function signPDF(bytes,certificate,password,{now=new Date(),reason='',name=''}={}){
 if(!(bytes instanceof Uint8Array)||bytes.length>40000000)throw Error('PDF signing is limited to 40 MB.');
 if(!Number.isFinite(now.getTime()))throw Error('Invalid signing date.');
 const {key,cert,certs}=signingIdentity(certificate,password,now),pdf=await PDFDocument.load(bytes,{updateMetadata:false});
 if(!pdf.getPageCount()||pdf.context.lookup(pdf.catalog.get(PDFName.of('AcroForm')))?.has?.(PDFName.of('XFA')))throw Error('Choose a standard PDF with at least one page.');
 if(pdf.getForm().getFields().some(field=>field.acroField.getInheritableAttribute(PDFName.of('FT'))===PDFName.of('Sig')))throw Error('This PDF already has a signature field. Multiple signatures are not supported.');
 const placeholder=PDFArray.withContext(pdf.context);placeholder.push(PDFNumber.of(0));for(let i=0;i<3;i++)placeholder.push(PDFName.of('**********'));
 const signature=pdf.context.register(pdf.context.obj({Type:'Sig',Filter:'Adobe.PPKLite',SubFilter:'adbe.pkcs7.detached',ByteRange:placeholder,Contents:PDFHexString.of('0'.repeat(SIGNATURE_BYTES*2)),M:PDFString.fromDate(now),Reason:PDFHexString.fromText(String(reason).slice(0,200)),Name:PDFHexString.fromText(String(name||cert.subject.getField('CN')?.value||'Signer').slice(0,100))}));
 const page=pdf.getPage(0),field=pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Widget',FT:'Sig',Rect:[0,0,0,0],T:PDFString.of('SlateForgeSignature'),V:signature,P:page.ref,F:132}));
 const form=pdf.getForm();form.acroForm.addField(field);form.acroForm.dict.set(PDFName.of('SigFlags'),PDFNumber.of(3));page.node.addAnnot(field);
 const output=await pdf.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false}),text=binary(output),rangePattern=/\/ByteRange\s*\[\s*0\s*\/\*{10}\s*\/\*{10}\s*\/\*{10}\s*\]/g,matches=[...text.matchAll(rangePattern)];
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
