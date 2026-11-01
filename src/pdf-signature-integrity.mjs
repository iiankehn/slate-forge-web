import forge from 'node-forge';
import {PDFName,PDFArray,PDFNumber,PDFString,PDFHexString} from 'pdf-lib';
import {pdfContentTokens} from './pdf-content-tokens.mjs';
const key=value=>PDFName.of(value),A=forge.asn1;
export function signatureRange(signature){
 const values=signature.lookupMaybe(key('ByteRange'),PDFArray);if(!values||values.size()!==4)throw Error('Only signatures with one excluded byte range are supported.');
 const range=Array.from({length:4},(_,i)=>values.lookup(i,PDFNumber).asNumber());if(range.some(value=>!Number.isSafeInteger(value)||value<0)||range[0]!==0||range[1]===0||range[2]<=range[1]||range[3]===0||range[2]-range[1]>1000000)throw Error('Invalid PDF signature byte range.');return range;
}
export function binaryBytes(bytes){let text='';for(let offset=0;offset<bytes.length;offset+=16384)text+=String.fromCharCode(...bytes.subarray(offset,offset+16384));return text}
const oid=node=>A.derToOid(node.value),der=node=>A.toDer(node).getBytes(),serial=value=>forge.util.bytesToHex(value).replace(/^(00)+/,'')||'00';
const hashes={'2.16.840.1.101.3.4.2.1':'sha256','2.16.840.1.101.3.4.2.2':'sha384','2.16.840.1.101.3.4.2.3':'sha512'},rsaHashes={'1.2.840.113549.1.1.11':'sha256','1.2.840.113549.1.1.12':'sha384','1.2.840.113549.1.1.13':'sha512'};
function digestRanges(bytes,range,algorithm){const digest=forge.md[algorithm].create();for(const [start,length]of [[0,range[1]],[range[2],range[3]]])for(let at=start;at<start+length;at+=32768)digest.update(binaryBytes(bytes.subarray(at,Math.min(start+length,at+32768))));return digest.digest().getBytes()}
export function verifyPDFSignatureIntegrity(bytes,signature){
 const range=signatureRange(signature),revisionEnd=range[2]+range[3];if(revisionEnd>bytes.length)throw Error('A PDF signature extends past its document revision.');
 const contents=signature.lookup(key('Contents'));if(!(contents instanceof PDFString||contents instanceof PDFHexString))throw Error('The PDF signature contents are unsupported.');
 const excluded=pdfContentTokens(binaryBytes(bytes.subarray(range[1],range[2])));if(excluded.length!==1||excluded[0].type!=='string')throw Error('The PDF signature excludes data outside its contents.');
 const stored=contents.asBytes();if(stored.length!==excluded[0].bytes.length||stored.some((byte,i)=>byte!==excluded[0].bytes[i]))throw Error('The PDF signature contents do not match its excluded byte range.');
 const buffer=forge.util.createBuffer(binaryBytes(stored)),content=A.fromDer(buffer,{strict:true,parseAllBytes:false});if(/[^\x00]/.test(buffer.bytes()))throw Error('Unexpected data follows the PDF signature container.');
 if(content.type!==A.Type.SEQUENCE||content.value.length!==2||oid(content.value[0])!==forge.pki.oids.signedData)throw Error('Only detached CMS signatures are supported.');
 const signed=content.value[1]?.value?.[0],parts=signed?.value;
 if(!parts||parts[2]?.type!==A.Type.SEQUENCE||parts[2].value.length!==1||oid(parts[2].value[0])!==forge.pki.oids.data)throw Error('Only detached CMS data signatures are supported.');
 const signers=parts.at(-1);if(signers?.type!==A.Type.SET||signers.value.length!==1)throw Error('Only one CMS signer per PDF signature is supported.');
 const capture={},errors=[];if(!A.validate(signers.value[0],forge.pkcs7.asn1.signerInfoValidator,capture,errors))throw Error('Unsupported CMS signer structure.');
 const algorithm=hashes[A.derToOid(capture.digestAlgorithm)],signatureAlgorithm=oid(capture.signatureAlgorithm[0]);if(!algorithm||signatureAlgorithm!==forge.pki.oids.rsaEncryption&&rsaHashes[signatureAlgorithm]!==algorithm)throw Error('Existing signatures require RSA with SHA-256, SHA-384 or SHA-512.');
 const certificates=parts.slice(3,-1).find(part=>part.tagClass===A.Class.CONTEXT_SPECIFIC&&part.type===0)?.value||[],matches=new Map();
 for(const node of certificates){try{const tbs=node.value[0],offset=tbs.value[0].tagClass===A.Class.CONTEXT_SPECIFIC?1:0;if(serial(tbs.value[offset].value)!==serial(capture.serial)||der(tbs.value[offset+2])!==der(capture.issuer))continue;matches.set(der(node),forge.pki.certificateFromAsn1(node))}catch{}}
 if(matches.size!==1)throw Error('The CMS signing certificate is missing or ambiguous.');const certificate=[...matches.values()][0];if(!certificate.publicKey.n||certificate.publicKey.n.bitLength()<1024||certificate.publicKey.n.bitLength()>8192)throw Error('Unsupported RSA signing key.');
 const documentDigest=digestRanges(bytes,range,algorithm);let signedDigest=documentDigest;
 if(capture.authenticatedAttributes){
  const attributes=new Map();for(const attribute of capture.authenticatedAttributes){if(attribute.type!==A.Type.SEQUENCE||attribute.value.length!==2||attribute.value[1].type!==A.Type.SET)throw Error('Invalid signed CMS attribute.');const id=oid(attribute.value[0]);if(attributes.has(id))throw Error('Duplicate signed CMS attributes.');attributes.set(id,attribute.value[1].value)}
  const digest=attributes.get(forge.pki.oids.messageDigest),type=attributes.get(forge.pki.oids.contentType);if(digest?.length!==1||digest[0].type!==A.Type.OCTETSTRING||digest[0].value!==documentDigest||type?.length!==1||oid(type[0])!==forge.pki.oids.data)throw Error('The signed PDF digest does not match its bytes.');
  const encoded=der(A.create(A.Class.UNIVERSAL,A.Type.SET,true,capture.authenticatedAttributes)),md=forge.md[algorithm].create();md.update(encoded);signedDigest=md.digest().getBytes();
 }
 if(!certificate.publicKey.verify(signedDigest,capture.signature))throw Error('The PDF signature integrity check failed.');
 return {revisionEnd,algorithm,subject:String(certificate.subject.getField('CN')?.value||'Unnamed signer').slice(0,160),range};
}
