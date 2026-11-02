import forge from 'node-forge';
import {binaryBytes} from './pdf-signature-integrity.mjs';
const A=forge.asn1,ekuOID='2.5.29.37',timestampOID='1.3.6.1.5.5.7.3.8',anyEKU='2.5.29.37.0';
export const certificateDER=certificate=>A.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
export const certificateFingerprint=certificate=>forge.md.sha256.create().update(certificateDER(certificate)).digest().toHex();
export function readTrustedCertificates(inputs){
 const files=Array.isArray(inputs)?inputs:[inputs],certificates=[];let size=0;
 for(const input of files){const bytes=typeof input==='string'?new TextEncoder().encode(input):input;if(!(bytes instanceof Uint8Array)||(size+=bytes.length)>2000000)throw Error('Trust certificates are limited to 2 MB total.');const text=binaryBytes(bytes);
  if(/-----BEGIN [^-]*PRIVATE KEY-----/.test(text))throw Error('Choose public CA certificates, without private keys.');
  if(text.includes('-----BEGIN')){const blocks=forge.pem.decode(text);if(!blocks.length)throw Error('No CA certificate was found.');if(certificates.length+blocks.length>20)throw Error('Choose up to 20 trusted CA certificates.');for(const block of blocks){if(!['CERTIFICATE','X509 CERTIFICATE'].includes(block.type))throw Error('Choose PEM certificate blocks only.');certificates.push(forge.pki.certificateFromAsn1(A.fromDer(block.body),true))}}
  else certificates.push(forge.pki.certificateFromAsn1(A.fromDer(forge.util.createBuffer(text)),true));
  if(certificates.length>20)throw Error('Choose up to 20 trusted CA certificates.');
 }
 if(!certificates.length)throw Error('Choose at least one trusted CA certificate.');
 for(const certificate of certificates)if(!certificate.getExtension({id:'2.5.29.19'})?.cA)throw Error('Trust anchors must be CA certificates.');return certificates;
}
function usages(certificate){const ext=certificate.getExtension({id:ekuOID});if(!ext)return null;const node=A.fromDer(ext.value);if(node.type!==A.Type.SEQUENCE||node.value.some(child=>child.type!==A.Type.OID))throw Error('Unsupported certificate extended-key usage.');return {critical:ext.critical===true,values:node.value.map(child=>A.derToOid(child.value))}}
export function trustTimestampCertificate(cms,anchors,time,accuracy=0){
 const leaf=cms.certificate,usage=usages(leaf);if(!usage?.critical||usage.values.length!==1||usage.values[0]!==timestampOID)throw Error('The TSA certificate must have critical, exclusive timestamping usage.');
 if(leaf.getExtension({id:'2.5.29.19'})?.cA)throw Error('The timestamp signer must use a dedicated end-entity certificate.');const leafKU=leaf.getExtension('keyUsage');if(leafKU&&!leafKU.digitalSignature&&!leafKU.nonRepudiation)throw Error('The TSA certificate does not allow signing.');
 const anchorIDs=new Set(anchors.map(certificateFingerprint)),pool=[...new Map([...cms.certificates,...anchors].map(cert=>[certificateFingerprint(cert),cert])).values()];if(pool.length>40)throw Error('The timestamp certificate chain is too large.');let attempts=0;
 function acceptable(path){
  const strong=new Set(['1.2.840.113549.1.1.11','1.2.840.113549.1.1.12','1.2.840.113549.1.1.13']);
  for(const [depth,cert]of path.entries()){
   if(!cert.publicKey.n||cert.publicKey.n.bitLength()<2048||cert.publicKey.n.bitLength()>8192)throw Error('Timestamp trust requires RSA certificates with 2,048–8,192 bit keys.');
   if(time.getTime()-accuracy<cert.validity.notBefore.getTime()||time.getTime()+accuracy>cert.validity.notAfter.getTime())throw Error('A TSA certificate is not valid throughout the claimed time interval.');
   if(!anchorIDs.has(certificateFingerprint(cert))&&!strong.has(cert.signatureOid))throw Error('The TSA chain requires SHA-256, SHA-384 or SHA-512 RSA certificate signatures.');
   for(const ext of cert.extensions){if(['2.5.29.30','2.5.29.36','2.5.29.54'].includes(ext.id)||ext.critical&&!['2.5.29.15','2.5.29.19',ekuOID].includes(ext.id))throw Error('The TSA chain contains an unsupported certificate constraint.');}
   const purpose=usages(cert);if(depth&&purpose&&!purpose.values.includes(timestampOID)&&!purpose.values.includes(anyEKU))throw Error('An issuing CA does not permit timestamping.');
   if(depth){const bc=cert.getExtension({id:'2.5.29.19'}),ku=cert.getExtension('keyUsage');if(!bc?.cA||ku&&!ku.keyCertSign||bc.pathLenConstraint!==undefined&&depth-1>bc.pathLenConstraint)throw Error('The TSA chain violates CA constraints.')}
  }
  const store=forge.pki.createCaStore(anchors);forge.pki.verifyCertificateChain(store,path,{validityCheckDate:time,verify(result,depth,chain){if(result===true)return true;if(result===forge.pki.certificateError.unsupported_certificate&&chain[depth].extensions.every(ext=>!ext.critical||['2.5.29.15','2.5.29.19',ekuOID].includes(ext.id)))return true;return result}});
  return {subject:String(leaf.subject.getField('CN')?.value||'Timestamp authority').slice(0,160),anchor:String(path.at(-1).subject.getField('CN')?.value||'Selected CA').slice(0,160),anchorFingerprint:certificateFingerprint(path.at(-1)),chainLength:path.length};
 }
 const errors=[];
 function walk(path){if(path.length>10)throw Error('The TSA chain exceeds ten certificates.');const cert=path.at(-1);if(anchorIDs.has(certificateFingerprint(cert))){try{return acceptable(path)}catch(error){errors.push(error.message);return null}}
  for(const parent of pool){if(++attempts>400)throw Error('The TSA chain exceeds the issuer-search limit.');const id=certificateFingerprint(parent);if(path.some(item=>certificateFingerprint(item)===id))continue;try{if(!cert.isIssuer(parent)||!parent.verify(cert))continue}catch{continue}const result=walk([...path,parent]);if(result)return result}return null;
 }
 const trusted=walk([leaf]);if(!trusted)throw Error(errors[0]||'The TSA signer does not chain to the selected CA certificates.');return trusted;
}
